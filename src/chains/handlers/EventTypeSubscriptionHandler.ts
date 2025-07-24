import { NotificationEvent } from "../../types";
import { BaseHandler, BaseHandlerDecision } from "./BaseHandler";

export class EventTypeSubscriptionHandler extends BaseHandler {
  protected async process(event: NotificationEvent): Promise<BaseHandlerDecision> {
    const preferences = await this.repository.getUserPreferences(event.userId);
    console.log('p', event, preferences)
    const eventTypePrefs = preferences.eventTypes[event.eventType];

    if (!eventTypePrefs || !eventTypePrefs.enabled) {
      return {
        shouldContinue: false,
        decision: {
          decision: 'DO_NOT_NOTIFY',
          eventId: event.eventId,
          userId: event.userId,
          reason: 'USER_UNSUBSCRIBED'
        }
      };
    }

    return { shouldContinue: true };
  }
}
