# Admin Medusa — Mise en place (v2)

Ce document décrit comment déployer l’interface Admin Medusa (v2) sur `admin.monepiceriz.com`.

## 1) Choisir l’Admin v2
- Utiliser l’Admin officiel Medusa v2 (Next/React). 
- Créer un projet admin séparé (repository dédié) ou sous `admin/` dans ce monorepo.

## 2) Configuration de l’Admin
- Variables d’environnement typiques:
  - `NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.monepiceriz.com`
  - `ADMIN_SESSION_SECRET=<secret>`
- Authentification: utilisation de l’auth Medusa (utilisateurs Admin).

## 3) Déploiement
- Méthode recommandée: Docker + Nginx sur VPS (même hôte que l’API), ou Vercel si pris en charge.
- Nginx: proxy `admin.monepiceriz.com` vers le conteneur admin (port interne), SSL via Let’s Encrypt.

## 4) Liens avec l’API
- Assurez-vous que l’API Medusa est accessible sur `https://api.monepiceriz.com` (CORS activé pour le domaine admin).
- Vérifier la création d’un compte admin et l’accès.

## 5) Checklist
- Accès Admin via HTTPS (pas d’erreur mixed content)
- CORS OK entre admin et API
- Rôles: admin, staff, préparateur (permissions conformes au plan)
- Pages: Produits, Variantes, Stocks, Commandes, Paramètres

Note: Cette implémentation dépend de la version officielle de l’Admin v2. Les artefacts de build et l’image Docker/tag exact sont à confirmer lors de l’installation.
