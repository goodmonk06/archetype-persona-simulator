/**
 * Interface for sending notifications
 * Can be implemented for webhooks, email, Slack, Discord, etc.
 */

export enum NotificationEvent {
  PERSONA_CREATED = 'persona.created',
  PERSONA_UPDATED = 'persona.updated',
  PERSONA_DELETED = 'persona.deleted',
  RESPONSE_GENERATED = 'response.generated',
  SCENARIO_COMPLETED = 'scenario.completed',
  SCENARIO_FAILED = 'scenario.failed',
  THRESHOLD_EXCEEDED = 'threshold.exceeded',
}

export interface Notification {
  event: NotificationEvent;
  data: Record<string, unknown>;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface INotificationAdapter {
  /**
   * Adapter name for identification
   */
  readonly name: string;

  /**
   * Send a notification
   */
  send(notification: Notification): Promise<void>;

  /**
   * Send multiple notifications in batch
   */
  sendBatch(notifications: Notification[]): Promise<void>;

  /**
   * Check if the adapter is available
   */
  healthCheck(): Promise<boolean>;
}
