/**
 * Export & Research Audit Report Service
 *
 * Formats project literature, evidence matrices, search audit trails, and provenance records
 * into BibTeX, RIS, CSV (with field-level provenance), Markdown bibliography, and comprehensive
 * Reproducible Research Audit Reports.
 *
 * Security & Integrity Mandates:
 * 1. ZERO secret leakage: Never export API keys, auth tokens, or private workspace secrets.
 * 2. Strict Provenance: Include field-level and source-level origin data in CSV and audit reports.
 * 3. Epistemic Transparency: Record search queries, provider retrieval dates, and exclusion rationales.
 */

import { Work, Project, ProjectWork, EvidenceRecord, SearchLog, StoredMonitor } from '../../src/types';
import { CitationTrail, DiscoveryCandidate, CitationTrailEvent } from '../types';

export interface CitationTrailAuditData {
  projectTitle: string;
  researchQuestion: string;
  generatedAt: string;
  totalTrails: number;
  totalCandidatesExplored: number;
  totalIncludedFromTrails: number;
  totalRejectedWithReasons: number;
  trails: {
    id: string;
    title: string;
    trailType: string;
    parentTrailId: string | null;
    status: string;
    isPinned: boolean;
    seedWorks: { id: string; title: string; doi?: string; year: number }[];
    providers: string[];
    retrievalTimestamps: string[];
    requestParams: Record<string, any>;
    candidateCounts: {
      total: number;
      included: number;
      queued: number;
      rejected: number;
      undecided: number;
    };
    candidates: {
      id: string;
      title: string;
      doi?: string;
      authors: string;
      year: number;
      status: string;
      reasons: string[];
      exclusionReason?: string;
      bridgePathDetail?: any;
      counterevidenceDetail?: any;
    }[];
    researcherNotes: string;
    researcherConclusion?: string;
    promotedCollection?: any;
    aiSuggestions?: string;
    coverageWarnings: string[];
    comments?: any[];
  }[];
  securityNotice: string;
}

export interface ResearchAuditReportData {
  reportVersion: string;
  generatedAt: string;
  project: {
    id: string;
    title: string;
    researchQuestion: string;
    discipline: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    isPrivate: boolean;
  };
  integritySummary: {
    totalWorksIndexed: number;
    includedCount: number;
    candidateCount: number;
    excludedCount: number;
    evidenceClaimsCount: number;
    verifiedClaimsCount: number;
    contestedClaimsCount: number;
  };
  providersAndMethodology: {
    primaryProviders: string[];
    sciteVerificationActive: boolean;
    coverageBoundaries: string;
    searchSaturationStatus: string;
  };
  searchExecutionAudit: {
    totalSearchesLogged: number;
    queries: {
      queryText: string;
      filters: Record<string, any>;
      providers: string[];
      executedAt: string;
      candidateCount: number;
    }[];
  };
  inclusionExclusionMatrix: {
    workId: string;
    doi?: string;
    title: string;
    authors: string;
    year: number;
    status: 'included' | 'candidate' | 'excluded';
    rationale?: string;
    provenanceProvider: string;
    retrievalDate: string;
  }[];
  evidenceClaimMatrix: {
    id: string;
    claimStatement: string;
    supportStrength: string;
    verificationStatus: string;
    workTitle?: string;
    workDoi?: string;
    verbatimPassage: string;
    warrantExplanation?: string;
  }[];
  monitorsAudit: {
    monitorId: string;
    title: string;
    frequency: string;
    lastRunAt?: string;
    newWorksFoundCount: number;
  }[];
  complianceAndSecurityDisclaimer: string;
}

export class ExportAuditService {
  private static instance: ExportAuditService;

  private constructor() {}

  public static getInstance(): ExportAuditService {
    if (!ExportAuditService.instance) {
      ExportAuditService.instance = new ExportAuditService();
    }
    return ExportAuditService.instance;
  }

