import { z } from "zod"

const getTalkResponseSchema = z.object({
    // ID беседы
    talk_id: z.number().int(),

    // Дата создания беседы, Unix Timestamp (seconds)
    created_at: z.number().int(),

    // Дата изменения беседы, Unix Timestamp (seconds)
    updated_at: z.number().int(),

    // Оценка беседы клиентом (NPS), int
    rate: z.number().int(),

    // ID контакта, к которому принадлежит беседа
    contact_id: z.number().int(),

    // ID чата, к которому принадлежит беседа
    chat_id: z.string(),

    // ID сущности, по которой ведется беседа (может быть null)
    entity_id: z.number().int().nullable(),

    // Тип сущности, по которой ведется беседа (lead, customer), может быть null
    entity_type: z.string().nullable(),

    // В работе ли беседа (не закрыта)
    is_in_work: z.boolean(),

    // Прочитана ли беседа
    is_read: z.boolean(),

    // Тип источника, по которому была создана беседа (telegram, viber, и т.д.)
    origin: z.string(),

    // Дата когда беседа была пропущена, Unix Timestamp (seconds), может быть null
    missed_at: z.number().int().nullable(),

    // ID аккаунта
    account_id: z.number().int(),

    // Ссылки на ресурсы
    _links: z.object({
        // Ссылка на саму беседу
        self: z.object({
            // URL беседы
            href: z.string().url(),
        }),
    }),

    // Данные вложенных сущностей
    _embedded: z.object({
        // Данные контактов, к которым принадлежит беседа (не больше одного)
        contacts: z.array(z.object({
            // ID контакта
            id: z.number().int(),
            // Ссылки на ресурс контакта
            _links: z.object({
                // Ссылка на контакт
                self: z.object({
                    // URL контакта
                    href: z.string().url(),
                }),
            }),
        })),

        // Данные сделок, по которым ведется беседа (не больше одной)
        leads: z.array(z.object({
            // ID сделки
            id: z.number().int(),
            // Ссылки на ресурс сделки
            _links: z.object({
                // Ссылка на сделку
                self: z.object({
                    // URL сделки
                    href: z.string().url(),
                }),
            }),
        })),

        // Данные покупателей, по которым ведется беседа (не больше одного)
        customers: z.array(z.object({
            // ID покупателя
            id: z.number().int(),
            // Ссылки на ресурс покупателя
            _links: z.object({
                // Ссылка на покупателя
                self: z.object({
                    // URL покупателя
                    href: z.string().url(),
                }),
            }),
        })),
    }),
})

export type GetTalkResponse = z.infer<typeof getTalkResponseSchema>

export { getTalkResponseSchema }