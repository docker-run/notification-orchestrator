import { MockRepository } from "../../../tests/mocks/MockRepository";
import { DNDHandler } from "../DndHandler";

describe('DNDHandler', () => {
  let handler: any;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = new MockRepository();
    handler = new DNDHandler(mockRepository as any);
  });

  describe('process', () => {
    it('should continue if no DND windows are active', async () => {
      const testEvent = {
        eventId: 'evt_12345',
        userId: 'usr_abcde',
        eventType: 'item_shipped',
        timestamp: '2025-07-22T10:00:00Z', // Tuesday 10:00 AM
        payload: {}
      };

      await mockRepository.addDNDWindow('usr_abcde', {
        days: ['monday'],
        startTime: '22:00',
        endTime: '06:00',
        timezone: 'UTC'
      });

      const result = await handler.process(testEvent);

      expect(result.shouldContinue).toBe(true);
    });

    it('should return DO_NOT_NOTIFY if DND window is active', async () => {
      const testEvent = {
        eventId: 'evt_12345',
        userId: 'usr_abcde',
        eventType: 'item_shipped',
        timestamp: '2025-07-22T05:00:00Z', // Tuesday 5:00 AM (within Monday 22:00-06:00 window)
        payload: {}
      };

      await mockRepository.addDNDWindow('usr_abcde', {
        days: ['monday'],
        startTime: '22:00',
        endTime: '06:00',
        timezone: 'UTC'
      });

      const result = await handler.process(testEvent);

      expect(result.shouldContinue).toBe(false);
      expect(result.decision.reason).toBe('DND_ACTIVE');
    });

    it('should return continue if DND window is inactive on that day', async () => {
      const testEvent = {
        eventId: 'evt_12345',
        userId: 'usr_abcde',
        eventType: 'item_shipped',
        timestamp: '2025-07-21T11:00:00Z', // Monday 11:00 AM (not in Monday 14-00-22:00 window)
        payload: {}
      };

      await mockRepository.addDNDWindow('usr_abcde', {
        days: ['monday'],
        startTime: '14:00',
        endTime: '22:00',
        timezone: 'UTC'
      });

      const result = await handler.process(testEvent);

      expect(result.shouldContinue).toBe(true);
    });

    it('should handle same-day DND window correctly', async () => {
      const testEvent = {
        eventId: 'evt_12345',
        userId: 'usr_abcde',
        eventType: 'item_shipped',
        timestamp: '2025-07-21T14:00:00Z', // Monday 2:00 PM
        payload: {}
      };

      await mockRepository.addDNDWindow('usr_abcde', {
        days: ['monday'],
        startTime: '10:00',
        endTime: '18:00',
        timezone: 'UTC'
      });

      const result = await handler.process(testEvent);

      expect(result.shouldContinue).toBe(false);
      expect(result.decision.reason).toBe('DND_ACTIVE');
    });
  });

  describe('isWithinDNDWindow', () => {
    it('should correctly identify overnight DND window', () => {
      const eventTime = '2025-07-22T05:00:00Z'; // Tuesday 5:00 AM
      const dndWindow = {
        days: ['monday'],
        startTime: '22:00',
        endTime: '06:00',
        timezone: "UTC"
      };

      const result = handler.isWithinDNDWindow(dndWindow, eventTime);
      expect(result).toBe(true);
    });

    it('should correctly identify same-day DND window', () => {
      const eventTime = '2025-07-21T14:00:00Z'; // Monday 2:00 PM
      const dndWindow = {
        days: ['monday'],
        startTime: '10:00',
        endTime: '18:00',
        timezone: 'UTC'
      };

      const result = handler.isWithinDNDWindow(dndWindow, eventTime);
      expect(result).toBe(true);
    });

    it('should return false for different day', () => {
      const eventTime = '2025-07-22T14:00:00Z'; // Tuesday 2:00 PM
      const dndWindow = {
        days: ['monday'],
        startTime: '10:00',
        endTime: '18:00'
      };

      const result = handler.isWithinDNDWindow(dndWindow, eventTime);
      expect(result).toBe(false);
    });

    describe('multiple dnd windows', () => {
      it('should return true when at the end of overnight dnd windows', () => {
        const eventTime = '2025-07-24T05:00:00Z'; // Thursday 5:00 AM
        const dndWindow = {
          days: ['monday', 'tuesday', 'wednesday'],
          startTime: '22:00',
          endTime: '06:00',
          timezone: 'UTC'
        };

        const result = handler.isWithinDNDWindow(dndWindow, eventTime);
        expect(result).toBe(true);
      });

      it('should return false when out of dnd windows', () => {
        const eventTime = '2025-07-24T07:00:00Z'; // Thursday 7:00 AM
        const dndWindow = {
          days: ['monday', 'tuesday', 'wednesday'],
          startTime: '22:00',
          endTime: '06:00',
          timezone: 'UTC'
        };

        const result = handler.isWithinDNDWindow(dndWindow, eventTime);
        expect(result).toBe(false);
      });
    })
  });
});
