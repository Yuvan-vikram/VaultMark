'use client'
import { useState } from 'react'
import { X, FolderPlus, Link, FolderOpen } from 'lucide-react'
import type { BookmarkItem } from '@/lib/data'

const COLORS = ['#f0a500','#3b82f6','#10b981','#f43f5e','#8b5cf6','#06b6d4','#f97316','#84cc16']

type Props = {
  mode: 'add-link' | 'add-folder' | 'edit'
  folderId: string | null
  item?: BookmarkItem
  saving?: boolean
  onSave: (data: any) => void
  onClose: () => void
  onBrowse?: (cb: (path: string) => void) => void
}

export function ItemModal({ mode, folderId, item, saving, onSave, onClose, onBrowse }: Props) {
  const isEdit = mode === 'edit'
  const isFolder = mode === 'add-folder' || (isEdit && item?.type === 'folder')

  const [name, setName] = useState(item?.name || '')
  const [url, setUrl] = useState(item?.url || '')
  const [description, setDescription] = useState(item?.description || '')
  const [tags, setTags] = useState((item?.tags || []).join(', '))
  const [color, setColor] = useState(item?.color || COLORS[0])
  const [urlError, setUrlError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUrlError('')

    if (!name.trim()) return

    // Validate: links must have a URL
    if (!isFolder && !url.trim()) {
      setUrlError('Please enter a URL or local path')
      return
    }

    onSave({
      name: name.trim(),
      url: url.trim() || undefined,
      description: description.trim() || undefined,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      color: isFolder ? color : undefined,
      type: isFolder ? 'folder' : 'link',
    })
  }

  function handleBrowse() {
    if (!onBrowse) return
    // Close modal overlay visually but keep state — user will browse then come back
    onBrowse((pickedPath: string) => {
      setUrl(pickedPath)
      // Auto-fill name from path if empty
      if (!name.trim()) {
        const parts = pickedPath.replace(/\\/g, '/').split('/')
        setName(parts[parts.length - 1] || pickedPath)
      }
    })
    onClose()
  }

  const isLocalPath = url && !url.startsWith('http')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="rounded-2xl p-6 w-full max-w-md shadow-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border2)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {isFolder
              ? <FolderPlus size={18} style={{ color: 'var(--accent)' }} />
              : <Link size={18} style={{ color: 'var(--accent)' }} />
            }
            <h2 className="font-semibold text-base">
              {isEdit ? 'Edit item' : isFolder ? 'New folder' : 'Add link'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-all"
            style={{ color: 'var(--text2)', background: 'var(--surface2)' }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Name */}
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: 'var(--text3)' }}>
              {isFolder ? 'Folder name' : 'Title'} <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={isFolder ? 'e.g. Work, Projects, Design...' : 'e.g. GitHub, My Project Docs'}
              className="w-full"
              required
            />
          </div>

          {/* URL / Path */}
          {!isFolder && (
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: 'var(--text3)' }}>
                URL or local path <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <div className="flex gap-2">
                <input
                  value={url}
                  onChange={e => { setUrl(e.target.value); setUrlError('') }}
                  placeholder="https://example.com  or  C:\Users\you\projects"
                  className="flex-1"
                  style={{ borderColor: urlError ? '#f43f5e' : undefined }}
                />
                {onBrowse && (
                  <button
                    type="button"
                    onClick={handleBrowse}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium flex-shrink-0 transition-all"
                    style={{ background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border2)' }}
                    title="Browse local files"
                  >
                    <FolderOpen size={13} />
                    Browse
                  </button>
                )}
              </div>
              {urlError && (
                <p className="text-xs mt-1" style={{ color: '#f43f5e' }}>{urlError}</p>
              )}
              {isLocalPath && (
                <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
                  📁 Local path — clicking will copy it to your clipboard
                </p>
              )}
            </div>
          )}

          {/* Description */}
          {!isFolder && (
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: 'var(--text3)' }}>Description</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional note or description..."
                className="w-full"
              />
            </div>
          )}

          {/* Tags */}
          {!isFolder && (
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: 'var(--text3)' }}>Tags</label>
              <input
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="dev, work, important  (comma separated)"
                className="w-full"
              />
            </div>
          )}

          {/* Folder color */}
          {isFolder && (
            <div>
              <label className="block text-xs mb-2 font-medium" style={{ color: 'var(--text3)' }}>Folder color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-7 h-7 rounded-full transition-all"
                    style={{
                      background: c,
                      transform: color === c ? 'scale(1.3)' : 'scale(1)',
                      outline: color === c ? `2px solid ${c}` : 'none',
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: saving ? 'var(--surface3)' : 'var(--accent)',
                color: saving ? 'var(--text3)' : '#0f0f0e',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : isEdit ? 'Save changes' : isFolder ? 'Create folder' : 'Add link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
