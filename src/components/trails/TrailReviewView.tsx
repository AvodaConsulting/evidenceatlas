import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Pin, 
  Archive, 
  FolderPlus, 
  FileText, 
  ArrowLeftRight, 
  Download, 
  MessageSquare, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Send, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  Search,
  BookOpen
} from 'lucide-react';
import { CitationTrail, DiscoveryCandidate, Work, TrailComment, TrailReviewSummary } from '../../types';
import { useApp } from '../../context/AppContext';
import { trailApi, exportApi } from '../../lib/scholarlyApi';
import { TrailCompareModal } from './TrailCompareModal';

interface TrailReviewViewProps {
  onSelectTrail?: (trailId: string) => void;
}

export function formatTrailType(trailType: string | undefined): string {
  if (!trailType) return 'Trail';
  const norm = trailType.toLowerCase();
  if (norm === 'earlier_work' || norm === 'earlier' || norm === 'references') {
    return 'What this paper cites';
  }
  if (norm === 'later_work' || norm === 'later' || norm === 'cited_by') {
    return 'What cites this paper';
  }
  if (norm === 'related_papers' || norm === 'related' || norm === 'similar') {
    return 'Related papers';
  }
  return trailType.replace(/_/g, ' ');
}

export const TrailReviewView: React.FC<TrailReviewViewProps> = ({ onSelectTrail }) => {
  const { 
    citationTrails, 
    activeTrailId, 
    setActiveTrailId,
    activeTrailData, 
    activeProject, 
    currentUser,
    permissions,
    recordAudit
  } = useApp();

  const [selectedTrailId, setSelectedTrailId] = useState<string>(activeTrailId || (citationTrails[0]?.id || ''));
  const [trailCandidates, setTrailCandidates] = useState<DiscoveryCandidate[]>([]);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  
  // Modals & Sub-states
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareTargetTrailId, setCompareTargetTrailId] = useState<string>('');
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);
  const [promoteName, setPromoteName] = useState('');
  const [promoteType, setPromoteType] = useState<'collection' | 'section'>('collection');
  const [promoteDesc, setPromoteDesc] = useState('');
  
  // Comments
  const [comments, setComments] = useState<TrailComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Conclusion Form State
  const [isEditingConclusion, setIsEditingConclusion] = useState(false);
  const [conclusionSummary, setConclusionSummary] = useState<TrailReviewSummary>({
    explored: '',
    found: '',
    included: '',
    rejectedAndWhy: '',
    coverageLimitations: '',
    exploreNext: '',
    researcherConclusion: ''
  });
  const [isSavingConclusion, setIsSavingConclusion] = useState(false);

  // AI Reflective Suggestions
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [aiDisclaimer, setAiDisclaimer] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'reviewed' | 'archived'>('all');

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Sync selected trail ID
  useEffect(() => {
    if (activeTrailId) {
      setSelectedTrailId(activeTrailId);
    }
  }, [activeTrailId]);

  const selectedTrail = citationTrails.find(t => t.id === selectedTrailId) || citationTrails[0];

  // Load selected trail details, candidates, and comments
  useEffect(() => {
    if (!selectedTrail) return;
    
    const loadDetails = async () => {
      setIsDataLoading(true);
      try {
        const res = await trailApi.getTrail(selectedTrail.id);
        setTrailCandidates(res.candidates || []);
        
        // Load comments
        if (res.trail.comments) {
          setComments(res.trail.comments);
        } else {
          const comRes = await trailApi.getTrailComments(selectedTrail.id).catch(() => ({ comments: [] }));
          setComments(comRes.comments || []);
        }

        // Initialize conclusion state
        if (res.trail.reviewSummary) {
          setConclusionSummary(res.trail.reviewSummary);
        } else {
          // Pre-populate structured template based on actual trail data
          const incCount = (res.candidates || []).filter(c => c.decision === 'included').length;
          const rejCount = (res.candidates || []).filter(c => c.decision === 'rejected').length;
          setConclusionSummary({
            explored: `Explored ${(res.trail?.trailType || 'trail').replace('_', ' ')} seeded from: ${(res.trail?.seedWorks || []).map(s => s.title).join('; ') || 'Seed Literature'}`,
            found: `Retrieved ${res.candidates?.length || 0} candidate works via ${(res.trail?.providerSources || []).join(', ') || 'Scholarly Providers'}.`,
            included: `${incCount} works included in project literature scope.`,
            rejectedAndWhy: `${rejCount} works excluded due to out-of-scope methodologies or irrelevant experimental settings.`,
            coverageLimitations: res.trail?.coverageWarnings?.join('; ') || 'Standard provider indexing limits apply.',
            exploreNext: 'Consider investigating downstream empirical validations or counterevidence branches.',
            researcherConclusion: res.trail?.researcherConclusion || ''
          });
        }
      } catch (e) {
        console.warn('Could not fetch trail details for review:', e);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadDetails();
  }, [selectedTrail?.id]);

  const handleTogglePin = async (trail: CitationTrail) => {
    if (!permissions.canManageCitationTrails) return;
    try {
      await trailApi.pinTrail(trail.id, !trail.isPinned);
      trail.isPinned = !trail.isPinned;
      recordAudit('PIN_CITATION_TRAIL', 'citation_trail', trail.id, { isPinned: trail.isPinned });
    } catch (err) {
      console.error('Failed to toggle pin', err);
    }
  };

  const handleToggleArchive = async (trail: CitationTrail) => {
    if (!permissions.canManageCitationTrails) return;
    const nextArchived = trail.status !== 'archived';
    try {
      await trailApi.archiveTrail(trail.id, nextArchived);
      trail.status = nextArchived ? 'archived' : 'active';
      recordAudit('ARCHIVE_CITATION_TRAIL', 'citation_trail', trail.id, { 
        status: trail.status, 
        auditPreserved: true,
        note: 'Archived exploratory dead end without deleting audit history' 
      });
    } catch (err) {
      console.error('Failed to toggle archive', err);
    }
  };

  const handlePromoteTrail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrail || !promoteName.trim() || !permissions.canManageCitationTrails) return;

    try {
      await trailApi.promoteTrail(selectedTrail.id, {
        targetType: promoteType,
        name: promoteName.trim(),
        description: promoteDesc.trim() || undefined
      });
      selectedTrail.promotedCollection = {
        name: promoteName.trim(),
        sectionTitle: promoteType === 'section' ? promoteName.trim() : undefined,
        promotedAt: new Date().toISOString(),
        promotedBy: currentUser.displayName
      };
      setIsPromoteOpen(false);
      setPromoteName('');
      setPromoteDesc('');
      recordAudit('PROMOTE_CITATION_TRAIL', 'citation_trail', selectedTrail.id, {
        targetType: promoteType,
        name: promoteName.trim()
      });
    } catch (err) {
      console.error('Failed to promote trail', err);
    }
  };

  const handleSaveConclusion = async () => {
    if (!selectedTrail || !permissions.canManageCitationTrails) return;
    setIsSavingConclusion(true);
    try {
      await trailApi.attachTrailConclusion(selectedTrail.id, {
        researcherConclusion: conclusionSummary.researcherConclusion,
        reviewSummary: conclusionSummary
      });
      selectedTrail.researcherConclusion = conclusionSummary.researcherConclusion;
      selectedTrail.reviewSummary = conclusionSummary;
      selectedTrail.status = 'reviewed';
      setIsEditingConclusion(false);
      recordAudit('ATTACH_TRAIL_CONCLUSION', 'citation_trail', selectedTrail.id, {
        conclusionLength: conclusionSummary.researcherConclusion.length
      });
    } catch (err) {
      console.error('Failed to save conclusion', err);
    } finally {
      setIsSavingConclusion(false);
    }
  };

  const handleGenerateAiSuggestions = async () => {
    if (!selectedTrail) return;
    setIsLoadingAi(true);
    try {
      const res = await trailApi.getTrailAiSuggestions(selectedTrail.id);
      setAiSuggestions(res.aiSuggestions);
      setAiDisclaimer(res.disclaimer);
    } catch (err) {
      console.error('Failed to generate suggestions', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrail || !newCommentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      const res = await trailApi.addTrailComment(selectedTrail.id, {
        userId: currentUser.id,
        userName: currentUser.displayName,
        text: newCommentText.trim()
      });
      setComments(prev => [...prev, res.comment]);
      setNewCommentText('');
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!selectedTrail) return;
    try {
      const res = await trailApi.toggleTrailFollow(selectedTrail.id, currentUser.id, currentUser.displayName);
      selectedTrail.followedByUsers = res.followedByUsers;
    } catch (err) {
      console.error('Failed to toggle follow', err);
    }
  };

  const handleExportTrailAudit = async (format: 'json' | 'markdown' | 'csv') => {
    if (!activeProject || !selectedTrail) return;
    setIsExporting(true);
    try {
      const report = await exportApi.generateTrailsAuditReport({
        projectId: activeProject.id,
        projectTitle: activeProject.title,
        trails: [selectedTrail],
        candidatesByTrail: { [selectedTrail.id]: trailCandidates },
        eventsByTrail: { [selectedTrail.id]: [] }
      });

      let blob: Blob;
      let filename: string;

      if (format === 'json') {
        blob = new Blob([JSON.stringify(report.jsonReport, null, 2)], { type: 'application/json' });
        filename = `trail-audit-${selectedTrail.id.slice(0, 8)}.json`;
      } else if (format === 'csv') {
        blob = new Blob([report.csvDecisions], { type: 'text/csv' });
        filename = `trail-candidates-${selectedTrail.id.slice(0, 8)}.csv`;
      } else {
        blob = new Blob([report.markdownReport], { type: 'text/markdown' });
        filename = `trail-audit-${selectedTrail.id.slice(0, 8)}.md`;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredTrails = citationTrails.filter(t => {
    if (statusFilter === 'archived' && t.status !== 'archived') return false;
    if (statusFilter === 'reviewed' && t.status !== 'reviewed') return false;
    if (statusFilter === 'active' && t.status === 'archived') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.trailType.toLowerCase().includes(q);
    }
    return true;
  });

  const includedCandidates = trailCandidates.filter(c => c.decision === 'included');
  const rejectedCandidates = trailCandidates.filter(c => c.decision === 'rejected');
  const isFollowed = selectedTrail?.followedByUsers?.includes(currentUser.id);

  return (
    <div className="flex flex-col lg:flex-row gap-6 font-serif-scholarly min-h-[600px]">
      {/* Left Sidebar: Trail List & Branching Index */}
      <div className="w-full lg:w-80 shrink-0 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <GitBranch className="w-4 h-4 text-indigo-600" />
              <span>Trail Lineage Explorer</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              {citationTrails.length} Trails
            </span>
          </div>

          {/* Search & Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trails..."
                className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-indigo-500"
              />
            </div>
            <div className="flex gap-1 text-[11px]">
              {(['all', 'active', 'reviewed', 'archived'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-2 py-1 rounded capitalize font-medium transition-colors ${
                    statusFilter === tab 
                      ? 'bg-indigo-600 text-white font-bold' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* List of Trails */}
          <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredTrails.map(trail => {
              const isSelected = trail.id === selectedTrail?.id;
              return (
                <div
                  key={trail.id}
                  onClick={() => {
                    setSelectedTrailId(trail.id);
                    setActiveTrailId(trail.id);
                  }}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-200'
                      : trail.status === 'archived'
                        ? 'border-slate-200 bg-slate-50/50 opacity-60 hover:opacity-80'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {trail.isPinned && <Pin className="w-3 h-3 text-amber-600 shrink-0 fill-amber-500" />}
                      <span className="text-xs font-bold text-slate-900 truncate leading-snug">
                        {trail.title}
                      </span>
                    </div>
                    {trail.status === 'reviewed' ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded shrink-0 font-sans">
                        Reviewed
                      </span>
                    ) : trail.status === 'archived' ? (
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-1 py-0.2 rounded shrink-0 font-sans">
                        Archived
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="capitalize">{formatTrailType(trail.trailType)}</span>
                    <span>{trail.seedWorkIds?.length || 0} seeds</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audit Export Actions Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Research Audit Export</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-snug">
            Export trail lineage trees, candidate decisions, and search provenance for academic peer-review.
          </p>
          <div className="flex flex-col gap-1.5 pt-1">
            <button
              onClick={() => handleExportTrailAudit('markdown')}
              disabled={isExporting}
              className="w-full text-left px-2.5 py-1.5 text-xs bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 flex items-center justify-between font-semibold transition-colors"
            >
              <span>Audit Report (.md)</span>
              <Download className="w-3 h-3 text-slate-400" />
            </button>
            <button
              onClick={() => handleExportTrailAudit('csv')}
              disabled={isExporting}
              className="w-full text-left px-2.5 py-1.5 text-xs bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 flex items-center justify-between font-semibold transition-colors"
            >
              <span>Candidate Decisions (.csv)</span>
              <Download className="w-3 h-3 text-slate-400" />
            </button>
            <button
              onClick={() => handleExportTrailAudit('json')}
              disabled={isExporting}
              className="w-full text-left px-2.5 py-1.5 text-xs bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 flex items-center justify-between font-semibold transition-colors"
            >
              <span>Full Lineage Tree (.json)</span>
              <Download className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Review Workspace */}
      <div className="flex-1 space-y-6">
        {selectedTrail ? (
          <>
            {/* Trail Action Header */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                      {formatTrailType(selectedTrail.trailType)}
                    </span>
                    {selectedTrail.isPinned && (
                      <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                        <Pin className="w-3 h-3 fill-amber-500" /> Pinned Trail
                      </span>
                    )}
                    {selectedTrail.promotedCollection && (
                      <span className="text-xs bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full font-semibold">
                        Promoted: {selectedTrail.promotedCollection.name}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold font-serif-scholarly text-slate-900 leading-snug">
                    {selectedTrail.title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Created on {new Date(selectedTrail.createdAt).toLocaleDateString()} by {selectedTrail.creatorName || 'Researcher'} • Providers: {selectedTrail.providerSources.join(', ')}
                  </p>
                </div>

                {/* Trail Control Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleTogglePin(selectedTrail)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                      selectedTrail.isPinned 
                        ? 'bg-amber-50 border-amber-300 text-amber-900' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                    title="Pin this important trail branch"
                  >
                    <Pin className={`w-3.5 h-3.5 ${selectedTrail.isPinned ? 'fill-amber-500 text-amber-700' : ''}`} />
                    <span>{selectedTrail.isPinned ? 'Pinned' : 'Pin Trail'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setCompareTargetTrailId(citationTrails.find(t => t.id !== selectedTrail.id)?.id || selectedTrail.id);
                      setIsCompareOpen(true);
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Compare Trails</span>
                  </button>

                  <button
                    onClick={() => setIsPromoteOpen(true)}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                    title="Promote into collection or literature review section"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-purple-600" />
                    <span>Promote</span>
                  </button>

                  <button
                    onClick={() => handleToggleArchive(selectedTrail)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                      selectedTrail.status === 'archived'
                        ? 'bg-slate-200 border-slate-300 text-slate-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800'
                    }`}
                    title="Archive exploratory dead end without deleting audit history"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>{selectedTrail.status === 'archived' ? 'Unarchive' : 'Archive Dead End'}</span>
                  </button>
                </div>
              </div>

              {/* Exploration Rationale */}
              {selectedTrail.researcherNotes && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1">
                  <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                    Initial Analytical Hypothesis:
                  </span>
                  <p className="italic">"{selectedTrail.researcherNotes}"</p>
                </div>
              )}
            </div>

            {/* 4 Structured Review Panels: What this trail explored, What was found, What was included, What was rejected */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. What this trail explored */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>What This Trail Explored</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <p><strong>Strategy:</strong> {(selectedTrail.trailType || 'trail').replace('_', ' ')}</p>
                  <p><strong>Seed Works ({(selectedTrail.seedWorks || []).length}):</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                    {(selectedTrail.seedWorks || []).map((s, idx) => (
                      <li key={`${s.id}-${idx}`} className="truncate" title={s.title}>{s.title} ({s.year || 'N/A'})</li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-slate-500 pt-1">
                    <strong>Provenance:</strong> {selectedTrail.provenanceSummary}
                  </p>
                </div>
              </div>

              {/* 2. What was found */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                  <Layers className="w-4 h-4 text-slate-600" />
                  <span>What Was Found</span>
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  <p><strong>Total Candidates Generated:</strong> {trailCandidates.length} works</p>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                      <div className="text-sm font-bold text-emerald-800">{includedCandidates.length}</div>
                      <div className="text-[10px] text-emerald-700">Included</div>
                    </div>
                    <div className="p-2 bg-amber-50 border border-amber-100 rounded-lg">
                      <div className="text-sm font-bold text-amber-800">
                        {trailCandidates.filter(c => c.decision === 'queued').length}
                      </div>
                      <div className="text-[10px] text-amber-700">Queued</div>
                    </div>
                    <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg">
                      <div className="text-sm font-bold text-rose-800">{rejectedCandidates.length}</div>
                      <div className="text-[10px] text-rose-700">Rejected</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. What was included */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-900">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>What Was Included ({includedCandidates.length})</span>
                  </span>
                </div>
                {includedCandidates.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No works included from this trail yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-xs">
                    {includedCandidates.map((c, idx) => (
                      <div key={`${c.id}-${idx}`} className="p-1.5 bg-emerald-50/40 border border-emerald-100 rounded flex items-start justify-between gap-2">
                        <span className="truncate font-medium text-emerald-950" title={c.work.title}>
                          {c.work.title} ({c.work.year || 'N/A'})
                        </span>
                        {c.relevanceNotes && (
                          <span className="text-[10px] text-emerald-700 italic shrink-0" title={c.relevanceNotes}>
                            Note attached
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. What was rejected and why */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-rose-900">
                  <span className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>What Was Rejected & Why ({rejectedCandidates.length})</span>
                  </span>
                </div>
                {rejectedCandidates.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No candidate works marked rejected in this trail.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-xs">
                    {rejectedCandidates.map((c, idx) => (
                      <div key={`${c.id}-${idx}`} className="p-1.5 bg-rose-50/40 border border-rose-100 rounded space-y-0.5">
                        <div className="truncate font-medium text-rose-950" title={c.work.title}>
                          {c.work.title} ({c.work.year || 'N/A'})
                        </div>
                        <div className="text-[10px] text-rose-700 italic truncate">
                          Rationale: {c.relevanceNotes || 'Not directly aligned with synthesis scope'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Researcher-Written Conclusion & Review Summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Researcher Conclusion & Synthesis Record
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditingConclusion ? (
                    <button
                      onClick={() => setIsEditingConclusion(true)}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors"
                    >
                      Edit Conclusion
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveConclusion}
                      disabled={isSavingConclusion}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                    >
                      {isSavingConclusion ? 'Saving...' : 'Save Conclusion'}
                    </button>
                  )}
                </div>
              </div>

              {!isEditingConclusion ? (
                <div className="space-y-3 text-xs text-slate-800 leading-relaxed">
                  {selectedTrail.researcherConclusion ? (
                    <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-lg whitespace-pre-wrap">
                      {selectedTrail.researcherConclusion}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">
                      No formal synthesis conclusion attached yet. Click "Edit Conclusion" to document your research findings for this trail.
                    </p>
                  )}

                  {selectedTrail.reviewSummary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[11px] text-slate-600">
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded">
                        <strong>Coverage Limitations:</strong> {selectedTrail.reviewSummary.coverageLimitations}
                      </div>
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded">
                        <strong>What to Explore Next:</strong> {selectedTrail.reviewSummary.exploreNext}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Final Researcher Conclusion
                    </label>
                    <textarea
                      value={conclusionSummary.researcherConclusion}
                      onChange={(e) => setConclusionSummary(prev => ({ ...prev, researcherConclusion: e.target.value }))}
                      placeholder="Synthesize the findings of this trail: What did this branch prove, challenge, or contribute to your literature review?"
                      rows={4}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-indigo-500 font-serif-scholarly leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Coverage Limitations
                      </label>
                      <input
                        type="text"
                        value={conclusionSummary.coverageLimitations}
                        onChange={(e) => setConclusionSummary(prev => ({ ...prev, coverageLimitations: e.target.value }))}
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Recommended Next Exploration Direction
                      </label>
                      <input
                        type="text"
                        value={conclusionSummary.exploreNext}
                        onChange={(e) => setConclusionSummary(prev => ({ ...prev, exploreNext: e.target.value }))}
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* AI Reflective Suggestions Assistant */}
              <div className="p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>AI Reflective Synthesis Suggestions</span>
                  </div>
                  <button
                    onClick={handleGenerateAiSuggestions}
                    disabled={isLoadingAi}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs font-semibold transition-colors"
                  >
                    {isLoadingAi ? 'Generating...' : 'Generate Suggestions'}
                  </button>
                </div>

                {aiSuggestions && (
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="p-3 bg-white border border-indigo-100 rounded-lg text-slate-800 leading-relaxed">
                      {aiSuggestions}
                    </div>
                    <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded italic">
                      * Epistemic Notice: {aiDisclaimer || 'AI suggestions are reflective prompts only; never automated conclusions or verified facts.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Collaboration & Comments Thread */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Trail Review Collaboration ({comments.length})
                  </h3>
                </div>
                <button
                  onClick={handleToggleFollow}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                    isFollowed 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{isFollowed ? 'Following Updates' : 'Follow Trail'}</span>
                </button>
              </div>

              {/* Comments list */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No comments yet. Start a discussion on this trail branch.</p>
                ) : (
                  comments.map((c, idx) => (
                    <div key={`${c.id}-${idx}`} className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800">{c.authorName}</span>
                        <span className="text-slate-400">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment form */}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Add a peer review comment, question, or verification note..."
                  className="flex-1 text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newCommentText.trim()}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="py-20 text-center text-slate-400 text-sm">
            Select a Citation Trail from the left index to review.
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      {isCompareOpen && (
        <TrailCompareModal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          initialTrailAId={selectedTrail?.id}
          initialTrailBId={compareTargetTrailId}
        />
      )}

      {/* Promotion Modal */}
      {isPromoteOpen && selectedTrail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 font-serif-scholarly">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-purple-600" />
                <span>Promote Citation Trail</span>
              </h3>
              <button onClick={() => setIsPromoteOpen(false)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePromoteTrail} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Promotion Destination
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPromoteType('collection')}
                    className={`p-2 border rounded-lg text-center font-bold ${
                      promoteType === 'collection' ? 'border-purple-600 bg-purple-50 text-purple-900' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Named Collection
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromoteType('section')}
                    className={`p-2 border rounded-lg text-center font-bold ${
                      promoteType === 'section' ? 'border-purple-600 bg-purple-50 text-purple-900' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Review Subsection
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {promoteType === 'collection' ? 'Collection Name' : 'Section Heading'}
                </label>
                <input
                  type="text"
                  value={promoteName}
                  onChange={(e) => setPromoteName(e.target.value)}
                  placeholder="e.g., Foundational Proofs & Chain-of-Thought Lineage"
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-purple-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Scope Annotation (Optional)
                </label>
                <textarea
                  value={promoteDesc}
                  onChange={(e) => setPromoteDesc(e.target.value)}
                  placeholder="Add an explanatory note for this promoted literature cluster..."
                  rows={2}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPromoteOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!promoteName.trim()}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Promote Trail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
