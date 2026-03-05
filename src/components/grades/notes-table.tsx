'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface Student {
  id: string
  matricule: string
  nom: string
  prenom: string
  note_id: string | null
  note_normale: number | null
  note_rattrapage: number | null
  note_finale: number | null
  mention: string | null
}

interface Matiere {
  id: string
  code: string
  nom: string
  coefficient: number
  credit: number
  semestre: string
  filiere_id: string
  niveau_id: string
  filiere?: { id: string; nom: string; code: string } | null
  niveau?: { id: string; nom: string; ordre: number } | null
  enseignant?: { id: string; nom: string; prenom: string } | null
}

interface NoteRow {
  etudiant_id: string
  note_normale: number | null
  note_rattrapage: number | null
}

interface Props {
  matiere: Matiere
  students: Student[]
  annee_id: string
}

const MENTION_COLORS: Record<string, string> = {
  TB: 'bg-green-100 text-green-600 border-green-200',
  B: 'bg-blue-100 text-blue-600 border-blue-200',
  AB: 'bg-indigo-100 text-indigo-600 border-indigo-200',
  P: 'bg-amber-100 text-amber-600 border-amber-200',
  F: 'bg-red-100 text-red-600 border-red-200',
}

function computeFinale(normale: number | null, rattrapage: number | null): number | null {
  if (normale === null && rattrapage === null) return null
  if (normale === null) return rattrapage
  if (rattrapage === null) return normale
  return rattrapage > normale ? rattrapage : normale
}

function computeMention(finale: number | null): string | null {
  if (finale === null) return null
  if (finale >= 16) return 'TB'
  if (finale >= 14) return 'B'
  if (finale >= 12) return 'AB'
  if (finale >= 10) return 'P'
  return 'F'
}

function parseNote(value: string): number | null {
  if (value.trim() === '') return null
  const n = parseFloat(value)
  if (isNaN(n)) return null
  return Math.min(20, Math.max(0, n))
}

export function NotesTable({ matiere, students, annee_id }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [rows, setRows] = useState<NoteRow[]>(() =>
    students.map((s) => ({
      etudiant_id: s.id,
      note_normale: s.note_normale,
      note_rattrapage: s.note_rattrapage,
    }))
  )

  const updateNote = useCallback(
    (index: number, field: 'note_normale' | 'note_rattrapage', value: string) => {
      setRows((prev) => {
        const next = [...prev]
        next[index] = { ...next[index], [field]: parseNote(value) }
        return next
      })
    },
    []
  )

  async function handleSave() {
    setError(null)
    setSuccess(false)
    setIsPending(true)
    try {
      const payload = rows
        .filter((r) => r.note_normale !== null || r.note_rattrapage !== null)
        .map((r) => ({
          etudiant_id: r.etudiant_id,
          matiere_id: matiere.id,
          annee_academique_id: annee_id,
          note_normale: r.note_normale,
          note_rattrapage: r.note_rattrapage,
        }))
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: payload }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Une erreur est survenue')
        return
      }
      setSuccess(true)
      toast.success(`${data.count} note(s) enregistrée(s) avec succès`)
      setTimeout(() => router.back(), 1200)
    } catch (err) {
      setError(String(err))
    } finally {
      setIsPending(false)
    }
  }

  const semestre = matiere.semestre === '1' ? 'Semestre 1' : 'Semestre 2'
  const semestreColor = matiere.semestre === '1'
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : 'bg-purple-50 text-purple-700 border-purple-200'

  return (
    <div className="space-y-5">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-600" />
            Informations de la matière
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Code</p>
              <p className="font-mono font-medium text-gray-700">{matiere.code}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Coefficient</p>
              <p className="font-semibold text-gray-900">{matiere.coefficient}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Crédits</p>
              <p className="font-semibold text-gray-900">{matiere.credit}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Semestre</p>
              <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${semestreColor}`}>
                {semestre}
              </span>
            </div>
            {matiere.enseignant && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">Enseignant</p>
                <p className="text-gray-700">
                  {matiere.enseignant.prenom} {matiere.enseignant.nom}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Notes enregistrées avec succès. Redirection en cours...</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {students.length} étudiant{students.length > 1 ? 's' : ''} inscrit{students.length > 1 ? 's' : ''}
        </p>
        <Button
          onClick={handleSave}
          disabled={isPending || success}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
        >
          <Save className="h-4 w-4" />
          {isPending ? 'Enregistrement...' : 'Enregistrer les notes'}
        </Button>
      </div>

      {students.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-16 text-gray-400">
          <BookOpen className="h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium">Aucun étudiant inscrit</p>
          <p className="text-sm mt-1">
            Il n’y a pas d’étudiants inscrits dans cette filière / niveau
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Matricule</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Étudiant</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">Note /20</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">Rattrapage /20</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">Finale</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">Mention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((student, index) => {
                const row = rows[index]
                const finale = computeFinale(row.note_normale, row.note_rattrapage)
                const mention = computeMention(finale)
                const mentionColor = mention
                  ? (MENTION_COLORS[mention] ?? 'bg-gray-100 text-gray-600 border-gray-200')
                  : ''
                return (
                  <tr key={student.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {student.matricule}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {student.prenom} {student.nom}
                        </p>
                        <p className="text-xs text-gray-400 font-mono sm:hidden">{student.matricule}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        step={0.25}
                        placeholder="—"
                        value={row.note_normale !== null ? row.note_normale.toString() : ''}
                        onChange={(e) => updateNote(index, 'note_normale', e.target.value)}
                        className="h-9 w-24 text-center mx-auto block"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        step={0.25}
                        placeholder="—"
                        value={row.note_rattrapage !== null ? row.note_rattrapage.toString() : ''}
                        onChange={(e) => updateNote(index, 'note_rattrapage', e.target.value)}
                        className="h-9 w-24 text-center mx-auto block"
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-semibold text-gray-900">
                        {finale !== null ? finale.toFixed(2) : '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {mention ? (
                        <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${mentionColor}`}>
                          {mention}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {students.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isPending || success}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          >
            <Save className="h-4 w-4" />
            {isPending ? 'Enregistrement...' : 'Enregistrer les notes'}
          </Button>
        </div>
      )}
    </div>
  )
}
