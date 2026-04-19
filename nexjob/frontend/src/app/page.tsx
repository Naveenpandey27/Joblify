"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
  ArrowRight,
  FileText,
  Briefcase,
  Users,
  Sparkles,
  Copy,
  Download,
  CheckCircle,
  FileUp,
  Loader2,
  X,
  Menu,
  Zap,
  Star,
  Quote,
  ChevronRight,
  Shield,
  BarChart,
} from "lucide-react"

import { ResumeEditor } from "@/components/ResumeEditor"

const DEMO_CREDIT_KEY = "Joblify_demo_credits_used"
const MAX_DEMO_CREDITS = 3

function getCreditsUsed(): number {
  if (typeof window === "undefined") return 0
  return parseInt(localStorage.getItem(DEMO_CREDIT_KEY) || "0", 10)
}

function incrementCredits(): number {
  const next = getCreditsUsed() + 1
  localStorage.setItem(DEMO_CREDIT_KEY, String(next))
  return next
}

export default function Home() {
  const [navOpen, setNavOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [optimizedResume, setOptimizedResume] = useState<string | null>(null)
  const [creditsUsed, setCreditsUsed] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const demoRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setCreditsUsed(getCreditsUsed())
  }, [])

  const creditsLeft = MAX_DEMO_CREDITS - creditsUsed

  const handleOptimize = async () => {
    if (!file || !jobDescription.trim()) return
    if (creditsUsed >= MAX_DEMO_CREDITS) {
      setShowModal(true)
      return
    }

    setLoading(true)
    setOptimizedResume(null)

    try {
      // 1. Upload resume
      const uploadForm = new FormData()
      uploadForm.append("file", file)
      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resume/upload`, {
        method: "POST",
        body: uploadForm,
      })
      if (!uploadRes.ok) throw new Error("Failed to parse resume")
      const { text: resumeText } = await uploadRes.json()

      // 2. Optimize
      const optimizeForm = new URLSearchParams()
      optimizeForm.append("resume_text", resumeText)
      optimizeForm.append("job_description", jobDescription)
      const optimizeRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resume/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: optimizeForm.toString(),
      })
      if (!optimizeRes.ok) throw new Error("Failed to optimize resume")
      const { optimized_resume } = await optimizeRes.json()

      const newCount = incrementCredits()
      setCreditsUsed(newCount)
      setOptimizedResume(optimized_resume)

      // Scroll to result
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
    } catch (err) {
      console.error(err)
      alert("Something went wrong. Make sure the backend is running and try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!optimizedResume) return
    await navigator.clipboard.writeText(optimizedResume)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = async (format: "pdf" | "docx") => {
    if (!optimizedResume) return
    setDownloadingPdf(true)
    try {
      const form = new URLSearchParams()
      form.append("optimized_text", optimizedResume)
      form.append("format", format)
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resume/download`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      })
      if (!res.ok) throw new Error("Download failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `optimized_resume.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert("Download failed. Please try again.")
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-900/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm">
              J
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Joblify</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => demoRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              Try Demo
            </button>
            <Link href="#features" className="text-slate-400 hover:text-white transition-colors text-sm">
              Features
            </Link>
            <Link href="#pricing" className="text-slate-400 hover:text-white transition-colors text-sm">
              Pricing
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-3">
            <Link href="/login" className="text-slate-300 hover:text-white transition-colors text-sm px-3 py-1.5">
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-full bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-500/25"
            >
              Get Started Free
            </Link>
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setNavOpen(!navOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Toggle menu"
          >
            {navOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile drawer */}
        {navOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 py-4 space-y-3">
            <button
              onClick={() => { setNavOpen(false); demoRef.current?.scrollIntoView({ behavior: "smooth" }) }}
              className="block w-full text-left text-slate-300 hover:text-white py-2"
            >
              Try Demo
            </button>
            <Link href="#features" onClick={() => setNavOpen(false)} className="block text-slate-300 hover:text-white py-2">
              Features
            </Link>
            <Link href="#pricing" onClick={() => setNavOpen(false)} className="block text-slate-300 hover:text-white py-2">
              Pricing
            </Link>
            <div className="pt-2 flex flex-col space-y-2">
              <Link href="/login" className="w-full text-center py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:border-slate-500 transition-colors">
                Log In
              </Link>
              <Link href="/signup" className="w-full text-center py-2.5 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-all">
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-24 px-4 sm:px-6">
        {/* Glow blobs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
                <Zap className="w-3.5 h-3.5" />
                AI-Powered Job Application Assistant
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500">
                Land Your Dream Job{" "}
                <span className="text-indigo-400">10x Faster</span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
                Joblify uses AI to tailor your resume to any job description, write personalized cover letters, and prepare you for interviews—all in seconds.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-indigo-950 font-bold text-base hover:bg-slate-100 transition-all shadow-2xl flex items-center justify-center gap-2"
                >
                  Start for Free <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => demoRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="w-full sm:w-auto px-8 py-4 rounded-full border border-slate-700 text-slate-300 font-medium text-base hover:border-indigo-500 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-indigo-400" /> Try Free Demo
                </button>
              </div>

              {/* Social proof */}
              <p className="mt-8 text-slate-500 text-sm">
                ✓ No credit card needed &nbsp;·&nbsp; ✓ 3 free optimizations &nbsp;·&nbsp; ✓ Results in seconds
              </p>
            </div>

            {/* Hero card preview */}
            <div className="flex-1 w-full max-w-md lg:max-w-none hidden sm:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl" />
                <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                    <span className="ml-2 text-slate-500 text-xs">Joblify_resume.pdf</span>
                  </div>
                  <div className="space-y-2">
                    {["✦ Tailored skills to match 98% of job keywords", "✦ Quantified 4 achievements with metrics", "✦ ATS score improved from 62 → 94", "✦ Added 7 missing industry keywords"].map((line, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-300 bg-slate-800/50 rounded-lg px-3 py-2">
                        <span className="text-indigo-400 mt-0.5 text-xs">✓</span> {line}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                    <CheckCircle className="w-4 h-4" /> Resume optimized in 4.2 seconds
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEMO SECTION ──────────────────────────────────── */}
      <section ref={demoRef} id="demo" className="py-16 sm:py-24 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3 h-3" /> Free Demo — No Sign-Up Required
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
              Try Joblify Instantly
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Upload your resume to open the interactive AI-assisted editor.
            </p>
            {/* Credit indicator */}
            <div className="mt-4 inline-flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-4 py-2">
              {Array.from({ length: MAX_DEMO_CREDITS }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${i < creditsUsed ? "bg-slate-600" : "bg-indigo-500"
                    }`}
                />
              ))}
              <span className="text-slate-400 text-sm ml-1">
                {creditsLeft > 0 ? `${creditsLeft} free credit${creditsLeft !== 1 ? "s" : ""} remaining` : "No free credits left"}
              </span>
            </div>
          </div>

          {!optimizedResume ? (
            <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center justify-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">1</span>
                Upload Your Resume
              </h3>
              <label
                htmlFor="demo-resume-upload"
                className="border-2 border-dashed border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-indigo-500 hover:bg-slate-800/40 transition-colors cursor-pointer group min-h-[200px]"
              >
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    if (creditsLeft <= 0) {
                      setShowModal(true)
                      return
                    }
                    setFile(f)
                    setLoading(true)
                    try {
                      const uploadForm = new FormData()
                      uploadForm.append("file", f)
                      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resume/upload`, {
                        method: "POST",
                        body: uploadForm,
                      })
                      if (!uploadRes.ok) throw new Error("Failed to parse resume")
                      const { text: resumeText } = await uploadRes.json()
                      setOptimizedResume(resumeText) // we use optimizedResume to hold the parsed text
                      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
                    } catch (err) {
                      alert("Upload failed.")
                    } finally {
                      setLoading(false)
                    }
                  }}
                  className="hidden"
                  id="demo-resume-upload"
                />
                {loading ? (
                  <>
                    <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-3" />
                    <p className="font-medium text-slate-200">Processing file...</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                      <FileUp className="w-8 h-8 text-indigo-400" />
                    </div>
                    <p className="font-medium text-slate-200 text-lg">Click to upload PDF or DOCX</p>
                    <p className="text-sm text-slate-500 mt-2">Max 5MB</p>
                  </>
                )}
              </label>
            </div>
          ) : (
            <div ref={resultRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-6">
                <div className="text-sm font-medium text-slate-400">
                  Now analyzing: <strong className="text-slate-200">{file?.name}</strong>
                </div>
                <button onClick={() => setOptimizedResume(null)} className="text-sm text-indigo-400 hover:text-indigo-300">
                  Upload different file
                </button>
              </div>

              {/* Mount Resume Editor */}
              <ResumeEditor
                initialText={optimizedResume}
                onGenerate={() => {
                  if (creditsUsed >= MAX_DEMO_CREDITS) {
                    setShowModal(true)
                    return false
                  }
                  setCreditsUsed(incrementCredits())
                  return true
                }}
              />

              {/* Signup upsell below result */}
              <div className="max-w-3xl mx-auto mt-10 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-white font-semibold text-sm">Want to save your changes and track applications?</p>
                  <p className="text-slate-400 text-xs mt-0.5">Sign up free — includes 10 credits, cover letters & interview prep.</p>
                </div>
                <Link href="/signup" className="shrink-0 px-5 py-2.5 rounded-full bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-400 transition-all flex items-center gap-1.5">
                  Create Free Account <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              Everything You Need to{" "}
              <span className="text-indigo-400">Land the Job</span>
            </h2>
            <p className="mt-4 text-slate-400 text-lg max-w-2xl mx-auto">
              Joblify is your all-in-one AI assistant for every step of the job search process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <FileText className="w-8 h-8 text-indigo-400" />,
                color: "from-indigo-500/5",
                title: "ATS-Optimized Resumes",
                desc: "Upload your resume and instantly tailor it to any job description. Beat applicant tracking systems with AI-matched keywords and bullet points.",
              },
              {
                icon: <Users className="w-8 h-8 text-purple-400" />,
                color: "from-purple-500/5",
                title: "AI Cover Letters",
                desc: "Generate personalized, compelling cover letters in seconds. Our AI crafts each letter to speak directly to the hiring manager's needs.",
              },
              {
                icon: <Sparkles className="w-8 h-8 text-pink-400" />,
                color: "from-pink-500/5",
                title: "AI Interview Prep",
                desc: "Anticipate every question. Get behavioral, technical, and role-specific interview questions generated from the exact job description.",
              },
              {
                icon: <Briefcase className="w-8 h-8 text-emerald-400" />,
                color: "from-emerald-500/5",
                title: "Job Application Tracker",
                desc: "Manage your entire pipeline. Track applications from submission to offer in a beautiful Kanban-style dashboard.",
              },
              {
                icon: <BarChart className="w-8 h-8 text-yellow-400" />,
                color: "from-yellow-500/5",
                title: "ATS Score Analysis",
                desc: "See your compatibility score before you apply. Understand exactly which keywords are missing and how to fix them.",
              },
              {
                icon: <Shield className="w-8 h-8 text-cyan-400" />,
                color: "from-cyan-500/5",
                title: "Private & Secure",
                desc: "Your resume data is encrypted and never shared. We process your documents securely and don't store them without permission.",
              },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-colors">
                <div className={`absolute inset-0 bg-gradient-to-b ${f.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative">
                  <div className="mb-5">{f.icon}</div>
                  <h3 className="text-lg font-bold mb-2 text-white">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────── */}
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Zap className="w-3 h-3" /> Coming Soon
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Pricing is on its way 🚀
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10">
            We&apos;re finalizing our plans to give you the best value. Simple, transparent pricing — no surprises. Stay tuned!
          </p>

          {/* Coming Soon card */}
          <div className="relative rounded-3xl border border-purple-500/30 bg-slate-900 p-10 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              {/* Animated glow icon */}
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl scale-150 animate-pulse" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center mx-auto">
                  <Zap className="w-10 h-10 text-purple-400" />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">Be the first to know</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Pricing plans are coming soon. Sign up now to get <span className="text-indigo-400 font-semibold">early access</span> and exclusive early-bird discounts when we launch.
              </p>

              {/* Plan preview pills */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {["Free Plan", "Pro Plan", "Team Plan"].map((plan) => (
                  <div key={plan} className="px-4 py-2 rounded-full border border-slate-700 bg-slate-800/50 text-slate-400 text-sm font-medium flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    {plan}
                  </div>
                ))}
              </div>

              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-indigo-500 text-white font-semibold hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/25"
              >
                <Sparkles className="w-4 h-4" /> Get Early Access Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────── */}
      <section id="testimonials" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Loved by Job Seekers
            </h2>
            <p className="mt-4 text-slate-400 text-lg">Real results from real people.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah K.",
                role: "Software Engineer",
                company: "Hired at Google",
                quote: "I applied to 20 jobs with Joblify's optimized resumes and got 12 callbacks. The ATS matching is genuinely incredible. I landed my dream job in 3 weeks.",
                stars: 5,
              },
              {
                name: "Marcus T.",
                role: "Product Manager",
                company: "Hired at Stripe",
                quote: "The interview prep feature is a game-changer. It generated questions I was asked almost verbatim. The cover letter generator saved me hours every day.",
                stars: 5,
              },
              {
                name: "Priya M.",
                role: "Data Analyst",
                company: "Hired at Airbnb",
                quote: "I went from 0 callbacks to 6 interviews in one week just by using Joblify's resume optimizer. The job tracker kept me organized through the whole process.",
                stars: 5,
              },
            ].map((t, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-4">
                <Quote className="w-8 h-8 text-indigo-400/50" />
                <p className="text-slate-300 text-sm leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-slate-500 text-xs">{t.role} · {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
            <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-10 sm:p-14 shadow-2xl">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Ready to Land Your Dream Job?
              </h2>
              <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto">
                Join thousands of job seekers using Joblify to get more interviews and better offers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup" className="px-8 py-4 rounded-full bg-indigo-500 text-white font-bold text-base hover:bg-indigo-400 transition-all shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2">
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => demoRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="px-8 py-4 rounded-full border border-slate-700 text-slate-300 font-medium text-base hover:border-indigo-500 hover:text-white transition-all"
                >
                  Try Demo First
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="border-t border-slate-900 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">J</div>
            <span className="text-slate-300 font-bold">Joblify</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 Joblify AI. All rights reserved.</p>
          <div className="flex items-center gap-6 text-slate-500 text-sm">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-slate-300 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

      {/* ── CREDITS EXHAUSTED MODAL ───────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>

            <h3 className="text-2xl font-extrabold text-white mb-3">
              Free Credits Used Up
            </h3>
            <p className="text-slate-400 mb-2 leading-relaxed">
              You&apos;ve used all <strong className="text-white">3 free demo credits</strong>.
            </p>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Create a free account to get <strong className="text-indigo-400">10 free credits</strong> — plus cover letters, interview prep, and job tracking.
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
                className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:border-slate-500 hover:text-white transition-colors flex items-center justify-center"
              >
                Log In
              </Link>
            </div>

            <p className="text-slate-600 text-xs mt-4">No credit card required to sign up.</p>
          </div>
        </div>
      )}
    </div>
  )
}
