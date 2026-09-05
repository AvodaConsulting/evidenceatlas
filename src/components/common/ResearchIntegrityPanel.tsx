import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, AlertCircle, Sparkles, Network, Scale } from 'lucide-react';

export const ResearchIntegrityPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white/90 backdrop-blur-xs border border-amber-200/90 rounded-lg p-3.5 my-3 shadow-xs transition-all">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center space-x-2.5">
          <div className="w-5 h-5 bg-amber-400 rounded-sm flex items-center justify-center text-[10px] text-white font-bold shadow-xs">
            !
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-tight text-amber-900 flex items-center gap-2">
              Research Integrity & Epistemic Calibration
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                Active Protocol
              </span>
            </h4>
            <p className="text-[11px] text-slate-600">
              Mandatory epistemic principles governing literature synthesis and citation interpretations.
            </p>
          </div>
        </div>
        <button 
          type="button"
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          aria-label={isOpen ? "Collapse panel" : "Expand panel"}
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-2.5 pt-2.5 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] text-slate-700">
          <div className="flex items-start space-x-2 bg-amber-50/50 p-2 rounded border border-amber-200/50">
            <Scale className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-slate-800 block">Citation Signal:</span>
              Citation counts are discovery signals, not measures of truth or quality.
            </div>
          </div>

          <div className="flex items-start space-x-2 bg-amber-50/50 p-2 rounded border border-amber-200/50">
            <AlertCircle className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-slate-800 block">Coverage:</span>
              Missing results may reflect incomplete database coverage.
            </div>
          </div>

          <div className="flex items-start space-x-2 bg-amber-50/50 p-2 rounded border border-amber-200/50">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-slate-800 block">Attribution:</span>
              AI-generated summaries must be traceable to returned sources.
            </div>
          </div>

          <div className="flex items-start space-x-2 bg-amber-50/50 p-2 rounded border border-amber-200/50">
            <Network className="w-3.5 h-3.5 text-slate-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-slate-800 block">Topology:</span>
              An empty region on a citation map is not proof of a research gap.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
