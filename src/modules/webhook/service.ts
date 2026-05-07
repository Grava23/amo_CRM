import { AddContactWebhookBody, AddLeadWebhookBody, AddMessageWebhookBody, AddNoteWebhookBody, AddTalkWebhookBody, DeleteContactWebhookBody, DeleteLeadWebhookBody, RestoreLeadWebhookBody, UpdateContactWebhookBody, UpdateLeadWebhookBody } from "./schema.js";
import { WebhookRepo } from "./repo.js";
import { logger } from "../../logger.js";
import { AmoClient } from "../../infra/amo/client.js";
import { withAmoTokenRefresh } from "../../infra/amo/with_token_refresh.js";
import { Contact } from "../../models/contact.js";
import { Integration } from "../../models/integration.js";
import { GetTalkResponse } from "../../infra/amo/response/talks.js";
import { Chat } from "../../models/chat.js";
import { GetLeadResponse } from "../../infra/amo/response/leads.js";
import { Lead } from "../../models/leads.js";
import { GetContactResponse } from "../../infra/amo/response/contact.js";
import { getMessageHistoryWorkerManager } from "./message_history_worker.js";
import { rowsFromAmoApiCustomFieldsValues, rowsFromWebhookCustomFields } from "../lead_custom_fields/build_rows.js";
import { Message } from "../../models/messages.js";
import { Call } from "../../models/calls.js";
import { isPrismaNotFoundError } from "../../utils/prisma_not_found.js";

export class WebhookService {
    constructor(private repo: WebhookRepo, private amoClient: AmoClient) { }

    private async syncLeadCustomFieldsFromWebhook(
        leadId: number,
        custom_fields: { id: number; name: string; values: unknown }[] | undefined,
    ) {
        await this.repo.syncLeadCustomFieldsRows(leadId, rowsFromWebhookCustomFields(custom_fields))
    }

    async handleAddContactWebhook(body: AddContactWebhookBody) {
        for (const contact of body.contacts.add) {
            const contactModel: Contact = {
                id: parseInt(contact.id),
                name: contact.name,
                responsible_user_id: parseInt(contact.responsible_user_id),
                first_name: contact.name.split(" ")[0] ?? "",
                last_name: contact.name.split(" ")[1] ?? "",
            }

            try {
                await this.repo.createContact(contactModel)
            } catch (error) {
                logger.error("WebhookService - handleAddContactWebhook - Failed to create contact", { error })
                continue
            }
        }
    }

    async handleUpdateContactWebhook(body: UpdateContactWebhookBody) {
        for (const contact of body.contacts.update) {
            const contactModel: Contact = {
                id: parseInt(contact.id),
                name: contact.name,
                responsible_user_id: parseInt(contact.responsible_user_id),
                first_name: contact.name.split(" ")[0] ?? "",
                last_name: contact.name.split(" ")[1] ?? "",
            }

            try {
                await this.repo.updateContact(contactModel)
            } catch (error) {
                logger.error("WebhookService - handleUpdateContactWebhook - Failed to update contact", { error })
                continue
            }
        }
    }

    async handleDeleteContactWebhook(body: DeleteContactWebhookBody) {
        for (const contact of body.contacts.delete) {
            try {
                await this.repo.deleteContact(parseInt(contact.id))
            } catch (error) {
                logger.error("WebhookService - handleDeleteContactWebhook - Failed to delete contact", { error })
                continue
            }
        }
    }

    async handleRestoreContactWebhook(body: DeleteContactWebhookBody) {
        for (const contact of body.contacts.delete) {
            try {
                await this.repo.restoreContact(parseInt(contact.id))
            } catch (error) {
                logger.error("WebhookService - handleRestoreContactWebhook - Failed to restore contact", { error })
                continue
            }
        }
    }

