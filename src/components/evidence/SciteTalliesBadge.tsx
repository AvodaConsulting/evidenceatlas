import React from 'react';
import { ShieldAlert, AlertTriangle, FileWarning, ExternalLink, Sparkles, Database, CheckCircle } from 'lucide-react';
import { SciteTallies, SciteEditorialNotice } from '../../types';

interface SciteTalliesBadgeProps {
  tallies?: SciteTallies;
  notices?: SciteEditorialNotice[];
  status?: string;
  cached?: boolean;
  onOpenStatements?: () => void;
  doi?: string;
  compact?: boolean;
}

export const SciteTalliesBadge: React.FC<SciteTalliesBadgeProps> = ({
  tallies,
  notices = [],
  status,
  cached,
  onOpenStatements,
  doi,
  compact = false
}) => {
  if (status === 'no_record') {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[11px] font-sans">
        <span>Scite: No record indexed</span>
      </div>
    );
  }

  if (status === 'provider_unavailable') {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-500 text-[11px] font-sans">
        <span>Scite unavailable</span>
      </div>
    );
  }

  if (!tallies) {
    return null;
  }

  const hasRetraction = notices.some(n => n.type === 'retraction');
  const hasExpressionOfConcern = notices.some(n => n.type === 'expression_of_concern');
  const hasOtherNotice = notices.some(n => n.type === 'erratum' || n.type === 'editorial_notice');

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Supporting */}
        <span 
          title="Supporting citation statements"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          <span>{tallies.supporting} Supporting</span>
        </span>

        {/* Mentioning */}
        <span 
          title="Mentioning citation statements"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-stone-100 text-stone-800 border border-stone-200"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-stone-500"></span>
          <span>{tallies.mentioning} Mentioning</span>
        </span>

        {/* Contrasting */}
        <span 
          title="Contrasting (disputing / qualifying) citation statements"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          <span>{tallies.contradicting} Contrasting</span>
        </span>

        {/* Notices */}
        {hasRetraction && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <ShieldAlert className="w-3 h-3 text-rose-700" />
            <span>Retracted</span>
          </span>
        )}

        {hasExpressionOfConcern && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-700" />
            <span>Expression of Concern</span>
          </span>
        )}

        {onOpenStatements && (
          <button
            onClick={onOpenStatements}
            className="text-[11px] font-medium text-emerald-800 hover:text-emerald-950 underline ml-1"
          >
            Statements
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Retraction / Notice Alert Banners */}
      {hasRetraction && (
        <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-start gap-2.5 text-rose-950">
          <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold uppercase tracking-wider text-rose-900">
              Editorial Notice: Retraction Alert
            </div>
            <p className="mt-0.5 text-rose-800 leading-relaxed">
              This publication has been flagged as retracted or formally withdrawn by the publisher or indexing database. Use with extreme caution.
            </p>
          </div>
        </div>
      )}

      {hasExpressionOfConcern && !hasRetraction && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-amber-950">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold uppercase tracking-wider text-amber-900">
              Expression of Concern
            </div>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              An editorial expression of concern has been published regarding data reliability or methodology.
            </p>
          </div>
        </div>
      )}

      {hasOtherNotice && !hasRetraction && !hasExpressionOfConcern && (
        <div className="p-2.5 bg-stone-100 border border-stone-300 rounded-xl flex items-start gap-2 text-stone-800">
          <FileWarning className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
          <div className="text-[11px]">
            <span className="font-semibold">Publisher Notice / Erratum on file.</span>
          </div>
        </div>
      )}

      {/* Main Scite Smart Citation Block */}
      <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-stone-200 flex items-center justify-center font-bold text-xs text-stone-800">
            s
          </div>
          <div>
            <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <span>Scite Smart Citations</span>
              {cached && (
                <span className="text-[10px] font-normal text-stone-500 bg-stone-200/80 px-1.5 py-0.2 rounded">
                  Cached
                </span>
              )}
            </div>
            <div className="text-[10px] text-stone-500">
              Total {tallies.total} citing statements classified
            </div>
          </div>
        </div>

        {/* Tallies Pill Group */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Supporting */}
          <div 
            title="Supporting citation statements (empirical validation or direct agreement)"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100/90 text-emerald-900 border border-emerald-300/80"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>{tallies.supporting} Supporting</span>
          </div>

          {/* Mentioning */}
          <div 
            title="Mentioning citation statements (literature context or background citation)"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-200/80 text-stone-800 border border-stone-300"
          >
            <span className="w-2 h-2 rounded-full bg-stone-600"></span>
            <span>{tallies.mentioning} Mentioning</span>
          </div>

          {/* Contrasting */}
          <div 
            title="Contrasting citation statements (contradicting, disputing, or qualifying results)"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100/90 text-amber-900 border border-amber-300/80"
          >
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            <span>{tallies.contradicting} Contrasting</span>
          </div>

          {/* Action Buttons */}
          {onOpenStatements && (
            <button
              onClick={onOpenStatements}
              className="px-2.5 py-1 bg-white hover:bg-stone-100 text-emerald-900 text-xs font-semibold rounded-lg border border-stone-300 shadow-2xs transition-colors flex items-center gap-1"
            >
              <span>View Statements</span>
            </button>
          )}

          {doi && (
            <a
              href={`https://scite.ai/reports/${encodeURIComponent(doi)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-stone-500 hover:text-stone-800 transition-colors"
              title="Open full report on scite.ai"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
