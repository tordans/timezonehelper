import { XMarkIcon } from '@heroicons/react/16/solid'
import { AppLogo } from '@/components/AppLogo'
import { useIntroCalloutActions, useIntroCalloutDismissed } from '@/state/intro-callout-store'

const TITLE = 'Timezone Helper'
const DESCRIPTION =
  'Compare time zones and pick a meeting time. The URL is shareable, so anyone with the link sees the same zones, date, and range.'

export function HeaderSection() {
  const dismissed = useIntroCalloutDismissed()
  const { dismissIntroCallout } = useIntroCalloutActions()

  if (dismissed) {
    return (
      <div className="flex items-center gap-2.5">
        <AppLogo className="size-7" />
        <h1 className="text-lg/7 font-semibold text-zinc-950">{TITLE}</h1>
      </div>
    )
  }

  return (
    <section className="relative overflow-hidden rounded-lg bg-indigo-50 px-4 py-5 shadow-sm ring-1 ring-indigo-600/10 sm:p-6">
      <div className="flex items-start gap-4 sm:gap-5">
        <AppLogo className="size-16 shrink-0 sm:size-20" />
        <div className="min-w-0 flex-1 pr-8">
          <h1 className="text-2xl/8 font-semibold text-zinc-950 sm:text-xl/8">{TITLE}</h1>
          <p className="mt-2 text-base/6 text-pretty text-indigo-900/70 sm:text-sm/6">
            {DESCRIPTION}
          </p>
        </div>
        <button
          type="button"
          className="relative -m-1.5 cursor-pointer rounded-md p-1.5 text-indigo-600/60 hover:bg-indigo-100 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          aria-label="Dismiss introduction"
          onClick={() => dismissIntroCallout()}
        >
          <span
            className="absolute top-1/2 left-1/2 size-[max(100%,2.75rem)] -translate-x-1/2 -translate-y-1/2 pointer-fine:hidden"
            aria-hidden="true"
          />
          <XMarkIcon className="size-5" />
        </button>
      </div>
    </section>
  )
}
