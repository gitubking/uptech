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

interface AnneeAcademique {
  id: string
  libelle: string
}

interface Props {
  filieres: Filiere[]
  annees: AnneeAcademique[]
  anneeActive?: AnneeAcademique | null
  onSuccess?: () => void
}

const TYPE_LABELS: Record<string, string> = {
  academique: 'Académique',
  certifiante: 'Certifiante',
  acceleree: 'Accélérée',
}

export function ClasseForm({ filieres, annees, anneeActive, onSuccess }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [typeFormation, setTypeFormation] = useState('')
  const [filiereId, setFiliereId] = useState('')
  const [anneeId, setAnneeId] = useState(anneeActive?.id ?? '')

  const filteredFilieres = typeFormation
    ? filieres.filter(f => f.type_formation === typeFormation)
    : filieres

  const filiereSelectionnee = filieres.find(f => f.id === filiereId)

  function genererCodeEtNom(dateRentree: string) {
    if (!filiereSelectionnee || !dateRentree) return { code: '', nom: '' }
    const d = new Date(dateRentree)
    const annee = d.getFullYear()
    const moisCourt = d.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase().replace('.', '')
    const moisLong = d.toLocaleDateString('fr-FR', { month: 'long' })
    const code = `${filiereSelectionnee.code}-${moisCourt}-${annee}`
    const nom = `${filiereSelectionnee.code} — ${moisLong} - ${annee}`
    return { code, nom }
  }

  function onDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { code, nom } = genererCodeEtNom(e.target.value)
    const form = e.target.form
    const nomInput = form?.querySelector('[name="nom"]') as HTMLInputElement | null
    const codeInput = form?.querySelector('[name="code"]') as HTMLInputElement | null
    if (code && codeInput && !codeInput.dataset.modified) codeInput.value = code
    if (nom && nomInput && !nomInput.dataset.modified) nomInput.value = nom
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsPending(true)
    try {
      const fd = new FormData(e.currentTarget)
      fd.set('filiere_id', filiereId)
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

      {/* Type de formation → Filière */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Type de formation</Label>
          <Select value={typeFormation || 'all'} onValueChange={v => {
            setTypeFormation(v === 'all' ? '' : v)
            setFiliereId('')
          }}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Tous types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              {Object.entries(TYPE_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Filière <span className="text-red-500">*</span></Label>
          <Select value={filiereId || 'none'} onValueChange={v => setFiliereId(v === 'none' ? '' : v)}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sélectionner une filière</SelectItem>
              {filteredFilieres.map(f => (
                <SelectItem key={f.id} value={f.id}>{f.code} — {f.nom}</SelectItem>
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
            onChange={onDateChange}
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
            placeholder="ex: INFO — octobre - 2025"
            className="h-10"
            onInput={e => (e.currentTarget.dataset.modified = 'true')}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Code <span className="text-red-500">*</span></Label>
          <Input
            name="code"
            required
            placeholder="ex: INFO-OCT-2025"
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
          disabled={isPending || !filiereId || !anneeId}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isPending ? 'Création…' : 'Créer la classe'}
        </Button>
      </div>
    </form>
  )
}
