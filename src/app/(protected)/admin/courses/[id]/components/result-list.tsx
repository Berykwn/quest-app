'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CheckCircle2, XCircle, MinusCircle, ClipboardList, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Attempt {
    id: string
    score: number | null
    total_points: number | null
    max_points: number | null
    finished_at: string | null
    time_spent: number | null
    answers: Record<string, string>
    questions_snapshot: any[] | null
    users: { name: string | null; email: string } | null
}

function formatDuration(s: number | null) {
    if (!s) return '—'
    return `${Math.floor(s / 60)}m ${s % 60}s`
}

function formatDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

export default function ResultList({ attempts, enrolledCount }: { attempts: Attempt[], enrolledCount: number }) {
    const [selected, setSelected] = useState<Attempt | null>(null)

    const submitted = attempts.length
    const notSubmitted = enrolledCount - submitted
    const passed = attempts.filter(a => (a.score ?? 0) >= 70).length
    const failed = submitted - passed

    if (!attempts.length) {
        return (
            <div className="space-y-3 mt-2">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span><span className="font-medium text-foreground">{submitted}</span> submitted</span>
                    <span>·</span>
                    <span><span className="font-medium text-foreground">{notSubmitted}</span> not submitted</span>
                </div>
                <div className="rounded-lg border border-dashed p-12 text-center">
                    <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">No submissions yet.</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2 mb-3">
                <span><span className="font-medium text-foreground">{submitted}</span> submitted</span>
                <span>·</span>
                <span><span className="font-medium text-foreground">{notSubmitted}</span> not submitted</span>
                <span>·</span>
                <span><span className="font-medium text-emerald-600">{passed}</span> passed</span>
                <span>·</span>
                <span><span className="font-medium text-destructive">{failed}</span> failed</span>
            </div>

            <ul className="space-y-2 list-none p-0 m-0 mt-2">
                {attempts.map(attempt => {
                    const score = attempt.score ?? 0
                    const isPassed = score >= 70
                    const user = attempt.users

                    return (
                        <li key={attempt.id} className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                                {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user?.name || '—'}</p>
                                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                            </div>
                            <div className="text-center shrink-0">
                                <p className={cn(
                                    'text-lg font-bold',
                                    isPassed ? 'text-emerald-600' : 'text-destructive'
                                )}>
                                    {Math.round(score)}%
                                </p>
                                <Badge className={cn(
                                    'text-xs',
                                    isPassed
                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                        : 'bg-red-100 text-red-700 hover:bg-red-100'
                                )}>
                                    {isPassed ? 'Pass' : 'Fail'}
                                </Badge>
                            </div>
                            <div className="text-right shrink-0 hidden sm:block">
                                <p className="text-xs text-muted-foreground">{formatDate(attempt.finished_at)}</p>
                                <p className="text-xs text-muted-foreground">{formatDuration(attempt.time_spent)}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelected(attempt)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </li>
                    )
                })}
            </ul>

            <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selected?.users?.name || selected?.users?.email} — Result Detail
                        </DialogTitle>
                    </DialogHeader>

                    {selected && (() => {
                        const score = selected.score ?? 0
                        const isPassed = score >= 70
                        const answers = selected.answers ?? {}
                        const questions = selected.questions_snapshot ?? []

                        return (
                            <div className="space-y-5 pt-1">
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        {
                                            label: 'Score',
                                            value: `${Math.round(score)}%`,
                                            className: isPassed ? 'text-emerald-600' : 'text-destructive',
                                        },
                                        {
                                            label: 'Points',
                                            value: `${selected.total_points ?? 0} / ${selected.max_points ?? 0} pts`,
                                            className: '',
                                        },
                                        {
                                            label: 'Duration',
                                            value: formatDuration(selected.time_spent),
                                            className: '',
                                        },
                                    ].map(({ label, value, className }) => (
                                        <div key={label} className="rounded-lg border bg-card p-3 text-center">
                                            <p className={cn('text-base font-semibold', className)}>{value}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                                        </div>
                                    ))}
                                </div>

                                <Badge className={cn(
                                    'text-sm px-4 py-1',
                                    isPassed
                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                        : 'bg-red-100 text-red-700 hover:bg-red-100'
                                )}>
                                    {isPassed ? '✓ Passed' : '✗ Failed'}
                                </Badge>

                                {questions.length > 0 && (
                                    <section>
                                        <h3 className="text-base font-medium mb-3">Answer Review</h3>
                                        <ol className="space-y-3 list-none p-0 m-0">
                                            {questions.map((q: any, i: number) => {
                                                const userAnswer = answers[q.id]
                                                const isEssay = q.question_type === 'essay'
                                                const isCorrect = !isEssay &&
                                                    userAnswer?.toLowerCase() === q.correct_answer?.toLowerCase()
                                                const isUnanswered = !userAnswer?.trim()

                                                return (
                                                    <li key={q.id} className={cn(
                                                        'rounded-lg border p-4 border-l-4',
                                                        isEssay ? 'border-l-blue-300' :
                                                            isCorrect ? 'border-l-emerald-500' :
                                                                isUnanswered ? 'border-l-muted-foreground/30' :
                                                                    'border-l-red-500'
                                                    )}>
                                                        <div className="flex items-start gap-3">
                                                            <span className="shrink-0 mt-0.5">
                                                                {isEssay
                                                                    ? <MinusCircle className="h-4 w-4 text-blue-400" />
                                                                    : isCorrect
                                                                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                                        : isUnanswered
                                                                            ? <MinusCircle className="h-4 w-4 text-muted-foreground" />
                                                                            : <XCircle className="h-4 w-4 text-red-500" />
                                                                }
                                                            </span>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium leading-snug">
                                                                    <span className="text-muted-foreground mr-1">{i + 1}.</span>
                                                                    {q.question_text}
                                                                </p>

                                                                {/* Multiple choice & True/False */}
                                                                {q.options && (
                                                                    <div className="mt-2 space-y-1">
                                                                        {q.options.map((opt: any) => {
                                                                            const isUserChoice = userAnswer === opt.key
                                                                            const isRight = q.correct_answer === opt.key
                                                                            return (
                                                                                <div key={opt.key} className={cn(
                                                                                    'flex items-center gap-2 text-xs px-2 py-1.5 rounded',
                                                                                    isRight ? 'bg-emerald-50 text-emerald-800 font-medium' :
                                                                                        isUserChoice && !isRight ? 'bg-red-50 text-red-700 line-through' : ''
                                                                                )}>
                                                                                    <span className="font-medium">{opt.key}.</span>
                                                                                    <span>{opt.text}</span>
                                                                                    {isRight && (
                                                                                        <Badge variant="outline" className="ml-auto text-emerald-700 border-emerald-300 text-xs py-0 shrink-0">
                                                                                            Correct
                                                                                        </Badge>
                                                                                    )}
                                                                                    {isUserChoice && !isRight && (
                                                                                        <Badge variant="outline" className="ml-auto text-red-600 border-red-300 text-xs py-0 shrink-0">
                                                                                            Your answer
                                                                                        </Badge>
                                                                                    )}
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                )}

                                                                {isUnanswered && !isEssay && (
                                                                    <p className="text-xs text-muted-foreground mt-1 italic">Not answered.</p>
                                                                )}

                                                                {q.explanation && (
                                                                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t italic">
                                                                        {q.explanation}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </li>
                                                )
                                            })}
                                        </ol>
                                    </section>
                                )}
                            </div>
                        )
                    })()}
                </DialogContent>
            </Dialog>
        </>
    )
}