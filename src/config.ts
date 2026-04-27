import dotenv from "dotenv"
import { z } from "zod"

dotenv.config()

const configSchema = z.object({
    PORT: z.coerce.number().default(8080),
    HOST: z.string().default("0.0.0.0"),
    AMO_CLIENT_RETRY_ATTEMPTS: z.coerce.number().default(3),
    AMO_CLIENT_BASE_DELAY_MS: z.coerce.number().default(200),
    AMO_CLIENT_RPS: z.coerce.number().default(7),
    AMO_OAUTH_URL: z.string().default("https://www.amocrm.ru/oauth"),
    AMO_CLIENT_ID: z.string().default(""),
    AMO_CLIENT_SECRET: z.string().default(""),
    AMO_REDIRECT_URI: z.string().default(""),
    AMO_INTEGRATION_ID: z.string().default(""),
    /** Если задан — запросы (кроме /health, /auth/*, /webhook/*) требуют Authorization: Bearer … или x-api-key */
    SERVER_API_KEY: z.string().optional(),
})

const parsed = configSchema.safeParse(process.env)

if (!parsed.success) {
    console.error("❌ Invalid environment variables")
    console.error(parsed.error.format())
    process.exit(1)
}

export const config = parsed.data