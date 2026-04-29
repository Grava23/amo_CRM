import type { PrismaClient } from "../../generated/prisma/client.js"

/** Все неудалённые сделки и по каждой — полные связанные данные из БД (одним JSON). */
export type OutboundPayload = {
    sent_at: string
    leads: OutboundLeadBundle[]
}

/** Одна сделка и всё, что к ней относится (звонки только с `lead_id` этой сделки). */
export type OutboundLeadBundle = {
    lead: {
        id: number
        name: string
        responsible_user_id: number
        responsible_user_name: string | null
        pipeline_id: number
        status_id: number
        created_at: string
        updated_at: string
    }
    custom_fields: Array<{
        amo_field_id: number
        name: string
        value: unknown
    }>
    chat: null | {
        id: string
        talk_id: number
        origin: string
        conversation_id: string
        integration_domain: string
        last_polled_at: string | null
        created_at: string
        updated_at: string
    }
    contact: null | {
        id: number
        name: string
        first_name: string
        last_name: string | null
        responsible_user_id: number | null
        created_at: string
        updated_at: string
    }
    /** Все звонки по этой сделке (`calls.lead_id = lead.id`) */
    calls: Array<{
        id: number
        lead_id: number
        direction: string
        uuid: string
        duration: number
        source: string
        link: string
        phone: string
        call_responsible: string
        call_responsible_name: string | null
        /** Unix sec из Amo */
        timestamp: number
        at: string
        created_at: string
        updated_at: string
    }>
    /** Сообщения чата этой сделки (если чат есть) */
    messages: Array<{
        id: string
        chat_id: string
        type: string
        text: string | null
        media: string | null
        role: string
        sent_at: string
        created_at: string
        updated_at: string
        /** Дублируем origin чата как «канал» */
        channel: string | null
    }>
}

function iso(d: Date): string {
    return d.toISOString()
}

function unixToIso(ts: number): string {
    return new Date(ts * 1000).toISOString()
}

export async function buildOutboundPayload(prisma: PrismaClient): Promise<OutboundPayload> {
    const rows = await prisma.leads.findMany({
        where: { deleted_at: null },
        orderBy: { id: "asc" },
        include: {
            custom_fields: true,
            calls: {
                where: { deleted_at: null },
                orderBy: { timestamp: "asc" },
            },
            chat: {
                where: { deleted_at: null },
                include: {
                    contact: true,
                    messages: {
                        where: { deleted_at: null },
                        orderBy: { sent_at: "asc" },
                    },
                },
            },
        },
    })

    const leads: OutboundLeadBundle[] = rows.map((row) => {
        const ch = row.chat
        const channel = ch?.origin ?? null

        return {
            lead: {
                id: row.id,
                name: row.name,
                responsible_user_id: row.responsible_user_id,
                responsible_user_name: row.responsible_user_name,
                pipeline_id: row.pipeline_id,
                status_id: row.status_id,
                created_at: iso(row.created_at),
                updated_at: iso(row.updated_at),
            },
            custom_fields: row.custom_fields.map((f) => ({
                amo_field_id: f.amo_field_id,
                name: f.name,
                value: f.value,
            })),
            chat: ch
                ? {
                    id: ch.id,
                    talk_id: ch.talk_id,
                    origin: ch.origin,
                    conversation_id: ch.conversation_id,
                    integration_domain: ch.integration_domain,
                    last_polled_at: ch.last_polled_at ? iso(ch.last_polled_at) : null,
                    created_at: iso(ch.created_at),
                    updated_at: iso(ch.updated_at),
                }
                : null,
            contact: ch?.contact
                ? {
                    id: ch.contact.id,
                    name: ch.contact.name,
                    first_name: ch.contact.first_name,
                    last_name: ch.contact.last_name ?? null,
                    responsible_user_id: ch.contact.responsible_user_id,
                    created_at: iso(ch.contact.created_at),
                    updated_at: iso(ch.contact.updated_at),
                }
                : null,
            calls: row.calls.map((c) => ({
                id: c.id,
                lead_id: c.lead_id,
                direction: c.direction,
                uuid: c.uuid,
                duration: c.duration,
                source: c.source,
                link: c.link,
                phone: c.phone,
                call_responsible: c.call_responsible,
                call_responsible_name: c.call_responsible_name,
                timestamp: c.timestamp,
                at: unixToIso(c.timestamp),
                created_at: iso(c.created_at),
                updated_at: iso(c.updated_at),
            })),
            messages: (ch?.messages ?? []).map((m) => ({
                id: m.id,
                chat_id: m.chat_id,
                type: m.type,
                text: m.text,
                media: m.media,
                role: m.role,
                sent_at: iso(m.sent_at),
                created_at: iso(m.created_at),
                updated_at: iso(m.updated_at),
                channel,
            })),
        }
    })

    return { sent_at: new Date().toISOString(), leads }
}
