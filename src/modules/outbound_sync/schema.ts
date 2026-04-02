import { z } from "zod"

export const patchOutboundSyncSchema = z
    .object({
        enabled: z.boolean().optional(),
        interval_ms: z.number().int().min(10_000).max(86_400_000).optional(),
        target_url: z.string().max(4096).optional(),
        api_key: z.union([z.string().max(2048), z.null()]).optional(),
    })
    .strict()

export type PatchOutboundSyncBody = z.infer<typeof patchOutboundSyncSchema>
