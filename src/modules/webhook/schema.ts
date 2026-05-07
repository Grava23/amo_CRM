import { z } from "zod"

const zUnixSeconds = z.coerce.number().int().nonnegative()
const zBool01 = z.preprocess((v) => {
    if (v === "1" || v === 1 || v === true) return true
    if (v === "0" || v === 0 || v === false) return false
    return v
}, z.boolean())

export const incomingMessageWebhookParamsSchema = z.object({
    scope_id: z.string(),
})

export type IncomingMessageWebhookParams = z.infer<typeof incomingMessageWebhookParamsSchema>

const quotedMessageSchema = z.object({
    //Идентификатор сообщения в API чатов
    id: z.string(),
    //Тип сообщений, может быть одним из списка: text, file, video, picture, voice, audio, sticker
    type: z.enum(["text", "file", "video", "picture", "voice", "audio", "sticker"]),
    //Текст сообщения. Для типа text обязательно, для других типов сообщений может быть пустым
    text: z.string().optional(),
    //Ссылка на медиа, если тип сообщения не text
    media: z.string().optional(),
    //Ссылка на картинку-предпросмотр. Приходит только для типов picture и video
    thumbnail: z.string().optional(),
    //Название файла
    file_name: z.string().optional(),
    //Размер файла в байтах
    file_size: z.number().optional(),
    //Время сообщения, метка unix
    timestamp: z.number(),
    //Время сообщения, метка unix c миллисекундами
    msec_timestamp: z.number(),
    //Объект с информацией об отправителе сообщения.
    sender: z.object({
        //Идентификатор отправителя сообщения в API чатов
        id: z.string(),
    }),
    //Объект с информацией о получателе сообщения.
    receiver: z.object({
        //Идентификатор получателя сообщений в API чатов
        id: z.string(),
        //Телефон получателя сообщения. Поле приходит пустой строкой, если не передавался профиль при создании чата. При создании чата через функционал "Написать первым", будет передан выбранный номер телефона
        phone: z.string().optional(),
        //Email получателя сообщения. Поле приходит пустой строкой, если не передавался профиль при создании чата
        email: z.string().optional(),
    }),
})

