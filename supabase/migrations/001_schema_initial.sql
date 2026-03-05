-- ============================================================
-- UPTECH - Schéma Base de Données Initial
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TYPES ENUM
-- ============================================================
CREATE TYPE user_role AS ENUM (
  'super_admin', 'directeur', 'responsable_pedagogique',
  'enseignant', 'etudiant', 'agent_comptable', 'secretaire'
);
CREATE TYPE sexe_type AS ENUM ('M', 'F');
CREATE TYPE statut_etudiant AS ENUM ('inscrit', 'preinscrit', 'diplome', 'abandonne', 'suspendu');
CREATE TYPE type_contrat AS ENUM ('permanent', 'vacataire');
CREATE TYPE jour_semaine AS ENUM ('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi');
CREATE TYPE statut_presence AS ENUM ('present', 'absent', 'retard', 'excuse');
CREATE TYPE type_paiement AS ENUM ('inscription', 'scolarite', 'rattrapage', 'autre');
CREATE TYPE statut_paiement AS ENUM ('paye', 'en_attente', 'partiel', 'exonere');
CREATE TYPE semestre_type AS ENUM ('1', '2');
CREATE TYPE mention_type AS ENUM ('TB', 'B', 'AB', 'P', 'F');
CREATE TYPE type_salle AS ENUM ('cours', 'tp', 'amphi', 'salle_examen');
CREATE TYPE cible_annonce AS ENUM ('tous', 'etudiants', 'enseignants', 'administration');

-- ============================================================
-- TABLE: PROFILS UTILISATEURS (liée à auth.users de Supabase)
-- ============================================================
CREATE TABLE profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'etudiant',
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  telephone VARCHAR(20),
  photo_url TEXT,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: ANNÉE ACADÉMIQUE
-- ============================================================
CREATE TABLE annees_academiques (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  libelle VARCHAR(20) NOT NULL UNIQUE, -- ex: "2024-2025"
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  actif BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: FILIÈRES
-- ============================================================
CREATE TABLE filieres (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  nom VARCHAR(200) NOT NULL,
  description TEXT,
  duree_annees INTEGER NOT NULL DEFAULT 2,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: NIVEAUX
-- ============================================================
CREATE TABLE niveaux (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  filiere_id UUID REFERENCES filieres(id) ON DELETE CASCADE NOT NULL,
  nom VARCHAR(50) NOT NULL, -- ex: "Licence 1", "BTS 1"
  ordre INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(filiere_id, ordre)
);

-- ============================================================
-- TABLE: SALLES
-- ============================================================
CREATE TABLE salles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom VARCHAR(50) NOT NULL UNIQUE,
  capacite INTEGER NOT NULL DEFAULT 30,
  type type_salle DEFAULT 'cours',
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: ENSEIGNANTS
-- ============================================================
CREATE TABLE enseignants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  matricule VARCHAR(20) NOT NULL UNIQUE,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  telephone VARCHAR(20),
  specialite VARCHAR(200),
  type_contrat type_contrat DEFAULT 'vacataire',
  date_embauche DATE,
  photo_url TEXT,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: MATIÈRES
-- ============================================================
CREATE TABLE matieres (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  nom VARCHAR(200) NOT NULL,
  coefficient DECIMAL(4,2) NOT NULL DEFAULT 1,
  credit INTEGER DEFAULT 0,
  filiere_id UUID REFERENCES filieres(id) ON DELETE CASCADE NOT NULL,
  niveau_id UUID REFERENCES niveaux(id) ON DELETE CASCADE NOT NULL,
  enseignant_id UUID REFERENCES enseignants(id) ON DELETE SET NULL,
  semestre semestre_type NOT NULL,
  volume_horaire INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: ÉTUDIANTS
-- ============================================================
CREATE TABLE etudiants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  matricule VARCHAR(20) NOT NULL UNIQUE,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  date_naissance DATE NOT NULL,
  lieu_naissance VARCHAR(100),
  sexe sexe_type NOT NULL,
  nationalite VARCHAR(50) DEFAULT 'Congolaise',
  adresse TEXT,
  email VARCHAR(255) NOT NULL UNIQUE,
  telephone VARCHAR(20),
  telephone_parent VARCHAR(20),
  email_parent VARCHAR(255),
  photo_url TEXT,
  filiere_id UUID REFERENCES filieres(id) ON DELETE RESTRICT NOT NULL,
  niveau_id UUID REFERENCES niveaux(id) ON DELETE RESTRICT NOT NULL,
  annee_academique_id UUID REFERENCES annees_academiques(id) ON DELETE RESTRICT NOT NULL,
  statut statut_etudiant DEFAULT 'preinscrit',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: EMPLOIS DU TEMPS
-- ============================================================
CREATE TABLE emplois_du_temps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  matiere_id UUID REFERENCES matieres(id) ON DELETE CASCADE NOT NULL,
  salle_id UUID REFERENCES salles(id) ON DELETE SET NULL,
  annee_academique_id UUID REFERENCES annees_academiques(id) ON DELETE CASCADE NOT NULL,
  jour jour_semaine NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_overlap CHECK (heure_debut < heure_fin)
);

-- ============================================================
-- TABLE: NOTES
-- ============================================================
CREATE TABLE notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  etudiant_id UUID REFERENCES etudiants(id) ON DELETE CASCADE NOT NULL,
  matiere_id UUID REFERENCES matieres(id) ON DELETE CASCADE NOT NULL,
  annee_academique_id UUID REFERENCES annees_academiques(id) ON DELETE CASCADE NOT NULL,
  note_normale DECIMAL(5,2) CHECK (note_normale >= 0 AND note_normale <= 20),
  note_rattrapage DECIMAL(5,2) CHECK (note_rattrapage >= 0 AND note_rattrapage <= 20),
  note_finale DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN note_rattrapage IS NOT NULL AND note_rattrapage > COALESCE(note_normale, 0)
        THEN note_rattrapage
      ELSE note_normale
    END
  ) STORED,
  mention mention_type GENERATED ALWAYS AS (
    CASE
      WHEN GREATEST(COALESCE(note_rattrapage, 0), COALESCE(note_normale, 0)) >= 16 THEN 'TB'::mention_type
      WHEN GREATEST(COALESCE(note_rattrapage, 0), COALESCE(note_normale, 0)) >= 14 THEN 'B'::mention_type
      WHEN GREATEST(COALESCE(note_rattrapage, 0), COALESCE(note_normale, 0)) >= 12 THEN 'AB'::mention_type
      WHEN GREATEST(COALESCE(note_rattrapage, 0), COALESCE(note_normale, 0)) >= 10 THEN 'P'::mention_type
      ELSE 'F'::mention_type
    END
  ) STORED,
  saisie_par UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(etudiant_id, matiere_id, annee_academique_id)
);

