import { Work, WorkConflict, ProviderSearchStatus, NetworkExpansionResponse, NetworkExpansionOperation } from '../types';

export interface ScholarlySearchFilters {
  yearMin?: number;
  yearMax?: number;
  type?: string;
  author?: string;
  venue?: string;
  openAccessOnly?: boolean;
  minCitations?: number;
  providers?: ('OpenAlex' | 'Crossref')[];
  limit?: number;
}

export interface ScholarlySearchResult {
  query: string;
  filters: ScholarlySearchFilters;
  works: Work[];
  providerStatuses: ProviderSearchStatus[];
  totalCandidates: number;
  executedAt: string;
  coverageWarnings: string[];
}

export interface GraphExpansionData {
  nodes: {
    id: string;
    label: string;
    title: string;
    year: number;
    citationCount: number;
    openAlexId?: string | null;
    doi?: string | null;
    authors: string[];
    inclusionStatus?: string;
    provenance: string;
    x?: number;
    y?: number;
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    type: string;
    provenance: string;
  }[];
  rootWorkIds: string[];
  direction: string;
  depth: number;
  provenanceLabel: string;
  metadataDisclaimer: string;
  timestamp: string;
}

export const scholarlyApi = {
  async searchWorks(query: string, filters: ScholarlySearchFilters = {}): Promise<ScholarlySearchResult> {
    const res = await fetch('/api/scholarly/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, filters })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Search failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json();
  },

  async resolveWork(identifier: string): Promise<Work> {
    const res = await fetch('/api/scholarly/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Resolution failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.work;
  },

  async expandGraph(
    workIds: string[],
    knownWorks: Work[] = [],
    direction: 'cites' | 'cited_by' | 'related' | 'both' = 'both',
    depth: number = 1
  ): Promise<GraphExpansionData> {
    const res = await fetch('/api/scholarly/expand-graph', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workIds, knownWorks, direction, depth })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Graph expansion failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json();
  },

  async networkExpand(
    selectedWork: Partial<Work>,
    operation: NetworkExpansionOperation,
    limit: number = 25,
    bypassCache: boolean = false,
    signal?: AbortSignal
  ): Promise<NetworkExpansionResponse> {
    const res = await fetch('/api/scholarly/network-expand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedWork, operation, limit, bypassCache }),
      signal
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network expansion request failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json();
  },

  async importBibtexOrRis(content: string): Promise<{ works: Work[]; totalImported: number; resolvedWithDoiCount: number }> {
    const res = await fetch('/api/scholarly/import-bibtex-ris', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Import failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json();
  },

  async addManualWork(workData: Partial<Work>): Promise<Work> {
    const res = await fetch('/api/scholarly/manual-work', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workData)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Creation failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.work;
  },

  async getWorkProvenance(workId: string): Promise<{
    workId: string;
    provenance: any;
    fieldLevelProvenance?: Record<string, any>;
    conflicts?: WorkConflict[];
    healthStatus: any;
  }> {
    const res = await fetch(`/api/scholarly/provenance/${encodeURIComponent(workId)}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  },

  async refreshWork(workId: string): Promise<Work> {
    const res = await fetch(`/api/scholarly/refresh/${encodeURIComponent(workId)}`, {
      method: 'POST'
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.work;
  },

  async getHealth(): Promise<{
    providers: Record<string, any>;
    cache: any;
    timestamp: string;
  }> {
    const res = await fetch('/api/scholarly/health');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  }
};

import { 
  SciteTallies, 
  SciteCitationStatement, 
  SciteWorkVerificationResult, 
  SciteReferenceCheckRun, 
  SciteWorkspaceConfig, 
  SciteUsageLog 
} from '../types';

export const sciteApi = {
  async getTallies(doi: string, workspaceId?: string): Promise<{
    status: any;
    tallies?: SciteTallies;
    cached?: boolean;
    error?: string;
    message?: string;
  }> {
    const res = await fetch('/api/scite/tallies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doi, workspaceId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Tallies request failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async getStatements(doi: string, limit: number = 20, workspaceId?: string): Promise<{
    status: any;
    statements: SciteCitationStatement[];
    cached?: boolean;
    error?: string;
  }> {
    const res = await fetch('/api/scite/statements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doi, limit, workspaceId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Statements request failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async verifyWork(doi: string, workId?: string, workspaceId?: string): Promise<SciteWorkVerificationResult> {
    const res = await fetch('/api/scite/verify-work', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doi, workId, workspaceId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Verification failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async challengeClaim(
    claim: string,
    doi?: string,
    literatureScope?: any[],
    workspaceId?: string
  ): Promise<{
    claim: string;
    doi?: string;
    statements: SciteCitationStatement[];
    aiSynthesis: {
      text: string;
      label: string;
      generatedAt: string;
      model: string;
    };
    status: string;
  }> {
    const res = await fetch('/api/scite/claim-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim, doi, literatureScope, workspaceId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Claim challenge failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async runReferenceCheck(
    references: Array<{ id?: string; doi?: string; text?: string; title?: string }>,
    projectId?: string,
    workspaceId?: string
  ): Promise<SciteReferenceCheckRun> {
    const res = await fetch('/api/scite/reference-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ references, projectId, workspaceId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Reference check failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async getSettings(workspaceId?: string): Promise<{
    config: SciteWorkspaceConfig;
    disclaimer: string;
  }> {
    const url = workspaceId ? `/api/scite/settings?workspaceId=${encodeURIComponent(workspaceId)}` : '/api/scite/settings';
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  },

  async updateSettings(updates: Partial<SciteWorkspaceConfig>, workspaceId?: string): Promise<{
    success: boolean;
    config: SciteWorkspaceConfig;
  }> {
    const res = await fetch('/api/scite/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates, workspaceId: workspaceId || 'ws_default' })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update Scite settings' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async getUsageLogs(workspaceId?: string): Promise<{ logs: SciteUsageLog[] }> {
    const url = workspaceId ? `/api/scite/usage-logs?workspaceId=${encodeURIComponent(workspaceId)}` : '/api/scite/usage-logs';
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  }
};

import { 
  McpConnectionStatus, 
  McpExecutionResult, 
  StoredMonitor, 
  MonitoredCandidate, 
  Notification, 
  Project, 
  ProjectWork, 
  EvidenceRecord, 
  SearchLog 
} from '../types';

export const mcpApi = {
  async selfTest(force: boolean = false): Promise<McpConnectionStatus> {
    const res = await fetch(`/api/mcp/self-test?force=${force}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'MCP self-test failed' }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async execute(params: {
    action: 'check_duplication' | 'map_debate_lines' | 'assess_saturation' | 'suggest_candidates';
    researchQuestion: string;
    discipline?: string;
    projectTitle?: string;
    existingWorks?: any[];
    additionalContext?: string;
    projectId?: string;
    userId?: string;
    userEmail?: string;
  }): Promise<McpExecutionResult> {
    const res = await fetch('/api/mcp/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'MCP action execution failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }
};

export const monitorApi = {
  async getMonitors(projectId: string): Promise<{ monitors: StoredMonitor[] }> {
    const res = await fetch(`/api/monitors?projectId=${encodeURIComponent(projectId)}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  },

  async createMonitor(data: {
    projectId: string;
    title: string;
    sourceType: 'search_query' | 'seed_set';
    queryText?: string;
    queryFilters?: Record<string, any>;
    seedWorkIds?: string[];
    frequency?: 'daily' | 'weekly' | 'monthly';
    enabled?: boolean;
    createdBy?: string;
  }): Promise<{ monitor: StoredMonitor }> {
    const res = await fetch('/api/monitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create monitor' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async updateMonitor(monitorId: string, updates: Partial<StoredMonitor>): Promise<{ monitor: StoredMonitor }> {
    const res = await fetch(`/api/monitors/${encodeURIComponent(monitorId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update monitor' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async deleteMonitor(monitorId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/monitors/${encodeURIComponent(monitorId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  },

  async runMonitorNow(monitorId: string, knownWorks: Work[] = []): Promise<{
    monitor: StoredMonitor;
    newCandidates: MonitoredCandidate[];
    message: string;
    isDuplicateRun: boolean;
  }> {
    const res = await fetch(`/api/monitors/${encodeURIComponent(monitorId)}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ knownWorks })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to execute monitor' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async getCandidates(projectId: string): Promise<{ candidates: MonitoredCandidate[] }> {
    const res = await fetch(`/api/monitors/candidates?projectId=${encodeURIComponent(projectId)}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  },

  async dismissCandidate(projectId: string, candidateId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/monitors/candidates/${encodeURIComponent(candidateId)}/dismiss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId })
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  },

  async importCandidate(projectId: string, candidateId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/monitors/candidates/${encodeURIComponent(candidateId)}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId })
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  },

  async getNotifications(userId?: string): Promise<{ notifications: Notification[] }> {
    const url = userId ? `/api/notifications?userId=${encodeURIComponent(userId)}` : '/api/notifications';
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  },

  async markNotificationRead(notificationId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/notifications/${encodeURIComponent(notificationId)}/read`, {
      method: 'POST'
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  }
};

export const exportApi = {
  async downloadBibTeX(works: Work[]): Promise<string> {
    const res = await fetch('/api/export/bibtex', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ works })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  },

  async downloadRIS(works: Work[]): Promise<string> {
    const res = await fetch('/api/export/ris', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ works })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  },

  async downloadCSV(projectWorks: ProjectWork[], allWorks: Work[]): Promise<string> {
    const res = await fetch('/api/export/csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectWorks, allWorks })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  },

  async downloadMarkdown(project: Project, projectWorks: ProjectWork[], allWorks: Work[]): Promise<string> {
    const res = await fetch('/api/export/markdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project, projectWorks, allWorks })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  },

  async generateAuditReport(params: {
    project: Project;
    projectWorks: ProjectWork[];
    allWorks: Work[];
    evidenceRecords: EvidenceRecord[];
    searchLogs: SearchLog[];
    monitors: StoredMonitor[];
  }): Promise<{
    jsonReport: any;
    markdownReport: string;
  }> {
    const res = await fetch('/api/export/audit-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async generateTrailsAuditReport(params: {
    projectId: string;
    projectTitle: string;
    trails: any[];
    candidatesByTrail: Record<string, any[]>;
    eventsByTrail: Record<string, any[]>;
  }): Promise<{
    jsonReport: any;
    markdownReport: string;
    csvDecisions: string;
  }> {
    const res = await fetch('/api/export/trails-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
};

export const trailApi = {
  async listTrails(projectId: string): Promise<{ trails: any[] }> {
    const res = await fetch(`/api/trails?projectId=${encodeURIComponent(projectId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getTrail(trailId: string): Promise<{ trail: any; candidates: any[]; events: any[]; snapshots: any[] }> {
    const res = await fetch(`/api/trails/${encodeURIComponent(trailId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async createTrail(data: {
    workspaceId: string;
    projectId: string;
    createdBy?: string;
    creatorName?: string;
    title: string;
    trailType: string;
    seedWorks: Work[];
    parentTrailId?: string | null;
    rootTrailId?: string;
    requestParams?: Record<string, any>;
    researcherNotes?: string;
    localGraphWorks?: Work[];
  }): Promise<{ trail: any; candidates: any[]; event: any }> {
    const res = await fetch('/api/trails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create trail' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async updateTrail(trailId: string, updates: any): Promise<{ trail: any }> {
    const res = await fetch(`/api/trails/${encodeURIComponent(trailId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async loadMoreCandidates(trailId: string, seedWorks: Work[], localGraphWorks: Work[] = []): Promise<{
    candidates: any[];
    hasMore: boolean;
    offset: number;
    totalAvailable: number;
  }> {
    const res = await fetch(`/api/trails/${encodeURIComponent(trailId)}/load-more`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seedWorks, localGraphWorks })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async updateCandidateStatus(
    trailId: string, 
    candidateId: string, 
    status: 'candidate' | 'queued' | 'included' | 'rejected', 
    relevanceNotes?: string
  ): Promise<{ candidate: any }> {
    const res = await fetch(`/api/trails/${encodeURIComponent(trailId)}/candidates/${encodeURIComponent(candidateId)}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, relevanceNotes })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async createSnapshot(trailId: string, title: string, createdBy?: string): Promise<{ snapshot: any }> {
    const res = await fetch(`/api/trails/${encodeURIComponent(trailId)}/snapshots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, createdBy })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async duplicateTrail(trailId: string, newTitle?: string): Promise<{ trail: any; candidates: any[] }> {
    const res = await fetch(`/api/trails/${encodeURIComponent(trailId)}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newTitle })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async compareTrails(trailAId: string, trailBId: string): Promise<any> {
    const res = await fetch('/api/trails/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trailAId, trailBId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Comparison failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async attachTrailConclusion(trailId: string, conclusionData: any): Promise<any> {
    const res = await fetch(`/api/trails/${encodeURIComponent(trailId)}/conclusion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conclusionData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to attach conclusion' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async pinTrail(trailId: string, isPinned: boolean): Promise<any> {
    const res = await fetch(`/api/trails/${encodeURIComponent(trailId)}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async archiveTrail(trailId: string, isArchived: boolean): Promise<any> {
    const res = await fetch(`/api/trails/${encodeURIComponent(trailId)}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isArchived })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async promoteTrail(trailId: string, promotionData: { targetType: 'collection' | 'section'; name: string; description?: string }): Promise<any> {
    const res = await fetch(`/api/trails/${encodeURIComponent(trailId)}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promotionData)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getTrailComments(trailId: string): Promise<any> {
    const res = await fetch(`/api/trails/${encodeURIComponent(trailId)}/comments`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async addTrailComment(trailId: string, commentData: { userId: string; userName: string; text: string; role?: string }): Promise<any> {
    const res = await fetch(`/api/trails/${encodeURIComponent(trailId)}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async toggleTrailFollow(trailId: string, userId: string, userName?: string): Promise<any> {
    const res = await fetch(`/api/trails/${encodeURIComponent(trailId)}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userName })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getTrailAiSuggestions(trailId: string): Promise<any> {
    const res = await fetch(`/api/trails/${encodeURIComponent(trailId)}/ai-suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to generate reflective suggestions' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async executeExplorationAction(data: {
    action: string;
    seedWorks: Work[];
    localGraphWorks?: Work[];
    limit?: number;
    offset?: number;
  }): Promise<{ candidates: any[]; totalAvailable: number; warnings: string[]; provenanceSummary: string }> {
    const res = await fetch('/api/trails/explore-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
};

export const studyNextApi = {
  async getStudyNextShortlist(data: {
    projectId: string;
    projectTitle: string;
    researchQuestion: string;
    seedWorks: Work[];
    candidatePool: {
      work: Work;
      sourceTrailId?: string;
      sourceTrailTitle?: string;
      reasons?: any[];
      connectedSeedIds?: string[];
    }[];
    existingProjectCandidateStates?: any[];
    preferences?: any;
  }): Promise<any> {
    const res = await fetch('/api/study-next/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to compute study next shortlist' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async generateReadingPrompt(data: {
    work: Work;
    projectTitle: string;
    researchQuestion: string;
    role?: string;
    notes?: string;
    seedWorks?: Work[];
  }): Promise<any> {
    const res = await fetch('/api/reading-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to generate reading prompt' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }
};


