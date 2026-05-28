'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold text-indigo-600 tracking-tight">
        ScreenIQ
      </Link>
      <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
        {user ? (
          <>
            <Link href="/screen" className="hover:text-indigo-600 transition-colors">Screen</Link>
            <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">{user.username}</span>
            <button
              onClick={handleLogout}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-indigo-600 transition-colors">Login</Link>
            <Link href="/register" className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
