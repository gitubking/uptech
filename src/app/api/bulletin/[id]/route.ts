import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { getBulletin, getActiveAnnee } from '@/app/actions/grades'
import { BulletinPDF } from '@/components/grades/bulletin-pdf'
import React from 'react'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)

    const activeAnnee = await getActiveAnnee()
    const annee_id = searchParams.get('annee_id') ?? activeAnnee?.id ?? ''

    if (!annee_id) {
      return NextResponse.json({ error: 'Aucune année académique active' }, { status: 400 })
    }

    const { etudiant, matieres, annee } = await getBulletin(id, annee_id)

    if (!etudiant) {
      return NextResponse.json({ error: 'Étudiant introuvable' }, { status: 404 })
    }

    const matieresAvecNote = matieres.filter((m) => m.note_finale !== null)
    const totalCoeff = matieresAvecNote.reduce((s, m) => s + (m.coefficient ?? 0), 0)
    const sommePoints = matieresAvecNote.reduce(
      (s, m) => s + (m.note_finale ?? 0) * (m.coefficient ?? 0), 0
    )
    const moyenne = totalCoeff > 0 ? sommePoints / totalCoeff : null
    const totalCredits = matieresAvecNote
      .filter((m) => (m.note_finale ?? 0) >= 10)
      .reduce((s, m) => s + (m.credit ?? 0), 0)

    // Normaliser les jointures Supabase (tableaux → objets)
    const matieresNormalisees = matieres.map((m) => ({
      ...m,
      enseignant: Array.isArray(m.enseignant) ? (m.enseignant[0] ?? null) : m.enseignant,
    }))

    const etudiantNormalise = {
      ...etudiant,
      filiere: Array.isArray(etudiant.filiere) ? (etudiant.filiere[0] ?? null) : etudiant.filiere,
      niveau: Array.isArray(etudiant.niveau) ? (etudiant.niveau[0] ?? null) : etudiant.niveau,
      niveau_entree: etudiant.niveau_entree ?? null,
    }

    const buffer = await renderToBuffer(
      React.createElement(BulletinPDF, {
        etudiant: etudiantNormalise as Parameters<typeof BulletinPDF>[0]['etudiant'],
        matieres: matieresNormalisees as Parameters<typeof BulletinPDF>[0]['matieres'],
        anneeLibelle: annee?.libelle ?? '',
        moyenne,
        totalCredits,
      })
    )

    const nom = `${etudiant.nom}_${etudiant.prenom}`.replace(/\s+/g, '_')
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bulletin_${nom}.pdf"`,
      },
    })
  } catch (err) {
    console.error('PDF error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
