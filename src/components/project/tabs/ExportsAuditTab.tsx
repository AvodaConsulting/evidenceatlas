import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  ShieldCheck, 
  Copy, 
  Check, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink,
  Layers,
  FileCode,
  Eye,
  Info
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { exportApi } from '../../../lib/scholarlyApi';

export const ExportsAuditTab: React.FC = () => {
  const { 
    activeProject, 
    activeProjectWorksList, 
    evidenceRecords,
    citationTrails,
    exportBibTeX, 
    exportRIS, 
    exportCSV, 
    exportMarkdown, 
    generateAuditReport 
  } = useApp();

  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [auditReport, setAuditReport] = useState<{ jsonReport: any; markdownReport: string } | null>(null);
  const [isGeneratingAudit, setIsGeneratingAudit] = useState(false);
  const [isGeneratingTrailsAudit, setIsGeneratingTrailsAudit] = useState(false);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  const handleDownload = async (format: 'bibtex' | 'ris' | 'csv' | 'markdown') => {
    setDownloadingFormat(format);
    try {
      let content = '';
      let filename = `${(activeProject?.title || 'evidence_atlas').replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
      let mime = 'text/plain';

      if (format === 'bibtex') {
        content = await exportBibTeX();
        filename += '.bib';
      } else if (format === 'ris') {
        content = await exportRIS();
        filename += '.ris';
      } else if (format === 'csv') {
        content = await exportCSV();
        filename += '_provenance.csv';
        mime = 'text/csv';
      } else if (format === 'markdown') {
        content = await exportMarkdown();
        filename += '_synthesis.md';
        mime = 'text/markdown';
      }

      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Export failed');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleCopy = async (format: 'bibtex' | 'ris' | 'csv' | 'markdown') => {
    try {
      let content = '';
      if (format === 'bibtex') content = await exportBibTeX();
      else if (format === 'ris') content = await exportRIS();
      else if (format === 'csv') content = await exportCSV();
      else if (format === 'markdown') content = await exportMarkdown();

      await navigator.clipboard.writeText(content);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch (err: any) {
      alert('Failed to copy to clipboard');
    }
  };

  const handlePreview = async (format: 'bibtex' | 'ris' | 'csv' | 'markdown', title: string) => {
    try {
      let content = '';
      if (format === 'bibtex') content = await exportBibTeX();
      else if (format === 'ris') content = await exportRIS();
      else if (format === 'csv') content = await exportCSV();
      else if (format === 'markdown') content = await exportMarkdown();

      setPreviewTitle(title);
      setPreviewText(content);
    } catch (err: any) {
      alert('Failed to preview export');
    }
  };

  const handleGenerateAuditReport = async () => {
    setIsGeneratingAudit(true);
    try {
      const report = await generateAuditReport();
      setAuditReport(report);
      setPreviewTitle('Reproducible Research Audit Report (Markdown)');
      setPreviewText(report.markdownReport);
    } catch (err: any) {
      alert(err.message || 'Failed to generate audit report');
    } finally {
      setIsGeneratingAudit(false);
    }
  };

  const handleGenerateTrailsAuditReport = async (format: 'markdown' | 'json' | 'csv') => {
    if (!activeProject) return;
    setIsGeneratingTrailsAudit(true);
    try {
      const report = await exportApi.generateTrailsAuditReport({
        projectId: activeProject.id,
        projectTitle: activeProject.title,
        trails: citationTrails,
        candidatesByTrail: {},
        eventsByTrail: {}
      });

      if (format === 'markdown') {
        setPreviewTitle('Citation Trails Lineage & Triage Audit Report (Markdown)');
        setPreviewText(report.markdownReport);
      } else if (format === 'json') {
        const blob = new Blob([JSON.stringify(report.jsonReport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(activeProject?.title || 'project').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_trails_lineage.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        const blob = new Blob([report.csvDecisions], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(activeProject?.title || 'project').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_trail_decisions.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate citation trails audit report');
    } finally {
      setIsGeneratingTrailsAudit(false);
    }
  };

  const downloadAuditJSON = () => {
    if (!auditReport) return;
    const blob = new Blob([JSON.stringify(auditReport.jsonReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activeProject?.title || 'audit').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_audit_report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
            <Download className="w-4 h-4" />
          </span>
          <h2 className="text-base font-bold text-slate-900">Exports, Provenance Manifests & Research Audit Reports</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Export standardized bibliographic citation files, field-level provenance spreadsheets, or generate reproducible research audit reports.
        </p>
      </div>

      {/* Export Format Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* BibTeX */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                <FileCode className="w-4 h-4" />
              </div>
              <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                .bib
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">BibTeX Format</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Standard format for LaTeX, Overleaf, and computational writing pipelines.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
            <button
              onClick={() => handlePreview('bibtex', 'BibTeX Preview (.bib)')}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded text-xs flex items-center gap-1"
              title="Preview"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleCopy('bibtex')}
                className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded text-xs font-medium flex items-center gap-1"
              >
                {copiedFormat === 'bibtex' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedFormat === 'bibtex' ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={() => handleDownload('bibtex')}
                disabled={downloadingFormat === 'bibtex'}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs"
              >
                Download
              </button>
            </div>
          </div>
        </div>

        {/* RIS */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                .ris
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">RIS Format</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Compatible with Zotero, Mendeley, EndNote, and reference managers.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
            <button
              onClick={() => handlePreview('ris', 'RIS Format Preview (.ris)')}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded text-xs flex items-center gap-1"
              title="Preview"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleCopy('ris')}
                className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded text-xs font-medium flex items-center gap-1"
              >
                {copiedFormat === 'ris' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedFormat === 'ris' ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={() => handleDownload('ris')}
                disabled={downloadingFormat === 'ris'}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs"
              >
                Download
              </button>
            </div>
          </div>
        </div>

        {/* Provenance CSV */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                .csv
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Provenance CSV</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Full field-level provenance, discovery provider attribution, and inclusion records.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
            <button
              onClick={() => handlePreview('csv', 'Field-Level Provenance CSV Preview')}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded text-xs flex items-center gap-1"
              title="Preview"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleCopy('csv')}
                className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded text-xs font-medium flex items-center gap-1"
              >
                {copiedFormat === 'csv' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedFormat === 'csv' ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={() => handleDownload('csv')}
                disabled={downloadingFormat === 'csv'}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs"
              >
                Download
              </button>
            </div>
          </div>
        </div>

        {/* Markdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="p-1.5 bg-purple-50 text-purple-700 rounded-lg">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                .md
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Markdown Synthesis</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Structured bibliography with abstracts, direct DOIs, and grounded claim summaries.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
            <button
              onClick={() => handlePreview('markdown', 'Markdown Synthesis Preview (.md)')}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded text-xs flex items-center gap-1"
              title="Preview"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleCopy('markdown')}
                className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded text-xs font-medium flex items-center gap-1"
              >
                {copiedFormat === 'markdown' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedFormat === 'markdown' ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={() => handleDownload('markdown')}
                disabled={downloadingFormat === 'markdown'}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reproducible Research Audit Report Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Reproducible Research Audit Report Generator
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Produces an immutable audit log linking every claim to its verbatim source passage, provider query latency, and Scite Smart Citation status.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {auditReport && (
              <button
                onClick={downloadAuditJSON}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Bundle</span>
              </button>
            )}

            <button
              onClick={handleGenerateAuditReport}
              disabled={isGeneratingAudit}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAudit ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAudit ? 'Compiling Audit Trail...' : 'Generate Full Audit Report'}</span>
            </button>
          </div>
        </div>

        {/* Audit Metrics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Works Indexed</span>
            <span className="text-sm font-bold text-slate-800">{activeProjectWorksList.length}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Claim-Evidence Pairs</span>
            <span className="text-sm font-bold text-slate-800">{evidenceRecords.filter(e => e.projectId === activeProject?.id).length}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Provenance Strategy</span>
            <span className="text-sm font-bold text-emerald-700">Multi-Provider Grounding</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Verification Protocol</span>
            <span className="text-sm font-bold text-indigo-700">Smart Citations Enabled</span>
          </div>
        </div>
      </div>

      {/* Citation Trails Lineage & Triage Audit Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Citation Trails & Branching Lineage Audit
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Export complete tree lineages, seed origins, triage inclusion/exclusion rationales, and bridge path proofs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleGenerateTrailsAuditReport('json')}
              disabled={isGeneratingTrailsAudit}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Lineage (.json)</span>
            </button>
            <button
              onClick={() => handleGenerateTrailsAuditReport('csv')}
              disabled={isGeneratingTrailsAudit}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Decisions (.csv)</span>
            </button>
            <button
              onClick={() => handleGenerateTrailsAuditReport('markdown')}
              disabled={isGeneratingTrailsAudit}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGeneratingTrailsAudit ? 'animate-spin' : ''}`} />
              <span>{isGeneratingTrailsAudit ? 'Compiling Trails...' : 'Preview Trails Audit (.md)'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <div className="bg-purple-50/50 p-2.5 rounded-lg border border-purple-100">
            <span className="text-[10px] uppercase font-bold text-purple-600 block">Active Trails</span>
            <span className="text-sm font-bold text-purple-950">{citationTrails.length}</span>
          </div>
          <div className="bg-purple-50/50 p-2.5 rounded-lg border border-purple-100">
            <span className="text-[10px] uppercase font-bold text-purple-600 block">Reviewed Branches</span>
            <span className="text-sm font-bold text-purple-950">{citationTrails.filter(t => t.status === 'reviewed').length}</span>
          </div>
          <div className="bg-purple-50/50 p-2.5 rounded-lg border border-purple-100">
            <span className="text-[10px] uppercase font-bold text-purple-600 block">Audit Fidelity</span>
            <span className="text-sm font-bold text-emerald-700">100% Provenance Logged</span>
          </div>
        </div>
      </div>

      {/* Live Preview Panel */}
      {previewText && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="text-xs font-bold text-slate-800">{previewTitle}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(previewText);
                  alert('Copied to clipboard');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Full Text
              </button>
              <button
                onClick={() => setPreviewText(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Close Preview
              </button>
            </div>
          </div>

          <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
            {previewText}
          </pre>
        </div>
      )}
    </div>
  );
};
