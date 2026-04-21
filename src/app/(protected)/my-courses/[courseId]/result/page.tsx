import { createClient } from '@/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle, Clock, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function ResultPage({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: attempt } = await supabase
        .from('attempts')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .not('finished_at', 'is', null)
        .single()

    if (!attempt) redirect(`/my-courses/${courseId}`)

    const { data: course } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single()

    if (!course) notFound()

    const answers = attempt.answers as Record<string, string>
    const questions = (attempt.questions_snapshot ?? []) as any[]
    const score = attempt.score ?? 0
    const isPassed = score >= 70

    const correctCount = questions.filter(q =>
        q.question_type !== 'essay' &&
        answers[q.id]?.toLowerCase() === q.correct_answer?.toLowerCase()
    ).length

    const incorrectCount = questions.filter(q =>
        q.question_type !== 'essay' &&
        answers[q.id]?.toLowerCase() !== q.correct_answer?.toLowerCase()
    ).length

    const essayCount = questions.filter(q => q.question_type === 'essay').length

    return (
        <div className="space-y-6">
            <header className="flex items-center gap-3">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/my-courses" aria-label="Back">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold">{course.title}</h1>
                    <p className="text-muted-foreground text-sm">Exam Result</p>
                </div>
            </header>

            {/* Score summary */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-6">
                        <div className={cn(
                            'flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 shrink-0',
                            isPassed
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : 'border-red-400 bg-red-50 text-red-600'
                        )}>
                            <p className="text-2xl font-bold">{Math.round(score)}%</p>
                        </div>
                        <div className="space-y-2 text-sm">
                            <Badge className={isPassed
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-100 text-red-700 hover:bg-red-100'
                            }>
                                {isPassed ? 'Passed' : 'Failed'}
                            </Badge>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Trophy className="h-4 w-4 text-amber-500" />
                                <span>
                                    <span className="font-medium text-foreground">{attempt.total_points}</span>
                                    {' / '}
                                    <span className="font-medium text-foreground">{attempt.max_points}</span>
                                    {' pts'}
                                </span>
                            </div>
                            {attempt.time_spent && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>{Math.floor(attempt.time_spent / 60)}m {attempt.time_spent % 60}s</span>
                                </div>
                            )}
                            <div className="flex gap-3 pt-0.5">
                                <span className="flex items-center gap-1 text-emerald-600 text-xs">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {correctCount} correct
                                </span>
                                <span className="flex items-center gap-1 text-red-500 text-xs">
                                    <XCircle className="h-3.5 w-3.5" />
                                    {incorrectCount} incorrect
                                </span>
                                {essayCount > 0 && (
                                    <span className="flex items-center gap-1 text-muted-foreground text-xs">
                                        <MinusCircle className="h-3.5 w-3.5" />
                                        {essayCount} essay
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Per question review */}
            {questions.length > 0 && (
                <section>
                    <h2 className="text-base font-medium mb-3">Answer Review</h2>
                    <ol className="space-y-3 list-none p-0 m-0">
                        {questions.map((q: any, i: number) => {
                            const userAnswer = answers[q.id]
                            const isEssay = q.question_type === 'essay'
                            const isCorrect = !isEssay &&
                                userAnswer?.toLowerCase() === q.correct_answer?.toLowerCase()
                            const isUnanswered = !userAnswer?.trim()

                            return (
                                <li key={q.id}>
                                    <Card className={cn(
                                        'border-l-4',
                                        isEssay ? 'border-l-blue-300' :
                                            isCorrect ? 'border-l-emerald-500' :
                                                isUnanswered ? 'border-l-muted-foreground/30' :
                                                    'border-l-red-500'
                                    )}>
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start gap-3">
                                                <span className="shrink-0 mt-0.5" aria-hidden>
                                                    {isEssay
                                                        ? <MinusCircle className="h-5 w-5 text-blue-400" />
                                                        : isCorrect
                                                            ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                            : isUnanswered
                                                                ? <MinusCircle className="h-5 w-5 text-muted-foreground" />
                                                                : <XCircle className="h-5 w-5 text-red-500" />
                                                    }
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="text-sm font-medium leading-relaxed">
                                                        <span className="text-muted-foreground mr-2">{i + 1}.</span>
                                                        {q.question_text}
                                                    </CardTitle>
                                                </div>
                                                <Badge variant="outline" className="shrink-0 text-xs">
                                                    {q.points} {q.points === 1 ? 'pt' : 'pts'}
                                                </Badge>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="pl-10 space-y-2">
                                            {/* Multiple choice */}
                                            {q.question_type === 'multiple_choice' && q.options && (
                                                <div className="space-y-1">
                                                    {q.options.map((opt: any) => {
                                                        const isUserChoice = userAnswer === opt.key
                                                        const isRight = q.correct_answer === opt.key
                                                        return (
                                                            <div key={opt.key} className={cn(
                                                                'flex items-center gap-2 text-sm px-3 py-1.5 rounded-md',
                                                                isRight ? 'bg-emerald-50 text-emerald-800 font-medium' :
                                                                    isUserChoice ? 'bg-red-50 text-red-700' :
                                                                        'text-muted-foreground'
                                                            )}>
                                                                <span className="font-medium shrink-0">{opt.key}.</span>
                                                                <span className="flex-1">{opt.text}</span>
                                                                {isRight && (
                                                                    <Badge variant="outline" className="text-emerald-700 border-emerald-300 text-xs shrink-0">
                                                                        Correct
                                                                    </Badge>
                                                                )}
                                                                {isUserChoice && !isRight && (
                                                                    <Badge variant="outline" className="text-red-600 border-red-300 text-xs shrink-0">
                                                                        Your answer
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}

                                            {/* True / False */}
                                            {q.question_type === 'true_false' && (
                                                <div className="flex gap-2">
                                                    {[{ key: 'true', label: 'True' }, { key: 'false', label: 'False' }].map(opt => {
                                                        const isUserChoice = userAnswer === opt.key
                                                        const isRight = q.correct_answer === opt.key
                                                        return (
                                                            <div key={opt.key} className={cn(
                                                                'flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium',
                                                                isRight ? 'bg-emerald-100 text-emerald-800' :
                                                                    isUserChoice ? 'bg-red-100 text-red-800' :
                                                                        'bg-muted/50 text-muted-foreground'
                                                            )}>
                                                                {opt.label}
                                                                {isRight && <CheckCircle2 className="h-3.5 w-3.5" />}
                                                                {isUserChoice && !isRight && <XCircle className="h-3.5 w-3.5" />}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}

                                            {/* Essay */}
                                            {isEssay && (
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground font-medium">Your answer:</p>
                                                    <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                                                        {userAnswer?.trim()
                                                            ? <p className="whitespace-pre-wrap">{userAnswer}</p>
                                                            : <p className="text-muted-foreground italic">No answer provided.</p>
                                                        }
                                                    </div>
                                                    <p className="text-xs text-muted-foreground italic">Essay questions are reviewed manually.</p>
                                                </div>
                                            )}

                                            {isUnanswered && !isEssay && (
                                                <p className="text-xs text-muted-foreground italic">Not answered.</p>
                                            )}

                                            {/* Explanation */}
                                            {q.explanation && (
                                                <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                                                    <span className="font-semibold">Explanation: </span>
                                                    {q.explanation}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </li>
                            )
                        })}
                    </ol>
                </section>
            )}

            <Button asChild variant="outline" className="w-full">
                <Link href="/my-courses">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to My Courses
                </Link>
            </Button>
        </div>
    )
}