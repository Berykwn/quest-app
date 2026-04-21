import { redirect } from 'next/navigation'
import { createClient } from '@/supabase/server'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './components/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { DynamicBreadcrumb } from './components/dynamic-breadcrumb'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()

    // Middleware guarantees authentication — we only need the session user for the DB query
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user!.id)
        .single()

    // Profile missing means DB is out of sync — redirect to sign in
    if (!profile) redirect('/sign-in')

    return (
        <SidebarProvider>
            <AppSidebar user={profile} />
            <SidebarInset>
                <header className="flex h-14 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <DynamicBreadcrumb />
                </header>
                <main className="flex-1 p-6">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}