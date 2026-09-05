import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { z } from 'zod';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// -------------------------------------------------------------
// Zod Schemas for Strict Server-Side Validation
// -------------------------------------------------------------

export const AuthorSchema = z.object({
  name: z.string().min(1, 'Author name is required').max(300),
  orcid: z.string().regex(/^(\d{4}-\d{4}-\d{4}-\d{3}[\dX])?$/, 'Invalid ORCID format').optional().nullable(),
  affiliation: z.string().max(500).optional().nullable(),
});

export const WorkProvenanceSchema = z.object({
  provider: z.string().min(1).max(100),
  retrievedAt: z.string().datetime().or(z.string()),
  queryId: z.string().optional().nullable(),
  rawId: z.string().optional().nullable(),
  license: z.string().optional().nullable(),
  confidenceScore: z.number().min(0).max(1).optional().nullable(),
});

export const NormalizedWorkSchema = z.object({
  id: z.string().min(1).max(128),
  doi: z.string().max(256).optional().nullable(),
  openAlexId: z.string().max(128).optional().nullable(),
  semanticScholarId: z.string().max(128).optional().nullable(),
  sciteId: z.string().max(128).optional().nullable(),
  isbn: z.string().max(64).optional().nullable(),
  title: z.string().min(1, 'Title is required').max(1000),
  subtitle: z.string().max(1000).optional().nullable(),
  authors: z.array(AuthorSchema).min(1, 'At least one author is required'),
  year: z.number().int().min(1500).max(2100),
  venue: z.string().max(500).optional().nullable(),
  volume: z.string().max(100).optional().nullable(),
  issue: z.string().max(100).optional().nullable(),
  pages: z.string().max(100).optional().nullable(),
  type: z.enum([
    'journal-article',
    'book-chapter',
    'book',
    'preprint',
    'conference-paper',
    'review',
    'dissertation',
    'dataset',
    'other'
  ]),
  abstract: z.string().max(50000).optional().nullable(),
  citationCount: z.number().int().min(0),
  referenceCount: z.number().int().min(0),
  references: z.array(z.string()).default([]),
  citedBy: z.array(z.string()).default([]),
  openAccessUrl: z.string().url().or(z.literal('')).optional().nullable(),
  sourceUrl: z.string().url().or(z.literal('')).optional().nullable(),
  pdfUrl: z.string().url().or(z.literal('')).optional().nullable(),
  disciplines: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  provenance: WorkProvenanceSchema,
});

export const ProjectSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  title: z.string().min(2, 'Title must be at least 2 characters').max(300),
  researchQuestion: z.string().min(5, 'Research question is required').max(1000),
  discipline: z.string().min(2).max(200),
  description: z.string().max(3000),
  initialKeywords: z.array(z.string().max(100)).max(30),
  isPrivate: z.boolean().default(true),
});

export const AuditEventSchema = z.object({
  workspaceId: z.string().min(1),
  projectId: z.string().optional().nullable(),
  actorId: z.string().min(1),
  actorEmail: z.string().email(),
  action: z.string().min(1).max(100),
  targetType: z.enum(['workspace', 'project', 'work', 'annotation', 'tag', 'member', 'provider_config']),
  targetId: z.string().min(1),
  details: z.record(z.string(), z.any()),
  isDestructive: z.boolean().default(false),
  timestamp: z.string(),
});

export const EvidenceRecordSchema = z.object({
  projectId: z.string().min(1),
  workId: z.string().min(1),
  claimStatement: z.string().min(5).max(2000),
  supportStrength: z.enum(['strong', 'moderate', 'weak', 'contested']),
  verbatimPassage: z.string().min(5).max(10000),
  pageOrSection: z.string().min(1).max(200),
  warrantExplanation: z.string().max(3000).optional().nullable(),
  verificationStatus: z.enum(['verified', 'verify_before_citing', 'needs_source', 'author_inference']),
  verifiedBy: z.string().optional().nullable(),
  subClaimCategory: z.string().max(200).optional().nullable(),
});

export const ScholarlySearchSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty').max(1000),
  filters: z.object({
    yearMin: z.number().int().min(1500).max(2100).optional(),
    yearMax: z.number().int().min(1500).max(2100).optional(),
    type: z.enum([
      'journal-article',
      'book-chapter',
      'book',
      'preprint',
      'conference-paper',
      'review',
      'dissertation',
      'dataset',
      'other'
    ]).optional(),
    author: z.string().max(200).optional(),
    venue: z.string().max(300).optional(),
    openAccessOnly: z.boolean().optional(),
    minCitations: z.number().int().min(0).optional(),
    providers: z.array(z.enum(['OpenAlex', 'Crossref'])).optional(),
    limit: z.number().int().min(1).max(50).optional(),
    offset: z.number().int().min(0).optional()
  }).optional().default({})
});

export const ScholarlyResolveSchema = z.object({
  identifier: z.string().min(1, 'Identifier or citation string required').max(2000)
});

export const ScholarlyExpandGraphSchema = z.object({
  workIds: z.array(z.string().min(1)).min(1, 'At least one root workId required'),
  knownWorks: z.array(z.any()).default([]),
  direction: z.enum(['cites', 'cited_by', 'related', 'both']).default('both'),
  depth: z.number().int().min(1).max(2).default(1)
});

export const ScholarlyNetworkExpandSchema = z.object({
  selectedWork: z.object({
    id: z.string().optional(),
    doi: z.string().optional().nullable(),
    openAlexId: z.string().optional().nullable(),
    title: z.string().optional(),
    authors: z.array(z.any()).optional(),
    year: z.number().optional()
  }).passthrough(),
  operation: z.enum(['references', 'cited_by', 'related']),
  limit: z.number().int().min(1).max(100).optional().default(25),
  bypassCache: z.boolean().optional().default(false)
});

export const ScholarlyImportSchema = z.object({
  content: z.string().min(5, 'BibTeX or RIS text content is required').max(2000000)
});

// -------------------------------------------------------------
// Scite Verification Zod Schemas
// -------------------------------------------------------------

