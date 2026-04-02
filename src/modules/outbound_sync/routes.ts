import type { FastifyPluginAsync } from "fastify"
import { getOutboundSyncController, patchOutboundSyncController } from "./controller.js"
import { patchOutboundSyncSchema } from "./schema.js"

const outboundSyncRoutes: FastifyPluginAsync = async (app) => {
    app.get("/", getOutboundSyncController)
    app.patch(
        "/",
        {
            schema: {
                body: patchOutboundSyncSchema,
            },
        },
        patchOutboundSyncController,
    )
}

export default outboundSyncRoutes
