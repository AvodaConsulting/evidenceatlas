import React, { useEffect, useRef, useState, useMemo } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Layers, 
  ExternalLink, 
  ShieldCheck, 
  BookOpen, 
  FileText, 
  Tag as TagIcon,
  Sparkles,
  Info,
  ChevronRight,
  Camera,
  Filter,
  GitFork,
  ArrowUpRight,
  ArrowDownLeft,
  Database,
  Compass,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Link2
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Work, InclusionStatus, ReadStatus, NetworkExpansionOperation, NetworkExpansionResponse } from '../../../types';
import { AddEvidenceModal } from '../../modals/AddEvidenceModal';
import { scholarlyApi } from '../../../lib/scholarlyApi';

type LayoutName = 'cose' | 'concentric' | 'breadthfirst' | 'circle' | 'grid';

export const MapTab: React.FC = () => {
  const { 
    activeProjectWorksList, 
    updateProjectWork, 
    addWorkToProject,
    saveMapSnapshot,
    permissions,
    activeProject,
    works,
    openPaperInExplorer,
    setActiveTab,
    loadDemonstrationData
  } = useApp();

  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [layoutName, setLayoutName] = useState<LayoutName>('cose');
  const [inclusionFilter, setInclusionFilter] = useState<'all' | 'included' | 'candidate'>('all');
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [activeExpansionOp, setActiveExpansionOp] = useState<NetworkExpansionOperation | null>(null);
  const [expansionMsg, setExpansionMsg] = useState<{ text: string; type: 'success' | 'warn' | 'error' } | null>(null);
  const [showSourceDetails, setShowSourceDetails] = useState(false);

  // Filtered list of works for graph
  const displayedWorks = useMemo(() => {
    return (activeProjectWorksList || []).filter(pw => {
      if (!pw || !pw.work) return false;
      if (inclusionFilter === 'all') return true;
      return pw.inclusionStatus === inclusionFilter;
    });
  }, [activeProjectWorksList, inclusionFilter]);

  const selectedProjectWork = useMemo(() => {
    return (activeProjectWorksList || []).find(pw => pw?.workId === selectedWorkId) || null;
  }, [activeProjectWorksList, selectedWorkId]);

  // Build Cytoscape Elements (Nodes & Directed Citation Edges)
  const elements = useMemo(() => {
    const nodes: any[] = [];
    const edges: any[] = [];
    
    // Build lookup maps for robust edge resolution (id, lowercase OpenAlex ID, lowercase DOI)
    const workMap = new Map<string, Work>();
    const oaMap = new Map<string, string>(); // oaId -> workId
    const doiMap = new Map<string, string>(); // doi -> workId

    displayedWorks.forEach(pw => {
      const w = pw.work;
      if (!w) return;
      workMap.set(w.id, w);
      if (w.openAlexId) {
        const cleanOa = w.openAlexId.replace(/^(https?:\/\/)?openalex\.org\//i, '').toUpperCase();
        oaMap.set(cleanOa, w.id);
      }
      if (w.doi) {
        doiMap.set(w.doi.toLowerCase().trim(), w.id);
      }

      const authors = w.authors || [];
      const firstAuthor = authors[0]?.name?.split(' ').pop() || 'Unknown';
      const label = `${firstAuthor} (${w.year || '?'})\n${(w.title || '').length > 32 ? (w.title || '').substring(0, 30) + '...' : (w.title || '')}`;
      
      // Calculate node size based on citation count (log scale)
      const baseSize = 42;
      const citationBonus = Math.min(48, Math.log10(Math.max(1, w.citationCount)) * 12);
      const nodeSize = baseSize + citationBonus;

      let bgColor = '#4f46e5'; // indigo-600 for included
      let borderColor = '#4338ca';
      if (pw.inclusionStatus === 'candidate') {
        bgColor = '#0284c7'; // sky-600
        borderColor = '#0369a1';
      } else if (pw.inclusionStatus === 'excluded') {
        bgColor = '#e11d48'; // rose-600
        borderColor = '#be123c';
      }

      nodes.push({
        data: {
          id: w.id,
          label,
          fullTitle: w.title,
          year: w.year,
          citationCount: w.citationCount,
          inclusionStatus: pw.inclusionStatus,
          readStatus: pw.readStatus,
          size: nodeSize,
          bgColor,
          borderColor,
          workObj: w,
          projectWorkObj: pw
        }
      });
    });

    // Add directed edges for verified citations within this workspace
    const addedEdgeIds = new Set<string>();

    displayedWorks.forEach(pw => {
      const w = pw.work;
      if (!w || !w.references || !Array.isArray(w.references)) return;

      w.references.forEach(refIdentifier => {
        let targetId: string | undefined;

        if (workMap.has(refIdentifier)) {
          targetId = refIdentifier;
        } else {
          const cleanRefOa = refIdentifier.replace(/^(https?:\/\/)?openalex\.org\//i, '').toUpperCase();
          if (oaMap.has(cleanRefOa)) {
            targetId = oaMap.get(cleanRefOa);
          } else {
            const cleanDoi = refIdentifier.toLowerCase().trim();
            if (doiMap.has(cleanDoi)) {
              targetId = doiMap.get(cleanDoi);
            }
          }
        }

        if (targetId && targetId !== w.id) {
          const edgeId = `edge_${w.id}_to_${targetId}`;
          if (!addedEdgeIds.has(edgeId)) {
            addedEdgeIds.add(edgeId);
            edges.push({
              data: {
                id: edgeId,
                source: w.id,
                target: targetId,
                label: 'cites',
                edgeType: 'cites'
              }
            });
          }
        }
      });
    });

    return [...nodes, ...edges];
  }, [displayedWorks]);

  // Initialize and update Cytoscape instance
  useEffect(() => {
    if (!containerRef.current) return;

    if (!cyRef.current) {
      const cy = cytoscape({
        container: containerRef.current,
        elements,
        style: [
          {
            selector: 'node',
            style: {
              'label': 'data(label)',
              'text-wrap': 'wrap',
              'text-max-width': '130px',
              'font-size': '10px',
              'font-family': 'system-ui, -apple-system, sans-serif',
              'font-weight': 600,
              'color': '#1e293b',
              'text-valign': 'bottom',
              'text-margin-y': 5,
              'width': 'data(size)',
              'height': 'data(size)',
              'background-color': 'data(bgColor)',
              'border-width': 2,
              'border-color': 'data(borderColor)',
              'overlay-opacity': 0,
              'transition-property': 'background-color, border-color, border-width',
              'transition-duration': 0.2
            }
          },
          {
            selector: 'node:selected',
            style: {
              'border-width': 4,
              'border-color': '#f59e0b',
              'background-color': '#4338ca'
            }
          },
          {
            selector: 'edge[edgeType = "cites"]',
            style: {
              'width': 1.5,
              'line-color': '#cbd5e1',
              'target-arrow-color': '#94a3b8',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'arrow-scale': 1.0,
              'opacity': 0.75
            }
          },
          {
            selector: 'edge[edgeType = "related"]',
            style: {
              'width': 1.2,
              'line-color': '#93c5fd',
              'line-style': 'dashed',
              'curve-style': 'bezier',
              'opacity': 0.65
            }
          },
          {
            selector: 'edge:selected',
            style: {
              'width': 2.5,
              'line-color': '#f59e0b',
              'target-arrow-color': '#f59e0b',
              'opacity': 1
            }
          }
        ],
        layout: {
          name: layoutName,
          animate: true,
          animationDuration: 500,
          padding: 30
        } as any
      });

      cy.on('tap', 'node', (evt: EventObject) => {
        const node = evt.target;
        setSelectedWorkId(node.id());
      });

      cy.on('tap', (evt: EventObject) => {
        if (evt.target === cy) {
          setSelectedWorkId(null);
        }
      });

      cyRef.current = cy;
    } else {
      const cy = cyRef.current;
      cy.json({ elements });
      const layout = cy.layout({
        name: layoutName,
        animate: true,
        animationDuration: 500,
        padding: 30
      } as any);
      layout.run();
    }

    return () => {
      // Cy cleanup handled if component unmounts completely
    };
  }, [elements, layoutName]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 30);
  const handleResetLayout = () => {
    const layout = cyRef.current?.layout({
      name: layoutName,
      animate: true,
      animationDuration: 500,
      padding: 30
    } as any);
    layout?.run();
  };

  /**
   * Explicit 3-operation network expansion:
   * - references: What this paper cites (in bibliography)
   * - cited_by: What cites this paper (forward citations)
   * - related: Related papers (OpenAlex recommendations)
   */
  const handleNetworkExpand = async (operation: NetworkExpansionOperation) => {
    if (!selectedProjectWork) return;
    try {
      setIsExpanding(true);
      setActiveExpansionOp(operation);
      const opLabel = 
        operation === 'references' ? 'fetching references (what this paper cites)' :
        operation === 'cited_by' ? 'fetching citing works (what cites this paper)' :
        'fetching OpenAlex related papers';

      setExpansionMsg({ text: `Querying OpenAlex: ${opLabel}...`, type: 'success' });

      const response: NetworkExpansionResponse = await scholarlyApi.networkExpand(
        selectedProjectWork.work,
        operation,
        25
      );

      if (response.selectedWork.verificationStatus !== 'verified' || !response.selectedWork.canonicalOpenAlexId) {
        const warnText = response.warnings?.[0] || 'No canonical OpenAlex work found for this paper. Cannot expand network without verified OpenAlex record.';
        setExpansionMsg({ 
          text: warnText, 
          type: 'warn' 
        });
        setTimeout(() => setExpansionMsg(null), 5000);
        return;
      }

      // Add only verified candidates into the active project as 'candidate'
      let addedCount = 0;
      for (const cand of response.candidates) {
        if (cand.relationVerified && cand.work) {
          const alreadyExists = (activeProjectWorksList || []).some(
            pw => pw.workId === cand.work.id || (cand.work.openAlexId && pw.work?.openAlexId === cand.work.openAlexId)
          );
          if (!alreadyExists) {
            await addWorkToProject(cand.work, { inclusionStatus: 'candidate' });
            addedCount++;
          }
        }
      }

      const countMsg = `${addedCount} new ${operation === 'references' ? 'referenced' : operation === 'cited_by' ? 'citing' : 'related'} works added as candidates.`;
      const hasWarning = response.warnings && response.warnings.length > 0;
      setExpansionMsg({ 
        text: hasWarning ? `${countMsg} (${response.warnings[0]})` : countMsg, 
        type: hasWarning ? 'warn' : 'success' 
      });
      setTimeout(() => setExpansionMsg(null), 4500);
    } catch (err: any) {
      setExpansionMsg({ text: `Expansion failed: ${err.message}`, type: 'error' });
      setTimeout(() => setExpansionMsg(null), 4500);
    } finally {
      setIsExpanding(false);
      setActiveExpansionOp(null);
    }
  };

  const handleSaveSnapshot = async () => {
    if (!cyRef.current || !activeProject) return;
    const json = JSON.stringify(cyRef.current.json().elements);
    await saveMapSnapshot({
      title: `${activeProject.title} Citation Map Snapshot`,
      layoutType: layoutName,
      elementsJson: json,
      notes: `Captured with ${displayedWorks.length} active literature nodes in ${layoutName} layout.`
    });
    setSnapshotSuccess(true);
    setTimeout(() => setSnapshotSuccess(false), 2500);
  };

  return (
    <div className="space-y-3">
      {/* Top Map Control Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200">
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-white text-slate-700 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-white text-slate-700 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleFit}
              className="p-1.5 hover:bg-white text-slate-700 rounded transition-colors"
              title="Fit Viewport"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetLayout}
              className="p-1.5 hover:bg-white text-slate-700 rounded transition-colors"
              title="Recalculate Physics"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-5 w-px bg-slate-200 mx-1"></div>

          {/* Layout Selector */}
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-600">Layout:</span>
            <select
              value={layoutName}
              onChange={e => setLayoutName(e.target.value as LayoutName)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 outline-hidden font-medium"
            >
              <option value="cose">COSE Force-Directed</option>
              <option value="concentric">Concentric Impact</option>
              <option value="breadthfirst">Citation Tree</option>
              <option value="circle">Circular Radial</option>
              <option value="grid">Grid Layout</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Inclusion Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={inclusionFilter}
              onChange={e => setInclusionFilter(e.target.value as any)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 outline-hidden"
            >
              <option value="all">All Literature ({activeProjectWorksList.length})</option>
              <option value="included">Included ({activeProjectWorksList.filter(w => w.inclusionStatus === 'included').length})</option>
              <option value="candidate">Candidates ({activeProjectWorksList.filter(w => w.inclusionStatus === 'candidate').length})</option>
            </select>
          </div>

          {/* Snapshot Button */}
          {permissions.canSaveMapSnapshots && (
            <button
              onClick={handleSaveSnapshot}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-slate-600" />
              <span>{snapshotSuccess ? 'Saved!' : 'Snapshot'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Cytoscape Canvas Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 min-h-[580px]">
        <div className={`relative bg-slate-50 high-density-grid-bg border border-slate-200 rounded-lg overflow-hidden shadow-inner ${selectedProjectWork ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {/* Cytoscape DOM container */}
          <div ref={containerRef} className="w-full h-[580px]" />

          {/* Legend Overlay */}
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs border border-slate-200 p-2.5 rounded-lg shadow-md text-xs text-slate-600 space-y-1.5 pointer-events-auto">
            <div className="font-bold text-slate-800 text-[10px] uppercase tracking-wider mb-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <Network className="w-3.5 h-3.5 text-indigo-600" />
                <span>Citation Map Legend</span>
              </div>
              <span className="text-[9px] bg-indigo-50 text-indigo-700 font-mono px-1.5 py-0.2 rounded border border-indigo-100">
                Verified OpenAlex
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 border border-indigo-700"></span>
              <span className="text-[11px]">Included in Synthesis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600 border border-sky-700"></span>
              <span className="text-[11px]">Candidate Literature</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-rose-700"></span>
              <span className="text-[11px]">Excluded / Borderline</span>
            </div>
            <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-100">
              * Solid arrows = explicit citation references. Dashed = related topics.
            </div>
          </div>

          {/* Empty state overlay if zero works */}
          {displayedWorks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/95 p-6 text-center z-10">
              <div className="max-w-md space-y-3">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto shadow-xs">
                  <Network className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold font-serif-scholarly text-slate-900">
                  No saved papers to map yet
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  The Citation Map visualizes citation connections between papers you save in your project. Find and explore papers to start building your network.
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Explore papers</span>
                  </button>
                  <button
                    onClick={loadDemonstrationData}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Try with example papers</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected Work Inspection Drawer */}
        {selectedProjectWork && (
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between overflow-y-auto max-h-[580px] animate-in slide-in-from-right-4 duration-150">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  selectedProjectWork.inclusionStatus === 'included'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                    : selectedProjectWork.inclusionStatus === 'candidate'
                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                    : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                  {selectedProjectWork.inclusionStatus}
                </span>

                <span className="text-xs text-slate-400 font-mono">
                  {selectedProjectWork.work.year}
                </span>
              </div>

              <div>
                <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">
                  Selected Work
                </div>
                <h3 className="text-sm font-bold font-serif-scholarly text-slate-900 leading-snug">
                  {selectedProjectWork.work.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  {selectedProjectWork.work.authors.map(a => a.name).join(', ')}
                </p>
                {selectedProjectWork.work.venue && (
                  <p className="text-xs text-slate-500 italic mt-0.5">
                    {selectedProjectWork.work.venue}
                  </p>
                )}
              </div>

              {/* Citations and Provenance */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Citations</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedProjectWork.work.citationCount.toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Provenance</span>
                  <span className="font-semibold text-indigo-700 text-xs truncate block">{selectedProjectWork.work.provenance.provider}</span>
                </div>
              </div>

              {/* Source & Relation Diagnostics */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Database className="w-3 h-3 text-indigo-500" />
                    Source Details
                  </span>
                  <button 
                    onClick={() => setShowSourceDetails(!showSourceDetails)}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    {showSourceDetails ? 'Hide' : 'Details'}
                  </button>
                </div>
                {showSourceDetails && (
                  <div className="pt-1.5 border-t border-slate-200 space-y-1 text-[11px] text-slate-600 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">OpenAlex ID:</span>
                      <span className="font-semibold text-slate-800">{selectedProjectWork.work.openAlexId || 'None'}</span>
                    </div>
                    {selectedProjectWork.work.doi && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">DOI:</span>
                        <span className="truncate max-w-[150px] text-slate-800">{selectedProjectWork.work.doi}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Indexed Refs:</span>
                      <span className="text-slate-800">{selectedProjectWork.work.references?.length || 0}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Abstract */}
              {selectedProjectWork.work.abstract && (
                <div>
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Abstract
                  </h5>
                  <p className="text-xs text-slate-700 line-clamp-4 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                    {selectedProjectWork.work.abstract}
                  </p>
                </div>
              )}

              {/* Inclusion & Read Status Modifiers */}
              {permissions.canEditWorks && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Project Status
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['included', 'candidate', 'excluded'] as InclusionStatus[]).map(st => (
                      <button
                        key={st}
                        onClick={() => updateProjectWork(selectedProjectWork.id, { inclusionStatus: st })}
                        className={`py-1 text-xs rounded capitalize border transition-all ${
                          selectedProjectWork.inclusionStatus === st
                            ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-1">
                    {(['unread', 'reading', 'completed'] as ReadStatus[]).map(rs => (
                      <button
                        key={rs}
                        onClick={() => updateProjectWork(selectedProjectWork.id, { readStatus: rs })}
                        className={`py-1 text-[11px] rounded capitalize border transition-all ${
                          selectedProjectWork.readStatus === rs
                            ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {rs}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Explicit 3-Button Network Expansion Actions */}
            <div className="pt-3 border-t border-slate-200 mt-3 space-y-1.5">
              {/* Explore this paper */}
              <button
                onClick={() => openPaperInExplorer(selectedProjectWork.work)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Explore This Paper</span>
              </button>

              {/* Three Explicit Network Actions */}
              {permissions.canAddWorks && (
                <div className="space-y-1 pt-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    OpenAlex Network Expansion
                  </div>

                  {/* 1. What this paper cites */}
                  <button
                    onClick={() => handleNetworkExpand('references')}
                    disabled={isExpanding}
                    className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded flex items-center justify-between transition-colors shadow-xs disabled:opacity-50"
                  >
                    <div className="flex items-center gap-1.5">
                      <ArrowDownLeft className="w-3.5 h-3.5 text-indigo-400" />
                      <span>What this paper cites</span>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-normal">
                      References
                    </span>
                  </button>

                  {/* 2. What cites this paper */}
                  <button
                    onClick={() => handleNetworkExpand('cited_by')}
                    disabled={isExpanding}
                    className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded flex items-center justify-between transition-colors shadow-xs disabled:opacity-50"
                  >
                    <div className="flex items-center gap-1.5">
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                      <span>What cites this paper</span>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-normal">
                      Citations
                    </span>
                  </button>

                  {/* 3. Related papers */}
                  <button
                    onClick={() => handleNetworkExpand('related')}
                    disabled={isExpanding}
                    className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded flex items-center justify-between border border-slate-200 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Related papers</span>
                    </div>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                      Similar topic
                    </span>
                  </button>

                  {expansionMsg && (
                    <div className={`text-[10px] p-1.5 rounded border text-center animate-in fade-in ${
                      expansionMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      expansionMsg.type === 'warn' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-indigo-50 text-indigo-700 border-indigo-100'
                    }`}>
                      {expansionMsg.text}
                    </div>
                  )}
                </div>
              )}

              {permissions.canCreateEvidence && (
                <button
                  onClick={() => setEvidenceModalOpen(true)}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors shadow-xs mt-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Ground Claim Evidence
                </button>
              )}

              {selectedProjectWork.work.doi && (
                <a
                  href={`https://doi.org/${selectedProjectWork.work.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open DOI ({selectedProjectWork.work.doi})
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ground Evidence Modal with Preselected Work */}
      {evidenceModalOpen && selectedProjectWork && (
        <AddEvidenceModal
          isOpen={evidenceModalOpen}
          onClose={() => setEvidenceModalOpen(false)}
          defaultWorkId={selectedProjectWork.workId}
        />
      )}
    </div>
  );
};
