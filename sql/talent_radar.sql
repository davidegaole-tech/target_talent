-- =============================================================================
--  Talent Radar â€” schema MySQL/MariaDB per XAMPP (phpMyAdmin)
-- =============================================================================
--  Importazione: phpMyAdmin â†’ Importa â†’ questo file (utf8mb4).
--  Da riga di comando:
--     C:\xampp\mysql\bin\mysql.exe -u root < sql\talent_radar.sql
--
--  Contenuto:
--    1. database e tabelle (utenti, dati personali, prove, competenze,
--       voti, planner, appunti, documenti, schede AI, sessioni, log)
--    2. cataloghi (8 competenze chiave europee + 3 dimensioni)
--    3. account di default con dati giÃ  inseriti
--       admin / password   â†’ studentessa con passaporto completo
--       demo2 / password   â†’ account vuoto (prova isolamento dati)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `talent_radar`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `talent_radar`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET AUTOCOMMIT = 1;

DROP VIEW  IF EXISTS `v_competenze_utente`;
DROP VIEW  IF EXISTS `v_obiettivi_competenze`;
DROP VIEW  IF EXISTS `v_riepilogo_utenti`;
DROP TABLE IF EXISTS `activity_log`;
DROP TABLE IF EXISTS `competency_analyses`;
DROP TABLE IF EXISTS `notes`;
DROP TABLE IF EXISTS `documents`;
DROP TABLE IF EXISTS `ai_items`;
DROP TABLE IF EXISTS `planner_competences`;
DROP TABLE IF EXISTS `planner_items`;
DROP TABLE IF EXISTS `grades`;
DROP TABLE IF EXISTS `subjects`;
DROP TABLE IF EXISTS `evidence_dimensions`;
DROP TABLE IF EXISTS `evidence_competences`;
DROP TABLE IF EXISTS `attachments`;
DROP TABLE IF EXISTS `evidences`;
DROP TABLE IF EXISTS `user_state`;
DROP TABLE IF EXISTS `user_settings`;
DROP TABLE IF EXISTS `app_settings`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `personal_data`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `competences`;
DROP TABLE IF EXISTS `dimensions`;

-- -----------------------------------------------------------------------------
-- 1. CATALOGHI
-- -----------------------------------------------------------------------------

