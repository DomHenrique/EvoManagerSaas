// Simple connectivity tests for Supabase, Evolution API and AI webhook (CommonJS)
// Use global fetch available in recent Node versions
const { createClient } = require('@supabase/supabase-js');
const fetch = global.fetch || require('node-fetch');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const evoUrl = process.env.REACT_APP_EVOLUTION_URL;
const evoKey = process.env.REACT_APP_EVOLUTION_API_KEY;
const aiWebhook = process.env.REACT_APP_AI_WEBHOOK_URL;

(async () => {
  console.log('Environment variables:');
  console.log({ supabaseUrl: !!supabaseUrl, evoUrl: !!evoUrl, aiWebhook: !!aiWebhook });

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.auth.getSession();
      console.log('Supabase auth.getSession ->', error ? ('ERROR: ' + error.message) : (data && data.session ? 'SESSION_PRESENT' : 'NO_SESSION'));
    } catch (e) {
      console.error('Supabase check failed:', e.message || e);
    }
  } else {
    console.log('Supabase env missing, skipping Supabase test');
  }

  if (evoUrl && evoKey) {
    try {
      const res = await fetch(evoUrl.replace(/\/+$/, '') + '/instance/fetchInstances', {
        method: 'GET',
        headers: { 'apikey': evoKey }
      });
      console.log('Evolution API status:', res.status);
      const text = await res.text();
      console.log('Evolution API response length:', text.length);
    } catch (e) {
      console.error('Evolution API test failed:', e.message || e);
    }
  } else {
    console.log('Evolution API env missing, skipping');
  }

  if (aiWebhook) {
    try {
      const res = await fetch(aiWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${evoKey || ''}` },
        body: JSON.stringify({ message: 'health_check', source: 'evomanager-saas' }),
        // node-fetch doesn't support timeout option directly here for v3, skipping timeout
      });
      console.log('AI webhook status:', res.status);
      const txt = await res.text();
      console.log('AI webhook response snippet:', txt.slice(0, 200));
    } catch (e) {
      console.error('AI webhook test failed:', e.message || e);
    }
  } else {
    console.log('AI webhook missing, skipping');
  }
})();
