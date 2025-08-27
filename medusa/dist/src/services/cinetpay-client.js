import { cinetpayConfig } from '../../medusa-config';
export class CinetPayClient {
    constructor() {
        this.apiBase = cinetpayConfig.apiBase || '';
        this.apiKey = cinetpayConfig.apiKey || '';
        this.siteId = cinetpayConfig.siteId || '';
        if (!this.apiKey || !this.siteId || !this.apiBase) {
            throw new Error('CinetPay configuration missing: API_KEY, SITE_ID and API_BASE are required');
        }
    }
    async initPayment(paymentData) {
        const payload = {
            apikey: this.apiKey,
            site_id: this.siteId,
            ...paymentData,
        };
        console.log('[CinetPay] Initiating payment:', {
            transaction_id: paymentData.transaction_id,
            amount: paymentData.amount,
            currency: paymentData.currency
        });
        try {
            const response = await fetch(`${this.apiBase}/v2/?method=paymentInit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('[CinetPay] Payment init response:', {
                code: data.code,
                message: data.message,
                transaction_id: paymentData.transaction_id
            });
            return data;
        }
        catch (error) {
            console.error('[CinetPay] Payment init failed:', error);
            throw error;
        }
    }
    async checkPaymentStatus(transactionId) {
        const payload = {
            apikey: this.apiKey,
            site_id: this.siteId,
            transaction_id: transactionId,
        };
        console.log('[CinetPay] Checking payment status for transaction:', transactionId);
        try {
            const response = await fetch(`${this.apiBase}/v2/?method=checkPayStatus`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('[CinetPay] Payment status response:', {
                code: data.code,
                transaction_id: transactionId,
                status: data.data?.cpm_trans_status,
                result: data.data?.cpm_result
            });
            return data;
        }
        catch (error) {
            console.error('[CinetPay] Payment status check failed:', error);
            throw error;
        }
    }
    generateSignature(data) {
        // CinetPay signature generation logic
        // This is a simplified version - adjust based on CinetPay documentation
        const keys = Object.keys(data).sort();
        const signatureString = keys.map(key => `${key}=${data[key]}`).join('&');
        return btoa(signatureString + this.apiKey);
    }
    validateSignature(data, receivedSignature) {
        const expectedSignature = this.generateSignature(data);
        return expectedSignature === receivedSignature;
    }
}