export const SciteTalliesSchema = z.object({
  doi: z.string().min(1, 'DOI is required'),
  workspaceId: z.string().optional()
});

export const SciteStatementsSchema = z.object({
  doi: z.string().min(1, 'DOI is required'),
  limit: z.number().int().min(1).max(100).optional().default(20),
  workspaceId: z.string().optional()
});

export const SciteVerifyWorkSchema = z.object({
  doi: z.string().min(1, 'DOI is required'),
  workId: z.string().optional(),
  workspaceId: z.string().optional()
});

export const SciteClaimChallengeSchema = z.object({
  claim: z.string().min(3, 'Claim statement must be at least 3 characters').max(2000),
  doi: z.string().optional().nullable(),
  literatureScope: z.array(z.any()).optional(),
  workspaceId: z.string().optional()
});

export const SciteReferenceCheckSchema = z.object({
  references: z.array(z.object({
    id: z.string().optional(),
    doi: z.string().optional(),
    text: z.string().optional(),
    title: z.string().optional()
  })).min(1, 'At least one reference or DOI required').max(200),
  projectId: z.string().optional(),
  workspaceId: z.string().optional()
});

export const SciteSettingsUpdateSchema = z.object({
  workspaceId: z.string().optional().default('ws_default'),
  updates: z.object({
    sciteEnabled: z.boolean().optional(),
    monthlyBudget: z.number().int().min(1).max(50000).optional(),
    cacheDurationHours: z.number().int().min(1).max(720).optional()
  })
});

import { ScholarlyDiscoveryService } from './server/services/ScholarlyDiscoveryService';
import { SciteAdapter } from './server/services/SciteAdapter';
import { FastTrackMcpAdapter } from './server/services/FastTrackMcpAdapter';
import { ResearchMonitorService } from './server/services/ResearchMonitorService';
import { ExportAuditService } from './server/services/ExportAuditService';
import { GoogleGenAI } from '@google/genai';
import { CitationTrailService } from './server/services/CitationTrailService';
import { StudyNextRecommendationService } from './server/services/StudyNextRecommendationService';

const scholarlyService = ScholarlyDiscoveryService.getInstance();
const sciteAdapter = SciteAdapter.getInstance();
const mcpAdapter = FastTrackMcpAdapter.getInstance();
const monitorService = ResearchMonitorService.getInstance();
const exportAuditService = ExportAuditService.getInstance();
const trailService = CitationTrailService.getInstance();
const studyNextService = StudyNextRecommendationService.getInstance();

export const StudyNextRecommendationsSchema = z.object({
  projectId: z.string().min(1),
  projectTitle: z.string().default('Research Project'),
  researchQuestion: z.string().default('Literature discovery'),
  seedWorks: z.array(z.any()).default([]),
  candidatePool: z.array(z.object({
    work: z.any(),
    sourceTrailId: z.string().optional(),
    sourceTrailTitle: z.string().optional(),
    reasons: z.array(z.any()).optional(),
    connectedSeedIds: z.array(z.string()).optional()
  })).default([]),
  existingProjectCandidateStates: z.array(z.any()).optional().default([]),
  preferences: z.object({
    emphasis: z.enum(['balanced', 'foundational', 'recent', 'diverse']).optional(),
    yearRange: z.tuple([z.number(), z.number()]).optional(),
    excludedTypes: z.array(z.string()).optional(),
    openAccessOnly: z.boolean().optional(),
    activeSeedIds: z.array(z.string()).optional(),
    weightGraphVsSemantic: z.enum(['graph_primary', 'balanced', 'semantic_primary']).optional()
  }).optional()
});

export const ReadingPromptSchema = z.object({
  work: z.any(),
  projectTitle: z.string().min(1),
  researchQuestion: z.string().min(1),
  role: z.string().optional(),
  notes: z.string().optional(),
  seedWorks: z.array(z.any()).optional()
});

export const McpExecuteSchema = z.object({
  action: z.enum(['check_duplication', 'map_debate_lines', 'assess_saturation', 'suggest_candidates']),
  researchQuestion: z.string().min(3, 'Research question is required').max(1000),
  discipline: z.string().max(200).optional(),
  projectTitle: z.string().max(300).optional(),
  existingWorks: z.array(z.any()).optional().default([]),
  additionalContext: z.string().max(3000).optional()
});

export const MonitorCreateSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  sourceType: z.enum(['search_query', 'seed_set']),
  queryText: z.string().max(1000).optional(),
  queryFilters: z.record(z.string(), z.any()).optional(),
  seedWorkIds: z.array(z.string()).optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
  enabled: z.boolean().default(true),
  createdBy: z.string().optional().default('usr_current')
});

export const MonitorUpdateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  enabled: z.boolean().optional(),
  queryText: z.string().max(1000).optional(),
  queryFilters: z.record(z.string(), z.any()).optional(),
  seedWorkIds: z.array(z.string()).optional()
});

export const TrailCreateSchema = z.object({
  workspaceId: z.string().default('ws_default'),
  projectId: z.string().min(1, 'Project ID is required'),
  createdBy: z.string().default('usr_current'),
  creatorName: z.string().optional().default('Researcher'),
  title: z.string().min(2, 'Title required').max(300),
  trailType: z.enum([
    'root',
    'earlier_work',
    'later_work',
    'similar_work',
    'shared_references',
    'common_authors',
    'possible_bridges',
    'counterevidence'
  ]),
  seedWorks: z.array(z.any()).min(1, 'At least 1 seed work is required'),
  parentTrailId: z.string().nullable().optional(),
  rootTrailId: z.string().optional(),
  requestParams: z.record(z.string(), z.any()).optional(),
  researcherNotes: z.string().max(5000).optional(),
  localGraphWorks: z.array(z.any()).optional()
});

export const TrailUpdateSchema = z.object({
  title: z.string().min(2).max(300).optional(),
  status: z.enum(['active', 'reviewed', 'archived']).optional(),
  researcherNotes: z.string().max(5000).optional(),
  mapLayoutState: z.record(z.string(), z.any()).optional(),
  decisions: z.record(z.string(), z.any()).optional()
});

