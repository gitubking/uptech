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
      niveau_entree: (formData.get('niveau_entree') as string) || 'bfem',
      matricule: '',
    }

    const { data: student, error } = await db
      .from('etudiants')
      .insert(data)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Envoyer l'invitation email via Supabase Auth
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://uptech-taupe.vercel.app'
    const { data: authData, error: authError } = await db.auth.admin.inviteUserByEmail(data.email, {
      redirectTo: `${siteUrl}/update-password`,
      data: { role: 'etudiant' },
    })

    if (authError) {
      console.error('Invite error:', authError.message)
      return NextResponse.json({ success: true, id: student.id, inviteError: authError.message })
    }

    if (authData?.user) {
      await db.from('profiles').insert({
        user_id: authData.user.id,
        role: 'etudiant',
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
      })
    }

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

    const db = createAdminClient()

    // Mode statut uniquement
    if (statusOnly) {
      const { error } = await db.from('etudiants').update({ statut: statusOnly }).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true, id })
    }

    const formData = await request.formData()

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
      niveau_entree: (formData.get('niveau_entree') as string) || 'bfem',
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

    // Récupérer l'email pour supprimer le compte Auth
    const { data: student } = await db.from('etudiants').select('email').eq('id', id).single()

    await db.from('etudiants').delete().eq('id', id)

    // Supprimer le compte Auth et le profil associé
    if (student?.email) {
      const { data: authUsers } = await db.auth.admin.listUsers()
      const authUser = authUsers?.users?.find(u => u.email === student.email)
      if (authUser) {
        await db.auth.admin.deleteUser(authUser.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
