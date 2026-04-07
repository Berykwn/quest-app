import { createClient } from '@/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ExamClient from './components/exam-client'

export default async function ExamPage({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: attempt } = await supabase
        .from('attempts')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .is('finished_at', null)
        .single()

    if (!attempt) redirect(`/protected/my-courses/${courseId}`)

    const { data: course } = await supabase
        .from('courses')
        .select('title, duration_min')
        .eq('id', courseId)
        .single()

    if (!course) notFound()

    const questionIds: string[] = attempt.question_ids ?? []

    // Use snapshot — already includes correct_answer, no need to re-fetch
    const snapshot = (attempt.questions_snapshot ?? []) as any[]

    if (!snapshot.length) notFound()

    const sortedQuestions = questionIds
        .map(id => snapshot.find(q => q.id === id))
        .filter(Boolean)

    return (
        <ExamClient
            attemptId={attempt.id}
            courseId={courseId}
            courseTitle={course.title}
            durationMin={course.duration_min ?? null}
            questions={sortedQuestions as any}
            savedAnswers={attempt.answers ?? {}}
            startedAt={attempt.started_at}
        />
    )
}