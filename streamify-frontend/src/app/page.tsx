// src/app/page.tsx
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold">Welcome to Streamify</h1>
      <p className="mt-2 text-lg">The best place to process your videos.</p>
      <div className="mt-6 space-x-4">
        <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded">
          Login
        </Link>
        <Link href="/register" className="bg-gray-200 text-black px-4 py-2 rounded">
          Register
        </Link>
      </div>
    </main>
  );
}