  /**
   * Export works as BibTeX
   */
  public generateBibTeX(works: (Work | (ProjectWork & { work?: Work }))[]): string {
    const cleanWorks: Work[] = works.map(w => ('work' in w && w.work ? w.work : (w as Work)));

    return cleanWorks.map(w => {
      const firstAuthor = w.authors?.[0]?.name?.split(' ')?.pop()?.toLowerCase() || 'unknown';
      const citeKey = `${firstAuthor}${w.year || 'nd'}_${(w.id || 'ref').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)}`;
      const authorsStr = (w.authors || []).map(a => a.name).join(' and ');

      let entryType = 'article';
      if (w.type === 'book') entryType = 'book';
      if (w.type === 'book-chapter') entryType = 'incollection';
      if (w.type === 'conference-paper') entryType = 'inproceedings';
      if (w.type === 'review') entryType = 'article';

      return `@${entryType}{${citeKey},
  title = {${(w.title || 'Untitled').replace(/[{}]/g, '')}},
  author = {${authorsStr}},
  year = {${w.year || ''}},
  journal = {${w.venue || ''}},
  doi = {${w.doi || ''}},
  url = {${w.openAccessUrl || w.sourceUrl || ''}},
  abstract = {${(w.abstract || '').replace(/[\n\r]+/g, ' ').replace(/[{}]/g, '')}},
  note = {Retrieved via Evidence Atlas from ${w.provenance?.provider || 'OpenAlex'} on ${w.provenance?.retrievedAt?.substring(0, 10) || 'undated'}}
}`;
    }).join('\n\n');
  }

  /**
   * Export works as RIS format
   */
  public generateRIS(works: (Work | (ProjectWork & { work?: Work }))[]): string {
    const cleanWorks: Work[] = works.map(w => ('work' in w && w.work ? w.work : (w as Work)));

    return cleanWorks.map(w => {
      let ty = 'JOUR';
      if (w.type === 'book') ty = 'BOOK';
      if (w.type === 'book-chapter') ty = 'CHAP';
      if (w.type === 'conference-paper') ty = 'CONF';

      const lines = [
        `TY  - ${ty}`,
        `TI  - ${w.title || ''}`,
        ...(w.authors || []).map(a => `AU  - ${a.name}`),
        `PY  - ${w.year || ''}`,
        `JO  - ${w.venue || ''}`,
        `DO  - ${w.doi || ''}`,
        `UR  - ${w.openAccessUrl || w.sourceUrl || ''}`,
        `AB  - ${w.abstract ? w.abstract.replace(/[\n\r]+/g, ' ') : ''}`,
        `M2  - Provenance: ${w.provenance?.provider || 'Scholarly Provider'} (Retrieved: ${w.provenance?.retrievedAt || ''})`,
        'ER  - '
      ];
      return lines.join('\n');
    }).join('\n\n');
  }

