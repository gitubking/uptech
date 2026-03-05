-- ============================================================
-- Migration 002 : Tables emargements + annonces
-- Projet : UPTECH Institut Supérieur de Formation
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- URL : https://supabase.com/dashboard/project/gpikjvprlwjfdtwuonwc/sql/new
-- ============================================================

-- ── 1. TABLE EMARGEMENTS ────────────────────────────────────
-- Feuille d'émargement des enseignants : enregistre qu'un cours
-- a bien été dispensé (enseignant, matière, date, horaires, contenu)

CREATE TABLE IF NOT EXISTS emargements (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  enseignant_id uuid REFERENCES enseignants(id) ON DELETE CASCADE NOT NULL,
  matiere_id    uuid REFERENCES matieres(id) ON DELETE CASCADE NOT NULL,
  date_cours    date NOT NULL,
  heure_debut   time,
  heure_fin     time,
  chapitre      text,
  observations  text,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (enseignant_id, matiere_id, date_cours)
);

-- RLS
ALTER TABLE emargements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'emargements' AND policyname = 'allow_all'
  ) THEN
    CREATE POLICY "allow_all" ON emargements
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 2. TABLE ANNONCES ───────────────────────────────────────
-- Module Communication : annonces diffusées aux étudiants,
-- enseignants ou à toute l'institution

CREATE TABLE IF NOT EXISTS annonces (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  titre           text NOT NULL,
  contenu         text NOT NULL,
  auteur_id       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  cible           text DEFAULT 'tous'
                       CHECK (cible IN ('tous','etudiants','enseignants','administration')),
  date_expiration date,
  created_at      timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE annonces ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'annonces' AND policyname = 'allow_all'
  ) THEN
    CREATE POLICY "allow_all" ON annonces
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 3. VÉRIFICATION ─────────────────────────────────────────
SELECT
  table_name,
  'OK' AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('emargements', 'annonces')
ORDER BY table_name;
