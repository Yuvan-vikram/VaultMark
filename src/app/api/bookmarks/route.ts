import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

// This pulls the URL from Vercel's environment variables
const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM bookmarks ORDER BY id ASC`;
    return NextResponse.json({ tree: rows });
  } catch (err: any) {
    console.error("GET Error:", err);
    return NextResponse.json({ error: 'Fetch Error', details: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, url, description, tags, folderId, type } = await request.json();

    await sql`
      INSERT INTO bookmarks (name, url, description, tags, folder_id, type) 
      VALUES (
        ${name || 'Untitled'}, 
        ${url || ''}, 
        ${description || ''}, 
        ${JSON.stringify(tags || [])}, 
        ${folderId || null}, 
        ${type || 'link'}
      )
    `;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST Error:", err);
    return NextResponse.json({ error: 'Save Error', details: err.message }, { status: 500 });
  }
}