import { z } from "zod"

const getChatsParamsSchema = z.object({
    offset: z.number().optional(),
    limit: z.number().optional(),
})

export type GetChatsParams = z.infer<typeof getChatsParamsSchema>