import { getZoneMeta, getZoneSearchEntries } from '@/lib/zone-meta'
import { useRecentZones } from '@/state/recent-zones-store'

export type ZoneResult = {
  zone: string
  label: string
}

export type GroupedZoneResults = {
  lastUsed: ZoneResult[]
  all: ZoneResult[]
}

function toZoneResult(zone: string): ZoneResult {
  const meta = getZoneMeta(zone)
  return { zone: meta.zone, label: meta.label }
}

function matchesQuery(searchText: string, normalizedQuery: string) {
  return searchText.includes(normalizedQuery)
}

export function searchTimezones(query: string, lastUsedZones: string[] = []): GroupedZoneResults {
  const normalizedQuery = query.trim().toLowerCase()

  if (normalizedQuery.length === 0) {
    return {
      lastUsed: lastUsedZones.map(toZoneResult),
      all: [],
    }
  }

  if (normalizedQuery.length < 2) {
    return { lastUsed: [], all: [] }
  }

  const lastUsed = lastUsedZones.flatMap((zone) => {
    const meta = getZoneMeta(zone)
    if (!matchesQuery(meta.searchText, normalizedQuery)) {
      return []
    }

    return [{ zone: meta.zone, label: meta.label }]
  })

  const lastUsedIds = new Set(lastUsedZones.map((zone) => getZoneMeta(zone).zone))
  const merged = new Map<string, ZoneResult>()

  for (const entry of getZoneSearchEntries()) {
    if (!matchesQuery(entry.searchText, normalizedQuery)) {
      continue
    }

    if (lastUsedIds.has(entry.zone) || merged.has(entry.zone)) {
      continue
    }

    merged.set(entry.zone, { zone: entry.zone, label: entry.label })
    if (merged.size >= 20) {
      break
    }
  }

  return { lastUsed, all: [...merged.values()] }
}

export function useTimezoneSearch(query: string) {
  const lastUsedZones = useRecentZones()
  return searchTimezones(query, lastUsedZones)
}
