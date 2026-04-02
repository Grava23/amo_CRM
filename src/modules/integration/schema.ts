import { z } from "zod"

export const updateIntegrationActiveParamsSchema = z.object({
    domain: z.string(),
})

export type UpdateIntegrationActiveParams = z.infer<typeof updateIntegrationActiveParamsSchema>

export const updateIntegrationActiveRequestSchema = z.object({
    active: z.boolean(),
})

export type UpdateIntegrationActiveRequest = z.infer<typeof updateIntegrationActiveRequestSchema>