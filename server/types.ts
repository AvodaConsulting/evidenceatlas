import { z } from 'zod';

export type WorkType = 
  | 'journal-article'
  | 'book-chapter'
  | 'book'
  | 'preprint'
  | 'conference-paper'
  | 'review'
  | 'dissertation'
  | 'dataset'
  | 'other';

export interface Author {
  name: string;
  orcid?: string | null;
  affiliation?: string | null;
}

export interface FieldProvenance {
  provider: string;
  retrievedAt: string;
  license?: string;
}

export interface WorkProvenance {
  provider: string; // 'OpenAlex' | 'Crossref' | 'Merged (OpenAlex + Crossref)' | 'Manual' | 'BibTeX/RIS'
  retrievedAt: string;
  queryId?: string | null;
  rawId?: string | null;
  license?: string | null;
  confidenceScore?: number | null;
}

export interface WorkConflict {
  field: string;
  openAlexValue?: any;
  crossrefValue?: any;
  description: string;
}

export interface Work {
  id: string;
  doi?: string | null;
  openAlexId?: string | null;
  semanticScholarId?: string | null;
  sciteId?: string | null;
  isbn?: string | null;
  title: string;
  subtitle?: string | null;
  authors: Author[];
  year: number;
  venue?: string | null;
  volume?: string | null;
  issue?: string | null;
  pages?: string | null;
  type: WorkType;
  abstract?: string | null;
  citationCount: number;
  citationCountSource?: string;
  referenceCount: number;
  references: string[];
  citedBy: string[];
  openAccessUrl?: string | null;
  sourceUrl?: string | null;
  pdfUrl?: string | null;
  disciplines?: string[];
  keywords?: string[];
  provenance: WorkProvenance;
  fieldLevelProvenance?: Record<string, FieldProvenance>;
  conflicts?: WorkConflict[];
  sourceOpenAlexId?: string | null;
  isManualOrImportOnly?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderSearchFilters {
  yearMin?: number;
  yearMax?: number;
  type?: WorkType;
  author?: string;
  venue?: string;
  openAccessOnly?: boolean;
  minCitations?: number;
  providers?: ('OpenAlex' | 'Crossref')[];
  limit?: number;
  offset?: number;
}

export interface ProviderSearchResponse {
  provider: 'OpenAlex' | 'Crossref';
  status: 'success' | 'error' | 'circuit_open' | 'rate_limited';
  latencyMs: number;
  works: Work[];
  totalResults?: number;
  error?: string;
  retrievedAt: string;
}

export interface SearchAggregatedResult {
  query: string;
  filters: ProviderSearchFilters;
  works: Work[];
  providerStatuses: {
    provider: string;
    status: 'success' | 'error' | 'circuit_open' | 'rate_limited';
    latencyMs: number;
    candidatesCount: number;
    error?: string;
  }[];
  totalCandidates: number;
  executedAt: string;
  coverageWarnings: string[];
}

export interface GraphNode {
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
  x?: number; // Deterministic year scale
  y?: number; // Deterministic log citation scale
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'cites' | 'referenced_by' | 'related';
  provenance: string; // e.g. "OpenAlex-derived"
}

export interface GraphExpansionResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  rootWorkIds: string[];
  direction: 'cites' | 'cited_by' | 'related' | 'both';
  depth: number;
  provenanceLabel: string; // "OpenAlex-derived"
  metadataDisclaimer: string;
  timestamp: string;
}

// -------------------------------------------------------------
// Strict OpenAlex Network Expansion Contract Types
// -------------------------------------------------------------

export type NetworkExpansionOperation = 'references' | 'cited_by' | 'related';

export interface NetworkExpansionDiagnostics {
  selectedCanonicalId: string | null;
  selectedRawId: string | null;
  relationType: NetworkExpansionOperation;
  source: string;
  rawRelationCount: number;
  normalizedRelationCount: number;
  recordsFetched: number;
  recordsVerified: number;
  droppedMissingMetadata: number;
  timestamp: string;
}

export interface NetworkExpansionCandidate {
  work: Work;
  canonicalOpenAlexId: string;
  title: string;
  relationType: NetworkExpansionOperation;
  relationVerified: boolean;
  relationEvidence: string;
  provider: 'OpenAlex' | 'Semantic' | 'Crossref';
  retrievalTimestamp: string;
  labelExplanation: string;
}

export interface NetworkExpansionExcludedCandidate {
  canonicalOpenAlexId?: string | null;
  title?: string;
  reason: string;
  disqualificationType: string;
}

