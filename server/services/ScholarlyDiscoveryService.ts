import { Work, ProviderSearchFilters, SearchAggregatedResult, GraphExpansionResult, NetworkExpansionResponse, NetworkExpansionOperation } from '../types';
import { OpenAlexAdapter } from './OpenAlexAdapter';
import { CrossrefAdapter } from './CrossrefAdapter';
import { WorkResolverService } from './WorkResolverService';
import { CitationGraphService } from './CitationGraphService';
import { SearchCacheService } from './SearchCacheService';
import { ProviderHealthService } from './ProviderHealthService';
import { BibtexRisService } from './BibtexRisService';
import { NormalizationService } from './NormalizationService';
import { NetworkExpansionService } from './NetworkExpansionService';

export class ScholarlyDiscoveryService {
  private static instance: ScholarlyDiscoveryService;

  private openAlex = new OpenAlexAdapter();
  private crossref = new CrossrefAdapter();
  private cache = SearchCacheService.getInstance();
  private health = ProviderHealthService.getInstance();
  private graphService = new CitationGraphService();
  private networkExpansionService = NetworkExpansionService.getInstance();

  private constructor() {}

  public static getInstance(): ScholarlyDiscoveryService {
    if (!ScholarlyDiscoveryService.instance) {
      ScholarlyDiscoveryService.instance = new ScholarlyDiscoveryService();
    }
    return ScholarlyDiscoveryService.instance;
  }

  /**
   * 1. searchWorks: Parallel query to OpenAlex & Crossref with deduplication,
   * caching (30-day metadata), merging, and failure resilience.
   */
  public async searchWorks(query: string, filters: ProviderSearchFilters = {}): Promise<SearchAggregatedResult> {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return {
        query: '',
        filters,
        works: [],
        providerStatuses: [],
        totalCandidates: 0,
        executedAt: new Date().toISOString(),
        coverageWarnings: ['Empty search query specified']
      };
    }

    const enabledProviders = filters.providers || ['OpenAlex', 'Crossref'];
    const cacheKey = `search_${cleanQuery.toLowerCase()}_${JSON.stringify(filters)}`;

