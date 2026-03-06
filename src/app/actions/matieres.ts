'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Catalogue des matières ───────────────────────────────────────────────────
export async function getMatieres(search?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('matieres')
    .select('id, code, nom, description, created_at')
    .order('nom')

  if (search) query = query.or(`nom.ilike.%${search}%,code.ilike.%${search}%`)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getMatiereById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('matieres')
    .select(`
      *,
      programme(
        id, filiere_id, annee_academique_id, semestre, coefficient, credit, volume_horaire,
        filiere:filieres(id, nom, code),
        enseignant:enseignants(id, nom, prenom),
        annee_academique:annees_academiques(id, libelle)
      )
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createMatiere(formData: FormData) {
  const db = createAdminClient()
  const nom = formData.get('nom') as string
  const code = (formData.get('code') as string).toUpperCase().trim()
  const description = formData.get('description') as string || null

  if (!nom || !code) return { error: 'Nom et code obligatoires' }

  const { data, error } = await db
    .from('matieres')
    .insert({ nom, code, description })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'Ce code existe déjà dans le catalogue' }
    return { error: error.message }
  }

  revalidatePath('/matieres')
  return { success: true, id: data.id }
}

export async function updateMatiere(id: string, formData: FormData) {
  const db = createAdminClient()
  const nom = formData.get('nom') as string
  const code = (formData.get('code') as string).toUpperCase().trim()
  const description = formData.get('description') as string || null

  if (!nom || !code) return { error: 'Nom et code obligatoires' }

  const { error } = await db
    .from('matieres')
    .update({ nom, code, description })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') return { error: 'Ce code existe déjà' }
    return { error: error.message }
  }

  revalidatePath('/matieres')
  revalidatePath(`/matieres/${id}`)
  return { success: true }
}

export async function deleteMatiere(id: string) {
  const db = createAdminClient()

  // Vérifier qu'il n'y a pas de programme lié
  const { data: prog } = await db
    .from('programme')
    .select('id')
    .eq('matiere_id', id)
    .limit(1)

  if (prog && prog.length > 0) {
    return { error: 'Impossible : cette matière est utilisée dans un programme de filière' }
  }

  const { error } = await db.from('matieres').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/matieres')
  return { success: true }
}

// ─── Programme (matière affectée à une filière) ───────────────────────────────
export async function getProgrammeFiliere(filiere_id: string, annee_academique_id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('programme')
    .select(`
      *,
      matiere:matieres(id, nom, code, description),
      enseignant:enseignants(id, nom, prenom)
    `)
    .eq('filiere_id', filiere_id)
    .eq('annee_academique_id', annee_academique_id)
    .order('semestre')

  if (error) throw error
  return data ?? []
}

export async function addMatiereAuProgramme(formData: FormData) {
  const db = createAdminClient()
  const matiere_id = formData.get('matiere_id') as string
  const filiere_id = formData.get('filiere_id') as string
  const annee_academique_id = formData.get('annee_academique_id') as string
  const semestre = formData.get('semestre') as string
  const coefficient = parseFloat(formData.get('coefficient') as string) || 1
  const credit = parseInt(formData.get('credit') as string) || 0
  const volume_horaire = parseInt(formData.get('volume_horaire') as string) || 0
  const enseignant_id = (formData.get('enseignant_id') as string) || null

  if (!matiere_id || !filiere_id || !annee_academique_id || !semestre) {
    return { error: 'Champs obligatoires manquants' }
  }

  const { error } = await db.from('programme').insert({
    matiere_id, filiere_id, annee_academique_id, semestre,
    coefficient, credit, volume_horaire,
    enseignant_id: enseignant_id || null,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Cette matière est déjà dans le programme pour ce semestre' }
    return { error: error.message }
  }

  revalidatePath('/matieres')
  revalidatePath('/courses')
  return { success: true }
}

export async function updateProgrammeEntry(id: string, formData: FormData) {
  const db = createAdminClient()
  const coefficient = parseFloat(formData.get('coefficient') as string) || 1
  const credit = parseInt(formData.get('credit') as string) || 0
  const volume_horaire = parseInt(formData.get('volume_horaire') as string) || 0
  const enseignant_id = (formData.get('enseignant_id') as string) || null
  const semestre = formData.get('semestre') as string

  const { error } = await db.from('programme').update({
    coefficient, credit, volume_horaire, semestre,
    enseignant_id: enseignant_id || null,
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/matieres')
  revalidatePath('/courses')
  return { success: true }
}

export async function assignEnseignantProgramme(programme_id: string, enseignant_id: string | null) {
  const db = createAdminClient()
  const { error } = await db
    .from('programme')
    .update({ enseignant_id: enseignant_id || null })
    .eq('id', programme_id)
  if (error) return { error: error.message }
  revalidatePath('/matieres')
  revalidatePath('/teachers')
  return { success: true }
}

export async function removeMatiereduProgramme(id: string) {
  const db = createAdminClient()
  const { error } = await db.from('programme').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/matieres')
  revalidatePath('/courses')
  return { success: true }
}
