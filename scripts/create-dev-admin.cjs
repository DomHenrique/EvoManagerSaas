#!/usr/bin/env node
/**
 * Script to create a development admin user.
 *
 * Behavior:
 * - If SUPABASE_SERVICE_ROLE_KEY (or REACT_APP_SUPABASE_SERVICE_ROLE_KEY) is present, it will create an auth user and a profile record.
 * - Otherwise it will insert a profile row into `profiles` table (useful for local dev when RLS allows it).
 *
 * Usage:
 *  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/create-dev-admin.cjs
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL) {
  console.error('Missing SUPABASE_URL in env');
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function question(q) {
  return new Promise(resolve => rl.question(q, ans => resolve(ans)));
}

(async () => {
  const envEmail = process.env.ADMIN_EMAIL || process.env.DEV_ADMIN_EMAIL;
  const envPass = process.env.ADMIN_PASSWORD || process.env.DEV_ADMIN_PASSWORD;
  let email = envEmail;
  let password = envPass;
  if (!envEmail || !envPass) {
    email = (await question('Admin email (default admin@localhost.test): ')) || 'admin@localhost.test';
    password = (await question('Admin password (min 6) (default passw0rd): ')) || 'passw0rd';
    rl.close();
  } else {
    rl.close();
  }

  if (SUPABASE_SERVICE) {
    console.log('Using service role key to create auth user...');
    const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE);
    try {
      // Create user via admin API
      const { data: user, error: createErr } = await supa.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr) {
        console.error('Failed to create auth user:', createErr.message || createErr);
      } else {
        console.log('Auth user created:', user.id);
        // Insert profile
        const { data: profile, error: profileErr } = await supa
          .from('profiles')
          .upsert({ id: user.id, email, full_name: 'Dev Admin', role: 'admin', status: 'active' }, { onConflict: 'id' })
          .select()
          .single();
        if (profileErr) console.error('Failed to insert profile:', profileErr.message || profileErr);
        else console.log('Profile upserted:', profile.id);
      }
    } catch (e) {
      console.error('Error creating admin user with service role:', e.message || e);
    }
  } else if (SUPABASE_ANON) {
    console.log('Service key not found. Attempting to insert profile using anon key (may fail due to RLS).');
    const supa = createClient(SUPABASE_URL, SUPABASE_ANON);
    try {
      const { data, error } = await supa
        .from('profiles')
        .insert([{ email, full_name: 'Dev Admin', role: 'admin', status: 'active' }])
        .select()
        .single();
      if (error) {
        console.error('Insert failed:', error.message || error);
      } else {
        console.log('Profile inserted (no auth user created):', data.id || data.email || data);
        console.log('Note: you may want to create the corresponding auth user via Supabase UI or using a service role key.');
      }
    } catch (e) {
      console.error('Error inserting profile:', e.message || e);
    }
  } else {
    console.error('No Supabase credentials found in env (anon or service role).');
  }

})();