CREATE TABLE `dimensions` (
  `id`          VARCHAR(24)  NOT NULL,
  `name`        VARCHAR(60)  NOT NULL,
  `color`       CHAR(7)      NOT NULL,
  `description` VARCHAR(200) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `competences` (
  `id`           VARCHAR(32)  NOT NULL,
  `name`         VARCHAR(80)  NOT NULL,
  `short_name`   VARCHAR(40)  NOT NULL,
  `description`  VARCHAR(255) NOT NULL,
  `color`        CHAR(7)      NOT NULL,
  `dimension_id` VARCHAR(24)  NOT NULL,
  `sort_order`   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_competences_dimension` (`dimension_id`),
  CONSTRAINT `fk_competences_dimension`
    FOREIGN KEY (`dimension_id`) REFERENCES `dimensions` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. ACCOUNT E DATI PERSONALI
-- -----------------------------------------------------------------------------

CREATE TABLE `users` (
  `id`            VARCHAR(32)  NOT NULL,
  `username`      VARCHAR(40)  NOT NULL,
  `email`         VARCHAR(190) NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role`          ENUM('studente','lavoratore','studente-lavoratore') NOT NULL DEFAULT 'studente',
  `display_name`  VARCHAR(80)  NULL,
  `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `last_login_at` DATETIME(3)  NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `personal_data` (
  `user_id`        VARCHAR(32)  NOT NULL,
  `first_name`     VARCHAR(60)  NULL,
  `last_name`      VARCHAR(60)  NULL,
  `birth_date`     DATE         NULL,
  `city`           VARCHAR(80)  NULL,
  `phone`          VARCHAR(40)  NULL,
  `contact_email`  VARCHAR(190) NULL,
  `school`         VARCHAR(160) NULL,
  `class_name`     VARCHAR(20)  NULL,
  `school_year`    VARCHAR(20)  NULL,
  `bio`            TEXT         NULL,
  `languages`      VARCHAR(255) NULL,
  `digital_skills` VARCHAR(255) NULL,
  `interests`      VARCHAR(255) NULL,
  `sports`         VARCHAR(255) NULL,
  `avatar_path`    VARCHAR(255) NULL,
  `is_public`      TINYINT(1)   NOT NULL DEFAULT 1,
  `updated_at`     DATETIME(3)  NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_personal_data_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sessions` (
  `token`      VARCHAR(64)  NOT NULL,
  `user_id`    VARCHAR(32)  NOT NULL,
  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expires_at` DATETIME(3)  NOT NULL,
  `ip`         VARCHAR(45)  NULL,
  `user_agent` VARCHAR(255) NULL,
  PRIMARY KEY (`token`),
  KEY `idx_sessions_user` (`user_id`),
  KEY `idx_sessions_expiry` (`expires_at`),
  CONSTRAINT `fk_sessions_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- impostazioni globali dell'applicazione (es. modello AI attivo)
CREATE TABLE `app_settings` (
  `setting_key`   VARCHAR(64) NOT NULL,
  `setting_value` TEXT        NOT NULL,
  `updated_at`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- preferenze del singolo utente (tema, dimensione testo, ...)
CREATE TABLE `user_settings` (
  `user_id`       VARCHAR(32) NOT NULL,
  `setting_key`   VARCHAR(64) NOT NULL,
  `setting_value` TEXT        NOT NULL,
  `updated_at`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`, `setting_key`),
  CONSTRAINT `fk_user_settings_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. PASSAPORTO: PROVE, COMPETENZE, ALLEGATI
-- -----------------------------------------------------------------------------

CREATE TABLE `evidences` (
  `id`          VARCHAR(64)  NOT NULL,
  `user_id`     VARCHAR(32)  NOT NULL,
  `title`       VARCHAR(160) NOT NULL,
  `description` TEXT         NULL,
  `kind`        ENUM('foto','link','testo','voce') NOT NULL DEFAULT 'testo',
  `scope`       ENUM('scuola','extra','altro') NOT NULL DEFAULT 'scuola',
  `evidence_date` DATE       NULL,
  `confidence`  ENUM('alta','media','bassa') NULL,
  `why`         VARCHAR(255) NULL,
  `source`      ENUM('manuale','modello','algoritmo','esempio') NOT NULL DEFAULT 'manuale',
  `is_featured` TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`  DATETIME(3)  NULL,
  PRIMARY KEY (`id`),
  KEY `idx_evidences_user_date` (`user_id`, `evidence_date`),
  KEY `idx_evidences_scope` (`user_id`, `scope`),
  CONSTRAINT `fk_evidences_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `evidence_competences` (
  `evidence_id`   VARCHAR(64) NOT NULL,
  `competence_id` VARCHAR(32) NOT NULL,
  `score`         DECIMAL(4,3) NOT NULL DEFAULT 0.500,
  `is_primary`    TINYINT(1)  NOT NULL DEFAULT 0,
  PRIMARY KEY (`evidence_id`, `competence_id`),
  KEY `idx_evcomp_competence` (`competence_id`),
  CONSTRAINT `fk_evcomp_evidence`
    FOREIGN KEY (`evidence_id`) REFERENCES `evidences` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_evcomp_competence`
    FOREIGN KEY (`competence_id`) REFERENCES `competences` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `chk_evcomp_score` CHECK (`score` >= 0 AND `score` <= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `evidence_dimensions` (
  `evidence_id`  VARCHAR(64) NOT NULL,
  `dimension_id` VARCHAR(24) NOT NULL,
  PRIMARY KEY (`evidence_id`, `dimension_id`),
  CONSTRAINT `fk_evdim_evidence`
    FOREIGN KEY (`evidence_id`) REFERENCES `evidences` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_evdim_dimension`
    FOREIGN KEY (`dimension_id`) REFERENCES `dimensions` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `attachments` (
  `id`            VARCHAR(32)  NOT NULL,
  `user_id`       VARCHAR(32)  NULL,
  `evidence_id`   VARCHAR(64)  NULL,
  `kind`          ENUM('foto','voce','documento') NOT NULL DEFAULT 'foto',
  `filename`      VARCHAR(255) NOT NULL,
  `original_name` VARCHAR(255) NULL,
  `mime`          VARCHAR(120) NOT NULL,
  `size_bytes`    INT UNSIGNED NOT NULL,
  `created_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_attachments_user` (`user_id`),
  KEY `idx_attachments_evidence` (`evidence_id`),
  CONSTRAINT `fk_attachments_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_attachments_evidence`
    FOREIGN KEY (`evidence_id`) REFERENCES `evidences` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. VOTI
-- -----------------------------------------------------------------------------

CREATE TABLE `subjects` (
  `id`         VARCHAR(64) NOT NULL,
  `user_id`    VARCHAR(32) NOT NULL,
  `name`       VARCHAR(80) NOT NULL,
  `color`      CHAR(7)     NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_subjects_user` (`user_id`),
  CONSTRAINT `fk_subjects_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `grades` (
  `id`         VARCHAR(64)  NOT NULL,
  `subject_id` VARCHAR(64)  NOT NULL,
  `value`      DECIMAL(3,1) NOT NULL,
  `kind`       ENUM('scritto','orale','pratico') NULL,
  `grade_date` DATE         NULL,
  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_grades_subject_date` (`subject_id`, `grade_date`),
  CONSTRAINT `fk_grades_subject`
    FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `chk_grades_value` CHECK (`value` >= 1 AND `value` <= 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. PLANNER E ANALISI DELLE COMPETENZE
-- -----------------------------------------------------------------------------

CREATE TABLE `planner_items` (
  `id`              VARCHAR(64)  NOT NULL,
  `user_id`         VARCHAR(32)  NOT NULL,
  `item_type`       ENUM('attivita','obiettivo') NOT NULL DEFAULT 'attivita',
  `title`           VARCHAR(200) NOT NULL COMMENT 'il "cosa": testo analizzato per scegliere le competenze',
  `details`         TEXT         NULL,
  `due_date`        DATE         NULL,
  `is_done`         TINYINT(1)   NOT NULL DEFAULT 0,
  `done_at`         DATETIME(3)  NULL,
  `why`             VARCHAR(255) NULL COMMENT 'spiegazione dell''analisi',
  `analysis_engine` ENUM('modello','algoritmo','simulata','manuale') NULL,
  `confidence`      ENUM('alta','media','bassa') NULL,
  `created_at`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3)  NULL,
  PRIMARY KEY (`id`),
  KEY `idx_planner_user_date` (`user_id`, `due_date`),
  KEY `idx_planner_user_done` (`user_id`, `is_done`),
  CONSTRAINT `fk_planner_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `planner_competences` (
  `planner_item_id` VARCHAR(64) NOT NULL,
  `competence_id`   VARCHAR(32) NOT NULL,
  `score`           DECIMAL(4,3) NOT NULL DEFAULT 0.500,
  `is_primary`      TINYINT(1)  NOT NULL DEFAULT 0,
  PRIMARY KEY (`planner_item_id`, `competence_id`),
  KEY `idx_plancomp_competence` (`competence_id`),
  CONSTRAINT `fk_plancomp_item`
    FOREIGN KEY (`planner_item_id`) REFERENCES `planner_items` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_plancomp_competence`
    FOREIGN KEY (`competence_id`) REFERENCES `competences` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `chk_plancomp_score` CHECK (`score` >= 0 AND `score` <= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Storico delle analisi: ogni volta che "Sergio" collega un testo alle
-- competenze (modello locale oppure algoritmo) resta traccia dei punteggi.
CREATE TABLE `competency_analyses` (
  `id`               VARCHAR(32)  NOT NULL,
  `user_id`          VARCHAR(32)  NULL,
  `target_type`      ENUM('prova','obiettivo','documento','libera') NOT NULL DEFAULT 'libera',
  `target_id`        VARCHAR(64)  NULL,
  `input_text`       TEXT         NOT NULL,
  `engine`           ENUM('modello','algoritmo') NOT NULL DEFAULT 'algoritmo',
  `top_competence`   VARCHAR(32)  NULL,
  `confidence`       ENUM('alta','media','bassa') NULL,
  `scores`           JSON         NULL COMMENT 'punteggio per ogni competenza',
  `result`           JSON         NULL COMMENT 'risposta completa (comp, perche, segnali)',
  `created_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_analysis_user_date` (`user_id`, `created_at`),
  KEY `idx_analysis_target` (`target_type`, `target_id`),
  CONSTRAINT `fk_analysis_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_analysis_competence`
    FOREIGN KEY (`top_competence`) REFERENCES `competences` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. APPUNTI, DOCUMENTI, SCHEDE DI SERGIO
-- -----------------------------------------------------------------------------

CREATE TABLE `notes` (
  `id`         VARCHAR(64)  NOT NULL,
  `user_id`    VARCHAR(32)  NOT NULL,
  `title`      VARCHAR(200) NULL,
  `body`       MEDIUMTEXT   NULL,
  `folder`     VARCHAR(80)  NULL,
  `tags`       VARCHAR(255) NULL,
  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)  NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notes_user_updated` (`user_id`, `updated_at`),
  FULLTEXT KEY `ft_notes_body` (`title`, `body`),
  CONSTRAINT `fk_notes_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `documents` (
  `id`             VARCHAR(32)  NOT NULL,
  `user_id`        VARCHAR(32)  NULL,
  `title`          VARCHAR(200) NOT NULL,
  `kind`           ENUM('attestato','certificato','corso','esperienza','altro','appunti') NOT NULL DEFAULT 'altro',
  `doc_date`       DATE         NULL,
  `note`           TEXT         NULL,
  `filename`       VARCHAR(255) NULL,
  `original_name`  VARCHAR(255) NULL,
  `mime`           VARCHAR(120) NULL,
  `size_bytes`     INT UNSIGNED NULL,
  `extracted_text` MEDIUMTEXT   NULL,
  `analysis`       JSON         NULL,
  `created_at`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_documents_user_kind` (`user_id`, `kind`),
  KEY `idx_documents_date` (`doc_date`),
  CONSTRAINT `fk_documents_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ai_items` (
  `id`          VARCHAR(32)  NOT NULL,
  `user_id`     VARCHAR(32)  NULL,
  `item_type`   ENUM('summary','quiz','flashcards') NOT NULL,
  `title`       VARCHAR(120) NOT NULL,
  `content`     JSON         NOT NULL,
  `source_name` VARCHAR(255) NULL,
  `model`       VARCHAR(80)  NOT NULL,
  `best_score`  TINYINT UNSIGNED NULL,
  `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_items_user_date` (`user_id`, `created_at`),
  CONSTRAINT `fk_items_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. COMPATIBILITÃ€ E LOG
-- -----------------------------------------------------------------------------

-- Snapshot JSON dello stato dell'app: il frontend salva qui l'intero
-- passaporto e il backend riscrive le tabelle normalizzate a ogni salvataggio.
CREATE TABLE `user_state` (
  `user_id`    VARCHAR(32) NOT NULL,
  `data`       JSON        NOT NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_user_state_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `activity_log` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    VARCHAR(32)  NULL,
  `action`     VARCHAR(60)  NOT NULL,
  `details`    JSON         NULL,
  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_log_user_date` (`user_id`, `created_at`),
  CONSTRAINT `fk_log_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. VISTE UTILI (phpMyAdmin / report)
-- -----------------------------------------------------------------------------

CREATE VIEW `v_competenze_utente` AS
SELECT
  u.`id`            AS user_id,
  u.`username`,
  c.`id`            AS competence_id,
  c.`short_name`,
  COUNT(ec.`evidence_id`)                       AS prove,
  ROUND(AVG(ec.`score`), 2)                     AS punteggio_medio
FROM `users` u
CROSS JOIN `competences` c
LEFT JOIN `evidences` e        ON e.`user_id` = u.`id`
LEFT JOIN `evidence_competences` ec ON ec.`evidence_id` = e.`id` AND ec.`competence_id` = c.`id`
GROUP BY u.`id`, u.`username`, c.`id`, c.`short_name`, c.`sort_order`
ORDER BY u.`username`, c.`sort_order`;

CREATE VIEW `v_obiettivi_competenze` AS
SELECT
  p.`id`            AS planner_item_id,
  p.`user_id`,
  p.`item_type`,
  p.`title`         AS cosa,
  p.`due_date`,
  p.`is_done`,
  p.`analysis_engine`,
  p.`confidence`,
  pc.`competence_id`,
  c.`short_name`,
  pc.`score`,
  pc.`is_primary`
FROM `planner_items` p
LEFT JOIN `planner_competences` pc ON pc.`planner_item_id` = p.`id`
LEFT JOIN `competences` c          ON c.`id` = pc.`competence_id`
ORDER BY p.`due_date` IS NULL, p.`due_date`, p.`id`, pc.`score` DESC;

CREATE VIEW `v_riepilogo_utenti` AS
SELECT
  u.`id`            AS user_id,
  u.`username`,
  u.`role`,
  u.`display_name`,
  CONCAT_WS(' ', pd.`first_name`, pd.`last_name`) AS nome_completo,
  pd.`school`,
  pd.`class_name`,
  (SELECT COUNT(*) FROM `evidences` e WHERE e.`user_id` = u.`id`)     AS prove,
  (SELECT COUNT(*) FROM `planner_items` p WHERE p.`user_id` = u.`id`) AS voci_planner,
  (SELECT COUNT(*) FROM `documents` d WHERE d.`user_id` = u.`id`)     AS documenti,
  (SELECT COUNT(*) FROM `notes` n WHERE n.`user_id` = u.`id`)         AS appunti,
  u.`created_at`,
  u.`last_login_at`
FROM `users` u
LEFT JOIN `personal_data` pd ON pd.`user_id` = u.`id`;

-- -----------------------------------------------------------------------------
-- 9. DATI: CATALOGHI
-- -----------------------------------------------------------------------------

INSERT INTO `dimensions` (`id`, `name`, `color`, `description`) VALUES
  ('essere',   'Essere',   '#5b4b8a', 'Chi sei: valori, carattere, motivazioni'),
  ('fare',     'Fare',     '#0e6b6b', 'Cosa realizzi: progetti, attivitÃ , risultati'),
  ('lavorare', 'Lavorare', '#a61b3f', 'Come operi: metodo, team, leadership');

INSERT INTO `competences` (`id`, `name`, `short_name`, `description`, `color`, `dimension_id`, `sort_order`) VALUES
  ('alfabetica',      'Alfabetica funzionale',                  'Alfabetica',    'Alfabetica funzionale: leggere, scrivere, argomentare, comprendere testi',                    '#2f4b7c', 'fare',      1),
  ('multilingue',     'Multilinguistica',                       'Multilingue',   'Multilinguistica: usare lingue straniere in contesti reali',                                  '#2f6f9f', 'fare',      2),
  ('stem',            'Matematica, scienze e tecnologie',       'STEM',          'Matematica, scienze, tecnologie e ingegneria: logica, metodo scientifico, progettazione',    '#0e6b6b', 'fare',      3),
  ('digitale',        'Digitale',                               'Digitale',      'Digitale: creare contenuti e strumenti digitali, programmare, usare software con criterio',   '#5b4b8a', 'lavorare',  4),
  ('personale',       'Personale e sociale',                    'Personale',     'Personale, sociale e imparare a imparare: costanza, tempo, autoregolazione, relazioni',      '#a61b3f', 'essere',    5),
  ('cittadinanza',    'Cittadinanza',                           'Cittadinanza',  'Cittadinanza: impegno civico, volontariato, ambiente, responsabilitÃ  verso la comunitÃ ',     '#7a2e4a', 'essere',    6),
  ('imprenditoriale', 'Imprenditoriale',                        'Imprendit.',    'Imprenditoriale: iniziativa, organizzazione, guida di un gruppo, progetti e budget',          '#b0576e', 'lavorare',  7),
  ('cultura',         'Consapevolezza culturale',               'Cultura',       'Consapevolezza ed espressione culturali: arte, musica, teatro, fotografia, design, libri',    '#4f7a5a', 'essere',    8);

-- -----------------------------------------------------------------------------
-- 10. DATI: ACCOUNT DI DEFAULT
--     password per entrambi: password
-- -----------------------------------------------------------------------------

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `display_name`, `created_at`) VALUES
  ('u-admin-0000000000000000000001', 'admin', 'giulia.ferrari@example.com',
   'pbkdf2_sha256$210000$df7f7cab5b27733771fee26dddb82f37$1a78df8d7cb528ecfe89c673074bf86255bcfce7a4eac71d175a5b995a414a5a',
   'studente', 'Giulia Ferrari', '2026-09-01 08:30:00.000'),
  ('u-demo2-0000000000000000000002', 'demo2', 'demo2@example.com',
   'pbkdf2_sha256$210000$df7f7cab5b27733771fee26dddb82f37$1a78df8d7cb528ecfe89c673074bf86255bcfce7a4eac71d175a5b995a414a5a',
   'lavoratore', 'Account di prova', '2026-09-01 08:30:00.000');

INSERT INTO `personal_data`
  (`user_id`, `first_name`, `last_name`, `birth_date`, `city`, `phone`, `contact_email`,
   `school`, `class_name`, `school_year`, `bio`, `languages`, `digital_skills`, `interests`, `sports`, `is_public`, `updated_at`)
VALUES
  ('u-admin-0000000000000000000001', 'Giulia', 'Ferrari', '2009-03-14', 'Bologna', NULL, 'giulia.ferrari@example.com',
   'Liceo Scientifico opzione Scienze Applicate', '4B', '2026/27',
   'Studentessa di quarta, appassionata di robotica e fotografia. Documento quello che imparo per capire dove andare dopo il diploma.',
   'Italiano (madrelingua); Inglese (B2); Spagnolo (A2)', 'Arduino, Python di base, Photoshop, Audacity',
   'Robotica, fotografia, podcast', 'Pallavolo', 1, '2026-11-10 18:20:00.000'),
  ('u-demo2-0000000000000000000002', NULL, NULL, NULL, NULL, NULL, 'demo2@example.com',
   NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-09-01 08:30:00.000');

INSERT INTO `app_settings` (`setting_key`, `setting_value`) VALUES ('model', 'qwen3:8b');

-- -----------------------------------------------------------------------------
-- 11. DATI: PASSAPORTO DELL'ACCOUNT DEMO
-- -----------------------------------------------------------------------------

INSERT INTO `evidences`
  (`id`, `user_id`, `title`, `description`, `kind`, `scope`, `evidence_date`, `confidence`, `why`, `source`, `is_featured`, `created_at`)
VALUES
  ('e1', 'u-admin-0000000000000000000001', 'Robot per la gara regionale',
   'Con il gruppo di laboratorio ho montato e programmato un robot con Arduino. Io ho gestito i sensori e i test.',
   'foto', 'scuola', '2026-11-06', 'alta',
   'Progettazione tecnica, programmazione e lavoro di squadra su un obiettivo concreto.', 'esempio', 1, '2026-11-06 17:10:00.000'),
  ('e2', 'u-admin-0000000000000000000001', 'Volontaria alla biblioteca di quartiere',
   'Due pomeriggi al mese aiuto a catalogare i libri e a leggere ai bambini delle elementari.',
   'testo', 'extra', '2026-11-02', 'alta',
   'Impegno civico continuativo e responsabilitÃ  verso gli altri.', 'esempio', 0, '2026-11-02 16:00:00.000'),
  ('e3', 'u-admin-0000000000000000000001', 'Podcast in inglese con studenti spagnoli',
   'Episodio di 12 minuti registrato con una classe di Valencia sul tema del clima. Ho scritto la scaletta e montato l''audio.',
   'link', 'scuola', '2026-10-27', 'alta',
   'Uso reale di una lingua straniera e produzione audio digitale.', 'esempio', 0, '2026-10-27 15:30:00.000'),
  ('e4', 'u-admin-0000000000000000000001', 'Mercatino solidale di Natale',
   'Ho coordinato un gruppo di 6 persone: budget, contatti con i negozi, turni e comunicazione sui social.',
   'foto', 'extra', '2026-10-20', 'alta',
   'Iniziativa, gestione di un budget e coordinamento di un gruppo.', 'esempio', 1, '2026-10-20 18:00:00.000'),
  ('e5', 'u-admin-0000000000000000000001', 'Recensione di "La coscienza di Zeno"',
   'Recensione di 900 parole pubblicata sul giornalino scolastico.',
   'testo', 'scuola', '2026-10-14', 'media',
   'Produzione di un testo argomentativo destinato a un pubblico reale.', 'esempio', 0, '2026-10-14 11:00:00.000'),
  ('e6', 'u-admin-0000000000000000000001', 'Locandina per la mostra fotografica',
   'Ho progettato la locandina della mostra della classe usando Photoshop e i colori della scuola.',
   'foto', 'scuola', '2026-10-08', 'alta',
   'Alfabetizzazione visiva e uso consapevole di strumenti di design.', 'esempio', 0, '2026-10-08 09:45:00.000'),
  ('e7', 'u-admin-0000000000000000000001', 'Capitana della squadra di pallavolo',
   'Gestisco gli allenamenti quando l''allenatore Ã¨ assente e tengo i rapporti con le altre squadre.',
   'testo', 'extra', '2026-09-30', 'media',
   'Leadership, costanza e gestione delle relazioni.', 'esempio', 0, '2026-09-30 19:00:00.000');

INSERT INTO `evidence_competences` (`evidence_id`, `competence_id`, `score`, `is_primary`) VALUES
  ('e1', 'stem',            0.920, 1),
  ('e1', 'digitale',        0.720, 0),
  ('e2', 'cittadinanza',    0.900, 1),
  ('e2', 'personale',       0.680, 0),
  ('e3', 'multilingue',     0.900, 1),
  ('e3', 'digitale',        0.500, 0),
  ('e4', 'imprenditoriale', 0.880, 1),
  ('e4', 'personale',       0.620, 0),
  ('e5', 'alfabetica',      0.900, 1),
  ('e6', 'cultura',         0.900, 1),
  ('e6', 'digitale',        0.720, 0),
  ('e7', 'personale',       0.860, 1),
  ('e7', 'cittadinanza',    0.640, 0);

INSERT INTO `evidence_dimensions` (`evidence_id`, `dimension_id`) VALUES
  ('e1', 'fare'), ('e1', 'lavorare'),
  ('e2', 'essere'),
  ('e3', 'fare'), ('e3', 'lavorare'),
  ('e4', 'lavorare'), ('e4', 'essere'),
  ('e5', 'fare'),
  ('e6', 'essere'), ('e6', 'lavorare'),
  ('e7', 'essere');

INSERT INTO `subjects` (`id`, `user_id`, `name`, `color`, `created_at`) VALUES
  ('m1', 'u-admin-0000000000000000000001', 'Matematica', '#2f4b7c', '2026-09-15 08:00:00.000'),
  ('m2', 'u-admin-0000000000000000000001', 'Italiano',   '#a61b3f', '2026-09-15 08:00:00.000'),
  ('m3', 'u-admin-0000000000000000000001', 'Scienze',    '#0e6b6b', '2026-09-15 08:00:00.000');

INSERT INTO `grades` (`id`, `subject_id`, `value`, `kind`, `grade_date`) VALUES
  ('g1', 'm1', 8.0, 'scritto', '2026-10-02'),
  ('g2', 'm1', 7.5, 'orale',   '2026-10-15'),
  ('g3', 'm1', 9.0, 'scritto', '2026-11-05'),
  ('g4', 'm2', 7.0, 'orale',   '2026-10-10'),
  ('g5', 'm2', 8.0, 'scritto', '2026-11-02'),
  ('g6', 'm3', 6.5, 'pratico', '2026-10-20'),
  ('g7', 'm3', 7.5, 'scritto', '2026-11-08');

INSERT INTO `planner_items`
  (`id`, `user_id`, `item_type`, `title`, `details`, `due_date`, `is_done`, `why`, `analysis_engine`, `confidence`, `created_at`)
VALUES
  ('p1', 'u-admin-0000000000000000000001', 'attivita', 'Corso di primo soccorso con la Croce Rossa',
   'Tre incontri il sabato mattina', '2026-12-05', 0,
   'impegno verso gli altri e responsabilitÃ ', 'esempio', 'alta', '2026-11-01 10:00:00.000'),
  ('p2', 'u-admin-0000000000000000000001', 'obiettivo', 'Certificazione Cambridge C1',
   'Preparare reading e writing', '2027-05-30', 0,
   'uso di una lingua straniera a livello avanzato', 'esempio', 'alta', '2026-11-01 10:05:00.000');

INSERT INTO `planner_competences` (`planner_item_id`, `competence_id`, `score`, `is_primary`) VALUES
  ('p1', 'cittadinanza', 0.900, 1),
  ('p1', 'personale',    0.680, 0),
  ('p2', 'multilingue',  0.950, 1);

-- -----------------------------------------------------------------------------
-- 12. DATI: APPUNTI E ANALISI DI ESEMPIO
-- -----------------------------------------------------------------------------

INSERT INTO `notes` (`id`, `user_id`, `title`, `body`, `folder`, `tags`, `created_at`, `updated_at`) VALUES
  ('n1', 'u-admin-0000000000000000000001', 'Fotosintesi â€” appunti',
   'La fotosintesi clorofilliana trasforma energia luminosa in energia chimica. Fase luminosa nei tilacoidi, ciclo di Calvin nello stroma. Serve acqua, CO2 e luce.',
   'Scienze', 'fotosintesi,biologia,verifica', '2026-11-04 15:00:00.000', '2026-11-08 18:30:00.000'),
  ('n2', 'u-admin-0000000000000000000001', 'Reading per il C1',
   'Esercizi di reading: skimming per il senso generale, scanning per i dettagli. Attenzione ai distrattori nei true/false/not given.',
   'Inglese', 'cambridge,C1,reading', '2026-11-06 17:45:00.000', '2026-11-09 20:10:00.000');

INSERT INTO `competency_analyses`
  (`id`, `user_id`, `target_type`, `target_id`, `input_text`, `engine`, `top_competence`, `confidence`, `scores`, `result`, `created_at`)
VALUES
  ('a1', 'u-admin-0000000000000000000001', 'prova', 'e1',
   'Robot per la gara regionale â€” ho montato e programmato un robot con Arduino, gestito sensori e test',
   'algoritmo', 'stem', 'alta',
   JSON_OBJECT('stem', 0.92, 'digitale', 0.72),
   JSON_OBJECT('comp', JSON_ARRAY(JSON_OBJECT('id', 'stem', 'p', 0.92), JSON_OBJECT('id', 'digitale', 'p', 0.72)),
               'perche', 'progettazione tecnica, logica e uso di strumenti digitali',
               'segnali', JSON_ARRAY('robot', 'arduino', 'programmato', 'sensori')),
   '2026-11-06 17:12:00.000');

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 13. UTENTE APPLICATIVO
--     L'app si collega con queste credenziali (vedi .env).
--     Se le cambi, aggiorna anche TALENT_MYSQL_USER / TALENT_MYSQL_PASSWORD.
-- -----------------------------------------------------------------------------

CREATE USER IF NOT EXISTS 'talent'@'localhost' IDENTIFIED BY 'Tr9vLm2qZx7Wp4';
GRANT ALL PRIVILEGES ON `talent_radar`.* TO 'talent'@'localhost';
FLUSH PRIVILEGES;

-- Fine. Accesso all'app: admin / password   (oppure demo2 / password)
