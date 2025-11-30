// api/status.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Basic security: must send x-admin-token
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'secret_admin_token';
  const token = req.headers['x-admin-token'] as string;

  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { device_id, session_id } = req.query;

  if (!device_id && !session_id) {
    return res.status(400).json({ error: 'Missing device_id or session_id' });
  }

  let query = supabase.from('sessions').select('*');

  if (session_id) {
    query = query.eq('id', session_id);
  } else {
    query = query
      .eq('device_id', device_id)
      .order('started_at', { ascending: false })
      .limit(1);
  }

  const { data, error } = await query.maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.json({ active: false });

  // Compute remaining seconds
  const now = Date.now();
  const expiresAt = new Date(data.expires_at).getTime();
  const remaining_seconds = Math.max(0, Math.floor((expiresAt - now) / 1000));

  // Determine if session is active
  const isActive = remaining_seconds > 0 && !data.paused;

  return res.json({
    active: isActive,
    paused: data.paused,
    remaining_seconds,
    session: data
  });
}
