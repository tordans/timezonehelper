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
  errorComponent: function RootError() {
    return (
      <main className="mx-auto grid min-h-svh max-w-[40rem] place-content-center gap-2 p-6 text-slate-900">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-slate-600">Reload the page to try again.</p>
      </main>
    )
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
