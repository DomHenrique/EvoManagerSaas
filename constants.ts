// Read env vars from either `process.env.REACT_APP_*` (legacy) or `import.meta.env.VITE_*` (Vite)
const getEnv = (reactKey: string, viteKey?: string) => {
  const fromProcess = process.env[reactKey as keyof typeof process.env];
  if (fromProcess !== undefined) return fromProcess;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vite = (import.meta as any)?.env ?? {};
    // Debug: expose import.meta.env keys to help diagnose missing VITE_ vars in dev
    try {
      // Print only once in dev to avoid noisy logs
      if (typeof window !== 'undefined' && (window as any).__EVOMANAGER_ENV_LOGGED__ !== true) {
        // shallow copy to avoid printing large objects
        const shown: Record<string, unknown> = {};
        Object.keys(vite).forEach(k => { if (k.startsWith('VITE_')) shown[k] = vite[k]; });
        try {
          // Print as JSON so it's easy to copy/paste from console
          // eslint-disable-next-line no-console
          console.log('[env] import.meta.env (VITE_ keys):', JSON.stringify(shown));
        } catch (e) {
          // fallback to object if stringify fails
          // eslint-disable-next-line no-console
          console.log('[env] import.meta.env (VITE_ keys):', shown);
        }
        (window as any).__EVOMANAGER_ENV_LOGGED__ = true;
      }
    } catch (e) {
      // ignore
    }
    if (viteKey && vite[viteKey] !== undefined) return vite[viteKey];
    if (vite[reactKey] !== undefined) return vite[reactKey];
  } catch (e) {
    // import.meta may not be available in some environments; ignore
  }
  return undefined;
};

export const APP_CONFIG = {
  // Supabase Configuration
  SUPABASE_URL: getEnv('REACT_APP_SUPABASE_URL', 'VITE_SUPABASE_URL') || 'https://fswyyoponrmsrqjjeoec.supabase.co',
  SUPABASE_ANON_KEY: getEnv('REACT_APP_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzd3l5b3BvbnJtc3Jxamplb2VjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY1NDk5NiwiZXhwIjoyMDc5MjMwOTk2fQ.AoKLI2Rgxkd3hYXyF_J5M_EoFfETz-AjaUiRbXmR_4E',

  // Evolution API Configuration (VPS)
  EVOLUTION_API_URL: getEnv('REACT_APP_EVOLUTION_URL', 'VITE_EVOLUTION_URL') || 'https://evo-api.hnperformancedigital.com.br',
  EVOLUTION_API_KEY: getEnv('REACT_APP_EVOLUTION_API_KEY', 'VITE_EVOLUTION_API_KEY') || 'FF7fSPvqbbTfymXM5XNWdjSu4dsq6Woe',
  
  // AI Agent Webhook
  AI_WEBHOOK_URL: getEnv('REACT_APP_AI_WEBHOOK_URL', 'VITE_AI_WEBHOOK_URL') || 'https://automacao.hnperformancedigital.com.br/webhook/evomanager-saas',
};


