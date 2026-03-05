'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function getSettingsData() {
  const supabase = await createClient()
  const admin = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: annees }, { data: profile }] = await Promise.all([
    supabase
      .from('annees_academiques')
      .select('id, libelle, date_debut, date_fin, actif, created_at')
      .order('libelle', { ascending: false }),
    user
      ? supabase.from('profiles').select('id, nom, prenom, email, telephone, role, photo_url').eq('user_id', user.id).single()
      : Promise.resolve({ data: null }),
  ])

  // Types de formation (table créée par migration 003 — peut ne pas exister)
  // Note : Supabase client retourne { data: null, error } sans throw si table absente
  let typeFormations: unknown[] = []
  const { data: types, error: typeError } = await admin
    .from('type_formations')
    .select('*')
    .order('nom')

  if (!typeError) {
    typeFormations = types ?? []
  }
  // Si typeError → table non créée encore, typeFormations reste []

  const { data: filieres } = await supabase
    .from('filieres')
    .select('id, nom, code, type_formation, nb_mensualites, actif')
    .order('type_formation')
    .order('nom')

  return {
    annees: annees ?? [],
    profile: profile ?? null,
    userEmail: user?.email ?? '',
    typeFormations,
    filieres: filieres ?? [],
  }
}
