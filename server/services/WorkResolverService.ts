import { Work, WorkConflict, FieldProvenance } from '../types';
import { NormalizationService } from './NormalizationService';

export interface CanonicalResolutionResult {
  canonicalOpenAlexId: string | null;
  verificationStatus: 'verified' | 'unresolved' | 'ambiguous';
  resolutionMethod: 'existing_id' | 'doi' | 'title_author_year' | 'none';
  matchedWork?: Work | null;
  confidence: number;
  reason: string;
}

export class WorkResolverService {
  /**
   * Strictly extracts canonical OpenAlex ID format (e.g. "W2964344569")
   * Returns uppercase "W\d+" or null.
   */
  public static extractCanonicalOpenAlexId(raw: string | null | undefined): string | null {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    // Strip URLs or prefixes like "https://openalex.org/", "openalex.org/", "works/", "work:"
    const cleaned = trimmed
      .replace(/^https?:\/\/openalex\.org\/(works\/)?/i, '')
      .replace(/^openalex\.org\/(works\/)?/i, '')
      .replace(/^works\//i, '')
      .replace(/^work:/i, '')
      .trim();

    const match = cleaned.match(/^W\d+$/i);
    if (match) {
      return match[0].toUpperCase();
    }
    return null;
  }

  /**
   * Strict server-side function to resolve canonical OpenAlex Work ID (format W\d+).
   * 
   * Precedence & Rules:
   * 1. Prioritize previously verified canonical OpenAlex ID (W...).
   * 2. If absent, resolve by DOI (exact OpenAlex endpoint query).
   * 3. If DOI is unavailable, perform cautious title/author/year resolution.
   * 4. Verify candidate against title, year, and first author.
   * 5. Returns verified canonical OpenAlex work ID OR explicit unresolved/ambiguous state.
   * 6. NEVER returns a guessed ID silently or falls back to generic search.
   */
  public static async resolveCanonicalOpenAlexWorkId(
    selectedWork: Partial<Work> | { id?: string; doi?: string | null; openAlexId?: string | null; title?: string; authors?: any[]; year?: number }
  ): Promise<CanonicalResolutionResult> {
    if (!selectedWork) {
      return {
        canonicalOpenAlexId: null,
        verificationStatus: 'unresolved',
        resolutionMethod: 'none',
        confidence: 0,
        reason: 'No work object provided for canonical OpenAlex resolution.'
      };
    }

    // 1. Check existing openAlexId or id field
    const directOaId = this.extractCanonicalOpenAlexId(selectedWork.openAlexId) || this.extractCanonicalOpenAlexId(selectedWork.id);
    if (directOaId) {
      return {
        canonicalOpenAlexId: directOaId,
        verificationStatus: 'verified',
        resolutionMethod: 'existing_id',
        confidence: 1.0,
        reason: `Verified existing canonical OpenAlex ID (${directOaId})`
      };
    }

    const contactEmail = process.env.CONTACT_EMAIL || 'andy@avoda.hk';

    // 2. Resolve via DOI
    const cleanDoi = NormalizationService.normalizeDoi(selectedWork.doi);
    if (cleanDoi) {
      try {
        const url = `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(cleanDoi)}?mailto=${encodeURIComponent(contactEmail)}`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': `EvidenceAtlas/1.0 (mailto:${contactEmail})`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const resolvedOaId = this.extractCanonicalOpenAlexId(data.id);
          if (resolvedOaId) {
            const normalized = NormalizationService.normalizeOpenAlexWork(data);
            return {
              canonicalOpenAlexId: resolvedOaId,
              verificationStatus: 'verified',
              resolutionMethod: 'doi',
              matchedWork: normalized,
              confidence: 1.0,
              reason: `Authoritatively resolved via DOI (${cleanDoi}) to OpenAlex ${resolvedOaId}`
            };
          }
        } else if (response.status === 404) {
          // OpenAlex does not have this DOI indexed
          console.warn(`[WorkResolverService] DOI ${cleanDoi} not indexed in OpenAlex (404)`);
        }
      } catch (err: any) {
        console.warn(`[WorkResolverService] Network error resolving DOI ${cleanDoi}:`, err.message);
      }
    }

    // 3. Cautious Title + Author + Year Resolution (Strict Matching Only)
    const rawTitle = selectedWork.title?.trim();
    if (rawTitle && rawTitle.length >= 8 && !rawTitle.toLowerCase().startsWith('untitled') && !rawTitle.toLowerCase().startsWith('doi:')) {
      try {
        const cleanTitle = encodeURIComponent(rawTitle);
        const searchUrl = `https://api.openalex.org/works?search=${cleanTitle}&per_page=5&mailto=${encodeURIComponent(contactEmail)}`;
        const searchRes = await fetch(searchUrl, {
          headers: {
            'User-Agent': `EvidenceAtlas/1.0 (mailto:${contactEmail})`,
            'Accept': 'application/json'
          }
        });

        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const results = Array.isArray(searchData.results) ? searchData.results : [];
          
          if (results.length > 0) {
            const targetCleanTitle = this.cleanTitleForMatching(rawTitle);
            const targetFirstAuthor = selectedWork.authors && selectedWork.authors.length > 0
              ? (typeof selectedWork.authors[0] === 'string' ? selectedWork.authors[0] : selectedWork.authors[0]?.name || '').split(' ').pop()?.toLowerCase() || ''
              : '';
            const targetYear = selectedWork.year || 0;

            const highConfidenceMatches: { item: any; canonicalId: string; confidence: number; matchReason: string }[] = [];

            for (const item of results) {
              const itemCanonicalId = this.extractCanonicalOpenAlexId(item.id);
              if (!itemCanonicalId) continue;

              const itemCleanTitle = this.cleanTitleForMatching(item.title || '');
              if (!itemCleanTitle) continue;

              // Title comparison: exact match or normalized containment
              const isExactTitle = targetCleanTitle === itemCleanTitle;
              const isSubstringTitle = targetCleanTitle.length > 25 && itemCleanTitle.length > 25 && (targetCleanTitle.includes(itemCleanTitle) || itemCleanTitle.includes(targetCleanTitle));

              if (isExactTitle || isSubstringTitle) {
                // Author match
                const itemAuthors = Array.isArray(item.authorships) ? item.authorships.map((a: any) => a.author?.display_name || '') : [];
                const itemFirstAuthor = itemAuthors.length > 0 ? itemAuthors[0].split(' ').pop()?.toLowerCase() || '' : '';
                const authorMatch = !targetFirstAuthor || !itemFirstAuthor || targetFirstAuthor === itemFirstAuthor || targetFirstAuthor.includes(itemFirstAuthor) || itemFirstAuthor.includes(targetFirstAuthor);

                // Year match
                const itemYear = item.publication_year || 0;
                const yearDiff = Math.abs(targetYear - itemYear);
                const yearMatch = targetYear === 0 || itemYear === 0 || yearDiff <= 1;

                if (authorMatch && yearMatch) {
                  const conf = isExactTitle && targetFirstAuthor === itemFirstAuthor && yearDiff === 0 ? 0.95 : 0.85;
                  highConfidenceMatches.push({
                    item,
                    canonicalId: itemCanonicalId,
                    confidence: conf,
                    matchReason: `Title match "${item.title}" with author [${itemFirstAuthor || 'any'}] and year [${itemYear}]`
                  });
                }
              }
            }

            if (highConfidenceMatches.length === 1) {
              const best = highConfidenceMatches[0];
              const normalized = NormalizationService.normalizeOpenAlexWork(best.item);
              return {
                canonicalOpenAlexId: best.canonicalId,
                verificationStatus: 'verified',
                resolutionMethod: 'title_author_year',
                matchedWork: normalized,
                confidence: best.confidence,
                reason: best.matchReason
              };
            } else if (highConfidenceMatches.length > 1) {
              return {
                canonicalOpenAlexId: null,
                verificationStatus: 'ambiguous',
                resolutionMethod: 'none',
                confidence: 0,
                reason: `Multiple (${highConfidenceMatches.length}) ambiguous OpenAlex work records matched this title.`
              };
            }
          }
        }
      } catch (err: any) {
        console.warn(`[WorkResolverService] Title search error for "${rawTitle}":`, err.message);
      }
    }

