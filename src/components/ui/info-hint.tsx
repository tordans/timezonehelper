import { InformationCircleIcon } from '@heroicons/react/16/solid'
import { useState } from 'react'
import { Button } from '@/components/catalyst/button'
import { Dialog, DialogActions, DialogDescription, DialogTitle } from '@/components/catalyst/dialog'
import { Tooltip } from '@/components/ui/tooltip'
import { usePrefersFineHover } from '@/hooks/use-prefers-fine-hover'

type InfoHintProps = {
  label: string
  children: string
}

export function InfoHint({ label, children }: InfoHintProps) {
  const prefersFineHover = usePrefersFineHover()
  const [dialogOpen, setDialogOpen] = useState(false)
  const ariaLabel = `About ${label}`

  const button = (
    <Button
      plain
      type="button"
      className="cursor-help!"
      aria-label={ariaLabel}
      onClick={prefersFineHover ? undefined : () => setDialogOpen(true)}
    >
      <InformationCircleIcon data-slot="icon" />
    </Button>
  )

  if (prefersFineHover) {
    return <Tooltip content={children}>{button}</Tooltip>
  }

  return (
    <>
      {button}
      <Dialog open={dialogOpen} onClose={setDialogOpen} size="sm">
        <DialogTitle>{label}</DialogTitle>
        <DialogDescription>{children}</DialogDescription>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
