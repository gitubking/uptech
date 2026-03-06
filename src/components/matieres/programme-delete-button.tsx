'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { removeMatiereduProgramme } from '@/app/actions/matieres'

export function ProgrammeDeleteButton({ programmeId }: { programmeId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Retirer cette matière du programme de la filière ?')) return
    setLoading(true)
    try {
      await removeMatiereduProgramme(programmeId)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="h-7 px-2 text-red-400 hover:text-red-600 hover:bg-red-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  )
}
