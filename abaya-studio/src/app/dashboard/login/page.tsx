import { LoginForm } from "@/components/dashboard/LoginForm";
import { Logo } from "@/components/ui";

export const metadata = { title: "دخول التاجر" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = (await searchParams).next;
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-3xl border border-line bg-white p-6">
          <h1 className="font-display text-2xl font-semibold">دخول التاجر</h1>
          <p className="mt-1 text-sm text-muted">سنرسل رمز دخول إلى بريدك.</p>
          <LoginForm next={next?.startsWith("/dashboard") ? next : "/dashboard"} />
        </div>
      </div>
    </div>
  );
}
