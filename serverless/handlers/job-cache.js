import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({});
const JOB_CACHE_TABLE = process.env.JOB_CACHE_TABLE;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};

/**
 * Calculate TTL (24 hours from now)
 */
function calculateTTL() {
  return Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
}

export const api = async (event) => {
  const { body, pathParameters, queryStringParameters } = event;
  const { method: httpMethod, path } = event.requestContext.http;

  try {
    // GET /api/vms/{vmId}/jobs - Get cached jobs for a VM
    if (httpMethod === 'GET' && path.match(/^\/api\/vms\/[^\/]+\/jobs$/)) {
      const { vmId } = pathParameters;
      const limit = queryStringParameters?.limit ? parseInt(queryStringParameters.limit) : 50;
      const status = queryStringParameters?.status;
      
      let queryParams = {
        TableName: JOB_CACHE_TABLE,
        KeyConditionExpression: 'vmId = :vmId',
        ExpressionAttributeValues: marshall({
          ':vmId': vmId
        }),
        Limit: Math.min(limit, 100), // Cap at 100
        ScanIndexForward: false // Most recent first
      };
      
      // Filter by status if provided
      if (status) {
        queryParams.FilterExpression = '#status = :status';
        queryParams.ExpressionAttributeNames = { '#status': 'status' };
        queryParams.ExpressionAttributeValues[':status'] = status;
      }
      
      const { Items } = await client.send(new QueryCommand(queryParams));
      const jobs = Items ? Items.map(item => unmarshall(item)) : [];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(jobs),
      };
    }

    // PUT /api/jobs/{jobId} - Update/Create job cache entry
    if (httpMethod === 'PUT' && path.startsWith('/api/jobs/')) {
      const { jobId } = pathParameters;
      const jobData = JSON.parse(body);
      
      // Validate required fields
      if (!jobData.vmId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'vmId is required' }),
        };
      }
      
      // Prepare job cache entry
      const jobCacheEntry = {
        vmId: jobData.vmId,
        jobId: jobId,
        status: jobData.status || 'running',
        command: jobData.command || '',
        type: jobData.type || 'stream',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ttl: calculateTTL(),
        ...jobData
      };
      
      // Remove vmId and jobId from the data since they're keys
      delete jobCacheEntry.vmId;
      delete jobCacheEntry.jobId;
      
      const updateExpression = 'SET ' + Object.keys(jobCacheEntry).map(key => `#${key} = :${key}`).join(', ');
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      for (const key in jobCacheEntry) {
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = jobCacheEntry[key];
      }

      const { Attributes } = await client.send(new UpdateItemCommand({
        TableName: JOB_CACHE_TABLE,
        Key: marshall({ 
          vmId: jobData.vmId, 
          jobId: jobId 
        }),
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: marshall(expressionAttributeValues),
        ReturnValues: 'ALL_NEW',
      }));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(unmarshall(Attributes)),
      };
    }

    // DELETE /api/jobs/{jobId} - Delete job cache entry
    if (httpMethod === 'DELETE' && path.startsWith('/api/jobs/')) {
      const { jobId } = pathParameters;
      const { vmId } = queryStringParameters || {};
      
      if (!vmId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'vmId query parameter is required' }),
        };
      }
      
      await client.send(new DeleteItemCommand({
        TableName: JOB_CACHE_TABLE,
        Key: marshall({ 
          vmId: vmId, 
          jobId: jobId 
        }),
      }));
      
      return {
        statusCode: 204,
        headers,
        body: '',
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not Found' }),
    };
    
  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Internal Server Error' 
      }),
    };
  }
};
