/**
 * Metrics and instrumentation utilities
 */

import { logger } from './logger';

export interface MetricLabels {
  [key: string]: string | number;
}

interface MetricEntry {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  labels?: MetricLabels;
  timestamp: number;
}

/**
 * In-memory metrics store
 * In production, this could be replaced with Prometheus, DataDog, etc.
 */
class MetricsStore {
  private metrics: Map<string, MetricEntry[]> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();

  /**
   * Record a counter increment
   */
  incrementCounter(name: string, value: number = 1, labels?: MetricLabels) {
    const key = this.buildKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    this.recordMetric({
      name,
      type: 'counter',
      value,
      labels,
      timestamp: Date.now(),
    });

    logger.debug('Metric counter incremented', { name, value, labels });
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number, labels?: MetricLabels) {
    const key = this.buildKey(name, labels);
    this.gauges.set(key, value);

    this.recordMetric({
      name,
      type: 'gauge',
      value,
      labels,
      timestamp: Date.now(),
    });

    logger.debug('Metric gauge set', { name, value, labels });
  }

  /**
   * Record a histogram value (for timing, sizes, etc.)
   */
  recordHistogram(name: string, value: number, labels?: MetricLabels) {
    this.recordMetric({
      name,
      type: 'histogram',
      value,
      labels,
      timestamp: Date.now(),
    });

    logger.debug('Metric histogram recorded', { name, value, labels });
  }

  /**
   * Get counter value
   */
  getCounter(name: string, labels?: MetricLabels): number {
    const key = this.buildKey(name, labels);
    return this.counters.get(key) || 0;
  }

  /**
   * Get gauge value
   */
  getGauge(name: string, labels?: MetricLabels): number {
    const key = this.buildKey(name, labels);
    return this.gauges.get(key) || 0;
  }

  /**
   * Get histogram entries
   */
  getHistogram(name: string, labels?: MetricLabels): number[] {
    const entries = this.metrics.get(name) || [];
    return entries
      .filter(e => e.type === 'histogram' && this.labelsMatch(e.labels, labels))
      .map(e => e.value);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, MetricEntry[]> {
    return new Map(this.metrics);
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics.clear();
    this.counters.clear();
    this.gauges.clear();
  }

  private buildKey(name: string, labels?: MetricLabels): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  private labelsMatch(a?: MetricLabels, b?: MetricLabels): boolean {
    if (!a && !b) return true;
    if (!a || !b) return false;

    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();

    if (keysA.length !== keysB.length) return false;

    return keysA.every((key, i) => key === keysB[i] && a[key] === b[key]);
  }

  private recordMetric(entry: MetricEntry) {
    const entries = this.metrics.get(entry.name) || [];
    entries.push(entry);

    // Keep only last 1000 entries per metric to prevent memory bloat
    if (entries.length > 1000) {
      entries.shift();
    }

    this.metrics.set(entry.name, entries);
  }
}

// Singleton instance
const metricsStore = new MetricsStore();

/**
 * Public metrics API
 */
export const metrics = {
  /**
   * Increment a counter
   */
  incrementCounter(name: string, value?: number, labels?: MetricLabels) {
    metricsStore.incrementCounter(name, value, labels);
  },

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number, labels?: MetricLabels) {
    metricsStore.setGauge(name, value, labels);
  },

  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number, labels?: MetricLabels) {
    metricsStore.recordHistogram(name, value, labels);
  },

  /**
   * Time an async operation and record duration
   */
  async time<T>(
    name: string,
    fn: () => Promise<T>,
    labels?: MetricLabels
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      metricsStore.recordHistogram(name, duration, labels);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      metricsStore.recordHistogram(name, duration, { ...labels, status: 'error' });
      throw error;
    }
  },

  /**
   * Get counter value
   */
  getCounter(name: string, labels?: MetricLabels): number {
    return metricsStore.getCounter(name, labels);
  },

  /**
   * Get gauge value
   */
  getGauge(name: string, labels?: MetricLabels): number {
    return metricsStore.getGauge(name, labels);
  },

  /**
   * Get histogram statistics
   */
  getHistogramStats(name: string, labels?: MetricLabels) {
    const values = metricsStore.getHistogram(name, labels);
    if (values.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0,
      };
    }

    const sorted = values.slice().sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  },

  /**
   * Get all metrics (for debugging/monitoring endpoints)
   */
  getAllMetrics() {
    return metricsStore.getAllMetrics();
  },

  /**
   * Reset all metrics
   */
  reset() {
    metricsStore.reset();
  },
};

/**
 * Common metric names (constants for consistency)
 */
export const MetricNames = {
  // API metrics
  API_REQUEST_DURATION: 'api.request.duration',
  API_REQUEST_COUNT: 'api.request.count',
  API_ERROR_COUNT: 'api.error.count',

  // Persona metrics
  PERSONA_RESPONSE_DURATION: 'persona.response.duration',
  PERSONA_RESPONSE_COUNT: 'persona.response.count',
  PERSONA_TOKENS_USED: 'persona.tokens.used',

  // Database metrics
  DB_QUERY_DURATION: 'db.query.duration',
  DB_QUERY_COUNT: 'db.query.count',
  DB_ERROR_COUNT: 'db.error.count',

  // OpenAI metrics
  OPENAI_REQUEST_DURATION: 'openai.request.duration',
  OPENAI_REQUEST_COUNT: 'openai.request.count',
  OPENAI_ERROR_COUNT: 'openai.error.count',
  OPENAI_TOKENS_TOTAL: 'openai.tokens.total',

  // Scenario metrics
  SCENARIO_EXECUTION_DURATION: 'scenario.execution.duration',
  SCENARIO_EXECUTION_COUNT: 'scenario.execution.count',
} as const;
