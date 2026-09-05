import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Search, 
  Filter, 
  Trash2, 
  CheckSquare, 
  Square, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  FileSpreadsheet, 
  Download,
  GitBranch,
  ShieldCheck,
  Tag,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CandidateWorkState, CandidateRole, Work } from '../../types';
import { CandidateWorkflowCard } from './CandidateWorkflowCard';
import { AddEvidenceModal } from '../modals/AddEvidenceModal';

export const DiscoveryTrayTab: React.FC = () => {
  const { 
    projectCandidateStates, 
    activeProject, 
    bulkUpdateTrayCandidates, 
    clearDiscoveryTray,
    setActiveTab,
    citationTrails
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [trailFilter, setTrailFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchActionState, setBatchActionState] = useState<CandidateWorkState>('study_next');
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [evidenceWorkId, setEvidenceWorkId] = useState<string | undefined>(undefined);

  const currentProjectId = activeProject?.id;

  // Filter project-specific tray items
  const trayCandidates = useMemo(() => {
    return (projectCandidateStates || []).filter(pcs => {
      if (!pcs || pcs.projectId !== currentProjectId) return false;
      if (!pcs.inDiscoveryTray) return false;
      return true;
    });
  }, [projectCandidateStates, currentProjectId]);

  // Apply filters
  const filteredCandidates = useMemo(() => {
    return (trayCandidates || []).filter(pcs => {
      if (!pcs || !pcs.work) return false;
      // State filter
      if (stateFilter !== 'all' && pcs.state !== stateFilter) return false;
      
      // Role filter
      if (roleFilter !== 'all') {
        const candidateRole = pcs.reasons?.[0]?.role;
        if (candidateRole !== roleFilter) return false;
      }

      // Trail filter
      if (trailFilter !== 'all') {
        if (!pcs.sourceTrailIds?.includes(trailFilter)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (pcs.work.title || '').toLowerCase().includes(q);
        const authorMatch = (pcs.work.authors || []).some(a => (a?.name || '').toLowerCase().includes(q));
        const notesMatch = pcs.notes?.toLowerCase().includes(q) || false;
        if (!titleMatch && !authorMatch && !notesMatch) return false;
      }

      return true;
    });
  }, [trayCandidates, stateFilter, roleFilter, trailFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const counts: Record<string, number> = {
      total: trayCandidates.length,
      discovered: 0,
      study_next: 0,
      reading: 0,
      read: 0,
      included: 0,
      excluded: 0
    };
    trayCandidates.forEach(c => {
      if (c.state === 'discovered' || c.state === 'saved_for_later') counts.discovered++;
      else if (c.state === 'study_next') counts.study_next++;
      else if (c.state === 'reading') counts.reading++;
      else if (c.state === 'read') counts.read++;
      else if (c.state === 'included_in_library') counts.included++;
      else if (c.state === 'not_relevant' || c.state === 'excluded_with_reason') counts.excluded++;
    });
    return counts;
  }, [trayCandidates]);

  const handleToggleSelect = (workId: string) => {
    setSelectedIds(prev => 
      prev.includes(workId) ? prev.filter(id => id !== workId) : [...prev, workId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredCandidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCandidates.map(c => c.workId));
    }
  };

  const handleExecuteBatch = async () => {
    if (selectedIds.length === 0) return;
    await bulkUpdateTrayCandidates(selectedIds, batchActionState);
    setSelectedIds([]);
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all candidate works from the Discovery Tray? (Project Library works will remain untouched).')) {
      await clearDiscoveryTray(currentProjectId);
      setSelectedIds([]);
    }
  };

  const handleOpenEvidence = (workId: string) => {
    setEvidenceWorkId(workId);
    setIsEvidenceModalOpen(true);
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner: Explanatory Epistemic Rules */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-100 text-sky-800 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold font-serif-scholarly text-slate-900">
              Project Discovery Tray
            </h2>
            <span className="text-xs px-2 py-0.5 bg-sky-100 text-sky-900 font-bold rounded-full">
              {stats.total} held
            </span>
          </div>
          <p className="text-xs text-slate-600 font-serif-scholarly max-w-3xl leading-relaxed">
            An exploratory holding space for candidate literature discovered during citation tracing or active queries. 
            Works in this tray are strictly decoupled from your Project Library until you deliberately promote or read them.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('study-next')}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Open Study Next Shortlist</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metric Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
        <button
          onClick={() => setStateFilter('all')}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            stateFilter === 'all' 
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 block">All Held</span>
          <span className="text-base font-bold">{stats.total}</span>
        </button>

        <button
          onClick={() => setStateFilter('discovered')}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            stateFilter === 'discovered' 
              ? 'bg-slate-700 text-white border-slate-700 shadow-xs' 
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 block">Discovered</span>
          <span className="text-base font-bold">{stats.discovered}</span>
        </button>

        <button
          onClick={() => setStateFilter('study_next')}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            stateFilter === 'study_next' 
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs' 
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 block">Study Next</span>
          <span className="text-base font-bold text-amber-950">{stats.study_next}</span>
        </button>

        <button
          onClick={() => setStateFilter('reading')}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            stateFilter === 'reading' 
              ? 'bg-purple-600 text-white border-purple-600 shadow-xs' 
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 block">Reading</span>
          <span className="text-base font-bold text-purple-950">{stats.reading}</span>
        </button>

        <button
          onClick={() => setStateFilter('included_in_library')}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            stateFilter === 'included_in_library' 
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block">In Library</span>
          <span className="text-base font-bold text-emerald-950">{stats.included}</span>
        </button>

        <button
          onClick={() => setStateFilter('excluded_with_reason')}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            stateFilter === 'excluded_with_reason' 
              ? 'bg-rose-700 text-white border-rose-700 shadow-xs' 
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider text-rose-700 block">Excluded</span>
          <span className="text-base font-bold text-rose-950">{stats.excluded}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tray by title, author, or notes..."
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-indigo-500 font-serif-scholarly bg-slate-50/50"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-700"
          >
            <option value="all">All Roles</option>
            <option value="foundational_premise">Foundational Premise</option>
            <option value="methodological_ancestor">Methodological Ancestor</option>
            <option value="empirical_validation">Empirical Validation</option>
            <option value="competing_claim">Competing Claim</option>
            <option value="contrast_case">Contrast Case</option>
            <option value="reproducibility_benchmark">Benchmark Standard</option>
          </select>

          {/* Source Trail Filter */}
          {citationTrails.length > 0 && (
            <select
              value={trailFilter}
              onChange={(e) => setTrailFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-700 max-w-[180px] truncate"
            >
              <option value="all">All Citation Trails</option>
              {citationTrails.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          )}
        </div>

        {/* Clear Tray Button */}
        <button
          onClick={handleClearAll}
          className="text-xs font-semibold text-slate-500 hover:text-rose-700 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 border border-slate-200 transition-colors"
          title="Clear exploratory holding tray"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Tray</span>
        </button>
      </div>

      {/* Batch Operations Toolbar (Shown when items selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900">
            <CheckSquare className="w-4 h-4 text-indigo-600" />
            <span>{selectedIds.length} works selected</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-indigo-800 font-medium">Batch Action:</span>
            <select
              value={batchActionState}
              onChange={(e) => setBatchActionState(e.target.value as CandidateWorkState)}
              className="text-xs font-semibold border border-indigo-300 rounded-lg px-2.5 py-1 bg-white text-indigo-950"
            >
              <option value="study_next">Move to Study Next</option>
              <option value="saved_for_later">Save for Later</option>
              <option value="reading">Mark as Currently Reading</option>
              <option value="read">Mark as Read & Evaluated</option>
              <option value="included_in_library">Promote to Project Library</option>
              <option value="not_relevant">Mark Not Relevant</option>
              <option value="excluded_with_reason">Exclude with Reason</option>
            </select>

            <button
              onClick={handleExecuteBatch}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Apply to Selected
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Select All Controls */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <button
          onClick={handleSelectAll}
          className="flex items-center gap-1.5 font-medium hover:text-slate-800"
        >
          {selectedIds.length === filteredCandidates.length && filteredCandidates.length > 0 ? (
            <CheckSquare className="w-4 h-4 text-indigo-600" />
          ) : (
            <Square className="w-4 h-4 text-slate-400" />
          )}
          <span>Select All {filteredCandidates.length} Items</span>
        </button>

        <span>Showing {filteredCandidates.length} of {trayCandidates.length} held works</span>
      </div>

      {/* Candidates List */}
      {filteredCandidates.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-serif-scholarly text-slate-800">
            No Candidate Works in Discovery Tray
          </h3>
          <p className="text-xs text-slate-500 font-serif-scholarly max-w-md mx-auto leading-relaxed">
            When you explore Citation Trails, search the literature, or inspect candidate papers, you can add them to this tray to deliberate before promoting them to the library.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setActiveTab('trails')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Explore Citation Trails</span>
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Literature</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCandidates.map((pcs, idx) => (
            <CandidateWorkflowCard
              key={`${pcs.id}-${idx}`}
              candidateState={pcs}
              isSelected={selectedIds.includes(pcs.workId)}
              onToggleSelect={handleToggleSelect}
              onOpenEvidenceModal={handleOpenEvidence}
            />
          ))}
        </div>
      )}

      {/* Add Evidence Modal */}
      {isEvidenceModalOpen && (
        <AddEvidenceModal
          isOpen={isEvidenceModalOpen}
          onClose={() => setIsEvidenceModalOpen(false)}
          defaultWorkId={evidenceWorkId}
        />
      )}

    </div>
  );
};
