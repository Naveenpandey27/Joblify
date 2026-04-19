"use client"
import { useState, useEffect, use } from "react"
import Link from "next/link"
import {
    ArrowLeft, MapPin, Building2, Briefcase, ExternalLink,
    FileUp, CheckCircle, Loader2, Sparkles, Target, AlertCircle,
    Copy, Check, ChevronRight, TrendingUp, Search, X, FileEdit
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Job {
    id: string
    title: string
    company: string
    location: string
    work_type: string
    description: string
    url: string
}

interface MatchResult {
    match_score: number
    skills_match: number
    experience_match: number
    keyword_match: number
    missing_keywords: string[]
    matching_skills: string[]
    suggestions: string[]
}

const WORK_TYPE_STYLES: Record<string, string> = {
    Remote: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    Hybrid: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    "On-site": "bg-blue-500/15 text-blue-400 border-blue-500/30",
}

// ─── Circular Score Ring ──────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
    const radius = 52
    const stroke = 7
    const normalizedRadius = radius - stroke * 2
    const circumference = normalizedRadius * 2 * Math.PI
    const strokeDashoffset = circumference - (score / 100) * circumference

    const color =
        score >= 75 ? "#22c55e" :
            score >= 50 ? "#f59e0b" :
                "#ef4444"

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg height={radius * 2} width={radius * 2} className="-rotate-90">
                <circle
                    stroke="#1e293b"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <circle
                    stroke={color}
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={`${circumference} ${circumference}`}
                    style={{
                        strokeDashoffset,
                        transition: "stroke-dashoffset 1s ease-in-out",
                        filter: `drop-shadow(0 0 6px ${color}88)`,
                    }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-white leading-none">{score}</span>
                <span className="text-xs text-slate-400 font-medium">/ 100</span>
            </div>
        </div>
    )
}

