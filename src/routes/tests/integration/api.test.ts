import { cleanupTestTables, createTestTables } from "../../../tests/setup-db";
import request from "supertest";
import express from 'express';
import { NotificationCoordinator } from "../../../coordinator/NotificationCoordinator";
import { eventRoute } from "../../event";
import { userRoute } from "../../user";
import { NotificationPreferencesRepository } from "../../../repositories/NotificationPreferencesRepository";

class TestDynamoDBRepository extends NotificationPreferencesRepository {
  constructor() {
    super();
    // @ts-ignore
    this.userPreferencesTable = 'UserPreferences-test';
    // @ts-ignore
    this.dndWindowsTable = 'DNDWindows-test';
  }
}

function createTestApp() {
  const app = express();

  const repository = new TestDynamoDBRepository();
  const coordinator = new NotificationCoordinator(repository as any);

  app.use(express.json());
  app.use('/event', eventRoute(coordinator));
  app.use('/user', userRoute(repository as any));

  return { app }
}

describe('API Integration Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    const { app: testApp } = createTestApp();
    app = testApp;
  });

  beforeEach(async () => {
    await createTestTables();
  });

  afterEach(async () => {
    await cleanupTestTables();
  });


  describe('POST /event', () => {
    it('should process notification for valid event', async () => {
      const userId = 'usr_test_123';

      await request(app)
        .post(`/user/${userId}/preferences`)
        .send({
          eventTypes: {
            item_shipped: {
              enabled: true,
              channels: ['email', 'push']
            }
          }
        })
        .expect(201);

      const eventPayload = {
        eventId: 'evt_12345',
        userId,
        eventType: 'item_shipped',
        timestamp: '2025-05-28T10:00:00Z',
        payload: {
          orderId: 'ord_67890',
          shippingCarrier: 'Federal Express',
          trackingNumber: 'FX123456789'
        }
      };

      const response = await request(app)
        .post('/event')
        .send(eventPayload)
        .expect(202);

      expect(response.body).toEqual({
        decision: 'PROCESS_NOTIFICATION',
        eventId: 'evt_12345',
        userId: 'usr_test_123',
        channels: [
          'email', 'push'
        ]
      });
    });
  });

  describe('User Preferences API', () => {
    const userId = 'usr_test_prefs';

    it('should create and retrieve user preferences', async () => {
      const preferences = {
        eventTypes: {
          item_shipped: {
            enabled: true,
            channels: ['email', 'push']
          },
          invoice_generated: {
            enabled: false,
            channels: ['email']
          }
        }
      };

      await request(app)
        .post(`/user/${userId}/preferences`)
        .send(preferences)
        .expect(201);

      const response = await request(app)
        .get(`/user/${userId}/preferences`)
        .expect(200);

      expect(response.body.userId).toBe(userId);
      expect(response.body.eventTypes).toEqual(preferences.eventTypes);
    });

    it('should update user preferences', async () => {
      const initialPreferences = {
        eventTypes: {
          item_shipped: {
            enabled: true,
            channels: ['email']
          }
        }
      };

      const updatedPreferences = {
        eventTypes: {
          item_shipped: {
            enabled: true,
            channels: ['email', 'push', 'sms']
          }
        }
      };

      await request(app)
        .post(`/user/${userId}/preferences`)
        .send(initialPreferences)
        .expect(201);

      await request(app)
        .put(`/user/${userId}/preferences`)
        .send(updatedPreferences)
        .expect(200);

      const response = await request(app)
        .get(`/user/${userId}/preferences`)
        .expect(200);

      expect(response.body.eventTypes.item_shipped.channels).toEqual(['email', 'push', 'sms']);
    });
  });

  describe('DND Windows API', () => {
    const userId = 'usr_test_dnd';

    beforeAll(async () => {
      await request(app)
        .post(`/user/${userId}/preferences`)
        .send({
          eventTypes: {
            item_shipped: { enabled: true, channels: ['email'] }
          }
        });
    });

    it('should create and retrieve DND windows', async () => {
      const dndWindow = {
        days: ['monday', 'tuesday'],
        startTime: '22:00',
        endTime: '06:00',
        timezone: 'UTC'
      };

      const createResponse = await request(app)
        .post(`/user/${userId}/dnd-windows`)
        .send(dndWindow)
        .expect(201);

      expect(createResponse.body.windowId).toBeDefined();

      const getResponse = await request(app)
        .get(`/user/${userId}/dnd-windows`)
        .expect(200);

      expect(getResponse.body[0].days).toEqual(['monday', 'tuesday']);
      expect(getResponse.body[0].startTime).toBe('22:00');
      expect(getResponse.body[0].endTime).toBe('06:00');
    });

    it('should delete DND window', async () => {
      const dndWindow = {
        days: ['wednesday'],
        startTime: '10:00',
        endTime: '18:00',
        timezone: 'UTC'
      };

      const createResponse = await request(app)
        .post(`/user/${userId}/dnd-windows`)
        .send(dndWindow)
        .expect(201);

      const windowId = createResponse.body.windowId;

      await request(app)
        .delete(`/user/${userId}/dnd-windows/${windowId}`)
        .expect(200);

      const getResponse = await request(app)
        .get(`/user/${userId}/dnd-windows`)
        .expect(200);

      expect(getResponse.body).toHaveLength(0);
    });

    it('should handle multiple DND windows', async () => {
      const window1 = {
        days: ['monday'],
        startTime: '22:00',
        endTime: '06:00',
        timezone: 'UTC'
      };

      const window2 = {
        days: ['sunday'],
        startTime: '00:00',
        endTime: '23:59',
        timezone: 'UTC'
      };

      await request(app)
        .post(`/user/${userId}/dnd-windows`)
        .send(window1)
        .expect(201);

      await request(app)
        .post(`/user/${userId}/dnd-windows`)
        .send(window2)
        .expect(201);

      const response = await request(app)
        .get(`/user/${userId}/dnd-windows`)
        .expect(200);

      expect(response.body).toHaveLength(2);
    });
  });

  describe('End-to-End Notification Flow', () => {
    it('should handle complete notification decision flow', async () => {
      const userId = 'usr_e2e_test';

      await request(app)
        .post(`/user/${userId}/preferences`)
        .send({
          eventTypes: {
            item_shipped: {
              enabled: true,
              channels: ['email', 'push']
            },
            invoice_generated: {
              enabled: false,
              channels: ['email']
            }
          }
        })
        .expect(201);

      await request(app)
        .post(`/user/${userId}/dnd-windows`)
        .send({
          days: ['friday'],
          startTime: '18:00',
          endTime: '09:00',
          timezone: 'UTC'
        })
        .expect(201);

      const event1 = {
        eventId: 'evt_e2e_1',
        userId,
        eventType: 'item_shipped',
        timestamp: '2024-07-21T14:00:00Z', // Monday 2:00 PM
        payload: { orderId: 'ord_123' }
      };

      const response1 = await request(app)
        .post('/event')
        .send(event1)
        .expect(202);

      expect(response1.body.decision).toBe('PROCESS_NOTIFICATION');

      const event2 = {
        eventId: 'evt_e2e_2',
        userId,
        eventType: 'item_shipped',
        timestamp: '2025-07-25T20:00:00Z', // Friday 8:00 PM
        payload: { orderId: 'ord_124' }
      };

      const response2 = await request(app)
        .post('/event')
        .send(event2)
        .expect(200);

      expect(response2.body.decision).toBe('DO_NOT_NOTIFY');
      expect(response2.body.reason).toBe('DND_ACTIVE');

      const event3 = {
        eventId: 'evt_e2e_3',
        userId,
        eventType: 'invoice_generated',
        timestamp: '2025-07-21T14:00:00Z', // Monday 2:00 PM
        payload: { invoiceId: 'inv_123' }
      };

      const response3 = await request(app)
        .post('/event')
        .send(event3)
        .expect(200);

      expect(response3.body.decision).toBe('DO_NOT_NOTIFY');
      expect(response3.body.reason).toBe('USER_UNSUBSCRIBED');
    });
  });

  it('should not proceed with an event notification if user preferences are not found', async () => {
    const userId = 'non-existing-user-id';

    const event1 = {
      eventId: 'some-event-id',
      userId,
      eventType: 'item_shipped',
      timestamp: '2025-07-21T14:00:00Z', // Monday 2:00 PM
      payload: { orderId: 'ord_123' }
    };

    await request(app)
      .post('/event')
      .send(event1)
      .expect(404);
  });

  it("should handle events with dnd window timezone differences", async () => {
    const userId = "usr_timezone_test";

    const event = {
      eventId: 'some-event-in-utc',
      userId,
      eventType: 'new_feature_added',
      // Monday 06:24:14 AM UTC
      // 08:24:14 AM in Warsaw
      timestamp: '2025-07-21T06:24:14Z',
      payload: { featureName: 'Dark mode' }
    };

    const userDndWindows = {
      days: ['monday'],
      startTime: '08:00',
      endTime: '09:00',
      timezone: 'Europe/Warsaw'
    }

    await request(app)
      .post(`/user/${userId}/preferences`)
      .send({
        eventTypes: {
          new_feature_added: {
            enabled: true,
            channels: ['email']
          },
        }
      })
      .expect(201);

    await request(app)
      .post(`/user/${userId}/dnd-windows`)
      .send(userDndWindows)
      .expect(201);

    const response = await request(app)
      .post('/event')
      .send(event)
      .expect(200);

    expect(response.body.decision).toBe("DO_NOT_NOTIFY")
    expect(response.body.reason).toBe("DND_ACTIVE")
  })
});
