import { z } from "zod"

const callSchema = z.object({
    id: z.number(),
    direction: z.string(),
    uuid: z.string(),
    duration: z.number(),
    source: z.string(),
    link: z.string(),
    phone: z.string(),
    call_responsible: z.string(),
    call_responsible_name: z.string().nullable(),
    timestamp: z.number(),
    lead_id: z.number(),
})

export type Call = z.infer<typeof callSchema>