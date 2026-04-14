'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import QuestionImageUpload from '../../components/question-image-upload'

export default function EditQuestionPage({ params }: { params: Promise<{ id: string; questionId: string }> }) {
    const { id, questionId } = use(params)
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [initialized, setInitialized] = useState(false)
    const [questionType, setQuestionType] = useState<'multiple_choice' | 'true_false'>('multiple_choice')
    const [options, setOptions] = useState<{ key: string; text: string }[]>([])
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [form, setForm] = useState({
        question_text: '',
        correct_answer: '',
        explanation: '',
        points: '1',
    })

    useEffect(() => {
        async function fetchQuestion() {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('questions').select('*').eq('id', questionId).single()

            if (error || !data) {
                toast.error('Question not found.')
                router.push(`/protected/admin/courses/${id}`)
                return
            }

            setQuestionType(data.question_type)
            setForm({
                question_text: data.question_text,
                correct_answer: data.correct_answer ?? '',
                explanation: data.explanation ?? '',
                points: data.points.toString(),
            })
            if (data.options) setOptions(data.options)
            if (data.image_url) setImageUrl(data.image_url)
            setFetching(false)
            setInitialized(true)
        }
        fetchQuestion()
    }, [questionId])

    useEffect(() => {
        if (!initialized) return
        if (questionType === 'multiple_choice') {
            setOptions([
                { key: 'A', text: '' }, { key: 'B', text: '' },
                { key: 'C', text: '' }, { key: 'D', text: '' },
            ])
        } else {
            setOptions([{ key: 'true', text: 'True' }, { key: 'false', text: 'False' }])
        }
        setForm(f => ({ ...f, correct_answer: '' }))
    }, [questionType])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (questionType === 'multiple_choice' && options.filter(o => o.text.trim()).length < 2) {
            toast.warning('Please fill in at least 2 answer choices.')
            return
        }
        setLoading(true)
        const supabase = createClient()

        const optionsData = questionType === 'multiple_choice'
            ? options.filter(o => o.text.trim())
            : [{ key: 'true', text: 'True' }, { key: 'false', text: 'False' }]

        const { error } = await supabase.from('questions').update({
            question_text: form.question_text,
            question_type: questionType,
            options: optionsData,
            correct_answer: form.correct_answer || null,
            explanation: form.explanation || null,
            points: parseInt(form.points) || 1,
            image_url: imageUrl,
        }).eq('id', questionId)

        if (error) { toast.error('Failed to save changes.', { description: error.message }); setLoading(false); return }
        toast.success('Question updated successfully.')
        router.push(`/protected/admin/courses/${id}`)
    }

    const isSubmitDisabled = loading || !form.question_text
        || (questionType === 'multiple_choice' && options.filter(o => o.text.trim()).length < 2)

    if (fetching) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <header className="flex items-center gap-3">
                <Button asChild variant="ghost" size="icon">
                    <Link href={`/protected/admin/courses/${id}`} aria-label="Back">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold">Edit Question</h1>
                    <p className="text-muted-foreground text-sm">Update the question and answer choices.</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <Card>
                    <CardHeader><CardTitle className="text-base">Question Details</CardTitle></CardHeader>
                    <CardContent>
                        <fieldset disabled={loading} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Question Type</Label>
                                    <Select value={questionType} onValueChange={(v: any) => setQuestionType(v)}>
                                        <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                            <SelectItem value="true_false">True / False</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="points">Points</Label>
                                    <Input id="points" type="number" min="1" value={form.points}
                                        onChange={e => setForm(f => ({ ...f, points: e.target.value }))} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="question_text">Question <span aria-hidden className="text-destructive">*</span></Label>
                                <Textarea id="question_text" placeholder="Write your question here..." rows={3} required
                                    value={form.question_text}
                                    onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))} />
                            </div>

                            <div className="space-y-2">
                                <Label>Question Image</Label>
                                <QuestionImageUpload value={imageUrl} onChange={setImageUrl} />
                            </div>

                            {questionType === 'multiple_choice' && (
                                <div className="space-y-3">
                                    <Label>Answer Choices <span aria-hidden className="text-destructive">*</span> <span className="text-muted-foreground text-xs">(min. 2)</span></Label>
                                    {options.map((opt, i) => (
                                        <div key={opt.key} className="flex items-center gap-2">
                                            <span className="w-7 text-center text-sm font-medium text-muted-foreground shrink-0">{opt.key}.</span>
                                            <Input placeholder={`Choice ${opt.key}`} value={opt.text}
                                                onChange={e => { const u = [...options]; u[i].text = e.target.value; setOptions(u) }} />
                                            {options.length > 2 && (
                                                <Button type="button" variant="ghost" size="icon"
                                                    onClick={() => setOptions(o => o.filter((_, j) => j !== i))}
                                                    className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    {options.length < 6 && (
                                        <Button type="button" variant="outline" size="sm" className="gap-2"
                                            onClick={() => {
                                                const keys = 'ABCDEFGHIJ'
                                                setOptions(o => [...o, { key: keys[o.length] ?? String(o.length + 1), text: '' }])
                                            }}>
                                            <Plus className="h-3.5 w-3.5" />Add Choice
                                        </Button>
                                    )}
                                </div>
                            )}

                            {questionType === 'true_false' && (
                                <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                                    Options: <span className="font-medium text-foreground">True</span> / <span className="font-medium text-foreground">False</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="correct_answer">Correct Answer <span aria-hidden className="text-destructive">*</span></Label>
                                <Select value={form.correct_answer} onValueChange={v => setForm(f => ({ ...f, correct_answer: v }))}>
                                    <SelectTrigger id="correct_answer"><SelectValue placeholder="Select correct answer..." /></SelectTrigger>
                                    <SelectContent>
                                        {questionType === 'true_false'
                                            ? [{ key: 'true', text: 'True' }, { key: 'false', text: 'False' }].map(o => (
                                                <SelectItem key={o.key} value={o.key}>{o.text}</SelectItem>
                                            ))
                                            : options.filter(o => o.text.trim()).map(o => (
                                                <SelectItem key={o.key} value={o.key}>{o.key}. {o.text}</SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="explanation">Explanation <span className="text-muted-foreground text-xs">(optional)</span></Label>
                                <Textarea id="explanation" placeholder="Explanation shown after the exam..." rows={2}
                                    value={form.explanation}
                                    onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} />
                            </div>
                        </fieldset>
                    </CardContent>
                </Card>

                <div className="flex gap-3">
                    <Button type="submit" disabled={isSubmitDisabled} className="gap-2">
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button type="button" variant="outline" asChild>
                        <Link href={`/protected/admin/courses/${id}`}>Cancel</Link>
                    </Button>
                </div>
            </form>
        </div>
    )
}