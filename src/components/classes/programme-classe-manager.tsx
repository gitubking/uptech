'use client'

import { useState, useTransition } from 'react'
import { BookOpen, Loader2, RefreshCw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { initEnseignementsClasse, updateEnseignement } from '@/app/actions/enseignement'
import { useRouter } from 'next/navigation'

type Enseignant = { id: string; nom: string; prenom: string }
type EnseignementRow = {
  id: string
  volume_horaire: number
  programme: {
    id: string; semestre: string; coefficient: number; credit: number
    matiere: { id: string; nom: string; code: string } | null
  } | null
  enseignant: { id: string; nom: string; prenom: string } | null
}

const SEMESTRE_COLORS: Record<string, string> = {
  '1': 'bg-blue-50 text-blue-700',
  '2': 'bg-purple-50 text-purple-700',
}

interface Props {
  classeId: string
  enseignements: EnseignementRow[]
  enseignants: Enseignant[]
}

export function ProgrammeClasseManager({ classeId, enseignements: initial, enseignants }: Props) {
  const router = useRouter()
  const [enseignements, setEnseignements] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [initError, setInitError] = useState<string | null>(null)

  async function handleInit() {
    setInitError(null)
    startTransition(async () => {
      const result = await initEnseignementsClasse(classeId)
      if (result.error) {
        setInitError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  async function handleUpdate(
    enseignement_id: string,
    enseignant_id: string | null,
    volume_horaire: number
  ) {
    setSaving(enseignement_id)
    setSaved(null)
    const result = await updateEnseignement(enseignement_id, enseignant_id, volume_horaire, classeId)
    if (!result.error) {
      setEnseignements(prev => prev.map(e =>
        e.id === enseignement_id
          ? {
              ...e,
              volume_horaire,
              enseignant: enseignant_id
                ? enseignants.find(ens => ens.id === enseignant_id) ?? null
                : null,
            }
          : e
      ))
      setSaved(enseignement_id)
      setTimeout(() => setSaved(null), 2000)
    }
    setSaving(null)
  }

  if (enseignements.length === 0) {
    return (
      <div className="text-center py-10">
        <BookOpen className="h-8 w-8 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-400 mb-1">Aucun module chargé pour cette classe</p>
        <p className="text-xs text-gray-300 mb-4">
          Cliquez sur le bouton pour charger les matières du programme de la filière
        </p>
        {initError && <p className="text-xs text-red-500 mb-3">{initError}</p>}
        <Button
          size="sm"
          onClick={handleInit}
          disabled={isPending}
          className="gap-2 bg-black hover:bg-gray-900 text-white"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Charger le programme de la filière
        </Button>
      </div>
    )
  }

  // Grouper par semestre
  const sem1 = enseignements.filter(e => e.programme?.semestre === '1')
  const sem2 = enseignements.filter(e => e.programme?.semestre === '2')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-indigo-600" />
          <h2 className="font-semibold text-gray-900 text-sm">
            Modules &amp; Enseignants
          </h2>
          <span className="text-xs text-gray-400">({enseignements.length} matières)</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleInit}
          disabled={isPending}
          className="gap-1.5 text-xs h-8"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Recharger
        </Button>
      </div>

      {[
        { label: 'Semestre 1', data: sem1 },
        { label: 'Semestre 2', data: sem2 },
      ].map(({ label, data }) =>
        data.length === 0 ? null : (
          <div key={label} className="px-5 pb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Matière</th>
                    <th className="text-center px-3 py-2.5 font-medium text-gray-500 text-xs hidden sm:table-cell">Coeff.</th>
                    <th className="text-center px-3 py-2.5 font-medium text-gray-500 text-xs hidden md:table-cell">VH (h)</th>
                    <th className="text-left px-3 py-2.5 font-medium text-gray-500 text-xs">Enseignant</th>
                    <th className="px-3 py-2.5 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.map((e) => (
                    <EnseignementRow
                      key={e.id}
                      e={e}
                      enseignants={enseignants}
                      saving={saving === e.id}
                      saved={saved === e.id}
                      onUpdate={handleUpdate}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {initError && <p className="text-xs text-red-500 px-5 pb-2">{initError}</p>}
    </div>
  )
}

function EnseignementRow({
  e, enseignants, saving, saved, onUpdate
}: {
  e: EnseignementRow
  enseignants: Enseignant[]
  saving: boolean
  saved: boolean
  onUpdate: (id: string, enseignant_id: string | null, volume_horaire: number) => void
}) {
  const [enseignantId, setEnseignantId] = useState(e.enseignant?.id ?? '')
  const [vh, setVh] = useState(e.volume_horaire ?? 0)
  const isDirty = enseignantId !== (e.enseignant?.id ?? '') || vh !== (e.volume_horaire ?? 0)

  const matiere = e.programme?.matiere

  return (
    <tr className="hover:bg-gray-50/50">
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900 text-sm">{matiere?.nom ?? '—'}</p>
        <p className="text-xs text-gray-400 font-mono">{matiere?.code}</p>
      </td>
      <td className="px-3 py-3 text-center hidden sm:table-cell text-gray-600 text-xs">
        {e.programme?.coefficient}
      </td>
      <td className="px-3 py-3 hidden md:table-cell">
        <input
          type="number"
          min={0}
          value={vh}
          onChange={(ev) => setVh(parseInt(ev.target.value) || 0)}
          className="w-16 h-7 border border-gray-200 rounded px-2 text-xs text-center focus:outline-none focus:border-indigo-400"
        />
      </td>
      <td className="px-3 py-3">
        <select
          value={enseignantId}
          onChange={(ev) => setEnseignantId(ev.target.value)}
          className="w-full h-8 border border-gray-200 rounded-md px-2 text-xs bg-white focus:outline-none focus:border-indigo-400"
        >
          <option value="">-- Non assigné --</option>
          {enseignants.map((ens) => (
            <option key={ens.id} value={ens.id}>
              {ens.prenom} {ens.nom}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-3">
        {saved ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <button
            onClick={() => onUpdate(e.id, enseignantId || null, vh)}
            disabled={saving || !isDirty}
            className={`p-1.5 rounded-md transition-colors ${
              isDirty && !saving
                ? 'text-indigo-600 hover:bg-indigo-50'
                : 'text-gray-200 cursor-default'
            }`}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </td>
    </tr>
  )
}
