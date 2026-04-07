'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Bookmark, HardDrive, Plus, FolderPlus, Search,
  ExternalLink, Copy, Tag, Star, LayoutGrid, List, ChevronRight
} from 'lucide-react'
import { BookmarkTree } from '@/components/BookmarkTree'
import { FileBrowser } from '@/components/FileBrowser'
import { ItemModal } from '@/components/ItemModal'
import type { BookmarkItem } from '@/lib/data'

type Tab = 'bookmarks' | 'files'
type Modal = { mode: 'add-link' | 'add-folder' | 'edit'; folderId: string | null; item?: BookmarkItem } | null
type ViewMode = 'grid' | 'list'

function flattenLinks(tree: BookmarkItem[]): BookmarkItem[] {
  const result: BookmarkItem[] = []
  function walk(items: BookmarkItem[]) {
    for (const item of items) {
      if (item.type === 'link') result.push(item)
      if (item.children) walk(item.children)
    }
  }
  walk(tree)
  return result
}

function getFolderDirectLinks(tree: BookmarkItem[], folderId: string | null): BookmarkItem[] {
  if (!folderId) return flattenLinks(tree)
  function find(items: BookmarkItem[]): BookmarkItem[] | null {
    for (const item of items) {
      if (item.id === folderId) return (item.children || []).filter(i => i.type === 'link')
      if (item.children) {
        const found = find(item.children)
        if (found !== null) return found
      }
    }
    return null
  }
  return find(tree) || []
}

function getFolderName(tree: BookmarkItem[], folderId: string | null): string {
  if (!folderId) return 'All bookmarks'
  function find(items: BookmarkItem[]): string | null {
    for (const item of items) {
      if (item.id === folderId) return item.name
      if (item.children) {
        const found = find(item.children)
        if (found) return found
      }
    }
    return null
  }
  return find(tree) || 'Folder'
}

