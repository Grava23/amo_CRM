import { AmoClient } from "./client.js";
import { SubscribeRequest } from "./request/webhooks.js";

export function createWebhooksAPI(client: AmoClient) {
    return {
        async subscribe(domain: string, accessToken: string, body: SubscribeRequest) {
            const url = new URL(`https://${domain}/api/v4/webhooks`)

            const request = new Request(url, {
                method: "POST",
                body: JSON.stringify(body),
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            })

            await client.request<void>(request)
        }
    }
}