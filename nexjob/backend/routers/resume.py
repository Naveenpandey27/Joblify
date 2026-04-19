from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from services.resume_parser import parse_resume
from services.ai_service import optimize_resume, generate_cover_letter, generate_interview_questions, generate_resume_suggestions
import io

router = APIRouter(prefix="/api/resume", tags=["Resume AI Tools"])

@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        extracted_text = parse_resume(contents, file.filename)
        return {"text": extracted_text}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/optimize")
async def optimize(resume_text: str = Form(...), job_description: str = Form(...)):
    try:
        optimized = optimize_resume(resume_text, job_description)
        return {"optimized_resume": optimized}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cover-letter")
async def cover_letter(resume_text: str = Form(...), job_description: str = Form(...)):
    try:
        letter = generate_cover_letter(resume_text, job_description)
        return {"cover_letter": letter}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/interview-questions")
async def interview_questions(job_description: str = Form(...)):
    try:
        questions = generate_interview_questions(job_description)
        return {"interview_questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/suggestions")
async def get_resume_suggestions(resume_text: str = Form(...), job_description: str = Form(...)):
    """Analyze resume and return structured JSON suggestions."""
    try:
        import json
        suggestions_json = generate_resume_suggestions(resume_text, job_description)
        # Parse it to ensure it's valid JSON before sending to frontend
        parsed = json.loads(suggestions_json)
        return parsed
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate suggestions: {str(e)}")

@router.post("/download-html")
async def download_html_to_pdf(html_content: str = Form(...)):
    """Convert raw user-edited HTML from TipTap into a clean PDF."""
    from xhtml2pdf import pisa
    try:
        # Wrap the raw HTML in basic document structure for xhtml2pdf
        styled_html = f"""
        <html>
        <head>
        <style>
            @page {{ size: letter portrait; margin: 1in; }}
            body {{ font-family: Helvetica, Arial, sans-serif; font-size: 11pt; color: #333; line-height: 1.5; }}
            h1, h2, h3 {{ color: #111; margin-top: 15pt; margin-bottom: 5pt; }}
            p {{ margin-bottom: 8pt; }}
            ul {{ margin-left: 20px; list-style-type: disc; }}
            li {{ margin-bottom: 4pt; }}
            b, strong {{ font-weight: bold; color: #000; }}
        </style>
        </head>
        <body>
            {html_content}
        </body>
        </html>
        """
        
        result_file = io.BytesIO()
        pisa_status = pisa.CreatePDF(styled_html, dest=result_file)
        
        if pisa_status.err:
            raise Exception("PDF generation error")
            
        result_file.seek(0)
        return StreamingResponse(
            result_file,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=joblify_resume.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

@router.post("/download")
async def download_resume(
    optimized_text: str = Form(...),
    format: str = Form(default="pdf")
):
    """Generate a downloadable PDF or DOCX from the optimized resume text."""
    try:
        if format.lower() == "docx":
            return _generate_docx(optimized_text)
        else:
            return _generate_pdf(optimized_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _generate_pdf(text: str) -> StreamingResponse:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.enums import TA_LEFT

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    normal_style = ParagraphStyle(
        "ResumeNormal",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        alignment=TA_LEFT,
    )

    story = []
    for line in text.split("\n"):
        stripped = line.strip()
        if not stripped:
            story.append(Spacer(1, 6))
        else:
            from xml.sax.saxutils import escape
            # Escape XML special chars for reportlab
            safe = escape(stripped, {"'": "&apos;", '"': "&quot;"})
            story.append(Paragraph(safe, normal_style))

    doc.build(story)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=optimized_resume.pdf"},
    )


def _generate_docx(text: str) -> StreamingResponse:
    import docx as python_docx

    document = python_docx.Document()
    for line in text.split("\n"):
        document.add_paragraph(line)

    buf = io.BytesIO()
    document.save(buf)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": "attachment; filename=optimized_resume.docx"},
    )
