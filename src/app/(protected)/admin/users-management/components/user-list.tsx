'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Users, ChevronRight, BookOpen, CheckCircle2, Clock, CircleDashed } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Enrollment {
    course_id: string
    assigned_at: string | null
    courses: { id: string; title: string } | null
    attempt: {
        score: number | null
        finished_at: string | null
    } | null
}

interface User {
    id: string
    email: string
    name: string | null
    created_at: string
    enrollments: Enrollment[]
}

function formatDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
    })
}

export default function UserList({ users }: { users: User[] }) {
    const [search, setSearch] = useState('')
    const [selected, setSelected] = useState<User | null>(null)

    const filtered = useMemo(() => {
        const q = search.toLowerCase()
        return users.filter(u =>
            u.email.toLowerCase().includes(q) ||
            u.name?.toLowerCase().includes(q)
        )
    }, [users, search])

    return (
        <>
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Summary */}
            <div className="flex gap-3 text-sm text-muted-foreground">
                <span><span className="font-medium text-foreground">{users.length}</span> total users</span>
                {search && (
                    <>
                        <span>·</span>
                        <span><span className="font-medium text-foreground">{filtered.length}</span> results</span>
                    </>
                )}
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">
                        {search ? 'No users match your search.' : 'No users found.'}
                    </p>
                </div>
            ) : (
                <ul className="space-y-2 list-none p-0 m-0">
                    {filtered.map(user => {
                        const submitted = user.enrollments.filter(e => e.attempt?.finished_at).length
                        const total = user.enrollments.length

                        return (
                            <li key={user.id}
                                className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                                    {(user.name || user.email).charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{user.name || '—'}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                </div>
                                <div className="hidden sm:flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <BookOpen className="h-3.5 w-3.5" />
                                        {total} course{total !== 1 ? 's' : ''}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                        {submitted} submitted
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground hidden md:block shrink-0">
                                    Joined {formatDate(user.created_at)}
                                </span>
                                <Button variant="ghost" size="icon" onClick={() => setSelected(user)}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </li>
                        )
                    })}
                </ul>
            )}

            {/* Detail Dialog */}
            <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                                {(selected?.name || selected?.email || '').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate">{selected?.name || '—'}</p>
                                <p className="text-xs text-muted-foreground font-normal truncate">{selected?.email}</p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    {selected && (
                        <div className="space-y-4 pt-1">
                            {/* User info */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border bg-card p-3 text-center">
                                    <p className="text-base font-semibold">{selected.enrollments.length}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Assigned Courses</p>
                                </div>
                                <div className="rounded-lg border bg-card p-3 text-center">
                                    <p className="text-base font-semibold">
                                        {formatDate(selected.created_at)}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Joined</p>
                                </div>
                            </div>

                            {/* Course list */}
                            <div>
                                <h3 className="text-sm font-medium mb-2">Assigned Courses</h3>
                                {selected.enrollments.length === 0 ? (
                                    <div className="rounded-lg border border-dashed p-8 text-center">
                                        <p className="text-sm text-muted-foreground">No courses assigned yet.</p>
                                    </div>
                                ) : (
                                    <ul className="space-y-2 list-none p-0 m-0">
                                        {selected.enrollments.map(e => {
                                            const course = Array.isArray(e.courses) ? e.courses[0] : e.courses
                                            const attempt = e.attempt
                                            const score = attempt?.score ?? null
                                            const isDone = !!attempt?.finished_at
                                            const isPassed = isDone && (score ?? 0) >= 70

                                            return (
                                                <li key={e.course_id}
                                                    className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">
                                                            {course?.title ?? 'Unknown course'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            Assigned {formatDate(e.assigned_at)}
                                                        </p>
                                                    </div>
                                                    <div className="shrink-0">
                                                        {!isDone ? (
                                                            <Badge className="bg-neutral-100 text-neutral-600 hover:bg-neutral-100 gap-1">
                                                                <CircleDashed className="h-3 w-3" />
                                                                Not submitted
                                                            </Badge>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn(
                                                                    'text-sm font-bold',
                                                                    isPassed ? 'text-emerald-600' : 'text-destructive'
                                                                )}>
                                                                    {Math.round(score ?? 0)}%
                                                                </span>
                                                                <Badge className={cn(
                                                                    'text-xs',
                                                                    isPassed
                                                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                                                        : 'bg-red-100 text-red-700 hover:bg-red-100'
                                                                )}>
                                                                    {isPassed ? 'Pass' : 'Fail'}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}