// api/generate.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function uid(len = 8) {
  return Math.random().toString(36).substring(2, 2 + len).toUpperCase();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  // very basic protection: require an admin token header (set it in Vercel env)
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'secret_admin_token';
  const token = req.headers['x-admin-token'] as string;
  if (!token || token !== ADMIN_TOKEN) return res.status(401).json({ error: 'Unauthorized' });

  const { minutes = 600, qty = 1 } = req.body || {};
  const toInsert = [];
  for (let i = 0; i < qty; i++) {
    toInsert.push({ code: uid(10), minutes });
  }

  const { data, error } = await supabase.from('vouchers').insert(toInsert).select();
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true, vouchers: data });
}
