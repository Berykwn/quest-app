'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/supabase/client'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BookOpen, ChevronUp, LayoutDashboard, LogOut, Users } from 'lucide-react'

interface User {
    id: string
    email: string
    name: string | null
    role: string
}

const adminNav = [
    { href: '/protected/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/protected/admin/courses', label: 'Courses', icon: BookOpen, exact: false },
    { href: '/protected/admin/users', label: 'Users', icon: Users, exact: false },
]

const userNav = [
    { href: '/protected', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/protected/courses', label: 'My Courses', icon: BookOpen, exact: false },
]

export function AppSidebar({ user }: { user: User }) {
    const pathname = usePathname()
    const router = useRouter()
    const isAdmin = user.role === 'admin'
    const navItems = isAdmin ? adminNav : userNav

    async function handleLogout() {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/auth/login')
        router.refresh()
    }

    return (
        <Sidebar>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={isAdmin ? '/protected/admin' : '/protected'}>
                                <div className="flex aspect-square size-8 items-center justify-center text-sidebar-primary-foreground">
                                    <img
                                        src="/logo-pe.png"
                                        alt="PT. Priamanaya Energy Logo"
                                        className="h-8.5 w-8.5 object-contain"
                                    />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none mt-0.5">
                                    <span className="font-semibold">quest.</span>
                                    <span className="text-xs text-muted-foreground">PT. Priamanaya Energy</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarMenu>
                        {navItems.map(({ href, label, icon: Icon, exact }) => {
                            const isActive = exact ? pathname === href : pathname.startsWith(href)
                            return (
                                <SidebarMenuItem key={href}>
                                    <SidebarMenuButton asChild isActive={isActive}>
                                        <Link href={href} className="text-neutral-600 gap-x-2">
                                            <Icon />
                                            <span>{label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton size="lg">
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground font-semibold text-sm">
                                        {(user.name || user.email).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col gap-0.5 leading-none min-w-0">
                                        <span className="font-medium truncate">{user.name || 'User'}</span>
                                        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                                    </div>
                                    <ChevronUp className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2">
                                    <LogOut className="size-4" />
                                    <span>Logout</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}