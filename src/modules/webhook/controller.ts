import { FastifyRequest } from "fastify";
import { AddLeadWebhookBody, AddTalkWebhookBody, DeleteContactWebhookBody, DeleteLeadWebhookBody, IncomingMessageWebhookBody, IncomingMessageWebhookParams, RestoreLeadWebhookBody, UpdateLeadWebhookBody } from "./schema.js";
import { FastifyReply } from "fastify";
import { WebhookService } from "./service.js"
import { WebhookRepo } from "./repo.js";
import { AddContactWebhookBody } from "./schema.js";
import { UpdateContactWebhookBody } from "./schema.js";
import { logger } from "../../logger.js";

export async function outgoingMessageWebhookController(req: FastifyRequest<{ Params: IncomingMessageWebhookParams, Body: IncomingMessageWebhookBody }>, reply: FastifyReply) {
    // const { scope_id } = req.params

    // const repo = new WebhookRepo(req.server.prisma)
    // const service = new WebhookService(repo, req.server.amoClient)

    // void service.handleOutgoingMessageWebhook(scope_id, req.body).catch((error) => {
    //     req.log.error({ error }, "outgoingMessageWebhookController - background processing failed")
    // })

    return reply.status(202).send({ message: "Accepted" })
}

export async function addContactWebhookController(req: FastifyRequest<{ Body: AddContactWebhookBody }>, reply: FastifyReply) {
    const repo = new WebhookRepo(req.server.prisma)
    const service = new WebhookService(repo, req.server.amoClient)

    void service.handleAddContactWebhook(req.body).catch((error) => {
        req.log.error({ error }, "addContactWebhookController - background processing failed")
    })

    return reply.status(202).send({ message: "Accepted" })
}

export async function handleUpdateContactWebhookController(req: FastifyRequest<{ Body: UpdateContactWebhookBody }>, reply: FastifyReply) {
    const repo = new WebhookRepo(req.server.prisma)
    const service = new WebhookService(repo, req.server.amoClient)

    void service.handleUpdateContactWebhook(req.body).catch((error) => {
        req.log.error({ error }, "handleUpdateContactWebhookController - background processing failed")
    })

    return reply.status(202).send({ message: "Accepted" })
}

export async function handleDeleteContactWebhookController(req: FastifyRequest<{ Body: DeleteContactWebhookBody }>, reply: FastifyReply) {
    const repo = new WebhookRepo(req.server.prisma)
    const service = new WebhookService(repo, req.server.amoClient)

    void service.handleDeleteContactWebhook(req.body).catch((error) => {
        req.log.error({ error }, "handleDeleteContactWebhookController - background processing failed")
    })

    return reply.status(202).send({ message: "Accepted" })
}

export async function handleRestoreContactWebhookController(req: FastifyRequest<{ Body: DeleteContactWebhookBody }>, reply: FastifyReply) {
    const repo = new WebhookRepo(req.server.prisma)
    const service = new WebhookService(repo, req.server.amoClient)

    void service.handleRestoreContactWebhook(req.body).catch((error) => {
        req.log.error({ error }, "handleRestoreContactWebhookController - background processing failed")
    })

    return reply.status(202).send({ message: "Accepted" })
}

export async function handleAddTalkWebhookController(req: FastifyRequest<{ Body: AddTalkWebhookBody }>, reply: FastifyReply) {
    const repo = new WebhookRepo(req.server.prisma)
    const service = new WebhookService(repo, req.server.amoClient)

    void service.handleAddTalkWebhook(req.body).catch((error) => {
        req.log.error({ error }, "handleAddTalkWebhookController - background processing failed")
    })

    return reply.status(202).send({ message: "Accepted" })
}

export async function handleAddLeadWebhookController(req: FastifyRequest<{ Body: AddLeadWebhookBody }>, reply: FastifyReply) {
    const repo = new WebhookRepo(req.server.prisma)
    const service = new WebhookService(repo, req.server.amoClient)

    void service.handleAddLeadWebhook(req.body).catch((error) => {
        req.log.error({ error }, "handleAddLeadWebhookController - background processing failed")
    })

    return reply.status(202).send({ message: "Accepted" })
}

export async function handleUpdateLeadWebhookController(req: FastifyRequest<{ Body: UpdateLeadWebhookBody }>, reply: FastifyReply) {
    const repo = new WebhookRepo(req.server.prisma)
    const service = new WebhookService(repo, req.server.amoClient)

    void service.handleUpdateLeadWebhook(req.body).catch((error) => {
        req.log.error({ error }, "handleUpdateLeadWebhookController - background processing failed")
    })

    return reply.status(202).send({ message: "Accepted" })
}

export async function handleDeleteLeadWebhookController(req: FastifyRequest<{ Body: DeleteLeadWebhookBody }>, reply: FastifyReply) {
    const repo = new WebhookRepo(req.server.prisma)
    const service = new WebhookService(repo, req.server.amoClient)

    void service.handleDeleteLeadWebhook(req.body).catch((error) => {
        req.log.error({ error }, "handleDeleteLeadWebhookController - background processing failed")
    })
}

export async function handleRestoreLeadWebhookController(req: FastifyRequest<{ Body: RestoreLeadWebhookBody }>, reply: FastifyReply) {
    const repo = new WebhookRepo(req.server.prisma)
    const service = new WebhookService(repo, req.server.amoClient)

    void service.handleRestoreLeadWebhook(req.body).catch((error) => {
        req.log.error({ error }, "handleRestoreLeadWebhookController - background processing failed")
    })
}

export async function handleAddNoteWebhookController(req: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    logger.info("handleAddNoteWebhookController - received request", { body: req.body })

    return reply.status(202).send({ message: "Accepted" })
}