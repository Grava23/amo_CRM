import { z } from "zod"

const getSourcesResponseSchema = z.object({
    _total_items: z.number(),
    _embedded: z.object({
        sources: z.array(z.object({
            //ID источника
            id: z.number(),
            //Название источника
            name: z.string(),
            //ID воронки, воронка может быть архивной
            pipeline_id: z.number(),
            //Внешний идентификатор источника на стороне интеграции
            external_id: z.string().or(z.number()).or(z.boolean()),
            //Является ли данный источник источником по-умолчанию. Поле не является обязательным
            default: z.boolean().optional(),
            //Код основного канала источника. Данный канал чата будет использоваться при инициализации общения. Поле не является обязательным.
            origin_code: z.string().optional(),
        }))
    })
})

export type GetSourcesResponse = z.infer<typeof getSourcesResponseSchema>