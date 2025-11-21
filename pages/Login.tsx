import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { isLoginAllowed, logLoginAttempt } from '../services/loginService';
import { APP_CONFIG } from '../constants';
import { Activity } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        console.log('[Login] APP_CONFIG:', {
          url: APP_CONFIG.SUPABASE_URL,

        });
        // Check if login attempts are allowed for this email (prevents brute force)
        const allowed = await isLoginAllowed(email);
        console.log('[Login] isLoginAllowed ->', allowed, 'for', email);
        if (!allowed) {
          alert('Too many failed attempts. Try again later.');
          await logLoginAttempt({ email, success: false, reason: 'blocked_due_to_rate_limit' });
          setLoading(false);
          return;
        }

        if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({ email, password });
          console.log('[Login] signUp response', { data, error });
          if (error) {
            await logLoginAttempt({ email, success: false, reason: error.message });
            throw error;
          }
          await logLoginAttempt({ email, success: true });
          alert('Check your email for the confirmation link!');
      } else {
          // Check rate limit first
          const allowed = await isLoginAllowed(email);
          if (!allowed) {
            alert('Too many failed attempts. Try again later.');
            await logLoginAttempt({ email, success: false, reason: 'blocked_due_to_rate_limit' });
            setLoading(false);
            return;
          }

          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          console.log('[Login] signInWithPassword response', { data, error });
          if (error) {
            await logLoginAttempt({ email, success: false, reason: error.message });
            throw error;
          }
          await logLoginAttempt({ email, success: true });
      }
    } catch (err: any) {
      console.error('[Login] error', err);
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4">
            <Activity size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome to EvoManager</h1>
          <p className="text-slate-500">Manage your Evolution API instances</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>


      </div>
    </div>
  );
};

export default Login;
