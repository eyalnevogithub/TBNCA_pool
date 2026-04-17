'use client'

import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'

function MenuBar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  const btnClass = (active: boolean) =>
    `px-2 py-1 rounded text-sm font-medium transition-colors ${
      active ? 'bg-tbnca-blue text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
    }`

  return (
    <div className="flex flex-wrap gap-1 border-b p-2 bg-gray-50">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))}>
        B
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))}>
        I
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))}>
        U
      </button>
      <div className="w-px bg-gray-300 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))}>
        H2
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive('heading', { level: 3 }))}>
        H3
      </button>
      <div className="w-px bg-gray-300 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))}>
        List
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))}>
        1. List
      </button>
      <div className="w-px bg-gray-300 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnClass(false)}>
        HR
      </button>
      <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={`${btnClass(false)} disabled:opacity-30`}>
        Undo
      </button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={`${btnClass(false)} disabled:opacity-30`}>
        Redo
      </button>
    </div>
  )
}

export default function AdminWaiverPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [initialContent, setInitialContent] = useState('')

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4 min-h-[400px] focus:outline-none',
      },
    },
  })

  useEffect(() => {
    fetch('/api/admin/settings?key=waiver_html')
      .then(r => r.json())
      .then(data => {
        if (data.value) {
          setInitialContent(data.value)
          editor?.commands.setContent(data.value)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [editor])

  async function handleSave() {
    if (!editor) return
    setSaving(true)
    setSaved(false)

    const html = editor.getHTML()
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'waiver_html', value: html }),
    })

    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setInitialContent(html)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  function handleReset() {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent)
    }
  }

  if (loading) return <p className="text-tbnca-gray">Loading waiver...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-tbnca-blue">Pool Waiver</h1>
          <p className="text-sm text-tbnca-gray mt-1">Edit the waiver text that residents must sign before purchasing.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-green-600 text-sm font-medium">Saved!</span>}
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-tbnca-blue text-white rounded text-sm font-medium hover:bg-tbnca-blue-light disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Waiver'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <MenuBar editor={editor} />
        <EditorContent editor={editor} />
      </div>

      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> Changes to the waiver take effect immediately for all new purchases.
          Existing signed waivers are stored with each order and are not affected.
        </p>
      </div>
    </div>
  )
}