export const CandidateStatusUpdateSchema = z.object({
  status: z.enum(['candidate', 'queued', 'included', 'rejected']),
  relevanceNotes: z.string().max(2000).optional()
});

export const TrailSnapshotSchema = z.object({
  title: z.string().min(1).max(200),
  createdBy: z.string().optional().default('researcher')
});

export const TrailExploreActionSchema = z.object({
  action: z.enum([
    'earlier_work',
    'later_work',
    'similar_work',
    'shared_references',
    'common_authors',
    'possible_bridges',
    'counterevidence'
  ]),
  seedWorks: z.array(z.any()).min(1),
  localGraphWorks: z.array(z.any()).optional(),
  targetClaimStatement: z.string().optional(),
  includeSciteContrasting: z.boolean().optional(),
  limit: z.number().min(1).max(100).optional().default(25),
  offset: z.number().min(0).optional().default(0)
});

export const TrailConclusionSchema = z.object({
  conclusion: z.string().min(2, 'Conclusion text required').max(10000),
  reviewSummary: z.object({
    explored: z.string().default(''),
    found: z.string().default(''),
    included: z.string().default(''),
    rejectedAndWhy: z.string().default(''),
    coverageLimitations: z.string().default(''),
    exploreNext: z.string().default(''),
    researcherConclusion: z.string().default(''),
    aiSuggestions: z.string().optional(),
    aiSuggestionDisclaimer: z.string().optional()
  }).optional()
});

export const TrailPromoteSchema = z.object({
  collectionName: z.string().min(2, 'Collection name required').max(200),
  sectionTitle: z.string().max(200).optional(),
  user: z.object({
    id: z.string(),
    name: z.string()
  }).optional()
});

export const TrailCommentSchema = z.object({
  text: z.string().min(1, 'Comment text required').max(2000),
  authorId: z.string().default('usr_current'),
  authorEmail: z.string().optional(),
  authorName: z.string().default('Collaborator')
});

// Lazy Gemini API client
let genAIInstance: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAIInstance && process.env.GEMINI_API_KEY) {
    genAIInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAIInstance;
}


// In-memory audit storage for demonstration & server audit tracking
const inMemoryAuditLogs: any[] = [];
const inMemorySearchLogs: any[] = [];

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    name: 'Evidence Atlas Backend',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Validate Work Entity
app.post('/api/validate-work', (req: Request, res: Response) => {
  try {
    const validated = NormalizedWorkSchema.parse(req.body);
    res.json({ valid: true, data: validated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ valid: false, errors: error.issues });
    } else {
      res.status(500).json({ valid: false, message: 'Internal validation failure' });
    }
  }
});

// Audit Events (Server side recording)
app.post('/api/audit-events', (req: Request, res: Response) => {
  try {
    const validated = AuditEventSchema.parse(req.body);
    const logEntry = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...validated,
      recordedAt: new Date().toISOString(),
      ipOrOrigin: req.ip || req.headers['x-forwarded-for'] || 'client-request'
    };
    inMemoryAuditLogs.unshift(logEntry);
    if (inMemoryAuditLogs.length > 500) {
      inMemoryAuditLogs.pop();
    }
    res.json({ success: true, entry: logEntry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: error.issues });
    } else {
      res.status(500).json({ success: false, message: 'Failed to record audit event' });
    }
  }
});

app.get('/api/audit-events', (req: Request, res: Response) => {
  const { workspaceId, projectId } = req.query;
  let results = inMemoryAuditLogs;
  if (workspaceId) {
    results = results.filter(l => l.workspaceId === workspaceId);
  }
  if (projectId) {
    results = results.filter(l => l.projectId === projectId);
  }
  res.json({ events: results });
});

