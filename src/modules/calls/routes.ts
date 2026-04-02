import type { FastifyPluginAsync } from "fastify"
import { getCallsController } from "./controller.js"

const callsRoutes: FastifyPluginAsync = async (app) => {
    app.get("/", getCallsController)
}

export default callsRoutes