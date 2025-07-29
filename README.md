# MonEpice&Riz - Application d'épicerie en ligne

Application e-commerce mobile-first pour MonEpice&Riz, une épicerie en ligne ciblant Abidjan, Côte d'Ivoire.

## 🚀 Démarrage rapide

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📱 Fonctionnalités principales

### Page d'accueil
- Géolocalisation "Abidjan Cocody Saint-Jean"
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

## 🛠️ Technologies utilisées

- **Next.js 14** avec App Router
- **TypeScript** pour le typage
- **Tailwind CSS** pour le styling
- **Zustand** pour la gestion d'état (panier et checkout)
- **Headless UI** pour les composants accessibles

## 📂 Structure du projet

```
monepiceriz-mvp/
├── app/                    # Pages de l'application
├── components/             # Composants réutilisables
│   ├── layout/            # Header, Footer
│   ├── product/           # ProductCard
│   ├── cart/              # CartDrawer
│   └── checkout/          # Composants du tunnel
├── lib/                   # Logique métier
│   ├── data/              # Données produits (JSON)
│   ├── stores/            # Stores Zustand
│   └── types.ts           # Types TypeScript
└── public/                # Assets statiques
```

## 🎨 Design et accessibilité

- **Mobile-first** avec adaptation desktop
- **Zones tactiles** de minimum 44px sur mobile
- **Navigation intuitive** avec breadcrumbs
- **Feedback visuel** pour toutes les actions
- **Textes clairs** adaptés à tous les âges

## 💳 Simulation de paiement

L'interface CinetPay est entièrement simulée :
- Code OTP de test : `123456`
- Taux de réussite : 90%
- Support des principaux opérateurs ivoiriens

## 🚚 Modes de livraison

- **Livraison programmée** : Créneaux de 2h (8h-20h)
- **Livraison express** : En moins de 3h (3000 F)
- **Retrait boutique** : Gratuit à Cocody Danga

## 📞 Contact

Pour toute question sur le MVP :
- 📧 contact@monepiceriz.ci
- 📱 +225 07 XX XX XX XX