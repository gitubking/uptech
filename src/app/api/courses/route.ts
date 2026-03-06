import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

function getTable(type: string): string | null {
  if (type === 'filiere') return 'filieres'
  if (type === 'niveau') return 'niveaux'
  if (type === 'matiere') return 'programme' // matieres est maintenant un catalogue simple
  return null
}

export async function POST(request: NextRequest) {
  try {
    const db = createAdminClient()
    const body = await request.json()
    const { type, ...data } = body

    if (type === 'matiere') {
      // 1. Créer ou récupérer la matière catalogue (code + nom uniquement)
      const { code, nom, filiere_id, semestre, coefficient, credit, volume_horaire, enseignant_id } = data
      const { data: mat, error: me } = await db
        .from('matieres').upsert({ code, nom }, { onConflict: 'code' }).select('id').single()
      if (me) return NextResponse.json({ error: me.message }, { status: 400 })

      // 2. Trouver l'année académique active
      const { data: annee } = await db
        .from('annees_academiques').select('id').eq('actif', true).limit(1).single()

      // 3. Insérer dans programme
      const progData: Record<string, unknown> = {
        matiere_id: mat!.id, filiere_id, semestre, coefficient, credit, volume_horaire,
        annee_academique_id: annee?.id,
      }
      if (enseignant_id && enseignant_id !== 'none') progData.enseignant_id = enseignant_id
      const { data: result, error: pe } = await db.from('programme').insert(progData).select().single()
      if (pe) return NextResponse.json({ error: pe.message }, { status: 400 })
      return NextResponse.json({ success: true, data: result })
    }

    const table = getTable(type)
    if (!table) return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
    const { data: result, error } = await db.from(table).insert(data).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error('Courses POST error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = createAdminClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

    const body = await request.json()
    const { type, ...data } = body

    if (type === 'matiere') {
      // id = programme.id ; matiere_id = matieres catalogue id
      const { code, nom, matiere_id, filiere_id, semestre, coefficient, credit, volume_horaire, enseignant_id } = data

      // Mettre à jour la matière catalogue si matiere_id fourni
      if (matiere_id && (code || nom)) {
        await db.from('matieres').update({ code, nom }).eq('id', matiere_id)
      }

      // Mettre à jour le programme
      const progUpdate: Record<string, unknown> = { filiere_id, semestre, coefficient, credit, volume_horaire }
      progUpdate.enseignant_id = (enseignant_id && enseignant_id !== 'none') ? enseignant_id : null
      const { data: result, error } = await db.from('programme').update(progUpdate).eq('id', id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true, data: result })
    }

    const table = getTable(type)
    if (!table) return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
    const { data: result, error } = await db.from(table).update(data).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error('Courses PUT error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = createAdminClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    if (!id || !type) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })

    // Pour les matières : supprimer l'entrée programme (pas le catalogue)
    const table = type === 'matiere' ? 'programme' : getTable(type)
    if (!table) return NextResponse.json({ error: 'Type invalide' }, { status: 400 })

    const { error } = await db.from(table).delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Courses DELETE error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
