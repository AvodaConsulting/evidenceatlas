import React from 'react';
import { Lock, ShieldAlert, ArrowLeft, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AccessDeniedProps {
  onBackToDashboard: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ onBackToDashboard }) => {
  const { setCurrentRole, activeProject, activeWorkspace } = useApp();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-rose-200 rounded-2xl p-8 shadow-sm text-center">
        <div className="w-14 h-14 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-700">
          <Lock className="w-7 h-7" />
        </div>
        
        <h2 className="text-xl font-bold font-serif-scholarly text-stone-900 mb-2">
          Private Research Workspace
        </h2>
        
        <p className="text-sm text-stone-600 mb-6 leading-relaxed">
          Access to <span className="font-semibold text-stone-900">{activeProject?.title || activeWorkspace?.name || 'this research project'}</span> is restricted. Every project and workspace in Evidence Atlas defaults to private with zero-trust role authorization.
        </p>

        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs text-stone-600 mb-6 text-left space-y-1.5">
          <div className="flex items-center gap-1.5 font-medium text-stone-800">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            Security Rule Enforcement
          </div>
          <p>
            You are currently accessing this URL in <span className="font-semibold text-rose-700">Non-Member / Unauthenticated</span> state. Public sharing links are disabled.
          </p>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={() => setCurrentRole('owner')}
            className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            Switch to Workspace Owner (Test Role)
          </button>
          
          <button
            onClick={onBackToDashboard}
            className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Research Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
