'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Clock, ChevronLeft, ChevronRight, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface Question {
    id: string
    question_text: string
    question_type: 'multiple_choice' | 'true_false' | 'essay'
    options: { key: string; text: string }[] | null
    correct_answer: string | null
    explanation: string | null
    points: number
}

interface Props {
    attemptId: string
    courseId: string
    courseTitle: string
    durationMin: number | null
    questions: Question[]
    savedAnswers: Record<string, string>
    startedAt: string
}

export default function ExamClient({
    attemptId,
    courseId,
    courseTitle,
    durationMin,
    questions,
    savedAnswers: initialAnswers,
    startedAt,
}: Props) {
    const router = useRouter()
    const [current, setCurrent] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers)
    const [saving, setSaving] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [submitOpen, setSubmitOpen] = useState(false)
    const [timeLeft, setTimeLeft] = useState<number | null>(null)

    const question = questions[current]
    const answeredCount = questions.filter(q => answers[q.id]?.trim()).length
    const isLast = current === questions.length - 1

    // Init timer
    useEffect(() => {
        if (!durationMin) return
        const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
        const remaining = Math.max(0, durationMin * 60 - elapsed)
        setTimeLeft(remaining)
    }, [durationMin, startedAt])

    // Countdown
    useEffect(() => {
        if (timeLeft === null) return
        if (timeLeft <= 0) { handleSubmit(true); return }
        const interval = setInterval(() => setTimeLeft(t => t !== null ? t - 1 : null), 1000)
        return () => clearInterval(interval)
    }, [timeLeft])

    const saveAnswer = useCallback(async (questionId: string, newAnswers: Record<string, string>) => {
        setSaving(true)
        const supabase = createClient()
        await supabase.from('attempts').update({ answers: newAnswers }).eq('id', attemptId)
        setSaving(false)
    }, [attemptId])

    function handleAnswer(questionId: string, value: string) {
        const newAnswers = { ...answers, [questionId]: value }
        setAnswers(newAnswers)
        saveAnswer(questionId, newAnswers)
    }

    async function handleSubmit(autoSubmit = false) {
        if (submitting) return
        setSubmitting(true)
        const supabase = createClient()

        // Calculate score from snapshot — no need to fetch to DB
        let totalPoints = 0
        let maxPoints = 0

        for (const q of questions) {
            if (q.question_type === 'essay') continue
            maxPoints += q.points
            const userAnswer = answers[q.id]?.trim().toLowerCase()
            const correct = q.correct_answer?.trim().toLowerCase()
            if (userAnswer && correct && userAnswer === correct) {
                totalPoints += q.points
            }
        }

        // Essays are not automatically graded.
        const essayMaxPoints = questions
            .filter(q => q.question_type === 'essay')
            .reduce((sum, q) => sum + q.points, 0)
        maxPoints += essayMaxPoints

        const score = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0
        const timeSpent = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)

        const { error } = await supabase.from('attempts').update({
            answers,
            score,
            total_points: totalPoints,
            max_points: maxPoints,
            finished_at: new Date().toISOString(),
            time_spent: timeSpent,
        }).eq('id', attemptId)

        if (error) {
            toast.error('Failed to submit exam.', { description: error.message })
            setSubmitting(false)
            return
        }

        if (autoSubmit) toast.warning('Time is up! Exam submitted automatically.')
        else toast.success('Exam submitted successfully.')

        router.push(`/protected/my-courses/${courseId}/result`)
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0')
        const s = (seconds % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

    const isWarning = timeLeft !== null && timeLeft <= 300

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-lg font-semibold truncate">{courseTitle}</h1>
                    <p className="text-xs text-muted-foreground">
                        Question {current + 1} of {questions.length}
                    </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {saving && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                        </span>
                    )}
                    {timeLeft !== null && (
                        <Badge className={cn(
                            'gap-1 text-sm font-mono',
                            isWarning
                                ? 'bg-red-100 text-red-700 hover:bg-red-100 animate-pulse'
                                : 'bg-muted text-foreground hover:bg-muted'
                        )}>
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(timeLeft)}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Question navigator */}
            <div className="flex flex-wrap gap-1.5">
                {questions.map((q, i) => (
                    <button key={q.id} onClick={() => setCurrent(i)}
                        className={cn(
                            'w-8 h-8 rounded-md text-xs font-medium transition-colors border',
                            i === current
                                ? 'bg-primary text-primary-foreground border-primary'
                                : answers[q.id]?.trim()
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                    : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                        )}>
                        {i + 1}
                    </button>
                ))}
            </div>

            {/* Question card */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-base font-medium leading-relaxed">
                            {question.question_text}
                        </CardTitle>
                        <Badge variant="outline" className="shrink-0 text-xs">
                            {question.points} {question.points === 1 ? 'pt' : 'pts'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {question.question_type === 'multiple_choice' && question.options && (
                        <div className="space-y-2">
                            {question.options.map(opt => (
                                <button key={opt.key} onClick={() => handleAnswer(question.id, opt.key)}
                                    className={cn(
                                        'w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                                        answers[question.id] === opt.key
                                            ? 'border-primary bg-primary/5 text-primary font-medium'
                                            : 'hover:bg-muted/60'
                                    )}>
                                    <span className={cn(
                                        'w-6 h-6 rounded-full border flex items-center justify-center text-xs shrink-0 font-medium',
                                        answers[question.id] === opt.key
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-muted-foreground/30'
                                    )}>
                                        {opt.key}
                                    </span>
                                    {opt.text}
                                </button>
                            ))}
                        </div>
                    )}

                    {question.question_type === 'true_false' && (
                        <div className="flex gap-3">
                            {[{ key: 'true', label: 'True' }, { key: 'false', label: 'False' }].map(opt => (
                                <button key={opt.key} onClick={() => handleAnswer(question.id, opt.key)}
                                    className={cn(
                                        'flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
                                        answers[question.id] === opt.key
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'hover:bg-muted/60'
                                    )}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {question.question_type === 'essay' && (
                        <Textarea
                            placeholder="Write your answer here..."
                            rows={6}
                            value={answers[question.id] ?? ''}
                            onChange={e => handleAnswer(question.id, e.target.value)}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" className="gap-2"
                    onClick={() => setCurrent(c => c - 1)} disabled={current === 0}>
                    <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                    {answeredCount} / {questions.length} answered
                </span>
                {isLast ? (
                    <Button size="sm" onClick={() => setSubmitOpen(true)}>Submit Exam</Button>
                ) : (
                    <Button variant="outline" size="sm" className="gap-2"
                        onClick={() => setCurrent(c => c + 1)}>
                        Next <ChevronRight className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Submit dialog */}
            <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Submit Exam?
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-1">
                        <p className="text-sm text-muted-foreground">
                            You have answered{' '}
                            <span className="font-semibold text-foreground">{answeredCount}</span> of{' '}
                            <span className="font-semibold text-foreground">{questions.length}</span> questions.
                            {answeredCount < questions.length && (
                                <span className="block mt-1 text-amber-600">
                                    {questions.length - answeredCount} question(s) still unanswered.
                                </span>
                            )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            This action <span className="font-semibold text-foreground">cannot be undone.</span>
                        </p>
                        <div className="flex gap-3">
                            <Button className="flex-1 gap-2" onClick={() => handleSubmit(false)} disabled={submitting}>
                                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                {submitting ? 'Submitting...' : 'Yes, Submit'}
                            </Button>
                            <Button variant="outline" onClick={() => setSubmitOpen(false)} disabled={submitting}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}