import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  ShieldCheck, 
  Info, 
  ExternalLink, 
  Compass, 
  Sparkles, 
  Plus, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  Layers,
  ArrowRight,
  MoreHorizontal,
  Undo2,
  Share2,
  Trash2,
  Flame,
  Network,
  X
} from 'lucide-react';
import { Work, InclusionStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { scholarlyApi } from '../../lib/scholarlyApi';
import { SciteStatementsDrawer } from '../evidence/SciteStatementsDrawer';
import { SciteTalliesBadge } from '../evidence/SciteTalliesBadge';

interface PaperExplorerProps {
  work: Work;
  onBackToSearch?: () => void;
}

type Direction = 'earlier' | 'later' | 'similar' | null;

interface CandidateItem {
  work: Work;
  reason: string;
  relationshipType: 'earlier' | 'later' | 'similar';
}

export const PaperExplorer: React.FC<PaperExplorerProps> = ({ work, onBackToSearch }) => {
  const { 
    explorerHistory, 
    backInExplorer, 
    openPaperInExplorer, 
    addWorkToProject, 
    removeWorkFromProject,
    activeProjectWorksList, 
    studyQueue, 
    addToStudyQueue, 
    removeFromStudyQueue,
    showToast,
    works: allWorkspaceWorks,
    activeProject,
    dismissedPaperHint,
    setDismissedPaperHint,
    dismissedCandidateHint,
    setDismissedCandidateHint,
    dismissedFirstAddHint,
    setDismissedFirstAddHint
  } = useApp();

  const [activeDirection, setActiveDirection] = useState<Direction>(null);
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [candidateError, setCandidateError] = useState<string | null>(null);
  const [expandedAbstract, setExpandedAbstract] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [candidateLimit, setCandidateLimit] = useState(12);

  // Scite / Evidence Drawer state
  const [statementsDrawerOpen, setStatementsDrawerOpen] = useState(false);
  const [drawerWork, setDrawerWork] = useState<Work | null>(null);

  // Candidate dropdown state (candidateId -> boolean)
  const [openCandidateMenuId, setOpenCandidateMenuId] = useState<string | null>(null);

  // Check if current paper is already in My Papers (active project)
  const existingProjectWork = activeProjectWorksList.find(pw => pw.workId === work.id);
  const isAlreadyInMyPapers = !!existingProjectWork;

  // Check if current paper is in Read Next queue
  const isAlreadyInReadNext = studyQueue.some(item => item.workId === work.id);

  // When activeDirection changes, load candidate papers
  useEffect(() => {
    if (!activeDirection) {
      setCandidates([]);
      return;
    }

    let isMounted = true;
    const loadCandidates = async () => {
      setIsLoadingCandidates(true);
      setCandidateError(null);
      try {
        const items: CandidateItem[] = [];

        let op: 'references' | 'cited_by' | 'related' = 'references';
        if (activeDirection === 'earlier') op = 'references';
        if (activeDirection === 'later') op = 'cited_by';
        if (activeDirection === 'similar') op = 'related';

        const res = await scholarlyApi.networkExpand(work, op, candidateLimit);
        
        if (res && Array.isArray(res.candidates)) {
          for (const cand of res.candidates) {
            if (cand.relationVerified) {
              items.push({
                work: cand.work,
                reason: cand.labelExplanation || cand.relationEvidence || (
                  op === 'references' ? 'Cited in the bibliography of this work.' :
                  op === 'cited_by' ? 'Cites this paper in its bibliography.' :
                  'Related work via OpenAlex topic similarity.'
                ),
                relationshipType: activeDirection
              });
            }
          }
        }

        if (isMounted) {
          setCandidates(items);
          if (items.length === 0 && res.warnings && res.warnings.length > 0) {
            setCandidateError(res.warnings[0]);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setCandidateError(err.message || 'Could not load verified candidates.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingCandidates(false);
        }
      }
    };

    loadCandidates();

    return () => {
      isMounted = false;
    };
  }, [activeDirection, work.id, work.openAlexId, work.doi, candidateLimit]);

  // Handler: Add to My Papers
  const handleAddToMyPapers = async (targetWork: Work) => {
    const isFirstAdd = activeProjectWorksList.length === 0 || !dismissedFirstAddHint;
    try {
      await addWorkToProject(targetWork, { inclusionStatus: 'included' });
      if (isFirstAdd) {
        showToast('Good. Your project is now growing from papers you chose.');
        setDismissedFirstAddHint(true);
      } else {
        showToast(
          'Added to My Papers.',
          'Undo',
          async () => {
            const match = activeProjectWorksList.find(pw => pw.workId === targetWork.id);
            if (match) {
              await removeWorkFromProject(match.id);
              showToast('Removed from My Papers.');
            }
          }
        );
      }
    } catch (err: any) {
      console.error('Failed to add to project:', err);
    }
  };

  // Handler: Add to Read Next
  const handleAddToReadNext = async (targetWork: Work, reason?: string) => {
    if (studyQueue.length >= 20) {
      showToast('You already have a substantial reading list. Review it before adding more.');
    }
    try {
      await addToStudyQueue(
        targetWork, 
        undefined, 
        undefined, 
        reason || `Explored from "${work.title.substring(0, 40)}..."`
      );
      showToast('Added to Read Next.');
    } catch (err: any) {
      console.error('Failed to add to Read Next:', err);
    }
  };

  // Plain language directional labels
  const getDirectionHeading = () => {
    switch (activeDirection) {
      case 'earlier':
        return 'What this paper cites';
      case 'later':
        return 'What cites this paper';
      case 'similar':
        return 'Related papers';
      default:
        return 'Explore from this paper';
    }
  };

  const getDirectionSubheading = () => {
    switch (activeDirection) {
      case 'earlier':
        return 'Direct outgoing references indexed in the bibliography of this work.';
      case 'later':
        return 'Direct incoming citations from subsequent papers that cite this work.';
      case 'similar':
        return 'Semantic or graph-neighbour similarity from OpenAlex; never labeled as direct citations.';
      default:
        return '';
    }
  };

  const previousPaper = explorerHistory.length > 0 ? explorerHistory[explorerHistory.length - 1] : null;

  return (
    <div className="space-y-4">
      {/* 1. Back Navigation */}
      <div className="flex items-center justify-between">
        {previousPaper ? (
          <button
            onClick={backInExplorer}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to previous paper: <span className="font-normal italic text-slate-500 max-w-[240px] truncate inline-block align-bottom">{previousPaper.title}</span></span>
          </button>
        ) : (
          <button
            onClick={onBackToSearch || backInExplorer}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to search results</span>
          </button>
        )}

        {explorerHistory.length > 0 && (
          <span className="text-[11px] text-slate-400 font-medium">
            Exploration Depth: {explorerHistory.length}
          </span>
        )}
      </div>

      {/* 2. Paper Overview Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
              {work.year || 'Unknown Year'}
            </span>
            {work.venue && (
              <span className="text-[11px] font-medium text-slate-500 italic truncate max-w-md">
                {work.venue}
              </span>
            )}
            {work.citationCount > 0 && (
              <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 ml-auto shrink-0">
                {work.citationCount.toLocaleString()} Citations
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold font-serif-scholarly text-slate-900 leading-tight">
            {work.title}
          </h1>

          <p className="text-xs text-slate-600 mt-2 font-medium">
            {(work.authors || []).map(a => a?.name).filter(Boolean).join(', ') || 'Unknown Authors'}
          </p>
        </div>

        {/* Abstract Preview */}
        {work.abstract && (
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-700 leading-relaxed font-serif-scholarly">
            <p className={expandedAbstract ? '' : 'line-clamp-3'}>
              {work.abstract}
            </p>
            {work.abstract.length > 220 && (
              <button
                onClick={() => setExpandedAbstract(!expandedAbstract)}
                className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold mt-1 inline-flex items-center gap-0.5"
              >
                {expandedAbstract ? 'Show less' : 'Read full abstract'}
              </button>
            )}
          </div>
        )}

        {/* Action Bar Below Paper Header */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {isAlreadyInMyPapers ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-semibold text-xs">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              In My Papers
            </span>
          ) : (
            <button
              onClick={() => handleAddToMyPapers(work)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add to My Papers
            </button>
          )}

          {isAlreadyInReadNext ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-semibold text-xs">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              In Read Next
            </span>
          ) : (
            <button
              onClick={() => handleAddToReadNext(work)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-semibold text-xs transition-colors shadow-xs"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Read Next
            </button>
          )}

          <button
            onClick={() => {
              setDrawerWork(work);
              setStatementsDrawerOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-semibold text-xs transition-colors shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Check Evidence
          </button>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-medium ml-auto"
          >
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>{showDetails ? 'Hide details' : 'More details'}</span>
          </button>
        </div>

        {/* Collapsible Details Drawer */}
        {showDetails && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs text-slate-700 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="font-semibold text-slate-500">DOI: </span>
                {work.doi ? (
                  <a 
                    href={`https://doi.org/${work.doi}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-indigo-600 hover:underline font-mono"
                  >
                    {work.doi}
                  </a>
                ) : 'Not available'}
              </div>
              <div>
                <span className="font-semibold text-slate-500">Source: </span>
                <span>{work.provenance?.provider || 'OpenAlex'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Document Type: </span>
                <span className="capitalize">{work.type || 'journal-article'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Indexed References: </span>
                <span>{work.referenceCount || (work.references?.length || 0)}</span>
              </div>
            </div>
            {work.openAccessUrl && (
              <div className="pt-1">
                <a 
                  href={work.openAccessUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Access Full Text / Open Access PDF
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. "Explore from this paper" Section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Explore from this paper
            </h2>
            <p className="text-xs text-slate-500">
              Select a direction to discover foundational works, subsequent citations, or related research.
            </p>
          </div>

          {activeDirection && (
            <button
              onClick={() => setActiveDirection(null)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
            >
              Reset exploration directions
            </button>
          )}
        </div>

        {/* Contextual Hint on First Paper Open */}
        {!dismissedPaperHint && (
          <div className="mb-3.5 bg-indigo-50/80 border border-indigo-100 rounded-xl p-3 flex items-start justify-between gap-3 text-xs text-indigo-950 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-indigo-900 font-medium">
                Choose one direction: what it cites, what cites it, or related papers.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDismissedPaperHint(true)}
              className="text-indigo-400 hover:text-indigo-700 p-0.5 rounded transition-colors"
              title="Dismiss hint"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 4. Three Large, Equal, Immediately Visible Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: What this paper cites */}
          <div 
            onClick={() => setActiveDirection('earlier')}
            className={`cursor-pointer rounded-xl border p-5 transition-all flex flex-col justify-between ${
              activeDirection === 'earlier'
                ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-500/20 shadow-sm'
                : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  Outgoing References
                </span>
                <Layers className="w-4 h-4 text-indigo-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                What this paper cites
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Direct outgoing references only
              </p>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Foundational theories, methods, and prior evidence cited in this work's bibliography.
              </p>
            </div>

            <button
              type="button"
              className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeDirection === 'earlier'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-800 hover:bg-indigo-600 hover:text-white'
              }`}
            >
              <span>Explore what this paper cites</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: What cites this paper */}
          <div 
            onClick={() => setActiveDirection('later')}
            className={`cursor-pointer rounded-xl border p-5 transition-all flex flex-col justify-between ${
              activeDirection === 'later'
                ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20 shadow-sm'
                : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  Incoming Citations
                </span>
                <Flame className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                What cites this paper
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Direct incoming citations only
              </p>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Subsequent studies, experimental applications, and newer extensions citing this work.
              </p>
            </div>

            <button
              type="button"
              className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeDirection === 'later'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-800 hover:bg-emerald-700 hover:text-white'
              }`}
            >
              <span>Explore what cites this paper</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Related papers */}
          <div 
            onClick={() => setActiveDirection('similar')}
            className={`cursor-pointer rounded-xl border p-5 transition-all flex flex-col justify-between ${
              activeDirection === 'similar'
                ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20 shadow-sm'
                : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  Topic & Graph Similarity
                </span>
                <Compass className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Related papers
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Semantic or graph-neighbour similarity; never direct citations
              </p>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Literature sharing topic embeddings and co-citation neighborhoods on OpenAlex.
              </p>
            </div>

            <button
              type="button"
              className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeDirection === 'similar'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-800 hover:bg-blue-600 hover:text-white'
              }`}
            >
              <span>Explore related papers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Exploration Candidate List View (when a direction is clicked) */}
      {activeDirection && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                Direction Active
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {getDirectionHeading()}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {getDirectionSubheading()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                {candidates.length} candidates found
              </span>
            </div>
          </div>

          {/* Contextual Hint on Candidate List */}
          {!dismissedCandidateHint && candidates.length > 0 && !isLoadingCandidates && (
            <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs text-indigo-950 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-indigo-900">Orientation Guide</span>
                  <span className="text-indigo-800">
                    Keep only the papers you may genuinely want to study. You can always explore further later.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDismissedCandidateHint(true)}
                className="text-indigo-400 hover:text-indigo-700 p-0.5 rounded transition-colors"
                title="Dismiss hint"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isLoadingCandidates ? (
            <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Searching OpenAlex and citation index for candidate papers...</span>
            </div>
          ) : candidateError ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              {candidateError}
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              No matching literature found in this direction. Try exploring one of the other two directions.
            </div>
          ) : (
            <div className="space-y-3">
              {candidates.slice(0, candidateLimit).map((candidate, idx) => {
                const cWork = candidate.work;
                const inProject = activeProjectWorksList.some(pw => pw.workId === cWork.id);
                const inQueue = studyQueue.some(item => item.workId === cWork.id);
                const isMenuOpen = openCandidateMenuId === cWork.id;

                return (
                  <div 
                    key={`${cWork.id}-${idx}`}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white transition-all space-y-2.5"
                  >
                    {/* Top Reason Line */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50/80 px-2.5 py-0.5 rounded-full border border-indigo-100">
                        {candidate.reason}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {cWork.year || 'N/A'}
                      </span>
                    </div>

                    {/* Paper Title & Authors */}
                    <div>
                      <h4 className="text-sm font-bold font-serif-scholarly text-slate-900 leading-snug">
                        {cWork.title}
                      </h4>
                      <div className="text-xs text-slate-500 mt-1">
                        {(cWork.authors || []).map(a => a?.name).filter(Boolean).join(', ') || 'Unknown Authors'}
                        {cWork.venue && <span className="italic"> • {cWork.venue}</span>}
                      </div>
                    </div>

                    {/* Abstract Preview */}
                    {cWork.abstract && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-serif-scholarly">
                        {cWork.abstract}
                      </p>
                    )}

                    {/* Visible 3 Actions + Small More Dropdown */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        {/* Action 1: Add to My Papers */}
                        {inProject ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold">
                            <Check className="w-3 h-3 text-emerald-600" />
                            In My Papers
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddToMyPapers(cWork)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors shadow-xs"
                          >
                            <Plus className="w-3 h-3" />
                            Add to My Papers
                          </button>
                        )}

                        {/* Action 2: Read Next */}
                        {inQueue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-xs font-semibold">
                            <Clock className="w-3 h-3 text-indigo-600" />
                            In Read Next
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddToReadNext(cWork, candidate.reason)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold transition-colors shadow-xs"
                          >
                            <Clock className="w-3 h-3 text-slate-500" />
                            Read Next
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 relative">
                        {/* Action 3: Explore from here */}
                        <button
                          onClick={() => openPaperInExplorer(cWork)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-xs font-semibold transition-colors shadow-xs"
                        >
                          <Compass className="w-3 h-3 text-indigo-600" />
                          <span>Explore from here</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        {/* Small More Dropdown */}
                        <button
                          onClick={() => setOpenCandidateMenuId(isMenuOpen ? null : cWork.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title="More options"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 text-xs animate-in fade-in">
                            <button
                              onClick={() => {
                                setDrawerWork(cWork);
                                setStatementsDrawerOpen(true);
                                setOpenCandidateMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Check Evidence
                            </button>
                            {cWork.doi && (
                              <a
                                href={`https://doi.org/${cWork.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                Open DOI link
                              </a>
                            )}
                            <button
                              onClick={() => {
                                setCandidates(prev => prev.filter(c => c.work.id !== cWork.id));
                                setOpenCandidateMenuId(null);
                                showToast('Candidate dismissed.');
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              Not relevant
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {candidates.length > candidateLimit && (
                <div className="pt-4 pb-2 text-center space-y-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Showing the most relevant starting set. Load more only if needed.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCandidateLimit(prev => prev + 12)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                  >
                    Show more candidates ({candidates.length - candidateLimit} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scite Evidence Drawer */}
      {drawerWork && (
        <SciteStatementsDrawer
          isOpen={statementsDrawerOpen}
          onClose={() => setStatementsDrawerOpen(false)}
          work={drawerWork}
        />
      )}
    </div>
  );
};
