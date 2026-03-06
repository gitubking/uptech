'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ClasseForm } from './classe-form'

interface Props {
  filieres: { id: string; nom: string; code: string; type_formation?: string | null }[]
  niveaux: { id: string; nom: string; ordre: number; filiere_id: string }[]
  annees: { id: string; libelle: string }[]
  anneeActive?: { id: string; libelle: string } | null
}

export function ClasseCreateDialog({ filieres, niveaux, annees, anneeActive }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
        <Plus className="h-4 w-4" />
        Nouvelle classe
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle classe</DialogTitle>
          </DialogHeader>
          <ClasseForm
            filieres={filieres}
            niveaux={niveaux}
            annees={annees}
            anneeActive={anneeActive}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