-- ============================================================
-- TABLE: PRÉSENCES
-- ============================================================
CREATE TABLE presences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  etudiant_id UUID REFERENCES etudiants(id) ON DELETE CASCADE NOT NULL,
  matiere_id UUID REFERENCES matieres(id) ON DELETE CASCADE NOT NULL,
  date_cours DATE NOT NULL,
  statut statut_presence DEFAULT 'absent',
  justification TEXT,
  saisie_par UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(etudiant_id, matiere_id, date_cours)
);

-- ============================================================
-- TABLE: PAIEMENTS
-- ============================================================
CREATE TABLE paiements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  etudiant_id UUID REFERENCES etudiants(id) ON DELETE CASCADE NOT NULL,
  annee_academique_id UUID REFERENCES annees_academiques(id) ON DELETE CASCADE NOT NULL,
  montant DECIMAL(12,2) NOT NULL,
  montant_total DECIMAL(12,2) NOT NULL,
  type type_paiement NOT NULL,
  statut statut_paiement DEFAULT 'en_attente',
  date_paiement TIMESTAMPTZ,
  reference VARCHAR(50) UNIQUE,
  mode_paiement VARCHAR(50), -- espèce, virement, mobile money
  notes TEXT,
  saisie_par UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: TARIFS SCOLARITÉ
-- ============================================================
CREATE TABLE tarifs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  filiere_id UUID REFERENCES filieres(id) ON DELETE CASCADE NOT NULL,
  niveau_id UUID REFERENCES niveaux(id) ON DELETE CASCADE NOT NULL,
  annee_academique_id UUID REFERENCES annees_academiques(id) ON DELETE CASCADE NOT NULL,
  frais_inscription DECIMAL(12,2) DEFAULT 0,
  frais_scolarite DECIMAL(12,2) NOT NULL,
  frais_rattrapage DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(filiere_id, niveau_id, annee_academique_id)
);

