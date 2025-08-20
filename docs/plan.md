# MonEpice&Riz — Plan de mise en production (MedusaJS + Next.js)

## Contexte et objectifs
- Transformer le MVP actuel en application e-commerce fonctionnelle avec MedusaJS comme backend e‑commerce et Next.js 15 pour le front.
- Cible: Abidjan (Côte d’Ivoire). Catalogue avec variantes (taille/poids/contenance), panier, commande, paiement CinetPay (Mobile Money + cartes UEMOA), livraison programmée/express/retrait, documents (facture, bon de préparation) stockés dans R2.
- Priorités: fiabilité paiements, gestion stock unifié, UX mobile-first, sécurité, observabilité.

## Stack validée
- Backend e‑commerce: MedusaJS sur VPS (API REST, workflows/queues). DB Postgres (Neon en prod, Postgres local en dev). Cache/queue Redis (Upstash en prod, Redis local en dev).
- Front web: Next.js 15, App Router, Server Actions, Tailwind CSS. `next/image` pour images optimisées.
- Paiements: CinetPay (Mobile Money: Orange, MTN, Moov, Wave; cartes). Tous canaux activés. IPN/return dédiés.
- Recherche: Meilisearch (open source) via plugin Medusa, avec tolérance fautes et synonymes FR.
- Stockage fichiers: Cloudflare R2 (S3-compatible) via plugin S3 Medusa (upload signé). Archivage factures et bons.
- Emails: SMTP (Nodemailer/Medusa plugin) pour e‑mails transactionnels (commande reçue, confirmée, créneau, etc.).
- Déploiement: Medusa (Docker) + workers sur VPS (reverse proxy Nginx, SSL). Front Next.js sur Vercel. Neon/Upstash/R2 managés.
- Domaines: `monepiceriz.com` (front), `api.monepiceriz.com` (Medusa), `admin.monepiceriz.com` (Medusa Admin). CORS/SSL configurés.

## Architecture cible
- Medusa (VPS):
  - Services: API REST, Admin Medusa, workers queues (BullMQ via Redis).
  - Plugins: CinetPay (paiement), S3/R2 (médias), Meilisearch (recherche), SMTP (e‑mail).
  - Webhook IPN CinetPay géré par Medusa (plugin) avec idempotence + revalidation serveur.
- Next.js (Vercel):
  - Site et checkout (App Router + Server Actions) consommant l’API Medusa.
  - Aucune logique critique de paiement côté Next (source de vérité = Medusa).
- Persistances: Neon (Postgres), Upstash (Redis), R2 (objets), Meilisearch (VPS/managed selon choix).
- Sécurité: secrets env, HTTPS partout, CORS strict (domaines ci‑dessus), rate limiting (Redis), CSRF sur formulaires admin si besoin.

## Modélisation métier (alignée Medusa)
- Région/Monnaie: Region “CI”, devise XOF, prix TTC (stockage TTC). Conserver un taux TVA de référence pour les factures (affichage “TVA incluse”).
- Produits & Variantes:
  - Product options: Taille, Poids, Contenance (combinables). Variants générés par combinaison avec SKU unique.
  - Prix TTC par variant. Images via R2. Attributs (épicerie, frais/sec, etc.) sous catégories/collections.
- Stock: unifié (un seul entrepôt logique) via inventory service Medusa.
- Livraison:
  - Shipping options: Retrait boutique (gratuit), Livraison programmée (créneaux 2h), Livraison express.
  - Créneaux: module personnalisé (plugin) “delivery-slots” (8h–20h par défaut; cut-off applicables) stockant le slot en metadata de cart/order et validant la capacité.
  - Frais: barèmes par zone/option (modélisés en shipping options/rates). Gratuité possible au‑delà d’un seuil (configurable Admin).
- Commandes & Annulations:
  - Annulation autorisée uniquement avant préparation. Après “preparing”, annulation interdite (pas de remboursement technique prévu).
- Documents (PDF): 
  - Facture et bon de préparation générés à la demande (events order) et stockés R2 avec URLs signées. Numérotation ex: `MEP-{YYYY}-{NNNN}`.

## Paiement CinetPay — flux et contrôle métier
1) Checkout → création de cart/order côté Medusa (Next consomme l’API Medusa).
2) Init paiement (Medusa Payment Processor CinetPay):
   - Appel CinetPay avec `site_id`, `api_key`, `transaction_id`, `amount`, `currency=XOF`, `channels`, `return_url`, `notify_url`.
   - Retourne URL de redirection client.
3) IPN (plugin Medusa):
   - Reçoit payload CinetPay → vérifie signature/paramètres → revalide transaction côté CinetPay (server-to-server).
   - Si “succès”: marquer paiement “paid” mais commande passe par statut intermédiaire “requires_review” (contrôle métier) avant “confirmed”.
   - Si “échec”: marquer “failed”; commande reste “pending/cancelled”.
