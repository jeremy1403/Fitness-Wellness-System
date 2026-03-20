export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Admin settings</h1>
        <p className="mt-2 text-sm text-slate-600">
          Admin-only profile and operational preferences.
        </p>
      </div>

      <form className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Admin profile</h2>
          <div className="mt-4 grid gap-4">
            <label className="text-sm font-medium text-slate-700">
              Display name
              <input
                type="text"
                name="displayName"
                placeholder="Admin name"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Admin email
              <input
                type="email"
                name="email"
                placeholder="admin@example.com"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Department
              <input
                type="text"
                name="department"
                placeholder="Operations"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Security preferences</h2>
          <div className="mt-4 grid gap-4">
            <label className="text-sm font-medium text-slate-700">
              Admin access code
              <input
                type="text"
                name="accessCode"
                placeholder="ADM-0001"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Security contact
              <input
                type="text"
                name="securityContact"
                placeholder="security@example.com"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4" defaultChecked />
              Require 2-step confirmation for destructive actions
            </label>
            <button
              type="submit"
              className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-500"
            >
              Save admin settings
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
