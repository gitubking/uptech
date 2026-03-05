-- ============================================================
-- Migration 005 : Fix type_formation des filières UP'TECH
-- ============================================================
-- Ce script est NON DESTRUCTIF : il ne supprime pas les tarifs
-- ni les étudiants existants.
-- Il met à jour les filières existantes et insère les manquantes.
-- ============================================================

-- 1. S'assurer que les colonnes existent
ALTER TABLE filieres
  ADD COLUMN IF NOT EXISTS type_formation TEXT
    CHECK (type_formation IN ('academique', 'certifiante', 'acceleree')),
  ADD COLUMN IF NOT EXISTS nb_mensualites INTEGER DEFAULT 9;

-- 2. Supprimer les vieilles filières fictives (seed initial)
--    si elles sont encore là et qu'elles n'ont PAS de type_formation UP'TECH
DELETE FROM filieres
WHERE code IN ('INFO', 'GESTION', 'COMPTA', 'TELECOM')
  AND type_formation IS DISTINCT FROM 'academique';

-- 3. Insérer / mettre à jour les filières académiques
INSERT INTO filieres (nom, code, type_formation, nb_mensualites, duree_annees) VALUES
  ('Informatique de Gestion',                       'IG',   'academique', 9, 3),
  ('Maintenance Informatique, Réseaux et Systèmes', 'MARS', 'academique', 9, 2),
  ('Webmaster Développement Mobile',                'WDM',  'academique', 9, 2),
  ('Journalisme Multimédia',                        'JM',   'academique', 9, 2),
  ('Assistanat de Direction',                       'SAD',  'academique', 9, 2),
  ('Infographie Multimédia',                        'IM',   'academique', 9, 2),
  ('Master Audiovisuel et Médias Numériques',       'MAMN', 'academique', 9, 3)
ON CONFLICT (code) DO UPDATE SET
  type_formation  = EXCLUDED.type_formation,
  nb_mensualites  = EXCLUDED.nb_mensualites,
  nom             = EXCLUDED.nom;

-- 4. Insérer / mettre à jour les parcours certifiants
INSERT INTO filieres (nom, code, type_formation, nb_mensualites, duree_annees) VALUES
  ('Infographie / Graphic Design',                          'IGD',   'certifiante', 6, 1),
  ('Opérateur Vidéo / Technicien du Son',                   'OVTS',  'certifiante', 6, 1),
  ('Infographie / Sérigraphie',                             'ISERI', 'certifiante', 6, 1),
  ('Maintenance Informatique, Câblage et Réseaux',          'MICR',  'certifiante', 6, 1),
  ('Programmation et Développement Web',                    'PDW',   'certifiante', 6, 1),
  ('Architecture et Modélisation 3D',                       'AM3D',  'certifiante', 6, 1),
  ('Sécurité Électronique',                                 'SE',    'certifiante', 6, 1),
  ('Photographie Professionnelle',                          'PHOTO', 'certifiante', 6, 1),
  ('Certification Python Basics',                           'CPB',   'certifiante', 2, 1)
ON CONFLICT (code) DO UPDATE SET
  type_formation  = EXCLUDED.type_formation,
  nb_mensualites  = EXCLUDED.nb_mensualites,
  nom             = EXCLUDED.nom;

-- 5. Insérer / mettre à jour les programmes accélérés
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
  ('Infographie et Graphic Design',               'IGA',   'acceleree', 3, 1)
ON CONFLICT (code) DO UPDATE SET
  type_formation  = EXCLUDED.type_formation,
  nb_mensualites  = EXCLUDED.nb_mensualites,
  nom             = EXCLUDED.nom;

-- 6. Créer les niveaux pour les filières académiques qui n'en ont pas encore
DO $$
DECLARE
  f_id UUID;
BEGIN
  FOR f_id IN
    SELECT id FROM filieres
    WHERE type_formation = 'academique'
      AND id NOT IN (SELECT DISTINCT filiere_id FROM niveaux)
  LOOP
    INSERT INTO niveaux (filiere_id, nom, ordre) VALUES
      (f_id, 'DAP',          1),
      (f_id, 'DT Année 1',   2),
      (f_id, 'DT Année 2',   3),
      (f_id, 'DTS Année 1',  4),
      (f_id, 'DTS Année 2',  5),
      (f_id, 'Licence Pro',  6);
  END LOOP;
END $$;

-- 7. Vérification finale
SELECT type_formation, COUNT(*) AS nb_filieres
FROM filieres
GROUP BY type_formation
ORDER BY type_formation;
