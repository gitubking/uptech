'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserPlus, Search, CheckSquare, Square, AlertCircle, Loader2 } from 'lucide-react'
import { affecterEtudiantClasse } from '@/app/actions/classes'

interface Etudiant {
  id: string
  matricule: string
  nom: string
  prenom: string
  statut: string
  classe_id?: string | null
}

interface Props {
  classeId: string
  classeNom: string
  filiereId: string
  etudiants: Etudiant[]  // tous les étudiants de la même filière
}

const STATUT_LABELS: Record<string, string> = {
  inscrit: 'Inscrit',
  preinscrit: 'Préinscrit',
  diplome: 'Diplômé',
  abandonne: 'Abandonné',
  suspendu: 'Suspendu',
}

export function AffectationDialog({ classeId, classeNom, etudiants }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Étudiants déjà dans CETTE classe
  const dejaDansClasse = etudiants.filter(e => e.classe_id === classeId)
  // Étudiants disponibles (pas encore dans cette classe, inscrits ou préinscrits)
  const disponibles = etudiants.filter(
    e => e.classe_id !== classeId && ['inscrit', 'preinscrit'].includes(e.statut)
  )

  const filtered = disponibles.filter(e =>
    search === '' ||
    e.nom.toLowerCase().includes(search.toLowerCase()) ||
    e.prenom.toLowerCase().includes(search.toLowerCase()) ||
    e.matricule.toLowerCase().includes(search.toLowerCase())
  )

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(e => e.id)))
    }
  }

  function handleOpen() {
    setSearch('')
    setSelected(new Set())
    setError(null)
    setOpen(true)
  }

  async function handleConfirm() {
    if (selected.size === 0) return
    setError(null)
    startTransition(async () => {
      try {
        for (const etudiantId of selected) {
          const result = await affecterEtudiantClasse(etudiantId, classeId)
          if (result.error) { setError(result.error); return }
        }
        setOpen(false)
        router.refresh()
      } catch {
        setError('Une erreur est survenue.')
      }
    })
  }

  return (
    <>
      <Button onClick={handleOpen} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-sm">
        <UserPlus className="h-4 w-4" />
        Affecter des étudiants
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">Affecter des étudiants</DialogTitle>
            <p className="text-xs text-gray-500 mt-0.5">{classeNom}</p>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Déjà dans la classe */}
            {dejaDansClasse.length > 0 && (
              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                {dejaDansClasse.length} étudiant{dejaDansClasse.length > 1 ? 's' : ''} déjà affecté{dejaDansClasse.length > 1 ? 's' : ''} à cette classe
              </div>
            )}

            {/* Recherche */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher par nom ou matricule…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* Tout sélectionner */}
            {filtered.length > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800"
              >
                {selected.size === filtered.length
                  ? <CheckSquare className="h-4 w-4" />
                  : <Square className="h-4 w-4" />
                }
                {selected.size === filtered.length ? 'Tout désélectionner' : 'Tout sélectionner'} ({filtered.length})
              </button>
            )}

            {/* Liste */}
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 border border-gray-100 rounded-lg">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-400">
                  {disponibles.length === 0
                    ? 'Tous les étudiants de cette filière sont déjà affectés'
                    : 'Aucun résultat pour cette recherche'
                  }
                </div>
              ) : (
                filtered.map(e => {
                  const isSelected = selected.has(e.id)
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => toggleSelect(e.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                    >
                      {isSelected
                        ? <CheckSquare className="h-4 w-4 text-blue-600 shrink-0" />
                        : <Square className="h-4 w-4 text-gray-300 shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{e.nom} {e.prenom}</p>
                        <p className="text-xs text-gray-400">{e.matricule} · {STATUT_LABELS[e.statut] ?? e.statut}</p>
                      </div>
                      {e.classe_id && e.classe_id !== classeId && (
                        <span className="text-xs text-amber-600 shrink-0">Autre classe</span>
                      )}
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-gray-500">
                {selected.size > 0 ? `${selected.size} sélectionné${selected.size > 1 ? 's' : ''}` : ''}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Annuler</Button>
                <Button
                  size="sm"
                  onClick={handleConfirm}
                  disabled={selected.size === 0 || isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isPending ? 'Affectation…' : `Affecter (${selected.size})`}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
