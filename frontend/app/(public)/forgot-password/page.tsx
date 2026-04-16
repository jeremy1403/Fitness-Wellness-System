import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Password reset
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">Reset access</h1>
          <p className="mt-2 text-sm text-slate-600">
            This is a placeholder for the reset flow. Hook it to the backend when
            available.
          </p>
        </div>

        <form className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="text-sm font-medium text-slate-700">
            Email address
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
              required
            />
          </label>
          <button
            type="submit"
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Send reset email
          </button>
        </form>

        <Link href="/login" className="text-sm font-semibold text-slate-600">
          Back to login
        </Link>
      </div>
    </div>
  );
}
