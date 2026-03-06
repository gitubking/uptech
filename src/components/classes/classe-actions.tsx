'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, RefreshCw } from 'lucide-react'
import { deleteClasse, updateClasseStatut } from '@/app/actions/classes'

interface Props {
  classeId: string
  statut: string
}

const STATUTS = [
  { value: 'en_preparation', label: 'En préparation' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'terminee', label: 'Terminée' },
  { value: 'annulee', label: 'Annulée' },
]

export function ClasseActions({ classeId, statut }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'delete' | 'statut' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleStatutChange(newStatut: string) {
    setLoading('statut')
    setError(null)
    try {
      const result = await updateClasseStatut(classeId, newStatut)
      if (result.error) setError(result.error)
      else router.refresh()
    } finally {
      setLoading(null)
    }
  }

  async function handleDelete() {
    if (!confirm('Supprimer cette classe définitivement ?')) return
    setLoading('delete')
    setError(null)
    try {
      const result = await deleteClasse(classeId)
      if (result.error) { setError(result.error); return }
      router.push('/classes')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <Select value={statut} onValueChange={handleStatutChange} disabled={loading !== null}>
        <SelectTrigger className="h-8 text-xs w-40">
          <RefreshCw className="h-3 w-3 mr-1.5" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        disabled={loading !== null}
        className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {loading === 'delete' ? 'Suppression…' : 'Supprimer'}
      </Button>
    </div>
  )
}
