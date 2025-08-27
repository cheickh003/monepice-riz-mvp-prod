import { Worker, Job } from 'bullmq'
import { redisConfig } from '../../medusa-config'

export interface OrderReviewJob {
  orderId: string
  paymentId?: string
  transactionId?: string
  amount?: number
  currency?: string
}

export interface OrderReviewResult {
  orderId: string
  status: 'confirmed' | 'cancelled'
  reason?: string
  timestamp: string
}

class OrderReviewWorker {
  private worker: Worker

  constructor() {
    this.worker = new Worker('order-review', this.processOrderReview.bind(this), {
      connection: {
        host: redisConfig.url.includes('://') ? new URL(redisConfig.url).hostname : 'localhost',
        port: redisConfig.url.includes('://') ? Number(new URL(redisConfig.url).port) || 6379 : 6379,
      },
      concurrency: 3, // Process up to 3 orders concurrently
    })

    this.worker.on('completed', (job: Job) => {
      console.log(`[OrderReview] Order ${job.data.orderId} review completed:`, job.returnvalue)
    })

    this.worker.on('failed', (job: Job | undefined, err: Error) => {
      console.error(`[OrderReview] Order ${job?.data?.orderId} review failed:`, err)
    })

    console.log('[OrderReview] Worker started and listening for jobs')
  }

  private async processOrderReview(job: Job<OrderReviewJob>): Promise<OrderReviewResult> {
    const { orderId, paymentId, transactionId, amount, currency } = job.data

    console.log(`[OrderReview] Processing review for order ${orderId}`)

    try {
      // Simulate order validation logic
      const reviewResult = await this.reviewOrder(orderId, { paymentId, transactionId, amount, currency })
      
      console.log(`[OrderReview] Order ${orderId} reviewed with status: ${reviewResult.status}`)
      
      return reviewResult
    } catch (error) {
      console.error(`[OrderReview] Error reviewing order ${orderId}:`, error)
      throw error
    }
  }

  private async reviewOrder(
    orderId: string, 
    context: { paymentId?: string; transactionId?: string; amount?: number; currency?: string }
  ): Promise<OrderReviewResult> {
    // TODO: Implement actual order review logic
    // This should:
    // 1. Load the order from the database
    // 2. Check inventory/stock availability
    // 3. Validate payment amount matches order total
    // 4. Apply any business rules (fraud detection, etc.)
    // 5. Update order status to 'confirmed' or 'cancelled'

    console.log(`[OrderReview] Reviewing order ${orderId} with context:`, context)

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1000))

    // For now, simulate business logic
    const shouldConfirm = await this.checkOrderValidity(orderId, context)

    const result: OrderReviewResult = {
      orderId,
      status: shouldConfirm ? 'confirmed' : 'cancelled',
      reason: shouldConfirm ? 'Order validated successfully' : 'Stock insufficient or validation failed',
      timestamp: new Date().toISOString()
    }

    // TODO: Update order status in the database
    await this.updateOrderStatus(orderId, result.status, result.reason)

    return result
  }

  private async checkOrderValidity(
    orderId: string, 
    context: { paymentId?: string; transactionId?: string; amount?: number; currency?: string }
  ): Promise<boolean> {
    // TODO: Implement real validation logic
    // For now, we'll simulate:
    // - 90% of orders are confirmed
    // - 10% are cancelled (simulating stock issues, fraud, etc.)
    
    console.log(`[OrderReview] Checking validity for order ${orderId}`)
    
    // Simulate different scenarios based on order ID for testing
    if (orderId.includes('test-fail')) {
      return false
    }
    
    if (orderId.includes('test-delay')) {
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    // Simulate 90% success rate
    return Math.random() > 0.1
  }

  private async updateOrderStatus(orderId: string, status: 'confirmed' | 'cancelled', reason?: string): Promise<void> {
    // TODO: Implement actual database update
    // This should update the order status in the Medusa database
    
    console.log(`[OrderReview] Updating order ${orderId} to status: ${status}`, { reason })
    
    // Placeholder for database update
    // await orderService.update(orderId, { 
    //   status: status,
    //   metadata: { ...existing_metadata, review_reason: reason }
    // })
  }

  async close(): Promise<void> {
    await this.worker.close()
    console.log('[OrderReview] Worker stopped')
  }
}

// Create and export worker instance
export const orderReviewWorker = new OrderReviewWorker()

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('[OrderReview] Shutting down worker...')
  await orderReviewWorker.close()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('[OrderReview] Shutting down worker...')
  await orderReviewWorker.close()
  process.exit(0)
})