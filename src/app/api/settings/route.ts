import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const db = createAdminClient()
    const body = await request.json()
    const { type, ...data } = body

    if (type === 'annee') {
      // Ensure only one active year at a time — deactivate others if actif=true
      if (data.actif === true) {
        await db.from('annees_academiques').update({ actif: false }).neq('id', 'none')
      }
      const { data: result, error } = await db
        .from('annees_academiques')
        .insert(data)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true, data: result })
    }

    return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
  } catch (err) {
    console.error('Settings POST error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = createAdminClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    if (!id || !type) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })

    const body = await request.json()
    const { type: _t, ...data } = body

    if (type === 'annee') {
      // If setting as active, deactivate all others first
      if (data.actif === true) {
        await db.from('annees_academiques').update({ actif: false }).neq('id', id)
      }
      const { data: result, error } = await db
        .from('annees_academiques')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true, data: result })
    }

    if (type === 'profile') {
      const { data: result, error } = await db
        .from('profiles')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true, data: result })
    }

    return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
  } catch (err) {
    console.error('Settings PUT error:', err)
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

    if (type === 'annee') {
      // Check if active — don't allow deleting active year
      const { data: annee } = await db.from('annees_academiques').select('actif').eq('id', id).single()
      if (annee?.actif) {
        return NextResponse.json({ error: 'Impossible de supprimer l\'année académique active' }, { status: 400 })
      }
      const { error } = await db.from('annees_academiques').delete().eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
  } catch (err) {
    console.error('Settings DELETE error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
