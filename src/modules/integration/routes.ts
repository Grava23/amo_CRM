import type { FastifyPluginAsync } from "fastify"
import { updateIntegrationActiveController } from "./controller.js";
import { updateIntegrationActiveParamsSchema, updateIntegrationActiveRequestSchema } from "./schema.js";

const integrationRoutes: FastifyPluginAsync = async (app) => {
    app.patch("/:domain/active",
        {
            schema:
            {
                params: updateIntegrationActiveParamsSchema, body: updateIntegrationActiveRequestSchema
            }
        },
        updateIntegrationActiveController
    )
}

export default integrationRoutes