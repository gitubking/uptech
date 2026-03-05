'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, CheckCircle } from 'lucide-react'

interface Props {
  studentId: string
  statut: string
}

export function StudentActions({ studentId, statut }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'delete' | 'activate' | null>(null)

  async function handleDelete() {
    if (!confirm('Supprimer cet étudiant définitivement ?')) return
    setLoading('delete')
    try {
      const res = await fetch(`/api/students?id=${studentId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.error) router.push('/students')
    } finally {
      setLoading(null)
    }
  }

  async function handleActivate() {
    setLoading('activate')
    try {
      const res = await fetch(`/api/students?id=${studentId}&status=inscrit`, { method: 'PUT' })
      const data = await res.json()
      if (!data.error) router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <Button
        variant="outline" size="sm"
        className="gap-2 text-red-600 hover:text-red-800 hover:bg-red-50 border-red-200"
        onClick={handleDelete}
        disabled={loading !== null}
      >
        <Trash2 className="h-3.5 w-3.5" />
        {loading === 'delete' ? 'Suppression...' : 'Supprimer'}
      </Button>

      {statut === 'preinscrit' && (
        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 text-sm"
          onClick={handleActivate}
          disabled={loading !== null}
        >
          <CheckCircle className="h-4 w-4" />
          {loading === 'activate' ? 'Validation...' : "Valider l'inscription"}
        </Button>
      )}
    </>
  )
}
