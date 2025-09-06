import { NextRequest, NextResponse } from 'next/server';
import {
  buildInitiatePayload,
  initiatePayment,
  roundToMultipleOfFive,
  generateTransactionId,
} from '@/lib/payments/cinetpay';
import { getPaymentChannel } from '@/lib/stores/checkoutStore';

// Stockage temporaire des transactions (en production, utiliser une vraie DB)
const transactionStore: Record<string, any> = {};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderNumber,
      amount,
      currency = 'XOF',
      paymentMethod,
      channel,
      customer,
      returnPath = '/checkout/processing',
    } = body;

    // Validation des paramètres requis
    if (!orderNumber || !amount || !paymentMethod || !customer) {
      return NextResponse.json(
        { error: 'Paramètres manquants: orderNumber, amount, paymentMethod, customer requis' },
        { status: 400 }
      );
    }

    // Générer un transaction_id conforme (alphanumérique) et unique
    const transactionId = generateTransactionId('MEP');

    // Arrondir le montant au multiple de 5
    const roundedAmount = roundToMultipleOfFive(amount);

    // Informations de l'utilisateur connecté (pour l'instant null en MVP)
    const userId = null; // TODO: récupérer depuis session/auth

    // URLs de retour et notification
    let baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    // Eviter 'localhost' dans les URLs (CinetPay le refuse). Fallback IP loopback.
    if (/localhost/i.test(baseUrl)) {
      baseUrl = baseUrl.replace('localhost', '127.0.0.1');
    }
    const returnUrl = process.env.CINETPAY_RETURN_URL
      ? `${process.env.CINETPAY_RETURN_URL}?order=${orderNumber}&transaction_id=${transactionId}`
      : `${baseUrl}${returnPath}?order=${orderNumber}&transaction_id=${transactionId}`;
    const notifyUrl = process.env.CINETPAY_NOTIFY_URL || `${baseUrl}/api/payments/webhook`;

    // Mapper le channel de paiement
    const cinetPayChannel = channel || getPaymentChannel(paymentMethod);

    // Construire le payload CinetPay
    const cinetPayPayload = buildInitiatePayload({
      transactionId,
      amount: roundedAmount,
      currency,
      description: `Commande ${orderNumber} - Monepiceriz`,
      returnUrl,
      notifyUrl,
      channels: cinetPayChannel,
      customerInfo: {
        fullName: customer.fullName,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
      },
      metadata: {
        orderNumber,
        userId,
        originalAmount: amount,
        roundedAmount,
        paymentMethod,
        cartHash: null, // TODO: calculer hash du panier pour sécurité
      },
    });

    // Appeler l'API CinetPay
    const cinetPayResponse = await initiatePayment(cinetPayPayload);

    // Vérifier la réponse
    if (cinetPayResponse.code !== '00' && cinetPayResponse.code !== '201') {
      return NextResponse.json(
        {
          error: 'Erreur CinetPay',
          code: cinetPayResponse.code,
          message: cinetPayResponse.message,
        },
        { status: 400 }
      );
    }

    // Stocker la transaction pour référence future
    transactionStore[transactionId] = {
      id: transactionId,
      orderNumber,
      amount: roundedAmount,
      originalAmount: amount,
      currency,
      paymentMethod,
      channel: cinetPayChannel,
      customer,
      paymentUrl: cinetPayResponse.data?.payment_url,
      cinetPayResponse,
      createdAt: new Date().toISOString(),
    };

    // Retourner la réponse
    return NextResponse.json({
      payment_url: cinetPayResponse.data?.payment_url,
      transaction_id: transactionId,
      amount: roundedAmount,
      original_amount: amount,
      rounded: roundedAmount !== amount,
    });

  } catch (error) {
    console.error('Erreur lors de l\'initiation du paiement:', error);

    return NextResponse.json(
      {
        error: 'Erreur interne du serveur',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

// Endpoint GET pour récupérer les informations d'une transaction (pour debug)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get('transaction_id');

  if (!transactionId) {
    return NextResponse.json({ error: 'transaction_id requis' }, { status: 400 });
  }

  const transaction = transactionStore[transactionId];

  if (!transaction) {
    return NextResponse.json({ error: 'Transaction non trouvée' }, { status: 404 });
  }

  return NextResponse.json(transaction);
}
