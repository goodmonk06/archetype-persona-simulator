/**
 * Domain events system
 * Allows decoupling of business logic through event-driven architecture
 */

import { logger } from '../logger';
import { adapterRegistry } from '../adapters/AdapterRegistry';
import { NotificationEvent } from '../adapters/INotificationAdapter';

export enum DomainEventType {
  PERSONA_CREATED = 'PERSONA_CREATED',
  PERSONA_UPDATED = 'PERSONA_UPDATED',
  PERSONA_DELETED = 'PERSONA_DELETED',
  PERSONA_RESPONSE_GENERATED = 'PERSONA_RESPONSE_GENERATED',
  SCENARIO_EXECUTED = 'SCENARIO_EXECUTED',
  CONVERSATION_STARTED = 'CONVERSATION_STARTED',
  CONVERSATION_CONTINUED = 'CONVERSATION_CONTINUED',
}

export interface DomainEvent<T = unknown> {
  type: DomainEventType;
  aggregateId: string;
  data: T;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export type EventHandler<T = unknown> = (event: DomainEvent<T>) => void | Promise<void>;

class DomainEventPublisher {
  private handlers: Map<DomainEventType, EventHandler[]> = new Map();

  /**
   * Subscribe to a domain event
   */
  subscribe<T = unknown>(eventType: DomainEventType, handler: EventHandler<T>) {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler as EventHandler);
    this.handlers.set(eventType, handlers);

    logger.debug('Event handler registered', {
      eventType,
      handlerCount: handlers.length,
    });
  }

  /**
   * Unsubscribe from a domain event
   */
  unsubscribe<T = unknown>(eventType: DomainEventType, handler: EventHandler<T>) {
    const handlers = this.handlers.get(eventType) || [];
    const filtered = handlers.filter(h => h !== handler);
    this.handlers.set(eventType, filtered);

    logger.debug('Event handler unregistered', {
      eventType,
      handlerCount: filtered.length,
    });
  }

  /**
   * Publish a domain event
   */
  async publish<T = unknown>(event: DomainEvent<T>): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];

    logger.info('Domain event published', {
      type: event.type,
      aggregateId: event.aggregateId,
      handlerCount: handlers.length,
    });

    // Execute all handlers
    const promises = handlers.map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        logger.error('Event handler failed', error as Error, {
          eventType: event.type,
          aggregateId: event.aggregateId,
        });
        // Don't rethrow - we want other handlers to continue
      }
    });

    await Promise.all(promises);

    // Also send notification if configured
    await this.sendNotification(event);
  }

  /**
   * Send notification via adapter
   */
  private async sendNotification<T>(event: DomainEvent<T>) {
    try {
      const notificationAdapter = adapterRegistry.getNotificationAdapter();

      // Map domain events to notification events
      const notificationEvent = this.mapToNotificationEvent(event.type);
      if (!notificationEvent) return;

      await notificationAdapter.send({
        event: notificationEvent,
        data: {
          aggregateId: event.aggregateId,
          ...event.data,
        } as Record<string, unknown>,
        timestamp: event.timestamp,
        metadata: event.metadata,
      });
    } catch (error) {
      logger.error('Failed to send notification for domain event', error as Error, {
        eventType: event.type,
      });
      // Don't rethrow - notification failures shouldn't break the main flow
    }
  }

  private mapToNotificationEvent(eventType: DomainEventType): NotificationEvent | null {
    const mapping: Record<DomainEventType, NotificationEvent> = {
      [DomainEventType.PERSONA_CREATED]: NotificationEvent.PERSONA_CREATED,
      [DomainEventType.PERSONA_UPDATED]: NotificationEvent.PERSONA_UPDATED,
      [DomainEventType.PERSONA_DELETED]: NotificationEvent.PERSONA_DELETED,
      [DomainEventType.PERSONA_RESPONSE_GENERATED]: NotificationEvent.RESPONSE_GENERATED,
      [DomainEventType.SCENARIO_EXECUTED]: NotificationEvent.SCENARIO_COMPLETED,
      [DomainEventType.CONVERSATION_STARTED]: NotificationEvent.RESPONSE_GENERATED,
      [DomainEventType.CONVERSATION_CONTINUED]: NotificationEvent.RESPONSE_GENERATED,
    };

    return mapping[eventType] || null;
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clearHandlers() {
    this.handlers.clear();
  }
}

// Export singleton instance
export const domainEvents = new DomainEventPublisher();

// Export class for testing
export { DomainEventPublisher };

/**
 * Helper to create domain events
 */
export function createDomainEvent<T>(
  type: DomainEventType,
  aggregateId: string,
  data: T,
  metadata?: Record<string, unknown>
): DomainEvent<T> {
  return {
    type,
    aggregateId,
    data,
    timestamp: new Date(),
    metadata,
  };
}
