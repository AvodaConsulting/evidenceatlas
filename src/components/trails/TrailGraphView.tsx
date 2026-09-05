import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  Sparkles, 
  Info, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  HelpCircle,
  Maximize2
} from 'lucide-react';
import { CitationTrail, DiscoveryCandidate, Work, CandidateDecision } from '../../types';

interface TrailGraphViewProps {
  trail: CitationTrail;
  candidates: DiscoveryCandidate[];
  onSelectCandidate: (candidate: DiscoveryCandidate) => void;
  selectedCandidateId: string | null;
}

interface NodePosition {
  id: string;
  isSeed: boolean;
  title: string;
  year: number;
  authors: string;
  citationCount: number;
  decision: CandidateDecision;
  reasons: string[];
  x: number;
  y: number;
  candidateObj?: DiscoveryCandidate;
}

interface EdgeLink {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  label?: string;
}

export const TrailGraphView: React.FC<TrailGraphViewProps> = ({
  trail,
  candidates,
  onSelectCandidate,
  selectedCandidateId
}) => {
  const [layoutMode, setLayoutMode] = useState<'chronological' | 'radial' | 'clustered'>('chronological');
  const [filterDecision, setFilterDecision] = useState<string>('all');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 500 });

  // Update canvas size on container resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setDimensions({
            width: entry.contentRect.width,
            height: Math.max(480, entry.contentRect.height)
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Filter candidates
  const visibleCandidates = useMemo(() => {
    return candidates.filter(c => {
      if (filterDecision !== 'all' && c.decision !== filterDecision) return false;
      return true;
    });
  }, [candidates, filterDecision]);

  // Compute node coordinates based on selected layout
  const { nodes, edges } = useMemo(() => {
    const calculatedNodes: NodePosition[] = [];
    const calculatedEdges: EdgeLink[] = [];

    const W = dimensions.width;
    const H = dimensions.height;
    const padding = 70;

    const seedSet = new Set(trail.seedWorks.map(s => s.id));
    const allWorks = [
      ...trail.seedWorks.map(w => ({ work: w, isSeed: true, decision: 'candidate' as CandidateDecision, candidateObj: undefined })),
      ...visibleCandidates.map(c => ({ work: c.work, isSeed: false, decision: c.decision, candidateObj: c }))
    ];

    if (allWorks.length === 0) {
      return { nodes: [], edges: [] };
    }

    if (layoutMode === 'chronological') {
      // Sort by publication year
      const minYear = Math.min(...allWorks.map(w => w.work.year || 2020));
      const maxYear = Math.max(...allWorks.map(w => w.work.year || 2026));
      const yearSpan = Math.max(1, maxYear - minYear);

      // Group works by year
      const yearBuckets: Record<number, typeof allWorks> = {};
      allWorks.forEach(item => {
        const y = item.work.year || 2024;
        if (!yearBuckets[y]) yearBuckets[y] = [];
        yearBuckets[y].push(item);
      });

      const sortedYears = Object.keys(yearBuckets).map(Number).sort((a, b) => a - b);

      sortedYears.forEach((year, yearIdx) => {
        const items = yearBuckets[year];
        const colX = padding + (yearIdx / Math.max(1, sortedYears.length - 1)) * (W - 2 * padding);

        items.forEach((item, itemIdx) => {
          const rowY = padding + ((itemIdx + 1) / (items.length + 1)) * (H - 2 * padding);
          calculatedNodes.push({
            id: item.work.id,
            isSeed: item.isSeed,
            title: item.work.title,
            year: item.work.year || 2024,
            authors: item.work.authors.map(a => a.name).slice(0, 2).join(', '),
            citationCount: item.work.citationCount,
            decision: item.decision,
            reasons: item.candidateObj ? item.candidateObj.reasons.map(r => r.description) : ['Seed exploration root'],
            x: colX,
            y: rowY,
            candidateObj: item.candidateObj
          });
        });
      });
    } else if (layoutMode === 'radial') {
      // Seed in center, candidates radiating outward
      const centerX = W / 2;
      const centerY = H / 2;
      const radius = Math.min(W, H) * 0.38;

      // Seed nodes clustered at center
      trail.seedWorks.forEach((seed, idx) => {
        const seedOffsetX = (idx - (trail.seedWorks.length - 1) / 2) * 50;
        calculatedNodes.push({
          id: seed.id,
          isSeed: true,
          title: seed.title,
          year: seed.year || 2024,
          authors: seed.authors.map(a => a.name).slice(0, 2).join(', '),
          citationCount: seed.citationCount,
          decision: 'candidate',
          reasons: ['Seed exploration root'],
          x: centerX + seedOffsetX,
          y: centerY,
          candidateObj: undefined
        });
      });

      // Candidates orbiting
      visibleCandidates.forEach((c, idx) => {
        const angle = (idx / Math.max(1, visibleCandidates.length)) * 2 * Math.PI - Math.PI / 2;
        const dist = radius * (0.8 + (idx % 3) * 0.15);
        calculatedNodes.push({
          id: c.work.id,
          isSeed: false,
          title: c.work.title,
          year: c.work.year || 2024,
          authors: c.work.authors.map(a => a.name).slice(0, 2).join(', '),
          citationCount: c.work.citationCount,
          decision: c.decision,
          reasons: c.reasons.map(r => r.description),
          x: centerX + Math.cos(angle) * dist,
          y: centerY + Math.sin(angle) * dist,
          candidateObj: c
        });
      });
    } else {
      // Clustered layout (grouped by decision)
      const categories: CandidateDecision[] = ['included', 'queued', 'candidate', 'rejected'];
      const colWidth = (W - 2 * padding) / categories.length;

      // Seed node on top left
      trail.seedWorks.forEach((seed, idx) => {
        calculatedNodes.push({
          id: seed.id,
          isSeed: true,
          title: seed.title,
          year: seed.year || 2024,
          authors: seed.authors.map(a => a.name).slice(0, 2).join(', '),
          citationCount: seed.citationCount,
          decision: 'candidate',
          reasons: ['Seed exploration root'],
          x: padding + idx * 80,
          y: padding,
          candidateObj: undefined
        });
      });

      categories.forEach((cat, catIdx) => {
        const inCat = visibleCandidates.filter(c => c.decision === cat);
        const colX = padding + catIdx * colWidth + colWidth / 2;

        inCat.forEach((item, itemIdx) => {
          const rowY = padding + 80 + ((itemIdx + 1) / (inCat.length + 1)) * (H - 2 * padding - 80);
          calculatedNodes.push({
            id: item.work.id,
            isSeed: false,
            title: item.work.title,
            year: item.work.year || 2024,
            authors: item.work.authors.map(a => a.name).slice(0, 2).join(', '),
            citationCount: item.work.citationCount,
            decision: item.decision,
            reasons: item.reasons.map(r => r.description),
            x: colX,
            y: rowY,
            candidateObj: item
          });
        });
      });
    }

    // Build directed edges from seed works to candidates
    const primarySeedId = trail.seedWorks[0]?.id;
    if (primarySeedId) {
      visibleCandidates.forEach((c) => {
        const isEarlier = trail.trailType === 'earlier_work';
        const isLater = trail.trailType === 'later_work';
        
        calculatedEdges.push({
          id: `edge_${primarySeedId}_${c.work.id}`,
          sourceId: isEarlier ? c.work.id : primarySeedId,
          targetId: isEarlier ? primarySeedId : c.work.id,
          type: trail.trailType,
          label: c.reasons[0]?.description
        });
      });
    }

    return { nodes: calculatedNodes, edges: calculatedEdges };
  }, [trail, visibleCandidates, layoutMode, dimensions]);

  // Pan and drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'graph-canvas') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Node coordinate lookup for rendering edges
  const nodeCoordMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    nodes.forEach(n => map.set(n.id, { x: n.x, y: n.y }));
    return map;
  }, [nodes]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Top Toolbar */}
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => setLayoutMode('chronological')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                layoutMode === 'chronological' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Timeline (By Year)
            </button>
            <button
              onClick={() => setLayoutMode('radial')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                layoutMode === 'radial' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Radial Orbit
            </button>
            <button
              onClick={() => setLayoutMode('clustered')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                layoutMode === 'clustered' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              By Decision
            </button>
          </div>

          {/* Filter Decision */}
          <select
            value={filterDecision}
            onChange={(e) => setFilterDecision(e.target.value)}
            className="text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1 text-slate-700 font-medium"
          >
            <option value="all">All Candidates ({candidates.length})</option>
            <option value="candidate">Unreviewed</option>
            <option value="queued">Queued for Reading</option>
            <option value="included">Included in Library</option>
            <option value="rejected">Excluded</option>
          </select>
        </div>

        {/* Zoom and Navigation Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}
            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(0.4, z - 0.2))}
            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-500 pl-1">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div 
        ref={containerRef}
        id="graph-canvas"
        className="w-full h-[520px] bg-slate-900 relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <marker
              id="arrow-head"
              markerWidth="8"
              markerHeight="6"
              refX="18"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
            </marker>
            <marker
              id="arrow-head-gold"
              markerWidth="8"
              markerHeight="6"
              refX="18"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
            </marker>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Background Grid Lines */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1" />
            </pattern>
            <rect width="3000" height="3000" x="-1000" y="-1000" fill="url(#grid)" />

            {/* Edges */}
            {edges.map((edge, idx) => {
              const src = nodeCoordMap.get(edge.sourceId);
              const tgt = nodeCoordMap.get(edge.targetId);
              if (!src || !tgt) return null;

              const isHighlighted = edge.sourceId === selectedCandidateId || edge.targetId === selectedCandidateId;

              return (
                <g key={`${edge.id}-${idx}`}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={isHighlighted ? '#6366f1' : '#475569'}
                    strokeWidth={isHighlighted ? 2.5 : 1.2}
                    strokeDasharray={edge.type === 'similar_work' || edge.type === 'shared_references' ? '4 3' : undefined}
                    markerEnd="url(#arrow-head)"
                  />
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node, idx) => {
              const isSelected = node.id === selectedCandidateId;
              const isSeed = node.isSeed;

              // Node styling by decision
              const fillColor = isSeed 
                ? '#4f46e5' 
                : node.decision === 'included'
                  ? '#059669'
                  : node.decision === 'queued'
                    ? '#d97706'
                    : node.decision === 'rejected'
                      ? '#334155'
                      : '#0284c7';

              const strokeColor = isSelected ? '#fbbf24' : isSeed ? '#818cf8' : '#e2e8f0';

              return (
                <g 
                  key={`${node.id}-${idx}`} 
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer transition-transform duration-100 hover:scale-110"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (node.candidateObj) {
                      onSelectCandidate(node.candidateObj);
                    }
                  }}
                >
                  {/* Outer glow ring if selected */}
                  {isSelected && (
                    <circle
                      r={isSeed ? 26 : 20}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="3"
                      strokeOpacity="0.8"
                      className="animate-pulse"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r={isSeed ? 18 : 13}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 3 : 2}
                  />

                  {/* Seed Star or Icon */}
                  {isSeed && (
                    <text
                      textAnchor="middle"
                      dy=".3em"
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="bold"
                    >
                      ★
                    </text>
                  )}

                  {/* Node Label Text */}
                  <text
                    x="0"
                    y={isSeed ? 30 : 24}
                    textAnchor="middle"
                    fill="#f1f5f9"
                    fontSize={isSeed ? "11" : "10"}
                    fontWeight={isSeed ? "bold" : "medium"}
                    className="pointer-events-none drop-shadow-md font-serif-scholarly"
                  >
                    {node.title.length > 28 ? node.title.substring(0, 25) + '...' : node.title}
                  </text>

                  {/* Year badge */}
                  <text
                    x="0"
                    y={isSeed ? 42 : 36}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                    className="pointer-events-none"
                  >
                    {node.year} • {(node.decision || 'candidate').toUpperCase()}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Legend Overlay at bottom left */}
        <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-xs border border-slate-800 rounded-lg p-2.5 text-[11px] text-slate-300 space-y-1.5 shadow-lg max-w-xs">
          <div className="font-bold text-slate-200 uppercase tracking-wider text-[9px] flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-400" />
            <span>Trail Map Legend</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 border border-indigo-300"></span>
              <span>Seed Root (Origin)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-emerald-300"></span>
              <span>Included in Project</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 border border-amber-300"></span>
              <span>Study Queue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600 border border-sky-300"></span>
              <span>Unreviewed Candidate</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 italic">
            Click any node to inspect "Why it appeared" and record decisions.
          </div>
        </div>
      </div>
    </div>
  );
};
