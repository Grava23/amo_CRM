import type { AmoClient } from "./client.js"
import type { GetCustomFieldsParams } from "./request/custom_fields.js"
import type { GetCustomFieldsResponse } from "./response/custom_fields.js"

export function createCustomFieldsAPI(client: AmoClient) {
    return {
        async getCustomFields(domain: string, accessToken: string, entityType: "leads" | "contacts" | "companies" | "customers" | "segments", params: GetCustomFieldsParams) {
            const url = new URL(`https://${domain}/api/v4/${entityType}/custom_fields`)

            if (params.page) {
                url.searchParams.set("page", params.page.toString())
            }

            if (params.limit) {
                url.searchParams.set("limit", params.limit.toString())
            }

            if (params.types) {
                url.searchParams.set("types", params.types.join(","))
            }

            const request = new Request(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Accept": "application/json",
                },
            })

            const response = await client.request<GetCustomFieldsResponse>(request)
            return response
        }
    }
}