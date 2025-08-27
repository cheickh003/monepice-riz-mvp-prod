import { Redis } from 'ioredis';
import { redisConfig } from '../../medusa-config';
export class SlotCapacityService {
    constructor() {
        this.redis = new Redis(redisConfig.url);
    }
    /**
     * Reserve a slot for a cart
     */
    async reserveSlot(slotId, cartId, userId) {
        const reservationKey = this.getReservationKey(slotId);
        const capacityKey = this.getCapacityKey(slotId);
        const cartSlotKey = this.getCartSlotKey(cartId);
        try {
            // Check if cart already has a slot reserved
            const existingSlot = await this.redis.get(cartSlotKey);
            if (existingSlot && existingSlot !== slotId) {
                // Release the existing slot first
                await this.releaseSlot(cartId);
            }
            // Use a Redis transaction to ensure atomicity
            const multi = this.redis.multi();
            // Check current capacity
            const currentReserved = await this.redis.hlen(reservationKey);
            const maxCapacity = await this.redis.get(capacityKey);
            const capacity = maxCapacity ? parseInt(maxCapacity) : 10; // Default capacity
            if (currentReserved >= capacity) {
                return { success: false, error: 'Slot is fully booked' };
            }
            // Set expiration time (30 minutes from now)
            const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
            const reservedAt = new Date().toISOString();
            const reservation = {
                slotId,
                cartId,
                userId,
                reservedAt,
                expiresAt
            };
            // Reserve the slot
            multi.hset(reservationKey, cartId, JSON.stringify(reservation));
            multi.expire(reservationKey, 24 * 60 * 60); // Expire key after 24 hours
            // Store cart -> slot mapping
            multi.setex(cartSlotKey, 30 * 60, slotId); // 30 minute expiration
            // Set default capacity if not set
            if (!maxCapacity) {
                multi.setex(capacityKey, 24 * 60 * 60, capacity.toString());
            }
            await multi.exec();
            console.log(`[SlotCapacity] Reserved slot ${slotId} for cart ${cartId}`);
            return { success: true };
        }
        catch (error) {
            console.error(`[SlotCapacity] Error reserving slot ${slotId} for cart ${cartId}:`, error);
            return { success: false, error: 'Failed to reserve slot' };
        }
    }
    /**
     * Release a slot reservation for a cart
     */
    async releaseSlot(cartId) {
        try {
            const cartSlotKey = this.getCartSlotKey(cartId);
            const slotId = await this.redis.get(cartSlotKey);
            if (!slotId) {
                return { success: true }; // No slot to release
            }
            const reservationKey = this.getReservationKey(slotId);
            // Remove the reservation
            await this.redis.hdel(reservationKey, cartId);
            await this.redis.del(cartSlotKey);
            console.log(`[SlotCapacity] Released slot ${slotId} for cart ${cartId}`);
            return { success: true };
        }
        catch (error) {
            console.error(`[SlotCapacity] Error releasing slot for cart ${cartId}:`, error);
            return { success: false, error: 'Failed to release slot' };
        }
    }
    /**
     * Get current reservations for a slot
     */
    async getSlotReservations(slotId) {
        try {
            const reservationKey = this.getReservationKey(slotId);
            const reservations = await this.redis.hgetall(reservationKey);
            const result = [];
            const now = new Date();
            for (const [cartId, reservationData] of Object.entries(reservations)) {
                try {
                    const reservation = JSON.parse(reservationData);
                    // Check if reservation has expired
                    if (new Date(reservation.expiresAt) > now) {
                        result.push(reservation);
                    }
                    else {
                        // Clean up expired reservation
                        await this.redis.hdel(reservationKey, cartId);
                        await this.redis.del(this.getCartSlotKey(cartId));
                    }
                }
                catch (parseError) {
                    console.warn(`[SlotCapacity] Invalid reservation data for cart ${cartId}:`, parseError);
                    // Clean up invalid data
                    await this.redis.hdel(reservationKey, cartId);
                }
            }
            return result;
        }
        catch (error) {
            console.error(`[SlotCapacity] Error getting reservations for slot ${slotId}:`, error);
            return [];
        }
    }
    /**
     * Get slot capacity information
     */
    async getSlotCapacity(slotId) {
        try {
            const capacityKey = this.getCapacityKey(slotId);
            const reservations = await this.getSlotReservations(slotId);
            const maxCapacity = await this.redis.get(capacityKey);
            const capacity = maxCapacity ? parseInt(maxCapacity) : 10;
            const reserved = reservations.length;
            const remaining = Math.max(0, capacity - reserved);
            return { capacity, reserved, remaining };
        }
        catch (error) {
            console.error(`[SlotCapacity] Error getting capacity for slot ${slotId}:`, error);
            return { capacity: 10, reserved: 0, remaining: 10 };
        }
    }
    /**
     * Set custom capacity for a slot
     */
    async setSlotCapacity(slotId, capacity) {
        const capacityKey = this.getCapacityKey(slotId);
        await this.redis.setex(capacityKey, 24 * 60 * 60, capacity.toString());
        console.log(`[SlotCapacity] Set capacity for slot ${slotId} to ${capacity}`);
    }
    /**
     * Get cart's current slot reservation
     */
    async getCartSlot(cartId) {
        try {
            const cartSlotKey = this.getCartSlotKey(cartId);
            return await this.redis.get(cartSlotKey);
        }
        catch (error) {
            console.error(`[SlotCapacity] Error getting slot for cart ${cartId}:`, error);
            return null;
        }
    }
    /**
     * Extend reservation expiration (useful when user is actively using the cart)
     */
    async extendReservation(cartId, additionalMinutes = 15) {
        try {
            const slotId = await this.getCartSlot(cartId);
            if (!slotId)
                return false;
            const reservationKey = this.getReservationKey(slotId);
            const reservationData = await this.redis.hget(reservationKey, cartId);
            if (!reservationData)
                return false;
            const reservation = JSON.parse(reservationData);
            const newExpiresAt = new Date(Date.now() + additionalMinutes * 60 * 1000).toISOString();
            reservation.expiresAt = newExpiresAt;
            await this.redis.hset(reservationKey, cartId, JSON.stringify(reservation));
            await this.redis.expire(this.getCartSlotKey(cartId), additionalMinutes * 60);
            console.log(`[SlotCapacity] Extended reservation for cart ${cartId} by ${additionalMinutes} minutes`);
            return true;
        }
        catch (error) {
            console.error(`[SlotCapacity] Error extending reservation for cart ${cartId}:`, error);
            return false;
        }
    }
    /**
     * Clean up expired reservations for a slot
     */
    async cleanupExpiredReservations(slotId) {
        try {
            const reservations = await this.getSlotReservations(slotId);
            // The getSlotReservations method already cleans up expired reservations
            return reservations.length;
        }
        catch (error) {
            console.error(`[SlotCapacity] Error cleaning up reservations for slot ${slotId}:`, error);
            return 0;
        }
    }
    /**
     * Get Redis key for slot reservations
     */
    getReservationKey(slotId) {
        return `slot:${slotId}:reservations`;
    }
    /**
     * Get Redis key for slot capacity
     */
    getCapacityKey(slotId) {
        return `slot:${slotId}:capacity`;
    }
    /**
     * Get Redis key for cart slot mapping
     */
    getCartSlotKey(cartId) {
        return `cart:${cartId}:slot`;
    }
    /**
     * Close Redis connection
     */
    async disconnect() {
        await this.redis.disconnect();
    }
}
// Singleton instance
export const slotCapacityService = new SlotCapacityService();
