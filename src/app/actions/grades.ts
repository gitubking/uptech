'use server'

import { createClient } from '@/lib/supabase/server'

type MatiereRef = { id: string; nom: string; code: string }
type FiliereRef = { id: string; nom: string; code: string }
type EnseignantRef = { id: string; nom: string; prenom: string }

// ─── Recuperer les programme (matières par filière) avec filtres ──────────────
export async function getMatieres(filters?: {
  filiere_id?: string
  niveau_id?: string // gardé pour compatibilité URL, ignoré côté DB
  semestre?: string
  annee_id?: string
  enseignant_id?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('programme')
    .select(`
      id, semestre, coefficient, credit, volume_horaire,
      matiere:matieres(id, nom, code),
      filiere:filieres(id, nom, code),
      enseignant:enseignants(id, nom, prenom)
    `)
    .order('semestre', { ascending: true })

  if (filters?.filiere_id) query = query.eq('filiere_id', filters.filiere_id)
  if (filters?.semestre) query = query.eq('semestre', filters.semestre)
  if (filters?.annee_id) query = query.eq('annee_academique_id', filters.annee_id)
  if (filters?.enseignant_id) query = query.eq('enseignant_id', filters.enseignant_id)

  const { data: programmes, error } = await query
  if (error) throw error
  if (!programmes || programmes.length === 0) return []

  const enriched = await Promise.all(
    programmes.map(async (prog) => {
      const matiere = (prog.matiere as unknown) as MatiereRef | null
      const filiere = (prog.filiere as unknown) as FiliereRef | null
      const enseignant = (prog.enseignant as unknown) as EnseignantRef | null

      const { count: totalStudents } = await supabase
        .from('etudiants')
        .select('*', { count: 'exact', head: true })
        .eq('filiere_id', filiere?.id ?? '')
        .eq('statut', 'inscrit')

      let notesQuery = supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('matiere_id', matiere?.id ?? '')

      if (filters?.annee_id) notesQuery = notesQuery.eq('annee_academique_id', filters.annee_id)

      const { count: notesCount } = await notesQuery

      return {
        id: prog.id,
        nom: matiere?.nom ?? '',
        code: matiere?.code ?? '',
        semestre: prog.semestre,
        coefficient: prog.coefficient,
        credit: prog.credit,
        volume_horaire: prog.volume_horaire,
        filiere,
        niveau: null as null,
        enseignant,
        total_etudiants: totalStudents ?? 0,
        notes_saisies: notesCount ?? 0,
      }
    })
  )

  return enriched
}

// ─── Recuperer les etudiants d'un programme avec leurs notes ─────────────────
export async function getStudentsWithNotes(programme_id: string, annee_id: string) {
  const supabase = await createClient()

  const { data: prog, error: progError } = await supabase
    .from('programme')
    .select(`
      id, semestre, coefficient,
      matiere:matieres(id, nom, code),
      filiere:filieres(id, nom, code),
      enseignant:enseignants(id, nom, prenom)
    `)
    .eq('id', programme_id)
    .single()

  if (progError || !prog) return { matiere: null, students: [] as Student[] }

  const matiere = (prog.matiere as unknown) as MatiereRef | null
  const filiere = (prog.filiere as unknown) as FiliereRef | null
  const enseignant = (prog.enseignant as unknown) as EnseignantRef | null

  const { data: etudiants, error: studentsError } = await supabase
    .from('etudiants')
    .select('id, matricule, nom, prenom')
    .eq('filiere_id', filiere?.id ?? '')
    .eq('statut', 'inscrit')
    .order('nom', { ascending: true })

  if (studentsError) throw studentsError

  const matiereInfo = {
    id: matiere?.id ?? '',
    nom: matiere?.nom ?? '',
    code: matiere?.code ?? '',
    filiere,
    niveau: null as null,
    enseignant,
  }

  if (!etudiants || etudiants.length === 0) {
    return { matiere: matiereInfo, students: [] as Student[] }
  }

  const { data: notes, error: notesError } = await supabase
    .from('notes')
    .select('id, etudiant_id, note_normale, note_rattrapage, note_finale, mention')
    .eq('matiere_id', matiere?.id ?? '')
    .eq('annee_academique_id', annee_id)

  if (notesError) throw notesError

  const notesMap = new Map((notes ?? []).map((n) => [n.etudiant_id, n]))

  const students = etudiants.map((etudiant) => {
    const note = notesMap.get(etudiant.id)
    return {
      ...etudiant,
      note_id: note?.id ?? null,
      note_normale: note?.note_normale ?? null,
      note_rattrapage: note?.note_rattrapage ?? null,
      note_finale: note?.note_finale ?? null,
      mention: note?.mention ?? null,
    }
  })

  return { matiere: matiereInfo, students }
}

type Student = {
  id: string; matricule: string; nom: string; prenom: string
  note_id: string | null; note_normale: number | null; note_rattrapage: number | null
  note_finale: number | null; mention: string | null
}

// ─── Recuperer le bulletin d'un etudiant ─────────────────────────────────────
export async function getBulletin(etudiant_id: string, annee_id: string) {
  const supabase = await createClient()

  const { data: etudiant, error: etudiantError } = await supabase
    .from('etudiants')
    .select(`
      id, matricule, nom, prenom, filiere_id,
      filiere:filieres(id, nom, code),
      niveau:niveaux(id, nom, ordre)
    `)
    .eq('id', etudiant_id)
    .single()

  if (etudiantError) throw etudiantError
  if (!etudiant) return { etudiant: null, matieres: [], annee: null }

  const etudiantTyped = {
    ...etudiant,
    filiere: (etudiant.filiere as unknown) as FiliereRef | null,
    niveau: (etudiant.niveau as unknown) as { id: string; nom: string; ordre: number } | null,
  }

  const { data: annee, error: anneeError } = await supabase
    .from('annees_academiques')
    .select('id, libelle')
    .eq('id', annee_id)
    .single()

  if (anneeError) throw anneeError

  const { data: programmes, error: matieresError } = await supabase
    .from('programme')
    .select(`
      id, semestre, coefficient, credit, volume_horaire,
      matiere:matieres(id, nom, code),
      enseignant:enseignants(id, nom, prenom)
    `)
    .eq('filiere_id', etudiant.filiere_id)
    .eq('annee_academique_id', annee_id)
    .order('semestre', { ascending: true })

  if (matieresError) throw matieresError

  if (!programmes || programmes.length === 0) {
    return { etudiant: etudiantTyped, matieres: [], annee }
  }

  const matiereIds = programmes
    .map((p) => ((p.matiere as unknown) as MatiereRef | null)?.id)
    .filter(Boolean) as string[]

  const { data: notes, error: notesError } = await supabase
    .from('notes')
    .select('id, matiere_id, note_normale, note_rattrapage, note_finale, mention')
    .eq('etudiant_id', etudiant_id)
    .eq('annee_academique_id', annee_id)
    .in('matiere_id', matiereIds)

  if (notesError) throw notesError

  const notesMap = new Map((notes ?? []).map((n) => [n.matiere_id, n]))

  const matieresWithNotes = programmes.map((prog) => {
    const matiere = (prog.matiere as unknown) as MatiereRef | null
    const enseignant = (prog.enseignant as unknown) as EnseignantRef | null
    const note = matiere ? notesMap.get(matiere.id) : null
    return {
      id: prog.id,
      nom: matiere?.nom ?? '',
      code: matiere?.code ?? '',
      semestre: prog.semestre as string,
      coefficient: prog.coefficient as number,
      credit: prog.credit as number,
      volume_horaire: prog.volume_horaire as number,
      enseignant,
      note_id: note?.id ?? null,
      note_normale: note?.note_normale ?? null,
      note_rattrapage: note?.note_rattrapage ?? null,
      note_finale: note?.note_finale ?? null,
      mention: note?.mention ?? null,
    }
  })

  return { etudiant: etudiantTyped, matieres: matieresWithNotes, annee }
}

// ─── Recuperer l'annee academique active ─────────────────────────────────────
export async function getActiveAnnee() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('annees_academiques')
    .select('id, libelle')
    .eq('actif', true)
    .single()
  if (error) return null
  return data
}

