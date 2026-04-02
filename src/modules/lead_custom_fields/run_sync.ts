import type { PrismaClient } from "../../generated/prisma/client.js"
import { LEAD_CUSTOM_FIELD_NAME_SET } from "./names.js"
import type { LeadCustomFieldSyncRow } from "./types.js"
import { syncLeadCustomFieldsInDb } from "./sync_db.js"

/** `rows === undefined` — не синхронизировать; иначе записать (пустой массив очистит поля по сделке). */
export async function runLeadCustomFieldsSyncIfConfigured(
    prisma: PrismaClient,
    leadId: number,
    rows: LeadCustomFieldSyncRow[] | undefined,
): Promise<void> {
    if (LEAD_CUSTOM_FIELD_NAME_SET.size === 0) return
    if (rows === undefined) return
    await syncLeadCustomFieldsInDb(prisma, leadId, rows)
}
