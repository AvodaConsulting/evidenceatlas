import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  BookOpen, 
  ShieldAlert, 
  ExternalLink, 
  CheckCircle2, 
  HelpCircle, 
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { Work, CandidateRole, ReadingPromptResponse } from '../../types';
import { useApp } from '../../context/AppContext';

interface ReadingPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  work: Work;
  candidateRole?: CandidateRole;
  notes?: string;
  onStartReading?: () => void;
  onExtractEvidence?: (workId: string) => void;
}

export const ReadingPromptModal: React.FC<ReadingPromptModalProps> = ({
  isOpen,
  onClose,
  work,
  candidateRole,
  notes,
  onStartReading,
  onExtractEvidence
}) => {
  const { generateReadingPrompt, setCandidateState } = useApp();
  const [loading, setLoading] = useState<boolean>(true);
  const [promptData, setPromptData] = useState<ReadingPromptResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'prompt' | 'questions' | 'provenance'>('prompt');

  useEffect(() => {
    if (!isOpen || !work) return;
    let isCurrent = true;
    setLoading(true);

    generateReadingPrompt(work, candidateRole, notes)
      .then(res => {
        if (isCurrent) {
          setPromptData(res);
          setLoading(false);
        }
      })
      .catch(err => {
        console.warn('Error generating prompt:', err);
        if (isCurrent) {
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [isOpen, work.id, candidateRole, notes]);

  if (!isOpen) return null;

  const handleCopyPrompt = () => {
    if (!promptData) return;
    const criticalQText = (promptData.criticalQuestions || []).map((q, i) => `${i + 1}. ${q}`).join('\n');
    const focusSecText = (promptData.suggestedFocusSections || []).map(s => `- ${s}`).join('\n');
    const textToCopy = `### Targeted Reading Protocol: ${work.title}
**Assigned Candidate Role**: ${(promptData.assignedRole || 'context').replace(/_/g, ' ')}
**Objective**: ${promptData.readingObjective || 'Literature analysis and critical appraisal'}

#### Critical Interrogation Questions:
${criticalQText}

#### Focus Sections:
${focusSecText}

#### Full Prompt for Research Note-taking:
${promptData.prompt || ''}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkAsReading = async () => {
    await setCandidateState(work.id, 'reading', {
      notes: notes || 'Started targeted reading via Reading Protocol'
    });
    if (onStartReading) onStartReading();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif-scholarly text-slate-900">
                AI-Grounded Reading Protocol
              </h2>
              <p className="text-xs text-slate-500 font-serif-scholarly">
                Synthesizes project context into a verified, bias-free reading guide.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guardrail Notice */}
        <div className="px-6 py-2 bg-amber-50/80 border-b border-amber-200/60 flex items-start gap-2 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-tight">
            <strong>Scholarly Guardrail:</strong> This protocol never invents claims or asserts findings as factual truth. Verify all inferences with the primary source or Scite citations before synthesizing.
          </p>
        </div>

        {/* Paper Mini Banner */}
        <div className="px-6 py-3 bg-slate-100/60 border-b border-slate-200 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono font-bold px-1.5 py-0.2 bg-white rounded border border-slate-200 text-slate-800">
              {work.year || 'N/A'}
            </span>
            <span className="truncate">{work.venue || 'Scholarly Publication'}</span>
            {candidateRole && (
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded">
                Role: {(candidateRole || 'context').replace(/_/g, ' ')}
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold font-serif-scholarly text-slate-900 line-clamp-1">
            {work.title}
          </h3>
          <p className="text-xs text-slate-600 italic truncate font-serif-scholarly">
            {(work.authors || []).map(a => a?.name || '').join(', ') || 'Unknown Authors'}
          </p>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-slate-200 flex gap-4 text-xs font-semibold">
          <button 
            onClick={() => setActiveTab('prompt')}
            className={`py-2.5 border-b-2 transition-colors ${
              activeTab === 'prompt' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Reading Objectives & Prompt
          </button>
          <button 
            onClick={() => setActiveTab('questions')}
            className={`py-2.5 border-b-2 transition-colors ${
              activeTab === 'questions' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Interrogation Questions ({(promptData?.criticalQuestions || []).length})
          </button>
          <button 
            onClick={() => setActiveTab('provenance')}
            className={`py-2.5 border-b-2 transition-colors ${
              activeTab === 'provenance' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Grounded Citational Context
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-slate-700">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="font-serif-scholarly italic">Formulating grounded reading protocol from project synthesis...</p>
            </div>
          ) : !promptData ? (
            <div className="py-8 text-center text-slate-500">
              <p>Unable to generate prompt. Please try again later.</p>
            </div>
          ) : (
            <>
              {activeTab === 'prompt' && (
                <div className="space-y-4">
                  {/* Objective Card */}
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 block">
                      Targeted Reading Objective
                    </span>
                    <p className="text-slate-800 font-serif-scholarly leading-relaxed text-xs">
                      {promptData.readingObjective}
                    </p>
                  </div>

                  {/* Focus Sections */}
                  {promptData.suggestedFocusSections && promptData.suggestedFocusSections.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Recommended Priority Sections
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(promptData.suggestedFocusSections || []).map((sec, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-xs font-medium">
                            {sec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Generated Guide / Prompt */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Synthesized Reading Guide & AI Prompt
                      </span>
                      <button
                        onClick={handleCopyPrompt}
                        className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied to Clipboard' : 'Copy Guide Text'}
                      </button>
                    </div>
                    <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed whitespace-pre-wrap border border-slate-800 max-h-56 overflow-y-auto">
                      {promptData.prompt}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'questions' && (
                <div className="space-y-3">
                  <p className="text-slate-600 text-xs">
                    Evaluate these specific methodological and conceptual points as you read the paper:
                  </p>
                  <div className="space-y-2">
                    {(promptData.criticalQuestions || []).map((q, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-slate-800 font-serif-scholarly leading-relaxed">
                          {q}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'provenance' && (
                <div className="space-y-3">
                  <p className="text-slate-600 text-xs">
                    This reading protocol was generated deterministically using metadata from:
                  </p>
                  <div className="space-y-2">
                    {promptData.groundedSeedWorks && promptData.groundedSeedWorks.length > 0 ? (
                      (promptData.groundedSeedWorks || []).map((sw, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                          <span className="font-serif-scholarly font-medium text-slate-800 truncate mr-2">
                            {sw.title} ({sw.year || 'N/A'})
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            Seed Anchor
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-slate-50 text-slate-500 rounded-lg italic">
                        No explicit seed works linked. Generated from general project questions.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {onExtractEvidence && (
              <button
                onClick={() => {
                  onClose();
                  onExtractEvidence(work.id);
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Extract Evidence</span>
              </button>
            )}

            <button
              onClick={handleMarkAsReading}
              className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Mark as "Reading" & Close</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
