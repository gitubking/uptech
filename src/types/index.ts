// =============================
// RÔLES UTILISATEURS
// =============================
export type UserRole =
  | 'super_admin'
  | 'directeur'
  | 'responsable_pedagogique'
  | 'enseignant'
  | 'etudiant'
  | 'agent_comptable'
  | 'secretaire'

// =============================
// PROFIL UTILISATEUR
// =============================
export interface UserProfile {
  id: string
  user_id: string
  role: UserRole
  nom: string
  prenom: string
  email: string
  telephone?: string
  photo_url?: string
  actif: boolean
  created_at: string
  updated_at: string
}

// =============================
// ÉTUDIANT
// =============================
export interface Student {
  id: string
  matricule: string
  nom: string
  prenom: string
  date_naissance: string
  lieu_naissance: string
  sexe: 'M' | 'F'
  nationalite: string
  adresse: string
  email: string
  telephone: string
  photo_url?: string
  filiere_id: string
  niveau_id: string
  annee_academique_id: string
  statut: 'inscrit' | 'preinscrit' | 'diplome' | 'abandonne' | 'suspendu'
  created_at: string
  updated_at: string
}

// =============================
// ENSEIGNANT
// =============================
export interface Teacher {
  id: string
  matricule: string
  nom: string
  prenom: string
  email: string
  telephone: string
  specialite: string
  type_contrat: 'permanent' | 'vacataire'
  date_embauche: string
  photo_url?: string
  actif: boolean
  created_at: string
  updated_at: string
}

// =============================
// FILIÈRE / FORMATION
// =============================
export interface Filiere {
  id: string
  code: string
  nom: string
  description?: string
  duree_annees: number
  actif: boolean
  created_at: string
}

// =============================
// NIVEAU
// =============================
export interface Niveau {
  id: string
  filiere_id: string
  nom: string
  ordre: number
}

// =============================
// MATIÈRE
// =============================
export interface Matiere {
  id: string
  code: string
  nom: string
  coefficient: number
  credit: number
  filiere_id: string
  niveau_id: string
  enseignant_id?: string
  semestre: 1 | 2
  created_at: string
}

// =============================
// ANNÉE ACADÉMIQUE
// =============================
export interface AnneeAcademique {
  id: string
  libelle: string
  date_debut: string
  date_fin: string
  actif: boolean
  created_at: string
}

// =============================
// NOTE
// =============================
export interface Note {
  id: string
  etudiant_id: string
  matiere_id: string
  annee_academique_id: string
  note_normale?: number
  note_rattrapage?: number
  note_finale?: number
  mention?: 'TB' | 'B' | 'AB' | 'P' | 'F'
  created_at: string
  updated_at: string
}

// =============================
// PRÉSENCE
// =============================
export interface Presence {
  id: string
  etudiant_id: string
  matiere_id: string
  date_cours: string
  statut: 'present' | 'absent' | 'retard' | 'excuse'
  created_at: string
}

// =============================
// PAIEMENT
// =============================
export interface Paiement {
  id: string
  etudiant_id: string
  annee_academique_id: string
  montant: number
  type: 'inscription' | 'scolarite' | 'rattrapage' | 'autre'
  statut: 'paye' | 'en_attente' | 'partiel' | 'exonere'
  date_paiement?: string
  reference?: string
  created_at: string
}

// =============================
// EMPLOI DU TEMPS
// =============================
export interface EmploiDuTemps {
  id: string
  matiere_id: string
  salle_id: string
  jour: 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi'
  heure_debut: string
  heure_fin: string
  annee_academique_id: string
  created_at: string
}

// =============================
// SALLE
// =============================
export interface Salle {
  id: string
  nom: string
  capacite: number
  type: 'cours' | 'tp' | 'amphi' | 'salle_examen'
  actif: boolean
}

// =============================
// MESSAGE
// =============================
export interface Message {
  id: string
  expediteur_id: string
  destinataire_id?: string
  sujet: string
  contenu: string
  lu: boolean
  created_at: string
}

// =============================
// ANNONCE
// =============================
export interface Annonce {
  id: string
  titre: string
  contenu: string
  auteur_id: string
  cible: 'tous' | 'etudiants' | 'enseignants' | 'administration'
  date_expiration?: string
  created_at: string
}
