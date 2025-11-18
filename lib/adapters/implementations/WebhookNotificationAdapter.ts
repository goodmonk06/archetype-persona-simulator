/**
 * Webhook implementation of INotificationAdapter
 * Sends notifications to configured webhook URLs
 */

import { logger } from '@/lib/logger';
import type { INotificationAdapter, Notification } from '../INotificationAdapter';

export class WebhookNotificationAdapter implements INotificationAdapter {
  readonly name = 'webhook';

  constructor(
    private webhookUrl: string,
    private secret?: string
  ) {}

  async send(notification: Notification): Promise<void> {
    try {
      const payload = {
        event: notification.event,
        data: notification.data,
        timestamp: notification.timestamp.toISOString(),
        metadata: notification.metadata,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.secret) {
        headers['X-Webhook-Secret'] = this.secret;
      }

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook returned status ${response.status}`);
      }

      logger.debug('Webhook notification sent', {
        event: notification.event,
        status: response.status,
      });
    } catch (error) {
      logger.error('Failed to send webhook notification', error as Error, {
        event: notification.event,
        url: this.webhookUrl,
      });
      throw error;
    }
  }

  async sendBatch(notifications: Notification[]): Promise<void> {
    // Send notifications in parallel
    await Promise.all(notifications.map(n => this.send(n)));
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'HEAD',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
