import React from 'react';
import { X, CheckCircle2, Circle, ArrowRight, ExternalLink, ShieldCheck, Database, Key, BookOpen, Clock } from 'lucide-react';

interface SetupChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupChecklistModal: React.FC<SetupChecklistModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const checklistItems = [
    {
      phase: 'Phase 1: Core Foundation & Authorization',
      status: 'completed',
      title: 'Normalized Scholarly Domain Model & RBAC',
      desc: 'Implemented typed Work schema (DOIs, OpenAlex/Semantic Scholar IDs, Provenance, Citation counts, field-level provenance) and strict role enforcement (Owner, Editor, Commenter, Viewer, Non-Member denial).',
      icon: ShieldCheck
    },
    {
      phase: 'Phase 1: Core Foundation & Authorization',
      status: 'completed',
      title: 'Cytoscape.js Citation Network & Physics Layouts',
      desc: 'Interactive graph visualization with force-directed COSE, concentric, hierarchical breadthfirst, and circle layouts, node scaling by citations, and interactive inspection drawers.',
      icon: BookOpen
    },
    {
      phase: 'Phase 1: Core Foundation & Authorization',
      status: 'completed',
      title: 'Claim-Evidence Matrix & Audit Logging',
      desc: 'Structured evidence synthesis with support strength (strong, moderate, weak, contested), verbatim passages, warrant reasoning, and immutable audit logs.',
      icon: Database
    },
    {
      phase: 'Phase 2: Provider Integrations (Next Phase)',
      status: 'pending',
      title: 'OpenAlex Polite Pool Configuration',
      desc: 'Provide authorized contact email in Workspace Settings -> Provider Access to route requests through the OpenAlex high-speed polite API tier (100k requests/day).',
      icon: Key
    },
    {
      phase: 'Phase 2: Provider Integrations (Next Phase)',
      status: 'pending',
      title: 'Crossref Works API & DOI Resolver',
      desc: 'Connect server-side Crossref API proxy for resolving real DOIs into normalized metadata without client-side key leakage.',
      icon: ExternalLink
    },
    {
      phase: 'Phase 2: Provider Integrations (Next Phase)',
      status: 'pending',
      title: 'Semantic Scholar Graph & Scite Smart Citations',
      desc: 'Add optional SEMANTIC_SCHOLAR_API_KEY and SCITE_API_KEY in server environment for automated citation intent classifications (supporting vs disputing).',
      icon: Key
    },
    {
      phase: 'Phase 3: Automated Monitoring & Continuous Review',
      status: 'pending',
      title: 'Automated Literature Feed Monitor (Cron)',
      desc: 'Configure daily/weekly scheduled queries to discover new preprint publications matching project research questions.',
      icon: Clock
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                Setup Checklist
              </span>
              <span className="text-xs text-stone-500">Integration Roadmap</span>
            </div>
            <h2 className="text-lg font-bold font-serif-scholarly text-stone-900 mt-1">
              Evidence Atlas Deployment & Next Phase Readiness
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <p className="text-xs text-stone-600 leading-relaxed bg-amber-50/80 border border-amber-200/80 p-3 rounded-lg">
            <strong>Production Guardrail Notice:</strong> Evidence Atlas strictly enforces authorized provider API integration and zero-scraping rules. Scholarly metadata is retrieved exclusively through documented REST endpoints with complete provenance tracking.
          </p>

          <div className="space-y-3">
            {checklistItems.map((item, idx) => (
              <div 
                key={idx} 
                className={`p-3.5 rounded-xl border transition-all ${
                  item.status === 'completed' 
                    ? 'bg-emerald-50/30 border-emerald-200/60' 
                    : 'bg-stone-50/50 border-stone-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {item.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-stone-900">
                        {item.title}
                      </h4>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        item.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-700'
                      }`}>
                        {item.status === 'completed' ? 'Implemented' : 'Ready to Connect'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-stone-200 bg-stone-50/80 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            Got it, Continue Research
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
