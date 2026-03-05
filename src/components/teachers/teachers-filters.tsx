'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Search, X } from 'lucide-react'

export function TeachersFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const search = searchParams.get('search') ?? ''
  const type_contrat = searchParams.get('type_contrat') ?? ''
  const actif = searchParams.get('actif') ?? ''

  const hasFilters = search || type_contrat || actif

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    startTransition(() => router.push(`/teachers?${params.toString()}`))
  }, [router, searchParams])

  const clearAll = () => {
    startTransition(() => router.push('/teachers'))
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Recherche */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-9 h-9 bg-white border-gray-200"
          placeholder="Rechercher un enseignant..."
          defaultValue={search}
          onChange={(e) => {
            const v = e.target.value
            const timer = setTimeout(() => updateParam('search', v), 350)
            return () => clearTimeout(timer)
          }}
        />
      </div>

      {/* Type de contrat */}
      <Select value={type_contrat} onValueChange={(v) => updateParam('type_contrat', v === 'all' ? '' : v)}>
        <SelectTrigger className="h-9 w-[155px] bg-white border-gray-200 text-sm">
          <SelectValue placeholder="Contrat" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les contrats</SelectItem>
          <SelectItem value="permanent">Permanent</SelectItem>
          <SelectItem value="vacataire">Vacataire</SelectItem>
        </SelectContent>
      </Select>

      {/* Statut */}
      <Select value={actif} onValueChange={(v) => updateParam('actif', v === 'all' ? '' : v)}>
        <SelectTrigger className="h-9 w-[130px] bg-white border-gray-200 text-sm">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          <SelectItem value="true">Actifs</SelectItem>
          <SelectItem value="false">Inactifs</SelectItem>
        </SelectContent>
      </Select>

      {/* Effacer */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll}
          className="h-9 gap-1 text-gray-500 hover:text-gray-800">
          <X className="h-3.5 w-3.5" />
          Effacer
        </Button>
      )}
    </div>
  )
}
