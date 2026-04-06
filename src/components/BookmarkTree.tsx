'use client'
import { useState } from 'react'
import { ChevronRight, Folder, FolderOpen, Link, Plus, Trash2, Edit2, ExternalLink } from 'lucide-react'
import type { BookmarkItem } from '@/lib/data'

const FOLDER_COLORS = ['#f0a500','#3b82f6','#10b981','#f43f5e','#8b5cf6','#06b6d4','#f97316']

type Props = {
  tree: BookmarkItem[]
  selectedFolder: string | null
  onSelectFolder: (id: string | null) => void
  onAddItem: (folderId: string | null, type: 'link' | 'folder') => void
  onDelete: (id: string) => void
  onEdit: (item: BookmarkItem) => void
  onOpenLink: (url: string) => void
}

function TreeNode({
  item, depth, selectedFolder, onSelectFolder, onAddItem, onDelete, onEdit, onOpenLink
}: {
  item: BookmarkItem
  depth: number
  selectedFolder: string | null
  onSelectFolder: (id: string | null) => void
  onAddItem: (folderId: string | null, type: 'link' | 'folder') => void
  onDelete: (id: string) => void
  onEdit: (item: BookmarkItem) => void
  onOpenLink: (url: string) => void
}) {
  const [open, setOpen] = useState(depth === 0)
  const [hover, setHover] = useState(false)
  const isSelected = selectedFolder === item.id
  const color = item.color || '#9b9b96'

  if (item.type === 'link') {
    return (
      <div
        className="group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all"
        style={{
          paddingLeft: `${depth * 16 + 8}px`,
          background: hover ? 'var(--surface2)' : 'transparent',
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => item.url && onOpenLink(item.url)}
      >
        <Link size={13} style={{ color: 'var(--text3)', flexShrink: 0 }} />
        <span className="text-sm flex-1 truncate" style={{ color: 'var(--text2)' }}>{item.name}</span>
        {hover && (
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={e => { e.stopPropagation(); item.url && window.open(item.url, '_blank') }}
              className="p-1 rounded"
              style={{ color: 'var(--text3)' }}
              title="Open in new tab"
            >
              <ExternalLink size={12} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onEdit(item) }}
              className="p-1 rounded"
              style={{ color: 'var(--text3)' }}
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(item.id) }}
              className="p-1 rounded"
              style={{ color: '#f43f5e' }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all select-none"
        style={{
          paddingLeft: `${depth * 16 + 8}px`,
          background: isSelected ? 'var(--surface2)' : hover ? 'var(--surface2)' : 'transparent',
          borderLeft: isSelected ? `2px solid ${color}` : '2px solid transparent',
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => { setOpen(!open); onSelectFolder(item.id) }}
      >
        <ChevronRight
          size={14}
          style={{
            color: 'var(--text3)',
            flexShrink: 0,
            transform: open ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.15s',
          }}
        />
        {open
          ? <FolderOpen size={15} style={{ color, flexShrink: 0 }} />
          : <Folder size={15} style={{ color, flexShrink: 0 }} />
        }
        <span className="text-sm font-medium flex-1 truncate" style={{ color: 'var(--text)' }}>{item.name}</span>
        <span className="text-xs" style={{ color: 'var(--text3)' }}>
          {(item.children || []).length}
        </span>
        {hover && (
          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={e => { e.stopPropagation(); onAddItem(item.id, 'link') }}
              className="p-1 rounded"
              style={{ color: 'var(--text3)' }}
              title="Add link"
            >
              <Plus size={12} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onEdit(item) }}
              className="p-1 rounded"
              style={{ color: 'var(--text3)' }}
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(item.id) }}
              className="p-1 rounded"
              style={{ color: '#f43f5e' }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {open && item.children && (
        <div>
          {item.children.map(child => (
            <TreeNode
              key={child.id}
              item={child}
              depth={depth + 1}
              selectedFolder={selectedFolder}
              onSelectFolder={onSelectFolder}
              onAddItem={onAddItem}
              onDelete={onDelete}
              onEdit={onEdit}
              onOpenLink={onOpenLink}
            />
          ))}
          <div
            className="flex items-center gap-2 rounded-lg cursor-pointer transition-all"
            style={{ paddingLeft: `${(depth + 1) * 16 + 8}px`, paddingTop: 4, paddingBottom: 4 }}
            onClick={() => onAddItem(item.id, 'link')}
          >
            <Plus size={12} style={{ color: 'var(--text3)' }} />
            <span className="text-xs" style={{ color: 'var(--text3)' }}>Add link here</span>
          </div>
        </div>
      )}
    </div>
  )
}

export function BookmarkTree({ tree, selectedFolder, onSelectFolder, onAddItem, onDelete, onEdit, onOpenLink }: Props) {
  return (
    <div className="flex flex-col gap-0.5">
      {tree.map(item => (
        <TreeNode
          key={item.id}
          item={item}
          depth={0}
          selectedFolder={selectedFolder}
          onSelectFolder={onSelectFolder}
          onAddItem={onAddItem}
          onDelete={onDelete}
          onEdit={onEdit}
          onOpenLink={onOpenLink}
        />
      ))}
    </div>
  )
}
