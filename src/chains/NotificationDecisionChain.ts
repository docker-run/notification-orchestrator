import { NotificationPreferencesRepository } from "../repositories/NotificationPreferencesRepository";
import { NotificationEvent } from "../types";
import { ChannelConfigurationHandler } from "./handlers/ChannelConfigurationHandler";
import { DNDHandler } from "./handlers/DndHandler";
import { EventTypeSubscriptionHandler } from "./handlers/EventTypeSubscriptionHandler";
import { UserExistsHandler } from "./handlers/UserExistsHandler";

export class NotificationDecisionChain {
  private firstHandler: UserExistsHandler | undefined;
  private repository: NotificationPreferencesRepository;

  constructor(repository: NotificationPreferencesRepository) {
    this.repository = repository;
    this.firstHandler = undefined
    this.buildChain();
  }

  buildChain() {
    const userExistsHandler = new UserExistsHandler(this.repository);
    const subscriptionHandler = new EventTypeSubscriptionHandler(this.repository);
    const dndHandler = new DNDHandler(this.repository);
    const channelHandler = new ChannelConfigurationHandler(this.repository);

    userExistsHandler
      .setNext(subscriptionHandler)
      .setNext(dndHandler)
      .setNext(channelHandler);

    this.firstHandler = userExistsHandler;
  }

  async process(event: NotificationEvent) {
    return await this.firstHandler?.handle(event);
  }
}
