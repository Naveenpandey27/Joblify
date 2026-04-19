"use client"
import { useState } from "react"
import { X, CheckCircle, Loader2, Mail } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface WaitlistModalProps {
    isOpen: boolean
    onClose: () => void
    defaultEmail?: string
}

export function WaitlistModal({ isOpen, onClose, defaultEmail }: WaitlistModalProps) {
    const [email, setEmail] = useState(defaultEmail || "")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) return

        setLoading(true)
        setError(null)

        try {
            const { error: dbError } = await supabase
                .from("waitlist_users")
                .upsert(
                    { email: email.trim().toLowerCase() },
                    { onConflict: "email" }
                )

            if (dbError) {
                console.error("Waitlist error:", dbError)
                setError("Something went wrong. Please try again.")
            } else {
                setSuccess(true)
            }
        } catch {
            setError("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setSuccess(false)
        setError(null)
        setEmail(defaultEmail || "")
        onClose()
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                {success ? (
                    <>
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-extrabold text-white mb-3">
                            You&apos;re on the list! 🎉
                        </h3>
                        <p className="text-slate-400 leading-relaxed mb-8">
                            You have been added to the waitlist. We&apos;ll notify you when unlimited access is available.
                        </p>
                        <button
                            onClick={handleClose}
                            className="w-full py-3 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20"
                        >
                            Done
                        </button>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6">
                            <Mail className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-extrabold text-white mb-3">
                            Join the Waitlist
                        </h3>
                        <p className="text-slate-400 leading-relaxed mb-6">
                            Be the first to know when unlimited access launches.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>

                            {error && (
                                <p className="text-red-400 text-sm">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:from-indigo-400 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    "Join Waitlist"
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    )
}
