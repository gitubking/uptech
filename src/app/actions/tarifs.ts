'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function getTarifs(annee_id?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('tarifs')
    .select(`
      *,
      filiere:filieres(id, nom, code),
      annee_academique:annees_academiques(id, libelle)
    `)
    .order('created_at', { ascending: false })

  if (annee_id) query = query.eq('annee_academique_id', annee_id)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getTarifByFiliere(filiere_id: string, annee_id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tarifs')
    .select('*')
    .eq('filiere_id', filiere_id)
    .eq('annee_academique_id', annee_id)
    .single()
  return data ?? null
}
