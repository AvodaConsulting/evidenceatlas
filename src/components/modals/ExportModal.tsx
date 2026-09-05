import React, { useState } from 'react';
import { X, Download, FileCode, FileSpreadsheet, Check, Copy } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { activeProject, activeProjectWorksList, searches, evidenceRecords } = useApp();
  const [exportType, setExportType] = useState<'bibtex' | 'ris' | 'csv' | 'prisma'>('bibtex');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const includedWorks = activeProjectWorksList
    .filter(pw => pw.inclusionStatus === 'included')
    .map(pw => pw.work);

  const worksToExport = includedWorks.length > 0 ? includedWorks : activeProjectWorksList.map(pw => pw.work);

  const generateBibTeX = () => {
    return worksToExport.map(w => {
      const firstAuthor = w.authors?.[0]?.name?.split(' ')?.pop()?.toLowerCase() || 'author';
      const citeKey = `${firstAuthor}${w.year || 'nd'}_${w.id.substring(0, 5)}`;
      const authorsStr = w.authors.map(a => a.name).join(' and ');
      let entryType = 'article';
      if (w.type === 'book') entryType = 'book';
      if (w.type === 'book-chapter') entryType = 'incollection';
      if (w.type === 'conference-paper') entryType = 'inproceedings';

      return `@${entryType}{${citeKey},
  title = {${w.title}},
  author = {${authorsStr}},
  year = {${w.year}},
  journal = {${w.venue || ''}},
  doi = {${w.doi || ''}},
  url = {${w.openAccessUrl || w.sourceUrl || ''}},
  note = {Retrieved with provenance via Evidence Atlas}
}`;
    }).join('\n\n');
  };

  const generateRIS = () => {
    return worksToExport.map(w => {
      let ty = 'JOUR';
      if (w.type === 'book') ty = 'BOOK';
      if (w.type === 'book-chapter') ty = 'CHAP';
      if (w.type === 'conference-paper') ty = 'CONF';

      const lines = [
        `TY  - ${ty}`,
        `TI  - ${w.title}`,
        ...w.authors.map(a => `AU  - ${a.name}`),
        `PY  - ${w.year}`,
        `JO  - ${w.venue || ''}`,
        `DO  - ${w.doi || ''}`,
        `UR  - ${w.openAccessUrl || w.sourceUrl || ''}`,
        `AB  - ${w.abstract ? w.abstract.replace(/\n/g, ' ') : ''}`,
        'ER  - '
      ];
      return lines.join('\n');
    }).join('\n\n');
  };

  const generateCSV = () => {
    const headers = ['ID', 'Title', 'Authors', 'Year', 'Venue', 'Type', 'DOI', 'CitationCount', 'InclusionStatus', 'ReadStatus', 'ProvenanceProvider'];
    const rows = activeProjectWorksList.map(pw => [
      `"${pw.work.id}"`,
      `"${pw.work.title.replace(/"/g, '""')}"`,
      `"${pw.work.authors.map(a => a.name).join('; ')}"`,
      pw.work.year,
      `"${(pw.work.venue || '').replace(/"/g, '""')}"`,
      pw.work.type,
      `"${pw.work.doi || ''}"`,
      pw.work.citationCount,
      pw.inclusionStatus,
      pw.readStatus,
      `"${pw.work.provenance.provider}"`
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const generatePRISMALog = () => {
    const projectSearches = searches.filter(s => s.projectId === activeProject?.id);
    return `# PRISMA 2020 Systematic Search Audit Log
Project: ${activeProject?.title}
Research Question: ${activeProject?.researchQuestion}
Date of Export: ${new Date().toISOString()}

## Search Queries Executed (${projectSearches.length})
${projectSearches.map((s, idx) => `
### Search #${idx + 1}: "${s.queryText}"
- Timestamp: ${s.executedAt}
- Executed By: ${s.executedByEmail}
- Providers Queried: ${s.providersQueried.join(', ')}
- Total Candidates Retrieved: ${s.candidateCount}
- Status by Provider: ${s.providerStatuses.map(p => `${p.provider} (${p.status}, ${p.latencyMs}ms)`).join('; ')}
`).join('\n')}

## Inclusion / Exclusion Summary
- Total Identified: ${activeProjectWorksList.length}
- Included in Synthesis: ${activeProjectWorksList.filter(w => w.inclusionStatus === 'included').length}
- Candidate: ${activeProjectWorksList.filter(w => w.inclusionStatus === 'candidate').length}
- Excluded: ${activeProjectWorksList.filter(w => w.inclusionStatus === 'excluded').length}
- Grounded Evidence Records: ${evidenceRecords.filter(e => e.projectId === activeProject?.id).length}
`;
  };

  const getContent = () => {
    switch (exportType) {
      case 'bibtex': return generateBibTeX();
      case 'ris': return generateRIS();
      case 'csv': return generateCSV();
      case 'prisma': return generatePRISMALog();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = getContent();
    const exts = { bibtex: 'bib', ris: 'ris', csv: 'csv', prisma: 'md' };
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `evidence_atlas_${activeProject?.id || 'export'}.${exts[exportType]}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif-scholarly text-stone-900">
                Export Literature & Search Data
              </h2>
              <p className="text-xs text-stone-500">
                BibTeX, RIS citation formats, CSV matrices, and PRISMA search logs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex gap-2 border-b border-stone-200 pb-3">
            <button
              onClick={() => setExportType('bibtex')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                exportType === 'bibtex'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              BibTeX (.bib)
            </button>
            <button
              onClick={() => setExportType('ris')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                exportType === 'ris'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              RIS (.ris)
            </button>
            <button
              onClick={() => setExportType('csv')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                exportType === 'csv'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              CSV Matrix (.csv)
            </button>
            <button
              onClick={() => setExportType('prisma')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                exportType === 'prisma'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <FileTextIcon className="w-3.5 h-3.5" />
              PRISMA Search Audit
            </button>
          </div>

          <div className="relative">
            <pre className="w-full h-64 p-3 bg-stone-900 text-stone-100 rounded-xl text-xs font-mono overflow-auto leading-relaxed selection:bg-emerald-600">
              {getContent()}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-stone-200 bg-stone-50/80 flex justify-between items-center">
          <span className="text-xs text-stone-500">
            Exporting {worksToExport.length} scholarly works with field-level provenance
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-800 text-xs font-medium rounded-lg hover:bg-stone-100 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Download File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function FileTextIcon(props: any) {
  return <FileCode {...props} />;
}
