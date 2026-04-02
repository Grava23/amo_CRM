import { z } from "zod"

const getCustomFieldsParamsSchema = z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    types: z.array(z.enum(["text", "numeric", "checkbox", "select", "multiselect", "date", "url", "text_area", "radio_button", "streetaddress", "smart_address", "birthday", "legal_entity", "date_time", "price", "category", "items", "tracking_data", "linked_entity", "chained_list", "monetary", "file", "payer", "supplier"])).optional(),
})

export type GetCustomFieldsParams = z.infer<typeof getCustomFieldsParamsSchema>