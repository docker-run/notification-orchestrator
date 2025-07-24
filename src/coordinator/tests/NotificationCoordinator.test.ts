import { MockRepository } from "../../tests/mocks/MockRepository";
import { NotificationDecision, UserPreferenceInput } from "../../types";
import { NotificationCoordinator } from "../NotificationCoordinator";

describe('NotificationCoordinator', () => {
  let coordinator: NotificationCoordinator;
  let mockRepository: MockRepository;

  beforeEach(() => {
    mockRepository = new MockRepository();
    coordinator = new NotificationCoordinator(mockRepository as any);
  });

  describe('processEvent', () => {
    it('should process valid event successfully', async () => {
      const testEvent = {
        eventId: 'evt_12345',
        userId: 'usr_abcde',
        eventType: 'item_shipped',
        timestamp: '2025-07-21T10:00:00Z',
        payload: {
          orderId: 'ord_67890'
        }
      };

      const prefs = {
        eventTypes: {
          item_shipped: { enabled: true, channels: ['email'] }
        }
      }
      await mockRepository.setUserPreferences('usr_abcde', prefs);

      const result = await coordinator.processEvent(testEvent);

      expect(result?.decision).toBe('PROCESS_NOTIFICATION');
    });

    it('should handle user not found', async () => {
      const testEvent = {
        eventId: 'evt_12345',
        userId: 'usr_nonexistent',
        eventType: 'item_shipped',
        timestamp: '2024-05-28T10:00:00Z',
        payload: {}
      };

      const result = await coordinator.processEvent(testEvent)
      expect(result).toEqual(
        {
          "decision": "DO_NOT_NOTIFY",
          "eventId": "evt_12345",
          "reason": "USER_NOT_FOUND",
          "userId": "usr_nonexistent",
        })
    });

    it('should not process event w/o configured channels', async () => {
      const testEvent = {
        eventId: 'evt_12345',
        userId: 'usr_abcde',
        eventType: 'item_shipped',
        timestamp: '2025-07-21T10:00:00Z',
        payload: {
          orderId: 'ord_67890'
        }
      };

      await mockRepository.setUserPreferences('usr_abcde', {
        eventTypes: {
          item_shipped: { enabled: true, channels: [] }
        }
      });

      const result: NotificationDecision | undefined = await coordinator.processEvent(testEvent);

      expect(result?.decision).toBe('DO_NOT_NOTIFY');
      expect((result as { reason: string }).reason).toBe('NO_CHANNELS_CONFIGURED');
    });


    it('should not process event w/o user`s subscription', async () => {
      const testEvent = {
        eventId: 'evt_12345',
        userId: 'usr_abcde',
        eventType: 'item_shipped',
        timestamp: '2025-07-21T10:00:00Z',
        payload: {
          orderId: 'ord_67890'
        }
      };

      await mockRepository.setUserPreferences('usr_abcde', {
        eventTypes: {
          item_shipped: { enabled: false, channels: ['sms'] }
        }
      });

      const result: NotificationDecision | undefined = await coordinator.processEvent(testEvent);

      expect(result?.decision).toBe('DO_NOT_NOTIFY');
      expect((result as { reason: string }).reason).toBe('USER_UNSUBSCRIBED');
    });
  });
});
