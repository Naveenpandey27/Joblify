from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from services.job_search_service import search_jobs, get_job_by_id
from services.ai_service import match_resume_with_job, generate_cover_letter
from services.resume_parser import parse_resume
import json

router = APIRouter(prefix="/api/job-listings", tags=["Job Listings"])


@router.get("/search")
def search_job_listings(
    q: str = "software engineer",
    country: str = "us",
    work_type: str = "",
    page: int = 1,
):
    """
    Search for job listings using DuckDuckGo.
    - q: keyword or job title
    - country: 2-letter country code (us, gb, in, ca, au …)
    - work_type: Remote | On-site | Hybrid | "" (all)
    - page: 1-based page number (12 jobs per page)
    """
    try:
        result = search_jobs(query=q, country=country, work_type=work_type, page=page)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/{job_id}")
def get_job_detail(job_id: str):
    """Retrieve a single cached job by its ID."""
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found. Please go back and search again — results may have refreshed.",
        )
    return job


@router.post("/match-resume")
async def match_resume(
    job_description: str = Form(...),
    file: UploadFile = File(...),
):
    """
    Upload a resume and match it against a job description.
    Returns structured JSON with match score, breakdown, missing keywords, and suggestions.
    """
    try:
        contents = await file.read()
        resume_text = parse_resume(contents, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse resume: {str(e)}")

    try:
        match_json_str = match_resume_with_job(resume_text, job_description)
        result = json.loads(match_json_str)
        return result
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON for match analysis.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Match analysis failed: {str(e)}")


@router.post("/cover-letter")
async def generate_cover_letter_for_job(
    job_description: str = Form(...),
    file: UploadFile = File(...),
):
    """Generate a cover letter from uploaded resume + job description."""
    try:
        contents = await file.read()
        resume_text = parse_resume(contents, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse resume: {str(e)}")

    try:
        letter = generate_cover_letter(resume_text, job_description)
        return {"cover_letter": letter}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cover letter generation failed: {str(e)}")
