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

export function StudentActions({ studentId, statut, anneeAcademiqueId, tarif }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'delete' | 'activate' | null>(null)
  const [showInscriptionDialog, setShowInscriptionDialog] = useState(false)
  const [modePaiement, setModePaiement] = useState('especes')
  const [montantPaye, setMontantPaye] = useState<string>(
    tarif ? String(tarif.frais_inscription) : '0'
  )
  const [error, setError] = useState<string | null>(null)

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

  function openInscriptionDialog() {
    setMontantPaye(tarif ? String(tarif.frais_inscription) : '0')
    setModePaiement('especes')
    setError(null)
    setShowInscriptionDialog(true)
  }

  async function handleValidateInscription() {
    setError(null)
    setLoading('activate')
    try {
      const montant = parseFloat(montantPaye) || 0
      const fraisInscription = tarif?.frais_inscription ?? 0

      // 1. Enregistrer le paiement d'inscription si des frais sont configurés
      if (fraisInscription > 0) {
        const fd = new FormData()
        fd.set('etudiant_id', studentId)
        fd.set('annee_academique_id', anneeAcademiqueId)
        fd.set('type', 'inscription')
        fd.set('montant', String(montant))
        fd.set('montant_total', String(fraisInscription))
        fd.set('mode_paiement', modePaiement)
        const res = await fetch('/api/finance', { method: 'POST', body: fd })
        const data = await res.json()
        if (data.error) { setError(data.error); return }
      }

      // 2. Changer le statut en inscrit
      const res = await fetch(`/api/students?id=${studentId}&status=inscrit`, { method: 'PUT' })
      const data = await res.json()
      if (data.error) { setError(data.error); return }

      setShowInscriptionDialog(false)
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

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
          onClick={openInscriptionDialog}
          disabled={loading !== null}
        >
          <CheckCircle className="h-4 w-4" />
          Valider l&apos;inscription
        </Button>
      )}

      <Dialog open={showInscriptionDialog} onOpenChange={setShowInscriptionDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Valider l&apos;inscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {tarif && tarif.frais_inscription > 0 ? (
              <>
                <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-800">
                  Frais d&apos;inscription : <span className="font-bold">{formatMoney(tarif.frais_inscription)}</span>
                </div>

                <div className="space-y-1.5">
                  <Label>Montant encaissé (FCFA)</Label>
                  <Input
                    type="number"
                    min="0"
                    max={tarif.frais_inscription}
                    value={montantPaye}
                    onChange={(e) => setMontantPaye(e.target.value)}
                    className="h-10"
                  />
                  {parseFloat(montantPaye) < tarif.frais_inscription && parseFloat(montantPaye) > 0 && (
                    <p className="text-xs text-orange-600">
                      Paiement partiel — reste {formatMoney(tarif.frais_inscription - parseFloat(montantPaye))}
                    </p>
                  )}
                  {parseFloat(montantPaye) === 0 && (
                    <p className="text-xs text-gray-500">Aucun versement — paiement en attente</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Mode de paiement</Label>
                  <Select value={modePaiement} onValueChange={setModePaiement}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="especes">Espèces</SelectItem>
                      <SelectItem value="virement">Virement bancaire</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="cheque">Chèque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-600">
                Aucun frais d&apos;inscription configuré pour cette filière. L&apos;étudiant sera marqué comme inscrit.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInscriptionDialog(false)}>Annuler</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleValidateInscription}
              disabled={loading === 'activate'}
            >
              {loading === 'activate' ? 'Validation...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
