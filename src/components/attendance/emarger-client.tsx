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
  CheckCircle2, ClipboardList, Info,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type EnseignantRow = { id: string; nom: string; prenom: string; matricule?: string }
type MatiereRow = {
  id: string; code: string; nom: string; enseignant_id?: string | null
  volume_horaire?: number | null
  filiere: { code: string; nom: string } | null
  niveau: { nom: string } | null
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
  matiere: {
    id: string; code: string; nom: string
    filiere: { code: string } | null
    niveau: { nom: string } | null
  } | null
}

interface Props {
  enseignants: EnseignantRow[]
  matieres: MatiereRow[]
  emargements: unknown[]
  tableError: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatTime(t?: string | null) {
  if (!t) return '—'
  return t.slice(0, 5) // HH:MM
}

/** Calcule la durée en heures entre deux horaires HH:MM */
function calcHeures(debut?: string | null, fin?: string | null): number {
  if (!debut || !fin) return 0
  const [dh, dm] = debut.split(':').map(Number)
  const [fh, fm] = fin.split(':').map(Number)
  const mins = (fh * 60 + fm) - (dh * 60 + dm)
  return Math.max(0, mins / 60)
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EmargementClient({ enseignants, matieres, emargements: initial, tableError }: Props) {
  const router = useRouter()
  const rows = initial as EmargementRow[]

  // Form state
  const [enseignantId, setEnseignantId] = useState('')
  const [matiereId, setMatiereId] = useState('')
  const [filterEnseignantId, setFilterEnseignantId] = useState('all')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Filter matieres by selected enseignant
  const filteredMatieres = enseignantId
    ? matieres.filter((m) => m.enseignant_id === enseignantId)
    : matieres

  // Filter history by enseignant
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
      date_cours: fd.get('date_cours') as string,
      heure_debut: fd.get('heure_debut') as string,
      heure_fin: fd.get('heure_fin') as string,
      chapitre: fd.get('chapitre') as string,
      observations: fd.get('observations') as string,
    }

    if (!body.enseignant_id || !body.matiere_id || !body.date_cours) {
      setFormError('Veuillez sélectionner un enseignant, une matière et une date.')
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
        setEnseignantId('')
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

  const SQL_EDITOR_URL = 'https://supabase.com/dashboard/project/gpikjvprlwjfdtwuonwc/sql/new'
  const MIGRATION_SQL = `CREATE TABLE IF NOT EXISTS emargements (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  enseignant_id uuid REFERENCES enseignants(id) ON DELETE CASCADE NOT NULL,
  matiere_id    uuid REFERENCES matieres(id) ON DELETE CASCADE NOT NULL,
  date_cours    date NOT NULL,
  heure_debut   time,
  heure_fin     time,
  chapitre      text,
  observations  text,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (enseignant_id, matiere_id, date_cours)
);
ALTER TABLE emargements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON emargements FOR ALL USING (true) WITH CHECK (true);`

  // ── Table inexistante ──
  if (tableError) {
    return (
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/attendance" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Émargement</h1>
            <p className="text-gray-500 text-sm mt-0.5">Feuille de présence des enseignants</p>
          </div>
        </div>

        {/* Setup warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 text-amber-800">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Table <code className="font-mono">emargements</code> introuvable</p>
                <p className="text-sm mt-1 text-amber-700">
                  Copiez le SQL ci-dessous et exécutez-le dans le SQL Editor de Supabase.
                </p>
              </div>
            </div>
            <a
              href={SQL_EDITOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Ouvrir SQL Editor ↗
            </a>
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
            <span>
              Le fichier SQL complet se trouve dans <code className="font-mono">supabase/migrations/002_emargements_annonces.sql</code>.
              Il inclut aussi la table <strong>annonces</strong> pour le module Communication.
            </span>
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

      {/* Formulaire d'émargement */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <PenLine className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-700">Signer une séance</span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Enseignant + Matière */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Enseignant *</Label>
              <Select value={enseignantId} onValueChange={(v) => { setEnseignantId(v); setMatiereId('') }}>
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
            <div className="space-y-1.5">
              <Label>Matière *</Label>
              <Select
                value={matiereId}
                onValueChange={setMatiereId}
                disabled={!enseignantId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={enseignantId ? 'Choisir une matière' : 'Sélectionnez d\'abord un enseignant'} />
                </SelectTrigger>
                <SelectContent>
                  {filteredMatieres.length === 0 && (
                    <SelectItem value="none" disabled>
                      Aucune matière assignée à cet enseignant
                    </SelectItem>
                  )}
                  {filteredMatieres.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="font-mono text-xs mr-1 text-purple-600">{m.code}</span>
                      {m.nom}
                      {m.filiere && (
                        <span className="text-gray-400 ml-1 text-xs">
                          — {m.filiere.code} {m.niveau?.nom}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Widget Volume Horaire ── */}
          {matiereId && (() => {
            const mat = matieres.find((m) => m.id === matiereId)
            const volHoraire = mat?.volume_horaire ?? 0
            if (volHoraire === 0) return null

            const heuresDisp = rows
              .filter((r) => r.matiere?.id === matiereId)
              .reduce((acc, r) => acc + calcHeures(r.heure_debut, r.heure_fin), 0)
            const heuresRestantes = Math.max(0, volHoraire - heuresDisp)
            const pct = Math.min(100, (heuresDisp / volHoraire) * 100)
            const isOver = heuresDisp > volHoraire
            const barColor = isOver ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500'
            const bgColor = isOver ? 'bg-red-50 border-red-200' : pct >= 80 ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
            const textColor = isOver ? 'text-red-800' : pct >= 80 ? 'text-amber-800' : 'text-blue-800'
            const subColor = isOver ? 'text-red-600' : pct >= 80 ? 'text-amber-600' : 'text-blue-600'

            return (
              <div className={`p-3 border rounded-lg ${bgColor}`}>
                <div className={`flex items-center justify-between text-sm mb-1.5 ${textColor}`}>
                  <span className="font-semibold flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Volume horaire — {mat?.nom}
                  </span>
                  <span className="font-bold tabular-nums">
                    {heuresDisp.toFixed(1)} h / {volHoraire} h
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
                      ? `⚠ ${(heuresDisp - volHoraire).toFixed(1)} h au-delà du volume prévu`
                      : `${heuresRestantes.toFixed(1)} h restantes`}
                  </span>
                  <span>{pct.toFixed(0)}% dispensé</span>
                </div>
              </div>
            )
          })()}

          {/* Date + Heures */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="date_cours">Date du cours *</Label>
              <Input
                id="date_cours"
                name="date_cours"
                type="date"
                required
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

          {/* Chapitre */}
          <div className="space-y-1.5">
            <Label htmlFor="chapitre">
              <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Chapitre / contenu enseigné</span>
            </Label>
            <Input
              id="chapitre"
              name="chapitre"
              placeholder="Ex : Chapitre 3 — Les structures de données"
            />
          </div>

          {/* Observations */}
          <div className="space-y-1.5">
            <Label htmlFor="observations">Observations</Label>
            <textarea
              id="observations"
              name="observations"
              rows={2}
              placeholder="Observations éventuelles (retards, incidents, devoirs donnés…)"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>

          {/* Erreur / Succès */}
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
              type="submit"
              disabled={loading}
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
            <span className="text-sm font-semibold text-gray-700">
              Historique des émargements
            </span>
            <Badge variant="secondary" className="text-xs">{filteredRows.length}</Badge>
          </div>
          {/* Filtre par enseignant */}
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
                  <th className="text-left py-2.5 px-4 font-medium text-gray-600">Enseignant</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-600">Matière</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-600">Horaire</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-600">Chapitre</th>
                  <th className="text-right py-2.5 px-4 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                      {formatDate(row.date_cours)}
                    </td>
                    <td className="py-3 px-4">
                      {row.enseignant ? (
                        <span className="font-medium text-gray-900">
                          {row.enseignant.prenom} {row.enseignant.nom}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      {row.matiere ? (
                        <div>
                          <span className="font-mono text-xs text-purple-600 mr-1">{row.matiere.code}</span>
                          <span className="text-gray-800">{row.matiere.nom}</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            {row.matiere.filiere && (
                              <Badge variant="outline" className="text-xs py-0 px-1.5">
                                {row.matiere.filiere.code}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-400">{row.matiere.niveau?.nom}</span>
                          </div>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                      {formatTime(row.heure_debut)} → {formatTime(row.heure_fin)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs">
                      <span className="truncate block">{row.chapitre ?? '—'}</span>
                      {row.observations && (
                        <span className="text-xs text-gray-400 truncate block">{row.observations}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {deleteId === row.id ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleDelete(row.id)}
                          >
                            Confirmer
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setDeleteId(null)}
                          >
                            Annuler
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
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
