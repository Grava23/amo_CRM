import type { AmoClient } from "./client.js"
import type { GetUserByIDParams } from "./request/users.js"
import type { GetUserByIDResponse } from "./response/users.js"

export function createUsersAPI(client: AmoClient) {
    return {
        async getUserByID(domain: string, accessToken: string, userID: number, params: GetUserByIDParams): Promise<GetUserByIDResponse> {
            const url = new URL(`https://${domain}/api/v4/users/${userID}`)

            if (params.with) {
                url.searchParams.set("with", params.with.join(","))
            }

            const request = new Request(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Accept": "application/json",
                },
            })

            const response = await client.request<GetUserByIDResponse>(request)
            return response
        }
    }
}