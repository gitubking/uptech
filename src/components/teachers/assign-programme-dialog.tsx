'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { BookOpen, Check, Loader2, X } from 'lucide-react'
import { assignEnseignantProgramme } from '@/app/actions/matieres'

type Filiere = { id: string; nom: string; code: string; type_formation: string }
type Annee = { id: string; libelle: string; actif: boolean }
type ProgrammeEntry = {
  id: string; semestre: string; coefficient: number; volume_horaire: number
  matiere: { id: string; nom: string; code: string } | null
  enseignant: { id: string; nom: string; prenom: string } | null
}

const TYPE_LABELS: Record<string, string> = {
  academique: 'Académique',
  certifiante: 'Certifiante',
  acceleree: 'Accélérée',
}

interface Props {
  enseignantId: string
  enseignantNom: string
  filieres: Filiere[]
  annees: Annee[]
}

export function AssignProgrammeDialog({ enseignantId, enseignantNom, filieres, annees }: Props) {
  const [open, setOpen] = useState(false)
  const [typeFormation, setTypeFormation] = useState('')
  const [filiereId, setFiliereId] = useState('')
  const [anneeId, setAnneeId] = useState(annees.find(a => a.actif)?.id ?? annees[0]?.id ?? '')
  const [programme, setProgramme] = useState<ProgrammeEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const filteredFilieres = typeFormation
    ? filieres.filter(f => f.type_formation === typeFormation)
    : filieres

  useEffect(() => {
    setFiliereId('')
    setProgramme([])
  }, [typeFormation])

  useEffect(() => {
    setProgramme([])
    if (!filiereId || !anneeId) return
    setLoading(true)
    fetch(`/api/programme?filiere_id=${filiereId}&annee_id=${anneeId}`)
      .then(r => r.json())
      .then(data => setProgramme(data ?? []))
      .catch(() => setProgramme([]))
      .finally(() => setLoading(false))
  }, [filiereId, anneeId])

  async function toggle(prog: ProgrammeEntry) {
    const isAssigned = prog.enseignant?.id === enseignantId
    setSaving(prog.id)
    setMessage(null)
    const result = await assignEnseignantProgramme(prog.id, isAssigned ? null : enseignantId)
    if (result.error) {
      setMessage({ type: 'err', text: result.error })
    } else {
      setProgramme(prev => prev.map(p =>
        p.id === prog.id
          ? { ...p, enseignant: isAssigned ? null : { id: enseignantId, nom: enseignantNom.split(' ')[0] ?? '', prenom: '' } }
          : p
      ))
    }
    setSaving(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Affecter aux matières
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Affecter aux matières du programme</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Type de formation */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Type de formation</label>
            <select
              value={typeFormation}
              onChange={e => setTypeFormation(e.target.value)}
              className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-white focus:outline-none focus:border-red-500"
            >
              <option value="">Tous les types</option>
              {Object.entries(TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Filière */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Filière</label>
            <select
              value={filiereId}
              onChange={e => setFiliereId(e.target.value)}
              className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-white focus:outline-none focus:border-red-500"
            >
              <option value="">-- Sélectionner une filière --</option>
              {filteredFilieres.map(f => (
                <option key={f.id} value={f.id}>{f.code} — {f.nom}</option>
              ))}
            </select>
          </div>

          {/* Année académique */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Année académique</label>
            <select
              value={anneeId}
              onChange={e => setAnneeId(e.target.value)}
              className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-white focus:outline-none focus:border-red-500"
            >
              {annees.map(a => (
                <option key={a.id} value={a.id}>{a.libelle}{a.actif ? ' (active)' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Résultats */}
        <div className="mt-3 min-h-[100px]">
          {!filiereId ? (
            <p className="text-sm text-gray-400 text-center py-8">Sélectionnez une filière pour voir le programme</p>
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : programme.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune matière dans ce programme</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {programme.map(prog => {
                const isAssigned = prog.enseignant?.id === enseignantId
                const hasOther = prog.enseignant && prog.enseignant.id !== enseignantId
                return (
                  <div key={prog.id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {prog.matiere?.nom ?? '—'}
                      </p>
                      <p className="text-xs text-gray-400">
                        S{prog.semestre} · Coeff. {prog.coefficient}
                        {hasOther && (
                          <span className="ml-2 text-amber-600">
                            · Déjà : {prog.enseignant?.prenom} {prog.enseignant?.nom}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => toggle(prog)}
                      disabled={saving === prog.id}
                      className={`ml-3 shrink-0 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                        isAssigned
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                      }`}
                    >
                      {saving === prog.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isAssigned ? (
                        <><X className="h-3.5 w-3.5" /> Retirer</>
                      ) : (
                        <><Check className="h-3.5 w-3.5" /> Affecter</>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {message && (
          <p className={`text-xs mt-2 ${message.type === 'err' ? 'text-red-600' : 'text-green-600'}`}>
            {message.text}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
