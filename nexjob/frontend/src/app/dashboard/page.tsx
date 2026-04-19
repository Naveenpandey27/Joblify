"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, FileText, FileEdit, HelpCircle, Search, DollarSign, Activity, CheckCircle2, Clock, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ComingSoonModal } from "@/components/ComingSoonModal"

export default function DashboardHome() {
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState("User")
    const [showComingSoon, setShowComingSoon] = useState(false)
    const router = useRouter()
    
    const [stats, setStats] = useState([
        { label: "Resumes Optimized", value: "0" },
        { label: "Cover Letters Generated", value: "0" },
        { label: "Interview Questions Generated", value: "0" },
        { label: "Credits Remaining", value: "0" },
    ])
    const [recentActivity, setRecentActivity] = useState<{id: string, action: string, time: string}[]>([])

    useEffect(() => {
        let cancelled = false

        const loadDashboard = async () => {
            // Check for an active session
            const { data: { session } } = await supabase.auth.getSession()
            
            if (!session) {
                // No session — redirect to login
                if (!cancelled) router.replace("/login")
                return
            }

            if (cancelled) return

            const userId = session.user.id

            // Set user name from session metadata first (instant)
            const fullName = session.user.user_metadata?.full_name
                || session.user.user_metadata?.name
                || session.user.email?.split('@')[0]
                || "User"
            setUserName(fullName)

            // Fetch profile from DB (may have more info)
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', userId)
                .single()

            if (!cancelled && profile?.full_name) {
                setUserName(profile.full_name)
            }

            // Fetch limits/usage
            const { data: usage } = await supabase
                .from('user_usage_stats')
                .select('*')
                .eq('user_id', userId)
                .single()

            if (!cancelled && usage) {
                setStats([
                    { label: "Resumes Optimized", value: usage.resumes_optimized?.toString() || "0" },
                    { label: "Cover Letters Generated", value: usage.cover_letters_generated?.toString() || "0" },
                    { label: "Interview Questions Generated", value: usage.interview_questions_generated?.toString() || "0" },
                    { label: "Credits Remaining", value: usage.credits_remaining?.toString() || "0" },
                ])
            }

            // Fetch recent activity
            const { data: activity } = await supabase
                .from('user_activity')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5)

            if (!cancelled && activity) {
                const formattedActivity = activity.map((item: any) => {
                    const date = new Date(item.created_at)
                    return {
                        id: item.id,
                        action: item.activity_description,
                        time: date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                })
                setRecentActivity(formattedActivity)
            }

            if (!cancelled) setLoading(false)
        }

        loadDashboard()

        return () => { cancelled = true }
    }, [router])

    const quickActions = [
        {
            title: "Resume Optimizer",
            description: "Tailor your resume for a specific job.",
            icon: FileText,
            href: "/dashboard/resume-optimizer",
            color: "from-blue-500 to-indigo-600",
            comingSoon: false,
        },
        {
            title: "Cover Letter Generator",
            description: "Generate a personalized cover letter.",
            icon: FileEdit,
            href: "/dashboard/cover-letter",
            color: "from-purple-500 to-pink-600",
            comingSoon: false,
        },
        {
            title: "Interview Prep",
            description: "Generate potential questions & answers.",
            icon: HelpCircle,
            href: "/dashboard/interview-prep",
            color: "from-amber-500 to-orange-600",
            comingSoon: false,
        },
        {
            title: "Jobs",
            description: "Search and discover job opportunities.",
            icon: Search,
            href: "#",
            color: "from-slate-600 to-slate-700",
            comingSoon: true,
        },
        {
            title: "Pricing",
            description: "View plans and upgrade your account.",
            icon: DollarSign,
            href: "#",
            color: "from-slate-600 to-slate-700",
            comingSoon: true,
        }
    ]

    const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>, comingSoon: boolean) => {
        if (comingSoon) {
            e.preventDefault()
            setShowComingSoon(true)
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-12">
            {/* 1. Welcome Header */}
            <header className="border-b border-slate-800 pb-6">
                <h1 className="text-4xl font-bold text-white tracking-tight">Welcome back, {userName}</h1>
                <p className="text-xl text-slate-400 mt-2">Let&apos;s prepare your next job application.</p>
            </header>

            {/* 2. Usage Statistics Section */}
            <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-indigo-500" />
                    Usage Statistics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {loading ? (
                        <div className="col-span-1 md:col-span-2 lg:col-span-4 flex justify-center py-6">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        </div>
                    ) : (
                        stats.map((stat, idx) => (
                            <div key={idx} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-center">
                                <p className="text-sm font-medium text-slate-400 mb-1">{stat.label}</p>
                                <p className="text-3xl font-bold text-slate-100">{stat.value}</p>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* 3 & 4. Quick Actions Section (includes Coming Soon cards) */}
            <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {quickActions.map((action) => (
                        <Link 
                            key={action.title} 
                            href={action.href} 
                            onClick={(e) => handleCardClick(e, action.comingSoon)}
                            className={`block group ${action.comingSoon ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden relative transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
                                {!action.comingSoon && (
                                    <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-4 rounded-xl bg-gradient-to-br ${action.color} shadow-lg relative`}>
                                        <action.icon className="w-8 h-8 text-white" />
                                    </div>
                                    
                                    {action.comingSoon ? (
                                        <span className="px-3 py-1 text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full">
                                            Coming Soon
                                        </span>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                                            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-2xl font-bold text-slate-100 mb-2">{action.title}</h3>
                                <p className="text-slate-400">{action.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* 5. Recent Activity Section */}
            <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-amber-500" />
                    Recent Activity
                </h2>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                    {loading ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                        </div>
                    ) : recentActivity.length > 0 ? (
                        <ul className="space-y-4">
                            {recentActivity.map((activity, index) => (
                                <li key={activity.id} className={`flex items-start justify-between ${index !== recentActivity.length - 1 ? 'border-b border-slate-800 pb-4' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                                        <p className="text-slate-300">{activity.action}</p>
                                    </div>
                                    <span className="text-sm text-slate-500 whitespace-nowrap ml-4">{activity.time}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-slate-400 text-center py-4">No recent activity yet.</p>
                    )}
                </div>
            </section>

            <ComingSoonModal
                isOpen={showComingSoon}
                onClose={() => setShowComingSoon(false)}
            />
        </div>
    )
}

