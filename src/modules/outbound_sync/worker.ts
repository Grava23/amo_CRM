import { logger } from "../../logger.js"
import type { PrismaClient } from "../../generated/prisma/client.js"
import { buildOutboundPayload } from "./payload.js"
import { OutboundSyncRepo } from "./repo.js"
import { gzipSync } from "node:zlib"

type StartArgs = {
    prisma: PrismaClient
    /** Как часто проверять БД и дедлайн отправки */
    tickMs?: number
}

export function startOutboundSyncWorker({ prisma, tickMs = 10_000 }: StartArgs) {
    const outboundRepo = new OutboundSyncRepo(prisma)

    const tick = async () => {
        try {
            const cfg = await outboundRepo.getOrCreateConfig()
            if (!cfg.enabled || cfg.target_url.trim() === "") return

            const now = Date.now()
            const last = cfg.last_sent_at
            const intervalElapsed =
                last === null || now >= last.getTime() + cfg.interval_ms
            // После сбоя last_sent_at не трогаем — иначе «следующая попытка» уедет на целый интервал
            const retryAfterFailure = cfg.last_error !== null
            if (!intervalElapsed && !retryAfterFailure) return

            const payload = await buildOutboundPayload(prisma)
            logger.debug("payload", { payload: payload })

            const sentAt = new Date(payload.sent_at)
            const bodyJson = JSON.stringify(payload)
            const bodyGzip = gzipSync(Buffer.from(bodyJson, "utf8"))
            logger.debug("gzip body", { body: bodyGzip })

            const headers: Record<string, string> = {
                "Content-Type": "application/json",
                "Content-Encoding": "gzip",
            }
            if (cfg.api_key) {
                headers["Authorization"] = `Bearer ${cfg.api_key}`
            }

            logger.debug("OutboundSync — prepared payload", {
                json_bytes: Buffer.byteLength(bodyJson, "utf8"),
                gzip_bytes: bodyGzip.byteLength,
            })

            const res = await fetch(cfg.target_url, {
                method: "POST",
                headers,
                body: bodyGzip,
                signal: AbortSignal.timeout(120_000),
            })

            if (!res.ok) {
                const text = await res.text().catch(() => "")
                await outboundRepo.recordFailure(`HTTP ${res.status}: ${text.slice(0, 500)}`)
                logger.error("OutboundSync — ответ цели не OK", { status: res.status })
                return
            }

            await outboundRepo.recordSuccess(sentAt)
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            logger.error("OutboundSync — тик не удался", { message })
            try {
                await outboundRepo.recordFailure(message)
            } catch {
                /* ignore */
            }
        }
    }

    void tick()
    const timer = setInterval(() => void tick(), tickMs)

    return () => clearInterval(timer)
}
