import { Work, GraphNode, GraphEdge, GraphExpansionResult } from '../types';
import { OpenAlexAdapter } from './OpenAlexAdapter';
import { SearchCacheService } from './SearchCacheService';
import { WorkResolverService } from './WorkResolverService';

export class CitationGraphService {
  private openAlexAdapter = new OpenAlexAdapter();
  private cacheService = SearchCacheService.getInstance();

  /**
   * Calculates deterministic coordinates:
   * x-axis = publication year
   * y-axis = log10-scaled citation count
   */
  public static computeDeterministicCoordinates(year: number, citationCount: number, minYear = 2000, maxYear = 2026): { x: number; y: number } {
    const clampedYear = Math.max(1950, Math.min(2030, year || 2020));
    const yearSpan = Math.max(1, maxYear - minYear);
    
    // Spread along x-axis from -400 to 400
    const normalizedYear = (clampedYear - minYear) / yearSpan;
    const x = Math.round((normalizedYear * 800) - 400);

    // Spread along y-axis based on log10 citation volume: 0 -> 100, 10 -> 0, 1000 -> -200, 10000+ -> -350
    const logCitations = Math.log10(Math.max(1, citationCount));
    const y = Math.round(150 - (logCitations * 120));

    return { x, y };
  }

  /**
   * Builds the initial project graph strictly from verified relationships between provided works.
   * NEVER fabricates an edge.
   */
  public buildProjectGraph(works: Work[], inclusionStatusMap?: Record<string, string>): { nodes: GraphNode[]; edges: GraphEdge[]; disclaimer: string } {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    const years = works.map(w => w.year).filter(y => y > 1900);
    const minYear = years.length > 0 ? Math.min(...years) : 2015;
    const maxYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear();

    const workIdMap = new Map<string, Work>();
    const openAlexIdMap = new Map<string, Work>();
    const doiMap = new Map<string, Work>();

    for (const w of works) {
      workIdMap.set(w.id, w);
      if (w.openAlexId) {
        openAlexIdMap.set(w.openAlexId.toLowerCase(), w);
      }
      if (w.doi) {
        doiMap.set(w.doi.toLowerCase(), w);
      }

      const coords = CitationGraphService.computeDeterministicCoordinates(w.year, w.citationCount, minYear, maxYear);

      nodes.push({
        id: w.id,
        label: `${w.authors[0]?.name?.split(' ').pop() || 'Unknown'} (${w.year || '?'})`,
        title: w.title,
        year: w.year,
        citationCount: w.citationCount,
        openAlexId: w.openAlexId,
        doi: w.doi,
        authors: w.authors.map(a => a.name),
        inclusionStatus: inclusionStatusMap?.[w.id] || 'included',
        provenance: w.provenance.provider,
        x: coords.x,
        y: coords.y
      });
    }

    // Connect directed citation edges strictly where references or citedBy match known works
    const edgeKeySet = new Set<string>();

    for (const w of works) {
      if (Array.isArray(w.references)) {
        for (const refId of w.references) {
          const cleanRef = refId.toLowerCase().replace(/^https?:\/\/openalex\.org\//i, '');
          const target = workIdMap.get(refId) || openAlexIdMap.get(cleanRef) || (w.doi ? doiMap.get(cleanRef) : undefined);

          if (target && target.id !== w.id) {
            const edgeId = `cite_${w.id}_to_${target.id}`;
            if (!edgeKeySet.has(edgeId)) {
              edgeKeySet.add(edgeId);
              edges.push({
                id: edgeId,
                source: w.id,
                target: target.id,
                type: 'cites',
                provenance: 'OpenAlex-derived'
              });
            }
          }
        }
      }
    }

    return {
      nodes,
      edges,
      disclaimer: 'Edges represent explicit OpenAlex-derived bibliographic citation records. Absent edges may reflect unindexed references in upstream publisher deposits.'
    };
  }

  /**
   * Expand citation graph using real OpenAlex citation and reference relationships.
   * Cached for 7 days.
   */
  public async expandGraph(
    rootWorkIds: string[],
    knownWorks: Work[],
    direction: 'cites' | 'cited_by' | 'related' | 'both' = 'both',
    depth: number = 1
  ): Promise<GraphExpansionResult> {
    const cacheKey = `v2_graph_exp_${rootWorkIds.slice().sort().join('_')}_${direction}_${depth}`;

    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const foundNodesMap = new Map<string, GraphNode>();
        const foundEdgesMap = new Map<string, GraphEdge>();
        const newWorksToHydrate: Work[] = [];

        // Seed with known works
        for (const w of knownWorks) {
          const coords = CitationGraphService.computeDeterministicCoordinates(w.year, w.citationCount);
          foundNodesMap.set(w.id, {
            id: w.id,
            label: `${w.authors[0]?.name?.split(' ').pop() || 'Unknown'} (${w.year || '?'})`,
            title: w.title,
            year: w.year,
            citationCount: w.citationCount,
            openAlexId: w.openAlexId,
            doi: w.doi,
            authors: w.authors.map(a => a.name),
            inclusionStatus: 'included',
            provenance: w.provenance.provider,
            x: coords.x,
            y: coords.y
          });
        }

        const targetWorks = knownWorks.filter(w => rootWorkIds.includes(w.id) || (w.openAlexId && rootWorkIds.includes(w.openAlexId)));

        for (const root of targetWorks) {
          // Resolve canonical OpenAlex ID strictly
          const res = await WorkResolverService.resolveCanonicalOpenAlexWorkId(root);
          if (res.verificationStatus !== 'verified' || !res.canonicalOpenAlexId) {
            continue;
          }
          const canonicalId = res.canonicalOpenAlexId;

          // 1. Direction: cites (references of the root work)
          if (direction === 'cites' || direction === 'both') {
            try {
              const fullWork = await this.openAlexAdapter.resolveByIdentifier(canonicalId);
              if (fullWork && fullWork.references && fullWork.references.length > 0) {
                const canonicalRefIds = fullWork.references
                  .map(r => WorkResolverService.extractCanonicalOpenAlexId(r))
                  .filter((r): r is string => !!r);
                
                const topRefIds = canonicalRefIds.slice(0, 10);
                const fetchedWorks = await this.openAlexAdapter.fetchWorksByCanonicalIds(topRefIds);
                const allowedSet = new Set(canonicalRefIds);

                for (const refWork of fetchedWorks) {
                  const refOaId = WorkResolverService.extractCanonicalOpenAlexId(refWork.openAlexId) || WorkResolverService.extractCanonicalOpenAlexId(refWork.id);
                  if (refOaId && allowedSet.has(refOaId)) {
                    newWorksToHydrate.push(refWork);
                    const coords = CitationGraphService.computeDeterministicCoordinates(refWork.year, refWork.citationCount);
                    foundNodesMap.set(refWork.id, {
                      id: refWork.id,
                      label: `${refWork.authors[0]?.name?.split(' ').pop() || 'Unknown'} (${refWork.year || '?'})`,
                      title: refWork.title,
                      year: refWork.year,
                      citationCount: refWork.citationCount,
                      openAlexId: refWork.openAlexId,
                      doi: refWork.doi,
                      authors: refWork.authors.map(a => a.name),
                      inclusionStatus: 'candidate',
                      provenance: 'OpenAlex-derived',
                      x: coords.x,
                      y: coords.y
                    });

                    const edgeId = `cite_${root.id}_to_${refWork.id}`;
                    foundEdgesMap.set(edgeId, {
                      id: edgeId,
                      source: root.id,
                      target: refWork.id,
                      type: 'cites',
                      provenance: 'OpenAlex-derived'
                    });
                  }
                }
              }
            } catch (err) {
              console.warn(`[CitationGraphService] Failed to expand references for ${root.id}:`, err);
            }
          }

          // 2. Direction: cited_by (works citing the root work)
          if (direction === 'cited_by' || direction === 'both') {
            try {
              const citingWorks = await this.openAlexAdapter.getCitingWorks(canonicalId, 10);
              for (const cw of citingWorks) {
                const cwOaId = WorkResolverService.extractCanonicalOpenAlexId(cw.openAlexId) || WorkResolverService.extractCanonicalOpenAlexId(cw.id);
                if (cwOaId) {
                  newWorksToHydrate.push(cw);
                  const coords = CitationGraphService.computeDeterministicCoordinates(cw.year, cw.citationCount);
                  foundNodesMap.set(cw.id, {
                    id: cw.id,
                    label: `${cw.authors[0]?.name?.split(' ').pop() || 'Unknown'} (${cw.year || '?'})`,
                    title: cw.title,
                    year: cw.year,
                    citationCount: cw.citationCount,
                    openAlexId: cw.openAlexId,
                    doi: cw.doi,
                    authors: cw.authors.map(a => a.name),
                    inclusionStatus: 'candidate',
                    provenance: 'OpenAlex-derived',
                    x: coords.x,
                    y: coords.y
                  });

                  const edgeId = `cite_${cw.id}_to_${root.id}`;
                  foundEdgesMap.set(edgeId, {
                    id: edgeId,
                    source: cw.id,
                    target: root.id,
                    type: 'cites',
                    provenance: 'OpenAlex-derived'
                  });
                }
              }
            } catch (err) {
              console.warn(`[CitationGraphService] Failed to expand citing works for ${root.id}:`, err);
            }
          }

          // 3. Direction: related works (topic similarity - NOT citation edge)
          if (direction === 'related') {
            try {
              const relatedWorks = await this.openAlexAdapter.getRelatedWorks(canonicalId);
              for (const rw of relatedWorks.slice(0, 10)) {
                const rwOaId = WorkResolverService.extractCanonicalOpenAlexId(rw.openAlexId) || WorkResolverService.extractCanonicalOpenAlexId(rw.id);
                if (rwOaId) {
                  newWorksToHydrate.push(rw);
                  const coords = CitationGraphService.computeDeterministicCoordinates(rw.year, rw.citationCount);
                  foundNodesMap.set(rw.id, {
                    id: rw.id,
                    label: `${rw.authors[0]?.name?.split(' ').pop() || 'Unknown'} (${rw.year || '?'})`,
                    title: rw.title,
                    year: rw.year,
                    citationCount: rw.citationCount,
                    openAlexId: rw.openAlexId,
                    doi: rw.doi,
                    authors: rw.authors.map(a => a.name),
                    inclusionStatus: 'candidate',
                    provenance: 'OpenAlex-related',
                    x: coords.x,
                    y: coords.y
                  });

                  const edgeId = `related_${root.id}_and_${rw.id}`;
                  foundEdgesMap.set(edgeId, {
                    id: edgeId,
                    source: root.id,
                    target: rw.id,
                    type: 'related',
                    provenance: 'OpenAlex-related'
                  });
                }
              }
            } catch (err) {
              console.warn(`[CitationGraphService] Failed to expand related works for ${root.id}:`, err);
            }
          }
        }

        // Cache newly fetched works into metadata cache
        for (const nw of newWorksToHydrate) {
          this.cacheService.setWork(nw.id, nw);
          if (nw.doi) this.cacheService.setWork(nw.doi, nw);
          if (nw.openAlexId) this.cacheService.setWork(nw.openAlexId, nw);
        }

        return {
          nodes: Array.from(foundNodesMap.values()),
          edges: Array.from(foundEdgesMap.values()),
          rootWorkIds,
          direction,
          depth,
          provenanceLabel: 'OpenAlex-derived',
          metadataDisclaimer: 'Edges represent documented OpenAlex citation links. Absent edges reflect unindexed upstream references.',
          timestamp: new Date().toISOString()
        };
      },
      'graph'
    );
  }
}
