import { FastifyRequest, FastifyReply } from "fastify";
import { UpdateIntegrationActiveParams, UpdateIntegrationActiveRequest } from "./schema.js";
import { IntegrationRepo } from "./repo.js";
import { logger } from "../../logger.js";

export async function updateIntegrationActiveController(req: FastifyRequest<{ Params: UpdateIntegrationActiveParams, Body: UpdateIntegrationActiveRequest }>, reply: FastifyReply) {
    const { domain } = req.params
    const { active } = req.body

    const repo = new IntegrationRepo(req.server.prisma)

    try {
        await repo.updateIntegrationActive(domain, active)
    } catch (error) {
        throw new Error(`updateIntegrationActiveController - updateIntegrationActive - updateIntegrationActive: ${error as Error}`)
    }

    return reply.status(200).send({ message: "Integration active updated" })
}