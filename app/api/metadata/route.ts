import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

export async function GET() {
  try {
    const query = `
      SELECT 
        EXTRACT(EPOCH FROM MIN(timestamp_utc)) * 1000 as min_time,
        EXTRACT(EPOCH FROM MAX(timestamp_utc)) * 1000 as max_time,
        MIN(altitude_m) as min_alt,
        MAX(altitude_m) as max_alt
      FROM 
        noise_measurements
    `;

    const { rows } = await pool.query(query);
    
    return NextResponse.json({
      minTime: rows[0].min_time ? parseFloat(rows[0].min_time) : null,
      maxTime: rows[0].max_time ? parseFloat(rows[0].max_time) : null,
      minAlt: rows[0].min_alt ? parseFloat(rows[0].min_alt) : 0,
      maxAlt: rows[0].max_alt ? parseFloat(rows[0].max_alt) : 5000,
    });

  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}