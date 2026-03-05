'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CalendarCheck } from 'lucide-react'

interface Matiere {
  id: string
  nom: string
  code: string
  semestre: string
  filiere: { nom: string; code: string } | null
  niveau: { nom: string } | null
  filiere_id?: string
  niveau_id?: string
}

interface Filiere {
  id: string
  nom: string
  code: string
}

interface Niveau {
  id: string
  nom: string
  filiere_id: string
}

interface Props {
  matieres: Matiere[]
  filieres: Filiere[]
  niveaux: Niveau[]
}

export function AttendanceFilter({ matieres, filieres, niveaux }: Props) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  const [filiereId, setFiliereId] = useState('')
  const [niveauId, setNiveauId] = useState('')
  const [matiereId, setMatiereId] = useState('')
  const [date, setDate] = useState(today)

  const filteredNiveaux = filiereId
    ? niveaux.filter((n) => n.filiere_id === filiereId)
    : niveaux

  const filteredMatieres = matieres.filter((m) => {
    const mf = m as { filiere_id?: string; niveau_id?: string }
    if (filiereId && mf.filiere_id !== filiereId) return false
    if (niveauId && mf.niveau_id !== niveauId) return false
    return true
  })

  // Reset matiere when filiere changes
  useEffect(() => {
    setMatiereId('')
    setNiveauId('')
  }, [filiereId])

  useEffect(() => {
    setMatiereId('')
  }, [niveauId])

  function handleAccess() {
    if (!matiereId || !date) return
    router.push(`/attendance/saisir?matiere_id=${matiereId}&date=${date}`)
  }

  const canAccess = !!(matiereId && date)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <CalendarCheck className="h-5 w-5 text-blue-600" />
        <h2 className="text-base font-semibold text-gray-800">Saisir une séance</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Filière */}
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Filière</Label>
          <Select value={filiereId || 'all'} onValueChange={(v) => setFiliereId(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Toutes les filières" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les filières</SelectItem>
              {filieres.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.code} — {f.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Niveau */}
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Niveau</Label>
          <Select value={niveauId || 'all'} onValueChange={(v) => setNiveauId(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Tous les niveaux" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les niveaux</SelectItem>
              {filteredNiveaux.map((n) => (
                <SelectItem key={n.id} value={n.id}>{n.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Matière */}
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Matière *</Label>
          <Select value={matiereId || 'none'} onValueChange={(v) => setMatiereId(v === 'none' ? '' : v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Choisir une matière" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Choisir une matière</SelectItem>
              {filteredMatieres.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.code} — {m.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Date du cours *</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 text-sm"
            max={today}
          />
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button
          onClick={handleAccess}
          disabled={!canAccess}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <CalendarCheck className="h-4 w-4" />
          Accéder à la séance
        </Button>
      </div>
    </div>
  )
}
