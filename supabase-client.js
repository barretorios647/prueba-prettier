/* =====================================================
   H & L ALIMCERV — Cliente Supabase
   ===================================================== */

const SUPABASE_URL = 'https://nvovudpxxotffretvkso.supabase.co';
const SUPABASE_KEY = 'sb_publishable_LVe064mBPCraflH9NzgGVg_hzn1YFIO';

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

window.db = db;
