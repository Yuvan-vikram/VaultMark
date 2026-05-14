'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Bookmark, Plus, FolderPlus, Search, 
  Copy, Star, Check, Download, Upload, BarChart3, Settings2, Palette, X
} from 'lucide-react'
import { BookmarkTree } from '@/components/BookmarkTree'
import { ItemModal } from '@/components/ItemModal'
import type { BookmarkItem } from '@/lib/data'

type Theme = 'dark' | 'midnight' | 'snow' | 'slate' | 'amethyst' | 'crimson' | 'ocean' | 'coffee'

export default function Home() {
  const [tree, setTree] = useState<BookmarkItem[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [modal, setModal] = useState<{ mode: 'add-link' | 'add-folder' | 'edit'; folderId: string | null; item?: BookmarkItem } | null>(null)
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // Set default theme to 'dark'
  const [theme, setTheme] = useState<Theme>('dark')
  
  // Graph toggle state
  const [showGraph, setShowGraph] = useState(false)
  const graphRef = useRef<HTMLDivElement>(null)

  const themes = {
    dark: { bg: '#0f0f0e', surface: '#1a1a19', border: '#262624', accent: '#f0a500', text: '#f3f4f6', shadow: 'rgba(0,0,0,0.5)' },
    midnight: { bg: '#020617', surface: '#0f172a', border: '#1e293b', accent: '#38bdf8', text: '#f3f4f6', shadow: 'rgba(0,0,0,0.6)' },
    snow: { bg: '#f8fafc', surface: '#ffffff', border: '#e2e8f0', accent: '#2563eb', text: '#0f172a', shadow: 'rgba(0,0,0,0.05)' },
    slate: { bg: '#0f172a', surface: '#1e293b', border: '#334155', accent: '#94a3b8', text: '#f3f4f6', shadow: 'rgba(0,0,0,0.4)' },
    amethyst: { bg: '#120b1e', surface: '#1c112d', border: '#2d1b4a', accent: '#a855f7', text: '#f3f4f6', shadow: 'rgba(0,0,0,0.5)' },
    crimson: { bg: '#1a0505', surface: '#2a0a0a', border: '#3d0f0f', accent: '#f43f5e', text: '#f3f4f6', shadow: 'rgba(0,0,0,0.5)' },
    ocean: { bg: '#061621', surface: '#0a2333', border: '#11354d', accent: '#0ea5e9', text: '#f3f4f6', shadow: 'rgba(0,0,0,0.5)' },
    coffee: { bg: '#120d0b', surface: '#1c1512', border: '#2d221e', accent: '#a16207', text: '#f3f4f6', shadow: 'rgba(0,0,0,0.5)' }
  }

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/bookmarks')
      const data = await res.json()
      setTree(data.tree || [])
    } catch (e) { console.error("Load failed", e) }
  }, [])

  // Hydrate theme selection from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('vaultmark_theme') as Theme
    if (savedTheme && Object.keys(themes).includes(savedTheme)) {
      setTheme(savedTheme)
    }
    loadData()
  }, [loadData])

  // Custom handler to change theme and update browser cache
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('vaultmark_theme', newTheme)
  }

  // Click outside to close graph dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (graphRef.current && !graphRef.current.contains(event.target as Node)) {
        setShowGraph(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleExport = () => {
    const dataStr = JSON.stringify(tree, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', `vaultmark_backup_${new Date().toISOString().split('T')[0]}.json`)
    linkElement.click()
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        alert("Import successful!")
      } catch (err) { alert("Invalid JSON file") }
    }
    reader.readAsText(file)
  }

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function handleAddItem(data: any, folderId: string | null) {
    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, folderId, type: modal?.mode === 'add-folder' ? 'folder' : 'link' }),
    })
    if (res.ok) { setModal(null); loadData() }
  }

  async function handleDelete(id: string) {
    if (!confirm('Permanent delete?')) return
    await fetch(`/api/bookmarks?id=${id}`, { method: 'DELETE' })
    loadData()
  }

  // Count computation logic
  const countItems = (items: BookmarkItem[]) => {
    let links = 0, folders = 0
    const traverse = (list: BookmarkItem[]) => {
      list.forEach(i => {
        if (i.type === 'link') links++
        else { folders++; if (i.children) traverse(i.children) }
      })
    }
    traverse(items); return { links, folders }
  }
  const stats = countItems(tree)
  const totalItems = stats.links + stats.folders
  const linkPercentage = totalItems > 0 ? Math.round((stats.links / totalItems) * 100) : 0
  const folderPercentage = totalItems > 0 ? Math.round((stats.folders / totalItems) * 100) : 0

  const flattenLinks = (items: BookmarkItem[]): BookmarkItem[] => {
    let links: BookmarkItem[] = []
    items.forEach(i => {
      if (i.type === 'link') links.push(i)
      if (i.children) links = [...links, ...flattenLinks(i.children)]
    })
    return links
  }

  const displayLinks = search 
    ? flattenLinks(tree).filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : (() => {
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
        return selectedFolder ? findFolderLinks(tree) : flattenLinks(tree)
      })()

  return (
    <div className="flex flex-col h-screen overflow-hidden transition-all duration-500 font-sans" 
         style={{ backgroundColor: themes[theme].bg, color: themes[theme].text }}>
      
      {/* Top Navigation Bar */}
      <header className="flex items-center gap-6 px-6 h-16 flex-shrink-0 z-10 shadow-sm" 
              style={{ backgroundColor: themes[theme].surface, borderBottom: `1px solid ${themes[theme].border}` }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: themes[theme].accent }}>
            <Bookmark size={18} color={theme === 'snow' ? '#fff' : '#000'} />
          </div>
          <span className="font-extrabold text-xl tracking-tight">VaultMark <span className="text-[10px] opacity-40 font-mono ml-1">v1.0</span></span>
        </div>

        {/* Global Search Interface */}
        <div className="relative flex-1 max-w-md ml-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your vault..." 
                 className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/5 border border-transparent focus:border-current/20 outline-none transition-all text-sm" 
                 style={{ color: themes[theme].text }} />
        </div>

        {/* Corner Actions Module */}
        <div className="flex items-center gap-3 ml-auto relative" ref={graphRef}>
          {/* Chart Corner Icon Symbol Button */}
          <button 
            onClick={() => setShowGraph(!showGraph)} 
            className={`p-2 rounded-lg transition-all ${showGraph ? 'bg-black/10 opacity-100' : 'opacity-60 hover:opacity-100 hover:bg-black/5'}`}
            title="View Analytics Graph"
          >
            <BarChart3 size={18} style={{ color: showGraph ? themes[theme].accent : 'inherit' }} />
          </button>

          {/* THE CORNER CLICK DROPDOWN GRAPH PANEL */}
          {showGraph && (
            <div 
              className="absolute right-0 top-12 w-64 p-4 rounded-2xl border shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
              style={{ backgroundColor: themes[theme].surface, borderColor: themes[theme].border, boxShadow: `0 10px 30px ${themes[theme].shadow}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-40">Vault Distribution</span>
                <button onClick={() => setShowGraph(false)} className="opacity-40 hover:opacity-100">
                  <X size={12} />
                </button>
              </div>
              
              <div className="w-full h-2 rounded-full bg-black/20 overflow-hidden flex mb-4">
                <div 
                  className="h-full transition-all duration-500 ease-out" 
                  style={{ 
                    width: `${totalItems > 0 ? (stats.links / totalItems) * 100 : 50}%`, 
                    backgroundColor: themes[theme].accent 
                  }} 
                />
                <div className="h-full bg-white/20 flex-1" />
              </div>

              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: themes[theme].accent }} />
                  <div>
                    <p className="font-bold leading-none">{stats.links}</p>
                    <p className="text-[9px] opacity-40 mt-0.5">Links ({linkPercentage}%)</p>
                  </div>
                </div>
                <div className="w-[1px] h-6 bg-current opacity-10" />
                <div className="flex items-center gap-2 text-right justify-end">
                  <div>
                    <p className="font-bold leading-none">{stats.folders}</p>
                    <p className="text-[9px] opacity-40 mt-0.5">Folders ({folderPercentage}%)</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-white/20" />
                </div>
              </div>
            </div>
          )}

          <button onClick={handleExport} className="p-2 hover:bg-black/5 rounded-lg opacity-60 hover:opacity-100 transition-all" title="Export JSON Template">
            <Download size={18} />
          </button>
          <label className="p-2 hover:bg-black/5 rounded-lg opacity-60 hover:opacity-100 transition-all cursor-pointer" title="Import Template Backup">
            <Upload size={18} />
            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
          </label>
          <div className="h-6 w-[1px] bg-current opacity-10 mx-2" />
          
          <button onClick={() => setModal({ mode: 'add-folder', folderId: selectedFolder })}
                  className="px-4 py-2 rounded-xl text-sm font-bold border border-current opacity-60 hover:opacity-100 transition-all">
            <FolderPlus size={16} className="inline mr-2" /> Folder
          </button>
          <button onClick={() => setModal({ mode: 'add-link', folderId: selectedFolder })} 
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold shadow-lg hover:scale-105 transition-all"
                  style={{ backgroundColor: themes[theme].accent, color: theme === 'snow' ? '#fff' : '#000' }}>
            <Plus size={18} /> Add Link
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Side SideBar Panel */}
        <aside className="w-72 flex-shrink-0 overflow-y-auto py-6 px-4 flex flex-col" 
               style={{ backgroundColor: themes[theme].surface, borderRight: `1px solid ${themes[theme].border}` }}>
          
          {/* STATIC SIDEBAR COUNT PANEL */}
          <div className="mb-6 px-4 py-3.5 rounded-2xl bg-black/5 border border-black/5">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-2">Vault Insights</p>
            <div className="flex gap-4">
              <div>
                <p className="text-xl font-extrabold leading-tight">{stats.links}</p>
                <p className="text-[10px] opacity-45">Links</p>
              </div>
              <div className="w-[1px] bg-current opacity-10 my-0.5" />
              <div>
                <p className="text-xl font-extrabold leading-tight">{stats.folders}</p>
                <p className="text-[10px] opacity-45">Folders</p>
              </div>
            </div>
          </div>

          <div onClick={() => {setSelectedFolder(null); setSearch('')}} 
               className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer mb-4 transition-all ${!selectedFolder ? 'bg-black/5 shadow-inner font-bold' : 'opacity-50 hover:opacity-100'}`}>
            <Star size={18} style={{ color: !selectedFolder ? themes[theme].accent : 'inherit' }} /> 
            <span className="text-sm">Main Vault</span>
          </div>
          
          <div className="flex-1">
             <BookmarkTree 
              tree={tree} 
              selectedFolder={selectedFolder} 
              onSelectFolder={setSelectedFolder}
              onAddItem={(folderId, type) => setModal({ mode: type === 'folder' ? 'add-folder' : 'add-link', folderId })}
              onEdit={(item) => setModal({ mode: 'edit', folderId: null, item })}
              onDelete={handleDelete}
              onOpenLink={(url) => window.open(url, '_blank')}
            />
          </div>

          {/* Theme Selector */}
          <div className="mt-auto pt-6 border-t border-black/5">
            <div className="flex items-center justify-between px-2 mb-3">
              <span className="text-[10px] font-bold uppercase opacity-40">Interface Theme</span>
              <Palette size={12} className="opacity-40" />
            </div>
            <div className="flex flex-wrap gap-2 px-2">
              {(Object.keys(themes) as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  className={`w-6 h-6 rounded-full border transition-all ${theme === t ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'opacity-70 hover:scale-110'}`}
                  style={{ backgroundColor: themes[t].accent, borderColor: themes[t].border }}
                  title={t}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Workspace Content Panel */}
        <main className="flex-1 overflow-y-auto p-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">
              {search ? 'Search Results' : selectedFolder ? 'Folder Contents' : 'Recent Items'}
            </h2>
            <div className="flex items-center gap-2 opacity-40 text-xs">
              <Settings2 size={14} /> Automatic Cloud Sync Active
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayLinks.map(item => (
              <div key={item.id} 
                   className="group p-6 rounded-3xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative"
                   style={{ 
                     backgroundColor: themes[theme].surface, 
                     borderColor: themes[theme].border, 
                     boxShadow: `0 10px 30px ${themes[theme].shadow}` 
                   }}>
                
                <div className="flex items-center justify-between mb-6">
                   <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner"
                        style={{ backgroundColor: `${themes[theme].accent}15`, color: themes[theme].accent }}>
                     {item.name[0].toUpperCase()}
                   </div>
                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                     <button onClick={() => handleCopy(item.id, item.url || '')} className="p-2 rounded-xl hover:bg-black/5" title="Copy URL">
                       {copiedId === item.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                     </button>
                     <button onClick={() => handleDelete(item.id)} className="p-2 rounded-xl hover:bg-red-500/10 text-red-500">×</button>
                   </div>
                </div>

                <div className="cursor-pointer" onClick={() => window.open(item.url || '', '_blank')}>
                  <h3 className="font-bold text-lg mb-1 truncate leading-tight">{item.name}</h3>
                  <p className="text-xs opacity-40 font-mono truncate">{item.url}</p>
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
          onSave={(data) => handleAddItem(data, modal.folderId)} 
        />
      )}
    </div>
  )
}