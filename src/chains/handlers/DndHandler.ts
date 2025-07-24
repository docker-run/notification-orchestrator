import { DateTime } from "luxon";
import { DndWindow, NotificationEvent } from "../../types";
import { BaseHandler, BaseHandlerDecision } from "./BaseHandler";

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export class DNDHandler extends BaseHandler {
  protected async process(event: NotificationEvent): Promise<BaseHandlerDecision> {
    const dndWindows = await this.repository.getDNDWindows(event.userId);

    for (const window of dndWindows) {
      if (this.isWithinDNDWindow(window, event.timestamp)) {
        return {
          shouldContinue: false,
          decision: {
            decision: 'DO_NOT_NOTIFY',
            eventId: event.eventId,
            userId: event.userId,
            reason: 'DND_ACTIVE'
          }
        };
      }
    }

    return { shouldContinue: true };
  }

  private isWithinDNDWindow(window: DndWindow, timestamp: string): boolean {
    const eventTime = DateTime.fromISO(timestamp, { zone: window.timezone });
    const weekdayIndex = eventTime.weekday % 7;
    const currentDay = WEEKDAYS[weekdayIndex];

    const [startHour, startMinute] = window.startTime.split(':').map(Number);
    const [endHour, endMinute] = window.endTime.split(':').map(Number);

    if (window.days.includes(currentDay)) {
      const start = eventTime.set({ hour: startHour, minute: startMinute, second: 0, millisecond: 0 });
      let end = eventTime.set({ hour: endHour, minute: endMinute, second: 0, millisecond: 0 });

      if (end <= start) {
        end = end.plus({ days: 1 });
      }

      if (eventTime >= start && eventTime < end) {
        return true;
      }
    }

    const previousDayIndex = (weekdayIndex - 1 + 7) % 7;
    const previousDay = WEEKDAYS[previousDayIndex];

    if (window.days.includes(previousDay)) {
      const prevDay = eventTime.minus({ days: 1 });
      const start = prevDay.set({ hour: startHour, minute: startMinute, second: 0, millisecond: 0 });
      let end = prevDay.set({ hour: endHour, minute: endMinute, second: 0, millisecond: 0 });

      if (end <= start) {
        end = end.plus({ days: 1 });

        if (eventTime >= start && eventTime < end) {
          return true;
        }
      }
    }

    return false;
  }
}
