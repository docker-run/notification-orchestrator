import { NotificationEvent } from "../../types";
import { BaseHandler, BaseHandlerDecision } from "./BaseHandler";

export class UserExistsHandler extends BaseHandler {
  protected async process(event: NotificationEvent): Promise<BaseHandlerDecision> {
    const prefs = await this.repository.getUserPreferences(event.userId);
    return { shouldContinue: prefs ? true : false };
  }
}