    async handleAddTalkWebhook(body: AddTalkWebhookBody) {
        logger.debug("WebhookService - handleAddTalkWebhook - received request", { body })

        const subdomain = body.account.subdomain + ".amocrm.ru"

        let integration: Integration | null = null
        try {
            integration = await this.repo.getIntegrationByDomain(subdomain)
        } catch (error) {
            logger.error("WebhookService - handleAddTalkWebhook - Failed to get integration", { error })
            throw new Error("WebhookService - handleAddTalkWebhook - Failed to get integration")
        }

        for (const talk of body.talk.add) {
            let talkResp: GetTalkResponse | null = null
            try {
                talkResp = await withAmoTokenRefresh(
                    integration,
                    this.repo,
                    this.amoClient.auth,
                    (accessToken) => this.amoClient.talks.getTalk(subdomain, accessToken, parseInt(talk.talk_id))
                )
            } catch (error) {
                logger.error("WebhookService - handleAddTalkWebhook - Failed to get talk", { error })
                continue
            }

            if (talkResp.entity_type != "lead" || talkResp.entity_id === null) {
                logger.warn("WebhookService - handleAddTalkWebhook - Talk entity type is not lead", { talk_id: talk.talk_id })
                continue
            }

            // создаем сделку и контакт если они не существуют

            let leadResp: GetLeadResponse | null = null
            try {
                leadResp = await withAmoTokenRefresh(
                    integration,
                    this.repo,
                    this.amoClient.auth,
                    (accessToken) => this.amoClient.leads.getLead(subdomain, accessToken, talkResp!.entity_id!, {})
                )
            } catch (error) {
                logger.error("WebhookService - handleAddTalkWebhook - Failed to get lead", { error })
                continue
            }

            let responsible_user_name: string | null = null
            try {
                const user = await withAmoTokenRefresh(
                    integration,
                    this.repo,
                    this.amoClient.auth,
                    (accessToken) => this.amoClient.users.getUserByID(subdomain, accessToken, leadResp!.responsible_user_id, {}),
                )
                responsible_user_name = user.name ?? null
            } catch (error) {
                logger.warn("WebhookService - handleAddTalkWebhook - get user failed", { subdomain, responsibleUserId: leadResp!.responsible_user_id, error: error as Error })
            }

            const leadModel: Lead = {
                id: leadResp!.id,
                name: leadResp!.name,
                responsible_user_id: leadResp!.responsible_user_id,
                responsible_user_name,
                pipeline_id: leadResp!.pipeline_id,
                status_id: leadResp!.status_id,
            }

            try {
                await this.repo.upsertLead(leadModel)
            } catch (error) {
                logger.error("WebhookService - handleAddTalkWebhook - Failed to upsert lead", { error })
                continue
            }

            try {
                await this.repo.syncLeadCustomFieldsRows(
                    leadModel.id,
                    rowsFromAmoApiCustomFieldsValues(leadResp!.custom_fields_values),
                )
            } catch (error) {
                logger.error("WebhookService - handleAddTalkWebhook - Failed to sync lead custom fields", { error })
            }

            let contactResp: GetContactResponse | null = null
            try {
                contactResp = await withAmoTokenRefresh(
                    integration,
                    this.repo,
                    this.amoClient.auth,
                    (accessToken) => this.amoClient.contact.getContact(subdomain, accessToken, talkResp!.contact_id!, {})
                )
            } catch (error) {
                logger.error("WebhookService - handleAddTalkWebhook - Failed to get contact", { error })
                continue
            }

            const contactModel: Contact = {
                id: contactResp!.id,
                name: contactResp!.name,
                responsible_user_id: contactResp!.responsible_user_id,
                first_name: contactResp!.first_name,
                last_name: contactResp!.last_name,
            }

            try {
                await this.repo.upsertContact(contactModel)
            } catch (error) {
                logger.error("WebhookService - handleAddTalkWebhook - Failed to upsert contact", { error })
                continue
            }

            const chatModel: Chat = {
                // В остальных вебхуках (messages/add) message.chat_id ссылается на chat.id.
                // Поэтому id чата должен быть именно amojo chat_id (uuid), а не talk_id.
                id: talkResp.chat_id,
                origin: talkResp.origin,
                talk_id: talkResp.talk_id,
                conversation_id: talkResp.chat_id,
                integration_domain: integration.domain,
                lead_id: talkResp.entity_id,
                contact_id: talkResp.contact_id,
            }

            try {
                await this.repo.createChat(chatModel)
            } catch (error) {
                logger.error("WebhookService - handleAddTalkWebhook - Failed to create chat", { error })
                continue
            }

            getMessageHistoryWorkerManager(this.amoClient).enqueue({
                repo: this.repo,
                integration,
                conversationID: talkResp.chat_id,
            })
        }
    }

    async handleAddLeadWebhook(body: AddLeadWebhookBody) {
        const domain = `${body.account.subdomain}.amocrm.ru`
        let integration: Integration | null = null
        try {
            integration = await this.repo.getIntegrationByDomain(domain)
        } catch (error) {
            logger.error("WebhookService - handleAddLeadWebhook - Failed to get integration", { error })
        }

        for (const lead of body.leads.add) {
            let responsible_user_name: string | null = null
            if (integration) {
                try {
                    const user = await withAmoTokenRefresh(
                        integration,
                        this.repo,
                        this.amoClient.auth,
                        (accessToken) => this.amoClient.users.getUserByID(domain, accessToken, parseInt(lead.responsible_user_id), {}),
                    )
                    responsible_user_name = user.name ?? null
                } catch (error) {
                    logger.warn("WebhookService - handleAddLeadWebhook - get user failed", { domain, error: error as Error })
                }
            }

            const leadModel: Lead = {
                id: parseInt(lead.id),
                name: lead.name,
                responsible_user_id: parseInt(lead.responsible_user_id),
                responsible_user_name,
                pipeline_id: parseInt(lead.pipeline_id),
                status_id: parseInt(lead.status_id),
            }

            try {
                await this.repo.upsertLead(leadModel)
            } catch (error) {
                logger.error("WebhookService - handleAddLeadWebhook - Failed to upsert lead", { error })
                continue
            }

            try {
                await this.syncLeadCustomFieldsFromWebhook(leadModel.id, lead.custom_fields)
            } catch (error) {
                logger.error("WebhookService - handleAddLeadWebhook - Failed to sync lead custom fields", { error })
            }
        }
    }

