import ProtectedRoute from '@/components/ProtectedRoute';
import ScreeningForm from '@/components/ScreeningForm';

export const metadata = { title: 'Screen Candidate – ScreenIQ' };

export default function ScreenPage() {
  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">AI Screening</h1>
          <p className="text-sm text-gray-500 mt-1">Paste a job description and resume to get an AI-powered match score.</p>
        </div>
        <ScreeningForm />
      </div>
    </ProtectedRoute>
  );
}
