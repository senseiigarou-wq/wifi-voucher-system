// api/pause.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // important: service role key
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // security check (same as generate.ts)
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'secret_admin_token';
  const token = req.headers['x-admin-token'] as string;
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { session_id } = req.body || {};
  if (!session_id) return res.status(400).json({ error: 'Missing session_id' });

  const { data: session, error: fetchErr } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', session_id)
    .maybeSingle();

  if (fetchErr) return res.status(500).json({ error: fetchErr.message });
  if (!session) return res.status(404).json({ error: 'Session not found' });

  if (!session.expires_at)
    return res.status(400).json({ error: "Session has no expires_at timestamp" });

  const remaining_seconds = Math.max(
    0,
    Math.floor((new Date(session.expires_at).getTime() - Date.now()) / 1000)
  );

  const { error: updateErr } = await supabase
    .from('sessions')
    .update({
      paused: true,
      paused_at: new Date().toISOString(),
      remaining_seconds
    })
    .eq('id', session_id);

  if (updateErr) return res.status(500).json({ error: updateErr.message });

  return res.json({ ok: true, remaining_seconds });
}