    async handleUpdateLeadWebhook(body: UpdateLeadWebhookBody) {
        const domain = `${body.account.subdomain}.amocrm.ru`
        let integration: Integration | null = null
        try {
            integration = await this.repo.getIntegrationByDomain(domain)
        } catch (error) {
            logger.error("WebhookService - handleUpdateLeadWebhook - Failed to get integration", { error })
        }

        for (const lead of body.leads.update) {
            let responsible_user_name: string | null = null
            if (integration) {
                try {
                    const user = await withAmoTokenRefresh(
                        integration,
                        this.repo,
                        this.amoClient.auth,
                        (accessToken) => this.amoClient.users.getUserByID(domain, accessToken, parseInt(lead.responsible_user_id), {}),
                    )
                    responsible_user_name = user.name ?? null
                } catch (error) {
                    logger.warn("WebhookService - handleUpdateLeadWebhook - get user failed", { domain, error: error as Error })
                }
            }

            const leadModel: Lead = {
                id: parseInt(lead.id),
                name: lead.name,
                responsible_user_id: parseInt(lead.responsible_user_id),
                responsible_user_name,
                pipeline_id: parseInt(lead.pipeline_id),
                status_id: parseInt(lead.status_id),
            }

            try {
                await this.repo.upsertLead(leadModel)
            } catch (error) {
                logger.error("WebhookService - handleUpdateLeadWebhook - Failed to upsert lead", { error })
                continue
            }

            try {
                await this.syncLeadCustomFieldsFromWebhook(leadModel.id, lead.custom_fields)
            } catch (error) {
                logger.error("WebhookService - handleUpdateLeadWebhook - Failed to sync lead custom fields", { error })
            }
        }
    }

    async handleDeleteLeadWebhook(body: DeleteLeadWebhookBody) {
        for (const lead of body.leads.delete) {
            try {
                await this.repo.deleteLead(parseInt(lead.id), parseInt(lead.status_id), parseInt(lead.pipeline_id))
            } catch (error) {
                logger.error("WebhookService - handleDeleteLeadWebhook - Failed to delete lead", { error })
                continue
            }
        }
    }

    async handleRestoreLeadWebhook(body: RestoreLeadWebhookBody) {
        const domain = `${body.account.subdomain}.amocrm.ru`
        let integration: Integration | null = null
        try {
            integration = await this.repo.getIntegrationByDomain(domain)
        } catch (error) {
            logger.error("WebhookService - handleRestoreLeadWebhook - Failed to get integration", { error })
        }

        for (const lead of body.leads.restore) {
            const leadId = parseInt(lead.id)
            try {
                await this.repo.restoreLead(leadId, parseInt(lead.status_id), parseInt(lead.pipeline_id))
            } catch (error) {
                logger.error("WebhookService - handleRestoreLeadWebhook - Failed to restore lead", { error })
                continue
            }

            let responsible_user_name: string | null = null
            if (integration) {
                try {
                    const user = await withAmoTokenRefresh(
                        integration,
                        this.repo,
                        this.amoClient.auth,
                        (accessToken) => this.amoClient.users.getUserByID(domain, accessToken, parseInt(lead.responsible_user_id), {}),
                    )
                    responsible_user_name = user.name ?? null
                } catch (error) {
                    logger.warn("WebhookService - handleRestoreLeadWebhook - get user failed", { domain, error: error as Error })
                }
            }

            const leadModel: Lead = {
                id: leadId,
                name: lead.name,
                responsible_user_id: parseInt(lead.responsible_user_id),
                responsible_user_name,
                pipeline_id: parseInt(lead.pipeline_id),
                status_id: parseInt(lead.status_id),
            }

            try {
                await this.repo.upsertLead(leadModel)
            } catch (error) {
                logger.error("WebhookService - handleRestoreLeadWebhook - Failed to upsert lead after restore", { error })
            }

            try {
                await this.syncLeadCustomFieldsFromWebhook(leadId, lead.custom_fields)
            } catch (error) {
                logger.error("WebhookService - handleRestoreLeadWebhook - Failed to sync lead custom fields", { error })
            }
        }
    }

