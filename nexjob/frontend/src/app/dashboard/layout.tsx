import { Sidebar } from "@/components/Sidebar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
            <Sidebar />
            <main className="flex-1 flex flex-col max-h-screen overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8 relative">
                    <div className="absolute top-0 right-0 -z-10 w-full h-96 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none" />
                    {children}
                </div>
            </main>
        </div>
    )
}
