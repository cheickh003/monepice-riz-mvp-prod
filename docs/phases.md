# Phases d’implémentation — MonEpice&Riz (MedusaJS + Next.js)

Ce document détaille, étape par étape, le plan d’implémentation pour migrer l’actuel MVP Next.js vers une architecture de production basée sur MedusaJS (backend e‑commerce) et Next.js 15 (front), avec CinetPay pour les paiements, Meilisearch pour la recherche, Cloudflare R2 pour les documents, Postgres (Neon) et Redis (Upstash).

Conçu pour 2025, ce plan s’appuie sur les bonnes pratiques actuelles. L’accès réseau étant restreint ici, les références sont fournies à titre d’orientation et devront être validées lors de l’exécution.

---

## Vue d’ensemble (résumé exécutable)
- Backend: MedusaJS (API REST, workers BullMQ/Redis) sur VPS, Postgres (Neon), Redis (Upstash), R2 (S3). Admin Medusa.
- Front: Next.js 15 (App Router, Server Actions, Tailwind, `next/image`).
- Paiement: CinetPay (Mobile Money + cartes) avec IPN → contrôle métier → confirmation.
- Recherche: Meilisearch (synonymes + tolérance fautes), plugin Medusa.
- Livraison: programmée (créneaux 2h), express, retrait; plugin « delivery-slots ».
- Docs: PDF facture et bon de préparation, stockés sur R2.
- Domaines: `monepiceriz.com` (front), `api.monepiceriz.com` (API Medusa), `admin.monepiceriz.com` (Admin).

---

## Jalons et estimation
- Phase 0–1: Pré‑requis, infra & domaines (1 semaine)
- Phase 2–4: Medusa + paiement + livraison (2–2.5 semaines)
- Phase 5–6: Recherche + Front (1.5–2 semaines)
- Phase 7–9: Admin, documents, Sécu/Observabilité (1–1.5 semaines)
- Phase 10: Tests, préprod, lancement (0.5–1 semaine)

Total MVP fonctionnel: ~5–6 semaines (hors contenus/visuels).

---

## Phase 0 — Pré‑requis & décisions
Objectif: verrouiller les choix techniques et les secrets pour éviter les blocages ultérieurs.

Tâches
- Valider les domaines finaux: `monepiceriz.com`, `api.monepiceriz.com`, `admin.monepiceriz.com`.
- Récupérer les credentials: CinetPay (site_id, api_key – env test et prod), SMTP, R2 (endpoint/bucket/key/secret), Sentry (front/back), Meilisearch (host/key).
- Choisir l’hébergement VPS (taille CPU/RAM/SSD), système (Ubuntu LTS), et la politique de sauvegarde.
- Confirmer rôles/permissions Admin Medusa: admin (tout), staff (commandes/stocks/produits CRUD), préparateur (lecture commandes + statut + quantités).
- Confirmer flux commande: IPN succès → statut intermédiaire `requires_review` → contrôle métier (stock/risques) → `confirmed` (décrément stock) sinon `cancelled`.

Livrables
- Fichier d’inventaire des secrets (vault/secrets manager) et `.env.example` pour Medusa & Front.
- Checklist conformité légale (mentions facture, CGV, politique d’annulation).

---

## Phase 1 — Infra & domaines (VPS + DNS + SSL)
Objectif: préparer un socle fiable pour Medusa, Admin et services annexes.

Tâches
- VPS: installation Docker + Docker Compose, Nginx (reverse proxy), Certbot (Let’s Encrypt) pour TLS auto‑renouvelé.
- DNS: A/AAAA pour `api.monepiceriz.com` et `admin.monepiceriz.com` → VPS; CNAME pour `monepiceriz.com` → Vercel.
- Postgres (Neon): créer projet prod + branche préprod; définir roles/read‑replica si besoin.
- Redis (Upstash): créer instance prod + dev.
- R2 (Cloudflare): créer bucket + policies (URL signées, TTL). Config plugin S3 dans Medusa (à venir).
- Meilisearch: déployer sur VPS (port dédié) ou service managé; activer l’auth par clé.
- Observabilité: créer projets Sentry (front/back), DSN prêts.

Livrables
- Repo infra (docker‑compose.yml, nginx conf, systemd si nécessaire).
- DNS validés + certificats SSL opérationnels.

---

## Phase 2 — Bootstrap MedusaJS (API + Admin + R2 + SMTP + Meilisearch)
Objectif: initialiser le backend e‑commerce complet et l’admin.

