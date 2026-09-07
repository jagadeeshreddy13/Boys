import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Page Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">
          The requested page could not be found. Please navigate back to the Sri Srinivasa Hostel ERP dashboard.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
