'use client';

import { useState, useEffect, useCallback } from 'react';
import { getApplications } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardTable from '@/components/DashboardTable';
import Pagination from '@/components/Pagination';
import LoadingSpinner from '@/components/LoadingSpinner';
import ScoreCard from '@/components/ScoreCard';

function Dashboard() {
  const [applications, setApplications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchApplications = useCallback(async (p) => {
    setLoading(true);
    setError('');
    try {
      const res = await getApplications(p);
      setApplications(res.data.results);
      setTotalPages(Math.ceil(res.data.count / 10));
    } catch {
      setError('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplications(page); }, [page, fetchApplications]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">All your candidate screenings in one place.</p>
        </div>
        <a
          href="/screen"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + New Screening
        </a>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          <DashboardTable applications={applications} onView={setSelected} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setSelected(null)}
                className="text-white hover:text-gray-200 text-sm font-medium"
              >
                ✕ Close
              </button>
            </div>
            <ScoreCard result={selected} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
