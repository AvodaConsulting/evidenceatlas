import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Database,
  Filter,
  Activity,
  Zap,
  Server,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { scholarlyApi } from '../../../lib/scholarlyApi';

export const SearchLogTab: React.FC = () => {
  const { searches, activeProject } = useApp();
  const [providerHealth, setProviderHealth] = useState<any>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);

  const fetchHealth = async () => {
    try {
      setIsLoadingHealth(true);
      const data = await scholarlyApi.getHealth();
      setProviderHealth(data);
    } catch (e) {
      console.warn('Failed to fetch provider health', e);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const projectSearches = searches.filter(s => s.projectId === activeProject?.id);

  const handleExportCSV = () => {
    const headers = ['SearchID', 'Timestamp', 'QueryText', 'ExecutedBy', 'Providers', 'CandidateCount', 'Filters'];
    const rows = projectSearches.map(s => [
      `"${s.id}"`,
      `"${s.executedAt}"`,
      `"${s.queryText.replace(/"/g, '""')}"`,
      `"${s.executedByEmail}"`,
      `"${s.providersQueried.join('; ')}"`,
      s.candidateCount,
      `"${JSON.stringify(s.queryFilters || {}).replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prisma_search_audit_${activeProject?.id || 'export'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold font-serif-scholarly text-slate-900">
            PRISMA Systematic Search & Provider Audit Registry
          </h3>
          <p className="text-xs text-slate-500">
            Immutable log of all scholarly queries, provider latencies, and candidate yields for systematic review reproducibility
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={projectSearches.length === 0}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          Export Search Audit (CSV)
        </button>
      </div>

      {/* Provider Health & Live Circuit Breaker Status */}
      {providerHealth && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              <span>Live Provider Status & Circuit Breaker Health</span>
            </div>
            <button
              onClick={fetchHealth}
              disabled={isLoadingHealth}
              className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 font-medium"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingHealth ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {Object.entries(providerHealth.providers || {}).map(([name, data]: [string, any]) => (
              <div key={name} className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{name}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                    data.circuitState === 'closed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {data.circuitState === 'closed' ? 'Healthy (Closed)' : 'Tripped (Open)'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono flex justify-between">
                  <span>Reqs: {data.totalRequests}</span>
                  <span>Avg Latency: {Math.round(data.averageLatencyMs || 0)}ms</span>
                  <span>Err: {data.consecutiveFailures}</span>
                </div>
              </div>
            ))}

            {providerHealth.cache && (
              <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">In-Memory Cache</span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-1.5 py-0.2 rounded border border-indigo-100">
                    Active
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono flex justify-between">
                  <span>Cached Works: {providerHealth.cache.cachedWorks}</span>
                  <span>Searches: {providerHealth.cache.cachedSearches}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logs Table */}
      {projectSearches.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center">
          <Database className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold font-serif-scholarly text-slate-800 mb-1">
            No search queries logged yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Execute literature searches from the Discover tab to automatically record query strings, candidate yields, and provider latency.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {projectSearches.map(log => (
            <div 
              key={log.id}
              className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    "{log.queryText}"
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(log.executedAt).toLocaleString()}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <User className="w-3 h-3 text-slate-400" />
                    {log.executedByEmail}
                  </span>
                </div>
              </div>

              {/* Provider Status Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {log.providerStatuses.map((p, idx) => (
                  <div key={idx} className="bg-slate-50 p-2 rounded border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${p.status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`} />
                      <span className="font-semibold text-slate-800">{p.provider}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {p.candidatesCount} works ({p.latencyMs}ms)
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="text-xs text-slate-600 flex items-center justify-between pt-1">
                <span>Total Candidates Retrieved: <strong className="text-slate-900">{log.candidateCount}</strong></span>
                {log.queryFilters && Object.keys(log.queryFilters).length > 0 && (
                  <span className="text-[11px] text-slate-500">
                    Filters applied: {Object.keys(log.queryFilters).filter(k => !!log.queryFilters[k]).join(', ') || 'None'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
