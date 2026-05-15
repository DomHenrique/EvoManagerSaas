// Function to safely access process.env (for Node.js / non-browser environments)
const getProcessEnv = (key: string) => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key as keyof typeof process.env];
    }
  } catch (e) {
    // ignore
  }
  return undefined;
};

// Access VITE_ variables statically so Vite's bundler can replace them properly.
export const APP_CONFIG = {
  // Supabase Configuration
  SUPABASE_URL: 
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 
    getProcessEnv('REACT_APP_SUPABASE_URL') || 
    getProcessEnv('VITE_SUPABASE_URL') || 
    '',
  SUPABASE_ANON_KEY: 
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 
    getProcessEnv('REACT_APP_SUPABASE_ANON_KEY') || 
    getProcessEnv('VITE_SUPABASE_ANON_KEY') || 
    '',

  // Evolution API Configuration (VPS)
  EVOLUTION_API_URL: 
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_EVOLUTION_URL) || 
    getProcessEnv('REACT_APP_EVOLUTION_URL') || 
    getProcessEnv('VITE_EVOLUTION_URL') || 
    '',
  EVOLUTION_API_KEY: 
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_EVOLUTION_API_KEY) || 
    getProcessEnv('REACT_APP_EVOLUTION_API_KEY') || 
    getProcessEnv('VITE_EVOLUTION_API_KEY') || 
    '',
  
  // AI Agent Webhook
  AI_WEBHOOK_URL: 
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_AI_WEBHOOK_URL) || 
    getProcessEnv('REACT_APP_AI_WEBHOOK_URL') || 
    getProcessEnv('VITE_AI_WEBHOOK_URL') || 
    'https://automacao.hnperformancedigital.com.br/webhook/evomanager-saas',
};


