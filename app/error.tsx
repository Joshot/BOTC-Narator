'use client';

import React from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F1F8F4] dark:bg-[#121016] text-slate-900 dark:text-[#EDE7DB] text-center space-y-4">
      <h2 className="font-display text-2xl font-bold text-red-700 dark:text-[#F87171]">
        Terjadi Kesalahan Aplikasi
      </h2>
      <p className="text-sm text-slate-600 dark:text-[#A8A092] max-w-md">
        {error.message || 'Terjadi gangguan saat memproses sesi Grimoire.'}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-semibold text-sm cursor-pointer transition-colors"
      >
        Coba Muat Ulang
      </button>
    </div>
  );
}
