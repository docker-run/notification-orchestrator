# Notification Orchestrator

A highly performant, scalable, and extensible notification orchestration engine designed to handle complex notification workflows with multiple channels, routing rules, and delivery strategies.

## Contents

* [Architecture](#architecture)
* [Installation](#installation)
* [Usage](#usage)
  * [Basic Example](#basic-example)
  * [Advanced Example](#advanced-example)
  * [API Endpoints](#api-endpoints)
  * [Database Schema Design](#database-schema-design)
  * [Testing](#testing)

## Architecture

The Notification Orchestrator is designed to be highly-performant, scalable and extensible. To achieve high performance it employs the Chain of Responsibility sequential event processing, which allows for the ability to "skip" processors that are not relevant for current request. 
The scalability and extensibility, on the other hand, are achieved by abstracting away the logic responsible for processing of the notification events.

The microservice is built around 5 core entities, namely **NotificationCoordinator**, **NotificationDecisionChain**, **NotificationPreferencesRepository**, **Handler** and **CommandProcessor**.

* [**NotificationCoordinator**](src/coordinator/NotificationCoordinator.ts) - the main client-facing facade used for all interactions with the microservice.
It is responsible for the handling of the event notifications and orchestration of the decision processes.
* [**NotificationDecisionChain**](src/chains/NotificationDecisionChain.ts) - the entity that does all the event processing.
A single decision chain corresponds to a single event notification.
* [**NotificationPreferencesRepository**](src/repositories/NotificationPreferencesRepository.ts) - the entity that is responsible for the storing of the users' notification preferences.
* [**Handler**](src/chains/handlers/BaseHandler.ts) - the entity that is used for performing exhaustive checks influencing the final decision. 
* [**CommandProcessor**](src/processors/CommandProcessor.ts) - the entity that is used for executing commands. It is an entity that can potentially incorporate audit trail/history logic.

The typical notification orchestration flow looks like this:
1. **Client** submits an event notification to the **Notification Coordinator** (notification decision engine).
2. **Notification Coordinator** integrates the chain of responsibility with command processing
3. **Notification Decision Chain** performs the exhaustive processing of the event notification info using the registered **Handlers**
4. **Notification Decision Chain** outputs the decision result based on user's configuration in **NotificationPreferencesRepository**.
5. **Notification Decision Chain** delivers the decision to the **NotificationCoordinator**.
6. NotificationCoordinator delivers the decision result to the **Client**.

## Installation

First, clone this repository
```bash
git clone https://github.com/docker-run/notification-orchestrator.git
```

Then, build and start the application and database services using Docker Compose. Inside the root of the repository:
```bash
docker-compose up -d
```

## Usage

### Basic Example

Once you started the application, you need to set user preferences
```bash

curl -X PUT http://localhost:3000/user/usr_123/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "item_shipped",
    "enabled": true,
    "channels": ["email", "push"]
  }'
```

Then, send an event for processing

```bash
curl -X POST http://localhost:3000/event \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt_12345",
    "userId": "usr_123",
    "eventType": "item_shipped",
    "timestamp": "2025-07-21T10:00:00Z",
    "payload": {
      "orderId": "ord_67890",
      "shippingCarrier": "Federal Express",
      "trackingNumber": "FX123456789"
    }
  }'
```


### Advanced Example

Once you started the application, you need to set user preferences
```bash

curl -X PUT http://localhost:3000/user/usr_123/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "new_feature_added",
    "enabled": true,
    "channels": ["email", "push"]
  }'
```

Then, add DND Window

```bash
curl -X POST http://localhost:3000/user/usr_abcde/dnd-windows \
  -H "Content-Type: application/json" \
  -d '{
    "days": ["monday", "tuesday", "wednesday"],
    "startTime": "22:00",
    "endTime": "06:00",
    "timezone": "UTC"
  }'
```

Then, send an event for processing

```bash
curl -X POST http://localhost:3000/event \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt_12345",
    "userId": "usr_123",
    "eventType": "new_feature_added",
    "timestamp": "2025-07-24T04:00:00Z",
    "payload": {
      "orderId": "ord_67890",
      "shippingCarrier": "Federal Express",
      "trackingNumber": "FX123456789"
    }
  }'

```
Since the DND window starts at 22:00 on Wednesday and should end at 06:00 on Thursday, the decision would be not to notify.

### API Endpoints

Event Processing
- `POST /event` - Process incoming events

User Preferences
- `POST /user/:userId/preferences` - Set user preferences
- `GET /user/:userId/preferences` - Get user preferences
- `PUT /user/:userId/preferences` - Update user preferences

DND Windows
- `POST /user/:userId/dnd-windows` - Add DND window
- `GET /user/:userId/dnd-windows` - Get all DND windows
- `DELETE /user/:userId/dnd-windows/:windowId` - Remove DND window

### Database Schema Design

UserPreferences Table
- **Table Name**: `UserPreferences`
- **Primary Key**: `userId` (String)
- **Attributes**:
  - `userId`: User identifier
  - `eventTypes`: Object containing event type configurations
  - `createdAt`: Timestamp
  - `updatedAt`: Timestamp

**Structure**:
```json
{
  "userId": "usr_abcde",
  "eventTypes": {
    "item_shipped": {
      "enabled": true,
      "channels": ["email", "push"]
    },
    "invoice_generated": {
      "enabled": false,
      "channels": []
    }
  },
  "createdAt": "2025-07-22T10:00:00Z",
  "updatedAt": "2025-07-22T10:00:00Z"
}
```

DNDWindows Table
- **Table Name**: `DNDWindows`
- **Primary Key**: `userId` (Hash), `windowId` (Range)
- **Attributes**:
  - `userId`: User identifier
  - `windowId`: Unique window identifier (UUID)
  - `days`: Array of days (e.g., ["monday", "tuesday"])
  - `startTime`: Start time in HH:mm format
  - `endTime`: End time in HH:mm format
  - `timezone`: Timezone (default: UTC)
  - `createdAt`: Timestamp

**Structure**:
```json
{
  "userId": "usr_abcde",
  "windowId": "dnd_12345",
  "days": ["monday", "tuesday", "wednesday"],
  "startTime": "22:00",
  "endTime": "06:00",
  "timezone": "UTC",
  "createdAt": "2025-07-22T10:00:00Z"
}
```

**Design Justifications**:
1. **Separate Tables**: DND windows are in a separate table as they apply globally to all notifications and can have multiple entries per user
2. **Composite Key**: `userId` + `windowId` allows multiple DND windows per user

## Testing

To run unit tests for core logic and API integration tests, run the following command from the root of application
```bash
npm run test
```
