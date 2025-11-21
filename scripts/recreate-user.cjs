#!/usr/bin/env node
/*
 Script: recreate-user.cjs
 Deletes any existing Supabase auth user with the given email (using service role key)
 and recreates it with the provided password, then upserts a profile row.

Usage (recommended):
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... TARGET_EMAIL=midias@hnperformancedigital.com.br TARGET_PASSWORD=senhadeteste1234 node scripts/recreate-user.cjs

*/
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL) {
  console.error('Missing SUPABASE_URL in env');
  process.exit(1);
}
if (!SUPABASE_SERVICE) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in env. This script requires a service role key to delete/create auth users.');
  process.exit(1);
}

const TARGET_EMAIL = process.env.TARGET_EMAIL || 'midias@hnperformancedigital.com.br';
const TARGET_PASSWORD = process.env.TARGET_PASSWORD || 'senhadeteste1234';

(async () => {
  const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE);
  try {
    console.log('Looking for existing users with email:', TARGET_EMAIL);
    // listUsers is the admin helper that returns a page of users. We'll request a reasonable page size.
    const { data: usersPage, error: listErr } = await supa.auth.admin.listUsers({ perPage: 100 });
    if (listErr) {
      console.error('Error listing users:', listErr.message || listErr);
    }
    const users = usersPage?.users || usersPage || [];
    const existing = users.find(u => (u.email || u.user_metadata?.email) === TARGET_EMAIL || u.email === TARGET_EMAIL);
    if (existing) {
      console.log('Found existing user id:', existing.id || existing.user?.id || existing.uid);
      try {
        const { error: delErr } = await supa.auth.admin.deleteUser(existing.id || existing.user?.id || existing.uid);
        if (delErr) {
          console.error('Failed to delete existing user:', delErr.message || delErr);
        } else {
          console.log('Existing user deleted:', existing.id || existing.user?.id || existing.uid);
        }
      } catch (e) {
        console.error('Error deleting user:', e.message || e);
      }
    } else {
      console.log('No existing auth user found for that email.');
    }

    // Create user
    console.log('Creating new auth user...');
    const { data: newUser, error: createErr } = await supa.auth.admin.createUser({
      email: TARGET_EMAIL,
      password: TARGET_PASSWORD,
      email_confirm: true,
    });
    if (createErr) {
      console.error('Failed to create auth user:', createErr.message || createErr);
      process.exit(1);
    }
    const userId = newUser?.id;
    console.log('Auth user created with id:', userId);

    // Upsert profile with role 'user'
    try {
      const { data: profile, error: profileErr } = await supa
        .from('profiles')
        .upsert({ id: userId, email: TARGET_EMAIL, full_name: 'Midias', role: 'user', status: 'active' }, { onConflict: 'id' })
        .select()
        .single();
      if (profileErr) {
        console.error('Failed to upsert profile:', profileErr.message || profileErr);
      } else {
        console.log('Profile upserted:', profile.id || profile.email || profile);
      }
    } catch (e) {
      console.error('Error upserting profile:', e.message || e);
    }

    console.log('Done. You can verify the profile in the Supabase UI or by querying the `profiles` table.');
  } catch (e) {
    console.error('Unexpected error:', e.message || e);
  }
})();
