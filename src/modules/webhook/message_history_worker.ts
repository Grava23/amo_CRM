import { logger } from "../../logger.js"
import { AmoClient } from "../../infra/amo/client.js"
import type { Integration } from "../../models/integration.js"
import type { WebhookRepo } from "./repo.js"
import { Message } from "../../models/messages.js"
import { Lead } from "../../models/leads.js"
import { withAmoTokenRefresh } from "../../infra/amo/with_token_refresh.js"
import { GetCallNotesResponse } from "../../infra/amo/response/notes.js"
import { Call } from "../../models/calls.js"

type EnqueueArgs = {
    repo: WebhookRepo
    integration: Integration
    conversationID: string
    limit?: number
}

class Semaphore {
    private active = 0
    private queue: Array<() => void> = []

    constructor(private readonly max: number) { }

    async acquire(): Promise<() => void> {
        if (this.active < this.max) {
            this.active++
            return () => this.release()
        }

        await new Promise<void>((resolve) => this.queue.push(resolve))
        this.active++
        return () => this.release()
    }

    private release() {
        this.active = Math.max(0, this.active - 1)
        const next = this.queue.shift()
        if (next) next()
    }
}

class MessageHistoryWorkerManager {
    private readonly perChatRunning = new Set<string>()
    private readonly perChatRerunRequested = new Set<string>()
    private readonly offsets = new Map<string, number>()
    private readonly offsetLoads = new Map<string, Promise<number>>()

    // Ограничиваем кол-во активных воркеров, чтобы не мешать другим задачам и запросам.
    private readonly semaphore = new Semaphore(3)

    constructor(private readonly amoClient: AmoClient) { }

    enqueue({ repo, integration, conversationID, limit = 50 }: EnqueueArgs) {
        if (this.perChatRunning.has(conversationID)) {
            this.perChatRerunRequested.add(conversationID)
            return
        }

        this.perChatRunning.add(conversationID)
        void this.runLoop({ repo, integration, conversationID, limit })
    }

    private async runLoop({ repo, integration, conversationID, limit }: Required<EnqueueArgs>) {
        const release = await this.semaphore.acquire()
        try {
            await this.collectAllAvailable({ repo, integration, conversationID, limit })
        } catch (error) {
            logger.error("MessageHistoryWorker - failed", { conversationID, error })
        } finally {
            release()
            this.perChatRunning.delete(conversationID)

            if (this.perChatRerunRequested.has(conversationID)) {
                this.perChatRerunRequested.delete(conversationID)
                this.enqueue({ repo, integration, conversationID, limit })
            }
        }
    }

    private async collectAllAvailable({ repo, integration, conversationID, limit }: Required<EnqueueArgs>) {
        let offset = await this.getOffset(repo, integration.scopeID, conversationID)

        while (true) {
            const resp = await this.amoClient.chat.getMessageHistory(integration.scopeID, conversationID, { offset, limit })
            const batch = resp?.messages ?? []

            if (batch.length === 0) {
                return
            }

            logger.info("MessageHistoryWorker - fetched messages", {
                conversationID,
                offset,
                count: batch.length,
            })

            for (const message of batch) {
                const messageModel: Message = {
                    id: message.message.id,
                    chat_id: conversationID,
                    type: message.message.type as Message["type"],
                    role: message.sender?.client_id ? "client" : "manager",
                    sent_at: new Date((message.msec_timestamp ?? (message.timestamp * 1000))),
                    text: message.message.text,
                    media: message.message.media,
                }

                try {
                    await repo.createMessage(messageModel)
                } catch (error) {
                    logger.error("MessageHistoryWorker - failed to create message", { conversationID, error })
                }
            }

            offset += batch.length
            this.offsets.set(conversationID, offset)
            await repo.setChatHistoryOffset(integration.scopeID, conversationID, offset)

            if (batch.length < limit) {
                break
            }
        }

        let lead: Lead = {
            id: 0,
            name: "",
            responsible_user_id: 0,
            responsible_user_name: null,
            pipeline_id: 0,
            status_id: 0,
        }
        try {
            lead = await repo.getLeadByConversationID(conversationID)
        } catch (error) {
            logger.error("MessageHistoryWorker - failed to get lead", { conversationID, error })
            return
        }

        let page = 1

        while (true) {

            let resp: GetCallNotesResponse
            try {
                resp = await withAmoTokenRefresh(
                    integration,
                    repo,
                    this.amoClient.auth,
                    (accessToken) => this.amoClient.notes.getNotesByEntityTypeAndID(integration.domain, accessToken, "leads", lead.id, {
                        page: page,
                        limit: 250,
                        filter: {
                            note_type: ["call_in", "call_out"],
                        }
                    })
                )
            } catch (error) {
                logger.error("MessageHistoryWorker - failed to get notes", { conversationID, error })
                continue
            }

            if (resp._embedded.notes.length === 0 || resp._links.next === undefined) {
                logger.warn("MessageHistoryWorker - no notes found", { conversationID, leadID: lead.id, page })
                break
            }

            logger.info("MessageHistoryWorker - fetched notes", { conversationID, leadID: lead.id, page, count: resp._embedded.notes.length })

            for (const note of resp._embedded.notes) {
                // call_in: params.call_responsible — уже имя (строка). call_out — id пользователя, имя через API.
                let call_responsible_name: string | null = null
                if (note.note_type === "call_in") {
                    call_responsible_name = note.params.call_responsible
                } else {
                    try {
                        const user = await withAmoTokenRefresh(
                            integration,
                            repo,
                            this.amoClient.auth,
                            (accessToken) => this.amoClient.users.getUserByID(
                                integration.domain,
                                accessToken,
                                note.params.call_responsible,
                                {},
                            ),
                        )
                        call_responsible_name = user.name ?? null
                    } catch (error) {
                        logger.warn("MessageHistoryWorker - get user for call_out failed", {
                            conversationID,
                            responsibleUserId: note.params.call_responsible,
                            error: error as Error,
                        })
                    }
                }

                const call: Call = {
                    id: note.id,
                    direction: note.note_type === "call_in" ? "in" : "out",
                    uuid: note.params.uniq,
                    duration: note.params.duration,
                    source: note.params.source,
                    link: note.params.link,
                    phone: note.params.phone,
                    call_responsible: note.params.call_responsible.toString(),
                    call_responsible_name,
                    timestamp: note.created_at,
                    lead_id: lead.id,
                }

                try {
                    await repo.upsertCall(call)
                } catch (error) {
                    logger.error("MessageHistoryWorker - failed to upsert call", { conversationID, error })
                    continue
                }
            }

            page++
        }
    }

    private async getOffset(repo: WebhookRepo, scopeID: string, conversationID: string) {
        const cached = this.offsets.get(conversationID)
        if (cached !== undefined) return cached

        const inflight = this.offsetLoads.get(conversationID)
        if (inflight) return await inflight

        const p = repo.getChatHistoryOffset(scopeID, conversationID)
            .then((offset) => {
                this.offsets.set(conversationID, offset)
                return offset
            })
            .finally(() => {
                this.offsetLoads.delete(conversationID)
            })

        this.offsetLoads.set(conversationID, p)
        return await p
    }
}

let singleton: MessageHistoryWorkerManager | null = null

export function getMessageHistoryWorkerManager(amoClient: AmoClient) {
    if (!singleton) {
        singleton = new MessageHistoryWorkerManager(amoClient)
    }
    return singleton
}

