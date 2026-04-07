'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Trash2, Loader2, Settings, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'

export default function CourseActions({ course }: { course: any }) {
    const router = useRouter()
    const [published, setPublished] = useState(course.is_published)
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [open, setOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState('')
    const [form, setForm] = useState({
        title: course.title,
        description: course.description ?? '',
        duration_min: course.duration_min?.toString() ?? '',
        question_limit: course.question_limit?.toString() ?? '',
    })

    async function togglePublish(val: boolean) {
        setLoading(true)
        const supabase = createClient()

        // Validate before publish
        if (val) {
            const { count } = await supabase
                .from('questions')
                .select('*', { count: 'exact', head: true })
                .eq('course_id', course.id)

            if (!count || count === 0) {
                toast.error('Cannot publish course.', {
                    description: 'Add at least one question before publishing.',
                })
                setLoading(false)
                return
            }
        }

        const { error } = await supabase
            .from('courses')
            .update({ is_published: val })
            .eq('id', course.id)

        if (error) {
            toast.error('Failed to update publish status.', { description: error.message })
        } else {
            setPublished(val)
            toast.success(val ? 'Course published.' : 'Course set to draft.')
            router.refresh()
        }
        setLoading(false)
    }

    async function saveSettings(e: React.FormEvent) {
        e.preventDefault()
        if (!form.title.trim()) return
        setLoading(true)
        const supabase = createClient()

        // Validate question_limit against the number of existing questions
        if (form.question_limit) {
            const limit = parseInt(form.question_limit)

            const { count } = await supabase
                .from('questions')
                .select('*', { count: 'exact', head: true })
                .eq('course_id', course.id)

            if (count !== null && limit > count) {
                toast.error('Question limit too high.', {
                    description: `You only have ${count} question${count === 1 ? '' : 's'}. Limit cannot exceed total questions.`,
                })
                setLoading(false)
                return
            }
        }

        const { error } = await supabase.from('courses').update({
            title: form.title.trim(),
            description: form.description.trim() || null,
            duration_min: form.duration_min ? parseInt(form.duration_min) : null,
            question_limit: form.question_limit ? parseInt(form.question_limit) : null,
        }).eq('id', course.id)

        if (error) {
            toast.error('Failed to save changes.', { description: error.message })
        } else {
            setOpen(false)
            toast.success('Course updated successfully.')
            router.refresh()
        }
        setLoading(false)
    }

    async function handleDelete() {
        setDeleting(true)
        const supabase = createClient()
        const { error } = await supabase.from('courses').delete().eq('id', course.id)
        if (error) {
            toast.error('Failed to delete course.', { description: error.message })
            setDeleting(false)
            return
        }
        toast.success('Course deleted.')
        router.push('/protected/admin/courses')
    }

    return (
        <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2">
                <Switch id="publish" checked={published} onCheckedChange={togglePublish} disabled={loading} />
                <Label htmlFor="publish" className="text-sm cursor-pointer">
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : published ? 'Published' : 'Draft'}
                </Label>
            </div>

            {/* Edit Settings Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Edit course settings">
                        <Settings className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Course</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={saveSettings} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                            <Input
                                id="title"
                                required
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="desc">Description</Label>
                            <Textarea
                                id="desc"
                                rows={3}
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dur">Duration (min)</Label>
                                <Input
                                    id="dur"
                                    type="number"
                                    min="1"
                                    placeholder="Unlimited"
                                    value={form.duration_min}
                                    onChange={e => setForm(f => ({ ...f, duration_min: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="qlimit">Question Limit</Label>
                                <Input
                                    id="qlimit"
                                    type="number"
                                    min="1"
                                    placeholder="Show all"
                                    value={form.question_limit}
                                    onChange={e => setForm(f => ({ ...f, question_limit: e.target.value }))}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Required questions always appear. Remaining slots filled randomly.
                            Question limit cannot exceed total questions in this course.
                        </p>
                        <div className="flex gap-3 pt-1">
                            <Button type="submit" disabled={loading || !form.title.trim()} className="gap-2 flex-1">
                                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteOpen} onOpenChange={v => { setDeleteOpen(v); if (!v) setDeleteConfirm('') }}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        aria-label="Delete course">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <TriangleAlert className="h-5 w-5" />
                            Delete Course
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-1">
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                            This action <span className="font-semibold">cannot be undone.</span> This will permanently delete the course and all its questions.
                        </div>
                        <div className="space-y-2">
                            <p className='text-sm text-neutral-600'>Type "<span className="font-semibold">{course.title}</span>" to confirm</p>
                            <Input
                                id="delete-confirm"
                                placeholder={course.title}
                                value={deleteConfirm}
                                onChange={e => setDeleteConfirm(e.target.value)}
                                onPaste={e => e.preventDefault()}
                                autoComplete="off"
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="destructive"
                                disabled={deleteConfirm !== course.title || deleting}
                                onClick={handleDelete}
                                className="gap-2 flex-1 text-white"
                            >
                                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                                {deleting ? 'Deleting...' : 'Delete Course'}
                            </Button>
                            <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteConfirm('') }}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}