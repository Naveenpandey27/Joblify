from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from routers import resume, jobs, job_listings
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Joblify API")

# Configure CORS for Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Typically restricted in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Joblify API"}

app.include_router(resume.router)
app.include_router(jobs.router)
app.include_router(job_listings.router)
