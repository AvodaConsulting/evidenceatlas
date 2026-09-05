import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  User, 
  Workspace, 
  WorkspaceMember, 
  Project, 
  Work, 
  ProjectWork, 
  Annotation, 
  AnnotationReply,
  Tag, 
  SearchLog, 
  EvidenceRecord, 
  MapSnapshot,
  AuditEvent, 
  Role,
  InclusionStatus,
  ReadStatus,
  ClaimType,
  SupportStrength,
  VerificationStatus,
  ProjectStats,
  SciteWorkVerificationResult,
  SciteWorkspaceConfig,
  SciteReferenceCheckRun,
  StoredMonitor,
  MonitoredCandidate,
  Notification,
  McpConnectionStatus,
  McpExecutionResult,
  CitationTrail,
  CitationTrailEvent,
  DiscoveryCandidate,
  TrailSnapshot,
  TrailType,
  CandidateDecision,
  StudyQueueItem,
  CandidateWorkState,
  CandidateRole,
  CandidateFeedback,
  CandidateFeedbackType,
  ProjectCandidateState,
  StudyNextRecommendation,
  StudyNextShortlistResult,
  StudyNextPreferences,
  ReadingPromptResponse,
  ScoreBreakdown
} from '../types';
import { 
  SAMPLE_USER, 
  SAMPLE_WORKSPACE, 
  SAMPLE_MEMBERS, 
  SAMPLE_PROJECT, 
  SAMPLE_WORKS, 
  SAMPLE_PROJECT_WORKS, 
  SAMPLE_ANNOTATIONS, 
  SAMPLE_TAGS, 
  SAMPLE_EVIDENCE_RECORDS, 
  SAMPLE_SEARCH_LOGS, 
  SAMPLE_AUDIT_EVENTS,
  SAMPLE_PROJECT_CANDIDATE_STATES,
  SAMPLE_STUDY_QUEUE
} from '../lib/sampleData';
import { getRolePermissions, PermissionSet } from '../lib/permissions';
import { scholarlyApi, sciteApi, mcpApi, monitorApi, exportApi, trailApi, studyNextApi } from '../lib/scholarlyApi';

export type TabType = 'library' | 'discover' | 'trails' | 'tray' | 'study-next' | 'map' | 'evidence' | 'notes' | 'monitors' | 'mcp' | 'exports' | 'search-log' | 'settings';

interface AppContextType {
  currentUser: User;
  currentRole: Role | 'non-member';
  permissions: PermissionSet;
  activeWorkspaceId: string | null;
  activeProjectId: string | null;
  activeTab: TabType;
  
  // Collections
  workspaces: Workspace[];
  workspaceMembers: WorkspaceMember[];
  projects: Project[];
  works: Work[];
  projectWorks: ProjectWork[];
  annotations: Annotation[];
  tags: Tag[];
  searches: SearchLog[];
  evidenceRecords: EvidenceRecord[];
  mapSnapshots: MapSnapshot[];
  auditEvents: AuditEvent[];
  sciteVerifications: Record<string, SciteWorkVerificationResult>;
  sciteConfig: SciteWorkspaceConfig | null;
  isVerifyingWork: Record<string, boolean>;
  referenceCheckHistory: SciteReferenceCheckRun[];
  
  // Monitoring, Notifications, and MCP
  monitors: StoredMonitor[];
  monitoredCandidates: MonitoredCandidate[];
  notifications: Notification[];
  mcpStatus: McpConnectionStatus | null;
  mcpResults: McpExecutionResult[];
  isMcpLoading: boolean;

  // Citation Trails and Study Queue
  citationTrails: CitationTrail[];
  activeTrailId: string | null;
  activeTrailData: { trail: CitationTrail; candidates: DiscoveryCandidate[]; events: CitationTrailEvent[]; snapshots: TrailSnapshot[] } | null;
  studyQueue: StudyQueueItem[];
  selectedTrailCandidateId: string | null;
  isTrailLoading: boolean;

  // Discovery-to-Reading Workflow State
  projectCandidateStates: ProjectCandidateState[];
  studyNextShortlist: StudyNextShortlistResult | null;
  studyNextPreferences: StudyNextPreferences;
  isStudyNextLoading: boolean;
  selectedReadingWorkId: string | null;
  
  // Paper Explorer & Global Toast Notification
  explorerWork: Work | null;
  explorerHistory: Work[];
  openPaperInExplorer: (work: Work) => void;
  backInExplorer: () => void;
  setExplorerWork: (work: Work | null) => void;
  toast: { message: string; actionLabel?: string; onAction?: () => void } | null;
  showToast: (message: string, actionLabel?: string, onAction?: () => void) => void;
  clearToast: () => void;
  
  // Usability & First-Use Orientation
  isHelpModalOpen: boolean;
  setIsHelpModalOpen: (open: boolean) => void;
  dismissedGuide: boolean;
  setDismissedGuide: (dismissed: boolean) => void;
  dismissedPaperHint: boolean;
  setDismissedPaperHint: (dismissed: boolean) => void;
  dismissedCandidateHint: boolean;
  setDismissedCandidateHint: (dismissed: boolean) => void;
  dismissedFirstAddHint: boolean;
  setDismissedFirstAddHint: (dismissed: boolean) => void;
  loadDemonstrationData: () => Promise<void>;
  removeDemonstrationData: () => Promise<void>;
  hasDemonstrationData: boolean;
  
  // Computed
  activeWorkspace: Workspace | null;
  activeProject: Project | null;
  activeProjectWorksList: Array<ProjectWork & { work: Work }>;
  projectStats: ProjectStats;
  unreadNotificationCount: number;
  
  // Navigation & Simulation
  setActiveWorkspaceId: (id: string | null) => void;
  setActiveProjectId: (id: string | null) => void;
  setActiveTab: (tab: TabType) => void;
  setCurrentRole: (role: Role | 'non-member') => void;
  setActiveTrailId: (id: string | null) => void;
  setSelectedTrailCandidateId: (id: string | null) => void;
  setSelectedReadingWorkId: (id: string | null) => void;
  setStudyNextPreferences: (prefs: Partial<StudyNextPreferences>) => void;
  
  // Actions
  createWorkspace: (data: { name: string; description: string; politeEmail?: string }) => Promise<Workspace>;
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<void>;
  softDeleteWorkspace: (id: string) => Promise<void>;
  inviteMember: (email: string, name: string, role: Role) => Promise<void>;
  updateMemberRole: (memberId: string, newRole: Role) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  
  createProject: (data: { title: string; researchQuestion: string; discipline: string; description: string; initialKeywords: string[] }) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  softDeleteProject: (id: string) => Promise<void>;
  restoreProject: (id: string) => Promise<void>;
  
  addWorkToProject: (work: Omit<Work, 'id' | 'createdAt' | 'updatedAt'>, options?: { inclusionStatus?: InclusionStatus; readStatus?: ReadStatus; notes?: string; tags?: string[] }) => Promise<void>;
  updateProjectWork: (projectWorkId: string, updates: Partial<ProjectWork>) => Promise<void>;
  removeWorkFromProject: (projectWorkId: string) => Promise<void>;
  
  createAnnotation: (data: { workId: string; text: string; quoteText?: string; passageReference?: string; pageNumber?: number; claimType: ClaimType; mentions?: string[] }) => Promise<void>;
  addAnnotationReply: (annotationId: string, text: string, mentions?: string[]) => Promise<void>;
  deleteAnnotation: (id: string) => Promise<void>;
  
  createTag: (data: { name: string; color: string; description?: string }) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  
  createEvidenceRecord: (data: { workId: string; claimStatement: string; supportStrength: SupportStrength; verbatimPassage: string; pageOrSection: string; warrantExplanation?: string; verificationStatus: VerificationStatus; subClaimCategory?: string }) => Promise<void>;
  updateEvidenceRecord: (id: string, data: Partial<EvidenceRecord>) => Promise<void>;
  deleteEvidenceRecord: (id: string) => Promise<void>;
  
  executeSearch: (queryText: string, filters: any) => Promise<Work[]>;
  resolveWork: (identifierOrCitation: string) => Promise<Work>;
  importBibtexOrRis: (content: string) => Promise<{ works: Work[]; totalImported: number; resolvedWithDoiCount: number }>;
  refreshWorkMetadata: (workId: string) => Promise<Work>;
  saveMapSnapshot: (data: { title: string; layoutType: 'cose' | 'concentric' | 'circle' | 'breadthfirst' | 'grid'; elementsJson: string; notes?: string }) => Promise<void>;
  
  // Discovery-to-Reading Workflow Actions
  setCandidateState: (workId: string, state: CandidateWorkState, options?: { exclusionReason?: string; notes?: string; tags?: string[]; studyPriority?: 'high' | 'medium' | 'low'; readingProgress?: 'unread' | 'in_progress' | 'completed'; feedback?: CandidateFeedbackType }) => Promise<void>;
  addToDiscoveryTray: (work: Work, sourceTrailId?: string, sourceTrailTitle?: string, reasons?: any[]) => Promise<void>;
  removeFromDiscoveryTray: (workId: string) => Promise<void>;
  clearDiscoveryTray: (projectId?: string) => Promise<void>;
  bulkUpdateTrayCandidates: (workIds: string[], targetState: CandidateWorkState, options?: { tags?: string[]; exclusionReason?: string; notes?: string }) => Promise<void>;
  submitCandidateFeedback: (workId: string, feedbackType: CandidateFeedbackType, notes?: string, scope?: 'project' | 'workspace') => Promise<void>;
  fetchStudyNextRecommendations: (overridePrefs?: Partial<StudyNextPreferences>) => Promise<StudyNextShortlistResult | null>;
  generateReadingPrompt: (work: Work, role?: CandidateRole, notes?: string) => Promise<ReadingPromptResponse>;
  assignStudyQueueCollaborator: (itemId: string, collaboratorId: string, collaboratorName: string) => Promise<void>;
  setStudyQueueDueDate: (itemId: string, dueDate: string) => Promise<void>;
  setStudyQueuePriority: (itemId: string, priority: 'high' | 'medium' | 'low') => Promise<void>;
  setStudyQueueStatus: (itemId: string, status: StudyQueueItem['status']) => Promise<void>;

  // Citation Trails Actions
  fetchCitationTrails: () => Promise<void>;
  fetchCitationTrailData: (trailId: string) => Promise<void>;
  createCitationTrail: (data: { title: string; trailType: TrailType; seedWorks: Work[]; parentTrailId?: string | null; researcherNotes?: string }) => Promise<CitationTrail>;
  branchCitationTrail: (parentTrailId: string, data: { title: string; trailType: TrailType; seedWorks: Work[]; researcherNotes?: string }) => Promise<CitationTrail>;
  loadMoreTrailCandidates: (trailId: string) => Promise<void>;
  updateCandidateDecision: (trailId: string, candidateId: string, status: CandidateDecision, relevanceNotes?: string) => Promise<void>;
  updateCitationTrail: (trailId: string, updates: Partial<CitationTrail>) => Promise<void>;
  createTrailSnapshot: (trailId: string, title: string) => Promise<TrailSnapshot>;
  duplicateCitationTrail: (trailId: string, newTitle?: string) => Promise<CitationTrail>;
  addToStudyQueue: (work: Work, trailId?: string, trailTitle?: string, notes?: string) => Promise<void>;
  removeFromStudyQueue: (workIdOrItemId: string) => Promise<void>;
  updateStudyQueueItem: (itemId: string, updates: Partial<StudyQueueItem>) => Promise<void>;
  executeExplorationPreview: (action: string, seedWorks: Work[]) => Promise<{ candidates: DiscoveryCandidate[]; totalAvailable: number; warnings: string[]; provenanceSummary: string }>;

