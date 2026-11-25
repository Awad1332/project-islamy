import { Injectable, Logger } from '@nestjs/common';

export type DomainEvent =
  | 'order.created' | 'order.updated' | 'product.updated' | 'inventory.low_stock'
  | 'return.created' | 'return.updated' | 'customer.created';

type Handler = (tenantId: string, event: DomainEvent, payload: Record<string, unknown>) => Promise<void>;

/**
 * In-process domain event bus. Subscribers (webhooks, marketing automations) enqueue durable
 * BullMQ jobs, so publishing is cheap and never blocks the request on external I/O.
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private readonly handlers: Handler[] = [];

  subscribe(handler: Handler) {
    this.handlers.push(handler);
  }

  async publish(tenantId: string, event: DomainEvent, payload: Record<string, unknown>) {
    for (const h of this.handlers) {
      try {
        await h(tenantId, event, payload);
      } catch (e) {
        this.logger.error(`Event handler failed for ${event}: ${(e as Error).message}`);
      }
    }
  }
}
