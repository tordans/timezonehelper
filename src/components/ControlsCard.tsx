import { useAppSearch, useSearchActions } from "../hooks/use-app-search"

export function ControlsCard() {
  const search = useAppSearch()
  const { updateSearchPatch } = useSearchActions()

  return (
    <section className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="grid gap-1 text-sm font-medium text-slate-800">
        Date
        <input
          className="rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm"
          type="date"
          value={search.date}
          onChange={(event) => updateSearchPatch({ date: event.target.value })}
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-800">
        Hour format
        <select
          className="rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm"
          value={search.hourFormat}
          onChange={(event) =>
            updateSearchPatch({ hourFormat: event.target.value as "12" | "24" | "mx" })
          }
        >
          <option value="mx">MX</option>
          <option value="12">12h</option>
          <option value="24">24h</option>
        </select>
      </label>

      <div className="ml-auto grid text-right">
        <span className="text-sm text-slate-700">Selected range</span>
        <strong className="text-base font-semibold text-slate-900">
          {search.start} - {search.end}
        </strong>
        <small className="text-xs text-slate-500">
          Hold Shift while dragging for 5-minute precision.
        </small>
      </div>
    </section>
  )
}
