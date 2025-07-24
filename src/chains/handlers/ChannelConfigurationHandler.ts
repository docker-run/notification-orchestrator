import { NotificationEvent } from "../../types";
import { BaseHandler, BaseHandlerDecision } from "./BaseHandler";

export class ChannelConfigurationHandler extends BaseHandler {
  protected async process(event: NotificationEvent): Promise<BaseHandlerDecision> {
    const preferences = await this.repository.getUserPreferences(event.userId);
    const eventTypePrefs = preferences.eventTypes[event.eventType];

    if (!eventTypePrefs.channels || eventTypePrefs.channels.length === 0) {
      return {
        shouldContinue: false,
        decision: {
          decision: 'DO_NOT_NOTIFY',
          eventId: event.eventId,
          userId: event.userId,
          reason: 'NO_CHANNELS_CONFIGURED'
        }
      };
    }

    return {
      shouldContinue: false,
      decision: {
        decision: 'PROCESS_NOTIFICATION',
        eventId: event.eventId,
        userId: event.userId,
        channels: eventTypePrefs.channels
      }
    };
  }
}