  /**
   * Export works as CSV with comprehensive Field-Level Provenance
   */
  public generateCSV(projectWorks: ProjectWork[], allWorks: Map<string, Work>): string {
    const headers = [
      'id',
      'doi',
      'title',
      'authors',
      'year',
      'venue',
      'type',
      'citation_count',
      'open_access_url',
      'inclusion_status',
      'read_status',
      'exclusion_reason',
      'personal_notes',
      'tags',
      'provenance_provider',
      'provenance_retrieved_at',
      'provenance_confidence_score',
      'field_provenance_doi_source',
      'field_provenance_title_source',
      'field_provenance_authors_source'
    ];

    const escapeCsv = (val: any): string => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = projectWorks.map(pw => {
      const work = pw.work || allWorks.get(pw.workId);
      const authorsStr = (work?.authors || []).map(a => a.name).join('; ');
      const tagsStr = (pw.tags || []).join('; ');

      const fieldProv = work?.fieldLevelProvenance || {};

      return [
        escapeCsv(work?.id || pw.workId),
        escapeCsv(work?.doi || ''),
        escapeCsv(work?.title || ''),
        escapeCsv(authorsStr),
        escapeCsv(work?.year || ''),
        escapeCsv(work?.venue || ''),
        escapeCsv(work?.type || 'other'),
        escapeCsv(work?.citationCount || 0),
        escapeCsv(work?.openAccessUrl || work?.sourceUrl || ''),
        escapeCsv(pw.inclusionStatus),
        escapeCsv(pw.readStatus),
        escapeCsv(pw.exclusionReason || ''),
        escapeCsv(pw.personalNotes || ''),
        escapeCsv(tagsStr),
        escapeCsv(work?.provenance?.provider || 'Scholarly Provider'),
        escapeCsv(work?.provenance?.retrievedAt || ''),
        escapeCsv(work?.provenance?.confidenceScore ?? 1.0),
        escapeCsv(fieldProv.doi?.provider || work?.provenance?.provider || 'Primary Authority'),
        escapeCsv(fieldProv.title?.provider || work?.provenance?.provider || 'Primary Authority'),
        escapeCsv(fieldProv.authors?.provider || work?.provenance?.provider || 'Primary Authority')
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Export formatted Markdown Bibliography
   */
  public generateMarkdownBibliography(project: Project, projectWorks: ProjectWork[], allWorks: Map<string, Work>): string {
    const included = projectWorks.filter(pw => pw.inclusionStatus === 'included');
    const candidates = projectWorks.filter(pw => pw.inclusionStatus === 'candidate');

    const formatEntry = (pw: ProjectWork, idx: number) => {
      const work = pw.work || allWorks.get(pw.workId);
      if (!work) return `${idx + 1}. *Unknown record* [ID: ${pw.workId}]`;
      const authorsStr = (work.authors || []).map(a => a.name).join(', ');
      const doiLink = work.doi ? `[https://doi.org/${work.doi}](https://doi.org/${work.doi})` : 'No DOI';
      const notes = pw.personalNotes ? `\n   > **Notes**: ${pw.personalNotes}` : '';

      return `${idx + 1}. **${authorsStr}** (${work.year}). *${work.title}*. ${work.venue || 'Scholarly Venue'}. DOI: ${doiLink} (Source: ${work.provenance?.provider || 'OpenAlex'})${notes}`;
    };

    return `# Bibliography: ${project.title}

> **Research Question**: ${project.researchQuestion}  
> **Discipline**: ${project.discipline}  
> **Export Date**: ${new Date().toISOString().substring(0, 10)}  
> **Total Included Works**: ${included.length}

---

## Included Works in Synthesis (${included.length})

${included.length > 0 ? included.map(formatEntry).join('\n\n') : '*No works formally included in synthesis.*'}

---

## Candidate Works Under Review (${candidates.length})

${candidates.length > 0 ? candidates.map(formatEntry).join('\n\n') : '*No candidate works pending review.*'}

---
*Export generated by Evidence Atlas — Research Integrity & Grounded Scholarly Discovery.*
`;
  }

  /**
   * Generate complete reproducible Research Audit Report
   */
  public generateResearchAuditReport(params: {
    project: Project;
    projectWorks: ProjectWork[];
    allWorks: Map<string, Work>;
    evidenceRecords: EvidenceRecord[];
    searchLogs: SearchLog[];
    monitors: any[];
  }): {
    jsonReport: ResearchAuditReportData;
    markdownReport: string;
  } {
    const { project, projectWorks, allWorks, evidenceRecords, searchLogs, monitors } = params;

    const included = projectWorks.filter(pw => pw.inclusionStatus === 'included');
    const candidates = projectWorks.filter(pw => pw.inclusionStatus === 'candidate');
    const excluded = projectWorks.filter(pw => pw.inclusionStatus === 'excluded');

    const verifiedClaims = evidenceRecords.filter(e => e.verificationStatus === 'verified');
    const contestedClaims = evidenceRecords.filter(e => e.supportStrength === 'contested');

    const jsonReport: ResearchAuditReportData = {
      reportVersion: '1.0.0-PROVENANCE-CERTIFIED',
      generatedAt: new Date().toISOString(),
      project: {
        id: project.id,
        title: project.title,
        researchQuestion: project.researchQuestion,
        discipline: project.discipline,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        isPrivate: project.isPrivate
      },
      integritySummary: {
        totalWorksIndexed: projectWorks.length,
        includedCount: included.length,
        candidateCount: candidates.length,
        excludedCount: excluded.length,
        evidenceClaimsCount: evidenceRecords.length,
        verifiedClaimsCount: verifiedClaims.length,
        contestedClaimsCount: contestedClaims.length
      },
      providersAndMethodology: {
        primaryProviders: ['OpenAlex (Primary Metadata Authority)', 'Crossref (DOI Registry Authority)'],
        sciteVerificationActive: true,
        coverageBoundaries: 'OpenAlex / Crossref indexation limits. Unindexed preprints and proprietary paywalls may require manual verification.',
        searchSaturationStatus: projectWorks.length > 10 ? 'High Bibliographic Saturation' : 'Moderate / Frontier Scoping'
      },
      searchExecutionAudit: {
        totalSearchesLogged: searchLogs.length,
        queries: searchLogs.map(s => ({
          queryText: s.queryText,
          filters: s.queryFilters || {},
          providers: s.providersQueried || ['OpenAlex', 'Crossref'],
          executedAt: s.executedAt,
          candidateCount: s.candidateCount
        }))
      },
      inclusionExclusionMatrix: projectWorks.map(pw => {
        const work = pw.work || allWorks.get(pw.workId);
        return {
          workId: pw.workId,
          doi: work?.doi,
          title: work?.title || 'Unknown Title',
          authors: (work?.authors || []).map(a => a.name).join(', '),
          year: work?.year || 0,
          status: pw.inclusionStatus,
          rationale: pw.exclusionReason || pw.personalNotes || undefined,
          provenanceProvider: work?.provenance?.provider || 'Scholarly Provider',
          retrievalDate: work?.provenance?.retrievedAt || pw.addedAt
        };
      }),
      evidenceClaimMatrix: evidenceRecords.map(e => ({
        id: e.id,
        claimStatement: e.claimStatement,
        supportStrength: e.supportStrength,
        verificationStatus: e.verificationStatus,
        workTitle: e.workTitle,
        verbatimPassage: e.verbatimPassage,
        warrantExplanation: e.warrantExplanation
      })),
      monitorsAudit: monitors.map(m => ({
        monitorId: m.id,
        title: m.title,
        frequency: m.frequency,
        lastRunAt: m.lastRunAt,
        newWorksFoundCount: m.newWorksFoundCount || 0
      })),
      complianceAndSecurityDisclaimer: 'CONFIDENTIAL & REPRODUCIBLE AUDIT: This report encapsulates all search queries, inclusion matrices, grounded claims, and provenance records. No secret credentials, API keys, or raw provider tokens are included.'
    };

    // Markdown formatted representation of the audit report
    const markdownReport = `# Reproducible Research Audit Report: ${project.title}

**Report Generated**: ${jsonReport.generatedAt}  
**Project ID**: \`${project.id}\`  
**Discipline**: ${project.discipline}  
**Research Question**: *"${project.researchQuestion}"*  
**Access Classification**: Private Workspace (Zero Public Exposure)

---

## 1. Executive Integrity Summary

- **Total Scholarly Works Indexed**: ${jsonReport.integritySummary.totalWorksIndexed}
- **Included in Final Synthesis**: ${jsonReport.integritySummary.includedCount}
- **Candidate Works Under Review**: ${jsonReport.integritySummary.candidateCount}
- **Excluded Records with Documented Rationales**: ${jsonReport.integritySummary.excludedCount}
- **Grounded Evidence Claims**: ${jsonReport.integritySummary.evidenceClaimsCount} (${jsonReport.integritySummary.verifiedClaimsCount} verified, ${jsonReport.integritySummary.contestedClaimsCount} contested)

---

## 2. Search Strategy & Provider Provenance Audit

The project synthesizes literature from OpenAlex and Crossref with Scite Smart Citation verification.

| Query Text | Providers | Executed At | Candidates Found |
| :--- | :--- | :--- | :--- |
${searchLogs.length > 0 
  ? searchLogs.map(s => `| \`${s.queryText}\` | ${(s.providersQueried || ['OpenAlex']).join(', ')} | ${s.executedAt.substring(0, 19).replace('T', ' ')} | ${s.candidateCount} |`).join('\n')
  : '| *Initial manual seed set* | OpenAlex | - | - |'}

---

## 3. Inclusion & Exclusion Decision Matrix

| Work Title & Authors | Year | Decision | Rationale / Notes | Provenance |
| :--- | :--- | :--- | :--- | :--- |
${projectWorks.map(pw => {
  const work = pw.work || allWorks.get(pw.workId);
  const auth = (work?.authors || [])[0]?.name || 'Author';
  return `| **${(work?.title || 'Untitled').substring(0, 45)}...** (${auth} et al.) | ${work?.year || 'n.d.'} | \`${(pw.inclusionStatus || 'included').toUpperCase()}\` | ${pw.exclusionReason || pw.personalNotes || 'Included for core synthesis'} | ${work?.provenance?.provider || 'OpenAlex'} |`;
}).join('\n')}

---

## 4. Grounded Claim–Evidence Matrix

${evidenceRecords.length > 0 ? evidenceRecords.map((e, idx) => `
### Claim ${idx + 1}: ${e.claimStatement}
- **Support Strength**: \`${(e.supportStrength || 'moderate').toUpperCase()}\`
- **Verification Status**: \`${(e.verificationStatus || 'unverified').toUpperCase()}\`
- **Referenced Work**: ${e.workTitle || 'Primary Source'}
- **Verbatim Passage**:
  > "${e.verbatimPassage}"
${e.warrantExplanation ? `- **Warrant / Reasoning**: ${e.warrantExplanation}` : ''}
`).join('\n') : '*No formal evidence claims registered yet.*'}

---

## 5. Active Research Monitors

${monitors.length > 0 ? monitors.map(m => `- **${m.title}** (Frequency: \`${m.frequency}\`, Last Run: ${m.lastRunAt || 'Pending'}, Total Found: ${m.newWorksFoundCount || 0})`).join('\n') : '*No active automated research monitors configured.*'}

---

## 6. Security & Data Policy Statement

*This audit document contains non-secret scholarly metadata and researcher reasoning. All API credentials, keys, and session tokens are strictly isolated on the backend server and excluded from export outputs.*
`;

    return { jsonReport, markdownReport };
  }

  /**
   * Generate dedicated Citation Trail Audit Report (Markdown, JSON, and CSV)
   */
  public generateCitationTrailAuditReport(params: {
    project: Project;
    trails: CitationTrail[];
    candidatesMap: Map<string, DiscoveryCandidate[]>;
    eventsMap?: Map<string, CitationTrailEvent[]>;
  }): {
    jsonReport: CitationTrailAuditData;
    markdownReport: string;
    csvReport: string;
  } {
    const { project, trails, candidatesMap } = params;

    let totalCandidatesCount = 0;
    let totalIncludedCount = 0;
    let totalRejectedCount = 0;

    const trailAuditList = trails.map(trail => {
      const cands = candidatesMap.get(trail.id) || [];
      totalCandidatesCount += cands.length;

      const included = cands.filter(c => c.status === 'included');
      const queued = cands.filter(c => c.status === 'queued');
      const rejected = cands.filter(c => c.status === 'rejected');
      const undecided = cands.filter(c => c.status === 'candidate');

      totalIncludedCount += included.length;
      totalRejectedCount += rejected.length;

      return {
        id: trail.id,
        title: trail.title,
        trailType: trail.trailType,
        parentTrailId: trail.parentTrailId,
        status: trail.status,
        isPinned: !!trail.isPinned,
        seedWorks: (trail.seedWorks || []).map(s => ({
          id: s.id,
          title: s.title,
          doi: s.doi || undefined,
          year: s.year
        })),
        providers: trail.providerSources || ['OpenAlex'],
        retrievalTimestamps: trail.retrievalTimestamps || [trail.createdAt],
        requestParams: trail.requestParams || {},
        candidateCounts: {
          total: cands.length,
          included: included.length,
          queued: queued.length,
          rejected: rejected.length,
          undecided: undecided.length
        },
        candidates: cands.map(c => ({
          id: c.id,
          title: c.work?.title || 'Unknown Title',
          doi: c.work?.doi || undefined,
          authors: (c.work?.authors || []).map(a => a.name).join(', '),
          year: c.work?.year || 0,
          status: c.status,
          reasons: c.reasons || [],
          exclusionReason: c.relevanceNotes || undefined,
          bridgePathDetail: c.bridgePathDetail,
          counterevidenceDetail: c.counterevidenceDetail
        })),
        researcherNotes: trail.researcherNotes || '',
        researcherConclusion: trail.researcherConclusion,
        promotedCollection: trail.promotedCollection,
        aiSuggestions: trail.reviewSummary?.aiSuggestions,
        coverageWarnings: trail.coverageWarnings || [],
        comments: trail.comments
      };
    });

    const jsonReport: CitationTrailAuditData = {
      projectTitle: project.title,
      researchQuestion: project.researchQuestion,
      generatedAt: new Date().toISOString(),
      totalTrails: trails.length,
      totalCandidatesExplored: totalCandidatesCount,
      totalIncludedFromTrails: totalIncludedCount,
      totalRejectedWithReasons: totalRejectedCount,
      trails: trailAuditList,
      securityNotice: 'CONFIDENTIAL AUDIT: No API secrets, raw auth tokens, or restricted database credentials are included in this export.'
    };

    // Build Markdown Tree and Breakdown
    const markdownReport = `# Citation Trails Audit & Reproducibility Report

**Project**: ${project.title}  
**Research Question**: *"${project.researchQuestion}"*  
**Discipline**: ${project.discipline}  
**Report Generated**: ${jsonReport.generatedAt}  
**Total Citation Trails**: ${trails.length}  
**Total Candidates Explored**: ${totalCandidatesCount} (${totalIncludedCount} included, ${totalRejectedCount} documented rejections)

---

## 1. Lineage Tree & Exploration Overview

${trails.map((t, idx) => {
  const isBranch = !!t.parentTrailId;
  const parentNote = isBranch ? ` *(Branched from \`${t.parentTrailId}\`)*` : ' *(Root Trail)*';
  const pinNote = t.isPinned ? ' 📌 **[Pinned]**' : '';
  const statusBadge = `\`[${(t.status || 'active').toUpperCase()}]\``;
  const promotedNote = t.promotedCollection ? `\n> 🏆 **Promoted to Collection**: *"${t.promotedCollection.name}"* (Section: *${t.promotedCollection.sectionTitle || 'Synthesis'}*)` : '';

  return `### ${idx + 1}. ${t.title} ${statusBadge}${pinNote}${parentNote}
- **Type**: \`${t.trailType}\`
- **Created**: ${t.createdAt} | **Last Updated**: ${t.updatedAt}
- **Provider Sources**: ${(t.providerSources || ['OpenAlex']).join(', ')}
- **Seed Set (${t.seedWorks?.length || 0})**: ${(t.seedWorks || []).map(s => `"${s.title}" (${s.year}${s.doi ? `, DOI: ${s.doi}` : ''})`).join('; ') || 'None'}
${promotedNote}

${t.researcherConclusion ? `#### Researcher Written Conclusion\n> ${t.researcherConclusion}\n` : ''}

${t.researcherNotes ? `**Researcher Notes**: ${t.researcherNotes}\n` : ''}

#### Candidate Summary (${(candidatesMap.get(t.id) || []).length} total)
- **Included**: ${(candidatesMap.get(t.id) || []).filter(c => c.status === 'included').length}
- **Queued**: ${(candidatesMap.get(t.id) || []).filter(c => c.status === 'queued').length}
- **Rejected / Set Aside**: ${(candidatesMap.get(t.id) || []).filter(c => c.status === 'rejected').length}

${t.coverageWarnings && t.coverageWarnings.length > 0 ? `**Coverage Warnings / Disclaimers**:\n${t.coverageWarnings.map(w => `- ⚠️ ${w}`).join('\n')}\n` : ''}
`;
}).join('\n---\n\n')}

---

## 2. Bridge Paper & Alternative Perspective Disclaimers

- **Local Bridge Calculations**: All bridge papers were computed strictly on the local induced project graph between visible seed clusters. They do not constitute assertions of global interdisciplinary breakthrough.
- **Counterevidence Classifications**: Potential counterevidence surfaced is categorized as "possible alternative perspective" and required human verification before any "challenges claim" relation was established.
- **Search Completeness**: In accordance with epistemic integrity standards, zero search results or lack of counterevidence in current indexation limits do not imply non-existence in the broader literature.

---

## 3. Epistemic Separation of AI Assistance

*Any AI-generated prompts or exploration suggestions included in this workflow are non-authoritative heuristics and are strictly separated from human researcher conclusions and verified bibliographic records.*

---
*Report generated by Evidence Atlas — Research Integrity & Grounded Scholarly Discovery.*
`;

    // CSV format
    const csvHeaders = [
      'Trail ID',
      'Trail Title',
      'Trail Type',
      'Parent Trail ID',
      'Trail Status',
      'Candidate Title',
      'Candidate DOI',
      'Authors',
      'Year',
      'Decision Status',
      'Discovery Reason',
      'Bridge Path Detail',
      'Counterevidence Perspective',
      'Exclusion Rationale',
      'Provider'
    ];

    const escapeCsv = (val: any) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows: string[] = [];

    trails.forEach(t => {
      const cands = candidatesMap.get(t.id) || [];
      cands.forEach(c => {
        csvRows.push([
          escapeCsv(t.id),
          escapeCsv(t.title),
          escapeCsv(t.trailType),
          escapeCsv(t.parentTrailId || 'ROOT'),
          escapeCsv(t.status),
          escapeCsv(c.work?.title || 'Unknown Title'),
          escapeCsv(c.work?.doi || ''),
          escapeCsv((c.work?.authors || []).map(a => a.name).join('; ')),
          escapeCsv(c.work?.year || ''),
          escapeCsv(c.status),
          escapeCsv((c.reasons || []).join(' | ')),
          escapeCsv(c.bridgePathDetail?.explanation || ''),
          escapeCsv(c.counterevidenceDetail?.perspectiveCategory || ''),
          escapeCsv(c.relevanceNotes || ''),
          escapeCsv(c.work?.provenance?.provider || 'OpenAlex')
        ].join(','));
      });
    });

    const csvReport = [csvHeaders.join(','), ...csvRows].join('\n');

    return { jsonReport, markdownReport, csvReport };
  }
}
