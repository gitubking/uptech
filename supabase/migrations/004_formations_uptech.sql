-- ============================================================
-- UPTECH - Migration 004 : Formations réelles UP'TECH
-- ============================================================
-- ATTENTION : Cette migration supprime toutes les données
-- fictives (étudiants, matières, notes, niveaux, filières).
-- Exécuter uniquement si ces données peuvent être effacées.
-- ============================================================

-- 1. Ajouter les colonnes type_formation et nb_mensualites à filieres
ALTER TABLE filieres
  ADD COLUMN IF NOT EXISTS type_formation TEXT
    CHECK (type_formation IN ('academique', 'certifiante', 'acceleree'))
    DEFAULT 'academique',
  ADD COLUMN IF NOT EXISTS nb_mensualites INTEGER DEFAULT 9;

-- 2. Rendre niveau_id nullable sur etudiants et matieres
--    (les formations certifiantes/accélérées n'ont pas de niveaux)
ALTER TABLE etudiants ALTER COLUMN niveau_id DROP NOT NULL;
ALTER TABLE matieres  ALTER COLUMN niveau_id DROP NOT NULL;

-- 3. Supprimer les données fictives (CASCADE gère les FK)
TRUNCATE TABLE notes          CASCADE;
TRUNCATE TABLE emargements    CASCADE;
TRUNCATE TABLE emplois_du_temps CASCADE;
TRUNCATE TABLE matieres       CASCADE;
TRUNCATE TABLE etudiants      CASCADE;
TRUNCATE TABLE niveaux        CASCADE;
TRUNCATE TABLE filieres       CASCADE;

-- 4. Insérer les filières académiques
INSERT INTO filieres (nom, code, type_formation, nb_mensualites, duree_annees) VALUES
  ('Informatique de Gestion',                      'IG',   'academique', 9, 3),
  ('Maintenance Informatique, Réseaux et Systèmes','MARS', 'academique', 9, 2),
  ('Webmaster Développement Mobile',               'WDM',  'academique', 9, 2),
  ('Journalisme Multimédia',                       'JM',   'academique', 9, 2),
  ('Assistanat de Direction',                      'SAD',  'academique', 9, 2),
  ('Infographie Multimédia',                       'IM',   'academique', 9, 2),
  ('Master Audiovisuel et Médias Numériques',      'MAMN', 'academique', 9, 3);

-- 5. Insérer les 6 niveaux pour chaque filière académique
DO $$
DECLARE
  f_id UUID;
BEGIN
  FOR f_id IN SELECT id FROM filieres WHERE type_formation = 'academique' LOOP
    INSERT INTO niveaux (filiere_id, nom, ordre) VALUES
      (f_id, 'DAP',          1),
      (f_id, 'DT Année 1',   2),
      (f_id, 'DT Année 2',   3),
      (f_id, 'DTS Année 1',  4),
      (f_id, 'DTS Année 2',  5),
      (f_id, 'Licence Pro',  6);
  END LOOP;
END $$;

-- 6. Insérer les parcours certifiants
INSERT INTO filieres (nom, code, type_formation, nb_mensualites, duree_annees) VALUES
  ('Infographie / Graphic Design',                          'IGD',   'certifiante', 6, 1),
  ('Opérateur Vidéo / Technicien du Son',                   'OVTS',  'certifiante', 6, 1),
  ('Infographie / Sérigraphie',                             'ISERI', 'certifiante', 6, 1),
  ('Maintenance Informatique, Câblage et Réseaux',          'MICR',  'certifiante', 6, 1),
  ('Programmation et Développement Web',                    'PDW',   'certifiante', 6, 1),
  ('Architecture et Modélisation 3D',                       'AM3D',  'certifiante', 6, 1),
  ('Sécurité Électronique',                                 'SE',    'certifiante', 6, 1),
  ('Photographie Professionnelle',                          'PHOTO', 'certifiante', 6, 1),
  ('Certification Python Basics',                           'CPB',   'certifiante', 2, 1);

-- 7. Insérer les programmes accélérés
INSERT INTO filieres (nom, code, type_formation, nb_mensualites, duree_annees) VALUES
  ('IA Générative et Création Visuelle',          'IAGCV', 'acceleree', 3, 1),
  ('Création de Site et Développement',           'CSD',   'acceleree', 3, 1),
  ('Informatique et Bureautique',                 'IB',    'acceleree', 3, 1),
  ('Comptabilité / Sage Saari',                   'CSS',   'acceleree', 3, 1),
  ('Maintenance et Administration des Réseaux',   'MARA',  'acceleree', 3, 1),
  ('Photographie et Retouche d''Images',          'PRI',   'acceleree', 3, 1),
  ('Vidéo Montage et Effets Spéciaux',            'VMES',  'acceleree', 3, 1),
  ('Modélisation et Animation 3D',                'MA3D',  'acceleree', 3, 1),
  ('Sécurité Électronique Accélérée',             'SEA',   'acceleree', 3, 1),
  ('Sérigraphie Maquettiste',                     'SM',    'acceleree', 3, 1),
  ('Infographie et Graphic Design',               'IGA',   'acceleree', 3, 1);
