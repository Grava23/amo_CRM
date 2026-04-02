import { z } from "zod"

/** Права на сущность: ключ — действие (view, edit, …), значение — код права (A, M, D, …). */
const entityRightsSchema = z.record(z.string(), z.string())

const statusRightsItemSchema = z.object({
    entity_type: z.string(),
    pipeline_id: z.number(),
    status_id: z.number(),
    rights: z.record(z.string(), z.string()),
})

const userRightsSchema = z.object({
    leads: entityRightsSchema,
    contacts: entityRightsSchema,
    companies: entityRightsSchema,
    tasks: entityRightsSchema,
    mail_access: z.boolean(),
    catalog_access: z.boolean(),
    is_admin: z.boolean(),
    is_free: z.boolean(),
    is_active: z.boolean(),
    group_id: z.number().nullable(),
    role_id: z.number().nullable(),
    status_rights: z.array(statusRightsItemSchema),
})

export const getUserByIDResponseSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    lang: z.enum(["ru", "en", "es"]),
    rights: userRightsSchema,
    _links: z.object({
        self: z.object({
            href: z.string().url(),
        }),
    }),
})

export type GetUserByIDResponse = z.infer<typeof getUserByIDResponseSchema>
