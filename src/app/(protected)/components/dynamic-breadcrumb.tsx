'use client'

import { usePathname } from 'next/navigation'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import React from 'react'

const labelMap: Record<string, string> = {
    protected: 'Home',
    admin: 'Admin',
    courses: 'Courses',
    users: 'Users',
    new: 'Create',
    result: 'Result',
}

export function DynamicBreadcrumb() {
    const pathname = usePathname()

    const rawSegments = pathname.split('/').filter(Boolean)

    const segments = rawSegments.filter(s => !['protected', 'admin'].includes(s))

    const crumbs = [
        {
            href: '/protected/admin',
            label: 'Dashboard',
            isLast: segments.length === 0,
        },
        ...segments.map((seg, i) => {
            const isLast = i === segments.length - 1
            const href =
                '/protected/admin/' + segments.slice(0, i + 1).join('/')

            const isId = /^[0-9a-f-]{36}$/.test(seg)

            const label = isId
                ? 'Detail'
                : labelMap[seg] ??
                seg.charAt(0).toUpperCase() + seg.slice(1)

            return { href, label, isLast }
        }),
    ]

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {crumbs.map(({ href, label, isLast }, i) => (
                    <React.Fragment key={href}>
                        <BreadcrumbItem>
                            {isLast ? (
                                <BreadcrumbPage>{label}</BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                        {!isLast && <BreadcrumbSeparator />}
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    )
}