export interface NetworkExpansionResponse {
  selectedWork: {
    id: string;
    canonicalOpenAlexId: string | null;
    title: string;
    doi: string | null;
    verificationStatus: 'verified' | 'unresolved' | 'ambiguous';
    resolutionMethod?: 'existing_id' | 'doi' | 'title_author_year' | 'none';
    resolutionReason?: string;
  };
  operation: NetworkExpansionOperation;
  candidates: NetworkExpansionCandidate[];
  excludedCandidates: NetworkExpansionExcludedCandidate[];
  warnings: string[];
  countLabel?: string;
  diagnostics?: NetworkExpansionDiagnostics;
  requestMetadata: {
    provider: string;
    endpoint: string;
    exactFilters: Record<string, any>;
    rawCountReturned: number;
    validCount: number;
    excludedCount: number;
    cacheStatus: 'hit_fresh' | 'hit_stale' | 'miss' | 'coalesced' | 'bypass';
    retrievalTimestamp: string;
    cacheKey: string;
    latencyMs: number;
  };
}

// -------------------------------------------------------------
// Scite Smart Citation Verification Types
// -------------------------------------------------------------

export type SciteVerificationStatus = 
  | 'not_checked'
  | 'checking'
  | 'evidence_available'
  | 'no_record'
  | 'provider_unavailable'
  | 'access_not_configured'
  | 'rate_limited'
  | 'budget_exceeded';

export type SciteCitationClassification = 
  | 'supporting' 
  | 'contradicting' 
  | 'mentioning' 
  | 'unclassified';

export interface SciteTallies {
  doi: string;
  total: number;
  supporting: number;
  contradicting: number; // Also termed 'contrasting' in Scite UI
  mentioning: number;
  unclassified: number;
  citingPublications: number;
}

export interface SciteEditorialNotice {
  type: 'retraction' | 'correction' | 'expression_of_concern' | 'editorial_notice';
  text: string;
  date?: string;
  url?: string;
}

export interface SciteCitationStatement {
  id: string;
  targetDoi: string;
  citingDoi?: string;
  citingTitle?: string;
  citingAuthors?: string[];
  citingYear?: number;
  citingVenue?: string;
  sourceLink?: string;
  snippet: string;
  text?: string;
  classification: SciteCitationClassification;
  section?: string; // e.g. 'introduction', 'methods', 'results', 'discussion'
  confidenceScore?: number;
}

export interface SciteWorkVerificationResult {
  workId?: string;
  doi: string;
  status: SciteVerificationStatus;
  tallies?: SciteTallies;
  editorialNotices?: SciteEditorialNotice[];
  statements?: SciteCitationStatement[];
  verifiedAt: string;
  cached?: boolean;
  message?: string;
  error?: string;
}

export interface SciteReferenceCheckItemResult {
  id?: string;
  doi?: string;
  title?: string;
  rawReference?: string;
  status: SciteVerificationStatus;
  tallies?: SciteTallies;
  editorialNotices?: SciteEditorialNotice[];
  hasRetraction: boolean;
  hasEditorialNotice: boolean;
  contrastingCount: number;
  supportingCount: number;
  mentioningCount: number;
  topContrastingStatement?: SciteCitationStatement;
}

export interface SciteReferenceCheckRun {
  id: string;
  projectId?: string;
  timestamp: string;
  totalChecked: number;
  retractionsCount: number;
  editorialNoticesCount: number;
  contrastingCount: number;
  results: SciteReferenceCheckItemResult[];
  disclaimer: string;
}

export interface SciteWorkspaceConfig {
  sciteEnabled: boolean;
  monthlyBudget: number;
  usedThisMonth: number;
  cacheDurationHours: number;
  hasServerKey: boolean;
}

export interface SciteUsageLog {
  id: string;
  workspaceId: string;
  actorId: string;
  actorEmail: string;
  action: 'tallies_lookup' | 'statements_lookup' | 'reference_check' | 'claim_challenge';
  targetDoi?: string;
  status: string;
  cached: boolean;
  latencyMs: number;
  timestamp: string;
}

// -------------------------------------------------------------
// Citation Trails Domain Types
// -------------------------------------------------------------

export type TrailType =
  | 'root'
  | 'earlier_work'
  | 'later_work'
  | 'similar_work'
  | 'shared_references'
  | 'common_authors'
  | 'possible_bridges'
  | 'counterevidence';

export type TrailStatus = 'active' | 'reviewed' | 'archived';

export type CandidateDecision = 'candidate' | 'queued' | 'included' | 'rejected';

