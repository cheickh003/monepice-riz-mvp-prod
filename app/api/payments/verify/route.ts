import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment, mapCinetPayStatus } from '@/lib/payments/cinetpay';

// Stockage temporaire des transactions (en production, utiliser une vraie DB)
// Note: Cette variable est partagée avec les autres endpoints
const transactionStore: Record<string, any> = {};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transaction_id } = body;

    if (!transaction_id) {
      return NextResponse.json(
        { error: 'transaction_id requis' },
        { status: 400 }
      );
    }

    // Vérifier d'abord dans notre stockage local
    const localTransaction = transactionStore[transaction_id];

    // Appeler l'API CinetPay pour vérifier le statut
    let cinetPayResponse;
    try {
      cinetPayResponse = await verifyPayment(transaction_id);
    } catch (error) {
      console.error('Erreur lors de la vérification CinetPay:', error);

      // Si l'API CinetPay échoue, retourner les informations locales si disponibles
      if (localTransaction) {
        return NextResponse.json({
          code: 'LOCAL_DATA',
          message: 'Données locales utilisées (API CinetPay indisponible)',
          data: {
            status: localTransaction.status || 'pending',
            payment_method: localTransaction.paymentMethod,
            amount: localTransaction.amount,
            currency: localTransaction.currency,
          },
          local_data: true,
        });
      }

      return NextResponse.json(
        {
          error: 'Erreur lors de la vérification du paiement',
          message: error instanceof Error ? error.message : 'Erreur inconnue',
        },
        { status: 500 }
      );
    }

    // Si on a une réponse valide de CinetPay
    if (cinetPayResponse.data) {
      const cinetPayStatus = cinetPayResponse.data.status;
      const mappedStatus = mapCinetPayStatus(cinetPayStatus);

      // Mettre à jour notre stockage local avec les dernières infos
      if (localTransaction) {
        transactionStore[transaction_id] = {
          ...localTransaction,
          status: mappedStatus,
          paymentCode: cinetPayResponse.code,
          paymentMessage: cinetPayResponse.message,
          verifiedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      return NextResponse.json({
        code: cinetPayResponse.code,
        message: cinetPayResponse.message,
        data: {
          ...cinetPayResponse.data,
          status: mappedStatus, // Utiliser notre mapping
        },
      });
    }

    // Réponse sans data (erreur CinetPay)
    return NextResponse.json({
      code: cinetPayResponse.code,
      message: cinetPayResponse.message,
      data: null,
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du paiement:', error);

    return NextResponse.json(
      {
        error: 'Erreur interne du serveur',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

// Endpoint GET pour vérifier une transaction via query param
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get('transaction_id');

  if (!transactionId) {
    return NextResponse.json({ error: 'transaction_id requis' }, { status: 400 });
  }

  // Simuler une requête POST
  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ transaction_id: transactionId }),
    headers: { 'Content-Type': 'application/json' },
  });

  return POST(mockRequest);
}
