import type { PrismaClient } from "../generated/prisma/client.js"
import type { AmoClient } from "../infra/amo/client.js"

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient
    amoClient: AmoClient
  }
}

