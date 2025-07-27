
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
      'SELECT * FROM logs WHERE job_id = $1 ORDER BY created_at DESC LIMIT $2',
      [jobId, capped]
    );
    return result.rows;
  }
} 