    async handleAddMessageWebhook(body: AddMessageWebhookBody) {
        for (const message of body.message.add) {
            let messageType: "text" | "file" | "video" | "picture" | "voice" | "audio" | "sticker"
            let messageText: string | undefined = undefined
            let messageMedia: string | undefined = undefined
            if (message.attachment) {
                messageType = message.attachment.type
                messageMedia = message.attachment.link
            } else {
                messageType = "text"
                messageText = message.text
            }

            try {
                await this.repo.getChatByID(message.chat_id)
            } catch (error) {
                if (isPrismaNotFoundError(error)) {
                    logger.warn("WebhookService - handleAddMessageWebhook - Chat not found", { chatID: message.chat_id })

                    const subdomain = `${body.account.subdomain}.amocrm.ru`

                    let integration: Integration | null = null
                    try {
                        integration = await this.repo.getIntegrationByDomain(subdomain)
                    } catch (error) {
                        logger.error("WebhookService - handleAddMessageWebhook - Failed to get integration", { error })
                        continue
                    }

                    let talkResp: GetTalkResponse | null = null
                    try {
                        talkResp = await withAmoTokenRefresh(
                            integration,
                            this.repo,
                            this.amoClient.auth,
                            (accessToken) => this.amoClient.talks.getTalk(subdomain, accessToken, parseInt(message.talk_id))
                        )
                    } catch (error) {
                        logger.error("WebhookService - handleAddMessageWebhook - Failed to get talk", { error })
                        continue
                    }

                    if (talkResp.entity_type != "lead" || talkResp.entity_id === null) {
                        logger.warn("WebhookService - handleAddMessageWebhook - Talk entity type is not lead", { talk_id: message.talk_id })
                        continue
                    }

                    const chat: Chat = {
                        id: message.chat_id,
                        talk_id: parseInt(message.talk_id),
                        origin: talkResp.origin,
                        conversation_id: message.chat_id,
                        integration_domain: integration.domain,
                        lead_id: talkResp.entity_id,
                        contact_id: talkResp.contact_id,
                    }

                    try {
                        await this.repo.createChat(chat)
                    } catch (error) {
                        logger.error("WebhookService - handleAddMessageWebhook - Failed to create chat", { error })
                        continue
                    }
                } else {
                    logger.error("WebhookService - handleAddMessageWebhook - Failed to get chat", { error })
                    continue
                }
            }

            const messageModel: Message = {
                id: message.id,
                type: messageType,
                role: "client",
                sent_at: (() => {
                    const seconds = Number(message.created_at)
                    if (!Number.isFinite(seconds)) {
                        return new Date()
                    }
                    return new Date(seconds * 1000)
                })(),
                chat_id: message.chat_id,
                text: messageText,
                media: messageMedia,
            }

            try {
                await this.repo.createMessage(messageModel)
            } catch (error) {
                const err = error as Error
                logger.error("WebhookService - handleAddMessageWebhook - Failed to create message", {
                    error: err,
                    errorMessage: err?.message,
                    messageID: message.id,
                    chatID: message.chat_id,
                })
                continue
            }
        }
    }

    async handleAddNoteWebhook(body: AddNoteWebhookBody) {
        for (const note of body.leads.note) {
            //* call_in - 10, call_out - 11
            if (note.type != "10" && note.type != "11") {
                continue
            }

            if (!note.note.text) {
                continue
            }
            type CallTextPayload = {
                PHONE?: string
                UNIQ?: string
                DURATION?: number
                SRC?: string
                LINK?: string
                call_status?: number
            }

            const callTextPayload: CallTextPayload = JSON.parse(note.note.text)

            if (!note.note.element_id) {
                continue
            }

            if (!callTextPayload.UNIQ || !callTextPayload.LINK || !callTextPayload.PHONE) {
                continue
            }

            type CallMetadata = {
                event_source: {
                    id?: number
                    author_name?: string
                    type?: number
                }
            }

            const callMetadata: CallMetadata = JSON.parse(note.note.metadata ?? "{}")

            const callModel: Call = {
                uuid: callTextPayload.UNIQ,
                direction: note.type == "10" ? "in" : "out",
                duration: callTextPayload.DURATION ?? 0,
                source: callTextPayload.SRC ?? "",
                link: callTextPayload.LINK,
                phone: callTextPayload.PHONE,
                call_responsible: note.note.created_by ?? "",
                call_responsible_name: callMetadata.event_source.author_name ?? null,
                timestamp: new Date(note.note.created_at!).getTime(),
                lead_id: parseInt(note.note.element_id),
            }

            try {
                await this.repo.upsertCall(callModel)
            } catch (error) {
                logger.error("WebhookService - handleAddNoteWebhook - Failed to upsert call", { error })
                continue
            }
        }
    }
}