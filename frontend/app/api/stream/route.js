import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

export async function POST(request) {
  const { job_description, resume, candidate_name, token } = await request.json();

  if (!job_description || !resume) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const prompt = `
You are an AI HR screening assistant.

Analyze the following job description and candidate resume.

Return:
1. A score from 1-10
2. Exactly 3 concise bullet-point reasons

Job Description:
${job_description}

Resume:
${resume}

Return ONLY valid JSON in this exact format:
{"score": 8, "reasons": ["reason 1", "reason 2", "reason 3"]}
`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const response = await ai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        let fullText = '';

        for await (const chunk of response) {
          const text = chunk.text;
          if (text) {
            fullText += text;
            // Break into smaller pieces so frontend sees progressive output
            const words = text.split(/(?<=\s)/);
            for (const word of words) {
              const event = `data: ${JSON.stringify({ chunk: word })}\n\n`;
              controller.enqueue(encoder.encode(event));
              // Small delay between words for visible streaming effect
              await new Promise((r) => setTimeout(r, 30));
            }
          }
        }

        // Parse and save to Django
        let content = fullText.trim();
        if (content.startsWith('```json')) {
          content = content.replace(/```json|```/g, '').trim();
        }

        const parsed = JSON.parse(content);

        // Save to Django backend with pre-computed score and reasons
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        await fetch(`${apiBase}/screen/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            job_description,
            resume,
            candidate_name,
            ai_score: parsed.score,
            ai_reasons: parsed.reasons,
          }),
        });

        const doneEvent = `data: ${JSON.stringify({ done: true, score: parsed.score, reasons: parsed.reasons, candidate_name })}\n\n`;
        controller.enqueue(encoder.encode(doneEvent));
      } catch (err) {
        const errEvent = `data: ${JSON.stringify({ error: err.message })}\n\n`;
        controller.enqueue(encoder.encode(errEvent));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
