'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function getCoursesData() {
  const supabase = await createClient()
  const admin = await createAdminClient()

  const [
    { data: filieres, error: fe },
    { data: niveaux, error: ne },
    { data: programme, error: me },
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
    // Programme = matière × filière × année (matieres a perdu filiere_id/coefficient/etc. en migration 010)
    supabase
      .from('programme')
      .select(`
        id, semestre, coefficient, credit, volume_horaire, filiere_id, enseignant_id,
        matiere:matieres(id, nom, code),
        filiere:filieres(id, nom, code),
        enseignant:enseignants(id, nom, prenom)
      `)
      .order('semestre'),
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

  // Mapper les entrées programme vers la forme MatiereRow attendue par CoursesClient
  type MatRef = { id: string; nom: string; code: string }
  type FilRef = { id: string; nom: string; code: string }
  type EnsRef = { id: string; nom: string; prenom: string }
  const matieres = (programme ?? []).map((p) => {
    const matiere = (p.matiere as unknown as MatRef | null)
    const filiere = (p.filiere as unknown as FilRef | null)
    const enseignant = (p.enseignant as unknown as EnsRef | null)
    return {
      id: p.id,                        // programme.id (utilisé pour edit/delete)
      matiere_id: matiere?.id ?? '',   // matières catalogue id (pour update nom/code)
      code: matiere?.code ?? '',
      nom: matiere?.nom ?? '',
      coefficient: Number(p.coefficient) || 1,
      credit: p.credit || 0,
      semestre: Number(p.semestre) || 1,
      volume_horaire: p.volume_horaire || 0,
      filiere_id: p.filiere_id,
      niveau_id: '',
      enseignant_id: p.enseignant_id ?? undefined,
      filiere,
      niveau: null,
      enseignant,
    }
  })

  return {
    filieres: filieresEnriched,
    niveaux: niveaux ?? [],
    matieres,
    enseignants: enseignants ?? [],
    etudiants: etudiants ?? [],
    typeFormations,
  }
}
