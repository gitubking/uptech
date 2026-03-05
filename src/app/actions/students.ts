'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Récupérer tous les étudiants ───────────────────────────────────────────
export async function getStudents(filters?: {
  search?: string
  filiere_id?: string
  niveau_id?: string
  statut?: string
  annee_academique_id?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('etudiants')
    .select(`
      *,
      filiere:filieres(id, nom, code),
      niveau:niveaux(id, nom),
      annee_academique:annees_academiques(id, libelle)
    `)
    .order('created_at', { ascending: false })

  if (filters?.search) {
    query = query.or(
      `nom.ilike.%${filters.search}%,prenom.ilike.%${filters.search}%,matricule.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    )
  }
  if (filters?.filiere_id) query = query.eq('filiere_id', filters.filiere_id)
  if (filters?.niveau_id) query = query.eq('niveau_id', filters.niveau_id)
  if (filters?.statut) query = query.eq('statut', filters.statut)
  if (filters?.annee_academique_id) query = query.eq('annee_academique_id', filters.annee_academique_id)

  const { data, error } = await query
  if (error) throw error
  return data
}

// ─── Récupérer un étudiant par ID ────────────────────────────────────────────
export async function getStudentById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('etudiants')
    .select(`
      *,
      filiere:filieres(id, nom, code),
      niveau:niveaux(id, nom),
      annee_academique:annees_academiques(id, libelle)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// ─── Récupérer les données de référence ──────────────────────────────────────
export async function getFormData() {
  const supabase = await createClient()
  const [{ data: filieres }, { data: niveaux }, { data: annees }] = await Promise.all([
    supabase.from('filieres').select('id, nom, code, type_formation, nb_mensualites').eq('actif', true).order('nom'),
    supabase.from('niveaux').select('id, nom, filiere_id, ordre').order('ordre'),
    supabase.from('annees_academiques').select('id, libelle').order('libelle', { ascending: false }),
  ])
  return { filieres: filieres ?? [], niveaux: niveaux ?? [], annees: annees ?? [] }
}

// ─── Créer un étudiant ───────────────────────────────────────────────────────
export async function createStudent(
  _prevState: { error: string; redirectTo?: string } | null,
  formData: FormData
): Promise<{ error: string; redirectTo?: string } | null> {
  const db = createAdminClient()

  const data = {
    nom: (formData.get('nom') as string).toUpperCase(),
    prenom: formData.get('prenom') as string,
    date_naissance: formData.get('date_naissance') as string,
    lieu_naissance: formData.get('lieu_naissance') as string,
    sexe: formData.get('sexe') as string,
    nationalite: formData.get('nationalite') as string || 'Congolaise',
    adresse: formData.get('adresse') as string,
    email: formData.get('email') as string,
    telephone: formData.get('telephone') as string,
    telephone_parent: formData.get('telephone_parent') as string,
    email_parent: formData.get('email_parent') as string,
    filiere_id: formData.get('filiere_id') as string,
    niveau_id: formData.get('niveau_id') as string,
    annee_academique_id: formData.get('annee_academique_id') as string,
    statut: formData.get('statut') as string || 'preinscrit',
    matricule: '',
  }

  const { data: student, error } = await db
    .from('etudiants')
    .insert(data)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/students')
  return { error: '', redirectTo: `/students/${student.id}` }
}

// ─── Mettre à jour un étudiant ───────────────────────────────────────────────
export async function updateStudent(
  id: string,
  formData: FormData
): Promise<{ error: string; redirectTo?: string }> {
  const db = createAdminClient()

  const data = {
    nom: (formData.get('nom') as string).toUpperCase(),
    prenom: formData.get('prenom') as string,
    date_naissance: formData.get('date_naissance') as string,
    lieu_naissance: formData.get('lieu_naissance') as string,
    sexe: formData.get('sexe') as string,
    nationalite: formData.get('nationalite') as string,
    adresse: formData.get('adresse') as string,
    email: formData.get('email') as string,
    telephone: formData.get('telephone') as string,
    telephone_parent: formData.get('telephone_parent') as string,
    email_parent: formData.get('email_parent') as string,
    filiere_id: formData.get('filiere_id') as string,
    niveau_id: formData.get('niveau_id') as string,
    statut: formData.get('statut') as string,
  }

  const { error } = await db.from('etudiants').update(data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/students')
  revalidatePath(`/students/${id}`)
  return { error: '', redirectTo: `/students/${id}` }
}

// ─── Supprimer un étudiant ───────────────────────────────────────────────────
export async function deleteStudent(id: string): Promise<{ error: string; redirectTo?: string }> {
  const db = createAdminClient()
  await db.from('etudiants').delete().eq('id', id)
  revalidatePath('/students')
  return { error: '', redirectTo: '/students' }
}

// ─── Changer le statut ───────────────────────────────────────────────────────
export async function updateStudentStatus(
  id: string,
  statut: string
): Promise<{ error: string; redirectTo?: string }> {
  const db = createAdminClient()
  await db.from('etudiants').update({ statut }).eq('id', id)
  revalidatePath('/students')
  revalidatePath(`/students/${id}`)
  return { error: '', redirectTo: `/students/${id}` }
}