// Search Logs
app.post('/api/search-logs', (req: Request, res: Response) => {
  try {
    const entry = {
      id: req.body.id || `srch_${Date.now()}`,
      ...req.body,
      receivedAt: new Date().toISOString()
    };
    inMemorySearchLogs.unshift(entry);
    if (inMemorySearchLogs.length > 200) {
      inMemorySearchLogs.pop();
    }
    res.json({ success: true, log: entry });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/search-logs', (req: Request, res: Response) => {
  const { projectId } = req.query;
  let results = inMemorySearchLogs;
  if (projectId) {
    results = results.filter(s => s.projectId === projectId);
  }
  res.json({ searchLogs: results });
});

// Provider Integration Status Check
// Secure: Never exposes API keys or tokens to the browser!
app.get('/api/integrations/status', (_req: Request, res: Response) => {
  res.json({
    openAlex: {
      available: true,
      protocol: 'REST / OpenAlex Polite Pool',
      configured: true,
      description: 'OpenAlex metadata via standard polite header'
    },
    crossref: {
      available: true,
      protocol: 'REST / Crossref Works API',
      configured: true,
      description: 'Crossref bibliographic records & DOI resolver'
    },
    semanticScholar: {
      available: true,
      protocol: 'REST / Semantic Scholar Graph API',
      configured: Boolean(process.env.SEMANTIC_SCHOLAR_API_KEY),
      description: 'Citation intent & TLDR summaries'
    },
    scite: {
      available: true,
      protocol: 'REST / Scite Smart Citations API',
      configured: Boolean(process.env.SCITE_API_KEY),
      description: 'Smart citation classifications (supporting / disputing)'
    }
  });
});

// Format BibTeX Export
app.post('/api/export/bibtex', (req: Request, res: Response) => {
  const { works } = req.body;
  if (!Array.isArray(works)) {
    return res.status(400).json({ error: 'Works array required' });
  }

  const bibEntries = works.map((w: any) => {
    const firstAuthor = w.authors?.[0]?.name?.split(' ')?.pop()?.toLowerCase() || 'unknown';
    const citeKey = `${firstAuthor}${w.year || 'nd'}_${w.id?.substring(0, 5) || 'ref'}`;
    const authorsStr = (w.authors || []).map((a: any) => a.name).join(' and ');
    
    let entryType = 'article';
    if (w.type === 'book') entryType = 'book';
    if (w.type === 'book-chapter') entryType = 'incollection';
    if (w.type === 'conference-paper') entryType = 'inproceedings';

    return `@${entryType}{${citeKey},
  title = {${w.title || 'Untitled'}},
  author = {${authorsStr}},
  year = {${w.year || ''}},
  journal = {${w.venue || ''}},
  doi = {${w.doi || ''}},
  url = {${w.openAccessUrl || w.sourceUrl || ''}},
  note = {Retrieved via Evidence Atlas (${w.provenance?.provider || 'Manual'})}
}`;
  }).join('\n\n');

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename="evidence_atlas_export.bib"');
  res.send(bibEntries);
});

// Format RIS Export
app.post('/api/export/ris', (req: Request, res: Response) => {
  const { works } = req.body;
  if (!Array.isArray(works)) {
    return res.status(400).json({ error: 'Works array required' });
  }
  const risEntries = exportAuditService.generateRIS(works);
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename="evidence_atlas_export.ris"');
  res.send(risEntries);
});

// Format CSV Export with Field-Level Provenance
app.post('/api/export/csv', (req: Request, res: Response) => {
  try {
    const { projectWorks, allWorks } = req.body;
    if (!Array.isArray(projectWorks)) {
      return res.status(400).json({ error: 'projectWorks array required' });
    }
    const worksMap = new Map<string, any>(
      Array.isArray(allWorks) ? allWorks.map((w: any) => [w.id, w]) : []
    );
    const csvContent = exportAuditService.generateCSV(projectWorks, worksMap);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="evidence_atlas_provenance_export.csv"');
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate CSV export' });
  }
});

// Format Markdown Bibliography Export
app.post('/api/export/markdown', (req: Request, res: Response) => {
  try {
    const { project, projectWorks, allWorks } = req.body;
    if (!project || !Array.isArray(projectWorks)) {
      return res.status(400).json({ error: 'project and projectWorks required' });
    }
    const worksMap = new Map<string, any>(
      Array.isArray(allWorks) ? allWorks.map((w: any) => [w.id, w]) : []
    );
    const mdContent = exportAuditService.generateMarkdownBibliography(project, projectWorks, worksMap);
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', 'attachment; filename="evidence_atlas_bibliography.md"');
    res.send(mdContent);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate Markdown bibliography' });
  }
});

// Generate Full Reproducible Research Audit Report
app.post('/api/export/audit-report', (req: Request, res: Response) => {
  try {
    const { project, projectWorks, allWorks, evidenceRecords, searchLogs, monitors } = req.body;
    if (!project) {
      return res.status(400).json({ error: 'Project data required' });
    }
    const worksMap = new Map<string, any>(
      Array.isArray(allWorks) ? allWorks.map((w: any) => [w.id, w]) : []
    );
    const report = exportAuditService.generateResearchAuditReport({
      project,
      projectWorks: Array.isArray(projectWorks) ? projectWorks : [],
      allWorks: worksMap,
      evidenceRecords: Array.isArray(evidenceRecords) ? evidenceRecords : [],
      searchLogs: Array.isArray(searchLogs) ? searchLogs : [],
      monitors: Array.isArray(monitors) ? monitors : []
    });
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate Research Audit Report' });
  }
});

// Generate Dedicated Citation Trail Audit Report (Markdown, JSON, and CSV)
app.post('/api/export/trails-audit', (req: Request, res: Response) => {
  try {
    const { project, trails, candidatesMap } = req.body;
    if (!project) {
      return res.status(400).json({ error: 'Project data required' });
    }
    const cMap = new Map<string, any[]>(
      Array.isArray(candidatesMap) ? candidatesMap : Object.entries(candidatesMap || {})
    );
    const report = exportAuditService.generateCitationTrailAuditReport({
      project,
      trails: Array.isArray(trails) ? trails : [],
      candidatesMap: cMap
    });
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate Citation Trail audit report' });
  }
});

// -------------------------------------------------------------
// Scholarly Discovery & Retrieval Endpoints (OpenAlex & Crossref)
// -------------------------------------------------------------

// 1. searchWorks
app.post('/api/scholarly/search', async (req: Request, res: Response) => {
  try {
    const validated = ScholarlySearchSchema.parse(req.body);
    const result = await scholarlyService.searchWorks(validated.query, validated.filters);
    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Scholarly search failed' });
    }
  }
});

// 2. resolveWork
app.post('/api/scholarly/resolve', async (req: Request, res: Response) => {
  try {
    const validated = ScholarlyResolveSchema.parse(req.body);
    const work = await scholarlyService.resolveWork(validated.identifier);
    if (!work) {
      return res.status(404).json({ error: 'Work could not be resolved from OpenAlex or Crossref' });
    }
    res.json({ work });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Failed to resolve work' });
    }
  }
});

// 3. expandGraph
app.post('/api/scholarly/expand-graph', async (req: Request, res: Response) => {
  try {
    const validated = ScholarlyExpandGraphSchema.parse(req.body);
    const graph = await scholarlyService.expandGraph(
      validated.workIds,
      validated.knownWorks,
      validated.direction,
      validated.depth
    );
    res.json(graph);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Failed to expand citation graph' });
    }
  }
});

// 3b. networkExpand (Strict OpenAlex relation-verified expansion)
app.post('/api/scholarly/network-expand', async (req: Request, res: Response) => {
  try {
    const validated = ScholarlyNetworkExpandSchema.parse(req.body);
    const result = await scholarlyService.networkExpand(
      validated.selectedWork,
      validated.operation,
      {
        limit: validated.limit,
        bypassCache: validated.bypassCache
      }
    );
    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Failed to perform network expansion' });
    }
  }
});

// 4. importBibtexOrRis
app.post('/api/scholarly/import-bibtex-ris', async (req: Request, res: Response) => {
  try {
    const validated = ScholarlyImportSchema.parse(req.body);
    const result = await scholarlyService.importBibtexOrRis(validated.content);
    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Failed to parse import content' });
    }
  }
});

