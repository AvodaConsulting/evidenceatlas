import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { ResearchDashboard } from './components/dashboard/ResearchDashboard';
import { ProjectWorkspace } from './components/project/ProjectWorkspace';
import { AccessDenied } from './components/common/AccessDenied';
import { CreateProjectModal } from './components/modals/CreateProjectModal';
import { CreateWorkspaceModal } from './components/modals/CreateWorkspaceModal';
import { SetupChecklistModal } from './components/modals/SetupChecklistModal';
import { HelpExplorationModal } from './components/common/HelpExplorationModal';
import { ShieldCheck, Compass, BookOpen } from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentRole, activeProjectId, setActiveProjectId, isHelpModalOpen, setIsHelpModalOpen, setActiveTab } = useApp();
  
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navigation */}
      <Navbar
        onOpenCreateProject={() => setCreateProjectOpen(true)}
        onOpenCreateWorkspace={() => setCreateWorkspaceOpen(true)}
        onOpenChecklist={() => setChecklistOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 min-h-0">
        {currentRole === 'non-member' ? (
          <AccessDenied onBackToDashboard={() => setActiveProjectId(null)} />
        ) : activeProjectId ? (
          <ProjectWorkspace />
        ) : (
          <ResearchDashboard
            onOpenCreateProject={() => setCreateProjectOpen(true)}
            onOpenCreateWorkspace={() => setCreateWorkspaceOpen(true)}
            onOpenChecklist={() => setChecklistOpen(true)}
          />
        )}
      </main>

      {/* High Density Status Footer */}
      <footer className="h-8 bg-slate-800 border-t border-slate-700 text-slate-400 flex items-center justify-between px-6 text-[10px] font-sans shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            System Ready
          </span>
          <span className="text-slate-600">|</span>
          <span>Zero-Scraping Scholarly Protocol</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline">Provenance Tracking Active</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-slate-300">OpenAlex Polite • Crossref • Semantic Scholar</span>
          <span className="text-slate-500 font-mono">v1.0.4-prod</span>
        </div>
      </footer>

      {/* Global Modals */}
      <CreateProjectModal
        isOpen={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
      />

      <CreateWorkspaceModal
        isOpen={createWorkspaceOpen}
        onClose={() => setCreateWorkspaceOpen(false)}
      />

      <SetupChecklistModal
        isOpen={checklistOpen}
        onClose={() => setChecklistOpen(false)}
      />

      <HelpExplorationModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onStartExploring={() => {
          setIsHelpModalOpen(false);
          setActiveTab('discover');
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
