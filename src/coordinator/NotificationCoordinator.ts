import { NotificationPreferencesRepository } from '../repositories/NotificationPreferencesRepository';
import { CommandProcessor } from '../processors/CommandProcessor';
import { NotificationCommand } from '../commands/NotificationCommand';
import { NotificationDecisionChain } from '../chains/NotificationDecisionChain';
import { NotificationEvent } from '../types';

export class NotificationCoordinator {
  private decisionChain: NotificationDecisionChain;
  private commandProcessor: CommandProcessor;

  constructor(private repository: NotificationPreferencesRepository) {
    this.decisionChain = new NotificationDecisionChain(repository);
    this.commandProcessor = new CommandProcessor();
  }

  async processEvent(eventData: NotificationEvent) {
    const command = new NotificationCommand(eventData);

    const decision = await this.decisionChain.process(eventData);

    await this.commandProcessor.process(command);

    return decision;
  }
}
