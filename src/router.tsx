import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import App from '@/App'
import { TanStackAppDevtools } from '@/components/shared/devtools/TanStackAppDevtools'
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
  component: function RootLayout() {
    return (
      <>
        <Outlet />
        <TanStackAppDevtools />
      </>
    )
  },
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
