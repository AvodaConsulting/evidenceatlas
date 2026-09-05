import React, { useState, useMemo, useEffect } from 'react';
import { 
  GitBranch, 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Copy, 
  Camera, 
  Download, 
  Info,
  BookOpen,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  RotateCw,
  FileText
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { CitationTrail, DiscoveryCandidate, Work, TrailType } from '../../../types';
import { CandidateCard } from '../../trails/CandidateCard';
import { TrailGraphView } from '../../trails/TrailGraphView';
import { StudyQueueView } from '../../trails/StudyQueueView';
import { TrailLineageView } from '../../trails/TrailLineageView';
import { CreateTrailModal } from '../../trails/CreateTrailModal';
import { TrailReviewView } from '../../trails/TrailReviewView';

export const CitationTrailsTab: React.FC = () => {
  const {
    citationTrails,
    activeTrailId,
    setActiveTrailId,
    activeTrailData,
    isTrailLoading,
    fetchCitationTrails,
    loadMoreTrailCandidates,
    duplicateCitationTrail,
    createTrailSnapshot,
    studyQueue,
    permissions,
    activeProject
  } = useApp();

  // Internal tab view
  const [subTab, setSubTab] = useState<'candidates' | 'graph' | 'study_queue' | 'lineage' | 'review'>('candidates');
  const [candidateFilter, setCandidateFilter] = useState<'all' | 'candidate' | 'queued' | 'included' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals and selection
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [branchSeedWork, setBranchSeedWork] = useState<Work[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<DiscoveryCandidate | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Sync trails from API on mount
  useEffect(() => {
    fetchCitationTrails();
  }, [fetchCitationTrails]);

  const activeTrail = activeTrailData?.trail || citationTrails.find(t => t.id === activeTrailId) || citationTrails[0];
  const candidates = activeTrailData?.candidates || [];
  const events = activeTrailData?.events || [];
  const snapshots = activeTrailData?.snapshots || [];

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      if (candidateFilter !== 'all' && c.decision !== candidateFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const authorNames = (c.work?.authors || []).map(a => a?.name || '').join(' ');
        const text = `${c.work?.title || ''} ${authorNames} ${c.work?.venue || ''} ${c.relevanceNotes || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [candidates, candidateFilter, searchQuery]);

  // Statistics for active trail
  const stats = useMemo(() => {
    let unreviewed = 0;
    let queued = 0;
    let included = 0;
    let rejected = 0;
    candidates.forEach(c => {
      if (c.decision === 'included') included++;
      else if (c.decision === 'queued') queued++;
      else if (c.decision === 'rejected') rejected++;
      else unreviewed++;
    });
    return { total: candidates.length, unreviewed, queued, included, rejected };
  }, [candidates]);

  const handleBranchFromWork = (work: Work) => {
    setBranchSeedWork([work]);
    setBranchModalOpen(true);
  };

  const handleDuplicate = async () => {
    if (!activeTrail) return;
    setIsDuplicating(true);
    try {
      await duplicateCitationTrail(activeTrail.id, `Copy of ${activeTrail.title}`);
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleLoadMore = async () => {
    if (!activeTrail) return;
    await loadMoreTrailCandidates(activeTrail.id);
  };

  const projectQueueCount = studyQueue.filter(item => !activeProject || item.projectId === activeProject.id).length;

  return (
    <div className="space-y-4">
      {/* 1. Epistemic Principle Notice Banner */}
      <div className="bg-indigo-950 text-indigo-100 border border-indigo-900 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-800 text-indigo-200 rounded-lg shrink-0">
            <GitBranch className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-white uppercase tracking-wider text-[10px] block">
              Reproducible Citation Trails
            </span>
            <span className="text-indigo-200 font-serif-scholarly leading-relaxed">
              Trace literature branches deliberately with transparent "Why it appeared" provenance. Citation proximity is never treated as proof of quality or consensus.
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            setBranchSeedWork([]);
            setCreateModalOpen(true);
          }}
          className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Trail</span>
        </button>
      </div>

      {/* 2. Trail Selector & Details Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Left: Trail Dropdown & Trail Type Badge */}
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Trail:
            </label>
            <select
              value={activeTrail?.id || ''}
              onChange={(e) => setActiveTrailId(e.target.value)}
              className="text-xs font-bold font-serif-scholarly border border-slate-200 bg-slate-50 hover:bg-white rounded-lg px-3 py-1.5 text-slate-900 focus:outline-indigo-500 max-w-md truncate"
            >
              {citationTrails.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({(t.trailType || 'trail').replace('_', ' ')})
                </option>
              ))}
            </select>

            {activeTrail && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                {(activeTrail.trailType || 'trail').replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Right: Trail Action Buttons */}
          {activeTrail && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => {
                  setBranchSeedWork(activeTrail.seedWorks);
                  setBranchModalOpen(true);
                }}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                title="Branch a new trail from this current branch"
              >
                <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
                <span>Branch Trail</span>
              </button>

              <button
                onClick={handleDuplicate}
                disabled={isDuplicating}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                title="Duplicate trail snapshot"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Duplicate</span>
              </button>
            </div>
          )}
        </div>

        {/* Trail Context Bar: Seeds, Retrieval Source, Timestamp */}
        {activeTrail && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-medium">Seed Origin:</span>
              {(activeTrail.seedWorks || []).map((s, idx) => (
                <span key={`${s.id}-${idx}`} className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 truncate max-w-xs font-serif-scholarly">
                  ★ {s.title} ({s.year || 'N/A'})
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 text-slate-500 text-[11px]">
              <span>Provider: <strong className="text-slate-700 font-mono">OpenAlex Polite Pool</strong></span>
              <span>Updated: <strong className="text-slate-700">{new Date(activeTrail.updatedAt).toLocaleTimeString()}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Sub-navigation Tabs (Candidates, Map, Study Queue, Lineage) */}
      <div className="bg-white border border-slate-200 rounded-lg px-3 shadow-xs flex items-center justify-between overflow-x-auto">
        <nav className="flex h-11 gap-1">
          <button
            onClick={() => setSubTab('candidates')}
            className={`flex items-center gap-1.5 px-3 border-b-2 text-xs font-semibold transition-all shrink-0 ${
              subTab === 'candidates'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Candidates & Decisions</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-indigo-100 text-indigo-700">
              {candidates.length}
            </span>
          </button>

          <button
            onClick={() => setSubTab('graph')}
            className={`flex items-center gap-1.5 px-3 border-b-2 text-xs font-semibold transition-all shrink-0 ${
              subTab === 'graph'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2D Trail Map</span>
          </button>

          <button
            onClick={() => setSubTab('study_queue')}
            className={`flex items-center gap-1.5 px-3 border-b-2 text-xs font-semibold transition-all shrink-0 ${
              subTab === 'study_queue'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Study Queue</span>
            {projectQueueCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800">
                {projectQueueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('lineage')}
            className={`flex items-center gap-1.5 px-3 border-b-2 text-xs font-semibold transition-all shrink-0 ${
              subTab === 'lineage'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Lineage & Snapshots</span>
            {snapshots.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-slate-100 text-slate-600">
                {snapshots.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('review')}
            className={`flex items-center gap-1.5 px-3 border-b-2 text-xs font-semibold transition-all shrink-0 ${
              subTab === 'review'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Review & Compare</span>
            {citationTrails.some(t => t.status === 'reviewed') && (
              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-100 text-emerald-800">
                {citationTrails.filter(t => t.status === 'reviewed').length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Exploration Budget & Stop-and-Review Safeguard Notice */}
      {(citationTrails.length >= 5 || projectQueueCount >= 20) && subTab !== 'review' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs font-serif-scholarly">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <strong className="block text-amber-950 font-sans text-[11px] uppercase tracking-wider">
                Exploration Safeguard: Review Recommended
              </strong>
              <span>
                You have accumulated {citationTrails.length} trail branches and {projectQueueCount} unread works in queue. Consider reviewing your findings before expanding further.
              </span>
            </div>
          </div>
          <button
            onClick={() => setSubTab('review')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shrink-0 transition-colors shadow-xs font-sans"
          >
            Switch to Review Mode
          </button>
        </div>
      )}

      {/* 4. Active Sub-Tab View Rendering */}
      {subTab === 'candidates' && (
        <div className="space-y-3">
          {/* Decision Status Filter Bar & Search */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <button
                onClick={() => setCandidateFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  candidateFilter === 'all'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({stats.total})
              </button>

              <button
                onClick={() => setCandidateFilter('candidate')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  candidateFilter === 'candidate'
                    ? 'bg-sky-600 text-white font-bold'
                    : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
                }`}
              >
                Unreviewed ({stats.unreviewed})
              </button>

              <button
                onClick={() => setCandidateFilter('queued')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  candidateFilter === 'queued'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                Queued for Reading ({stats.queued})
              </button>

              <button
                onClick={() => setCandidateFilter('included')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  candidateFilter === 'included'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Included in Library ({stats.included})
              </button>

              <button
                onClick={() => setCandidateFilter('rejected')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  candidateFilter === 'rejected'
                    ? 'bg-slate-700 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Excluded ({stats.rejected})
              </button>
            </div>

            {/* Candidate Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter candidates in trail..."
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-indigo-500"
              />
            </div>
          </div>

          {/* Candidate List */}
          {filteredCandidates.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 font-serif-scholarly">
                No candidates found matching the selected filter
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try switching the status filter or click "Load Next 15 Candidates" to explore further along this citation trajectory.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCandidates.map((candidate, idx) => (
                <CandidateCard
                  key={`${candidate.id}-${idx}`}
                  candidate={candidate}
                  trailId={activeTrail?.id || ''}
                  onSelectCandidate={(c) => setSelectedCandidate(c)}
                  onBranchFromCandidate={(w) => handleBranchFromWork(w)}
                  isSelected={selectedCandidate?.id === candidate.id}
                />
              ))}
            </div>
          )}

          {/* Load More Pagination Bar */}
          {activeTrail && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
              <div className="text-xs text-slate-500 font-serif-scholarly">
                Showing {filteredCandidates.length} of {candidates.length} retrieved candidates
                {activeTrail.totalAvailable ? ` (${activeTrail.totalAvailable} total indexed in network)` : ''}
              </div>

              {activeTrail.hasMore ? (
                <button
                  onClick={handleLoadMore}
                  disabled={isTrailLoading}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold rounded-xl text-xs flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isTrailLoading ? 'animate-spin' : ''}`} />
                  <span>{isTrailLoading ? 'Retrieving Next Candidates...' : 'Load Next 15 Candidates'}</span>
                </button>
              ) : (
                <span className="text-xs text-slate-400 font-medium">
                  All available trail candidates loaded
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {subTab === 'graph' && activeTrail && (
        <TrailGraphView
          trail={activeTrail}
          candidates={candidates}
          onSelectCandidate={(c) => setSelectedCandidate(c)}
          selectedCandidateId={selectedCandidate?.work.id || null}
        />
      )}

      {subTab === 'study_queue' && (
        <StudyQueueView />
      )}

      {subTab === 'lineage' && activeTrail && (
        <TrailLineageView
          trail={activeTrail}
          events={events}
          snapshots={snapshots}
          allTrails={citationTrails}
          onSelectTrail={(id) => setActiveTrailId(id)}
        />
      )}

      {subTab === 'review' && (
        <TrailReviewView
          onSelectTrail={(id) => setActiveTrailId(id)}
        />
      )}

      {/* Create New Trail Modal */}
      {createModalOpen && (
        <CreateTrailModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          preselectedSeeds={branchSeedWork}
          parentTrailId={null}
        />
      )}

      {/* Branch Trail Modal */}
      {branchModalOpen && (
        <CreateTrailModal
          isOpen={branchModalOpen}
          onClose={() => setBranchModalOpen(false)}
          preselectedSeeds={branchSeedWork}
          parentTrailId={activeTrail?.id || null}
        />
      )}
    </div>
  );
};