// 5. addManualWork
app.post('/api/scholarly/manual-work', (req: Request, res: Response) => {
  try {
    const work = scholarlyService.addManualWork(req.body);
    res.json({ work });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create manual work record' });
  }
});

// 6. getWorkProvenance
app.get('/api/scholarly/provenance/:workId', async (req: Request, res: Response) => {
  try {
    const { workId } = req.params;
    const provenance = await scholarlyService.getWorkProvenance(workId);
    if (!provenance) {
      return res.status(404).json({ error: 'Work provenance record not found' });
    }
    res.json(provenance);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve provenance' });
  }
});

// 7. refreshWork
app.post('/api/scholarly/refresh/:workId', async (req: Request, res: Response) => {
  try {
    const { workId } = req.params;
    const refreshed = await scholarlyService.refreshWork(workId);
    if (!refreshed) {
      return res.status(404).json({ error: 'Work not found on providers' });
    }
    res.json({ work: refreshed });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to refresh work' });
  }
});

// 8. getHealth
app.get('/api/scholarly/health', (_req: Request, res: Response) => {
  const health = scholarlyService.getHealth();
  res.json(health);
});

// -------------------------------------------------------------
// Scite Smart Citation Verification Endpoints
// -------------------------------------------------------------

// 1. Get Smart Citation Tallies for a DOI
app.post('/api/scite/tallies', async (req: Request, res: Response) => {
  try {
    const validated = SciteTalliesSchema.parse(req.body);
    const result = await sciteAdapter.getTallies(validated.doi, validated.workspaceId);
    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid DOI format', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Failed to retrieve Scite tallies' });
    }
  }
});

// 2. Get Citation Statements for a DOI
app.post('/api/scite/statements', async (req: Request, res: Response) => {
  try {
    const validated = SciteStatementsSchema.parse(req.body);
    const result = await sciteAdapter.getCitationStatements(validated.doi, validated.limit, validated.workspaceId);
    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failure', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Failed to retrieve citation statements' });
    }
  }
});

// 3. Complete Work Verification (Tallies + Notices + Statements)
app.post('/api/scite/verify-work', async (req: Request, res: Response) => {
  try {
    const validated = SciteVerifyWorkSchema.parse(req.body);
    const result = await sciteAdapter.verifyWork(validated.doi, validated.workId, validated.workspaceId);
    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid verification request parameters', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Failed to verify work with Scite' });
    }
  }
});

// 4. Claim Challenge: Search Scite Evidence & Grounded AI Synthesis
app.post('/api/scite/claim-challenge', async (req: Request, res: Response) => {
  try {
    const validated = SciteClaimChallengeSchema.parse(req.body);
    const { claim, doi, workspaceId } = validated;

    // 1. Retrieve citation statements from Scite
    let statementsResult;
    if (doi) {
      statementsResult = await sciteAdapter.getCitationStatements(doi, 15, workspaceId);
    } else {
      const searchRes = await sciteAdapter.searchEvidence(claim, 10, workspaceId);
      statementsResult = {
        status: searchRes.status,
        statements: searchRes.results
      };
    }

    const statements = statementsResult.statements || [];

    // 2. Synthesize using Gemini if configured, or rigorous local synthesis
    let synthesisText = '';
    const genAI = getGenAI();

    if (genAI && statements.length > 0) {
      try {
        const statementsSummary = statements.map((s, idx) => 
          `[Statement ${idx + 1}]
Classification: ${s.classification}
Citing Paper: "${s.citingTitle}" (${s.citingAuthors?.join(', ') || 'Unknown Authors'}, ${s.citingYear || 'n.d.'})
DOI: ${s.citingDoi || s.targetDoi}
Verbatim Citation Context: "${s.snippet}"`
        ).join('\n\n');

        const prompt = `You are an academic research integrity assistant. You are analyzing scientific citation evidence for this specific research claim:
"${claim}"

Here is the empirical evidence corpus containing verified citation statements retrieved from Scite:
${statementsSummary}

MANDATORY SYNTHESIS DIRECTIVES:
1. Base your synthesis EXCLUSIVELY on the retrieved citation statements provided above. Do NOT cite or invent external papers or claims.
2. Group the analysis neutrally into three aspects:
   - Evidence Supporting the Claim (with exact citing paper names and DOIs)
   - Evidence Contradicting or Qualifying the Claim (with exact citing paper names and DOIs)
   - Methodological & Contextual Observations (mentioning)
3. If the evidence is limited, contested, or incomplete, explicitly state the boundary of what is known.
4. Maintain a neutral, rigorous scholarly tone. Never use generic praise or promotional language.
5. End with a 1-sentence synthesis summary.`;

        const response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        synthesisText = response.text || '';
      } catch (geminiErr: any) {
        console.warn('Gemini synthesis fallback:', geminiErr.message);
      }
    }

    // Fallback rigorous synthesis if Gemini is not active
    if (!synthesisText) {
      const supporting = statements.filter(s => s.classification === 'supporting');
      const contradicting = statements.filter(s => s.classification === 'contradicting');
      const mentioning = statements.filter(s => s.classification === 'mentioning');

      synthesisText = `### Evidence Synthesis for Claim: "${claim}"\n\n` +
        `**Retrieved Citation Corpus**: ${statements.length} citation statements analyzed (${supporting.length} supporting, ${contradicting.length} contradicting, ${mentioning.length} mentioning).\n\n` +
        `**Supporting Findings**:\n` +
        (supporting.length > 0 
          ? supporting.map(s => `- *${s.citingTitle}* (${s.citingAuthors?.[0] || 'Author'} et al., ${s.citingYear}): "${s.snippet}" [DOI: ${s.citingDoi || s.targetDoi}]`).join('\n')
          : `- No explicitly supporting citation statements were indexed for this specific query.`) +
        `\n\n**Contradicting & Qualifying Findings**:\n` +
        (contradicting.length > 0
          ? contradicting.map(s => `- *${s.citingTitle}* (${s.citingAuthors?.[0] || 'Author'} et al., ${s.citingYear}): "${s.snippet}" [DOI: ${s.citingDoi || s.targetDoi}]`).join('\n')
          : `- No contradictory or disputing citation statements were identified in the indexed sample.`) +
        `\n\n**Contextual Observations**:\n` +
        (mentioning.length > 0
          ? mentioning.map(s => `- *${s.citingTitle}*: "${s.snippet}"`).join('\n')
          : `- No additional contextual mentions recorded.`) +
        `\n\n**Synthesis Assessment**: Evidence strength is ${supporting.length > 1 && contradicting.length === 0 ? 'strong' : contradicting.length > 0 ? 'contested' : 'moderate'} across the retrieved sample. Manual verification of primary texts is recommended prior to formal citation.`;
    }

    res.json({
      claim,
      doi,
      statements,
      aiSynthesis: {
        text: synthesisText,
        label: 'AI synthesis based on retrieved sources.',
        generatedAt: new Date().toISOString(),
        model: genAI ? 'gemini-2.5-flash' : 'EvidenceAtlas Rule-Based Grounding'
      },
      status: statements.length > 0 ? 'evidence_available' : 'no_record'
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid claim challenge request', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Failed to evaluate claim challenge' });
    }
  }
});

