import { createClient } from '@/supabase/server'
import UserList from './components/user-list'

export default async function UsersPage() {
    const supabase = await createClient()

    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, created_at')
        .eq('role', 'user')
        .order('created_at', { ascending: false })

    const userIds = (users ?? []).map((u: any) => u.id)

    const [
        { data: enrollments, error: enrollmentsError },
        { data: attempts },
    ] = await Promise.all([
        supabase
            .from('enrollments')
            .select('user_id, course_id, assigned_at, courses(id, title)')
            .in('user_id', userIds.length ? userIds : ['_']),
        supabase
            .from('attempts')
            .select('user_id, course_id, score, finished_at')
            .in('user_id', userIds.length ? userIds : ['_'])
            .not('finished_at', 'is', null),
    ])

    if (usersError || enrollmentsError) {
        return (
            <div className="space-y-4">
                <header>
                    <h1 className="text-2xl font-semibold">Users</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage all registered users.</p>
                </header>
                <p className="text-destructive text-sm">
                    Failed to load users: {usersError?.message ?? enrollmentsError?.message}
                </p>
            </div>
        )
    }

    // Map enrollments per user
    const enrollmentMap = new Map<string, any[]>()
    for (const e of enrollments ?? []) {
        const items = enrollmentMap.get(e.user_id) ?? []
        items.push(e)
        enrollmentMap.set(e.user_id, items)
    }

    // Map attempts per user+course
    const attemptMap = new Map<string, any>()
    for (const a of attempts ?? []) {
        attemptMap.set(`${a.user_id}:${a.course_id}`, a)
    }

    const usersWithData = (users ?? []).map((user: any) => ({
        ...user,
        enrollments: (enrollmentMap.get(user.id) ?? []).map((e: any) => ({
            ...e,
            attempt: attemptMap.get(`${user.id}:${e.course_id}`) ?? null,
        })),
    }))

    return (
        <div className="space-y-4">
            <header>
                <h1 className="text-2xl font-semibold">Users</h1>
                <p className="text-muted-foreground text-sm mt-1">Manage all registered users.</p>
            </header>
            <UserList users={usersWithData} />
        </div>
    )
}