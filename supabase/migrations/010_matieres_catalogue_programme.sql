-- ============================================================
-- UPTECH - Refactoring Matières : Catalogue + Programme
-- Une matière peut appartenir à plusieurs filières
-- ============================================================

-- 1. Créer la table programme (matière affectée à une filière)
CREATE TABLE programme (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  matiere_id UUID REFERENCES matieres(id) ON DELETE CASCADE NOT NULL,
  filiere_id UUID REFERENCES filieres(id) ON DELETE CASCADE NOT NULL,
  annee_academique_id UUID REFERENCES annees_academiques(id) ON DELETE CASCADE NOT NULL,
  semestre semestre_type NOT NULL DEFAULT '1',
  coefficient DECIMAL(4,2) NOT NULL DEFAULT 1,
  credit INTEGER DEFAULT 0,
  volume_horaire INTEGER DEFAULT 0,
  enseignant_id UUID REFERENCES enseignants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(matiere_id, filiere_id, annee_academique_id, semestre)
);

-- 2. Migrer les données existantes vers programme
-- (utilise l'année académique active comme référence)
INSERT INTO programme (matiere_id, filiere_id, annee_academique_id, semestre, coefficient, credit, volume_horaire, enseignant_id)
SELECT
  m.id,
  m.filiere_id,
  COALESCE(
    (SELECT id FROM annees_academiques WHERE actif = true LIMIT 1),
    (SELECT id FROM annees_academiques ORDER BY created_at DESC LIMIT 1)
  ),
  m.semestre,
  m.coefficient,
  m.credit,
  m.volume_horaire,
  m.enseignant_id
FROM matieres m
WHERE m.filiere_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Ajouter description au catalogue
ALTER TABLE matieres ADD COLUMN IF NOT EXISTS description TEXT;

-- 4. Retirer les colonnes déplacées vers programme
ALTER TABLE matieres DROP COLUMN IF EXISTS filiere_id;
ALTER TABLE matieres DROP COLUMN IF EXISTS niveau_id;
ALTER TABLE matieres DROP COLUMN IF EXISTS enseignant_id;
ALTER TABLE matieres DROP COLUMN IF EXISTS semestre;
ALTER TABLE matieres DROP COLUMN IF EXISTS coefficient;
ALTER TABLE matieres DROP COLUMN IF EXISTS credit;
ALTER TABLE matieres DROP COLUMN IF EXISTS volume_horaire;

-- 5. Index
CREATE INDEX idx_programme_matiere ON programme(matiere_id);
CREATE INDEX idx_programme_filiere ON programme(filiere_id);
CREATE INDEX idx_programme_annee ON programme(annee_academique_id);
CREATE INDEX idx_programme_enseignant ON programme(enseignant_id);

-- 6. Trigger updated_at
CREATE TRIGGER update_programme_updated_at
  BEFORE UPDATE ON programme
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7. RLS
ALTER TABLE programme ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique programme" ON programme
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Admin gère programme" ON programme
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('super_admin', 'directeur', 'responsable_pedagogique')
    )
  );
