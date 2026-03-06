import { createAdminClient, createClient } from '@/lib/supabase/server'
import { EmargementClient } from '@/components/attendance/emarger-client'

export default async function EmargerPage() {
  const supabase = await createClient()
  const admin = await createAdminClient()

  // Détecter si l'utilisateur est un enseignant
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user?.id ?? '').single()

  let currentEnseignantId: string | undefined
  if (profile?.role === 'enseignant') {
    const { data: ens } = await supabase.from('enseignants').select('id').eq('user_id', user?.id ?? '').single()
    currentEnseignantId = ens?.id ?? undefined
  }

  // ── Enseignants (admin voit tous, enseignant ne se voit que lui) ──
  let ensQuery = admin.from('enseignants').select('id, nom, prenom, matricule').eq('actif', true).order('nom')
  if (currentEnseignantId) ensQuery = ensQuery.eq('id', currentEnseignantId)
  const { data: enseignants } = await ensQuery

  // ── Classes actives ──
  const { data: classes } = await admin
    .from('classes')
    .select('id, nom, code, filiere_id, niveau_id, filiere:filieres(id, code, nom), niveau:niveaux(id, nom)')
    .in('statut', ['en_cours', 'en_preparation'])
    .order('nom')

  // ── Affectations enseignement : qui enseigne quoi dans quelle classe ──
  let enseignementQuery = admin
    .from('enseignement')
    .select(`
      id, classe_id, programme_id, enseignant_id, volume_horaire,
      programme:programme(id, matiere_id, matiere:matieres(id, code, nom))
    `)
  if (currentEnseignantId) enseignementQuery = enseignementQuery.eq('enseignant_id', currentEnseignantId)
  const { data: enseignements } = await enseignementQuery

  // ── Historique des émargements ──
  let emargements: unknown[] = []
  let tableError: string | null = null

  try {
    let histQuery = admin
      .from('emargements')
      .select(`
        id, date_cours, heure_debut, heure_fin, chapitre, observations, created_at,
        enseignant:enseignants(id, nom, prenom),
        matiere:matieres(id, code, nom),
        classe:classes(id, nom, code)
      `)
      .order('date_cours', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200)

    if (currentEnseignantId) histQuery = histQuery.eq('enseignant_id', currentEnseignantId)

    const { data, error } = await histQuery
    if (error) tableError = error.message
    else emargements = data ?? []
  } catch (e) {
    tableError = e instanceof Error ? e.message : 'Table emargements introuvable'
  }

  return (
    <EmargementClient
      enseignants={enseignants ?? []}
      classes={(classes ?? []) as any}
      enseignements={(enseignements ?? []) as any}
      emargements={emargements}
      tableError={tableError}
      isEnseignant={!!currentEnseignantId}
      currentEnseignantId={currentEnseignantId}
    />
  )
}
