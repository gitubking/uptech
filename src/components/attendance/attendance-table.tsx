'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, XCircle, Clock, Shield, Save, AlertCircle } from 'lucide-react'

type Statut = 'present' | 'absent' | 'retard' | 'excuse'

interface Etudiant {
  id: string
  matricule: string
  nom: string
  prenom: string
}

interface Presence {
  id?: string
  statut: Statut
  justification?: string | null
}

interface Row {
  etudiant: Etudiant
  presence: Presence | null
}

interface Matiere {
  id: string
  nom: string
  code: string
  semestre: string
  filiere: { nom: string; code: string } | null
  niveau: { nom: string } | null
}

interface Props {
  matiere: Matiere
  date_cours: string
  rows: Row[]
}

const STATUT_CONFIG: Record<Statut, { label: string; color: string; icon: React.ReactNode }> = {
  present: {
    label: 'Présent',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  absent: {
    label: 'Absent',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  retard: {
    label: 'Retard',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  excuse: {
    label: 'Excusé',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <Shield className="h-3.5 w-3.5" />,
  },
}

export function AttendanceTable({ matiere, date_cours, rows: initialRows }: Props) {
  const router = useRouter()
  const [rows, setRows] = useState(() =>
    initialRows.map((r) => ({
      etudiant_id: r.etudiant.id,
      matricule: r.etudiant.matricule,
      nom: r.etudiant.nom,
      prenom: r.etudiant.prenom,
      statut: (r.presence?.statut ?? 'absent') as Statut,
      justification: r.presence?.justification ?? '',
    }))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function updateRow(idx: number, field: 'statut' | 'justification', value: string) {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  function markAll(statut: Statut) {
    setRows((prev) => prev.map((r) => ({ ...r, statut })))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const presences = rows.map((r) => ({
        etudiant_id: r.etudiant_id,
        matiere_id: matiere.id,
        date_cours,
        statut: r.statut,
        justification: r.justification || null,
      }))
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presences }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSaved(true)
        setTimeout(() => router.push('/attendance'), 1200)
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setSaving(false)
    }
  }

  const stats = {
    present: rows.filter((r) => r.statut === 'present').length,
    absent: rows.filter((r) => r.statut === 'absent').length,
    retard: rows.filter((r) => r.statut === 'retard').length,
    excuse: rows.filter((r) => r.statut === 'excuse').length,
  }

  const dateFormatted = new Date(date_cours + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  if (rows.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg font-medium">Aucun étudiant inscrit</p>
        <p className="text-sm mt-1">Il n&apos;y a pas d&apos;étudiants inscrits dans ce niveau pour cette filière.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {matiere.code} — {matiere.nom}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">{dateFormatted}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="text-xs">{matiere.filiere?.nom}</Badge>
              <Badge variant="outline" className="text-xs">{matiere.niveau?.nom}</Badge>
              <Badge variant="outline" className="text-xs">Semestre {matiere.semestre}</Badge>
            </div>
          </div>
          <div className="flex gap-3 text-sm">
            {Object.entries(stats).map(([key, val]) => (
              <div key={key} className={`px-3 py-1.5 rounded-lg border text-center ${STATUT_CONFIG[key as Statut].color}`}>
                <div className="font-bold text-lg leading-none">{val}</div>
                <div className="text-xs mt-0.5">{STATUT_CONFIG[key as Statut].label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 mr-1">Marquer tous :</span>
        {(['present', 'absent', 'retard', 'excuse'] as Statut[]).map((s) => (
          <Button
            key={s}
            variant="outline"
            size="sm"
            className={`h-7 text-xs gap-1 border ${STATUT_CONFIG[s].color}`}
            onClick={() => markAll(s)}
          >
            {STATUT_CONFIG[s].icon}
            {STATUT_CONFIG[s].label}
          </Button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Présences enregistrées avec succès ! Redirection…
        </div>
      )}

      {/* Save button top */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || saved}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Enregistrement…' : 'Enregistrer les présences'}
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-600 w-8">#</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Matricule</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Nom</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Prénom</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 w-40">Statut</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Justification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row, idx) => {
              const cfg = STATUT_CONFIG[row.statut]
              const needsJustif = row.statut === 'absent' || row.statut === 'excuse'
              return (
                <tr key={row.etudiant_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-2.5 px-4 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="py-2.5 px-4 font-mono text-xs text-gray-500">{row.matricule}</td>
                  <td className="py-2.5 px-4 font-medium text-gray-900 uppercase">{row.nom}</td>
                  <td className="py-2.5 px-4 text-gray-700">{row.prenom}</td>
                  <td className="py-2.5 px-4">
                    <Select
                      value={row.statut}
                      onValueChange={(v) => updateRow(idx, 'statut', v)}
                    >
                      <SelectTrigger className={`h-8 text-xs w-36 border ${cfg.color}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(STATUT_CONFIG) as [Statut, typeof STATUT_CONFIG[Statut]][]).map(([s, c]) => (
                          <SelectItem key={s} value={s}>
                            <span className="flex items-center gap-1.5">
                              {c.icon} {c.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-2 px-4">
                    {needsJustif ? (
                      <Textarea
                        value={row.justification}
                        onChange={(e) => updateRow(idx, 'justification', e.target.value)}
                        placeholder="Motif (optionnel)"
                        className="h-8 min-h-0 resize-none text-xs py-1.5"
                        rows={1}
                      />
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

      {/* Save button bottom */}
      <div className="flex justify-end pb-4">
        <Button
          onClick={handleSave}
          disabled={saving || saved}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Enregistrement…' : 'Enregistrer les présences'}
        </Button>
      </div>
    </div>
  )
}
