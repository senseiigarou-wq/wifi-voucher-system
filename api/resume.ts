// api/resume.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { session_id } = req.body || {};
  if (!session_id) return res.status(400).json({ error: 'Missing session_id' });

  const { data: session } = await supabase.from('sessions').select('*').eq('id', session_id).maybeSingle();
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (!session.remaining_seconds) return res.status(400).json({ error: 'Session has no remaining_seconds' });

  const newExpiry = new Date(Date.now() + session.remaining_seconds * 1000).toISOString();
  const { error } = await supabase.from('sessions').update({ paused: false, expires_at: newExpiry, remaining_seconds: null }).eq('id', session_id);
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ ok: true, expires_at: newExpiry });
}
