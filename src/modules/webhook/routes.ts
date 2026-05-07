import type { FastifyPluginAsync } from "fastify"
import { addContactWebhookBodySchema, updateContactWebhookBodySchema, deleteContactWebhookBodySchema, addTalkWebhookBodySchema, addLeadWebhookBodySchema, updateLeadWebhookBodySchema, deleteLeadWebhookBodySchema, restoreLeadWebhookBodySchema, addMessageWebhookBodySchema, addNoteWebhookBodySchema } from "./schema.js"
import { addContactWebhookController, outgoingMessageWebhookController, handleUpdateContactWebhookController, handleRestoreContactWebhookController, handleAddTalkWebhookController, handleAddLeadWebhookController, handleAddNoteWebhookController, handleDeleteContactWebhookController, handleUpdateLeadWebhookController, handleDeleteLeadWebhookController, handleRestoreLeadWebhookController, handleAddMessageWebhookController } from "./controller.js"

const webhookRoutes: FastifyPluginAsync = async (app) => {
    app.post("/:scope_id",
        {
            // schema:
            // {
            //     params: incomingMessageWebhookParamsSchema,
            //     body: incomingMessageWebhookBodySchema
            // }
        },
        outgoingMessageWebhookController
    )
    app.post("/contacts/add",
        {
            schema:
            {
                body: addContactWebhookBodySchema
            }
        },
        addContactWebhookController
    )
    //* на update_responsible нет смысла подписываться, то же самое приходит в update
    app.post("/contacts/update",
        {
            schema:
            {
                body: updateContactWebhookBodySchema
            }
        },
        handleUpdateContactWebhookController
    )
    app.post("/contacts/delete",
        {
            schema:
            {
                body: deleteContactWebhookBodySchema
            }
        },
        handleDeleteContactWebhookController
    )
    app.post("/contacts/restore",
        {
            schema:
            {
                body: deleteContactWebhookBodySchema
            }
        },
        handleRestoreContactWebhookController
    )
    app.post("/leads/add",
        {
            schema:
            {
                body: addLeadWebhookBodySchema
            }
        },
        handleAddLeadWebhookController
    )
    //* на status_update и responsible_user_id нет смысла подписываться, то же самое приходит в update
    app.post("/leads/update",
        {
            schema:
            {
                body: updateLeadWebhookBodySchema
            }
        },
        handleUpdateLeadWebhookController
    )
    app.post("/leads/delete",
        {
            schema:
            {
                body: deleteLeadWebhookBodySchema
            }
        },
        handleDeleteLeadWebhookController
    )
    app.post("/leads/restore",
        {
            schema:
            {
                body: restoreLeadWebhookBodySchema
            }
        },
        handleRestoreLeadWebhookController
    )
    app.post("/leads/note",
        {
            schema:
            {
                body: addNoteWebhookBodySchema
            }
        },
        handleAddNoteWebhookController
    )
    app.post("/talks/add",
        {
            schema:
            {
                body: addTalkWebhookBodySchema
            }
        },
        handleAddTalkWebhookController
    )
    app.post("/messages/add",
        {
            schema:
            {
                body: addMessageWebhookBodySchema
            }
        },
        handleAddMessageWebhookController
    )
}

export default webhookRoutes