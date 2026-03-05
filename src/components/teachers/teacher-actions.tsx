'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, CheckCircle, XCircle } from 'lucide-react'

interface Props {
  teacherId: string
  isActif: boolean
}

export function TeacherActions({ teacherId, isActif }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'delete' | 'toggle' | null>(null)

  async function handleDelete() {
    if (!confirm('Supprimer cet enseignant définitivement ?')) return
    setLoading('delete')
    try {
      const res = await fetch(`/api/teachers?id=${teacherId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.error) router.push('/teachers')
    } finally {
      setLoading(null)
    }
  }

  async function handleToggle() {
    setLoading('toggle')
    try {
      const formData = new FormData()
      formData.set('actif', String(!isActif))
      const res = await fetch(`/api/teachers?id=${teacherId}&toggle=true`, { method: 'PUT', body: formData })
      const data = await res.json()
      if (!data.error) router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline" size="sm"
        className="gap-2 text-red-600 hover:text-red-800 hover:bg-red-50 border-red-200"
        onClick={handleDelete}
        disabled={loading !== null}
      >
        <Trash2 className="h-3.5 w-3.5" />
        {loading === 'delete' ? 'Suppression...' : 'Supprimer'}
      </Button>

      <Button
        variant="outline" size="sm"
        className={`gap-2 text-sm ${
          isActif
            ? 'text-red-600 hover:text-red-800 hover:bg-red-50 border-red-200'
            : 'text-green-600 hover:text-green-800 hover:bg-green-50 border-green-200'
        }`}
        onClick={handleToggle}
        disabled={loading !== null}
      >
        {loading === 'toggle' ? (
          'En cours...'
        ) : isActif ? (
          <><XCircle className="h-4 w-4" /> Désactiver</>
        ) : (
          <><CheckCircle className="h-4 w-4" /> Activer</>
        )}
      </Button>
    </div>
  )
}
