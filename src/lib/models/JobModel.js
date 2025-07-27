import pg from 'pg';

export class JobModel {
  constructor(db) {
    this.db = db;
  }

  async getJobs(limit = 10) {
    const capped = Math.min(parseInt(limit) || 10, 100);
    const result = await this.db.query(
      'SELECT id, type, command, status, started_at, finished_at, exit_code FROM jobs ORDER BY started_at DESC LIMIT $1',
      [capped]
    );
    return result.rows;
  }

  async getJobLogs(jobId, limit = 10000) {
    const capped = Math.min(parseInt(limit) || 10000, 10000);
    const result = await this.db.query(
      'SELECT stream, chunk, ts AS timestamp FROM job_events WHERE job_id = $1 ORDER BY ts ASC LIMIT $2',
      [jobId, capped]
    );
    return result.rows;
  }
} 