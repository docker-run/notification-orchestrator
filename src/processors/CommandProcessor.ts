import { NotificationCommand } from "../commands/NotificationCommand";

export class CommandProcessor {
  async process(command: NotificationCommand) {
    try {
      const result = await command.execute();
      return result;
    } catch (error) {
      console.error('Command execution failed:', error);
      throw error;
    }
  }
}
