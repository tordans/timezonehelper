import { z } from "zod"

import { formatMinute, parseMinute, todayInZone } from "./time"

export const DEFAULT_ZONES = ["America/New_York", "Europe/London", "Asia/Tokyo"]

export type AppSearch = {
  zones: string[]
  home: string
  date: string
  start: string
  end: string
  hourFormat: "12" | "24" | "mx"
  sort: "offset"
}

const commaListSchema = z.preprocess((input) => {
  if (Array.isArray(input)) {
    return input.flatMap((entry) => String(entry).split(","))
  }

  if (typeof input === "string") {
    return input.split(",")
  }

  return undefined
}, z.array(z.string().trim()).optional())

const rawSearchSchema = z.object({
  zones: commaListSchema,
  home: z.string().trim().optional(),
  date: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  hourFormat: z.enum(["12", "24", "mx"]).optional(),
  sort: z.literal("offset").optional(),
})

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

export function normalizeSearch(raw: unknown): AppSearch {
  const parsed = rawSearchSchema.safeParse(raw)
  const value = parsed.success ? parsed.data : {}
  const candidateZones = (value.zones ?? DEFAULT_ZONES).filter(Boolean)
  const zones = Array.from(new Set(candidateZones))
  const fallbackHome = zones[0] ?? DEFAULT_ZONES[0]
  const home = zones.includes(value.home ?? "") ? (value.home as string) : fallbackHome
  const date = value.date && dateRegex.test(value.date) ? value.date : todayInZone(home)

  const startMinute = parseMinute(value.start ?? "09:00")
  const endMinute = parseMinute(value.end ?? "10:00")
  const normalizedEnd = Math.max(endMinute, startMinute + 30)

  return {
    zones,
    home,
    date,
    start: formatMinute(startMinute),
    end: formatMinute(normalizedEnd),
    hourFormat: value.hourFormat ?? "mx",
    sort: value.sort ?? "offset",
  }
}
