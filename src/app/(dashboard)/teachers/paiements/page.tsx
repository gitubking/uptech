import { createAdminClient, createClient } from '@/lib/supabase/server'
import { PaiementsClient } from '@/components/teachers/paiements-client'
import { AlertCircle } from 'lucide-react'

export default async function PaiementsEnseignantsPage() {
  const admin = await createAdminClient()

  // Détecter si l'utilisateur est un enseignant (affiche seulement ses données)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user?.id ?? '').single()

  let filterEnseignantId: string | undefined
  if (profile?.role === 'enseignant') {
    const { data: ens } = await supabase.from('enseignants').select('id').eq('user_id', user?.id ?? '').single()
    filterEnseignantId = ens?.id ?? undefined
  }

  // ── 1. Émargements avec enseignant + matiere ──
  let emargQuery = admin
    .from('emargements')
    .select(`
      id, enseignant_id, matiere_id, date_cours, heure_debut, heure_fin,
      enseignant:enseignants(id, nom, prenom, matricule),
      matiere:matieres(id, code, nom)
    `)
    .order('date_cours', { ascending: false })

  if (filterEnseignantId) emargQuery = emargQuery.eq('enseignant_id', filterEnseignantId)

  const { data: emargements, error: eErr } = await emargQuery

  if (eErr) {
    return (
      <div className="max-w-4xl">
        <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Erreur de chargement des émargements</p>
            <p className="text-sm mt-1">{eErr.message}</p>
          </div>
        </div>
      </div>
    )
  }

  // ── 2. Enseignants (filtré pour un enseignant connecté) ──
  let ensQuery = admin
    .from('enseignants')
    .select('id, nom, prenom, matricule')
    .eq('actif', true)
    .order('nom')

  if (filterEnseignantId) ensQuery = ensQuery.eq('id', filterEnseignantId)

  const { data: enseignants } = await ensQuery

  // ── 3. Types de formation + filières (migration 003 — peut ne pas exister) ──
  let typeFormations: Array<{
    id: string; nom: string; code: string
    tarif_horaire: number; methode_paiement: string
  }> = []
  type FiliereWithType = { id: string; code: string; nom: string; type_formation_id?: string | null }
  let filieres: FiliereWithType[] = []

  try {
    const [{ data: types }, { data: filieresData }] = await Promise.all([
      admin.from('type_formations').select('id, nom, code, tarif_horaire, methode_paiement'),
      admin.from('filieres').select('id, code, nom, type_formation_id'),
    ])
    typeFormations = types ?? []
    filieres = (filieresData ?? []) as FiliereWithType[]
  } catch {
    // Migration 003 pas encore exécutée
    try {
      const { data: filieresData } = await admin.from('filieres').select('id, code, nom')
      filieres = (filieresData ?? []) as FiliereWithType[]
    } catch {
      filieres = []
    }
  }

  // ── 4. Build lookup maps ──
  const filiereMap = Object.fromEntries(filieres.map((f) => [f.id, f]))
  const typeFormMap = Object.fromEntries(typeFormations.map((tf) => [tf.id, tf]))

  // ── 5. Calcul des paiements par enseignant ──
  function calcHeures(debut?: string | null, fin?: string | null): number {
    if (!debut || !fin) return 0
    const [dh, dm] = debut.split(':').map(Number)
    const [fh, fm] = fin.split(':').map(Number)
    const mins = (fh * 60 + fm) - (dh * 60 + dm)
    return Math.max(0, mins / 60)
  }

  type SeanceDetail = {
    id: string
    date_cours: string
    matiere_code: string
    matiere_nom: string
    filiere_code: string
    type_formation_nom: string | null
    type_formation_code: string | null
    methode_paiement: string
    tarif_horaire: number
    heures: number
    montant: number
  }

  type EnseignantPaiement = {
    id: string
    nom: string
    prenom: string
    matricule?: string | null
    seances: SeanceDetail[]
    totalHeures: number
    totalMontant: number
  }

  const paiementsMap: Record<string, EnseignantPaiement> = {}

  for (const em of (emargements ?? [])) {
    const ens = em.enseignant as unknown as { id: string; nom: string; prenom: string; matricule?: string } | null
    if (!ens) continue

    const mat = em.matiere as unknown as { id: string; code: string; nom: string; filiere_id: string } | null
    const filiere = mat?.filiere_id ? filiereMap[mat.filiere_id] : null
    const typeForm = filiere?.type_formation_id ? typeFormMap[filiere.type_formation_id] : null

    const heures = calcHeures(em.heure_debut, em.heure_fin)
    const tarif = typeForm ? Number(typeForm.tarif_horaire) : 0
    const methode = typeForm?.methode_paiement ?? 'horaire'

    // Montant selon méthode de paiement
    let montant = 0
    if (methode === 'horaire') {
      montant = heures * tarif
    } else if (methode === 'forfait_seance') {
      montant = heures > 0 ? tarif : 0 // 1 forfait par séance si heures > 0
    } else if (methode === 'mensuel') {
      montant = 0 // mensuel calculé séparément
    }

    if (!paiementsMap[ens.id]) {
      paiementsMap[ens.id] = {
        id: ens.id,
        nom: ens.nom,
        prenom: ens.prenom,
        matricule: ens.matricule,
        seances: [],
        totalHeures: 0,
        totalMontant: 0,
      }
    }

    paiementsMap[ens.id].seances.push({
      id: em.id,
      date_cours: em.date_cours,
      matiere_code: mat?.code ?? '—',
      matiere_nom: mat?.nom ?? '—',
      filiere_code: filiere?.code ?? '—',
      type_formation_nom: typeForm?.nom ?? null,
      type_formation_code: typeForm?.code ?? null,
      methode_paiement: methode,
      tarif_horaire: tarif,
      heures,
      montant,
    })

    paiementsMap[ens.id].totalHeures += heures
    paiementsMap[ens.id].totalMontant += montant
  }

  // Inclure aussi les enseignants sans émargements
  for (const ens of (enseignants ?? [])) {
    if (!paiementsMap[ens.id]) {
      paiementsMap[ens.id] = {
        id: ens.id,
        nom: ens.nom,
        prenom: ens.prenom,
        matricule: ens.matricule,
        seances: [],
        totalHeures: 0,
        totalMontant: 0,
      }
    }
  }

  const paiements = Object.values(paiementsMap).sort((a, b) =>
    a.nom.localeCompare(b.nom)
  )

  return (
    <PaiementsClient
      paiements={paiements}
      typeFormations={typeFormations}
      hasTypeFormations={typeFormations.length > 0}
    />
  )
}
