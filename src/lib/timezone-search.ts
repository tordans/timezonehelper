import { useQuery } from '@tanstack/react-query'

export type ZoneResult = {
  zone: string
  label: string
}

async function searchTimezones(query: string): Promise<ZoneResult[]> {
  const { getTimeZones } = await import('@vvo/tzdb')

  const byZone = getTimeZones()
    .map((zoneInfo) => {
      const city = zoneInfo.mainCities[0] ?? zoneInfo.name
      const abbreviation = zoneInfo.abbreviation ?? ''
      const searchText = [
        zoneInfo.name,
        zoneInfo.alternativeName,
        abbreviation,
        zoneInfo.group.join(' '),
        zoneInfo.mainCities.join(' '),
        city,
      ]
        .join(' ')
        .toLowerCase()

      return {
        zone: zoneInfo.name,
        label: `${city} (${abbreviation}) - ${zoneInfo.name}`,
        searchText,
      }
    })
    .filter((entry) => entry.searchText.includes(query))
    .slice(0, 20)
    .map((entry) => ({ zone: entry.zone, label: entry.label }))

  const merged = new Map<string, ZoneResult>()

  for (const item of byZone) {
    if (!merged.has(item.zone)) {
      merged.set(item.zone, item)
    }
  }

  return [...merged.values()].slice(0, 20)
}

export function useTimezoneSearch(query: string): ZoneResult[] {
  const normalizedQuery = query.trim().toLowerCase()
  const { data = [] } = useQuery({
    queryKey: ['timezone-search', normalizedQuery],
    queryFn: async () => searchTimezones(normalizedQuery),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    enabled: normalizedQuery.length >= 2,
  })

  return data
}
