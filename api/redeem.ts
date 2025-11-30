// api/redeem.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // use service role

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic security (same as in generate.ts)
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'secret_admin_token';
  const token = req.headers['x-admin-token'] as string;
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { code, device_id } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Missing voucher code' });

  // Find voucher
  const { data: voucher, error: vErr } = await supabase
    .from('vouchers')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle();

  if (vErr) return res.status(500).json({ error: vErr.message });
  if (!voucher) return res.status(404).json({ error: 'Voucher not found' });
  if (voucher.used) return res.status(400).json({ error: 'Voucher already used' });

  // Compute expiry
  const expiresAt = new Date(Date.now() + voucher.minutes * 60 * 1000).toISOString();

  // 1️⃣ Create session first (safer)
  const { data: session, error: sessErr } = await supabase
    .from('sessions')
    .insert([{
      voucher_code: voucher.code,
      device_id: device_id || null,
      expires_at: expiresAt
    }])
    .select()
    .single();

  if (sessErr) return res.status(500).json({ error: sessErr.message });

  // 2️⃣ Mark voucher used
  const { error: updErr } = await supabase
    .from('vouchers')
    .update({
      used: true,
      expires_at: expiresAt,
      redeemed_by: device_id || null
    })
    .eq('code', voucher.code);

  if (updErr) {
    // Roll back: delete the created session
    await supabase.from('sessions').delete().eq('id', session.id);
    return res.status(500).json({ error: updErr.message });
  }

  return res.json({
    ok: true,
    voucher: { code: voucher.code, minutes: voucher.minutes },
    session
  });
}
