'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Récupérer tous les enseignants ────────────────────────────────────────
export async function getTeachers(filters?: {
  search?: string
  type_contrat?: string
  specialite?: string
  actif?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('enseignants')
    .select(`
      *,
      programme(id, semestre, matiere:matieres(id, nom, code), filiere:filieres(id, nom, code))
    `)
    .order('nom', { ascending: true })

  if (filters?.search) {
    query = query.or(
      `nom.ilike.%${filters.search}%,prenom.ilike.%${filters.search}%,matricule.ilike.%${filters.search}%,email.ilike.%${filters.search}%,specialite.ilike.%${filters.search}%`
    )
  }
  if (filters?.type_contrat) query = query.eq('type_contrat', filters.type_contrat)
  if (filters?.actif !== undefined && filters?.actif !== '') {
    query = query.eq('actif', filters.actif === 'true')
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

// ─── Récupérer un enseignant par ID ────────────────────────────────────────
export async function getTeacherById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('enseignants')
    .select(`
      *,
      programme(id, semestre, coefficient, credit, volume_horaire,
        matiere:matieres(id, nom, code),
        filiere:filieres(id, nom, code),
        annee_academique:annees_academiques(id, libelle)
      )
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// ─── Générer un matricule enseignant ─────────────────────────────────────
async function generateMatriculeEnseignant() {
  const db = createAdminClient()
  const year = new Date().getFullYear().toString()
  const { count } = await db
    .from('enseignants')
    .select('*', { count: 'exact', head: true })
  const seq = ((count ?? 0) + 1).toString().padStart(4, '0')
  return `ENS${year}${seq}`
}

// ─── Créer un enseignant ─────────────────────────────────────────────────
export async function createTeacher(
  _prevState: { error: string; redirectTo?: string } | null,
  formData: FormData
): Promise<{ error: string; redirectTo?: string } | null> {
  const db = createAdminClient()

  const matricule = await generateMatriculeEnseignant()
  const email = (formData.get('email') as string) ?? ''
  const nom = (formData.get('nom') as string)?.toUpperCase() ?? ''
  const prenom = (formData.get('prenom') as string) ?? ''

  const data = {
    nom,
    prenom,
    email,
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

  if (error) return { error: error.message }

  // Créer le compte Auth et envoyer l'email d'invitation
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://uptech-taupe.vercel.app'
  const { data: authData, error: authError } = await db.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/update-password`,
    data: { role: 'enseignant' },
  })

  if (authError) {
    // Enseignant créé mais invitation échouée — retourner un avertissement
    revalidatePath('/teachers')
    return { error: `Enseignant créé, mais invitation email échouée : ${authError.message}`, redirectTo: `/teachers/${teacher.id}` }
  } else if (authData?.user) {
    // Créer le profil lié au compte Auth
    await db.from('profiles').insert({
      user_id: authData.user.id,
      role: 'enseignant',
      nom,
      prenom,
      email,
    })
  }

  revalidatePath('/teachers')
  return { error: '', redirectTo: `/teachers/${teacher.id}` }
}

// ─── Mettre à jour un enseignant ─────────────────────────────────────────
export async function updateTeacher(
  id: string,
  formData: FormData
): Promise<{ error: string; redirectTo?: string }> {
  const db = createAdminClient()

  const data = {
    nom: (formData.get('nom') as string).toUpperCase(),
    prenom: formData.get('prenom') as string,
    email: formData.get('email') as string,
    telephone: formData.get('telephone') as string,
    specialite: formData.get('specialite') as string,
    type_contrat: formData.get('type_contrat') as string,
    date_embauche: (formData.get('date_embauche') as string) || null,
    actif: formData.get('actif') === 'true',
  }

  const { error } = await db.from('enseignants').update(data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/teachers')
  revalidatePath(`/teachers/${id}`)
  return { error: '', redirectTo: `/teachers/${id}` }
}

// ─── Supprimer un enseignant ──────────────────────────────────────────────
export async function deleteTeacher(id: string): Promise<{ error: string; redirectTo?: string }> {
  const db = createAdminClient()
  await db.from('enseignants').delete().eq('id', id)
  revalidatePath('/teachers')
  return { error: '', redirectTo: '/teachers' }
}

// ─── Activer / Désactiver ──────────────────────────────────────────────────
export async function toggleTeacherStatus(
  id: string,
  actif: boolean
): Promise<{ error: string; redirectTo?: string }> {
  const db = createAdminClient()
  await db.from('enseignants').update({ actif }).eq('id', id)
  revalidatePath('/teachers')
  revalidatePath(`/teachers/${id}`)
  return { error: '', redirectTo: `/teachers/${id}` }
}
