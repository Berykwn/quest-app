'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Trash2, Loader2, ClipboardList, Search } from 'lucide-react'

const typeLabel: Record<string, string> = {
    multiple_choice: 'Multiple Choice',
    true_false: 'True / False',
    // essay: 'Essay',
}

export default function QuestionList({ courseId, questions: initial }: { courseId: string; questions: any[] }) {
    const [questions, setQuestions] = useState(initial)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [togglingId, setTogglingId] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState('all')
    const [filterRequired, setFilterRequired] = useState('all')

    async function handleDelete(id: string) {
        if (!confirm('Delete this question?')) return
        setDeletingId(id)
        const supabase = createClient()
        const { error } = await supabase.from('questions').delete().eq('id', id)
        if (!error) setQuestions(q => q.filter(q => q.id !== id))
        setDeletingId(null)
    }

    async function toggleRequired(id: string, current: boolean) {
        setTogglingId(id)
        const supabase = createClient()
        const { error } = await supabase
            .from('questions')
            .update({ is_required: !current })
            .eq('id', id)
        if (!error) {
            setQuestions(q => q.map(q => q.id === id ? { ...q, is_required: !current } : q))
        }
        setTogglingId(null)
    }

    const filtered = useMemo(() => {
        return questions.filter(q => {
            const matchSearch = q.question_text.toLowerCase().includes(search.toLowerCase())
            const matchType = filterType === 'all' || q.question_type === filterType
            const matchRequired = filterRequired === 'all'
                || (filterRequired === 'required' && q.is_required)
                || (filterRequired === 'random' && !q.is_required)
            return matchSearch && matchType && matchRequired
        })
    }, [questions, search, filterType, filterRequired])

    const requiredCount = questions.filter(q => q.is_required).length
    const randomCount = questions.length - requiredCount

    if (!questions.length) {
        return (
            <div className="rounded-lg border border-dashed p-12 text-center">
                <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">No questions yet. Click "Add Question" to start.</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {/* Summary */}
            <div className="flex gap-3 text-sm text-muted-foreground">
                <span><span className="font-medium text-foreground">{requiredCount}</span> required</span>
                <span>·</span>
                <span><span className="font-medium text-foreground">{randomCount}</span> in pool</span>
                <span>·</span>
                <span><span className="font-medium text-foreground">{questions.length}</span> total</span>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search questions..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="true_false">True / False</SelectItem>
                        {/* <SelectItem value="essay">Essay</SelectItem> */}
                    </SelectContent>
                </Select>
                <Select value={filterRequired} onValueChange={setFilterRequired}>
                    <SelectTrigger className="w-36">
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="required">Required</SelectItem>
                        <SelectItem value="random">In pool</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Result count when filtering */}
            {(search || filterType !== 'all' || filterRequired !== 'all') && (
                <p className="text-xs text-muted-foreground">
                    Showing {filtered.length} of {questions.length} questions
                </p>
            )}

            {filtered.length === 0 ? (
                <div className="rounded-lg border border-dashed p-10 text-center">
                    <p className="text-muted-foreground text-sm">No questions match your search.</p>
                </div>
            ) : (
                <ol className="space-y-2 list-none p-0 m-0">
                    {filtered.map((q, i) => (
                        <li key={q.id} className={`flex items-start gap-4 rounded-lg border bg-card p-4 transition-colors
                            ${q.is_required ? 'border-primary/30 bg-primary/5' : ''}`}>
                            <span className="flex-shrink-0 w-7 h-7 rounded-md bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                                {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-relaxed line-clamp-2">{q.question_text}</p>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <Badge variant="outline" className="text-xs">{typeLabel[q.question_type]}</Badge>
                                    <span className="text-xs text-muted-foreground">{q.points} {q.points === 1 ? 'point' : 'points'}</span>
                                    {q.is_required && (
                                        <Badge className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                                            Required
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleRequired(q.id, q.is_required)}
                                    disabled={togglingId === q.id}
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                    {togglingId === q.id
                                        ? <Loader2 className="h-3 w-3 animate-spin" />
                                        : q.is_required ? 'Set random' : 'Set required'
                                    }
                                </Button>
                                <Button asChild variant="ghost" size="icon" aria-label="Edit question">
                                    <Link href={`/protected/admin/courses/${courseId}/questions/${q.id}`}>
                                        <Pencil className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)}
                                    disabled={deletingId === q.id}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    aria-label="Delete question">
                                    {deletingId === q.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    )
}