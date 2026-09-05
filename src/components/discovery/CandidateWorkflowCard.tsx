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
  Tag,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Share2,
  Trash2,
  ListFilter,
  Check,
  AlertTriangle
} from 'lucide-react';
import { 
  ProjectCandidateState, 
  CandidateWorkState, 
  CandidateRole, 
  CandidateFeedbackType,
  Work 
} from '../../types';
import { useApp } from '../../context/AppContext';
import { SciteTalliesBadge } from '../evidence/SciteTalliesBadge';
import { ReadingPromptModal } from './ReadingPromptModal';

interface CandidateWorkflowCardProps {
  candidateState: ProjectCandidateState;
  isSelected?: boolean;
  onToggleSelect?: (workId: string) => void;
  onOpenWorkDetail?: (work: Work) => void;
  onOpenEvidenceModal?: (workId: string) => void;
}

const STATE_CONFIG: Record<CandidateWorkState, { label: string; color: string; border: string; bg: string }> = {
  discovered: { label: 'Discovered', color: 'text-slate-700', border: 'border-slate-300', bg: 'bg-slate-100' },
  saved_for_later: { label: 'Saved for Later', color: 'text-sky-800', border: 'border-sky-300', bg: 'bg-sky-50' },
  study_next: { label: 'Study Next', color: 'text-amber-800', border: 'border-amber-300', bg: 'bg-amber-50' },
  reading: { label: 'Currently Reading', color: 'text-purple-800', border: 'border-purple-300', bg: 'bg-purple-50' },
  read: { label: 'Read & Evaluated', color: 'text-teal-800', border: 'border-teal-300', bg: 'bg-teal-50' },
  included_in_library: { label: 'In Project Library', color: 'text-emerald-800', border: 'border-emerald-300', bg: 'bg-emerald-50' },
  not_relevant: { label: 'Not Relevant', color: 'text-rose-800', border: 'border-rose-300', bg: 'bg-rose-50' },
  excluded_with_reason: { label: 'Excluded with Reason', color: 'text-slate-600', border: 'border-slate-300', bg: 'bg-slate-50' }
};

