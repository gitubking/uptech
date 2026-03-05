'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertCircle, Plus, Pencil, Trash2, Settings2 } from 'lucide-react'

interface Filiere { id: string; nom: string; code: string }
interface Annee { id: string; libelle: string }
interface Tarif {
  id: string
  filiere_id: string
  annee_academique_id: string
  frais_inscription: number
  mensualite: number
  nb_mensualites: number
  filiere?: { nom: string; code: string } | null
  annee_academique?: { libelle: string } | null
}

interface Props {
  tarifs: Tarif[]
  filieres: Filiere[]
  annees: Annee[]
  anneeActiveId?: string
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('fr-SN').format(n) + ' FCFA'
}

export function TarifsManager({ tarifs: initialTarifs, filieres, annees, anneeActiveId }: Props) {
  const router = useRouter()
  const [tarifs, setTarifs] = useState(initialTarifs)
  const [dialog, setDialog] = useState<{ mode: 'create' | 'edit'; data?: Tarif } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Controlled select states for dialog
  const [filiereId, setFiliereId] = useState('')
  const [anneeId, setAnneeId] = useState(anneeActiveId ?? '')

  function openCreate() {
    setFiliereId('')
    setAnneeId(anneeActiveId ?? '')
    setError(null)
    setDialog({ mode: 'create' })
  }

  function openEdit(t: Tarif) {
    setFiliereId(t.filiere_id)
    setAnneeId(t.annee_academique_id)
    setError(null)
    setDialog({ mode: 'edit', data: t })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      formData.set('filiere_id', filiereId)
      formData.set('annee_academique_id', anneeId)

      const res = await fetch('/api/tarifs', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setDialog(null)
      router.refresh()
    } catch {
      setError('Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/tarifs?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) { alert(data.error); return }
      setTarifs(tarifs.filter(t => t.id !== id))
      setDeleteConfirm(null)
    } catch {
      alert('Erreur lors de la suppression')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tarifs par filière</h2>
          <p className="text-sm text-gray-500 mt-0.5">Frais d'inscription et mensualités par filière et année académique</p>
        </div>
        <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un tarif
        </Button>
      </div>

      {tarifs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100 text-gray-400">
          <Settings2 className="h-10 w-10 mb-3 opacity-30" />
          <p className="font-medium text-gray-500">Aucun tarif configuré</p>
          <p className="text-sm mt-1">Cliquez sur "Ajouter un tarif" pour commencer</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Filière</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Année</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Frais inscription</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Mensualité</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Nb mois</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Total scolarité</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tarifs.map((t) => {
                const filiere = t.filiere as { nom: string; code: string } | null
                const annee = t.annee_academique as { libelle: string } | null
                const totalScolarite = t.mensualite * t.nb_mensualites
                return (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{filiere?.code}</span>
                      <span className="text-gray-500 ml-1.5 text-xs">— {filiere?.nom}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{annee?.libelle}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatMoney(Number(t.frais_inscription))}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatMoney(Number(t.mensualite))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                        {t.nb_mensualites}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">
                      {formatMoney(totalScolarite)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(t)}>
                          <Pencil className="h-3.5 w-3.5 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDeleteConfirm(t.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog créer / modifier */}
      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog?.mode === 'create' ? 'Nouveau tarif' : 'Modifier le tarif'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Filière <span className="text-red-500">*</span></Label>
              <Select value={filiereId} onValueChange={setFiliereId} required>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Choisir une filière" />
                </SelectTrigger>
                <SelectContent>
                  {filieres.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.code} — {f.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Année académique <span className="text-red-500">*</span></Label>
              <Select value={anneeId} onValueChange={setAnneeId} required>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Choisir une année" />
                </SelectTrigger>
                <SelectContent>
                  {annees.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.libelle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Frais d'inscription (FCFA) <span className="text-red-500">*</span></Label>
                <Input
                  name="frais_inscription"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={dialog?.data?.frais_inscription ?? ''}
                  required
                  className="h-10"
                  placeholder="ex: 50000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Mensualité (FCFA) <span className="text-red-500">*</span></Label>
                <Input
                  name="mensualite"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={dialog?.data?.mensualite ?? ''}
                  required
                  className="h-10"
                  placeholder="ex: 25000"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Nombre de mensualités <span className="text-red-500">*</span></Label>
              <Input
                name="nb_mensualites"
                type="number"
                min="1"
                max="24"
                defaultValue={dialog?.data?.nb_mensualites ?? 10}
                required
                className="h-10"
              />
              <p className="text-xs text-gray-400">Dépend du type de formation (ex: DAP = 10 mois, Licence = 9 mois)</p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>Annuler</Button>
              <Button type="submit" disabled={loading || !filiereId || !anneeId} className="bg-green-600 hover:bg-green-700 text-white">
                {loading ? 'Enregistrement...' : dialog?.mode === 'create' ? 'Créer' : 'Mettre à jour'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmation suppression */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer ce tarif ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Cette action est irréversible.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button
              variant="destructive"
              disabled={loading}
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              {loading ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
