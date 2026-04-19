"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthCallback() {
    const router = useRouter()
    const [status, setStatus] = useState<"loading" | "error">("loading")
    const [errorMsg, setErrorMsg] = useState("")

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // First, check if Supabase auto-detected the session from the URL
                // This handles both PKCE (?code=) and implicit (#access_token=) flows
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                if (session) {
                    // Session already exists — redirect to dashboard
                    router.replace("/dashboard")
                    return
                }

                // If no session yet, try to extract and exchange the code (PKCE flow)
                const params = new URLSearchParams(window.location.search)
                const code = params.get("code")

                if (code) {
                    const { error } = await supabase.auth.exchangeCodeForSession(code)

                    if (error) {
                        console.error("Code exchange failed:", error.message)
                        setErrorMsg(error.message)
                        setStatus("error")
                        setTimeout(() => router.replace("/login?error=auth_failed"), 2000)
                        return
                    }

                    // Exchange succeeded
                    router.replace("/dashboard")
                    return
                }

                // Check for hash fragment (implicit flow fallback)
                const hash = window.location.hash
                if (hash && hash.includes("access_token")) {
                    // Supabase client auto-handles hash fragments on init,
                    // so wait a moment then check session again
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    const { data: { session: retrySession } } = await supabase.auth.getSession()
                    if (retrySession) {
                        router.replace("/dashboard")
                        return
                    }
                }

                // Check for error in URL (Supabase may redirect with error params)
                const errorParam = params.get("error") || params.get("error_description")
                if (errorParam) {
                    console.error("OAuth error from provider:", errorParam)
                    setErrorMsg(errorParam)
                    setStatus("error")
                    setTimeout(() => router.replace("/login?error=auth_failed"), 2000)
                    return
                }

                // Nothing found — no code, no hash, no session
                console.error("No auth code or session found in callback URL")
                setErrorMsg("No authentication data found")
                setStatus("error")
                setTimeout(() => router.replace("/login?error=auth_failed"), 2000)

            } catch (err: any) {
                console.error("Unexpected OAuth callback error:", err)
                setErrorMsg(err?.message || "Unknown error")
                setStatus("error")
                setTimeout(() => router.replace("/login?error=auth_failed"), 2000)
            }
        }

        handleCallback()
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <div className="w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-6">
                {status === "loading" && (
                    <>
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
                            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
                            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">N</span>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-semibold text-white">Signing you in...</p>
                            <p className="text-sm text-slate-400 mt-1">Just a moment while we set up your session</p>
                        </div>
                    </>
                )}

                {status === "error" && (
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <span className="text-red-400 text-2xl">✕</span>
                        </div>
                        <p className="text-lg font-semibold text-red-400">Authentication failed</p>
                        <p className="text-sm text-slate-400">Redirecting you back to login...</p>
                        {errorMsg && (
                            <p className="text-xs text-slate-500 max-w-sm break-words">
                                {errorMsg}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
