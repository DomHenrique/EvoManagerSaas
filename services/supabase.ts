import { createClient } from '@supabase/supabase-js';
import { APP_CONFIG } from '../constants';

// Initialize Supabase client
// In a real scenario, ensure these keys are valid
export const supabase = createClient(
  APP_CONFIG.SUPABASE_URL,
  APP_CONFIG.SUPABASE_ANON_KEY
);

// Lightweight init logs to help debugging network/CORS issues (do not log secrets in production)
try {
  console.log('[supabase] initialized', {
    url: APP_CONFIG.SUPABASE_URL,
    anon_present: !!APP_CONFIG.SUPABASE_ANON_KEY,
  });
} catch (e) {
  // ignore logging errors in non-browser env
}

// Helper to get current session
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

// NOTE: For server-side scripts you may need to use a Service Role key (do NOT commit it).
export const createServiceClient = (serviceRoleKey: string) => {
  return createClient(APP_CONFIG.SUPABASE_URL, serviceRoleKey);
};
