export type Role = 'owner' | 'editor' | 'commenter' | 'viewer';

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

export type ReadStatus = 'unread' | 'reading' | 'completed';
export type InclusionStatus = 'candidate' | 'included' | 'excluded';

export type ClaimType = 
  | 'support' 
  | 'contradict' 
  | 'methodological' 
  | 'contextual' 
  | 'author_inference';

export type SupportStrength = 'strong' | 'moderate' | 'weak' | 'contested';

export type VerificationStatus = 
  | 'verified' 
  | 'verify_before_citing' 
  | 'needs_source' 
  | 'author_inference';

export interface Author {
  name: string;
  orcid?: string;
  affiliation?: string;
}

export interface FieldProvenance {
  provider: string;
  retrievedAt: string;
  license?: string;
}

export interface WorkProvenance {
  provider: string; // e.g., 'OpenAlex', 'Crossref', 'Semantic Scholar', 'Scite', 'Manual Entry'
  retrievedAt: string;
  queryId?: string;
  rawId?: string;
  license?: string;
  confidenceScore?: number;
}

/**
 * Normalized Scholarly Work Domain Model
 * Supports DOI, OpenAlex ID, Semantic Scholar ID, Scite ID, ISBN, Title, Subtitle,
 * Authors, Year, Venue, Type, Abstract, Citation Counts, References, Cited-By,
 * Open Access Links, Source URLs, and Field-Level Provenance.
 */
export interface WorkConflict {
  field: string;
  openAlexValue?: any;
  crossrefValue?: any;
  description: string;
}