// ─── Metric Bar ───────────────────────────────────────────────────────────────
function MetricBar({ label, value }: { label: string; value: number }) {
    const color =
        value >= 75 ? "bg-emerald-500" :
            value >= 50 ? "bg-amber-500" :
                "bg-red-500"

    return (
        <div>
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm text-slate-300">{label}</span>
                <span className="text-sm font-bold text-slate-200">{value}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} rounded-full transition-all duration-1000`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function JobDetailPage({ params }: { params: Promise<{ job_id: string }> }) {
    const { job_id } = use(params)

    const [job, setJob] = useState<Job | null>(null)
    const [jobLoading, setJobLoading] = useState(true)
    const [jobError, setJobError] = useState<string | null>(null)

    // Resume match state
    const [resumeFile, setResumeFile] = useState<File | null>(null)
    const [resumeUploading, setResumeUploading] = useState(false)
    const [matchLoading, setMatchLoading] = useState(false)
    const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
    const [matchError, setMatchError] = useState<string | null>(null)

    // Cover letter state
    const [clLoading, setClLoading] = useState(false)
    const [coverLetter, setCoverLetter] = useState<string | null>(null)
    const [clError, setClError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    // ── Fetch job on mount ──────────────────────────────────────
    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/job-listings/${job_id}`)
                if (!res.ok) throw new Error("Job not found or cache expired.")
                setJob(await res.json())
            } catch (err: any) {
                setJobError(err.message || "Failed to load job")
            } finally {
                setJobLoading(false)
            }
        }
        fetchJob()
    }, [job_id])

    // ── Resume upload preview ───────────────────────────────────
    const handleFileSelect = (file: File) => {
        if (!["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
            setMatchError("Please upload a PDF or DOCX file.")
            return
        }
        setResumeFile(file)
        setMatchError(null)
        setMatchResult(null)
        setCoverLetter(null)
    }

    // ── Analyze Match ───────────────────────────────────────────
    const handleAnalyzeMatch = async () => {
        if (!resumeFile || !job) return
        setMatchLoading(true)
        setMatchError(null)
        setMatchResult(null)

        try {
            const formData = new FormData()
            formData.append("file", resumeFile)
            formData.append("job_description", job.description || `${job.title} at ${job.company}`)

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/job-listings/match-resume`, {
                method: "POST",
                body: formData,
            })
            if (!res.ok) throw new Error(`Match analysis failed (${res.status})`)
            const data: MatchResult = await res.json()
            setMatchResult(data)
        } catch (err: any) {
            setMatchError(err.message || "Failed to analyze match")
        } finally {
            setMatchLoading(false)
        }
    }

    // ── Generate Cover Letter ───────────────────────────────────
    const handleGenerateCoverLetter = async () => {
        if (!resumeFile || !job) return
        setClLoading(true)
        setClError(null)
        setCoverLetter(null)

        try {
            const formData = new FormData()
            formData.append("file", resumeFile)
            formData.append("job_description", `${job.title} at ${job.company}. ${job.description}`)

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/job-listings/cover-letter`, {
                method: "POST",
                body: formData,
            })
            if (!res.ok) throw new Error(`Cover letter generation failed (${res.status})`)
            const data = await res.json()
            setCoverLetter(data.cover_letter)
        } catch (err: any) {
            setClError(err.message || "Failed to generate cover letter")
        } finally {
            setClLoading(false)
        }
    }

    const handleCopy = () => {
        if (coverLetter) {
            navigator.clipboard.writeText(coverLetter)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    // ── Loading ─────────────────────────────────────────────────
    if (jobLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6 animate-pulse pb-12">
                <div className="h-8 w-32 bg-slate-800 rounded-lg" />
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                    <div className="h-8 bg-slate-800 rounded w-3/4 mb-3" />
                    <div className="h-5 bg-slate-800 rounded w-1/3 mb-6" />
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-slate-800 rounded-xl" />)}
                    </div>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => <div key={i} className="h-4 bg-slate-800 rounded" />)}
                    </div>
                </div>
            </div>
        )
    }

    // ── Error ───────────────────────────────────────────────────
    if (jobError || !job) {
        return (
            <div className="max-w-4xl mx-auto pb-12">
                <Link href="/dashboard/jobs" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to Jobs
                </Link>
                <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-slate-200 mb-2">Job not found</h2>
                    <p className="text-slate-400 mb-6">{jobError || "This job may have been refreshed from our cache."}</p>
                    <Link href="/dashboard/jobs" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors">
                        <Search className="w-4 h-4" /> Search Again
                    </Link>
                </div>
            </div>
        )
    }

    const badgeClass = WORK_TYPE_STYLES[job.work_type] ?? "bg-slate-700/50 text-slate-300 border-slate-600"

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-16">
            {/* ── Back Nav ── */}
            <Link href="/dashboard/jobs" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Jobs
            </Link>

            {/* ── Job Header Card ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-black text-2xl shadow-lg shrink-0">
                            {job.company.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-100 mb-1">{job.title}</h1>
                            <div className="flex flex-wrap items-center gap-3 text-slate-400 text-sm">
                                <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{job.company}</span>
                                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                            </div>
                        </div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border shrink-0 ${badgeClass}`}>
                        {job.work_type}
                    </span>
                </div>

                {/* Apply Button */}
                <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    id="apply-now-btn"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all"
                >
                    Apply Now <ExternalLink className="w-4 h-4" />
                </a>
            </div>

            {/* ── Full Description ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                <h2 className="text-xl font-bold text-slate-100 mb-5 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-400" /> Job Description
                </h2>
                <div className="text-slate-300 leading-relaxed whitespace-pre-line text-[15px]">
                    {job.description || "Visit the job listing for full details."}
                </div>
            </div>

            {/* ── Resume Match Section ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                <h2 className="text-xl font-bold text-slate-100 mb-2 flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-400" /> Match Your Resume
                </h2>
                <p className="text-slate-400 text-sm mb-6">Upload your resume to see how well it matches this job.</p>

                {/* File Upload Zone */}
                <div
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative group overflow-hidden ${resumeFile
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : "border-slate-700 hover:border-indigo-500 hover:bg-slate-800/50"
                        }`}
                >
                    <input
                        id="resume-upload-input"
                        type="file"
                        accept=".pdf,.docx"
                        onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]) }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        title="Upload resume"
                    />
                    {resumeFile ? (
                        <>
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3 text-emerald-400">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <p className="font-semibold text-emerald-400">{resumeFile.name}</p>
                            <p className="text-slate-500 text-sm mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click to change file</p>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-3 group-hover:bg-indigo-500/20 transition-colors">
                                <FileUp className="w-6 h-6 text-indigo-400" />
                            </div>
                            <p className="font-semibold text-slate-200">Upload PDF or DOCX</p>
                            <p className="text-slate-500 text-sm mt-1">Max 5MB</p>
                        </>
                    )}
                </div>

                {matchError && (
                    <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {matchError}
                    </div>
                )}

                {/* Analyze Button */}
                <button
                    id="analyze-match-btn"
                    onClick={handleAnalyzeMatch}
                    disabled={!resumeFile || matchLoading}
                    className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all flex items-center justify-center gap-2"
                >
                    {matchLoading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing…</>
                    ) : (
                        <><TrendingUp className="w-5 h-5" /> Analyze Match</>
                    )}
                </button>

                {/* ── Match Results ── */}
                {matchResult && (
                    <div className="mt-8 space-y-6">
                        {/* Score Banner */}
                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <ScoreRing score={matchResult.match_score} />
                                <div className="flex-1 w-full space-y-4">
                                    <h3 className="text-lg font-bold text-slate-100 text-center sm:text-left">
                                        {matchResult.match_score >= 75 ? "Strong Match 🎉" :
                                            matchResult.match_score >= 50 ? "Good Match 👍" : "Needs Improvement ⚡"}
                                    </h3>
                                    <MetricBar label="Skills Match" value={matchResult.skills_match} />
                                    <MetricBar label="Experience Match" value={matchResult.experience_match} />
                                    <MetricBar label="Keyword Match" value={matchResult.keyword_match} />
                                </div>
                            </div>
                        </div>

                        {/* Matching Skills */}
                        {matchResult.matching_skills?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-400" /> Matching Skills
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {matchResult.matching_skills.map((skill) => (
                                        <span key={skill} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-full font-medium">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Missing Keywords */}
                        {matchResult.missing_keywords?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                    <X className="w-4 h-4 text-red-400" /> Missing Keywords
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {matchResult.missing_keywords.map((kw) => (
                                        <span key={kw} className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-full font-medium">
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* AI Suggestions */}
                        {matchResult.suggestions?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-indigo-400" /> AI Suggestions
                                </h4>
                                <ul className="space-y-2">
                                    {matchResult.suggestions.map((s, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                                            <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Cover Letter Section ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                <h2 className="text-xl font-bold text-slate-100 mb-2 flex items-center gap-2">
                    <FileEdit className="w-5 h-5 text-purple-400" /> Generate Cover Letter
                </h2>
                <p className="text-slate-400 text-sm mb-5">
                    {resumeFile
                        ? `Using "${resumeFile.name}" — click below to generate.`
                        : "Upload your resume in the section above first."}
                </p>

                <button
                    id="generate-cover-letter-btn"
                    onClick={handleGenerateCoverLetter}
                    disabled={!resumeFile || clLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all flex items-center justify-center gap-2"
                >
                    {clLoading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Generating…</>
                    ) : (
                        <><Sparkles className="w-5 h-5" /> Generate Cover Letter</>
                    )}
                </button>

                {clError && (
                    <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {clError}
                    </div>
                )}

                {/* Cover Letter Output */}
                {coverLetter && (
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="flex items-center gap-2 text-emerald-400 font-semibold">
                                <CheckCircle className="w-5 h-5" /> Cover Letter Ready
                            </span>
                            <button
                                id="copy-cover-letter-btn"
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-sm font-medium border border-slate-700/50"
                            >
                                {copied
                                    ? <><Check className="w-4 h-4 text-emerald-400" /> Copied!</>
                                    : <><Copy className="w-4 h-4" /> Copy</>}
                            </button>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-slate-300 whitespace-pre-wrap leading-relaxed text-[15px] max-h-[500px] overflow-y-auto custom-scrollbar">
                            {coverLetter}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
