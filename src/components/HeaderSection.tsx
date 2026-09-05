export function HeaderSection() {
  return (
    <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Timezone Helper</h1>
      <p className="mt-2 text-sm text-slate-600">
        URL state is the source of truth. Add zones, pick a date, and drag a meeting range.
      </p>
    </header>
  )
}
