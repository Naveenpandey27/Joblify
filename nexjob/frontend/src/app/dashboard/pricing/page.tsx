"use client"
import Link from "next/link"
import { Rocket, ArrowLeft } from "lucide-react"

export default function PricingComingSoon() {
    return (
        <div className="flex-1 flex items-center justify-center min-h-[70vh]">
            <div className="text-center max-w-md mx-auto px-4">
                {/* Animated glow */}
                <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl scale-150 animate-pulse" />
                    <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center mx-auto">
                        <Rocket className="w-12 h-12 text-purple-400" />
                    </div>
                </div>

                <h1 className="text-4xl font-extrabold text-white mb-4">
                    Coming Soon 🚀
                </h1>
                <p className="text-slate-400 text-lg leading-relaxed mb-8">
                    We are working on this feature. Stay tuned!
                </p>

                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-medium hover:bg-slate-700 hover:text-white transition-all"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
            </div>
        </div>
    )
}