// 5. Reference Check: Audit reference lists against Scite
app.post('/api/scite/reference-check', async (req: Request, res: Response) => {
  try {
    const validated = SciteReferenceCheckSchema.parse(req.body);
    const report = await sciteAdapter.runReferenceCheck(
      validated.references,
      validated.projectId,
      validated.workspaceId
    );
    res.json(report);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid reference check payload', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Reference check failed' });
    }
  }
});

// 6. Scite Provider Settings (Owner / Workspace Config)
app.get('/api/scite/settings', (req: Request, res: Response) => {
  const workspaceId = (req.query.workspaceId as string) || 'ws_default';
  const config = sciteAdapter.getWorkspaceConfig(workspaceId);
  res.json({
    config,
    disclaimer: 'Scite configuration manages verification rate limits and caching policies. API keys are handled strictly server-side.'
  });
});

app.post('/api/scite/settings', (req: Request, res: Response) => {
  try {
    const validated = SciteSettingsUpdateSchema.parse(req.body);
    const updated = sciteAdapter.updateWorkspaceConfig(validated.workspaceId, validated.updates);
    res.json({ success: true, config: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Failed to update Scite settings' });
    }
  }
});

// 7. Scite Usage Logs
app.get('/api/scite/usage-logs', (req: Request, res: Response) => {
  const workspaceId = req.query.workspaceId as string | undefined;
  const logs = sciteAdapter.getUsageLogs(workspaceId);
  res.json({ logs });
});

// -------------------------------------------------------------
// Fast Track Open Literature MCP Endpoints
// -------------------------------------------------------------

// 1. Connection Self-Test
app.get('/api/mcp/self-test', async (req: Request, res: Response) => {
  try {
    const force = req.query.force === 'true';
    const status = await mcpAdapter.runSelfTest(force);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({
      connected: false,
      status: 'unavailable',
      message: 'Optional provider unavailable; OpenAlex discovery remains fully functional.',
      error: err.message
    });
  }
});

// 2. Execute Research Discovery Action
app.post('/api/mcp/execute', async (req: Request, res: Response) => {
  try {
    const validated = McpExecuteSchema.parse(req.body);
    const result = await mcpAdapter.executeAction(validated);

    // Record MCP execution in Search Log
    const logEntry = {
      id: `srch_mcp_${Date.now()}`,
      projectId: req.body.projectId || 'proj_active',
      queryText: `[MCP: ${validated.action}] ${validated.researchQuestion}`,
      queryFilters: { action: validated.action, discipline: validated.discipline },
      providersQueried: ['Fast Track Open Literature MCP (OpenAlex Heuristic)'],
      providerStatuses: [{
        provider: 'Fast Track Open Literature MCP',
        status: 'success',
        latencyMs: result.latencyMs,
        candidatesCount: result.candidateWorks.length
      }],
      candidateCount: result.candidateWorks.length,
      includedCount: 0,
      excludedCount: 0,
      errors: [],
      executedBy: req.body.userId || 'current_user',
      executedByEmail: req.body.userEmail || 'researcher@evidenceatlas.org',
      executedAt: new Date().toISOString()
    };
    inMemorySearchLogs.unshift(logEntry);

    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Failed to execute MCP action' });
    }
  }
});

// -------------------------------------------------------------
// Research Monitoring & Automated Alert Endpoints
// -------------------------------------------------------------

// 1. List Monitors for Project
app.get('/api/monitors', (req: Request, res: Response) => {
  const projectId = req.query.projectId as string;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId query param required' });
  }
  const monitors = monitorService.getMonitors(projectId);
  res.json({ monitors });
});

// 2. Create Monitor
app.post('/api/monitors', (req: Request, res: Response) => {
  try {
    const validated = MonitorCreateSchema.parse(req.body);
    const monitor = monitorService.createMonitor(validated);
    res.json({ monitor });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Failed to create monitor' });
    }
  }
});

// 3. Update Monitor
app.put('/api/monitors/:monitorId', (req: Request, res: Response) => {
  try {
    const { monitorId } = req.params;
    const validated = MonitorUpdateSchema.parse(req.body);
    const updated = monitorService.updateMonitor(monitorId, validated);
    if (!updated) {
      return res.status(404).json({ error: 'Monitor not found' });
    }
    res.json({ monitor: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Failed to update monitor' });
    }
  }
});

// 4. Delete Monitor
app.delete('/api/monitors/:monitorId', (req: Request, res: Response) => {
  const { monitorId } = req.params;
  const deleted = monitorService.deleteMonitor(monitorId);
  res.json({ success: deleted });
});

// 5. Run Monitor Now (Idempotent execution)
app.post('/api/monitors/:monitorId/run', async (req: Request, res: Response) => {
  try {
    const { monitorId } = req.params;
    const { knownWorks } = req.body;
    const result = await monitorService.runMonitor(monitorId, Array.isArray(knownWorks) ? knownWorks : []);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to execute monitor run' });
  }
});

// 6. Get Monitored Candidates for Project
app.get('/api/monitors/candidates', (req: Request, res: Response) => {
  const projectId = req.query.projectId as string;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId query param required' });
  }
  const candidates = monitorService.getCandidates(projectId);
  res.json({ candidates });
});

