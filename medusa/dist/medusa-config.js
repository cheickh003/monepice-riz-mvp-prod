// Export individual configs for plugin usage
export const httpConfig = {
    port: Number(process.env.PORT || 9000),
};
export const databaseConfig = {
    url: process.env.DATABASE_URL || "postgres://medusa:medusa@localhost:5432/medusa",
};
export const redisConfig = {
    url: process.env.REDIS_URL || "redis://localhost:6379",
};
export const storageConfig = {
    endpoint: process.env.S3_ENDPOINT,
    bucket: process.env.S3_BUCKET,
    region: process.env.S3_REGION || "auto",
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
};
export const meiliConfig = {
    host: process.env.MEILI_HOST || "http://localhost:7700",
    apiKey: process.env.MEILI_API_KEY || "dev_meili_master_key_change_me",
};
export const storeConfig = {
    region: "CI",
    currency: "XOF",
    pricesIncludeTax: true,
    defaultVatRate: 0.18,
};
export const cinetpayConfig = {
    apiKey: process.env.CINETPAY_API_KEY,
    siteId: process.env.CINETPAY_SITE_ID,
    apiBase: process.env.CINETPAY_API_BASE || "https://api-checkout.cinetpay.com",
    returnUrl: process.env.CINETPAY_RETURN_URL,
    ipnUrl: process.env.CINETPAY_IPN_URL,
};
