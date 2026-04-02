import { z } from "zod"

const getUserByIDParamsSchema = z.object({
    with: z.array(z.enum(["role", "group", "uuid", "amojo_id", "user_rank", "phone_number"])).optional(),
})

export type GetUserByIDParams = z.infer<typeof getUserByIDParamsSchema>