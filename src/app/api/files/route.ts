import { Pool } from 'pg';
import { NextResponse } from 'next/server';

// This connects using the URL in your .env.local file
const pool = new Pool({
  // Use POSTGRES_URL if it's in your Vercel settings, otherwise stick to DATABASE_URL
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: {
    // This is the "Magic Fix" for Vercel + Neon
    rejectUnauthorized: false 
  }
});
export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM bookmarks ORDER BY id ASC');
    client.release();
    
    // We send back the rows directly
    return NextResponse.json({ tree: result.rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Database Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { name, url, description, tags, folderId, type } = await request.json();
  try {
    const client = await pool.connect();
    await client.query(
      'INSERT INTO bookmarks (name, url, description, tags, folder_id, type) VALUES ($1, $2, $3, $4, $5, $6)',
      [name, url, description, JSON.stringify(tags || []), folderId, type]
    );
    client.release();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Save Error' }, { status: 500 });
  }
}