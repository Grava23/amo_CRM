import { AmoClient } from "./client.js"
import { GetLeadParams, GetLeadsParams } from "./request/leads.js"
import { GetLeadResponse, GetLeadsResponse } from "./response/leads.js"

export function createLeadAPI(client: AmoClient) {
    return {
        async getLeads(domain: string, accessToken: string, query: GetLeadsParams): Promise<GetLeadsResponse> {
            const url = new URL(`https://${domain}/api/v4/leads`)

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

            const response = await client.request<GetLeadsResponse>(request)
            return response
        },

        async getLead(domain: string, accessToken: string, id: number, query: GetLeadParams): Promise<GetLeadResponse> {
            const url = new URL(`https://${domain}/api/v4/leads/${id}`)

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

            const response = await client.request<GetLeadResponse>(request)
            return response
        }
    }
}