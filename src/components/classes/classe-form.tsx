'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle } from 'lucide-react'
import { createClasse } from '@/app/actions/classes'

interface Filiere {
  id: string
  nom: string
  code: string
  type_formation?: string | null
}

interface Niveau {
  id: string
  nom: string
  ordre: number
  filiere_id: string
}

interface AnneeAcademique {
  id: string
  libelle: string
}

interface Props {
  filieres: Filiere[]
  niveaux: Niveau[]
  annees: AnneeAcademique[]
  anneeActive?: AnneeAcademique | null
  onSuccess?: () => void
}

const TYPE_LABELS: Record<string, string> = {
  academique: 'Académique',
  certifiante: 'Certifiante',
  acceleree: 'Accélérée',
}

export function ClasseForm({ filieres, niveaux, annees, anneeActive, onSuccess }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filiereId, setFiliereId] = useState('')
  const [niveauId, setNiveauId] = useState('')
  const [anneeId, setAnneeId] = useState(anneeActive?.id ?? '')

  const niveauxFiltres = niveaux.filter(n => n.filiere_id === filiereId)
  const filiereSelectionnee = filieres.find(f => f.id === filiereId)
  const niveauSelectionne = niveaux.find(n => n.id === niveauId)

  // Auto-générer le code
  function genererCode(dateRentree: string) {
    if (!filiereSelectionnee || !niveauSelectionne || !dateRentree) return ''
    const [annee, mois] = dateRentree.split('-')
    const moisCourt = new Date(dateRentree).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase().replace('.', '')
    return `${filiereSelectionnee.code}-N${niveauSelectionne.ordre}-${moisCourt}${annee?.slice(2)}`
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsPending(true)
    try {
      const fd = new FormData(e.currentTarget)
      fd.set('filiere_id', filiereId)
      fd.set('niveau_id', niveauId)
      fd.set('annee_academique_id', anneeId)
      const result = await createClasse(fd)
      if (result.error) {
        setError(result.error)
      } else {
        onSuccess ? onSuccess() : router.push('/classes')
        router.refresh()
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Filière + Niveau */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Filière <span className="text-red-500">*</span></Label>
          <Select value={filiereId || 'none'} onValueChange={v => { setFiliereId(v === 'none' ? '' : v); setNiveauId('') }}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sélectionner une filière</SelectItem>
              {filieres.map(f => (
                <SelectItem key={f.id} value={f.id}>
                  {f.code} — {f.nom}
                  {f.type_formation && <span className="ml-1 text-gray-400 text-xs">({TYPE_LABELS[f.type_formation] ?? f.type_formation})</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Niveau <span className="text-red-500">*</span></Label>
          <Select value={niveauId || 'none'} onValueChange={v => setNiveauId(v === 'none' ? '' : v)} disabled={!filiereId}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sélectionner un niveau</SelectItem>
              {niveauxFiltres.map(n => (
                <SelectItem key={n.id} value={n.id}>{n.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Année académique + Date de rentrée */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Année académique <span className="text-red-500">*</span></Label>
          <Select value={anneeId || 'none'} onValueChange={v => setAnneeId(v === 'none' ? '' : v)}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sélectionner une année</SelectItem>
              {annees.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.libelle}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Date de rentrée <span className="text-red-500">*</span></Label>
          <Input
            name="date_rentree"
            type="date"
            required
            className="h-10"
            onChange={e => {
              const code = genererCode(e.target.value)
              const nomInput = e.target.form?.querySelector('[name="nom"]') as HTMLInputElement
              const codeInput = e.target.form?.querySelector('[name="code"]') as HTMLInputElement
              if (code && codeInput && !codeInput.dataset.modified) codeInput.value = code
              if (filiereSelectionnee && niveauSelectionne && nomInput && !nomInput.dataset.modified) {
                const d = new Date(e.target.value)
                const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                nomInput.value = `${filiereSelectionnee.code} ${niveauSelectionne.nom} — ${label}`
              }
            }}
          />
        </div>
      </div>

      {/* Nom + Code */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Nom de la classe <span className="text-red-500">*</span></Label>
          <Input
            name="nom"
            required
            placeholder="ex: BTS1 Informatique — octobre 2025"
            className="h-10"
            onInput={e => (e.currentTarget.dataset.modified = 'true')}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Code <span className="text-red-500">*</span></Label>
          <Input
            name="code"
            required
            placeholder="ex: INFO-N1-OCT25"
            className="h-10 font-mono"
            onInput={e => (e.currentTarget.dataset.modified = 'true')}
          />
          <p className="text-xs text-gray-400">Généré automatiquement, modifiable</p>
        </div>
      </div>

      {/* Capacité */}
      <div className="space-y-1.5 max-w-[180px]">
        <Label>Capacité (étudiants)</Label>
        <Input name="capacite" type="number" min="1" max="200" defaultValue="30" className="h-10" />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => onSuccess ? onSuccess() : router.push('/classes')}>
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isPending || !filiereId || !niveauId || !anneeId}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isPending ? 'Création…' : 'Créer la classe'}
        </Button>
      </div>
    </form>
  )
}
