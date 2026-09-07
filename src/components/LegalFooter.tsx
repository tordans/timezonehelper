import * as Headless from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/16/solid'
import { useEffect } from 'react'
import { useAppSearch, useSearchActions } from '@/hooks/use-app-search'
import { useUiMotion } from '@/hooks/use-ui-motion'
import { applyLegalIndexing } from '@/lib/legal-indexing'

const GITHUB_PRIVACY_HREF =
  'https://docs.github.com/site-policy/privacy-policies/github-privacy-statement'
const GITHUB_REPO_HREF = 'https://github.com/tordans/timezonehelper'

export function LegalFooter() {
  const search = useAppSearch()
  const { updateSearchPatch } = useSearchActions()
  const { prefersReducedMotion } = useUiMotion()
  const isOpen = search.legal === true

  useEffect(
    function scrollLegalSectionIntoView() {
      if (!isOpen) {
        return
      }

      const behavior: ScrollBehavior = prefersReducedMotion ? 'auto' : 'smooth'

      function scrollFooter() {
        document.getElementById('legal')?.scrollIntoView({
          block: 'start',
          behavior,
        })
      }

      const frameId = window.requestAnimationFrame(function scrollFooterAfterPaint() {
        scrollFooter()
      })
      const timeoutId = window.setTimeout(scrollFooter, 50)

      return function cancelScrollLegalSection() {
        window.cancelAnimationFrame(frameId)
        window.clearTimeout(timeoutId)
      }
    },
    [isOpen, prefersReducedMotion],
  )

  useEffect(
    function syncLegalIndexingHints() {
      applyLegalIndexing(isOpen, window.location.href)
    },
    [isOpen, search],
  )

  function toggleLegal() {
    updateSearchPatch({ legal: isOpen ? undefined : true }, { replace: false })
  }

  return (
    <footer className="pt-10" id="legal" lang="de">
      <Headless.Disclosure defaultOpen={isOpen} key={isOpen ? 'open' : 'closed'}>
        <Headless.DisclosureButton
          className="group relative inline-flex items-center gap-1 text-xs/5 text-zinc-400 hover:text-zinc-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
          onClick={toggleLegal}
        >
          <span
            className="absolute top-1/2 left-1/2 size-[max(100%,2.75rem)] -translate-x-1/2 -translate-y-1/2 pointer-fine:hidden"
            aria-hidden="true"
          />
          Datenschutz &amp; Impressum
          <ChevronDownIcon className="size-3.5 transition group-data-open:rotate-180" />
        </Headless.DisclosureButton>
        <Headless.DisclosurePanel
          className="prose prose-sm mt-4 max-w-xl text-zinc-500 prose-zinc prose-headings:font-medium prose-headings:text-zinc-600 prose-a:font-normal prose-a:text-zinc-600 prose-a:underline prose-a:decoration-zinc-400/80 prose-a:underline-offset-2 hover:prose-a:text-zinc-800 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none"
          data-nosnippet
        >
          <h2>Datenschutz</h2>
          <p>
            Bei der Nutzung dieser Website werden von uns keine personenbezogenen Daten erfasst oder
            gespeichert. Es gibt kein Webtracking und keine Cookies von uns.
          </p>
          <p>
            Die Website speichert lokal im Browser (<code>localStorage</code>), ob der
            Einführungshinweis geschlossen wurde. Dieser Wert wird nicht an einen Server gesendet.
          </p>
          <p>
            Die Zeitzone des Browsers wird nur lokal gelesen, um die Startansicht vorzuschlagen.
          </p>
          <p>
            Diese Website wird auf GitHub Pages gehostet. Beim Aufruf werden IP-Adresse und ggf.
            Browserinformationen an GitHub übermittelt. Verarbeitung:{' '}
            <a href={GITHUB_PRIVACY_HREF} rel="noreferrer" target="_blank">
              GitHub Privacy Statement
            </a>
            . Anbieter: GitHub Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA.
          </p>
          <h2>Impressum</h2>
          <p>
            Diese Website ist ein privates Hobbyprojekt von Tobias Jordans, Böhmische Straße 54,
            12055 Berlin, <a href="mailto:t@tobiasjordans.de">t@tobiasjordans.de</a>.
          </p>
          <h2>GitHub</h2>
          <p>
            Der Quellcode dieser Website ist öffentlich auf{' '}
            <a href={GITHUB_REPO_HREF} rel="noreferrer" target="_blank">
              GitHub
            </a>
            .
          </p>
          <h2>Credits</h2>
          <p>
            Wer ein ähnliches, seit Jahren bewährtes Tool sucht:{' '}
            <a href="https://www.worldtimebuddy.com/" rel="noreferrer" target="_blank">
              World Time Buddy
            </a>
            .
          </p>
          <p>Vielen Dank an diese Open-Source-Projekte:</p>
          <ul>
            <li>
              <a href="https://tailwindcss.com/" rel="noreferrer" target="_blank">
                Tailwind CSS
              </a>
            </li>
            <li>
              <a href="https://tanstack.com/" rel="noreferrer" target="_blank">
                TanStack
              </a>
            </li>
            <li>
              <a href="https://date-fns.org/" rel="noreferrer" target="_blank">
                date-fns
              </a>
            </li>
            <li>
              <a href="https://heroicons.com/" rel="noreferrer" target="_blank">
                Heroicons
              </a>
            </li>
            <li>
              <a href="https://rsms.me/inter/" rel="noreferrer" target="_blank">
                Inter
              </a>{' '}
              via Fontsource
            </li>
          </ul>
        </Headless.DisclosurePanel>
      </Headless.Disclosure>
    </footer>
  )
}
