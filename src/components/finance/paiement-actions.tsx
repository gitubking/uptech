'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, CheckCircle } from 'lucide-react'

interface Props {
  paiementId: string
  statut: string
}

export function PaiementActions({ paiementId, statut }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'delete' | 'pay' | null>(null)

  async function handleDelete() {
    if (!confirm('Supprimer ce paiement définitivement ?')) return
    setLoading('delete')
    try {
      const res = await fetch(`/api/finance?id=${paiementId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.error) router.push('/finance')
    } finally {
      setLoading(null)
    }
  }

  async function handleMarkPaid() {
    setLoading('pay')
    try {
      const fd = new FormData()
      fd.set('statut', 'paye')
      const res = await fetch(`/api/finance?id=${paiementId}`, { method: 'PUT', body: fd })
      const data = await res.json()
      if (!data.error) router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2">
      {statut !== 'paye' && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkPaid}
          disabled={loading !== null}
          className="gap-1.5 text-green-700 border-green-200 hover:bg-green-50"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          {loading === 'pay' ? 'En cours…' : 'Marquer payé'}
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        disabled={loading !== null}
        className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {loading === 'delete' ? 'Suppression…' : 'Supprimer'}
      </Button>
    </div>
  )
}
