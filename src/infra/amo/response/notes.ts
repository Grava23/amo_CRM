import { z } from "zod"

const hrefLinkSchema = z.object({
    href: z.string(),
})

/**
 * params для note_type === "call_in".
 * `call_responsible` — уже ФИО менеджера (строка), отдельный запрос пользователя не нужен.
 */
const callInParamsSchema = z.object({
    uniq: z.string(),
    duration: z.number().int(),
    source: z.string(),
    link: z.string(),
    phone: z.string(),
    call_responsible: z.string(),
})

/**
 * params для note_type === "call_out".
 * `call_responsible` — ID пользователя Amo; имя берётся через GET /api/v4/users/{id}.
 * coerce — на случай строки в JSON ("504141").
 */
const callOutParamsSchema = z.object({
    uniq: z.string(),
    duration: z.number().int(),
    source: z.string(),
    link: z.string(),
    phone: z.string(),
    call_responsible: z.coerce.number().int(),
})

const amoCallNoteItemBaseSchema = z.object({
    id: z.number().int(),
    entity_id: z.number().int(),
    created_by: z.number().int(),
    updated_by: z.number().int(),
    created_at: z.number().int(),
    updated_at: z.number().int(),
    responsible_user_id: z.number().int(),
    group_id: z.number().int(),
    account_id: z.number().int(),
    /** Требуется GET-параметр with=is_pinned */
    is_pinned: z.boolean().optional(),
    _links: z.object({
        self: hrefLinkSchema,
    }),
})

const callInNoteItemSchema = amoCallNoteItemBaseSchema.extend({
    note_type: z.literal("call_in"),
    params: callInParamsSchema,
})

const callOutNoteItemSchema = amoCallNoteItemBaseSchema.extend({
    note_type: z.literal("call_out"),
    params: callOutParamsSchema,
})

/** Только примечания со звонками: call_in | call_out */
const callNoteItemSchema = z.discriminatedUnion("note_type", [
    callInNoteItemSchema,
    callOutNoteItemSchema,
])

const getCallNotesResponseSchema = z.object({
    _page: z.number().int(),
    _links: z.object({
        self: hrefLinkSchema,
        next: hrefLinkSchema.optional(),
    }),
    _embedded: z.object({
        notes: z.array(callNoteItemSchema),
    }),
})

export type GetCallNotesResponse = z.infer<typeof getCallNotesResponseSchema>
export type AmoCallNoteItem = z.infer<typeof callNoteItemSchema>
export type AmoCallInNoteItem = z.infer<typeof callInNoteItemSchema>
export type AmoCallOutNoteItem = z.infer<typeof callOutNoteItemSchema>

export {
    getCallNotesResponseSchema,
    callNoteItemSchema,
    callInParamsSchema,
    callOutParamsSchema,
    callInNoteItemSchema,
    callOutNoteItemSchema,
}
