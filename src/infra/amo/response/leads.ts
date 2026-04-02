import { z } from "zod"

const getLeadsResponseSchema = z.object({
    _page: z.number(),
    _embedded: z.object({
        leads: z.array(z.object({
            //ID сделки
            id: z.number(),
            //Название сделки
            name: z.string(),
            //Бюджет сделки
            price: z.number(),
            //ID пользователя, ответственного за сделку
            responsible_user_id: z.number(),
            //ID группы, в которой состоит ответственны пользователь за сделку
            group_id: z.number(),
            //ID статуса, в который добавляется сделка, по-умолчанию – первый этап главной воронки
            status_id: z.number(),
            //ID воронки, в которую добавляется сделка
            pipeline_id: z.number(),
            //ID причины отказа
            loss_reason_id: z.number(),
            //ID источника сделки
            source_id: z.number(),
            //ID пользователя, создающий сделку
            created_by: z.number(),
            //ID пользователя, изменяющий сделку
            updated_by: z.number(),
            //Дата закрытия сделки, передается в Unix Timestamp
            closed_at: z.number(),
            //Дата создания сделки, передается в Unix Timestamp
            created_at: z.number(),
            //Дата изменения сделки, передается в Unix Timestamp
            updated_at: z.number(),
            //Дата ближайшей задачи к выполнению, передается в Unix Timestamp
            closest_task_at: z.number(),
            //Удалена ли сделка
            is_deleted: z.boolean(),
            //Массив, содержащий информацию по значениям дополнительных полей, заданных для данной сделки
            custom_fields_values: z.array(z.object({
                field_id: z.number(),
                field_name: z.string(),
                field_code: z.string().optional(),
                field_type: z.string(),
                values: z.array(z.object({
                    value: z.any(),
                }))
            })).optional(),
            //Скоринг сделки
            score: z.number().optional(),
            //ID аккаунта, в котором находится сделка
            account_id: z.number(),
            //Тип поля "стоимость труда" показывает сколько времени было затрачено на работу со сделкой. Время исчисления в секундах
            labor_cost: z.number(),
            //Требуется GET параметр with. Изменен ли в последний раз бюджет сделки роботом
            is_price_modified_by_robot: z.boolean().optional(),
            //Данные вложенных сущностей
            _embedded: z.object({
                //Требуется GET параметр with. Причина отказа сделки
                loss_reason: z.object({
                    //ID причины отказа
                    id: z.number(),
                    //Название причины отказа
                    name: z.string(),
                }),
                //Данные тегов, привязанных к сделке
                tags: z.array(z.object({
                    //ID тега
                    id: z.number(),
                    //Название тега
                    name: z.string(),
                    //Цвет тега
                    color: z.string().optional(),
                })),
                //Требуется GET параметр with. Данные контактов, привязанных к сделке
                contacts: z.array(z.object({
                    //ID контакта, привязанного к сделке
                    id: z.number(),
                    //Является ли контакт главным для сделки
                    is_main: z.boolean(),
                })),
                //Данные компании, привязанной к сделке, в данном массиве всегда 1 элемент, так как у сделки может быть только 1 компания
                companies: z.array(z.object({
                    //ID компании, привязанной к сделке
                    id: z.number(),
                })),
                //Требуется GET параметр with. Данные элементов списков, привязанных к сделке
                catalog_elements: z.array(z.object({
                    //ID элемента, привязанного к сделке
                    id: z.number(),
                    //Мета-данные элемента
                    metadata: z.record(z.string(), z.any()),
                    //Количество элементов у сделки
                    quantity: z.number(),
                    //ID списка, в котором находится элемент
                    catalog_id: z.number(),
                    //ID поля типа Цена, которое будет установлено для привязанного элемента в сущности
                    price_id: z.number(),
                })),
                //Требуется GET параметр with. Источник сделки
                source: z.object({
                    //ID источника
                    id: z.number(),
                    //Название источника
                    name: z.string(),
                }),
            })
        }))
    })
})

export type GetLeadsResponse = z.infer<typeof getLeadsResponseSchema>

