import { PrismaClient } from "../../generated/prisma/client.js";
import type { LeadCustomFieldSyncRow } from "../lead_custom_fields/types.js";
import { runLeadCustomFieldsSyncIfConfigured } from "../lead_custom_fields/run_sync.js";
import { Contact } from "../../models/contact.js";
import { Integration } from "../../models/integration.js";
import { Message } from "../../models/messages.js";
import { Chat } from "../../models/chat.js";
import { Lead } from "../../models/leads.js";
import { Call } from "../../models/calls.js";

export class WebhookRepo {
    constructor(private prisma: PrismaClient) { }

    async getChatHistoryOffset(scopeID: string, conversationID: string): Promise<number> {
        const prismaAny = this.prisma as any
        const row = await prismaAny.chat_history_offsets.findUnique({
            where: {
                scope_id_conversation_id: {
                    scope_id: scopeID,
                    conversation_id: conversationID,
                },
            },
        })

        return row?.offset ?? 0
    }

    async setChatHistoryOffset(scopeID: string, conversationID: string, offset: number): Promise<void> {
        const prismaAny = this.prisma as any
        await prismaAny.chat_history_offsets.upsert({
            where: {
                scope_id_conversation_id: {
                    scope_id: scopeID,
                    conversation_id: conversationID,
                },
            },
            create: {
                scope_id: scopeID,
                conversation_id: conversationID,
                offset,
            },
            update: {
                offset,
            },
        })
    }

    async createMessage(message: Message) {
        return await this.prisma.messages.create({
            data: {
                id: message.id,
                type: message.type,
                text: message.text ?? null,
                media: message.media ?? null,
                role: message.role,
                sent_at: message.sent_at,
                chat: { connect: { id: message.chat_id } },
            },
        })
    }

    async getIntegrationByScopeID(scope_id: string): Promise<Integration> {
        const row = await this.prisma.integrations.findFirstOrThrow({
            where: {
                scope_id,
                deleted_at: null,
                active: true,
            },
        });

        return {
            domain: row.domain,
            accessToken: row.access_token,
            refreshToken: row.refresh_token,
            amojoID: row.amojo_id,
            scopeID: row.scope_id,
            active: row.active,
        }
    }

    async getIntegrationByDomain(domain: string): Promise<Integration> {
        const row = await this.prisma.integrations.findUniqueOrThrow({
            where: {
                domain,
                deleted_at: null,
            },
        })

        return {
            domain: row.domain,
            accessToken: row.access_token,
            refreshToken: row.refresh_token,
            amojoID: row.amojo_id,
            scopeID: row.scope_id,
            active: row.active,
        }
    }

    async updateIntegrationTokens(domain: string, accessToken: string, refreshToken: string) {
        return await this.prisma.integrations.update({
            where: {
                domain,
                deleted_at: null,
            },
            data: {
                access_token: accessToken,
                refresh_token: refreshToken,
            },
        })
    }

    async createContact(contact: Contact) {
        return await this.prisma.contacts.create({
            data: {
                id: contact.id,
                name: contact.name,
                first_name: contact.first_name,
                last_name: contact.last_name,
                responsible_user_id: contact.responsible_user_id,
            },
        })
    }

    async updateContact(contact: Contact) {
        return await this.prisma.contacts.update({
            where: { id: contact.id },
            data: {
                name: contact.name,
                first_name: contact.first_name,
                last_name: contact.last_name,
                responsible_user_id: contact.responsible_user_id,
            },
        })
    }

    async deleteContact(id: number) {
        return await this.prisma.contacts.update({
            where: { id },
            data: {
                deleted_at: new Date(),
            },
        })
    }

    async restoreContact(id: number) {
        return await this.prisma.contacts.update({
            where: { id },
            data: {
                deleted_at: null,
            },
        })
    }

