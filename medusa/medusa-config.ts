// Export individual configs for plugin usage (used by Express skeleton and can be used by v2)
export const httpConfig = {
  port: Number(process.env.PORT || 9000),
}

export const databaseConfig = {
  url: process.env.DATABASE_URL || "postgres://medusa:medusa@localhost:5432/medusa",
}

export const redisConfig = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
}

export const storageConfig = {
  endpoint: process.env.S3_ENDPOINT,
  bucket: process.env.S3_BUCKET,
  region: process.env.S3_REGION || "auto",
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
}

export const meiliConfig = {
  host: process.env.MEILI_HOST || "http://localhost:7700",
  apiKey: process.env.MEILI_API_KEY || "dev_meili_master_key_change_me",
}

export const storeConfig = {
  region: "CI",
  currency: "XOF",
  pricesIncludeTax: true,
  defaultVatRate: 0.18,
}

export const cinetpayConfig = {
  apiKey: process.env.CINETPAY_API_KEY,
  siteId: process.env.CINETPAY_SITE_ID,
  apiBase: process.env.CINETPAY_API_BASE || "https://api-checkout.cinetpay.com",
  returnUrl: process.env.CINETPAY_RETURN_URL,
  ipnUrl: process.env.CINETPAY_IPN_URL,
}
// Medusa v2 configuration (default export) for CLI-based server
import { defineConfig } from "@medusajs/framework/utils"

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL || "postgres://medusa:medusa@db:5432/medusa",
    redisUrl: process.env.REDIS_URL || "redis://redis:6379",
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:3000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:7001",
      authCors: process.env.AUTH_CORS || "http://localhost:3000,http://localhost:7001",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
})
