import { ThemeSwitcher } from "@/components/theme-switcher";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <div className="min-h-screen flex flex-col">
                <nav className="fixed-top flex items-center justify-between px-6 py-3.5">
                    <div className="flex items-center gap-x-3">
                        <img
                            src="/logo-pe.png"
                            alt="PT. Priamanaya Energy Logo"
                            className="h-8.5 w-8.5 object-contain"
                        />

                        <div className="flex flex-col leading-tight">
                            <span className="text- font-semibold tracking-tight">
                                questions.
                            </span>
                            <span className="text-xs text-muted-foreground">
                                by Priamanaya Energi
                            </span>
                        </div>
                    </div>

                    <ThemeSwitcher />
                </nav>

                <main className="flex-1 flex items-center justify-center">
                    <div className="w-full max-w-md">
                        {children}
                    </div>
                </main>
            </div>
        </>
    );
}