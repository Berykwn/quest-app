'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/supabase/client'
import { Button } from '@/components/ui/button'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface Props {
    value: string | null
    onChange: (url: string | null) => void
}

export default function QuestionImageUpload({ value, onChange }: Props) {
    const [uploading, setUploading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        // Max 2MB
        if (file.size > 2 * 1024 * 1024) {
            alert('Image must be under 2MB.')
            return
        }

        setUploading(true)
        const supabase = createClient()

        const ext = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const { error } = await supabase.storage
            .from('question-images')
            .upload(fileName, file, { upsert: false })

        if (error) {
            alert('Upload failed: ' + error.message)
            setUploading(false)
            return
        }

        const { data } = supabase.storage
            .from('question-images')
            .getPublicUrl(fileName)

        onChange(data.publicUrl)
        setUploading(false)

        // Reset input
        if (inputRef.current) inputRef.current.value = ''
    }

    async function handleRemove() {
        if (!value) return

        const url = new URL(value)
        const pathParts = url.pathname.split('/question-images/')
        const fileName = pathParts[1]

        if (fileName) {
            const supabase = createClient()
            await supabase.storage.from('question-images').remove([fileName])
        }
        onChange(null)
    }

    return (
        <div className="space-y-2">
            {value ? (
                <div className="relative inline-block">
                    <img
                        src={value}
                        alt="Question image"
                        className="max-h-48 rounded-lg border object-contain"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:opacity-90 transition-opacity"
                        aria-label="Remove image"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            ) : (
                <div
                    onClick={() => inputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                    {uploading
                        ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        : <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    }
                    <p className="text-sm text-muted-foreground">
                        {uploading ? 'Uploading...' : 'Click to upload image (optional, max 2MB)'}
                    </p>
                </div>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
            />
        </div>
    )
}