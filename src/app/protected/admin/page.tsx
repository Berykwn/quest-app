import { createClient } from '@/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen, Users, ClipboardList, ChevronRight, CheckCircle2, XCircle, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: courseCount },
    { count: publishedCount },
    { count: userCount },
    { data: attempts },
  ] = await Promise.all([
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('attempts').select('score').not('finished_at', 'is', null),
  ])

  const attemptCount = attempts?.length ?? 0
  const passedCount = attempts?.filter(a => (a.score ?? 0) >= 70).length ?? 0
  const failedCount = attemptCount - passedCount
  const passRate = attemptCount > 0 ? Math.round((passedCount / attemptCount) * 100) : null

  return (
    <div className="space-y-8">
      {/* Stats */}
      <section aria-label="Statistics" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Courses',
            value: courseCount ?? 0,
            sub: `${publishedCount ?? 0} published`,
            icon: BookOpen,
            className: '',
          },
          {
            label: 'Total Users',
            value: userCount ?? 0,
            sub: 'registered users',
            icon: Users,
            className: '',
          },
          {
            label: 'Completed Exams',
            value: attemptCount,
            sub: passRate !== null ? `${passRate}% pass rate` : 'no attempts yet',
            icon: ClipboardList,
            className: '',
          },
          {
            label: 'Pass / Fail',
            value: `${passedCount} / ${failedCount}`,
            sub: attemptCount > 0 ? `of ${attemptCount} submissions` : 'no submissions yet',
            icon: TrendingUp,
            className: '',
          },
        ].map(({ label, value, sub, icon: Icon }) => (
          <article key={label} className="rounded-lg border bg-card p-4 flex items-center gap-4">
            <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
              <Icon className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-semibold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </div>
          </article>
        ))}
      </section>

      {/* Pass / Fail bar */}
      {attemptCount > 0 && (
        <section aria-label="Pass rate" className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Exam Pass Rate</span>
            <span className="text-muted-foreground">{passedCount} passed · {failedCount} failed</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${passRate}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              {passRate}% passed
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-destructive" />
              {100 - (passRate ?? 0)}% failed
            </span>
          </div>
        </section>
      )}

      {/* Quick access */}
      <section aria-labelledby="menu-title">
        <h2 id="menu-title" className="text-lg font-medium mb-4">Quick Access</h2>
        <ul className="grid sm:grid-cols-2 gap-4 list-none p-0 m-0">
          {[
            {
              href: '/protected/admin/courses',
              label: 'Manage Courses',
              icon: BookOpen,
              desc: 'Create, edit, and delete courses along with their questions.',
              meta: `${courseCount ?? 0} courses · ${publishedCount ?? 0} published`,
            },
            {
              href: '/protected/admin/users-management',
              label: 'Manage Users',
              icon: Users,
              desc: 'View users and assign courses to them.',
              meta: `${userCount ?? 0} registered users`,
            },
          ].map(({ href, label, icon: Icon, desc, meta }) => (
            <li key={href}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-4 w-4" aria-hidden />
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-end justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{desc}</p>
                    <p className="text-xs text-muted-foreground font-medium">{meta}</p>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="shrink-0">
                    <Link href={href}><ChevronRight className="h-4 w-4" /></Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}