export interface Work {
  id: string;
  doi?: string;
  openAlexId?: string;
  semanticScholarId?: string;
  sciteId?: string;
  isbn?: string;
  title: string;
  subtitle?: string;
  authors: Author[];
  year: number;
  venue?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  type: WorkType;
  abstract?: string;
  citationCount: number;
  citationCountSource?: string;
  referenceCount: number;
  references: string[]; // List of DOIs or internal Work IDs
  citedBy: string[];    // List of DOIs or internal Work IDs
  openAccessUrl?: string;
  sourceUrl?: string;
  pdfUrl?: string;
  disciplines?: string[];
  keywords?: string[];
  provenance: WorkProvenance;
  fieldLevelProvenance?: Record<string, FieldProvenance>;
  conflicts?: WorkConflict[];
  sourceOpenAlexId?: string | null;
  isManualOrImportOnly?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
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

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  affiliation?: string;
  orcid?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderSettings {
  openAlexEnabled: boolean;
  crossrefEnabled: boolean;
  semanticScholarEnabled: boolean;
  sciteEnabled: boolean;
  politeEmail?: string;
  rateLimitPerMinute: number;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  isPrivate: boolean;
  providerSettings: ProviderSettings;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: Role;
  joinedAt: string;
  invitedBy: string;
  lastActiveAt?: string;
  status?: 'active' | 'pending';
}

export interface Project {
  id: string;
  workspaceId: string;
  title: string;
  researchQuestion: string;
  discipline: string;
  description: string;
  initialKeywords: string[];
  isPrivate: boolean;
  createdBy: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ProjectWork {
  id: string;
  projectId: string;
  workId: string;
  work?: Work; // Denormalized for rapid UI rendering
  readStatus: ReadStatus;
  inclusionStatus: InclusionStatus;
  exclusionReason?: string;
  personalNotes?: string;
  tags: string[];
  isDemonstration?: boolean;
  addedBy: string;
  addedAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface AnnotationReply {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  text: string;
  mentions?: string[];
  createdAt: string;
}

export interface Annotation {
  id: string;
  projectId: string;
  workId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  text: string;
  quoteText?: string;
  passageReference?: string; // e.g. "Section 3.2, p. 14"
  pageNumber?: number;
  claimType: ClaimType;
  mentions?: string[];
  replies?: AnnotationReply[];
  version?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  projectId: string;
  name: string;
  color: string;
  description?: string;
  createdAt: string;
}

export interface SearchFilterState {
  disciplines?: string[];
  yearMin?: number;
  yearMax?: number;
  openAccessOnly?: boolean;
  types?: WorkType[];
  providers?: string[];
}

export interface ProviderSearchStatus {
  provider: string;
  status: 'success' | 'rate_limited' | 'error' | 'pending';
  latencyMs: number;
  candidatesCount: number;
  error?: string;
}

export interface SearchLog {
  id: string;
  projectId: string;
  queryText: string;
  queryFilters: SearchFilterState;
  providersQueried: string[];
  providerStatuses: ProviderSearchStatus[];
  candidateCount: number;
  includedCount: number;
  excludedCount: number;
  errors: string[];
  executedBy: string;
  executedByEmail: string;
  executedAt: string;
}

export interface MapSnapshot {
  id: string;
  projectId: string;
  title: string;
  layoutType: 'cose' | 'concentric' | 'circle' | 'breadthfirst' | 'grid';
  nodeCount: number;
  edgeCount: number;
  elementsJson: string; // Serialized Cytoscape elements
  filtersApplied: Record<string, any>;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface ProviderProvenance {
  id: string;
  workId: string;
  providerName: string;
  apiEndpoint: string;
  responseChecksum: string;
  license: string;
  responseTimeMs: number;
  rawSnapshot?: Record<string, any>;
  recordedAt: string;
}

export interface EvidenceRecord {
  id: string;
  projectId: string;
  workId: string;
  workTitle?: string;
  workAuthors?: string;
  workYear?: number;
  claimStatement: string;
  supportStrength: SupportStrength;
  verbatimPassage: string;
  pageOrSection: string;
  warrantExplanation?: string;
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  subClaimCategory?: string;
  createdAt: string;
  updatedAt: string;
}

export type RecommendationReasonType = 
  | 'graph_connection' 
  | 'semantic_similarity' 
  | 'shared_author' 
  | 'filter_match' 
  | 'newly_indexed';

export interface RecommendationReason {
  type: RecommendationReasonType;
  label: string;
  description: string;
  matchedEntity?: string;
  confidenceScore: number;
}

export interface MonitoredCandidate {
  id: string;
  monitorId: string;
  projectId: string;
  work: Work;
  recommendationReasons: RecommendationReason[];
  discoveredAt: string;
  dismissed: boolean;
  importedToProject: boolean;
  sciteVerificationStatus?: 'not_checked' | 'checking' | 'verified' | 'no_record';
}

export interface StoredMonitor {
  id: string;
  projectId: string;
  title: string;
  sourceType: 'search_query' | 'seed_set' | 'included_works' | 'citation_trail';
  queryText?: string;
  queryFilters?: Record<string, any>;
  seedWorkIds?: string[];
  trailId?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  lastRunAt?: string;
  lastRunStatus?: 'success' | 'no_new_works' | 'error';
  newWorksFoundCount: number;
  totalCandidatesGenerated: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  isResearchDiscovery: boolean;
}

export interface McpConnectionStatus {
  url: string;
  connected: boolean;
  status: 'connected' | 'unavailable' | 'incompatible';
  latencyMs: number;
  availableTools: McpToolDefinition[];
  message: string;
  testedAt: string;
}

export interface McpExecutionResult {
  action: 'check_duplication' | 'map_debate_lines' | 'assess_saturation' | 'suggest_candidates';
  prompt: string;
  leadsSummary: string;
  candidateWorks: Partial<Work>[];
  perspectives?: {
    perspective: string;
    supportingWorks: string[];
    caveats: string;
  }[];
  saturationAssessment?: {
    noveltyScore: number;
    duplicateRisk: 'low' | 'moderate' | 'high';
    identifiedClusters: string[];
    recommendedNextQueries: string[];
  };
  sourcesConsulted: {
    title: string;
    doi?: string;
    openAlexId?: string;
    year?: number;
    relevanceRationale: string;
  }[];
  disclaimer: string;
  executedAt: string;
  latencyMs: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'invite' | 'annotation' | 'work_added' | 'audit_alert' | 'system';
  title: string;
  message: string;
  linkUrl?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  workspaceId: string;
  projectId?: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetType: 'workspace' | 'project' | 'work' | 'annotation' | 'tag' | 'member' | 'provider_config';
  targetId: string;
  details: Record<string, any>;
  isDestructive: boolean;
  ipOrOrigin?: string;
  timestamp: string;
}

export interface ProjectStats {
  totalWorks: number;
  includedWorks: number;
  candidateWorks: number;
  excludedWorks: number;
  completedReads: number;
  readingWorks: number;
  evidenceCount: number;
  annotationsCount: number;
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
  contradicting: number;
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
  section?: string;
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
  | 'bridge_papers'
  | 'counterevidence';

export type TrailStatus = 'active' | 'reviewed' | 'archived';

export type CandidateDecision = 'candidate' | 'queued' | 'included' | 'rejected';

export interface CandidateReason {
  category: 'direct_reference' | 'direct_citation' | 'shared_references' | 'common_author' | 'bridge_paper' | 'semantic_similarity' | string;
  description: string;
  count?: number;
  seedWorkId?: string;
  seedWorkTitle?: string;
}

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

export interface BridgePathDetail {
  fromSeedId: string;
  fromSeedTitle: string;
  toSeedOrClusterId: string;
  toSeedOrClusterTitle: string;
  localPath: string[]; // [fromId, bridgeCandidateId, toId]
  localEdgeCount: number;
  explanation: string;
  bridgingScore?: number;
  pathType?: string;
  limitationDisclaimer?: string;
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
  perspectiveCategory: 'manually_marked_dispute' | 'scite_contrasting_citation' | 'alternative_methodology' | 'competing_finding' | string;
  confidenceScore?: number;
  disputedClaimStatement?: string;
  snippetContext?: string;
  reviewNote?: string;
  requiresHumanReview: boolean;
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
  seedWorks: Work[];
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
  decisions: Record<string, CandidateDecision | string>;
  coverageWarnings: string[];
}

export interface CitationTrailEvent {
  id: string;
  trailId: string;
  projectId: string;
  workspaceId: string;
  eventType?: string;
  actionType?:
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
    | 'restore_snapshot'
    | string;
  sourceTrailId?: string | null;
  targetTrailId?: string | null;
  seedWorksUsed?: string[];
  providerQueried?: string;
  retrievalTime?: string;
  resultCount?: number;
  userId?: string;
  userEmail?: string;
  description?: string;
  warnings?: string[];
  details?: Record<string, any>;
  timestamp: string;
}

export interface DiscoveryCandidate {
  id: string;
  trailId: string;
  projectId: string;
  work: Work;
  reasons: CandidateReason[];
  connectionCount: number;
  connectedSeedWorkIds?: string[];
  decision: CandidateDecision;
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
  sourceTrailId?: string;
  sourceTrailTitle?: string;
  trailId?: string;
  trailTitle?: string;
  addedBy: string;
  addedAt: string;
  status: 'pending' | 'in_progress' | 'in_review' | 'completed' | 'extracted_evidence' | 'included' | 'dismissed';
  priority?: 'high' | 'medium' | 'low';
  assignedCollaboratorId?: string;
  assignedCollaboratorName?: string;
  dueDate?: string;
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

export interface ScoreBreakdown {
  graphAffinity: number; // 0-1 based on direct & indirect citations to seeds
  connectionCoverageAcrossSeeds: number; // 0-1 ratio of seeds connected
  semanticSimilarity: number | null; // null if uncomputed/unavailable
  semanticAvailable: boolean;
  recencySignal: number; // 0-1
  diversityAdjustment: number; // -0.5 to +0.5
  userApprovalSignal: number; // -1 to +1
  sourceCompleteness: number; // 0-1
  discoveryFitScore: number; // 0-100 composite index
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
  purpose?: string; // "Why am I reading this next?"
  criticalQuestion?: string; // "What question should I ask of it?"
  connectionContext?: string; // "Which existing claim, source, or trail does it connect to?"
  groundingStatus?: 'strictly_grounded' | 'metadata_derived';
  disclaimer?: string;
}


