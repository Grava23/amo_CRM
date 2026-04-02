import type { FastifyReply, FastifyRequest } from "fastify"
import type { Prisma } from "../../generated/prisma/client.js"
import { OutboundSyncRepo } from "./repo.js"
import type { PatchOutboundSyncBody } from "./schema.js"

function computeNextRunAt(params: {
    enabled: boolean
    interval_ms: number
    last_sent_at: Date | null
    last_error: string | null
}): string | null {
    if (!params.enabled) return null
    if (params.last_error) return new Date().toISOString()
    if (params.last_sent_at === null) return new Date().toISOString()
    return new Date(params.last_sent_at.getTime() + params.interval_ms).toISOString()
}

export async function getOutboundSyncController(req: FastifyRequest, reply: FastifyReply) {
    const repo = new OutboundSyncRepo(req.server.prisma)
    const c = await repo.getOrCreateConfig()

    return reply.status(200).send({
        enabled: c.enabled,
        interval_ms: c.interval_ms,
        target_url: c.target_url,
        has_api_key: Boolean(c.api_key),
        last_sent_at: c.last_sent_at?.toISOString() ?? null,
        last_error: c.last_error,
        next_run_at: computeNextRunAt({
            enabled: c.enabled,
            interval_ms: c.interval_ms,
            last_sent_at: c.last_sent_at,
            last_error: c.last_error,
        }),
    })
}

export async function patchOutboundSyncController(
    req: FastifyRequest<{ Body: PatchOutboundSyncBody }>,
    reply: FastifyReply,
) {
    const repo = new OutboundSyncRepo(req.server.prisma)
    const b = req.body

    const data: Prisma.outbound_sync_configUpdateInput = {}
    if (b.enabled !== undefined) data.enabled = b.enabled
    if (b.interval_ms !== undefined) data.interval_ms = b.interval_ms
    if (b.target_url !== undefined) data.target_url = b.target_url
    if (b.api_key !== undefined) data.api_key = b.api_key

    if (Object.keys(data).length === 0) {
        return reply.status(400).send({ error: "Пустое тело: укажите хотя бы одно поле" })
    }

    const updated = await repo.updateConfig(data)

    return reply.status(200).send({
        enabled: updated.enabled,
        interval_ms: updated.interval_ms,
        target_url: updated.target_url,
        has_api_key: Boolean(updated.api_key),
        last_sent_at: updated.last_sent_at?.toISOString() ?? null,
        last_error: updated.last_error,
        next_run_at: computeNextRunAt({
            enabled: updated.enabled,
            interval_ms: updated.interval_ms,
            last_sent_at: updated.last_sent_at,
            last_error: updated.last_error,
        }),
    })
}
