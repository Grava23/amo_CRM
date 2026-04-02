import { LEAD_CUSTOM_FIELD_NAME_SET } from "./names.js"

/** Совпадение с whitelist по имени и/или коду поля Amo. */
export function isAllowedLeadCustomFieldKey(fieldName: string, fieldCode?: string | null): boolean {
    if (LEAD_CUSTOM_FIELD_NAME_SET.size === 0) return false
    if (LEAD_CUSTOM_FIELD_NAME_SET.has(fieldName.trim())) return true
    if (fieldCode != null && fieldCode !== "" && LEAD_CUSTOM_FIELD_NAME_SET.has(fieldCode.trim())) return true
    return false
}
