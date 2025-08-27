import { cinetpayConfig } from '../../medusa-config'

export interface CinetPayPaymentRequest {
  amount: number
  currency: string
  transaction_id: string
  customer_name?: string
  customer_surname?: string
  customer_email?: string
  customer_phone_number?: string
  customer_address?: string
  customer_city?: string
  customer_country?: string
  customer_state?: string
  customer_zip_code?: string
  description?: string
  return_url?: string
  notify_url?: string
  channels?: string
}

export interface CinetPayPaymentResponse {
  code: string
  message: string
  description: string
  data: {
    payment_method: string
    payment_url: string
    payment_token?: string
  }
}

export interface CinetPayStatusResponse {
  code: string
  message: string
  description: string
  data: {
    cpm_site_id: string
    signature: string
    cpm_amount: string
    cpm_trans_id: string
    cpm_custom: string
    cpm_currency: string
    cpm_payid: string
    cpm_payment_date: string
    cpm_payment_time: string
    cpm_error_message: string
    payment_method: string
    cpm_phone_prefixe: string
    cel_phone_num: string
    cpm_ipn_ack: string
    created_at: string
    updated_at: string
    cpm_result: string
    cpm_trans_status: string
    cpm_designation: string
    buyer_name: string
  }
}

export class CinetPayClient {
  private apiBase: string
  private apiKey: string
  private siteId: string

  constructor() {
    this.apiBase = cinetpayConfig.apiBase || ''
    this.apiKey = cinetpayConfig.apiKey || ''
    this.siteId = cinetpayConfig.siteId || ''

    if (!this.apiKey || !this.siteId || !this.apiBase) {
      throw new Error('CinetPay configuration missing: API_KEY, SITE_ID and API_BASE are required')
    }
  }

  async initPayment(paymentData: CinetPayPaymentRequest): Promise<CinetPayPaymentResponse> {
    const payload = {
      apikey: this.apiKey,
      site_id: this.siteId,
      ...paymentData,
    }

    console.log('[CinetPay] Initiating payment:', {
      transaction_id: paymentData.transaction_id,
      amount: paymentData.amount,
      currency: paymentData.currency
    })

    try {
      const response = await fetch(`${this.apiBase}/v2/?method=paymentInit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json() as CinetPayPaymentResponse
      
      console.log('[CinetPay] Payment init response:', {
        code: data.code,
        message: data.message,
        transaction_id: paymentData.transaction_id
      })

      return data
    } catch (error) {
      console.error('[CinetPay] Payment init failed:', error)
      throw error
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<CinetPayStatusResponse> {
    const payload = {
      apikey: this.apiKey,
      site_id: this.siteId,
      transaction_id: transactionId,
    }

    console.log('[CinetPay] Checking payment status for transaction:', transactionId)

    try {
      const response = await fetch(`${this.apiBase}/v2/?method=checkPayStatus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json() as CinetPayStatusResponse
      
      console.log('[CinetPay] Payment status response:', {
        code: data.code,
        transaction_id: transactionId,
        status: data.data?.cpm_trans_status,
        result: data.data?.cpm_result
      })

      return data
    } catch (error) {
      console.error('[CinetPay] Payment status check failed:', error)
      throw error
    }
  }

  generateSignature(data: Record<string, any>): string {
    // CinetPay signature generation logic
    // This is a simplified version - adjust based on CinetPay documentation
    const keys = Object.keys(data).sort()
    const signatureString = keys.map(key => `${key}=${data[key]}`).join('&')
    return btoa(signatureString + this.apiKey)
  }

  validateSignature(data: Record<string, any>, receivedSignature: string): boolean {
    const expectedSignature = this.generateSignature(data)
    return expectedSignature === receivedSignature
  }
}
