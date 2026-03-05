'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'

interface Props {
  studentId: string
  anneeId?: string
  studentName: string
}

export function DownloadBulletinBtn({ studentId, anneeId, studentName }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const url = anneeId
        ? `/api/bulletin/${studentId}?annee_id=${anneeId}`
        : `/api/bulletin/${studentId}`

      const res = await fetch(url)
      if (!res.ok) throw new Error('Erreur génération PDF')

      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `bulletin_${studentName.replace(/\s+/g, '_')}.pdf`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (err) {
      alert('Impossible de générer le PDF. Réessayez.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={loading}
      className="gap-2 bg-black hover:bg-gray-900 text-white"
      size="sm"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {loading ? 'Génération...' : 'Télécharger PDF'}
    </Button>
  )
}
