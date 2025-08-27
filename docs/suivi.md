# Suivi d’avancement — MonEpice&Riz (MedusaJS + Next.js)

Ce document trace l’implémentation par rapport au plan dans `docs/plan.md` et sert d’historique des changements appliqués au repo.

## Statut par phase (résumé)
- Phase 1 — Infra & domaines: partiel (local)
  - OK: `ops/docker-compose.yml` (Postgres, Redis, Meilisearch, backend). Pas encore Nginx/SSL/DNS prod.
- Phase 2 — Base Medusa: en cours
  - Backend actuellement sur un serveur Express “squelette” avec plugins internes; `medusa/medusa-config.ts` exporte les configs (DB/Redis/R2/Meili/CinetPay). Bootstrap Medusa v2 planifié (installation des paquets v2 encore à faire hors sandbox).
- Phase 3 — Catalogue: non fait
  - Front consomme toujours `lib/data/*.json` pour produits; la bascule vers Medusa reste à faire.
- Phase 4 — Livraison & créneaux: livré (backend Express + services Redis), front branché aux endpoints.
- Phase 5 — Paiement CinetPay: livré côté endpoints (init/IPN + idempotence + revalidation serveur), front tente l’init et retombe en simulation si indisponible.
- Phase 6 — Checkout Next: partiel
  - UI complète, slots via API; init paiement tenté. Panier toujours local (Zustand) pour l’instant.
- Phase 7 — Documents PDF: non fait.
- Phase 8 — Recherche (Meilisearch): partiel (wrapper + health), pas d’index produits ni hooks.
- Phase 9 — Sécurité/Observabilité: non fait.
- Phase 10 — Tests/Lancement: non fait.

## Changements livrés (par zones)

### Backend (medusa/)
- Paiement CinetPay
  - `medusa/src/plugins/payment-cinetpay/index.ts`: routes `POST /payments/cinetpay/init` et `POST /payments/cinetpay/ipn` avec idempotence (Redis) et revalidation côté serveur.
  - `medusa/src/services/cinetpay-client.ts`: client CinetPay (paymentInit/checkPayStatus + signature simplifiée).
- Créneaux de livraison
  - `medusa/src/plugins/delivery-slots/index.ts`: `GET /delivery/slots`, `POST /delivery/slots/reserve`, `POST /delivery/slots/release`, `GET /delivery/slots/next-available`.
  - `medusa/src/services/slots.ts`: génération créneaux (2h 08:00–20:00, cut-off 3h, express journée).
  - `medusa/src/services/slots-capacity.ts`: gestion capacité/réservations sur Redis (TTL, nettoyage).
- Idempotence et file de revue commande
  - `medusa/src/utils/idempotency.ts`: SETNX Redis (IPN et init paiement).
  - `medusa/src/queues/order-review.ts` + `medusa/src/queues/order-review.worker.ts`: queue BullMQ + worker (contrôle métier simulé, “requires_review” → confirmé/annulé).
- Bootstrap et configuration
  - `medusa/medusa-config.ts`: export configs `httpConfig`, `databaseConfig`, `redisConfig`, `storageConfig`, `meiliConfig`, `storeConfig`, `cinetpayConfig` (sans dépendre des packages v2 pour compiler hors réseau).
  - `medusa/src/server.ts`: enregistre les plugins CinetPay + delivery-slots, ajoute endpoints de tests `/test/db|/test/redis|/test/meilisearch` et `/health`. Des routes “simplifiées” de slots (fallback) restent présentes tant que l’intégration complète n’est pas basculée.
  - `medusa/tsconfig.json`: inclut `medusa-config.ts`, exclut les artefacts v2 (`src/api`, `src/scripts`) pour un build propre; `types/nodemailer.d.ts` ajouté.

### Front (Next.js)
- Client API
  - `lib/api/client.ts`: `apiFetch` + stubs `apiClient` (cart minimal côté client, endpoints slots), types Medusa minimaux.
  - `lib/api/slots.ts`: helpers `fetchSlots`, `reserveSlot`, `releaseSlot`.
  - `lib/cart-id.ts`: génération/persistance d’un `cartId`.
- Checkout
  - `app/checkout/delivery/page.tsx`: charge les slots depuis l’API, réserve/libère via backend, fallback si échec.
  - `app/checkout/payment/page.tsx`: appelle `/payments/cinetpay/init`; si URL reçue → redirection, sinon simulation de paiement existante.
- TypeScript front
  - `tsconfig.json` (racine): exclut `medusa/**` pour éviter les erreurs types Medusa v2 lors du build Next.

## Tests réalisés
- Build backend: `cd medusa && npm run build` → OK.
- Démarrage local: bloqué par la sandbox ici (listen EPERM). Attendu OK sur machine/serveur:
  - `cd medusa && npm run dev` (ou via Docker: `cd ops && docker compose up -d`).
- Vérifications HTTP attendues:
  - `GET /health` → JSON ok: true.
  - `GET /delivery/slots?date=YYYY-MM-DD` → créneaux générés.
  - `POST /delivery/slots/reserve` body: `{ "cartId": "test-1", "slotId": "YYYY-MM-DD-1000-1200" }` → success.
  - `POST /payments/cinetpay/init` body min: `{ "orderId":"test-123","amount":1500 }` → dépend de `CINETPAY_*` et du réseau.

Notes: le front a des erreurs TypeScript préexistantes (ex. `rating` optionnel sur certaines pages). Elles seront adressées lors de la bascule catalogue → API Medusa.

## Prochaines étapes
1) Installer Medusa v2 et booter l’app (modules DB/Redis/file/search), brancher les plugins comme providers v2, retirer les routes de fallback “simplifiées”.
2) Exposer le catalogue via Medusa (produits/variantes) + Meilisearch, puis basculer le front (suppression `lib/data/*.json`, usage `lib/products-api.ts` avec de vrais endpoints).
3) Finaliser CinetPay: signature/validation selon doc officielle, persistance des paiements/commandes (DB), et état “requires_review” → worker confirmé.
4) Documents PDF (facture/bon) vers R2 + endpoints Admin.
5) Infra VPS: Nginx + SSL + domaines, CI/CD, CORS/headers, rate-limit.

## Risques/Points d’attention
- Signature CinetPay actuellement simplifiée: à aligner strictement avec leur documentation avant prod.
- Concurrence sur les réservations de créneaux: l’implémentation Redis est atomique (multi/expire), mais il faudra intégrer la metadata cart/order Medusa v2.
- Écart temporaire entre Express et Medusa v2: re-tester bout-en-bout après le swap.

## Variables d’environnement (rappel backend)
- DB/Redis: `DATABASE_URL`, `REDIS_URL`
- R2: `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Meili: `MEILI_HOST`, `MEILI_API_KEY`
- CinetPay: `CINETPAY_API_KEY`, `CINETPAY_SITE_ID`, `CINETPAY_API_BASE`, `CINETPAY_RETURN_URL`, `CINETPAY_IPN_URL`

Dernière mise à jour: 2025-08-22

