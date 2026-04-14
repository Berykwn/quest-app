import { createClient } from '@/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen, Clock, ChevronRight, CheckCircle2, CircleDashed, CirclePlay, Trophy } from 'lucide-react'
import { notFound } from 'next/navigation'
import { cn } from '@/lib/utils'
import { JoinCourseDialog } from './components/join-course-dialog'

export default async function UserDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: dbUser } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
            course_id,
            assigned_at,
            courses (
                id, title, description, duration_min, question_limit
            )
        `)
    .eq('user_id', user.id)
    .order('assigned_at', { ascending: false })

  const courseIds = enrollments?.map(e => e.course_id) ?? []

  const { data: attempts } = courseIds.length > 0
    ? await supabase
      .from('attempts')
      .select('id, course_id, score, started_at, finished_at')
      .eq('user_id', user.id)
      .in('course_id', courseIds)
      .order('started_at', { ascending: false })
    : { data: [] }

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

  const total = courses.length
  const completed = courses.filter(c => c.attempt?.finished_at).length
  const inProgress = courses.filter(c => c.attempt && !c.attempt.finished_at).length
  const notStarted = total - completed - inProgress
  const passed = courses.filter(c =>
    c.attempt?.finished_at && (c.attempt?.score ?? 0) >= 70
  ).length

  // Prioritize in_progress, then not_started, then completed
  const prioritized = [
    ...courses.filter(c => c.attempt && !c.attempt.finished_at),
    ...courses.filter(c => !c.attempt),
    ...courses.filter(c => c.attempt?.finished_at),
  ].slice(0, 4)

  const firstName = dbUser?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <header>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Hi, {firstName} 👋</h1>
          <JoinCourseDialog />
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          Here's an overview of your exam progress.
        </p>
      </header>

      {/* Stats */}
      <section aria-label="Statistics" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Courses', value: total, className: '' },
          { label: 'In Progress', value: inProgress, className: inProgress > 0 ? 'text-amber-600' : '' },
          { label: 'Completed', value: completed, className: completed > 0 ? 'text-emerald-600' : '' },
          { label: 'Passed', value: `${passed} / ${completed}`, className: passed > 0 ? 'text-emerald-600' : '' },
        ].map(({ label, value, className }) => (
          <article key={label} className="rounded-lg border bg-card p-4 flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className={cn('text-2xl font-semibold', className)}>{value}</p>
            </div>
          </article>
        ))}
      </section>

      {/* Course list */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">My Courses</h2>
          {total > 4 && (
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/protected/my-courses">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">You have no courses assigned yet.</p>
            <p className="text-muted-foreground text-xs mt-1">Have an enroll code? Use the Join Course button above.</p>
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-4 list-none p-0 m-0">
            {prioritized.map(course => {
              const isDone = !!course.attempt?.finished_at
              const isInProgress = course.attempt && !course.attempt.finished_at
              const score = course.attempt?.score ?? null
              const isPassed = (score ?? 0) >= 70

              const statusBadge = isDone
                ? { label: 'Completed', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' }
                : isInProgress
                  ? { label: 'In Progress', icon: CirclePlay, className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' }
                  : { label: 'Not Started', icon: CircleDashed, className: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-100' }

              const { label, icon: Icon, className } = statusBadge

              return (
                <li key={course.id}>
                  <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{course.title}</CardTitle>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className={cn('shrink-0 gap-1 text-xs h-auto py-1 px-2', className)}
                        >
                          <Link href={`/protected/my-courses/${course.id}`}>
                            <Icon className="h-3 w-3" />
                            {label}
                          </Link>
                        </Button>
                      </div>
                      {course.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {course.description}
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="flex items-end justify-between gap-4 flex-1">
                      <dl className="flex gap-4 text-sm text-muted-foreground">
                        {course.question_limit && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" />
                            <dd>{course.question_limit} questions</dd>
                          </div>
                        )}
                        {course.duration_min && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <dd>{course.duration_min} min</dd>
                          </div>
                        )}
                        {isDone && score !== null && (
                          <div className={cn(
                            'flex items-center gap-1 font-medium',
                            isPassed ? 'text-emerald-600' : 'text-destructive'
                          )}>
                            <Trophy className="h-3.5 w-3.5" />
                            <dd>{Math.round(score)}% · {isPassed ? 'Pass' : 'Fail'}</dd>
                          </div>
                        )}
                      </dl>

                      <Button asChild variant="ghost" size="sm" className="gap-1 shrink-0">
                        <Link href={`/protected/my-courses/${course.id}`}>
                          {isDone ? 'View Result' : isInProgress ? 'Continue' : 'Start'}
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
      </section>
    </div>
  )
}