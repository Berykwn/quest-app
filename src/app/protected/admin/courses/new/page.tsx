'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function NewCoursePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        title: '',
        description: '',
        duration_min: '',
        question_limit: '',
        enroll_code: '',
        is_published: false,
    })

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('courses')
            .insert({
                title: form.title,
                description: form.description || null,
                duration_min: form.duration_min ? parseInt(form.duration_min) : null,
                question_limit: form.question_limit ? parseInt(form.question_limit) : null,
                enroll_code: form.enroll_code.trim() || null,
                is_published: form.is_published,
                created_by: user.id,
            })
            .select('id')
            .single()

        if (error) { alert(error.message); setLoading(false); return }
        router.push(`/protected/admin/courses/${data.id}`)
    }

    return (
        <div className="max-w-2xl space-y-6">
            <header className="flex items-center gap-3">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/protected/admin/courses" aria-label="Back">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold">New Course</h1>
                    <p className="text-muted-foreground text-sm">Fill in the details then add questions.</p>
                </div>
            </header>

            <Card>
                <CardHeader><CardTitle className="text-base">Course Details</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        <fieldset disabled={loading} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title <span aria-hidden className="text-destructive">*</span></Label>
                                <Input id="title" placeholder="e.g. Basic Mathematics" required
                                    value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" placeholder="Brief description about this course..." rows={3}
                                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="duration">Duration (minutes)</Label>
                                    <Input id="duration" type="number" min="1"
                                        placeholder="e.g. 60 (unlimited if empty)"
                                        value={form.duration_min}
                                        onChange={e => setForm(f => ({ ...f, duration_min: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="question_limit">Question Limit</Label>
                                    <Input id="question_limit" type="number" min="1"
                                        placeholder="e.g. 20 (all if empty)"
                                        value={form.question_limit}
                                        onChange={e => setForm(f => ({ ...f, question_limit: e.target.value }))} />
                                    <p className="text-xs text-muted-foreground">
                                        How many questions shown per attempt. Required questions always included.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="enroll_code">Enroll Code</Label>
                                <Input id="enroll_code" placeholder="e.g. SAFETY2026 (optional)"
                                    value={form.enroll_code}
                                    onChange={e => setForm(f => ({ ...f, enroll_code: e.target.value.toUpperCase() }))} 
                                    autoComplete="off" />
                                <p className="text-xs text-muted-foreground">
                                    Users can self-enroll using this code. Leave empty to disable.
                                </p>
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="published" className="text-base cursor-pointer">Publish now</Label>
                                    <p className="text-sm text-muted-foreground">Course will be visible to assigned users.</p>
                                </div>
                                <Switch id="published" checked={form.is_published}
                                    onCheckedChange={val => setForm(f => ({ ...f, is_published: val }))} />
                            </div>
                        </fieldset>

                        <div className="flex gap-3 pt-2">
                            <Button type="submit" disabled={loading || !form.title} className="gap-2">
                                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                {loading ? 'Saving...' : 'Create Course'}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href="/protected/admin/courses">Cancel</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}