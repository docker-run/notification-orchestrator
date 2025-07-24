import { NotificationPreferencesRepository } from "../../repositories/NotificationPreferencesRepository";
import { NotificationDecision, NotificationEvent } from "../../types";

export interface BaseHandlerDecision {
  shouldContinue: boolean;
  decision?: NotificationDecision;
}

export abstract class BaseHandler {
  protected repository: NotificationPreferencesRepository;
  private nextHandler: BaseHandler | null;

  constructor(repository: NotificationPreferencesRepository) {
    this.repository = repository;
    this.nextHandler = null;
  }

  public setNext(handler: BaseHandler) {
    this.nextHandler = handler;
    return handler;
  }

  public async handle(event: NotificationEvent): Promise<NotificationDecision | undefined> {
    const result = await this.process(event);

    if (result.shouldContinue && this.nextHandler) {
      return await this.nextHandler.handle(event);
    }

    return result.decision;
  }

  protected abstract process(event: NotificationEvent): Promise<BaseHandlerDecision>;
}
