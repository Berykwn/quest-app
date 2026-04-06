import { createClient } from '@/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen, Users, ClipboardList, ChevronRight } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: courseCount },
    { count: userCount },
    { count: attemptCount },
  ] = await Promise.all([
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('attempts').select('*', { count: 'exact', head: true }).not('finished_at', 'is', null),
  ])

  return (
    <div className="space-y-8">
      <section aria-label="Statistics" className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Courses', value: courseCount ?? 0, icon: BookOpen },
          { label: 'Total Users', value: userCount ?? 0, icon: Users },
          { label: 'Completed Exams', value: attemptCount ?? 0, icon: ClipboardList },
        ].map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-lg border bg-card p-4 flex items-center gap-4">
            <div className="rounded-md bg-primary/10 p-2.5">
              <Icon className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-semibold">{value}</p>
            </div>
          </article>
        ))}
      </section>

      <section aria-labelledby="menu-title">
        <h2 id="menu-title" className="text-lg font-medium mb-4">Quick Access</h2>
        <ul className="grid sm:grid-cols-2 gap-4 list-none p-0 m-0">
          {[
            { href: '/protected/admin/courses', label: 'Manage Courses', icon: BookOpen, desc: 'Create, edit, and delete courses along with their questions' },
            { href: '/protected/admin/users', label: 'Manage Users', icon: Users, desc: 'Add users and assign courses to them' },
          ].map(({ href, label, icon: Icon, desc }) => (
            <li key={href}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-4 w-4" aria-hidden />
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-end justify-between gap-4">
                  <p className="text-sm text-muted-foreground">{desc}</p>
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