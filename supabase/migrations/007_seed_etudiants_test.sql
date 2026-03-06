-- ============================================================
-- Migration 007 : 30 étudiants fictifs sénégalais pour tests
-- 10 IG (académique) · 10 IGD (certifiante) · 10 IB (accélérée)
-- ============================================================

DO $$
DECLARE
  annee_id UUID;
  f_ig     UUID; f_igd UUID; f_ib UUID;
  n_dap    UUID; n_dt1 UUID; n_dt2 UUID;
  n_dts1   UUID; n_dts2 UUID; n_lp UUID;
BEGIN

  SELECT id INTO annee_id FROM annees_academiques WHERE actif = TRUE LIMIT 1;
  SELECT id INTO f_ig  FROM filieres WHERE code = 'IG';
  SELECT id INTO f_igd FROM filieres WHERE code = 'IGD';
  SELECT id INTO f_ib  FROM filieres WHERE code = 'IB';

  SELECT id INTO n_dap  FROM niveaux WHERE filiere_id = f_ig AND nom = 'DAP';
  SELECT id INTO n_dt1  FROM niveaux WHERE filiere_id = f_ig AND nom = 'DT Année 1';
  SELECT id INTO n_dt2  FROM niveaux WHERE filiere_id = f_ig AND nom = 'DT Année 2';
  SELECT id INTO n_dts1 FROM niveaux WHERE filiere_id = f_ig AND nom = 'DTS Année 1';
  SELECT id INTO n_dts2 FROM niveaux WHERE filiere_id = f_ig AND nom = 'DTS Année 2';
  SELECT id INTO n_lp   FROM niveaux WHERE filiere_id = f_ig AND nom = 'Licence Pro';

  -- ── 10 étudiants IG / Académique ─────────────────────────────
  INSERT INTO etudiants (nom, prenom, date_naissance, lieu_naissance, sexe, nationalite, email, telephone, filiere_id, niveau_id, annee_academique_id, statut, niveau_entree) VALUES
    ('DIALLO',  'Mamadou',     '2005-03-12', 'Dakar',       'M', 'Sénégalaise', 'mamadou.diallo.ig@test.sn',   '+221 77 100 0001', f_ig, n_dap,  annee_id, 'inscrit',    'bfem'),
    ('NDIAYE',  'Fatou',       '2005-07-22', 'Thiès',       'F', 'Sénégalaise', 'fatou.ndiaye.ig@test.sn',     '+221 77 100 0002', f_ig, n_dap,  annee_id, 'inscrit',    'bfem'),
    ('FALL',    'Ibrahima',    '2004-11-05', 'Saint-Louis', 'M', 'Sénégalaise', 'ibrahima.fall.ig@test.sn',    '+221 77 100 0003', f_ig, n_dt1,  annee_id, 'inscrit',    'bfem'),
    ('SECK',    'Aminata',     '2004-01-18', 'Ziguinchor',  'F', 'Sénégalaise', 'aminata.seck.ig@test.sn',     '+221 77 100 0004', f_ig, n_dt1,  annee_id, 'inscrit',    'bfem'),
    ('GUEYE',   'Ousmane',     '2003-09-30', 'Kaolack',     'M', 'Sénégalaise', 'ousmane.gueye.ig@test.sn',    '+221 77 100 0005', f_ig, n_dt2,  annee_id, 'inscrit',    'bac'),
    ('BA',      'Mariama',     '2003-04-14', 'Dakar',       'F', 'Sénégalaise', 'mariama.ba.ig@test.sn',       '+221 77 100 0006', f_ig, n_dt2,  annee_id, 'inscrit',    'bac'),
    ('SARR',    'Cheikh',      '2002-12-08', 'Diourbel',    'M', 'Sénégalaise', 'cheikh.sarr.ig@test.sn',      '+221 77 100 0007', f_ig, n_dts1, annee_id, 'inscrit',    'bac'),
    ('MBAYE',   'Rokhaya',     '2002-06-25', 'Louga',       'F', 'Sénégalaise', 'rokhaya.mbaye.ig@test.sn',    '+221 77 100 0008', f_ig, n_dts2, annee_id, 'preinscrit', 'bac'),
    ('DIOP',    'Pape Moussa', '2001-08-19', 'Touba',       'M', 'Sénégalaise', 'papemoussa.diop.ig@test.sn',  '+221 77 100 0009', f_ig, n_dts2, annee_id, 'inscrit',    'bac'),
    ('CISSE',   'Adja',        '2001-02-03', 'Tambacounda', 'F', 'Sénégalaise', 'adja.cisse.ig@test.sn',       '+221 77 100 0010', f_ig, n_lp,   annee_id, 'inscrit',    'bac');

  -- ── 10 étudiants IGD / Certifiante ───────────────────────────
  INSERT INTO etudiants (nom, prenom, date_naissance, lieu_naissance, sexe, nationalite, email, telephone, filiere_id, niveau_id, annee_academique_id, statut) VALUES
    ('MBOUP',   'Serigne',     '1998-05-20', 'Dakar',       'M', 'Sénégalaise', 'serigne.mboup.igd@test.sn',   '+221 77 100 0011', f_igd, NULL, annee_id, 'inscrit'),
    ('TOURE',   'Ndéye',       '1999-10-11', 'Rufisque',    'F', 'Sénégalaise', 'ndeye.toure.igd@test.sn',     '+221 77 100 0012', f_igd, NULL, annee_id, 'inscrit'),
    ('KANE',    'Alioune',     '2000-03-07', 'Matam',       'M', 'Sénégalaise', 'alioune.kane.igd@test.sn',    '+221 77 100 0013', f_igd, NULL, annee_id, 'inscrit'),
    ('DIOUF',   'Khadija',     '1997-08-29', 'Dakar',       'F', 'Sénégalaise', 'khadija.diouf.igd@test.sn',   '+221 77 100 0014', f_igd, NULL, annee_id, 'inscrit'),
    ('WANE',    'Moustapha',   '2001-01-15', 'Podor',       'M', 'Sénégalaise', 'moustapha.wane.igd@test.sn',  '+221 77 100 0015', f_igd, NULL, annee_id, 'inscrit'),
    ('SAMB',    'Sokhna',      '1999-06-04', 'Dakar',       'F', 'Sénégalaise', 'sokhna.samb.igd@test.sn',     '+221 77 100 0016', f_igd, NULL, annee_id, 'preinscrit'),
    ('LY',      'Babacar',     '2000-11-22', 'Thiès',       'M', 'Sénégalaise', 'babacar.ly.igd@test.sn',      '+221 77 100 0017', f_igd, NULL, annee_id, 'inscrit'),
    ('FAYE',    'Astou',       '1998-09-16', 'Kolda',       'F', 'Sénégalaise', 'astou.faye.igd@test.sn',      '+221 77 100 0018', f_igd, NULL, annee_id, 'inscrit'),
    ('BADJI',   'Lamine',      '2001-04-30', 'Ziguinchor',  'M', 'Sénégalaise', 'lamine.badji.igd@test.sn',    '+221 77 100 0019', f_igd, NULL, annee_id, 'inscrit'),
    ('DIATTA',  'Marianne',    '1999-12-09', 'Sédhiou',     'F', 'Sénégalaise', 'marianne.diatta.igd@test.sn', '+221 77 100 0020', f_igd, NULL, annee_id, 'inscrit');

  -- ── 10 étudiants IB / Accélérée ──────────────────────────────
  INSERT INTO etudiants (nom, prenom, date_naissance, lieu_naissance, sexe, nationalite, email, telephone, filiere_id, niveau_id, annee_academique_id, statut) VALUES
    ('TRAORE',  'Ibou',        '1995-07-14', 'Dakar',       'M', 'Sénégalaise', 'ibou.traore.ib@test.sn',      '+221 77 100 0021', f_ib, NULL, annee_id, 'inscrit'),
    ('NIANG',   'Coumba',      '1993-03-28', 'Pikine',      'F', 'Sénégalaise', 'coumba.niang.ib@test.sn',     '+221 77 100 0022', f_ib, NULL, annee_id, 'inscrit'),
    ('DÈME',    'Abdou',       '1996-09-05', 'Dakar',       'M', 'Sénégalaise', 'abdou.deme.ib@test.sn',       '+221 77 100 0023', f_ib, NULL, annee_id, 'inscrit'),
    ('CAMARA',  'Awa',         '1994-12-17', 'Kaolack',     'F', 'Sénégalaise', 'awa.camara.ib@test.sn',       '+221 77 100 0024', f_ib, NULL, annee_id, 'inscrit'),
    ('KONATÉ',  'Seydou',      '1997-05-23', 'Guédiawaye',  'M', 'Sénégalaise', 'seydou.konate.ib@test.sn',    '+221 77 100 0025', f_ib, NULL, annee_id, 'inscrit'),
    ('BALDÉ',   'Fatoumata',   '1995-10-08', 'Ziguinchor',  'F', 'Sénégalaise', 'fatoumata.balde.ib@test.sn',  '+221 77 100 0026', f_ib, NULL, annee_id, 'preinscrit'),
    ('SOW',     'El Hadji',    '1992-02-19', 'Touba',       'M', 'Sénégalaise', 'elhadji.sow.ib@test.sn',      '+221 77 100 0027', f_ib, NULL, annee_id, 'inscrit'),
    ('NDIAYE',  'Binta',       '1996-07-31', 'Saint-Louis', 'F', 'Sénégalaise', 'binta.ndiaye.ib@test.sn',     '+221 77 100 0028', f_ib, NULL, annee_id, 'inscrit'),
    ('DIALLO',  'Mouhamed',    '1994-04-12', 'Thiès',       'M', 'Sénégalaise', 'mouhamed.diallo.ib@test.sn',  '+221 77 100 0029', f_ib, NULL, annee_id, 'inscrit'),
    ('THIAM',   'Yacine',      '1997-11-26', 'Dakar',       'F', 'Sénégalaise', 'yacine.thiam.ib@test.sn',     '+221 77 100 0030', f_ib, NULL, annee_id, 'inscrit');

END $$;

-- Vérification
SELECT f.code, f.type_formation, COUNT(*) AS nb
FROM etudiants e
JOIN filieres f ON f.id = e.filiere_id
GROUP BY f.code, f.type_formation
ORDER BY f.type_formation;
