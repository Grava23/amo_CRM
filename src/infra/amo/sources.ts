import { AmoClient } from "./client.js";
import { GetSourcesResponse } from "./response/sources.js";

export function createSourcesAPI(client: AmoClient) {
    return {
        async getSources(domain: string, accessToken: string, externalIDs: string[] = []): Promise<GetSourcesResponse> {
            const url = new URL(`https://${domain}/api/v4/sources`)

            if (externalIDs.length > 0) {
                url.searchParams.set("filter[external_id]", externalIDs.join(","))
            }

            const request = new Request(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Accept": "application/json",
                },
            })

            const response = await client.request<GetSourcesResponse>(request)
            return response
        }
    }
}