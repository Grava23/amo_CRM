import { z } from "zod"

const chatUserSchema = z.object({
    // ID получателя/отправителя сообщения в API Чатов
    id: z.string(),

    // Имя получателя/отправителя сообщения в API Чатов
    name: z.string().optional(),

    // ID получателя/отправителя сообщения на стороне интеграции
    client_id: z.string().optional(),

    // Ссылка на аватар получателя/отправителя
    avatar: z.string().optional(),

    // Телефон получателя/отправителя
    phone: z.string().optional(),

    // Email получателя/отправителя
    email: z.string().optional(),
})

const chatMessageSchema = z.object({
    // ID сообщения в API чатов
    id: z.string(),

    // ID сообщения на стороне интеграции
    client_id: z.string().optional(),

    // Тип сообщения
    type: z.string(),

    // Текст сообщения
    text: z.string().optional(),

    // Ссылка на файл в сообщении
    media: z.string().optional(),

    // Ссылка на превью медиа в сообщении
    thumbnail: z.string().optional(),

    // Имя файла
    file_name: z.string().optional(),

    // Размер файла в байтах
    file_size: z.number().int().optional(),

    // Идентификатор группы медиа сообщений
    media_group_id: z.string().optional(),

    // Геолокация
    location: z.record(z.string(), z.any()).optional(),

    // Контактные данные
    contact: z.record(z.string(), z.any()).optional(),
}).passthrough()

const getMessageHistoryResponseSchema = z.object({
    // Коллекция сообщений
    messages: z.array(z.object({
        // Временная метка отправки сообщения (Unix Timestamp, seconds)
        timestamp: z.number().int(),

        // Временная метка отправки сообщения в миллисекундах
        msec_timestamp: z.number().int().optional(),

        // Объект отправителя
        sender: chatUserSchema.optional(),

        // Объект получателя
        receiver: chatUserSchema.optional(),

        // Объект сообщения
        message: chatMessageSchema,
    }).passthrough()),
})

export type GetMessageHistoryResponse = z.infer<typeof getMessageHistoryResponseSchema>

export { getMessageHistoryResponseSchema }