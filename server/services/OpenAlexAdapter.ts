import { ProviderAdapter } from './ProviderAdapter';
import { Work, ProviderSearchFilters, ProviderSearchResponse } from '../types';
import { NormalizationService } from './NormalizationService';
import { ProviderHealthService } from './ProviderHealthService';

export class OpenAlexAdapter implements ProviderAdapter {
  public readonly providerName = 'OpenAlex' as const;
  private readonly baseUrl = 'https://api.openalex.org';
  private healthService = ProviderHealthService.getInstance();
  private static instance: OpenAlexAdapter | null = null;

  public static getInstance(): OpenAlexAdapter {
    if (!this.instance) {
      this.instance = new OpenAlexAdapter();
    }
    return this.instance;
  }

  private getContactEmail(): string {
    return process.env.CONTACT_EMAIL || 'andy@avoda.hk';
  }

  public async search(query: string, filters: ProviderSearchFilters = {}): Promise<ProviderSearchResponse> {
    const startTime = Date.now();
    const contactEmail = this.getContactEmail();
    const limit = Math.min(filters.limit || 20, 50);

    if (!this.healthService.canAttempt('OpenAlex')) {
      return {
        provider: 'OpenAlex',
        status: 'circuit_open',
        latencyMs: 0,
        works: [],
        error: 'OpenAlex circuit breaker is OPEN due to repeated upstream errors.',
        retrievedAt: new Date().toISOString()
      };
    }

    try {
      const url = new URL(`${this.baseUrl}/works`);
      url.searchParams.set('search', query);
      url.searchParams.set('per_page', String(limit));
      url.searchParams.set('mailto', contactEmail);

      // Build OpenAlex filter parameter
      const filterParts: string[] = [];
      if (filters.yearMin && filters.yearMax) {
        filterParts.push(`publication_year:${filters.yearMin}-${filters.yearMax}`);
      } else if (filters.yearMin) {
        filterParts.push(`from_publication_date:${filters.yearMin}-01-01`);
      } else if (filters.yearMax) {
        filterParts.push(`to_publication_date:${filters.yearMax}-12-31`);
      }

      if (filters.openAccessOnly) {
        filterParts.push('is_oa:true');
      }

      if (filters.type) {
        if (filters.type === 'journal-article') filterParts.push('type:article');
        else if (filters.type === 'book') filterParts.push('type:book');
        else if (filters.type === 'preprint') filterParts.push('type:preprint');
        else if (filters.type === 'book-chapter') filterParts.push('type:book-chapter');
        else if (filters.type === 'dissertation') filterParts.push('type:dissertation');
      }

      if (filterParts.length > 0) {
        url.searchParams.set('filter', filterParts.join(','));
      }

      // Add sort by relevance or citations if requested
      if (filters.minCitations) {
        url.searchParams.set('sort', 'cited_by_count:desc');
      }

      const response = await this.healthService.executeWithRetry('OpenAlex', () => 
        fetch(url.toString(), {
          headers: {
            'User-Agent': `EvidenceAtlas/1.0 (mailto:${contactEmail})`,
            'Accept': 'application/json'
          }
        })
      );

      if (!response.ok) {
        throw new Error(`OpenAlex API responded with HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawResults = Array.isArray(data.results) ? data.results : [];
      let works = rawResults.map((item: any) => NormalizationService.normalizeOpenAlexWork(item, query));

      if (filters.minCitations) {
        works = works.filter(w => w.citationCount >= (filters.minCitations || 0));
      }

      const latencyMs = Date.now() - startTime;
      return {
        provider: 'OpenAlex',
        status: 'success',
        latencyMs,
        works,
        totalResults: data.meta?.count,
        retrievedAt: new Date().toISOString()
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        provider: 'OpenAlex',
        status: 'error',
        latencyMs,
        works: [],
        error: err.message || 'Failed to query OpenAlex',
        retrievedAt: new Date().toISOString()
      };
    }
  }

  public async resolveByIdentifier(identifier: string): Promise<Work | null> {
    const contactEmail = this.getContactEmail();
    const cleanId = identifier.trim();

    // Check if it's a DOI or OpenAlex ID (W...)
    let endpoint = '';
    if (cleanId.startsWith('10.') || cleanId.includes('doi.org')) {
      const doi = NormalizationService.normalizeDoi(cleanId);
      if (!doi) return null;
      endpoint = `${this.baseUrl}/works/https://doi.org/${encodeURIComponent(doi)}?mailto=${encodeURIComponent(contactEmail)}`;
    } else if (cleanId.startsWith('W') || cleanId.startsWith('w') || cleanId.includes('openalex.org')) {
      const oaId = cleanId.replace(/^https?:\/\/openalex\.org\/(works\/)?/i, '').replace(/^works\//i, '').toUpperCase();
      if (!oaId.match(/^W\d+$/)) return null;
      endpoint = `${this.baseUrl}/works/${oaId}?mailto=${encodeURIComponent(contactEmail)}`;
    } else {
      // NEVER silently fall back to search query for unknown identifiers!
      return null;
    }

    try {
      const response = await this.healthService.executeWithRetry('OpenAlex', () =>
        fetch(endpoint, {
          headers: {
            'User-Agent': `EvidenceAtlas/1.0 (mailto:${contactEmail})`,
            'Accept': 'application/json'
          }
        })
      );

      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error(`OpenAlex resolve responded with HTTP ${response.status}`);
      }

      const data = await response.json();
      return NormalizationService.normalizeOpenAlexWork(data);
    } catch (err) {
      console.warn(`[OpenAlexAdapter] Failed to resolve identifier "${identifier}":`, err);
      return null;
    }
  }

  /**
   * Batch fetches OpenAlex works by their canonical OpenAlex IDs (W...) in safe chunks
   */
  public async fetchWorksByCanonicalIds(canonicalIds: string[]): Promise<Work[]> {
    if (!canonicalIds || canonicalIds.length === 0) return [];
    const contactEmail = this.getContactEmail();
    
    // Clean and deduplicate IDs
    const cleanIds = Array.from(new Set(
      canonicalIds
        .map(id => id.replace(/^https?:\/\/openalex\.org\/(works\/)?/i, '').replace(/^works\//i, '').toUpperCase())
        .filter(id => /^W\d+$/.test(id))
    ));

    if (cleanIds.length === 0) return [];

    const CHUNK_SIZE = 25;
    const allWorks: Work[] = [];

    for (let i = 0; i < cleanIds.length; i += CHUNK_SIZE) {
      const chunk = cleanIds.slice(i, i + CHUNK_SIZE);
      const url = `${this.baseUrl}/works?filter=openalex_id:${chunk.join('|')}&per_page=${chunk.length}&mailto=${encodeURIComponent(contactEmail)}`;

      try {
        const response = await this.healthService.executeWithRetry('OpenAlex', () =>
          fetch(url, {
            headers: {
              'User-Agent': `EvidenceAtlas/1.0 (mailto:${contactEmail})`,
              'Accept': 'application/json'
            }
          })
        );

        if (response.ok) {
          const data = await response.json();
          const results = Array.isArray(data.results) ? data.results : [];
          for (const item of results) {
            allWorks.push(NormalizationService.normalizeOpenAlexWork(item));
          }
        }
      } catch (err: any) {
        console.warn(`[OpenAlexAdapter] Error fetching batch chunk [${chunk.join(',')}]:`, err.message);
      }
    }

    return allWorks;
  }

  public async getReferences(openAlexIdOrDoi: string): Promise<string[]> {
    const work = await this.resolveByIdentifier(openAlexIdOrDoi);
    return work?.references || [];
  }

  public async getCitingWorks(openAlexId: string, limit: number = 20): Promise<Work[]> {
    const contactEmail = this.getContactEmail();
    const cleanId = openAlexId.replace(/^https?:\/\/openalex\.org\/(works\/)?/i, '').replace(/^works\//i, '').toUpperCase();
    if (!cleanId.match(/^W\d+$/)) return [];
    
    const url = `${this.baseUrl}/works?filter=cites:${cleanId}&per_page=${limit}&mailto=${encodeURIComponent(contactEmail)}`;

    try {
      const response = await this.healthService.executeWithRetry('OpenAlex', () =>
        fetch(url, {
          headers: {
            'User-Agent': `EvidenceAtlas/1.0 (mailto:${contactEmail})`,
            'Accept': 'application/json'
          }
        })
      );

      if (!response.ok) return [];
      const data = await response.json();
      const rawResults = Array.isArray(data.results) ? data.results : [];
      return rawResults.map((item: any) => NormalizationService.normalizeOpenAlexWork(item));
    } catch {
      return [];
    }
  }

  public async getRelatedWorks(workId: string): Promise<Work[]> {
    const contactEmail = this.getContactEmail();
    const cleanId = workId.replace(/^https?:\/\/openalex\.org\/(works\/)?/i, '').replace(/^works\//i, '').toUpperCase();
    if (!cleanId.match(/^W\d+$/)) return [];

    try {
      // Fetch the full record to extract related_works IDs
      const response = await this.healthService.executeWithRetry('OpenAlex', () =>
        fetch(`${this.baseUrl}/works/${cleanId}?mailto=${encodeURIComponent(contactEmail)}`, {
          headers: {
            'User-Agent': `EvidenceAtlas/1.0 (mailto:${contactEmail})`,
            'Accept': 'application/json'
          }
        })
      );
      if (!response.ok) return [];
      const data = await response.json();
      const relatedIds = Array.isArray(data.related_works) 
        ? data.related_works.slice(0, 15).map((u: string) => u.replace(/^https?:\/\/openalex\.org\/(works\/)?/i, '').replace(/^works\//i, '').toUpperCase()).filter((id: string) => /^W\d+$/.test(id))
        : [];

      if (relatedIds.length === 0) return [];

      return this.fetchWorksByCanonicalIds(relatedIds);
    } catch {
      return [];
    }
  }
}
