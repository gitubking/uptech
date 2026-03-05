import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

function getTable(type: string): string | null {
  if (type === 'filiere') return 'filieres'
  if (type === 'niveau') return 'niveaux'
  if (type === 'matiere') return 'matieres'
  return null
}

export async function POST(request: NextRequest) {
  try {
    const db = createAdminClient()
    const body = await request.json()
    const { type, ...data } = body

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

    const table = getTable(type)
    if (!table) return NextResponse.json({ error: 'Type invalide' }, { status: 400 })

    const { error } = await db.from(table).delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Courses DELETE error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
