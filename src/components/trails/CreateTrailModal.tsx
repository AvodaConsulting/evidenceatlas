import React, { useState, useEffect } from 'react';
import { 
  X, 
  GitBranch, 
  Search, 
  BookOpen, 
  ArrowLeftRight, 
  ArrowRight, 
  Clock, 
  Users, 
  Network, 
  Sparkles, 
  Info,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { Work, TrailType } from '../../types';
import { useApp } from '../../context/AppContext';

interface CreateTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSeeds?: Work[];
  parentTrailId?: string | null;
}

interface ExplorationModeOption {
  type: TrailType;
  label: string;
  shortDesc: string;
  detailedDesc: string;
  icon: any;
  badgeClass: string;
}

const EXPLORATION_MODES: ExplorationModeOption[] = [
  {
    type: 'earlier_work',
    label: 'Earlier Work (Foundational References)',
    shortDesc: 'Trace the direct and indirect works cited by your seed papers',
    detailedDesc: 'Retrieves prior literature cited directly in the reference lists of your seed works. Essential for establishing provenance, earlier theoretical models, and methodological origins.',
    icon: Clock,
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200'
  },
  {
    type: 'later_work',
    label: 'Later Work (Forward Citations)',
    shortDesc: 'Trace papers that cite your seed works after publication',
    detailedDesc: 'Retrieves downstream research that explicitly cites your seed works. Useful for finding subsequent replications, extensions, empirical validations, and modern advancements.',
    icon: ArrowRight,
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200'
  },
  {
    type: 'similar_work',
    label: 'Similar Literature (Co-Citation & Concepts)',
    shortDesc: 'Discover papers frequently co-cited or sharing core topic concepts',
    detailedDesc: 'Leverages shared bibliographic co-citation patterns to surface related literature addressing similar problems without relying exclusively on keyword search.',
    icon: Sparkles,
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  {
    type: 'shared_references',
    label: 'Shared References (Bibliographic Coupling)',
    shortDesc: 'Find papers that cite the same foundational literature',
    detailedDesc: 'Surfaces contemporaneous papers that draw from the same core bibliographies as your seeds, revealing parallel lines of investigation.',
    icon: Layers,
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200'
  },
  {
    type: 'common_authors',
    label: 'Common Authors & Research Labs',
    shortDesc: 'Trace scholarly output from the same key authors or lab lineage',
    detailedDesc: 'Explores other publications authored by key researchers associated with your seeds to uncover cumulative research programs.',
    icon: Users,
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  {
    type: 'possible_bridges',
    label: 'Possible Bridge Papers (Local Graph Connectors)',
    shortDesc: 'Identify papers that connect separate seed clusters in your project graph',
    detailedDesc: 'Computes topological paths between seed clusters in your project. These are local heuristic bridge suggestions, not global interdisciplinary claims.',
    icon: Network,
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200'
  },
  {
    type: 'counterevidence',
    label: 'Counterevidence & Alternative Perspectives',
    shortDesc: 'Surface potential disputes, contrasting citation contexts, or qualifying studies',
    detailedDesc: 'Scans for papers citing your seeds with contrasting language, methodological disputes, or divergent conclusions. Surfaces "possible alternative perspectives" requiring human verification before creating any claim challenge.',
    icon: ArrowLeftRight,
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200'
  }
];

export const CreateTrailModal: React.FC<CreateTrailModalProps> = ({
  isOpen,
  onClose,
  preselectedSeeds = [],
  parentTrailId = null
}) => {
  const { 
    activeProjectWorksList, 
    createCitationTrail, 
    branchCitationTrail,
    citationTrails
  } = useApp();

  const [selectedSeeds, setSelectedSeeds] = useState<Work[]>(preselectedSeeds);
  const [trailType, setTrailType] = useState<TrailType>('earlier_work');
  const [title, setTitle] = useState('');
  const [researcherNotes, setResearcherNotes] = useState('');
  const [targetClaimStatement, setTargetClaimStatement] = useState('');
  const [includeSciteContrasting, setIncludeSciteContrasting] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize selected seeds if passed
  useEffect(() => {
    if (preselectedSeeds.length > 0) {
      setSelectedSeeds(preselectedSeeds);
    } else if (activeProjectWorksList.length > 0 && selectedSeeds.length === 0) {
      setSelectedSeeds([activeProjectWorksList[0].work]);
    }
  }, [preselectedSeeds, activeProjectWorksList]);

  // Auto-generate title suggestion when seeds or type change
  useEffect(() => {
    if (selectedSeeds.length > 0) {
      const modeLabel = EXPLORATION_MODES.find(m => m.type === trailType)?.label.split('(')[0].trim() || 'Trail';
      const firstTitle = selectedSeeds[0].title;
      const shortened = firstTitle.length > 35 ? firstTitle.substring(0, 32) + '...' : firstTitle;
      if (!title || title.startsWith('Trail:')) {
        setTitle(`Trail: ${modeLabel} from "${shortened}"`);
      }
    }
  }, [selectedSeeds, trailType]);

  if (!isOpen) return null;

  const toggleSeedSelection = (work: Work) => {
    if (selectedSeeds.some(s => s.id === work.id)) {
      setSelectedSeeds(prev => prev.filter(s => s.id !== work.id));
    } else {
      setSelectedSeeds(prev => [...prev, work]);
    }
  };

  const filteredLibraryWorks = activeProjectWorksList.filter(pw => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return pw.work.title.toLowerCase().includes(q) || 
           pw.work.authors.some(a => a.name.toLowerCase().includes(q));
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSeeds.length === 0) {
      setError('Please select at least one seed paper to start the trail.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide a title for this Citation Trail.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const requestParams: Record<string, any> = {};
    if (trailType === 'counterevidence') {
      if (targetClaimStatement.trim()) requestParams.targetClaimStatement = targetClaimStatement.trim();
      requestParams.includeSciteContrasting = includeSciteContrasting;
    }

    try {
      if (parentTrailId) {
        await branchCitationTrail(parentTrailId, {
          title: title.trim(),
          trailType,
          seedWorks: selectedSeeds,
          requestParams,
          researcherNotes: researcherNotes.trim() || undefined
        });
      } else {
        await createCitationTrail({
          title: title.trim(),
          trailType,
          seedWorks: selectedSeeds,
          parentTrailId: null,
          requestParams,
          researcherNotes: researcherNotes.trim() || undefined
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to initialize citation trail');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parentTrail = parentTrailId ? citationTrails.find(t => t.id === parentTrailId) : null;
  const currentModeInfo = EXPLORATION_MODES.find(m => m.type === trailType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif-scholarly text-slate-900">
                {parentTrailId ? 'Branch Citation Trail' : 'Start New Citation Trail'}
              </h2>
              <p className="text-xs text-slate-500 font-serif-scholarly">
                {parentTrailId ? `Branching from "${parentTrail?.title}"` : 'Construct a reproducible literature exploration branch'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* 1. Exploration Direction Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Exploration Direction & Methodology
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXPLORATION_MODES.map((mode) => {
                const Icon = mode.icon;
                const isSelected = trailType === mode.type;
                return (
                  <button
                    key={mode.type}
                    type="button"
                    onClick={() => setTrailType(mode.type)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 leading-snug">
                        {mode.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {mode.shortDesc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Selected mode methodology explanation banner */}
            {currentModeInfo && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block mb-0.5">Methodology:</span>
                  <span className="leading-relaxed font-serif-scholarly">{currentModeInfo.detailedDesc}</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Seed Works Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Select Seed Works ({selectedSeeds.length} selected)
              </label>
              <span className="text-[11px] text-slate-400">
                Choose 1-5 papers from project library
              </span>
            </div>

            {/* Selected Seeds Pills */}
            {selectedSeeds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-indigo-50/40 border border-indigo-100 rounded-lg">
                {selectedSeeds.map((seed, idx) => (
                  <span 
                    key={`${seed.id}-${idx}`}
                    className="text-xs bg-white text-indigo-900 border border-indigo-200 px-2 py-1 rounded-md flex items-center gap-1.5 shadow-2xs"
                  >
                    <span className="font-medium truncate max-w-xs">{seed.title}</span>
                    <button
                      type="button"
                      onClick={() => toggleSeedSelection(seed)}
                      className="text-indigo-400 hover:text-indigo-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search filter for library works */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search library papers to add as seeds..."
                className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Library works picklist */}
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
              {filteredLibraryWorks.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  No library works found matching filter.
                </div>
              ) : (
                filteredLibraryWorks.map((pw, idx) => {
                  const isSelected = selectedSeeds.some(s => s.id === pw.work.id);
                  return (
                    <div
                      key={`${pw.id || pw.work?.id || idx}-${idx}`}
                      onClick={() => toggleSeedSelection(pw.work)}
                      className={`p-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/60 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-slate-900 truncate font-serif-scholarly">{pw.work.title}</p>
                        <p className="text-[11px] text-slate-500">
                          {(pw.work?.authors || []).map(a => a?.name || '').slice(0, 2).join(', ') || 'Unknown Authors'} ({pw.work?.year || 'N/A'})
                        </p>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 3. Trail Title & Researcher Notes */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                3. Trail Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Foundational Proofs & Deductive Verification"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500 font-serif-scholarly font-medium"
                required
              />
            </div>

            {trailType === 'counterevidence' && (
              <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-rose-900 font-bold">
                  <ArrowLeftRight className="w-4 h-4 text-rose-700" />
                  <span>Counterevidence & Dispute Parameters</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-rose-800 mb-1">
                    Target Claim / Thesis Being Challenged (Optional)
                  </label>
                  <input
                    type="text"
                    value={targetClaimStatement}
                    onChange={(e) => setTargetClaimStatement(e.target.value)}
                    placeholder="e.g., 'Chain-of-thought prompting eliminates all arithmetic hallucinations.'"
                    className="w-full text-xs p-2 border border-rose-200 rounded-lg bg-white focus:outline-rose-500 font-serif-scholarly"
                  />
                  <p className="text-[10px] text-rose-600 mt-1">
                    If specified, the engine searches for citations and papers directly disputing this specific claim statement.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-1 text-rose-900">
                  <input
                    type="checkbox"
                    checked={includeSciteContrasting}
                    onChange={(e) => setIncludeSciteContrasting(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-[11px] font-medium">
                    Include Scite Smart Citation contrasting citation check
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Epistemic disclaimer note */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-3 text-[11px] text-amber-900 space-y-1">
            <span className="font-bold block">Scientific Epistemic Principle:</span>
            <span>
              Citation Trails retrieve small, explainable candidate sets (15-25 items) directly from scholarly providers. Citation proximity is never treated as proof of relevance, consensus, or quality.
            </span>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedSeeds.length === 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Retrieving Candidate Graph...' : 'Start Citation Trail'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