export default function Home() {
  const [tab, setTab] = useState<Tab>('bookmarks')
  const [tree, setTree] = useState<BookmarkItem[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [modal, setModal] = useState<Modal>(null)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [copied, setCopied] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [pathPickerMode, setPathPickerMode] = useState(false)
  const pathPickerCallback = useRef<((path: string) => void) | null>(null)

  const loadBookmarks = useCallback(async () => {
    try {
      const res = await fetch('/api/bookmarks')
      const data = await res.json()
      setTree(data.tree || [])
    } catch (error) {
      console.error("Failed to load bookmarks:", error)
    }
  }, [])

  useEffect(() => { loadBookmarks() }, [loadBookmarks])

  async function handleAddItem(data: any, folderId: string | null) {
    setSaving(true)
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, folderId, type: modal?.mode === 'add-folder' ? 'folder' : 'link' }),
      });
      if (!res.ok) throw new Error('Failed to save')
      setModal(null)
      await loadBookmarks()
    } catch (e) {
      alert('Failed to save bookmark. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleEditItem(data: any, itemId: string) {
    setSaving(true)
    try {
      // Using PUT as defined in our route.ts
      const res = await fetch('/api/bookmarks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id: itemId }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setModal(null)
      await loadBookmarks()
    } catch (e) {
      alert('Failed to update. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this item?')) return
    try {
      const res = await fetch(`/api/bookmarks?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      await loadBookmarks()
    } catch (e) {
      alert('Failed to delete item.')
    }
  }

  function handleOpenLink(url: string) {
    if (!url) return
    if (url.startsWith('http')) {
      window.open(url, '_blank')
    } else {
      navigator.clipboard.writeText(url).catch(() => {})
      setCopied(url)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  function copyPath(path: string) {
    navigator.clipboard.writeText(path).catch(() => {})
    setCopied(path)
    setTimeout(() => setCopied(null), 2000)
  }

  function handleBrowseForPath(cb: (path: string) => void) {
    pathPickerCallback.current = cb
    setPathPickerMode(true)
    setTab('files')
  }

  function handlePathPicked(path: string) {
    if (pathPickerCallback.current) {
      pathPickerCallback.current(path)
      pathPickerCallback.current = null
    }
    setPathPickerMode(false)
    setTab('bookmarks')
  }

  const allLinks = flattenLinks(tree)
  const displayLinks = search
    ? allLinks.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.url || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
      )
    : getFolderDirectLinks(tree, selectedFolder)

  const allTags = Array.from(new Set(allLinks.flatMap(i => i.tags || [])))
  const folderName = getFolderName(tree, selectedFolder)

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <header
        className="flex items-center gap-4 px-5 h-14 flex-shrink-0"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <Bookmark size={14} color="#0f0f0e" />
          </div>
          <span className="font-semibold text-base tracking-tight">VaultMark</span>
        </div>

        <div className="flex gap-1 ml-4">
          {([['bookmarks', Bookmark, 'Bookmarks'], ['files', HardDrive, 'File Browser']] as const).map(([id, Icon, label]) => (
            <button
              key={id}
              onClick={() => { setTab(id); setPathPickerMode(false) }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all"
              style={{
                background: tab === id ? 'var(--surface2)' : 'transparent',
                color: tab === id ? 'var(--text)' : 'var(--text2)',
                borderBottom: tab === id ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {pathPickerMode && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm flex-1"
            style={{ background: 'rgba(240,165,0,0.12)', border: '1px solid rgba(240,165,0,0.3)', color: 'var(--accent)' }}
          >
            <span className="font-medium">📂 Pick a file or folder path</span>
            <button
              onClick={() => { setPathPickerMode(false); setTab('bookmarks') }}
              className="ml-auto px-2 py-0.5 rounded text-xs"
              style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
            >
              Cancel
            </button>
          </div>
        )}

        {tab === 'bookmarks' && !pathPickerMode && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search bookmarks..."
                className="pl-8 pr-3 py-1.5 text-sm w-56 outline-none rounded-lg"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
              />
            </div>
            <button
              onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
              className="p-2 rounded-lg"
              style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              title="Toggle view"
            >
              {viewMode === 'grid' ? <List size={15} /> : <LayoutGrid size={15} />}
            </button>
            <button
              onClick={() => setModal({ mode: 'add-folder', folderId: selectedFolder })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
              style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
            >
              <FolderPlus size={14} />
              Folder
            </button>
            <button
              onClick={() => setModal({ mode: 'add-link', folderId: selectedFolder })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: 'var(--accent)', color: '#0f0f0e' }}
            >
              <Plus size={14} />
              Add link
            </button>
          </div>
        )}
      </header>

      {tab === 'bookmarks' ? (
        <div className="flex flex-1 overflow-hidden">
          <aside
            className="w-56 flex-shrink-0 overflow-y-auto py-3 px-2"
            style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
          >
            <div
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer mb-1 transition-all"
              style={{
                background: !selectedFolder && !search ? 'var(--surface2)' : 'transparent',
                borderLeft: !selectedFolder && !search ? '2px solid var(--accent)' : '2px solid transparent',
              }}
              onClick={() => { setSelectedFolder(null); setSearch('') }}
            >
              <Star size={14} style={{ color: 'var(--accent)' }} />
              <span className="text-sm font-medium">All bookmarks</span>
              <span className="ml-auto text-xs" style={{ color: 'var(--text3)' }}>{allLinks.length}</span>
            </div>

            <div className="my-2" style={{ borderTop: '1px solid var(--border)' }} />
            <div className="text-xs px-2 mb-1" style={{ color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Folders</div>

            <BookmarkTree
              tree={tree}
              selectedFolder={selectedFolder}
              onSelectFolder={setSelectedFolder}
              onAddItem={(folderId, type) => setModal({ mode: type === 'folder' ? 'add-folder' : 'add-link', folderId })}
              onDelete={handleDelete}
              onEdit={item => setModal({ mode: 'edit', folderId: null, item })}
              onOpenLink={handleOpenLink}
            />

            {allTags.length > 0 && (
              <>
                <div className="my-2" style={{ borderTop: '1px solid var(--border)' }} />
                <div className="text-xs px-2 mb-2" style={{ color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Tags</div>
                <div className="flex flex-wrap gap-1 px-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSearch(tag)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all"
                      style={{
                        background: search === tag ? 'var(--accent)' : 'var(--surface2)',
                        color: search === tag ? '#0f0f0e' : 'var(--text2)',
                      }}
                    >
                      <Tag size={10} />
                      {tag}
                    </button>
                  ))}
                </div>
              </>
            )}
          </aside>

          <main className="flex-1 overflow-y-auto p-5">
            <div className="flex items-center gap-1 mb-4">
              <button
                onClick={() => { setSelectedFolder(null); setSearch('') }}
                className="text-sm hover:underline"
                style={{ color: selectedFolder || search ? 'var(--text2)' : 'var(--text)' }}
              >
                All bookmarks
              </button>
              {selectedFolder && (
                <>
                  <ChevronRight size={14} style={{ color: 'var(--text3)' }} />
                  <span className="text-sm font-medium">{folderName}</span>
                </>
              )}
              {search && (
                <>
                  <ChevronRight size={14} style={{ color: 'var(--text3)' }} />
                  <span className="text-sm" style={{ color: 'var(--text2)' }}>Search: "{search}"</span>
                </>
              )}
              <span className="ml-2 text-xs" style={{ color: 'var(--text3)' }}>({displayLinks.length})</span>
            </div>

            {displayLinks.length === 0 && (
              <div
                className="flex flex-col items-center justify-center rounded-2xl py-16 text-center"
                style={{ background: 'var(--surface)', border: '1px dashed var(--border2)' }}
              >
                <Bookmark size={32} style={{ color: 'var(--text3)', marginBottom: 12 }} />
                <p className="text-sm" style={{ color: 'var(--text2)' }}>
                  {search ? 'No results found' : 'No links here yet'}
                </p>
                {!search && (
                  <button
                    onClick={() => setModal({ mode: 'add-link', folderId: selectedFolder })}
                    className="mt-3 px-4 py-2 rounded-lg text-sm font-medium"
                    style={{ background: 'var(--accent)', color: '#0f0f0e' }}
                  >
                    + Add your first link
                  </button>
                )}
              </div>
            )}

            <div className={viewMode === 'grid' ? "grid gap-3" : "flex flex-col gap-1"} 
                 style={viewMode === 'grid' ? { gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))' } : {}}>
              {displayLinks.map(item => (
                <div
                  key={item.id}
                  className={`group rounded-xl cursor-pointer transition-all relative ${viewMode === 'list' ? 'flex items-center p-3' : 'p-4'}`}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  onClick={() => handleOpenLink(item.url || '')}
                >
                  <div className={`flex items-start gap-3 ${viewMode === 'list' ? 'flex-1 items-center' : 'mb-2'}`}>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: 'var(--surface2)', color: 'var(--accent)' }}
                    >
                      {item.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.name}</div>
                      <div className="text-xs truncate mt-0.5" style={{ color: 'var(--text3)', fontFamily: 'monospace' }}>
                        {item.url}
                      </div>
                    </div>
                  </div>
                  
                  {viewMode === 'grid' && item.description && (
                    <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--text2)' }}>{item.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {item.tags?.map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--surface2)', color: 'var(--text3)' }}>
                        #{t}
                      </span>
                    ))}
                  </div>

                  <div className={`flex gap-1 transition-opacity ${viewMode === 'grid' ? 'absolute top-3 right-3 opacity-0 group-hover:opacity-100' : 'ml-auto opacity-0 group-hover:opacity-100'}`}>
                    <button
                      onClick={e => { e.stopPropagation(); setModal({ mode: 'edit', folderId: null, item }) }}
                      className="p-1.5 rounded-lg text-xs"
                      style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                      title="Edit"
                    >✎</button>
                    {item.url?.startsWith('http') ? (
                      <button
                        onClick={e => { e.stopPropagation(); window.open(item.url, '_blank') }}
                        className="p-1.5 rounded-lg"
                        style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                      >
                        <ExternalLink size={12} />
                      </button>
                    ) : (
                      <button
                        onClick={e => { e.stopPropagation(); copyPath(item.url || '') }}
                        className="p-1.5 rounded-lg"
                        style={{ background: 'var(--surface2)', color: copied === item.url ? '#10b981' : 'var(--text2)' }}
                      >
                        <Copy size={12} />
                      </button>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(item.id) }}
                      className="p-1.5 rounded-lg"
                      style={{ background: 'rgba(244,63,94,0.12)', color: '#f43f5e' }}
                    >×</button>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col">
          <FileBrowser
            pickerMode={pathPickerMode}
            onPickPath={handlePathPicked}
          />
        </div>
      )}

      {modal && (
        <ItemModal
          mode={modal.mode}
          folderId={modal.folderId}
          item={modal.item}
          saving={saving}
          onSave={(data) => {
            if (modal.mode === 'edit' && modal.item) {
              handleEditItem(data, modal.item.id)
            } else {
              handleAddItem(data, modal.folderId)
            }
          }}
          onClose={() => setModal(null)}
          onBrowse={handleBrowseForPath}
        />
      )}

      {copied && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium z-50"
          style={{ background: '#10b981', color: '#fff' }}>
          ✓ Path copied to clipboard
        </div>
      )}
    </div>
  )
}