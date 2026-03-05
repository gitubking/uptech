import { createAdminClient, createClient } from '@/lib/supabase/server'
import { CommunicationClient } from '@/components/communication/communication-client'

export default async function CommunicationPage() {
  const supabase = await createClient()
  const admin = await createAdminClient()

  let annonces: unknown[] = []
  let tableError: string | undefined

  try {
    const { data, error } = await supabase
      .from('annonces')
      .select('id, titre, contenu, cible, date_expiration, created_at, auteur_id')
      .order('created_at', { ascending: false })

    if (error) {
      tableError = error.message
    } else {
      // Enrichir avec le nom de l'auteur via profiles (sans FK join)
      const rawAnnonces = data ?? []
      const auteurIds = [...new Set(rawAnnonces.map((a) => a.auteur_id).filter(Boolean))]

      let profilesMap: Record<string, { nom: string; prenom: string }> = {}
      if (auteurIds.length > 0) {
        const { data: profiles } = await admin
          .from('profiles')
          .select('id, nom, prenom')
          .in('id', auteurIds)
        if (profiles) {
          profilesMap = Object.fromEntries(profiles.map((p) => [p.id, p]))
        }
      }

      annonces = rawAnnonces.map((a) => ({
        ...a,
        auteur: a.auteur_id ? (profilesMap[a.auteur_id] ?? null) : null,
      }))
    }
  } catch (err) {
    tableError = err instanceof Error ? err.message : 'Erreur lors du chargement'
  }

  return (
    <CommunicationClient
      annonces={annonces as Parameters<typeof CommunicationClient>[0]['annonces']}
      tableError={tableError}
    />
  )
}
