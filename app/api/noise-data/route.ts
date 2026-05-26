import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const startHour = searchParams.get('startHour');
    const endHour = searchParams.get('endHour');
    const minAlt = searchParams.get('minAlt');
    const maxAlt = searchParams.get('maxAlt');

    const conditions: string[] = [];
    const queryParams: any[] = [];

    // Filter Tanggal dengan amandemen waktu zona
    if (startDate && endDate) {
      // Pastikan pencarian meliputi seluruh hari pada endDate
      conditions.push(`timestamp_utc IS NOT NULL AND timestamp_utc >= $${queryParams.length + 1}::timestamp AND timestamp_utc <= $${queryParams.length + 2}::timestamp + interval '1 day' - interval '1 second'`);
      queryParams.push(startDate, endDate);
    }

    if (startHour && endHour) {
      conditions.push(`timestamp_utc IS NOT NULL AND EXTRACT(HOUR FROM timestamp_utc) BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`);
      queryParams.push(parseInt(startHour), parseInt(endHour));
    }

    if (minAlt && maxAlt) {
      conditions.push(`altitude_m IS NOT NULL AND altitude_m BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`);
      queryParams.push(parseFloat(minAlt), parseFloat(maxAlt));
    }

    let queryText = `
      SELECT 
        id, latitude, longitude, noise_db, timestamp_utc, altitude_m
      FROM 
        noise_measurements
    `;

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }

    const { rows } = await pool.query(queryText, queryParams);

    return NextResponse.json(rows);

  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}