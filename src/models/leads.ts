import { z } from "zod"

const leadSchema = z.object({
    id: z.number(),
    name: z.string(),
    responsible_user_id: z.number(),
    responsible_user_name: z.string().nullable(),
    pipeline_id: z.number(),
    status_id: z.number(),
})

export type Lead = z.infer<typeof leadSchema>