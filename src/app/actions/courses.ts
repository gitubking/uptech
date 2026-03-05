'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function getCoursesData() {
  const supabase = await createClient()
  const admin = await createAdminClient()

  const [
    { data: filieres, error: fe },
    { data: niveaux, error: ne },
    { data: matieres, error: me },
    { data: enseignants, error: ee },
    { data: etudiants },
  ] = await Promise.all([
    // Sans type_formation_id : cette colonne n'existe qu'après la migration 003
    supabase
      .from('filieres')
      .select('id, nom, code, actif, description, duree_annees')
      .order('nom'),
    supabase
      .from('niveaux')
      .select('id, nom, filiere_id, ordre, filiere:filieres(id, nom, code)')
      .order('ordre'),
    supabase
      .from('matieres')
      .select(`
        id, code, nom, coefficient, credit, semestre, volume_horaire,
        filiere_id, niveau_id, enseignant_id,
        filiere:filieres(id, nom, code),
        niveau:niveaux(id, nom),
        enseignant:enseignants(id, nom, prenom)
      `)
      .order('code'),
    supabase
      .from('enseignants')
      .select('id, nom, prenom')
      .eq('actif', true)
      .order('nom'),
    supabase
      .from('etudiants')
      .select(`
        id, matricule, nom, prenom, statut,
        filiere_id, niveau_id,
        filiere:filieres(id, code, nom),
        niveau:niveaux(id, nom, ordre)
      `)
      .order('nom'),
  ])

  if (fe) throw fe
  if (ne) throw ne
  if (me) throw me
  if (ee) throw ee

  // Types de formation (table créée par migration 003 — peut ne pas exister)
  let typeFormations: unknown[] = []
  let filieresEnriched = filieres ?? []
  try {
    const [{ data: types }, { data: filieresAvecType }] = await Promise.all([
      admin
        .from('type_formations')
        .select('id, nom, code, tarif_horaire, methode_paiement')
        .eq('actif', true)
        .order('nom'),
      // Récupère aussi type_formation_id sur les filières (colonne de migration 003)
      admin
        .from('filieres')
        .select('id, type_formation_id'),
    ])
    typeFormations = types ?? []

    // Fusionner type_formation_id dans les filières
    if (filieresAvecType && filieresAvecType.length > 0) {
      const typeMap = Object.fromEntries(
        filieresAvecType.map((f) => [f.id, (f as { id: string; type_formation_id?: string | null }).type_formation_id ?? null])
      )
      filieresEnriched = (filieres ?? []).map((f) => ({
        ...f,
        type_formation_id: typeMap[f.id] ?? null,
      }))
    }
  } catch {
    // Migration 003 pas encore exécutée — on continue sans ces données
    typeFormations = []
  }

  return {
    filieres: filieresEnriched,
    niveaux: niveaux ?? [],
    matieres: matieres ?? [],
    enseignants: enseignants ?? [],
    etudiants: etudiants ?? [],
    typeFormations,
  }
}
