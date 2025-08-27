import type { Request, Response } from 'express'
import { CinetPayClient } from '../../services/cinetpay-client'
import { idempotencyService, IdempotencyService } from '../../utils/idempotency'
import { enqueueOrderReview } from '../../queues/order-review'
import { cinetpayConfig } from '../../../medusa-config'

export function registerCinetPayRoutes(app: import('express').Express) {
  app.post('/payments/cinetpay/init', initPayment)
  app.post('/payments/cinetpay/ipn', ipnHandler)
}

interface PaymentInitRequest {
  orderId: string
  amount: number
  currency?: string
  customer?: {
    name?: string
    surname?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    country?: string
    state?: string
    zipCode?: string
  }
  description?: string
  channels?: string // Payment channels (MOBILE_MONEY, CARD, etc.)
}

async function initPayment(req: Request, res: Response) {
  try {
    console.log('[CinetPay] Payment init request received:', req.body)

    // Validate request body
    const { orderId, amount, currency = 'XOF', customer, description, channels }: PaymentInitRequest = req.body

    if (!orderId || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['orderId', 'amount'] 
      })
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        error: 'Invalid amount', 
        message: 'Amount must be greater than 0' 
      })
    }

    // Check for duplicate payment init (idempotency)
    const idempotencyKey = IdempotencyService.getPaymentInitKey(orderId)
    const isNewOperation = await idempotencyService.isNewOperation(idempotencyKey, 1800) // 30 minutes

    if (!isNewOperation) {
      return res.status(409).json({ 
        error: 'Payment already initiated', 
        message: 'Payment for this order has already been initiated' 
      })
    }

    // Generate unique transaction ID
    const transactionId = `${orderId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Initialize CinetPay client
    const cinetPayClient = new CinetPayClient()

    // Prepare payment request
    const paymentRequest = {
      amount,
      currency,
      transaction_id: transactionId,
      customer_name: customer?.name,
      customer_surname: customer?.surname,
      customer_email: customer?.email,
      customer_phone_number: customer?.phone,
      customer_address: customer?.address,
      customer_city: customer?.city,
      customer_country: customer?.country || 'CI',
      customer_state: customer?.state,
      customer_zip_code: customer?.zipCode,
      description: description || `Payment for order ${orderId}`,
      return_url: cinetpayConfig.returnUrl,
      notify_url: cinetpayConfig.ipnUrl,
      channels: channels || 'ALL'
    }

    // Initialize payment with CinetPay
    const paymentResponse = await cinetPayClient.initPayment(paymentRequest)

    if (paymentResponse.code !== '201') {
      console.error('[CinetPay] Payment init failed:', paymentResponse)
      return res.status(400).json({
        error: 'Payment initialization failed',
        message: paymentResponse.message,
        code: paymentResponse.code
      })
    }

    // TODO: Store payment record in database
    // await paymentService.create({
    //   orderId,
    //   transactionId,
    //   amount,
    //   currency,
    //   provider: 'cinetpay',
    //   status: 'pending',
    //   providerData: paymentResponse
    // })

    console.log('[CinetPay] Payment initialized successfully:', {
      orderId,
      transactionId,
      amount,
      currency
    })

    res.json({
      success: true,
      transactionId,
      paymentUrl: paymentResponse.data.payment_url,
      paymentToken: paymentResponse.data.payment_token,
      paymentMethod: paymentResponse.data.payment_method
    })

  } catch (error) {
    console.error('[CinetPay] Payment init error:', error)
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}

async function ipnHandler(req: Request, res: Response) {
  try {
    console.log('[CinetPay] IPN received:', req.body)

    const {
      cpm_trans_id: transactionId,
      cpm_amount: amount,
      cpm_currency: currency,
      cpm_result: result,
      cpm_trans_status: status,
      cpm_custom: custom,
      signature
    } = req.body

    if (!transactionId) {
      console.warn('[CinetPay] IPN missing transaction ID')
      return res.status(400).json({ error: 'Missing transaction ID' })
    }

    // Check idempotency - ensure we don't process the same IPN twice
    const idempotencyKey = IdempotencyService.getIPNKey(transactionId)
    const isNewOperation = await idempotencyService.isNewOperation(idempotencyKey, 86400) // 24 hours

    if (!isNewOperation) {
      console.log('[CinetPay] IPN already processed:', transactionId)
      return res.status(200).json({ message: 'IPN already processed' })
    }

    // Verify signature (simplified - adjust based on CinetPay documentation)
    const cinetPayClient = new CinetPayClient()
    const isValidSignature = cinetPayClient.validateSignature(req.body, signature)

    if (!isValidSignature) {
      console.warn('[CinetPay] Invalid signature for transaction:', transactionId)
      return res.status(400).json({ error: 'Invalid signature' })
    }

    // Revalidate payment status with CinetPay (server-to-server)
    const statusResponse = await cinetPayClient.checkPaymentStatus(transactionId)

    if (statusResponse.code !== '00') {
      console.warn('[CinetPay] Payment status check failed:', statusResponse)
      return res.status(400).json({ 
        error: 'Payment verification failed',
        message: statusResponse.message 
      })
    }

    const paymentData = statusResponse.data
    const isPaymentSuccessful = paymentData.cpm_result === '00' && paymentData.cpm_trans_status === 'ACCEPTED'

    if (isPaymentSuccessful) {
      console.log('[CinetPay] Payment successful for transaction:', transactionId)

      // TODO: Update payment status in database
      // await paymentService.update(transactionId, {
      //   status: 'paid',
      //   paidAt: new Date(),
      //   providerResponse: paymentData
      // })

      // TODO: Update order status to requires_review
      // const order = await orderService.findByPaymentTransaction(transactionId)
      // await orderService.update(order.id, {
      //   paymentStatus: 'paid',
      //   status: 'requires_review'
      // })

      // Extract order ID from transaction ID or custom field
      const orderId = custom || transactionId.split('-')[0]

      // Enqueue order for review
      await enqueueOrderReview({
        orderId,
        transactionId,
        amount: parseFloat(paymentData.cpm_amount),
        currency: paymentData.cpm_currency
      })

      console.log('[CinetPay] Order queued for review:', orderId)

    } else {
      console.log('[CinetPay] Payment failed for transaction:', transactionId, {
        result: paymentData.cpm_result,
        status: paymentData.cpm_trans_status,
        errorMessage: paymentData.cpm_error_message
      })

      // TODO: Update payment status as failed
      // await paymentService.update(transactionId, {
      //   status: 'failed',
      //   failureReason: paymentData.cmp_error_message
      // })
    }

    // Respond to CinetPay to acknowledge IPN processing
    res.status(200).json({ message: 'IPN processed successfully' })

  } catch (error) {
    console.error('[CinetPay] IPN processing error:', error)
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}

