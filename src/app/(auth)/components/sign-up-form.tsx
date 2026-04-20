'use client'

import { cn } from '@/utils/tailwind'
import { createClient } from '@/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

export function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [name, setName] = useState('')
    const [division, setDivision] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [done, setDone] = useState(false)

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        const supabase = createClient()
        setIsLoading(true)

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { name } },
            })

            if (authError) throw authError

            const user = authData.user
            if (!user) throw new Error('Failed to create account')

            // Trigger already handles inserting (id, email, name, role) — just update division
            const { error: profileError } = await supabase
                .from('users')
                .update({ division })
                .eq('id', user.id)

            if (profileError) throw profileError

            setDone(true)
        } catch (err: unknown) {
            const message = err instanceof Error
                ? err.message === 'User already registered'
                    ? 'Email is already registered'
                    : err.message
                : 'Something went wrong'
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    if (done) {
        return (
            <Card className="shadow-md text-center">
                <CardHeader>
                    <CardTitle className="text-xl">Check your email</CardTitle>
                    <CardDescription>
                        We sent a confirmation link to{' '}
                        <span className="text-foreground font-medium">{email}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Already confirmed?{' '}
                        <Link href="/sign-in" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                            Sign in
                        </Link>
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className={cn('flex flex-col gap-6', className)} {...props}>
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
                        <h1 className='font-medium'>Create an account</h1>
                        <p className='text-sm text-muted-foreground'>Fill in your details to get started</p>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSignUp} className="flex flex-col gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                autoComplete="name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="division">Division</Label>
                            <Input
                                id="division"
                                type="text"
                                placeholder="Engineering..."
                                required
                                value={division}
                                onChange={(e) => setDivision(e.target.value)}
                            />
                        </div>

                        {/* Password + Confirm — 2 columns */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="confirmPassword">Confirm</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full mt-1" disabled={isLoading}>
                            {isLoading ? 'Creating account...' : 'Sign Up'}
                        </Button>

                        <p className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link href="/sign-in" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}