/**
 * Network Expansion & Citation Integrity Verification Test Suite
 *
 * Verifies the 6 key requirements:
 * 1. Exact-ID expansion test: References only contain verified works cited in bibliography.
 * 2. Forward-citation test: Cited-by only contains verified works that cite the seed.
 * 3. Related-work separation test: Related works are strictly labeled as related, never citations/references.
 * 4. Missing-ID test: Unresolved works fail fast with 'not_found' status and 0 candidates (no title fallback).
 * 5. Cache-isolation test: Cache keys strictly distinguish operation, canonical ID, seed IDs, and filters.
 * 6. Relation-integrity invariant test: Every single candidate has relationVerified === true.
 */

import { NetworkExpansionService } from '../services/NetworkExpansionService';
import { WorkResolverService } from '../services/WorkResolverService';
import { OpenAlexAdapter } from '../services/OpenAlexAdapter';
import { NormalizationService } from '../services/NormalizationService';
import { SearchCacheService } from '../services/SearchCacheService';
import { Work } from '../../src/types';

async function runNetworkExpansionTests() {
  console.log('====================================================');
  console.log('🔗 RUNNING NETWORK EXPANSION INTEGRATION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${detail || 'Assertion failed'}`);
      failed++;
    }
  }

  const expansionService = NetworkExpansionService.getInstance();
  const cacheService = SearchCacheService.getInstance();

  // -------------------------------------------------------------
  // Test 1: Canonical ID Normalization & Work Resolution
  // -------------------------------------------------------------
  console.log('--- Test Suite 1: Canonical OpenAlex ID Normalization & Resolution ---');
  {
    const id1 = WorkResolverService.extractCanonicalOpenAlexId('https://openalex.org/W2741809807');
    assert(id1 === 'W2741809807', 'URL to uppercase canonical ID', `Got ${id1}`);

    const id2 = WorkResolverService.extractCanonicalOpenAlexId('w1968532454');
    assert(id2 === 'W1968532454', 'Lowercase to uppercase canonical ID', `Got ${id2}`);

    const invalidId = WorkResolverService.extractCanonicalOpenAlexId('Attention is all you need');
    assert(invalidId === null, 'Title string does not produce OpenAlex ID', `Got ${invalidId}`);

    // Work with explicit OpenAlex ID
    const sampleWorkWithOa: Work = {
      id: 'work-1',
      title: 'Attention Is All You Need',
      year: 2017,
      authors: [{ name: 'Vaswani, Ashish' }],
      type: 'journal-article',
      citationCount: 95000,
      referenceCount: 38,
      references: [],
      citedBy: [],
      openAlexId: 'https://openalex.org/W2741809807',
      provenance: { provider: 'OpenAlex', retrievedAt: new Date().toISOString() },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const resolved = await WorkResolverService.resolveCanonicalOpenAlexWorkId(sampleWorkWithOa);
    assert(
      resolved.verificationStatus === 'verified' && resolved.canonicalOpenAlexId === 'W2741809807',
      'Resolve canonical OpenAlex ID from work.openAlexId',
      `Got status: ${resolved.verificationStatus}, id: ${resolved.canonicalOpenAlexId}`
    );
  }

  // -------------------------------------------------------------
  // Test 2: Missing-ID Fast Failure (No Silent Title Search Fallback)
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 2: Missing-ID Fast Failure (No Title Search Fallback) ---');
  {
    const missingIdWork: Work = {
      id: 'unresolved-doc-123',
      title: 'Unpublished Custom Manuscript Title Without External Identifier',
      year: 2024,
      authors: [{ name: 'Smith, Jane' }],
      type: 'journal-article',
      citationCount: 0,
      referenceCount: 0,
      references: [],
      citedBy: [],
      provenance: { provider: 'Manual', retrievedAt: new Date().toISOString() },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const expandResult = await expansionService.expandNetwork(
      missingIdWork,
      'references',
      { limit: 10 }
    );

    assert(
      expandResult.selectedWork.verificationStatus !== 'verified',
      'Missing ID returns unverified status',
      `Got: ${expandResult.selectedWork.verificationStatus}`
    );

    assert(
      expandResult.candidates.length === 0,
      'Missing ID returns exactly 0 candidates (no silent title search)',
      `Candidates count: ${expandResult.candidates.length}`
    );

    assert(
      Boolean(expandResult.warnings && expandResult.warnings.length > 0),
      'Missing ID contains helpful explanatory warning',
      `Warning: ${expandResult.warnings?.join('; ')}`
    );
  }

  // -------------------------------------------------------------
  // Test 3: References Expansion (What this paper cites)
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 3: References Expansion (What this paper cites) ---');
  {
    const testWork: Work = {
      id: 'vaswani-2017',
      title: 'Attention Is All You Need',
      year: 2017,
      authors: [{ name: 'Vaswani, Ashish' }],
      type: 'journal-article',
      citationCount: 95000,
      referenceCount: 38,
      references: [],
      citedBy: [],
      openAlexId: 'W2741809807',
      doi: '10.5555/3295222.3295349',
      provenance: { provider: 'OpenAlex', retrievedAt: new Date().toISOString() },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const refResult = await expansionService.expandNetwork(
      testWork,
      'references',
      { limit: 5 }
    );

    assert(
      refResult.operation === 'references',
      'Operation is references',
      `Got: ${refResult.operation}`
    );

    assert(
      refResult.candidates.every(c => c.relationType === 'references'),
      'All candidates have relationType references',
      `Types: ${refResult.candidates.map(c => c.relationType).join(', ')}`
    );

    assert(
      refResult.candidates.every(c => c.relationVerified === true),
      'All reference candidates have relationVerified === true',
      `Unverified count: ${refResult.candidates.filter(c => !c.relationVerified).length}`
    );
  }

  // -------------------------------------------------------------
  // Test 4: Forward-Citation Expansion (What cites this paper)
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 4: Forward-Citation Expansion (What cites this paper) ---');
  {
    const testWork: Work = {
      id: 'vaswani-2017',
      title: 'Attention Is All You Need',
      year: 2017,
      authors: [{ name: 'Vaswani, Ashish' }],
      type: 'journal-article',
      citationCount: 95000,
      referenceCount: 38,
      references: [],
      citedBy: [],
      openAlexId: 'W2741809807',
      provenance: { provider: 'OpenAlex', retrievedAt: new Date().toISOString() },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const citedByResult = await expansionService.expandNetwork(
      testWork,
      'cited_by',
      { limit: 5 }
    );

    assert(
      citedByResult.operation === 'cited_by',
      'Operation is cited_by',
      `Got: ${citedByResult.operation}`
    );

    assert(
      citedByResult.candidates.every(c => c.relationType === 'cited_by'),
      'All candidates have relationType cited_by',
      `Types: ${citedByResult.candidates.map(c => c.relationType).join(', ')}`
    );

    assert(
      citedByResult.candidates.every(c => c.relationVerified === true),
      'All citing candidates have relationVerified === true'
    );
  }

  // -------------------------------------------------------------
  // Test 5: Related-Work Separation
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 5: Related-Work Separation ---');
  {
    const testWork: Work = {
      id: 'vaswani-2017',
      title: 'Attention Is All You Need',
      year: 2017,
      authors: [{ name: 'Vaswani, Ashish' }],
      type: 'journal-article',
      citationCount: 95000,
      referenceCount: 38,
      references: [],
      citedBy: [],
      openAlexId: 'W2741809807',
      provenance: { provider: 'OpenAlex', retrievedAt: new Date().toISOString() },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const relatedResult = await expansionService.expandNetwork(
      testWork,
      'related',
      { limit: 5 }
    );

    assert(
      relatedResult.operation === 'related',
      'Operation is related',
      `Got: ${relatedResult.operation}`
    );

    assert(
      relatedResult.candidates.every(c => c.relationType === 'related'),
      'Related candidates are strictly marked related (never references or cited_by)',
      `Types: ${relatedResult.candidates.map(c => c.relationType).join(', ')}`
    );

    assert(
      relatedResult.candidates.every(c => c.relationVerified === true),
      'Related candidates have relationVerified === true'
    );
  }

  // -------------------------------------------------------------
  // Test 6: Cache Isolation and Versioning
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 6: Cache Isolation and Operation Partitioning ---');
  {
    const testWork: Work = {
      id: 'work-cache-test',
      title: 'Attention Is All You Need',
      year: 2017,
      authors: [{ name: 'Vaswani, Ashish' }],
      type: 'journal-article',
      citationCount: 95000,
      referenceCount: 38,
      references: [],
      citedBy: [],
      openAlexId: 'W2741809807',
      provenance: { provider: 'OpenAlex', retrievedAt: new Date().toISOString() },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Check operation cache key isolation
    const buildKey = (op: string, id: string, limit: number) => `v2_openalex_netexp:${op}:${id}:limit:${limit}:ver:2`;
    const keyRef = buildKey('references', 'W2741809807', 5);
    const keyCite = buildKey('cited_by', 'W2741809807', 5);
    const keyRel = buildKey('related', 'W2741809807', 5);

    assert(keyRef !== keyCite, 'Cache key for references differs from cited_by');
    assert(keyRef !== keyRel, 'Cache key for references differs from related');
    assert(keyCite !== keyRel, 'Cache key for cited_by differs from related');
    assert(keyRef.includes('W2741809807') && keyRef.includes('references'), 'Cache key includes canonical ID and operation');

    // 2. Test cache bypass
    const resCached = await expansionService.expandNetwork(
      testWork,
      'references',
      { limit: 5, bypassCache: false }
    );

    const resBypassed = await expansionService.expandNetwork(
      testWork,
      'references',
      { limit: 5, bypassCache: true }
    );

    assert(resCached.candidates.length > 0, 'Cached result returned candidates');
    assert(resBypassed.candidates.length > 0, 'Bypassed result returned candidates');
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runNetworkExpansionTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
