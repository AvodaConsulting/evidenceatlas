import { Work, WorkType, Author, FieldProvenance } from '../types';

export class NormalizationService {
  /**
   * Reconstruct inverted index abstract from OpenAlex
   */
  public static reconstructOpenAlexAbstract(invertedIndex?: Record<string, number[]> | null): string | null {
    if (!invertedIndex || Object.keys(invertedIndex).length === 0) {
      return null;
    }

    try {
      const entries: [string, number][] = [];
      for (const [word, positions] of Object.entries(invertedIndex)) {
        for (const pos of positions) {
          entries.push([word, pos]);
        }
      }

      entries.sort((a, b) => a[1] - b[1]);
      return entries.map(e => e[0]).join(' ');
    } catch {
      return null;
    }
  }

  /**
   * Cleans and strips XML/HTML tags from Crossref abstracts (e.g., <jats:p>, <i>, etc.)
   */
  public static cleanCrossrefAbstract(rawAbstract?: string | null): string | null {
    if (!rawAbstract) return null;
    return rawAbstract
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Standardizes DOI format: lowercase, no url prefix
   */
  public static normalizeDoi(doi?: string | null): string | null {
    if (!doi) return null;
    return doi
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
      .replace(/^doi:/i, '')
      .trim() || null;
  }

  /**
   * Standardize title string (removes excess whitespace, control characters)
   */
  public static normalizeTitle(title?: string | null): string {
    if (!title) return 'Untitled Work';
    return title
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Map OpenAlex type string to canonical WorkType
   */
  public static mapOpenAlexType(typeStr?: string | null): WorkType {
    if (!typeStr) return 'other';
    const t = typeStr.toLowerCase();
    if (t.includes('article') || t === 'journal-article') return 'journal-article';
    if (t.includes('book-chapter') || t === 'chapter') return 'book-chapter';
    if (t === 'book' || t === 'monograph') return 'book';
    if (t.includes('preprint') || t === 'posted-content') return 'preprint';
    if (t.includes('proceedings') || t.includes('conference')) return 'conference-paper';
    if (t.includes('review')) return 'review';
    if (t.includes('dissertation') || t.includes('thesis')) return 'dissertation';
    if (t.includes('dataset')) return 'dataset';
    return 'other';
  }

  /**
   * Map Crossref type string to canonical WorkType
   */
  public static mapCrossrefType(typeStr?: string | null): WorkType {
    if (!typeStr) return 'other';
    const t = typeStr.toLowerCase();
    if (t === 'journal-article') return 'journal-article';
    if (t === 'book-chapter' || t === 'book-section') return 'book-chapter';
    if (t === 'book' || t === 'monograph' || t === 'edited-book') return 'book';
    if (t === 'posted-content' || t === 'peer-review') return 'preprint';
    if (t === 'proceedings-article' || t === 'conference-paper') return 'conference-paper';
    if (t === 'review' || t === 'review-article') return 'review';
    if (t === 'dissertation') return 'dissertation';
    if (t === 'dataset') return 'dataset';
    return 'other';
  }

  /**
   * Normalize an OpenAlex API response record into a canonical Work
   */
  public static normalizeOpenAlexWork(raw: any, queryId?: string): Work {
    const retrievedAt = new Date().toISOString();
    const cleanDoi = this.normalizeDoi(raw.doi);
    const rawOaId = raw.id ? raw.id.replace(/^https?:\/\/openalex\.org\/(works\/)?/i, '').replace(/^works\//i, '').trim() : null;
    const openAlexId = rawOaId && /^W\d+$/i.test(rawOaId) ? rawOaId.toUpperCase() : null;
    const workId = cleanDoi ? `doi_${cleanDoi.replace(/[^a-zA-Z0-9]/g, '_')}` : openAlexId || `oa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Authors
    const authors: Author[] = Array.isArray(raw.authorships) && raw.authorships.length > 0
      ? raw.authorships.map((auth: any) => {
          const authorObj = auth.author || {};
          const orcid = authorObj.orcid ? authorObj.orcid.replace(/^https?:\/\/orcid\.org\//i, '') : undefined;
          const affiliation = auth.institutions?.[0]?.display_name || undefined;
          return {
            name: authorObj.display_name || 'Unknown Author',
            orcid: orcid || null,
            affiliation: affiliation || null
          };
        })
      : [{ name: 'Unknown Author' }];

    const year = raw.publication_year || (raw.publication_date ? parseInt(raw.publication_date.substring(0, 4), 10) : 0) || new Date().getFullYear();
    const title = this.normalizeTitle(raw.title || raw.display_name);
    const abstract = this.reconstructOpenAlexAbstract(raw.abstract_inverted_index);
    const venue = raw.primary_location?.source?.display_name || raw.host_venue?.display_name || null;
    const type = this.mapOpenAlexType(raw.type);
    const citationCount = typeof raw.cited_by_count === 'number' ? raw.cited_by_count : 0;
    const referenceCount = Array.isArray(raw.referenced_works) ? raw.referenced_works.length : 0;
    
    // Normalized references (Canonical OpenAlex IDs)
    const references = Array.isArray(raw.referenced_works)
      ? raw.referenced_works
          .map((r: string) => {
            const clean = (typeof r === 'string' ? r : '')
              .replace(/^https?:\/\/openalex\.org\/(works\/)?/i, '')
              .replace(/^works\//i, '')
              .trim()
              .toUpperCase();
            return /^W\d+$/.test(clean) ? clean : null;
          })
          .filter((r): r is string => !!r)
      : [];

    const openAccessUrl = raw.open_access?.oa_url || raw.primary_location?.landing_page_url || null;
    const pdfUrl = raw.primary_location?.pdf_url || raw.best_oa_location?.pdf_url || null;
    const sourceUrl = raw.doi || (openAlexId ? `https://openalex.org/${openAlexId}` : null);

    const disciplines = Array.isArray(raw.concepts)
      ? raw.concepts.slice(0, 5).map((c: any) => c.display_name)
      : [];

    const fieldProv: Record<string, FieldProvenance> = {
      title: { provider: 'OpenAlex', retrievedAt },
      authors: { provider: 'OpenAlex', retrievedAt },
      year: { provider: 'OpenAlex', retrievedAt },
      type: { provider: 'OpenAlex', retrievedAt },
      citationCount: { provider: 'OpenAlex', retrievedAt },
      venue: { provider: 'OpenAlex', retrievedAt },
      abstract: { provider: 'OpenAlex', retrievedAt }
    };

    return {
      id: workId,
      doi: cleanDoi,
      openAlexId,
      title,
      authors,
      year,
      venue,
      type,
      abstract,
      citationCount,
      citationCountSource: 'OpenAlex',
      referenceCount,
      references,
      citedBy: [],
      openAccessUrl,
      sourceUrl,
      pdfUrl,
      disciplines,
      keywords: disciplines,
      provenance: {
        provider: 'OpenAlex',
        retrievedAt,
        queryId,
        rawId: openAlexId,
        license: raw.primary_location?.license || null,
        confidenceScore: 0.95
      },
      fieldLevelProvenance: fieldProv,
      createdAt: retrievedAt,
      updatedAt: retrievedAt
    };
  }

  /**
   * Normalize a Crossref API response record into a canonical Work
   */
  public static normalizeCrossrefWork(raw: any, queryId?: string): Work {
    const retrievedAt = new Date().toISOString();
    const cleanDoi = this.normalizeDoi(raw.DOI);
    const workId = cleanDoi ? `doi_${cleanDoi.replace(/[^a-zA-Z0-9]/g, '_')}` : `cr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Authors
    const authors: Author[] = Array.isArray(raw.author) && raw.author.length > 0
      ? raw.author.map((auth: any) => {
          const given = auth.given || '';
          const family = auth.family || '';
          const name = family ? (given ? `${given} ${family}` : family) : auth.name || 'Unknown Author';
          const orcid = auth.ORCID ? auth.ORCID.replace(/^https?:\/\/orcid\.org\//i, '') : undefined;
          const affiliation = auth.affiliation?.[0]?.name || undefined;
          return {
            name,
            orcid: orcid || null,
            affiliation: affiliation || null
          };
        })
      : [{ name: 'Unknown Author' }];

    // Year: from published-print or published-online or created date-parts
    const dateParts = raw['published-print']?.['date-parts']?.[0] || 
                      raw['published-online']?.['date-parts']?.[0] || 
                      raw.published?.['date-parts']?.[0] || 
                      raw.created?.['date-parts']?.[0] || 
                      [new Date().getFullYear()];
    const year = dateParts[0] || new Date().getFullYear();

    const titleRaw = Array.isArray(raw.title) ? raw.title[0] : raw.title;
    const title = this.normalizeTitle(titleRaw);
    const subtitleRaw = Array.isArray(raw.subtitle) ? raw.subtitle[0] : raw.subtitle;
    const subtitle = subtitleRaw ? this.normalizeTitle(subtitleRaw) : null;

    const abstract = this.cleanCrossrefAbstract(raw.abstract);
    const venue = Array.isArray(raw['container-title']) ? raw['container-title'][0] : raw['container-title'] || null;
    const type = this.mapCrossrefType(raw.type);
    const citationCount = typeof raw['is-referenced-by-count'] === 'number' ? raw['is-referenced-by-count'] : 0;
    const referenceCount = typeof raw['references-count'] === 'number' ? raw['references-count'] : 0;

    const volume = raw.volume || null;
    const issue = raw.issue || null;
    const pages = raw.page || null;

    const sourceUrl = cleanDoi ? `https://doi.org/${cleanDoi}` : (raw.URL || null);
    const pdfUrl = raw.link?.find((l: any) => l['content-type'] === 'application/pdf')?.URL || null;

    const fieldProv: Record<string, FieldProvenance> = {
      title: { provider: 'Crossref', retrievedAt },
      authors: { provider: 'Crossref', retrievedAt },
      year: { provider: 'Crossref', retrievedAt },
      type: { provider: 'Crossref', retrievedAt },
      citationCount: { provider: 'Crossref', retrievedAt },
      venue: { provider: 'Crossref', retrievedAt },
      abstract: { provider: 'Crossref', retrievedAt }
    };

    return {
      id: workId,
      doi: cleanDoi,
      openAlexId: null,
      title,
      subtitle,
      authors,
      year,
      venue,
      volume,
      issue,
      pages,
      type,
      abstract,
      citationCount,
      citationCountSource: 'Crossref',
      referenceCount,
      references: [],
      citedBy: [],
      openAccessUrl: pdfUrl || sourceUrl,
      sourceUrl,
      pdfUrl,
      provenance: {
        provider: 'Crossref',
        retrievedAt,
        queryId,
        rawId: cleanDoi,
        license: raw.license?.[0]?.URL || null,
        confidenceScore: 0.95
      },
      fieldLevelProvenance: fieldProv,
      createdAt: retrievedAt,
      updatedAt: retrievedAt
    };
  }
}
