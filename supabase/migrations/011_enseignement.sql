-- ============================================================
-- UPTECH - Table enseignement
-- Affectation enseignant + volume horaire par (classe, matière)
-- ============================================================

CREATE TABLE enseignement (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  classe_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  programme_id UUID REFERENCES programme(id) ON DELETE CASCADE NOT NULL,
  enseignant_id UUID REFERENCES enseignants(id) ON DELETE SET NULL,
  volume_horaire INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(classe_id, programme_id)
);

CREATE INDEX idx_enseignement_classe ON enseignement(classe_id);
CREATE INDEX idx_enseignement_programme ON enseignement(programme_id);
CREATE INDEX idx_enseignement_enseignant ON enseignement(enseignant_id);

CREATE TRIGGER update_enseignement_updated_at
  BEFORE UPDATE ON enseignement
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE enseignement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique enseignement" ON enseignement
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Admin gère enseignement" ON enseignement
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('super_admin', 'directeur', 'responsable_pedagogique')
    )
  );
