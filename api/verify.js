// api/verify.js — Vercel Serverless Function
// Vérifie qu'un customer Stripe a un abonnement actif
// POST { token: "cus_xxx" } → { active: true/false }

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'https://mdbpro.fr');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: 'Token manquant', active: false });

  const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET) return res.status(500).json({ error: 'Config serveur manquante', active: false });

  try {
    // Le token est le customer ID Stripe (cus_xxx)
    // On vérifie qu'il a un abonnement actif au bon price
    const stripe = await import('stripe').then(m => m.default(STRIPE_SECRET));

    const subscriptions = await stripe.subscriptions.list({
      customer: token,
      status: 'active',
      limit: 5,
    });

    const targetPriceId = process.env.STRIPE_PRICE_ID; // prix 49€/mois

    let active = false;
    if (subscriptions.data.length > 0) {
      if (targetPriceId) {
        // Vérifie le bon price (sécurisé)
        active = subscriptions.data.some(sub =>
          sub.items.data.some(item => item.price.id === targetPriceId)
        );
      } else {
        // Fallback : n'importe quel abonnement actif
        active = true;
      }
    }

    return res.status(200).json({ active, customer: token });

  } catch (err) {
    console.error('Stripe verify error:', err.message);
    // Ne pas exposer les détails Stripe en prod
    return res.status(200).json({ active: false, error: 'Verification failed' });
  }
}