4) Contrôle métier (worker/queue):
   - Vérifie disponibilité finale (stock), règles internes; si OK → `confirmed` + décrément stock; sinon `cancelled`.
5) Return URL (front):
   - Affiche traitement puis confirmation; la source de vérité reste l’état côté Medusa.

Sécurité & idempotence:
- `transaction_id` unique; idempotence par event; vérification serveur systématique auprès de CinetPay.

## Recherche (Meilisearch)
- Index produits/variants avec champs FR (name, brand, categories, description). 
- Synonymes FR (à enrichir au fil de l’eau). 
- Tolérance fautes activée; boosters sur popularité/stock.
- Mise à jour de l’index via events produits Medusa.

## Rôles & permissions (Admin Medusa)
- Admin: accès total.
- Staff: commandes (lecture/MAJ statut), stocks (ajustements), produits (CRUD).
- Préparateur: lecture commandes, mise à jour du statut (préparé/partiel), ajustement quantités réellement préparées.

## Emails (SMTP)
- Gabarits transactionnels: commande reçue, paiement validé, créneau confirmé, commande en préparation/en livraison, commande livrée.
- Envoi via SMTP (Nodemailer plugin Medusa) et logs basiques.

## Noms de domaines & SSL
- Front: `monepiceriz.com`
- API Medusa: `api.monepiceriz.com`
- Admin Medusa: `admin.monepiceriz.com`
- IPN/return CinetPay configurés vers le domaine API/Admin selon besoin.

## Déploiement & Ops
- Medusa: Docker (API + worker) sur VPS; Nginx reverse proxy; SSL (Let’s Encrypt). 
- Next: Vercel (preview + prod). 
- DB/Cache/Objets: Neon/Upstash/R2 managés en prod; Postgres/Redis locaux en dev.
- Observabilité: Sentry pour front/back; logs structurés JSON; traces (OTel) optionnelles.

## Roadmap (phases)
1) Setup plateforme (0.5–1 sem)
   - VPS (Docker, Nginx, SSL), projets Neon/Upstash/R2, Meilisearch. Secrets env. 
   - Déploiement Next sur Vercel. CORS/SSL/domains.
2) Base Medusa (0.5–1 sem)
   - Config store région CI (XOF, TTC), SMTP, R2 (plugin S3), Meilisearch (plugin), rôles/permissions.
3) Catalogue from scratch (1 sem)
   - Modéliser options/variants (taille/poids/contenance). Catégories/collections. Médias R2. Admin Medusa pour CRUD.
4) Livraison & créneaux (1 sem)
   - Shipping options (retrait/programmée/express), règles de frais. Plugin “delivery-slots” (créneaux 2h, cut‑off, capacité), UI Next pour la sélection.
5) Paiement CinetPay (1–1.5 sem)
   - Processor plugin (init, return, IPN). Idempotence, revalidation. Workflow “requires_review” → “confirmed”.
6) Checkout Next (0.5–1 sem)
   - Panier/checkout liés Medusa, sélection créneau, redirection paiement, écrans confirmation.
7) Documents PDF (0.5 sem)
   - Service PDF (facture, bon), stockage R2, liens Admin et endpoint d’export administratif.
8) Recherche (0.5 sem)
   - Index, synonymes FR initiaux, intégration front (autosuggest, typo‑tolerance).
9) Durcissement & lancement (0.5 sem)
   - Sentry, policies annulation, tests paiements (env test CinetPay), hardening (CSP, headers), go‑live.

Estimation: ~5–6 semaines MVP fonctionnel (hors contenus/visuels).

## Variables d’environnement (exemples)
- Medusa: DATABASE_URL (Neon), REDIS_URL (Upstash), S3/R2: R2_ENDPOINT/R2_BUCKET/R2_KEY/R2_SECRET, SMTP_*.
- CinetPay: CINETPAY_API_KEY, CINETPAY_SITE_ID, CINETPAY_API_BASE, CINETPAY_RETURN_URL, CINETPAY_IPN_URL.
- Meilisearch: MEILI_HOST, MEILI_API_KEY.
- Front: NEXT_PUBLIC_API_BASE, NEXT_PUBLIC_MEILI_URL.

## Nettoyage du MVP actuel
- Supprimer les JSON produits/catégories existants côté front. 
- Tout le catalogue sera créé dans Medusa Admin et servi par l’API Medusa. 
- Le front Next consommera l’API Medusa (pas de données locales).

---
Dernière mise à jour: 2025-08-20 (stack MedusaJS + Next.js validée et précisions client intégrées).