export const incomingMessageWebhookBodySchema = z.object({
    //ID аккаунта в API чатов
    account_id: z.string(),
    //Время генерации хука, метка unix
    time: z.number(),
    message: z.object({
        //Объект с информацией о чате.
        conversation: z.object({
            //Идентификатор чата в API чатов
            id: z.string(),
            //Идентификатор чата на стороне интеграции. Необязательное поле. Если чат создан через функцию "Написать первым", поле будет отсутствовать в хуке
            client_id: z.string().optional(),
        }),
        //Объект с информацией об источнике.
        source: z.object({
            //Идентификатор источника чата на стороне интеграции.
            external_id: z.string().or(z.number()).or(z.boolean()),
        }),
        //Объект с информацией об отправителе сообщения.
        sender: z.object({
            //Идентификатор отправителя сообщения в API чатов
            id: z.string(),
        }),
        //Объект с информацией о получателе сообщения.
        receiver: z.object({
            //Идентификатор получателя сообщений в API чатов
            id: z.string(),
            //Телефон получателя сообщения. Поле приходит пустой строкой, если не передавался профиль при создании чата. При создании чата через функционал "Написать первым", будет передан выбранный номер телефона
            phone: z.string().optional(),
            //Email получателя сообщения. Поле приходит пустой строкой, если не передавался профиль при создании чата
            email: z.string().optional(),
        }),
        //Время сообщения, метка unix
        timestamp: z.number(),
        //Время сообщения, метка unix c миллисекундами
        msec_timestamp: z.number(),
        //Объект с информацией об отправляемом сообщении.
        message: z.object({
            //Идентификатор сообщения в API чатов
            id: z.string(),
            //Тип сообщений, может быть одним из списка: text, file, video, picture, voice, audio, sticker
            type: z.enum(["text", "file", "video", "picture", "voice", "audio", "sticker"]),
            //Текст сообщения. Для типа text обязательно, для других типов сообщений может быть пустым
            text: z.string().optional(),
            //Ссылка на медиа, если тип сообщения не text
            media: z.string().optional(),
            //Ссылка на картинку-предпросмотр. Приходит только для типов picture и video
            thumbnail: z.string().optional(),
            //Название файла
            fileName: z.string().optional(),
            //Размер файла в байтах
            fileSize: z.number().optional(),
            //Объект клавиатуры, которую нужно отобразить вместе с сообщением.
            markup: z.object({
                //Способ расположения клавиатуры. Возможные значения: inline — кнопки отображаются под текстом сообщения
                mode: z.enum(["inline"]),
                //Массив объектов-кнопок.
                buttons: z.array(z.object({
                    //Текст. Когда пользователь нажимает на текстовую кнопку, мессенджер должен отправить сообщение с текстом этой кнопки в чат
                    text: z.string(),
                    //Ссылка. Когда пользователь нажимает на ссылочную кнопку, мессенджер должен осуществить переход по этой ссылке. Свойство может отсутствовать, если передана обычная кнопка
                    url: z.string().optional(),
                })),
                //Объект сообщения типа WhatsApp List Message.
                list_message: z.object({
                    //Заголовок сообщения. Строка длиной до 60 символов (поддерживаются эмодзи)
                    header: z.string(),
                    //Тело сообщения. Строка длиной да 1024 символов (поддерживаются эмодзи и разметка Markdown)
                    body: z.string(),
                    //Нижняя часть сообщения. Строка длиной да 60 символов (поддерживаются эмодзи, ссылки и разметка Markdown)
                    footer: z.string(),
                    //Название главной кнопки, которая будет показываться пользователю, при нажатии на эту кнопку открывается меню с переданными sections
                    button: z.string(),
                    //Массив объектов (от 1 до 10 элементов), описывающий интерактивные элементы (секции)
                    sections: z.array(z.object({
                        //Название секции. Строка длиной до 24 символов.
                        title: z.string(),
                        //Массив объектов (от 1 до 10 элементов), описывающий отдельные кнопки в секции
                        rows: z.array(z.object({
                            //Уникальный идентификатор, который нужно передать в WhatsApp и который необходимо прислать с выбранной пользователем кнопкой в свойстве callback_data объекта message.
                            callback_data: z.string(),
                            //Название кнопки
                            title: z.string(),
                            //Описание кнопки
                            description: z.string(),
                        }))
                    }))
                })
            }),
            //Объект шаблона, если сообщение было отправлено с использованием шаблона.
            template: z.object({
                //ID шаблона в API чатов
                id: z.number(),
                //Если у шаблона в API чатов, при создании через API был указан external_id, то вы получите его в хуке
                external_id: z.string().or(z.number()).or(z.boolean()).optional(),
                //Оригинальный текст шаблона, может содержать маркеры
                content: z.string(),
                //Массив объектов заменяемых маркеров в тексте
                params: z.array(z.object({
                    key: z.string(),
                    value: z.string(),
                })),
            }),
            //Объект цитаты-ответа.
            reply_to: z.object({
                //Объект цитируемого сообщения.
                message: quotedMessageSchema,
            }),
            //Объект цитаты c перессылки.
            forwards: z.object({
                //Массив объектов цитируемых сообщений.
                messages: z.array(quotedMessageSchema),
                //Идентификатор чата на стороне API чатов.
                conversation_ref_id: z.string(),
            }),
        })
    })
})

export type IncomingMessageWebhookBody = z.infer<typeof incomingMessageWebhookBodySchema>

const contactSchema = z.object({
    id: z.coerce.string(),
    name: z.string(),
    responsible_user_id: z.coerce.string(),
    group_id: z.coerce.string().optional(),
    date_create: z.coerce.string(),
    last_modified: z.coerce.string(),
    created_user_id: z.coerce.string(),
    modified_user_id: z.coerce.string(),
    linked_company_id: z.string().optional(),
    account_id: z.coerce.string(),
    old_responsible_user_id: z.coerce.string().optional(),
    created_at: z.coerce.string(),
    updated_at: z.coerce.string(),
    type: z.string(),
})

