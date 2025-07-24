import { CreateTableCommand, CreateTableCommandInput, DeleteTableCommand } from "@aws-sdk/client-dynamodb";
import { dynamoDB } from "../config/dynamo";

export async function createTestTables() {
  const tables = [
    {
      TableName: 'UserPreferences-test',
      KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'S' }],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1,
      },
    },
    {
      TableName: 'DNDWindows-test',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'windowId', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'windowId', AttributeType: 'S' }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1,
      },
    }
  ] as CreateTableCommandInput[];

  for (const table of tables) {
    try {
      await dynamoDB.send(new CreateTableCommand(table));
      console.log(`Created test table: ${table.TableName}`);
    } catch (error: any) {
      if (error.name === 'ResourceInUseException') {
        console.log(`Test table ${table.TableName} already exists`);
      } else {
        throw error;
      }
    }
  }
}

export async function cleanupTestTables() {
  const tables = ['UserPreferences-test', 'DNDWindows-test'];

  for (const tableName of tables) {
    try {
      await dynamoDB.send(new DeleteTableCommand({ TableName: tableName }));
      console.log(`Deleted test table: ${tableName}`);
    } catch (error: any) {
      if (error.name !== 'ResourceNotFoundException') {
        console.error(`Error deleting test table ${tableName}:`, error);
      }
    }
  }
}
