import React from 'react';
import { APP_CONFIG } from '../constants';

const Settings: React.FC = () => {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Application Configuration</h2>
          <p className="text-sm text-slate-500">These values are loaded from your environment variables.</p>
        </div>
        
        <div className="p-6 space-y-6">


          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Evolution API URL</label>
            <input type="text" disabled value={APP_CONFIG.EVOLUTION_API_URL} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-500 font-mono text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Supabase URL</label>
            <input type="text" disabled value={APP_CONFIG.SUPABASE_URL} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-500 font-mono text-sm" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">AI Webhook URL</label>
            <input type="text" disabled value={APP_CONFIG.AI_WEBHOOK_URL} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-500 font-mono text-sm" />
          </div>
        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-200">
             <p className="text-sm text-slate-500">To change these values, please update your <code>.env</code> file or <code>constants.ts</code> and rebuild the application.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
