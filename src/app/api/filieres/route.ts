import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/filieres — liste toutes les filières
export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('filieres')
    .select('id, nom, code, type_formation, nb_mensualites, actif, created_at')
    .order('type_formation')
    .order('nom')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/filieres — créer une filière (+ niveaux auto si académique)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { nom, code, type_formation, nb_mensualites } = body

  if (!nom || !code || !type_formation) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  const nbMois = type_formation === 'academique' ? 9 : Number(nb_mensualites) || 6

  const { data: filiere, error } = await supabase
    .from('filieres')
    .insert({ nom, code: code.toUpperCase(), type_formation, nb_mensualites: nbMois, actif: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-créer les 6 niveaux pour les filières académiques
  if (type_formation === 'academique') {
    const niveaux = [
      { filiere_id: filiere.id, nom: 'DAP',         ordre: 1 },
      { filiere_id: filiere.id, nom: 'DT Année 1',  ordre: 2 },
      { filiere_id: filiere.id, nom: 'DT Année 2',  ordre: 3 },
      { filiere_id: filiere.id, nom: 'DTS Année 1', ordre: 4 },
      { filiere_id: filiere.id, nom: 'DTS Année 2', ordre: 5 },
      { filiere_id: filiere.id, nom: 'Licence Pro', ordre: 6 },
    ]
    await supabase.from('niveaux').insert(niveaux)
  }

  return NextResponse.json(filiere)
}

// PUT /api/filieres?id=... — modifier une filière
export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const body = await request.json()
  const { nom, code, nb_mensualites, actif } = body

  const { data, error } = await supabase
    .from('filieres')
    .update({ nom, code: code?.toUpperCase(), nb_mensualites: Number(nb_mensualites), actif })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/filieres?id=... — supprimer une filière
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const { error } = await supabase.from('filieres').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
