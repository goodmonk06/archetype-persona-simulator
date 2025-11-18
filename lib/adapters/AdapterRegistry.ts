/**
 * Central registry for all adapters
 * Provides a plugin-like system for extensibility
 */

import type { ILLMProvider } from './ILLMProvider';
import type { INotificationAdapter } from './INotificationAdapter';
import type { IMetricsAdapter } from './IMetricsAdapter';
import { OpenAILLMProvider } from './implementations/OpenAILLMProvider';
import { NoOpNotificationAdapter } from './implementations/NoOpNotificationAdapter';
import { logger } from '../logger';

class AdapterRegistry {
  private llmProviders: Map<string, ILLMProvider> = new Map();
  private notificationAdapters: Map<string, INotificationAdapter> = new Map();
  private metricsAdapters: Map<string, IMetricsAdapter> = new Map();

  private activeLLMProvider?: string;
  private activeNotificationAdapter?: string;
  private activeMetricsAdapter?: string;

  constructor() {
    // Register default adapters
    this.registerDefaults();
  }

  private registerDefaults() {
    // Default LLM provider (OpenAI)
    this.registerLLMProvider(new OpenAILLMProvider());
    this.activeLLMProvider = 'openai';

    // Default notification adapter (NoOp)
    this.registerNotificationAdapter(new NoOpNotificationAdapter());
    this.activeNotificationAdapter = 'noop';

    logger.info('Default adapters registered', {
      llm: this.activeLLMProvider,
      notification: this.activeNotificationAdapter,
    });
  }

  // LLM Provider methods
  registerLLMProvider(provider: ILLMProvider) {
    this.llmProviders.set(provider.name, provider);
    logger.info(`LLM provider registered: ${provider.name}`);
  }

  setActiveLLMProvider(name: string) {
    if (!this.llmProviders.has(name)) {
      throw new Error(`LLM provider '${name}' not found`);
    }
    this.activeLLMProvider = name;
    logger.info(`Active LLM provider set to: ${name}`);
  }

  getLLMProvider(name?: string): ILLMProvider {
    const providerName = name || this.activeLLMProvider;
    if (!providerName) {
      throw new Error('No LLM provider configured');
    }

    const provider = this.llmProviders.get(providerName);
    if (!provider) {
      throw new Error(`LLM provider '${providerName}' not found`);
    }

    return provider;
  }

  getAllLLMProviders(): ILLMProvider[] {
    return Array.from(this.llmProviders.values());
  }

  // Notification Adapter methods
  registerNotificationAdapter(adapter: INotificationAdapter) {
    this.notificationAdapters.set(adapter.name, adapter);
    logger.info(`Notification adapter registered: ${adapter.name}`);
  }

  setActiveNotificationAdapter(name: string) {
    if (!this.notificationAdapters.has(name)) {
      throw new Error(`Notification adapter '${name}' not found`);
    }
    this.activeNotificationAdapter = name;
    logger.info(`Active notification adapter set to: ${name}`);
  }

  getNotificationAdapter(name?: string): INotificationAdapter {
    const adapterName = name || this.activeNotificationAdapter;
    if (!adapterName) {
      throw new Error('No notification adapter configured');
    }

    const adapter = this.notificationAdapters.get(adapterName);
    if (!adapter) {
      throw new Error(`Notification adapter '${adapterName}' not found`);
    }

    return adapter;
  }

  getAllNotificationAdapters(): INotificationAdapter[] {
    return Array.from(this.notificationAdapters.values());
  }

  // Metrics Adapter methods
  registerMetricsAdapter(adapter: IMetricsAdapter) {
    this.metricsAdapters.set(adapter.name, adapter);
    logger.info(`Metrics adapter registered: ${adapter.name}`);
  }

  setActiveMetricsAdapter(name: string) {
    if (!this.metricsAdapters.has(name)) {
      throw new Error(`Metrics adapter '${name}' not found`);
    }
    this.activeMetricsAdapter = name;
    logger.info(`Active metrics adapter set to: ${name}`);
  }

  getMetricsAdapter(name?: string): IMetricsAdapter | undefined {
    const adapterName = name || this.activeMetricsAdapter;
    if (!adapterName) {
      return undefined;
    }

    return this.metricsAdapters.get(adapterName);
  }

  getAllMetricsAdapters(): IMetricsAdapter[] {
    return Array.from(this.metricsAdapters.values());
  }

  // Health check all adapters
  async healthCheck(): Promise<{
    llm: boolean;
    notification: boolean;
    metrics: boolean;
  }> {
    const llm = await this.getLLMProvider().healthCheck();
    const notification = await this.getNotificationAdapter().healthCheck();
    const metrics = this.getMetricsAdapter()
      ? await this.getMetricsAdapter()!.healthCheck()
      : true;

    return { llm, notification, metrics };
  }
}

// Export singleton instance
export const adapterRegistry = new AdapterRegistry();

// Export class for testing
export { AdapterRegistry };
