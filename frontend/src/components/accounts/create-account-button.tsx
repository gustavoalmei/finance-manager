import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { AccountFormDialog } from './account-form-dialog'

export const CreateAccountButton = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Nova conta
      </Button>
      <AccountFormDialog open={open} onOpenChange={setOpen} onSuccess={() => setOpen(false)} />
    </>
  )
}
