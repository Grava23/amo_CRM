import { z } from "zod"

const noteOrderDirectionSchema = z.enum(["asc", "desc"])

/** GET /api/v4/{entity}/notes — query-параметры */
const getNotesParamsSchema = z.object({
    page: z.number().int().optional(),
    limit: z.number().int().min(1).max(250).optional(),
    filter: z
        .object({
            /** filter[id] — один ID или массив */
            id: z.union([z.number().int(), z.array(z.number().int())]).optional(),
            /** filter[note_type] — один тип или массив */
            note_type: z.union([z.string(), z.array(z.string())]).optional(),
            /**
             * filter[updated_at] — timestamp «после» или диапазон filter[updated_at][from]/[to]
             */
            updated_at: z
                .union([
                    z.number().int(),
                    z.object({
                        from: z.number().int().optional(),
                        to: z.number().int().optional(),
                    }),
                ])
                .optional(),
        })
        .optional(),
    /** order[updated_at], order[id] */
    order: z
        .object({
            updated_at: noteOrderDirectionSchema.optional(),
            id: noteOrderDirectionSchema.optional(),
        })
        .optional(),
    /** Поддерживается только is_pinned */
    with: z.enum(["is_pinned"]).optional(),
})

export type GetNotesParams = z.infer<typeof getNotesParamsSchema>
