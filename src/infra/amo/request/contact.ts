import { z } from "zod"

export const getContactListParamsSchema = z.object({
    with: z.array(z.enum(["leads", "catalog_elements", "customers"])).optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
    query: z.string().or(z.number()).optional(),
})

export type GetContactListParams = z.infer<typeof getContactListParamsSchema>

const getContactParamsSchema = z.object({
    with: z.array(z.enum(["leads", "catalog_elements", "customers"])).optional(),
})

export type GetContactParams = z.infer<typeof getContactParamsSchema>