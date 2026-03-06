'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft, PenLine, Clock, BookOpen, Trash2, AlertCircle,
  CheckCircle2, ClipboardList, Info, School,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type EnseignantRow = { id: string; nom: string; prenom: string; matricule?: string }

type ClasseRow = {
  id: string; nom: string; code: string
  filiere: { id: string; code: string; nom: string } | null
  niveau: { id: string; nom: string } | null
}

type EnseignementRow = {
  id: string
  classe_id: string
  programme_id: string
  enseignant_id: string | null
  volume_horaire: number | null
  programme: {
    id: string
    matiere_id: string
    matiere: { id: string; code: string; nom: string } | null
  } | null
}

type EmargementRow = {
  id: string
  date_cours: string
  heure_debut?: string | null
  heure_fin?: string | null
  chapitre?: string | null
  observations?: string | null
  created_at: string
  enseignant: { id: string; nom: string; prenom: string } | null
  matiere: { id: string; code: string; nom: string } | null
  classe: { id: string; nom: string; code: string } | null
}

interface Props {
  enseignants: EnseignantRow[]
  classes: ClasseRow[]
  enseignements: EnseignementRow[]
  emargements: unknown[]
  tableError: string | null
  isEnseignant: boolean
  currentEnseignantId?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatTime(t?: string | null) {
  if (!t) return '—'
  return t.slice(0, 5)
}

function calcHeures(debut?: string | null, fin?: string | null): number {
  if (!debut || !fin) return 0
  const [dh, dm] = debut.split(':').map(Number)
  const [fh, fm] = fin.split(':').map(Number)
  return Math.max(0, (fh * 60 + fm - (dh * 60 + dm)) / 60)
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EmargementClient({
  enseignants, classes, enseignements, emargements: initial,
  tableError, isEnseignant, currentEnseignantId,
}: Props) {
  const router = useRouter()
  const rows = initial as EmargementRow[]

  // Form state
  const [enseignantId, setEnseignantId] = useState(currentEnseignantId ?? '')
  const [classeId, setClasseId] = useState('')
  const [matiereId, setMatiereId] = useState('')
  const [filterEnseignantId, setFilterEnseignantId] = useState('all')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // ── Cascade : classes disponibles pour l'enseignant sélectionné ──
  const classesForEnseignant = enseignantId
    ? classes.filter((c) =>
        enseignements.some((e) => e.enseignant_id === enseignantId && e.classe_id === c.id)
      )
    : classes

  // ── Cascade : matières de l'enseignant dans la classe sélectionnée ──
  const matieresForClasse = (enseignantId && classeId)
    ? enseignements
        .filter((e) => e.enseignant_id === enseignantId && e.classe_id === classeId)
        .map((e) => ({
          id: e.programme?.matiere?.id ?? '',
          code: e.programme?.matiere?.code ?? '',
          nom: e.programme?.matiere?.nom ?? '',
          volume_horaire: e.volume_horaire,
        }))
        .filter((m) => m.id)
    : []

  // ── Volume horaire de la matière sélectionnée dans cette classe ──
  const selectedEnseignement = enseignements.find(
    (e) => e.enseignant_id === enseignantId && e.classe_id === classeId && e.programme?.matiere?.id === matiereId
  )
  const volHoraire = selectedEnseignement?.volume_horaire ?? 0

  // ── Heures déjà dispensées pour cette combo enseignant+matière+classe ──
  const heuresDispensees = rows
    .filter((r) => r.enseignant?.id === enseignantId && r.matiere?.id === matiereId && r.classe?.id === classeId)
    .reduce((acc, r) => acc + calcHeures(r.heure_debut, r.heure_fin), 0)

  // ── Filtre historique ──
  const filteredRows = filterEnseignantId !== 'all'
    ? rows.filter((r) => r.enseignant?.id === filterEnseignantId)
    : rows

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setFormError(null)
    setSuccess(false)

    const form = e.currentTarget
    const fd = new FormData(form)

    const body = {
      enseignant_id: enseignantId,
      matiere_id: matiereId,
      classe_id: classeId || undefined,
      date_cours: fd.get('date_cours') as string,
      heure_debut: fd.get('heure_debut') as string,
      heure_fin: fd.get('heure_fin') as string,
      chapitre: fd.get('chapitre') as string,
      observations: fd.get('observations') as string,
    }

    if (!body.enseignant_id || !body.matiere_id || !body.date_cours) {
      setFormError('Veuillez sélectionner un enseignant, une classe, une matière et une date.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/emargements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.error) {
        setFormError(data.error)
      } else {
        setSuccess(true)
        form.reset()
        if (!isEnseignant) { setEnseignantId(''); }
        setClasseId('')
        setMatiereId('')
        setTimeout(() => setSuccess(false), 3000)
        router.refresh()
      }
    } catch {
      setFormError('Erreur réseau, veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/emargements?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) {
        alert(data.error)
      } else {
        setDeleteId(null)
        router.refresh()
      }
    } catch {
      alert('Erreur lors de la suppression')
    }
  }

  const MIGRATION_SQL = `-- Migration 012 : lier les émargements à une classe
ALTER TABLE emargements ADD COLUMN IF NOT EXISTS classe_id UUID REFERENCES classes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_emargements_classe ON emargements(classe_id);
ALTER TABLE emargements DROP CONSTRAINT IF EXISTS emargements_enseignant_id_matiere_id_date_cours_key;
ALTER TABLE emargements ADD CONSTRAINT emargements_unique_par_classe
  UNIQUE (enseignant_id, matiere_id, classe_id, date_cours);`

  // ── Table inexistante ──
  if (tableError) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Link href="/attendance" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Émargement</h1>
            <p className="text-gray-500 text-sm mt-0.5">Feuille de présence des enseignants</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 text-amber-800">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Erreur : {tableError}</p>
                <p className="text-sm mt-1 text-amber-700">
                  Exécutez le SQL ci-dessous dans le SQL Editor de Supabase.
                </p>
              </div>
            </div>
          </div>
          <div className="relative">
            <pre className="bg-amber-900/10 border border-amber-200 rounded-lg p-4 text-xs font-mono text-amber-900 overflow-x-auto leading-relaxed">
              {MIGRATION_SQL}
            </pre>
            <button
              onClick={() => navigator.clipboard.writeText(MIGRATION_SQL)}
              className="absolute top-2 right-2 px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-800 text-xs rounded transition-colors"
            >
              Copier
            </button>
          </div>
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-100/50 rounded-lg p-3">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>Fichier : <code className="font-mono">supabase/migrations/012_emargements_classe.sql</code></span>
          </div>
        </div>
      </div>
    )
  }

  // ── Vue principale ──
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/attendance" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Émargement</h1>
          <p className="text-gray-500 text-sm mt-0.5">Enregistrement des séances de cours dispensées</p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <PenLine className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-700">Signer une séance</span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">

          {/* ── Ligne 1 : Enseignant (admin seulement) ── */}
          {!isEnseignant && (
            <div className="space-y-1.5">
              <Label>Enseignant *</Label>
              <Select
                value={enseignantId}
                onValueChange={(v) => { setEnseignantId(v); setClasseId(''); setMatiereId('') }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un enseignant" />
                </SelectTrigger>
                <SelectContent>
                  {enseignants.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.prenom} {e.nom}
                      {e.matricule && <span className="text-gray-400 ml-1 text-xs">({e.matricule})</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── Ligne 2 : Classe → Matière ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <School className="h-3.5 w-3.5" /> Classe *
              </Label>
              <Select
                value={classeId}
                onValueChange={(v) => { setClasseId(v); setMatiereId('') }}
                disabled={!enseignantId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={enseignantId ? 'Choisir une classe' : 'Sélectionnez d\'abord un enseignant'} />
                </SelectTrigger>
                <SelectContent>
                  {classesForEnseignant.length === 0 && (
                    <SelectItem value="none" disabled>
                      Aucune classe affectée à cet enseignant
                    </SelectItem>
                  )}
                  {classesForEnseignant.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="font-mono text-xs mr-1 text-blue-600">{c.code}</span>
                      {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Matière *
              </Label>
              <Select
                value={matiereId}
                onValueChange={setMatiereId}
                disabled={!classeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={classeId ? 'Choisir une matière' : 'Sélectionnez d\'abord une classe'} />
                </SelectTrigger>
                <SelectContent>
                  {matieresForClasse.length === 0 && (
                    <SelectItem value="none" disabled>
                      Aucune matière dans cette classe
                    </SelectItem>
                  )}
                  {matieresForClasse.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="font-mono text-xs mr-1 text-purple-600">{m.code}</span>
                      {m.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Widget Volume Horaire ── */}
          {matiereId && volHoraire > 0 && (() => {
            const heuresRestantes = Math.max(0, volHoraire - heuresDispensees)
            const pct = Math.min(100, (heuresDispensees / volHoraire) * 100)
            const isOver = heuresDispensees > volHoraire
            const barColor = isOver ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500'
            const bgColor = isOver ? 'bg-red-50 border-red-200' : pct >= 80 ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
            const textColor = isOver ? 'text-red-800' : pct >= 80 ? 'text-amber-800' : 'text-blue-800'
            const subColor = isOver ? 'text-red-600' : pct >= 80 ? 'text-amber-600' : 'text-blue-600'
            const matNom = matieresForClasse.find((m) => m.id === matiereId)?.nom ?? ''
            const classeNom = classesForEnseignant.find((c) => c.id === classeId)?.code ?? ''

            return (
              <div className={`p-3 border rounded-lg ${bgColor}`}>
                <div className={`flex items-center justify-between text-sm mb-1.5 ${textColor}`}>
                  <span className="font-semibold flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Volume horaire — {matNom} ({classeNom})
                  </span>
                  <span className="font-bold tabular-nums">
                    {heuresDispensees.toFixed(1)} h / {volHoraire} h
                  </span>
                </div>
                <div className="w-full bg-white/60 rounded-full h-2 mb-1.5">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className={`flex items-center justify-between text-xs ${subColor}`}>
                  <span>
                    {isOver
                      ? `⚠ ${(heuresDispensees - volHoraire).toFixed(1)} h au-delà du volume prévu`
                      : `${heuresRestantes.toFixed(1)} h restantes`}
                  </span>
                  <span>{pct.toFixed(0)}% dispensé</span>
                </div>
              </div>
            )
          })()}

          {/* ── Date + Heures ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="date_cours">Date du cours *</Label>
              <Input
                id="date_cours" name="date_cours" type="date" required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="heure_debut">
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Heure début</span>
              </Label>
              <Input id="heure_debut" name="heure_debut" type="time" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="heure_fin">
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Heure fin</span>
              </Label>
              <Input id="heure_fin" name="heure_fin" type="time" />
            </div>
          </div>

          {/* ── Chapitre ── */}
          <div className="space-y-1.5">
            <Label htmlFor="chapitre">
              <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Chapitre / contenu enseigné</span>
            </Label>
            <Input
              id="chapitre" name="chapitre"
              placeholder="Ex : Chapitre 3 — Les structures de données"
            />
          </div>

          {/* ── Observations ── */}
          <div className="space-y-1.5">
            <Label htmlFor="observations">Observations</Label>
            <textarea
              id="observations" name="observations" rows={2}
              placeholder="Observations éventuelles (retards, incidents, devoirs donnés…)"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>

          {formError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Émargement enregistré avec succès !
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {loading ? 'Enregistrement…' : (
                <><PenLine className="h-4 w-4" /> Enregistrer l&apos;émargement</>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Historique */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Historique des émargements</span>
            <Badge variant="secondary" className="text-xs">{filteredRows.length}</Badge>
          </div>
          {!isEnseignant && (
            <Select value={filterEnseignantId} onValueChange={setFilterEnseignantId}>
              <SelectTrigger className="w-48 h-8 text-xs">
                <SelectValue placeholder="Tous les enseignants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les enseignants</SelectItem>
                {enseignants.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {filteredRows.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aucun émargement enregistré</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-600">Date</th>
                  {!isEnseignant && <th className="text-left py-2.5 px-4 font-medium text-gray-600">Enseignant</th>}
                  <th className="text-left py-2.5 px-4 font-medium text-gray-600">Classe</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-600">Matière</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-600">Horaire</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-600 hidden lg:table-cell">Chapitre</th>
                  <th className="text-right py-2.5 px-4 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap text-xs">
                      {formatDate(row.date_cours)}
                    </td>
                    {!isEnseignant && (
                      <td className="py-3 px-4">
                        {row.enseignant ? (
                          <span className="font-medium text-gray-900">
                            {row.enseignant.prenom} {row.enseignant.nom}
                          </span>
                        ) : '—'}
                      </td>
                    )}
                    <td className="py-3 px-4">
                      {row.classe ? (
                        <Badge variant="outline" className="text-xs font-mono">
                          {row.classe.code}
                        </Badge>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      {row.matiere ? (
                        <div>
                          <span className="font-mono text-xs text-purple-600 mr-1">{row.matiere.code}</span>
                          <span className="text-gray-800">{row.matiere.nom}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                      {formatTime(row.heure_debut)} → {formatTime(row.heure_fin)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs hidden lg:table-cell">
                      <span className="truncate block">{row.chapitre ?? '—'}</span>
                      {row.observations && (
                        <span className="text-xs text-gray-400 truncate block">{row.observations}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {deleteId === row.id ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="destructive" size="sm" className="h-7 text-xs"
                            onClick={() => handleDelete(row.id)}
                          >
                            Confirmer
                          </Button>
                          <Button
                            variant="ghost" size="sm" className="h-7 text-xs"
                            onClick={() => setDeleteId(null)}
                          >
                            Annuler
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteId(row.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
