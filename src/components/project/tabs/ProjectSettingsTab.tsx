import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Trash2, 
  Save, 
  RotateCcw, 
  Lock, 
  Archive, 
  History,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export const ProjectSettingsTab: React.FC = () => {
  const { 
    activeProject, 
    updateProject, 
    softDeleteProject, 
    restoreProject, 
    permissions,
    auditEvents,
    cleanAllWorkspacesAndProjects
  } = useApp();

  const [title, setTitle] = useState(activeProject?.title || '');
  const [researchQuestion, setResearchQuestion] = useState(activeProject?.researchQuestion || '');
  const [discipline, setDiscipline] = useState(activeProject?.discipline || '');
  const [description, setDescription] = useState(activeProject?.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!activeProject) return null;

  const projectAudits = auditEvents.filter(a => a.projectId === activeProject.id);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      await updateProject(activeProject.id, {
        title: title.trim(),
        researchQuestion: researchQuestion.trim(),
        discipline: discipline.trim(),
        description: description.trim()
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to update project');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Metadata Settings */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-4 mb-5">
          <Settings className="w-5 h-5 text-emerald-800" />
          <div>
            <h3 className="text-base font-bold font-serif-scholarly text-stone-900">
              Project Parameters & Metadata
            </h3>
            <p className="text-xs text-stone-500">
              Configure research question, scientific scope, and discipline classification
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Project Title *
            </label>
            <input
              type="text"
              required
              disabled={!permissions.canEditProjectDetails}
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Research Question *
            </label>
            <textarea
              rows={3}
              required
              disabled={!permissions.canEditProjectDetails}
              value={researchQuestion}
              onChange={e => setResearchQuestion(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Scientific Discipline
              </label>
              <input
                type="text"
                disabled={!permissions.canEditProjectDetails}
                value={discipline}
                onChange={e => setDiscipline(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Privacy Boundary
              </label>
              <div className="px-3.5 py-2 bg-stone-100 border border-stone-200 rounded-lg text-xs text-stone-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-stone-500" />
                <span>Private (Enforced by zero-trust firestore.rules)</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Scope & Inclusion Criteria
            </label>
            <textarea
              rows={2}
              disabled={!permissions.canEditProjectDetails}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-hidden"
            />
          </div>

          {permissions.canEditProjectDetails && (
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-emerald-800 font-medium">
                {savedSuccess && 'Changes saved successfully.'}
              </span>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Project Audit Events */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-3 mb-4">
          <History className="w-4 h-4 text-stone-600" />
          <h4 className="text-sm font-bold font-serif-scholarly text-stone-900">
            Project Audit Trail ({projectAudits.length} Events)
          </h4>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
          {projectAudits.map(evt => (
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

      {/* Danger Zone */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6">
        <h4 className="text-sm font-bold font-serif-scholarly text-stone-900 mb-1 flex items-center gap-1.5">
          <RotateCcw className="w-4 h-4 text-stone-700" />
          Data Sanitation & Reset
        </h4>
        <p className="text-xs text-stone-600 mb-4">
          Clean all workspaces and projects, purge corrupt local storage state, and restore the verified landmark literature corpus.
        </p>

        <button
          type="button"
          onClick={cleanAllWorkspacesAndProjects}
          className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clean & Reset All Workspace Data
        </button>
      </div>

      {/* Danger Zone */}
      {permissions.canDeleteProject && (
        <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-6">
          <h4 className="text-sm font-bold font-serif-scholarly text-rose-900 mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-700" />
            Project Lifecycle Management
          </h4>
          <p className="text-xs text-rose-700 mb-4">
            Soft deleting a project will move it to the workspace trash archive. All literature citations and evidence matrices remain recoverable.
          </p>

          <button
            onClick={() => softDeleteProject(activeProject.id)}
            className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Archive className="w-3.5 h-3.5" />
            Archive / Soft Delete Project
          </button>
        </div>
      )}
    </div>
  );
};