export interface TrailComment {
  id: string;
  authorId: string;
  authorEmail?: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface TrailReviewSummary {
  explored: string;
  found: string;
  included: string;
  rejectedAndWhy: string;
  coverageLimitations: string;
  exploreNext: string;
  researcherConclusion: string;
  aiSuggestions?: string;
  aiSuggestionDisclaimer?: string;
}

export interface PromotedCollection {
  name: string;
  sectionTitle?: string;
  promotedAt: string;
  promotedBy: string;
}

export interface ExplorationBudget {
  maxActiveTrails: number;
  maxHops: number;
  candidateLimitPerTrail: number;
}

export interface StopAndReviewConfig {
  branchThreshold: number; // default 5
  studyQueueThreshold: number; // default 20
  enabled: boolean;
}

export interface CitationTrail {
  id: string;
  workspaceId: string;
  projectId: string;
  createdBy: string;
  creatorName?: string;
  createdAt: string;
  updatedAt: string;
  parentTrailId: string | null;
  rootTrailId: string;
  title: string;
  trailType: TrailType;
  seedWorkIds: string[];
  seedWorks?: Work[];
  providerSources: string[];
  requestParams: {
    filters?: Record<string, any>;
    queryText?: string;
    direction?: string;
    threshold?: number;
    authorFilter?: string;
    targetClaimStatement?: string;
    includeSciteContrasting?: boolean;
    [key: string]: any;
  };
  resultLimit: number;
  offset: number;
  totalAvailable: number;
  hasMore: boolean;
  provenanceSummary: string;
  retrievalTimestamps: string[];
  mapLayoutState: {
    zoom?: number;
    pan?: { x: number; y: number };
    selectedNodeId?: string;
  };
  status: TrailStatus;
  isPinned?: boolean;
  researcherNotes: string;
  researcherConclusion?: string;
  reviewSummary?: TrailReviewSummary;
  promotedCollection?: PromotedCollection;
  comments?: TrailComment[];
  followedByUsers?: string[];
  decisions: Record<string, 'included' | 'study_queue' | 'not_relevant' | 'undecided'>;
  coverageWarnings: string[];
}

export interface CitationTrailEvent {
  id: string;
  trailId: string;
  projectId: string;
  workspaceId: string;
  actionType:
    | 'create_trail'
    | 'branch_trail'
    | 'load_more'
    | 'apply_filter'
    | 'add_to_queue'
    | 'include_in_library'
    | 'mark_not_relevant'
    | 'archive_trail'
    | 'rename_trail'
    | 'update_notes'
    | 'restore_snapshot';
  sourceTrailId: string | null;
  targetTrailId: string | null;
  seedWorksUsed: string[];
  providerQueried: string;
  retrievalTime: string;
  resultCount: number;
  userId: string;
  userEmail: string;
  warnings: string[];
  details?: Record<string, any>;
  timestamp: string;
}

export interface BridgePathDetail {
  fromSeedId: string;
  fromSeedTitle: string;
  toSeedOrClusterId: string;
  toSeedOrClusterTitle: string;
  localPath: string[]; // [fromId, bridgeCandidateId, toId]
  localEdgeCount: number;
  explanation: string;
}

export interface CounterevidenceDetail {
  targetClaim?: string;
  contradictingStatement?: {
    snippet: string;
    sourceTitle: string;
    doi?: string;
    year?: number;
  };
  manualDisputeReason?: string;
  perspectiveCategory: 'manually_marked_dispute' | 'scite_contrasting_citation' | 'alternative_methodology' | 'competing_finding';
  requiresHumanReview: boolean;
}

export interface DiscoveryCandidate {
  id: string;
  trailId: string;
  projectId: string;
  work: Work;
  reasons: string[]; // "Why it appeared" reasons
  connectionCount: number; // Number of connected seed works
  connectedSeedWorkIds: string[];
  status: CandidateDecision;
  relevanceNotes?: string;
  bridgePathDetail?: BridgePathDetail;
  counterevidenceDetail?: CounterevidenceDetail;
  sciteStatus?: SciteVerificationStatus;
  sciteTallies?: SciteTallies;
  editorialNotices?: SciteEditorialNotice[];
  createdAt: string;
  updatedAt: string;
}

export interface TrailSnapshot {
  id: string;
  trailId: string;
  projectId: string;
  title: string;
  candidateCount: number;
  includedCount: number;
  queuedCount: number;
  rejectedCount: number;
  snapshotData: {
    trail: CitationTrail;
    candidates: DiscoveryCandidate[];
    events: CitationTrailEvent[];
  };
  createdBy: string;
  createdAt: string;
}

export interface StudyQueueItem {
  id: string;
  projectId: string;
  workId: string;
  work: Work;
  trailId?: string;
  trailTitle?: string;
  addedBy: string;
  addedAt: string;
  status: 'pending' | 'in_review' | 'included' | 'dismissed';
  notes?: string;
}

// -------------------------------------------------------------
// Discovery-to-Reading Workflow Domain Types
// -------------------------------------------------------------

export type CandidateWorkState =
  | 'discovered'
  | 'saved_for_later'
  | 'study_next'
  | 'reading'
  | 'read'
  | 'included_in_library'
  | 'not_relevant'
  | 'excluded_with_reason';

export type CandidateRole =
  | 'foundational_premise'
  | 'methodological_ancestor'
  | 'empirical_validation'
  | 'competing_claim'
  | 'contrast_case'
  | 'reproducibility_benchmark'
  | 'application_domain'
  | 'Foundational Work'
  | 'Later Development'
  | 'Conceptually Similar Work'
  | 'Possible Bridge Work'
  | 'Methodological Alternative'
  | 'Possible Counterargument'
  | 'Under-read but Relevant Work';

export interface CandidateReason {
  category: 'direct_reference' | 'direct_citation' | 'shared_references' | 'common_author' | 'bridge_paper' | 'semantic_similarity' | string;
  description: string;
  count?: number;
  seedWorkId?: string;
  seedWorkTitle?: string;
  role?: CandidateRole;
}

export interface ScoreBreakdown {
  graphAffinity: number;
  connectionCoverageAcrossSeeds: number;
  semanticSimilarity: number | null;
  semanticAvailable: boolean;
  recencySignal: number;
  diversityAdjustment: number;
  userApprovalSignal: number;
  sourceCompleteness: number;
  discoveryFitScore: number;
}

export type CandidateFeedbackType =
  | 'more_like_this'
  | 'less_like_this'
  | 'irrelevant_despite_proximity'
  | 'relevant_outside_scope'
  | 'already_read'
  | 'needs_verification'
  | 'exceptional_match'
  | 'crucial_premise'
  | 'graph_too_broad'
  | 'not_relevant_method'
  | 'too_recent';

export interface CandidateFeedback {
  id: string;
  type: CandidateFeedbackType;
  label: string;
  notes?: string;
  scope: 'project' | 'workspace';
  createdAt: string;
}

export interface ProjectCandidateState {
  id: string; // `${projectId}_${workId}`
  projectId: string;
  workId: string;
  work: Work;
  state: CandidateWorkState;
  exclusionReason?: string;
  notes?: string;
  tags: string[];
  inDiscoveryTray: boolean;
  dateFound: string;
  sourceTrailIds: string[];
  sourceTrailTitles: string[];
  reasons: CandidateReason[];
  feedbackHistory: CandidateFeedback[];
  assignedCollaboratorId?: string;
  assignedCollaboratorName?: string;
  dueDate?: string;
  studyPriority?: 'high' | 'medium' | 'low';
  readingProgress?: 'unread' | 'in_progress' | 'completed';
  updatedAt: string;
}

export interface StudyNextRecommendation {
  work: Work;
  candidateRole?: CandidateRole;
  role?: CandidateRole;
  roleExplanation?: string;
  selectionReasons?: CandidateReason[];
  sourceTrailIds?: string[];
  sourceTrailTitles?: string[];
  graphConnectionsToSeeds?: {
    seedWorkId: string;
    seedTitle: string;
    connectionType: string;
    description: string;
  }[];
  scores?: ScoreBreakdown;
  discoveryFitScore?: number;
  scoreBreakdown?: {
    graphAffinityScore: number;
    connectionCoverageScore: number;
    recencyScore: number;
    sourceCompletenessScore: number;
    feedbackPenaltyScore: number;
  };
  whyStudyNext?: string[];
  connectedSeedTitles?: string[];
  coverageWarnings?: string[];
  currentState?: CandidateWorkState;
  sciteStatus?: SciteVerificationStatus;
}

export interface StudyNextShortlistResult {
  shortlist: StudyNextRecommendation[];
  omittedRoles?: {
    role: CandidateRole;
    reason: string;
  }[];
  diversitySummary?: string;
  totalEvaluated?: number;
  totalEligibleCandidates?: number;
  diversificationApplied?: boolean;
  generatedAt?: string;
  filtersUsed?: StudyNextPreferences;
}

export interface StudyNextPreferences {
  emphasis: 'balanced' | 'foundational' | 'recent' | 'diverse' | 'foundational_anchors' | 'methodological_depth' | 'recent_empirical' | 'competing_critique';
  yearRange: [number, number];
  excludedTypes: WorkType[];
  openAccessOnly: boolean;
  activeSeedIds: string[];
  weightGraphVsSemantic: 'graph_primary' | 'balanced' | 'semantic_primary';
}

export interface ReadingPromptResponse {
  workId: string;
  title: string;
  assignedRole: string;
  readingObjective: string;
  criticalQuestions: string[];
  suggestedFocusSections: string[];
  prompt: string;
  groundedSeedWorks?: { id: string; title: string; year?: number }[];
  purpose?: string;
  criticalQuestion?: string;
  connectionContext?: string;
  groundingStatus?: 'strictly_grounded' | 'metadata_derived';
  disclaimer?: string;
}


