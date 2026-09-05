import React, { useState } from 'react';
import { 
  GitBranch, 
  Camera, 
  Clock, 
  Download, 
  Plus, 
  Calendar, 
  User, 
  CheckCircle2, 
  Layers, 
  ArrowRight,
  Activity
} from 'lucide-react';
import { CitationTrail, CitationTrailEvent, TrailSnapshot } from '../../types';
import { useApp } from '../../context/AppContext';

interface TrailLineageViewProps {
  trail: CitationTrail;
  events: CitationTrailEvent[];
  snapshots: TrailSnapshot[];
  allTrails: CitationTrail[];
  onSelectTrail: (trailId: string) => void;
}

export const TrailLineageView: React.FC<TrailLineageViewProps> = ({
  trail,
  events,
  snapshots,
  allTrails,
  onSelectTrail
}) => {
  const { createTrailSnapshot, permissions } = useApp();
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [snapshotTitle, setSnapshotTitle] = useState('');
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);

  // Find root and sibling trails for lineage visualization
  const rootTrail = trail.rootTrailId 
    ? allTrails.find(t => t.id === trail.rootTrailId) 
    : (trail.parentTrailId ? allTrails.find(t => t.id === trail.parentTrailId) : trail);

  const relatedTrails = allTrails.filter(t => 
    t.id === trail.id || 
    t.parentTrailId === trail.id || 
    (trail.parentTrailId && t.parentTrailId === trail.parentTrailId) ||
    t.rootTrailId === (trail.rootTrailId || trail.id)
  );

  const handleTakeSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotTitle.trim()) return;
    setIsSavingSnapshot(true);
    try {
      await createTrailSnapshot(trail.id, snapshotTitle.trim());
      setSnapshotTitle('');
      setIsSnapshotModalOpen(false);
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  const downloadSnapshotJson = (snap: TrailSnapshot) => {
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Snapshot_${(snap.title || 'snapshot').replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Lineage & Branching Tree Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold font-serif-scholarly text-slate-900">
              Branch Lineage & Sub-Trails
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {relatedTrails.length} connected branches
          </span>
        </div>

        {/* Tree visualizer */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
          {relatedTrails.map(t => {
            const isCurrent = t.id === trail.id;
            const isRoot = !t.parentTrailId;

            return (
              <div 
                key={t.id}
                onClick={() => !isCurrent && onSelectTrail(t.id)}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isCurrent 
                    ? 'bg-indigo-50/80 border-indigo-300 font-bold shadow-2xs' 
                    : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                } ${!isRoot ? 'ml-6' : ''}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <GitBranch className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div className="min-w-0">
                    <span className="text-xs text-slate-900 font-serif-scholarly truncate block">
                      {t.title}
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans font-normal">
                      {(t.trailType || 'trail').replace('_', ' ').toUpperCase()} • Created by {t.creatorName || 'Researcher'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isCurrent && (
                    <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded">
                      Active Trail
                    </span>
                  )}
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Snapshots Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold font-serif-scholarly text-slate-900">
              Saved Exploration Snapshots ({snapshots.length})
            </h3>
          </div>
          <button
            onClick={() => setIsSnapshotModalOpen(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Take Trail Snapshot</span>
          </button>
        </div>

        {snapshots.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
            No snapshots recorded for this trail yet. Save snapshots to freeze and share specific candidate states.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {snapshots.map(snap => (
              <div 
                key={snap.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold font-serif-scholarly text-slate-900 truncate">
                    {snap.title}
                  </h4>
                  <button
                    onClick={() => downloadSnapshotJson(snap)}
                    className="p-1 text-slate-500 hover:text-indigo-600 rounded transition-colors"
                    title="Download Snapshot JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <p>By {snap.createdBy} • {new Date(snap.createdAt).toLocaleString()}</p>
                  <p className="font-mono text-[10px] text-slate-600">
                    {snap.candidateCount} Candidates Frozen ({snap.includedCount} Included, {snap.queuedCount} Queued)
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Event Timeline */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold font-serif-scholarly text-slate-900">
            Exploration Activity History ({events.length} Events)
          </h3>
        </div>

        <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {events.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No audit events recorded for this trail yet.
            </div>
          ) : (
            events.map(ev => (
              <div key={ev.id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                      {ev.eventType}
                    </span>
                    <span className="text-slate-800 font-medium">
                      {ev.description || 'Action performed on citation trail'}
                    </span>
                  </div>
                  {ev.details && Object.keys(ev.details).length > 0 && (
                    <p className="text-[11px] text-slate-500 font-mono">
                      {JSON.stringify(ev.details)}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Snapshot creation modal */}
      {isSnapshotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold font-serif-scholarly text-slate-900">
              Save Snapshot of "{trail.title}"
            </h3>
            <form onSubmit={handleTakeSnapshot} className="space-y-3">
              <input
                type="text"
                value={snapshotTitle}
                onChange={(e) => setSnapshotTitle(e.target.value)}
                placeholder="e.g., Checkpoint Before Expanding Co-Citations"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500 font-serif-scholarly"
                required
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSnapshotModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSnapshot || !snapshotTitle.trim()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  {isSavingSnapshot ? 'Saving...' : 'Save Snapshot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
