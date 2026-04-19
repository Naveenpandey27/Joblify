"use client"

import React, { useState } from "react"
import { Sparkles, Copy, CheckCircle, AlertCircle, Check, Loader2, Target, BarChart, ArrowRight } from "lucide-react"

interface Suggestion {
    original: string
    suggested: string
}

interface AISuggestionsResponse {
    ats_score_before: number
    ats_score_after: number
    formatting_score: number
    content_strength_score: number
    missing_keywords: string[]
    matching_skills: string[]
    suggestions: Suggestion[]
}

interface ResumeEditorProps {
    initialText: string
    onGenerate?: () => boolean | Promise<boolean>
}

export function ResumeEditor({ initialText, onGenerate }: ResumeEditorProps) {
    const [jobDescription, setJobDescription] = useState("")
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<AISuggestionsResponse | null>(null)
    const [copiedState, setCopiedState] = useState<number | null>(null)

    const generateSuggestions = async () => {
        if (!initialText || !jobDescription) return

        if (onGenerate) {
            const canProceed = await onGenerate()
            if (!canProceed) return
        }

        setLoading(true)

        try {
            const formData = new URLSearchParams()
            formData.append("resume_text", initialText)
            formData.append("job_description", jobDescription)

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resume/suggestions`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData.toString()
            })

            if (!response.ok) throw new Error("Failed to generate suggestions")
            const data: AISuggestionsResponse = await response.json()
            setResults(data)
        } catch (e) {
            console.error(e)
            alert("Error generating suggestions. Please ensure the backend is running.")
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text)
        setCopiedState(index)
        setTimeout(() => setCopiedState(null), 2000)
    }

    const copyAll = () => {
        if (!results) return
        const allText = results.suggestions.map(s => `🔴 Original:\n${s.original}\n\n🟢 Suggested:\n${s.suggested}`).join('\n\n---\n\n')
        navigator.clipboard.writeText(allText)
        alert("Copied all suggestions to clipboard!")
    }

    const ScoreCircle = ({ label, score, colorClass }: { label: string, score: number, colorClass: string }) => (
        <div className="flex flex-col items-center justify-center p-6 bg-slate-950/50 rounded-2xl border border-slate-800/50 w-full hover:border-slate-700/50 transition-colors duration-300">
            <div className={`text-4xl lg:text-5xl font-black ${colorClass} tracking-tighter mb-2`}>{score}</div>
            <div className="text-xs uppercase tracking-widest text-slate-500 font-bold text-center mt-1">{label}</div>
        </div>
    )

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500">
            {/* Context Notice */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 flex items-start gap-4">
                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 mt-0.5">
                    <Target className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-indigo-300 font-bold mb-1">Resume Pre-Screening Mode</h3>
                    <p className="text-sm text-indigo-200/70 leading-relaxed">
                        Paste your target job description below to receive targeted advice on keywords, bullet points, and ATS scoring. You can copy the improved bullet points into your original file.
                    </p>
                </div>
            </div>

            {/* Input Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 group-hover:h-1.5 transition-all"></div>

                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                    Target Job Description
                </h2>
                <p className="text-slate-400 text-sm mb-6 max-w-2xl">
                    For the best insights, paste the exact job description of the role you are applying for. The AI will cross-reference your uploaded resume against these strict requirements.
                </p>

                <div className="relative">
                    <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="e.g. We are looking for a Senior Software Engineer with 5+ years of experience in React and Node.js..."
                        className="w-full h-48 bg-slate-950/50 border border-slate-800 rounded-2xl p-5 text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none resize-none mb-6 text-[15px] shadow-inner font-sans leading-relaxed placeholder:text-slate-600"
                    />
                </div>

                <button
                    onClick={generateSuggestions}
                    disabled={loading || !jobDescription}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center disabled:opacity-50 disabled:grayscale-[0.5] disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
                >
                    {loading ? <><Loader2 className="w-6 h-6 animate-spin mr-3" /> Analyzing Qualifications...</> : <><BarChart className="w-6 h-6 mr-3" /> Run ATS Analysis & Suggestions</>}
                </button>
            </div>

            {/* Results Panel */}
            <div className={`bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[400px] transition-all duration-700 ease-out ${results ? 'opacity-100 translate-y-0' : loading ? 'opacity-50' : 'opacity-100'}`}>
                <div className="px-8 py-5 border-b border-slate-800/80 flex justify-between items-center bg-slate-950/30 backdrop-blur-md sticky top-0 z-10">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                        AI Analysis Results
                    </h3>
                    {results && (
                        <button onClick={copyAll} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-2">
                            <Copy className="w-3 h-3" /> Copy All
                        </button>
                    )}
                </div>

                <div className="flex-1 p-6 md:p-8">
                    {!results && !loading && (
                        <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-500 text-center px-6">
                            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                                <Sparkles className="w-10 h-10 text-slate-600" />
                            </div>
                            <h4 className="text-xl font-medium text-slate-400 mb-2">Awaiting Job Description</h4>
                            <p className="text-base max-w-md text-slate-500/80">Analysis will appear here once you provide a targeted job spec.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-indigo-400 py-20">
                            <div className="relative w-24 h-24 flex items-center justify-center mb-8">
                                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                                <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2">Scanning Keywords...</h4>
                            <p className="text-slate-400">Evaluating your bullet points against ATS algorithms</p>
                        </div>
                    )}

                    {results && !loading && (
                        <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">

                            {/* Score Dashboard */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-400 mb-5 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-slate-500"></div> Overall Match Scores
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <ScoreCircle label="Before" score={results.ats_score_before} colorClass="text-slate-400" />
                                    <div className="hidden md:flex items-center justify-center col-span-2 md:col-span-1 absolute -left-[9999px]">
                                        <ArrowRight className="text-slate-700 w-8 h-8" />
                                    </div>
                                    <ScoreCircle label="After Estimate" score={results.ats_score_after} colorClass="text-emerald-400" />
                                    <ScoreCircle label="Format" score={results.formatting_score} colorClass="text-blue-400" />
                                    <ScoreCircle label="Content" score={results.content_strength_score} colorClass="text-purple-400" />
                                </div>
                            </div>

                            {/* Keywords Grid */}
                            {(results.missing_keywords?.length > 0 || results.matching_skills?.length > 0) && (
                                <div className="space-y-5">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Keyword Optimization
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        {results.matching_skills?.length > 0 && (
                                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6">
                                                <div className="text-sm uppercase tracking-wider font-bold text-emerald-400 mb-4 flex items-center gap-2">
                                                    <CheckCircle className="w-5 h-5" /> Matching Skills
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {results.matching_skills.map(kw => <span key={kw} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-lg text-xs font-semibold shadow-sm">{kw}</span>)}
                                                </div>
                                            </div>
                                        )}

                                        {results.missing_keywords?.length > 0 && (
                                            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6">
                                                <div className="text-sm uppercase tracking-wider font-bold text-red-400 mb-4 flex items-center gap-2">
                                                    <AlertCircle className="w-5 h-5" /> Missing Requirements
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {results.missing_keywords.map(kw => <span key={kw} className="px-3 py-1.5 bg-red-500/10 text-red-300 border border-red-500/20 rounded-lg text-xs font-semibold shadow-sm">{kw}</span>)}
                                                </div>
                                                <p className="mt-4 text-xs text-red-400/80 italic">Try weaving these seamlessly into your existing bullet points.</p>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            )}

                            {/* Suggestions List */}
                            <div className="space-y-6 pt-2">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div> Actionable Rewrite Suggestions
                                </h4>
                                <div className="space-y-5">
                                    {results.suggestions.map((s, i) => (
                                        <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 relative group hover:border-indigo-500/30 transition-all shadow-lg hover:shadow-indigo-500/10">

                                            <div className="absolute top-6 right-6 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleCopy(s.suggested, i)}
                                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                                                    title="Copy Suggestion"
                                                >
                                                    {copiedState === i ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>

                                            <div className="mb-6">
                                                <div className="text-xs uppercase font-bold text-slate-500 mb-3 tracking-widest flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                                                    Original Context
                                                </div>
                                                <div className="text-[15px] text-slate-400/80 line-through decoration-slate-600/50 decoration-1 font-light leading-relaxed pl-3 border-l-2 border-slate-800">{s.original}</div>
                                            </div>

                                            <div className="bg-indigo-950/20 rounded-xl p-5 border border-indigo-500/10">
                                                <div className="text-xs uppercase font-bold text-emerald-400 mb-3 tracking-widest flex items-center gap-2">
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                    Suggested Improvement
                                                </div>
                                                <div className="text-[15px] text-slate-100 font-medium leading-relaxed">{s.suggested}</div>
                                            </div>

                                            <div className="mt-5 flex justify-start md:hidden">
                                                <button
                                                    onClick={() => handleCopy(s.suggested, i)}
                                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                                >
                                                    {copiedState === i ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                    {copiedState === i ? "Copied" : "Copy Suggestion"}
                                                </button>
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
