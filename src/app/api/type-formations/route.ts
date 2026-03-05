import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const db = await createAdminClient()
    const { data, error } = await db
      .from('type_formations')
      .select('*')
      .order('nom')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('type-formations GET error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await createAdminClient()
    const body = await request.json()
    const { data, error } = await db
      .from('type_formations')
      .insert({
        nom: body.nom,
        code: (body.code as string)?.toUpperCase().replace(/\s+/g, '_'),
        description: body.description || null,
        tarif_horaire: parseFloat(body.tarif_horaire) || 0,
        methode_paiement: body.methode_paiement || 'horaire',
        actif: body.actif !== false,
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('type-formations POST error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await createAdminClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

    const body = await request.json()
    const { data, error } = await db
      .from('type_formations')
      .update({
        nom: body.nom,
        code: (body.code as string)?.toUpperCase().replace(/\s+/g, '_'),
        description: body.description || null,
        tarif_horaire: parseFloat(body.tarif_horaire) || 0,
        methode_paiement: body.methode_paiement || 'horaire',
        actif: body.actif !== false,
      })
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('type-formations PUT error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await createAdminClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    const { error } = await db.from('type_formations').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('type-formations DELETE error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
