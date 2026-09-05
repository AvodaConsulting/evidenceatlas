export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface ProviderHealthStats {
  providerName: string;
  circuitState: CircuitState;
  consecutiveFailures: number;
  totalSuccesses: number;
  totalFailures: number;
  lastFailureTime?: string;
  lastSuccessTime?: string;
  lastErrorMessage?: string;
  avgLatencyMs: number;
  isAvailable: boolean;
}

export class ProviderHealthService {
  private static instance: ProviderHealthService;
  
  private states: Map<string, {
    circuitState: CircuitState;
    consecutiveFailures: number;
    totalSuccesses: number;
    totalFailures: number;
    lastFailureTime?: number;
    lastSuccessTime?: number;
    lastErrorMessage?: string;
    latencies: number[];
    openedAt?: number;
  }> = new Map();

  private readonly failureThreshold = 4; // open circuit after 4 consecutive failures
  private readonly cooldownPeriodMs = 30000; // 30s before testing HALF_OPEN
  private readonly maxLatenciesTracked = 20;

  private constructor() {
    this.initProvider('OpenAlex');
    this.initProvider('Crossref');
  }

  public static getInstance(): ProviderHealthService {
    if (!ProviderHealthService.instance) {
      ProviderHealthService.instance = new ProviderHealthService();
    }
    return ProviderHealthService.instance;
  }

  private initProvider(provider: string) {
    if (!this.states.has(provider)) {
      this.states.set(provider, {
        circuitState: 'CLOSED',
        consecutiveFailures: 0,
        totalSuccesses: 0,
        totalFailures: 0,
        latencies: []
      });
    }
  }

  public canAttempt(provider: string): boolean {
    this.initProvider(provider);
    const state = this.states.get(provider)!;

    if (state.circuitState === 'CLOSED') {
      return true;
    }

    if (state.circuitState === 'OPEN') {
      const now = Date.now();
      if (state.openedAt && now - state.openedAt >= this.cooldownPeriodMs) {
        state.circuitState = 'HALF_OPEN';
        return true;
      }
      return false;
    }

    // HALF_OPEN allows single probe request
    return true;
  }

  public recordSuccess(provider: string, latencyMs: number) {
    this.initProvider(provider);
    const state = this.states.get(provider)!;
    state.consecutiveFailures = 0;
    state.totalSuccesses += 1;
    state.lastSuccessTime = Date.now();
    state.circuitState = 'CLOSED';
    state.openedAt = undefined;

    state.latencies.push(latencyMs);
    if (state.latencies.length > this.maxLatenciesTracked) {
      state.latencies.shift();
    }
  }

  public recordFailure(provider: string, error: Error | string, latencyMs?: number) {
    this.initProvider(provider);
    const state = this.states.get(provider)!;
    state.consecutiveFailures += 1;
    state.totalFailures += 1;
    state.lastFailureTime = Date.now();
    state.lastErrorMessage = typeof error === 'string' ? error : error.message;

    if (latencyMs) {
      state.latencies.push(latencyMs);
      if (state.latencies.length > this.maxLatenciesTracked) {
        state.latencies.shift();
      }
    }

    if (state.circuitState === 'HALF_OPEN' || state.consecutiveFailures >= this.failureThreshold) {
      state.circuitState = 'OPEN';
      state.openedAt = Date.now();
    }
  }

  public getStatus(provider: string): ProviderHealthStats {
    this.initProvider(provider);
    const state = this.states.get(provider)!;
    const avgLatency = state.latencies.length > 0 
      ? Math.round(state.latencies.reduce((a, b) => a + b, 0) / state.latencies.length) 
      : 0;

    const isAvailable = this.canAttempt(provider);

    return {
      providerName: provider,
      circuitState: state.circuitState,
      consecutiveFailures: state.consecutiveFailures,
      totalSuccesses: state.totalSuccesses,
      totalFailures: state.totalFailures,
      lastFailureTime: state.lastFailureTime ? new Date(state.lastFailureTime).toISOString() : undefined,
      lastSuccessTime: state.lastSuccessTime ? new Date(state.lastSuccessTime).toISOString() : undefined,
      lastErrorMessage: state.lastErrorMessage,
      avgLatencyMs: avgLatency,
      isAvailable
    };
  }

  public getAllStatuses(): Record<string, ProviderHealthStats> {
    const result: Record<string, ProviderHealthStats> = {};
    for (const [provider] of this.states.entries()) {
      result[provider] = this.getStatus(provider);
    }
    return result;
  }

  /**
   * Helper to execute fetch with exponential backoff & respect for Retry-After header
   */
  public async executeWithRetry<T>(
    provider: string,
    operation: () => Promise<Response>,
    maxRetries: number = 2
  ): Promise<Response> {
    if (!this.canAttempt(provider)) {
      throw new Error(`Provider [${provider}] circuit breaker is OPEN due to repeated errors.`);
    }

    let attempt = 0;
    const startTime = Date.now();

    while (attempt <= maxRetries) {
      try {
        const response = await operation();
        
        if (response.status === 429) {
          // Rate limited -> check Retry-After
          const retryAfterHeader = response.headers.get('retry-after');
          const waitSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) || 2 : Math.pow(2, attempt) + Math.random();
          
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, waitSec * 1000));
            attempt++;
            continue;
          } else {
            const err = new Error(`Provider [${provider}] rate limit exceeded (429).`);
            this.recordFailure(provider, err, Date.now() - startTime);
            throw err;
          }
        }

        if (!response.ok && response.status >= 500) {
          if (attempt < maxRetries) {
            const backoffMs = (Math.pow(2, attempt) * 500) + Math.floor(Math.random() * 200);
            await new Promise(r => setTimeout(r, backoffMs));
            attempt++;
            continue;
          } else {
            const err = new Error(`Provider [${provider}] returned server error HTTP ${response.status}`);
            this.recordFailure(provider, err, Date.now() - startTime);
            throw err;
          }
        }

        const latency = Date.now() - startTime;
        this.recordSuccess(provider, latency);
        return response;
      } catch (err: any) {
        if (attempt >= maxRetries) {
          const latency = Date.now() - startTime;
          this.recordFailure(provider, err, latency);
          throw err;
        }
        attempt++;
        const backoffMs = (Math.pow(2, attempt) * 400) + Math.floor(Math.random() * 100);
        await new Promise(r => setTimeout(r, backoffMs));
      }
    }

    throw new Error(`Provider [${provider}] execution failed after ${maxRetries} retries`);
  }
}
