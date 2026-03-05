import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

async function generateMatricule() {
  const db = createAdminClient()
  const year = new Date().getFullYear().toString()
  const { count } = await db.from('enseignants').select('*', { count: 'exact', head: true })
  const seq = ((count ?? 0) + 1).toString().padStart(4, '0')
  return `ENS${year}${seq}`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const db = createAdminClient()
    const matricule = await generateMatricule()

    const data = {
      nom: (formData.get('nom') as string)?.toUpperCase() ?? '',
      prenom: (formData.get('prenom') as string) ?? '',
      email: (formData.get('email') as string) ?? '',
      telephone: (formData.get('telephone') as string) ?? '',
      specialite: (formData.get('specialite') as string) ?? '',
      type_contrat: (formData.get('type_contrat') as string) || 'vacataire',
      date_embauche: (formData.get('date_embauche') as string) || null,
      actif: true,
      matricule,
    }

    const { data: teacher, error } = await db
      .from('enseignants')
      .insert(data)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true, id: teacher.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const toggle = searchParams.get('toggle') === 'true'
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

    const formData = await request.formData()
    const db = createAdminClient()

    // Mode toggle : seulement le champ actif
    if (toggle) {
      const actif = formData.get('actif') === 'true'
      const { error } = await db.from('enseignants').update({ actif }).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true, id })
    }

    const data = {
      nom: (formData.get('nom') as string)?.toUpperCase() ?? '',
      prenom: (formData.get('prenom') as string) ?? '',
      email: (formData.get('email') as string) ?? '',
      telephone: (formData.get('telephone') as string) ?? '',
      specialite: (formData.get('specialite') as string) ?? '',
      type_contrat: (formData.get('type_contrat') as string) || 'vacataire',
      date_embauche: (formData.get('date_embauche') as string) || null,
      actif: formData.get('actif') === 'true',
    }

    const { error } = await db.from('enseignants').update(data).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true, id })
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
    await db.from('enseignants').delete().eq('id', id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
