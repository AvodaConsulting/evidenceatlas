import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  GitBranch, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  BookOpen, 
  Layers, 
  ShieldAlert, 
  Download, 
  Copy, 
  Check, 
  ExternalLink,
  Info
} from 'lucide-react';
import { CitationTrail, Work } from '../../types';
import { useApp } from '../../context/AppContext';
import { trailApi } from '../../lib/scholarlyApi';

interface TrailCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrailAId?: string;
  initialTrailBId?: string;
}

interface TrailComparisonData {
  trailA: CitationTrail;
  trailB: CitationTrail;
  seedsOverlap: {
    inBoth: Work[];
    onlyInA: Work[];
    onlyInB: Work[];
  };
  metrics: {
    trailA: { total: number; included: number; queued: number; rejected: number; pending: number };
    trailB: { total: number; included: number; queued: number; rejected: number; pending: number };
  };
  includedOverlap: {
    inBoth: Work[];
    onlyInA: Work[];
    onlyInB: Work[];
  };
  rejectedOverlap: {
    inBoth: { work: Work; reasonA?: string; reasonB?: string }[];
    onlyInA: { work: Work; reason?: string }[];
    onlyInB: { work: Work; reason?: string }[];
  };
  providerDifference: {
    inBoth: string[];
    onlyInA: string[];
    onlyInB: string[];
  };
  summaryText: string;
}

