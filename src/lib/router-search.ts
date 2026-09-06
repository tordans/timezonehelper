import { parseSearchWith, stringifySearchWith } from '@tanstack/react-router'
import { rememberTimeRangeFromUrl, shouldSerializeTimeRange } from '@/state/ui-store'

const parseSearch = parseSearchWith(JSON.parse)
const stringifySearchDefault = stringifySearchWith(JSON.stringify)

/** Decode safe query-value characters after default stringify. */
const makeSearchPretty = (searchString: string) =>
  searchString
    .replaceAll('%22', '"')
    .replaceAll('%2C', ',')
    .replaceAll('%27', "'")
    .replaceAll('%28', '(')
    .replaceAll('%29', ')')
    .replaceAll('%3A', ':')
    .replaceAll('%3B', ';')
    .replaceAll('%5B', '[')
    .replaceAll('%5D', ']')
    .replaceAll('%7B', '{')
    .replaceAll('%7D', '}')
    .replaceAll('%2F', '/')

function compactZonesForUrl(search: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(search.zones)) {
    return search
  }

  return {
    ...search,
    zones: search.zones.join(','),
  }
}

function omitUncommittedTimeRange(search: Record<string, unknown>): Record<string, unknown> {
  if (shouldSerializeTimeRange()) {
    return search
  }

  const next = { ...search }
  delete next.start
  delete next.end
  return next
}

export const routerSearch = {
  parse: (searchString: string) => {
    const parsed = parseSearch(searchString)
    rememberTimeRangeFromUrl(parsed)
    return parsed
  },
  stringify: (search: Record<string, unknown>) =>
    makeSearchPretty(stringifySearchDefault(compactZonesForUrl(omitUncommittedTimeRange(search)))),
}
