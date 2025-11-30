// api/status.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { device_id, session_id } = req.query;

  if (!device_id && !session_id) return res.status(400).json({ error: 'Missing device_id or session_id' });

  let q = supabase.from('sessions').select('*');

  if (session_id) q = q.eq('id', session_id);
  else q = q.eq('device_id', device_id).order('started_at', { ascending: false }).limit(1);

  const { data, error } = await q.maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.json({ active: false });

  // calculate remaining seconds
  const now = new Date().getTime();
  const expiresAt = new Date(data.expires_at).getTime();
  const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));

  return res.json({
    active: remaining > 0 && !data.paused,
    remaining_seconds: remaining,
    paused: data.paused,
    session: data
  });
}