export const TrailCompareModal: React.FC<TrailCompareModalProps> = ({
  isOpen,
  onClose,
  initialTrailAId,
  initialTrailBId
}) => {
  const { citationTrails } = useApp();
  
  const [trailAId, setTrailAId] = useState<string>(initialTrailAId || (citationTrails[0]?.id || ''));
  const [trailBId, setTrailBId] = useState<string>(initialTrailBId || (citationTrails[1]?.id || citationTrails[0]?.id || ''));
  const [comparison, setComparison] = useState<TrailComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialTrailAId) setTrailAId(initialTrailAId);
    if (initialTrailBId) setTrailBId(initialTrailBId);
  }, [initialTrailAId, initialTrailBId]);

  useEffect(() => {
    if (!isOpen || !trailAId || !trailBId) return;
    if (trailAId === trailBId && citationTrails.length > 1) {
      // Pick a different default for B if available
      const alt = citationTrails.find(t => t.id !== trailAId);
      if (alt) {
        setTrailBId(alt.id);
        return;
      }
    }

    const loadComparison = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await trailApi.compareTrails(trailAId, trailBId);
        setComparison(res.comparison);
      } catch (err: any) {
        setError(err.message || 'Failed to compare citation trails');
      } finally {
        setIsLoading(false);
      }
    };

    loadComparison();
  }, [isOpen, trailAId, trailBId, citationTrails.length]);

  if (!isOpen) return null;

  const trailA = citationTrails.find(t => t.id === trailAId);
  const trailB = citationTrails.find(t => t.id === trailBId);

  const handleCopySummary = () => {
    if (!comparison) return;
    navigator.clipboard.writeText(comparison.summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadComparisonMarkdown = () => {
    if (!comparison) return;
    const blob = new Blob([comparison.summaryText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trail-comparison-${comparison.trailA.id.slice(0, 6)}-vs-${comparison.trailB.id.slice(0, 6)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif-scholarly text-slate-900">
                Compare Citation Trails Side-by-Side
              </h2>
              <p className="text-xs text-slate-500 font-serif-scholarly">
                Compare seed sets, exploration parameters, candidate yields, inclusion overlap, and divergence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trail Selectors Bar */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-900">
              Primary Trail (A)
            </label>
            <select
              value={trailAId}
              onChange={(e) => setTrailAId(e.target.value)}
              className="w-full text-xs p-2 bg-white border border-indigo-200 rounded-lg focus:outline-indigo-500 font-serif-scholarly font-medium"
            >
              {citationTrails.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({(t.trailType || 'trail').replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-900">
              Comparison Trail (B)
            </label>
            <select
              value={trailBId}
              onChange={(e) => setTrailBId(e.target.value)}
              className="w-full text-xs p-2 bg-white border border-emerald-200 rounded-lg focus:outline-emerald-500 font-serif-scholarly font-medium"
            >
              {citationTrails.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({(t.trailType || 'trail').replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 font-serif-scholarly">
          {isLoading && (
            <div className="py-16 text-center text-slate-500 text-sm">
              <div className="inline-block animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2"></div>
              <p>Analyzing and comparing trail lineages, seeds, and candidate decisions...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
              {error}
            </div>
          )}

          {!isLoading && comparison && (
            <>
              {/* Top Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Trail A Overview */}
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                      Trail A: {(comparison.trailA.trailType || 'trail').replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(comparison.trailA.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {comparison.trailA.title}
                  </h3>
                  {comparison.trailA.researcherNotes && (
                    <p className="text-xs text-slate-600 italic">
                      "{comparison.trailA.researcherNotes}"
                    </p>
                  )}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-indigo-100 text-center">
                    <div className="p-1.5 bg-white rounded border border-indigo-100">
                      <div className="text-xs font-bold text-slate-800">{comparison.metrics.trailA.total}</div>
                      <div className="text-[10px] text-slate-500">Candidates</div>
                    </div>
                    <div className="p-1.5 bg-white rounded border border-indigo-100">
                      <div className="text-xs font-bold text-emerald-700">{comparison.metrics.trailA.included}</div>
                      <div className="text-[10px] text-slate-500">Included</div>
                    </div>
                    <div className="p-1.5 bg-white rounded border border-indigo-100">
                      <div className="text-xs font-bold text-amber-700">{comparison.metrics.trailA.queued}</div>
                      <div className="text-[10px] text-slate-500">Queued</div>
                    </div>
                    <div className="p-1.5 bg-white rounded border border-indigo-100">
                      <div className="text-xs font-bold text-rose-700">{comparison.metrics.trailA.rejected}</div>
                      <div className="text-[10px] text-slate-500">Rejected</div>
                    </div>
                  </div>
                </div>

                {/* Trail B Overview */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Trail B: {(comparison.trailB.trailType || 'trail').replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(comparison.trailB.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {comparison.trailB.title}
                  </h3>
                  {comparison.trailB.researcherNotes && (
                    <p className="text-xs text-slate-600 italic">
                      "{comparison.trailB.researcherNotes}"
                    </p>
                  )}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-emerald-100 text-center">
                    <div className="p-1.5 bg-white rounded border border-emerald-100">
                      <div className="text-xs font-bold text-slate-800">{comparison.metrics.trailB.total}</div>
                      <div className="text-[10px] text-slate-500">Candidates</div>
                    </div>
                    <div className="p-1.5 bg-white rounded border border-emerald-100">
                      <div className="text-xs font-bold text-emerald-700">{comparison.metrics.trailB.included}</div>
                      <div className="text-[10px] text-slate-500">Included</div>
                    </div>
                    <div className="p-1.5 bg-white rounded border border-emerald-100">
                      <div className="text-xs font-bold text-amber-700">{comparison.metrics.trailB.queued}</div>
                      <div className="text-[10px] text-slate-500">Queued</div>
                    </div>
                    <div className="p-1.5 bg-white rounded border border-emerald-100">
                      <div className="text-xs font-bold text-rose-700">{comparison.metrics.trailB.rejected}</div>
                      <div className="text-[10px] text-slate-500">Rejected</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. Seed Works Comparison */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>1. Seed Literature Comparison</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                    <div className="font-bold text-slate-800 text-[11px] uppercase">
                      Shared Seeds ({(comparison.seedsOverlap?.inBoth || []).length})
                    </div>
                    {(!comparison.seedsOverlap?.inBoth || comparison.seedsOverlap.inBoth.length === 0) ? (
                      <p className="text-slate-400 italic text-[11px]">No common seed papers</p>
                    ) : (
                      <ul className="space-y-1 text-slate-700 list-disc list-inside">
                        {(comparison.seedsOverlap?.inBoth || []).map((s, idx) => (
                          <li key={`${s.id}-${idx}`} className="truncate" title={s.title}>{s.title} ({s.year || 'N/A'})</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="p-3 bg-indigo-50/40 border border-indigo-200 rounded-lg space-y-1.5">
                    <div className="font-bold text-indigo-900 text-[11px] uppercase">
                      Unique to Trail A ({(comparison.seedsOverlap?.onlyInA || []).length})
                    </div>
                    {(!comparison.seedsOverlap?.onlyInA || comparison.seedsOverlap.onlyInA.length === 0) ? (
                      <p className="text-slate-400 italic text-[11px]">No unique seeds</p>
                    ) : (
                      <ul className="space-y-1 text-indigo-900 list-disc list-inside">
                        {(comparison.seedsOverlap?.onlyInA || []).map((s, idx) => (
                          <li key={`${s.id}-${idx}`} className="truncate" title={s.title}>{s.title} ({s.year || 'N/A'})</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="p-3 bg-emerald-50/40 border border-emerald-200 rounded-lg space-y-1.5">
                    <div className="font-bold text-emerald-900 text-[11px] uppercase">
                      Unique to Trail B ({(comparison.seedsOverlap?.onlyInB || []).length})
                    </div>
                    {(!comparison.seedsOverlap?.onlyInB || comparison.seedsOverlap.onlyInB.length === 0) ? (
                      <p className="text-slate-400 italic text-[11px]">No unique seeds</p>
                    ) : (
                      <ul className="space-y-1 text-emerald-900 list-disc list-inside">
                        {(comparison.seedsOverlap?.onlyInB || []).map((s, idx) => (
                          <li key={`${s.id}-${idx}`} className="truncate" title={s.title}>{s.title} ({s.year || 'N/A'})</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Included Works Convergence & Divergence */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. Included Works Overlap & Divergence</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-1.5">
                    <div className="font-bold text-emerald-900 text-[11px] uppercase">
                      Included in Both Trails ({(comparison.includedOverlap?.inBoth || []).length})
                    </div>
                    {(!comparison.includedOverlap?.inBoth || comparison.includedOverlap.inBoth.length === 0) ? (
                      <p className="text-slate-400 italic text-[11px]">No shared included works</p>
                    ) : (
                      <ul className="space-y-1 text-emerald-950 list-disc list-inside">
                        {(comparison.includedOverlap?.inBoth || []).map((w, idx) => (
                          <li key={`${w.id}-${idx}`} className="truncate" title={w.title}>
                            {w.title} ({w.year || 'N/A'})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                    <div className="font-bold text-slate-800 text-[11px] uppercase">
                      Included only in Trail A ({(comparison.includedOverlap?.onlyInA || []).length})
                    </div>
                    {(!comparison.includedOverlap?.onlyInA || comparison.includedOverlap.onlyInA.length === 0) ? (
                      <p className="text-slate-400 italic text-[11px]">None</p>
                    ) : (
                      <ul className="space-y-1 text-slate-700 list-disc list-inside">
                        {(comparison.includedOverlap?.onlyInA || []).map((w, idx) => (
                          <li key={`${w.id}-${idx}`} className="truncate" title={w.title}>
                            {w.title} ({w.year || 'N/A'})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                    <div className="font-bold text-slate-800 text-[11px] uppercase">
                      Included only in Trail B ({(comparison.includedOverlap?.onlyInB || []).length})
                    </div>
                    {(!comparison.includedOverlap?.onlyInB || comparison.includedOverlap.onlyInB.length === 0) ? (
                      <p className="text-slate-400 italic text-[11px]">None</p>
                    ) : (
                      <ul className="space-y-1 text-slate-700 list-disc list-inside">
                        {(comparison.includedOverlap?.onlyInB || []).map((w, idx) => (
                          <li key={`${w.id}-${idx}`} className="truncate" title={w.title}>
                            {w.title} ({w.year || 'N/A'})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Provider Sources & Coverage */}
              <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  3. Provider Retrieval & Scope Filters
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="font-semibold block text-indigo-900 mb-1">Trail A Sources:</span>
                    <div className="flex flex-wrap gap-1">
                      {(comparison.trailA?.providerSources || []).map((p, idx) => (
                        <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold block text-emerald-900 mb-1">Trail B Sources:</span>
                    <div className="flex flex-wrap gap-1">
                      {(comparison.trailB?.providerSources || []).map((p, idx) => (
                        <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Epistemic Limitation Disclaimer */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5 leading-relaxed">
                  <span className="font-bold block">Epistemic Comparison Rule:</span>
                  <span>
                    Differences in candidate yields reflect distinct algorithmic vantage points (e.g. forward citations vs. co-citation clustering vs. bridge exploration), not definitive contradictions in scientific importance.
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              disabled={!comparison}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Summary' : 'Copy Summary'}</span>
            </button>
            <button
              onClick={handleDownloadComparisonMarkdown}
              disabled={!comparison}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Comparison (.md)</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
