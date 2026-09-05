import React from 'react';
import { 
  X, 
  Search, 
  ArrowDown, 
  Compass, 
  BookOpen, 
  Network, 
  Clock, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface HelpExplorationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartExploring?: () => void;
}

export const HelpExplorationModal: React.FC<HelpExplorationModalProps> = ({
  isOpen,
  onClose,
  onStartExploring
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 id="help-modal-title" className="text-base font-bold font-serif-scholarly text-slate-900">
                How do I explore papers?
              </h2>
              <p className="text-[11px] text-slate-500">
                A simple visual guide to discovering research
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visual 4-Step Diagram */}
        <div className="p-6 space-y-3 bg-white">
          {/* Step 1 */}
          <div className="flex items-start gap-3 p-3 bg-indigo-50/50 border border-indigo-100/80 rounded-xl">
            <div className="w-7 h-7 bg-indigo-600 text-white font-bold text-xs rounded-full flex items-center justify-center shrink-0 shadow-xs">
              1
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-indigo-600" />
                <span>Find a paper</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Search by title, DOI, author, or keyword to find a solid starting point.
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center text-slate-300">
            <ArrowDown className="w-4 h-4" />
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 p-3 bg-indigo-50/50 border border-indigo-100/80 rounded-xl">
            <div className="w-7 h-7 bg-indigo-600 text-white font-bold text-xs rounded-full flex items-center justify-center shrink-0 shadow-xs">
              2
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-600" />
                <span>Choose earlier work, later work, or similar papers</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Inspect what this paper cites, papers that cited it afterward, or related work.
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center text-slate-300">
            <ArrowDown className="w-4 h-4" />
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 p-3 bg-indigo-50/50 border border-indigo-100/80 rounded-xl">
            <div className="w-7 h-7 bg-indigo-600 text-white font-bold text-xs rounded-full flex items-center justify-center shrink-0 shadow-xs">
              3
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Add useful papers to My Papers</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Save papers that matter to your project library with one click.
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center text-slate-300">
            <ArrowDown className="w-4 h-4" />
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-3 p-3 bg-indigo-50/50 border border-indigo-100/80 rounded-xl">
            <div className="w-7 h-7 bg-indigo-600 text-white font-bold text-xs rounded-full flex items-center justify-center shrink-0 shadow-xs">
              4
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-indigo-600" />
                <span>Use Read Next and See connections when helpful</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Queue items for focused study and visualize connections between your saved papers.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Click any paper to begin exploring.
          </span>
          <button
            onClick={() => {
              onClose();
              onStartExploring?.();
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            Start Exploring
          </button>
        </div>
      </div>
    </div>
  );
};
