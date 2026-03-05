'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

interface Props {
  filieres: { id: string; nom: string; code: string; type_formation?: string | null }[]
  niveaux: { id: string; nom: string; filiere_id: string }[]
}

const TYPE_LABELS: Record<string, string> = {
  academique: 'Académique',
  certifiante: 'Certifiante',
  acceleree: 'Accélérée',
}

export function StudentsFilters({ filieres, niveaux }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const search = searchParams.get('search') ?? ''
  const type_formation = searchParams.get('type_formation') ?? ''
  const filiere_id = searchParams.get('filiere_id') ?? ''
  const niveau_id = searchParams.get('niveau_id') ?? ''
  const statut = searchParams.get('statut') ?? ''

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    if (key === 'type_formation') { params.delete('filiere_id'); params.delete('niveau_id') }
    if (key === 'filiere_id') params.delete('niveau_id')
    router.push(`${pathname}?${params.toString()}`)
  }, [searchParams, pathname, router])

  const clearAll = () => router.push(pathname)

  const hasFilters = search || type_formation || filiere_id || niveau_id || statut
  const filteredFilieres = type_formation ? filieres.filter(f => f.type_formation === type_formation) : filieres
  const filteredNiveaux = filiere_id ? niveaux.filter(n => n.filiere_id === filiere_id) : []
  const showNiveaux = type_formation === 'academique' && filiere_id

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex flex-wrap gap-3 items-center">

        {/* Recherche */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, matricule, email..."
            defaultValue={search}
            onChange={(e) => {
              clearTimeout((window as unknown as { searchTimeout: ReturnType<typeof setTimeout> }).searchTimeout)
              ;(window as unknown as { searchTimeout: ReturnType<typeof setTimeout> }).searchTimeout = setTimeout(
                () => updateParam('search', e.target.value), 400
              )
            }}
            className="pl-9 h-9 bg-gray-50 border-gray-200 text-sm"
          />
        </div>

        {/* Type de formation */}
        <Select value={type_formation} onValueChange={(v) => updateParam('type_formation', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-36 h-9 bg-gray-50 border-gray-200 text-sm">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filière */}
        <Select value={filiere_id} onValueChange={(v) => updateParam('filiere_id', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44 h-9 bg-gray-50 border-gray-200 text-sm">
            <SelectValue placeholder="Toutes les filières" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les filières</SelectItem>
            {filteredFilieres.map(f => (
              <SelectItem key={f.id} value={f.id}>{f.code} — {f.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Niveau — uniquement pour académique + filière sélectionnée */}
        {showNiveaux && (
        <Select value={niveau_id} onValueChange={(v) => updateParam('niveau_id', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-36 h-9 bg-gray-50 border-gray-200 text-sm">
            <SelectValue placeholder="Niveau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous niveaux</SelectItem>
            {filteredNiveaux.map(n => (
              <SelectItem key={n.id} value={n.id}>{n.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        )}

        {/* Statut */}
        <Select value={statut} onValueChange={(v) => updateParam('statut', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-36 h-9 bg-gray-50 border-gray-200 text-sm">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="inscrit">Inscrit</SelectItem>
            <SelectItem value="preinscrit">Préinscrit</SelectItem>
            <SelectItem value="diplome">Diplômé</SelectItem>
            <SelectItem value="abandonne">Abandonné</SelectItem>
            <SelectItem value="suspendu">Suspendu</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset */}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll}
            className="text-gray-500 hover:text-gray-800 gap-1.5 h-9">
            <X className="h-3.5 w-3.5" />
            Effacer
          </Button>
        )}
      </div>
    </div>
  )
}