// 7. Dismiss Candidate
app.post('/api/monitors/candidates/:candidateId/dismiss', (req: Request, res: Response) => {
  const { candidateId } = req.params;
  const { projectId } = req.body;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId required' });
  }
  const success = monitorService.dismissCandidate(projectId, candidateId);
  res.json({ success });
});

// 8. Mark Candidate Imported
app.post('/api/monitors/candidates/:candidateId/import', (req: Request, res: Response) => {
  const { candidateId } = req.params;
  const { projectId } = req.body;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId required' });
  }
  const success = monitorService.markCandidateImported(projectId, candidateId);
  res.json({ success });
});

// -------------------------------------------------------------
// In-App Notification Endpoints
// -------------------------------------------------------------

app.get('/api/notifications', (req: Request, res: Response) => {
  const userId = req.query.userId as string | undefined;
  const notifications = monitorService.getNotifications(userId);
  res.json({ notifications });
});

app.post('/api/notifications/:notificationId/read', (req: Request, res: Response) => {
  const { notificationId } = req.params;
  const success = monitorService.markNotificationRead(notificationId);
  res.json({ success });
});

// -------------------------------------------------------------
// Citation Trails Exploration & Graph Endpoints
// -------------------------------------------------------------

// 1. List Trails for Project
app.get('/api/trails', (req: Request, res: Response) => {
  const projectId = req.query.projectId as string;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId query param required' });
  }
  const trails = trailService.getTrails(projectId);
  res.json({ trails });
});

// 2. Get Single Trail with Candidates, Events & Snapshots
app.get('/api/trails/:trailId', (req: Request, res: Response) => {
  const { trailId } = req.params;
  const data = trailService.getTrail(trailId);
  if (!data) {
    return res.status(404).json({ error: 'Citation Trail not found' });
  }
  res.json(data);
});

// 3. Create or Branch Citation Trail
app.post('/api/trails', async (req: Request, res: Response) => {
  try {
    const validated = TrailCreateSchema.parse(req.body);
    const result = await trailService.createTrail(validated);
    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Failed to create citation trail' });
    }
  }
});

// 4. Update Trail Metadata & Notes
app.put('/api/trails/:trailId', (req: Request, res: Response) => {
  try {
    const { trailId } = req.params;
    const validated = TrailUpdateSchema.parse(req.body);
    const updated = trailService.updateTrail(trailId, validated);
    if (!updated) {
      return res.status(404).json({ error: 'Citation Trail not found' });
    }
    res.json({ trail: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Failed to update citation trail' });
    }
  }
});

// 5. Load More Candidates (Pagination - 25 more)
app.post('/api/trails/:trailId/load-more', async (req: Request, res: Response) => {
  try {
    const { trailId } = req.params;
    const { seedWorks, localGraphWorks } = req.body;
    if (!Array.isArray(seedWorks) || seedWorks.length === 0) {
      return res.status(400).json({ error: 'seedWorks array required' });
    }
    const result = await trailService.loadMoreCandidates(trailId, seedWorks, Array.isArray(localGraphWorks) ? localGraphWorks : []);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load more candidates' });
  }
});

// 6. Update Candidate Decision / Status ('candidate' | 'queued' | 'included' | 'rejected')
app.post('/api/trails/:trailId/candidates/:candidateId/status', (req: Request, res: Response) => {
  try {
    const { trailId, candidateId } = req.params;
    const validated = CandidateStatusUpdateSchema.parse(req.body);
    const updatedCandidate = trailService.updateCandidateStatus(trailId, candidateId, validated.status, validated.relevanceNotes);
    if (!updatedCandidate) {
      return res.status(404).json({ error: 'Candidate not found in trail' });
    }
    res.json({ candidate: updatedCandidate });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Failed to update candidate status' });
    }
  }
});

// 7. Create Trail Snapshot
app.post('/api/trails/:trailId/snapshots', (req: Request, res: Response) => {
  try {
    const { trailId } = req.params;
    const validated = TrailSnapshotSchema.parse(req.body);
    const snapshot = trailService.createSnapshot(trailId, validated.title, validated.createdBy);
    if (!snapshot) {
      return res.status(404).json({ error: 'Trail not found to snapshot' });
    }
    res.json({ snapshot });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Failed to create trail snapshot' });
    }
  }
});

// 8. Duplicate Trail
app.post('/api/trails/:trailId/duplicate', (req: Request, res: Response) => {
  const { trailId } = req.params;
  const { newTitle } = req.body;
  const duplicated = trailService.duplicateTrail(trailId, newTitle);
  if (!duplicated) {
    return res.status(404).json({ error: 'Trail not found to duplicate' });
  }
  res.json(duplicated);
});

// 9. Standalone Exploration Action (preview for Work Detail panel)
app.post('/api/trails/explore-action', async (req: Request, res: Response) => {
  try {
    const validated = TrailExploreActionSchema.parse(req.body);
    let result;
    switch (validated.action) {
      case 'earlier_work':
        result = await trailService.exploreEarlierWork(validated.seedWorks, { limit: validated.limit, offset: validated.offset });
        break;
      case 'later_work':
        result = await trailService.exploreLaterWork(validated.seedWorks, { limit: validated.limit, offset: validated.offset });
        break;
      case 'similar_work':
        result = await trailService.exploreSimilarWork(validated.seedWorks, { limit: validated.limit, offset: validated.offset });
        break;
      case 'shared_references':
        result = await trailService.exploreSharedReferences(validated.seedWorks, { limit: validated.limit, offset: validated.offset });
        break;
      case 'common_authors':
        result = await trailService.exploreCommonAuthors(validated.seedWorks, { limit: validated.limit, offset: validated.offset });
        break;
      case 'possible_bridges':
        result = await trailService.findBridgePapers(validated.seedWorks, validated.localGraphWorks || [], { limit: validated.limit, offset: validated.offset });
        break;
      case 'counterevidence':
        result = await trailService.exploreCounterevidence(validated.seedWorks, {
          limit: validated.limit,
          offset: validated.offset,
          targetClaimStatement: validated.targetClaimStatement,
          includeSciteContrasting: validated.includeSciteContrasting,
          projectWorks: validated.localGraphWorks
        });
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Failed to execute exploration action' });
    }
  }
});

