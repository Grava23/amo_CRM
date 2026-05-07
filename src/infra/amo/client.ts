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
        // `fetch()` consumes the Request body stream. Since we retry, keep an unused
        // template and clone it for each attempt.
        const baseRequest = request.clone()

        logger.info(`HTTP request`, {
            url: request.url,
            method: request.method,
            headers: request.headers,
        })

        for (let attempt = 1; attempt <= this.retries; attempt++) {
            logger.debug(`HTTP request attempt`, {
                url: request.url,
                method: request.method,
                attempt: `${attempt}/${this.retries}`,
            })

            try {
                return await this.limiter.schedule(async (): Promise<T> => {
                    const hostKey = new URL(request.url).host
                    return await this.breaker.exec(hostKey, async (): Promise<T> => {
                        const requestForAttempt = baseRequest.clone()
                        const res = await fetch(requestForAttempt)

                        const text = await res.text()

                        if (!res.ok) {
                            const status = res.status

                            logger.error(`HTTP request failed`, {
                                url: requestForAttempt.url,
                                method: requestForAttempt.method,
                                status,
                                statusText: res.statusText,
                                text
                            })

                            // 4xx — не ретраим, сразу выбрасываем наружу
                            if (status >= 400 && status < 500) {
                                // amoCRM иногда валидирует destination через DNS и может временно не разрезолвить хост
                                // (типичный кейс: "The host could not be resolved."). Такой 4xx имеет смысл ретраить.
                                const isRetriableResolveError =
                                    status === 400 && /host could not be resolved/i.test(text)
                                if (isRetriableResolveError) {
                                    throw new Error(`HTTP_RETRYABLE_${status}: ${text}`)
                                }
                                throw new Error(`HTTP ${status}: ${text}`)
                            }

                            // 5xx — даём шанс ретраям
                            throw new Error(`HTTP ${status}: ${text}`)
                        }

                        logger.debug(`HTTP request successful`, {
                            url: requestForAttempt.url,
                            method: requestForAttempt.method,
                            status: res.status,
                            statusText: res.statusText
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
            } catch (error: any) {
                logger.error(`HTTP request error`, {
                    url: request.url,
                    method: request.method,
                    error: error?.message
                })

                // для ошибок 4xx и "Circuit breaker open" ретраи бессмысленны
                const message = (error as Error)?.message ?? ""
                const isClientError =
                    message.startsWith("HTTP 4") // HTTP 4xx
                const isRetriableClientError =
                    message.startsWith("HTTP_RETRYABLE_4") ||
                    /host could not be resolved/i.test(message)
                const isCircuitOpen =
                    message.includes("Circuit breaker open")

                if ((isClientError && !isRetriableClientError) || isCircuitOpen || attempt >= this.retries) {
                    logger.error(`HTTP request failed after retries`, {
                        url: request.url,
                        method: request.method,
                        attempt,
                        retries: this.retries,
                        error: error?.message
                    })

                    throw error
                }
            }

            const delay = this.baseDelay * Math.pow(2, attempt - 1)

            logger.debug(`HTTP request delay`, {
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
            .digest("hex")

        const url = new URL(request.url)
        const path = url.pathname

        const signatureString = `${request.method}\n${bodyHash}\napplication/json\n${date}\n${path}`

        const signature = createHmac("sha1", config.AMO_CHANNEL_SECRET)
            .update(signatureString)
            .digest("hex")

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

    private states = new Map<string, { failures: number; lastFailure: number; state: "closed" | "open" }>()
    private callsSinceSweep = 0

    constructor(
        private threshold = 5,
        private cooldown = 10000,
        private stateTtlMs = 30 * 60 * 1000, // 30 минут
        private sweepEveryCalls = 200
    ) { }

    private getState(key: string) {
        let s = this.states.get(key)
        if (!s) {
            s = { failures: 0, lastFailure: 0, state: "closed" }
            this.states.set(key, s)
        }
        return s
    }

    private sweepStates(now = Date.now()) {
        for (const [key, s] of this.states) {
            const isIdle = now - s.lastFailure > this.stateTtlMs
            const isHealthy = s.state === "closed" && s.failures === 0
            if (isIdle && isHealthy) {
                this.states.delete(key)
            }
        }
    }

    private isRetriableFailure(err: unknown): boolean {
        const msg = (err as any)?.message ? String((err as any).message) : ""
        // Не считаем 4xx "поломкой сервиса": они обычно постоянные (403/400) и не должны открывать брейкер.
        if (msg.startsWith("HTTP 4")) return false

        // 429/5xx/сеть — временные, их можно считать сигналом для брейкера.
        if (msg.startsWith("HTTP 5")) return true
        if (msg.startsWith("HTTP 429")) return true
        if (msg.startsWith("HTTP_RETRYABLE_")) return true

        // node-fetch/undici/network ошибки часто приходят без "HTTP NNN"
        if (/ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|fetch failed/i.test(msg)) return true

        return false
    }

    async exec<T>(key: string, fn: () => Promise<T>): Promise<T> {
        this.callsSinceSweep++
        if (this.callsSinceSweep >= this.sweepEveryCalls) {
            this.callsSinceSweep = 0
            this.sweepStates()
        }

        const s = this.getState(key)

        if (s.state === "open") {

            if (Date.now() - s.lastFailure > this.cooldown) {
                s.state = "closed"
                s.failures = 0
            } else {
                throw new Error("Circuit breaker open")
            }
        }

        try {

            const res = await fn()

            s.failures = 0

            return res

        } catch (err) {

            if (this.isRetriableFailure(err)) {
                s.failures++
                s.lastFailure = Date.now()

                if (s.failures >= this.threshold) {
                    s.state = "open"
                }
            }

            throw err
        }
    }
}