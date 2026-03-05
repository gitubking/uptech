'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Récupérer tous les paiements ────────────────────────────────────────────
export async function getPaiements(filters?: {
  search?: string
  type?: string
  statut?: string
  etudiant_id?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('paiements')
    .select(`
      *,
      etudiant:etudiants(id, matricule, nom, prenom,
        filiere:filieres(nom, code),
        niveau:niveaux(nom)
      ),
      annee_academique:annees_academiques(id, libelle)
    `)
    .order('created_at', { ascending: false })

  if (filters?.search) {
    // Filter by etudiant - we need a different approach for joined fields
    // Use a subquery via in
    const { data: etudiants } = await supabase
      .from('etudiants')
      .select('id')
      .or(
        `nom.ilike.%${filters.search}%,prenom.ilike.%${filters.search}%,matricule.ilike.%${filters.search}%`
      )
    if (etudiants && etudiants.length > 0) {
      query = query.in('etudiant_id', etudiants.map((e) => e.id))
    } else if (filters.search) {
      // Also check reference field
      query = query.ilike('reference', `%${filters.search}%`)
    }
  }
  if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.statut) query = query.eq('statut', filters.statut)
  if (filters?.etudiant_id) query = query.eq('etudiant_id', filters.etudiant_id)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

// ─── Récupérer un paiement par ID ────────────────────────────────────────────
export async function getPaiementById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('paiements')
    .select(`
      *,
      etudiant:etudiants(id, matricule, nom, prenom, email, telephone,
        filiere:filieres(nom, code),
        niveau:niveaux(nom)
      ),
      annee_academique:annees_academiques(id, libelle)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// ─── Récupérer les paiements d'un étudiant ───────────────────────────────────
export async function getPaiementsEtudiant(etudiant_id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('paiements')
    .select(`
      *,
      annee_academique:annees_academiques(libelle)
    `)
    .eq('etudiant_id', etudiant_id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// ─── Stats financières globales ───────────────────────────────────────────────
export async function getFinanceStats() {
  const supabase = await createClient()

  const [{ data: paye }, { data: attente }, { data: partiel }, { data: total }] =
    await Promise.all([
      supabase.from('paiements').select('montant').eq('statut', 'paye'),
      supabase.from('paiements').select('montant_total').eq('statut', 'en_attente'),
      supabase.from('paiements').select('montant, montant_total').eq('statut', 'partiel'),
      supabase.from('paiements').select('montant').not('statut', 'eq', 'exonere'),
    ])

  const totalPercu = (paye ?? []).reduce((s, r) => s + Number(r.montant), 0) +
    (partiel ?? []).reduce((s, r) => s + Number(r.montant), 0)
  const totalAttente = (attente ?? []).reduce((s, r) => s + Number(r.montant_total), 0) +
    (partiel ?? []).reduce((s, r) => s + (Number(r.montant_total) - Number(r.montant)), 0)

  return {
    totalPercu,
    totalAttente,
    nbPaye: paye?.length ?? 0,
    nbAttente: (attente?.length ?? 0) + (partiel?.length ?? 0),
    totalPaiements: total?.length ?? 0,
  }
}

// ─── Récupérer les étudiants pour sélection ──────────────────────────────────
export async function getEtudiantsForFinance() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('etudiants')
    .select('id, matricule, nom, prenom, filiere_id, niveau_id, annee_academique_id, filiere:filieres(nom, code), niveau:niveaux(nom)')
    .eq('statut', 'inscrit')
    .order('nom', { ascending: true })
  if (error) throw error
  return data ?? []
}

// ─── Récupérer le tarif d'un étudiant ────────────────────────────────────────
export async function getTarifEtudiant(filiere_id: string, annee_academique_id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tarifs')
    .select('mensualite, nb_mensualites')
    .eq('filiere_id', filiere_id)
    .eq('annee_academique_id', annee_academique_id)
    .single()
  return data
}

// ─── Récupérer l'année académique active ─────────────────────────────────────
export async function getActiveAnneeFinance() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('annees_academiques')
    .select('id, libelle')
    .eq('actif', true)
    .single()
  return data
}
