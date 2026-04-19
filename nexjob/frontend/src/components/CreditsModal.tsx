"use client"
import { X, Sparkles, LogIn } from "lucide-react"
import Link from "next/link"

interface CreditsModalProps {
    isOpen: boolean
    onClose: () => void
    isDemo: boolean
    onJoinWaitlist?: () => void
}

export function CreditsModal({ isOpen, onClose, isDemo, onJoinWaitlist }: CreditsModalProps) {
    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-8 h-8 text-indigo-400" />
                </div>

                {isDemo ? (
                    <>
                        <h3 className="text-2xl font-extrabold text-white mb-3">
                            Free Credits Used Up
                        </h3>
                        <p className="text-slate-400 mb-2 leading-relaxed">
                            You have used all <strong className="text-white">free demo credits</strong>.
                        </p>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            Sign up to continue using NexJob and get <strong className="text-indigo-400">10 free credits</strong>.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                href="/signup"
                                className="flex-1 py-3 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" /> Sign Up Free
                            </Link>
                            <Link
                                href="/login"
                                className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:border-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2"
                            >
                                <LogIn className="w-4 h-4" /> Log In
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <h3 className="text-2xl font-extrabold text-white mb-3">
                            Credits Exhausted
                        </h3>
                        <p className="text-slate-400 mb-2 leading-relaxed">
                            You have used all your <strong className="text-white">free credits</strong>.
                        </p>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            More features and plans are coming soon 🚀
                        </p>

                        <button
                            onClick={() => { onClose(); onJoinWaitlist?.() }}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:from-indigo-400 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" /> Join waitlist for unlimited access
                        </button>
                    </>
                )}

                <p className="text-slate-600 text-xs mt-4">No credit card required.</p>
            </div>
        </div>
    )
}
