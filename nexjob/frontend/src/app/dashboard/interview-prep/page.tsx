"use client"
import { useState, useRef, useEffect } from "react"
import { HelpCircle, Loader2, Sparkles, ChevronDown, ChevronUp, Download } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { checkAndConsumeCredits, hasEnoughCredits } from "@/lib/usage"

export default function InterviewPrep() {
    const [jobDescription, setJobDescription] = useState("")
    const [loading, setLoading] = useState(false)
    const [downloading, setDownloading] = useState(false)
    const [questions, setQuestions] = useState<{ q: string, a: string }[] | null>(null)
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
    const [credits, setCredits] = useState<number | null>(null)
    
    // Ref for the hidden printable component
    const printRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        hasEnoughCredits().then((res) => setCredits(res.credits))
    }, [])

    const handleGenerate = async () => {
        if (!jobDescription) return
        
        const usageCheck = await checkAndConsumeCredits('interview_questions_generated', 'interview_questions_generation', 'Interview questions generated')
        if (!usageCheck.success) {
            alert(usageCheck.message)
            return
        }

        setLoading(true)
        setQuestions(null)

        try {
            const formData = new URLSearchParams()
            formData.append("job_description", jobDescription)

            const response = await fetch("http://localhost:8000/api/resume/interview-questions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData.toString(),
            })

            if (!response.ok) {
                throw new Error("Failed to generate interview questions")
            }

            const data = await response.json()

            let parsedQuestions = []
            try {
                const rawString = data.interview_questions
                const jsonStartIndex = rawString.indexOf('[')
                const jsonEndIndex = rawString.lastIndexOf(']')
                if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                    const jsonString = rawString.substring(jsonStartIndex, jsonEndIndex + 1)
                    parsedQuestions = JSON.parse(jsonString)
                } else {
                    parsedQuestions = [{ q: "Extracted Questions", a: rawString }]
                }
            } catch (err) {
                parsedQuestions = [{ q: "AI Response", a: data.interview_questions }]
            }

            setQuestions(parsedQuestions)
            // Auto expand the first one
            if (parsedQuestions.length > 0) {
                setExpandedIndex(0)
            }
            if (credits !== null) setCredits(credits - 1)
        } catch (error) {
            console.error("Error generating interview questions:", error)
            alert("An error occurred. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadDOC = () => {
        if (!questions || questions.length === 0 || !printRef.current) return
        
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Interview Prep DOC</title></head><body>"
        const footer = "</body></html>"
        
        // Clone the element to avoid mutating React DOM directly
        const clone = printRef.current.cloneNode(true) as HTMLElement
        clone.style.display = 'block'
        
        const sourceHTML = header + clone.innerHTML + footer
        
        const blob = new Blob(['\ufeff', sourceHTML], {
            type: 'application/msword'
        })
        
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'Joblify_Interview_Prep.doc'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="max-w-4xl mx-auto">
            <header className="mb-10 text-center">
                <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
                    <HelpCircle className="text-amber-500 w-8 h-8" />
                    Interview Question Predictor
                </h1>
                <p className="text-slate-400 mt-2">Paste the job description and let AI simulate your interview.</p>
            </header>

            {!questions ? (
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
                        <h2 className="text-xl font-semibold mb-4 text-slate-200">Target Role Description</h2>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none transition-all"
                            placeholder="Paste the target job description here..."
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={!jobDescription || loading || credits === 0}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-lg shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <><Loader2 className="w-6 h-6 animate-spin mr-2" /> Generating Scenarios...</>
                        ) : credits === 0 ? (
                            <>You have used all free credits</>
                        ) : (
                            <><Sparkles className="w-6 h-6 mr-2" /> Predict Interview Questions</>
                        )}
                    </button>
                    {credits !== null && credits > 0 && (
                        <div className="text-center text-sm text-slate-400 mt-[-10px]">
                            Limits: {credits} credit{credits !== 1 ? 's' : ''} remaining
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Predicted Questions</h2>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleDownloadDOC}
                                disabled={downloading}
                                className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-900/50 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <Download className="w-4 h-4" />
                                Download DOC
                            </button>

                            <button
                                onClick={() => setQuestions(null)}
                                className="text-amber-500 hover:text-amber-400 font-medium text-sm px-3 py-2"
                            >
                                Start Over
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {questions.map((item, index) => {
                            const isExpanded = expandedIndex === index
                            return (
                                <div key={index} className="border border-slate-800 bg-slate-900 rounded-xl overflow-hidden transition-all duration-200 shadow-lg">
                                    <button
                                        onClick={() => setExpandedIndex(isExpanded ? null : index)}
                                        className="w-full text-left p-5 flex items-center justify-between focus:outline-none hover:bg-slate-800/50 transition-colors"
                                    >
                                        <span className="font-semibold text-slate-100 pr-4 text-lg flex items-center gap-3">
                                            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                                            q{index + 1}. {item.q}
                                        </span>
                                        {isExpanded ? (
                                            <ChevronUp className="w-6 h-6 text-slate-500 flex-shrink-0" />
                                        ) : (
                                            <ChevronDown className="w-6 h-6 text-amber-500 flex-shrink-0" />
                                        )}
                                    </button>
                                    {isExpanded && (
                                        <div className="p-6 pt-2 border-t border-slate-800/50 text-slate-300 bg-slate-900 leading-relaxed">
                                            {/* Adjusted prose typography classes for better spacing between headings and paragraphs */}
                                            <div className="prose prose-invert prose-amber max-w-none prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-headings:text-slate-100 prose-headings:mt-8 prose-headings:mb-4 prose-p:mb-6 prose-li:mb-2 prose-a:text-amber-400">
                                                <ReactMarkdown>
                                                    {item.a}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
            
            {/* Hidden Printable Container for PDF Generation */}
            {questions && (
                <div ref={printRef} style={{ display: "none" }} className="bg-white text-black p-8 font-sans">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b-2 border-gray-200 pb-4">
                        Interview Prep Questions
                    </h1>
                    
                    {questions.map((item, index) => (
                        <div key={`print-${index}`} className="mb-10 page-break-inside-avoid">
                            <h2 className="text-xl font-bold text-indigo-700 mb-4 flex items-center gap-2">
                                q{index + 1}. {item.q}
                            </h2>
                            <div className="prose max-w-none prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-h1:font-bold prose-h2:font-bold prose-p:text-gray-700 prose-li:text-gray-700">
                                <ReactMarkdown>
                                    {item.a}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
