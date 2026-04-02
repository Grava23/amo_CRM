import { logger } from "../../logger.js"
import { config } from "../../config.js"
import { createAuthAPI } from "./auth.js"
import { createAccountAPI } from "./account.js"
import { createHash, createHmac } from "crypto"
import { createChatAPI } from "./chat.js"
import { createContactAPI } from "./contact.js"
import { createSourcesAPI } from "./sources.js"
import { createWebhooksAPI } from "./webhooks.js"
import { createLeadAPI } from "./leads.js"
import { createTalksAPI } from "./talks.js"
import { createNotesAPI } from "./notes.js"
import { createCustomFieldsAPI } from "./custom_fields.js"
import { createUsersAPI } from "./users.js"

export class AmoClient {
    public readonly auth = createAuthAPI(this)
    public readonly account = createAccountAPI(this)
    public readonly chat = createChatAPI(this)
    public readonly contact = createContactAPI(this)
    public readonly sources = createSourcesAPI(this)
    public readonly webhooks = createWebhooksAPI(this)
    public readonly leads = createLeadAPI(this)
    public readonly talks = createTalksAPI(this)
    public readonly notes = createNotesAPI(this)
    public readonly customFields = createCustomFieldsAPI(this)
    public readonly users = createUsersAPI(this)

    private limiter: RateLimiter
    private breaker: CircuitBreaker

    constructor(
        private retries = config.AMO_CLIENT_RETRY_ATTEMPTS,
        private baseDelay = config.AMO_CLIENT_BASE_DELAY_MS,
        private rps = config.AMO_CLIENT_RPS
    ) {
        this.limiter = new RateLimiter(this.rps)
        this.breaker = new CircuitBreaker()
    }

    async request<T>(
        request: Request
    ): Promise<T> {
        logger.info(`HTTP request`, {
            url: request.url,
            method: request.method,
            headers: request.headers,
        })

        for (let attempt = 1; attempt <= this.retries; attempt++) {
            logger.info(`HTTP request attempt`, {
                url: request.url,
                method: request.method,
                attempt: `${attempt}/${this.retries}`,
            })

            try {
                return await this.limiter.schedule(async (): Promise<T> => {
                    return await this.breaker.exec(async (): Promise<T> => {
                        const res = await fetch(request)

                        const text = await res.text()

                        if (!res.ok) {
                            const status = res.status

                            logger.error(`HTTP request failed`, {
                                url: request.url,
                                method: request.method,
                                status,
                                statusText: res.statusText,
                                text
                            })

                            // 4xx — не ретраим, сразу выбрасываем наружу
                            if (status >= 400 && status < 500) {
                                throw new Error(`HTTP ${status}: ${text}`)
                            }

                            // 5xx — даём шанс ретраям
                            throw new Error(`HTTP ${status}: ${text}`)
                        }

                        logger.info(`HTTP request successful`, {
                            url: request.url,
                            method: request.method,
                            status: res.status,
                            statusText: res.statusText,
                            text
                        })

                        // 204 No Content или пустое тело — возвращаем undefined/null как T
                        if (res.status === 204 || text.trim().length === 0) {
                            return undefined as T
                        }

                        try {
                            return JSON.parse(text) as T
                        } catch {
                            // если не JSON, возвращаем как есть
                            return text as unknown as T
                        }
                    })
                })
            } catch (error) {
                logger.error(`HTTP request error`, {
                    url: request.url,
                    method: request.method,
                    error: error
                })

                // для ошибок 4xx и "Circuit breaker open" ретраи бессмысленны
                const message = (error as Error)?.message ?? ""
                const isClientError =
                    message.startsWith("HTTP 4") // HTTP 4xx
                const isCircuitOpen =
                    message.includes("Circuit breaker open")

                if (isClientError || isCircuitOpen || attempt >= this.retries) {
                    logger.error(`HTTP request failed after retries`, {
                        url: request.url,
                        method: request.method,
                        attempt,
                        retries: this.retries,
                        error: error
                    })

                    throw error
                }
            }

            const delay = this.baseDelay * Math.pow(2, attempt - 1)

            logger.info(`HTTP request delay`, {
                url: request.url,
                method: request.method,
                delay: delay
            })

            await new Promise(resolve => setTimeout(resolve, delay))
        }

        // Теоретически недостижимо, но нужно для TypeScript,
        // чтобы гарантировать, что функция всегда что-то возвращает/выбрасывает
        throw new Error("HTTP request failed: no result after retry loop")
    }

    async setChatAPIHeaders(request: Request): Promise<Request> {
        const clone = request.clone()
        const bodyText = await clone.text()

        const date = new Date().toUTCString()

        const bodyHash = createHash("md5")
            .update(bodyText)
            .digest("base64")

        const url = new URL(request.url)
        const path = url.pathname

        const signatureString = `${request.method}\n${bodyHash}\napplication/json\n${date}\n${path}`

        const signature = createHmac("sha1", config.AMO_CLIENT_SECRET)
            .update(signatureString)
            .digest("base64")

        request.headers.set("Content-Type", "application/json")
        request.headers.set("Date", date)
        request.headers.set("Content-MD5", bodyHash)
        request.headers.set("X-Signature", signature)

        return request
    }
}

class RateLimiter {

    private timestamps: number[] = []

    constructor(
        private maxPerSecond = 5
    ) { }

    async schedule<T>(fn: () => Promise<T>): Promise<T> {

        while (true) {
            const now = Date.now()

            // очищаем старые отметки старше 1 секунды
            this.timestamps = this.timestamps.filter(ts => now - ts < 1000)

            if (this.timestamps.length < this.maxPerSecond) {
                this.timestamps.push(now)
                break
            }

            const earliest = this.timestamps[0]
            const wait = Math.max(0, 1000 - (now - (earliest ?? 0)))
            await new Promise(resolve => setTimeout(resolve, wait))
        }

        return await fn()
    }
}

class CircuitBreaker {

    private failures = 0
    private lastFailure = 0
    private state: "closed" | "open" = "closed"

    constructor(
        private threshold = 5,
        private cooldown = 10000
    ) { }

    async exec<T>(fn: () => Promise<T>): Promise<T> {

        if (this.state === "open") {

            if (Date.now() - this.lastFailure > this.cooldown) {
                this.state = "closed"
                this.failures = 0
            } else {
                throw new Error("Circuit breaker open")
            }
        }

        try {

            const res = await fn()

            this.failures = 0

            return res

        } catch (err) {

            this.failures++
            this.lastFailure = Date.now()

            if (this.failures >= this.threshold) {
                this.state = "open"
            }

            throw err
        }
    }
}