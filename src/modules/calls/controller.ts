import { FastifyRequest, FastifyReply } from "fastify"
import { CallsRepo } from "./repo.js"

function firstQueryValue(v: unknown): string | undefined {
    if (v === undefined) return undefined
    if (Array.isArray(v)) return v[0]
    return String(v)
}

function parseNonNegativeInt(raw: string | undefined, fallback: number): number {
    if (raw === undefined || raw === "") return fallback
    const n = Number.parseInt(raw, 10)
    return Number.isFinite(n) && n >= 0 ? n : fallback
}

export async function getCallsController(req: FastifyRequest, reply: FastifyReply) {
    const q = req.query as Record<string, unknown>
    const limit = parseNonNegativeInt(firstQueryValue(q.limit), 100)
    const offset = parseNonNegativeInt(firstQueryValue(q.offset), 0)

    const repo = new CallsRepo(req.server.prisma)
    const calls = await repo.getCalls(limit, offset)

    return reply.status(200).send({
        data: calls,
        limit,
        offset,
    })
}