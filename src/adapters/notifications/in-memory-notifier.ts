import type { ExpenseResolution, Notifier } from "@/application/ports/notifier";

export class InMemoryNotifier implements Notifier {
  private readonly notifications: ExpenseResolution[] = [];

  get sent(): readonly ExpenseResolution[] {
    return this.notifications;
  }

  async notifyResolution(resolution: ExpenseResolution): Promise<void> {
    this.notifications.push(resolution);
  }
}