export const addContactWebhookBodySchema = z.object({
    account: z.object({
        subdomain: z.string(),
        id: z.coerce.string(),
        _links: z.object({
            self: z.string().url(),
        }),
    }),
    contacts: z.object({
        add: z.array(contactSchema).min(1),
    })
})

export type AddContactWebhookBody = z.infer<typeof addContactWebhookBodySchema>

export const updateContactWebhookBodySchema = z.object({
    account: z.object({
        subdomain: z.string(),
        id: z.coerce.string(),
        _links: z.object({
            self: z.string().url(),
        }),
    }),
    contacts: z.object({
        update: z.array(contactSchema).min(1),
    })
})

export type UpdateContactWebhookBody = z.infer<typeof updateContactWebhookBodySchema>

export const deleteContactWebhookBodySchema = z.object({
    account: z.object({
        subdomain: z.string(),
        id: z.coerce.string(),
        _links: z.object({
            self: z.string().url(),
        }),
    }),
    contacts: z.object({
        delete: z.array(z.object({
            id: z.coerce.string(),
            type: z.string(),
        })).min(1),
    })
})

export type DeleteContactWebhookBody = z.infer<typeof deleteContactWebhookBodySchema>

export const restoreContactWebhookBodySchema = z.object({
    account: z.object({
        subdomain: z.string(),
        id: z.coerce.string(),
        _links: z.object({
            self: z.string().url(),
        }),
    }),
    contacts: z.object({
        update: z.array(contactSchema).min(1),
    })
})

export const addTalkWebhookBodySchema = z.object({
    account: z.object({
        subdomain: z.string(),
        id: z.coerce.string(),
        _links: z.object({
            self: z.string().url(),
        }),
    }),
    talk: z.object({
        add: z.array(z.object({
            talk_id: z.coerce.string(),
            created_at: zUnixSeconds,
            updated_at: zUnixSeconds,
            rate: z.coerce.number(),
            contact_id: z.coerce.string(),
            chat_id: z.string(),
            entity_id: z.coerce.string(),
            entity_type: z.string(),
            is_in_work: zBool01,
            is_read: zBool01,
            origin: z.string(),
        })).min(1),
    }),
})

export type AddTalkWebhookBody = z.infer<typeof addTalkWebhookBodySchema>

const leadSchema = z.object({
    id: z.coerce.string(),
    name: z.string(),
    status_id: z.coerce.string(),
    old_status_id: z.coerce.string().optional(),
    price: z.coerce.string(),
    responsible_user_id: z.coerce.string(),
    last_modified: z.coerce.string(),
    modified_user_id: z.coerce.string(),
    created_user_id: z.coerce.string(),
    date_create: z.coerce.string(),
    pipeline_id: z.coerce.string(),
    account_id: z.coerce.string(),
    custom_fields: z.array(z.object({
        id: z.coerce.number(),
        name: z.string(),
        values: z.preprocess(
            (val) => {
                // amo может прислать values как массив [{value: ...}]
                // или как объект вида {"[0][value]": "..."}.
                if (Array.isArray(val)) return val
                if (val && typeof val === "object") {
                    return Object.values(val as Record<string, unknown>).map((value) => ({ value }))
                }
                return val
            },
            z.array(z.object({ value: z.any() })),
        ),
    })).optional(),
    created_at: z.coerce.string(),
    updated_at: z.coerce.string(),
})

export const addLeadWebhookBodySchema = z.object({
    account: z.object({
        subdomain: z.string(),
        id: z.coerce.string(),
        _links: z.object({
            self: z.string().url(),
        }),
    }),
    leads: z.object({
        add: z.array(leadSchema).min(1),
    }),
})

