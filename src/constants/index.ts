export const APP_NAME = 'UPTECH'
export const APP_DESCRIPTION = 'Système de Gestion de l\'Institut Supérieur UPTECH'

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  DIRECTEUR: 'directeur',
  RESPONSABLE_PEDAGOGIQUE: 'responsable_pedagogique',
  ENSEIGNANT: 'enseignant',
  ETUDIANT: 'etudiant',
  AGENT_COMPTABLE: 'agent_comptable',
  SECRETAIRE: 'secretaire',
} as const

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Administrateur',
  directeur: 'Directeur',
  responsable_pedagogique: 'Responsable Pédagogique',
  enseignant: 'Enseignant',
  etudiant: 'Étudiant',
  agent_comptable: 'Agent Comptable',
  secretaire: 'Secrétaire',
}

export const MENTIONS = {
  TB: 'Très Bien',
  B: 'Bien',
  AB: 'Assez Bien',
  P: 'Passable',
  F: 'Insuffisant',
}

export const NOTE_SEUILS = {
  TRES_BIEN: 16,
  BIEN: 14,
  ASSEZ_BIEN: 12,
  PASSABLE: 10,
  ECHEC: 0,
}

export const JOURS_SEMAINE = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

export const STATUTS_ETUDIANT = {
  INSCRIT: 'inscrit',
  PREINSCRIT: 'preinscrit',
  DIPLOME: 'diplome',
  ABANDONNE: 'abandonne',
  SUSPENDU: 'suspendu',
}

export const STATUTS_PAIEMENT = {
  PAYE: 'paye',
  EN_ATTENTE: 'en_attente',
  PARTIEL: 'partiel',
  EXONERE: 'exonere',
}

export const NAVIGATION_ITEMS = [
  { label: 'Tableau de bord', href: '/dashboard', icon: 'LayoutDashboard', roles: ['all'] },
  { label: 'Étudiants', href: '/students', icon: 'Users', roles: ['super_admin', 'directeur', 'responsable_pedagogique', 'secretaire'] },
  { label: 'Enseignants', href: '/teachers', icon: 'GraduationCap', roles: ['super_admin', 'directeur', 'responsable_pedagogique', 'secretaire'] },
  { label: 'Formations', href: '/courses', icon: 'BookOpen', roles: ['super_admin', 'directeur', 'responsable_pedagogique', 'enseignant'] },
  { label: 'Notes & Résultats', href: '/grades', icon: 'ClipboardList', roles: ['super_admin', 'directeur', 'responsable_pedagogique', 'enseignant', 'etudiant'] },
  { label: 'Présences', href: '/attendance', icon: 'CalendarCheck', roles: ['super_admin', 'directeur', 'responsable_pedagogique', 'enseignant', 'etudiant'] },
  { label: 'Finance', href: '/finance', icon: 'CreditCard', roles: ['super_admin', 'directeur', 'agent_comptable'] },
  { label: 'Communication', href: '/communication', icon: 'MessageSquare', roles: ['all'] },
  { label: 'Rapports', href: '/reports', icon: 'BarChart2', roles: ['super_admin', 'directeur', 'responsable_pedagogique'] },
  { label: 'Paramètres', href: '/settings', icon: 'Settings', roles: ['super_admin'] },
]
