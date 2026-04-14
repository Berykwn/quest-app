'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KeyRound, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'

export function JoinCourseDialog() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const trimmed = code.trim()
        if (!trimmed) return

        setLoading(true)
        const supabase = createClient()

        const { data, error } = await supabase.rpc('enroll_with_code', {
            code: trimmed,
        })

        if (error) {
            toast.error('Something went wrong.', { description: error.message })
            setLoading(false)
            return
        }

        // Handle RPC response
        if (data?.error === 'invalid_code') {
            toast.error('Invalid code.', {
                description: 'No course found with that enroll code. Please check and try again.',
            })
        } else if (data?.error === 'not_published') {
            toast.error('Course not available.', {
                description: 'This course is not published yet.',
            })
        } else if (data?.error === 'already_enrolled') {
            toast.error('Already enrolled.', {
                description: `You are already enrolled in "${data.title}".`,
            })
        } else if (data?.error === 'not_authenticated') {
            toast.error('Not authenticated.', {
                description: 'Please log in and try again.',
            })
        } else if (data?.success) {
            toast.success(`Enrolled in "${data.title}"!`, {
                description: 'The course is now available in your dashboard.',
            })
            setCode('')
            setOpen(false)
            router.refresh()
        }

        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setCode(''); setLoading(false) } }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <KeyRound className="h-4 w-4" />
                    Join Course
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Join Course</DialogTitle>
                    <DialogDescription>
                        Enter the secret code provided by your administrator to enroll in a course.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="enroll-code">Enroll Code</Label>
                        <Input
                            id="enroll-code"
                            placeholder="e.g. SAFETY2026"
                            value={code}
                            onChange={e => setCode(e.target.value.toUpperCase())}
                            autoFocus
                            autoComplete="off"
                            disabled={loading}
                        />
                    </div>
                    <div className="flex gap-3">
                        <Button type="submit" disabled={loading || !code.trim()} className="gap-2 flex-1">
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {loading ? 'Joining...' : 'Join Course'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
