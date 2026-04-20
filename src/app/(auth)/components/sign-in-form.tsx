'use client'

import { cn } from '@/utils/tailwind'
import { createClient } from '@/supabase/client'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export function SignInForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<'div'>) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        const supabase = createClient()
        setIsLoading(true)

        const loadingToast = toast.loading('Signing in...')

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            const {
                data: { user },
            } = await supabase.auth.getUser()

            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', user!.id)
                .single()

            toast.dismiss(loadingToast)
            toast.success('Signed in successfully')

            if (profile?.role === 'admin') {
                router.push('/protected/admin')
            } else {
                router.push('/protected')
            }
        } catch (err: unknown) {
            toast.dismiss(loadingToast)

            const message =
                err instanceof Error
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
        <div className={cn('flex flex-col gap-6', className)} {...props}>
            <Card className="p-2">
                <CardHeader>
                    <CardTitle className="text-xl">Welcome back</CardTitle>
                    <CardDescription>
                        Enter your email and password to sign in to your account
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSignIn}>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                </div>

                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="********"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full hover:bg-primary/90"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </div>

                        <div className="mt-4 text-center text-sm border-t pt-4">
                            Forgot your password?{' '}
                            <Link
                                href="/forgot-password"
                                className="underline underline-offset-4"
                            >
                                Reset it here
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}