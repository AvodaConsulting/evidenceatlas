import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ImportPapersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportPapersModal: React.FC<ImportPapersModalProps> = ({ isOpen, onClose }) => {
  const { importBibtexOrRis, showToast } = useApp();

  const [importContent, setImportContent] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) setImportContent(text);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importContent.trim()) return;

    try {
      setIsImporting(true);
      setError(null);
      const res = await importBibtexOrRis(importContent);
      setSuccessCount(res.totalImported);
      showToast(`Successfully imported ${res.totalImported} papers into your project.`);
      setTimeout(() => {
        onClose();
        setSuccessCount(null);
        setImportContent('');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to parse and import citations.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Import Papers</h2>
              <p className="text-xs text-slate-500">Zotero, Mendeley, RIS, or BibTeX files</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successCount !== null && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Imported {successCount} papers into your project.</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Upload a .bib, .ris, or text citation export
            </label>
            <input
              type="file"
              accept=".bib,.ris,.txt"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Or paste BibTeX / RIS directly:
            </label>
            <textarea
              rows={8}
              value={importContent}
              onChange={(e) => setImportContent(e.target.value)}
              placeholder={`@article{vaswani2017attention,\n  title={Attention is all you need},\n  author={Vaswani, Ashish and others},\n  year={2017},\n  doi={10.48550/arXiv.1706.03762}\n}`}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isImporting || !importContent.trim()}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            {isImporting ? 'Importing...' : 'Import Papers'}
          </button>
        </div>
      </div>
    </div>
  );
};
