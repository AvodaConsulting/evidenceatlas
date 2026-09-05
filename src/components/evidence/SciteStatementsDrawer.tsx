import React, { useState } from 'react';
import { 
  X, 
  Quote, 
  ExternalLink, 
  Copy, 
  Check, 
  Filter, 
  ShieldCheck, 
  FileText,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { SciteCitationStatement, Work } from '../../types';
import { useApp } from '../../context/AppContext';

interface SciteStatementsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  work?: Work | { id?: string; title: string; doi?: string; authors?: any[]; year?: number };
  statements?: SciteCitationStatement[];
  isLoading?: boolean;
}

export const SciteStatementsDrawer: React.FC<SciteStatementsDrawerProps> = ({
  isOpen,
  onClose,
  work,
  statements: propStatements,
  isLoading = false
}) => {
  const { sciteVerifications } = useApp();
  const [filter, setFilter] = useState<'all' | 'supporting' | 'mentioning' | 'contradicting'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Resolve statements from prop, or fallback to workspace verification cache
  const statements: SciteCitationStatement[] = propStatements || 
    (work && 'id' in work && work.id && sciteVerifications[work.id]?.statements) ||
    (work?.doi && sciteVerifications[work.doi]?.statements) ||
    [];

  const safeStatements = Array.isArray(statements) ? statements : [];

  const filteredStatements = safeStatements.filter(st => {
    if (filter === 'all') return true;
    return st?.classification === filter;
  });

  const supportingCount = safeStatements.filter(s => s?.classification === 'supporting').length;
  const mentioningCount = safeStatements.filter(s => s?.classification === 'mentioning').length;
  const contradictingCount = safeStatements.filter(s => s?.classification === 'contradicting').length;

  const handleCopySnippet = (statement: SciteCitationStatement) => {
    const text = `"${statement.snippet}" — Citing source: ${statement.citingTitle} (${statement.citingAuthors?.join(', ')}, ${statement.citingYear}). DOI: ${statement.citingDoi || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(statement.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-stone-200 bg-stone-50/70 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-emerald-800 text-white font-bold text-xs flex items-center justify-center">
                s
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 font-sans">
                Scite Verified Citation Statements
              </span>
            </div>
            <h3 className="text-base font-bold font-serif-scholarly text-stone-900 leading-snug line-clamp-2">
              {work?.title || 'Target Publication'}
            </h3>
            {work?.doi && (
              <div className="text-xs text-stone-500 font-mono flex items-center gap-2">
                <span>DOI: {work.doi}</span>
                <a 
                  href={`https://scite.ai/reports/${encodeURIComponent(work.doi)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 font-sans underline"
                >
                  <span>Open Scite Report</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Navigation Bar */}
        <div className="px-6 py-3 border-b border-stone-200 bg-white flex items-center justify-between gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-stone-500 mr-1" />
            
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-stone-800 text-white' 
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              All ({statements.length})
            </button>

            <button
              onClick={() => setFilter('supporting')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                filter === 'supporting' 
                  ? 'bg-emerald-800 text-white' 
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Supporting ({supportingCount})
            </button>

            <button
              onClick={() => setFilter('mentioning')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                filter === 'mentioning' 
                  ? 'bg-stone-700 text-white' 
                  : 'bg-stone-100 text-stone-800 border border-stone-200 hover:bg-stone-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
              Mentioning ({mentioningCount})
            </button>

            <button
              onClick={() => setFilter('contradicting')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                filter === 'contradicting' 
                  ? 'bg-amber-800 text-white' 
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Contrasting ({contradictingCount})
            </button>
          </div>

          <div className="text-[11px] text-stone-500">
            Showing {filteredStatements.length} of {statements.length} verified context passages
          </div>
        </div>

        {/* Statement List Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-stone-50/30">
          {isLoading ? (
            <div className="py-12 text-center text-stone-500 text-xs">
              <div className="w-6 h-6 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Retrieving verified citation statements from Scite...
            </div>
          ) : filteredStatements.length === 0 ? (
            <div className="py-12 text-center text-stone-500 text-xs bg-white rounded-xl border border-stone-200 p-8">
              <Quote className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="font-semibold text-stone-700">No citation statements matching this filter.</p>
              <p className="text-stone-400 text-[11px] mt-1">
                Try switching to "All" to inspect other classification categories.
              </p>
            </div>
          ) : (
            filteredStatements.map((st, idx) => {
              let tagStyle = 'bg-stone-100 text-stone-800 border-stone-200';
              let badgeDot = 'bg-stone-500';
              let classificationLabel = 'Mentioning';

              if (st.classification === 'supporting') {
                tagStyle = 'bg-emerald-50 text-emerald-900 border-emerald-200';
                badgeDot = 'bg-emerald-600';
                classificationLabel = 'Supporting';
              } else if (st.classification === 'contradicting') {
                tagStyle = 'bg-amber-50 text-amber-900 border-amber-200';
                badgeDot = 'bg-amber-600';
                classificationLabel = 'Contrasting';
              }

              return (
                <div 
                  key={st.id || idx}
                  className="bg-white border border-stone-200 rounded-xl p-4.5 shadow-2xs space-y-3 hover:border-stone-300 transition-colors"
                >
                  {/* Top Bar: Classification Badge & Citing DOI link */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${tagStyle}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badgeDot}`}></span>
                        <span>{classificationLabel}</span>
                      </span>

                      {st.section && (
                        <span className="text-[11px] text-stone-500 font-sans bg-stone-100 px-2 py-0.5 rounded">
                          Section: {st.section}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopySnippet(st)}
                        className="px-2 py-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                        title="Copy statement and citation reference"
                      >
                        {copiedId === st.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === st.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      {st.citingDoi && (
                        <a
                          href={`https://doi.org/${encodeURIComponent(st.citingDoi)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                          title="Open citing paper via DOI"
                        >
                          <span>DOI</span>
                          <ExternalLink className="w-3 h-3 text-stone-500" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Verbatim Snippet */}
                  <div className="bg-stone-50 border border-stone-200/80 rounded-lg p-3.5 relative">
                    <Quote className="w-4 h-4 text-stone-400 absolute top-3 left-3" />
                    <p className="pl-6 text-xs text-stone-900 font-serif-scholarly leading-relaxed italic">
                      "{st.snippet}"
                    </p>
                  </div>

                  {/* Citing Paper Metadata */}
                  <div className="text-xs text-stone-600 space-y-0.5 pt-1">
                    <div className="font-semibold text-stone-900 font-serif-scholarly text-sm">
                      {st.citingTitle || 'Citing Publication'}
                    </div>
                    <div className="text-[11px] text-stone-500 flex items-center gap-2 flex-wrap">
                      <span>{st.citingAuthors?.join(', ') || 'Unknown Authors'}</span>
                      {st.citingYear && <span>• ({st.citingYear})</span>}
                      {st.citingVenue && <span>• *{st.citingVenue}*</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <span>Data provided via Scite Smart Citations API.</span>
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