-- ============================================================
-- TABLE: MESSAGES INTERNES
-- ============================================================
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  expediteur_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  destinataire_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sujet VARCHAR(255) NOT NULL,
  contenu TEXT NOT NULL,
  lu BOOLEAN DEFAULT FALSE,
  date_lecture TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: ANNONCES
-- ============================================================
CREATE TABLE annonces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  titre VARCHAR(255) NOT NULL,
  contenu TEXT NOT NULL,
  auteur_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cible cible_annonce DEFAULT 'tous',
  date_expiration TIMESTAMPTZ,
  publie BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: LOGS D'ACTIVITÉ
-- ============================================================
CREATE TABLE activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  table_concernee VARCHAR(50),
  enregistrement_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES POUR PERFORMANCE
-- ============================================================
CREATE INDEX idx_etudiants_filiere ON etudiants(filiere_id);
CREATE INDEX idx_etudiants_niveau ON etudiants(niveau_id);
CREATE INDEX idx_etudiants_annee ON etudiants(annee_academique_id);
CREATE INDEX idx_etudiants_statut ON etudiants(statut);
CREATE INDEX idx_notes_etudiant ON notes(etudiant_id);
CREATE INDEX idx_notes_matiere ON notes(matiere_id);
CREATE INDEX idx_presences_etudiant ON presences(etudiant_id);
CREATE INDEX idx_presences_date ON presences(date_cours);
CREATE INDEX idx_paiements_etudiant ON paiements(etudiant_id);
CREATE INDEX idx_paiements_statut ON paiements(statut);
CREATE INDEX idx_messages_destinataire ON messages(destinataire_id);
CREATE INDEX idx_messages_expediteur ON messages(expediteur_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- ============================================================
-- FONCTION: Mise à jour automatique updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_etudiants_updated_at BEFORE UPDATE ON etudiants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_enseignants_updated_at BEFORE UPDATE ON enseignants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_matieres_updated_at BEFORE UPDATE ON matieres FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_paiements_updated_at BEFORE UPDATE ON paiements FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_annonces_updated_at BEFORE UPDATE ON annonces FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FONCTION: Création automatique du profil après inscription
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, role, nom, prenom, email)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'etudiant'),
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- GÉNÉRATION AUTOMATIQUE DU MATRICULE ÉTUDIANT
-- ============================================================
CREATE OR REPLACE FUNCTION generate_matricule_etudiant()
RETURNS TRIGGER AS $$
DECLARE
  annee_courante VARCHAR(4);
  sequence_num INTEGER;
BEGIN
  annee_courante := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM etudiants
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

  NEW.matricule := 'UPT' || annee_courante || LPAD(sequence_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_matricule_etudiant
  BEFORE INSERT ON etudiants
  FOR EACH ROW
  WHEN (NEW.matricule IS NULL OR NEW.matricule = '')
  EXECUTE FUNCTION generate_matricule_etudiant();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE etudiants ENABLE ROW LEVEL SECURITY;
ALTER TABLE enseignants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE presences ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE annonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: chaque utilisateur voit son propre profil, les admins voient tout
CREATE POLICY "Voir son propre profil" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin voit tous les profils" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'directeur', 'secretaire'))
);

-- Étudiants: l'étudiant voit son propre dossier, le staff voit tout
CREATE POLICY "Etudiant voit son dossier" ON etudiants FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role != 'etudiant')
);
CREATE POLICY "Staff gère les étudiants" ON etudiants FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'directeur', 'responsable_pedagogique', 'secretaire'))
);

-- Notes: étudiant voit ses notes, enseignant saisit ses notes, admin voit tout
CREATE POLICY "Etudiant voit ses notes" ON notes FOR SELECT USING (
  EXISTS (SELECT 1 FROM etudiants e WHERE e.id = etudiant_id AND e.user_id = auth.uid())
);
CREATE POLICY "Enseignant gère ses notes" ON notes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM matieres m
    JOIN enseignants ens ON ens.id = m.enseignant_id
    WHERE m.id = matiere_id AND ens.user_id = auth.uid()
  )
);
CREATE POLICY "Admin gère toutes les notes" ON notes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'directeur', 'responsable_pedagogique'))
);

