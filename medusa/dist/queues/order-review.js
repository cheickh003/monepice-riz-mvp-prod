import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { redisConfig } from '../../medusa-config';
const connection = new Redis(redisConfig.url);
export const orderReviewQueue = new Queue('order-review', { connection });
export async function enqueueOrderReview(params) {
    const { orderId, paymentId, transactionId, amount, currency, priority = 10, delay = 0 } = params;
    const jobData = {
        orderId,
        paymentId,
        transactionId,
        amount,
        currency
    };
    const jobOptions = {
        removeOnComplete: 10, // Keep last 10 completed jobs for debugging
        removeOnFail: 50, // Keep last 50 failed jobs for analysis
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000, // Start with 2 second delay
        },
        priority,
        delay,
    };
    console.log(`[OrderReview] Enqueuing review for order ${orderId}`, {
        paymentId,
        transactionId,
        amount,
        currency,
        delay: delay > 0 ? `${delay}ms` : 'immediate'
    });
    try {
        const job = await orderReviewQueue.add('review', jobData, jobOptions);
        console.log(`[OrderReview] Job ${job.id} enqueued for order ${orderId}`);
    }
    catch (error) {
        console.error(`[OrderReview] Failed to enqueue review for order ${orderId}:`, error);
        throw error;
    }
}
// Helper function for high priority orders (e.g., large amounts, VIP customers)
export async function enqueueHighPriorityOrderReview(params) {
    return enqueueOrderReview({ ...params, priority: 1 });
}
// Helper function for delayed review (e.g., wait for external confirmation)
export async function enqueueDelayedOrderReview(params, delayMinutes) {
    return enqueueOrderReview({ ...params, delay: delayMinutes * 60 * 1000 });
}
// Get queue metrics for monitoring
export async function getQueueMetrics() {
    const waiting = await orderReviewQueue.getWaiting();
    const active = await orderReviewQueue.getActive();
    const completed = await orderReviewQueue.getCompleted();
    const failed = await orderReviewQueue.getFailed();
    return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total: waiting.length + active.length
    };
}
