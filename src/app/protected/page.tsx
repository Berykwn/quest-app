import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/supabase/server'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Clock, ChevronRight, ClipboardList } from 'lucide-react'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users').select('role, name').eq('id', user.id).single()

  if (profile?.role === 'admin') redirect('/protected/admin')

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`course_id, assigned_at, courses(id, title, description, duration_min, questions(count))`)
    .eq('user_id', user.id)

  const { data: attempts } = await supabase
    .from('attempts')
    .select('course_id, score, finished_at')
    .eq('user_id', user.id)
    .not('finished_at', 'is', null)

  const attemptMap = new Map(attempts?.map(a => [a.course_id, a]))

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold">
          Welcome back, {profile?.name || 'there'} 👋
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Here are your assigned exams.
        </p>
      </section>

      <section aria-label="Summary" className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Assigned', value: enrollments?.length ?? 0 },
          { label: 'Completed', value: attempts?.length ?? 0 },
          { label: 'Remaining', value: (enrollments?.length ?? 0) - (attempts?.length ?? 0) },
        ].map(({ label, value }) => (
          <article key={label} className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold">{value}</p>
          </article>
        ))}
      </section>

      <section aria-labelledby="courses-title">
        <h2 id="courses-title" className="text-lg font-medium mb-4">My Exams</h2>

        {!enrollments?.length ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">No exams assigned yet.</p>
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
            {enrollments.map((enrollment: any) => {
              const course = enrollment.courses
              const attempt = attemptMap.get(course.id)
              const isDone = !!attempt

              return (
                <li key={course.id}>
                  <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base leading-snug">{course.title}</CardTitle>
                        <Badge variant={isDone ? 'secondary' : 'default'} className="shrink-0">
                          {isDone ? 'Done' : 'Pending'}
                        </Badge>
                      </div>
                      {course.description && (
                        <CardDescription className="line-clamp-2 text-sm">
                          {course.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="pb-2 flex-1">
                      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" aria-hidden />
                          <dd>{course.questions?.[0]?.count ?? 0} questions</dd>
                        </div>
                        {course.duration_min && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" aria-hidden />
                            <dd>{course.duration_min} min</dd>
                          </div>
                        )}
                      </dl>
                      {isDone && attempt.score !== null && (
                        <p className="mt-2 text-sm font-medium text-green-600">
                          Score: {attempt.score.toFixed(0)}
                        </p>
                      )}
                    </CardContent>

                    <CardFooter>
                      <Button asChild className="w-full gap-2" variant={isDone ? 'outline' : 'default'}>
                        <Link href={`/protected/course/${course.id}`}>
                          {isDone ? 'View Results' : 'Start Exam'}
                          <ChevronRight className="h-4 w-4" aria-hidden />
                        </Link>
                      </Button>
                    </CardFooter>
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