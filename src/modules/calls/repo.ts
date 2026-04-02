import { PrismaClient } from "../../generated/prisma/client.js";
import { Call } from "../../models/calls.js";

export class CallsRepo {
    constructor(private prisma: PrismaClient) { }

    async getCalls(limit: number, offset: number): Promise<Call[]> {
        return await this.prisma.calls.findMany({
            take: limit,
            skip: offset,
            where: {
                deleted_at: null,
            },
        })
    }
}