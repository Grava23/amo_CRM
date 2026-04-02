import { logger } from "../../logger.js"
import type { AmoClient } from "../../infra/amo/client.js"
import type { WebhookRepo } from "./repo.js"
import { getMessageHistoryWorkerManager } from "./message_history_worker.js"

type StartArgs = {
    repo: WebhookRepo
    amoClient: AmoClient
    intervalMs?: number
    batchSize?: number
}

export function startChatHistoryPolling({ repo, amoClient, intervalMs = 30_000, batchSize = 200 }: StartArgs) {
    const worker = getMessageHistoryWorkerManager(amoClient)

    const tick = async () => {
        try {
            const chats = await repo.listChatsForHistorySync(batchSize)
            await repo.markChatsPolled(chats.map((c) => c.id))

            // группируем по домену, чтобы не дергать интеграцию по одному чату
            const byDomain = new Map<string, string[]>()
            for (const c of chats) {
                const list = byDomain.get(c.integration_domain) ?? []
                list.push(c.conversation_id)
                byDomain.set(c.integration_domain, list)
            }

            for (const [domain, conversationIDs] of byDomain) {
                const integration = await repo.getIntegrationByDomain(domain)
                for (const conversationID of conversationIDs) {
                    worker.enqueue({ repo, integration, conversationID })
                }
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            logger.error("ChatHistoryPolling - tick failed", { message })
        }
    }

    // старт сразу и дальше по интервалу
    void tick()
    const timer = setInterval(() => void tick(), intervalMs)

    return () => clearInterval(timer)
}

