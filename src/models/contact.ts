import { z } from "zod"

const contactSchema = z.object({
    id: z.number(),
    name: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    responsible_user_id: z.number(),
})

export type Contact = z.infer<typeof contactSchema>