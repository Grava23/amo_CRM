import { z } from "zod"

const chatSchema = z.object({
    id: z.string(),
    talk_id: z.number().int(),
    origin: z.string(),
    conversation_id: z.string(),
    integration_domain: z.string(),
    lead_id: z.number().int(),
    contact_id: z.number().int(),
})

export type Chat = z.infer<typeof chatSchema>