-- Retirer niveau_id de classes — le niveau appartient à l'étudiant, pas à la classe
ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_filiere_id_niveau_id_annee_academique_id_date_rentre_key;
ALTER TABLE classes DROP COLUMN IF EXISTS niveau_id;

-- Nouvelle contrainte unique sans niveau_id
ALTER TABLE classes ADD CONSTRAINT classes_unique_cohorte
  UNIQUE(filiere_id, annee_academique_id, date_rentree);
