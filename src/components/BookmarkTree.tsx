'use client'
import { useState } from 'react'
import { ChevronRight, Folder, FolderOpen, Link, Plus, Trash2, Edit2 } from 'lucide-react'
import type { BookmarkItem } from '@/lib/data'

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
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(false)
  const isSelected = selectedFolder === item.id
  const color = item.color || '#9b9b96'

  // Handling Links in Sidebar
  if (item.type === 'link') {
    return (
      <div
        className="group flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer transition-all"
        style={{ paddingLeft: `${depth * 16 + 8}px`, background: hover ? 'rgba(0,0,0,0.05)' : 'transparent' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => onOpenLink?.(item.url || '')}
      >
        <Link size={13} className="opacity-40" />
        <span className="text-sm flex-1 truncate">{item.name}</span>
        
        {/* ACTIONS FOR LINKS (EDIT & DELETE) */}
        {hover && (
          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              className="p-1 hover:bg-black/5 opacity-40 hover:opacity-100 rounded transition-colors"
              title="Edit Link"
            >
              <Edit2 size={12} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
              className="p-1 hover:bg-red-500/10 text-red-500/40 hover:text-red-500 rounded transition-colors"
              title="Delete Link"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    )
  }

  // Handling Folders in Sidebar
  return (
    <div>
      <div
        className="group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all select-none"
        style={{
          paddingLeft: `${depth * 16 + 8}px`,
          background: isSelected ? 'rgba(0,0,0,0.05)' : hover ? 'rgba(0,0,0,0.02)' : 'transparent',
          borderLeft: isSelected ? `2px solid ${color}` : '2px solid transparent',
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => onSelectFolder(item.id)}
      >
        <div onClick={(e) => { e.stopPropagation(); setOpen(!open); }} className="p-1 hover:bg-black/5 rounded">
          <ChevronRight size={14} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
        </div>
        
        {open ? <FolderOpen size={15} style={{ color }} /> : <Folder size={15} style={{ color }} />}
        
        <span className="text-sm font-medium flex-1 truncate">{item.name}</span>

        {/* FOLDER ACTIONS */}
        {hover && (
          <div className="flex items-center gap-0.5">
            <button 
              onClick={(e) => { e.stopPropagation(); onAddItem(item.id, 'link'); }} 
              className="p-1 opacity-40 hover:opacity-100 hover:bg-black/5 rounded"
              title="Add Link"
            >
              <Plus size={14} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(item); }} 
              className="p-1 opacity-40 hover:opacity-100 hover:bg-black/5 rounded"
              title="Edit Folder"
            >
              <Edit2 size={12} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} 
              className="p-1 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded"
              title="Delete Folder"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {open && item.children && (
        <div className="flex flex-col">
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
        </div>
      )}
    </div>
  )
}

export function BookmarkTree(props: Props) {
  return (
    <div className="flex flex-col gap-0.5">
      {props.tree.map(item => (
        <TreeNode key={item.id} {...props} item={item} depth={0} />
      ))}
    </div>
  )
}