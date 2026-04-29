import type { FastifyReply, FastifyRequest } from "fastify"
import { AuthRepo } from "./repo.js"
import { AuthService } from "./service.js"
import { CompleteOauthQuery } from "./schema.js"

export async function startOauthController(req: FastifyRequest, reply: FastifyReply) {
  const repo = new AuthRepo(req.server.prisma)
  const service = new AuthService(repo, req.server.amoClient)

  try {
    const authorizeUrl = await service.start()

    return await reply.redirect(authorizeUrl)
  } catch (error) {
    return await reply.status(500).send({
      message: "Internal server error",
      error: (error as Error).message
    })
  }
}

export async function completeOauthController(req: FastifyRequest<{ Querystring: CompleteOauthQuery }>, reply: FastifyReply) {
  const { state, code, referer } = req.query
  const repo = new AuthRepo(req.server.prisma)
  const service = new AuthService(repo, req.server.amoClient)

  void service.completeOauth(state, code, referer).catch((error) => {
    req.log.error({ error }, "completeOauthController - background processing failed")
  })

  return reply.status(202).send({ message: "Accepted" })
}