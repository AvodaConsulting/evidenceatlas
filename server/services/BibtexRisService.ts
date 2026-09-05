import { Work, WorkType, Author } from '../types';
import { NormalizationService } from './NormalizationService';

export class BibtexRisService {
  /**
   * Parse BibTeX string into partial or normalized works
   */
  public static parseBibtex(bibtexText: string): Work[] {
    const works: Work[] = [];
    const entries = bibtexText.split(/@(?=[a-zA-Z]+\s*\{)/).filter(Boolean);

    for (const entry of entries) {
      try {
        const typeMatch = entry.match(/^([a-zA-Z]+)\s*\{\s*([^,]+),/);
        if (!typeMatch) continue;

        const rawType = typeMatch[1].toLowerCase();
        const citeKey = typeMatch[2].trim();
        const body = entry.substring(typeMatch[0].length);

        const getField = (field: string): string | null => {
          const regex = new RegExp(`${field}\\s*=\\s*[{"]([^}"]+)[}"]|${field}\\s*=\\s*([^,\\n\\}]+)`, 'i');
          const m = body.match(regex);
          return m ? (m[1] || m[2] || '').trim() : null;
        };

        const title = getField('title') || `Untitled (${citeKey})`;
        const authorsRaw = getField('author') || 'Unknown Author';
        const yearStr = getField('year') || getField('date') || '';
        const year = parseInt(yearStr.match(/\d{4}/)?.[0] || '0', 10) || new Date().getFullYear();
        const journal = getField('journal') || getField('booktitle') || getField('publisher') || undefined;
        const doi = NormalizationService.normalizeDoi(getField('doi'));
        const volume = getField('volume') || undefined;
        const number = getField('number') || getField('issue') || undefined;
        const pages = getField('pages') || undefined;
        const abstract = getField('abstract') || undefined;

        // Parse authors
        const authors: Author[] = authorsRaw.split(/\s+and\s+/i).map(nameStr => ({
          name: nameStr.replace(/[\{\}]/g, '').trim()
        }));

        let type: WorkType = 'journal-article';
        if (rawType === 'book') type = 'book';
        else if (rawType === 'incollection' || rawType === 'inbook') type = 'book-chapter';
        else if (rawType === 'inproceedings' || rawType === 'conference') type = 'conference-paper';
        else if (rawType === 'phdthesis' || rawType === 'mastersthesis') type = 'dissertation';
        else if (rawType === 'misc' || rawType === 'unpublished') type = 'preprint';

        const retrievedAt = new Date().toISOString();
        const workId = doi ? `doi_${doi.replace(/[^a-zA-Z0-9]/g, '_')}` : `bib_${citeKey}_${Date.now().toString(36)}`;

        works.push({
          id: workId,
          doi,
          title: NormalizationService.normalizeTitle(title),
          authors,
          year,
          venue: journal || null,
          volume: volume || null,
          issue: number || null,
          pages: pages || null,
          type,
          abstract: abstract || null,
          citationCount: 0,
          citationCountSource: 'Imported Record',
          referenceCount: 0,
          references: [],
          citedBy: [],
          provenance: {
            provider: 'BibTeX Import',
            retrievedAt,
            rawId: citeKey,
            confidenceScore: 0.9
          },
          isManualOrImportOnly: !doi,
          createdAt: retrievedAt,
          updatedAt: retrievedAt
        });
      } catch (err) {
        console.warn('[BibtexRisService] Error parsing BibTeX chunk:', err);
      }
    }

    return works;
  }

  /**
   * Parse RIS string into normalized works
   */
  public static parseRis(risText: string): Work[] {
    const works: Work[] = [];
    const entries = risText.split(/(?:^|\n)ER\s*-\s*(?:\r?\n|$)/).filter(e => e.trim().length > 5);

    for (const entry of entries) {
      try {
        const lines = entry.split(/\r?\n/);
        let title = '';
        let authors: Author[] = [];
        let year = 0;
        let journal = '';
        let doi: string | null = null;
        let volume = '';
        let issue = '';
        let pages = '';
        let abstract = '';
        let risType = 'JOUR';

        for (const line of lines) {
          const match = line.match(/^([A-Z0-9]{2})\s*-\s*(.*)$/);
          if (!match) continue;

          const tag = match[1];
          const val = match[2].trim();

          if (tag === 'TY') risType = val;
          else if (tag === 'TI' || tag === 'T1' || tag === 'CT') title = val;
          else if (tag === 'AU' || tag === 'A1') authors.push({ name: val });
          else if (tag === 'PY' || tag === 'Y1' || tag === 'DA') {
            const yr = parseInt(val.substring(0, 4), 10);
            if (!isNaN(yr) && yr > 1500) year = yr;
          }
          else if (tag === 'JO' || tag === 'JF' || tag === 'JA' || tag === 'T2') journal = val;
          else if (tag === 'DO') doi = NormalizationService.normalizeDoi(val);
          else if (tag === 'VL') volume = val;
          else if (tag === 'IS') issue = val;
          else if (tag === 'SP') pages = val;
          else if (tag === 'AB' || tag === 'N2') abstract = val;
        }

        if (!title && authors.length === 0) continue;

        let type: WorkType = 'journal-article';
        if (risType === 'BOOK') type = 'book';
        else if (risType === 'CHAP') type = 'book-chapter';
        else if (risType === 'CONF') type = 'conference-paper';
        else if (risType === 'THES') type = 'dissertation';
        else if (risType === 'DATA') type = 'dataset';

        const retrievedAt = new Date().toISOString();
        const workId = doi ? `doi_${doi.replace(/[^a-zA-Z0-9]/g, '_')}` : `ris_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

        works.push({
          id: workId,
          doi,
          title: NormalizationService.normalizeTitle(title || 'Untitled RIS Record'),
          authors: authors.length > 0 ? authors : [{ name: 'Unknown Author' }],
          year: year || new Date().getFullYear(),
          venue: journal || null,
          volume: volume || null,
          issue: issue || null,
          pages: pages || null,
          type,
          abstract: abstract || null,
          citationCount: 0,
          citationCountSource: 'Imported Record',
          referenceCount: 0,
          references: [],
          citedBy: [],
          provenance: {
            provider: 'RIS Import',
            retrievedAt,
            rawId: risType,
            confidenceScore: 0.9
          },
          isManualOrImportOnly: !doi,
          createdAt: retrievedAt,
          updatedAt: retrievedAt
        });
      } catch (err) {
        console.warn('[BibtexRisService] Error parsing RIS chunk:', err);
      }
    }

    return works;
  }
}
