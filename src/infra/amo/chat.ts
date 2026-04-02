import { logger } from "../../logger.js";
import { AmoClient } from "./client.js";
import { GetChatsParams } from "./request/chat.js";
import { GetMessageHistoryResponse } from "./response/chat.js";

export function createChatAPI(client: AmoClient) {
    return {
        async connectChatChannel(channelID: string): Promise<string> {
            const url = new URL(`https://amojo.amocrm.ru/v2/origin/custom/${channelID}/connect`)

            let request = new Request(url, {
                method: "POST",
            })

            try {
                request = await client.setChatAPIHeaders(request)
            } catch (error) {
                logger.error("ChatAPI - connectChatChannel - setChatAPIHeaders", { error: error as Error })
                throw new Error(`ChatAPI - connectChatChannel - setChatAPIHeaders: ${error as Error}`)
            }

            const response = await client.request<{ scope_id: string }>(request)
            return response.scope_id
        },

        async getMessageHistory(scopeID: string, conversationID: string, params: GetChatsParams): Promise<GetMessageHistoryResponse> {
            const url = new URL(`https://amojo.amocrm.ru/v2/origin/custom/${scopeID}/chats/${conversationID}/history`)

            if (params.offset) {
                url.searchParams.set("offset", params.offset.toString())
            }

            if (params.limit) {
                url.searchParams.set("limit", params.limit.toString())
            }

            let request = new Request(url, {
                method: "GET",
            })

            try {
                request = await client.setChatAPIHeaders(request)
            } catch (error) {
                logger.error("ChatAPI - getMessageHistory - setChatAPIHeaders", { error: error as Error })
                throw new Error(`ChatAPI - getMessageHistory - setChatAPIHeaders: ${error as Error}`)
            }

            const response = await client.request<GetMessageHistoryResponse>(request)
            return response
        }
    }
}