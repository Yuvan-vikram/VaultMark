'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Bookmark, HardDrive, Plus, FolderPlus, Search,
  ExternalLink, Copy, Tag, Star, LayoutGrid, List, ChevronRight, Palette
} from 'lucide-react'
import { BookmarkTree } from '@/components/BookmarkTree'
import { FileBrowser } from '@/components/FileBrowser'
import { ItemModal } from '@/components/ItemModal'
import type { BookmarkItem } from '@/lib/data'

type Tab = 'bookmarks' | 'files'
type Modal = { mode: 'add-link' | 'add-folder' | 'edit'; folderId: string | null; item?: BookmarkItem } | null
type ViewMode = 'grid' | 'list'
type Theme = 'dark' | 'midnight' | 'forest' | 'slate'

export default function Home() {
  const [tab, setTab] = useState<Tab>('bookmarks')
  const [tree, setTree] = useState<BookmarkItem[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [modal, setModal] = useState<Modal>(null)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [copied, setCopied] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [theme, setTheme] = useState<Theme>('dark')
  
  const [pathPickerMode, setPathPickerMode] = useState(false)
  const pathPickerCallback = useRef<((path: string) => void) | null>(null)

  // Theme Configuration
  const themes = {
    dark: { bg: '#0f0f0e', surface: '#1a1a19', border: '#262624' },
    midnight: { bg: '#020617', surface: '#0f172a', border: '#1e293b' },
    forest: { bg: '#050a05', surface: '#0a120a', border: '#142114' },
    slate: { bg: '#0f172a', surface: '#1e293b', border: '#334155' }
  }

  const loadBookmarks = useCallback(async () => {
    try {
      const res = await fetch('/api/bookmarks')
      const data = await res.json()
      setTree(data.tree || [])
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => { loadBookmarks() }, [loadBookmarks])

  // --- API HANDLERS ---
  async function handleAddItem(data: any, folderId: string | null) {
    setSaving(true)
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, folderId, type: modal?.mode === 'add-folder' ? 'folder' : 'link' }),
      })
      if (res.ok) { setModal(null); await loadBookmarks() }
    } catch (e) { alert('Save failed') } finally { setSaving(false) }
  }

  async function handleEditItem(data: any, itemId: string) {
    setSaving(true)
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id: itemId }),
      })
      if (res.ok) { setModal(null); await loadBookmarks() }
    } catch (e) { alert('Update failed') } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this item?')) return
    await fetch(`/api/bookmarks?id=${id}`, { method: 'DELETE' })
    await loadBookmarks()
  }

  function handleOpenLink(url: string) {
    if (!url) return
    if (url.startsWith('http')) {
      window.open(url, '_blank')
    } else {
      navigator.clipboard.writeText(url)
      setCopied(url); setTimeout(() => setCopied(null), 2000)
    }
  }

  // --- HELPERS ---
  const flattenLinks = (items: BookmarkItem[]): BookmarkItem[] => {
    let links: BookmarkItem[] = []
    items.forEach(i => {
      if (i.type === 'link') links.push(i)
      if (i.children) links = [...links, ...flattenLinks(i.children)]
    })
    return links
  }

  const getDisplayLinks = () => {
    const all = flattenLinks(tree)
    if (search) return all.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    if (!selectedFolder) return all
    
    const findFolderLinks = (items: BookmarkItem[]): BookmarkItem[] => {
      for (const item of items) {
        if (item.id === selectedFolder) return (item.children || []).filter(c => c.type === 'link')
        if (item.children) {
          const res = findFolderLinks(item.children)
          if (res.length) return res
        }
      }
      return []
    }
    return findFolderLinks(tree)
  }

  const displayLinks = getDisplayLinks()

  return (
    <div className="flex flex-col h-screen overflow-hidden transition-colors duration-500" 
         style={{ backgroundColor: themes[theme].bg, color: '#e5e7eb' }}>
      
      {/* Header */}
      <header className="flex items-center gap-4 px-5 h-14 flex-shrink-0" 
              style={{ backgroundColor: themes[theme].surface, borderBottom: `1px solid ${themes[theme].border}` }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#f0a500]">
            <Bookmark size={14} color="#0f0f0e" />
          </div>
          <span className="font-semibold text-base tracking-tight">VaultMark</span>
        </div>

        {/* Theme Switcher */}
        <div className="flex items-center gap-1 ml-4 p-1 rounded-full bg-black/20">
          {(Object.keys(themes) as Theme[]).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`w-4 h-4 rounded-full border ${theme === t ? 'border-white scale-125' : 'border-transparent'}`}
              style={{ backgroundColor: themes[t].surface }}
              title={t}
            />
          ))}
        </div>

        <div className="flex gap-1 ml-4">
          <button onClick={() => setTab('bookmarks')} 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${tab === 'bookmarks' ? 'bg-white/10 text-white' : 'text-gray-400'}`}>
            <Bookmark size={14} /> Bookmarks
          </button>
          <button onClick={() => setTab('files')} 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${tab === 'files' ? 'bg-white/10 text-white' : 'text-gray-400'}`}>
            <HardDrive size={14} /> Files
          </button>
        </div>

        {tab === 'bookmarks' && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." 
                     className="pl-8 pr-3 py-1.5 text-sm w-48 rounded-lg bg-black/20 border border-white/5 outline-none" />
            </div>
            <button onClick={() => setModal({ mode: 'add-link', folderId: selectedFolder })} 
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[#f0a500] text-black hover:opacity-90">
              <Plus size={14} className="inline mr-1" /> Add Link
            </button>
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 flex-shrink-0 overflow-y-auto py-4 px-3 border-r" 
               style={{ backgroundColor: themes[theme].surface, borderColor: themes[theme].border }}>
          <div onClick={() => {setSelectedFolder(null); setSearch('')}} 
               className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer mb-4 ${!selectedFolder ? 'bg-[#f0a500]/10 text-[#f0a500]' : 'text-gray-400'}`}>
            <Star size={14} /> <span className="text-sm font-medium">All Vaults</span>
          </div>
          
          <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 px-3">Publishers & Projects</div>
          
          {/* Note: In BookmarkTree component, ensure you are NOT using "open" property globally */}
          <BookmarkTree 
            tree={tree} 
            selectedFolder={selectedFolder} 
            onSelectFolder={setSelectedFolder}
            onEdit={(item) => setModal({ mode: 'edit', folderId: null, item })}
            onDelete={handleDelete}
          />
        </aside>

        {/* Main Grid */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayLinks.map(item => (
              <div key={item.id} onClick={() => handleOpenLink(item.url || '')}
                   className="group p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.02]"
                   style={{ backgroundColor: themes[theme].surface, borderColor: themes[theme].border }}>
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center text-[#f0a500] font-bold">
                     {item.name[0]}
                   </div>
                   <div className="flex-1 truncate font-medium text-sm">{item.name}</div>
                </div>
                <div className="text-[11px] text-gray-500 truncate mb-3 font-mono">{item.url}</div>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); setModal({ mode: 'edit', folderId: null, item })}} 
                          className="p-1.5 rounded bg-white/5 text-gray-400 hover:text-white">✎</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id)}} 
                          className="p-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20">×</button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {modal && (
        <ItemModal 
          mode={modal.mode} 
          item={modal.item} 
          folderId={modal.folderId}
          onClose={() => setModal(null)} 
          onSave={(data) => modal.mode === 'edit' ? handleEditItem(data, modal.item!.id) : handleAddItem(data, modal.folderId)} 
        />
      )}
    </div>
  )
}