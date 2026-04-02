import { Prisma, type PrismaClient } from "../../generated/prisma/client.js"
import type { LeadCustomFieldSyncRow } from "./types.js"

/**
 * Upsert по (lead_id, amo_field_id), лишние строки по сделке удаляются.
 * Пустой `rows` — удалить все сохранённые доп. поля по этой сделке.
 */
export async function syncLeadCustomFieldsInDb(
    prisma: PrismaClient,
    leadId: number,
    rows: LeadCustomFieldSyncRow[],
): Promise<void> {
    await prisma.$transaction(async (tx) => {
        if (rows.length === 0) {
            await tx.lead_custom_fields.deleteMany({ where: { lead_id: leadId } })
            return
        }
        const ids = rows.map((f) => f.amo_field_id)
        await tx.lead_custom_fields.deleteMany({
            where: { lead_id: leadId, amo_field_id: { notIn: ids } },
        })
        for (const f of rows) {
            const valueJson = f.values as Prisma.InputJsonValue
            await tx.lead_custom_fields.upsert({
                where: {
                    lead_id_amo_field_id: { lead_id: leadId, amo_field_id: f.amo_field_id },
                },
                create: {
                    lead_id: leadId,
                    amo_field_id: f.amo_field_id,
                    name: f.name,
                    value: valueJson,
                },
                update: {
                    name: f.name,
                    value: valueJson,
                },
            })
        }
    })
}
