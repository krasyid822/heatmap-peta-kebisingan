import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

export async function POST(request: Request) {
  try {
    const { latitude, longitude, radiusMeters } = await request.json();

    if (!latitude || !longitude || !radiusMeters) {
      return NextResponse.json({ message: 'Parameter tidak lengkap.' }, { status: 400 });
    }

    // QUERY ANALISIS SPASIAL: Cari titik dalam radius tertentu (ST_DWithin)
    // Menggunakan geography untuk perhitungan jarak dalam meter yang akurat
    const query = `
      SELECT 
        id,
        latitude, 
        longitude, 
        noise_db,
        ST_Distance(
            geom::geography, 
            ST_MakePoint($2, $1)::geography
        ) as distance_meters
      FROM 
        noise_measurements
      WHERE 
        ST_DWithin(
            geom::geography, 
            ST_MakePoint($2, $1)::geography, 
            $3
        )
      ORDER BY 
        distance_meters ASC;
    `;

    const { rows } = await pool.query(query, [latitude, longitude, radiusMeters]);
    return NextResponse.json(rows);

  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}