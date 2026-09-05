import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  ShieldCheck, 
  Database, 
  Clock, 
  DollarSign, 
  Activity, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Save,
  Server
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { sciteApi } from '../../lib/scholarlyApi';
import { SciteUsageLog } from '../../types';

interface ProviderAccessSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProviderAccessSettingsModal: React.FC<ProviderAccessSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    sciteConfig, 
    updateSciteConfig, 
    permissions, 
    currentRole,
    activeWorkspace 
  } = useApp();

  const [enabled, setEnabled] = useState(sciteConfig?.sciteEnabled ?? true);
  const [budget, setBudget] = useState(sciteConfig?.monthlyBudget ?? 1000);
  const [cacheHours, setCacheHours] = useState(sciteConfig?.cacheDurationHours ?? 72);
  const [usageLogs, setUsageLogs] = useState<SciteUsageLog[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sciteConfig) {
      setEnabled(sciteConfig.sciteEnabled);
      setBudget(sciteConfig.monthlyBudget);
      setCacheHours(sciteConfig.cacheDurationHours);
    }
  }, [sciteConfig]);

  useEffect(() => {
    if (isOpen) {
      sciteApi.getUsageLogs(activeWorkspace?.id).then(res => {
        setUsageLogs(res.logs || []);
      }).catch(err => console.warn('Usage logs notice:', err));
    }
  }, [isOpen, activeWorkspace?.id]);

  if (!isOpen) return null;

  const isOwner = permissions.canManageWorkspace || currentRole === 'owner';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      setError('Permission denied: Only workspace owners can modify provider access settings.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await updateSciteConfig({
        sciteEnabled: enabled,
        monthlyBudget: Number(budget),
        cacheDurationHours: Number(cacheHours)
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif-scholarly text-stone-900">
                Scite Provider Access & Budget Configuration
              </h2>
              <p className="text-xs text-stone-500">
                Manage Smart Citation verification quotas, cache lifetimes, and audit logs (Owner Only)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Secret Security Banner */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-emerald-950">
                Zero-Leak Secret Architecture
              </div>
              <p className="text-emerald-900 text-[11px] leading-relaxed mt-0.5">
                The <code className="bg-emerald-100/80 px-1.5 py-0.2 rounded font-mono font-bold">SCITE_API_KEY</code> is isolated on the Node.js server. It is never transmitted to the browser, stored in client state, exported, or logged in client audit events.
              </p>
            </div>
          </div>

          {!isOwner && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>You are viewing these settings in read-only mode. Workspace owner privileges required to modify.</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Scite Verification Toggle */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-stone-900 text-xs block">
                  Enable Scite Verification for Workspace
                </span>
                <span className="text-[11px] text-stone-500">
                  Allows project members to verify works, inspect citation statements, and challenge claims.
                </span>
              </div>
              <input
                type="checkbox"
                disabled={!isOwner}
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
                className="w-4 h-4 text-emerald-800 rounded border-stone-300 focus:ring-emerald-700"
              />
            </div>

            {/* Monthly Budget Setting */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Monthly Verification Query Budget
                </label>
                <input
                  type="number"
                  min={10}
                  max={50000}
                  disabled={!isOwner}
                  value={budget}
                  onChange={e => setBudget(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-emerald-800 outline-hidden"
                />
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Current usage this month: {sciteConfig?.currentMonthUsage || 0} / {budget} calls
                </span>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Cache Duration (Hours)
                </label>
                <input
                  type="number"
                  min={1}
                  max={720}
                  disabled={!isOwner}
                  value={cacheHours}
                  onChange={e => setCacheHours(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-emerald-800 outline-hidden"
                />
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Caches tallies and notices to minimize external API roundtrips (Default: 72 hours).
                </span>
              </div>
            </div>

            {/* Bring Your Own Key Placeholder / Explanation */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-stone-700" />
                <span className="font-bold text-stone-900">
                  Bring Your Own Scite Key (Environment Configuration)
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                To connect a dedicated organizational Scite subscription, set <code className="bg-stone-200 px-1 py-0.5 rounded font-mono font-semibold">SCITE_API_KEY</code> in the project's server environment variables (Settings → Secrets). The server will automatically switch from simulated fallbacks to live Scite API endpoints.
              </p>
            </div>

            {isOwner && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-emerald-800 font-medium">
                  {savedSuccess && 'Provider settings successfully updated.'}
                </span>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            )}
          </form>

          {/* Scite Usage Logs Section */}
          <div className="space-y-3 pt-4 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-800" />
                <span>Recent Scite Activity & Usage Logs ({usageLogs.length})</span>
              </h4>
            </div>

            {usageLogs.length === 0 ? (
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-center text-stone-500 text-xs">
                No Scite verification queries recorded yet.
              </div>
            ) : (
              <div className="border border-stone-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 uppercase font-semibold text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2 px-3">Endpoint</th>
                      <th className="py-2 px-3">Target</th>
                      <th className="py-2 px-2 text-center">Cached</th>
                      <th className="py-2 px-2 text-center">Status</th>
                      <th className="py-2 px-3 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono">
                    {usageLogs.map(log => (
                      <tr key={log.id} className="hover:bg-stone-50/80">
                        <td className="py-1.5 px-3 font-semibold text-stone-800">{log.endpoint}</td>
                        <td className="py-1.5 px-3 text-stone-600 truncate max-w-[140px]">{log.targetIdentifier}</td>
                        <td className="py-1.5 px-2 text-center text-stone-500">{log.cached ? 'Yes' : 'Live'}</td>
                        <td className="py-1.5 px-2 text-center">
                          <span className={`px-1.5 py-0.2 rounded font-sans text-[10px] font-semibold ${log.status === 'success' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-right text-stone-400 font-sans text-[10px]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