Tâches
- Initialise un projet Medusa (TypeScript), config .env (DATABASE_URL Neon, REDIS_URL Upstash, S3/R2, SMTP, MEILI_*).
- Activer Admin Medusa (déploiement sur `admin.monepiceriz.com`) et l’API sur `api.monepiceriz.com`.
- Plugins/services Medusa:
  - File service S3 → R2 (upload signé, ACL privée, URLs signées pour front).
  - Meilisearch plugin: index produits/variants, FR analyzer/typos; hooks sur events produits.
  - SMTP (Nodemailer) pour e‑mails transactionnels.
- Configuration store: Region “CI”, devise XOF, prix TTC, taux TVA de référence pour facture.

Livrables
- Projet Medusa démarré sur VPS (API + Admin). 
- R2/SMTP/Meili testés (upload image, e‑mail test, index vide opérationnel).

---

## Phase 3 — Paiement CinetPay (processor plugin)
Objectif: intégrer CinetPay nativement côté Medusa via un plugin paiement.

Tâches
- Créer un plugin « payment‑cinetpay » exposant l’interface payment processor Medusa (initiation, gestion return, IPN callback, vérification server‑to‑server).
- Initialisation: construire le `transaction_id` unique; transmettre amount, currency=XOF, channels (Orange, MTN, Moov, Wave, cartes), `return_url`, `notify_url`.
- IPN: endpoint plugin sécurisé (signature/headers), idempotence (clé par event), revalidation côté CinetPay.
- Workflow: IPN succès → `payments.status=paid` → `orders.status=requires_review`.
- Tests: sandbox CinetPay, scénarios succès/échec, retry IPN, timeouts.

Livrables
- Plugin paiement avec config (site_id, api_key, endpoints).
- Documentation d’installation et variables d’environnement.

---

## Phase 4 — Livraison & créneaux (plugin « delivery‑slots »)
Objectif: modéliser la livraison programmée, express et retrait, avec créneaux 2h et cut‑off.

Tâches
- Shipping options Medusa: retrait (gratuit), programmée (créneaux 2h), express (≤3h). Tarification par zone/option.
- Plugin « delivery‑slots »:
  - Modèle slot (date, start, end, capacity, zone, price, isExpress?).
  - API: lister/join/release slots; validation cut‑off (ex: today+3h mini).
  - Stocker le slot en metadata cart/order.
- Admin UI minimal (si nécessaire) ou via collections/metadata + docs d’usage.

Livrables
- API slots utilisable depuis le front, reliée aux shipping methods.
- Documentation process préparation (impression bon, créneau affiché).

---

## Phase 5 — Recherche (Meilisearch)
Objectif: recherche rapide avec tolérance fautes et synonymes FR.

Tâches
- Définir les champs indexés (name, brand, categories, description, tags).
- Configurer typo‑tolerance, langue FR, premières listes de synonymes (évolutives).
- Hooks Medusa pour maj index sur create/update/delete produit/variant.
- Endpoint de recherche (via Medusa plugin ou direct Meili) consommé par le front.

Livrables
- Index opérationnel + endpoints; script d’initialisation (synonymes par défaut).

---

## Phase 6 — Front Next.js (intégration Medusa)
Objectif: basculer le front pour consommer l’API Medusa et les nouveaux services.

Tâches
- Variables d’env front: `NEXT_PUBLIC_API_BASE`, `NEXT_PUBLIC_MEILI_URL`.
- Retirer les JSON locaux et Zustand panier; utiliser le cart Medusa (SDK/REST) + sélection de variants (taille/poids/contenance).
- Pages: listing catégorie/produits, fiche produit, recherche (autosuggest), panier, checkout.
- Checkout: sélection créneau (appel plugin slots), sélection shipping method, init paiement (redirect CinetPay via Medusa), écrans return/processing/success selon état serveur.
- Images: `next/image` avec URLs signées R2/transformations.

Livrables
- Front aligné (catálogo, checkout complet), feature flags pour bascule.

---

## Phase 7 — Admin & rôles
Objectif: opérer via Medusa Admin avec les rôles définis.

Tâches
- Admin Medusa sur `admin.monepiceriz.com`.
- Rôles/permissions: admin (tout), staff (commandes/stocks/produits CRUD), préparateur (lecture + statut + quantités préparées).
- Guides d’usage: gestion créneaux, mise à jour stocks, flux annulation (avant préparation seulement).

Livrables
- Admin prêt avec accès nominatifs.

---

## Phase 8 — Documents (PDF facture & bon) + R2
Objectif: générer et archiver les PDF légaux/opérationnels.

