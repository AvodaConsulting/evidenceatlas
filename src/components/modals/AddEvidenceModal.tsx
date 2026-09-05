import React, { useState } from 'react';
import { X, ShieldCheck, Quote, BookOpen, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupportStrength, VerificationStatus } from '../../types';

interface AddEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultWorkId?: string;
}

export const AddEvidenceModal: React.FC<AddEvidenceModalProps> = ({ isOpen, onClose, defaultWorkId }) => {
  const { activeProjectWorksList, createEvidenceRecord } = useApp();

  const [workId, setWorkId] = useState(defaultWorkId || activeProjectWorksList[0]?.workId || '');
  const [claimStatement, setClaimStatement] = useState('');
  const [supportStrength, setSupportStrength] = useState<SupportStrength>('strong');
  const [verbatimPassage, setVerbatimPassage] = useState('');
  const [pageOrSection, setPageOrSection] = useState('');
  const [warrantExplanation, setWarrantExplanation] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('verified');
  const [subClaimCategory, setSubClaimCategory] = useState('Empirical Benchmark');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workId) {
      setError('Please select a source work from your project library.');
      return;
    }
    if (!claimStatement.trim() || !verbatimPassage.trim() || !pageOrSection.trim()) {
      setError('Claim statement, verbatim passage, and page/section reference are mandatory.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await createEvidenceRecord({
        workId,
        claimStatement: claimStatement.trim(),
        supportStrength,
        verbatimPassage: verbatimPassage.trim(),
        pageOrSection: pageOrSection.trim(),
        warrantExplanation: warrantExplanation.trim() || undefined,
        verificationStatus,
        subClaimCategory: subClaimCategory.trim()
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record evidence');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif-scholarly text-stone-900">
                Ground Evidence Record
              </h2>
              <p className="text-xs text-stone-500">
                Bind factual or methodological claim to verbatim scholarly evidence
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

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Source Work *
            </label>
            <select
              required
              value={workId}
              onChange={e => setWorkId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-hidden"
            >
              {activeProjectWorksList.length === 0 ? (
                <option value="">No works in project library</option>
              ) : (
                activeProjectWorksList.map(pw => (
                  <option key={pw.workId} value={pw.workId}>
                    {pw.work.title} ({pw.work.authors[0]?.name || 'Unknown'}, {pw.work.year})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Support Strength *
              </label>
              <select
                value={supportStrength}
                onChange={e => setSupportStrength(e.target.value as SupportStrength)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 outline-hidden"
              >
                <option value="strong">Strong (2+ independent replicated sources)</option>
                <option value="moderate">Moderate (1 credible peer-reviewed source)</option>
                <option value="weak">Weak (Preliminary preprint or single study)</option>
                <option value="contested">Contested (Sources actively dispute claim)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Verification Protocol Status *
              </label>
              <select
                value={verificationStatus}
                onChange={e => setVerificationStatus(e.target.value as VerificationStatus)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 outline-hidden"
              >
                <option value="verified">Verified against source passage</option>
                <option value="verify_before_citing">[VERIFY BEFORE CITING] Pending</option>
                <option value="needs_source">[NEEDS SOURCE] Gap flagged</option>
                <option value="author_inference">[AUTHOR INFERENCE] Reasoning chain</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Sub-Claim Category
            </label>
            <input
              type="text"
              value={subClaimCategory}
              onChange={e => setSubClaimCategory(e.target.value)}
              placeholder="e.g., Capability Evaluation / Emergence Artifacts / Latency Tradeoffs"
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Normalized Claim Statement *
            </label>
            <textarea
              required
              rows={2}
              value={claimStatement}
              onChange={e => setClaimStatement(e.target.value)}
              placeholder="State the specific empirical, theoretical, or methodological assertion..."
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Verbatim Source Passage *</span>
              <span className="text-[11px] font-normal text-stone-500 font-sans">exact text snippet</span>
            </label>
            <div className="relative">
              <Quote className="w-4 h-4 text-stone-400 absolute top-2.5 left-2.5" />
              <textarea
                required
                rows={3}
                value={verbatimPassage}
                onChange={e => setVerbatimPassage(e.target.value)}
                placeholder="Paste the verbatim quotation directly from the published PDF or HTML source..."
                className="w-full pl-8 pr-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 font-serif-scholarly italic focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Exact Page / Section Reference *
              </label>
              <input
                type="text"
                required
                value={pageOrSection}
                onChange={e => setPageOrSection(e.target.value)}
                placeholder="e.g., Section 3.2, Figure 2, p. 4"
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Warrant / Methodological Bridge
              </label>
              <input
                type="text"
                value={warrantExplanation}
                onChange={e => setWarrantExplanation(e.target.value)}
                placeholder="Explain why this passage justifies the claim..."
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 outline-hidden"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-800 text-xs font-medium rounded-lg hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Record Grounded Evidence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
