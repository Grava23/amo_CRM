import { z } from "zod"

const getLeadsParamsSchema = z.object({
    with: z.array(z.enum(["catalog_elements", "is_price_modified_by_robot", "loss_reason", "contacts", "only_deleted", "source_id", "source"])).optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
    query: z.string().or(z.number()).optional(),
})

export type GetLeadsParams = z.infer<typeof getLeadsParamsSchema>

const getLeadParamsSchema = z.object({
    with: z.array(z.enum(["catalog_elements", "is_price_modified_by_robot", "loss_reason", "contacts", "only_deleted", "source_id", "source"])).optional(),
})

export type GetLeadParams = z.infer<typeof getLeadParamsSchema>