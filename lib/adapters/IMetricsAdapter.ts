/**
 * Interface for metrics backends
 * Can be implemented for Prometheus, DataDog, CloudWatch, etc.
 */

export interface MetricTags {
  [key: string]: string | number;
}

export interface IMetricsAdapter {
  /**
   * Adapter name for identification
   */
  readonly name: string;

  /**
   * Record a counter increment
   */
  incrementCounter(name: string, value: number, tags?: MetricTags): Promise<void>;

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number, tags?: MetricTags): Promise<void>;

  /**
   * Record a histogram/timing value
   */
  recordTiming(name: string, value: number, tags?: MetricTags): Promise<void>;

  /**
   * Flush any buffered metrics
   */
  flush(): Promise<void>;
}
