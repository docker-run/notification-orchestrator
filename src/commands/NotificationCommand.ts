import { NotificationEvent } from "../types";

export class NotificationCommand {
  constructor(private event: NotificationEvent) {
    this.event = event;
  }

  async execute() {
    console.log(`Processing notification command for event: ${this.event.eventId}`);
    return { success: true, eventId: this.event.eventId };
  }
}
