import { createClient } from '@/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Clock, ChevronRight, CheckCircle2, CircleDashed, CirclePlay } from 'lucide-react'
import { notFound } from 'next/navigation'
import { JoinCourseDialog } from '../components/join-course-dialog'

type AttemptStatus = 'not_started' | 'in_progress' | 'completed'

function getStatus(attempt: any): AttemptStatus {
    if (!attempt) return 'not_started'
    if (!attempt.finished_at) return 'in_progress'
    return 'completed'
}

const statusConfig: Record<AttemptStatus, { label: string; icon: any; className: string }> = {
    not_started: {
        label: 'Not Started',
        icon: CircleDashed,
        className: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-100',
    },
    in_progress: {
        label: 'In Progress',
        icon: CirclePlay,
        className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    },
    completed: {
        label: 'Completed',
        icon: CheckCircle2,
        className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
    },
}

export default async function MyCoursesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) notFound()

    // Fetch enrolled courses + latest attempt per course
    const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
            course_id,
            assigned_at,
            courses (
                id, title, description, duration_min, question_limit, is_published
            )
        `)
        .eq('user_id', user.id)
        .order('assigned_at', { ascending: false })

    const courseIds = enrollments?.map(e => e.course_id) ?? []

    // Fetch attempts for all enrolled courses
    const { data: attempts } = courseIds.length > 0
        ? await supabase
            .from('attempts')
            .select('id, course_id, score, max_points, started_at, finished_at')
            .eq('user_id', user.id)
            .in('course_id', courseIds)
            .order('started_at', { ascending: false })
        : { data: [] }

    // Map latest attempt per course
    const attemptByCourse = new Map<string, any>()
    for (const attempt of attempts ?? []) {
        if (!attemptByCourse.has(attempt.course_id)) {
            attemptByCourse.set(attempt.course_id, attempt)
        }
    }

    const courses = enrollments
        ?.filter(e => e.courses)
        .map(e => ({
            ...(e.courses as any),
            assigned_at: e.assigned_at,
            attempt: attemptByCourse.get(e.course_id) ?? null,
        })) ?? []

    return (
        <div className="space-y-6">
            <header>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">My Courses</h1>
                    <JoinCourseDialog />
                </div>
                <p className="text-muted-foreground text-sm mt-1">
                    Courses assigned to you. Each course can only be attempted once.
                </p>
            </header>

            {courses.length === 0 ? (
                <section className="rounded-lg border border-dashed p-12 text-center">
                    <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm">You have no courses assigned yet.</p>
                    <p className="text-muted-foreground text-xs mt-1">Have an enroll code? Use the Join Course button above.</p>
                </section>
            ) : (
                <ul className="grid sm:grid-cols-2 gap-4 list-none p-0 m-0">
                    {courses.map((course) => {
                        const status = getStatus(course.attempt)
                        const { label, icon: Icon, className } = statusConfig[status]
                        const scorePercent = course.attempt?.score ?? null

                        return (
                            <li key={course.id}>
                                <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <CardTitle className="text-base">{course.title}</CardTitle>
                                            <Badge className={className}>
                                                <Icon className="h-3 w-3 mr-1" />
                                                {label}
                                            </Badge>
                                        </div>
                                        {course.description && (
                                            <CardDescription className="line-clamp-2 text-sm">
                                                {course.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>

                                    <CardContent className="flex items-end justify-between gap-4 flex-1">
                                        <dl className="flex gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <BookOpen className="h-3.5 w-3.5" />
                                                <dd>{course.question_limit ?? '?'} questions</dd>
                                            </div>
                                            {course.duration_min && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <dd>{course.duration_min} min</dd>
                                                </div>
                                            )}
                                            {status === 'completed' && scorePercent !== null && (
                                                <div className="flex items-center gap-1 font-medium text-foreground">
                                                    <dd>{scorePercent}%</dd>
                                                </div>
                                            )}
                                        </dl>

                                        <Button asChild variant="ghost" size="sm" className="gap-1 shrink-0">
                                            <Link href={`/protected/my-courses/${course.id}`}>
                                                {status === 'completed' ? 'View Result' : status === 'in_progress' ? 'Continue' : 'View'}
                                                <ChevronRight className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}