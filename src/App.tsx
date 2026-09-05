import { ControlsCard } from "./components/ControlsCard"
import { HeaderSection } from "./components/HeaderSection"
import { TimezoneTableGrid } from "./components/TimezoneTableGrid"
import { ZoneSearchCard } from "./components/ZoneSearchCard"
import { useAutosortSync } from "./hooks/use-autosort-sync"
import { useClockTick } from "./hooks/use-clock-tick"

function App() {
  useClockTick()
  useAutosortSync()

  return (
    <main className="mx-auto grid min-h-svh max-w-[1240px] gap-4 bg-slate-50 p-4 text-slate-900">
      <HeaderSection />
      <ControlsCard />
      <ZoneSearchCard />
      <TimezoneTableGrid />
    </main>
  )
}

export default App
