export interface DndWindow {
  userId: string;
  windowId: string;
  days: string[];
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface UserPreference {
  userId: string;
  eventTypes: Record<EventName, { enabled: boolean; channels: string[] }>
}

type EventName = "item_shipped" | "invoice_generated" | "new_feature_announcement" | "security_alert";

export interface UserPreferenceInput {
  eventTypes: Partial<Record<EventName, { enabled: boolean; channels: string[] }>>;
}

export interface NotificationEvent {
  eventId: string;
  eventType: string;
  userId: string;
  timestamp: string;
  payload: unknown;
}

export type NotificationDecision =
  | {
    channels: string[];
    decision: 'PROCESS_NOTIFICATION';
    eventId: string;
    userId: string;
  }
  | {
    decision: 'DO_NOT_NOTIFY';
    eventId: string;
    userId: string;
    reason: 'DND_ACTIVE' | 'USER_UNSUBSCRIBED' | 'NO_CHANNELS_CONFIGURED'
  };
