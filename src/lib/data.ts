import fs from 'fs'
import path from 'path'

export type BookmarkItem = {
  id: string
  type: 'link' | 'folder'
  name: string
  url?: string
  description?: string
  tags?: string[]
  color?: string
  children?: BookmarkItem[]
  createdAt: string
  updatedAt: string
}

export type BookmarksData = {
  version: number
  tree: BookmarkItem[]
}

// Support custom DATA_DIR env var — useful for hosted deployments
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), 'data')

const BOOKMARKS_FILE = path.join(DATA_DIR, 'bookmarks.json')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

export function readBookmarks(): BookmarksData {
  ensureDataDir()
  if (!fs.existsSync(BOOKMARKS_FILE)) {
    const initial: BookmarksData = {
      version: 1,
      tree: [
        {
          id: 'folder-work',
          type: 'folder',
          name: 'Work',
          color: '#3b82f6',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          children: [
            {
              id: 'link-gh',
              type: 'link',
              name: 'GitHub',
              url: 'https://github.com',
              description: 'Code hosting',
              tags: ['dev'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        },
        {
          id: 'folder-local',
          type: 'folder',
          name: 'Local Servers',
          color: '#10b981',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          children: [
            {
              id: 'link-local',
              type: 'link',
              name: 'Dev Server :3000',
              url: 'http://localhost:3000',
              description: 'Local React dev',
              tags: ['local'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        },
      ],
    }
    fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify(initial, null, 2))
    return initial
  }
  return JSON.parse(fs.readFileSync(BOOKMARKS_FILE, 'utf-8'))
}

export function writeBookmarks(data: BookmarksData) {
  ensureDataDir()
  fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify(data, null, 2))
}

export function findById(tree: BookmarkItem[], id: string): BookmarkItem | null {
  for (const item of tree) {
    if (item.id === id) return item
    if (item.children) {
      const found = findById(item.children, id)
      if (found) return found
    }
  }
  return null
}

export function insertInto(tree: BookmarkItem[], folderId: string | null, item: BookmarkItem): boolean {
  if (!folderId) { tree.push(item); return true }
  for (const node of tree) {
    if (node.id === folderId && node.type === 'folder') {
      node.children = node.children || []
      node.children.push(item)
      return true
    }
    if (node.children && insertInto(node.children, folderId, item)) return true
  }
  return false
}

export function deleteById(tree: BookmarkItem[], id: string): boolean {
  const idx = tree.findIndex(i => i.id === id)
  if (idx !== -1) { tree.splice(idx, 1); return true }
  for (const node of tree) {
    if (node.children && deleteById(node.children, id)) return true
  }
  return false
}

export function updateById(tree: BookmarkItem[], id: string, patch: Partial<BookmarkItem>): boolean {
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].id === id) {
      Object.assign(tree[i], patch, { updatedAt: new Date().toISOString() })
      return true
    }
    if (tree[i].children && updateById(tree[i].children!, id, patch)) return true
  }
  return false
}
