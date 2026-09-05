import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  Key, 
  Trash2, 
  UserPlus, 
  Save, 
  Lock, 
  Mail, 
  History,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Sliders,
  Server,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Role } from '../../types';
import { formatRoleLabel } from '../../lib/permissions';
import { InviteMemberModal } from '../modals/InviteMemberModal';
import { ProviderAccessSettingsModal } from '../evidence/ProviderAccessSettingsModal';

export const WorkspaceSettings: React.FC = () => {
  const { 
    activeWorkspace, 
    updateWorkspace, 
    workspaceMembers, 
    updateMemberRole, 
    removeMember,
    currentUser,
    permissions,
    auditEvents,
    sciteConfig,
    updateSciteConfig,
    currentRole,
    cleanAllWorkspacesAndProjects
  } = useApp();

  const [name, setName] = useState(activeWorkspace?.name || '');
  const [description, setDescription] = useState(activeWorkspace?.description || '');
  const [politeEmail, setPoliteEmail] = useState(activeWorkspace?.providerSettings?.politeEmail || '');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [providerSettingsModalOpen, setProviderSettingsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scite quick settings
  const [sciteEnabled, setSciteEnabled] = useState(sciteConfig?.sciteEnabled ?? true);
  const [sciteBudget, setSciteBudget] = useState(sciteConfig?.monthlyBudget ?? 1000);
  const [sciteCacheHours, setSciteCacheHours] = useState(sciteConfig?.cacheDurationHours ?? 72);

  if (!activeWorkspace) return null;

  const currentMembers = workspaceMembers.filter(m => m.workspaceId === activeWorkspace.id);
  const workspaceAudits = auditEvents.filter(a => a.workspaceId === activeWorkspace.id);
  const isOwner = permissions.canManageWorkspace || currentRole === 'owner';

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      await updateWorkspace(activeWorkspace.id, {
        name: name.trim(),
        description: description.trim(),
        providerSettings: {
          ...activeWorkspace.providerSettings,
          politeEmail: politeEmail.trim()
        }
      });

      if (isOwner) {
        await updateSciteConfig({
          sciteEnabled,
          monthlyBudget: Number(sciteBudget),
          cacheDurationHours: Number(sciteCacheHours)
        });
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to update workspace');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Workspace Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-stone-100 pb-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-serif-scholarly text-stone-900">
              Workspace Settings & Provider Configuration
            </h2>
            <p className="text-xs text-stone-500">
              Manage collaborative access, provider rate limits, and audit logs
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Workspace Name *
            </label>
            <input
              type="text"
              required
              disabled={!permissions.canManageWorkspace}
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Research Mission & Lab Description
            </label>
            <textarea
              rows={3}
              disabled={!permissions.canManageWorkspace}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-hidden"
            />
          </div>

          <div className="pt-2 border-t border-stone-100">
            <h4 className="font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-800" />
              Scholarly Provider Access (Zero-Scraping Compliance)
            </h4>

            <div>
              <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                OpenAlex Polite Pool Contact Email
              </label>
              <input
                type="email"
                disabled={!permissions.canManageWorkspace}
                value={politeEmail}
                onChange={e => setPoliteEmail(e.target.value)}
                placeholder="researcher@university.edu"
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 outline-hidden"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Included in all OpenAlex API request headers for high-speed polite tier routing.
              </p>
            </div>

            {/* Scite Smart Citation Provider Config */}
            <div className="mt-4 p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-emerald-800 text-white font-bold text-xs flex items-center justify-center">
                    s
                  </span>
                  <div>
                    <span className="font-bold text-stone-900 block text-xs">
                      Scite Smart Citations Provider Configuration
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Evidence verification layer with Supporting/Mentioning/Contrasting classification
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setProviderSettingsModalOpen(true)}
                  className="px-2.5 py-1 bg-white hover:bg-stone-100 text-emerald-900 border border-stone-300 text-xs font-semibold rounded flex items-center gap-1 shadow-2xs"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Advanced Config & Audit</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-2.5 bg-white border border-stone-200 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Verification Status</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span className="text-xs font-semibold text-stone-800">
                      {sciteEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-white border border-stone-200 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Monthly Quota</span>
                  <span className="text-xs font-mono font-bold text-stone-900 mt-1 block">
                    {sciteConfig?.currentMonthUsage || 0} / {sciteBudget} queries
                  </span>
                </div>

                <div className="p-2.5 bg-white border border-stone-200 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Server Key Isolation</span>
                  <span className="text-[11px] font-medium text-emerald-800 mt-1 block">
                    Protected in Server Env
                  </span>
                </div>
              </div>
            </div>
          </div>

          {permissions.canManageWorkspace && (
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-emerald-800 font-medium">
                {savedSuccess && 'Workspace settings updated.'}
              </span>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Save Workspace'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Collaborators / Member Management */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-800" />
            <h3 className="text-base font-bold font-serif-scholarly text-stone-900">
              Collaborators & Permissions ({currentMembers.length})
            </h3>
          </div>

          {permissions.canManageMembers && (
            <button
              onClick={() => setInviteModalOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Invite Member
            </button>
          )}
        </div>

        <div className="divide-y divide-stone-100 text-xs">
          {currentMembers.map(m => (
            <div key={m.id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-700">
                  {m.userName[0]}
                </div>
                <div>
                  <div className="font-semibold text-stone-900">{m.userName}</div>
                  <div className="text-[11px] text-stone-500 font-mono">{m.userEmail}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {permissions.canManageMembers && m.userId !== currentUser.id ? (
                  <select
                    value={m.role}
                    onChange={e => updateMemberRole(m.id, e.target.value as Role)}
                    className="px-2.5 py-1 bg-stone-50 border border-stone-300 rounded-md text-xs font-medium text-stone-800 outline-hidden"
                  >
                    <option value="owner">{formatRoleLabel('owner')}</option>
                    <option value="editor">{formatRoleLabel('editor')}</option>
                    <option value="commenter">{formatRoleLabel('commenter')}</option>
                    <option value="viewer">{formatRoleLabel('viewer')}</option>
                  </select>
                ) : (
                  <span className="text-xs font-semibold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    {formatRoleLabel(m.role)}
                  </span>
                )}

                {permissions.canManageMembers && m.userId !== currentUser.id && (
                  <button
                    onClick={() => removeMember(m.id)}
                    className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors"
                    title="Revoke access"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workspace Audit Events */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-3 mb-4">
          <History className="w-4 h-4 text-stone-600" />
          <h4 className="text-sm font-bold font-serif-scholarly text-stone-900">
            Workspace Audit Trail ({workspaceAudits.length} Events)
          </h4>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
          {workspaceAudits.map(evt => (
            <div key={evt.id} className="p-2.5 bg-stone-50 rounded-lg border border-stone-200/80 flex items-center justify-between">
              <div>
                <span className="font-semibold text-stone-800 font-mono text-[11px]">{evt.action}</span>
                <span className="text-stone-500 text-[11px] block">Actor: {evt.actorEmail}</span>
              </div>
              <span className="text-[10px] text-stone-400 font-mono">
                {new Date(evt.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Clean & Reset Data Maintenance */}
      <div className="bg-stone-50 border border-stone-300/80 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <h4 className="text-sm font-bold font-serif-scholarly text-stone-900">
            Data Maintenance & Workspace Cleanup
          </h4>
        </div>
        <p className="text-xs text-stone-600 mb-4 max-w-2xl">
          Clean all workspaces, projects, literature pools, and candidate queues. Purges corrupt or disordered local storage items and restores a pristine baseline dataset featuring verified landmark papers with real DOIs.
        </p>

        <button
          type="button"
          onClick={cleanAllWorkspacesAndProjects}
          className="px-4 py-2.5 bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
          Clean All Workspaces & Restore Verified Dataset
        </button>
      </div>

      {inviteModalOpen && (
        <InviteMemberModal
          isOpen={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
        />
      )}

      {providerSettingsModalOpen && (
        <ProviderAccessSettingsModal
          isOpen={providerSettingsModalOpen}
          onClose={() => setProviderSettingsModalOpen(false)}
        />
      )}
    </div>
  );
};
