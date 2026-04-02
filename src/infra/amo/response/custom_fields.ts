import { z } from "zod"

const amoLinkHrefSchema = z.object({
    href: z.string(),
})

const customFieldEnumValueSchema = z.object({
    //ID значения
    id: z.number(),
    //Значение
    value: z.string(),
    //Сортировка значения
    sort: z.number(),
    //Символьный код значения
    code: z.string().nullable(),
})

const customFieldNestedValueSchema = z.object({
    //ID вложенного значения
    id: z.number(),
    //ID родительского вложенного значения
    parent_id: z.number(),
    //Значение вложенного значения
    value: z.string(),
    //Сортировка вложенного значения
    sort: z.number(),
})

const requiredStatusSchema = z.object({
    //ID статуса, для перехода в который данное поле обязательно к заполнению
    status_id: z.number(),
    //ID воронки, для перехода в который данное поле обязательно к заполнению
    pipeline_id: z.number(),
})

const hiddenStatusSchema = z.object({
    //ID статуса, в котором поле скрыто
    status_id: z.number(),
    //ID воронки, в котором поле скрыто
    pipeline_id: z.number(),
})

const chainedListSchema = z.object({
    //Название связанного списка, которое отображается в карточке
    title: z.string().nullable(),
    //ID каталога
    catalog_id: z.number(),
    //ID родительского каталога
    parent_catalog_id: z.number(),
})

const customFieldSchema = z.object({
    //ID поля
    id: z.number(),
    //Название поля
    name: z.string(),
    //Код поля
    code: z.string().optional(),
    //Сортировка поля
    sort: z.number(),
    //Тип поля
    type: z.string(),
    //Тип сущности (leads, contacts, companies, segments, customers, catalogs)
    entity_type: z.string().optional(),
    //Вычисляемое поле (только для списка полей сделки)
    is_computed: z.boolean().optional(),
    //Предустановленное поле (контакты, компании)
    is_predefined: z.boolean().optional(),
    //Доступно ли для удаления
    is_deletable: z.boolean().optional(),
    //Отображается в интерфейсе списка (каталоги)
    is_visible: z.boolean().optional(),
    //Обязательно при создании элемента списка (каталоги)
    is_required: z.boolean().optional(),
    //Настройки поля (каталоги)
    settings: z.array(z.unknown()).nullable().optional(),
    //Напоминание для birthday: never | day | week | month
    remind: z.string().nullable().optional(),
    //Код валюты (monetary), иначе null
    currency: z.string().nullable().optional(),
    //Доступные значения enum
    enums: z.array(customFieldEnumValueSchema).nullable().optional(),
    //Вложенные значения category (каталоги)
    nested: z.array(customFieldNestedValueSchema).nullable().optional(),
    //Только через API (контакты, сделки, компании)
    is_api_only: z.boolean().optional(),
    //ID группы полей
    group_id: z.string().nullable().optional(),
    //Обязательность при смене этапов
    required_statuses: z.array(requiredStatusSchema).nullable().optional(),
    //Скрытие по статусам (сделки)
    hidden_statuses: z.array(hiddenStatusSchema).optional(),
    //Связанные списки (chained_list, сделки и покупатели)
    chained_lists: z.array(chainedListSchema).nullable().optional(),
    //Callback для tracking_data
    tracking_callback: z.string().optional(),
    //Поиск для linked_entity
    search_in: z.string().nullable().optional(),
    _links: z
        .object({
            self: amoLinkHrefSchema,
        })
        .optional(),
})

export const getCustomFieldsResponseSchema = z.object({
    _total_items: z.number(),
    _page: z.number(),
    _page_count: z.number(),
    _links: z.object({
        self: amoLinkHrefSchema,
        next: amoLinkHrefSchema.optional(),
        last: amoLinkHrefSchema.optional(),
    }),
    _embedded: z.object({
        custom_fields: z.array(customFieldSchema),
    }),
})

export type GetCustomFieldsResponse = z.infer<typeof getCustomFieldsResponseSchema>
