import { createClient } from '@/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, CheckCircle2, CircleDashed, AlertTriangle } from 'lucide-react'
import StartExamButton from './components/start-exam-button'

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Verify enrollment
    const { data: enrollment } = await supabase
        .from('enrollments')
        .select('assigned_at')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single()

    if (!enrollment) notFound()

    // Fetch course + questions count
    const { data: course } = await supabase
        .from('courses')
        .select('*, questions(count)')
        .eq('id', courseId)
        .single()

    if (!course || !course.is_published) notFound()

    // Fetch latest attempt
    const { data: attempt } = await supabase
        .from('attempts')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .order('started_at', { ascending: false })
        .limit(1)
        .single()

    const status = !attempt ? 'not_started' : !attempt.finished_at ? 'in_progress' : 'completed'

    // If in progress, redirect straight to exam
    if (status === 'in_progress') {
        redirect(`/protected/my-courses/${courseId}/exam`)
    }

    const totalQuestions = course.questions?.[0]?.count ?? 0
    const shownQuestions = course.question_limit ?? totalQuestions

    return (
        <div className="space-y-6">
            <header className="flex items-center gap-3">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/protected/my-courses" aria-label="Back">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold">{course.title}</h1>
                    {course.description && (
                        <p className="text-muted-foreground text-sm mt-0.5">{course.description}</p>
                    )}
                </div>
            </header>

            {/* Stats */}
            <section className="grid grid-cols-3 gap-4" aria-label="Course info">
                <article className="rounded-lg border bg-card p-4 text-center">
                    <p className="text-2xl font-semibold">{shownQuestions}</p>
                    <p className="text-xs text-muted-foreground mt-1">Questions</p>
                </article>
                <article className="rounded-lg border bg-card p-4 text-center">
                    <p className="text-2xl font-semibold">{course.duration_min ?? '∞'}</p>
                    <p className="text-xs text-muted-foreground mt-1">Duration (min)</p>
                </article>
                <article className="rounded-lg border bg-card p-4 text-center">
                    <p className="text-2xl font-semibold">1×</p>
                    <p className="text-xs text-muted-foreground mt-1">Attempt</p>
                </article>
            </section>

            {/* Status & Action */}
            {status === 'not_started' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <CircleDashed className="h-4 w-4 text-muted-foreground" />
                            Ready to Start
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3 text-sm text-amber-800">
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                            <p>Once you start, the timer will begin and <span className="font-semibold">you cannot retake this exam.</span> Make sure you are ready.</p>
                        </div>
                        <StartExamButton courseId={courseId} />
                    </CardContent>
                </Card>
            )}

            {status === 'completed' && attempt && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            Exam Completed
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Score display */}
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <p className="text-4xl font-bold text-emerald-600">{attempt.score ?? 0}%</p>
                                <p className="text-xs text-muted-foreground mt-1">Final Score</p>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <p>Points: <span className="font-medium text-foreground">{attempt.total_points} / {attempt.max_points}</span></p>
                                {attempt.time_spent && (
                                    <p>Time spent: <span className="font-medium text-foreground">{Math.floor(attempt.time_spent / 60)}m {attempt.time_spent % 60}s</span></p>
                                )}
                                <p>Submitted: <span className="font-medium text-foreground">
                                    {new Date(attempt.finished_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span></p>
                            </div>
                        </div>

                        <Button asChild className="w-full">
                            <Link href={`/protected/my-courses/${courseId}/result`}>
                                View Detailed Result
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}