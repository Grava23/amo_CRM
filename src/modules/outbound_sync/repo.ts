import { PrismaClient, type Prisma } from "../../generated/prisma/client.js"
import type { outbound_sync_configModel } from "../../generated/prisma/models/outbound_sync_config.js"

const CONFIG_ID = "default"

export class OutboundSyncRepo {
    constructor(private prisma: PrismaClient) { }

    async getOrCreateConfig(): Promise<outbound_sync_configModel> {
        return await this.prisma.outbound_sync_config.upsert({
            where: { id: CONFIG_ID },
            create: { id: CONFIG_ID },
            update: {},
        })
    }

    async updateConfig(data: Prisma.outbound_sync_configUpdateInput): Promise<outbound_sync_configModel> {
        await this.getOrCreateConfig()
        return await this.prisma.outbound_sync_config.update({
            where: { id: CONFIG_ID },
            data,
        })
    }

    async recordSuccess(sentAt: Date): Promise<void> {
        await this.prisma.outbound_sync_config.update({
            where: { id: CONFIG_ID },
            data: { last_sent_at: sentAt, last_error: null },
        })
    }

    async recordFailure(message: string): Promise<void> {
        await this.prisma.outbound_sync_config.update({
            where: { id: CONFIG_ID },
            data: { last_error: message.slice(0, 2000) },
        })
    }
}
