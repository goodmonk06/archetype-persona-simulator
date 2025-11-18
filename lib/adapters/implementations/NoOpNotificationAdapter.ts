/**
 * No-op implementation of INotificationAdapter
 * Used as default when no notification system is configured
 */

import { logger } from '@/lib/logger';
import type { INotificationAdapter, Notification } from '../INotificationAdapter';

export class NoOpNotificationAdapter implements INotificationAdapter {
  readonly name = 'noop';

  async send(notification: Notification): Promise<void> {
    logger.debug('NoOp notification adapter: skipping notification', {
      event: notification.event,
      data: notification.data,
    });
  }

  async sendBatch(notifications: Notification[]): Promise<void> {
    logger.debug('NoOp notification adapter: skipping batch notifications', {
      count: notifications.length,
    });
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
