import { ControlsCard } from '@/components/ControlsCard'
import { HeaderSection } from '@/components/HeaderSection'
import { FadeInOnMount, sectionMountDelay } from '@/components/shared/motion'
import { TimezoneTableGrid } from '@/components/TimezoneTableGrid'
import { ZoneSearchCard } from '@/components/ZoneSearchCard'
import { useClockTick } from '@/hooks/use-clock-tick'

function App() {
  useClockTick()

  return (
    <main className="mx-auto grid min-h-svh max-w-[1240px] gap-4 bg-slate-50 p-4 text-slate-900">
      <FadeInOnMount delay={sectionMountDelay(0)}>
        <HeaderSection />
      </FadeInOnMount>
      <FadeInOnMount delay={sectionMountDelay(1)}>
        <ControlsCard />
      </FadeInOnMount>
      <FadeInOnMount delay={sectionMountDelay(2)}>
        <ZoneSearchCard />
      </FadeInOnMount>
      <FadeInOnMount delay={sectionMountDelay(3)}>
        <TimezoneTableGrid />
      </FadeInOnMount>
    </main>
  )
}

export default App
