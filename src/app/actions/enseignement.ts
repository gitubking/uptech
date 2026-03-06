'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Récupérer le programme d'une classe avec enseignants ────────────────────
export async function getEnseignementsClasse(classe_id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('enseignement')
    .select(`
      id, volume_horaire,
      programme:programme(
        id, semestre, coefficient, credit, volume_horaire,
        matiere:matieres(id, nom, code)
      ),
      enseignant:enseignants(id, nom, prenom)
    `)
    .eq('classe_id', classe_id)
    .order('created_at')
  if (error) throw error
  return data ?? []
}

// ─── Initialiser le programme d'une classe depuis sa filière ─────────────────
export async function initEnseignementsClasse(classe_id: string) {
  const db = createAdminClient()

  const { data: classe } = await db
    .from('classes')
    .select('filiere_id, annee_academique_id')
    .eq('id', classe_id)
    .single()

  if (!classe) return { error: 'Classe introuvable' }

  const { data: programmes } = await db
    .from('programme')
    .select('id, volume_horaire')
    .eq('filiere_id', classe.filiere_id)
    .eq('annee_academique_id', classe.annee_academique_id)

  if (!programmes || programmes.length === 0) {
    return { error: 'Aucune matière dans le programme de cette filière pour cette année' }
  }

  const inserts = programmes.map((p) => ({
    classe_id,
    programme_id: p.id,
    volume_horaire: p.volume_horaire ?? 0,
  }))

  const { error } = await db
    .from('enseignement')
    .upsert(inserts, { onConflict: 'classe_id,programme_id' })

  if (error) return { error: error.message }

  revalidatePath(`/classes/${classe_id}`)
  return { success: true, count: inserts.length }
}

// ─── Affecter / modifier l'enseignant d'une matière dans une classe ──────────
export async function updateEnseignement(
  enseignement_id: string,
  enseignant_id: string | null,
  volume_horaire: number,
  classe_id: string
) {
  const db = createAdminClient()
  const { error } = await db
    .from('enseignement')
    .update({ enseignant_id: enseignant_id || null, volume_horaire })
    .eq('id', enseignement_id)

  if (error) return { error: error.message }

  revalidatePath(`/classes/${classe_id}`)
  revalidatePath('/teachers')
  return { success: true }
}

// ─── Récupérer les classes d'un enseignant (via enseignement) ────────────────
export async function getClassesEnseignant(enseignant_id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('enseignement')
    .select(`
      id, volume_horaire,
      classe:classes(id, nom, code, statut, filiere:filieres(id, nom, code)),
      programme:programme(id, semestre, coefficient, matiere:matieres(id, nom, code))
    `)
    .eq('enseignant_id', enseignant_id)
    .order('created_at')
  if (error) throw error
  return data ?? []
}
