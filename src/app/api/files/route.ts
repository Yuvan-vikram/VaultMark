import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'

// List all available Windows drives by checking A-Z
function getWindowsDrives(): string[] {
  const drives: string[] = []
  for (let i = 65; i <= 90; i++) {
    const drive = String.fromCharCode(i) + ':\\'
    try {
      fs.accessSync(drive)
      drives.push(drive)
    } catch {}
  }
  return drives
}

const isWindows = process.platform === 'win32'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  let rawPath = searchParams.get('path') || os.homedir()

  // Special virtual root for Windows — show all drives
  if (rawPath === 'drives' || rawPath === '/') {
    if (isWindows) {
      const drives = getWindowsDrives()
      return NextResponse.json({
        type: 'directory',
        path: 'drives',
        name: 'This PC',
        parent: null,
        homedir: os.homedir(),
        sep: path.sep,
        items: drives.map(d => ({
          name: d,
          path: d,
          type: 'directory',
          ext: '',
          size: 0,
          modified: '',
        })),
      })
    }
  }

  // Handle ~ tilde (Windows doesn't expand it)
  if (rawPath === '~' || rawPath.startsWith('~/') || rawPath.startsWith('~\\')) {
    rawPath = rawPath.replace(/^~/, os.homedir())
  }

  // On Windows: handle bare drive letters like "D:" → "D:\"
  if (isWindows && /^[A-Za-z]:$/.test(rawPath)) {
    rawPath = rawPath + '\\'
  }

  // On Windows: normalize forward slashes to backslashes
  if (isWindows) {
    rawPath = rawPath.replace(/\//g, '\\')
  }

  // Use the path as-is if it's absolute, otherwise resolve relative to cwd
  const resolved = path.isAbsolute(rawPath) ? rawPath : path.resolve(rawPath)

  try {
    const stat = fs.statSync(resolved)

    if (stat.isFile()) {
      return NextResponse.json({
        type: 'file',
        path: resolved,
        name: path.basename(resolved),
        size: stat.size,
        modified: stat.mtime.toISOString(),
        ext: path.extname(resolved).toLowerCase(),
      })
    }

    // Directory listing
    const entries = fs.readdirSync(resolved, { withFileTypes: true })

    const items = entries
      .filter(e => !e.name.startsWith('.'))
      .map(e => {
        const fullPath = path.join(resolved, e.name)
        let size = 0
        let modified = ''
        try {
          const s = fs.statSync(fullPath)
          size = s.size
          modified = s.mtime.toISOString()
        } catch {}
        return {
          name: e.name,
          path: fullPath,
          type: e.isDirectory() ? 'directory' : 'file',
          ext: e.isFile() ? path.extname(e.name).toLowerCase() : '',
          size,
          modified,
        }
      })
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
        return a.name.localeCompare(b.name)
      })

    // Parent: on Windows, drive root (e.g. D:\) should go up to "drives" virtual root
    let parent: string | null = null
    const dirname = path.dirname(resolved)
    if (dirname !== resolved) {
      parent = dirname
    } else if (isWindows) {
      // We're at a drive root — parent is the virtual drives list
      parent = 'drives'
    }

    return NextResponse.json({
      type: 'directory',
      path: resolved,
      name: path.basename(resolved) || resolved,
      parent,
      homedir: os.homedir(),
      sep: path.sep,
      isWindows,
      items,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Cannot read path' }, { status: 400 })
  }
}
