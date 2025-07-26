/**
 * DynamoDB Schema Definitions
 *
 * Defines table schemas and provides utilities for creating and managing
 * DynamoDB tables for VM orchestrator data.
 *
 * @fileoverview DynamoDB table schema definitions and management utilities
 */

import { CreateTableCommand, DescribeTableCommand, DeleteTableCommand } from "@aws-sdk/client-dynamodb";
import { getDynamoDBClient, getTableNames } from "./aws-client.js";

/**
 * VM table schema definition
 * Stores VM configuration and connection details
 */
export const VM_TABLE_SCHEMA = {
  TableName: "", // Will be set from config
  KeySchema: [
    {
      AttributeName: "id",
      KeyType: "HASH", // Partition key
    },
  ],
  AttributeDefinitions: [
    {
      AttributeName: "id",
      AttributeType: "S",
    },
    {
      AttributeName: "name",
      AttributeType: "S",
    },
    {
      AttributeName: "environment",
      AttributeType: "S",
    },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "NameEnvironmentIndex",
      KeySchema: [
        {
          AttributeName: "name",
          KeyType: "HASH",
        },
        {
          AttributeName: "environment",
          KeyType: "RANGE",
        },
      ],
      Projection: {
        ProjectionType: "ALL",
      },
      BillingMode: "PAY_PER_REQUEST",
    },
  ],
  BillingMode: "PAY_PER_REQUEST",
  Tags: [
    {
      Key: "Application",
      Value: "vm-orchestrator",
    },
    {
      Key: "Environment",
      Value: "development",
    },
  ],
};

/**
 * Commands table schema definition
 * Stores commands associated with specific VMs
 */
export const COMMANDS_TABLE_SCHEMA = {
  TableName: "", // Will be set from config
  KeySchema: [
    {
      AttributeName: "id",
      KeyType: "HASH", // Partition key
    },
  ],
  AttributeDefinitions: [
    {
      AttributeName: "id",
      AttributeType: "S",
    },
    {
      AttributeName: "vmId",
      AttributeType: "S",
    },
    {
      AttributeName: "name",
      AttributeType: "S",
    },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "VmIdIndex",
      KeySchema: [
        {
          AttributeName: "vmId",
          KeyType: "HASH",
        },
      ],
      Projection: {
        ProjectionType: "ALL",
      },
      BillingMode: "PAY_PER_REQUEST",
    },
    {
      IndexName: "VmIdNameIndex",
      KeySchema: [
        {
          AttributeName: "vmId",
          KeyType: "HASH",
        },
        {
          AttributeName: "name",
          KeyType: "RANGE",
        },
      ],
      Projection: {
        ProjectionType: "ALL",
      },
      BillingMode: "PAY_PER_REQUEST",
    },
  ],
  BillingMode: "PAY_PER_REQUEST",
  Tags: [
    {
      Key: "Application",
      Value: "vm-orchestrator",
    },
    {
      Key: "Environment",
      Value: "development",
    },
  ],
};

/**
 * Job cache table schema definition
 * Stores cached job information for quick retrieval
 */
export const JOB_CACHE_TABLE_SCHEMA = {
  TableName: "", // Will be set from config
  KeySchema: [
    {
      AttributeName: "vmId",
      KeyType: "HASH", // Partition key
    },
    {
      AttributeName: "jobId",
      KeyType: "RANGE", // Sort key
    },
  ],
  AttributeDefinitions: [
    {
      AttributeName: "vmId",
      AttributeType: "S",
    },
    {
      AttributeName: "jobId",
      AttributeType: "S",
    },
    {
      AttributeName: "status",
      AttributeType: "S",
    },
    {
      AttributeName: "createdAt",
      AttributeType: "N",
    },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "StatusIndex",
      KeySchema: [
        {
          AttributeName: "status",
          KeyType: "HASH",
        },
        {
          AttributeName: "createdAt",
          KeyType: "RANGE",
        },
      ],
      Projection: {
        ProjectionType: "ALL",
      },
      BillingMode: "PAY_PER_REQUEST",
    },
  ],
  BillingMode: "PAY_PER_REQUEST",
  TimeToLiveSpecification: {
    AttributeName: "ttl",
    Enabled: true,
  },
  Tags: [
    {
      Key: "Application",
      Value: "vm-orchestrator",
    },
    {
      Key: "Environment",
      Value: "development",
    },
  ],
};

/**
 * Get all table schemas with configured table names
 * @returns {Array<Object>} Array of table schema objects
 */
export function getTableSchemas() {
  const tableNames = getTableNames();
  
  const vmSchema = { ...VM_TABLE_SCHEMA };
  vmSchema.TableName = tableNames.vms;
  
  const commandsSchema = { ...COMMANDS_TABLE_SCHEMA };
  commandsSchema.TableName = tableNames.commands;
  
  const jobCacheSchema = { ...JOB_CACHE_TABLE_SCHEMA };
  jobCacheSchema.TableName = tableNames.jobCache;
  
  return [vmSchema, commandsSchema, jobCacheSchema];
}

/**
 * Check if a table exists
 * @param {string} tableName - Name of the table to check
 * @returns {Promise<boolean>} True if table exists
 */
export async function tableExists(tableName) {
  try {
    const client = getDynamoDBClient();
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error) {
    if (error.name === "ResourceNotFoundException") {
      return false;
    }
    throw error;
  }
}

/**
 * Create a DynamoDB table
 * @param {Object} tableSchema - Table schema definition
 * @returns {Promise<void>}
 */
export async function createTable(tableSchema) {
  const client = getDynamoDBClient();
  
  try {
    console.log(`Creating table: ${tableSchema.TableName}`);
    await client.send(new CreateTableCommand(tableSchema));
    console.log(`Table ${tableSchema.TableName} created successfully`);
  } catch (error) {
    if (error.name === "ResourceInUseException") {
      console.log(`Table ${tableSchema.TableName} already exists`);
    } else {
      throw error;
    }
  }
}

/**
 * Delete a DynamoDB table
 * @param {string} tableName - Name of the table to delete
 * @returns {Promise<void>}
 */
export async function deleteTable(tableName) {
  const client = getDynamoDBClient();
  
  try {
    console.log(`Deleting table: ${tableName}`);
    await client.send(new DeleteTableCommand({ TableName: tableName }));
    console.log(`Table ${tableName} deleted successfully`);
  } catch (error) {
    if (error.name === "ResourceNotFoundException") {
      console.log(`Table ${tableName} does not exist`);
    } else {
      throw error;
    }
  }
}

/**
 * Create all required tables
 * @returns {Promise<void>}
 */
export async function createAllTables() {
  const schemas = getTableSchemas();
  
  for (const schema of schemas) {
    await createTable(schema);
  }
}

/**
 * Delete all tables
 * @returns {Promise<void>}
 */
export async function deleteAllTables() {
  const tableNames = getTableNames();
  
  for (const tableName of Object.values(tableNames)) {
    await deleteTable(tableName);
  }
}
