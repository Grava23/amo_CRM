import type { LeadCustomFieldSyncRow } from "./types.js"
import { isAllowedLeadCustomFieldKey } from "./match.js"

/** Элемент `custom_fields_values` из ответов Amo (getLead / getLeads). */
export type AmoLeadCustomFieldValueRow = {
    field_id: number
    field_name: string
    field_code?: string | undefined
    values: unknown
}

type WebhookField = {
    id: number
    name: string
    values: unknown
}

/** `undefined` — в payload не было полей, БД не трогаем. Иначе — отфильтрованные строки (в т.ч. []). */
export function rowsFromWebhookCustomFields(
    custom_fields: WebhookField[] | undefined,
): LeadCustomFieldSyncRow[] | undefined {
    if (custom_fields === undefined) return undefined
    return custom_fields
        .filter((f) => isAllowedLeadCustomFieldKey(f.name, null))
        .map((f) => ({
            amo_field_id: f.id,
            name: f.name.trim(),
            values: f.values,
        }))
}

/**
 * `undefined` — в ответе API не было `custom_fields_values`, БД не трогаем.
 * Массив (в т.ч. пустой) — синхронизируем отфильтрованный набор.
 */
export function rowsFromAmoApiCustomFieldsValues(
    custom_fields_values: readonly AmoLeadCustomFieldValueRow[] | undefined | null,
): LeadCustomFieldSyncRow[] | undefined {
    if (custom_fields_values === undefined || custom_fields_values === null) return undefined
    return custom_fields_values
        .filter((f) => isAllowedLeadCustomFieldKey(f.field_name, f.field_code))
        .map((f) => ({
            amo_field_id: f.field_id,
            name: f.field_name.trim(),
            values: f.values,
        }))
}
