import { createClient } from '@/lib/supabase/server'
import { EmargementClient } from '@/components/attendance/emarger-client'

export default async function EmargerPage() {
  const supabase = await createClient()

  // Données pour le formulaire
  const [{ data: enseignants }, { data: matieres }] = await Promise.all([
    supabase
      .from('enseignants')
      .select('id, nom, prenom, matricule')
      .eq('actif', true)
      .order('nom'),
    supabase
      .from('matieres')
      .select(`
        id, code, nom, enseignant_id, volume_horaire,
        filiere:filieres(code, nom),
        niveau:niveaux(nom)
      `)
      .order('code'),
  ])

  // Historique des émargements (peut échouer si la table n'existe pas)
  let emargements: unknown[] = []
  let tableError: string | null = null

  try {
    const { data, error } = await supabase
      .from('emargements')
      .select(`
        id, date_cours, heure_debut, heure_fin, chapitre, observations, created_at,
        enseignant:enseignants(id, nom, prenom),
        matiere:matieres(id, code, nom, filiere:filieres(code), niveau:niveaux(nom))
      `)
      .order('date_cours', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) tableError = error.message
    else emargements = data ?? []
  } catch (e) {
    tableError = e instanceof Error ? e.message : 'Table emargements introuvable'
  }

  return (
    <EmargementClient
      enseignants={enseignants ?? []}
      matieres={(matieres ?? []) as any}
      emargements={emargements}
      tableError={tableError}
    />
  )
}
