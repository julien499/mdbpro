# MDB Pro — Simulateur Marchand de Biens

> Simulateur professionnel pour marchands de biens immobiliers.  
> Ligne Euribor in fine, IS 2024, TVA sur marge, dossier banque PDF, freemium Stripe.

**Stack :** HTML/CSS/JS vanilla · Vercel (hosting + API) · Stripe (paiement)  
**Domaine :** mdbpro.fr  
**Prix :** Gratuit (simulation) · Pro 49€/mois (PDF, Euribor avancé, sauvegarde)

---

## Architecture

```
mdbpro/
├── index.html          # Landing page freemium
├── app.html            # Simulateur avec paywall Pro
├── success.html        # Page post-paiement Stripe
├── api/
│   ├── verify.js       # Vérifie abonnement Stripe actif
│   └── activate.js     # Active session depuis checkout Stripe
├── vercel.json         # Config déploiement + routes
├── package.json        # Dépendance Stripe
└── .gitignore
```

### Flux paywall

```
Utilisateur → app.html
  ├── Gratuit  → simulation complète (IS, TVA, DMTO, planning)
  └── Pro      → localStorage.getItem('mdbpro_token') = cus_xxx Stripe
                  → POST /api/verify { token: "cus_xxx" }
                  → Stripe API → abonnement actif ?
                  → Oui → features Pro débloquées
                  → Non → modal "Passer Pro"

Paiement :
  Stripe Checkout (49€/mois) → success.html?session_id=cs_xxx
  → POST /api/activate { session_id }
  → Stripe API → récupère customer ID
  → localStorage.setItem('mdbpro_token', 'cus_xxx')
  → Redirect app.html → Pro actif
```

---

## Setup — 30 minutes du zéro au live

### Étape 1 — GitHub

```bash
# Depuis ce dossier
git init
git add .
git commit -m "feat: init MDB Pro"

# Créer le repo sur github.com (bouton New repository)
# Nom suggéré : mdbpro
# Puis :
git remote add origin https://github.com/TON_USERNAME/mdbpro.git
git branch -M main
git push -u origin main
```

### Étape 2 — Stripe

1. Aller sur [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Créer un produit :**
   - Catalogue → Produits → Ajouter un produit
   - Nom : `MDB Pro`
   - Prix : `49,00 €` / mois, récurrent
   - Copier le **Price ID** (format `price_xxx`)
3. **Configurer le Checkout :**
   - Paramètres → Checkout → URL de succès :  
     `https://mdbpro.fr/success?session_id={CHECKOUT_SESSION_ID}`
   - URL d'annulation : `https://mdbpro.fr/?cancelled=1`
4. **Créer un Payment Link :**
   - Liens de paiement → Créer un lien
   - Sélectionner MDB Pro 49€/mois
   - Copier le lien (format `https://buy.stripe.com/xxx`)
5. **Récupérer les clés :**
   - Développeurs → Clés API
   - Copier la **clé secrète** (format `sk_live_xxx`)

### Étape 3 — Vercel

```bash
# Installer Vercel CLI (si pas déjà fait)
npm i -g vercel

# Depuis le dossier mdbpro
vercel

# Répondre aux questions :
# → Set up and deploy? Y
# → Link to existing project? N
# → Project name: mdbpro
# → Directory: ./
# → Override settings? N
```

**Configurer les variables d'environnement :**

```bash
vercel env add STRIPE_SECRET_KEY
# → Entrer la clé secrète Stripe sk_live_xxx
# → Sélectionner: Production, Preview, Development

vercel env add STRIPE_PRICE_ID
# → Entrer le Price ID price_xxx

vercel env add ALLOWED_ORIGIN
# → https://mdbpro.fr
```

**Déployer en production :**
```bash
vercel --prod
```

### Étape 4 — Domaine mdbpro.fr

1. Acheter `mdbpro.fr` sur OVH / Gandi / Namecheap (~10€/an)
2. Dans Vercel → Settings → Domains → Add `mdbpro.fr`
3. Vercel donne les DNS à configurer (généralement 2 enregistrements)
4. Chez votre registrar → Zone DNS → Ajouter les enregistrements
5. Propagation : 5–30 minutes

### Étape 5 — Finaliser l'intégration Stripe

**Dans `index.html`, remplacer le lien Stripe :**
```html
<!-- Chercher cette ligne : -->
<a href="https://buy.stripe.com/VOTRE_LIEN_STRIPE" ...>

<!-- Remplacer par votre Payment Link : -->
<a href="https://buy.stripe.com/live_xxxxx" ...>
```

**Même chose dans `app.html` (modale Pro) :**
```html
<a href="/" class="pro-gate-btn">
<!-- Remplacer href par le payment link direct -->
<a href="https://buy.stripe.com/live_xxxxx" class="pro-gate-btn">
```

**Redéployer :**
```bash
git add .
git commit -m "fix: stripe payment links"
git push
# Vercel redéploie automatiquement
```

---

## Mise à jour du simulateur

À chaque modification de `app.html`, `index.html`, ou des APIs :

```bash
git add .
git commit -m "feat: description de la modif"
git push
# Vercel redéploie automatiquement en ~30 secondes
```

---

## Variables d'environnement requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (live) | `sk_live_xxx` |
| `STRIPE_PRICE_ID` | Price ID du plan 49€/mois | `price_xxx` |
| `ALLOWED_ORIGIN` | Domaine autorisé CORS | `https://mdbpro.fr` |

---

## Sécurité — Notes importantes

- **Le token côté client = Customer ID Stripe** (`cus_xxx`). Format impossible à deviner sans payer.
- **Chaque action Pro** vérifie côté serveur `/api/verify` que le customer a un abonnement **actif**.
- Si l'abonnement est résilié, le token reste en localStorage mais `verify` renvoie `active: false` → features bloquées automatiquement.
- **Ne jamais exposer `STRIPE_SECRET_KEY`** côté client. Elle est uniquement dans les variables Vercel.

---

## Évolutions possibles

- [ ] **Webhook Stripe** — écouter `customer.subscription.deleted` pour révoquer immédiatement
- [ ] **Page dashboard** — espace client pour gérer l'abonnement (portail Stripe Customer Portal)
- [ ] **Tier Équipe** — partage de simulations entre collaborateurs (99€/mois)
- [ ] **API Euribor live** — fetch automatique du taux BCE en temps réel
- [ ] **Multi-opérations** — comparaison de plusieurs opérations en parallèle
- [ ] **Export Excel** — en complément du PDF

---

## Support

- Email : contact@mdbpro.fr
- Issues GitHub : github.com/TON_USERNAME/mdbpro/issues

---

*MDB Pro — Outil métier non-substitutif à un conseil fiscal professionnel.*  
*Calculs indicatifs — vérifier avec expert-comptable pour la déclaration IS/TVA.*
