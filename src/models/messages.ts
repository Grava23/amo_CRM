import { z } from "zod"

const messageSchema = z.object({
    id: z.string(),
    type: z.enum(["text", "file", "video", "picture", "voice", "audio", "sticker"]),
    text: z.string().optional(),
    media: z.string().optional(),
    role: z.enum(["client", "manager"]),
    sent_at: z.date(),
    chat_id: z.string(),
})

export type Message = z.infer<typeof messageSchema>