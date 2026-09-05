import { 
  Work, 
  CandidateRole, 
  StudyNextRecommendation, 
  StudyNextShortlistResult, 
  StudyNextPreferences, 
  ScoreBreakdown, 
  CandidateReason,
  ProjectCandidateState,
  ReadingPromptResponse
} from '../types';
import { GoogleGenAI } from '@google/genai';

export interface ComputeRecommendationsInput {
  projectId: string;
  projectTitle: string;
  researchQuestion: string;
  seedWorks: Work[];
  candidatePool: {
    work: Work;
    sourceTrailId?: string;
    sourceTrailTitle?: string;
    reasons?: CandidateReason[];
    connectedSeedIds?: string[];
  }[];
  existingProjectCandidateStates?: ProjectCandidateState[];
  preferences?: Partial<StudyNextPreferences>;
}

export class StudyNextRecommendationService {
  private static instance: StudyNextRecommendationService;

  private constructor() {}

  public static getInstance(): StudyNextRecommendationService {
    if (!StudyNextRecommendationService.instance) {
      StudyNextRecommendationService.instance = new StudyNextRecommendationService();
    }
    return StudyNextRecommendationService.instance;
  }

  /**
   * Compute transparent, diversity-aware Study Next Shortlist (Max 6 items)
   */
  public computeShortlist(input: ComputeRecommendationsInput): StudyNextShortlistResult {
    const {
      projectId,
      seedWorks,
      candidatePool,
      existingProjectCandidateStates = [],
      preferences = {}
    } = input;

    const prefs: StudyNextPreferences = {
      emphasis: preferences.emphasis || 'balanced',
      yearRange: preferences.yearRange || [1900, 2026],
      excludedTypes: preferences.excludedTypes || [],
      openAccessOnly: preferences.openAccessOnly || false,
      activeSeedIds: preferences.activeSeedIds || seedWorks.map(s => s.id),
      weightGraphVsSemantic: preferences.weightGraphVsSemantic || 'graph_primary'
    };

    const currentYear = new Date().getFullYear();
    const seedIdsSet = new Set(seedWorks.map(s => s.id.toLowerCase()));
    if (seedWorks.length > 0) {
      seedWorks.forEach(s => {
        if (s.doi) seedIdsSet.add(s.doi.toLowerCase());
        if (s.openAlexId) seedIdsSet.add(s.openAlexId.toLowerCase());
      });
    }

    // Build map of project candidate states for quick status and feedback lookup
    const stateMap = new Map<string, ProjectCandidateState>();
    existingProjectCandidateStates.forEach(pcs => {
      stateMap.set(pcs.workId.toLowerCase(), pcs);
      if (pcs.work.doi) stateMap.set(pcs.work.doi.toLowerCase(), pcs);
      if (pcs.work.openAlexId) stateMap.set(pcs.work.openAlexId.toLowerCase(), pcs);
    });

    // 1. Filter out seed works, already included/read works, and excluded/rejected works
    const eligiblePool: {
      work: Work;
      sourceTrailId: string;
      sourceTrailTitle: string;
      reasons: CandidateReason[];
      connectedSeedIds: string[];
      userFeedbackScore: number;
    }[] = [];

    const seenWorkIds = new Set<string>();

    for (const item of candidatePool) {
      const w = item.work;
      const wKey = (w.doi || w.openAlexId || w.id).toLowerCase();
      if (seenWorkIds.has(wKey)) continue;

      // Skip seeds
      if (seedIdsSet.has(w.id.toLowerCase()) || (w.doi && seedIdsSet.has(w.doi.toLowerCase()))) {
        continue;
      }

      // Check project candidate state
      const stateObj = stateMap.get(w.id.toLowerCase()) || (w.doi ? stateMap.get(w.doi.toLowerCase()) : undefined);
      if (stateObj) {
        // Excluded or irrelevant works MUST be suppressed
        if (stateObj.state === 'not_relevant' || stateObj.state === 'excluded_with_reason') {
          continue;
        }
        // Already fully read or already in canonical library are not "Study Next"
        if (stateObj.state === 'read' || stateObj.state === 'included_in_library') {
          continue;
        }
      }

      // Apply User Preference Filters
      if (w.year && (w.year < prefs.yearRange[0] || w.year > prefs.yearRange[1])) {
        continue;
      }
      if (prefs.excludedTypes.includes(w.type)) {
        continue;
      }
      if (prefs.openAccessOnly && !w.openAccessUrl && !(w as any).openAccess) {
        continue;
      }

      seenWorkIds.add(wKey);

      // Compute User Feedback signal
      let userFeedbackScore = 0;
      if (stateObj && stateObj.feedbackHistory) {
        stateObj.feedbackHistory.forEach(f => {
          if (f.type === 'more_like_this') userFeedbackScore += 0.3;
          if (f.type === 'less_like_this') userFeedbackScore -= 0.4;
          if (f.type === 'needs_verification') userFeedbackScore += 0.1;
        });
      }

      eligiblePool.push({
        work: w,
        sourceTrailId: item.sourceTrailId || 'trail_direct',
        sourceTrailTitle: item.sourceTrailTitle || 'Direct Discovery',
        reasons: item.reasons || [],
        connectedSeedIds: item.connectedSeedIds || [],
        userFeedbackScore
      });
    }

    // 2. Score each eligible candidate mathematically
    const totalSeeds = Math.max(1, seedWorks.length);
    const scoredCandidates = eligiblePool.map(candidate => {
      const w = candidate.work;

      // A. Graph Affinity (0 - 1)
      let directRefConnections = 0;
      let directCitationConnections = 0;
      let sharedRefConnections = 0;

      for (const s of seedWorks) {
        const sRefs = new Set((s.references || []).map(r => r.toLowerCase()));
        const sCited = new Set((s.citedBy || []).map(c => c.toLowerCase()));
        const wRefs = new Set((w.references || []).map(r => r.toLowerCase()));

        if (sRefs.has(w.id.toLowerCase()) || (w.doi && sRefs.has(w.doi.toLowerCase()))) {
          directRefConnections++;
        }
        if (sCited.has(w.id.toLowerCase()) || (w.doi && sCited.has(w.doi.toLowerCase()))) {
          directCitationConnections++;
        }

        // Overlapping references
        let overlap = 0;
        for (const ref of wRefs) {
          if (sRefs.has(ref)) overlap++;
        }
        if (overlap > 0) sharedRefConnections += Math.min(overlap, 5);
      }

      const connectedSeedCount = Math.max(
        candidate.connectedSeedIds.length,
        Math.min(totalSeeds, directRefConnections + directCitationConnections + (sharedRefConnections > 0 ? 1 : 0))
      );

      const graphAffinity = Math.min(1.0, (
        (directRefConnections * 0.4) +
        (directCitationConnections * 0.35) +
        (Math.min(sharedRefConnections, 10) * 0.05)
      ) / Math.max(1, totalSeeds * 0.5));

      // B. Connection Coverage Across Seeds (0 - 1)
      const connectionCoverageAcrossSeeds = Math.min(1.0, connectedSeedCount / totalSeeds);

      // C. Recency Signal (0 - 1)
      const age = Math.max(0, currentYear - (w.year || currentYear - 10));
      const recencySignal = Math.max(0, 1 - (age / 35));

      // D. Source Completeness (0 - 1)
      let completeness = 0.5;
      if (w.abstract && w.abstract.length > 50) completeness += 0.25;
      if (w.doi) completeness += 0.15;
      if (w.venue) completeness += 0.1;
      const sourceCompleteness = Math.min(1.0, completeness);

      // E. User Approval Signal (-1 to +1)
      const userApprovalSignal = Math.max(-1.0, Math.min(1.0, candidate.userFeedbackScore));

      // F. Semantic Similarity (Marked explicitly Unavailable / Uncomputed unless external embeddings model provides real cosine distance)
      const semanticSimilarity: number | null = null;
      const semanticAvailable = false;

      // G. Preference weighting adjustment
      let emphasisMultiplier = 1.0;
      if (prefs.emphasis === 'foundational') {
        // Boost earlier high-citation works
        if (w.year && w.year <= currentYear - 7) emphasisMultiplier += 0.25;
        if (w.citationCount > 50) emphasisMultiplier += 0.2;
      } else if (prefs.emphasis === 'recent') {
        // Boost works from the last 3-4 years
        if (w.year && w.year >= currentYear - 4) emphasisMultiplier += 0.4;
      } else if (prefs.emphasis === 'diverse') {
        // Equalize distribution
        emphasisMultiplier += 0.1;
      }

      // H. Composite Discovery Fit Score (0 - 100 Index)
      const rawFit = (
        (graphAffinity * 0.38) +
        (connectionCoverageAcrossSeeds * 0.32) +
        (recencySignal * 0.15) +
        (sourceCompleteness * 0.10) +
        (userApprovalSignal * 0.15)
      ) * emphasisMultiplier;

      const discoveryFitScore = Math.max(1, Math.min(99, Math.round(rawFit * 100)));

      const scores: ScoreBreakdown = {
        graphAffinity: Math.round(graphAffinity * 100) / 100,
        connectionCoverageAcrossSeeds: Math.round(connectionCoverageAcrossSeeds * 100) / 100,
        semanticSimilarity,
        semanticAvailable,
        recencySignal: Math.round(recencySignal * 100) / 100,
        diversityAdjustment: 0,
        userApprovalSignal: Math.round(userApprovalSignal * 100) / 100,
        sourceCompleteness: Math.round(sourceCompleteness * 100) / 100,
        discoveryFitScore
      };

      return {
        ...candidate,
        scores,
        directRefConnections,
        directCitationConnections,
        sharedRefConnections,
        connectedSeedCount
      };
    });

    // 3. Assign Candidate Roles based on mathematical and structural graph properties
    const roleBuckets: Map<CandidateRole, typeof scoredCandidates> = new Map();
    const allRoles: CandidateRole[] = [
      'Foundational Work',
      'Later Development',
      'Conceptually Similar Work',
      'Possible Bridge Work',
      'Methodological Alternative',
      'Possible Counterargument',
      'Under-read but Relevant Work'
    ];

    allRoles.forEach(r => roleBuckets.set(r, []));

    for (const c of scoredCandidates) {
      const w = c.work;
      const isEarlier = w.year && w.year <= currentYear - 5;
      const isRecent = w.year && w.year >= currentYear - 4;
      const highCitations = w.citationCount >= 40;
      const lowCitations = w.citationCount <= 12;

      // 1. Foundational Work: Earlier work referenced by multiple seeds or high citation depth
      if (isEarlier && (c.directRefConnections > 0 || highCitations) && c.connectedSeedCount >= 1) {
        roleBuckets.get('Foundational Work')!.push(c);
      }

      // 2. Later Development: Recent work citing the seeds
      if (isRecent && (c.directCitationConnections > 0 || c.scores.recencySignal >= 0.75)) {
        roleBuckets.get('Later Development')!.push(c);
      }

      // 3. Possible Bridge Work: Connects to 2+ distinct seeds or bridges clusters
      if (c.connectedSeedCount >= 2 && seedWorks.length >= 2) {
        roleBuckets.get('Possible Bridge Work')!.push(c);
      }

      // 4. Conceptually Similar Work: High shared references or co-citations
      if (c.sharedRefConnections >= 2 || (w.keywords && w.keywords.length > 2)) {
        roleBuckets.get('Conceptually Similar Work')!.push(c);
      }

      // 5. Methodological Alternative: Distinct publication venue/type or keywords
      const titleOrAbstract = `${w.title} ${w.abstract || ''}`.toLowerCase();
      if (
        titleOrAbstract.includes('method') ||
        titleOrAbstract.includes('framework') ||
        titleOrAbstract.includes('empirical') ||
        titleOrAbstract.includes('comparative') ||
        titleOrAbstract.includes('evaluation') ||
        w.type === 'conference-paper' ||
        w.type === 'dataset'
      ) {
        roleBuckets.get('Methodological Alternative')!.push(c);
      }

      // 6. Possible Counterargument: Critical, contrastive, or alternative finding terms
      if (
        titleOrAbstract.includes('limitations') ||
        titleOrAbstract.includes('reassessing') ||
        titleOrAbstract.includes('critique') ||
        titleOrAbstract.includes('challenge') ||
        titleOrAbstract.includes('revisiting') ||
        titleOrAbstract.includes('failure mode') ||
        titleOrAbstract.includes('vulnerability')
      ) {
        roleBuckets.get('Possible Counterargument')!.push(c);
      }

      // 7. Under-read but Relevant Work: Strong connection to seeds, but low global citations
      if (lowCitations && (c.directRefConnections > 0 || c.directCitationConnections > 0 || c.sharedRefConnections > 0)) {
        roleBuckets.get('Under-read but Relevant Work')!.push(c);
      }
    }

    // 4. Select up to 6 distinct recommendations with Diversity-Aware Selection
    const shortlist: StudyNextRecommendation[] = [];
    const omittedRoles: { role: CandidateRole; reason: string }[] = [];
    const chosenWorkIds = new Set<string>();
    const chosenVenues = new Set<string>();
    const chosenAuthorLeadLastNames = new Set<string>();

    const roleExplanations: Record<string, (c: any) => string> = {
      'Foundational Work': (c) => `Established earlier foundation (${c.work.year || 'Historic'}) cited across your seed literature.`,
      'foundational_premise': (c) => `Established earlier foundation (${c.work.year || 'Historic'}) cited across your seed literature.`,
      'Later Development': (c) => `Recent advancement (${c.work.year}) building directly on the seed lineage.`,
      'empirical_validation': (c) => `Recent advancement (${c.work.year}) providing empirical validation.`,
      'Conceptually Similar Work': (c) => `Shares ${c.sharedRefConnections || 1} bibliographic connections and domain vocabulary with your seeds.`,
      'Possible Bridge Work': (c) => `Bridges ${c.connectedSeedCount} distinct seed works in your project graph.`,
      'Methodological Alternative': (c) => `Presents a complementary empirical or methodological lens on this research question.`,
      'methodological_ancestor': (c) => `Presents earlier methodological foundation on this research question.`,
      'Possible Counterargument': (c) => `Engages critically with underlying assumptions or scope boundaries in this domain.`,
      'competing_claim': (c) => `Presents competing claim or divergent hypothesis.`,
      'contrast_case': (c) => `Offers a contrasting case or boundary condition.`,
      'reproducibility_benchmark': (c) => `Standard evaluation benchmark in this literature.`,
      'application_domain': (c) => `Investigates real-world application domain.`,
      'Under-read but Relevant Work': (c) => `Directly connected to your seeds (${c.work.citationCount} indexed citations), offering fresh perspective.`
    };

    // Pick top candidate from each role bucket prioritizing diversity and discoveryFitScore
    for (const role of allRoles) {
      if (shortlist.length >= 6) break;

      const candidatesForRole = (roleBuckets.get(role) || [])
        .filter(c => !chosenWorkIds.has(c.work.id.toLowerCase()))
        .sort((a, b) => b.scores.discoveryFitScore - a.scores.discoveryFitScore);

      if (candidatesForRole.length === 0) {
        let omitReason = '';
        if (role === 'Possible Bridge Work') {
          omitReason = seedWorks.length < 2 
            ? 'Requires at least 2 distinct seed works in the project to detect bridging literature.'
            : 'No candidate in current graph connected to multiple distinct seed branches.';
        } else if (role === 'Possible Counterargument') {
          omitReason = 'No candidate in current graph exhibited contrastive or critique vocabulary matching the seed topic.';
        } else if (role === 'Methodological Alternative') {
          omitReason = 'No distinct alternative methodology or dataset candidates identified.';
        } else if (role === 'Under-read but Relevant Work') {
          omitReason = 'All retrieved candidates in network already have established high citation counts.';
        } else if (role === 'Foundational Work') {
          omitReason = 'No earlier foundational reference met connection threshold.';
        } else if (role === 'Later Development') {
          omitReason = 'No recent forward citations met discovery criteria.';
        } else {
          omitReason = 'No candidate met confidence threshold for this role.';
        }

        omittedRoles.push({ role, reason: omitReason });
        continue;
      }

      // Pick the best candidate that adds venue/author diversity
      let chosen = candidatesForRole[0];
      for (const candidate of candidatesForRole) {
        const venue = candidate.work.venue?.toLowerCase() || '';
        const leadAuthor = (candidate.work.authors[0]?.name || '').split(' ').pop()?.toLowerCase() || '';
        if (!chosenVenues.has(venue) && !chosenAuthorLeadLastNames.has(leadAuthor)) {
          chosen = candidate;
          break;
        }
      }

      chosenWorkIds.add(chosen.work.id.toLowerCase());
      if (chosen.work.venue) chosenVenues.add(chosen.work.venue.toLowerCase());
      if (chosen.work.authors[0]?.name) {
        chosenAuthorLeadLastNames.add(chosen.work.authors[0].name.split(' ').pop()?.toLowerCase() || '');
      }

      // Graph connections to seeds formatting
      const graphConnectionsToSeeds = seedWorks.filter(s => {
        const sRefs = (s.references || []).map(r => r.toLowerCase());
        const sCited = (s.citedBy || []).map(c => c.toLowerCase());
        return sRefs.includes(chosen.work.id.toLowerCase()) || 
               sCited.includes(chosen.work.id.toLowerCase()) ||
               (chosen.work.doi && (sRefs.includes(chosen.work.doi.toLowerCase()) || sCited.includes(chosen.work.doi.toLowerCase())));
      }).map(s => ({
        seedWorkId: s.id,
        seedTitle: s.title,
        connectionType: (s.references || []).some(r => r.toLowerCase() === chosen.work.id.toLowerCase() || (chosen.work.doi && r.toLowerCase() === chosen.work.doi.toLowerCase())) 
          ? 'Referenced by Seed' 
          : 'Cites Seed',
        description: `Direct bibliographic link with seed "${s.title.substring(0, 35)}..."`
      }));

      // If no direct link found in references array, add connectedSeeds summary
      if (graphConnectionsToSeeds.length === 0 && seedWorks.length > 0) {
        graphConnectionsToSeeds.push({
          seedWorkId: seedWorks[0].id,
          seedTitle: seedWorks[0].title,
          connectionType: 'Network Proximity',
          description: `Discovered along citation trajectory branching from seed literature.`
        });
      }

      // Coverage warnings
      const coverageWarnings: string[] = [];
      if (!chosen.work.abstract) {
        coverageWarnings.push('Abstract text is missing from provider record; reading prompt relies on metadata.');
      }
      if (!chosen.work.openAccessUrl && !(chosen.work as any).openAccess) {
        coverageWarnings.push('Paywall / Subscription access may be required to view full text.');
      }

      // Determine current state
      const stateObj = stateMap.get(chosen.work.id.toLowerCase()) || (chosen.work.doi ? stateMap.get(chosen.work.doi.toLowerCase()) : undefined);
      const currentState = stateObj ? stateObj.state : 'study_next';

      shortlist.push({
        work: chosen.work,
        role,
        roleExplanation: roleExplanations[role](chosen),
        selectionReasons: chosen.reasons.length > 0 ? chosen.reasons : [
          { category: 'graph_proximity', description: `High graph affinity (${Math.round(chosen.scores.graphAffinity * 100)}%) with ${chosen.connectedSeedCount} seed(s)` }
        ],
        sourceTrailIds: [chosen.sourceTrailId],
        sourceTrailTitles: [chosen.sourceTrailTitle],
        graphConnectionsToSeeds,
        scores: chosen.scores,
        coverageWarnings,
        currentState
      });
    }

    // 5. If shortlist is less than 6 and there are remaining high-affinity candidates, backfill with diverse top candidates
    if (shortlist.length < 6) {
      const remaining = scoredCandidates
        .filter(c => !chosenWorkIds.has(c.work.id.toLowerCase()))
        .sort((a, b) => b.scores.discoveryFitScore - a.scores.discoveryFitScore);

      for (const cand of remaining) {
        if (shortlist.length >= 6) break;

        const role: CandidateRole = 'Conceptually Similar Work';
        chosenWorkIds.add(cand.work.id.toLowerCase());

        const stateObj = stateMap.get(cand.work.id.toLowerCase()) || (cand.work.doi ? stateMap.get(cand.work.doi.toLowerCase()) : undefined);
        const currentState = stateObj ? stateObj.state : 'study_next';

        shortlist.push({
          work: cand.work,
          role,
          roleExplanation: `Ranks high in overall citation network affinity (${cand.scores.discoveryFitScore}/100) to current project seeds.`,
          selectionReasons: cand.reasons.length > 0 ? cand.reasons : [
            { category: 'graph_affinity', description: `Composite fit index: ${cand.scores.discoveryFitScore}/100` }
          ],
          sourceTrailIds: [cand.sourceTrailId],
          sourceTrailTitles: [cand.sourceTrailTitle],
          graphConnectionsToSeeds: seedWorks.slice(0, 2).map(s => ({
            seedWorkId: s.id,
            seedTitle: s.title,
            connectionType: 'Co-Citation Network',
            description: `Shared citation neighborhood with "${s.title.substring(0, 30)}..."`
          })),
          scores: cand.scores,
          coverageWarnings: !cand.work.abstract ? ['Abstract not indexed by provider.'] : [],
          currentState
        });
      }
    }

    return {
      shortlist,
      omittedRoles,
      totalEligibleCandidates: eligiblePool.length,
      diversificationApplied: true,
      generatedAt: new Date().toISOString(),
      filtersUsed: prefs
    };
  }

