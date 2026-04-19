"use client"
import { useState, useEffect } from "react"
import { FileEdit, Loader2, Sparkles, CheckCircle, Copy, Rocket, FileUp, Check } from "lucide-react"
import { checkAndConsumeCredits, hasEnoughCredits } from "@/lib/usage"

export default function CoverLetterGenerator() {
    const [jobDescription, setJobDescription] = useState("")
    const [resumeText, setResumeText] = useState("")
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(false)
    const [coverLetter, setCoverLetter] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [credits, setCredits] = useState<number | null>(null)

    useEffect(() => {
        hasEnoughCredits().then((res) => setCredits(res.credits))
    }, [])

    const handleUpload = async (selectedFile: File) => {
        setFile(selectedFile)
        setUploading(true)
        setResumeText("") // reset if new upload

        try {
            const formData = new FormData()
            formData.append("file", selectedFile)

            const response = await fetch("http://localhost:8000/api/resume/upload", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) throw new Error("Failed to upload and parse resume")

            const { text } = await response.json()
            setResumeText(text)
        } catch (error) {
            console.error("Error uploading resume:", error)
            alert("An error occurred while uploading. Please try again.")
            setFile(null)
        } finally {
            setUploading(false)
        }
    }

    const handleGenerate = async () => {
        if (!resumeText || !jobDescription) return
        
        const usageCheck = await checkAndConsumeCredits('cover_letters_generated', 'cover_letter_generation', 'Cover letter generated')
        if (!usageCheck.success) {
            alert(usageCheck.message)
            return
        }
        
        setLoading(true)
        setCoverLetter(null)

        try {
            const formData = new URLSearchParams()
            formData.append("resume_text", resumeText)
            formData.append("job_description", jobDescription)

            const response = await fetch("http://localhost:8000/api/resume/cover-letter", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData.toString(),
            })

            if (!response.ok) {
                throw new Error("Failed to generate cover letter")
            }

            const data = await response.json()
            setCoverLetter(data.cover_letter)
            if (credits !== null) setCredits(credits - 1)
        } catch (error) {
            console.error("Error generating cover letter:", error)
            alert("An error occurred while generating your cover letter. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = () => {
        if (coverLetter) {
            navigator.clipboard.writeText(coverLetter)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
            <header className="mb-8 shrink-0">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <FileEdit className="text-purple-400 w-8 h-8" />
                    AI Cover Letter
                </h1>
                <p className="text-slate-400 mt-2">Upload your resume to generate a highly personalized cover letter in seconds.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
                {/* Left Column: Inputs */}
                <div className="flex flex-col gap-6 overflow-y-auto pr-2 pb-4">
                    
                    {/* Resume Upload Box */}
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shrink-0">
                        <h2 className="text-xl font-semibold mb-4 text-slate-200">1. Upload Resume</h2>
                        <div className={`border-2 border-dashed ${resumeText ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 hover:border-purple-500 hover:bg-slate-800/50'} rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer relative group overflow-hidden`}>
                            <input
                                type="file"
                                accept=".pdf,.docx"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) handleUpload(e.target.files[0])
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                title="Click to upload resume"
                            />
                            
                            {uploading ? (
                                <>
                                    <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-3" />
                                    <p className="font-medium text-slate-300">Extracting Text...</p>
                                </>
                            ) : resumeText ? (
                                <>
                                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3 text-emerald-400">
                                        <CheckCircle className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-lg font-bold text-emerald-400 mb-1">Resume Uploaded Successfully</h3>
                                    <p className="text-slate-400 text-sm">{file?.name || "Ready to analyze"}</p>
                                    <p className="text-purple-400 text-xs mt-3 opacity-0 group-hover:opacity-100 transition-opacity font-medium">Click to upload a different resume</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors text-purple-400">
                                        <FileUp className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-200 mb-1">Click to upload PDF or DOCX</h3>
                                    <p className="text-slate-500 text-sm">Max file size 5MB</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Job Description Box */}
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex-1 flex flex-col shrink-0 min-h-[300px]">
                        <h2 className="text-xl font-semibold mb-4 text-slate-200">2. Paste Job Description</h2>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none transition-all"
                            placeholder="Paste the target job description here..."
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={!resumeText || !jobDescription || loading || uploading || credits === 0}
                        className="w-full py-4 rounded-xl shrink-0 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold text-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <><Loader2 className="w-6 h-6 animate-spin mr-2" /> Penning your letter...</>
                        ) : credits === 0 ? (
                            <>You have used all free credits</>
                        ) : (
                            <><Sparkles className="w-6 h-6 mr-2" /> Generate Cover Letter</>
                        )}
                    </button>
                    {credits !== null && credits > 0 && (
                        <div className="text-center text-sm text-slate-400 mt-[-10px]">
                            Limits: {credits} credit{credits !== 1 ? 's' : ''} remaining
                        </div>
                    )}
                </div>

                {/* Right Column: Output */}
                <div className="h-full flex flex-col p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-sm relative overflow-hidden text-slate-100 min-h-[600px] lg:min-h-0">
                    {coverLetter ? (
                        <>
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800 shrink-0">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-400">
                                    <CheckCircle className="w-6 h-6" /> Success
                                </h2>
                                <button 
                                    onClick={handleCopy}
                                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-2 text-sm font-medium border border-slate-700/50"
                                >
                                    {copied ? <><Check className="w-4 h-4 text-emerald-400" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto pr-4 whitespace-pre-wrap font-sans text-slate-300 leading-relaxed text-[15px] lg:text-base custom-scrollbar pb-6">
                                {coverLetter}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                            <Rocket className="w-16 h-16 text-slate-600 mb-6" />
                            <h3 className="text-xl font-medium text-slate-400">Ready to write a winning letter</h3>
                            <p className="text-slate-500 max-w-sm mt-3 leading-relaxed">Upload your resume, paste the job details, and let AI do the heavy lifting.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
