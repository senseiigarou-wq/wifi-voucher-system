// api/resume.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic security
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'secret_admin_token';
  const token = req.headers['x-admin-token'] as string;
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { session_id } = req.body || {};
  if (!session_id) return res.status(400).json({ error: 'Missing session_id' });

  // Fetch session
  const { data: session, error: sErr } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', session_id)
    .maybeSingle();

  if (sErr) return res.status(500).json({ error: sErr.message });

  if (!session) return res.status(404).json({ error: 'Session not found' });

  if (!session.paused)
    return res.status(400).json({ error: 'Session is not paused' });

  if (!session.remaining_seconds)
    return res.status(400).json({ error: 'Session has no remaining_seconds' });

  // Extra Security: Prevent reviving expired sessions
  const wasExpired =
    session.expires_at && new Date(session.expires_at).getTime() < Date.now();

  if (wasExpired) {
    return res.status(400).json({ error: 'Session already expired' });
  }

  // Compute new expiry
  const newExpiry = new Date(Date.now() + session.remaining_seconds * 1000).toISOString();

  const { error } = await supabase
    .from('sessions')
    .update({
      paused: false,
      expires_at: newExpiry,
      remaining_seconds: null
    })
    .eq('id', session_id);

  if (error) return res.status(500).json({ error: error.message });

  return res.json({ ok: true, expires_at: newExpiry });
}
