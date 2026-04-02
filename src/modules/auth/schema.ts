import { z } from "zod"

export const completeOauthQuerySchema = z.object({
  state: z.string(),
  code: z.string(),
  referer: z.string(),
})

export type CompleteOauthQuery = z.infer<typeof completeOauthQuerySchema>