/**
 * Поля сделки Amo, которые сохраняем в БД: строка должна совпадать с `name` из вебхука
 * или с `field_name` / `field_code` из API (после trim).
 * Пока список пуст — синхронизация не выполняется.
 */
export const LEAD_CUSTOM_FIELD_NAMES_TO_SYNC: readonly string[] = [
    "utm_content",
    "utm_medium",
    "utm_campaign",
    "utm_source",
    "utm_term",
    "utm_referrer",
]

export const LEAD_CUSTOM_FIELD_NAME_SET = new Set(
    LEAD_CUSTOM_FIELD_NAMES_TO_SYNC.map((n) => n.trim()).filter(Boolean),
)
