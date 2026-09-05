import { ProviderAdapter } from './ProviderAdapter';
import { Work, ProviderSearchFilters, ProviderSearchResponse } from '../types';
import { NormalizationService } from './NormalizationService';
import { ProviderHealthService } from './ProviderHealthService';

export class CrossrefAdapter implements ProviderAdapter {
  public readonly providerName = 'Crossref' as const;
  private readonly baseUrl = 'https://api.crossref.org';
  private healthService = ProviderHealthService.getInstance();

  private getContactEmail(): string {
    return process.env.CONTACT_EMAIL || 'andy@avoda.hk';
  }

  public async search(query: string, filters: ProviderSearchFilters = {}): Promise<ProviderSearchResponse> {
    const startTime = Date.now();
    const contactEmail = this.getContactEmail();
    const rows = Math.min(filters.limit || 20, 50);

    if (!this.healthService.canAttempt('Crossref')) {
      return {
        provider: 'Crossref',
        status: 'circuit_open',
        latencyMs: 0,
        works: [],
        error: 'Crossref circuit breaker is OPEN due to repeated upstream errors.',
        retrievedAt: new Date().toISOString()
      };
    }

    try {
      const url = new URL(`${this.baseUrl}/works`);
      url.searchParams.set('query', query);
      url.searchParams.set('rows', String(rows));
      url.searchParams.set('mailto', contactEmail);

      // Filters
      const filterParts: string[] = [];
      if (filters.yearMin) {
        filterParts.push(`from-pub-date:${filters.yearMin}-01-01`);
      }
      if (filters.yearMax) {
        filterParts.push(`until-pub-date:${filters.yearMax}-12-31`);
      }
      if (filters.type) {
        if (filters.type === 'journal-article') filterParts.push('type:journal-article');
        else if (filters.type === 'book') filterParts.push('type:book');
        else if (filters.type === 'book-chapter') filterParts.push('type:book-chapter');
        else if (filters.type === 'preprint') filterParts.push('type:posted-content');
        else if (filters.type === 'conference-paper') filterParts.push('type:proceedings-article');
      }

      if (filterParts.length > 0) {
        url.searchParams.set('filter', filterParts.join(','));
      }

      if (filters.author) {
        url.searchParams.set('query.author', filters.author);
      }
      if (filters.venue) {
        url.searchParams.set('query.container-title', filters.venue);
      }

      const response = await this.healthService.executeWithRetry('Crossref', () =>
        fetch(url.toString(), {
          headers: {
            'User-Agent': `EvidenceAtlas/1.0 (mailto:${contactEmail})`,
            'Accept': 'application/json'
          }
        })
      );

      if (!response.ok) {
        throw new Error(`Crossref API responded with HTTP ${response.status}`);
      }

      const data = await response.json();
      const items = Array.isArray(data.message?.items) ? data.message.items : [];
      let works = items.map((item: any) => NormalizationService.normalizeCrossrefWork(item, query));

      if (filters.minCitations) {
        works = works.filter(w => w.citationCount >= (filters.minCitations || 0));
      }

      const latencyMs = Date.now() - startTime;
      return {
        provider: 'Crossref',
        status: 'success',
        latencyMs,
        works,
        totalResults: data.message?.['total-results'],
        retrievedAt: new Date().toISOString()
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        provider: 'Crossref',
        status: 'error',
        latencyMs,
        works: [],
        error: err.message || 'Failed to query Crossref',
        retrievedAt: new Date().toISOString()
      };
    }
  }

  public async resolveByIdentifier(identifier: string): Promise<Work | null> {
    const contactEmail = this.getContactEmail();
    const cleanDoi = NormalizationService.normalizeDoi(identifier);

    if (!cleanDoi) {
      // Not a valid DOI -> try title query
      const searchRes = await this.search(identifier, { limit: 1 });
      return searchRes.works[0] || null;
    }

    try {
      const endpoint = `${this.baseUrl}/works/${encodeURIComponent(cleanDoi)}?mailto=${encodeURIComponent(contactEmail)}`;
      const response = await this.healthService.executeWithRetry('Crossref', () =>
        fetch(endpoint, {
          headers: {
            'User-Agent': `EvidenceAtlas/1.0 (mailto:${contactEmail})`,
            'Accept': 'application/json'
          }
        })
      );

      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(`Crossref resolve responded with HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.message) return null;
      return NormalizationService.normalizeCrossrefWork(data.message);
    } catch (err) {
      console.warn(`[CrossrefAdapter] Failed to resolve DOI "${identifier}":`, err);
      return null;
    }
  }
}
