-- ============================================================
-- UPTECH - Table Classes
-- Une classe = filière + niveau + année académique + date de rentrée
-- Permet d'avoir plusieurs cohortes du même niveau dans l'année
-- ============================================================

CREATE TYPE statut_classe AS ENUM ('en_preparation', 'en_cours', 'terminee', 'annulee');

CREATE TABLE classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,           -- ex: "BTS1 Informatique Oct 2025"
  code VARCHAR(50) NOT NULL UNIQUE,    -- ex: "BTS1-INFO-OCT25"
  filiere_id UUID REFERENCES filieres(id) ON DELETE RESTRICT NOT NULL,
  niveau_id UUID REFERENCES niveaux(id) ON DELETE RESTRICT NOT NULL,
  annee_academique_id UUID REFERENCES annees_academiques(id) ON DELETE RESTRICT NOT NULL,
  date_rentree DATE NOT NULL,          -- date de début de cette cohorte
  capacite INTEGER DEFAULT 30,
  statut statut_classe DEFAULT 'en_preparation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Pas deux classes identiques démarrant le même jour
  UNIQUE(filiere_id, niveau_id, annee_academique_id, date_rentree)
);

-- Index de performance
CREATE INDEX idx_classes_filiere ON classes(filiere_id);
CREATE INDEX idx_classes_niveau ON classes(niveau_id);
CREATE INDEX idx_classes_annee ON classes(annee_academique_id);
CREATE INDEX idx_classes_statut ON classes(statut);

-- Trigger updated_at
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Lien optionnel étudiant → classe (nullable pour rétrocompatibilité)
ALTER TABLE etudiants ADD COLUMN classe_id UUID REFERENCES classes(id) ON DELETE SET NULL;
CREATE INDEX idx_etudiants_classe ON etudiants(classe_id);

-- RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique classes" ON classes
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Admin gère classes" ON classes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('super_admin', 'directeur', 'responsable_pedagogique', 'secretaire')
    )
  );
