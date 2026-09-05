import React, { useState } from 'react';
import { X, BookOpen, Plus, Tag as TagIcon, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const { createProject, activeWorkspace } = useApp();
  const [title, setTitle] = useState('');
  const [researchQuestion, setResearchQuestion] = useState('');
  const [discipline, setDiscipline] = useState('Computer Science & AI');
  const [description, setDescription] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>(['citation dynamics', 'reproducibility']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddKeyword = () => {
    const val = keywordInput.trim().toLowerCase();
    if (val && !keywords.includes(val)) {
      setKeywords([...keywords, val]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !researchQuestion.trim()) {
      setError('Title and Research Question are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await createProject({
        title: title.trim(),
        researchQuestion: researchQuestion.trim(),
        discipline: discipline.trim(),
        description: description.trim(),
        initialKeywords: keywords
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif-scholarly text-stone-900">
                New Research Project
              </h2>
              <p className="text-xs text-stone-500">
                In workspace: <span className="font-medium text-stone-700">{activeWorkspace?.name || 'Current Workspace'}</span>
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

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
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
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Epistemic Humility & Citation Cascades in Foundation Models"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-hidden transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              Research Question *
              <span className="text-[10px] lowercase font-normal text-stone-500">(core inquiry driving literature synthesis)</span>
            </label>
            <textarea
              required
              rows={3}
              value={researchQuestion}
              onChange={e => setResearchQuestion(e.target.value)}
              placeholder="e.g., How do citation network topologies accelerate the propagation of unverified empirical claims in deep learning benchmarks?"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-hidden transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Primary Discipline
              </label>
              <input
                type="text"
                value={discipline}
                onChange={e => setDiscipline(e.target.value)}
                placeholder="e.g., Metascience / Computer Science"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-hidden transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Privacy Boundary
              </label>
              <div className="px-3.5 py-2.5 bg-stone-100 border border-stone-200 rounded-lg text-xs text-stone-600 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Private (Workspace Members Only)
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Scope & Methodology Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe inclusion boundaries, screening criteria, and synthesis goals..."
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-hidden transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Initial Keywords & Search Seeds
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); } }}
                placeholder="Type keyword and hit enter..."
                className="flex-1 px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {keywords.map(kw => (
                <span key={kw} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-full">
                  <TagIcon className="w-3 h-3 text-emerald-700" />
                  {kw}
                  <button type="button" onClick={() => handleRemoveKeyword(kw)} className="text-emerald-700 hover:text-emerald-900 ml-0.5">
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p>
              Once created, your project library and interactive Cytoscape citation graph will be initialized with zero-trust permissions.
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
              {isSubmitting ? 'Creating Project...' : 'Initialize Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
