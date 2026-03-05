-- ============================================================
-- Migration 003 : Types de formation + tarifs enseignants
-- Projet : UPTECH Institut Supérieur de Formation
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- URL : https://supabase.com/dashboard/project/gpikjvprlwjfdtwuonwc/sql/new
-- ============================================================

-- ── 1. TABLE TYPE_FORMATIONS ─────────────────────────────────
-- Catégories de formation avec leurs tarifs de rémunération

CREATE TABLE IF NOT EXISTS type_formations (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nom              text NOT NULL,
  code             text UNIQUE NOT NULL,
  description      text,
  tarif_horaire    numeric(10,2) DEFAULT 0,
  methode_paiement text DEFAULT 'horaire'
    CHECK (methode_paiement IN ('horaire', 'forfait_seance', 'mensuel')),
  actif            boolean DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE type_formations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'type_formations' AND policyname = 'allow_all'
  ) THEN
    CREATE POLICY "allow_all" ON type_formations
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 2. DONNÉES PAR DÉFAUT ────────────────────────────────────
-- 3 types issus de uptechformation.com

INSERT INTO type_formations (nom, code, description, tarif_horaire, methode_paiement) VALUES
  (
    'Formation Académique',
    'ACADEMIQUE',
    'Licences, Masters – formations diplômantes longues (3 à 5 ans)',
    5000.00,
    'horaire'
  ),
  (
    'Formation Certifiée',
    'CERTIFIE',
    'Certificats professionnels reconnus par les entreprises partenaires',
    7500.00,
    'horaire'
  ),
  (
    'Formation Accélérée',
    'ACCELERE',
    'Attestations – formation intensive de courte durée (3 à 6 mois)',
    10000.00,
    'forfait_seance'
  )
ON CONFLICT (code) DO NOTHING;

-- ── 3. LIAISON FILIÈRES → TYPE DE FORMATION ──────────────────
-- Chaque filière appartient à un type de formation

ALTER TABLE filieres
  ADD COLUMN IF NOT EXISTS type_formation_id uuid
    REFERENCES type_formations(id) ON DELETE SET NULL;

-- ── 4. VOLUME HORAIRE MATIÈRES (si absent) ───────────────────
-- Volume horaire total planifié par matière

ALTER TABLE matieres
  ADD COLUMN IF NOT EXISTS volume_horaire integer DEFAULT 30;

-- ── 5. VÉRIFICATION ──────────────────────────────────────────
SELECT
  table_name,
  'OK' AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('type_formations')
ORDER BY table_name;

-- Vérifier les colonnes ajoutées
SELECT
  column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'filieres'
  AND column_name = 'type_formation_id';
