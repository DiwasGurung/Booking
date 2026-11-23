'use client'

import { useRef, useState } from 'react'
import { Camera, Loader, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/use-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
const MAX_FILE_BYTES = 8 * 1024 * 1024
const MAX_EDGE = 512

function getInitials(name: string) {
  const w = name.trim().split(/\s+/).filter(Boolean)
  if (w.length === 0) return '?'
  if (w.length === 1) return w[0].slice(0, 2).toUpperCase()
  return (w[0][0] + w[1][0]).toUpperCase()
}

// Center-crops to a square, scales down, returns a JPEG data URL
async function fileToSquareDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const side = Math.min(bitmap.width, bitmap.height)
  const target = Math.min(side, MAX_EDGE)
  const canvas = document.createElement('canvas')
  canvas.width = target
  canvas.height = target
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side,
    0, 0, target, target
  )
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.85)
}

interface Props {
  staffId: string
  name: string
  avatar?: string | null
  onChange: (avatar: string | null) => void
}

export function AvatarUploader({ staffId, name, avatar, onChange }: Props) {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)

  const save = async (value: string | null) => {
    setBusy(true)
    try {
      const res = await fetch(`${API_URL}/api/staff/${staffId}/avatar`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: value }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setImgFailed(false)
      onChange(data.avatar ?? null)
      toast({ title: value ? 'Photo updated' : 'Photo removed' })
    } catch (e: any) {
      toast({
        title: 'Could not update photo',
        description: e.message,
        variant: 'destructive' as any,
      })
    } finally {
      setBusy(false)
    }
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // lets the same file be picked again
    if (!file) return

    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      toast({
        title: 'Unsupported file',
        description: 'Use a JPG, PNG, or WebP image.',
        variant: 'destructive' as any,
      })
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      toast({
        title: 'Image too large',
        description: 'Choose an image under 8 MB.',
        variant: 'destructive' as any,
      })
      return
    }

    try {
      setBusy(true)
      const dataUrl = await fileToSquareDataUrl(file)
      await save(dataUrl)
    } catch {
      setBusy(false)
      toast({ title: 'Could not read that image', variant: 'destructive' as any })
    }
  }

  const hasPhoto = !!avatar && !imgFailed

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-primary/10 ring-2 ring-border">
        {hasPhoto ? (
          <img
            src={avatar!}
            alt={name}
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-primary">
            {getInitials(name)}
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          className="sr-only"
          aria-label="Upload profile photo"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="mr-2 h-4 w-4" />
          {hasPhoto ? 'Change photo' : 'Upload photo'}
        </Button>
        {hasPhoto && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => save(null)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
          </Button>
        )}
        <p className="text-xs text-muted-foreground">JPG, PNG or WebP. Cropped to a square.</p>
      </div>
    </div>
  )
}