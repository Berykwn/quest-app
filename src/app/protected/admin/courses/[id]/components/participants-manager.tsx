'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, UserPlus, X, Loader2, Users, Check } from 'lucide-react'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'

interface User {
    id: string
    name: string | null
    email: string
    enrolled_at?: string | null
}

interface Props {
    courseId: string
    enrolled: User[]
    unenrolled: User[]
}

export default function ParticipantManager({ courseId, enrolled: initialEnrolled, unenrolled: initialUnenrolled }: Props) {
    const router = useRouter()
    const [enrolled, setEnrolled] = useState(initialEnrolled)
    const [unenrolled, setUnenrolled] = useState(initialUnenrolled)
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [assignSearch, setAssignSearch] = useState('')
    const [assignOpen, setAssignOpen] = useState(false)

    const filteredEnrolled = useMemo(() => {
        const q = search.toLowerCase()
        return enrolled.filter(u =>
            u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        )
    }, [enrolled, search])

    const filteredUnenrolled = useMemo(() => {
        const q = assignSearch.toLowerCase()
        return unenrolled.filter(u =>
            u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        )
    }, [unenrolled, assignSearch])

    async function assign(userId: string) {
        setLoadingId(userId)
        const supabase = createClient()
        const { data: { user: admin } } = await supabase.auth.getUser()

        const { error } = await supabase.from('enrollments').insert({
            user_id: userId,
            course_id: courseId,
            assigned_by: admin?.id,
        })

        if (error) {
            toast.error('Failed to assign participant.', { description: error.message })
            setLoadingId(null)
            return
        }

        const assignedUser = unenrolled.find(u => u.id === userId)!
        setEnrolled(e => [...e, { ...assignedUser, enrolled_at: new Date().toISOString() }]
            .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email)))
        setUnenrolled(u => u.filter(u => u.id !== userId))
        setLoadingId(null)
        toast.success(`${assignedUser.name || assignedUser.email} assigned.`)
        router.refresh()
    }

    async function unassign(userId: string) {
        setLoadingId(userId)
        const supabase = createClient()
        const { error } = await supabase.from('enrollments')
            .delete()
            .eq('user_id', userId)
            .eq('course_id', courseId)

        if (error) {
            toast.error('Failed to remove participant.', { description: error.message })
            setLoadingId(null)
            return
        }

        const removedUser = enrolled.find(u => u.id === userId)!
        setUnenrolled(u => [...u, removedUser].sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email)))
        setEnrolled(e => e.filter(u => u.id !== userId))
        setLoadingId(null)
        toast.success(`${removedUser.name || removedUser.email} removed.`)
        router.refresh()
    }

    return (
        <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
                <div className="flex gap-3 text-sm text-muted-foreground">
                    <span><span className="font-medium text-foreground">{enrolled.length}</span> enrolled</span>
                    <span>·</span>
                    <span><span className="font-medium text-foreground">{unenrolled.length}</span> not enrolled</span>
                </div>

                {unenrolled.length > 0 && (
                    <Dialog open={assignOpen} onOpenChange={v => { setAssignOpen(v); if (!v) setAssignSearch('') }}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2">
                                <UserPlus className="h-4 w-4" />
                                Assign Participant
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Assign Participant</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 pt-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={assignSearch}
                                        onChange={e => setAssignSearch(e.target.value)}
                                        className="pl-9"
                                        autoFocus
                                    />
                                </div>

                                <ul className="space-y-1 max-h-72 overflow-y-auto list-none p-0 m-0">
                                    {filteredUnenrolled.length === 0 ? (
                                        <li className="py-8 text-center text-sm text-muted-foreground">
                                            No users found.
                                        </li>
                                    ) : filteredUnenrolled.map(u => (
                                        <li key={u.id}>
                                            <button
                                                onClick={() => assign(u.id)}
                                                disabled={loadingId === u.id}
                                                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted transition-colors disabled:opacity-60"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0">
                                                    {(u.name || u.email).charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{u.name || '—'}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                                </div>
                                                {loadingId === u.id
                                                    ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                                                    : <Check className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground shrink-0" />
                                                }
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Search enrolled */}
            {enrolled.length > 0 && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search participants..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            )}

            {search && (
                <p className="text-xs text-muted-foreground">
                    Showing {filteredEnrolled.length} of {enrolled.length} participants
                </p>
            )}

            {/* Enrolled list */}
            {enrolled.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">No participants assigned yet.</p>
                </div>
            ) : filteredEnrolled.length === 0 ? (
                <div className="rounded-lg border border-dashed p-10 text-center">
                    <p className="text-muted-foreground text-sm">No participants match your search.</p>
                </div>
            ) : (
                <ul className="space-y-2 list-none p-0 m-0">
                    {filteredEnrolled.map(u => (
                        <li key={u.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0">
                                    {(u.name || u.email).charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{u.name || '—'}</p>
                                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                {u.enrolled_at && (
                                    <span className="text-xs text-muted-foreground hidden sm:block">
                                        Enrolled {new Date(u.enrolled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => unassign(u.id)}
                                    disabled={loadingId === u.id}
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    aria-label={`Remove ${u.name || u.email}`}
                                >
                                    {loadingId === u.id
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : <X className="h-4 w-4" />
                                    }
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}