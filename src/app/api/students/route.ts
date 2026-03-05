import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const db = createAdminClient()

    const data = {
      nom: (formData.get('nom') as string)?.toUpperCase() ?? '',
      prenom: (formData.get('prenom') as string) ?? '',
      date_naissance: (formData.get('date_naissance') as string) ?? '',
      lieu_naissance: (formData.get('lieu_naissance') as string) ?? '',
      sexe: (formData.get('sexe') as string) ?? '',
      nationalite: (formData.get('nationalite') as string) || 'Congolaise',
      adresse: (formData.get('adresse') as string) ?? '',
      email: (formData.get('email') as string) ?? '',
      telephone: (formData.get('telephone') as string) ?? '',
      telephone_parent: (formData.get('telephone_parent') as string) ?? '',
      email_parent: (formData.get('email_parent') as string) ?? '',
      filiere_id: (formData.get('filiere_id') as string) ?? '',
      niveau_id: (formData.get('niveau_id') as string) ?? '',
      annee_academique_id: (formData.get('annee_academique_id') as string) ?? '',
      statut: (formData.get('statut') as string) || 'preinscrit',
      matricule: '',
    }

    const { data: student, error } = await db
      .from('etudiants')
      .insert(data)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true, id: student.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const statusOnly = searchParams.get('status')
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

    const formData = await request.formData()
    const db = createAdminClient()

    // Mode statut uniquement
    if (statusOnly) {
      const { error } = await db.from('etudiants').update({ statut: statusOnly }).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true, id })
    }

    const data = {
      nom: (formData.get('nom') as string)?.toUpperCase() ?? '',
      prenom: (formData.get('prenom') as string) ?? '',
      date_naissance: (formData.get('date_naissance') as string) ?? '',
      lieu_naissance: (formData.get('lieu_naissance') as string) ?? '',
      sexe: (formData.get('sexe') as string) ?? '',
      nationalite: (formData.get('nationalite') as string) ?? '',
      adresse: (formData.get('adresse') as string) ?? '',
      email: (formData.get('email') as string) ?? '',
      telephone: (formData.get('telephone') as string) ?? '',
      telephone_parent: (formData.get('telephone_parent') as string) ?? '',
      email_parent: (formData.get('email_parent') as string) ?? '',
      filiere_id: (formData.get('filiere_id') as string) ?? '',
      niveau_id: (formData.get('niveau_id') as string) ?? '',
      statut: (formData.get('statut') as string) ?? '',
    }

    const { error } = await db.from('etudiants').update(data).eq('id', id)
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
    await db.from('etudiants').delete().eq('id', id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
