"use client"
import { useState, useEffect } from "react"
import { FileUp, Loader2, Sparkles, CheckCircle } from "lucide-react"
import { ResumeEditor } from "@/components/ResumeEditor"
import { checkAndConsumeCredits, hasEnoughCredits } from "@/lib/usage"

export default function ResumeOptimizer() {
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [parsedText, setParsedText] = useState<string | null>(null)
    const [credits, setCredits] = useState<number | null>(null)

    useEffect(() => {
        hasEnoughCredits().then((res) => setCredits(res.credits))
    }, [])

    const handleUpload = async (selectedFile: File) => {
        const usageCheck = await checkAndConsumeCredits('resumes_optimized', 'resume_optimization', 'Resume optimized for general scope')
        if (!usageCheck.success) {
            alert(usageCheck.message)
            return
        }
        
        setFile(selectedFile)
        setLoading(true)

        try {
            const formData = new FormData()
            formData.append("file", selectedFile)

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resume/upload`, {
                method: "POST",
                body: formData,
            })

            if (!response.ok) throw new Error("Failed to upload and parse resume")

            const { text } = await response.json()
            setParsedText(text)
            if (credits !== null) setCredits(credits - 1)
        } catch (error) {
            console.error("Error uploading resume:", error)
            alert("An error occurred while uploading. Please try again.")
            setFile(null)
        } finally {
            setLoading(false)
        }
    }

    if (parsedText) {
        return (
            <div className="w-full">
                <header className="mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Sparkles className="text-indigo-400 w-8 h-8" />
                            AI Resume Editor
                        </h1>
                        <p className="text-slate-400 mt-2">Edit your resume and get targeted feedback for any job.</p>
                    </div>
                    <button onClick={() => setParsedText(null)} className="text-sm font-medium text-slate-500 hover:text-white transition-colors">Start Over</button>
                </header>
                <ResumeEditor initialText={parsedText} />
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto mt-10">
            <header className="mb-10 text-center">
                <h1 className="text-3xl font-bold flex items-center justify-center gap-3 mb-4">
                    <Sparkles className="text-indigo-400 w-8 h-8" />
                    Interactive AI Resume Editor
                </h1>
                <p className="text-slate-400 text-lg">Upload your current resume to start analyzing and editing.</p>
            </header>

            <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
                <div className={`border-2 ${credits === 0 ? 'border-red-900 bg-red-950/20 cursor-not-allowed opacity-75' : 'border-dashed border-slate-700 hover:border-indigo-500 hover:bg-slate-800/50 cursor-pointer'} rounded-xl p-12 flex flex-col items-center justify-center text-center transition-colors group`}>
                    <input
                        type="file"
                        accept=".pdf,.docx"
                        onChange={(e) => {
                            if (credits !== 0 && e.target.files?.[0]) handleUpload(e.target.files[0])
                        }}
                        className="hidden"
                        id="resume-upload"
                        disabled={credits === 0 || loading}
                    />
                    <label htmlFor="resume-upload" className={`${credits === 0 ? 'cursor-not-allowed' : 'cursor-pointer'} flex flex-col items-center justify-center w-full h-full`}>
                        {loading ? (
                            <>
                                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                                <p className="font-medium text-slate-200">Parsing Resume...</p>
                            </>
                        ) : credits === 0 ? (
                            <>
                                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 transition-colors">
                                    <FileUp className="w-10 h-10 text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-red-400 mb-2">You have used all free credits</h3>
                                <p className="text-slate-500">Upgrade your account to continue.</p>
                            </>
                        ) : (
                            <>
                                <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors">
                                    <FileUp className="w-10 h-10 text-indigo-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Click to upload PDF or DOCX</h3>
                                <p className="text-slate-500">Max file size 5MB</p>
                            </>
                        )}
                    </label>
                </div>
                {credits !== null && credits > 0 && (
                    <div className="text-center mt-6 text-sm text-slate-400">
                        Limits: {credits} credit{credits !== 1 ? 's' : ''} remaining
                    </div>
                )}
            </div>
        </div>
    )
}