    return this.cache.getOrFetch(
      cacheKey,
      async () => {
        const promises: Promise<any>[] = [];

        if (enabledProviders.includes('OpenAlex')) {
          promises.push(this.openAlex.search(cleanQuery, filters));
        }
        if (enabledProviders.includes('Crossref')) {
          promises.push(this.crossref.search(cleanQuery, filters));
        }

        const results = await Promise.allSettled(promises);
        
        let openAlexWorks: Work[] = [];
        let crossrefWorks: Work[] = [];
        const providerStatuses: SearchAggregatedResult['providerStatuses'] = [];
        const coverageWarnings: string[] = [];

        for (const res of results) {
          if (res.status === 'fulfilled') {
            const providerRes = res.value;
            providerStatuses.push({
              provider: providerRes.provider,
              status: providerRes.status,
              latencyMs: providerRes.latencyMs,
              candidatesCount: providerRes.works.length,
              error: providerRes.error
            });

            if (providerRes.provider === 'OpenAlex' && providerRes.status === 'success') {
              openAlexWorks = providerRes.works;
            } else if (providerRes.provider === 'Crossref' && providerRes.status === 'success') {
              crossrefWorks = providerRes.works;
            } else if (providerRes.error) {
              coverageWarnings.push(`${providerRes.provider}: ${providerRes.error}`);
            }
          } else {
            coverageWarnings.push(`Provider request failed: ${res.reason?.message || 'Unknown network error'}`);
          }
        }

        // Merge records by DOI first, then normalized title + author + year
        const mergedWorks = WorkResolverService.mergeCandidateLists(openAlexWorks, crossrefWorks);

        // Populate metadata cache with each individual work
        for (const w of mergedWorks) {
          this.cache.setWork(w.id, w);
          if (w.doi) this.cache.setWork(w.doi, w);
          if (w.openAlexId) this.cache.setWork(w.openAlexId, w);
        }

        return {
          query: cleanQuery,
          filters,
          works: mergedWorks,
          providerStatuses,
          totalCandidates: mergedWorks.length,
          executedAt: new Date().toISOString(),
          coverageWarnings
        };
      },
      'search'
    );
  }

  /**
   * 2. resolveWork: Resolves a DOI, OpenAlex ID, or copied citation by cross-querying both providers.
   */
  public async resolveWork(identifierOrCitation: string): Promise<Work | null> {
    const raw = identifierOrCitation.trim();
    if (!raw) return null;

    const cacheKey = `resolve_${raw.toLowerCase()}`;

    return this.cache.getOrFetch(cacheKey, async () => {
      // Check if DOI is present inside the citation text (e.g. "10.1038/...")
      const doiMatch = raw.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);
      const doi = doiMatch ? doiMatch[0] : (raw.startsWith('10.') ? raw : null);

      if (doi) {
        const [oaRes, crRes] = await Promise.allSettled([
          this.openAlex.resolveByIdentifier(doi),
          this.crossref.resolveByIdentifier(doi)
        ]);

        const oaWork = oaRes.status === 'fulfilled' ? oaRes.value : null;
        const crWork = crRes.status === 'fulfilled' ? crRes.value : null;

        if (oaWork && crWork) {
          return WorkResolverService.mergeOpenAlexAndCrossref(oaWork, crWork);
        }
        return oaWork || crWork || null;
      }

      // If OpenAlex ID (e.g., W123456789)
      if (raw.startsWith('W') || raw.startsWith('w') || raw.includes('openalex.org')) {
        const oaWork = await this.openAlex.resolveByIdentifier(raw);
        if (oaWork && oaWork.doi) {
          const crWork = await this.crossref.resolveByIdentifier(oaWork.doi);
          if (crWork) {
            return WorkResolverService.mergeOpenAlexAndCrossref(oaWork, crWork);
          }
        }
        return oaWork;
      }

      // Treat as bibliographic citation / title string
      const searchRes = await this.searchWorks(raw, { limit: 1 });
      return searchRes.works[0] || null;
    }, 'work');
  }

  /**
   * 3. expandGraph: OpenAlex-derived citation network expansion.
   */
  public async expandGraph(
    workIds: string[],
    knownWorks: Work[],
    direction: 'cites' | 'cited_by' | 'related' | 'both' = 'both',
    depth: number = 1
  ): Promise<GraphExpansionResult> {
    return this.graphService.expandGraph(workIds, knownWorks, direction, depth);
  }

  /**
   * 3b. networkExpand: Strict OpenAlex network expansion returning verified relations
   */
  public async networkExpand(
    selectedWork: Partial<Work>,
    operation: NetworkExpansionOperation,
    options?: { limit?: number; bypassCache?: boolean }
  ): Promise<NetworkExpansionResponse> {
    return this.networkExpansionService.expandNetwork(selectedWork, operation, options);
  }

  /**
   * 4. importBibtexOrRis: Parse BibTeX or RIS, enrich DOIs if resolvable, keep non-DOI humanities works.
   */
  public async importBibtexOrRis(contentOrText: string): Promise<{ works: Work[]; totalImported: number; resolvedWithDoiCount: number }> {
    const isRis = contentOrText.includes('TY  -') || contentOrText.includes('ER  -');
    const parsedWorks = isRis 
      ? BibtexRisService.parseRis(contentOrText) 
      : BibtexRisService.parseBibtex(contentOrText);

    let resolvedWithDoiCount = 0;
    const finalWorks: Work[] = [];

    for (const pw of parsedWorks) {
      if (pw.doi) {
        try {
          const resolved = await this.resolveWork(pw.doi);
          if (resolved) {
            finalWorks.push({
              ...resolved,
              isManualOrImportOnly: false
            });
            resolvedWithDoiCount++;
            continue;
          }
        } catch {
          // Fall back to parsed work metadata
        }
      }

      // Keep unresolved/humanities works usable as metadata-only works
      finalWorks.push(pw);
      this.cache.setWork(pw.id, pw);
    }

    return {
      works: finalWorks,
      totalImported: finalWorks.length,
      resolvedWithDoiCount
    };
  }

  /**
   * 5. addManualWork: Validates and creates a manual work entity with explicit provenance.
   */
  public addManualWork(workData: Partial<Work>): Work {
    const retrievedAt = new Date().toISOString();
    const cleanDoi = NormalizationService.normalizeDoi(workData.doi);
    const workId = cleanDoi ? `doi_${cleanDoi.replace(/[^a-zA-Z0-9]/g, '_')}` : `man_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const work: Work = {
      id: workId,
      doi: cleanDoi,
      openAlexId: workData.openAlexId || null,
      title: NormalizationService.normalizeTitle(workData.title || 'Untitled Manual Work'),
      authors: workData.authors && workData.authors.length > 0 ? workData.authors : [{ name: 'Unknown Author' }],
      year: workData.year || new Date().getFullYear(),
      venue: workData.venue || null,
      volume: workData.volume || null,
      issue: workData.issue || null,
      pages: workData.pages || null,
      type: workData.type || 'journal-article',
      abstract: workData.abstract || null,
      citationCount: workData.citationCount || 0,
      citationCountSource: 'Manual User Entry',
      referenceCount: 0,
      references: workData.references || [],
      citedBy: [],
      openAccessUrl: workData.openAccessUrl || null,
      sourceUrl: workData.sourceUrl || null,
      pdfUrl: workData.pdfUrl || null,
      disciplines: workData.disciplines || [],
      keywords: workData.keywords || [],
      provenance: {
        provider: 'Manual Entry',
        retrievedAt,
        rawId: 'user_created',
        confidenceScore: 1.0
      },
      fieldLevelProvenance: {
        title: { provider: 'Manual User Entry', retrievedAt },
        authors: { provider: 'Manual User Entry', retrievedAt },
        year: { provider: 'Manual User Entry', retrievedAt }
      },
      isManualOrImportOnly: true,
      createdAt: retrievedAt,
      updatedAt: retrievedAt
    };

    this.cache.setWork(work.id, work);
    return work;
  }

  /**
   * 6. getWorkProvenance: Retrieves field-level provenance, timestamps, checksums, and conflicts.
   */
  public async getWorkProvenance(workId: string): Promise<{
    workId: string;
    provenance: any;
    fieldLevelProvenance?: Record<string, any>;
    conflicts?: any[];
    healthStatus: any;
  } | null> {
    const cached = this.cache.getWork(workId);
    const healthStatus = this.health.getAllStatuses();

    if (cached) {
      return {
        workId,
        provenance: cached.provenance,
        fieldLevelProvenance: cached.fieldLevelProvenance,
        conflicts: cached.conflicts,
        healthStatus
      };
    }

    // Try resolving
    const resolved = await this.resolveWork(workId);
    if (resolved) {
      return {
        workId,
        provenance: resolved.provenance,
        fieldLevelProvenance: resolved.fieldLevelProvenance,
        conflicts: resolved.conflicts,
        healthStatus
      };
    }

    return null;
  }

  /**
   * 7. refreshWork: Bypasses cache, queries fresh metadata from OpenAlex & Crossref, re-merges.
   */
  public async refreshWork(workIdOrDoi: string): Promise<Work | null> {
    const cleanId = workIdOrDoi.replace(/^doi_/, '').replace(/_/g, '/');
    const [oaRes, crRes] = await Promise.allSettled([
      this.openAlex.resolveByIdentifier(cleanId),
      this.crossref.resolveByIdentifier(cleanId)
    ]);

    const oaWork = oaRes.status === 'fulfilled' ? oaRes.value : null;
    const crWork = crRes.status === 'fulfilled' ? crRes.value : null;

    if (!oaWork && !crWork) return null;

    const merged = (oaWork && crWork) 
      ? WorkResolverService.mergeOpenAlexAndCrossref(oaWork, crWork)
      : (oaWork || crWork)!;

    this.cache.setWork(merged.id, merged);
    if (merged.doi) this.cache.setWork(merged.doi, merged);
    if (merged.openAlexId) this.cache.setWork(merged.openAlexId, merged);

    return merged;
  }

  /**
   * 8. getHealth: Provider health and circuit breaker status.
   */
  public getHealth() {
    return {
      providers: this.health.getAllStatuses(),
      cache: this.cache.getStats(),
      timestamp: new Date().toISOString()
    };
  }
}
