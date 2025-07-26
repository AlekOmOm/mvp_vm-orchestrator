/**
 * AWS Client Configuration
 *
 * Provides configured AWS service clients for DynamoDB and Lambda operations.
 * Handles credential management and client initialization.
 *
 * @fileoverview AWS service client configuration and initialization
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { LambdaClient } from "@aws-sdk/client-lambda";
import { AWS_CONFIG } from "../config/index.js";

/**
 * DynamoDB client instance
 * @type {DynamoDBClient}
 */
let dynamoDBClient = null;

/**
 * DynamoDB Document client instance (high-level API)
 * @type {DynamoDBDocumentClient}
 */
let dynamoDBDocClient = null;

/**
 * Lambda client instance
 * @type {LambdaClient}
 */
let lambdaClient = null;

/**
 * Initialize AWS clients with configuration
 * @throws {Error} If AWS credentials are not configured
 */
function initializeClients() {
  if (!AWS_CONFIG.credentials) {
    throw new Error(
      "AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables."
    );
  }

  const clientConfig = {
    region: AWS_CONFIG.region,
    credentials: AWS_CONFIG.credentials,
  };

  // Initialize DynamoDB clients
  dynamoDBClient = new DynamoDBClient(clientConfig);
  dynamoDBDocClient = DynamoDBDocumentClient.from(dynamoDBClient);

  // Initialize Lambda client
  lambdaClient = new LambdaClient(clientConfig);
}

/**
 * Get DynamoDB Document client (high-level API)
 * @returns {DynamoDBDocumentClient} Configured DynamoDB Document client
 * @throws {Error} If clients are not initialized
 */
export function getDynamoDBDocClient() {
  if (!dynamoDBDocClient) {
    initializeClients();
  }
  return dynamoDBDocClient;
}

/**
 * Get DynamoDB client (low-level API)
 * @returns {DynamoDBClient} Configured DynamoDB client
 * @throws {Error} If clients are not initialized
 */
export function getDynamoDBClient() {
  if (!dynamoDBClient) {
    initializeClients();
  }
  return dynamoDBClient;
}

/**
 * Get Lambda client
 * @returns {LambdaClient} Configured Lambda client
 * @throws {Error} If clients are not initialized
 */
export function getLambdaClient() {
  if (!lambdaClient) {
    initializeClients();
  }
  return lambdaClient;
}

/**
 * Test AWS connectivity
 * @returns {Promise<boolean>} True if connection is successful
 */
export async function testAWSConnection() {
  try {
    const docClient = getDynamoDBDocClient();
    
    // Try to list tables to test connectivity
    const { ListTablesCommand } = await import("@aws-sdk/client-dynamodb");
    const client = getDynamoDBClient();
    await client.send(new ListTablesCommand({ Limit: 1 }));
    
    return true;
  } catch (error) {
    console.error("AWS connection test failed:", error.message);
    return false;
  }
}

/**
 * Get table names from configuration
 * @returns {Object} Object containing table names
 */
export function getTableNames() {
  return AWS_CONFIG.tables;
}

/**
 * Get Lambda function names from configuration
 * @returns {Object} Object containing Lambda function names
 */
export function getLambdaFunctionNames() {
  return AWS_CONFIG.lambda;
}
