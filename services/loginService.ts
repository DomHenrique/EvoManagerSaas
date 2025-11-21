import { supabase } from './supabase';

// Check if login attempts are allowed for an email (calls Postgres function can_attempt_login)
export const isLoginAllowed = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('can_attempt_login', { target_email: email });
    if (error) {
      console.error('[loginService] isLoginAllowed rpc error', error);
      // fallback to allowing if RPC fails
      return true;
    }
    console.log('[loginService] can_attempt_login result for', email, data);
    // Supabase returns an array or scalar depending on settings; normalize
    if (Array.isArray(data)) return !!data[0];
    return !!data;
  } catch (e) {
    console.error('isLoginAllowed error', e);
    return true;
  }
};

export const logLoginAttempt = async (opts: { user_id?: string | null; email?: string; ip?: string; user_agent?: string; success: boolean; reason?: string; }) => {
  try {
    const payload = {
      user_id: opts.user_id || null,
      email: opts.email || null,
      ip: opts.ip || null,
      user_agent: opts.user_agent || null,
      success: opts.success,
      reason: opts.reason || null,
    };
    const { data, error } = await supabase.from('login_attempts').insert([payload]);
    if (error) {
      console.error('Failed to log login attempt', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('logLoginAttempt error', e);
    return false;
  }
};
