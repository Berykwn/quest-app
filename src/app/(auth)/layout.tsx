import { ThemeSwitcher } from "@/components/theme-switcher";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Theme switcher pojok kanan atas */}
            <div className="absolute top-4 right-6">
                <ThemeSwitcher />
            </div>

            <div className="flex flex-1 items-center justify-center px-4 py-16">
                <main className="w-full max-w-md flex flex-col gap-8">
                    {children}
                </main>
            </div>
        </div>
    );
}