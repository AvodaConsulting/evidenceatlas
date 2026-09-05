import React, { useState } from 'react';
import { 
  Compass, 
  ChevronDown, 
  Plus, 
  Building2, 
  BookOpen, 
  Shield, 
  UserCheck, 
  ListChecks, 
  RotateCcw,
  Sparkles,
  Lock,
  Bell,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Check,
  HelpCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Role } from '../../types';
import { formatRoleLabel } from '../../lib/permissions';

interface NavbarProps {
  onOpenCreateProject: () => void;
  onOpenCreateWorkspace: () => void;
  onOpenChecklist: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreateProject,
  onOpenCreateWorkspace,
  onOpenChecklist
}) => {
  const { 
    currentUser, 
    currentRole, 
    setCurrentRole, 
    workspaces, 
    activeWorkspace, 
    setActiveWorkspaceId,
    projects, 
    activeProject, 
    setActiveProjectId,
    resetToSampleData,
    cleanAllWorkspacesAndProjects,
    activeTab,
    setActiveTab,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    mcpStatus,
    sciteConfig,
    setIsHelpModalOpen
  } = useApp();

  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [healthMenuOpen, setHealthMenuOpen] = useState(false);

  const availableProjects = projects.filter(p => p.workspaceId === activeWorkspace?.id && !p.deletedAt);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Left: Brand & Workspace / Project Selectors */}
          <div className="flex items-center gap-3">
            <div 
              className="flex items-center gap-2.5 cursor-pointer group"
              onClick={() => { setActiveProjectId(null); }}
            >
              <div className="bg-indigo-600 p-1.5 rounded-md shadow-xs group-hover:bg-indigo-700 transition-colors">
                <Compass className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-base font-semibold tracking-tight text-slate-900 block leading-tight">
                  Evidence Atlas
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                  Scholarly Discovery & Verification
                </span>
              </div>
            </div>

            <div className="hidden md:block h-4 w-px bg-slate-300 mx-1"></div>

            {/* Workspace Selector */}
            <div className="relative hidden md:block">
              <button
                onClick={() => { 
                  setWorkspaceMenuOpen(!workspaceMenuOpen); 
                  setProjectMenuOpen(false); 
                  setRoleMenuOpen(false); 
                  setNotifMenuOpen(false);
                  setHealthMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-800 transition-colors"
              >
                <span className="text-slate-400">Workspace:</span>
                <span className="max-w-[140px] truncate font-semibold text-slate-800">{activeWorkspace?.name || 'Select Workspace'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {workspaceMenuOpen && (
                <div className="absolute left-0 mt-1 w-64 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Your Workspaces
                  </div>
                  {workspaces.filter(w => !w.deletedAt).map(ws => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        setActiveWorkspaceId(ws.id);
                        const firstProj = projects.find(p => p.workspaceId === ws.id && !p.deletedAt);
                        setActiveProjectId(firstProj?.id || null);
                        setWorkspaceMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        ws.id === activeWorkspace?.id ? 'text-indigo-700 font-semibold bg-indigo-50/60' : 'text-slate-700'
                      }`}
                    >
                      <span className="truncate">{ws.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Private</span>
                    </button>
                  ))}
                  <div className="border-t border-slate-100 pt-1 mt-1">
                    <button
                      onClick={() => { setWorkspaceMenuOpen(false); onOpenCreateWorkspace(); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 flex items-center gap-1.5 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      New Workspace
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Project Selector (if in project) */}
            {activeWorkspace && (
              <>
                <div className="hidden lg:block h-4 w-px bg-slate-300"></div>
                <div className="relative hidden lg:block">
                  <button
                    onClick={() => { 
                      setProjectMenuOpen(!projectMenuOpen); 
                      setWorkspaceMenuOpen(false); 
                      setRoleMenuOpen(false); 
                      setNotifMenuOpen(false);
                      setHealthMenuOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-800 transition-colors"
                  >
                    <span className="text-slate-400">Project:</span>
                    <span className="max-w-[180px] truncate font-semibold text-slate-800">{activeProject?.title || 'Overview'}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {projectMenuOpen && (
                    <div className="absolute left-0 mt-1 w-72 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={() => { setActiveProjectId(null); setProjectMenuOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors ${
                          !activeProject?.id ? 'text-indigo-700 font-semibold bg-indigo-50/60' : 'text-slate-700'
                        }`}
                      >
                        📊 Overview Dashboard
                      </button>
                      <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-t border-slate-100 mt-1">
                        Projects in {activeWorkspace.name}
                      </div>
                      {availableProjects.map(proj => (
                        <button
                          key={proj.id}
                          onClick={() => {
                            setActiveProjectId(proj.id);
                            setProjectMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                            proj.id === activeProject?.id ? 'text-indigo-700 font-semibold bg-indigo-50/60' : 'text-slate-700'
                          }`}
                        >
                          <span className="truncate">{proj.title}</span>
                          <span className="text-[10px] text-slate-400">{proj.discipline}</span>
                        </button>
                      ))}
                      <div className="border-t border-slate-100 pt-1 mt-1">
                        <button
                          onClick={() => { setProjectMenuOpen(false); onOpenCreateProject(); }}
                          className="w-full text-left px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 flex items-center gap-1.5 font-medium"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          New Project
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right: Notifications, Provider Health, Role Simulator, User */}
          <div className="flex items-center gap-2">

            {/* Provider Health Indicator */}
            <div className="relative">
              <button
                onClick={() => { 
                  setHealthMenuOpen(!healthMenuOpen); 
                  setNotifMenuOpen(false); 
                  setRoleMenuOpen(false); 
                }}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs text-emerald-800 font-semibold transition-colors"
                title="View scholarly API and provider system status"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px]">Providers: OK</span>
              </button>

              {healthMenuOpen && (
                <div className="absolute right-0 mt-1 w-72 bg-white rounded-xl border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 space-y-2.5 text-xs">
                  <div className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                    <span>Scholarly Provider Health</span>
                    <span className="text-[10px] text-emerald-600 font-mono">Live</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                      <div>
                        <div className="font-bold text-slate-800">OpenAlex API</div>
                        <div className="text-[10px] text-slate-500">Canonical metadata & citation trees</div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Operational</span>
                    </div>

                    <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                      <div>
                        <div className="font-bold text-slate-800">Crossref REST</div>
                        <div className="text-[10px] text-slate-500">DOI resolution & publisher records</div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Operational</span>
                    </div>

                    <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                      <div>
                        <div className="font-bold text-slate-800">Scite.ai Verification</div>
                        <div className="text-[10px] text-slate-500">Smart Citations & editorial notices</div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Ready</span>
                    </div>

                    <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                      <div>
                        <div className="font-bold text-slate-800">Fast Track Open Lit MCP</div>
                        <div className="text-[10px] text-slate-500">Synthesis leads & debate mapping</div>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        mcpStatus?.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {mcpStatus?.connected ? 'Connected' : 'Fallback Engine'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => { 
                  setNotifMenuOpen(!notifMenuOpen); 
                  setHealthMenuOpen(false); 
                  setRoleMenuOpen(false); 
                }}
                className="relative p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="Notifications & Mentions"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-indigo-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {notifMenuOpen && (
                <div className="absolute right-0 mt-1 w-80 bg-white rounded-xl border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                    <span>Notifications & Activity</span>
                    <span className="text-[10px] text-slate-400 font-mono">{notifications.length} Total</span>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-1.5">
                    {notifications.length === 0 ? (
                      <div className="text-center py-4 text-slate-400 text-xs">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationRead(notif.id)}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                            notif.read
                              ? 'bg-white border-slate-100 text-slate-600'
                              : 'bg-indigo-50/60 border-indigo-100 text-indigo-950 font-medium'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-[11px]">{notif.title}</span>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                            {notif.message}
                          </p>
                          <span className="text-[9px] text-slate-400 block mt-1">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher for Verification & RBAC Testing */}
            <div className="relative">
              <button
                onClick={() => { 
                  setRoleMenuOpen(!roleMenuOpen); 
                  setNotifMenuOpen(false);
                  setHealthMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-800 transition-colors"
                title="Simulate user role to test permissions"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-700">
                  Role: {formatRoleLabel(currentRole as any)}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-1 w-60 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    RBAC Role Simulator (Zero-Trust)
                  </div>
                  {(['owner', 'editor', 'commenter', 'viewer', 'non-member'] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => {
                        setCurrentRole(r);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        currentRole === r ? 'text-indigo-700 font-semibold bg-indigo-50/60' : 'text-slate-700'
                      }`}
                    >
                      <span>{r === 'non-member' ? '🚫 Non-Member (Unauthorized)' : formatRoleLabel(r)}</span>
                      {currentRole === r && <UserCheck className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Exploration Help Guide */}
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
              title="How Exploration Works"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>Help</span>
            </button>

            {/* Checklist Button */}
            <button
              onClick={onOpenChecklist}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>Checklist</span>
            </button>

            {/* Clean & Reset All Data */}
            <button
              onClick={cleanAllWorkspacesAndProjects}
              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors"
              title="Clean all workspaces & projects (reset to verified grounded dataset)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                className="w-7 h-7 rounded-full border border-slate-300 object-cover"
              />
              <div className="hidden xl:block text-left">
                <div className="text-xs font-semibold text-slate-900 leading-tight">
                  {currentUser.displayName}
                </div>
                <div className="text-[10px] text-slate-400 font-mono leading-none">
                  {currentUser.email}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};