-- Messages: voir ses propres messages
CREATE POLICY "Voir ses messages" ON messages FOR SELECT USING (
  expediteur_id = auth.uid() OR destinataire_id = auth.uid()
);
CREATE POLICY "Envoyer des messages" ON messages FOR INSERT WITH CHECK (expediteur_id = auth.uid());

-- Annonces: tout le monde lit, admin écrit
CREATE POLICY "Lire les annonces" ON annonces FOR SELECT USING (publie = TRUE);
CREATE POLICY "Admin gère les annonces" ON annonces FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'directeur', 'responsable_pedagogique', 'secretaire'))
);

-- Tables publiques (lecture pour tous les authentifiés)
ALTER TABLE filieres ENABLE ROW LEVEL SECURITY;
ALTER TABLE niveaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE matieres ENABLE ROW LEVEL SECURITY;
ALTER TABLE salles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emplois_du_temps ENABLE ROW LEVEL SECURITY;
ALTER TABLE annees_academiques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique filieres" ON filieres FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Lecture publique niveaux" ON niveaux FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Lecture publique matieres" ON matieres FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Lecture publique salles" ON salles FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Lecture publique emplois" ON emplois_du_temps FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Lecture publique annees" ON annees_academiques FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Admin gère filieres" ON filieres FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'directeur', 'responsable_pedagogique'))
);
CREATE POLICY "Admin gère niveaux" ON niveaux FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'directeur', 'responsable_pedagogique'))
);
CREATE POLICY "Admin gère matieres" ON matieres FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'directeur', 'responsable_pedagogique'))
);

-- Paiements: étudiant voit les siens, comptable gère tout
CREATE POLICY "Etudiant voit ses paiements" ON paiements FOR SELECT USING (
  EXISTS (SELECT 1 FROM etudiants e WHERE e.id = etudiant_id AND e.user_id = auth.uid())
);
CREATE POLICY "Comptable gère paiements" ON paiements FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'directeur', 'agent_comptable'))
);

-- Présences: étudiant voit les siennes, enseignant saisit les siennes
CREATE POLICY "Etudiant voit ses presences" ON presences FOR SELECT USING (
  EXISTS (SELECT 1 FROM etudiants e WHERE e.id = etudiant_id AND e.user_id = auth.uid())
);
CREATE POLICY "Enseignant gère presences" ON presences FOR ALL USING (
  EXISTS (
    SELECT 1 FROM matieres m
    JOIN enseignants ens ON ens.id = m.enseignant_id
    WHERE m.id = matiere_id AND ens.user_id = auth.uid()
  ) OR
  EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'directeur', 'responsable_pedagogique'))
);

-- ============================================================
-- DONNÉES DE BASE (SEED)
-- ============================================================

-- Année académique courante
INSERT INTO annees_academiques (libelle, date_debut, date_fin, actif)
VALUES ('2024-2025', '2024-10-01', '2025-07-31', TRUE);

-- Filières de base
INSERT INTO filieres (code, nom, duree_annees) VALUES
  ('INFO', 'Informatique et Réseaux', 3),
  ('GESTION', 'Gestion des Entreprises', 3),
  ('COMPTA', 'Comptabilité et Finance', 3),
  ('TELECOM', 'Télécommunications', 3);

-- Niveaux pour Informatique
INSERT INTO niveaux (filiere_id, nom, ordre)
SELECT id, 'Licence 1', 1 FROM filieres WHERE code = 'INFO'
UNION ALL
SELECT id, 'Licence 2', 2 FROM filieres WHERE code = 'INFO'
UNION ALL
SELECT id, 'Licence 3', 3 FROM filieres WHERE code = 'INFO';

-- Niveaux pour Gestion
INSERT INTO niveaux (filiere_id, nom, ordre)
SELECT id, 'Licence 1', 1 FROM filieres WHERE code = 'GESTION'
UNION ALL
SELECT id, 'Licence 2', 2 FROM filieres WHERE code = 'GESTION'
UNION ALL
SELECT id, 'Licence 3', 3 FROM filieres WHERE code = 'GESTION';

-- Salles de base
INSERT INTO salles (nom, capacite, type) VALUES
  ('Salle A101', 40, 'cours'),
  ('Salle A102', 40, 'cours'),
  ('Salle B201', 60, 'cours'),
  ('Amphi 1', 200, 'amphi'),
  ('Labo Informatique', 30, 'tp'),
  ('Salle Examens 1', 50, 'salle_examen');
