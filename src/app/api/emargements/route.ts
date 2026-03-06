import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// ─── GET — liste des émargements ─────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const enseignant_id = searchParams.get('enseignant_id')

  const supabase = await createAdminClient()

  let query = supabase
    .from('emargements')
    .select(`
      id, date_cours, heure_debut, heure_fin, chapitre, observations, created_at,
      enseignant:enseignants(id, nom, prenom),
      matiere:matieres(id, code, nom),
      classe:classes(id, nom, code)
    `)
    .order('date_cours', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  if (enseignant_id) query = query.eq('enseignant_id', enseignant_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// ─── POST — créer / upsert un émargement ─────────────────────────────────────
export async function POST(request: Request) {
  const supabase = await createAdminClient()

  let body: Record<string, string>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const { enseignant_id, matiere_id, classe_id, date_cours, heure_debut, heure_fin, chapitre, observations } = body

  if (!enseignant_id || !matiere_id || !date_cours) {
    return NextResponse.json({ error: 'Enseignant, matière et date sont requis.' }, { status: 400 })
  }

  const row: Record<string, unknown> = { enseignant_id, matiere_id, date_cours }
  if (classe_id) row.classe_id = classe_id
  if (heure_debut) row.heure_debut = heure_debut
  if (heure_fin) row.heure_fin = heure_fin
  if (chapitre) row.chapitre = chapitre
  if (observations) row.observations = observations

  // La contrainte UNIQUE inclut maintenant classe_id
  const onConflict = classe_id
    ? 'enseignant_id,matiere_id,classe_id,date_cours'
    : 'enseignant_id,matiere_id,date_cours'

  const { data, error } = await supabase
    .from('emargements')
    .upsert(row, { onConflict })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// ─── DELETE — supprimer un émargement ────────────────────────────────────────
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const supabase = await createAdminClient()
  const { error } = await supabase.from('emargements').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
