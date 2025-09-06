import { createHmac } from 'crypto';

// Configuration CinetPay
const CINETPAY_CONFIG = {
  apiUrl: process.env.CINETPAY_API_URL || 'https://api-checkout.cinetpay.com',
  apiKey: process.env.CINETPAY_API_KEY || '',
  siteId: process.env.CINETPAY_SITE_ID || '',
  secretKey: process.env.CINETPAY_SECRET_KEY || '',
  currency: process.env.CINETPAY_CURRENCY || 'XOF',
  lang: process.env.CINETPAY_LANG || 'fr',
};

// Types pour les payloads CinetPay
export interface CinetPayInitiatePayload {
  apikey: string;
  site_id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  description: string;
  return_url: string;
  notify_url: string;
  channels: string;
  lang: string;
  metadata?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone_number?: string;
  customer_address?: string;
  customer_city?: string;
  customer_country?: string;
  lock_phone_number?: boolean;
  customer_phone_prefixe?: string;
}

export interface CinetPayInitiateResponse {
  code: string;
  message: string;
  description: string;
  data?: {
    payment_url: string;
    payment_token: string;
  };
}

export interface CinetPayWebhookPayload {
  cpm_site_id: string;
  cpm_trans_id: string;
  cpm_amount: string;
  cpm_currency: string;
  cpm_payment_config: string;
  cpm_payment_date: string;
  cpm_payment_time: string;
  cpm_error_message: string;
  payment_method: string;
  cel_phone_num?: string;
  cpm_phone_prefixe?: string;
  cpm_result: string;
  cpm_trans_status: string;
  cpm_designation: string;
  cpm_custom?: string;
  signature: string;
  [key: string]: any;
}

export interface CinetPayVerifyResponse {
  code: string;
  message: string;
  data?: {
    amount: string;
    currency: string;
    status: string;
    payment_method: string;
    description: string;
    metadata?: string;
    operator_id?: string;
    payment_date?: string;
    payment_time?: string;
  };
}

/**
 * Arrondi un montant au multiple de 5 le plus proche
 */
export function roundToMultipleOfFive(amount: number, roundingPolicy: 'nearest' | 'floor' | 'ceil' = 'nearest'): number {
  const remainder = amount % 5;
  if (remainder === 0) return amount;

  switch (roundingPolicy) {
    case 'floor':
      return amount - remainder;
    case 'ceil':
      return amount + (5 - remainder);
    case 'nearest':
    default:
      return remainder >= 2.5 ? amount + (5 - remainder) : amount - remainder;
  }
}

/**
 * Génère un HMAC SHA256 pour validation
 */
export function generateHMAC(data: string, secretKey: string = CINETPAY_CONFIG.secretKey): string {
  return createHmac('sha256', secretKey)
    .update(data, 'utf8')
    .digest('hex');
}

/**
 * Valide un HMAC reçu du webhook
 */
export function validateHMAC(
  payload: CinetPayWebhookPayload,
  receivedToken: string,
  secretKey: string = CINETPAY_CONFIG.secretKey
): boolean {
  // Concaténation des champs selon la documentation CinetPay (X-TOKEN HMAC)
  // Ordre attendu:
  // cpm_site_id + cpm_trans_id + cpm_trans_date + cpm_amount + cpm_currency + signature +
  // payment_method + cel_phone_num + cpm_phone_prefixe + cpm_language + cpm_version +
  // cpm_payment_config + cpm_page_action + cpm_custom + cpm_designation + cpm_error_message

  const fieldsToConcat = [
    payload.cpm_site_id || '',
    payload.cpm_trans_id || '',
    // Certaines implémentations séparent date/heure; on tolère champs manquants
    payload.cpm_trans_date || payload.cpm_payment_date || '',
    payload.cpm_amount || '',
    payload.cpm_currency || '',
    payload.signature || '',
    payload.payment_method || '',
    payload.cel_phone_num || '',
    payload.cpm_phone_prefixe || '',
    payload.cpm_language || '',
    payload.cpm_version || '',
    payload.cpm_payment_config || '',
    payload.cpm_page_action || '',
    payload.cpm_custom || '',
    payload.cpm_designation || '',
    payload.cpm_error_message || '',
  ];

  const concatenatedData = fieldsToConcat.join('');
  const expectedHMAC = generateHMAC(concatenatedData, secretKey);

  return expectedHMAC === receivedToken;
}

/**
 * Construit le payload pour l'initiation de paiement
 */
