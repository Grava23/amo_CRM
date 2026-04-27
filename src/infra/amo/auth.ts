import type { AmoClient } from "./client.js"
import { GetAccessTokenRequest, RefreshTokenRequest } from "./request/auth.js"
import { GetAccessTokenResponse } from "./response/auth.js"
import { config } from "../../config.js"

export function createAuthAPI(client: AmoClient) {
    return {
        async getAccessToken(code: string, domain: string): Promise<GetAccessTokenResponse> {
            const url = new URL(`https://${domain}/oauth2/access_token`)

            const body: GetAccessTokenRequest = {
                client_id: config.AMO_CLIENT_ID,
                client_secret: config.AMO_CLIENT_SECRET,
                grant_type: "authorization_code",
                code: code,
                redirect_uri: config.AMO_REDIRECT_URI,
            }

            const request = new Request(url, {
                method: "POST",
                body: JSON.stringify(body),
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            })

            const response = await client.request<GetAccessTokenResponse>(request)

            return response
        },

        async refreshToken(refreshToken: string, domain: string): Promise<GetAccessTokenResponse> {
            const url = new URL(`https://${domain}/oauth2/access_token`)

            const body: RefreshTokenRequest = {
                client_id: config.AMO_CLIENT_ID,
                client_secret: config.AMO_CLIENT_SECRET,
                grant_type: "refresh_token",
                refresh_token: refreshToken,
                redirect_uri: config.AMO_REDIRECT_URI,
            }

            const request = new Request(url, {
                method: "POST",
                body: JSON.stringify(body),
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            })

            const response = await client.request<GetAccessTokenResponse>(request)

            return response
        }
    }
}