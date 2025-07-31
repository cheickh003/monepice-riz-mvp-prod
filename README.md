# MonEpice&Riz - Application d'épicerie en ligne

Application e-commerce mobile-first pour MonEpice&Riz, une épicerie en ligne ciblant Abidjan, Côte d'Ivoire. Spécialistes des escargots et crabes de qualité de San Pedro.

## 🏗️ État du projet

**Phase actuelle**: Phase 0 - Infrastructure et fondations  
**Statut**: Infrastructure setup complétée ✅  
**Prochaine étape**: Développement des fonctionnalités e-commerce

Cette version établit les fondations techniques robustes avec Appwrite (backend), CinetPay (paiements), et Sentry (monitoring) pour supporter la croissance future de MonEpice&Riz.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 20 LTS ou supérieur
- npm ou yarn
- Comptes créés sur :
  - [Appwrite Cloud](https://cloud.appwrite.io)
  - [CinetPay](https://console.cinetpay.com) (sandbox pour développement)
  - [Sentry](https://sentry.io)

### Installation

```bash
# Cloner le projet
git clone <repository-url>
cd monepiceriz-mvp

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env.local
# Éditer .env.local avec vos configurations
```

### Configuration des services

**📚 Guides de configuration détaillés :**
- [Configuration de l'environnement](./docs/setup/ENVIRONMENT_SETUP.md) - Configuration complète des environnements
- [Configuration Appwrite](./docs/setup/APPWRITE_SETUP.md) - Base de données et authentification  
- [Configuration CinetPay](./docs/setup/CINETPAY_SETUP.md) - Passerelle de paiement
- [Configuration Sentry](./docs/setup/SENTRY_SETUP.md) - Monitoring et erreurs

### Lancement

```bash
# Lancer le serveur de développement
npm run dev

# Lancer en mode staging
npm run dev:staging

# Build pour la production
npm run build
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📱 Fonctionnalités principales

### Page d'accueil
- Présence à Abidjan (Cocody et Koumassi)
- 6 catégories principales (Frais, Sec, Boissons, Entretien, Bébés, Promo)
- Section "Achats fréquents" pour faciliter les réassorts
- Promotions mises en avant

### Catalogue produits
- 95 produits répartis en différentes catégories
- Filtres par prix, marque et disponibilité
- Tri par pertinence, prix et notes
- Cartes produits avec ajout rapide au panier

### Panier persistant
- Gestion des quantités avec boutons +/-
- Sauvegarde automatique dans le localStorage
- Drawer accessible depuis toutes les pages
- Calcul automatique des frais (livraison + préparation)

### Tunnel de commande
1. **Récapitulatif panier** avec option invité/compte
2. **Livraison** avec:
   - Choix entre livraison à domicile ou retrait gratuit
   - Sélection de créneaux horaires (2h) ou express (≤3h)
   - Formulaire d'adresse avec validation
3. **Paiement** avec simulation CinetPay:
   - Mobile Money (Orange, MTN, Moov, Wave)
   - Carte bancaire
   - Paiement à la livraison
4. **Confirmation** avec numéro de commande et timeline

### Autres pages
- Détail produit avec galerie, avis et produits similaires
- Liste des commandes avec statuts
- Page compte utilisateur

## 🛠️ Stack technologique

### Frontend
- **Next.js 15.4.4** avec App Router et React Server Components
- **TypeScript** pour la sécurité de type et la documentation
- **Tailwind CSS** pour le styling responsive mobile-first
- **React Context** pour la gestion d'état d'authentification

### Backend et Services
- **Appwrite** - Backend-as-a-Service (BaaS)
  - Base de données NoSQL avec collections typées
  - Authentification et gestion des sessions
  - Stockage de fichiers avec CDN
  - Fonctions serverless pour la logique métier

### Paiements
- **CinetPay** - Passerelle de paiement pour l'Afrique de l'Ouest
  - Mobile Money (Orange Money, MTN, Moov, Wave)
  - Cartes bancaires Visa/Mastercard
  - Paiements en espèces via réseau d'agents

### Monitoring et Observabilité
- **Sentry** - Monitoring d'erreurs et de performance
  - Capture d'erreurs en temps réel
  - Monitoring de performance avec Web Vitals
  - Session replay pour le débogage
  - Intégration avec les alertes métier

### Outils de développement
- **Zod** - Validation de schémas et variables d'environnement
- **ESLint & Prettier** - Qualité et formatage du code
- **Husky** - Git hooks pour la qualité du code

## 📂 Structure du projet

```
monepiceriz-mvp/
├── app/                          # App Router (Next.js 15)
│   ├── (marketing)/             # Groupe de routes marketing
│   ├── (store)/                 # Groupe de routes e-commerce
│   ├── api/                     # Routes API et webhooks
│   │   └── webhooks/           # Webhooks CinetPay, etc.
│   ├── globals.css
│   ├── layout.tsx              # Layout racine avec providers
│   └── page.tsx                # Page d'accueil
├── components/                   # Composants UI réutilisables
│   ├── ui/                     # Système de design
│   ├── features/               # Composants métier
│   └── layout/                 # Composants de mise en page
├── lib/                         # Configuration et services
│   ├── appwrite.ts            # Configuration Appwrite
│   ├── config/                # Configuration d'environnement
│   │   └── environment.ts     # Validation Zod des env vars
│   ├── services/              # Services externes
│   │   └── cinetpay.ts       # Service CinetPay
│   ├── types/                 # Définitions TypeScript
│   │   └── auth.ts           # Types d'authentification
│   └── utils/                 # Utilitaires
├── providers/                   # Providers React Context
│   └── AuthProvider.tsx       # Provider d'authentification
├── docs/                       # Documentation complète
│   ├── setup/                 # Guides de configuration
│   └── ADR/                   # Architecture Decision Records
├── public/                     # Assets statiques
├── sentry.*.config.ts         # Configuration Sentry
├── next.config.ts             # Configuration Next.js + Sentry
└── .env.example               # Template variables d'environnement
```

## 🌍 Environnements

Le projet utilise une stratégie à trois environnements pour assurer la qualité et la sécurité :

| Environnement | Domaine | Base de données | Paiements | Usage |
|---------------|---------|-----------------|-----------|-------|
| **Development** | `localhost:3000` | `monepiceriz-dev` | CinetPay Sandbox | Développement local |
| **Staging** | `staging.monepiceriz.ci` | `monepiceriz-staging` | CinetPay Sandbox | Tests et QA |
| **Production** | `monepiceriz.ci` | `monepiceriz-prod` | CinetPay Production | Application live |

Chaque environnement dispose de ses propres :
- Projet Appwrite avec base de données isolée
- Configuration CinetPay (sandbox/production)
- Projet Sentry pour le monitoring
- Variables d'environnement sécurisées

## 📚 Documentation

### Guides de configuration
- [**Configuration de l'environnement**](./docs/setup/ENVIRONMENT_SETUP.md) - Guide complet pour configurer dev/staging/prod
- [**Configuration Appwrite**](./docs/setup/APPWRITE_SETUP.md) - Base de données, authentification, stockage
- [**Configuration CinetPay**](./docs/setup/CINETPAY_SETUP.md) - Intégration paiement Mobile Money
- [**Configuration Sentry**](./docs/setup/SENTRY_SETUP.md) - Monitoring, alertes, performance

### Architecture Decision Records (ADR)
- [**ADR-001**](./docs/ADR/001-backend-service-selection.md) - Choix d'Appwrite comme BaaS
- [**ADR-002**](./docs/ADR/002-payment-gateway-selection.md) - Sélection de CinetPay pour les paiements
- [**ADR-003**](./docs/ADR/003-monitoring-error-tracking.md) - Stratégie de monitoring avec Sentry
- [**ADR-004**](./docs/ADR/004-frontend-architecture.md) - Architecture Next.js 15 avec App Router
- [**ADR-005**](./docs/ADR/005-environment-deployment-strategy.md) - Stratégie de déploiement 3 environnements

## 🔧 Workflow de développement

### Scripts disponibles

```bash
# Développement
npm run dev                    # Serveur de développement
npm run dev:staging           # Mode staging
npm run build                 # Build production
npm run start                 # Serveur production

# Qualité du code
npm run lint                  # ESLint
npm run lint:fix             # Correction automatique
npm run type-check           # Vérification TypeScript

# Configuration
npm run env:check            # Vérifier les variables d'env
npm run health:check         # Tester les connexions services
```

### Validation des environnements

Le système valide automatiquement les variables d'environnement au démarrage :
- **Développement** : Validation souple, debugging activé
- **Staging** : Validation stricte, monitoring complet  
- **Production** : Validation maximale, optimisations activées

## 🎨 Design et accessibilité

- **Mobile-first** avec adaptation desktop
- **Zones tactiles** de minimum 44px sur mobile
- **Navigation intuitive** avec breadcrumbs
- **Feedback visuel** pour toutes les actions
- **Textes clairs** adaptés à tous les âges

## 💳 Intégration CinetPay

**Phase actuelle** : Configuration et interfaces TypeScript complètes ✅  
**Prochaine étape** : Implémentation des flux de paiement réels

### Méthodes de paiement supportées

**Mobile Money (Côte d'Ivoire)** :
- 🟠 **Orange Money** - Leader du marché ivoirien
- 🟡 **MTN Mobile Money** - Large couverture réseau
- 🟢 **Moov Money** - Opérateur historique
- 🟣 **Wave** - Portefeuille numérique innovant

**Autres méthodes** :
- 💳 **Visa/Mastercard** - Cartes locales et internationales
- 🏛️ **Virements bancaires** - Intégration directe banques
- 💰 **Paiement espèces** - Réseau d'agents CinetPay

### Configuration sandbox

Pour les tests de développement :
```bash
# Variables d'environnement de test
CINETPAY_API_KEY=sandbox-api-key
CINETPAY_SITE_ID=sandbox-site-id
CINETPAY_SECRET_KEY=sandbox-secret-key
```

**Numéros de test Mobile Money** :
- Succès : `+2250143215478`
- Fonds insuffisants : `+2250143215479`
- Timeout : `+2250143215480`

## 🔒 Sécurité et Monitoring

### Monitoring avec Sentry

**Surveillance en temps réel** :
- 🚨 **Capture d'erreurs** automatique avec contexte détaillé
- 📊 **Monitoring de performance** avec Web Vitals
- 🎥 **Session replay** pour reproduire les problèmes utilisateur
- 📱 **Alertes intelligentes** sur Slack et email

**Configuration par environnement** :
- **Développement** : Capture complète pour debugging
- **Staging** : Monitoring production-like pour validation
- **Production** : Surveillance optimisée avec échantillonnage

### Sécurité

**Protection des données** :
- 🔐 **Chiffrement** des données sensibles (Appwrite)
- 🛡️ **Filtrage automatique** des informations personnelles (Sentry)
- 🔑 **Gestion sécurisée** des clés API et secrets
- 📝 **Audit trails** pour traçabilité complète

**Conformité** :
- **BCEAO** - Conformité bancaire Afrique de l'Ouest
- **PCI DSS** - Sécurité des données de cartes (via CinetPay)
- **RGPD** - Protection des données utilisateurs européens
- **Côte d'Ivoire** - Respect de la réglementation locale

## 🚚 Modes de livraison

- **Livraison programmée** : Créneaux de 2h (8h-20h)
- **Livraison express** : En moins de 3h (3000 F)
- **Retrait boutique** : Gratuit dans nos 2 magasins (Cocody et Koumassi)

## 🚀 Prochaines étapes

### Phase 1 : Fonctionnalités E-commerce (Q2 2025)
- Interface utilisateur complète avec catalogue produits
- Panier et tunnel de commande fonctionnels  
- Intégration paiement CinetPay en production
- Gestion des commandes et notifications clients

### Phase 2 : Optimisations et Croissance (Q3 2025)
- Application mobile (PWA avancée)
- Système de fidélité et promotions
- Analytics avancées et business intelligence
- Expansion géographique (autres villes)

### Phase 3 : Intelligence et Scale (Q4 2025)
- Recommandations personnalisées
- Optimisation logistique avec IA
- Programme partenaires et marketplace
- Intégration écosystème fintech africain

## 📞 Contact et Support

### Développement et Technical
- 📧 **Questions techniques** : dev-team@monepiceriz.ci
- 📚 **Documentation** : Voir dossier `/docs/` pour guides détaillés
- 🐛 **Bugs et Issues** : Créer une issue dans le repository Git
- 💬 **Support infrastructure** : Consulter les guides de configuration

### Business et Opérations
- 📧 **Contact général** : contact@monepiceriz.ci
- 🏪 **Support magasins** : Voir coordonnées ci-dessous

**Nos magasins physiques :**
- 🏪 **MonEpice&Riz Cocody** : 0161 888 888
- 🏪 **MonEpice&Riz Koumassi** : 0172 089 090
  - Centre commercial CONDOR, Boulevard du 7 décembre
  - En face du marché Djè Konan

---

**MonEpice&Riz** - Épicerie en ligne premium pour la Côte d'Ivoire  
*Spécialistes des escargots et crabes de qualité de San Pedro depuis 2024*