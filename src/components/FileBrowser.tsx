'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Folder, FileText, ChevronRight, ArrowLeft, Home, Copy,
  File, Film, Music, Image, Archive, Code, RefreshCw, HardDrive
} from 'lucide-react'

type FSItem = {
  name: string
  path: string
  type: 'file' | 'directory'
  ext: string
  size: number
  modified: string
}

type DirData = {
  type: 'directory'
  path: string
  name: string
  parent: string | null
  homedir: string
  sep: string
  isWindows?: boolean
  items: FSItem[]
}

function getFileIcon(ext: string) {
  const imgs = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico']
  const videos = ['.mp4', '.mkv', '.avi', '.mov', '.webm']
  const audios = ['.mp3', '.wav', '.flac', '.ogg', '.m4a']
  const archives = ['.zip', '.tar', '.gz', '.rar', '.7z']
  const code = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.c', '.cpp', '.cs', '.rb', '.php', '.html', '.css', '.json', '.yaml', '.yml', '.toml', '.sh', '.bat', '.ps1']
  const docs = ['.md', '.txt', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv']
  if (imgs.includes(ext)) return <Image size={15} style={{ color: '#10b981' }} />
  if (videos.includes(ext)) return <Film size={15} style={{ color: '#8b5cf6' }} />
  if (audios.includes(ext)) return <Music size={15} style={{ color: '#f43f5e' }} />
  if (archives.includes(ext)) return <Archive size={15} style={{ color: '#f97316' }} />
  if (code.includes(ext)) return <Code size={15} style={{ color: '#3b82f6' }} />
  if (docs.includes(ext)) return <FileText size={15} style={{ color: '#f0a500' }} />
  return <File size={15} style={{ color: 'var(--text3)' }} />
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  return (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB'
}

function buildBreadcrumbs(fullPath: string, sep: string): { label: string; path: string }[] {
  if (fullPath === 'drives') return [{ label: 'This PC', path: 'drives' }]

  const normalized = fullPath.replace(/[\\/]/g, sep)
  const isWindows = sep === '\\'
  const parts = normalized.split(sep).filter(Boolean)
  const crumbs: { label: string; path: string }[] = []

  if (isWindows) {
    // Add "This PC" as root crumb
    crumbs.push({ label: 'This PC', path: 'drives' })
    parts.forEach((part, i) => {
      const crumbPath = i === 0 ? part + sep : parts.slice(0, i + 1).join(sep)
      crumbs.push({ label: part, path: crumbPath })
    })
  } else {
    crumbs.push({ label: '/', path: '/' })
    parts.forEach((part, i) => {
      crumbs.push({ label: part, path: sep + parts.slice(0, i + 1).join(sep) })
    })
  }
  return crumbs
}

type FileBrowserProps = { pickerMode?: boolean; onPickPath?: (path: string) => void }

export function FileBrowser({ pickerMode, onPickPath }: FileBrowserProps) {
  const [data, setData] = useState<DirData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [manualPath, setManualPath] = useState('')
  const [editingPath, setEditingPath] = useState(false)

  const navigate = useCallback(async (p: string, addHistory = true) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/files?path=' + encodeURIComponent(p))
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      if (json.type === 'directory') {
        setData(json)
        setManualPath(json.path === 'drives' ? '' : json.path)
        if (addHistory) setHistory(h => [...h, json.path])
      } else {
        // It's a file
        if (pickerMode && onPickPath) {
          onPickPath(json.path)
        } else {
          copyPath(json.path)
        }
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [pickerMode, onPickPath])

  useEffect(() => { navigate('~') }, [])

  function copyPath(p: string) {
    navigator.clipboard.writeText(p).catch(() => {})
    setCopied(p)
    setTimeout(() => setCopied(null), 2000)
  }

  function goBack() {
    if (history.length > 1) {
      const prev = history[history.length - 2]
      setHistory(h => h.slice(0, -1))
      navigate(prev, false)
    }
  }

  function submitManualPath(e: React.FormEvent) {
    e.preventDefault()
    setEditingPath(false)
    navigate(manualPath)
  }

  const sep = data?.sep || '/'
  const isDriveRoot = data?.path === 'drives'
  const breadcrumbs = data ? buildBreadcrumbs(data.path, sep) : []

  return (
    <div className="flex flex-col h-full">
      {/* Path bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--surface2)' }}>

        <button onClick={goBack} disabled={history.length <= 1}
          className="p-1.5 rounded-lg flex-shrink-0"
          style={{ background: 'var(--surface3)', color: 'var(--text2)', opacity: history.length <= 1 ? 0.4 : 1 }}
          title="Back">
          <ArrowLeft size={14} />
        </button>

        <button onClick={() => navigate('~')}
          className="p-1.5 rounded-lg flex-shrink-0"
          style={{ background: 'var(--surface3)', color: 'var(--text2)' }}
          title="Home folder">
          <Home size={14} />
        </button>

        {/* Show "This PC" button on Windows to access all drives */}
        {data?.isWindows && (
          <button onClick={() => navigate('drives')}
            className="p-1.5 rounded-lg flex-shrink-0"
            style={{ background: isDriveRoot ? 'var(--accent)' : 'var(--surface3)', color: isDriveRoot ? '#0f0f0e' : 'var(--text2)' }}
            title="This PC — all drives">
            <HardDrive size={14} />
          </button>
        )}

        {editingPath ? (
          <form onSubmit={submitManualPath} className="flex-1 flex gap-2">
            <input
              autoFocus
              value={manualPath}
              onChange={e => setManualPath(e.target.value)}
              onBlur={() => setEditingPath(false)}
              className="flex-1 text-xs py-1"
              style={{ fontFamily: 'monospace', background: 'var(--surface3)' }}
              placeholder="Type any path e.g. D:\Projects"
            />
            <button type="submit"
              className="px-3 py-1 rounded-lg text-xs font-medium flex-shrink-0"
              style={{ background: 'var(--accent)', color: '#0f0f0e' }}>
              Go
            </button>
          </form>
        ) : (
          <div
            className="flex-1 px-3 py-1.5 rounded-lg text-xs font-mono truncate cursor-text"
            style={{ background: 'var(--surface3)', color: 'var(--text2)' }}
            onClick={() => setEditingPath(true)}
            title="Click to type a path directly">
            {isDriveRoot ? 'This PC' : (data?.path || '')}
          </div>
        )}

        <button onClick={() => data && !isDriveRoot && copyPath(data.path)}
          className="p-1.5 rounded-lg flex-shrink-0"
          style={{ background: 'var(--surface3)', color: copied === data?.path ? '#10b981' : 'var(--text2)' }}
          title="Copy current path">
          <Copy size={14} />
        </button>

        <button onClick={() => data && navigate(data.path, false)}
          className="p-1.5 rounded-lg flex-shrink-0"
          style={{ background: 'var(--surface3)', color: 'var(--text2)' }}
          title="Refresh">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Breadcrumb */}
      {data && (
        <div className="flex items-center gap-0.5 px-4 py-2 flex-wrap overflow-x-auto"
          style={{ borderBottom: '1px solid var(--border)', minHeight: 36 }}>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-0.5 flex-shrink-0">
              {i > 0 && <ChevronRight size={11} style={{ color: 'var(--text3)' }} />}
              <button
                onClick={() => navigate(crumb.path)}
                className="text-xs px-1.5 py-0.5 rounded hover:underline"
                style={{ color: i === breadcrumbs.length - 1 ? 'var(--text)' : 'var(--text2)' }}>
                {crumb.label}
              </button>
            </span>
          ))}
        </div>
      )}

      {error && (
        <div className="m-4 p-3 rounded-lg text-sm"
          style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' }}>
          <strong>Cannot open:</strong> {error}
          <div className="mt-1 text-xs opacity-70">
            Click the path bar to type a path manually, e.g. <code>D:\</code> or <code>D:\Projects</code>
          </div>
        </div>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw size={16} className="animate-spin" style={{ color: 'var(--text3)' }} />
        </div>
      )}

      {data && (
        <div className="flex-1 overflow-y-auto">

          {/* Picker mode: use current folder button */}
          {pickerMode && !isDriveRoot && (
            <div
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all"
              style={{ borderBottom: '1px solid var(--border)', background: 'rgba(240,165,0,0.07)' }}
              onClick={() => onPickPath && onPickPath(data.path)}>
              <Folder size={15} style={{ color: 'var(--accent)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                ✓ Use this folder
              </span>
              <span className="text-xs font-mono truncate" style={{ color: 'var(--text2)' }}>{data.path}</span>
            </div>
          )}

          {/* Go up */}
          {data.parent && (
            <div className="flex items-center gap-3 px-4 py-2 cursor-pointer transition-all"
              style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={() => navigate(data.parent!)}>
              <ArrowLeft size={14} style={{ color: 'var(--text3)' }} />
              <span className="text-sm" style={{ color: 'var(--text3)' }}>.. (go up)</span>
            </div>
          )}

          {data.items.length === 0 && !loading && (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--text3)' }}>Empty folder</div>
          )}

          {data.items.map(item => {
            const isDrive = isDriveRoot && item.type === 'directory'
            return (
              <div key={item.path}
                className="flex items-center gap-3 px-4 py-2 cursor-pointer group transition-all"
                style={{ borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                onClick={() => {
                  if (item.type === 'directory') {
                    navigate(item.path)
                  } else if (pickerMode && onPickPath) {
                    onPickPath(item.path)
                  } else {
                    copyPath(item.path)
                  }
                }}>
                <div className="flex-shrink-0">
                  {isDrive
                    ? <HardDrive size={15} style={{ color: '#3b82f6' }} />
                    : item.type === 'directory'
                      ? <Folder size={15} style={{ color: '#f0a500' }} />
                      : getFileIcon(item.ext)
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate" style={{ color: 'var(--text)' }}>
                    {isDrive ? item.name.replace('\\', '') : item.name}
                  </div>
                  {item.type === 'file' && (
                    <div className="text-xs" style={{ color: 'var(--text3)', fontFamily: 'monospace' }}>
                      {item.ext || 'file'} · {formatSize(item.size)}
                    </div>
                  )}
                  {isDrive && (
                    <div className="text-xs" style={{ color: 'var(--text3)' }}>Local Disk</div>
                  )}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {pickerMode && item.type === 'directory' ? (
                    <button
                      onClick={e => { e.stopPropagation(); onPickPath && onPickPath(item.path) }}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium flex-shrink-0"
                      style={{ background: 'var(--accent)', color: '#0f0f0e' }}>
                      Select
                    </button>
                  ) : !isDriveRoot ? (
                    <button
                      onClick={e => { e.stopPropagation(); copyPath(item.path) }}
                      className="p-1.5 rounded-lg" title="Copy path"
                      style={{ background: 'var(--surface3)', color: copied === item.path ? '#10b981' : 'var(--text3)' }}>
                      <Copy size={12} />
                    </button>
                  ) : null}
                </div>
                {copied === item.path && (
                  <span className="text-xs flex-shrink-0" style={{ color: '#10b981' }}>Copied!</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="px-4 py-2 text-xs border-t flex gap-3"
        style={{ color: 'var(--text3)', borderColor: 'var(--border)' }}>
        {pickerMode ? (
          <span style={{ color: 'var(--accent)' }}>📂 Click a file or "Select" on a folder to use that path</span>
        ) : (
          <>
            <span>Click file → copy path</span><span>·</span>
            <span>Click folder → open</span><span>·</span>
            <span>🖥 icon → browse all drives</span><span>·</span>
            <span>Click path bar → type any path</span>
          </>
        )}
      </div>
    </div>
  )
}
