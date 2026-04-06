import { NextRequest, NextResponse } from 'next/server'
import { readBookmarks, writeBookmarks, insertInto } from '@/lib/data'
import type { BookmarkItem } from '@/lib/data'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const data = readBookmarks()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to read bookmarks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { folderId, type, name, url, description, tags, color } = body

    if (!name || !type) {
      return NextResponse.json({ error: 'name and type required' }, { status: 400 })
    }

    const data = readBookmarks()
    const now = new Date().toISOString()
    const item: BookmarkItem = {
      id: randomUUID(),
      type,
      name,
      url,
      description,
      tags: tags || [],
      color,
      children: type === 'folder' ? [] : undefined,
      createdAt: now,
      updatedAt: now,
    }

    insertInto(data.tree, folderId || null, item)
    writeBookmarks(data)
    return NextResponse.json({ ok: true, item })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}
