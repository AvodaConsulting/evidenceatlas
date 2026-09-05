import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  FileCheck2, 
  Upload, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw,
  BookOpen,
  Filter
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { sciteApi } from '../../lib/scholarlyApi';
import { SciteReferenceCheckRun } from '../../types';

interface ReferenceCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferenceCheckModal: React.FC<ReferenceCheckModalProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    activeProject, 
    activeProjectWorksList, 
    saveReferenceCheckRun 
  } = useApp();

  const [inputMode, setInputMode] = useState<'project_library' | 'paste_dois' | 'bibtex'>('project_library');
  const [pastedText, setPastedText] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkRun, setCheckRun] = useState<SciteReferenceCheckRun | null>(null);
  const [copied, setCopied] = useState(false);
  const [filterIssuesOnly, setFilterIssuesOnly] = useState(false);

  if (!isOpen) return null;

  const handleRunCheck = async () => {
    try {
      setIsRunning(true);
      setError(null);
      setCheckRun(null);

      let references: Array<{ id?: string; doi?: string; title?: string; text?: string }> = [];

      if (inputMode === 'project_library') {
        references = activeProjectWorksList.map(pw => ({
          id: pw.workId,
          doi: pw.work.doi || undefined,
          title: pw.work.title
        }));
      } else if (inputMode === 'paste_dois') {
        const lines = pastedText.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
        references = lines.map((line, idx) => {
          const isDoi = line.includes('10.') || line.startsWith('10.');
          return {
            id: `pasted_${idx}`,
            doi: isDoi ? line.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//i, '').trim() : undefined,
            text: line,
            title: isDoi ? `DOI: ${line}` : line
          };
        });
      } else {
        // BibTeX / RIS raw text
        const doiMatches = Array.from(pastedText.matchAll(/doi\s*=\s*[{"]?([^}",\s]+)[}"]?/gi));
        if (doiMatches.length > 0) {
          references = doiMatches.map((m, idx) => ({
            id: `bib_${idx}`,
            doi: m[1],
            title: `BibTeX Reference DOI ${m[1]}`
          }));
        } else {
          // Plain lines
          references = pastedText.split('\n').filter(Boolean).map((line, idx) => ({
            id: `line_${idx}`,
            text: line,
            title: line.substring(0, 80)
          }));
        }
      }

      if (references.length === 0) {
        throw new Error('No references or DOIs found to verify.');
      }

      const report = await sciteApi.runReferenceCheck(
        references,
        activeProject?.id,
        activeProject?.workspaceId
      );

      setCheckRun(report);
      saveReferenceCheckRun(report);
    } catch (err: any) {
      setError(err.message || 'Reference Check execution failed.');
    } finally {
      setIsRunning(false);
    }
  };

  const displayedResults = (checkRun?.results || []).filter(r => {
    if (filterIssuesOnly) {
      return (r.retractionsCount || 0) > 0 || (r.editorialNoticesCount || 0) > 0 || r.hasContrastingAlert;
    }
    return true;
  });

  const handleExportCSV = () => {
    if (!checkRun || !checkRun.results) return;
    const headers = ['Title', 'DOI', 'Status', 'Supporting', 'Mentioning', 'Contrasting', 'Retractions', 'Notices'];
    const rows = (checkRun.results || []).map(r => [
      `"${(r.title || '').replace(/"/g, '""')}"`,
      r.doi || '',
      r.status,
      r.tallies?.supporting || 0,
      r.tallies?.mentioning || 0,
      r.tallies?.contradicting || 0,
      r.retractionsCount || 0,
      r.editorialNoticesCount || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `scite_reference_check_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyMarkdown = () => {
    if (!checkRun) return;
    const md = `# Scite Reference Check Audit Report
- **Executed At**: ${new Date(checkRun.executedAt).toLocaleString()}
- **Total References Checked**: ${checkRun.totalChecked}
- **Retracted Items**: ${checkRun.retractionsCount}
- **Editorial Notices**: ${checkRun.editorialNoticesCount}
- **High Contrasting Flags**: ${checkRun.contrastingCount}

| Reference Title | DOI | Supporting | Mentioning | Contrasting | Flags |
| :--- | :--- | :---: | :---: | :---: | :--- |
${checkRun.results.map(r => `| ${r.title.substring(0, 60)} | ${r.doi || 'N/A'} | ${r.tallies?.supporting || 0} | ${r.tallies?.mentioning || 0} | ${r.tallies?.contradicting || 0} | ${r.retractionsCount ? '**RETRACTED**' : r.editorialNoticesCount ? 'Notice' : r.hasContrastingAlert ? 'Contrasting Density' : 'Normal'} |`).join('\n')}
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif-scholarly text-stone-900">
                Scite Reference Check & Retraction Audit
              </h2>
              <p className="text-xs text-stone-500">
                Screen bibliography and citations for retractions, expressions of concern, and contrasting research
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

        {/* Input Configuration & Action */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-2 border-b border-stone-200 pb-3 text-xs">
            <button
              onClick={() => setInputMode('project_library')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                inputMode === 'project_library' 
                  ? 'bg-emerald-800 text-white' 
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Project Library ({activeProjectWorksList.length} Works)</span>
            </button>

            <button
              onClick={() => setInputMode('paste_dois')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                inputMode === 'paste_dois' 
                  ? 'bg-emerald-800 text-white' 
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <span>Paste List of DOIs</span>
            </button>

            <button
              onClick={() => setInputMode('bibtex')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                inputMode === 'bibtex' 
                  ? 'bg-emerald-800 text-white' 
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>BibTeX / RIS Input</span>
            </button>
          </div>

          {/* Conditional Inputs */}
          {inputMode === 'project_library' ? (
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 flex items-center justify-between">
              <div>
                <span className="font-semibold text-stone-900 block">
                  Verify All {activeProjectWorksList.length} Library Publications
                </span>
                <span className="text-stone-500 text-[11px]">
                  Scite will audit every DOI in this project for retraction notices and citation tallies.
                </span>
              </div>
              <button
                onClick={handleRunCheck}
                disabled={isRunning || activeProjectWorksList.length === 0}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-60"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditing References...</span>
                  </>
                ) : (
                  <>
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Run Full Library Audit</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-stone-700">
                {inputMode === 'paste_dois' ? 'Enter DOIs (one per line or separated by commas):' : 'Paste BibTeX or RIS content:'}
              </label>
              <textarea
                rows={4}
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder={inputMode === 'paste_dois' 
                  ? "10.1038/s41586-020-2649-2\n10.1145/3442188.3445922\n10.1016/j.artint.2021.103554" 
                  : "@article{vaswani2017attention,\n  title={Attention is all you need},\n  doi={10.48550/arXiv.1706.03762}\n}"
                }
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-emerald-800 outline-hidden"
              />
              <button
                onClick={handleRunCheck}
                disabled={isRunning || !pastedText.trim()}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-60"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditing...</span>
                  </>
                ) : (
                  <>
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Audit References</span>
                  </>
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Audit Results Table */}
          {checkRun && (
            <div className="space-y-4 pt-4 border-t border-stone-200">
              {/* Metric Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                    Total Checked
                  </span>
                  <span className="text-xl font-bold font-serif-scholarly text-stone-900 mt-1 block">
                    {checkRun.totalChecked}
                  </span>
                </div>

                <div className={`border rounded-xl p-3.5 ${checkRun.retractionsCount > 0 ? 'bg-rose-50 border-rose-300 text-rose-950' : 'bg-stone-50 border-stone-200 text-stone-900'}`}>
                  <span className="text-[11px] font-semibold uppercase tracking-wider block">
                    Retractions
                  </span>
                  <span className="text-xl font-bold font-serif-scholarly mt-1 block">
                    {checkRun.retractionsCount}
                  </span>
                </div>

                <div className={`border rounded-xl p-3.5 ${checkRun.editorialNoticesCount > 0 ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-stone-50 border-stone-200 text-stone-900'}`}>
                  <span className="text-[11px] font-semibold uppercase tracking-wider block">
                    Editorial Notices
                  </span>
                  <span className="text-xl font-bold font-serif-scholarly mt-1 block">
                    {checkRun.editorialNoticesCount}
                  </span>
                </div>

                <div className={`border rounded-xl p-3.5 ${checkRun.contrastingCount > 0 ? 'bg-amber-50/60 border-amber-200 text-amber-900' : 'bg-stone-50 border-stone-200 text-stone-900'}`}>
                  <span className="text-[11px] font-semibold uppercase tracking-wider block">
                    Contrasted Density
                  </span>
                  <span className="text-xl font-bold font-serif-scholarly mt-1 block">
                    {checkRun.contrastingCount}
                  </span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilterIssuesOnly(prev => !prev)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                      filterIssuesOnly 
                        ? 'bg-rose-800 text-white border-rose-800' 
                        : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Flagged Issues Only ({checkRun.retractionsCount + checkRun.editorialNoticesCount + checkRun.contrastingCount})</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyMarkdown}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-lg border border-stone-300 flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Table'}</span>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Results Table */}
              <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 uppercase font-semibold text-[10px] tracking-wider sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3.5">Reference Title</th>
                        <th className="py-2.5 px-3">DOI</th>
                        <th className="py-2.5 px-2 text-center">Supporting</th>
                        <th className="py-2.5 px-2 text-center">Mentioning</th>
                        <th className="py-2.5 px-2 text-center">Contrasting</th>
                        <th className="py-2.5 px-3">Flags / Audit Status</th>
                        <th className="py-2.5 px-2 text-right">Report</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-sans">
                      {displayedResults.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-stone-400">
                            No references match current filter.
                          </td>
                        </tr>
                      ) : (
                        displayedResults.map((row, idx) => {
                          const hasRetraction = (row.retractionsCount || 0) > 0;
                          const hasNotice = (row.editorialNoticesCount || 0) > 0;

                          return (
                            <tr 
                              key={row.referenceId || idx}
                              className={`hover:bg-stone-50/80 transition-colors ${hasRetraction ? 'bg-rose-50/40' : ''}`}
                            >
                              <td className="py-2.5 px-3.5 max-w-xs">
                                <div className="font-semibold text-stone-900 line-clamp-2">
                                  {row.title}
                                </div>
                              </td>

                              <td className="py-2.5 px-3 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                                {row.doi || '—'}
                              </td>

                              <td className="py-2.5 px-2 text-center font-semibold text-emerald-800">
                                {row.tallies?.supporting ?? '—'}
                              </td>

                              <td className="py-2.5 px-2 text-center font-semibold text-stone-700">
                                {row.tallies?.mentioning ?? '—'}
                              </td>

                              <td className="py-2.5 px-2 text-center font-semibold text-amber-800">
                                {row.tallies?.contradicting ?? '—'}
                              </td>

                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {hasRetraction && (
                                    <span className="px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-300 rounded font-bold text-[10px] uppercase inline-flex items-center gap-1">
                                      <ShieldAlert className="w-3 h-3 text-rose-700" />
                                      Retracted
                                    </span>
                                  )}

                                  {hasNotice && !hasRetraction && (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded font-bold text-[10px] uppercase inline-flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3 text-amber-700" />
                                      Notice
                                    </span>
                                  )}

                                  {row.hasContrastingAlert && (
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded text-[10px] font-semibold">
                                      Contrasted ({row.tallies?.contradicting})
                                    </span>
                                  )}

                                  {!hasRetraction && !hasNotice && !row.hasContrastingAlert && (
                                    <span className="text-stone-400 text-[11px]">
                                      {row.status === 'evidence_available' ? 'Verified' : 'Unindexed'}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-2.5 px-2 text-right">
                                {row.doi && (
                                  <a
                                    href={`https://scite.ai/reports/${encodeURIComponent(row.doi)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 text-stone-400 hover:text-emerald-800 inline-block transition-colors"
                                    title="Open Scite report"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <span>Scite Reference Check API with automated retraction & notice screening.</span>
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
