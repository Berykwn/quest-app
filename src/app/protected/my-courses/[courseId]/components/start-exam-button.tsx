'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function StartExamButton({ courseId }: { courseId: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleStart() {
        setLoading(true)
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { toast.error('Not authenticated.'); setLoading(false); return }

        const { data: existing } = await supabase
            .from('attempts')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .single()

        if (existing) {
            toast.error('You have already attempted this exam.')
            router.refresh()
            setLoading(false)
            return
        }

        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('question_limit')
            .eq('id', courseId)
            .single()

        if (courseError || !course) {
            toast.error('Failed to load course data.')
            setLoading(false)
            return
        }

        const { data: questions, error: questionsError } = await supabase
            .from('questions')
            .select('id, question_text, question_type, options, correct_answer, explanation, points, is_required')
            .eq('course_id', courseId)

        if (questionsError || !questions?.length) {
            toast.error('No questions found for this course.')
            setLoading(false)
            return
        }

        // Pick required + random
        const required = questions.filter(q => q.is_required)
        const pool = questions.filter(q => !q.is_required)
        const limit = course.question_limit ?? questions.length
        const randomNeeded = Math.max(0, limit - required.length)

        const shuffledPool = [...pool]
        for (let i = shuffledPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
                ;[shuffledPool[i], shuffledPool[j]] = [shuffledPool[j], shuffledPool[i]]
        }

        const combined = [...required, ...shuffledPool.slice(0, randomNeeded)]
        for (let i = combined.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
                ;[combined[i], combined[j]] = [combined[j], combined[i]]
        }

        const questionIds = combined.map(q => q.id)
        const snapshot = combined.map(({ id, question_text, question_type, options, correct_answer, explanation, points }) => ({
            id, question_text, question_type, options, correct_answer, explanation, points,
        }))

        const { data: attempt, error: attemptError } = await supabase
            .from('attempts')
            .insert({
                user_id: user.id,
                course_id: courseId,
                question_ids: questionIds,
                questions_snapshot: snapshot,
                answers: {},
            })
            .select('id')
            .single()

        if (attemptError || !attempt) {
            toast.error('Failed to start exam.', { description: attemptError?.message })
            setLoading(false)
            return
        }

        router.push(`/protected/my-courses/${courseId}/exam`)
    }

    return (
        <Button onClick={handleStart} disabled={loading} className="w-full gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Preparing exam...' : 'Start Exam'}
        </Button>
    )
}