import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const { pathname } = request.nextUrl

    const publicRoutes = ['/sign-in', '/sign-up', '/forgot-password', '/update-password', '/confirm', '/error']
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
    const isAdminRoute = pathname.startsWith('/admin')
    // Fix: user route is strictly '/' or '/something' that is NOT admin and NOT public
    const isUserRoute = !isAdminRoute && !isPublicRoute

    // Unauthenticated — block access to protected routes
    if (!user && !isPublicRoute) {
        return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    // Authenticated — block access to public routes, redirect by role
    if (user && isPublicRoute) {
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        const destination = profile?.role === 'admin' ? '/admin' : '/'
        return NextResponse.redirect(new URL(destination, request.url))
    }

    // Role-based access control
    if (user && (isAdminRoute || isUserRoute)) {
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        const isAdmin = profile?.role === 'admin'

        if (isAdminRoute && !isAdmin) {
            return NextResponse.redirect(new URL('/', request.url))
        }

        if (isUserRoute && isAdmin) {
            return NextResponse.redirect(new URL('/admin', request.url))
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}