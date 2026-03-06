-- ============================================================
-- Migration 012 : Lier les émargements à une classe
-- Un émargement = enseignant + matière + CLASSE + date
-- ============================================================

-- 1. Ajouter la colonne classe_id (nullable pour rétrocompat)
ALTER TABLE emargements ADD COLUMN IF NOT EXISTS classe_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_emargements_classe ON emargements(classe_id);

-- 3. Supprimer l'ancienne contrainte UNIQUE (sans classe_id)
ALTER TABLE emargements DROP CONSTRAINT IF EXISTS emargements_enseignant_id_matiere_id_date_cours_key;

-- 4. Nouvelle contrainte UNIQUE incluant classe_id
-- Permet au même enseignant de signer le même cours dans 2 classes différentes le même jour
ALTER TABLE emargements ADD CONSTRAINT emargements_unique_par_classe
  UNIQUE (enseignant_id, matiere_id, classe_id, date_cours);

-- 5. Vérification
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'emargements'
ORDER BY ordinal_position;
