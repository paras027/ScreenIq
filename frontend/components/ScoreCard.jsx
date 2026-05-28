import { scoreBadgeColor, scoreColor } from '@/utils/scoreColor';

export default function ScoreCard({ result }) {
  // Handle both REST shape (ai_score/ai_reasons) and stream shape (score/reasons)
  const candidate_name = result.candidate_name;
  const ai_score = result.ai_score ?? result.score;
  const ai_reasons = result.ai_reasons ?? result.reasons;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Screening Result</p>
          <h3 className="text-lg font-semibold text-gray-800 mt-0.5">{candidate_name}</h3>
        </div>
        <div className={`text-4xl font-bold ${scoreColor(ai_score)}`}>
          {ai_score}<span className="text-lg font-normal text-gray-400">/10</span>
        </div>
      </div>

      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${scoreBadgeColor(ai_score)}`}>
        {ai_score < 5 ? 'Low Match' : ai_score <= 7 ? 'Moderate Match' : 'Strong Match'}
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">AI Analysis</p>
        <ul className="space-y-2">
          {ai_reasons?.map((reason, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-600">
              <span className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              {reason}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
