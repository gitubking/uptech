'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { SlidersHorizontal, X } from 'lucide-react'

interface Filiere {
  id: string
  nom: string
  code: string
}

interface Niveau {
  id: string
  nom: string
  filiere_id: string
  ordre: number
}

interface Props {
  filieres: Filiere[]
  niveaux: Niveau[]
}

export function GradesFilters({ filieres, niveaux }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filiere_id = searchParams.get('filiere_id') ?? ''
  const niveau_id = searchParams.get('niveau_id') ?? ''
  const semestre = searchParams.get('semestre') ?? ''

  const filteredNiveaux = filiere_id
    ? niveaux.filter((n) => n.filiere_id === filiere_id)
    : niveaux

  const hasFilters = !!(filiere_id || niveau_id || semestre)

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  function clearFilters() {
    router.push(pathname)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-600">Filtres</span>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="ml-auto text-xs text-gray-400 hover:text-gray-700 h-7 gap-1"
          >
            <X className="h-3 w-3" />
            Réinitialiser
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select
          value={filiere_id || 'all'}
          onValueChange={(v) =>
            updateParams({ filiere_id: v === 'all' ? '' : v, niveau_id: '' })
          }
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Toutes les filières" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les filières</SelectItem>
            {filieres.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.code} — {f.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={niveau_id || 'all'}
          onValueChange={(v) => updateParams({ niveau_id: v === 'all' ? '' : v })}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Tous les niveaux" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les niveaux</SelectItem>
            {filteredNiveaux.map((n) => (
              <SelectItem key={n.id} value={n.id}>
                {n.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={semestre || 'all'}
          onValueChange={(v) => updateParams({ semestre: v === 'all' ? '' : v })}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Tous les semestres" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les semestres</SelectItem>
            <SelectItem value="1">Semestre 1</SelectItem>
            <SelectItem value="2">Semestre 2</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
