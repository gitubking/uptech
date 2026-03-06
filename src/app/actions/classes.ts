'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Récupérer toutes les classes ─────────────────────────────────────────────
export async function getClasses(filters?: {
  annee_academique_id?: string
  filiere_id?: string
  statut?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('classes')
    .select(`
      *,
      filiere:filieres(id, nom, code, type_formation),
      annee_academique:annees_academiques(id, libelle)
    `)
    .order('date_rentree', { ascending: false })

  if (filters?.annee_academique_id) query = query.eq('annee_academique_id', filters.annee_academique_id)
  if (filters?.filiere_id) query = query.eq('filiere_id', filters.filiere_id)
  if (filters?.statut) query = query.eq('statut', filters.statut)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

// ─── Récupérer une classe par ID ──────────────────────────────────────────────
export async function getClasseById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      filiere:filieres(id, nom, code, type_formation),
      annee_academique:annees_academiques(id, libelle),
      etudiants(id, matricule, nom, prenom, statut, photo_url)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// ─── Récupérer les filières pour les selects ──────────────────────────────────
export async function getFilieresEtNiveaux() {
  const supabase = await createClient()
  const { data: filieres } = await supabase
    .from('filieres')
    .select('id, nom, code, type_formation')
    .eq('actif', true)
    .order('nom')
  return { filieres: filieres ?? [], niveaux: [] }
}

// ─── Créer une classe ─────────────────────────────────────────────────────────
export async function createClasse(formData: FormData) {
  const db = createAdminClient()

  const nom = formData.get('nom') as string
  const code = formData.get('code') as string
  const filiere_id = formData.get('filiere_id') as string
  const annee_academique_id = formData.get('annee_academique_id') as string
  const date_rentree = formData.get('date_rentree') as string
  const capacite = parseInt(formData.get('capacite') as string) || 30

  if (!nom || !code || !filiere_id || !annee_academique_id || !date_rentree) {
    return { error: 'Tous les champs obligatoires doivent être remplis' }
  }

  const { error } = await db.from('classes').insert({
    nom, code, filiere_id, annee_academique_id, date_rentree, capacite,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Une classe avec ce code ou cette combinaison existe déjà' }
    return { error: error.message }
  }

  revalidatePath('/classes')
  return { success: true }
}

// ─── Mettre à jour le statut d'une classe ─────────────────────────────────────
export async function updateClasseStatut(id: string, statut: string) {
  const db = createAdminClient()
  const { error } = await db.from('classes').update({ statut }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/classes')
  revalidatePath(`/classes/${id}`)
  return { success: true }
}

// ─── Supprimer une classe ─────────────────────────────────────────────────────
export async function deleteClasse(id: string) {
  const db = createAdminClient()

  // Vérifier qu'il n'y a pas d'étudiants liés
  const { data: etudiants } = await db
    .from('etudiants')
    .select('id')
    .eq('classe_id', id)
    .limit(1)

  if (etudiants && etudiants.length > 0) {
    return { error: 'Impossible de supprimer : des étudiants sont affectés à cette classe' }
  }

  const { error } = await db.from('classes').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/classes')
  return { success: true }
}

// ─── Affecter un étudiant à une classe ────────────────────────────────────────
export async function affecterEtudiantClasse(etudiant_id: string, classe_id: string | null) {
  const db = createAdminClient()
  const { error } = await db
    .from('etudiants')
    .update({ classe_id })
    .eq('id', etudiant_id)
  if (error) return { error: error.message }
  revalidatePath('/classes')
  revalidatePath(`/students/${etudiant_id}`)
  return { success: true }
}