    async createChat(chat: Chat) {
        const prismaAny = this.prisma as any
        // Идемпотентность: addTalk/addMessage могут прийти в любом порядке,
        // а также повторяться. Upsert предотвращает падение на required relation.
        return await prismaAny.chats.upsert({
            where: { id: chat.id },
            create: {
                id: chat.id,
                talk_id: chat.talk_id,
                origin: chat.origin,
                conversation_id: chat.conversation_id,
                integration: { connect: { domain: chat.integration_domain } },
                lead: { connect: { id: chat.lead_id } },
                contact: { connect: { id: chat.contact_id } },
            },
            update: {
                talk_id: chat.talk_id,
                origin: chat.origin,
                conversation_id: chat.conversation_id,
                integration: { connect: { domain: chat.integration_domain } },
                lead: { connect: { id: chat.lead_id } },
                contact: { connect: { id: chat.contact_id } },
            },
        })
    }

    async listChatsForHistorySync(take = 200): Promise<Array<{ id: string, conversation_id: string, integration_domain: string }>> {
        const prismaAny = this.prisma as any
        const rows = await prismaAny.chats.findMany({
            where: { deleted_at: null },
            select: { id: true, conversation_id: true, integration_domain: true },
            // round-robin: сначала те, кого давно/никогда не опрашивали
            orderBy: [
                { last_polled_at: "asc" },
                { updated_at: "desc" },
            ],
            take,
        })

        return rows
    }

    async markChatsPolled(chatIDs: string[]): Promise<void> {
        if (chatIDs.length === 0) return
        const prismaAny = this.prisma as any
        await prismaAny.chats.updateMany({
            where: { id: { in: chatIDs } },
            data: { last_polled_at: new Date() },
        })
    }

    async upsertLead(lead: Lead) {
        return await this.prisma.leads.upsert({
            where: { id: lead.id },
            update: {
                name: lead.name,
                responsible_user_id: lead.responsible_user_id,
                responsible_user_name: lead.responsible_user_name,
                pipeline_id: lead.pipeline_id,
                status_id: lead.status_id,
            },
            create: {
                id: lead.id,
                name: lead.name,
                responsible_user_id: lead.responsible_user_id,
                responsible_user_name: lead.responsible_user_name,
                pipeline_id: lead.pipeline_id,
                status_id: lead.status_id,
            },
        })
    }

    async syncLeadCustomFieldsRows(leadId: number, rows: LeadCustomFieldSyncRow[] | undefined): Promise<void> {
        await runLeadCustomFieldsSyncIfConfigured(this.prisma, leadId, rows)
    }

    async upsertContact(contact: Contact) {
        return await this.prisma.contacts.upsert({
            where: { id: contact.id },
            update: {
                name: contact.name,
                first_name: contact.first_name,
                last_name: contact.last_name,
                responsible_user_id: contact.responsible_user_id,
            },
            create: {
                id: contact.id,
                name: contact.name,
                first_name: contact.first_name,
                last_name: contact.last_name,
                responsible_user_id: contact.responsible_user_id,
            },
        })
    }

    async upsertCall(call: Call) {
        return await this.prisma.calls.upsert({
            where: { uuid: call.uuid },
            update: {
                direction: call.direction,
                duration: call.duration,
                source: call.source,
                link: call.link,
                phone: call.phone,
                call_responsible: call.call_responsible,
                call_responsible_name: call.call_responsible_name,
                timestamp: call.timestamp,
                lead: { connect: { id: call.lead_id } },
            },
            create: {
                uuid: call.uuid,
                direction: call.direction,
                duration: call.duration,
                source: call.source,
                link: call.link,
                phone: call.phone,
                call_responsible: call.call_responsible,
                call_responsible_name: call.call_responsible_name,
                timestamp: call.timestamp,
                lead: { connect: { id: call.lead_id } },
            },
        })
    }

    async deleteLead(id: number, status_id: number, pipeline_id: number) {
        return await this.prisma.leads.update({
            where: { id },
            data: {
                deleted_at: new Date(),
                status_id,
                pipeline_id,
            },
        })
    }

    async restoreLead(id: number, status_id: number, pipeline_id: number) {
        return await this.prisma.leads.update({
            where: { id },
            data: {
                deleted_at: null,
                status_id,
                pipeline_id,
            },
        })
    }

    async getChatByID(id: string): Promise<Chat> {
        return await this.prisma.chats.findUniqueOrThrow({
            where: { id },
        })
    }
}
