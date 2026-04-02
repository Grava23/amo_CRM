import { AmoClient } from "./client.js";
import { GetNotesParams } from "./request/notes.js";
import { GetCallNotesResponse } from "./response/notes.js";

export function createNotesAPI(client: AmoClient) {
    return {
        async getNotesByEntityTypeAndID(domain: string, accessToken: string, entityType: string, entityID: number, query: GetNotesParams): Promise<GetCallNotesResponse> {
            const url = new URL(`https://${domain}/api/v4/${entityType}/${entityID}/notes`)

            if (query.page) {
                url.searchParams.set("page", query.page.toString())
            }

            if (query.limit) {
                url.searchParams.set("limit", query.limit.toString())
            }

            if (query.filter?.id) {
                if (Array.isArray(query.filter.id)) {
                    url.searchParams.set("filter[id]", query.filter.id.join(","))
                } else {
                    url.searchParams.set("filter[id]", query.filter.id.toString())
                }
            }

            if (query.filter?.note_type) {
                if (Array.isArray(query.filter.note_type)) {
                    url.searchParams.set("filter[note_type]", query.filter.note_type.join(","))
                } else {
                    url.searchParams.set("filter[note_type]", query.filter.note_type.toString())
                }
            }

            if (query.filter?.updated_at) {
                if (typeof query.filter.updated_at === "number") {
                    url.searchParams.set("filter[updated_at]", query.filter.updated_at.toString())
                } else {
                    url.searchParams.set("filter[updated_at][from]", query.filter.updated_at.from?.toString() ?? "")
                    url.searchParams.set("filter[updated_at][to]", query.filter.updated_at.to?.toString() ?? "")
                }
            }

            if (query.order) {
                if (query.order.updated_at) {
                    url.searchParams.set("order[updated_at]", query.order.updated_at)
                }
                if (query.order.id) {
                    url.searchParams.set("order[id]", query.order.id)
                }
            }

            if (query.with) {
                url.searchParams.set("with", query.with.toString())
            }

            const request = new Request(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Accept": "application/json",
                },
            })

            const response = await client.request<GetCallNotesResponse>(request)
            return response
        }
    }
}