# Medusa Backend (Skeleton)

This folder contains a minimal scaffold to host a MedusaJS backend plus custom plugins.

Current state:
- Express server stub (src/server.ts) with health route.
- Skeleton plugins:
  - payments/cinetpay (init + IPN stubs)
  - delivery-slots (list/reserve/release stubs)
- Ops compose for local dev: see ../ops/docker-compose.yml
- Environment templates: .env.example

Next steps:
1) Choose Medusa version (v1 vs v2) and install dependencies accordingly.
2) Replace Express stub with actual Medusa bootstrap (config, loaders, modules) and mount plugin providers.
3) Implement CinetPay processor (init, IPN, verification, business control) and delivery-slots plugin.
4) Wire Meilisearch, R2 (S3 file service), SMTP, Redis queues.
5) Configure domains/api/admin and deploy to VPS (Docker + Nginx + SSL).

Note: This repo is initialized on branch `prod-medusa` to track all related changes.
