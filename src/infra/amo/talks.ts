import { AmoClient } from "./client.js";
import { GetTalkResponse } from "./response/talks.js";

export function createTalksAPI(client: AmoClient) {
    return {
        async getTalk(domain: string, accessToken: string, talkID: number): Promise<GetTalkResponse> {
            const url = new URL(`https://${domain}/api/v4/talks/${talkID}`)

            const request = new Request(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Accept": "application/json",
                },
            })

            const response = await client.request<GetTalkResponse>(request)
            return response
        }
    }
}