import { createClient } from '@/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, BookOpen, Clock, ChevronRight, Users } from 'lucide-react'
import PublishedBadge from './[id]/components/published-badge'

export default async function CoursesPage() {
    const supabase = await createClient()

    const { data: courses } = await supabase
        .from('courses')
        .select('*, questions(count), enrollments(count)')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Courses</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage your exam courses and questions.</p>
                </div>
                <Button asChild className="gap-2" size="sm">
                    <Link href="/admin/courses/new">
                        <Plus className="h-4 w-4" />
                        New Course
                    </Link>
                </Button>
            </header>

            {!courses?.length ? (
                <section className="rounded-lg border border-dashed p-12 mt-4 text-center">
                    <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm">No courses yet.</p>
                    <Button asChild className="mt-4 gap-2">
                        <Link href="/admin/courses/new">
                            <Plus className="h-4 w-4" />
                            Create your first course
                        </Link>
                    </Button>
                </section>
            ) : (
                <section className='mt-4'>
                    <ul className="grid sm:grid-cols-2 gap-4 list-none p-0 m-0">
                        {courses.map((course: any) => (
                            <li key={course.id}>
                                <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <CardTitle className="text-base">{course.title}</CardTitle>
                                            <PublishedBadge isPublished={course.is_published} />
                                        </div>
                                        {course.description && (
                                            <CardDescription className="line-clamp-2 text-sm">{course.description}</CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent className="flex items-end justify-between gap-4 flex-1">
                                        <dl className="flex gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <BookOpen className="h-3.5 w-3.5" />
                                                <dd>{course.questions?.[0]?.count ?? 0} questions</dd>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="h-3.5 w-3.5" />
                                                <dd>{course.enrollments?.[0]?.count ?? 0} participants</dd>
                                            </div>
                                            {course.duration_min && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <dd>{course.duration_min} min</dd>
                                                </div>
                                            )}
                                        </dl>
                                        <Button asChild variant="ghost" size="sm" className="gap-1 shrink-0">
                                            <Link href={`/admin/courses/${course.id}`}>
                                                Manage <ChevronRight className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    )
}