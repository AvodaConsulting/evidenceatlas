import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Quote, 
  ExternalLink, 
  BrainCircuit, 
  ShieldCheck, 
  AlertCircle, 
  Save, 
  Check, 
  Copy,
  ChevronDown,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { sciteApi } from '../../lib/scholarlyApi';
import { SciteCitationStatement, SupportStrength } from '../../types';

interface ClaimChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClaim?: string;
  initialDoi?: string;
}

export const ClaimChallengeModal: React.FC<ClaimChallengeModalProps> = ({
  isOpen,
  onClose,
  initialClaim = '',
  initialDoi = ''
}) => {
  const { 
    activeProject, 
    evidenceRecords, 
    activeProjectWorksList, 
    createEvidenceRecord, 
    permissions 
  } = useApp();

  const [claimText, setClaimText] = useState(initialClaim);
  const [selectedDoi, setSelectedDoi] = useState(initialDoi);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [challengeResult, setChallengeResult] = useState<{
    claim: string;
    doi?: string;
    statements: SciteCitationStatement[];
    aiSynthesis: {
      text: string;
      label: string;
      generatedAt: string;
      model: string;
    };
    status: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [savedAsEvidence, setSavedAsEvidence] = useState(false);

  if (!isOpen) return null;

  const handleRunChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimText.trim()) return;

    try {
      setIsEvaluating(true);
      setError(null);
      setChallengeResult(null);
      setSavedAsEvidence(false);

      const result = await sciteApi.challengeClaim(
        claimText.trim(),
        selectedDoi.trim() || undefined,
        undefined,
        activeProject?.workspaceId
      );

      setChallengeResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate claim against Scite');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopySynthesis = () => {
    if (!challengeResult) return;
    const textToCopy = `CLAIM CHALLENGE EVALUATION:
"${challengeResult.claim}"

${challengeResult.aiSynthesis.text}

---
${challengeResult.aiSynthesis.label} (Model: ${challengeResult.aiSynthesis.model}, Generated: ${new Date(challengeResult.aiSynthesis.generatedAt).toLocaleString()})`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToEvidenceRegistry = async (statement: SciteCitationStatement) => {
    if (!activeProject) return;
    try {
      let strength: SupportStrength = 'moderate';
      if (statement.classification === 'supporting') strength = 'strong';
      if (statement.classification === 'contradicting') strength = 'contested';

      // Find or create associated workId
      const matchedWork = activeProjectWorksList.find(pw => pw.work.doi?.toLowerCase() === statement.targetDoi?.toLowerCase() || pw.work.doi?.toLowerCase() === statement.citingDoi?.toLowerCase());
      const workId = matchedWork ? matchedWork.workId : (activeProjectWorksList[0]?.workId || 'work_ref');

      await createEvidenceRecord({
        workId,
        claimStatement: claimText.trim(),
        supportStrength: strength,
        verbatimPassage: statement.snippet,
        pageOrSection: statement.section ? `Section: ${statement.section}` : 'Citation Context',
        warrantExplanation: `Grounding verified via Scite Smart Citation (${statement.classification} from "${statement.citingTitle}").`,
        verificationStatus: 'verified',
        subClaimCategory: 'Empirical Verification'
      });

      setSavedAsEvidence(true);
      setTimeout(() => setSavedAsEvidence(false), 3000);
    } catch (e: any) {
      setError(e.message || 'Failed to save evidence record');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif-scholarly text-stone-900">
                Challenge Claim with Scite & Grounded AI
              </h2>
              <p className="text-xs text-stone-500">
                Retrieve supporting and contrasting citation context, then generate grounded evidence synthesis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <form onSubmit={handleRunChallenge} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Academic Claim Statement *
                </label>
                {evidenceRecords.length > 0 && (
                  <select
                    onChange={e => {
                      if (e.target.value) setClaimText(e.target.value);
                    }}
                    className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5"
                  >
                    <option value="">Choose from existing project claims...</option>
                    {evidenceRecords.map(ev => (
                      <option key={ev.id} value={ev.claimStatement}>
                        {ev.claimStatement.substring(0, 60)}...
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <textarea
                required
                rows={3}
                value={claimText}
                onChange={e => setClaimText(e.target.value)}
                placeholder="e.g., Scaling autoregressive transformer models consistently improves empirical downstream generalization across low-resource tasks."
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 font-serif-scholarly focus:bg-white focus:ring-2 focus:ring-emerald-800 outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Target Work DOI (Optional)
                </label>
                <input
                  type="text"
                  value={selectedDoi}
                  onChange={e => setSelectedDoi(e.target.value)}
                  placeholder="e.g. 10.1038/s41586-020-2649-2"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 font-mono focus:bg-white focus:ring-2 focus:ring-emerald-800 outline-hidden"
                />
                <span className="text-[11px] text-stone-400 mt-0.5 block">
                  Leave empty to perform an evidence search across indexed citation statements.
                </span>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isEvaluating || !claimText.trim()}
                  className="w-full px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs disabled:opacity-60"
                >
                  {isEvaluating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Retrieving & Synthesizing Scite Evidence...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Challenge Claim & Run Synthesis</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Results Display */}
          {challengeResult && (
            <div className="space-y-6 pt-4 border-t border-stone-200">
              {/* Grounded AI Synthesis Card */}
              <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 shadow-md space-y-3 relative">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Grounded Evidence Synthesis
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopySynthesis}
                      className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-medium rounded-md flex items-center gap-1 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy Synthesis'}</span>
                    </button>
                  </div>
                </div>

                {/* Synthesis Body */}
                <div className="text-xs font-serif-scholarly leading-relaxed whitespace-pre-line text-stone-200">
                  {challengeResult.aiSynthesis.text}
                </div>

                {/* Synthesis Disclaimer & Provenance Label */}
                <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
                  <span className="font-sans font-medium text-emerald-400/90">
                    ★ {challengeResult.aiSynthesis.label}
                  </span>
                  <span className="font-mono text-[10px]">
                    Engine: {challengeResult.aiSynthesis.model}
                  </span>
                </div>
              </div>

              {/* Retrieved Scite Citation Statements Corpus */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 font-sans flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Verified Citation Statements Corpus ({challengeResult.statements.length})</span>
                  </h4>
                  <span className="text-[11px] text-stone-500">
                    Direct Scite Smart Citations links & snippets
                  </span>
                </div>

                {challengeResult.statements.length === 0 ? (
                  <div className="p-6 bg-stone-50 rounded-xl border border-stone-200 text-center text-xs text-stone-500">
                    No citation statements returned for this query.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {challengeResult.statements.map((st, idx) => {
                      let tagStyle = 'bg-stone-100 text-stone-800 border-stone-200';
                      let dotColor = 'bg-stone-500';
                      if (st.classification === 'supporting') {
                        tagStyle = 'bg-emerald-50 text-emerald-900 border-emerald-200';
                        dotColor = 'bg-emerald-600';
                      } else if (st.classification === 'contradicting') {
                        tagStyle = 'bg-amber-50 text-amber-900 border-amber-200';
                        dotColor = 'bg-amber-600';
                      }

                      return (
                        <div
                          key={st.id || idx}
                          className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs space-y-2 hover:border-stone-300 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${tagStyle}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                              <span>{(st.classification || 'unclassified').toUpperCase()}</span>
                            </span>

                            <div className="flex items-center gap-2">
                              {permissions.canCreateEvidence && (
                                <button
                                  onClick={() => handleSaveToEvidenceRegistry(st)}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                                  title="Add statement to project evidence registry"
                                >
                                  <Save className="w-3 h-3 text-emerald-700" />
                                  <span>Record Evidence</span>
                                </button>
                              )}

                              {st.citingDoi && (
                                <a
                                  href={`https://doi.org/${encodeURIComponent(st.citingDoi)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                                >
                                  <span>DOI</span>
                                  <ExternalLink className="w-3 h-3 text-stone-500" />
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="bg-stone-50 rounded-lg p-3 border border-stone-200/80">
                            <p className="text-xs text-stone-900 font-serif-scholarly italic leading-relaxed">
                              "{st.snippet}"
                            </p>
                          </div>

                          <div className="text-[11px] text-stone-600">
                            <span className="font-semibold text-stone-900">{st.citingTitle}</span>
                            <span className="text-stone-500 block">
                              {st.citingAuthors?.join(', ')} ({st.citingYear || 'n.d.'})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs">
          <span className="text-stone-500">
            {savedAsEvidence ? 'Evidence statement saved to project registry.' : 'Evidence grounded with real Scite citation statements.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
