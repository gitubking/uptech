'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Trash2, CheckCircle, AlertCircle } from 'lucide-react'

interface Props {
  studentId: string
  statut: string
  anneeAcademiqueId: string
  tarif?: { frais_inscription: number; mensualite: number; nb_mensualites: number } | null
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('fr-SN').format(n) + ' FCFA'
}

const MODES = [
  { value: 'especes', label: 'Espèces' },
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'cheque', label: 'Chèque' },
]

export function StudentActions({ studentId, statut, anneeAcademiqueId, tarif }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'delete' | 'activate' | null>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Frais d'inscription
  const [montantInscription, setMontantInscription] = useState('')
  const [modeInscription, setModeInscription] = useState('especes')

  // Versement scolarité
  const [versementType, setVersementType] = useState<'none' | 'mensualite' | 'avance'>('none')
  const [montantVersement, setMontantVersement] = useState('')
  const [modeVersement, setModeVersement] = useState('especes')

  const totalScolarite = tarif ? tarif.mensualite * tarif.nb_mensualites : 0

  function openDialog() {
    setMontantInscription(tarif ? String(tarif.frais_inscription) : '0')
    setModeInscription('especes')
    setVersementType('none')
    setMontantVersement('')
    setModeVersement('especes')
    setError(null)
    setOpen(true)
  }

  function onVersementTypeChange(v: 'none' | 'mensualite' | 'avance') {
    setVersementType(v)
    if (v === 'mensualite') setMontantVersement(tarif ? String(tarif.mensualite) : '')
    else if (v === 'avance') setMontantVersement('')
    else setMontantVersement('')
  }

  async function handleDelete() {
    if (!confirm('Supprimer cet étudiant définitivement ?')) return
    setLoading('delete')
    try {
      const res = await fetch(`/api/students?id=${studentId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.error) router.push('/students')
    } finally {
      setLoading(null)
    }
  }

  async function postPaiement(type: string, montant: number, montantTotal: number, mode: string) {
    const fd = new FormData()
    fd.set('etudiant_id', studentId)
    fd.set('annee_academique_id', anneeAcademiqueId)
    fd.set('type', type)
    fd.set('montant', String(montant))
    fd.set('montant_total', String(montantTotal))
    fd.set('mode_paiement', mode)
    const res = await fetch('/api/finance', { method: 'POST', body: fd })
    return res.json()
  }

  async function handleConfirm() {
    setError(null)
    setLoading('activate')
    try {
      const fraisInscription = tarif?.frais_inscription ?? 0
      const montantInsc = parseFloat(montantInscription) || 0

      // 1. Paiement inscription
      if (fraisInscription > 0) {
        const d = await postPaiement('inscription', montantInsc, fraisInscription, modeInscription)
        if (d.error) { setError(d.error); return }
      }

      // 2. Versement scolarité — redistribué en mensualités individuelles
      if (versementType !== 'none' && tarif && tarif.mensualite > 0) {
        let restant = parseFloat(montantVersement) || 0
        while (restant > 0) {
          const tranche = Math.min(restant, tarif.mensualite)
          const d = await postPaiement('scolarite', tranche, tarif.mensualite, modeVersement)
          if (d.error) { setError(d.error); return }
          restant = Math.round((restant - tranche) * 100) / 100
          if (tranche < tarif.mensualite) break // paiement partiel → arrêter
        }
      }

      // 3. Changer statut → inscrit
      const res = await fetch(`/api/students?id=${studentId}&status=inscrit`, { method: 'PUT' })
      const data = await res.json()
      if (data.error) { setError(data.error); return }

      setOpen(false)
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  const montantInscriptionNum = parseFloat(montantInscription) || 0
  const fraisInscription = tarif?.frais_inscription ?? 0

  return (
    <>
      <Button
        variant="outline" size="sm"
        className="gap-2 text-red-600 hover:text-red-800 hover:bg-red-50 border-red-200"
        onClick={handleDelete}
        disabled={loading !== null}
      >
        <Trash2 className="h-3.5 w-3.5" />
        {loading === 'delete' ? 'Suppression...' : 'Supprimer'}
      </Button>

      {statut === 'preinscrit' && (
        <Button
          className="bg-green-600 hover:bg-green-700 text-white gap-2 text-sm"
          onClick={openDialog}
          disabled={loading !== null}
        >
          <CheckCircle className="h-4 w-4" />
          Valider l&apos;inscription
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Valider l&apos;inscription</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-1">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* ── Section 1 : Frais d'inscription ── */}
            {tarif ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Frais d&apos;inscription</p>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600">
                  Montant dû : <span className="font-bold text-gray-900">{formatMoney(fraisInscription)}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Montant encaissé (FCFA)</Label>
                    <Input
                      type="number" min="0" max={fraisInscription}
                      value={montantInscription}
                      onChange={(e) => setMontantInscription(e.target.value)}
                      className="h-9 text-sm"
                    />
                    {montantInscriptionNum > 0 && montantInscriptionNum < fraisInscription && (
                      <p className="text-xs text-orange-500">Reste {formatMoney(fraisInscription - montantInscriptionNum)}</p>
                    )}
                    {montantInscriptionNum === 0 && (
                      <p className="text-xs text-gray-400">En attente</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Mode de paiement</Label>
                    <Select value={modeInscription} onValueChange={setModeInscription}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MODES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                Aucun tarif configuré pour cette filière.
              </p>
            )}

            {/* ── Section 2 : Premier versement scolarité ── */}
            {tarif && totalScolarite > 0 && (
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Premier versement scolarité</p>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600">
                  Total scolarité : <span className="font-bold text-gray-900">{formatMoney(totalScolarite)}</span>
                  <span className="text-xs ml-1">({tarif.nb_mensualites} × {formatMoney(tarif.mensualite)})</span>
                </div>

                <div className="flex gap-2">
                  {(['none', 'mensualite', 'avance'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => onVersementTypeChange(v)}
                      className={`flex-1 text-xs py-2 px-3 rounded-lg border font-medium transition-colors ${
                        versementType === v
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {v === 'none' ? 'Aucun' : v === 'mensualite' ? '1 mensualité' : 'Avance libre'}
                    </button>
                  ))}
                </div>

                {versementType !== 'none' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Montant (FCFA)</Label>
                      <Input
                        type="number" min="0"
                        value={montantVersement}
                        onChange={(e) => setMontantVersement(e.target.value)}
                        className="h-9 text-sm"
                        readOnly={versementType === 'mensualite'}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Mode de paiement</Label>
                      <Select value={modeVersement} onValueChange={setModeVersement}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MODES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleConfirm}
              disabled={loading === 'activate'}
            >
              {loading === 'activate' ? 'Validation...' : 'Confirmer l&apos;inscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
