import { PrismaClient } from "../../generated/prisma/client.js";

export class IntegrationRepo {
    constructor(private prisma: PrismaClient) { }

    async updateIntegrationActive(domain: string, active: boolean) {
        return await this.prisma.integrations.update({
            where: { domain, deleted_at: null },
            data: { active },
        })
    }
}