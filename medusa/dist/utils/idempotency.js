import { Redis } from 'ioredis';
import { redisConfig } from '../../medusa-config';
export class IdempotencyService {
    constructor() {
        this.redis = new Redis(redisConfig.url);
    }
    /**
     * Check if an operation has already been processed (idempotency check)
     * @param key - Unique key for the operation (e.g., 'ipn:transaction_id')
     * @param ttlSeconds - Time to live in seconds (default: 24 hours)
     * @returns Promise<boolean> - true if operation is new, false if already processed
     */
    async isNewOperation(key, ttlSeconds = 86400) {
        try {
            // SETNX returns 1 if key was set (new operation), 0 if key already exists
            const result = await this.redis.setnx(key, '1');
            if (result === 1) {
                // Set TTL only if we successfully set the key
                await this.redis.expire(key, ttlSeconds);
                console.log(`[Idempotency] New operation registered: ${key}`);
                return true;
            }
            console.log(`[Idempotency] Operation already processed: ${key}`);
            return false;
        }
        catch (error) {
            console.error(`[Idempotency] Error checking operation ${key}:`, error);
            // In case of Redis error, we allow the operation to proceed to avoid blocking
            return true;
        }
    }
    /**
     * Mark an operation as processed
     * @param key - Unique key for the operation
     * @param ttlSeconds - Time to live in seconds (default: 24 hours)
     */
    async markAsProcessed(key, ttlSeconds = 86400) {
        try {
            await this.redis.setex(key, ttlSeconds, '1');
            console.log(`[Idempotency] Operation marked as processed: ${key}`);
        }
        catch (error) {
            console.error(`[Idempotency] Error marking operation ${key} as processed:`, error);
        }
    }
    /**
     * Remove an operation record (useful for testing or cleanup)
     * @param key - Unique key for the operation
     */
    async removeOperation(key) {
        try {
            await this.redis.del(key);
            console.log(`[Idempotency] Operation record removed: ${key}`);
        }
        catch (error) {
            console.error(`[Idempotency] Error removing operation ${key}:`, error);
        }
    }
    /**
     * Generate IPN idempotency key
     * @param transactionId - Transaction ID from payment provider
     * @returns string - Formatted key for IPN operations
     */
    static getIPNKey(transactionId) {
        return `ipn:${transactionId}`;
    }
    /**
     * Generate payment init idempotency key
     * @param orderId - Order ID or cart ID
     * @returns string - Formatted key for payment init operations
     */
    static getPaymentInitKey(orderId) {
        return `payment_init:${orderId}`;
    }
    /**
     * Close Redis connection
     */
    async disconnect() {
        await this.redis.disconnect();
    }
}
// Singleton instance for the app
export const idempotencyService = new IdempotencyService();
