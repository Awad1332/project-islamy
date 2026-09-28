import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="grid min-h-[100dvh] place-items-center bg-alt px-4 text-center">
      <div>
        <p className="text-7xl font-bold text-primary">٤٠٤</p>
        <h1 className="mt-4 text-2xl font-bold text-ink">الصفحة غير موجودة</h1>
        <p className="mt-2 text-muted">ربما تم نقل الصفحة أو أن الرابط غير صحيح.</p>
        <Link href="/" className="mt-8 inline-flex h-12 items-center rounded-full bg-primary px-6 font-semibold text-white">
          العودة للرئيسية
        </Link>
      </div>
    </main>
  );
}
