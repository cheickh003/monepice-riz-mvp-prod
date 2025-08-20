// Skeleton for CinetPay payment processor plugin
// Fill with Medusa payment processor implementation once Medusa version is chosen.

import type { Request, Response } from 'express';

export function registerCinetPayRoutes(app: import('express').Express) {
  app.post('/payments/cinetpay/init', initPayment);
  app.post('/payments/cinetpay/ipn', ipnHandler);
}

async function initPayment(req: Request, res: Response) {
  // TODO: Validate body: orderId, amount, customer phone/email, channels
  // TODO: Create transaction with CinetPay, return redirect URL or token
  res.status(501).json({ error: 'Not Implemented', step: 'initPayment' });
}

async function ipnHandler(req: Request, res: Response) {
  // TODO: Verify signature/params; revalidate transaction server-to-server
  // TODO: Mark payment paid -> order requires_review (idempotent)
  res.status(200).json({ ok: true });
}

