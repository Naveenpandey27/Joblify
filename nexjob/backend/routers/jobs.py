from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from database import get_supabase

router = APIRouter(prefix="/api/jobs", tags=["Job Tracker"])

class JobApplicationCreate(BaseModel):
    company: str
    role: str
    status: str
    applied_date: str

class JobApplicationUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    applied_date: Optional[str] = None

# Using a generic User-ID for demo unless authenticated explicitly
# Real app would use an Auth-Middleware
USER_ID = "00000000-0000-0000-0000-000000000000"

@router.get("/")
def get_jobs():
    try:
        supabase = get_supabase()
        response = supabase.table("JobApplications").select("*").execute()
        return {"jobs": response.data}
    except Exception as e:
        # In a real setup handle unconfigured DB logic
        return {"jobs": [], "error": str(e)}

@router.post("/")
def add_job(job: JobApplicationCreate):
    try:
        supabase = get_supabase()
        data = {
            "company": job.company,
            "role": job.role,
            "status": job.status,
            "applied_date": job.applied_date,
            "user_id": USER_ID # Placeholder
        }
        response = supabase.table("JobApplications").insert(data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{job_id}")
def update_job(job_id: str, job: JobApplicationUpdate):
    try:
        supabase = get_supabase()
        data = {k: v for k, v in job.dict().items() if v is not None}
        response = supabase.table("JobApplications").update(data).eq("id", job_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Job not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{job_id}")
def delete_job(job_id: str):
    try:
        supabase = get_supabase()
        response = supabase.table("JobApplications").delete().eq("id", job_id).execute()
        return {"message": "Job deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
