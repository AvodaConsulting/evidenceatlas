import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Flame, 
  GitFork, 
  BarChart3, 
  BookPlus, 
  Sparkles, 
  ShieldAlert, 
  Search, 
  ExternalLink,
  ChevronRight,
  Info,
  Clock,
  Cpu,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { McpExecutionResult, Work } from '../../../types';

export const FastTrackMcpTab: React.FC = () => {
  const { 
    activeProject, 
    activeProjectWorksList, 
    mcpStatus, 
    testMcpConnection, 
    executeMcpAction, 
    mcpResults,
    isMcpLoading,
    addWorkToProject,
    permissions
  } = useApp();

  const [selectedAction, setSelectedAction] = useState<'check_duplication' | 'map_debate_lines' | 'assess_saturation' | 'suggest_candidates'>('check_duplication');
  const [customContext, setCustomContext] = useState('');
  const [latestResult, setLatestResult] = useState<McpExecutionResult | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [addedWorkIds, setAddedWorkIds] = useState<Set<string>>(new Set());

  // Test connection on mount if not tested
  useEffect(() => {
    if (!mcpStatus) {
      testMcpConnection();
    }
  }, [mcpStatus, testMcpConnection]);

  // Set default latest result from history if available
  useEffect(() => {
    if (mcpResults.length > 0 && !latestResult) {
      setLatestResult(mcpResults[0]);
    }
  }, [mcpResults, latestResult]);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      await testMcpConnection(true);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleExecute = async () => {
    try {
      const res = await executeMcpAction(selectedAction, customContext.trim() || undefined);
      setLatestResult(res);
    } catch (err: any) {
      alert(err.message || 'Execution failed');
    }
  };

  const handleAddCandidate = async (candidate: Partial<Work>) => {
    const title = candidate.title || 'Untitled Open Literature Lead';
    let authorName = 'Scholarly Authors';
    if (Array.isArray(candidate.authors) && candidate.authors.length > 0) {
      authorName = typeof candidate.authors[0] === 'string' ? candidate.authors[0] : (candidate.authors[0]?.name || 'Author');
    } else if (typeof candidate.authors === 'string') {
      authorName = candidate.authors;
    }

    const newWorkData: Omit<Work, 'id' | 'createdAt' | 'updatedAt'> = {
      title,
      authors: [{ name: authorName }],
      year: candidate.year || new Date().getFullYear(),
      venue: candidate.venue || 'Open Literature Discovery',
      doi: candidate.doi || null,
      citationCount: candidate.citationCount || 0,
      referenceCount: 0,
      references: [],
      citedBy: [],
      type: 'journal-article',
      provenance: {
        provider: 'FastTrackMCP',
        retrievedAt: new Date().toISOString()
      },
      keywords: [selectedAction, 'fast_track_lead']
    };

    await addWorkToProject(newWorkData, {
      inclusionStatus: 'candidate',
      notes: `Imported from Fast Track MCP lead (${selectedAction})`
    });

    setAddedWorkIds(prev => new Set(prev).add(title));
  };

  const actionDetails = {
    check_duplication: {
      title: 'Check Duplication & Prior Art',
      desc: 'Scan open literature repositories to evaluate existing benchmark coverage, duplication risks, and prior implementations.',
      icon: Layers,
      badge: 'Prior Art'
    },
    map_debate_lines: {
      title: 'Map Debate Lines & Dialectics',
      desc: 'Identify methodological tensions, competing paradigms, and polarized schools of thought across collected literature.',
      icon: GitFork,
      badge: 'Controversies'
    },
    assess_saturation: {
      title: 'Assess Evidence Saturation',
      desc: 'Measure if the current synthesis has reached theoretical saturation or whether crucial perspectives remain under-sampled.',
      icon: BarChart3,
      badge: 'Completeness'
    },
    suggest_candidates: {
      title: 'Suggest Literature Candidates',
      desc: 'Propose relevant papers that bridge structural gaps in the current citation network for human review.',
      icon: Sparkles,
      badge: 'Triage'
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
              <Zap className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Fast Track Open Literature MCP Integration</h2>
              <p className="text-xs text-slate-500">
                Optional Model Context Protocol adapter for rapid synthesis leads and evidence triangulation.
              </p>
            </div>
          </div>

          {/* MCP Status Pill & Test Button */}
          <div className="flex items-center gap-2">
            <div className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border ${
              mcpStatus?.connected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${mcpStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{mcpStatus?.connected ? `Connected (${mcpStatus.latencyMs}ms)` : 'Local Open-Access Engine Active'}</span>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${testingConnection ? 'animate-spin' : ''}`} />
              <span>Self-Test</span>
            </button>
          </div>
        </div>

        {/* Mandatory Research Lead Disclaimer */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-xs text-amber-950 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Epistemic Protocol:</span> Fast Track Open Literature MCP outputs are synthesized research leads intended exclusively for human review. They do not constitute verified consensus or empirical proof until cross-referenced with primary peer-reviewed sources.
          </div>
        </div>
      </div>

      {/* Action Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.keys(actionDetails) as Array<keyof typeof actionDetails>).map(key => {
          const item = actionDetails[key];
          const Icon = item.icon;
          const isSelected = selectedAction === key;

          return (
            <button
              key={key}
              onClick={() => setSelectedAction(key)}
              className={`p-3.5 rounded-xl border text-left transition-all space-y-2 flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-600'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {item.badge}
                  </span>
                </div>
                <h3 className={`text-xs font-bold ${isSelected ? 'text-indigo-950' : 'text-slate-900'}`}>
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                  {item.desc}
                </p>
              </div>

              <div className={`text-[11px] font-semibold flex items-center gap-1 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                <span>Launch Analysis</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Execution Control Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Analysis Parameters: <span className="text-indigo-600 normal-case font-semibold">{actionDetails[selectedAction].title}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Evaluating {activeProjectWorksList.length} library works
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Additional Query Angle / Hypothesis Focus (Optional)
          </label>
          <input
            type="text"
            value={customContext}
            onChange={e => setCustomContext(e.target.value)}
            placeholder={`e.g., Focus on empirical benchmarks from 2023-2025 regarding ${activeProject?.researchQuestion || 'the topic'}`}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Executes through server-side MCP adapter with 4s timeout fallback</span>
          </div>

          <button
            onClick={handleExecute}
            disabled={isMcpLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${isMcpLoading ? 'animate-spin' : ''}`} />
            <span>{isMcpLoading ? 'Analyzing Open Literature...' : 'Run MCP Action'}</span>
          </button>
        </div>
      </div>

      {/* RESULTS DISPLAY */}
      {latestResult && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                  {latestResult.action.replace('_', ' ')}
                </span>
                <span className="text-xs font-bold text-slate-900">
                  Execution Report
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Lead synthesis generated
              </div>
            </div>
          </div>

          {/* Structured Synthesis Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Literature Synthesis & Analytical Leads
            </h4>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-serif-scholarly whitespace-pre-line">
              {latestResult.leadsSummary}
            </div>
          </div>

          {/* Perspectives & Debate Lines */}
          {latestResult.perspectives && latestResult.perspectives.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Extracted Dialectical Perspectives
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {latestResult.perspectives.map((p, idx) => (
                  <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      {p.perspective}
                    </div>
                    {p.caveats && (
                      <div className="text-slate-600 italic pl-3 border-l border-slate-200 text-[11px]">
                        "{p.caveats}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Candidate Papers Generated for Triage */}
          {latestResult.candidateWorks && latestResult.candidateWorks.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Suggested Candidate Literature for Review ({latestResult.candidateWorks.length})
                </h4>
                <span className="text-[11px] text-slate-400">Click to add to library</span>
              </div>

              <div className="space-y-2">
                {latestResult.candidateWorks.map((candidate, idx) => {
                  const title = candidate.title || 'Untitled Publication';
                  const isAdded = addedWorkIds.has(title);
                  const authorStr = Array.isArray(candidate.authors) 
                    ? candidate.authors.map(a => typeof a === 'string' ? a : a.name).join(', ')
                    : (typeof candidate.authors === 'string' ? candidate.authors : 'Scholarly Authors');

                  return (
                    <div 
                      key={idx}
                      className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 max-w-xl">
                        <div className="font-bold font-serif-scholarly text-slate-900">
                          {title}
                        </div>
                        <div className="text-slate-600 text-[11px]">
                          {authorStr} {candidate.year ? `(${candidate.year})` : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {candidate.doi && (
                          <a
                            href={`https://doi.org/${candidate.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-slate-700"
                            title="Open DOI"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          onClick={() => handleAddCandidate(candidate)}
                          disabled={isAdded}
                          className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                            isAdded
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Added
                            </>
                          ) : (
                            <>
                              <BookPlus className="w-3 h-3" />
                              Add to Library
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
