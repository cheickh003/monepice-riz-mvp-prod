import { NextRequest, NextResponse } from 'next/server';
import { validateHMAC, mapCinetPayStatus, CinetPayWebhookPayload } from '@/lib/payments/cinetpay';

// Stockage temporaire des transactions (en production, utiliser une vraie DB)
// Note: Cette variable est partagée avec initiate/route.ts
const transactionStore: Record<string, any> = {};

export async function POST(request: NextRequest) {
  try {
    // Récupérer les headers et le body
    const xToken = request.headers.get('x-token');
    const body = await request.json();

    console.log('Webhook CinetPay reçu:', { xToken: xToken?.substring(0, 10) + '...', body });

    // Vérifier la présence du header x-token
    if (!xToken) {
      console.error('Webhook: Header x-token manquant');
      return NextResponse.json({ error: 'Header x-token manquant' }, { status: 400 });
    }

    // Valider la structure du payload
    if (!body.cpm_trans_id || !body.cpm_site_id) {
      console.error('Webhook: Payload invalide, champs requis manquants');
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
    }

    // Valider le HMAC
    const isValidHMAC = validateHMAC(body as CinetPayWebhookPayload, xToken);
    if (!isValidHMAC) {
      console.error('Webhook: HMAC invalide pour transaction', body.cpm_trans_id);
      return NextResponse.json({ error: 'HMAC invalide' }, { status: 403 });
    }

    const transactionId = body.cpm_trans_id;
    const siteId = body.cpm_site_id;
    const status = body.cpm_trans_status;
    const amount = parseFloat(body.cpm_amount);
    const currency = body.cpm_currency;

    // Vérifier que c'est notre site
    if (siteId !== process.env.CINETPAY_SITE_ID) {
      console.error('Webhook: Site ID invalide', siteId);
      return NextResponse.json({ error: 'Site ID invalide' }, { status: 403 });
    }

    // Récupérer la transaction
    const transaction = transactionStore[transactionId];
    if (!transaction) {
      console.error('Webhook: Transaction non trouvée', transactionId);
      // En production, on pourrait créer la transaction si elle n'existe pas
      // Pour l'instant, on log l'erreur mais on continue pour ne pas perdre l'événement
    }

    // Validation supplémentaire (si on a la transaction de référence)
    if (transaction) {
      if (Math.abs(amount - transaction.amount) > 0.01) {
        console.error('Webhook: Montant ne correspond pas', { received: amount, expected: transaction.amount });
        // On continue quand même pour ne pas perdre l'événement
      }

      if (currency !== transaction.currency) {
        console.error('Webhook: Devise ne correspond pas', { received: currency, expected: transaction.currency });
      }
    }

    // Mapper le statut CinetPay
    const mappedStatus = mapCinetPayStatus(status);

    // Mettre à jour la transaction
    transactionStore[transactionId] = {
      ...transaction,
      status: mappedStatus,
      paymentCode: body.cpm_result,
      paymentMessage: body.cpm_error_message,
      paymentMethod: body.payment_method,
      phoneNumber: body.cel_phone_num,
      phonePrefix: body.cpm_phone_prefixe,
      rawPayload: body,
      rawHeaders: Object.fromEntries(request.headers.entries()),
      hmacToken: xToken,
      webhookReceivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // TODO: Mettre à jour la commande dans la vraie base de données
    // - Récupérer la commande par orderNumber
    // - Mettre à jour paymentStatus, transactionId, etc.
    // - Si status === 'paid', mettre à jour le statut de la commande

    console.log('Webhook traité avec succès:', {
      transactionId,
      status,
      mappedStatus,
      amount,
      currency,
    });

    // Répondre rapidement (important pour CinetPay)
    return NextResponse.json({
      status: 'success',
      message: 'Webhook traité avec succès',
    });

  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error);

    // Même en cas d'erreur, répondre avec 200 pour éviter les retries inutiles
    // CinetPay pourrait retry sinon
    return NextResponse.json(
      {
        status: 'error',
        message: 'Erreur interne lors du traitement',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 200 } // On garde 200 même en cas d'erreur pour éviter les retries
    );
  }
}

// Endpoint GET pour debug - récupérer les transactions
export async function GET() {
  return NextResponse.json({
    transactions: Object.values(transactionStore),
    count: Object.keys(transactionStore).length,
  });
}
