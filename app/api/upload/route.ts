import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Konfigurasi pool koneksi yang sama dengan route GET
const pool = new Pool({
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'File tidak ditemukan.' }, { status: 400 });
    }

    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim() !== '');

    if (lines.length <= 1) {
      return NextResponse.json({ message: 'File CSV kosong atau hanya berisi header.' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const latIndex = headers.indexOf('latitude');
    const lngIndex = headers.indexOf('longitude');
    const noiseIndex = headers.indexOf('noise_db');
    const timeIndex = headers.indexOf('timestamp_utc');
    const altIndex = headers.indexOf('altitude_m');

    if (latIndex === -1 || lngIndex === -1 || noiseIndex === -1) {
      return NextResponse.json({ message: 'Header CSV harus mengandung: latitude, longitude, dan noise_db.' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN'); // Memulai transaksi

      // Loop untuk setiap baris data (selain header)
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        
        const latitude = parseFloat(values[latIndex]);
        const longitude = parseFloat(values[lngIndex]);
        const noise_db = parseFloat(values[noiseIndex]);
        
        // Pastikan data numerik valid
        if (isNaN(latitude) || isNaN(longitude) || isNaN(noise_db)) {
            console.warn(`Melewati baris tidak valid: ${lines[i]}`);
            continue; // Lewati baris ini jika data tidak valid
        }

        const timestamp_utc = timeIndex > -1 ? values[timeIndex] : null;
        const altitude_m = altIndex > -1 ? parseFloat(values[altIndex]) : null;

        // Query DML Spasial menggunakan PostGIS ST_MakePoint
        // Ini adalah query yang aman dari SQL Injection karena menggunakan parameterized query
        const queryText = `
          INSERT INTO noise_measurements 
            (timestamp_utc, longitude, latitude, altitude_m, noise_db, geom)
          VALUES 
            ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($2, $3), 4326))
        `;
        
        await client.query(queryText, [timestamp_utc, longitude, latitude, altitude_m, noise_db]);
      }

      await client.query('COMMIT'); // Menyimpan semua data jika tidak ada error
      return NextResponse.json({ message: `Berhasil memasukkan ${lines.length - 1} baris data ke database.` });

    } catch (dbError) {
      await client.query('ROLLBACK'); // Batalkan semua insert jika ada satu yang gagal
      console.error('Database transaction error:', dbError);
      return NextResponse.json({ message: 'Gagal menyimpan data ke database.' }, { status: 500 });
    } finally {
      client.release(); // Melepaskan koneksi kembali ke pool
    }

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json({ message: 'Terjadi error saat memproses file.' }, { status: 500 });
  }
}