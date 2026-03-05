-- ============================================================
-- GÉNÉRATION AUTOMATIQUE DU MATRICULE ENSEIGNANT
-- ============================================================
CREATE OR REPLACE FUNCTION generate_matricule_enseignant()
RETURNS TRIGGER AS $$
DECLARE
  annee_courante VARCHAR(4);
  sequence_num INTEGER;
BEGIN
  annee_courante := TO_CHAR(NOW(), 'YYYY');

  SELECT COUNT(*) + 1 INTO sequence_num
  FROM enseignants
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

  NEW.matricule := 'ENS' || annee_courante || LPAD(sequence_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_matricule_enseignant
  BEFORE INSERT ON enseignants
  FOR EACH ROW
  WHEN (NEW.matricule IS NULL OR NEW.matricule = '')
  EXECUTE FUNCTION generate_matricule_enseignant();
