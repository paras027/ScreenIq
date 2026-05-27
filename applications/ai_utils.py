import os
import json
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


def screen_candidate(job_description, resume):

    prompt = f"""
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

    {{
      "score": 8,
      "reasons": [
         "reason 1",
         "reason 2",
         "reason 3"
      ]
    }}
    """

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    content = response.choices[0].message.content

    return json.loads(content)