
import pg from 'pg';

export class LogModel {
  constructor(db) {
    this.db = db;
  }

  async getLogs(limit = 10) {
    const capped = Math.min(parseInt(limit) || 10, 100);
    const result = await this.db.query(
      'SELECT * FROM logs ORDER BY created_at DESC LIMIT $1',
      [capped]
    );
    return result.rows;
  }

  async getLogsForJob(jobId, limit = 10000) {
    const capped = Math.min(parseInt(limit) || 10000, 10000);
    const result = await this.db.query(
      'SELECT * FROM logs WHERE job_id = $1 ORDER BY created_at ASC LIMIT $2',
      [jobId, capped]
    );
    return result.rows;
  }

  async createLog(logData) {
    const { jobId, stream, data, timestamp } = logData;
    const result = await this.db.query(
      'INSERT INTO logs (job_id, stream, data, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [jobId, stream || 'stdout', data, timestamp || new Date().toISOString()]
    );
    return result.rows[0];
  }

  async createLogsBatch(logsArray) {
    if (!Array.isArray(logsArray) || logsArray.length === 0) {
      return [];
    }

    const values = [];
    const placeholders = [];
    
    logsArray.forEach((log, index) => {
      const baseIndex = index * 4;
      placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4})`);
      values.push(
        log.jobId,
        log.stream || 'stdout',
        log.data,
        log.timestamp || new Date().toISOString()
      );
    });

    const query = `
      INSERT INTO logs (job_id, stream, data, created_at) 
      VALUES ${placeholders.join(', ')} 
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows;
  }
} 