export type AddLeadWebhookBody = z.infer<typeof addLeadWebhookBodySchema>

export const updateLeadWebhookBodySchema = z.object({
    account: z.object({
        subdomain: z.string(),
        id: z.coerce.string(),
        _links: z.object({
            self: z.string().url(),
        }),
    }),
    leads: z.object({
        update: z.array(leadSchema).min(1),
    }),
})

export type UpdateLeadWebhookBody = z.infer<typeof updateLeadWebhookBodySchema>

export const deleteLeadWebhookBodySchema = z.object({
    account: z.object({
        subdomain: z.string(),
        id: z.coerce.string(),
        _links: z.object({
            self: z.string().url(),
        }),
    }),
    leads: z.object({
        delete: z.array(z.object({
            id: z.coerce.string(),
            status_id: z.coerce.string(),
            pipeline_id: z.coerce.string(),
        })).min(1),
    }),
})

export type DeleteLeadWebhookBody = z.infer<typeof deleteLeadWebhookBodySchema>

export const restoreLeadWebhookBodySchema = z.object({
    account: z.object({
        subdomain: z.string(),
        id: z.coerce.string(),
        _links: z.object({
            self: z.string().url(),
        }),
    }),
    leads: z.object({
        restore: z.array(leadSchema).min(1),
    }),
})

export type RestoreLeadWebhookBody = z.infer<typeof restoreLeadWebhookBodySchema>

export const addMessageWebhookBodySchema = z.object({
    account: z.object({
        subdomain: z.string(),
        id: z.coerce.string(),
        _links: z.object({
            self: z.string().url(),
        }),
    }),
    message: z.object({
        add: z.array(z.object({
            id: z.coerce.string(),
            chat_id: z.coerce.string(),
            talk_id: z.coerce.string(),
            contact_id: z.coerce.string(),
            text: z.string(),
            created_at: z.coerce.string(),
            attachment: z.object({
                type: z.enum(["file", "video", "picture", "voice", "audio", "sticker"]),
                link: z.string().url(),
                file_name: z.string(),
            }).optional(),
            element_type: z.coerce.string(),
            entity_type: z.string(),
            element_id: z.coerce.string(),
            entity_id: z.coerce.string(),
            type: z.string(),
            author: z.object({
                id: z.coerce.string(),
                type: z.string(),
                name: z.string(),
                avatar_url: z.string().url().optional(),
            }),
            origin: z.string(),
        })).min(1),
    })
})

export type AddMessageWebhookBody = z.infer<typeof addMessageWebhookBodySchema>

const amoNoteItemSchema = z.object({
    note: z.object({
        note_type: z.coerce.string(),
        element_type: z.coerce.string().optional(),
        element_id: z.coerce.string().optional(),
        date_create: z.coerce.string().optional(),
        text: z.coerce.string().optional(),

        // Часто встречающиеся поля в payload
        created_by: z.coerce.string().optional(),
        modified_by: z.coerce.string().optional(),
        main_user_id: z.coerce.string().optional(),
        account_id: z.coerce.string().optional(),
        id: z.coerce.string().optional(),
        created_at: z.coerce.string().optional(),
        updated_at: z.coerce.string().optional(),
        timestamp_x: z.coerce.string().optional(),
        metadata: z.coerce.string().optional(),

        // В некоторых типах заметок
        message_uuid: z.coerce.string().optional(),
        attachment: z.coerce.string().optional(),
        attachement: z.coerce.string().optional(),
        catalog_id: z.coerce.string().optional(),
        group_id: z.coerce.string().optional(),
    }).passthrough(),
}).passthrough()

export const addNoteWebhookBodySchema = z.object({
    account: z.object({
        subdomain: z.string(),
        id: z.coerce.string(),
        _links: z.object({
            self: z.string().url(),
        }),
    }),
    leads: z.object({
        note: z.array(amoNoteItemSchema).min(1),
    }),
})

export type AddNoteWebhookBody = z.infer<typeof addNoteWebhookBodySchema>