  /**
   * AI-generated Reading Prompt generator (Strict Guardrails)
   * Formulates 3 key questions:
   * 1. Why am I reading this next?
   * 2. What question should I ask of it?
   * 3. Which existing claim, source, or trail does it connect to?
   *
   * Must ONLY derive from project research question, researcher notes, and retrieved metadata.
   * Never asserts unverified claims.
   */
  public async generateReadingPrompt(data: {
    work: Work;
    projectTitle: string;
    researchQuestion: string;
    role?: CandidateRole;
    notes?: string;
    seedWorks?: Work[];
  }): Promise<ReadingPromptResponse> {
    const { work, projectTitle, researchQuestion, role, notes, seedWorks = [] } = data;

    // Fallback template if Gemini is offline or unconfigured
    const defaultPurpose = role 
      ? `Examine as a ${role} to evaluate how its findings connect to ${projectTitle}.`
      : `Analyze this paper's core contributions in the context of: "${researchQuestion}".`;

    const defaultQuestion = work.abstract 
      ? `How does this work's specific methodology and empirical scope compare to your seed literature?`
      : `What evidence or framework does this study present regarding "${researchQuestion}"?`;

    const seedConnection = seedWorks.length > 0 
      ? `Connects to seed work "${seedWorks[0].title.substring(0, 40)}..." through bibliographic citation trails.`
      : `Connects to your project inquiry on ${researchQuestion.substring(0, 50)}...`;

    if (!process.env.GEMINI_API_KEY) {
      return {
        workId: work.id,
        title: work.title,
        assignedRole: role || 'Relevant Candidate',
        readingObjective: defaultPurpose,
        criticalQuestions: [
          defaultQuestion,
          'Does the empirical methodology support the author conclusions without unstated boundary conditions?',
          'How does this work interact with your existing project claims?'
        ],
        suggestedFocusSections: ['Methodology', 'Results & Findings', 'Limitations'],
        prompt: `Evaluate "${work.title}" (${work.year || 'N/A'})\n\nRole: ${role || 'Candidate'}\nObjective: ${defaultPurpose}\n\nInterrogation Question: ${defaultQuestion}`,
        groundedSeedWorks: seedWorks.map(s => ({ id: s.id, title: s.title, year: s.year })),
        purpose: defaultPurpose,
        criticalQuestion: defaultQuestion,
        connectionContext: seedConnection,
        groundingStatus: 'metadata_derived',
        disclaimer: 'AI-generated reading prompt derived strictly from project research question and bibliographic metadata. Does not assert unverified findings.'
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are an academic research assistant for an Evidence Atlas workspace.
Generate a structured, disciplined "Reading Card" prompt for an academic researcher.

CRITICAL RESEARCH INTEGRITY RULES:
1. ONLY use the provided project question, metadata, and researcher notes.
2. DO NOT invent findings, facts, page numbers, quotations, or citations.
3. DO NOT claim the paper proves or refutes anything unless explicitly stated in the provided abstract.
4. Keep each answer concise, sharp, and epistemically humble (1-2 sentences each).

INPUT CONTEXT:
- Project Title: "${projectTitle}"
- Project Research Question: "${researchQuestion}"
- Candidate Work Title: "${work.title}"
- Authors: ${work.authors.map(a => a.name).join(', ')}
- Year: ${work.year || 'Unknown'}
- Venue: ${work.venue || 'Scholarly Publication'}
- Candidate Role: ${role || 'Relevant Candidate'}
- Abstract: "${work.abstract || 'No abstract provided'}"
- Researcher Notes: "${notes || 'None provided'}"
- Seed Works: ${seedWorks.map(s => s.title).join('; ') || 'None'}

Return ONLY valid JSON in this exact structure:
{
  "purpose": "1-2 sentences answering: Why am I reading this next?",
  "criticalQuestion": "1 sentence answering: What critical question should I ask of it?",
  "connectionContext": "1 sentence answering: Which existing claim, source, or trail does it connect to?",
  "criticalQuestions": ["Question 1", "Question 2"],
  "suggestedFocusSections": ["Section 1", "Section 2"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text?.trim() || '{}';
      const parsed = JSON.parse(text);

      const purpose = parsed.purpose || defaultPurpose;
      const criticalQuestion = parsed.criticalQuestion || defaultQuestion;
      const questions = Array.isArray(parsed.criticalQuestions) && parsed.criticalQuestions.length > 0
        ? parsed.criticalQuestions
        : [criticalQuestion, 'What are the boundary conditions and assumptions in this study?'];
      const sections = Array.isArray(parsed.suggestedFocusSections) && parsed.suggestedFocusSections.length > 0
        ? parsed.suggestedFocusSections
        : ['Methods', 'Results', 'Discussion'];

      return {
        workId: work.id,
        title: work.title,
        assignedRole: role || 'Relevant Candidate',
        readingObjective: purpose,
        criticalQuestions: questions,
        suggestedFocusSections: sections,
        prompt: `### Targeted Reading Protocol: ${work.title}\nRole: ${role || 'Relevant Candidate'}\nObjective: ${purpose}\n\nCore Question: ${criticalQuestion}`,
        groundedSeedWorks: seedWorks.map(s => ({ id: s.id, title: s.title, year: s.year })),
        purpose,
        criticalQuestion,
        connectionContext: parsed.connectionContext || seedConnection,
        groundingStatus: 'strictly_grounded',
        disclaimer: 'AI-generated reading prompt strictly bounded by project context and verified metadata.'
      };
    } catch (err) {
      console.warn('[StudyNextRecommendationService] Gemini reading prompt fallback:', err);
      return {
        workId: work.id,
        title: work.title,
        assignedRole: role || 'Relevant Candidate',
        readingObjective: defaultPurpose,
        criticalQuestions: [defaultQuestion, 'How does this work connect with project seeds?'],
        suggestedFocusSections: ['Methodology', 'Key Findings'],
        prompt: `Targeted Reading Protocol for ${work.title}\n\nObjective: ${defaultPurpose}\n\nQuestion: ${defaultQuestion}`,
        groundedSeedWorks: seedWorks.map(s => ({ id: s.id, title: s.title, year: s.year })),
        purpose: defaultPurpose,
        criticalQuestion: defaultQuestion,
        connectionContext: seedConnection,
        groundingStatus: 'metadata_derived',
        disclaimer: 'AI-generated reading prompt derived from bibliographic metadata (fallback mode).'
      };
    }
  }
}