  // Scite Verification Layer Actions
  verifyWorkWithScite: (workId: string, doi?: string) => Promise<SciteWorkVerificationResult>;
  runBatchSciteVerification: (workIds: string[]) => Promise<void>;
  fetchSciteConfig: () => Promise<void>;
  updateSciteConfig: (updates: Partial<SciteWorkspaceConfig>) => Promise<void>;
  saveReferenceCheckRun: (run: SciteReferenceCheckRun) => void;
  
  // Research Monitoring Actions
  fetchMonitors: () => Promise<void>;
  createMonitor: (data: { title: string; sourceType: 'search_query' | 'seed_set'; queryText?: string; queryFilters?: Record<string, any>; seedWorkIds?: string[]; frequency?: 'daily' | 'weekly' | 'monthly' }) => Promise<StoredMonitor>;
  updateMonitor: (id: string, updates: Partial<StoredMonitor>) => Promise<void>;
  deleteMonitor: (id: string) => Promise<void>;
  runMonitorNow: (id: string) => Promise<{ newFoundCount: number; message: string }>;
  dismissMonitoredCandidate: (candidateId: string) => Promise<void>;
  importMonitoredCandidate: (candidate: MonitoredCandidate) => Promise<void>;
  
  // MCP Actions
  testMcpConnection: (force?: boolean) => Promise<McpConnectionStatus>;
  executeMcpAction: (action: 'check_duplication' | 'map_debate_lines' | 'assess_saturation' | 'suggest_candidates', additionalContext?: string) => Promise<McpExecutionResult>;
  
  // Notification Actions
  markNotificationRead: (id: string) => Promise<void>;
  
  // Export Actions
  exportBibTeX: () => Promise<string>;
  exportRIS: () => Promise<string>;
  exportCSV: () => Promise<string>;
  exportMarkdown: () => Promise<string>;
  generateAuditReport: () => Promise<{ jsonReport: any; markdownReport: string }>;
  
