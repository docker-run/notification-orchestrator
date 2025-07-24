import { NotificationEvent } from "../../types";
import { BaseHandler, BaseHandlerDecision } from "./BaseHandler";

export class UserExistsHandler extends BaseHandler {
  protected async process(event: NotificationEvent): Promise<BaseHandlerDecision> {
    try {
      await this.repository.getUserPreferences(event.userId);
      return { shouldContinue: true };
    } catch (error) {
      return {
        shouldContinue: false,
        decision: {
          decision: 'DO_NOT_NOTIFY',
          eventId: event.eventId,
          userId: event.userId,
          reason: 'USER_NOT_FOUND'
        }
      };
    }
  }
}
