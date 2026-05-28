import { scoreBadgeColor } from '@/utils/scoreColor';
import { formatDate } from '@/utils/formatDate';

export default function DashboardTable({ applications, onView }) {
  if (!applications.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg font-medium">No screenings yet</p>
        <p className="text-sm mt-1">Screen your first candidate to see results here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
          <tr>
            <th className="px-6 py-3 text-left font-medium">Candidate</th>
            <th className="px-6 py-3 text-left font-medium">AI Score</th>
            <th className="px-6 py-3 text-left font-medium">Date</th>
            <th className="px-6 py-3 text-left font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {applications.map((app) => (
            <tr key={app.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 font-medium text-gray-800">{app.candidate_name}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${scoreBadgeColor(app.ai_score)}`}>
                  {app.ai_score}/10
                </span>
              </td>
              <td className="px-6 py-4 text-gray-500">{formatDate(app.created_at)}</td>
              <td className="px-6 py-4">
                <button
                  onClick={() => onView(app)}
                  className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