Tâches
- Service de génération PDF (Puppeteer/Chromium headless ou PDFKit) depuis templates HTML/CSS (branding MonEpice&Riz).
- Facture: numérotation `MEP-{YYYY}-{NNNN}`, prix TTC, mention « TVA incluse », NIF/raison sociale/adresse, conditions.
- Bon de préparation: détail produits/quantités/variants, slot et méthode de livraison.
- Upload vers R2, URL signée stockée dans l’order (metadata/attachments), endpoint d’export administratif (zip/date range).

Livrables
- Templates validés + stockage R2 + endpoints Admin.

---

## Phase 9 — Sécurité & Observabilité
Objectif: durcir et superviser.

Tâches
- Sécurité: CORS strict (domaines), headers (Helmet/Nginx), rate‑limit (Redis), validation Zod côté plugins.
- IPN: signature + idempotence + audit logs; quarantiner les anomalies.
- Observabilité: Sentry front/back, logs JSON, (optionnel) traces OTel.
- Backups: Neon snapshots; R2 versioning; stratégie de restauration.

Livrables
- Checklists de sécurité, dashboards Sentry, procédures de rollback.

---

## Phase 10 — Tests, préprod, lancement
Objectif: vérifier bout‑en‑bout et basculer.

Tâches
- Préprod: Neon branch + sous‑domaine staging; CinetPay sandbox; jeux de données initiaux (quelques produits/variants) ajoutés via Admin.
- Tests: 
  - Unitaires (plugins CinetPay/slots).
  - Intégration (IPN, order state machine, PDF upload R2).
  - E2E (front → paiement → IPN → contrôle métier → confirmation → PDF).
- Lancement: gel des changements, baisse TTL DNS, bascule traffic, tests réels montants faibles, monitoring rapproché.

Livrables
- Rapport de tests, check GO/NO‑GO, plan de contingence.

---

## Git, branches & CI/CD
- Branche de travail: `prod-medusa` (création après validation de ce document).
- CI/CD
  - Medusa (VPS): build Docker, déploiement via GitHub Actions + SSH/Compose; migrations DB.
  - Next (Vercel): previews sur PR, prod sur merge.
- Environnements: dev (préprod) et prod, secrets distincts.

---

## Variables d’environnement (exemples)
- Medusa: `DATABASE_URL`, `REDIS_URL`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MEILI_HOST`, `MEILI_API_KEY`.
- CinetPay: `CINETPAY_API_KEY`, `CINETPAY_SITE_ID`, `CINETPAY_API_BASE`, `CINETPAY_RETURN_URL`, `CINETPAY_IPN_URL`.
- Front: `NEXT_PUBLIC_API_BASE`, `NEXT_PUBLIC_MEILI_URL`, `SENTRY_DSN`.

---

## Références (à valider lors de l’implémentation)
- MedusaJS (core, plugins, admin): https://docs.medusajs.com/
- CinetPay (paiements, IPN, vérification): https://docs.cinetpay.com/
- Meilisearch (synonymes, typo tolerance): https://www.meilisearch.com/docs
- Cloudflare R2 (S3‑compatible): https://developers.cloudflare.com/r2
- Neon (Postgres managé): https://neon.tech/docs
- Upstash Redis: https://upstash.com/docs
- BullMQ (queues Node/Redis): https://docs.bullmq.io/
- Vercel (Next.js deploy): https://vercel.com/docs
- Nginx + Let’s Encrypt: https://nginx.org/ • https://certbot.eff.org/

---

## Acceptation & critères de complétion par phase (extraits)
- Paiement: un paiement sandbox CinetPay aboutit à `paid` → `requires_review` → `confirmed` avec décrément stock et e‑mail.
- Livraison: un slot valide est sélectionnable, stocké en metadata, visible en Admin et dans les documents PDF.
- Recherche: une requête fautive (« escargau ») retourne « escargot » (synonymes/typos) dans un délai < 200 ms.
- Documents: facture & bon PDF générés, archivés R2, accessibles via Admin, export massif disponible.
- Sécu/Obs: Sentry capte 100% des erreurs non gérées; IPN idempotent et signé; backups validés.

---

## Notes sur l’état actuel du repo
- Front existant Next.js (MVP) avec données JSON locales et Zustand.
- Actions prévues:
  - Supprimer l’usage des JSON (catalogue géré par Medusa).
  - Introduire un client/API Medusa côté front pour cart/produits.
  - Adapter le checkout à la logique serveur (Medusa + CinetPay), remplacer les simulations.

---

Dernière mise à jour: 2025‑08‑20
