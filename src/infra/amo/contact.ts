import { AmoClient } from "./client.js";
import { GetContactListParams, GetContactParams } from "./request/contact.js";
import { GetContactListResponse, GetContactResponse } from "./response/contact.js";

export function createContactAPI(client: AmoClient) {
    return {
        async getContacts(domain: string, accessToken: string, query: GetContactListParams): Promise<GetContactListResponse> {
            const url = new URL(`https://${domain}/api/v4/contacts`)

            if (query.with) {
                url.searchParams.set("with", query.with.join(","))
            }

            if (query.page) {
                url.searchParams.set("page", query.page.toString())
            }

            if (query.limit) {
                url.searchParams.set("limit", query.limit.toString())
            }

            if (query.query) {
                url.searchParams.set("query", query.query.toString())
            }

            const request = new Request(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Accept": "application/json",
                },
            })

            const response = await client.request<GetContactListResponse>(request)
            return response
        },

        async getContact(domain: string, accessToken: string, id: number, query: GetContactParams): Promise<GetContactResponse> {
            const url = new URL(`https://${domain}/api/v4/contacts/${id}`)

            if (query.with) {
                url.searchParams.set("with", query.with.join(","))
            }

            const request = new Request(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Accept": "application/json",
                },
            })

            const response = await client.request<GetContactResponse>(request)
            return response
        }
    }
}