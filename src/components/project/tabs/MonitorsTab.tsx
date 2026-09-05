import React, { useState } from 'react';
import { 
  Bell, 
  Plus, 
  Play, 
  CheckCircle2, 
  Clock, 
  Search, 
  BookMarked, 
  ExternalLink, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  Filter, 
  Check, 
  X,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { StoredMonitor, MonitoredCandidate } from '../../../types';

export const MonitorsTab: React.FC = () => {
  const { 
    activeProject, 
    monitors, 
    monitoredCandidates, 
    createMonitor, 
    deleteMonitor, 
    updateMonitor, 
    runMonitorNow, 
    dismissMonitoredCandidate, 
    importMonitoredCandidate,
    permissions,
    activeProjectWorksList,
    citationTrails
  } = useApp();

  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [sourceType, setSourceType] = useState<'search_query' | 'seed_set' | 'included_works' | 'citation_trail'>('search_query');
  const [queryText, setQueryText] = useState(activeProject?.initialKeywords?.join(' ') || '');
  const [yearMin, setYearMin] = useState(2023);
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const [selectedSeedIds, setSelectedSeedIds] = useState<string[]>([]);
  const [selectedTrailId, setSelectedTrailId] = useState<string>(citationTrails[0]?.id || '');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  
  const [runningMonitorId, setRunningMonitorId] = useState<string | null>(null);
  const [runFeedback, setRunFeedback] = useState<{ id: string; message: string; count: number } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'monitors' | 'candidates'>('monitors');

  const projectMonitors = monitors.filter(m => m.projectId === activeProject?.id);
  const projectCandidates = monitoredCandidates.filter(c => c.projectId === activeProject?.id && !c.dismissed);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let seedsToUse = selectedSeedIds;
    if (sourceType === 'included_works') {
      seedsToUse = activeProjectWorksList.map(pw => pw.work.id);
    } else if (sourceType === 'citation_trail') {
      const tr = citationTrails.find(t => t.id === selectedTrailId);
      seedsToUse = tr ? tr.seedWorkIds : [];
    }

    try {
      await createMonitor({
        title: newTitle.trim(),
        sourceType,
        queryText: sourceType === 'search_query' ? queryText : undefined,
        queryFilters: sourceType === 'search_query' ? { yearMin, openAccessOnly } : undefined,
        seedWorkIds: (sourceType === 'seed_set' || sourceType === 'included_works' || sourceType === 'citation_trail') ? seedsToUse : undefined,
        trailId: sourceType === 'citation_trail' ? selectedTrailId : undefined,
        frequency
      });
      setIsCreatingModal(false);
      setNewTitle('');
    } catch (err: any) {
      alert(err.message || 'Failed to create monitor');
    }
  };

  const handleRunNow = async (id: string) => {
    setRunningMonitorId(id);
    setRunFeedback(null);
    try {
      const res = await runMonitorNow(id);
      setRunFeedback({ id, message: res.message, count: res.newFoundCount });
      if (res.newFoundCount > 0) {
        setActiveSubTab('candidates');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to trigger monitor run');
    } finally {
      setRunningMonitorId(null);
    }
  };

  const toggleSeedWork = (workId: string) => {
    setSelectedSeedIds(prev => 
      prev.includes(workId) ? prev.filter(id => id !== workId) : [...prev, workId]
    );
  };

  return (
    <div className="space-y-4">
      {/* Header & Control Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
              <Bell className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900">Research Monitors & Literature Alerts</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated scheduled discovery from OpenAlex & Crossref with strict weekly idempotency, duplicate suppression, and provenance attribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {permissions.canCreateProject && (
            <button
              onClick={() => setIsCreatingModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Monitor
            </button>
          )}
        </div>
      </div>

      {/* Sub-tabs: Active Monitors vs Candidate Review Inbox */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveSubTab('monitors')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-all ${
            activeSubTab === 'monitors'
              ? 'text-indigo-700 bg-white border-b-2 border-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Active Monitors ({projectMonitors.length})
        </button>
        <button
          onClick={() => setActiveSubTab('candidates')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 ${
            activeSubTab === 'candidates'
              ? 'text-indigo-700 bg-white border-b-2 border-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Candidate Review Inbox</span>
          {projectCandidates.length > 0 && (
            <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
              {projectCandidates.length}
            </span>
          )}
        </button>
      </div>

      {/* ACTIVE MONITORS VIEW */}
      {activeSubTab === 'monitors' && (
        <div className="space-y-3">
          {projectMonitors.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-xl p-8 text-center space-y-3">
              <Bell className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-sm font-semibold text-slate-800">No Research Monitors Configured</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Set up automated literature monitors to track newly published papers matching your research question or referencing your key seed literature.
              </p>
              {permissions.canCreateProject && (
                <button
                  onClick={() => setIsCreatingModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-xs hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create First Monitor
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projectMonitors.map(monitor => {
                const isRunning = runningMonitorId === monitor.id;
                const feedback = runFeedback?.id === monitor.id ? runFeedback : null;

                return (
                  <div 
                    key={monitor.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${monitor.enabled ? 'bg-emerald-500 ring-4 ring-emerald-50' : 'bg-slate-300'}`} />
                          <h3 className="text-sm font-bold text-slate-900 leading-tight">
                            {monitor.title}
                          </h3>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                          {monitor.frequency}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1.5">
                        <div className="flex items-center gap-1 text-slate-600">
                          <span className="font-semibold text-slate-800">Type:</span>
                          <span className="capitalize">
                            {monitor.sourceType === 'search_query' 
                              ? 'Search Query Filter' 
                              : monitor.sourceType === 'included_works'
                                ? 'All Project Included Works'
                                : monitor.sourceType === 'citation_trail'
                                  ? 'Active Citation Trail Branch'
                                  : 'Seed Paper Citation Network'}
                          </span>
                        </div>
                        {monitor.sourceType === 'search_query' && (
                          <div className="text-slate-600">
                            <span className="font-semibold text-slate-800">Query:</span> "{monitor.queryText}"
                            {monitor.queryFilters?.yearMin && (
                              <span className="text-slate-400 ml-1.5 font-mono">≥{monitor.queryFilters.yearMin}</span>
                            )}
                          </div>
                        )}
                        {(monitor.sourceType === 'seed_set' || monitor.sourceType === 'included_works' || monitor.sourceType === 'citation_trail') && (
                          <div className="text-slate-600">
                            <span className="font-semibold text-slate-800">Tracking:</span> {monitor.seedWorkIds?.length || 0} seed papers
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Last Run: {monitor.lastRunAt ? new Date(monitor.lastRunAt).toLocaleDateString() : 'Pending'}</span>
                        </div>
                        <div className="text-slate-600 font-medium">
                          Found {monitor.totalCandidatesGenerated || 0} total candidates
                        </div>
                      </div>

                      {feedback && (
                        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-2 rounded text-xs flex items-center gap-1.5 animate-in fade-in">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{feedback.message} ({feedback.count} new items)</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateMonitor(monitor.id, { enabled: !monitor.enabled })}
                          className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                            monitor.enabled ? 'text-slate-600 hover:bg-slate-100' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                        >
                          {monitor.enabled ? 'Pause' : 'Enable'}
                        </button>
                        {permissions.canCreateProject && (
                          <button
                            onClick={() => deleteMonitor(monitor.id)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete monitor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleRunNow(monitor.id)}
                        disabled={isRunning || !monitor.enabled}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRunning ? 'animate-spin text-indigo-600' : ''}`} />
                        <span>{isRunning ? 'Checking Providers...' : 'Check Now'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CANDIDATES REVIEW INBOX */}
      {activeSubTab === 'candidates' && (
        <div className="space-y-3">
          {projectCandidates.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <div className="text-sm font-semibold text-slate-800">Inbox Zero: All Candidates Reviewed</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No unreviewed literature recommendations pending. New papers matching your monitors will appear here for triage.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {projectCandidates.map((candidate, idx) => {
                const work = candidate.work;

                return (
                  <div 
                    key={`${candidate.id}-${idx}`}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded">
                            {work.sourceProvider}
                          </span>
                          {candidate.coCitationOverlapCount > 0 && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded flex items-center gap-1">
                              <Zap className="w-3 h-3 text-amber-600" />
                              {candidate.coCitationOverlapCount} Co-citations with project
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            Discovered {new Date(candidate.discoveredAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 leading-snug font-serif-scholarly">
                          {work.title}
                        </h3>

                        <div className="text-xs text-slate-600">
                          {work.authors.map(a => a.name).join(', ')} • <span className="font-semibold">{work.venue || 'Scholarly Venue'}</span> ({work.year})
                        </div>
                      </div>

                      {work.doi && (
                        <a
                          href={`https://doi.org/${work.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-indigo-600 shrink-0 p-1"
                          title="Open DOI"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    {work.abstract && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 line-clamp-3 leading-relaxed">
                        {work.abstract}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <div className="text-[11px] text-slate-500 font-mono">
                        Citations: {work.citationCount} • Match score: {Math.round(candidate.similarityScore * 100)}%
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => dismissMonitoredCandidate(candidate.id)}
                          className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md font-medium transition-colors"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => importMonitoredCandidate(candidate)}
                          disabled={candidate.importedToProject}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-xs transition-colors disabled:bg-emerald-600"
                        >
                          {candidate.importedToProject ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Imported
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              Add to Library
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE MONITOR MODAL */}
      {isCreatingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Create Research Monitor</h3>
              </div>
              <button 
                onClick={() => setIsCreatingModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Monitor Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g., Weekly Frontier: LLM Alignment & Provable Reasoning"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Discovery Strategy</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSourceType('search_query')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      sourceType === 'search_query'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5 mb-1 text-indigo-600" />
                    <div className="font-bold">Keyword Query</div>
                    <div className="text-[10px] text-slate-500 font-normal">Track new publications matching search terms</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSourceType('seed_set')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      sourceType === 'seed_set'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <BookMarked className="w-3.5 h-3.5 mb-1 text-indigo-600" />
                    <div className="font-bold">Seed Works</div>
                    <div className="text-[10px] text-slate-500 font-normal">Track citations to selected papers</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSourceType('included_works')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      sourceType === 'included_works'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mb-1 text-emerald-600" />
                    <div className="font-bold">All Included Works</div>
                    <div className="text-[10px] text-slate-500 font-normal">Auto-monitor entire library core</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSourceType('citation_trail')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      sourceType === 'citation_trail'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 mb-1 text-indigo-600" />
                    <div className="font-bold">Citation Trail</div>
                    <div className="text-[10px] text-slate-500 font-normal">Follow specific trail lineage</div>
                  </button>
                </div>
              </div>

              {sourceType === 'search_query' && (
                <div className="space-y-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Search Keywords</label>
                    <input
                      type="text"
                      value={queryText}
                      onChange={e => setQueryText(e.target.value)}
                      placeholder="e.g., retrieval augmented generation provenance"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Minimum Year</label>
                      <input
                        type="number"
                        value={yearMin}
                        onChange={e => setYearMin(parseInt(e.target.value) || 2023)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md"
                      />
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={openAccessOnly}
                          onChange={e => setOpenAccessOnly(e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        <span>Open Access Only</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {sourceType === 'seed_set' && (
                <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200 max-h-48 overflow-y-auto">
                  <label className="block text-slate-700 font-semibold mb-1">Select Seed Papers to Monitor:</label>
                  {activeProjectWorksList.length === 0 ? (
                    <div className="text-slate-400 text-xs italic">No literature in project library yet.</div>
                  ) : (
                    activeProjectWorksList.map((pw, idx) => (
                      <label 
                        key={`${pw.id || pw.work.id}-${idx}`}
                        className={`flex items-start gap-2 p-1.5 rounded cursor-pointer transition-colors ${
                          selectedSeedIds.includes(pw.work.id) ? 'bg-indigo-100/60 text-indigo-950 font-medium' : 'hover:bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSeedIds.includes(pw.work.id)}
                          onChange={() => toggleSeedWork(pw.work.id)}
                          className="mt-0.5 rounded text-indigo-600"
                        />
                        <span className="text-xs line-clamp-1">{pw.work.title} ({pw.work.year})</span>
                      </label>
                    ))
                  )}
                </div>
              )}

              {sourceType === 'included_works' && (
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs text-emerald-950 space-y-1">
                  <span className="font-bold block">Automatic Project Scope Sync</span>
                  <p className="text-[11px] text-emerald-800">
                    This monitor will automatically track new forward and co-citations across all {activeProjectWorksList.length} works currently included in this project library.
                  </p>
                </div>
              )}

              {sourceType === 'citation_trail' && (
                <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <label className="block text-slate-700 font-semibold mb-1">Select Citation Trail to Follow:</label>
                  <select
                    value={selectedTrailId}
                    onChange={e => setSelectedTrailId(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                  >
                    {citationTrails.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.seedWorkIds.length} seeds)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Frequency</label>
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="daily">Daily Check</option>
                  <option value="weekly">Weekly Check (Recommended)</option>
                  <option value="monthly">Monthly Check</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreatingModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Save Monitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
