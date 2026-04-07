import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import CourseActions from './components/course-actions'
import QuestionList from './components/question-list'
import ParticipantManager from './components/participants-manager'
import ResultList from './components/result-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PublishedBadge from './components/published-badge'

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const [
        { data: course },
        { data: questions },
        { data: allUsers },
        { data: enrollments },
        { data: attempts },
    ] = await Promise.all([
        supabase.from('courses').select('*').eq('id', id).single(),
        supabase.from('questions').select('*').eq('course_id', id).order('order_number'),
        supabase.from('users').select('id, name, email').eq('role', 'user').order('name'),
        supabase.from('enrollments').select('user_id').eq('course_id', id),
        supabase.from('attempts')
            .select('*, users(id, name, email)')
            .eq('course_id', id)
            .not('finished_at', 'is', null)
            .order('finished_at', { ascending: false }),
    ])

    if (!course) notFound()

    const enrolledIds = new Set(enrollments?.map(e => e.user_id) ?? [])
    const enrolled = allUsers?.filter(u => enrolledIds.has(u.id)) ?? []
    const unenrolled = allUsers?.filter(u => !enrolledIds.has(u.id)) ?? []

    const totalQuestions = questions?.length ?? 0
    const requiredCount = questions?.filter(q => q.is_required).length ?? 0
    const shownCount = course.question_limit ?? totalQuestions

    return (
        <div className="space-y-6">
            <header className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <Button asChild variant="ghost" size="icon" className="mt-0.5">
                        <Link href="/protected/admin/courses" aria-label="Back">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-semibold">{course.title}</h1>
                            <PublishedBadge isPublished={course.is_published} />
                        </div>
                        {course.description && (
                            <p className="text-muted-foreground text-sm">{course.description}</p>
                        )}
                    </div>
                </div>
                <CourseActions course={course} />
            </header>

            <section aria-label="Course stats" className="grid grid-cols-3 gap-4">
                <article className="rounded-lg border bg-card p-4 text-center">
                    <p className="text-2xl font-semibold">{totalQuestions}</p>
                    <p className="text-sm text-muted-foreground">Total Questions</p>
                </article>
                <article className="rounded-lg border bg-card p-4 text-center">
                    <p className="text-2xl font-semibold">{shownCount}</p>
                    <p className="text-sm text-muted-foreground">Shown per Attempt</p>
                    {course.question_limit && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {requiredCount} required + {Math.max(0, shownCount - requiredCount)} random
                        </p>
                    )}
                </article>
                <article className="rounded-lg border bg-card p-4 text-center">
                    <p className="text-2xl font-semibold">{course.duration_min ?? '∞'}</p>
                    <p className="text-sm text-muted-foreground">Duration (min)</p>
                </article>
            </section>

            <Tabs defaultValue="questions">
                <TabsList>
                    <TabsTrigger value="questions">Questions</TabsTrigger>
                    <TabsTrigger value="participant">
                        Participants
                        {enrolled.length > 0 && (
                            <span className="ml-2 rounded-full bg-primary/10 text-primary text-xs px-1.5 py-0.5">
                                {enrolled.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="results">
                        Results
                        {attempts && attempts.length > 0 && (
                            <span className="ml-2 rounded-full bg-primary/10 text-primary text-xs px-1.5 py-0.5">
                                {attempts.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="questions">
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium">Question List</h2>
                            <Button asChild size="sm" className="gap-2">
                                <Link href={`/protected/admin/courses/${id}/questions/new`}>
                                    <Plus className="h-4 w-4" />
                                    Add Question
                                </Link>
                            </Button>
                        </div>
                        <QuestionList courseId={id} questions={questions ?? []} />
                    </section>
                </TabsContent>

                <TabsContent value="participant">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium">Participant List</h2>
                    </div>
                    <ParticipantManager
                        courseId={id}
                        enrolled={enrolled}
                        unenrolled={unenrolled}
                    />
                </TabsContent>

                <TabsContent value="results">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium">Exam Results</h2>
                    </div>
                    <ResultList attempts={attempts ?? []} enrolledCount={enrolled.length} />
                </TabsContent>
            </Tabs>
        </div>
    )
}