import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import App from '@/App'
import { Heading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { routerSearch } from '@/lib/router-search'
import { appSearchSchema } from '@/lib/search'

const rootRoute = createRootRoute({
  beforeLoad: ({ location }) => {
    const { pathname, searchStr, hash } = location
    if (pathname.length <= 1 || !pathname.endsWith('/')) return
    const stripped = pathname.replace(/\/+$/, '') || '/'
    throw redirect({
      href: `${stripped}${searchStr}${hash ? `#${hash}` : ''}`,
      replace: true,
    })
  },
  errorComponent: function RootError() {
    return (
      <main className="mx-auto grid min-h-svh max-w-[40rem] place-content-center gap-2 bg-zinc-100 p-6">
        <Heading>Something went wrong</Heading>
        <Text>Reload the page to try again.</Text>
      </main>
    )
  },
  component: Outlet,
})

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: appSearchSchema,
  component: App,
})

const routeTree = rootRoute.addChildren([Route])

export const router = createRouter({
  routeTree,
  trailingSlash: 'never',
  parseSearch: routerSearch.parse,
  stringifySearch: routerSearch.stringify,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
