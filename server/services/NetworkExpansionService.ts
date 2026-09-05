import { Work, NetworkExpansionResponse, NetworkExpansionOperation, NetworkExpansionCandidate, NetworkExpansionExcludedCandidate } from '../types';
import { OpenAlexAdapter } from './OpenAlexAdapter';
import { WorkResolverService } from './WorkResolverService';
import { SearchCacheService } from './SearchCacheService';

export class NetworkExpansionService {
  private static instance: NetworkExpansionService;
  private openAlexAdapter: OpenAlexAdapter;
  private cacheService: SearchCacheService;

  private constructor() {
    this.openAlexAdapter = OpenAlexAdapter.getInstance();
    this.cacheService = SearchCacheService.getInstance();
  }

  public static getInstance(): NetworkExpansionService {
    if (!NetworkExpansionService.instance) {
      NetworkExpansionService.instance = new NetworkExpansionService();
    }
    return NetworkExpansionService.instance;
  }

  public async expandNetwork(
    selectedWorkInput: Partial<Work> & { id?: string; doi?: string | null; openAlexId?: string | null; title?: string; authors?: any[]; year?: number },
    operation: NetworkExpansionOperation,
    options?: { limit?: number; bypassCache?: boolean }
  ): Promise<NetworkExpansionResponse> {
    const startTime = Date.now();
    const limit = options?.limit && options.limit > 0 ? Math.min(options.limit, 100) : 25;
    const bypassCache = Boolean(options?.bypassCache);

    // 1. Strict canonical OpenAlex resolution
    const resolution = await WorkResolverService.resolveCanonicalOpenAlexWorkId(selectedWorkInput);

    if (resolution.verificationStatus !== 'verified' || !resolution.canonicalOpenAlexId) {
      const selectedWorkMeta = {
        id: selectedWorkInput.id || 'unresolved_work',
        canonicalOpenAlexId: null,
        title: selectedWorkInput.title || 'Untitled Paper',
        doi: selectedWorkInput.doi || null,
        verificationStatus: resolution.verificationStatus,
        resolutionMethod: resolution.resolutionMethod,
        resolutionReason: resolution.reason
      };

      return {
        selectedWork: selectedWorkMeta,
        operation,
        candidates: [],
        excludedCandidates: [],
        warnings: [
          'We could not verify this paper’s OpenAlex record, so citation expansion is unavailable. No unrelated search results were substituted.'
        ],
        requestMetadata: {
          provider: 'OpenAlex',
          endpoint: `/api/scholarly/network-expand`,
          exactFilters: { operation, limit },
          rawCountReturned: 0,
          validCount: 0,
          excludedCount: 0,
          cacheStatus: 'bypass',
          retrievalTimestamp: new Date().toISOString(),
          cacheKey: 'none',
          latencyMs: Date.now() - startTime
        }
      };
    }

    const canonicalId = resolution.canonicalOpenAlexId;
    const selectedWorkMeta = {
      id: selectedWorkInput.id || canonicalId,
      canonicalOpenAlexId: canonicalId,
      title: selectedWorkInput.title || resolution.matchedWork?.title || 'Selected Paper',
      doi: selectedWorkInput.doi || resolution.matchedWork?.doi || null,
      verificationStatus: 'verified' as const,
      resolutionMethod: resolution.resolutionMethod,
      resolutionReason: resolution.reason
    };

    // 2. Cache key construction
    const cacheKey = `v2_openalex_netexp:${operation}:${canonicalId}:limit:${limit}:ver:2`;

    if (!bypassCache) {
      const cached = this.cacheService.getGraph(cacheKey) as NetworkExpansionResponse | null;
      if (cached && cached.candidates && Array.isArray(cached.candidates)) {
        return {
          ...cached,
          selectedWork: selectedWorkMeta,
          requestMetadata: {
            ...cached.requestMetadata,
            cacheStatus: 'hit_fresh',
            latencyMs: Date.now() - startTime
          }
        };
      }
    }

    const candidates: NetworkExpansionCandidate[] = [];
    const excludedCandidates: NetworkExpansionExcludedCandidate[] = [];
    const warnings: string[] = [];
    let rawCount = 0;
    let endpointUsed = '';
    const exactFilters: Record<string, any> = { operation, canonicalId, limit };

    try {
      if (operation === 'references') {
        // "What this paper cites": references of the selected paper
        endpointUsed = `https://api.openalex.org/works/${canonicalId}`;
        const selectedWorkFull = await this.openAlexAdapter.resolveByIdentifier(canonicalId);
        
        if (!selectedWorkFull) {
          warnings.push(`Selected paper ${canonicalId} could not be retrieved from OpenAlex.`);
        } else {
          const rawRefs = selectedWorkFull.references || [];
          rawCount = rawRefs.length;

          if (rawRefs.length === 0) {
            warnings.push('OpenAlex has no indexed references for this paper. No unrelated search results were substituted.');
          } else {
            const canonicalRefIds = rawRefs
              .map(r => WorkResolverService.extractCanonicalOpenAlexId(r))
              .filter((r): r is string => !!r);
            
            const targetIds = canonicalRefIds.slice(0, limit);
            const fetchedWorks = await this.openAlexAdapter.fetchWorksByCanonicalIds(targetIds);

            const allowedIdSet = new Set(canonicalRefIds);

            for (const work of fetchedWorks) {
              const workOaId = WorkResolverService.extractCanonicalOpenAlexId(work.openAlexId) || WorkResolverService.extractCanonicalOpenAlexId(work.id);
              
              if (workOaId && allowedIdSet.has(workOaId)) {
                candidates.push({
                  work,
                  canonicalOpenAlexId: workOaId,
                  title: work.title,
                  relationType: 'references',
                  relationVerified: true,
                  relationEvidence: `Present in selected paper referenced_works index on OpenAlex (${canonicalId} -> ${workOaId})`,
                  provider: 'OpenAlex',
                  retrievalTimestamp: new Date().toISOString(),
                  labelExplanation: "This paper is in the selected paper's reference list."
                });
              } else {
                excludedCandidates.push({
                  canonicalOpenAlexId: workOaId,
                  title: work.title,
                  reason: 'Paper canonical ID is not present in the selected work’s verified reference list',
                  disqualificationType: 'unverified_reference_relation'
                });
              }
            }
          }
        }
      } else if (operation === 'cited_by') {
        // "What cites this paper": papers that cite the selected paper
        endpointUsed = `https://api.openalex.org/works?filter=cites:${canonicalId}`;
        const citingWorks = await this.openAlexAdapter.getCitingWorks(canonicalId, limit);
        rawCount = citingWorks.length;

        if (citingWorks.length === 0) {
          warnings.push('OpenAlex has no indexed citing works for this paper. No unrelated search results were substituted.');
        } else {
          for (const work of citingWorks) {
            const workOaId = WorkResolverService.extractCanonicalOpenAlexId(work.openAlexId) || WorkResolverService.extractCanonicalOpenAlexId(work.id);
            
            if (workOaId) {
              candidates.push({
                work,
                canonicalOpenAlexId: workOaId,
                title: work.title,
                relationType: 'cited_by',
                relationVerified: true,
                relationEvidence: `Citing relationship verified via OpenAlex filter=cites:${canonicalId} (${workOaId} -> ${canonicalId})`,
                provider: 'OpenAlex',
                retrievalTimestamp: new Date().toISOString(),
                labelExplanation: 'This paper cites the selected paper.'
              });
            } else {
              excludedCandidates.push({
                canonicalOpenAlexId: null,
                title: work.title,
                reason: 'Missing canonical OpenAlex identifier on citing work record',
                disqualificationType: 'missing_canonical_id'
              });
            }
          }
        }
      } else if (operation === 'related') {
        // "Related papers": topic/co-citation similarity (NOT a direct citation)
        endpointUsed = `https://api.openalex.org/works/${canonicalId} (related_works)`;
        const relatedWorks = await this.openAlexAdapter.getRelatedWorks(canonicalId);
        rawCount = relatedWorks.length;

        if (relatedWorks.length === 0) {
          warnings.push('OpenAlex has no indexed related works for this paper.');
        } else {
          for (const work of relatedWorks.slice(0, limit)) {
            const workOaId = WorkResolverService.extractCanonicalOpenAlexId(work.openAlexId) || WorkResolverService.extractCanonicalOpenAlexId(work.id);
            
            if (workOaId) {
              candidates.push({
                work,
                canonicalOpenAlexId: workOaId,
                title: work.title,
                relationType: 'related',
                relationVerified: true,
                relationEvidence: `OpenAlex co-citation & topic embedding similarity (NOT a direct citation link)`,
                provider: 'OpenAlex',
                retrievalTimestamp: new Date().toISOString(),
                labelExplanation: 'Related by OpenAlex (topic / co-citation similarity)'
              });
            } else {
              excludedCandidates.push({
                canonicalOpenAlexId: null,
                title: work.title,
                reason: 'Missing canonical OpenAlex identifier on related work record',
                disqualificationType: 'missing_canonical_id'
              });
            }
          }
        }
      }
    } catch (err: any) {
      warnings.push(`OpenAlex expansion failed: ${err.message}`);
    }

    const response: NetworkExpansionResponse = {
      selectedWork: selectedWorkMeta,
      operation,
      candidates,
      excludedCandidates,
      warnings,
      requestMetadata: {
        provider: 'OpenAlex',
        endpoint: endpointUsed,
        exactFilters,
        rawCountReturned: rawCount,
        validCount: candidates.length,
        excludedCount: excludedCandidates.length,
        cacheStatus: 'miss',
        retrievalTimestamp: new Date().toISOString(),
        cacheKey,
        latencyMs: Date.now() - startTime
      }
    };

    // Store in cache
    this.cacheService.setGraph(cacheKey, response);

    return response;
  }
}
