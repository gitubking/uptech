'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { School, AlertCircle } from 'lucide-react'
import { addMatiereAuProgramme } from '@/app/actions/matieres'

interface Props {
  matiereId: string
  matiereNom: string
  filieres: { id: string; nom: string; code: string }[]
  enseignants: { id: string; nom: string; prenom: string }[]
  annees: { id: string; libelle: string }[]
  anneeActive: { id: string; libelle: string } | null
}

export function ProgrammeAjoutDialog({ matiereId, matiereNom, filieres, enseignants, annees, anneeActive }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filiereId, setFiliereId] = useState('')
  const [semestre, setSemestre] = useState('1')
  const [anneeId, setAnneeId] = useState(anneeActive?.id ?? '')
  const [enseignantId, setEnseignantId] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsPending(true)
    try {
      const fd = new FormData(e.currentTarget)
      fd.set('matiere_id', matiereId)
      fd.set('filiere_id', filiereId)
      fd.set('semestre', semestre)
      fd.set('annee_academique_id', anneeId)
      fd.set('enseignant_id', enseignantId)
      const result = await addMatiereAuProgramme(fd)
      if (result.error) { setError(result.error); return }
      setOpen(false)
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-sm">
        <School className="h-4 w-4" />
        Affecter à une filière
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Affecter au programme</DialogTitle>
            <p className="text-xs text-gray-500">{matiereNom}</p>
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
                <Label>Filière <span className="text-red-500">*</span></Label>
                <Select value={filiereId || 'none'} onValueChange={v => setFiliereId(v === 'none' ? '' : v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sélectionner</SelectItem>
                    {filieres.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.code} — {f.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Semestre <span className="text-red-500">*</span></Label>
                <Select value={semestre} onValueChange={setSemestre}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semestre 1</SelectItem>
                    <SelectItem value="2">Semestre 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Année académique <span className="text-red-500">*</span></Label>
              <Select value={anneeId || 'none'} onValueChange={v => setAnneeId(v === 'none' ? '' : v)}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sélectionner</SelectItem>
                  {annees.map(a => <SelectItem key={a.id} value={a.id}>{a.libelle}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Coefficient</Label>
                <Input name="coefficient" type="number" min="0.5" max="10" step="0.5" defaultValue="1" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Crédits</Label>
                <Input name="credit" type="number" min="0" max="10" defaultValue="0" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>V.H (h)</Label>
                <Input name="volume_horaire" type="number" min="0" defaultValue="0" className="h-10" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Enseignant</Label>
              <Select value={enseignantId || 'none'} onValueChange={v => setEnseignantId(v === 'none' ? '' : v)}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Non assigné" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non assigné</SelectItem>
                  {enseignants.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.nom} {e.prenom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button
                type="submit"
                disabled={isPending || !filiereId || !anneeId}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isPending ? 'Ajout…' : 'Ajouter au programme'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
