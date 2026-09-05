import React, { useState } from 'react';
import { 
  BookOpen, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  GitBranch, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle, 
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Plus
} from 'lucide-react';
import { DiscoveryCandidate, Work, CandidateDecision, CandidateRole } from '../../types';
import { useApp } from '../../context/AppContext';
import { SciteTalliesBadge } from '../evidence/SciteTalliesBadge';
import { ReadingPromptModal } from '../discovery/ReadingPromptModal';

interface CandidateCardProps {
  candidate: DiscoveryCandidate;
  trailId: string;
  onSelectCandidate?: (candidate: DiscoveryCandidate) => void;
  onBranchFromCandidate?: (work: Work) => void;
  isSelected?: boolean;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  trailId,
  onSelectCandidate,
  onBranchFromCandidate,
  isSelected = false
}) => {
  const { 
    updateCandidateDecision, 
    addToStudyQueue,
    addToDiscoveryTray,
    projectCandidateStates,
    permissions,
    sciteVerifications,
    isVerifyingWork,
    verifyWorkWithScite,
    activeTrailData
  } = useApp();

  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [relevanceNote, setRelevanceNote] = useState(candidate.relevanceNotes || '');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  const { work, reasons, decision } = candidate;

  const candidateState = projectCandidateStates.find(pcs => pcs.workId === work.id);
  const isInTray = candidateState?.inDiscoveryTray;

  const handleDecision = async (newDecision: CandidateDecision) => {
    if (!permissions.canManageCitationTrails) return;
    try {
      await updateCandidateDecision(trailId, candidate.id, newDecision, relevanceNote);
    } catch (err) {
      console.error('Failed to update candidate decision', err);
    }
  };

  const handleSaveNote = async () => {
    setIsSavingNote(true);
    try {
      await updateCandidateDecision(trailId, candidate.id, decision, relevanceNote);
      setIsNotesOpen(false);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleAddToTray = async () => {
    await addToDiscoveryTray(work, trailId, activeTrailData?.trail.title, reasons);
  };

  const sciteResult = sciteVerifications[work.id];
  const isVerifying = isVerifyingWork[work.id];
  const candidateRole = reasons?.[0]?.role as CandidateRole | undefined;

  return (
    <div 
      className={`bg-white border rounded-xl p-4 transition-all duration-150 ${
        isSelected 
          ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-sm' 
          : decision === 'included'
            ? 'border-emerald-200 bg-emerald-50/20 shadow-2xs'
            : decision === 'queued'
              ? 'border-amber-200 bg-amber-50/20 shadow-2xs'
              : decision === 'rejected'
                ? 'border-slate-200 opacity-60 bg-slate-50/50'
                : 'border-slate-200 hover:border-slate-300 shadow-2xs'
      }`}
    >
      <div className="flex flex-col md:flex-row items-start justify-between gap-3">
        {/* Left main info */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header row: Year, Venue, Open Access */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded border border-slate-200">
              {work.year || 'Unknown Year'}
            </span>
            {work.venue && (
              <span className="text-slate-600 font-medium truncate max-w-xs" title={work.venue}>
                {work.venue}
              </span>
            )}
            {work.openAccess && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                Open Access
              </span>
            )}
            <span className="text-[11px] text-slate-500 ml-auto">
              {work.citationCount.toLocaleString()} indexed citations
            </span>
          </div>

          {/* Title */}
          <h3 
            className="text-sm font-bold font-serif-scholarly text-slate-900 leading-snug cursor-pointer hover:text-indigo-700 transition-colors"
            onClick={() => onSelectCandidate?.(candidate)}
          >
            {work.title}
          </h3>

          {/* Authors */}
          <p className="text-xs text-slate-600 font-serif-scholarly italic">
            {work.authors.map(a => a.name).join(', ') || 'Unknown Authors'}
          </p>

          {/* WHY IT APPEARED: Transparent Epistemic Explanation */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-2 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Why it appeared in this trail</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {reasons.map((r, idx) => (
                <span 
                  key={idx}
                  className={`text-xs px-2 py-0.5 rounded border inline-flex items-center gap-1 font-medium ${
                    r.category === 'direct_reference' 
                      ? 'bg-blue-50 text-blue-900 border-blue-200'
                      : r.category === 'direct_citation'
                        ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                        : r.category === 'shared_references'
                          ? 'bg-purple-50 text-purple-900 border-purple-200'
                          : r.category === 'common_author'
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : r.category === 'bridge_paper'
                              ? 'bg-teal-50 text-teal-900 border-teal-200'
                              : r.category === 'counterevidence'
                                ? 'bg-rose-50 text-rose-900 border-rose-200'
                                : 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <span>{r.description}</span>
                  {r.count !== undefined && r.count > 0 && (
                    <span className="font-bold opacity-80">({r.count})</span>
                  )}
                </span>
              ))}
            </div>

            {/* Bridge Path Detail (Local Graph Bridge) */}
            {candidate.bridgePathDetail && (
              <div className="mt-1.5 p-2 bg-teal-50/70 border border-teal-200 rounded-md text-[11px] text-teal-900 space-y-1">
                <div className="flex items-center justify-between font-bold text-teal-950">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-teal-700" />
                    <span>Local Graph Bridge Metric: {candidate.bridgePathDetail.bridgingScore.toFixed(3)}</span>
                  </span>
                  <span className="text-[10px] bg-teal-200/60 px-1.5 py-0.2 rounded font-mono">
                    {candidate.bridgePathDetail.pathType}
                  </span>
                </div>
                <p className="font-serif-scholarly leading-snug">{candidate.bridgePathDetail.explanation}</p>
                <p className="text-[10px] text-teal-700 italic">
                  * {candidate.bridgePathDetail.limitationDisclaimer}
                </p>
              </div>
            )}

            {/* Counterevidence Detail (Alternative Perspective) */}
            {candidate.counterevidenceDetail && (
              <div className="mt-1.5 p-2.5 bg-rose-50 border border-rose-200 rounded-md text-[11px] text-rose-950 space-y-1">
                <div className="flex items-center justify-between font-bold text-rose-900">
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Possible Alternative Perspective: {(candidate.counterevidenceDetail.perspectiveCategory || 'contrasting evidence').replace('_', ' ').toUpperCase()}</span>
                  </span>
                  {candidate.counterevidenceDetail.confidenceScore && (
                    <span className="text-[10px] bg-rose-100 px-1.5 py-0.2 rounded font-mono text-rose-800">
                      Heuristic Score: {candidate.counterevidenceDetail.confidenceScore.toFixed(2)}
                    </span>
                  )}
                </div>
                {candidate.counterevidenceDetail.disputedClaimStatement && (
                  <p className="text-[11px] font-medium text-rose-900">
                    <strong>Contrasting against claim:</strong> "{candidate.counterevidenceDetail.disputedClaimStatement}"
                  </p>
                )}
                {candidate.counterevidenceDetail.snippetContext && (
                  <div className="p-1.5 bg-white/80 border border-rose-200 rounded font-serif-scholarly text-[11px] text-slate-800 italic">
                    "{candidate.counterevidenceDetail.snippetContext}"
                  </div>
                )}
                <p className="text-[10px] text-rose-700 italic">
                  * {candidate.counterevidenceDetail.reviewNote}
                </p>
              </div>
            )}
          </div>

          {/* Abstract snippet */}
          {work.abstract && (
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-serif-scholarly">
              {work.abstract}
            </p>
          )}

          {/* DOI & External Links & Scite Check on Demand */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
            {work.doi && (
              <a 
                href={`https://doi.org/${work.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 font-mono inline-flex items-center gap-1 hover:underline"
              >
                doi:{work.doi}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {work.openAlexId && (
              <span className="font-mono text-[11px] text-slate-400">
                OpenAlex: {work.openAlexId.split('/').pop()}
              </span>
            )}

            {/* Scite Smart Citations (On demand check) */}
            {sciteResult ? (
              <SciteTalliesBadge tallies={sciteResult.tallies} />
            ) : work.doi ? (
              <button
                onClick={() => verifyWorkWithScite(work.id, work.doi)}
                disabled={isVerifying}
                className="text-[11px] text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1 font-medium transition-colors"
                title="Fetch Smart Citation tallies on demand from Scite"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                {isVerifying ? 'Verifying...' : 'Check Scite Tallies'}
              </button>
            ) : null}
          </div>
        </div>

        {/* Right side: Decision Controls */}
        <div className="w-full md:w-56 shrink-0 flex flex-col gap-2 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Researcher Decision
          </div>

          {/* Decision Buttons Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleDecision('included')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                decision === 'included'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
              title="Include paper directly into Project Library"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Include</span>
            </button>

            <button
              onClick={() => handleDecision('queued')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                decision === 'queued'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
              title="Add to Study Queue for in-depth analytical reading"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Queue</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleDecision('rejected')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                decision === 'rejected'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
              title="Exclude candidate from this trail"
            >
              <XCircle className="w-3 h-3" />
              <span>Exclude</span>
            </button>

            {onBranchFromCandidate && (
              <button
                onClick={() => onBranchFromCandidate(work)}
                className="px-2 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex items-center justify-center gap-1 transition-all"
                title="Start a new focused trail branched from this paper"
              >
                <GitBranch className="w-3 h-3" />
                <span>Branch</span>
              </button>
            )}
          </div>

          {/* Tray & AI Protocol Action Row */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              onClick={handleAddToTray}
              className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                isInTray
                  ? 'bg-sky-100 text-sky-900 border border-sky-300 font-semibold'
                  : 'bg-slate-50 text-slate-700 hover:bg-sky-50 hover:text-sky-800 border border-slate-200'
              }`}
              title={isInTray ? 'Held in Discovery Tray' : 'Hold candidate in Discovery Tray'}
            >
              <Layers className="w-3 h-3 text-sky-600" />
              <span>{isInTray ? 'In Tray' : '+ Tray'}</span>
            </button>

            <button
              onClick={() => setIsPromptModalOpen(true)}
              className="px-2 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex items-center justify-center gap-1 transition-all"
              title="Generate grounded reading protocol"
            >
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Protocol</span>
            </button>
          </div>

          {/* Notes Toggle */}
          <div className="pt-1">
            <button
              onClick={() => setIsNotesOpen(!isNotesOpen)}
              className="w-full text-left text-[11px] text-slate-500 hover:text-slate-800 flex items-center justify-between font-medium py-0.5"
            >
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {candidate.relevanceNotes ? 'Edit Notes' : 'Add Decision Note'}
              </span>
              {isNotesOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {isNotesOpen && (
              <div className="mt-1.5 space-y-1.5 animate-in fade-in">
                <textarea
                  value={relevanceNote}
                  onChange={(e) => setRelevanceNote(e.target.value)}
                  placeholder="Why is this work relevant or excluded? e.g., 'Provides verification proof for Theorem 2'..."
                  rows={2}
                  className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500 font-serif-scholarly"
                />
                <button
                  onClick={handleSaveNote}
                  disabled={isSavingNote}
                  className="w-full px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-[11px] font-semibold transition-colors"
                >
                  {isSavingNote ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            )}

            {!isNotesOpen && candidate.relevanceNotes && (
              <p className="text-[11px] text-slate-600 italic mt-1 bg-amber-50/60 p-1.5 rounded border border-amber-100">
                "{candidate.relevanceNotes}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Grounded Reading Protocol Modal */}
      {isPromptModalOpen && (
        <ReadingPromptModal
          isOpen={isPromptModalOpen}
          onClose={() => setIsPromptModalOpen(false)}
          work={work}
          candidateRole={candidateRole}
          notes={candidate.relevanceNotes}
        />
      )}
    </div>
  );
};
