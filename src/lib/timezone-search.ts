import { getZoneSearchEntries } from '@/lib/zone-meta'

export type ZoneResult = {
  zone: string
  label: string
}

function searchTimezones(query: string): ZoneResult[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (normalizedQuery.length < 2) {
    return []
  }

  const merged = new Map<string, ZoneResult>()

  for (const entry of getZoneSearchEntries()) {
    if (!entry.searchText.includes(normalizedQuery)) {
      continue
    }

    if (!merged.has(entry.zone)) {
      merged.set(entry.zone, { zone: entry.zone, label: entry.label })
    }

    if (merged.size >= 20) {
      break
    }
  }

  return [...merged.values()]
}

export function useTimezoneSearch(query: string): ZoneResult[] {
  return searchTimezones(query)
}
