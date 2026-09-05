import React, { useState } from 'react';
import { X, Building2, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({ isOpen, onClose }) => {
  const { createWorkspace, currentUser } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [politeEmail, setPoliteEmail] = useState(currentUser.email);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Workspace name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await createWorkspace({
        name: name.trim(),
        description: description.trim(),
        politeEmail: politeEmail.trim()
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif-scholarly text-stone-900">
                Create Research Workspace
              </h2>
              <p className="text-xs text-stone-500">
                Private collaborative lab container
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
              Workspace / Lab Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Computational Epistemology & ML Rigor Lab"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-hidden transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Mission / Research Scope
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the overarching collaborative focus of this research workspace..."
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-hidden transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              OpenAlex Polite Pool Contact Email
            </label>
            <input
              type="email"
              value={politeEmail}
              onChange={e => setPoliteEmail(e.target.value)}
              placeholder="e.g., researcher@university.edu"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-hidden transition-all"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              Used strictly in User-Agent / mailto headers for OpenAlex high-speed API compliance.
            </p>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p>
              As workspace creator, you will be assigned the <strong>Owner</strong> role with authority over members, provider settings, and project lifecycles.
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
              {isSubmitting ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
