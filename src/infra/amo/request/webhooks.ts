import { z } from "zod"

const subscribeRequestSchema = z.object({
    //Валидный URL на который необходимо присылать уведомления
    destination: z.string(),
    //Действия, на которые подписан вебхук. Передается в виде массива cо списком возможных действий.
    settings: z.array(z.string())
})

export type SubscribeRequest = z.infer<typeof subscribeRequestSchema>