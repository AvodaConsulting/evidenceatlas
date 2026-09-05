import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Network, 
  Compass, 
  ShieldCheck, 
  MessageSquare, 
  FileSpreadsheet, 
  Settings, 
  ArrowLeft,
  Lock,
  Layers,
  Bell,
  Zap,
  Download,
  GitBranch,
  Clock,
  MoreHorizontal,
  ChevronDown,
  X,
  RotateCcw
} from 'lucide-react';
import { useApp, TabType } from '../../context/AppContext';
import { ResearchIntegrityPanel } from '../common/ResearchIntegrityPanel';
import { DiscoverTab } from './tabs/DiscoverTab';
import { MapTab } from './tabs/MapTab';
import { LibraryTab } from './tabs/LibraryTab';
import { EvidenceTab } from './tabs/EvidenceTab';
import { NotesTab } from './tabs/NotesTab';
import { SearchLogTab } from './tabs/SearchLogTab';
import { ProjectSettingsTab } from './tabs/ProjectSettingsTab';
import { MonitorsTab } from './tabs/MonitorsTab';
import { FastTrackMcpTab } from './tabs/FastTrackMcpTab';
import { ExportsAuditTab } from './tabs/ExportsAuditTab';
import { CitationTrailsTab } from './tabs/CitationTrailsTab';
import { DiscoveryTrayTab } from '../discovery/DiscoveryTrayTab';
import { StudyNextTab } from '../discovery/StudyNextTab';

export const ProjectWorkspace: React.FC = () => {
  const { 
    activeProject, 
    activeWorkspace, 
    projects,
    activeTab, 
    setActiveTab, 
    setActiveProjectId,
    projectStats,
    studyQueue,
    toast,
    hideToast
  } = useApp();

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!activeProject) return null;

  // Primary 4 tabs
  const primaryTabs: { id: TabType; label: string; icon: any; count?: number }[] = [
    { id: 'discover', label: 'Explore', icon: Compass },
    { id: 'library', label: 'My Papers', icon: BookOpen, count: projectStats.totalWorks },
    { id: 'study-next', label: 'Read Next', icon: Clock, count: studyQueue.length > 0 ? studyQueue.length : undefined },
    { id: 'notes', label: 'Project Notes', icon: MessageSquare, count: projectStats.annotationsCount > 0 ? projectStats.annotationsCount : undefined },
  ];

  // Secondary tools in More menu
  const secondaryTabs: { id: TabType; label: string; icon: any; description: string }[] = [
    { id: 'trails', label: 'Exploration History', icon: GitBranch, description: 'Lineage trees and search paths' },
    { id: 'tray', label: 'Saved for Later', icon: Layers, description: 'Candidate tray for future review' },
    { id: 'evidence', label: 'Evidence Checks', icon: ShieldCheck, description: 'Grounded claims and verifications' },
    { id: 'map', label: 'Connections Map', icon: Network, description: 'Interactive citation network visualization' },
    { id: 'monitors', label: 'Alerts', icon: Bell, description: 'Automated search updates and tracking' },
    { id: 'search-log', label: 'Research Record', icon: FileSpreadsheet, description: 'Audit log of queries and actions' },
    { id: 'exports', label: 'Export & Audit', icon: Download, description: 'BibTeX, CSV, PRISMA, JSON' },
    { id: 'mcp', label: 'Open Lit MCP', icon: Zap, description: 'AI Agent connection tools' },
    { id: 'settings', label: 'Project Settings', icon: Settings, description: 'Metadata, members, and rules' },
  ];

  const isMoreActive = secondaryTabs.some(t => t.id === activeTab);
  const activeSecondaryTab = secondaryTabs.find(t => t.id === activeTab);

  return (
    <div className="space-y-4">
      {/* Project Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Breadcrumb & Project Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveProjectId(null)}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Projects</span>
            </button>
            <span className="text-slate-300">/</span>
            
            {/* Quick Switcher dropdown */}
            <select
              value={activeProject.id}
              onChange={e => setActiveProjectId(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 outline-hidden cursor-pointer"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          {/* Project Status badges */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              Private Workspace
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full">
              My Papers: {projectStats.totalWorks}
            </span>
          </div>
        </div>

        {/* Project Title & Research Question */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif-scholarly text-slate-900 tracking-tight leading-snug">
            {activeProject.title}
          </h1>
          {activeProject.researchQuestion && (
            <p className="text-xs text-slate-600 mt-1 font-serif-scholarly italic leading-relaxed">
              "{activeProject.researchQuestion}"
            </p>
          )}
        </div>
      </div>

      {/* Mandatory Persistent Research Integrity Panel */}
      <ResearchIntegrityPanel />

      {/* Simplified Primary Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-2 shadow-xs flex items-center justify-between">
        <nav className="flex h-12 gap-1 overflow-x-auto">
          {primaryTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMoreMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-4 border-b-2 text-xs font-semibold transition-all shrink-0 ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* More Menu Dropdown */}
        <div className="relative shrink-0 pr-2" ref={moreMenuRef}>
          <button
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              isMoreActive
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <MoreHorizontal className="w-4 h-4 text-slate-500" />
            <span>{isMoreActive && activeSecondaryTab ? activeSecondaryTab.label : 'More'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {moreMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Advanced Tools
              </div>
              <div className="max-h-80 overflow-y-auto">
                {secondaryTabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMoreMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-start gap-2.5 transition-colors ${
                        isActive ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <div>
                        <div className="text-xs font-semibold">{tab.label}</div>
                        <div className="text-[10px] text-slate-500 leading-tight">{tab.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Tab View */}
      <div className="mt-4">
        {activeTab === 'discover' && <DiscoverTab />}
        {activeTab === 'library' && <LibraryTab />}
        {activeTab === 'study-next' && <StudyNextTab />}
        {activeTab === 'notes' && <NotesTab />}
        {activeTab === 'map' && <MapTab />}
        {activeTab === 'trails' && <CitationTrailsTab />}
        {activeTab === 'tray' && <DiscoveryTrayTab />}
        {activeTab === 'evidence' && <EvidenceTab />}
        {activeTab === 'monitors' && <MonitorsTab />}
        {activeTab === 'mcp' && <FastTrackMcpTab />}
        {activeTab === 'exports' && <ExportsAuditTab />}
        {activeTab === 'search-log' && <SearchLogTab />}
        {activeTab === 'settings' && <ProjectSettingsTab />}
      </div>

      {/* Toast Notification with Undo Action */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2">
          <span>{toast.message}</span>
          {toast.actionLabel && toast.onAction && (
            <button
              onClick={() => {
                toast.onAction?.();
                hideToast();
              }}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-md transition-colors inline-flex items-center gap-1 shadow-xs"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{toast.actionLabel}</span>
            </button>
          )}
          <button
            onClick={hideToast}
            className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
