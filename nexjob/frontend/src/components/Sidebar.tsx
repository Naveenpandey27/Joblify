"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, FileText, FileEdit, HelpCircle, Search, DollarSign, LogOut, Lock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ComingSoonModal } from "@/components/ComingSoonModal"

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [showComingSoon, setShowComingSoon] = useState(false)

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, comingSoon: false },
        { name: "Resume Optimizer", href: "/dashboard/resume-optimizer", icon: FileText, comingSoon: false },
        { name: "Cover Letter", href: "/dashboard/cover-letter", icon: FileEdit, comingSoon: false },
        { name: "Interview Prep", href: "/dashboard/interview-prep", icon: HelpCircle, comingSoon: false },
    ]

    const comingSoonItems = [
        { name: "Jobs", icon: Search },
        { name: "Pricing", icon: DollarSign },
    ]

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.replace("/login")
    }

    return (
        <>
            <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 min-h-screen p-4 flex flex-col transition-all duration-300">
                <div className="mb-8 px-2 flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white mr-3">J</div>
                    <h1 className="text-xl font-bold text-white tracking-widest">Joblify</h1>
                </div>

                <nav className="flex-1 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden ${isActive ? "bg-indigo-500/10 text-indigo-400 font-medium" : "hover:bg-slate-800 hover:text-white"
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-white"}`} />
                                <span>{item.name}</span>
                                {isActive && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full" />
                                )}
                            </Link>
                        )
                    })}

                    {/* Separator */}
                    <div className="my-3 border-t border-slate-800" />

                    {/* Coming Soon Items */}
                    {comingSoonItems.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => setShowComingSoon(true)}
                            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg w-full text-left opacity-50 cursor-not-allowed hover:bg-slate-800/50 transition-all group"
                        >
                            <item.icon className="w-5 h-5 text-slate-500" />
                            <span className="text-slate-500">{item.name}</span>
                            <span className="ml-auto px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 rounded-full flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                Soon
                            </span>
                        </button>
                    ))}
                </nav>

                <div className="mt-auto border-t border-slate-800 pt-4">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <ComingSoonModal
                isOpen={showComingSoon}
                onClose={() => setShowComingSoon(false)}
            />
        </>
    )
}
