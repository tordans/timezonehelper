export function HeaderSection() {
  return (
    <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Timezone Helper</h1>
      <p className="mt-2 text-sm text-slate-600">
        Compare time zones at a glance and pick a meeting time. The URL is shareable, so anyone with
        the link sees the same zones, date, and range.
      </p>
    </header>
  )
}
