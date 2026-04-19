# Joblify

Joblify is a full-stack AI-powered job application assistant allowing users to optimize resumes, generate cover letters, predict interview questions, and track their applications.

## Tech Stack
- **Frontend**: Next.js 14, React, Tailwind CSS, Lucide Icons
- **Backend**: Python, FastAPI, Uvicorn, OpenAI
- **Database / Auth**: Supabase (PostgreSQL)

## Prerequisites
- Node.js & npm (for frontend)
- Python 3.9+ (for backend)
- A Supabase Project (URL & Service Role Key)
- An OpenAI API Key

## Setup Instructions

### 1. Database Setup
Run the SQL queries found in `backend/schema.sql` in your Supabase SQL Editor to create the Job Tracker tables and Row Level Security policies.

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```
Make sure you populate `backend/.env` with your Supabase URL, Key, and OpenAI API Key.
```bash
uvicorn main:app --reload
```
The FastAPI backend will start on `http://localhost:8000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
```
Make sure you populate `frontend/.env.local` with your Supabase URL and Anon Key.
```bash
npm run dev
```
The Next.js frontend will start on `http://localhost:3000`.

## Features
1. **Resume Optimizer**: Upload a `.pdf` or `.docx` and get an ATS-optimized rewrite against a specific job description.
2. **Cover Letter Generator**: Create a personalized letter.
3. **Interview Question Predictor**: Anticipate both behavioral and technical questions based on the job role.
4. **Job Application Tracker**: Keep a centralized repository of your application status pipeline.
