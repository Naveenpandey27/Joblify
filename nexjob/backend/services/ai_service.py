from groq import Groq
import os

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    return Groq(api_key=api_key)

def optimize_resume(resume_text: str, job_description: str) -> str:
    client = get_groq_client()
    system_prompt = (
        "You are a professional resume writer and career coach. "
        "Rewrite the user's resume to match the job description. "
        "Focus on: ATS optimization, relevant keywords, strong bullet points, "
        "and measurable achievements.\n\n"
        "CRITICAL INSTRUCTIONS:\n"
        "1. Return ONLY the rewritten resume text.\n"
        "2. DO NOT include any conversational text whatsoever.\n"
        "3. DO NOT include prefixes like 'Here is your rewritten resume' or 'Sure!'.\n"
        "4. DO NOT include postfixes explaining what you changed."
    )
    user_prompt = f"Resume:\n{resume_text}\n\nJob Description:\n{job_description}"
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    )
    content = response.choices[0].message.content
    
    # Force-remove common AI prefixes if Llama ignores instructions
    lines = content.split('\n')
    while lines and ("Here is" in lines[0] or "Sure" in lines[0] or "optimized resume" in lines[0].lower() or lines[0].strip() == ""):
        lines.pop(0)
        
    return "\n".join(lines).strip()

def generate_cover_letter(resume_text: str, job_description: str) -> str:
    client = get_groq_client()
    system_prompt = (
        "You are an expert career coach. Based on the provided resume and job description, "
        "write a professional, personalized cover letter. Keep it engaging, concise, and focused "
        "on how the candidate's experience aligns with the specific job requirements.\n\n"
        "CRITICAL INSTRUCTIONS:\n"
        "1. Return ONLY the cover letter text.\n"
        "2. DO NOT include any conversational text whatsoever.\n"
        "3. DO NOT include prefixes like 'Here is a professional, personalized cover letter:' or 'Sure!'.\n"
        "4. DO NOT include postfixes explaining what you wrote."
    )
    user_prompt = f"Resume:\n{resume_text}\n\nJob Description:\n{job_description}"
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    )
    
    content = response.choices[0].message.content
    
    # Force-remove common AI prefixes if Llama ignores instructions
    lines = content.split('\n')
    while lines and ("Here is" in lines[0] or "Sure" in lines[0] or "cover letter" in lines[0].lower() or lines[0].strip() == ""):
        lines.pop(0)
        
    return "\n".join(lines).strip()

def generate_interview_questions(job_description: str) -> str:
    client = get_groq_client()
    system_prompt = (
        "You are an expert HR sourcer and technical interviewer. Based on the job description, "
        "generate a list of likely interview questions. Ensure you include behavioral questions, "
        "technical questions (where applicable), and suggested answers or key points to hit "
        "for each question. Return the result in a clean, structured JSON or Markdown format."
    )
    user_prompt = f"Job Description:\n{job_description}"
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    )
    return response.choices[0].message.content

def generate_resume_suggestions(resume_text: str, job_description: str) -> str:
    """
    Generates structured AI suggestions for the resume editor.
    Returns a JSON string matching the NextJS frontend expectations.
    """
    client = get_groq_client()
    system_prompt = (
        "You are an expert ATS optimizer and resume writer. "
        "Analyze the provided resume against the job description and provide targeted improvements. "
        "You MUST return ONLY a valid JSON object. Do NOT wrap it in markdown code blocks. "
        "Do NOT include any text outside the JSON object.\n\n"
        "Your JSON MUST match exactly this schema:\n"
        "{\n"
        '  "ats_score_before": 0-100 (integer representing current ATS match),\n'
        '  "ats_score_after": 0-100 (integer representing estimated match after applying suggestions),\n'
        '  "formatting_score": 0-100,\n'
        '  "content_strength_score": 0-100,\n'
        '  "missing_keywords": ["keyword1", "keyword2"],\n'
        '  "matching_skills": ["skill1", "skill2"],\n'
        '  "suggestions": [\n'
        "    {\n"
        '      "original": "Exact text from the resume you want to replace. Must exist exactly in the text.",\n'
        '      "suggested": "The improved, rewritten version with better metrics, action verbs, and ATS keywords."\n'
        "    }\n"
        "  ]\n"
        "}\n\n"
        "Important: Provide at least 3-5 high-quality suggestions. Ensure 'original' text strings "
        "are long enough to be unique (e.g. full sentences or bullet points) but exactly match the source text."
    )
    user_prompt = f"Resume Text:\n{resume_text}\n\nJob Description:\n{job_description}"
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.1 # Lower temp for more reliable JSON structure
    )
    
    content = response.choices[0].message.content.strip()
    
    # Clean up markdown code blocks if Llama accidentally included them
    if content.startswith("```json"):
        content = content[7:]
    elif content.startswith("```"):
        content = content[3:]
        
    if content.endswith("```"):
        content = content[:-3]
        
    return content.strip()


def match_resume_with_job(resume_text: str, job_description: str) -> str:
    """
    Analyze how well a resume matches a job description.
    Returns a JSON string with match score, breakdown metrics,
    missing keywords, and actionable suggestions.
    """
    client = get_groq_client()
    system_prompt = (
        "You are an expert ATS analyzer and career coach. "
        "Analyze how well the provided resume matches the job description. "
        "You MUST return ONLY a valid JSON object. Do NOT wrap it in markdown code blocks. "
        "Do NOT include any text outside the JSON object.\n\n"
        "Return exactly this schema:\n"
        "{\n"
        '  \"match_score\": 0-100 (overall match percentage),\n'
        '  \"skills_match\": 0-100 (how well skills align),\n'
        '  \"experience_match\": 0-100 (how well experience aligns),\n'
        '  \"keyword_match\": 0-100 (ATS keyword overlap),\n'
        '  \"missing_keywords\": [\"keyword1\", \"keyword2\"],\n'
        '  \"matching_skills\": [\"skill1\", \"skill2\"],\n'
        '  \"suggestions\": [\"actionable suggestion 1\", \"actionable suggestion 2\"]\n'
        "}\n\n"
        "Provide at least 3 missing keywords and 3 actionable suggestions. Be specific."
    )
    user_prompt = f"Resume:\n{resume_text}\n\nJob Description:\n{job_description}"

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.1,
    )

    content = response.choices[0].message.content.strip()

    # Clean up markdown code blocks if accidentally included
    if content.startswith("```json"):
        content = content[7:]
    elif content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]

    return content.strip()
