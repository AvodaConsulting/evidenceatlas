import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  Tag as TagIcon, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  BookMarked,
  Layers,
  FileSpreadsheet,
  FileCode,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  FileText,
  GitBranch,
  Compass,
  Network
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { InclusionStatus, ReadStatus, Work } from '../../../types';
import { ManualWorkModal } from '../../modals/ManualWorkModal';
import { ExportModal } from '../../modals/ExportModal';
import { AddEvidenceModal } from '../../modals/AddEvidenceModal';
import { SciteTalliesBadge } from '../../evidence/SciteTalliesBadge';
import { SciteStatementsDrawer } from '../../evidence/SciteStatementsDrawer';
import { CreateTrailModal } from '../../trails/CreateTrailModal';

export const LibraryTab: React.FC = () => {
  const { 
    activeProjectWorksList, 
    updateProjectWork, 
    removeWorkFromProject,
    refreshWorkMetadata,
    permissions,
    tags: projectTags,
    createTag,
    sciteVerifications,
    isVerifyingWork,
    verifyWorkWithScite,
    openPaperInExplorer,
    setActiveTab,
    addToStudyQueue,
    showToast
  } = useApp();

  const [searchFilter, setSearchFilter] = useState('');
  const [inclusionFilter, setInclusionFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [evidenceTargetWorkId, setEvidenceTargetWorkId] = useState<string | undefined>(undefined);
  const [refreshingWorkId, setRefreshingWorkId] = useState<string | null>(null);
  const [inspectWork, setInspectWork] = useState<Work | null>(null);
  const [trailModalOpen, setTrailModalOpen] = useState(false);
  const [trailSeedWork, setTrailSeedWork] = useState<Work | null>(null);

  const [drawerWork, setDrawerWork] = useState<Work | null>(null);
  const [statementsDrawerOpen, setStatementsDrawerOpen] = useState(false);

  // Filtered project works
  const filteredWorks = useMemo(() => {
    return activeProjectWorksList.filter(pw => {
      // Search
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        const authorNames = (pw.work?.authors || []).map(a => a?.name || '').join(' ');
        const text = `${pw.work?.title || ''} ${authorNames} ${pw.work?.venue || ''} ${pw.personalNotes || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      // Inclusion
      if (inclusionFilter !== 'all' && pw.inclusionStatus !== inclusionFilter) {
        return false;
      }
      // Read
      if (readFilter !== 'all' && pw.readStatus !== readFilter) {
        return false;
      }
      // Tag
      if (selectedTagFilter !== 'all' && (!pw.tags || !pw.tags.includes(selectedTagFilter))) {
        return false;
      }
      return true;
    });
  }, [activeProjectWorksList, searchFilter, inclusionFilter, readFilter, selectedTagFilter]);

  const handleRefresh = async (workId: string) => {
    try {
      setRefreshingWorkId(workId);
      await refreshWorkMetadata(workId);
    } catch (err: any) {
      console.warn('Failed to refresh work metadata:', err);
    } finally {
      setRefreshingWorkId(null);
    }
  };

  const handleOpenEvidenceModal = (workId: string) => {
    setEvidenceTargetWorkId(workId);
    setEvidenceModalOpen(true);
  };

  return (
    <div className="space-y-3">
      {/* Top Controls & Metrics */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Text search */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute top-2 left-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="Filter library works..."
              className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white outline-hidden"
            />
          </div>

          {/* Inclusion Status Filter */}
          <select
            value={inclusionFilter}
            onChange={e => setInclusionFilter(e.target.value)}
            className="px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 outline-hidden font-medium"
          >
            <option value="all">All Inclusion ({activeProjectWorksList.length})</option>
            <option value="included">Included ({activeProjectWorksList.filter(w => w.inclusionStatus === 'included').length})</option>
            <option value="candidate">Candidate ({activeProjectWorksList.filter(w => w.inclusionStatus === 'candidate').length})</option>
            <option value="excluded">Excluded ({activeProjectWorksList.filter(w => w.inclusionStatus === 'excluded').length})</option>
          </select>

          {/* Read Status Filter */}
          <select
            value={readFilter}
            onChange={e => setReadFilter(e.target.value)}
            className="px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 outline-hidden"
          >
            <option value="all">All Read States</option>
            <option value="unread">Unread</option>
            <option value="reading">Reading</option>
            <option value="completed">Completed</option>
          </select>

          {/* Tag Filter */}
          {projectTags.length > 0 && (
            <select
              value={selectedTagFilter}
              onChange={e => setSelectedTagFilter(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 outline-hidden"
            >
              <option value="all">All Tags</option>
              {projectTags.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-xs text-indigo-600 font-bold' : 'text-slate-500'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded ${viewMode === 'table' ? 'bg-white shadow-xs text-indigo-600 font-bold' : 'text-slate-500'}`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* See Connections Button */}
          {activeProjectWorksList.length >= 2 && (
            <button
              onClick={() => setActiveTab('map')}
              className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 flex items-center gap-1.5 transition-colors shadow-xs"
              title="See connections map between saved papers"
            >
              <Network className="w-3.5 h-3.5 text-indigo-600" />
              <span>See connections</span>
            </button>
          )}

          {/* Manual Add Button */}
          {permissions.canAddWorks && (
            <button
              onClick={() => setManualModalOpen(true)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Work</span>
            </button>
          )}

          {/* Export Button */}
          <button
            onClick={() => setExportModalOpen(true)}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded transition-colors flex items-center gap-1 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Library</span>
          </button>
        </div>
      </div>

      {/* Main Works List */}
      {filteredWorks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold font-serif-scholarly text-slate-800 mb-1">
            No works match current filters
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Adjust your search keywords, clear status filters, or add works from the Discover tab.
          </p>
          {permissions.canAddWorks && (
            <button
              onClick={() => setManualModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Normalized Work Manually
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredWorks.map((pw, idx) => {
            const w = pw.work;
            const isRefreshing = refreshingWorkId === w.id;

            return (
              <div 
                key={`${pw.id}-${idx}`}
                className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  {/* Status & Year Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        pw.inclusionStatus === 'included'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          : pw.inclusionStatus === 'candidate'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {pw.inclusionStatus}
                      </span>
                      
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded capitalize ${
                        pw.readStatus === 'completed'
                          ? 'bg-slate-100 text-slate-800 border border-slate-200'
                          : pw.readStatus === 'reading'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}>
                        {pw.readStatus}
                      </span>

                      {w.conflicts && w.conflicts.length > 0 && (
                        <button
                          onClick={() => setInspectWork(w)}
                          className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5"
                          title="View cross-provider metadata differences"
                        >
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Discrepancies
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRefresh(w.id)}
                        disabled={isRefreshing}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                        title="Re-query OpenAlex and Crossref for updated metadata"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
                      </button>
                      <span className="text-xs text-slate-400 font-mono font-semibold">
                        {w.year}
                      </span>
                    </div>
                  </div>

                  {/* Title & Authors */}
                  <div>
                    <h3 className="text-sm font-bold font-serif-scholarly text-slate-900 leading-snug">
                      {w.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">
                      {(w.authors || []).map(a => a?.name || '').join(', ') || 'Unknown Authors'}
                    </p>
                    {w.venue && (
                      <p className="text-xs text-slate-500 italic mt-0.5">
                        {w.venue}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  {pw.tags && pw.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {pw.tags.map(t => (
                        <span key={t} className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded border border-slate-200 flex items-center gap-1">
                          <TagIcon className="w-2.5 h-2.5 text-slate-500" />
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Personal Research Notes */}
                  {pw.personalNotes && (
                    <div className="bg-amber-50/70 border border-amber-200/70 p-2 rounded text-xs text-slate-800">
                      <span className="font-semibold text-amber-900 block text-[10px] uppercase">Notes:</span>
                      {pw.personalNotes}
                    </div>
                  )}
                </div>

                {/* Scite Smart Citation Verification Section */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  {sciteVerifications[w.id] || (w.doi && sciteVerifications[w.doi]) ? (
                    <SciteTalliesBadge
                      tallies={(sciteVerifications[w.id] || (w.doi ? sciteVerifications[w.doi] : undefined))?.tallies}
                      notices={(sciteVerifications[w.id] || (w.doi ? sciteVerifications[w.doi] : undefined))?.editorialNotices}
                      status={(sciteVerifications[w.id] || (w.doi ? sciteVerifications[w.doi] : undefined))?.status}
                      cached={(sciteVerifications[w.id] || (w.doi ? sciteVerifications[w.doi] : undefined))?.cached}
                      doi={w.doi}
                      onOpenStatements={() => {
                        setDrawerWork(w);
                        setStatementsDrawerOpen(true);
                      }}
                      compact={true}
                    />
                  ) : (
                    <button
                      onClick={() => verifyWorkWithScite(w.id, w.doi)}
                      disabled={!!isVerifyingWork[w.id]}
                      className="text-[11px] text-emerald-800 hover:text-emerald-950 font-semibold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${isVerifyingWork[w.id] ? 'animate-spin' : ''}`} />
                      <span>{isVerifyingWork[w.id] ? 'Verifying...' : 'Verify with Scite'}</span>
                    </button>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-800 text-[11px]">
                      {w.citationCount.toLocaleString()} Citations ({w.citationCountSource || w.provenance.provider})
                    </span>
                    <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                      Provenance: {w.provenance.provider}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-2">
                      {w.doi && (
                        <a
                          href={`https://doi.org/${w.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1"
                          title="Open DOI"
                        >
                          <ExternalLink className="w-3 h-3" />
                          DOI
                        </a>
                      )}
                      {(w.openAccessUrl || w.pdfUrl) && (
                        <a
                          href={w.openAccessUrl || w.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-medium flex items-center gap-1"
                          title="Open Access PDF"
                        >
                          <FileText className="w-3 h-3" />
                          PDF
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openPaperInExplorer(w)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors shadow-xs"
                        title="Explore what this paper cites, what cites it, and similar work"
                      >
                        <Compass className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Explore</span>
                      </button>

                      <button
                        onClick={() => {
                          setTrailSeedWork(w);
                          setTrailModalOpen(true);
                        }}
                        className="p-1 text-slate-500 hover:text-indigo-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Lineage and history"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                      </button>

                      {permissions.canCreateEvidence && (
                        <button
                          onClick={() => handleOpenEvidenceModal(w.id)}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Evidence Check"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {permissions.canRemoveWorks && (
                        <button
                          onClick={() => removeWorkFromProject(pw.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove from My Papers"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                  <th className="p-2.5 pl-3.5">Title & Authors</th>
                  <th className="p-2.5">Year</th>
                  <th className="p-2.5">Inclusion</th>
                  <th className="p-2.5">Read Status</th>
                  <th className="p-2.5">Citations</th>
                  <th className="p-2.5">Provenance</th>
                  <th className="p-2.5 pr-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWorks.map((pw, idx) => {
                  const w = pw.work;
                  return (
                    <tr key={`${pw.id}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-2.5 pl-3.5 max-w-sm">
                        <div className="font-bold text-slate-900 font-serif-scholarly text-xs leading-snug">
                          {w.title}
                        </div>
                        <div className="text-slate-500 text-[11px] truncate">
                          {(w.authors || []).map(a => a?.name || '').join(', ') || 'Unknown Authors'}
                        </div>
                      </td>
                      <td className="p-2.5 font-mono text-slate-600">{w.year}</td>
                      <td className="p-2.5">
                        <select
                          disabled={!permissions.canEditWorks}
                          value={pw.inclusionStatus}
                          onChange={e => updateProjectWork(pw.id, { inclusionStatus: e.target.value as InclusionStatus })}
                          className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-800 font-medium"
                        >
                          <option value="included">Included</option>
                          <option value="candidate">Candidate</option>
                          <option value="excluded">Excluded</option>
                        </select>
                      </td>
                      <td className="p-2.5">
                        <select
                          disabled={!permissions.canEditWorks}
                          value={pw.readStatus}
                          onChange={e => updateProjectWork(pw.id, { readStatus: e.target.value as ReadStatus })}
                          className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-800"
                        >
                          <option value="unread">Unread</option>
                          <option value="reading">Reading</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="p-2.5 font-semibold text-slate-800">
                        {w.citationCount.toLocaleString()}
                      </td>
                      <td className="p-2.5 font-mono text-slate-500 text-[11px]">
                        {w.provenance.provider}
                      </td>
                      <td className="p-2.5 pr-3.5 text-right space-x-1">
                        <button
                          onClick={() => openPaperInExplorer(w)}
                          className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded inline-flex items-center gap-1 transition-colors"
                          title="Explore what this paper cites, what cites it, and similar work"
                        >
                          <Compass className="w-3 h-3 text-indigo-600" />
                          <span>Explore</span>
                        </button>
                        <button
                          onClick={() => {
                            setTrailSeedWork(w);
                            setTrailModalOpen(true);
                          }}
                          className="p-1 text-slate-500 hover:text-indigo-700 hover:bg-slate-100 rounded"
                          title="Lineage and history"
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                        </button>
                        {permissions.canCreateEvidence && (
                          <button
                            onClick={() => handleOpenEvidenceModal(w.id)}
                            className="p-1 text-indigo-700 hover:bg-indigo-50 rounded"
                            title="Ground Evidence"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {permissions.canRemoveWorks && (
                          <button
                            onClick={() => removeWorkFromProject(pw.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Discrepancy Modal */}
      {inspectWork && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 font-serif-scholarly">
                  Cross-Provider Reconciliation Report
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {inspectWork.title}
                </p>
              </div>
              <button
                onClick={() => setInspectWork(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2">
              {inspectWork.conflicts?.map((c, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Field: {c.field}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-1.5 bg-white border border-slate-200 rounded">
                      <span className="font-bold text-indigo-700 block">OpenAlex:</span>
                      <span>{String(c.openAlexValue || 'N/A')}</span>
                    </div>
                    <div className="p-1.5 bg-white border border-slate-200 rounded">
                      <span className="font-bold text-indigo-700 block">Crossref:</span>
                      <span>{String(c.crossrefValue || 'N/A')}</span>
                    </div>
                  </div>
                  <p className="text-slate-500 text-[10px] italic">{c.description}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setInspectWork(null)}
                className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {manualModalOpen && (
        <ManualWorkModal
          isOpen={manualModalOpen}
          onClose={() => setManualModalOpen(false)}
        />
      )}

      {exportModalOpen && (
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
        />
      )}

      {evidenceModalOpen && (
        <AddEvidenceModal
          isOpen={evidenceModalOpen}
          onClose={() => { setEvidenceModalOpen(false); setEvidenceTargetWorkId(undefined); }}
          defaultWorkId={evidenceTargetWorkId}
        />
      )}

      {/* Citation Trail Modal */}
      {trailModalOpen && (
        <CreateTrailModal
          isOpen={trailModalOpen}
          onClose={() => {
            setTrailModalOpen(false);
            setTrailSeedWork(null);
          }}
          preselectedSeeds={trailSeedWork ? [trailSeedWork] : []}
        />
      )}

      {/* Scite Statements Drawer */}
      {drawerWork && (
        <SciteStatementsDrawer
          isOpen={statementsDrawerOpen}
          onClose={() => {
            setStatementsDrawerOpen(false);
            setDrawerWork(null);
          }}
          work={drawerWork}
          statements={(sciteVerifications[drawerWork.id] || (drawerWork.doi ? sciteVerifications[drawerWork.doi] : undefined))?.statements || []}
        />
      )}
    </div>
  );
};
