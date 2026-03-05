import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// ─── POST : batch upsert notes ───────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { notes } = body as {
      notes: {
        etudiant_id: string
        matiere_id: string
        annee_academique_id: string
        note_normale?: number | null
        note_rattrapage?: number | null
      }[]
    }

    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return NextResponse.json({ error: 'Aucune note fournie' }, { status: 400 })
    }

    const db = createAdminClient()

    const validNotes = notes
      .filter(
        (n) =>
          n.etudiant_id &&
          n.matiere_id &&
          n.annee_academique_id &&
          (
            (n.note_normale !== null && n.note_normale !== undefined) ||
            (n.note_rattrapage !== null && n.note_rattrapage !== undefined)
          )
      )
      .map((n) => ({
        etudiant_id: n.etudiant_id,
        matiere_id: n.matiere_id,
        annee_academique_id: n.annee_academique_id,
        note_normale: n.note_normale ?? null,
        note_rattrapage: n.note_rattrapage ?? null,
      }))

    if (validNotes.length === 0) {
      return NextResponse.json({ success: true, count: 0 })
    }

    const { data, error } = await db
      .from('notes')
      .upsert(validNotes, {
        onConflict: 'etudiant_id,matiere_id,annee_academique_id',
        ignoreDuplicates: false,
      })
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true, count: data?.length ?? 0 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ─── DELETE : supprimer une note par id ──────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

    const db = createAdminClient()
    const { error } = await db.from('notes').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
