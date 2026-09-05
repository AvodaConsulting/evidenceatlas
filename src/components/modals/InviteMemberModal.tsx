import React, { useState } from 'react';
import { X, UserPlus, Shield, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Role } from '../../types';
import { formatRoleLabel } from '../../lib/permissions';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose }) => {
  const { inviteMember, activeWorkspace } = useApp();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      setError('Collaborator email and full name are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await inviteMember(email.trim(), name.trim(), role);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to invite member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-800">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif-scholarly text-stone-900">
                Invite Collaborator
              </h2>
              <p className="text-xs text-stone-500">
                To workspace: <span className="font-medium text-stone-700">{activeWorkspace?.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Collaborator Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Dr. Elena Rostova"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Academic Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g., elena.rostova@cam.ac.uk"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Assigned Workspace Role *
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as Role)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-hidden"
            >
              <option value="owner">{formatRoleLabel('owner')}</option>
              <option value="editor">{formatRoleLabel('editor')}</option>
              <option value="commenter">{formatRoleLabel('commenter')}</option>
              <option value="viewer">{formatRoleLabel('viewer')}</option>
            </select>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-stone-800">
              <Info className="w-3.5 h-3.5 text-sky-600" />
              Role Authorization Breakdown
            </div>
            <p>
              {role === 'owner' && 'Full control over workspace deletion, member management, provider secrets, and all projects.'}
              {role === 'editor' && 'Can add/remove literature, execute searches, modify tags, and ground evidence.'}
              {role === 'commenter' && 'Can create passage annotations and notes, but cannot alter literature inclusion.'}
              {role === 'viewer' && 'Strict read-only access to citation graphs, literature maps, and evidence matrices.'}
            </p>
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-800 text-xs font-medium rounded-lg hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
