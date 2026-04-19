import { supabase } from "@/lib/supabase"

export type ActionType = 'resumes_optimized' | 'cover_letters_generated' | 'interview_questions_generated'

const SPECIAL_EMAIL = "naveenpandey2706@gmail.com"
const DEMO_MAX_CREDITS = 3
const SPECIAL_MAX_CREDITS = 20
const SIGNED_UP_MAX_CREDITS = 10

function getMaxDemoCredits(): number {
    if (typeof window === "undefined") return DEMO_MAX_CREDITS
    const storedEmail = localStorage.getItem("demo_email")
    if (storedEmail?.toLowerCase() === SPECIAL_EMAIL) return SPECIAL_MAX_CREDITS
    return DEMO_MAX_CREDITS
}

export async function checkAndConsumeCredits(
    actionColumn: ActionType,
    activityType: string,
    activityDesc: string
): Promise<{ success: boolean; message?: string; isDemo?: boolean; credits?: number }> {
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
        const userEmail = session.user.email?.toLowerCase() || ""
        const isSpecialUser = userEmail === SPECIAL_EMAIL

        // Special user: always allowed, skip all credit checks
        if (isSpecialUser) {
            // Still log the activity, but never block
            try {
                await supabase.from('user_activity').insert({
                    user_id: session.user.id,
                    activity_type: activityType,
                    activity_description: activityDesc
                })
                // Best-effort: keep their counter high so they never see 0
                await supabase.from('user_usage_stats')
                    .update({ credits_remaining: SPECIAL_MAX_CREDITS })
                    .eq('user_id', session.user.id)
            } catch (_) {
                // Ignore errors — special user is always allowed
            }
            return { success: true, isDemo: false, credits: SPECIAL_MAX_CREDITS }
        }

        // Regular authenticated user
        const { data: stats } = await supabase
            .from('user_usage_stats')
            .select('*')
            .eq('user_id', session.user.id)
            .single()

        if (!stats) return { success: false, message: "Could not find profile stats.", isDemo: false, credits: 0 }

        if (stats.credits_remaining <= 0) {
            return {
                success: false,
                message: "You have used all your free credits. More features and plans are coming soon 🚀",
                isDemo: false,
                credits: 0
            }
        }

        // Consume credit
        const updates: any = {
            credits_remaining: stats.credits_remaining - 1
        }
        updates[actionColumn] = (stats[actionColumn] || 0) + 1

        await supabase.from('user_usage_stats').update(updates).eq('user_id', session.user.id)

        await supabase.from('user_activity').insert({
            user_id: session.user.id,
            activity_type: activityType,
            activity_description: activityDesc
        })

        return { success: true, isDemo: false, credits: stats.credits_remaining - 1 }
    } else {
        // Unauthenticated demo user
        const maxCredits = getMaxDemoCredits()
        const demoUsed = parseInt(localStorage.getItem('demo_credits_used') || '0', 10)

        if (demoUsed >= maxCredits) {
            return {
                success: false,
                message: "You have used all free demo credits. Sign up to continue using NexJob.",
                isDemo: true,
                credits: 0
            }
        }

        localStorage.setItem('demo_credits_used', (demoUsed + 1).toString())
        return { success: true, isDemo: true, credits: maxCredits - demoUsed - 1 }
    }
}

export async function hasEnoughCredits(): Promise<{ hasCredits: boolean; credits: number; isDemo: boolean }> {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
        const userEmail = session.user.email?.toLowerCase() || ""
        const isSpecialUser = userEmail === SPECIAL_EMAIL

        // Special user always has credits — no DB check needed
        if (isSpecialUser) {
            return { hasCredits: true, credits: SPECIAL_MAX_CREDITS, isDemo: false }
        }

        const { data: stats } = await supabase
            .from('user_usage_stats')
            .select('credits_remaining')
            .eq('user_id', session.user.id)
            .single()

        if (stats) {
            return { hasCredits: stats.credits_remaining > 0, credits: stats.credits_remaining, isDemo: false }
        }
        return { hasCredits: false, credits: 0, isDemo: false }
    } else {
        const maxCredits = getMaxDemoCredits()
        const demoUsed = parseInt(localStorage.getItem('demo_credits_used') || '0', 10)
        const rem = Math.max(0, maxCredits - demoUsed)
        return { hasCredits: rem > 0, credits: rem, isDemo: true }
    }
}
