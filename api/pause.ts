// api/pause.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { session_id } = req.body || {};
  if (!session_id) return res.status(400).json({ error: 'Missing session_id' });

  // compute remaining time and set paused true
  const { data: session } = await supabase.from('sessions').select('*').eq('id', session_id).maybeSingle();
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const remaining_seconds = Math.max(0, Math.floor((new Date(session.expires_at).getTime() - Date.now()) / 1000));
  const { error } = await supabase.from('sessions').update({ paused: true, remaining_seconds }).eq('id', session_id);
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ ok: true, remaining_seconds });
}