const ROLE_CONFIG: Record<CandidateRole, { label: string; bg: string; text: string }> = {
  foundational_premise: { label: 'Foundational Premise', bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-900' },
  methodological_ancestor: { label: 'Methodological Ancestor', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-900' },
  empirical_validation: { label: 'Empirical Validation', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-900' },
  competing_claim: { label: 'Competing Claim', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-900' },
  contrast_case: { label: 'Contrast Case', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-900' },
  reproducibility_benchmark: { label: 'Benchmark Standard', bg: 'bg-cyan-50 border-cyan-200', text: 'text-cyan-900' },
  application_domain: { label: 'Application Domain', bg: 'bg-violet-50 border-violet-200', text: 'text-violet-900' },
  'Foundational Work': { label: 'Foundational Work', bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-900' },
  'Later Development': { label: 'Later Development', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-900' },
  'Conceptually Similar Work': { label: 'Conceptually Similar', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-900' },
  'Possible Bridge Work': { label: 'Possible Bridge Work', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-900' },
  'Methodological Alternative': { label: 'Methodological Alternative', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-900' },
  'Possible Counterargument': { label: 'Possible Counterargument', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-900' },
  'Under-read but Relevant Work': { label: 'Under-read Relevant', bg: 'bg-teal-50 border-teal-200', text: 'text-teal-900' }
};

export const CandidateWorkflowCard: React.FC<CandidateWorkflowCardProps> = ({
  candidateState,
  isSelected = false,
  onToggleSelect,
  onOpenWorkDetail,
  onOpenEvidenceModal
}) => {
  const { 
    setCandidateState, 
    removeFromDiscoveryTray,
    submitCandidateFeedback,
    sciteVerifications,
    isVerifyingWork,
    verifyWorkWithScite
  } = useApp();

  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [notesInput, setNotesInput] = useState(candidateState.notes || '');
  const [exclusionReasonInput, setExclusionReasonInput] = useState(candidateState.exclusionReason || '');
  const [isExclusionModalOpen, setIsExclusionModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const { work, state, reasons, sourceTrailTitles, feedbackHistory } = candidateState;
  const stateStyle = STATE_CONFIG[state] || STATE_CONFIG.discovered;
  const role = candidateState.reasons?.[0]?.role as CandidateRole | undefined;
  const roleStyle = role ? ROLE_CONFIG[role] : null;

  const sciteResult = sciteVerifications[work.id];
  const isVerifying = isVerifyingWork[work.id];

  const handleStateChange = async (newState: CandidateWorkState) => {
    if (newState === 'excluded_with_reason') {
      setIsExclusionModalOpen(true);
      return;
    }
    await setCandidateState(work.id, newState, { notes: notesInput });
  };

  const handleConfirmExclusion = async () => {
    await setCandidateState(work.id, 'excluded_with_reason', {
      exclusionReason: exclusionReasonInput || 'Marked as outside review scope',
      notes: notesInput
    });
    setIsExclusionModalOpen(false);
  };

  const handleSaveNotes = async () => {
    await setCandidateState(work.id, state, { notes: notesInput });
    setIsNotesOpen(false);
  };

  const handleFeedback = async (type: CandidateFeedbackType) => {
    await submitCandidateFeedback(work.id, type);
    setIsFeedbackOpen(false);
  };

  return (
    <div 
      className={`bg-white border rounded-xl p-4 transition-all duration-150 ${
        isSelected 
          ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-sm' 
          : state === 'study_next'
            ? 'border-amber-300 bg-amber-50/15 shadow-2xs'
            : state === 'reading'
              ? 'border-purple-300 bg-purple-50/15 shadow-2xs'
              : state === 'included_in_library'
                ? 'border-emerald-300 bg-emerald-50/15 shadow-2xs'
                : state === 'not_relevant' || state === 'excluded_with_reason'
                  ? 'border-slate-200 opacity-60 bg-slate-50/50'
                  : 'border-slate-200 hover:border-slate-300 shadow-2xs'
      }`}
    >
      <div className="flex flex-col md:flex-row items-start justify-between gap-3">
        
        {/* Left: Checkbox & Info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(work.id)}
              className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
          )}

          <div className="flex-1 min-w-0 space-y-2">
            
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded border border-slate-200">
                {work.year || 'Unknown Year'}
              </span>
              
              {roleStyle && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${roleStyle.bg} ${roleStyle.text}`}>
                  {roleStyle.label}
                </span>
              )}

              {/* Decision State Badge */}
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${stateStyle.bg} ${stateStyle.border} ${stateStyle.color}`}>
                {stateStyle.label}
              </span>

              {work.openAccess && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                  Open Access
                </span>
              )}

              {sourceTrailTitles && sourceTrailTitles.length > 0 && (
                <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200 flex items-center gap-1">
                  <GitBranch className="w-3 h-3 text-slate-400" />
                  <span className="truncate max-w-[130px]">{sourceTrailTitles[0]}</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h3 
              className="text-sm font-bold font-serif-scholarly text-slate-900 leading-snug cursor-pointer hover:text-indigo-700 transition-colors"
              onClick={() => onOpenWorkDetail?.(work)}
            >
              {work.title}
            </h3>

            {/* Authors & Venue */}
            <p className="text-xs text-slate-600 font-serif-scholarly italic">
              {(work.authors || []).map(a => a?.name || '').join(', ') || 'Unknown Authors'}
              {work.venue && <span className="text-slate-400 font-sans not-italic"> • {work.venue}</span>}
            </p>

            {/* Why it was discovered / Selection Reasons */}
            {reasons && reasons.length > 0 && (
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-2 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span>Discovery Rationale</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(reasons || []).map((r, idx) => (
                    <span 
                      key={idx}
                      className="text-xs px-2 py-0.5 rounded border bg-blue-50/60 text-blue-900 border-blue-200 font-medium inline-flex items-center gap-1"
                    >
                      <span>{r.description}</span>
                      {r.count !== undefined && r.count > 0 && (
                        <span className="font-bold opacity-80">({r.count})</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Abstract */}
            {work.abstract && (
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-serif-scholarly">
                {work.abstract}
              </p>
            )}

            {/* Exclusion Reason notice if excluded */}
            {candidateState.exclusionReason && (
              <div className="p-2 bg-rose-50/70 border border-rose-200 rounded-lg flex items-start gap-1.5 text-xs text-rose-900 font-serif-scholarly">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span><strong>Exclusion Reason:</strong> {candidateState.exclusionReason}</span>
              </div>
            )}

            {/* DOI & Links & Scite Badge */}
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

              <span className="text-[11px] text-slate-400">
                {work.citationCount.toLocaleString()} citations
              </span>

              {/* Scite Smart Citations */}
              {sciteResult ? (
                <SciteTalliesBadge tallies={sciteResult.tallies} />
              ) : work.doi ? (
                <button
                  onClick={() => verifyWorkWithScite(work.id, work.doi)}
                  disabled={isVerifying}
                  className="text-[11px] text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1 font-medium transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  {isVerifying ? 'Checking Scite...' : 'Check Scite'}
                </button>
              ) : null}
            </div>

          </div>
        </div>

        {/* Right side: Interactive Workflow Actions & Transitions */}
        <div className="w-full md:w-56 shrink-0 flex flex-col gap-2 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-3">
          
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Workflow Transition
          </div>

          {/* Workflow State Dropdown */}
          <select
            value={state}
            onChange={(e) => handleStateChange(e.target.value as CandidateWorkState)}
            className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
          >
            <option value="discovered">1. Discovered (Tray)</option>
            <option value="saved_for_later">2. Saved for Later</option>
            <option value="study_next">3. Move to Study Next</option>
            <option value="reading">4. Currently Reading</option>
            <option value="read">5. Read & Evaluated</option>
            <option value="included_in_library">6. Promote to Library</option>
            <option value="not_relevant">7. Not Relevant</option>
            <option value="excluded_with_reason">8. Exclude with Reason...</option>
          </select>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setIsPromptModalOpen(true)}
              className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex items-center justify-center gap-1 transition-colors"
              title="Generate structured, bias-free reading protocol"
            >
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>AI Protocol</span>
            </button>

            <button
              onClick={() => handleStateChange('study_next')}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                state === 'study_next' 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
              title="Add paper to Study Next priority shortlist"
            >
              <Clock className="w-3 h-3" />
              <span>Study Next</span>
            </button>
          </div>

          {/* Secondary Actions Row */}
          <div className="flex items-center justify-between gap-1 pt-1">
            <button
              onClick={() => setIsNotesOpen(!isNotesOpen)}
              className="text-[11px] text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              <span>{candidateState.notes ? 'Edit Notes' : 'Notes'}</span>
            </button>

            <button
              onClick={() => setIsFeedbackOpen(!isFeedbackOpen)}
              className="text-[11px] text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-1"
              title="Adjust recommendation feedback"
            >
              <ThumbsUp className="w-3 h-3" />
              <span>Feedback</span>
            </button>

            <button
              onClick={() => removeFromDiscoveryTray(work.id)}
              className="text-[11px] text-slate-400 hover:text-rose-600 font-medium flex items-center gap-1"
              title="Remove from tray"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          {/* Feedback Popup Panel */}
          {isFeedbackOpen && (
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-[11px] animate-in fade-in">
              <span className="font-bold text-slate-600 block">Teach Recommendation Engine:</span>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => handleFeedback('exceptional_match')}
                  className="px-1.5 py-1 text-left bg-white hover:bg-emerald-50 text-emerald-800 rounded border border-slate-200"
                >
                  ⭐ Great Match
                </button>
                <button
                  onClick={() => handleFeedback('crucial_premise')}
                  className="px-1.5 py-1 text-left bg-white hover:bg-indigo-50 text-indigo-800 rounded border border-slate-200"
                >
                  🔑 Crucial Premise
                </button>
                <button
                  onClick={() => handleFeedback('graph_too_broad')}
                  className="px-1.5 py-1 text-left bg-white hover:bg-amber-50 text-amber-800 rounded border border-slate-200"
                >
                  ⚠️ Too Broad
                </button>
                <button
                  onClick={() => handleFeedback('not_relevant_method')}
                  className="px-1.5 py-1 text-left bg-white hover:bg-rose-50 text-rose-800 rounded border border-slate-200"
                >
                  ❌ Wrong Method
                </button>
              </div>
            </div>
          )}

          {/* Notes Accordion */}
          {isNotesOpen && (
            <div className="mt-1 space-y-1.5 animate-in fade-in">
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Reading notes or rationale..."
                rows={2}
                className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:outline-indigo-500 font-serif-scholarly"
              />
              <button
                onClick={handleSaveNotes}
                className="w-full px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-[11px] font-semibold transition-colors"
              >
                Save Notes
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Reading Protocol Modal */}
      {isPromptModalOpen && (
        <ReadingPromptModal
          isOpen={isPromptModalOpen}
          onClose={() => setIsPromptModalOpen(false)}
          work={work}
          candidateRole={role}
          notes={candidateState.notes}
          onExtractEvidence={onOpenEvidenceModal}
        />
      )}

      {/* Exclusion Reason Modal */}
      {isExclusionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-3">
            <h3 className="text-sm font-bold font-serif-scholarly text-slate-900">
              Exclude Paper with Stated Reason
            </h3>
            <p className="text-xs text-slate-500 font-serif-scholarly">
              Maintaining an explicit exclusion reason prevents research bias and generates transparent audit trails.
            </p>
            <textarea
              value={exclusionReasonInput}
              onChange={(e) => setExclusionReasonInput(e.target.value)}
              placeholder="e.g., Excluded because sample is non-human, or published outside target time window..."
              rows={3}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-indigo-500 font-serif-scholarly"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsExclusionModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExclusion}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 rounded-lg"
              >
                Confirm Exclusion
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
