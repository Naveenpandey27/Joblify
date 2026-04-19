"use client"
import { X, Rocket } from "lucide-react"

interface ComingSoonModalProps {
    isOpen: boolean
    onClose: () => void
}

export function ComingSoonModal({ isOpen, onClose }: ComingSoonModalProps) {
    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6">
                    <Rocket className="w-10 h-10 text-indigo-400" />
                </div>

                <h3 className="text-2xl font-extrabold text-white mb-3">
                    Coming Soon 🚀
                </h3>
                <p className="text-slate-400 leading-relaxed">
                    This feature is coming soon! We&apos;re working hard to bring it to you.
                </p>

                <button
                    onClick={onClose}
                    className="mt-8 w-full py-3 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20"
                >
                    Got it
                </button>
            </div>
        </div>
    )
}
