import { CreateTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';

export const dynamoDB =
  new DynamoDBClient({
    region: 'us-west-2',
    endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
    credentials: {
      accessKeyId: 'fakeMyKeyId',
      secretAccessKey: 'fakeSecretAccessKey',
    },
  });

export async function setupDynamoTables() {
  try {
    await createUserPreferencesTable();
    console.log('UserPreferences table created successfully');

    await createDNDWindowsTable();
    console.log('DNDWindows table created successfully');
  } catch (error: any) {
    if (error.name !== 'ResourceInUseException') {
      console.error('Error creating tables:', error);
      throw error;
    }
    console.log('Tables already exist');
  }
}

async function createUserPreferencesTable() {
  const command = new CreateTableCommand({
    TableName: 'UserPreferences',
    KeySchema: [
      {
        AttributeName: 'userId',
        KeyType: 'HASH'
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'userId',
        AttributeType: 'S'
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1,
    },
  });

  return await dynamoDB.send(command);
}

async function createDNDWindowsTable() {
  const command = new CreateTableCommand({
    TableName: 'DNDWindows',
    KeySchema: [
      {
        AttributeName: 'userId',
        KeyType: 'HASH'
      },
      {
        AttributeName: 'windowId',
        KeyType: 'RANGE'
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'userId',
        AttributeType: 'S'
      },
      {
        AttributeName: 'windowId',
        AttributeType: 'S'
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1,
    },
  });

  return await dynamoDB.send(command);
}
