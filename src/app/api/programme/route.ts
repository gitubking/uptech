import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const filiere_id = searchParams.get('filiere_id')
  const annee_id = searchParams.get('annee_id')

  if (!filiere_id || !annee_id) {
    return NextResponse.json([], { status: 200 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('programme')
    .select(`
      id, semestre, coefficient, volume_horaire,
      matiere:matieres(id, nom, code),
      enseignant:enseignants(id, nom, prenom)
    `)
    .eq('filiere_id', filiere_id)
    .eq('annee_academique_id', annee_id)
    .order('semestre')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