  recordAudit: (action: string, targetType: AuditEvent['targetType'], targetId: string, details: Record<string, any>, isDestructive?: boolean) => void;
  resetToSampleData: () => void;
  cleanAllWorkspacesAndProjects: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_PREFIX = 'evidence_atlas_v6_';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn(`Failed to read ${key} from storage`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Failed to save ${key} to storage`, e);
  }
}

const SAMPLE_MONITOR: StoredMonitor = {
  id: 'mon_reproducibility_frontiers',
  projectId: SAMPLE_PROJECT.id,
  title: 'Weekly Frontier: Foundation Model Evaluation & Reproducibility',
  sourceType: 'search_query',
  queryText: 'foundation model evaluation metrics reproducibility',
  queryFilters: { yearMin: 2023, openAccessOnly: true },
  frequency: 'weekly',
  enabled: true,
  lastRunAt: new Date(Date.now() - 3600 * 1000 * 24 * 3).toISOString(),
  lastRunStatus: 'success',
  newWorksFoundCount: 1,
  totalCandidatesGenerated: 1,
  createdBy: SAMPLE_USER.id,
  createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 14).toISOString(),
  updatedAt: new Date().toISOString()
};

const DEMO_WORK_1: Work = SAMPLE_WORKS[0];
const DEMO_WORK_2: Work = SAMPLE_WORKS[1];
const DEMO_WORK_3: Work = SAMPLE_WORKS[8] || SAMPLE_WORKS[0];

const SAMPLE_NOTIFICATION: Notification = {
  id: 'notif_init_1',
  userId: SAMPLE_USER.id,
  type: 'work_added',
  title: 'Research Monitor Alert',
  message: 'Weekly Frontier monitor identified 1 new high-relevance study on metric continuity and reproducibility.',
  read: false,
  createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
};

const SAMPLE_TRAIL: CitationTrail = {
  id: 'trail_transformer_lineage_01',
  workspaceId: SAMPLE_WORKSPACE.id,
  projectId: SAMPLE_PROJECT.id,
  createdBy: SAMPLE_USER.id,
  creatorName: SAMPLE_USER.displayName,
  createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 3).toISOString(),
  updatedAt: new Date(Date.now() - 3600 * 1000 * 24 * 1).toISOString(),
  parentTrailId: null,
  rootTrailId: 'trail_transformer_lineage_01',
  title: 'Transformer Architecture & Sequence Transduction (Earlier Work)',
  trailType: 'earlier_work',
  seedWorkIds: [SAMPLE_WORKS[0]?.id || 'work_vaswani_2017'],
  seedWorks: [SAMPLE_WORKS[0]],
  providerSources: ['OpenAlex Polite Pool', 'Crossref'],
  requestParams: { direction: 'earlier' },
  resultLimit: 25,
  offset: 0,
  totalAvailable: 42,
  hasMore: false,
  provenanceSummary: 'OpenAlex-derived references for Vaswani et al. (2017)',
  retrievalTimestamps: [new Date(Date.now() - 3600 * 1000 * 24 * 3).toISOString()],
  mapLayoutState: {},
  status: 'active',
  researcherNotes: 'Traces precursor sequence-to-sequence and attention alignment papers prior to the Transformer architecture.',
  decisions: {},
  coverageWarnings: []
};

const SAMPLE_STUDY_QUEUE_ITEM: StudyQueueItem = {
  id: 'queue_init_1',
  projectId: SAMPLE_PROJECT.id,
  workId: SAMPLE_WORKS[3]?.id || 'work_schaeffer_2023',
  work: SAMPLE_WORKS[3],
  sourceTrailId: SAMPLE_TRAIL.id,
  sourceTrailTitle: SAMPLE_TRAIL.title,
  addedBy: SAMPLE_USER.id,
  addedAt: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(),
  status: 'pending',
  priority: 'high',
  notes: 'Prioritize Section 3 on continuous metric conversions.'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser] = useState<User>(SAMPLE_USER);
  const [currentRole, setCurrentRole] = useState<Role | 'non-member'>('owner');
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => loadFromStorage('workspaces', [SAMPLE_WORKSPACE]));
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>(() => loadFromStorage('members', SAMPLE_MEMBERS));
  const [projects, setProjects] = useState<Project[]>(() => loadFromStorage('projects', [SAMPLE_PROJECT]));
  const [works, setWorks] = useState<Work[]>(() => loadFromStorage('works', SAMPLE_WORKS));
  const [projectWorks, setProjectWorks] = useState<ProjectWork[]>(() => loadFromStorage('projectWorks', SAMPLE_PROJECT_WORKS));
  const [annotations, setAnnotations] = useState<Annotation[]>(() => loadFromStorage('annotations', SAMPLE_ANNOTATIONS));
  const [tags, setTags] = useState<Tag[]>(() => loadFromStorage('tags', SAMPLE_TAGS));
  const [searches, setSearches] = useState<SearchLog[]>(() => loadFromStorage('searches', SAMPLE_SEARCH_LOGS));
  const [evidenceRecords, setEvidenceRecords] = useState<EvidenceRecord[]>(() => loadFromStorage('evidence', SAMPLE_EVIDENCE_RECORDS));
  const [mapSnapshots, setMapSnapshots] = useState<MapSnapshot[]>(() => loadFromStorage('mapSnapshots', []));
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(() => loadFromStorage('auditEvents', SAMPLE_AUDIT_EVENTS));
  const [sciteVerifications, setSciteVerifications] = useState<Record<string, SciteWorkVerificationResult>>(() => loadFromStorage('sciteVerifications', {}));
  const [sciteConfig, setSciteConfig] = useState<SciteWorkspaceConfig | null>(null);
  const [isVerifyingWork, setIsVerifyingWork] = useState<Record<string, boolean>>({});
  const [referenceCheckHistory, setReferenceCheckHistory] = useState<SciteReferenceCheckRun[]>(() => loadFromStorage('refChecks', []));

  // Research Monitors, Notifications, and MCP State
  const [monitors, setMonitors] = useState<StoredMonitor[]>(() => loadFromStorage('monitors', [SAMPLE_MONITOR]));
  const [monitoredCandidates, setMonitoredCandidates] = useState<MonitoredCandidate[]>(() => loadFromStorage('candidates', []));
  const [notifications, setNotifications] = useState<Notification[]>(() => loadFromStorage('notifications', [SAMPLE_NOTIFICATION]));
  const [mcpStatus, setMcpStatus] = useState<McpConnectionStatus | null>(null);
  const [mcpResults, setMcpResults] = useState<McpExecutionResult[]>(() => loadFromStorage('mcpResults', []));
  const [isMcpLoading, setIsMcpLoading] = useState<boolean>(false);

  // Citation Trails & Study Queue
  const [citationTrails, setCitationTrails] = useState<CitationTrail[]>(() => loadFromStorage('citationTrails', [SAMPLE_TRAIL]));
  const [activeTrailId, setActiveTrailId] = useState<string | null>(() => SAMPLE_TRAIL.id);
  const [activeTrailData, setActiveTrailData] = useState<{ trail: CitationTrail; candidates: DiscoveryCandidate[]; events: CitationTrailEvent[]; snapshots: TrailSnapshot[] } | null>(null);
  const [studyQueue, setStudyQueue] = useState<StudyQueueItem[]>(() => loadFromStorage('studyQueue', SAMPLE_STUDY_QUEUE || [SAMPLE_STUDY_QUEUE_ITEM]));
  const [selectedTrailCandidateId, setSelectedTrailCandidateId] = useState<string | null>(null);
  const [isTrailLoading, setIsTrailLoading] = useState<boolean>(false);

  // Discovery-to-Reading Workflow State
  const [projectCandidateStates, setProjectCandidateStates] = useState<ProjectCandidateState[]>(() => 
    loadFromStorage('candidate_states', SAMPLE_PROJECT_CANDIDATE_STATES || [])
  );
  const [studyNextShortlist, setStudyNextShortlist] = useState<StudyNextShortlistResult | null>(null);
  const [studyNextPreferences, setStudyNextPreferencesState] = useState<StudyNextPreferences>({
    emphasis: 'balanced',
    yearRange: [1990, 2026],
    excludedTypes: [],
    openAccessOnly: false,
    activeSeedIds: [],
    weightGraphVsSemantic: 'graph_primary'
  });
  const [isStudyNextLoading, setIsStudyNextLoading] = useState<boolean>(false);
  const [selectedReadingWorkId, setSelectedReadingWorkId] = useState<string | null>(null);

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() => SAMPLE_WORKSPACE.id);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => SAMPLE_PROJECT.id);
  const [activeTab, setActiveTab] = useState<TabType>('discover');

  // Paper Explorer Navigation Stack
  const [explorerWork, setExplorerWork] = useState<Work | null>(null);
  const [explorerHistory, setExplorerHistory] = useState<Work[]>([]);

  // Simple, persistent toast banner state
  const [toast, setToast] = useState<{ message: string; actionLabel?: string; onAction?: () => void } | null>(null);

  const showToast = useCallback((message: string, actionLabel?: string, onAction?: () => void) => {
    setToast({ message, actionLabel, onAction });
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  // Usability & First-Use Orientation
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const [dismissedGuide, setDismissedGuideState] = useState<boolean>(() => 
    loadFromStorage('dismissed_guide', false)
  );
  const setDismissedGuide = useCallback((val: boolean) => {
    setDismissedGuideState(val);
    saveToStorage('dismissed_guide', val);
  }, []);

  const [dismissedPaperHint, setDismissedPaperHintState] = useState<boolean>(() => 
    loadFromStorage('dismissed_paper_hint', false)
  );
  const setDismissedPaperHint = useCallback((val: boolean) => {
    setDismissedPaperHintState(val);
    saveToStorage('dismissed_paper_hint', val);
  }, []);

  const [dismissedCandidateHint, setDismissedCandidateHintState] = useState<boolean>(() => 
    loadFromStorage('dismissed_candidate_hint', false)
  );
  const setDismissedCandidateHint = useCallback((val: boolean) => {
    setDismissedCandidateHintState(val);
    saveToStorage('dismissed_candidate_hint', val);
  }, []);

  const [dismissedFirstAddHint, setDismissedFirstAddHintState] = useState<boolean>(() => 
    loadFromStorage('dismissed_first_add_hint', false)
  );
  const setDismissedFirstAddHint = useCallback((val: boolean) => {
    setDismissedFirstAddHintState(val);
    saveToStorage('dismissed_first_add_hint', val);
  }, []);

  const openPaperInExplorer = useCallback((work: Work) => {
    if (explorerWork && explorerWork.id !== work.id) {
      setExplorerHistory(prev => [...prev, explorerWork]);
    }
    setExplorerWork(work);
    setActiveTab('discover');
  }, [explorerWork]);

  const backInExplorer = useCallback(() => {
    setExplorerHistory(prev => {
      if (prev.length === 0) {
        setExplorerWork(null);
        return [];
      }
      const nextHistory = [...prev];
      const previousWork = nextHistory.pop() || null;
      setExplorerWork(previousWork);
      return nextHistory;
    });
  }, []);

  // Sync to local storage
  useEffect(() => { saveToStorage('workspaces', workspaces); }, [workspaces]);
  useEffect(() => { saveToStorage('members', workspaceMembers); }, [workspaceMembers]);
  useEffect(() => { saveToStorage('projects', projects); }, [projects]);
  useEffect(() => { saveToStorage('works', works); }, [works]);
  useEffect(() => { saveToStorage('projectWorks', projectWorks); }, [projectWorks]);
  useEffect(() => { saveToStorage('annotations', annotations); }, [annotations]);
  useEffect(() => { saveToStorage('tags', tags); }, [tags]);
  useEffect(() => { saveToStorage('searches', searches); }, [searches]);
  useEffect(() => { saveToStorage('evidence', evidenceRecords); }, [evidenceRecords]);
  useEffect(() => { saveToStorage('mapSnapshots', mapSnapshots); }, [mapSnapshots]);
  useEffect(() => { saveToStorage('auditEvents', auditEvents); }, [auditEvents]);
  useEffect(() => { saveToStorage('sciteVerifications', sciteVerifications); }, [sciteVerifications]);
  useEffect(() => { saveToStorage('refChecks', referenceCheckHistory); }, [referenceCheckHistory]);
  useEffect(() => { saveToStorage('monitors', monitors); }, [monitors]);
  useEffect(() => { saveToStorage('candidates', monitoredCandidates); }, [monitoredCandidates]);
  useEffect(() => { saveToStorage('notifications', notifications); }, [notifications]);
  useEffect(() => { saveToStorage('mcpResults', mcpResults); }, [mcpResults]);
  useEffect(() => { saveToStorage('citationTrails', citationTrails); }, [citationTrails]);
  useEffect(() => { saveToStorage('studyQueue', studyQueue); }, [studyQueue]);
  useEffect(() => { saveToStorage('candidate_states', projectCandidateStates); }, [projectCandidateStates]);

  // Load Scite workspace config on mount / workspace change
  useEffect(() => {
    fetchSciteConfig();
  }, [activeWorkspaceId]);

  const fetchSciteConfig = async () => {
    try {
      const res = await sciteApi.getSettings(activeWorkspaceId || 'ws_default');
      setSciteConfig(res.config);
    } catch (e) {
      console.warn('Scite config load notice:', e);
    }
  };

  const updateSciteConfig = async (updates: Partial<SciteWorkspaceConfig>) => {
    if (!permissions.canManageWorkspace) {
      throw new Error('Permission denied: Only workspace owners can update provider settings.');
    }
    const res = await sciteApi.updateSettings(updates, activeWorkspaceId || 'ws_default');
    if (res.success) {
      setSciteConfig(res.config);
      recordAudit('UPDATE_SCITE_PROVIDER_CONFIG', 'provider_config', 'scite', updates);
    }
  };

  const saveReferenceCheckRun = (run: SciteReferenceCheckRun) => {
    setReferenceCheckHistory(prev => [run, ...prev]);
    recordAudit('RUN_REFERENCE_CHECK', 'project', run.id, {
      totalChecked: run.totalChecked,
      retractions: run.retractionsCount,
      notices: run.editorialNoticesCount,
      contrasting: run.contrastingCount
    });
  };

  const verifyWorkWithScite = async (workId: string, doi?: string): Promise<SciteWorkVerificationResult> => {
    // Find matching work if doi not supplied
    let targetDoi = doi;
    if (!targetDoi) {
      const w = works.find(item => item.id === workId);
      targetDoi = w?.doi || undefined;
    }

    if (!targetDoi) {
      const failure: SciteWorkVerificationResult = {
        workId,
        doi: '',
        status: 'no_record',
        verifiedAt: new Date().toISOString(),
        error: 'Work does not contain a DOI identifier required for Scite Smart Citation verification.'
      };
      setSciteVerifications(prev => ({ ...prev, [workId]: failure }));
      return failure;
    }

    setIsVerifyingWork(prev => ({ ...prev, [workId]: true }));
    try {
      const result = await sciteApi.verifyWork(targetDoi, workId, activeWorkspaceId || 'ws_default');
      setSciteVerifications(prev => ({
        ...prev,
        [workId]: result,
        [targetDoi!]: result
      }));

      // If work has sciteId, update work record
      setWorks(prev => prev.map(w => {
        if (w.id === workId) {
          return {
            ...w,
            sciteId: result.status === 'evidence_available' ? `scite_${targetDoi}` : w.sciteId,
            updatedAt: new Date().toISOString()
          };
        }
        return w;
      }));

      recordAudit('VERIFY_WORK_SCITE', 'work', workId, {
        doi: targetDoi,
        status: result.status,
        tallies: result.tallies,
        noticesCount: result.editorialNotices?.length || 0
      });

      return result;
    } catch (err: any) {
      const errorResult: SciteWorkVerificationResult = {
        workId,
        doi: targetDoi,
        status: 'provider_unavailable',
        verifiedAt: new Date().toISOString(),
        error: err.message || 'Scite verification failed.'
      };
      setSciteVerifications(prev => ({ ...prev, [workId]: errorResult }));
      return errorResult;
    } finally {
      setIsVerifyingWork(prev => ({ ...prev, [workId]: false }));
    }
  };

  const runBatchSciteVerification = async (workIds: string[]) => {
    for (const id of workIds) {
      await verifyWorkWithScite(id);
    }
  };


  // Derived active objects
  const activeWorkspace = useMemo(() => {
    return workspaces.find(w => w.id === activeWorkspaceId && !w.deletedAt) || null;
  }, [workspaces, activeWorkspaceId]);

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId && !p.deletedAt) || null;
  }, [projects, activeProjectId]);

  const permissions = useMemo(() => {
    if (currentRole === 'non-member') {
      return getRolePermissions(null);
    }
    return getRolePermissions(currentRole);
  }, [currentRole]);

  // Record Audit Event helper
  const recordAudit = useCallback((
    action: string, 
    targetType: AuditEvent['targetType'], 
    targetId: string, 
    details: Record<string, any>, 
    isDestructive: boolean = false
  ) => {
    const newEvent: AuditEvent = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      workspaceId: activeWorkspaceId || 'ws_default',
      projectId: activeProjectId || undefined,
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action,
      targetType,
      targetId,
      details,
      isDestructive,
      timestamp: new Date().toISOString()
    };
    
    setAuditEvents(prev => [newEvent, ...prev]);

    // Send to backend endpoint for server-side persistence & validation
    fetch('/api/audit-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent)
    }).catch(err => console.warn('Server audit logging notice:', err));
  }, [activeWorkspaceId, activeProjectId, currentUser]);

  // Active Project Works with hydrated Work objects
  const activeProjectWorksList = useMemo(() => {
    if (!activeProjectId) return [];
    return projectWorks
      .filter(pw => pw.projectId === activeProjectId && !pw.deletedAt)
      .map(pw => {
        const matchingWork = works.find(w => w.id === pw.workId);
        return {
          ...pw,
          work: matchingWork || {
            id: pw.workId,
            title: 'Unknown Work',
            authors: [{ name: 'Unknown Author' }],
            year: 0,
            type: 'other' as const,
            citationCount: 0,
            referenceCount: 0,
            references: [],
            citedBy: [],
            provenance: { provider: 'Unknown', retrievedAt: new Date().toISOString() },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
      });
  }, [projectWorks, works, activeProjectId]);

  // Project Stats
  const projectStats = useMemo<ProjectStats>(() => {
    const list = activeProjectWorksList;
    const projectEv = evidenceRecords.filter(e => e.projectId === activeProjectId);
    const projectAnn = annotations.filter(a => a.projectId === activeProjectId);
    
    return {
      totalWorks: list.length,
      includedWorks: list.filter(w => w.inclusionStatus === 'included').length,
      candidateWorks: list.filter(w => w.inclusionStatus === 'candidate').length,
      excludedWorks: list.filter(w => w.inclusionStatus === 'excluded').length,
      completedReads: list.filter(w => w.readStatus === 'completed').length,
      readingWorks: list.filter(w => w.readStatus === 'reading').length,
      evidenceCount: projectEv.length,
      annotationsCount: projectAnn.length
    };
  }, [activeProjectWorksList, evidenceRecords, annotations, activeProjectId]);

  // Actions
  const createWorkspace = async (data: { name: string; description: string; politeEmail?: string }): Promise<Workspace> => {
    if (!permissions.canManageWorkspace && currentRole !== 'owner') {
      throw new Error('Permission denied: Only workspace owners can create workspaces.');
    }
    const newWs: Workspace = {
      id: `ws_${Date.now()}`,
      name: data.name,
      description: data.description,
      ownerId: currentUser.id,
      isPrivate: true,
      providerSettings: {
        openAlexEnabled: true,
        crossrefEnabled: true,
        semanticScholarEnabled: true,
        sciteEnabled: true,
        politeEmail: data.politeEmail || currentUser.email,
        rateLimitPerMinute: 60
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    };

    setWorkspaces(prev => [...prev, newWs]);
    setActiveWorkspaceId(newWs.id);
    recordAudit('CREATE_WORKSPACE', 'workspace', newWs.id, { name: newWs.name });
    return newWs;
  };

  const updateWorkspace = async (id: string, data: Partial<Workspace>) => {
    if (!permissions.canManageWorkspace) {
      throw new Error('Permission denied: Only owner can update workspace settings.');
    }
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, ...data, updatedAt: new Date().toISOString() } : w));
    recordAudit('UPDATE_WORKSPACE_SETTINGS', 'workspace', id, data);
  };

  const softDeleteWorkspace = async (id: string) => {
    if (!permissions.canDeleteWorkspace) {
      throw new Error('Permission denied: Only owner can delete workspace.');
    }
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, deletedAt: new Date().toISOString() } : w));
    recordAudit('DELETE_WORKSPACE_SOFT', 'workspace', id, {}, true);
    if (activeWorkspaceId === id) {
      const remaining = workspaces.filter(w => w.id !== id && !w.deletedAt);
      setActiveWorkspaceId(remaining[0]?.id || null);
    }
  };

  const inviteMember = async (email: string, name: string, role: Role) => {
    if (!permissions.canManageMembers) {
      throw new Error('Permission denied: Only workspace owner can manage members.');
    }
    const newMember: WorkspaceMember = {
      id: `mem_${Date.now()}`,
      workspaceId: activeWorkspaceId || 'ws_default',
      userId: `usr_${Date.now()}`,
      userEmail: email,
      userName: name,
      role,
      joinedAt: new Date().toISOString(),
      invitedBy: currentUser.id
    };
    setWorkspaceMembers(prev => [...prev, newMember]);
    recordAudit('INVITE_WORKSPACE_MEMBER', 'member', newMember.id, { email, role });
  };

  const updateMemberRole = async (memberId: string, newRole: Role) => {
    if (!permissions.canManageMembers) {
      throw new Error('Permission denied: Only owner can update member roles.');
    }
    setWorkspaceMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    recordAudit('UPDATE_MEMBER_ROLE', 'member', memberId, { newRole });
  };

  const removeMember = async (memberId: string) => {
    if (!permissions.canManageMembers) {
      throw new Error('Permission denied: Only owner can remove members.');
    }
    setWorkspaceMembers(prev => prev.filter(m => m.id !== memberId));
    recordAudit('REVOKE_MEMBER_ACCESS', 'member', memberId, {}, true);
  };

  const createProject = async (data: { title: string; researchQuestion: string; discipline: string; description: string; initialKeywords: string[] }): Promise<Project> => {
    if (!permissions.canCreateProject) {
      throw new Error('Permission denied: Viewers or commenters cannot create projects.');
    }
    const newProject: Project = {
      id: `proj_${Date.now()}`,
      workspaceId: activeWorkspaceId || 'ws_default',
      title: data.title,
      researchQuestion: data.researchQuestion,
      discipline: data.discipline,
      description: data.description,
      initialKeywords: data.initialKeywords,
      isPrivate: true,
      createdBy: currentUser.id,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setActiveTab('library');
    recordAudit('CREATE_PROJECT', 'project', newProject.id, { title: newProject.title });
    return newProject;
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
    if (!permissions.canEditProjectDetails) {
      throw new Error('Permission denied: Editors or Owner required.');
    }
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p));
    recordAudit('UPDATE_PROJECT_METADATA', 'project', id, data);
  };

  const softDeleteProject = async (id: string) => {
    if (!permissions.canDeleteProject) {
      throw new Error('Permission denied: Only workspace owner can delete projects.');
    }
    setProjects(prev => prev.map(p => p.id === id ? { ...p, deletedAt: new Date().toISOString() } : p));
    recordAudit('DELETE_PROJECT_SOFT', 'project', id, {}, true);
    if (activeProjectId === id) {
      const remaining = projects.filter(p => p.id !== id && !p.deletedAt);
      setActiveProjectId(remaining[0]?.id || null);
    }
  };

  const restoreProject = async (id: string) => {
    if (!permissions.canDeleteProject) {
      throw new Error('Permission denied: Only workspace owner can restore projects.');
    }
    setProjects(prev => prev.map(p => p.id === id ? { ...p, deletedAt: null } : p));
    recordAudit('RESTORE_PROJECT', 'project', id, {});
  };

  const addWorkToProject = async (
    workData: Omit<Work, 'id' | 'createdAt' | 'updatedAt'>,
    options?: { inclusionStatus?: InclusionStatus; readStatus?: ReadStatus; notes?: string; tags?: string[] }
  ) => {
    if (!permissions.canAddWorks) {
      throw new Error('Permission denied: Commenters and Viewers cannot add literature.');
    }

    if (!activeProjectId) {
      throw new Error('No active project selected.');
    }

    // Check if work already exists globally
    let workId = '';
    const existingWork = works.find(w => 
      (w.doi && workData.doi && w.doi.toLowerCase() === workData.doi.toLowerCase()) ||
      (w.title.toLowerCase() === workData.title.toLowerCase())
    );

    if (existingWork) {
      workId = existingWork.id;
    } else {
      workId = `work_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newWork: Work = {
        id: workId,
        ...workData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setWorks(prev => [...prev, newWork]);
    }

    // Check if already in current project
    const existingProjectWork = projectWorks.find(pw => pw.projectId === activeProjectId && pw.workId === workId && !pw.deletedAt);
    if (existingProjectWork) {
      // Update status if provided
      if (options?.inclusionStatus) {
        await updateProjectWork(existingProjectWork.id, { 
          inclusionStatus: options.inclusionStatus,
          personalNotes: options.notes ?? existingProjectWork.personalNotes,
          tags: options.tags ?? existingProjectWork.tags
        });
      }
      return;
    }

    const newProjectWork: ProjectWork = {
      id: `pw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId: activeProjectId,
      workId,
      readStatus: options?.readStatus || 'unread',
      inclusionStatus: options?.inclusionStatus || 'candidate',
      personalNotes: options?.notes || '',
      tags: options?.tags || [],
      addedBy: currentUser.id,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    };

    setProjectWorks(prev => [...prev, newProjectWork]);
    recordAudit('ADD_WORK_TO_PROJECT', 'work', workId, { 
      projectId: activeProjectId, 
      title: workData.title,
      doi: workData.doi,
      status: newProjectWork.inclusionStatus 
    });
  };

  const updateProjectWork = async (projectWorkId: string, updates: Partial<ProjectWork>) => {
    if (!permissions.canEditWorks) {
      throw new Error('Permission denied: Insufficient privileges to modify literature.');
    }
    setProjectWorks(prev => prev.map(pw => pw.id === projectWorkId ? { ...pw, ...updates, updatedAt: new Date().toISOString() } : pw));
    recordAudit('UPDATE_PROJECT_WORK_STATUS', 'work', projectWorkId, updates);
  };

  const removeWorkFromProject = async (projectWorkId: string) => {
    if (!permissions.canRemoveWorks) {
      throw new Error('Permission denied: Only Editors and Owners can remove literature.');
    }
    setProjectWorks(prev => prev.map(pw => pw.id === projectWorkId ? { ...pw, deletedAt: new Date().toISOString() } : pw));
    recordAudit('REMOVE_WORK_FROM_PROJECT', 'work', projectWorkId, {}, true);
  };

  const hasDemonstrationData = useMemo(() => {
    return activeProjectWorksList.some(pw => pw.isDemonstration === true || pw.workId.startsWith('demo_work_'));
  }, [activeProjectWorksList]);

  const loadDemonstrationData = async () => {
    if (!activeProjectId) return;
    
    // Add demo works to works list if not present
    setWorks(prev => {
      const demoWorks = [DEMO_WORK_1, DEMO_WORK_2, DEMO_WORK_3];
      const next = [...prev];
      for (const dw of demoWorks) {
        if (!next.some(w => w.id === dw.id)) {
          next.push(dw);
        }
      }
      return next;
    });

    // Add demo projectWorks
    const now = new Date().toISOString();
    const demoPWs: ProjectWork[] = [
      {
        id: `pw_demo_1_${Date.now()}`,
        projectId: activeProjectId,
        workId: DEMO_WORK_1.id,
        readStatus: 'unread',
        inclusionStatus: 'included',
        tags: ['Foundational'],
        isDemonstration: true,
        addedBy: currentUser.id,
        addedAt: now,
        updatedAt: now,
        deletedAt: null
      },
      {
        id: `pw_demo_2_${Date.now()}`,
        projectId: activeProjectId,
        workId: DEMO_WORK_2.id,
        readStatus: 'unread',
        inclusionStatus: 'included',
        tags: ['Downstream'],
        isDemonstration: true,
        addedBy: currentUser.id,
        addedAt: now,
        updatedAt: now,
        deletedAt: null
      },
      {
        id: `pw_demo_3_${Date.now()}`,
        projectId: activeProjectId,
        workId: DEMO_WORK_3.id,
        readStatus: 'unread',
        inclusionStatus: 'included',
        tags: ['Precursor'],
        isDemonstration: true,
        addedBy: currentUser.id,
        addedAt: now,
        updatedAt: now,
        deletedAt: null
      }
    ];

    setProjectWorks(prev => [...prev, ...demoPWs]);
    showToast('Loaded demonstration data (3 example papers). You can explore, see connections, or remove demo data anytime.');
  };

  const removeDemonstrationData = async () => {
    if (!activeProjectId) return;
    setProjectWorks(prev => prev.filter(pw => !(pw.projectId === activeProjectId && (pw.isDemonstration || pw.workId.startsWith('demo_work_')))));
    showToast('Removed demonstration data.');
  };

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Load monitors for active project
  const fetchMonitors = useCallback(async () => {
    if (!activeProjectId) return;
    try {
      const res = await monitorApi.getMonitors(activeProjectId);
      if (res.monitors) {
        setMonitors(prev => {
          const otherProjectMons = prev.filter(m => m.projectId !== activeProjectId);
          return [...otherProjectMons, ...res.monitors];
        });
      }
      const candRes = await monitorApi.getCandidates(activeProjectId);
      if (candRes.candidates) {
        setMonitoredCandidates(candRes.candidates);
      }
    } catch (e) {
      console.warn('Could not fetch monitors from backend:', e);
    }
  }, [activeProjectId]);

  useEffect(() => {
    fetchMonitors();
  }, [activeProjectId, fetchMonitors]);

  const createAnnotation = async (data: { 
    workId: string; 
    text: string; 
    quoteText?: string; 
    passageReference?: string; 
    pageNumber?: number; 
    claimType: ClaimType;
    mentions?: string[];
  }) => {
    if (!permissions.canCreateAnnotations) {
      throw new Error('Permission denied: Viewers cannot create annotations.');
    }
    if (!activeProjectId) return;

    const newAnn: Annotation = {
      id: `ann_${Date.now()}`,
      projectId: activeProjectId,
      workId: data.workId,
      userId: currentUser.id,
      userName: currentUser.displayName,
      userEmail: currentUser.email,
      userAvatar: currentUser.avatarUrl,
      text: data.text,
      quoteText: data.quoteText,
      passageReference: data.passageReference,
      pageNumber: data.pageNumber,
      claimType: data.claimType,
      mentions: data.mentions || [],
      replies: [],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setAnnotations(prev => [...prev, newAnn]);
    recordAudit('CREATE_ANNOTATION', 'annotation', newAnn.id, { workId: data.workId, claimType: data.claimType });

    // Generate in-app notifications if team members were mentioned
    if (data.mentions && data.mentions.length > 0) {
      const targetWork = works.find(w => w.id === data.workId);
      const newNotifs: Notification[] = data.mentions.map(email => ({
        id: `notif_mention_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: email,
        type: 'annotation',
        title: `${currentUser.displayName} mentioned you in an annotation`,
        message: `On "${targetWork?.title?.substring(0, 45) || 'Literature'}": "${data.text.substring(0, 80)}..."`,
        read: false,
        createdAt: new Date().toISOString()
      }));
      setNotifications(prev => [...newNotifs, ...prev]);
    }
  };

  const addAnnotationReply = async (annotationId: string, text: string, mentions?: string[]) => {
    if (!permissions.canCreateAnnotations) {
      throw new Error('Permission denied: Viewers cannot reply to annotations.');
    }
    const reply: AnnotationReply = {
      id: `reply_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.displayName,
      userEmail: currentUser.email,
      userAvatar: currentUser.avatarUrl,
      text,
      mentions: mentions || [],
      createdAt: new Date().toISOString()
    };

    setAnnotations(prev => prev.map(ann => {
      if (ann.id !== annotationId) return ann;
      return {
        ...ann,
        replies: [...(ann.replies || []), reply],
        updatedAt: new Date().toISOString()
      };
    }));

    recordAudit('ADD_ANNOTATION_REPLY', 'annotation', annotationId, { textLength: text.length });

    // Mention notifications
    if (mentions && mentions.length > 0) {
      const newNotifs: Notification[] = mentions.map(email => ({
        id: `notif_mention_reply_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: email,
        type: 'annotation',
        title: `${currentUser.displayName} mentioned you in a comment reply`,
        message: `"${text.substring(0, 80)}..."`,
        read: false,
        createdAt: new Date().toISOString()
      }));
      setNotifications(prev => [...newNotifs, ...prev]);
    }
  };

  const createMonitor = async (data: { 
    title: string; 
    sourceType: 'search_query' | 'seed_set'; 
    queryText?: string; 
    queryFilters?: Record<string, any>; 
    seedWorkIds?: string[]; 
    frequency?: 'daily' | 'weekly' | 'monthly' 
  }): Promise<StoredMonitor> => {
    if (!permissions.canCreateProject) {
      throw new Error('Permission denied: Only editors or owners can create research monitors.');
    }
    if (!activeProjectId) throw new Error('No active project');

    const res = await monitorApi.createMonitor({
      projectId: activeProjectId,
      title: data.title,
      sourceType: data.sourceType,
      queryText: data.queryText,
      queryFilters: data.queryFilters,
      seedWorkIds: data.seedWorkIds,
      frequency: data.frequency || 'weekly',
      enabled: true,
      createdBy: currentUser.id
    });

    setMonitors(prev => [res.monitor, ...prev]);
    recordAudit('CREATE_RESEARCH_MONITOR', 'project', res.monitor.id, { title: data.title });
    return res.monitor;
  };

  const updateMonitor = async (id: string, updates: Partial<StoredMonitor>) => {
    if (!permissions.canCreateProject) {
      throw new Error('Permission denied: Only editors or owners can modify monitors.');
    }
    const res = await monitorApi.updateMonitor(id, updates);
    setMonitors(prev => prev.map(m => m.id === id ? res.monitor : m));
    recordAudit('UPDATE_RESEARCH_MONITOR', 'project', id, updates);
  };

  const deleteMonitor = async (id: string) => {
    if (!permissions.canCreateProject) {
      throw new Error('Permission denied: Only editors or owners can delete monitors.');
    }
    await monitorApi.deleteMonitor(id);
    setMonitors(prev => prev.filter(m => m.id !== id));
    recordAudit('DELETE_RESEARCH_MONITOR', 'project', id, {}, true);
  };

  const runMonitorNow = async (id: string): Promise<{ newFoundCount: number; message: string }> => {
    const knownWorksList = activeProjectWorksList.map(pw => pw.work);
    const res = await monitorApi.runMonitorNow(id, knownWorksList);
    
    setMonitors(prev => prev.map(m => m.id === id ? res.monitor : m));
    if (res.newCandidates.length > 0) {
      setMonitoredCandidates(prev => [...res.newCandidates, ...prev]);
      
      // Also notify in-app
      const newNotif: Notification = {
        id: `notif_run_${Date.now()}`,
        userId: currentUser.id,
        type: 'work_added',
        title: `Monitor Checked: ${res.monitor.title}`,
        message: `Identified ${res.newCandidates.length} new scholarly candidate(s).`,
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [newNotif, ...prev]);
    }

    recordAudit('RUN_RESEARCH_MONITOR_ON_DEMAND', 'project', id, {
      newWorksFound: res.newCandidates.length,
      isDuplicateRun: res.isDuplicateRun
    });

    return {
      newFoundCount: res.newCandidates.length,
      message: res.message
    };
  };

  const dismissMonitoredCandidate = async (candidateId: string) => {
    if (!activeProjectId) return;
    await monitorApi.dismissCandidate(activeProjectId, candidateId);
    setMonitoredCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, dismissed: true } : c));
  };

  const importMonitoredCandidate = async (candidate: MonitoredCandidate) => {
    if (!activeProjectId) return;
    await addWorkToProject(candidate.work, { inclusionStatus: 'candidate' });
    await monitorApi.importCandidate(activeProjectId, candidate.id);
    setMonitoredCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, importedToProject: true } : c));
  };

  const testMcpConnection = async (force: boolean = false): Promise<McpConnectionStatus> => {
    try {
      const status = await mcpApi.selfTest(force);
      setMcpStatus(status);
      return status;
    } catch (err: any) {
      const fallback: McpConnectionStatus = {
        url: 'https://mcp.open-literature.org/v1',
        connected: false,
        status: 'unavailable',
        latencyMs: 0,
        availableTools: [],
        message: 'Optional provider unavailable; OpenAlex discovery remains fully functional.',
        testedAt: new Date().toISOString()
      };
      setMcpStatus(fallback);
      return fallback;
    }
  };

  const executeMcpAction = async (
    action: 'check_duplication' | 'map_debate_lines' | 'assess_saturation' | 'suggest_candidates',
    additionalContext?: string
  ): Promise<McpExecutionResult> => {
    if (!activeProject) throw new Error('No active project');
    setIsMcpLoading(true);

    try {
      const knownWorksList = activeProjectWorksList.map(pw => pw.work);
      const result = await mcpApi.execute({
        action,
        researchQuestion: activeProject.researchQuestion,
        discipline: activeProject.discipline,
        projectTitle: activeProject.title,
        existingWorks: knownWorksList,
        additionalContext,
        projectId: activeProject.id,
        userId: currentUser.id,
        userEmail: currentUser.email
      });

      setMcpResults(prev => [result, ...prev]);
      recordAudit('EXECUTE_FAST_TRACK_MCP_ACTION', 'project', activeProject.id, {
        action,
        leadsCount: result.candidateWorks.length,
        sourcesConsultedCount: result.sourcesConsulted.length
      });

      return result;
    } finally {
      setIsMcpLoading(false);
    }
  };

  const markNotificationRead = async (id: string) => {
    await monitorApi.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Export actions
  const exportBibTeX = async (): Promise<string> => {
    const list = activeProjectWorksList.map(pw => pw.work);
    const content = await exportApi.downloadBibTeX(list);
    recordAudit('EXPORT_BIBLIOGRAPHY_BIBTEX', 'project', activeProjectId || 'proj', { workCount: list.length });
    return content;
  };

  const exportRIS = async (): Promise<string> => {
    const list = activeProjectWorksList.map(pw => pw.work);
    const content = await exportApi.downloadRIS(list);
    recordAudit('EXPORT_BIBLIOGRAPHY_RIS', 'project', activeProjectId || 'proj', { workCount: list.length });
    return content;
  };

  const exportCSV = async (): Promise<string> => {
    const worksList = works;
    const projectWorksList = projectWorks.filter(pw => pw.projectId === activeProjectId && !pw.deletedAt);
    const content = await exportApi.downloadCSV(projectWorksList, worksList);
    recordAudit('EXPORT_FIELD_PROVENANCE_CSV', 'project', activeProjectId || 'proj', { workCount: projectWorksList.length });
    return content;
  };

  const exportMarkdown = async (): Promise<string> => {
    if (!activeProject) throw new Error('No active project');
    const worksList = works;
    const projectWorksList = projectWorks.filter(pw => pw.projectId === activeProjectId && !pw.deletedAt);
    const content = await exportApi.downloadMarkdown(activeProject, projectWorksList, worksList);
    recordAudit('EXPORT_BIBLIOGRAPHY_MARKDOWN', 'project', activeProject.id, { workCount: projectWorksList.length });
    return content;
  };

  const generateAuditReport = async (): Promise<{ jsonReport: any; markdownReport: string }> => {
    if (!activeProject) throw new Error('No active project');
    const currentProjectWorks = projectWorks.filter(pw => pw.projectId === activeProjectId && !pw.deletedAt);
    const currentEvidence = evidenceRecords.filter(e => e.projectId === activeProjectId);
    const currentSearches = searches.filter(s => s.projectId === activeProjectId);
    const currentMonitors = monitors.filter(m => m.projectId === activeProjectId);

    const report = await exportApi.generateAuditReport({
      project: activeProject,
      projectWorks: currentProjectWorks,
      allWorks: works,
      evidenceRecords: currentEvidence,
      searchLogs: currentSearches,
      monitors: currentMonitors
    });

    recordAudit('GENERATE_REPRODUCIBLE_RESEARCH_AUDIT_REPORT', 'project', activeProject.id, {
      worksCount: currentProjectWorks.length,
      claimsCount: currentEvidence.length
    });

    return report;
  };

  const deleteAnnotation = async (id: string) => {
    const target = annotations.find(a => a.id === id);
    if (!target) return;
    const isSelf = target.userId === currentUser.id;
    if (!isSelf && !permissions.canDeleteAnyAnnotation) {
      throw new Error('Permission denied: You can only delete your own annotations.');
    }
    setAnnotations(prev => prev.filter(a => a.id !== id));
    recordAudit('DELETE_ANNOTATION', 'annotation', id, {}, true);
  };

  const createTag = async (data: { name: string; color: string; description?: string }) => {
    if (!permissions.canManageTags) {
      throw new Error('Permission denied: Only Editors and Owners can manage tags.');
    }
    if (!activeProjectId) return;

    const newTag: Tag = {
      id: `tag_${Date.now()}`,
      projectId: activeProjectId,
      name: data.name,
      color: data.color,
      description: data.description,
      createdAt: new Date().toISOString()
    };

    setTags(prev => [...prev, newTag]);
    recordAudit('CREATE_TAG', 'tag', newTag.id, { name: data.name });
  };

  const deleteTag = async (id: string) => {
    if (!permissions.canManageTags) {
      throw new Error('Permission denied: Only Editors and Owners can delete tags.');
    }
    setTags(prev => prev.filter(t => t.id !== id));
    recordAudit('DELETE_TAG', 'tag', id, {}, true);
  };

  const createEvidenceRecord = async (data: { 
    workId: string; 
    claimStatement: string; 
    supportStrength: SupportStrength; 
    verbatimPassage: string; 
    pageOrSection: string; 
    warrantExplanation?: string; 
    verificationStatus: VerificationStatus; 
    subClaimCategory?: string 
  }) => {
    if (!permissions.canCreateEvidence) {
      throw new Error('Permission denied: Only Editors and Owners can record verified evidence.');
    }
    if (!activeProjectId) return;

    const matchedWork = works.find(w => w.id === data.workId);

    const newRecord: EvidenceRecord = {
      id: `ev_${Date.now()}`,
      projectId: activeProjectId,
      workId: data.workId,
      workTitle: matchedWork?.title,
      workAuthors: matchedWork?.authors?.map(a => a.name).join(', '),
      workYear: matchedWork?.year,
      claimStatement: data.claimStatement,
      supportStrength: data.supportStrength,
      verbatimPassage: data.verbatimPassage,
      pageOrSection: data.pageOrSection,
      warrantExplanation: data.warrantExplanation,
      verificationStatus: data.verificationStatus,
      verifiedBy: currentUser.displayName,
      subClaimCategory: data.subClaimCategory || 'Core Findings',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setEvidenceRecords(prev => [...prev, newRecord]);
    recordAudit('CREATE_EVIDENCE_RECORD', 'work', newRecord.id, { 
      claim: data.claimStatement,
      strength: data.supportStrength,
      status: data.verificationStatus 
    });
  };

  const updateEvidenceRecord = async (id: string, data: Partial<EvidenceRecord>) => {
    if (!permissions.canCreateEvidence) {
      throw new Error('Permission denied: Only Editors and Owners can update evidence matrix.');
    }
    setEvidenceRecords(prev => prev.map(e => e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e));
    recordAudit('UPDATE_EVIDENCE_RECORD', 'work', id, data);
  };

  const deleteEvidenceRecord = async (id: string) => {
    if (!permissions.canCreateEvidence) {
      throw new Error('Permission denied: Only Editors and Owners can delete evidence records.');
    }
    setEvidenceRecords(prev => prev.filter(e => e.id !== id));
    recordAudit('DELETE_EVIDENCE_RECORD', 'work', id, {}, true);
  };

  const executeSearch = async (queryText: string, filters: any): Promise<Work[]> => {
    if (!permissions.canExecuteSearches) {
      throw new Error('Permission denied: Viewers cannot execute search queries.');
    }
    if (!activeProjectId) return [];

    try {
      // Call Node.js server scholarly endpoint (OpenAlex & Crossref with polite headers and caching)
      const searchRes = await scholarlyApi.searchWorks(queryText, filters);
      const retrievedWorks = searchRes.works;

      // Add newly discovered works to global works pool without duplication
      if (retrievedWorks.length > 0) {
        setWorks(prev => {
          const existingIds = new Set(prev.map(w => w.id));
          const existingDois = new Set(prev.map(w => w.doi?.toLowerCase()).filter(Boolean));
          const newOnes = retrievedWorks.filter(w => !existingIds.has(w.id) && (!w.doi || !existingDois.has(w.doi.toLowerCase())));
          return [...prev, ...newOnes];
        });
      }

      const searchEntry: SearchLog = {
        id: `srch_${Date.now()}`,
        projectId: activeProjectId,
        queryText: searchRes.query,
        queryFilters: filters,
        providersQueried: searchRes.providerStatuses.map(p => p.provider),
        providerStatuses: searchRes.providerStatuses,
        candidateCount: searchRes.totalCandidates,
        includedCount: 0,
        excludedCount: 0,
        errors: searchRes.coverageWarnings,
        executedBy: currentUser.id,
        executedByEmail: currentUser.email,
        executedAt: searchRes.executedAt || new Date().toISOString()
      };

      setSearches(prev => [searchEntry, ...prev]);

      // Server-side audit logging
      fetch('/api/search-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchEntry)
      }).catch(err => console.warn('Failed to post server search log:', err));

      recordAudit('EXECUTE_LITERATURE_SEARCH', 'project', searchEntry.id, { 
        query: queryText, 
        candidateCount: searchRes.totalCandidates,
        providers: searchEntry.providersQueried 
      });

      return retrievedWorks;
    } catch (err: any) {
      console.warn('[AppContext] Search failed on server, falling back to local dataset filter:', err);
      
      // Graceful fallback to local works matching query if offline
      const q = queryText.toLowerCase().trim();
      const queryTokens = q.split(/\s+/).filter(Boolean);
      const localResults = works.filter(w => {
        if (queryTokens.length === 0) return true;
        const textToSearch = `${w.title} ${w.abstract || ''} ${w.keywords?.join(' ') || ''} ${w.authors.map(a => a.name).join(' ')} ${w.venue || ''}`.toLowerCase();
        return queryTokens.some(token => textToSearch.includes(token));
      });

      const fallbackEntry: SearchLog = {
        id: `srch_${Date.now()}`,
        projectId: activeProjectId,
        queryText,
        queryFilters: filters,
        providersQueried: ['OpenAlex', 'Crossref'],
        providerStatuses: [
          { provider: 'OpenAlex', status: 'error', latencyMs: 0, candidatesCount: localResults.length, error: err.message },
          { provider: 'Crossref', status: 'error', latencyMs: 0, candidatesCount: 0, error: err.message }
        ],
        candidateCount: localResults.length,
        includedCount: 0,
        excludedCount: 0,
        errors: [err.message || 'Server search failure'],
        executedBy: currentUser.id,
        executedByEmail: currentUser.email,
        executedAt: new Date().toISOString()
      };

      setSearches(prev => [fallbackEntry, ...prev]);
      return localResults;
    }
  };

  const resolveWork = async (identifierOrCitation: string): Promise<Work> => {
    const work = await scholarlyApi.resolveWork(identifierOrCitation);
    setWorks(prev => {
      const exists = prev.some(w => w.id === work.id || (w.doi && work.doi && w.doi.toLowerCase() === work.doi.toLowerCase()));
      return exists ? prev.map(w => w.id === work.id ? work : w) : [...prev, work];
    });
    return work;
  };

  const importBibtexOrRis = async (content: string) => {
    const result = await scholarlyApi.importBibtexOrRis(content);
    if (result && Array.isArray(result.works) && result.works.length > 0) {
      setWorks(prev => {
        const existingIds = new Set((prev || []).map(w => w.id));
        const newOnes = (result.works || []).filter(w => !existingIds.has(w.id));
        return [...prev, ...newOnes];
      });

      // Automatically attach imported works to active project
      if (activeProjectId) {
        for (const w of result.works) {
          await addWorkToProject(w, { inclusionStatus: 'candidate' });
        }
      }
    }
    return result;
  };

  const refreshWorkMetadata = async (workId: string): Promise<Work> => {
    const updated = await scholarlyApi.refreshWork(workId);
    setWorks(prev => prev.map(w => w.id === workId ? updated : w));
    return updated;
  };

  const saveMapSnapshot = async (data: { 
    title: string; 
    layoutType: 'cose' | 'concentric' | 'circle' | 'breadthfirst' | 'grid'; 
    elementsJson: string; 
    notes?: string 
  }) => {
    if (!permissions.canSaveMapSnapshots) {
      throw new Error('Permission denied: Viewers cannot save map snapshots.');
    }
    if (!activeProjectId) return;

    let elementCount = 0;
    try {
      const parsed = JSON.parse(data.elementsJson);
      elementCount = Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      elementCount = activeProjectWorksList.length;
    }

    const newSnapshot: MapSnapshot = {
      id: `snap_${Date.now()}`,
      projectId: activeProjectId,
      title: data.title,
      layoutType: data.layoutType,
      nodeCount: activeProjectWorksList.length,
      edgeCount: Math.max(0, elementCount - activeProjectWorksList.length),
      elementsJson: data.elementsJson,
      filtersApplied: {},
      notes: data.notes,
      createdBy: currentUser.displayName,
      createdAt: new Date().toISOString()
    };

    setMapSnapshots(prev => [newSnapshot, ...prev]);
    recordAudit('SAVE_MAP_SNAPSHOT', 'project', newSnapshot.id, { title: data.title, layout: data.layoutType });
  };

  // Citation Trails Action Handlers
  const fetchCitationTrails = useCallback(async () => {
    if (!activeProjectId) return;
    try {
      const res = await trailApi.listTrails(activeProjectId);
      if (res.trails && res.trails.length > 0) {
        setCitationTrails(res.trails);
        if (!activeTrailId || !res.trails.some(t => t.id === activeTrailId)) {
          setActiveTrailId(res.trails[0].id);
        }
      }
    } catch (e) {
      console.warn('Could not sync citation trails from API, using local state', e);
    }
  }, [activeProjectId, activeTrailId]);

  const fetchCitationTrailData = useCallback(async (trailId: string) => {
    if (!trailId) return;
    setIsTrailLoading(true);
    try {
      const res = await trailApi.getTrail(trailId);
      setActiveTrailData(res);
    } catch (e) {
      console.warn(`Could not load trail data for ${trailId} from API:`, e);
      // Construct fallback from local trail state
      const localTrail = citationTrails.find(t => t.id === trailId);
      if (localTrail) {
        setActiveTrailData({
          trail: localTrail,
          candidates: [],
          events: [],
          snapshots: []
        });
      }
    } finally {
      setIsTrailLoading(false);
    }
  }, [citationTrails]);

  // Sync active trail whenever activeTrailId changes
  useEffect(() => {
    if (activeTrailId) {
      fetchCitationTrailData(activeTrailId);
    }
  }, [activeTrailId, fetchCitationTrailData]);

  const createCitationTrail = async (data: {
    title: string;
    trailType: TrailType;
    seedWorks: Work[];
    parentTrailId?: string | null;
    researcherNotes?: string;
  }): Promise<CitationTrail> => {
    if (!permissions.canManageCitationTrails) {
      throw new Error('Permission denied: You do not have permission to create citation trails.');
    }
    if (!activeWorkspaceId || !activeProjectId) {
      throw new Error('Active project required');
    }

    setIsTrailLoading(true);
    try {
      const res = await trailApi.createTrail({
        workspaceId: activeWorkspaceId,
        projectId: activeProjectId,
        createdBy: currentUser.id,
        creatorName: currentUser.displayName,
        title: data.title,
        trailType: data.trailType,
        seedWorks: data.seedWorks,
        parentTrailId: data.parentTrailId || null,
        researcherNotes: data.researcherNotes,
        localGraphWorks: works
      });

      setCitationTrails(prev => [res.trail, ...prev]);
      setActiveTrailId(res.trail.id);
      setActiveTrailData({
        trail: res.trail,
        candidates: res.candidates || [],
        events: res.event ? [res.event] : [],
        snapshots: []
      });

      recordAudit('CREATE_CITATION_TRAIL', 'citation_trail', res.trail.id, {
        title: res.trail.title,
        type: res.trail.trailType,
        seedCount: data.seedWorks.length,
        candidatesGenerated: res.candidates?.length || 0
      });

      return res.trail;
    } finally {
      setIsTrailLoading(false);
    }
  };

  const branchCitationTrail = async (parentTrailId: string, data: {
    title: string;
    trailType: TrailType;
    seedWorks: Work[];
    researcherNotes?: string;
  }): Promise<CitationTrail> => {
    if (!permissions.canManageCitationTrails) {
      throw new Error('Permission denied: You do not have permission to branch citation trails.');
    }
    const parentTrail = citationTrails.find(t => t.id === parentTrailId);
    const rootTrailId = parentTrail ? (parentTrail.rootTrailId || parentTrail.id) : undefined;

    return createCitationTrail({
      title: data.title,
      trailType: data.trailType,
      seedWorks: data.seedWorks,
      parentTrailId,
      researcherNotes: data.researcherNotes
    });
  };

  const loadMoreTrailCandidates = async (trailId: string) => {
    const current = activeTrailData?.trail;
    if (!current) return;
    setIsTrailLoading(true);
    try {
      const res = await trailApi.loadMoreCandidates(trailId, current.seedWorks, works);
      setActiveTrailData(prev => {
        if (!prev) return null;
        const existingIds = new Set((prev.candidates || []).map(c => c.id));
        const newOnes = (res?.candidates || []).filter(c => !existingIds.has(c.id));
        return {
          ...prev,
          trail: {
            ...prev.trail,
            offset: res.offset,
            hasMore: res.hasMore,
            totalAvailable: res.totalAvailable
          },
          candidates: [...(prev.candidates || []), ...newOnes]
        };
      });
      setCitationTrails(prev => prev.map(t => t.id === trailId ? {
        ...t,
        offset: res.offset,
        hasMore: res.hasMore,
        totalAvailable: res.totalAvailable
      } : t));
    } finally {
      setIsTrailLoading(false);
    }
  };

  const updateCandidateDecision = async (
    trailId: string, 
    candidateId: string, 
    status: CandidateDecision, 
    relevanceNotes?: string
  ) => {
    if (!permissions.canManageCitationTrails) {
      throw new Error('Permission denied: Cannot update candidate decision.');
    }

    // Call API
    try {
      await trailApi.updateCandidateStatus(trailId, candidateId, status, relevanceNotes);
    } catch (e) {
      console.warn('Could not update status via server API, updating locally', e);
    }

    // Update local state
    setActiveTrailData(prev => {
      if (!prev) return null;
      const updatedCandidates = prev.candidates.map(c => c.id === candidateId ? {
        ...c,
        decision: status,
        relevanceNotes: relevanceNotes !== undefined ? relevanceNotes : c.relevanceNotes
      } : c);

      const targetCandidate = prev.candidates.find(c => c.id === candidateId);

      // If status is 'queued', automatically ensure in studyQueue
      if (status === 'queued' && targetCandidate) {
        setStudyQueue(q => {
          const exists = q.some(item => item.workId === targetCandidate.work.id);
          if (exists) return q;
          return [{
            id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            projectId: activeProjectId || '',
            workId: targetCandidate.work.id,
            work: targetCandidate.work,
            sourceTrailId: trailId,
            sourceTrailTitle: prev.trail.title,
            addedBy: currentUser.id,
            addedAt: new Date().toISOString(),
            status: 'pending',
            priority: 'medium',
            notes: relevanceNotes || `Added from citation trail: ${prev.trail.title}`
          }, ...q];
        });
      }

      // If status is 'included', add work to active project if not already present
      if (status === 'included' && targetCandidate && activeProjectId) {
        addWorkToProject(targetCandidate.work, {
          inclusionStatus: 'candidate',
          notes: relevanceNotes || `Discovered via Citation Trail: ${prev.trail.title}`
        }).catch(err => console.warn('Auto add to project notice:', err));
      }

      return {
        ...prev,
        trail: {
          ...prev.trail,
          decisions: {
            ...prev.trail.decisions,
            [candidateId]: status
          }
        },
        candidates: updatedCandidates
      };
    });

    setCitationTrails(prev => prev.map(t => t.id === trailId ? {
      ...t,
      decisions: {
        ...t.decisions,
        [candidateId]: status
      }
    } : t));

    recordAudit('TRAIL_CANDIDATE_DECISION', 'citation_trail', trailId, {
      candidateId,
      status,
      notes: relevanceNotes
    });
  };

  const updateCitationTrail = async (trailId: string, updates: Partial<CitationTrail>) => {
    if (!permissions.canManageCitationTrails) {
      throw new Error('Permission denied.');
    }
    try {
      await trailApi.updateTrail(trailId, updates);
    } catch (e) {
      console.warn('Trail update API notice:', e);
    }
    setCitationTrails(prev => prev.map(t => t.id === trailId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
    setActiveTrailData(prev => prev && prev.trail.id === trailId ? {
      ...prev,
      trail: { ...prev.trail, ...updates, updatedAt: new Date().toISOString() }
    } : prev);
  };

  const createTrailSnapshot = async (trailId: string, title: string): Promise<TrailSnapshot> => {
    if (!permissions.canManageCitationTrails) {
      throw new Error('Permission denied.');
    }
    const res = await trailApi.createSnapshot(trailId, title, currentUser.displayName);
    setActiveTrailData(prev => prev && prev.trail.id === trailId ? {
      ...prev,
      snapshots: [res.snapshot, ...prev.snapshots]
    } : prev);
    recordAudit('CREATE_TRAIL_SNAPSHOT', 'citation_trail', trailId, { title });
    return res.snapshot;
  };

  const duplicateCitationTrail = async (trailId: string, newTitle?: string): Promise<CitationTrail> => {
    if (!permissions.canManageCitationTrails) {
      throw new Error('Permission denied.');
    }
    const res = await trailApi.duplicateTrail(trailId, newTitle);
    setCitationTrails(prev => [res.trail, ...prev]);
    setActiveTrailId(res.trail.id);
    setActiveTrailData({
      trail: res.trail,
      candidates: res.candidates || [],
      events: [],
      snapshots: []
    });
    recordAudit('DUPLICATE_CITATION_TRAIL', 'citation_trail', trailId, { newTrailId: res.trail.id, title: res.trail.title });
    return res.trail;
  };

  const addToStudyQueue = async (work: Work, trailId?: string, trailTitle?: string, notes?: string) => {
    setStudyQueue(prev => {
      const existingIndex = prev.findIndex(item => item.workId === work.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          notes: notes || updated[existingIndex].notes,
          priority: 'high',
          status: 'pending'
        };
        return updated;
      }
      return [{
        id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        projectId: activeProjectId || '',
        workId: work.id,
        work,
        sourceTrailId: trailId,
        sourceTrailTitle: trailTitle,
        addedBy: currentUser.id,
        addedAt: new Date().toISOString(),
        status: 'pending',
        priority: 'high',
        notes: notes || 'Marked for deep analytical reading'
      }, ...prev];
    });

    if (trailId) {
      updateCandidateDecision(trailId, work.id, 'queued', notes).catch(() => {});
    }

    recordAudit('ADD_TO_STUDY_QUEUE', 'study_queue', work.id, {
      title: work.title,
      trailId,
      notes
    });
  };

  const removeFromStudyQueue = async (workIdOrItemId: string) => {
    setStudyQueue(prev => prev.filter(item => item.id !== workIdOrItemId && item.workId !== workIdOrItemId));
  };

  const updateStudyQueueItem = async (itemId: string, updates: Partial<StudyQueueItem>) => {
    setStudyQueue(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
  };

  const executeExplorationPreview = async (action: string, seedWorks: Work[]) => {
    return trailApi.executeExplorationAction({
      action,
      seedWorks,
      localGraphWorks: works,
      limit: 15,
      offset: 0
    });
  };

  // -------------------------------------------------------------
  // Discovery-to-Reading Workflow State & Action Handlers
  // -------------------------------------------------------------

  const setStudyNextPreferences = (prefs: Partial<StudyNextPreferences>) => {
    setStudyNextPreferencesState(prev => ({ ...prev, ...prefs }));
  };

  const setCandidateState = async (
    workId: string, 
    state: CandidateWorkState, 
    options: { 
      exclusionReason?: string; 
      notes?: string; 
      tags?: string[]; 
      studyPriority?: 'high' | 'medium' | 'low';
      readingProgress?: 'unread' | 'in_progress' | 'completed';
      feedback?: CandidateFeedbackType;
    } = {}
  ) => {
    const currentProjectId = activeProjectId || SAMPLE_PROJECT.id;
    const targetWork = works.find(w => w.id === workId) || 
      projectWorks.find(pw => pw.workId === workId)?.work ||
      activeTrailData?.candidates.find(c => c.work.id === workId)?.work;

    if (!targetWork) {
      console.warn(`[setCandidateState] Work not found for ID: ${workId}`);
      return;
    }

    setProjectCandidateStates(prev => {
      const existingIdx = prev.findIndex(item => item.projectId === currentProjectId && item.workId === workId);
      const existing = existingIdx >= 0 ? prev[existingIdx] : null;

      const newFeedbackList = existing ? [...existing.feedbackHistory] : [];
      if (options.feedback) {
        newFeedbackList.push({
          id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: options.feedback,
          label: (options.feedback || 'feedback').replace(/_/g, ' '),
          notes: options.notes,
          scope: 'project',
          createdAt: new Date().toISOString()
        });
      }

      const updatedState: ProjectCandidateState = {
        id: existing?.id || `${currentProjectId}_${workId}`,
        projectId: currentProjectId,
        workId,
        work: targetWork,
        state,
        exclusionReason: options.exclusionReason !== undefined ? options.exclusionReason : existing?.exclusionReason,
        notes: options.notes !== undefined ? options.notes : existing?.notes,
        tags: options.tags !== undefined ? options.tags : (existing?.tags || []),
        inDiscoveryTray: existing ? existing.inDiscoveryTray : true,
        dateFound: existing?.dateFound || new Date().toISOString(),
        sourceTrailIds: existing?.sourceTrailIds || (activeTrailId ? [activeTrailId] : []),
        sourceTrailTitles: existing?.sourceTrailTitles || (activeTrailData ? [activeTrailData.trail.title] : []),
        reasons: existing?.reasons || [],
        feedbackHistory: newFeedbackList,
        studyPriority: options.studyPriority !== undefined ? options.studyPriority : (existing?.studyPriority || 'medium'),
        readingProgress: options.readingProgress !== undefined ? options.readingProgress : (existing?.readingProgress || 'unread'),
        updatedAt: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = updatedState;
        return copy;
      }
      return [updatedState, ...prev];
    });

    // Side-effects on Study Queue
    if (state === 'study_next') {
      addToStudyQueue(targetWork, activeTrailId || undefined, activeTrailData?.trail.title, options.notes).catch(() => {});
    } else if (state === 'reading') {
      setStudyQueue(q => q.map(item => item.workId === workId ? { ...item, status: 'in_progress' } : item));
    } else if (state === 'read') {
      setStudyQueue(q => q.map(item => item.workId === workId ? { ...item, status: 'completed' } : item));
    } else if (state === 'not_relevant' || state === 'excluded_with_reason') {
      // Remove from active study queue
      setStudyQueue(q => q.filter(item => item.workId !== workId));
    } else if (state === 'included_in_library') {
      // Automatically add to Project Library if not present
      const alreadyInLib = projectWorks.some(pw => pw.projectId === currentProjectId && pw.workId === workId);
      if (!alreadyInLib) {
        addWorkToProject(targetWork, {
          inclusionStatus: 'candidate',
          notes: options.notes || 'Promoted from Discovery Tray / Study Next'
        }).catch(err => console.warn('Auto library inclusion notice:', err));
      }
    }

    recordAudit('UPDATE_CANDIDATE_STATE', 'candidate', workId, {
      state,
      exclusionReason: options.exclusionReason,
      notes: options.notes
    });
  };

  const addToDiscoveryTray = async (work: Work, sourceTrailId?: string, sourceTrailTitle?: string, reasons: any[] = []) => {
    const currentProjectId = activeProjectId || SAMPLE_PROJECT.id;
    setProjectCandidateStates(prev => {
      const existingIdx = prev.findIndex(item => item.projectId === currentProjectId && item.workId === work.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          inDiscoveryTray: true,
          sourceTrailIds: sourceTrailId && !copy[existingIdx].sourceTrailIds.includes(sourceTrailId) 
            ? [...copy[existingIdx].sourceTrailIds, sourceTrailId] 
            : copy[existingIdx].sourceTrailIds,
          sourceTrailTitles: sourceTrailTitle && !copy[existingIdx].sourceTrailTitles.includes(sourceTrailTitle)
            ? [...copy[existingIdx].sourceTrailTitles, sourceTrailTitle]
            : copy[existingIdx].sourceTrailTitles,
          updatedAt: new Date().toISOString()
        };
        return copy;
      }

      const newState: ProjectCandidateState = {
        id: `${currentProjectId}_${work.id}`,
        projectId: currentProjectId,
        workId: work.id,
        work,
        state: 'discovered',
        inDiscoveryTray: true,
        dateFound: new Date().toISOString(),
        tags: [],
        sourceTrailIds: sourceTrailId ? [sourceTrailId] : [],
        sourceTrailTitles: sourceTrailTitle ? [sourceTrailTitle] : [],
        reasons: reasons || [],
        feedbackHistory: [],
        studyPriority: 'medium',
        readingProgress: 'unread',
        updatedAt: new Date().toISOString()
      };
      return [newState, ...prev];
    });

    recordAudit('ADD_TO_DISCOVERY_TRAY', 'candidate', work.id, {
      title: work.title,
      sourceTrailId
    });
  };

  const removeFromDiscoveryTray = async (workId: string) => {
    const currentProjectId = activeProjectId || SAMPLE_PROJECT.id;
    setProjectCandidateStates(prev => prev.map(item => {
      if (item.projectId === currentProjectId && item.workId === workId) {
        return { ...item, inDiscoveryTray: false, updatedAt: new Date().toISOString() };
      }
      return item;
    }));
  };

  const clearDiscoveryTray = async (projectId?: string) => {
    const targetPid = projectId || activeProjectId || SAMPLE_PROJECT.id;
    setProjectCandidateStates(prev => prev.map(item => {
      if (item.projectId === targetPid) {
        return { ...item, inDiscoveryTray: false, updatedAt: new Date().toISOString() };
      }
      return item;
    }));
    recordAudit('CLEAR_DISCOVERY_TRAY', 'project', targetPid, { clearedAt: new Date().toISOString() });
  };

  const bulkUpdateTrayCandidates = async (
    workIds: string[], 
    targetState: CandidateWorkState, 
    options: { tags?: string[]; exclusionReason?: string; notes?: string } = {}
  ) => {
    for (const id of workIds) {
      await setCandidateState(id, targetState, options);
    }
  };

  const submitCandidateFeedback = async (
    workId: string, 
    feedbackType: CandidateFeedbackType, 
    notes?: string, 
    scope: 'project' | 'workspace' = 'project'
  ) => {
    const currentProjectId = activeProjectId || SAMPLE_PROJECT.id;
    setProjectCandidateStates(prev => prev.map(item => {
      if (item.projectId === currentProjectId && item.workId === workId) {
        const newFb: CandidateFeedback = {
          id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: feedbackType,
          label: (feedbackType || 'feedback').replace(/_/g, ' '),
          notes,
          scope,
          createdAt: new Date().toISOString()
        };
        return {
          ...item,
          feedbackHistory: [newFb, ...item.feedbackHistory],
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    }));

    recordAudit('CANDIDATE_FEEDBACK', 'candidate', workId, {
      feedbackType,
      notes,
      scope
    });
  };

  const fetchStudyNextRecommendations = async (overridePrefs?: Partial<StudyNextPreferences>): Promise<StudyNextShortlistResult | null> => {
    const currentProject = activeProject || projects[0];
    if (!currentProject) return null;

    setIsStudyNextLoading(true);
    try {
      const mergedPrefs = { ...studyNextPreferences, ...overridePrefs };

      // Aggregate seed works from active project works list
      const seedWorks = activeProjectWorksList
        .filter(pw => pw.inclusionStatus === 'included' || pw.inclusionStatus === 'candidate')
        .map(pw => pw.work);

      // Aggregate candidate pool from:
      // 1. Project Candidate States in Discovery Tray or Discovered
      // 2. Citation Trails Candidates
      // 3. Known Works
      const poolMap = new Map<string, { work: Work; sourceTrailId?: string; sourceTrailTitle?: string; reasons?: any[]; connectedSeedIds?: string[] }>();

      // From candidate states
      projectCandidateStates
        .filter(pcs => pcs.projectId === currentProject.id)
        .forEach(pcs => {
          poolMap.set(pcs.workId.toLowerCase(), {
            work: pcs.work,
            sourceTrailId: pcs.sourceTrailIds[0],
            sourceTrailTitle: pcs.sourceTrailTitles[0],
            reasons: pcs.reasons
          });
        });

      // From active trail candidates
      if (activeTrailData?.candidates) {
        activeTrailData.candidates.forEach(cand => {
          if (!poolMap.has(cand.work.id.toLowerCase())) {
            poolMap.set(cand.work.id.toLowerCase(), {
              work: cand.work,
              sourceTrailId: cand.trailId,
              sourceTrailTitle: activeTrailData.trail.title,
              reasons: cand.reasons,
              connectedSeedIds: cand.connectedSeedWorkIds
            });
          }
        });
      }

      // From library works (if any have candidate status)
      works.forEach(w => {
        if (!poolMap.has(w.id.toLowerCase())) {
          poolMap.set(w.id.toLowerCase(), {
            work: w,
            sourceTrailId: 'library_unassigned',
            sourceTrailTitle: 'Project Exploration Network'
          });
        }
      });

      const candidatePool = Array.from(poolMap.values());

      const res = await studyNextApi.getStudyNextShortlist({
        projectId: currentProject.id,
        projectTitle: currentProject.title,
        researchQuestion: currentProject.researchQuestion,
        seedWorks: seedWorks.length > 0 ? seedWorks : works.slice(0, 2),
        candidatePool,
        existingProjectCandidateStates: projectCandidateStates.filter(pcs => pcs.projectId === currentProject.id),
        preferences: mergedPrefs
      });

      setStudyNextShortlist(res);
      return res;
    } catch (err) {
      console.warn('Could not compute Study Next recommendations:', err);
      return null;
    } finally {
      setIsStudyNextLoading(false);
    }
  };

  const generateReadingPrompt = async (work: Work, role?: CandidateRole, notes?: string): Promise<ReadingPromptResponse> => {
    const currentProject = activeProject || projects[0];
    const seedWorks = activeProjectWorksList
      .filter(pw => pw.inclusionStatus === 'included')
      .map(pw => pw.work);

    return studyNextApi.generateReadingPrompt({
      work,
      projectTitle: currentProject?.title || 'Academic Exploration',
      researchQuestion: currentProject?.researchQuestion || 'Citation Network Analysis',
      role,
      notes,
      seedWorks: seedWorks.slice(0, 3)
    });
  };

  const assignStudyQueueCollaborator = async (itemId: string, collaboratorId: string, collaboratorName: string) => {
    setStudyQueue(prev => prev.map(item => item.id === itemId ? {
      ...item,
      assignedCollaboratorId: collaboratorId,
      assignedCollaboratorName: collaboratorName
    } : item));
    recordAudit('ASSIGN_STUDY_QUEUE_COLLABORATOR', 'study_queue', itemId, { collaboratorId, collaboratorName });
  };

  const setStudyQueueDueDate = async (itemId: string, dueDate: string) => {
    setStudyQueue(prev => prev.map(item => item.id === itemId ? { ...item, dueDate } : item));
    recordAudit('SET_STUDY_QUEUE_DUE_DATE', 'study_queue', itemId, { dueDate });
  };

  const setStudyQueuePriority = async (itemId: string, priority: 'high' | 'medium' | 'low') => {
    setStudyQueue(prev => prev.map(item => item.id === itemId ? { ...item, priority } : item));
  };

  const setStudyQueueStatus = async (itemId: string, status: StudyQueueItem['status']) => {
    setStudyQueue(prev => prev.map(item => item.id === itemId ? { ...item, status } : item));
  };

  const resetToSampleData = () => {
    setWorkspaces([SAMPLE_WORKSPACE]);
    setWorkspaceMembers(SAMPLE_MEMBERS);
    setProjects([SAMPLE_PROJECT]);
    setWorks(SAMPLE_WORKS);
    setProjectWorks(SAMPLE_PROJECT_WORKS);
    setAnnotations(SAMPLE_ANNOTATIONS);
    setTags(SAMPLE_TAGS);
    setSearches(SAMPLE_SEARCH_LOGS);
    setEvidenceRecords(SAMPLE_EVIDENCE_RECORDS);
    setMapSnapshots([]);
    setAuditEvents(SAMPLE_AUDIT_EVENTS);
    setSciteVerifications({});
    setReferenceCheckHistory([]);
    setMonitors([SAMPLE_MONITOR]);
    setMonitoredCandidates([]);
    setNotifications([SAMPLE_NOTIFICATION]);
    setCitationTrails([SAMPLE_TRAIL]);
    setActiveTrailId(SAMPLE_TRAIL.id);
    setStudyQueue(SAMPLE_STUDY_QUEUE);
    setProjectCandidateStates(SAMPLE_PROJECT_CANDIDATE_STATES);
    setStudyNextShortlist(null);
    setSelectedReadingWorkId(null);
    setExplorerWork(null);
    setExplorerHistory([]);
    setActiveWorkspaceId(SAMPLE_WORKSPACE.id);
    setActiveProjectId(SAMPLE_PROJECT.id);
    setActiveTab('library');
    setCurrentRole('owner');
  };

  const cleanAllWorkspacesAndProjects = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('evidence_atlas_') || key.startsWith('evidence_atlas_v'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Failed to clear localStorage keys:', e);
    }

    resetToSampleData();
    showToast('All workspaces, projects, and literature collections have been cleaned and reset with verified scholarly data.');
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      currentRole,
      permissions,
      activeWorkspaceId,
      activeProjectId,
      activeTab,
      workspaces,
      workspaceMembers,
      projects,
      works,
      projectWorks,
      annotations,
      tags,
      searches,
      evidenceRecords,
      mapSnapshots,
      auditEvents,
      sciteVerifications,
      sciteConfig,
      isVerifyingWork,
      referenceCheckHistory,
      monitors,
      monitoredCandidates,
      notifications,
      mcpStatus,
      mcpResults,
      isMcpLoading,
      citationTrails,
      activeTrailId,
      activeTrailData,
      studyQueue,
      selectedTrailCandidateId,
      isTrailLoading,
      projectCandidateStates,
      studyNextShortlist,
      studyNextPreferences,
      isStudyNextLoading,
      selectedReadingWorkId,
      activeWorkspace,
      activeProject,
      activeProjectWorksList,
      projectStats,
      unreadNotificationCount,
      setActiveWorkspaceId,
      setActiveProjectId,
      setActiveTab,
      setCurrentRole,
      setActiveTrailId,
      setSelectedTrailCandidateId,
      setSelectedReadingWorkId,
      setStudyNextPreferences,
      explorerWork,
      explorerHistory,
      openPaperInExplorer,
      backInExplorer,
      setExplorerWork,
      toast,
      showToast,
      clearToast,
      isHelpModalOpen,
      setIsHelpModalOpen,
      dismissedGuide,
      setDismissedGuide,
      dismissedPaperHint,
      setDismissedPaperHint,
      dismissedCandidateHint,
      setDismissedCandidateHint,
      dismissedFirstAddHint,
      setDismissedFirstAddHint,
      loadDemonstrationData,
      removeDemonstrationData,
      hasDemonstrationData,
      createWorkspace,
      updateWorkspace,
      softDeleteWorkspace,
      inviteMember,
      updateMemberRole,
      removeMember,
      createProject,
      updateProject,
      softDeleteProject,
      restoreProject,
      addWorkToProject,
      updateProjectWork,
      removeWorkFromProject,
      createAnnotation,
      addAnnotationReply,
      deleteAnnotation,
      createTag,
      deleteTag,
      createEvidenceRecord,
      updateEvidenceRecord,
      deleteEvidenceRecord,
      executeSearch,
      resolveWork,
      importBibtexOrRis,
      refreshWorkMetadata,
      saveMapSnapshot,
      setCandidateState,
      addToDiscoveryTray,
      removeFromDiscoveryTray,
      clearDiscoveryTray,
      bulkUpdateTrayCandidates,
      submitCandidateFeedback,
      fetchStudyNextRecommendations,
      generateReadingPrompt,
      assignStudyQueueCollaborator,
      setStudyQueueDueDate,
      setStudyQueuePriority,
      setStudyQueueStatus,
      fetchCitationTrails,
      fetchCitationTrailData,
      createCitationTrail,
      branchCitationTrail,
      loadMoreTrailCandidates,
      updateCandidateDecision,
      updateCitationTrail,
      createTrailSnapshot,
      duplicateCitationTrail,
      addToStudyQueue,
      removeFromStudyQueue,
      updateStudyQueueItem,
      executeExplorationPreview,
      verifyWorkWithScite,
      runBatchSciteVerification,
      fetchSciteConfig,
      updateSciteConfig,
      saveReferenceCheckRun,
      fetchMonitors,
      createMonitor,
      updateMonitor,
      deleteMonitor,
      runMonitorNow,
      dismissMonitoredCandidate,
      importMonitoredCandidate,
      testMcpConnection,
      executeMcpAction,
      markNotificationRead,
      exportBibTeX,
      exportRIS,
      exportCSV,
      exportMarkdown,
      generateAuditReport,
      recordAudit,
      resetToSampleData,
      cleanAllWorkspacesAndProjects
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
