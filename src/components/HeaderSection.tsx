import { AppLogo } from '@/components/AppLogo'

const TITLE = 'Timing Sparks'
const SUBLINE = 'Find and share a meeting time that works across time zones.'

export function HeaderSection() {
  return (
    <header className="group flex w-fit min-w-0 items-center gap-2.5">
      <AppLogo className="size-10" />
      <div className="min-w-0 leading-none">
        <h1 className="text-lg/none font-semibold text-zinc-950">{TITLE}</h1>
        <p className="text-sm/none text-pretty text-zinc-300 transition-colors group-hover:text-zinc-500">
          {SUBLINE}
        </p>
      </div>
    </header>
  )
}