const getLeadResponseSchema = z.object({
    // ID сделки
    id: z.number().int(),

    // Название сделки
    name: z.string(),

    // Бюджет сделки
    price: z.number().int(),

    // ID пользователя, ответственного за сделку
    responsible_user_id: z.number().int(),

    // ID группы, в которой состоит ответственный пользователь за сделку
    group_id: z.number().int(),

    // ID статуса, в который добавляется сделка
    status_id: z.number().int(),

    // ID воронки, в которую добавляется сделка
    pipeline_id: z.number().int(),

    // ID причины отказа
    loss_reason_id: z.number().int(),

    // Требуется GET параметр with. ID источника сделки
    source_id: z.number().int().nullable(),

    // ID пользователя, создающий сделку
    created_by: z.number().int(),

    // ID пользователя, изменяющий сделку
    updated_by: z.number().int(),

    // Дата закрытия сделки, Unix Timestamp (seconds)
    closed_at: z.number().int(),

    // Дата создания сделки, Unix Timestamp (seconds)
    created_at: z.number().int(),

    // Дата изменения сделки, Unix Timestamp (seconds)
    updated_at: z.number().int(),

    // Дата ближайшей задачи к выполнению, Unix Timestamp (seconds)
    closest_task_at: z.number().int().nullable(),

    // Удалена ли сделка
    is_deleted: z.boolean(),

    // Массив значений дополнительных полей (может быть null)
    custom_fields_values: z.array(z.object({
        field_id: z.number(),
        field_name: z.string(),
        field_code: z.string().optional(),
        field_type: z.string(),
        values: z.array(z.object({
            value: z.any(),
        }))
    })).optional(),

    // Скоринг сделки (может быть null)
    score: z.number().int().nullable(),

    // ID аккаунта, в котором находится сделка
    account_id: z.number().int(),

    // Стоимость труда (секунды), сколько времени затрачено на работу со сделкой
    labor_cost: z.number().int().optional(),

    // Требуется GET параметр with. Изменен ли в последний раз бюджет сделки роботом
    is_price_modified_by_robot: z.boolean(),

    // Ссылки на ресурсы
    _links: z.object({
        // Ссылка на саму сделку
        self: z.object({
            // URL сделки
            href: z.string().url(),
        }),
    }),

    // Данные вложенных сущностей
    _embedded: z.object({
        // Данные тегов, привязанных к сделке
        tags: z.array(z.object({
            // ID тега
            id: z.number().int(),
            // Название тега
            name: z.string(),
            // Цвет тега (может быть null)
            color: z.string().nullable(),
        })).optional(),

        // Требуется GET параметр with. Данные элементов списков, привязанных к сделке
        catalog_elements: z.array(z.object({
            // ID элемента, привязанного к сделке
            id: z.number().int(),
            // Мета-данные элемента
            metadata: z.object({
                // Количество элементов у сделки (int/float)
                quantity: z.number().optional(),
                // ID списка, в котором находится элемент
                catalog_id: z.number().int().optional(),
                // ID поля типа Цена, установленного для привязанного элемента в сущности
                price_id: z.number().int().optional(),
            }).passthrough(),

            // Количество элементов у сделки (иногда приходит на верхнем уровне объекта)
            quantity: z.number().optional(),
            // ID списка (иногда приходит на верхнем уровне объекта)
            catalog_id: z.number().int().optional(),
            // ID price field (иногда приходит на верхнем уровне объекта)
            price_id: z.number().int().optional(),
        })).optional(),

        // Требуется GET параметр with. Причина отказа сделки
        loss_reason: z.array(z.object({
            // ID причины отказа
            id: z.number().int(),
            // Название причины отказа
            name: z.string(),
            // Сортировка (встречается в ответе)
            sort: z.number().int().optional(),
            // Дата создания, Unix Timestamp (seconds)
            created_at: z.number().int().optional(),
            // Дата изменения, Unix Timestamp (seconds)
            updated_at: z.number().int().optional(),
            // Ссылки на ресурс причины отказа
            _links: z.object({
                // Ссылка на причину отказа
                self: z.object({
                    // URL причины отказа
                    href: z.string().url(),
                }),
            }).optional(),
        })).optional(),

        // Данные компании, привязанной к сделке (обычно 1 элемент)
        companies: z.array(z.object({
            // ID компании, привязанной к сделке
            id: z.number().int(),
            // Ссылки на ресурс компании
            _links: z.object({
                // Ссылка на компанию
                self: z.object({
                    // URL компании
                    href: z.string().url(),
                }),
            }).optional(),
        })).optional(),

        // Требуется GET параметр with. Данные контактов, привязанных к сделке
        contacts: z.array(z.object({
            // ID контакта, привязанного к сделке
            id: z.number().int(),
            // Является ли контакт главным для сделки
            is_main: z.boolean(),
            // Ссылки на ресурс контакта
            _links: z.object({
                // Ссылка на контакт
                self: z.object({
                    // URL контакта
                    href: z.string().url(),
                }),
            }).optional(),
        })).optional(),

        // Требуется GET параметр with. Источник сделки
        source: z.object({
            // ID источника сделки
            id: z.number().int(),
            // Название источника сделки
            name: z.string(),
        }).optional(),
    }),
})

export type GetLeadResponse = z.infer<typeof getLeadResponseSchema>