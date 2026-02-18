// api/activate.js — Vercel Serverless Function
// Appelée depuis success.html après redirect Stripe
// POST { session_id: "cs_xxx" } → { token: "cus_xxx" }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'https://mdbpro.fr');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { session_id } = req.body || {};
  if (!session_id) return res.status(400).json({ error: 'Session ID manquant' });

  const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET) return res.status(500).json({ error: 'Config serveur manquante' });

  try {
    const stripe = await import('stripe').then(m => m.default(STRIPE_SECRET));

    // Récupère la session Stripe Checkout
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Paiement non confirmé' });
    }

    const customerId = session.customer;
    if (!customerId) {
      return res.status(400).json({ error: 'Customer introuvable' });
    }

    // Le token stocké côté client = customer ID Stripe
    // Sécurisé : on ne peut pas deviner un cus_xxx valide sans payer
    return res.status(200).json({
      token: customerId,
      email: session.customer_details?.email,
    });

  } catch (err) {
    console.error('Stripe activate error:', err.message);
    return res.status(500).json({ error: 'Activation échouée. Contactez support@mdbpro.fr' });
  }
}
