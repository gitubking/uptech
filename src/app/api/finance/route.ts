import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Generate unique reference
function generateRef() {
  const date = new Date()
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `PAY-${dateStr}-${rand}`
}

// POST: create paiement
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const db = createAdminClient()

    const etudiant_id = formData.get('etudiant_id') as string
    const annee_academique_id = formData.get('annee_academique_id') as string
    const type = formData.get('type') as string
    const montant = parseFloat(formData.get('montant') as string)
    const montant_total = parseFloat(formData.get('montant_total') as string)
    const mode_paiement = formData.get('mode_paiement') as string
    const notes = formData.get('notes') as string || null

    if (!etudiant_id || !annee_academique_id || !type || isNaN(montant) || isNaN(montant_total)) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    // Pour l'inscription : bloquer les doublons
    if (type === 'inscription') {
      const { data: existing } = await db
        .from('paiements')
        .select('id')
        .eq('etudiant_id', etudiant_id)
        .eq('annee_academique_id', annee_academique_id)
        .eq('type', 'inscription')
        .maybeSingle()
      if (existing) {
        return NextResponse.json({ success: true, id: existing.id, skipped: true })
      }
    }

    // Pour la scolarité : bloquer le dépassement du total
    if (type === 'scolarite') {
      // Récupérer la filière de l'étudiant
      const { data: etudiant } = await db
        .from('etudiants')
        .select('filiere_id')
        .eq('id', etudiant_id)
        .single()

      if (etudiant?.filiere_id) {
        // Récupérer le tarif
        const { data: tarif } = await db
          .from('tarifs')
          .select('mensualite, nb_mensualites')
          .eq('filiere_id', etudiant.filiere_id)
          .eq('annee_academique_id', annee_academique_id)
          .maybeSingle()

        if (tarif) {
          const totalAutorise = Number(tarif.mensualite) * tarif.nb_mensualites

          // Somme déjà payée en scolarité
          const { data: paiementsExistants } = await db
            .from('paiements')
            .select('montant')
            .eq('etudiant_id', etudiant_id)
            .eq('annee_academique_id', annee_academique_id)
            .eq('type', 'scolarite')

          const totalDejaVerse = (paiementsExistants ?? []).reduce((s, p) => s + Number(p.montant), 0)

          if (totalDejaVerse + montant > totalAutorise) {
            const restant = Math.max(0, totalAutorise - totalDejaVerse)
            return NextResponse.json({
              error: `Dépassement du total de scolarité autorisé. Montant restant à payer : ${new Intl.NumberFormat('fr-SN').format(restant)} FCFA (total autorisé : ${new Intl.NumberFormat('fr-SN').format(totalAutorise)} FCFA).`,
            }, { status: 400 })
          }
        }
      }
    }

    // Determine statut based on amounts
    let statut = 'en_attente'
    if (montant >= montant_total) {
      statut = 'paye'
    } else if (montant > 0) {
      statut = 'partiel'
    }

    const { data, error } = await db
      .from('paiements')
      .insert({
        etudiant_id,
        annee_academique_id,
        type,
        montant,
        montant_total,
        statut,
        mode_paiement: mode_paiement || 'especes',
        notes,
        reference: generateRef(),
        date_paiement: montant > 0 ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) {
      console.error('Finance POST error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    console.error('Finance API error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT: update paiement (mark as paid, update statut)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

    const formData = await request.formData()
    const db = createAdminClient()

    const statut = formData.get('statut') as string
    const montant = formData.get('montant') ? parseFloat(formData.get('montant') as string) : undefined
    const mode_paiement = formData.get('mode_paiement') as string | null

    const updates: Record<string, unknown> = {}
    if (statut) updates.statut = statut
    if (montant !== undefined) updates.montant = montant
    if (mode_paiement) updates.mode_paiement = mode_paiement
    if (statut === 'paye' || (montant !== undefined && montant > 0)) {
      updates.date_paiement = new Date().toISOString()
    }

    const { error } = await db.from('paiements').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE: delete paiement
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const db = createAdminClient()
  const { error } = await db.from('paiements').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
