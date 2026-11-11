import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F1F8F4] dark:bg-[#121016] text-slate-900 dark:text-[#EDE7DB] text-center space-y-4">
      <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-[#F5EFE6]">
        Halaman Tidak Ditemukan
      </h2>
      <p className="text-sm text-slate-600 dark:text-[#A8A092] max-w-md">
        Halaman yang Anda tuju tidak tersedia di Grimoire Blood on the Clocktower.
      </p>
      <Link
        href="/"
        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-semibold text-sm inline-flex items-center justify-center transition-colors"
      >
        Kembali ke Meja Grimoire
      </Link>
    </div>
  );
}
