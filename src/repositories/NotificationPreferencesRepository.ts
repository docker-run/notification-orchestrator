import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDB } from "../config/dynamo";
import { v4 as uuid } from "uuid";
import { UserPreferenceInput, DndWindow } from "../types";
import { HttpNotFoundError } from "../errors";

const ddb = DynamoDBDocumentClient.from(dynamoDB);

export class NotificationPreferencesRepository {
  private dynamoDB: DynamoDBDocumentClient;
  private userPreferencesTable: string;
  private dndWindowsTable: string;

  constructor() {
    this.dynamoDB = ddb;
    this.userPreferencesTable = 'UserPreferences';
    this.dndWindowsTable = 'DNDWindows';
  }

  async getUserPreferences(userId: string) {
    const command = new GetCommand({
      TableName: this.userPreferencesTable,
      Key: { userId }
    });

    const result = await this.dynamoDB.send(command);

    if (!result.Item) {
      throw new HttpNotFoundError('User preferences not found');
    }

    return result.Item;
  }

  async setUserPreferences(userId: string, preferences: UserPreferenceInput) {
    const command = new PutCommand({
      TableName: this.userPreferencesTable,
      Item: {
        userId,
        eventTypes: preferences.eventTypes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

    await this.dynamoDB.send(command);
  }

  async updateUserPreferences(userId: string, preferences: UserPreferenceInput) {
    const command = new UpdateCommand({
      TableName: this.userPreferencesTable,
      Key: { userId },
      UpdateExpression: 'SET eventTypes = :eventTypes, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':eventTypes': preferences.eventTypes,
        ':updatedAt': new Date().toISOString()
      }
    });

    await this.dynamoDB.send(command);
  }

  async getDNDWindows(userId: string): Promise<DndWindow[]> {
    const command = new QueryCommand({
      TableName: this.dndWindowsTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    });

    const result = await this.dynamoDB.send(command);
    return result.Items as DndWindow[];
  }

  async addDNDWindow(userId: string, dndWindow: DndWindow) {
    const windowId = uuid();
    const command = new PutCommand({
      TableName: this.dndWindowsTable,
      Item: {
        userId,
        windowId,
        days: dndWindow.days,
        startTime: dndWindow.startTime,
        endTime: dndWindow.endTime,
        timezone: dndWindow.timezone || 'UTC',
        createdAt: new Date().toISOString()
      }
    });

    await this.dynamoDB.send(command);
    return windowId;
  }

  async removeDNDWindow(userId: string, windowId: string) {
    const command = new DeleteCommand({
      TableName: this.dndWindowsTable,
      Key: {
        userId,
        windowId
      }
    });

    await this.dynamoDB.send(command);
  }
}