export function buildInitiatePayload(params: {
  transactionId: string;
  amount: number;
  currency?: string;
  description: string;
  returnUrl: string;
  notifyUrl: string;
  channels: string;
  customerInfo: {
    fullName: string;
    email?: string;
    phoneNumber: string;
  };
  metadata?: any;
}): CinetPayInitiatePayload {
  const payload: CinetPayInitiatePayload = {
    apikey: CINETPAY_CONFIG.apiKey,
    site_id: CINETPAY_CONFIG.siteId,
    transaction_id: params.transactionId,
    amount: Math.round(params.amount),
    currency: params.currency || CINETPAY_CONFIG.currency,
    description: params.description,
    return_url: params.returnUrl,
    notify_url: params.notifyUrl,
    channels: params.channels,
    lang: CINETPAY_CONFIG.lang,
  };

  // Métadonnées
  if (params.metadata) {
    payload.metadata = JSON.stringify(params.metadata);
  }

  // Informations client
  payload.customer_name = params.customerInfo.fullName;
  if (params.customerInfo.email) {
    payload.customer_email = params.customerInfo.email;
  }

  // Pour Mobile Money, on lock le numéro de téléphone
  if (params.channels === 'MOBILE_MONEY') {
    const normalized = normalizePhoneCI(params.customerInfo.phoneNumber);
    if (normalized.valid) {
      payload.customer_phone_number = normalized.value;
      payload.lock_phone_number = true;
    } else {
      // Ne pas verrouiller si le numéro n'est pas valide pour éviter les erreurs 700
      payload.lock_phone_number = false;
    }
  }

  return payload;
}

/**
 * Appelle l'API d'initiation CinetPay
 */
export async function initiatePayment(payload: CinetPayInitiatePayload): Promise<CinetPayInitiateResponse> {
  const response = await fetch(`${CINETPAY_CONFIG.apiUrl}/v2/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch (e) {
    // ignorer erreurs de parsing pour rapporter statut brut
  }

  if (!response.ok) {
    const detail = data ? `${data.code || response.status}: ${data.message || 'UNKNOWN_ERROR'}` : `HTTP ${response.status}`;
    throw new Error(`CinetPay API error: ${detail}`);
  }

  return data;
}

/**
 * Vérifie le statut d'une transaction
 */
export async function verifyPayment(transactionId: string): Promise<CinetPayVerifyResponse> {
  const payload = {
    apikey: CINETPAY_CONFIG.apiKey,
    site_id: CINETPAY_CONFIG.siteId,
    transaction_id: transactionId,
  };

  const response = await fetch(`${CINETPAY_CONFIG.apiUrl}/v2/payment/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`CinetPay verify error: ${data.message || 'Unknown error'}`);
  }

  return data;
}

/**
 * Mappe le statut CinetPay vers notre statut interne
 */
export function mapCinetPayStatus(cinetPayStatus: string): 'pending' | 'paid' | 'failed' {
  switch (cinetPayStatus) {
    case 'ACCEPTED':
    case '00':
      return 'paid';
    case 'REFUSED':
    case 'REFUSED':
      return 'failed';
    case 'WAITING_FOR_CUSTOMER':
    case 'PENDING':
      return 'pending';
    default:
      return 'pending';
  }
}

/**
 * Génère un ID de transaction unique
 */
export function generateTransactionId(prefix: string = 'MEP'): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

/**
 * Normalise un numéro CI en format international attendu par CinetPay
 * - Accepte entrées: "07 xx xx xx xx", "+22507...", "22507..."
 * - Retourne: "+22507XXXXXXXX" (sans espaces)
 */
function normalizePhoneCI(input: string): { valid: boolean; value?: string } {
  if (!input) return { valid: false };
  let digits = input.replace(/\s+/g, '');
  // Remplacer 00 225 par +225
  if (digits.startsWith('00225')) digits = '+' + digits.slice(2);
  // Ajouter + si manque
  if (digits.startsWith('225')) digits = '+'.concat(digits);
  // Ajouter préfixe si aucune indicatif
  if (!digits.startsWith('+225')) {
    // Si commence par 0 ou un chiffre, préfixer +225
    if (/^[0-9]/.test(digits)) {
      digits = '+225' + digits;
    }
  }
  // Retirer tout sauf + et chiffres
  digits = '+' + digits.replace(/[^0-9]/g, '').replace(/^\+/, '');
  // Validation sommaire: +225 suivi de 10 chiffres (format CI récent)
  const valid = /^\+225\d{10}$/.test(digits) || /^\+225\d{8,10}$/.test(digits);
  return valid ? { valid: true, value: digits } : { valid: false };
}
