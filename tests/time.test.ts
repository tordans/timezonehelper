import { describe, expect, test } from "bun:test"

import { normalizeSearch } from "../src/lib/search"
import { formatMinute, parseMinute, sortZonesByOffset } from "../src/lib/time"

describe("search normalization", () => {
  test("keeps readable URL schema defaults stable", () => {
    const normalized = normalizeSearch({})

    expect(normalized.hourFormat).toBe("mx")
    expect(normalized.sort).toBe("offset")
    expect(normalized.zones.length).toBeGreaterThan(0)
    expect(normalized.home).toBe(normalized.zones[0])
  })

  test("normalizes malformed ranges", () => {
    const normalized = normalizeSearch({
      zones: "UTC,Europe/London",
      home: "UTC",
      start: "18:00",
      end: "05:00",
    })

    expect(parseMinute(normalized.end)).toBeGreaterThan(parseMinute(normalized.start))
  })
})

describe("time helpers", () => {
  test("formats and parses minute values", () => {
    expect(formatMinute(9 * 60 + 30)).toBe("09:30")
    expect(parseMinute("09:30")).toBe(9 * 60 + 30)
  })

  test("sorts zones with home first", () => {
    const sorted = sortZonesByOffset(
      ["Asia/Tokyo", "Europe/London", "America/New_York"],
      "Europe/London",
      "2026-04-28",
    )

    expect(sorted[0]).toBe("Europe/London")
  })
})
