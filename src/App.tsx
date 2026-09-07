import { ControlsCard } from '@/components/ControlsCard'
import { HeaderSection } from '@/components/HeaderSection'
import { LegalFooter } from '@/components/LegalFooter'
import { SelectedRangeCard } from '@/components/SelectedRangeCard'
import { FadeInOnMount, sectionMountDelay } from '@/components/shared/motion'
import { TimezoneTableGrid } from '@/components/TimezoneTableGrid'
import { useBrowserHomeZone } from '@/hooks/use-browser-home-zone'
import { useClockTick } from '@/hooks/use-clock-tick'

function App() {
  useClockTick()
  useBrowserHomeZone()

  return (
    <main className="min-h-svh overflow-x-clip bg-zinc-100">
      <div className="mx-auto grid w-full max-w-6xl min-w-0 gap-6 px-4 py-8 sm:px-6">
        <FadeInOnMount delay={sectionMountDelay(0)}>
          <HeaderSection />
        </FadeInOnMount>
        <FadeInOnMount delay={sectionMountDelay(1)}>
          <ControlsCard />
        </FadeInOnMount>
        <FadeInOnMount delay={sectionMountDelay(2)}>
          <TimezoneTableGrid />
        </FadeInOnMount>
        <FadeInOnMount delay={sectionMountDelay(3)}>
          <SelectedRangeCard />
        </FadeInOnMount>
        <LegalFooter />
      </div>
    </main>
  )
}

export default App
