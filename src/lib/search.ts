import { z } from 'zod'
import { formatMinute, parseMinute, sortZonesByOffset, todayInZone } from './time'

const DEFAULT_ZONES = ['America/New_York', 'Europe/London', 'Asia/Tokyo'] as const

const DEFAULT_HOME = DEFAULT_ZONES[0]
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/** Home-timeline range used until the URL (or the user) supplies a selection. */
export const IMPLICIT_RANGE_START = '10:00'
export const IMPLICIT_RANGE_END = '11:00'

const commaSeparatedZonesSchema = z.preprocess(
  (input) => {
    if (input === undefined || input === null || input === '') {
      return [...DEFAULT_ZONES]
    }

    if (Array.isArray(input)) {
      return input.flatMap((entry) => String(entry).split(','))
    }

    if (typeof input === 'string') {
      return input.split(',')
    }

    return [...DEFAULT_ZONES]
  },
  z
    .array(z.string().trim().min(1))
    .min(1)
    .catch([...DEFAULT_ZONES]),
)

const hourFormatSchema = z.preprocess(
  (value) => {
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value)
    }
    return undefined
  },
  z.enum(['12', '24', 'mx']).default('mx').catch('mx'),
)

const rawSearchSchema = z.object({
  zones: commaSeparatedZonesSchema,
  home: z.string().trim().optional(),
  date: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  hourFormat: hourFormatSchema,
  sort: z.literal('offset').default('offset').catch('offset'),
})

export const appSearchSchema = z
  .preprocess(
    (raw) => (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}),
    rawSearchSchema,
  )
  .transform((value) => {
    const uniqueZones = Array.from(new Set(value.zones.filter(Boolean)))
    const zonesOrDefault = uniqueZones.length > 0 ? uniqueZones : [...DEFAULT_ZONES]
    const homeCandidate = value.home
    const home =
      homeCandidate && zonesOrDefault.includes(homeCandidate)
        ? homeCandidate
        : (zonesOrDefault[0] ?? DEFAULT_HOME)
    const date = value.date && DATE_REGEX.test(value.date) ? value.date : todayInZone(home)
    const startMinute = parseMinute(value.start ?? IMPLICIT_RANGE_START)
    const endMinute = parseMinute(value.end ?? IMPLICIT_RANGE_END)
    const normalizedEnd = Math.max(endMinute, startMinute + 30)
    const zones =
      value.sort === 'offset' ? sortZonesByOffset(zonesOrDefault, home, date) : zonesOrDefault

    return {
      zones,
      home,
      date,
      start: formatMinute(startMinute),
      end: formatMinute(normalizedEnd),
      hourFormat: value.hourFormat,
      sort: value.sort,
    }
  })

export type AppSearch = z.infer<typeof appSearchSchema>

export function normalizeSearch(raw: unknown): AppSearch {
  return appSearchSchema.parse(raw)
}
