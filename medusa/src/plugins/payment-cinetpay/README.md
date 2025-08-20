# Payment Plugin — CinetPay (Skeleton)

This is a skeleton for a Medusa payment processor integrating CinetPay (Mobile Money & regional cards).

Implementations to provide (depending on Medusa version used):
- Initiate payment: create transaction with `site_id`, `api_key`, `transaction_id`, `amount`, `currency=XOF`, `channels`, `return_url`, `notify_url`.
- Handle Return URL (client redirect): display intermediate state; server truth remains webhook.
- IPN (webhook): verify signature/params, revalidate transaction server-to-server, make status idempotent.
- Business control: set order to `requires_review` on paid; worker confirms stock & sets `confirmed` or `cancelled`.

Environment variables (see ../../.env.example):
- CINETPAY_API_KEY, CINETPAY_SITE_ID, CINETPAY_API_BASE, CINETPAY_RETURN_URL, CINETPAY_IPN_URL

Note: Wire this plugin into Medusa's payment provider/processor when the Medusa version is selected.
