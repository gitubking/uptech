'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteMatiere } from '@/app/actions/matieres'

export function MatiereDeleteButton({ matiereId, nom }: { matiereId: string; nom: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (!confirm(`Supprimer "${nom}" du catalogue ?`)) return
    setLoading(true)
    setError(null)
    try {
      const result = await deleteMatiere(matiereId)
      if (result.error) { setError(result.error); return }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={loading}
        className="h-7 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
      {error && <p className="text-xs text-red-600 max-w-48 text-right">{error}</p>}
    </div>
  )
}
