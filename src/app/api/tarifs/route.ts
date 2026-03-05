import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const db = createAdminClient()

    const data = {
      filiere_id: formData.get('filiere_id') as string,
      annee_academique_id: formData.get('annee_academique_id') as string,
      frais_inscription: Number(formData.get('frais_inscription') ?? 0),
      mensualite: Number(formData.get('mensualite') ?? 0),
      nb_mensualites: Number(formData.get('nb_mensualites') ?? 10),
    }

    if (!data.filiere_id || !data.annee_academique_id) {
      return NextResponse.json({ error: 'Filière et année obligatoires' }, { status: 400 })
    }

    const { data: tarif, error } = await db
      .from('tarifs')
      .upsert(data, { onConflict: 'filiere_id,annee_academique_id' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, id: tarif.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

    const db = createAdminClient()
    const { error } = await db.from('tarifs').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
