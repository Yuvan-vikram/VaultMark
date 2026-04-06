import { NextRequest, NextResponse } from 'next/server'
import { readBookmarks, writeBookmarks, deleteById, updateById } from '@/lib/data'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const data = readBookmarks()
    const updated = updateById(data.tree, params.id, body)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    writeBookmarks(data)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = readBookmarks()
    const deleted = deleteById(data.tree, params.id)
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    writeBookmarks(data)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
