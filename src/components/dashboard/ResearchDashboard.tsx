import React from 'react';
import { 
  BookOpen, 
  Plus, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  Network, 
  Building2, 
  FileSpreadsheet, 
  ListChecks,
  Lock,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ResearchIntegrityPanel } from '../common/ResearchIntegrityPanel';

interface ResearchDashboardProps {
  onOpenCreateProject: () => void;
  onOpenCreateWorkspace: () => void;
  onOpenChecklist: () => void;
}

export const ResearchDashboard: React.FC<ResearchDashboardProps> = ({
  onOpenCreateProject,
  onOpenCreateWorkspace,
  onOpenChecklist
}) => {
  const { 
    workspaces, 
    activeWorkspace, 
    setActiveWorkspaceId,
    projects, 
    setActiveProjectId, 
    projectWorks, 
    evidenceRecords,
    searches,
    permissions,
    currentUser
  } = useApp();

  const workspaceProjects = projects.filter(p => p.workspaceId === activeWorkspace?.id && !p.deletedAt);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
              Academic Literature Discovery & Synthesis
            </span>
            <span className="text-xs text-stone-500 font-mono">v1.0 Production</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-serif-scholarly text-stone-950 tracking-tight leading-tight">
            Scholarly Evidence Atlas
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Welcome back, <span className="font-semibold text-stone-900">{currentUser.displayName}</span>. Navigate literature topologies, ground empirical assertions to verbatim source passages, and synthesize research with immutable provenance.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {permissions.canCreateProject && (
              <button
                onClick={onOpenCreateProject}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Initialize Research Project
              </button>
            )}

            <button
              onClick={onOpenChecklist}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors border border-stone-200"
            >
              <ListChecks className="w-4 h-4 text-emerald-800" />
              Integration Setup Checklist
            </button>
          </div>
        </div>
      </div>

      {/* Mandatory Persistent Research Integrity Panel */}
      <ResearchIntegrityPanel />

      {/* Workspace Projects Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-800" />
            <h2 className="text-base font-bold font-serif-scholarly text-stone-900">
              Active Research Projects in {activeWorkspace?.name}
            </h2>
          </div>

          {permissions.canCreateProject && (
            <button
              onClick={onOpenCreateProject}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              New Project
            </button>
          )}
        </div>

        {workspaceProjects.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold font-serif-scholarly text-stone-800 mb-1">
              No active research projects in this workspace
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
              Initialize your first project to begin mapping literature citations and grounding verified evidence.
            </p>
            {permissions.canCreateProject && (
              <button
                onClick={onOpenCreateProject}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Initialize Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workspaceProjects.map(project => {
              const projectWorksCount = projectWorks.filter(pw => pw.projectId === project.id && !pw.deletedAt).length;
              const includedCount = projectWorks.filter(pw => pw.projectId === project.id && pw.inclusionStatus === 'included' && !pw.deletedAt).length;
              const evidenceCount = evidenceRecords.filter(e => e.projectId === project.id).length;

              return (
                <div
                  key={project.id}
                  onClick={() => setActiveProjectId(project.id)}
                  className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs hover:border-emerald-700/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                        {project.discipline}
                      </span>
                      <span className="text-xs text-stone-400 font-mono">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold font-serif-scholarly text-stone-900 group-hover:text-emerald-950 transition-colors leading-snug">
                        {project.title}
                      </h3>
                      <p className="text-xs text-stone-600 mt-1 font-serif-scholarly italic line-clamp-2">
                        "{project.researchQuestion}"
                      </p>
                    </div>

                    {project.description && (
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-stone-100 space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-stone-50 p-2 rounded-lg border border-stone-100">
                        <span className="text-[10px] text-stone-500 block uppercase">Literature</span>
                        <span className="font-bold text-stone-900">{projectWorksCount}</span>
                      </div>
                      <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                        <span className="text-[10px] text-emerald-800 block uppercase">Included</span>
                        <span className="font-bold text-emerald-950">{includedCount}</span>
                      </div>
                      <div className="bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                        <span className="text-[10px] text-amber-800 block uppercase">Evidence</span>
                        <span className="font-bold text-amber-950">{evidenceCount}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold pt-1">
                      <span>Open Research Workspace</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Systematic Searches Audit Snippet */}
      {searches.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-800" />
              <h3 className="text-sm font-bold font-serif-scholarly text-stone-900">
                Recent Systematic Searches & API Provenance
              </h3>
            </div>
            <span className="text-xs text-stone-500">
              Cross-provider query audit trail
            </span>
          </div>

          <div className="divide-y divide-stone-100 text-xs">
            {searches.slice(0, 3).map(s => (
              <div key={s.id} className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <span className="font-mono font-semibold text-stone-900">"{s.queryText}"</span>
                  <span className="text-stone-500 text-[11px] block">
                    Providers: {s.providersQueried.join(', ')} • Yield: {s.candidateCount} works
                  </span>
                </div>
                <span className="text-[11px] text-stone-400 font-mono shrink-0">
                  {new Date(s.executedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