// 10. Compare Two Citation Trails Side-by-Side
app.get('/api/trails/compare', (req: Request, res: Response) => {
  try {
    const { trailIdA, trailIdB } = req.query;
    if (!trailIdA || !trailIdB || typeof trailIdA !== 'string' || typeof trailIdB !== 'string') {
      return res.status(400).json({ error: 'Both trailIdA and trailIdB query parameters are required' });
    }
    const comparison = trailService.compareTrails(trailIdA, trailIdB);
    if (!comparison) {
      return res.status(404).json({ error: 'One or both citation trails not found' });
    }
    res.json(comparison);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to compare trails' });
  }
});

// 11. Attach Researcher Conclusion to Trail
app.post('/api/trails/:trailId/conclusion', (req: Request, res: Response) => {
  try {
    const { trailId } = req.params;
    const validated = TrailConclusionSchema.parse(req.body);
    const updated = trailService.updateTrailReviewConclusion(trailId, validated.conclusion, validated.reviewSummary);
    if (!updated) {
      return res.status(404).json({ error: 'Trail not found to attach conclusion' });
    }
    res.json({ trail: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Failed to attach conclusion' });
    }
  }
});

// 12. Toggle Pin Trail
app.post('/api/trails/:trailId/pin', (req: Request, res: Response) => {
  try {
    const { trailId } = req.params;
    const updated = trailService.togglePinTrail(trailId);
    if (!updated) {
      return res.status(404).json({ error: 'Trail not found to pin/unpin' });
    }
    res.json({ trail: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to pin/unpin trail' });
  }
});

// 13. Archive Trail
app.post('/api/trails/:trailId/archive', (req: Request, res: Response) => {
  try {
    const { trailId } = req.params;
    const updated = trailService.archiveTrail(trailId);
    if (!updated) {
      return res.status(404).json({ error: 'Trail not found to archive' });
    }
    res.json({ trail: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to archive trail' });
  }
});

// 14. Promote Trail to Named Collection / Review Subsection
app.post('/api/trails/:trailId/promote', (req: Request, res: Response) => {
  try {
    const { trailId } = req.params;
    const validated = TrailPromoteSchema.parse(req.body);
    const result = trailService.promoteTrailToCollection(trailId, validated.collectionName, validated.sectionTitle, validated.user);
    if (!result) {
      return res.status(404).json({ error: 'Trail not found to promote' });
    }
    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Failed to promote trail' });
    }
  }
});

// 15. Add Comment to Trail
app.post('/api/trails/:trailId/comments', (req: Request, res: Response) => {
  try {
    const { trailId } = req.params;
    const validated = TrailCommentSchema.parse(req.body);
    const updated = trailService.addTrailComment(trailId, validated);
    if (!updated) {
      return res.status(404).json({ error: 'Trail not found to add comment' });
    }
    res.json({ trail: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Failed to add comment' });
    }
  }
});

// 16. Toggle Follow Trail
app.post('/api/trails/:trailId/follow', (req: Request, res: Response) => {
  try {
    const { trailId } = req.params;
    const { userId } = req.body;
    const updated = trailService.toggleFollowTrail(trailId, userId || 'usr_current');
    if (!updated) {
      return res.status(404).json({ error: 'Trail not found to follow/unfollow' });
    }
    res.json({ trail: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to toggle follow on trail' });
  }
});

// 17. Get Trail AI Suggestions
app.get('/api/trails/:trailId/ai-suggestions', (req: Request, res: Response) => {
  try {
    const { trailId } = req.params;
    const { projectResearchQuestion } = req.query;
    const suggestions = trailService.generateTrailAISuggestions(trailId, typeof projectResearchQuestion === 'string' ? projectResearchQuestion : undefined);
    res.json(suggestions);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate AI suggestions' });
  }
});

// -------------------------------------------------------------
// Discovery-to-Reading: Study Next & Reading Prompts Endpoints
// -------------------------------------------------------------

// 1. Compute Study Next Shortlist (Max 6 balanced recommendations)
app.post('/api/study-next/recommendations', async (req: Request, res: Response) => {
  try {
    const validated = StudyNextRecommendationsSchema.parse(req.body);
    const result = studyNextService.computeShortlist({
      projectId: validated.projectId,
      projectTitle: validated.projectTitle,
      researchQuestion: validated.researchQuestion,
      seedWorks: validated.seedWorks,
      candidatePool: validated.candidatePool,
      existingProjectCandidateStates: validated.existingProjectCandidateStates,
      preferences: validated.preferences as any
    });
    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Failed to compute study next shortlist' });
    }
  }
});

// 2. Generate Grounded AI Reading Prompt
app.post('/api/reading-prompt', async (req: Request, res: Response) => {
  try {
    const validated = ReadingPromptSchema.parse(req.body);
    const result = await studyNextService.generateReadingPrompt({
      work: validated.work,
      projectTitle: validated.projectTitle,
      researchQuestion: validated.researchQuestion,
      role: validated.role as any,
      notes: validated.notes,
      seedWorks: validated.seedWorks
    });
    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
    } else {
      res.status(500).json({ error: err.message || 'Failed to generate reading prompt' });
    }
  }
});


// -------------------------------------------------------------
// Vite Middleware / Static Serving
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Evidence Atlas Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
