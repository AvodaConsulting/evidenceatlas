import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  Trash2, 
  Compass, 
  Plus, 
  Check, 
  Sparkles, 
  FileText, 
  MessageSquare, 
  ArrowRight, 
  Filter, 
  Layers, 
  Info,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Work, StudyQueueItem, CandidateRole } from '../../types';
import { SciteStatementsDrawer } from '../evidence/SciteStatementsDrawer';
import { ReadingPromptModal } from './ReadingPromptModal';

export const StudyNextTab: React.FC = () => {
  const { 
    studyQueue, 
    removeFromStudyQueue, 
    updateStudyQueueItem,
    studyNextShortlist, 
    fetchStudyNextRecommendations, 
    isStudyNextLoading,
    works, 
    activeProjectWorksList, 
    addWorkToProject, 
    removeWorkFromProject,
    openPaperInExplorer,
    showToast,
    activeProject
  } = useApp();

  const [selectedPromptWork, setSelectedPromptWork] = useState<{ work: Work; role?: CandidateRole } | null>(null);
  const [drawerWork, setDrawerWork] = useState<Work | null>(null);
  const [statementsDrawerOpen, setStatementsDrawerOpen] = useState(false);

  // Load recommendations if empty
  useEffect(() => {
    if (!studyNextShortlist && activeProject) {
      fetchStudyNextRecommendations();
    }
  }, [activeProject?.id]);

  // Handle Add to My Papers
  const handleAddToMyPapers = async (targetWork: Work) => {
    try {
      await addWorkToProject(targetWork, { inclusionStatus: 'included' });
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
    } catch (err: any) {
      console.error('Error adding to My Papers:', err);
    }
  };

  // Convert raw recommendation explanation into calm plain language
  const getPlainReason = (item: { whyRecommended?: string; epistemicRole?: string; reason?: string }): string => {
    if (item.reason && item.reason.length > 5) return item.reason;
    if (item.whyRecommended && item.whyRecommended.length > 5) return item.whyRecommended;
    if (item.epistemicRole) {
      switch (item.epistemicRole) {
        case 'foundational_premise':
        case 'Foundational Work':
          return 'A foundational paper cited by multiple papers in your project.';
        case 'methodological_ancestor':
        case 'Methodological Alternative':
          return 'Introduces the core methodology and study design.';
        case 'empirical_validation':
        case 'Later Development':
          return 'Provides empirical validation and recent follow-up findings.';
        case 'competing_claim':
        case 'Possible Counterargument':
          return 'Offers an alternative perspective or competing finding.';
        case 'Possible Bridge Work':
          return 'Connects two distinct topics in your literature collection.';
        default:
          return 'Related by citation connections and shared topic.';
      }
    }
    return 'Recommended based on your project literature connections.';
  };

  const shortlistItems = studyNextShortlist?.shortlist || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif-scholarly text-slate-900">
              Read Next
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
              {studyQueue.length} In Queue
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">
            A calm, curated reading list. Prioritize papers worth studying, capture notes, and branch deeper.
          </p>
        </div>

        <button
          onClick={() => fetchStudyNextRecommendations()}
          disabled={isStudyNextLoading}
          className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 flex items-center gap-1.5 shrink-0 shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>{isStudyNextLoading ? 'Refreshing...' : 'Refresh Suggestions'}</span>
        </button>
      </div>

      {/* 1. Active Reading Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Your Active Reading Queue ({studyQueue.length})
          </h2>
        </div>

        {/* Safeguard: Reading list overload warning */}
        {studyQueue.length >= 20 && (
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-amber-900 text-xs shadow-xs animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-amber-950">Substantial reading list</span>
              <span>You already have a substantial reading list. Review it before adding more papers to avoid cognitive overload.</span>
            </div>
          </div>
        )}

        {studyQueue.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Your reading queue is empty</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When exploring papers, click "Read Next" on any interesting candidate to save it here for calm study.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {studyQueue.map((item) => {
              const w = works.find(work => work.id === item.workId) || {
                id: item.workId,
                title: item.title,
                authors: item.authors?.map(name => ({ name })) || [],
                year: item.year,
                citationCount: 0,
                referenceCount: 0,
                references: [],
                citedBy: [],
                type: 'journal-article',
                provenance: { provider: 'OpenAlex', retrievedAt: new Date().toISOString() }
              } as Work;

              const inProject = activeProjectWorksList.some(pw => pw.workId === w.id);
              const isCompleted = item.status === 'completed';
              const isReading = item.status === 'in_progress';

              return (
                <div
                  key={item.id}
                  className={`bg-white border rounded-xl p-5 shadow-xs transition-all space-y-3 ${
                    isCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Line: Plain Language "Why should I read this?" */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                        Why read this: {item.notes || 'Saved to queue from exploration'}
                      </span>
                    </div>

                    <span className="text-xs text-slate-400 font-mono">
                      {w.year || 'N/A'}
                    </span>
                  </div>

                  {/* Paper Title & Authors */}
                  <div>
                    <h3 className="text-base font-bold font-serif-scholarly text-slate-900 leading-snug">
                      {w.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 font-medium">
                      {(w.authors || []).map(a => a?.name).filter(Boolean).join(', ') || 'Unknown Authors'}
                      {w.venue && <span className="italic"> • {w.venue}</span>}
                    </p>
                  </div>

                  {/* Abstract Preview */}
                  {w.abstract && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-serif-scholarly">
                      {w.abstract}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      {/* Reading Status Buttons */}
                      <button
                        onClick={() => updateStudyQueueItem(item.id, { status: isCompleted ? 'queued' : 'completed' })}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isCompleted ? 'Completed' : 'Mark as Read'}</span>
                      </button>

                      <button
                        onClick={() => setSelectedPromptWork({ work: w })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold border border-indigo-200 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Reading Notes & Questions</span>
                      </button>

                      {/* In My Papers */}
                      {inProject ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-medium">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          In My Papers
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddToMyPapers(w)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add to My Papers
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Explore this paper */}
                      <button
                        onClick={() => openPaperInExplorer(w)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors shadow-xs"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Explore</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      {/* Remove from queue */}
                      <button
                        onClick={() => {
                          removeFromStudyQueue(item.id);
                          showToast('Removed from reading queue.');
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Suggested Next Papers (Shortlist) */}
      {shortlistItems.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Suggested Next Papers ({shortlistItems.length})
              </h2>
              <p className="text-xs text-slate-500">
                Key bridging studies and foundational papers discovered across your project.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {shortlistItems.map((rec, idx) => {
              const w = rec.work;
              const inQueue = studyQueue.some(item => item.workId === w.id);
              const inProject = activeProjectWorksList.some(pw => pw.workId === w.id);
              const plainReason = getPlainReason(rec);

              return (
                <div
                  key={`${w.id}-${idx}`}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-xs transition-all space-y-3"
                >
                  {/* Top Line: Plain Language "Why should I read this?" */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                      Why read this: {plainReason}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {w.year || 'N/A'}
                    </span>
                  </div>

                  {/* Title & Authors */}
                  <div>
                    <h3 className="text-base font-bold font-serif-scholarly text-slate-900 leading-snug">
                      {w.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 font-medium">
                      {(w.authors || []).map(a => a?.name).filter(Boolean).join(', ') || 'Unknown Authors'}
                      {w.venue && <span className="italic"> • {w.venue}</span>}
                    </p>
                  </div>

                  {/* Abstract Preview */}
                  {w.abstract && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-serif-scholarly">
                      {w.abstract}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      {inQueue ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-semibold">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          In Read Next
                        </span>
                      ) : (
                        <button
                          onClick={async () => {
                            await useApp().addToStudyQueue(w, undefined, undefined, plainReason);
                            showToast('Added to Read Next.');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add to Read Next
                        </button>
                      )}

                      {inProject ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-medium">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          In My Papers
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddToMyPapers(w)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-semibold transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add to My Papers
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openPaperInExplorer(w)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold transition-colors"
                      >
                        <Compass className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Explore</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reading Prompt / Notes Modal */}
      {selectedPromptWork && (
        <ReadingPromptModal
          isOpen={!!selectedPromptWork}
          onClose={() => setSelectedPromptWork(null)}
          work={selectedPromptWork.work}
          role={selectedPromptWork.role}
        />
      )}

      {/* Scite Drawer */}
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
