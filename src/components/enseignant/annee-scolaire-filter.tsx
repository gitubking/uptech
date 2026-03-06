'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  annees: { id: string; libelle: string; actif: boolean }[]
  selected: string
}

export function AnneeScolaireFilter({ annees, selected }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('annee', value)
    } else {
      params.delete('annee')
    }
    router.push(`?${params.toString()}`)
  }

  const selectedAnnee = annees.find(a => a.id === selected)

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <span className="text-xs text-gray-400">Année scolaire</span>
      <Select value={selected} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-36 text-sm border-gray-200 bg-white">
          <SelectValue placeholder="Toutes">
            {selectedAnnee?.libelle ?? 'Toutes'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Toutes</SelectItem>
          {annees.map(a => (
            <SelectItem key={a.id} value={a.id}>
              {a.libelle}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
