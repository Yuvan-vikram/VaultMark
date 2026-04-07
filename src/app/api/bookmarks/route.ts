import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);

// 1. FETCH ALL (GET)
export async function GET() {
  try {
    const rows = await sql`SELECT * FROM bookmarks ORDER BY id ASC`;
    return NextResponse.json({ tree: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. ADD NEW (POST)
export async function POST(request: Request) {
  try {
    const { name, url, description, tags, folderId, type } = await request.json();
    await sql`
      INSERT INTO bookmarks (name, url, description, tags, folder_id, type) 
      VALUES (${name}, ${url}, ${description}, ${JSON.stringify(tags || [])}, ${folderId}, ${type})
    `;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 3. EDIT (PUT)
export async function PUT(request: Request) {
  try {
    const { id, name, url, description, tags } = await request.json();
    await sql`
      UPDATE bookmarks 
      SET name = ${name}, url = ${url}, description = ${description}, tags = ${JSON.stringify(tags || [])}
      WHERE id = ${id}
    `;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 4. DELETE (DELETE)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await sql`DELETE FROM bookmarks WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
