import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

// This creates a connection using your environment variable
// Adding ! at the end tells TypeScript this will definitely be a string
const sql = neon((process.env.DATABASE_URL || process.env.POSTGRES_URL)!);

export async function GET() {
  try {
    // Standard Neon fetch
    const rows = await sql`SELECT * FROM bookmarks ORDER BY id ASC`;
    
    return NextResponse.json({ tree: rows });
  } catch (err) {
    console.error("GET Error:", err);
    return NextResponse.json({ error: 'Database Error', details: err }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, url, description, tags, folderId, type } = await request.json();

    // Use tagged template literals for safe, easy insertion
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
  } catch (err) {
    console.error("POST Error:", err);
    return NextResponse.json({ 
      error: 'Save Error', 
      details: err  // This helps us see the REAL error in the Network tab
    }, { status: 500 });
  }
}