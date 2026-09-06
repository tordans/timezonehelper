import { getTimeZones } from '@vvo/tzdb'

export type ZoneMeta = {
  zone: string
  city: string
  abbreviation: string
  countryCode: string
  label: string
  searchText: string
}

const metaById = new Map<string, ZoneMeta>()
let searchEntries: ZoneMeta[] | null = null

function lastIanaSegment(iana: string): string {
  return iana.split('/').at(-1)?.replaceAll('_', ' ') ?? iana
}

function cityFromZoneInfo(mainCities: string[], iana: string): string {
  const namedCity = mainCities[0]?.trim()
  if (namedCity) {
    return namedCity
  }

  return lastIanaSegment(iana)
}

function ensureCache() {
  if (searchEntries) {
    return
  }

  const entries: ZoneMeta[] = []

  for (const zoneInfo of getTimeZones({ includeUtc: true })) {
    const city = cityFromZoneInfo(zoneInfo.mainCities, zoneInfo.name)
    const abbreviation = zoneInfo.abbreviation ?? ''
    const entry: ZoneMeta = {
      zone: zoneInfo.name,
      city,
      abbreviation,
      countryCode: zoneInfo.countryCode,
      label: `${city} (${abbreviation}) - ${zoneInfo.name}`,
      searchText: [
        zoneInfo.name,
        zoneInfo.alternativeName,
        abbreviation,
        zoneInfo.group.join(' '),
        zoneInfo.mainCities.join(' '),
        city,
      ]
        .join(' ')
        .toLowerCase(),
    }

    entries.push(entry)
    metaById.set(zoneInfo.name, entry)

    for (const alias of zoneInfo.group) {
      if (!metaById.has(alias)) {
        metaById.set(alias, entry)
      }
    }
  }

  searchEntries = entries
}

export function getZoneMeta(zone: string): ZoneMeta {
  ensureCache()
  return (
    metaById.get(zone) ?? {
      zone,
      city: lastIanaSegment(zone),
      abbreviation: '',
      countryCode: '',
      label: lastIanaSegment(zone),
      searchText: zone.toLowerCase(),
    }
  )
}

export function getZoneSearchEntries(): ZoneMeta[] {
  ensureCache()
  return searchEntries ?? []
}

export function resolveKnownZone(zone: string): string | null {
  ensureCache()
  return metaById.get(zone)?.zone ?? null
}

export function zoneUsesHour12(zone: string): boolean {
  const meta = getZoneMeta(zone)
  if (!meta.countryCode) {
    return false
  }

  try {
    return Boolean(
      new Intl.DateTimeFormat(`und-${meta.countryCode}`, {
        hour: 'numeric',
        timeZone: zone,
      }).resolvedOptions().hour12,
    )
  } catch {
    return false
  }
}
