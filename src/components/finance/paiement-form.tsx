'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CreditCard, User } from 'lucide-react'

interface Etudiant {
  id: string
  matricule: string
  nom: string
  prenom: string
  annee_academique_id: string
  filiere: { nom: string; code: string } | null
  niveau: { nom: string } | null
}

interface AnneeAcademique {
  id: string
  libelle: string
}

interface Props {
  etudiants: Etudiant[]
  anneeActive: AnneeAcademique | null
}

const TYPE_OPTIONS = [
  { value: 'inscription', label: 'Frais d\'inscription' },
  { value: 'scolarite', label: 'Frais de scolarité' },
  { value: 'rattrapage', label: 'Frais de rattrapage' },
  { value: 'autre', label: 'Autre paiement' },
]

const MODE_OPTIONS = [
  { value: 'especes', label: 'Espèces' },
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'cheque', label: 'Chèque' },
]

export function PaiementForm({ etudiants, anneeActive }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [etudiantId, setEtudiantId] = useState('')
  const [type, setType] = useState('scolarite')
  const [mode, setMode] = useState('especes')
  const [anneeId, setAnneeId] = useState(anneeActive?.id ?? '')

  const selectedEtudiant = etudiants.find((e) => e.id === etudiantId)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsPending(true)
    try {
      const formData = new FormData(e.currentTarget)
      formData.set('type', type)
      formData.set('mode_paiement', mode)
      formData.set('annee_academique_id', anneeId)

      const res = await fetch('/api/finance', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        router.push('/finance')
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Hidden fields for controlled selects */}
      <input type="hidden" name="etudiant_id" value={etudiantId} />

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Étudiant */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            Étudiant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Étudiant <span className="text-red-500">*</span></Label>
            <Select value={etudiantId || 'none'} onValueChange={(v) => setEtudiantId(v === 'none' ? '' : v)} required>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Sélectionner un étudiant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sélectionner un étudiant</SelectItem>
                {etudiants.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.matricule} — {e.nom} {e.prenom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedEtudiant && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm">
              <p className="font-medium text-blue-900">{selectedEtudiant.nom} {selectedEtudiant.prenom}</p>
              <p className="text-blue-700 text-xs mt-0.5">
                {selectedEtudiant.filiere?.code} — {selectedEtudiant.niveau?.nom}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paiement details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-green-600" />
            Détails du paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type de paiement <span className="text-red-500">*</span></Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Mode de paiement</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODE_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Montant total dû (FC) <span className="text-red-500">*</span></Label>
              <Input
                name="montant_total"
                type="number"
                min="0"
                step="0.01"
                placeholder="ex: 150000"
                required
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Montant versé (FC) <span className="text-red-500">*</span></Label>
              <Input
                name="montant"
                type="number"
                min="0"
                step="0.01"
                placeholder="ex: 75000"
                required
                className="h-10"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Observations</Label>
            <Textarea
              name="notes"
              placeholder="Remarques, motif du paiement partiel..."
              className="resize-none"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={() => router.push('/finance')}>
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isPending || !etudiantId}
          className="bg-green-600 hover:bg-green-700 text-white gap-2"
        >
          <CreditCard className="h-4 w-4" />
          {isPending ? 'Enregistrement…' : 'Enregistrer le paiement'}
        </Button>
      </div>
    </form>
  )
}
