'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, AlertCircle } from 'lucide-react'
import { createMatiere } from '@/app/actions/matieres'

export function MatiereCreateDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsPending(true)
    try {
      const fd = new FormData(e.currentTarget)
      const result = await createMatiere(fd)
      if (result.error) { setError(result.error); return }
      setOpen(false)
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
        <Plus className="h-4 w-4" />
        Nouvelle matière
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une matière au catalogue</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Code <span className="text-red-500">*</span></Label>
                <Input
                  name="code"
                  required
                  placeholder="ex: MATH, INFO"
                  className="h-10 font-mono uppercase"
                  onInput={e => { e.currentTarget.value = e.currentTarget.value.toUpperCase() }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nom <span className="text-red-500">*</span></Label>
                <Input name="nom" required placeholder="ex: Mathématiques" className="h-10" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                name="description"
                placeholder="Description optionnelle de la matière…"
                className="resize-none"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isPending ? 'Création…' : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
