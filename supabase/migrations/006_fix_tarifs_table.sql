-- ============================================================
-- Migration 006 : Restructurer la table tarifs
-- Remplace frais_scolarite par mensualite + nb_mensualites
-- Supprime niveau_id (tarif par filière, pas par niveau)
-- ============================================================

-- 1. Vider les tarifs existants (ancienne structure incompatible)
TRUNCATE TABLE tarifs;

-- 2. Supprimer l'ancienne contrainte unique
ALTER TABLE tarifs DROP CONSTRAINT IF EXISTS tarifs_filiere_id_niveau_id_annee_academique_id_key;
ALTER TABLE tarifs DROP CONSTRAINT IF EXISTS tarifs_filiere_id_annee_academique_id_key;

-- 3. Supprimer les anciennes colonnes
ALTER TABLE tarifs DROP COLUMN IF EXISTS niveau_id;
ALTER TABLE tarifs DROP COLUMN IF EXISTS frais_scolarite;
ALTER TABLE tarifs DROP COLUMN IF EXISTS frais_rattrapage;

-- 4. Ajouter les nouvelles colonnes
ALTER TABLE tarifs
  ADD COLUMN IF NOT EXISTS mensualite    DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nb_mensualites INTEGER       NOT NULL DEFAULT 9;

-- 5. Nouvelle contrainte unique : un tarif par filière + année
ALTER TABLE tarifs
  ADD CONSTRAINT tarifs_filiere_annee_unique
  UNIQUE (filiere_id, annee_academique_id);

-- 6. Vérification
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tarifs'
ORDER BY ordinal_position;
