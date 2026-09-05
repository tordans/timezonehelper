import { useSearchActions } from "../hooks/use-app-search"
import { useTimezoneSearch } from "../lib/timezone-search"
import { useUiStore } from "../state/ui-store"

export function ZoneSearchCard() {
  const query = useUiStore((state) => state.query)
  const setQuery = useUiStore((state) => state.setQuery)
  const results = useTimezoneSearch(query)
  const { addZone } = useSearchActions()

  function addZoneAndResetQuery(zone: string) {
    addZone(zone)
    setQuery("")
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="grid w-full gap-1 text-sm font-medium text-slate-800">
        Add timezone
        <input
          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm"
          type="text"
          value={query}
          placeholder="City, abbreviation, or IANA zone"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      {query.trim().length > 1 && (
        <ul className="mt-3 grid max-h-64 gap-1.5 overflow-auto">
          {results.length === 0 && <li className="text-slate-500 italic">No matches found</li>}
          {results.map((result) => (
            <li key={result.zone}>
              <button
                className="flex w-full justify-between gap-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm transition hover:bg-indigo-50"
                type="button"
                onClick={() => addZoneAndResetQuery(result.zone)}
              >
                <span>{result.label}</span>
                <code className="text-xs text-slate-500">{result.zone}</code>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