    // 4. Return explicit unresolved state
    return {
      canonicalOpenAlexId: null,
      verificationStatus: 'unresolved',
      resolutionMethod: 'none',
      confidence: 0,
      reason: 'No verified canonical OpenAlex ID found. Citation expansion unavailable without authoritative OpenAlex record.'
    };
  }

  /**
   * Normalize a title string for fuzzy comparison (lowercase, alphanumeric only, spaces collapsed)
   */
  public static cleanTitleForMatching(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract primary family name from author list for matching
   */
  public static getFirstAuthorFamilyName(work: Work): string {
    if (!work.authors || work.authors.length === 0) return '';
    const firstAuthor = work.authors[0].name.trim().toLowerCase();
    const parts = firstAuthor.split(' ');
    return parts[parts.length - 1]; // last word is usually family name
  }

  /**
   * Determines whether two candidate works refer to the exact same academic entity.
   * Returns match type: 'doi_exact', 'title_author_year', or 'none'.
   */
  public static matchWorks(a: Work, b: Work): { isMatch: boolean; confidence: number; matchType: 'doi' | 'title_author_year' | 'none'; reason: string } {
    // 1. Check DOI match
    if (a.doi && b.doi) {
      if (a.doi.toLowerCase() === b.doi.toLowerCase()) {
        return { isMatch: true, confidence: 1.0, matchType: 'doi', reason: `Exact DOI match (${a.doi})` };
      } else {
        // Different DOIs -> definitely distinct works!
        return { isMatch: false, confidence: 0.0, matchType: 'none', reason: `Conflicting DOIs (${a.doi} vs ${b.doi})` };
      }
    }

    // 2. Title + First Author + Year match
    const titleA = this.cleanTitleForMatching(a.title);
    const titleB = this.cleanTitleForMatching(b.title);

    if (!titleA || !titleB) {
      return { isMatch: false, confidence: 0.0, matchType: 'none', reason: 'Missing title' };
    }

    // Check title equality or very high substring overlap
    const titleEqual = titleA === titleB || (titleA.length > 20 && titleB.length > 20 && (titleA.includes(titleB) || titleB.includes(titleA)));

    if (titleEqual) {
      const authorA = this.getFirstAuthorFamilyName(a);
      const authorB = this.getFirstAuthorFamilyName(b);
      const authorMatch = !authorA || !authorB || authorA === authorB || authorA.includes(authorB) || authorB.includes(authorA);

      const yearDiff = Math.abs((a.year || 0) - (b.year || 0));
      const yearMatch = a.year === 0 || b.year === 0 || yearDiff <= 1; // within 1 year for preprint/published variance

      if (authorMatch && yearMatch) {
        const confidence = (a.year === b.year && authorA === authorB) ? 0.92 : 0.80;
        return { 
          isMatch: true, 
          confidence, 
          matchType: 'title_author_year', 
          reason: `Normalized title matching with author [${authorA || 'unknown'}] and year [${a.year || '?'}]` 
        };
      }
    }

    return { isMatch: false, confidence: 0.0, matchType: 'none', reason: 'Distinct works' };
  }

  /**
   * Merges an OpenAlex record and a Crossref record into a unified Work entity,
   * recording field-level provenance and detecting any metadata conflicts.
   */
  public static mergeOpenAlexAndCrossref(openAlexWork: Work, crossrefWork: Work): Work {
    const conflicts: WorkConflict[] = [];
    const fieldProv: Record<string, FieldProvenance> = {
      ...(openAlexWork.fieldLevelProvenance || {}),
      ...(crossrefWork.fieldLevelProvenance || {})
    };

    // 1. Conflict detection
    // Title conflict
    if (this.cleanTitleForMatching(openAlexWork.title) !== this.cleanTitleForMatching(crossrefWork.title)) {
      conflicts.push({
        field: 'title',
        openAlexValue: openAlexWork.title,
        crossrefValue: crossrefWork.title,
        description: `Different title variations deposited: OpenAlex has "${openAlexWork.title}", Crossref has "${crossrefWork.title}"`
      });
    }

    // Year conflict
    if (openAlexWork.year && crossrefWork.year && Math.abs(openAlexWork.year - crossrefWork.year) > 0) {
      conflicts.push({
        field: 'year',
        openAlexValue: openAlexWork.year,
        crossrefValue: crossrefWork.year,
        description: `Publication year discrepancy: OpenAlex reports ${openAlexWork.year}, Crossref reports ${crossrefWork.year}`
      });
    }

    // Citation Count conflict
    if (Math.abs(openAlexWork.citationCount - crossrefWork.citationCount) > 10) {
      conflicts.push({
        field: 'citationCount',
        openAlexValue: openAlexWork.citationCount,
        crossrefValue: crossrefWork.citationCount,
        description: `Citation metrics differ: OpenAlex indexed ${openAlexWork.citationCount.toLocaleString()} citations, Crossref indexed ${crossrefWork.citationCount.toLocaleString()}`
      });
    }

    // Venue conflict
    if (openAlexWork.venue && crossrefWork.venue && openAlexWork.venue.toLowerCase() !== crossrefWork.venue.toLowerCase()) {
      conflicts.push({
        field: 'venue',
        openAlexValue: openAlexWork.venue,
        crossrefValue: crossrefWork.venue,
        description: `Venue naming variance: "${openAlexWork.venue}" vs "${crossrefWork.venue}"`
      });
    }

    // 2. Synthesize merged object
    // Preferred title: OpenAlex or Crossref
    const title = openAlexWork.title.length >= crossrefWork.title.length ? openAlexWork.title : crossrefWork.title;
    const doi = openAlexWork.doi || crossrefWork.doi || null;
    const openAlexId = openAlexWork.openAlexId || null;

    // Authors: prefer the one with more affiliation / ORCID details
    const openAlexHasOrcid = openAlexWork.authors.some(a => !!a.orcid || !!a.affiliation);
    const crossrefHasOrcid = crossrefWork.authors.some(a => !!a.orcid || !!a.affiliation);
    const authors = crossrefHasOrcid && !openAlexHasOrcid ? crossrefWork.authors : openAlexWork.authors;

    // Prefer OpenAlex citation counts and graph references
    const citationCount = openAlexWork.citationCount;
    const referenceCount = Math.max(openAlexWork.referenceCount, crossrefWork.referenceCount);
    const references = openAlexWork.references.length > 0 ? openAlexWork.references : crossrefWork.references;

    // Prefer OpenAlex abstract if available (or Crossref if OpenAlex is empty)
    const abstract = openAlexWork.abstract || crossrefWork.abstract || null;

    // Bibliographic details from Crossref if available
    const venue = openAlexWork.venue || crossrefWork.venue || null;
    const volume = crossrefWork.volume || openAlexWork.volume || null;
    const issue = crossrefWork.issue || openAlexWork.issue || null;
    const pages = crossrefWork.pages || openAlexWork.pages || null;

    const openAccessUrl = openAlexWork.openAccessUrl || crossrefWork.openAccessUrl || null;
    const pdfUrl = openAlexWork.pdfUrl || crossrefWork.pdfUrl || null;
    const sourceUrl = openAlexWork.sourceUrl || crossrefWork.sourceUrl || null;

    return {
      id: openAlexWork.id || crossrefWork.id,
      doi,
      openAlexId,
      title,
      subtitle: crossrefWork.subtitle || openAlexWork.subtitle || null,
      authors,
      year: openAlexWork.year || crossrefWork.year,
      venue,
      volume,
      issue,
      pages,
      type: openAlexWork.type !== 'other' ? openAlexWork.type : crossrefWork.type,
      abstract,
      citationCount,
      citationCountSource: 'OpenAlex (Primary) with Crossref verification',
      referenceCount,
      references,
      citedBy: openAlexWork.citedBy || [],
      openAccessUrl,
      sourceUrl,
      pdfUrl,
      disciplines: openAlexWork.disciplines || [],
      keywords: openAlexWork.keywords || [],
      provenance: {
        provider: 'Merged (OpenAlex + Crossref)',
        retrievedAt: new Date().toISOString(),
        rawId: `oa:${openAlexId || 'na'}|cr:${doi || 'na'}`,
        license: crossrefWork.provenance.license || openAlexWork.provenance.license || null,
        confidenceScore: 0.98
      },
      fieldLevelProvenance: fieldProv,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      createdAt: openAlexWork.createdAt || crossrefWork.createdAt,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Merges an array of works retrieved from disparate scholarly providers.
   * - Matches by DOI first.
   * - Fallback: matches by normalized title + first author + year.
   * - Never silently merges ambiguous records: if confidence is low, both are preserved.
   */
  public static mergeCandidateLists(openAlexWorks: Work[], crossrefWorks: Work[]): Work[] {
    const mergedList: Work[] = [];
    const matchedCrossrefIndices = new Set<number>();

    for (const oaWork of openAlexWorks) {
      let matchedIndex = -1;
      let highestConfidence = 0;

      for (let i = 0; i < crossrefWorks.length; i++) {
        if (matchedCrossrefIndices.has(i)) continue;
        const match = this.matchWorks(oaWork, crossrefWorks[i]);
        if (match.isMatch && match.confidence > highestConfidence) {
          highestConfidence = match.confidence;
          matchedIndex = i;
        }
      }

      if (matchedIndex >= 0 && highestConfidence >= 0.75) {
        // High confidence merge
        matchedCrossrefIndices.add(matchedIndex);
        const merged = this.mergeOpenAlexAndCrossref(oaWork, crossrefWorks[matchedIndex]);
        mergedList.push(merged);
      } else {
        // No safe match or low confidence -> keep OpenAlex as distinct record
        mergedList.push(oaWork);
      }
    }

    // Add remaining unmatched Crossref works
    for (let i = 0; i < crossrefWorks.length; i++) {
      if (!matchedCrossrefIndices.has(i)) {
        mergedList.push(crossrefWorks[i]);
      }
    }

    return mergedList;
  }
}
