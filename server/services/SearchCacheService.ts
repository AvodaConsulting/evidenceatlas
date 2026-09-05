interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttlMs: number;
  staleTtlMs: number;
}

export class SearchCacheService {
  private static instance: SearchCacheService;

  // Metadata cache (30 days = 30 * 24 * 60 * 60 * 1000 ms)
  private workCache: Map<string, CacheEntry<any>> = new Map();
  private readonly WORK_TTL_MS = 30 * 24 * 60 * 60 * 1000;
  private readonly WORK_STALE_TTL_MS = 60 * 24 * 60 * 60 * 1000;

  // Search query cache (12 hours fresh, 7 days stale)
  private searchCache: Map<string, CacheEntry<any>> = new Map();
  private readonly SEARCH_TTL_MS = 12 * 60 * 60 * 1000;
  private readonly SEARCH_STALE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

  // Graph cache (7 days = 7 * 24 * 60 * 60 * 1000 ms)
  private graphCache: Map<string, CacheEntry<any>> = new Map();
  private readonly GRAPH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
  private readonly GRAPH_STALE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

  // In-flight promise coalescing
  private inFlightRequests: Map<string, Promise<any>> = new Map();

  private constructor() {}

  public static getInstance(): SearchCacheService {
    if (!SearchCacheService.instance) {
      SearchCacheService.instance = new SearchCacheService();
    }
    return SearchCacheService.instance;
  }

  /**
   * Request coalescer: runs fetcher once for identical concurrent keys
   */
  public async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    cacheType: 'work' | 'search' | 'graph' = 'work',
    revalidateCallback?: (freshData: T) => void
  ): Promise<T> {
    const map = cacheType === 'work' ? this.workCache : cacheType === 'search' ? this.searchCache : this.graphCache;
    const ttl = cacheType === 'work' ? this.WORK_TTL_MS : cacheType === 'search' ? this.SEARCH_TTL_MS : this.GRAPH_TTL_MS;
    const staleTtl = cacheType === 'work' ? this.WORK_STALE_TTL_MS : cacheType === 'search' ? this.SEARCH_STALE_TTL_MS : this.GRAPH_STALE_TTL_MS;

    const cached = map.get(key);
    const now = Date.now();

    if (cached) {
      const age = now - cached.cachedAt;
      if (age < ttl) {
        // Fresh hit
        return cached.data;
      }
      if (age < staleTtl) {
        // Stale hit: return stale data immediately and trigger background revalidation
        this.triggerBackgroundRevalidate(key, fetcher, map, ttl, staleTtl, revalidateCallback);
        return cached.data;
      }
    }

    // In-flight deduplication
    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key) as Promise<T>;
    }

    const promise = (async () => {
      try {
        const result = await fetcher();
        map.set(key, {
          data: result,
          cachedAt: Date.now(),
          ttlMs: ttl,
          staleTtlMs: staleTtl
        });
        return result;
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, promise);
    return promise;
  }

  private triggerBackgroundRevalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    map: Map<string, CacheEntry<any>>,
    ttl: number,
    staleTtl: number,
    callback?: (freshData: T) => void
  ) {
    if (this.inFlightRequests.has(key)) return;

    const promise = (async () => {
      try {
        const fresh = await fetcher();
        map.set(key, {
          data: fresh,
          cachedAt: Date.now(),
          ttlMs: ttl,
          staleTtlMs: staleTtl
        });
        if (callback) {
          callback(fresh);
        }
      } catch (err) {
        console.warn(`[SearchCacheService] Stale revalidation error for ${key}:`, err);
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, promise);
  }

  public setWork(idOrDoi: string, work: any) {
    this.workCache.set(idOrDoi.toLowerCase(), {
      data: work,
      cachedAt: Date.now(),
      ttlMs: this.WORK_TTL_MS,
      staleTtlMs: this.WORK_STALE_TTL_MS
    });
  }

  public getWork(idOrDoi: string): any | null {
    const cached = this.workCache.get(idOrDoi.toLowerCase());
    if (cached && Date.now() - cached.cachedAt < this.WORK_STALE_TTL_MS) {
      return cached.data;
    }
    return null;
  }

  public setGraph(key: string, graph: any) {
    this.graphCache.set(key, {
      data: graph,
      cachedAt: Date.now(),
      ttlMs: this.GRAPH_TTL_MS,
      staleTtlMs: this.GRAPH_STALE_TTL_MS
    });
  }

  public getGraph(key: string): any | null {
    const cached = this.graphCache.get(key);
    if (cached && Date.now() - cached.cachedAt < this.GRAPH_STALE_TTL_MS) {
      return cached.data;
    }
    return null;
  }

  public clear() {
    this.workCache.clear();
    this.searchCache.clear();
    this.graphCache.clear();
    this.inFlightRequests.clear();
  }

  public getStats() {
    return {
      workCachedCount: this.workCache.size,
      searchCachedCount: this.searchCache.size,
      graphCachedCount: this.graphCache.size,
      inFlightCount: this.inFlightRequests.size
    };
  }
}
