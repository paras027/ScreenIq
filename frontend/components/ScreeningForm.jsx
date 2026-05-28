'use client';

import { useState } from 'react';
import { screenCandidateStream } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';
import ScoreCard from './ScoreCard';
import { scoreColor } from '@/utils/scoreColor';

function StreamingPreview({ text }) {
  const clean = text.replace(/```json|```/g, '').trim();

  // Try to extract score
  const scoreMatch = clean.match(/"score"\s*:\s*(\d+(\.\d+)?)/);
  const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;

  // Try to extract reasons as they appear
  const reasonMatches = [...clean.matchAll(/"([^"]{10,})"/g)]
    .map(m => m[1])
    .filter(r => !r.includes('score') && !r.includes('reasons'));

  const hasAnyContent = score !== null || reasonMatches.length > 0;

  if (!hasAnyContent) {
    return (
      <p className="text-sm text-gray-400 italic">Reading response<span className="animate-pulse">▋</span></p>
    );
  }

  return (
    <div className="space-y-4">
      {score !== null && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500">Score</span>
          <span className={`text-3xl font-bold ${scoreColor(score)}`}>
            {score}<span className="text-base font-normal text-gray-400">/10</span>
          </span>
        </div>
      )}
      {reasonMatches.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Reasons</p>
          {reasonMatches.map((r, i) => (
            <div key={i} className="flex gap-3 text-sm text-gray-600">
              <span className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              {r}<span className="animate-pulse">▋</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScreeningForm() {
  const [form, setForm] = useState({ candidate_name: '', job_description: '', resume: '' });
  const [result, setResult] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [rawChunks, setRawChunks] = useState('');
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setRawChunks('');

    if (!form.candidate_name.trim() || !form.job_description.trim() || !form.resume.trim()) {
      setError('All fields are required.');
      return;
    }

    setStreaming(true);

    screenCandidateStream(
      form,
      (chunk) => setRawChunks((prev) => prev + chunk),
      (final) => {
        setStreaming(false);
        setResult(final);
        setRawChunks('');
      },
      (err) => {
        setStreaming(false);
        setError(err);
      }
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
        <h2 className="text-xl font-semibold text-gray-800">Screen a Candidate</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Name</label>
          <input
            name="candidate_name"
            value={form.candidate_name}
            onChange={handleChange}
            placeholder="e.g. Jane Doe"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
          <textarea
            name="job_description"
            value={form.job_description}
            onChange={handleChange}
            rows={5}
            placeholder="Paste the job description here..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
          <textarea
            name="resume"
            value={form.resume}
            onChange={handleChange}
            rows={7}
            placeholder="Paste the candidate's resume here..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={streaming}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {streaming ? <><LoadingSpinner size="sm" /><span>Analyzing...</span></> : 'Screen Candidate'}
        </button>
      </form>

      {/* Live SSE preview — shows parsed content as it streams */}
      {rawChunks && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse inline-block" />
            AI is analyzing...
          </p>
          <StreamingPreview text={rawChunks} />
        </div>
      )}

      {result && <ScoreCard result={result} />}
    </div>
  );
}
