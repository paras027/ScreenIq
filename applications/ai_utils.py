import os
import json
import random
from google import genai

USE_MOCK = os.getenv("USE_MOCK_AI", "false").lower() == "true"

def _is_mock():
    return os.getenv("USE_MOCK_AI", "false").lower() == "true"

MOCK_RESPONSE = '{"score": 7.5, "reasons": ["Candidate has relevant experience matching the job requirements.", "Technical skills align well with the listed qualifications.", "Communication and background suggest a good cultural fit."]}'

def screen_candidate(job_description, resume):
    if _is_mock():
        score = round(random.uniform(3, 9), 1)
        return {
            "score": score,
            "reasons": [
                "Candidate has relevant experience matching the job requirements.",
                "Technical skills align well with the listed qualifications.",
                "Communication and background suggest a good cultural fit."
            ]
        }

    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    prompt = _build_prompt(job_description, resume)
    response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
    content = response.text.strip()
    if content.startswith("```json"):
        content = content.replace("```json", "").replace("```", "").strip()
    return json.loads(content)


def stream_candidate(job_description, resume):
    """Generator that yields raw text chunks from Gemini stream."""
    if _is_mock():
        import time
        for char in MOCK_RESPONSE:
            yield char
            time.sleep(0.01)
        return

    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    prompt = _build_prompt(job_description, resume)
    for chunk in client.models.generate_content_stream(model="gemini-2.5-flash", contents=prompt):
        if chunk.text:
            yield chunk.text


def _build_prompt(job_description, resume):
    return f"""
    You are an AI HR screening assistant.

    Analyze the following job description and candidate resume.

    Return:
    1. A score from 1-10
    2. Exactly 3 concise bullet-point reasons

    Job Description:
    {job_description}

    Resume:
    {resume}

    Return ONLY valid JSON in this format:

    {{"score": 8, "reasons": ["reason 1", "reason 2", "reason 3"]}}
    """
