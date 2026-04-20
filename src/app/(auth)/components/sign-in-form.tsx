'use client'

import { cn } from '@/utils/tailwind'
import { createClient } from '@/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'

export function SignInForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        const supabase = createClient()
        setIsLoading(true)

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error

            toast.success('Signed in successfully')
            router.push('/protected')
        } catch (err: unknown) {
            const message = err instanceof Error
                ? err.message === 'Invalid login credentials'
                    ? 'Invalid email or password'
                    : err.message
                : 'Something went wrong'
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <section className={cn('flex flex-col gap-6', className)} {...props}>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo-pe.png"
                            alt="PT. Priamanaya Energy Logo"
                            className="h-10 w-10 object-contain"
                        />
                        <div className="flex flex-col leading-tight">
                            <span className="text-base font-semibold tracking-tight">questions.</span>
                            <span className="text-xs text-muted-foreground">by Priamanaya Energi</span>
                        </div>
                    </div>

                    <div className='mt-4'>
                        <h1 className='font-medium'>Welcome back!</h1>
                        <p className='text-sm text-muted-foreground'>Enter your credentials to sign in</p>
                    </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
                    <form onSubmit={handleSignIn} className="flex flex-col gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="people@mail.com"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <Button type="submit" className="w-full mt-1.5" disabled={isLoading}>
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link href="/sign-up" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                            Sign up
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </section>
    )
}