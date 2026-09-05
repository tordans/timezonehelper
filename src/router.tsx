import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router"

import App from "./App"
import { normalizeSearch } from "./lib/search"

const rootRoute = createRootRoute({
  component: function RootLayout() {
    return <Outlet />
  },
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: (search) => normalizeSearch(search),
  component: App,
})

const routeTree = rootRoute.addChildren([indexRoute])

export const router = createRouter({
  routeTree,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
