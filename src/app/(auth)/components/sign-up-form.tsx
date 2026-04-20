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

export function SignUpForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<'div'>) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [name, setName] = useState('')
    const [division, setDivision] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        const supabase = createClient()
        setIsLoading(true)

        const loadingToast = toast.loading('Creating account...')

        try {
            const { data: authData, error: authError } =
                await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { name },
                    },
                })

            if (authError) throw authError

            const user = authData.user
            if (!user) throw new Error('Failed to create account')

            const { error: profileError } = await supabase
                .from('users')
                .update({ division })
                .eq('id', user.id)

            if (profileError) throw profileError

            toast.dismiss(loadingToast)
            toast.success('Account created successfully')

            router.push('/protected')
        } catch (err: unknown) {
            toast.dismiss(loadingToast)

            const message =
                err instanceof Error
                    ? err.message === 'User already registered'
                        ? 'Email is already registered'
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
                    <CardTitle className="text-xl">Create an account</CardTitle>
                    <CardDescription>
                        Enter your details below to create your account
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSignUp}>
                        <div className="flex flex-col gap-4">
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
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
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
                                    placeholder="Engineering, HR, Finance..."
                                    required
                                    value={division}
                                    onChange={(e) => setDivision(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="********"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="confirmPassword">
                                    Confirm Password
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="********"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full hover:bg-primary/90"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Creating account...' : 'Sign Up'}
                            </Button>
                        </div>

                        <div className="mt-4 text-center text-sm border-t pt-4">
                            Already have an account?{' '}
                            <Link
                                href="/sign-in"
                                className="underline underline-offset-4"
                            >
                                Sign in here
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}