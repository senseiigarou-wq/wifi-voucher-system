// api/redeem.ts (Vercel serverless)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, device_id } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Missing voucher code' });

  // find voucher
  const { data: voucher, error: vErr } = await supabase
    .from('vouchers')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle();

  if (vErr) return res.status(500).json({ error: vErr.message });
  if (!voucher) return res.status(404).json({ error: 'Voucher not found' });
  if (voucher.used) return res.status(400).json({ error: 'Voucher already used' });

  // compute expiry
  const expiresAt = new Date(Date.now() + voucher.minutes * 60 * 1000).toISOString();

  // mark voucher used and set expiresAt
  const { error: updErr } = await supabase
    .from('vouchers')
    .update({ used: true, expires_at: expiresAt, redeemed_by: device_id || null })
    .eq('code', voucher.code);

  if (updErr) return res.status(500).json({ error: updErr.message });

  // create a session
  const { data: session, error: sessErr } = await supabase.from('sessions').insert([{
    voucher_code: voucher.code,
    device_id: device_id || null,
    expires_at: expiresAt
  }]).select().single();

  if (sessErr) return res.status(500).json({ error: sessErr.message });

  return res.json({
    ok: true,
    voucher: { code: voucher.code, minutes: voucher.minutes },
    session
  });
}
