import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST: batch upsert presences
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { presences } = body as {
      presences: {
        etudiant_id: string
        matiere_id: string
        date_cours: string
        statut: string
        justification?: string
      }[]
    }

    if (!presences || presences.length === 0) {
      return NextResponse.json({ error: 'Aucune présence à enregistrer' }, { status: 400 })
    }

    const db = createAdminClient()

    const records = presences.map((p) => ({
      etudiant_id: p.etudiant_id,
      matiere_id: p.matiere_id,
      date_cours: p.date_cours,
      statut: p.statut,
      justification: p.justification ?? null,
    }))

    const { error } = await db
      .from('presences')
      .upsert(records, { onConflict: 'etudiant_id,matiere_id,date_cours' })

    if (error) {
      console.error('Attendance upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, count: records.length })
  } catch (err) {
    console.error('Attendance API error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
