import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  BookOpen, 
  Trash2, 
  ShieldCheck, 
  MessageSquare, 
  ExternalLink, 
  Sparkles, 
  Filter, 
  Download,
  AlertCircle,
  FileText
} from 'lucide-react';
import { StudyQueueItem, Work } from '../../types';
import { useApp } from '../../context/AppContext';
import { AddEvidenceModal } from '../modals/AddEvidenceModal';
import { ReadingPromptModal } from '../discovery/ReadingPromptModal';

interface StudyQueueViewProps {
  onOpenWorkInLibrary?: (workId: string) => void;
}

export const StudyQueueView: React.FC<StudyQueueViewProps> = ({ onOpenWorkInLibrary }) => {
  const { 
    studyQueue, 
    removeFromStudyQueue, 
    updateStudyQueueItem,
    activeProject,
    permissions
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [selectedWorkIdForEvidence, setSelectedWorkIdForEvidence] = useState<string | undefined>(undefined);
  const [selectedPromptWork, setSelectedPromptWork] = useState<Work | null>(null);

  const projectQueue = studyQueue.filter(item => !activeProject || item.projectId === activeProject.id);

  const filteredQueue = projectQueue.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
    return true;
  });

  const handleStatusChange = (itemId: string, status: StudyQueueItem['status']) => {
    updateStudyQueueItem(itemId, { status });
  };

  const handlePriorityChange = (itemId: string, priority: StudyQueueItem['priority']) => {
    updateStudyQueueItem(itemId, { priority });
  };

  const handleOpenEvidence = (workId: string) => {
    setSelectedWorkIdForEvidence(workId);
    setEvidenceModalOpen(true);
  };

  const exportQueueMarkdown = () => {
    const md = [
      `# Study Queue: ${activeProject?.title || 'Project Literature'}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      `Total items: ${filteredQueue.length}`,
      '',
      ...filteredQueue.map((item, idx) => (
        `### ${idx + 1}. ${item.work?.title || 'Untitled Work'} (${item.work?.year || 'N/A'})\n` +
        `- **Authors**: ${(item.work?.authors || []).map(a => a?.name || '').join(', ') || 'Unknown Authors'}\n` +
        `- **Status**: ${item.status} | **Priority**: ${item.priority}\n` +
        `- **Source Trail**: ${item.sourceTrailTitle || 'Direct Discovery'}\n` +
        (item.notes ? `- **Reading Notes**: ${item.notes}\n` : '') +
        (item.work?.doi ? `- **DOI**: https://doi.org/${item.work.doi}\n` : '') +
        '\n'
      ))
    ].join('\n');

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudyQueue_${activeProject?.id || 'export'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold font-serif-scholarly text-slate-900">
              Researcher Study Queue
            </h2>
            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-900 font-bold rounded-full">
              {projectQueue.length} queued
            </span>
          </div>
          <p className="text-xs text-slate-500 font-serif-scholarly mt-0.5">
            Dedicated queue for in-depth analytical reading and structured evidence extraction.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Reading</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed Reading</option>
            <option value="extracted_evidence">Evidence Extracted</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-700"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Export Queue button */}
          <button
            onClick={exportQueueMarkdown}
            disabled={filteredQueue.length === 0}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Reading List</span>
          </button>
        </div>
      </div>

      {/* Queue Items List */}
      {filteredQueue.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
          <Clock className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 font-serif-scholarly">
            No papers in Study Queue matching filters
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            When exploring Citation Trails or Discover candidates, click "Queue" to mark high-priority papers for thorough close reading.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQueue.map((item, idx) => {
            const { work } = item;
            return (
              <div
                key={`${item.id}-${idx}`}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-2xs space-y-3 transition-all"
              >
                <div className="flex flex-col md:flex-row items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    {/* Top tags */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.priority === 'high'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : item.priority === 'medium'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {item.priority} Priority
                      </span>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'completed' || item.status === 'extracted_evidence'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {(item.status || 'queued').replace('_', ' ').toUpperCase()}
                      </span>

                      <span className="text-slate-400 font-mono text-[11px]">
                        {work.year || 'Unknown Year'}
                      </span>

                      {item.sourceTrailTitle && (
                        <span className="text-slate-500 text-[11px] italic">
                          From: {item.sourceTrailTitle}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold font-serif-scholarly text-slate-900 leading-snug">
                      {work.title}
                    </h3>

                    {/* Authors */}
                    <p className="text-xs text-slate-600 font-serif-scholarly italic">
                      {(work.authors || []).map(a => a?.name || '').join(', ') || 'Unknown Authors'}
                    </p>

                    {/* Reading Notes */}
                    {item.notes && (
                      <div className="bg-amber-50/70 border border-amber-100 rounded-lg p-2 text-xs text-amber-950 font-serif-scholarly">
                        <span className="font-bold text-amber-900 mr-1">Analytical Goal:</span>
                        {item.notes}
                      </div>
                    )}
                  </div>

                  {/* Right side status / action buttons */}
                  <div className="flex flex-wrap md:flex-col items-center md:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                        className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700 font-medium"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="extracted_evidence">Evidence Extracted</option>
                      </select>

                      <select
                        value={item.priority}
                        onChange={(e) => handlePriorityChange(item.id, e.target.value as any)}
                        className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700 font-medium"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedPromptWork(work)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Generate grounded reading protocol"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>AI Protocol</span>
                      </button>

                      <button
                        onClick={() => handleOpenEvidence(work.id)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Ground claims into Evidence Matrix"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Add Evidence</span>
                      </button>

                      <button
                        onClick={() => removeFromStudyQueue(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grounded Reading Protocol Modal */}
      {selectedPromptWork && (
        <ReadingPromptModal
          isOpen={!!selectedPromptWork}
          onClose={() => setSelectedPromptWork(null)}
          work={selectedPromptWork}
          onExtractEvidence={handleOpenEvidence}
        />
      )}

      {/* Add Evidence Modal */}
      {evidenceModalOpen && (
        <AddEvidenceModal
          isOpen={evidenceModalOpen}
          onClose={() => {
            setEvidenceModalOpen(false);
            setSelectedWorkIdForEvidence(undefined);
          }}
          preselectedWorkId={selectedWorkIdForEvidence}
        />
      )}
    </div>
  );
};