// ─── Récupérer les étudiants d'une filière avec leur moyenne ─────────────────
export async function getEtudiantsClasse(filiere_id: string, niveau_id: string, annee_id: string) {
  const supabase = await createClient()

  const { data: etudiants, error } = await supabase
    .from('etudiants')
    .select('id, nom, prenom, matricule')
    .eq('filiere_id', filiere_id)
    .eq('niveau_id', niveau_id)
    .order('nom')

  if (error || !etudiants) return []

  const { data: programmes } = await supabase
    .from('programme')
    .select('matiere_id, coefficient')
    .eq('filiere_id', filiere_id)
    .eq('annee_academique_id', annee_id)

  const coeffMap = new Map((programmes ?? []).map((p) => [p.matiere_id, Number(p.coefficient)]))

  const results = await Promise.all(
    etudiants.map(async (etudiant) => {
      const { data: notes } = await supabase
        .from('notes')
        .select('note_finale, matiere_id')
        .eq('etudiant_id', etudiant.id)
        .eq('annee_academique_id', annee_id)
        .not('note_finale', 'is', null)

      const notesData = (notes ?? []) as { note_finale: number; matiere_id: string }[]
      const totalCoeff = notesData.reduce((s, n) => s + (coeffMap.get(n.matiere_id) ?? 1), 0)
      const somme = notesData.reduce(
        (s, n) => s + n.note_finale * (coeffMap.get(n.matiere_id) ?? 1), 0
      )
      const moyenne = totalCoeff > 0 ? somme / totalCoeff : null

      return { ...etudiant, moyenne, nbMatieres: notesData.length }
    })
  )

  return results.sort((a, b) => (b.moyenne ?? -1) - (a.moyenne ?? -1))
}

// ─── Recuperer filieres + niveaux pour les filtres ───────────────────────────
export async function getFormationData() {
  const supabase = await createClient()
  const [{ data: filieres }, { data: niveaux }, { data: annees }] = await Promise.all([
    supabase.from('filieres').select('id, nom, code, type_formation, nb_mensualites').order('nom'),
    supabase.from('niveaux').select('id, nom, filiere_id, ordre').order('ordre'),
    supabase
      .from('annees_academiques')
      .select('id, libelle, actif')
      .order('libelle', { ascending: false }),
  ])
  return {
    filieres: filieres ?? [],
    niveaux: niveaux ?? [],
    annees: annees ?? [],
  }
}
