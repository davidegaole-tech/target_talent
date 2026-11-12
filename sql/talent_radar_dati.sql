/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.16-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: talent_radar
-- ------------------------------------------------------
-- Server version	10.11.16-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `talent_radar`
--

/*!40000 DROP DATABASE IF EXISTS `talent_radar`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `talent_radar` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `talent_radar`;

--
-- Table structure for table `activity_log`
--

DROP TABLE IF EXISTS `activity_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_log` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` varchar(32) DEFAULT NULL,
  `action` varchar(60) NOT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_log_user_date` (`user_id`,`created_at`),
  CONSTRAINT `fk_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_log`
--

LOCK TABLES `activity_log` WRITE;
/*!40000 ALTER TABLE `activity_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ai_items`
--

DROP TABLE IF EXISTS `ai_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_items` (
  `id` varchar(32) NOT NULL,
  `user_id` varchar(32) DEFAULT NULL,
  `item_type` enum('summary','quiz','flashcards') NOT NULL,
  `title` varchar(120) NOT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`content`)),
  `source_name` varchar(255) DEFAULT NULL,
  `model` varchar(80) NOT NULL,
  `best_score` tinyint(3) unsigned DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_items_user_date` (`user_id`,`created_at`),
  CONSTRAINT `fk_items_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_items`
--

LOCK TABLES `ai_items` WRITE;
/*!40000 ALTER TABLE `ai_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_settings`
--

DROP TABLE IF EXISTS `app_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_settings` (
  `setting_key` varchar(64) NOT NULL,
  `setting_value` text NOT NULL,
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_settings`
--

LOCK TABLES `app_settings` WRITE;
/*!40000 ALTER TABLE `app_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `app_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attachments`
--

DROP TABLE IF EXISTS `attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `attachments` (
  `id` varchar(32) NOT NULL,
  `user_id` varchar(32) DEFAULT NULL,
  `evidence_id` varchar(64) DEFAULT NULL,
  `kind` enum('foto','voce','documento') NOT NULL DEFAULT 'foto',
  `filename` varchar(255) NOT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `mime` varchar(120) NOT NULL,
  `size_bytes` int(10) unsigned NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_attachments_user` (`user_id`),
  KEY `idx_attachments_evidence` (`evidence_id`),
  CONSTRAINT `fk_attachments_evidence` FOREIGN KEY (`evidence_id`) REFERENCES `evidences` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_attachments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attachments`
--

LOCK TABLES `attachments` WRITE;
/*!40000 ALTER TABLE `attachments` DISABLE KEYS */;
INSERT INTO `attachments` VALUES
('28f875c16fa3423e8f99d01ab101162c','u-admin-0000000000000000000001',NULL,'foto','Ritratto di panda rosso adorabile.png','Ritratto di panda rosso adorabile.png','image/png',2431081,'2026-11-12 14:00:23.949'),
('38f2e92d6cd04625835fe3348c6184bd','u-admin-0000000000000000000001',NULL,'foto','Panda laureata con fiocco rosa.png','Panda laureata con fiocco rosa.png','image/png',2131052,'2026-11-12 13:55:58.112'),
('56df72f6c4eb4c8b813d1c0b5b90ab61','u-admin-0000000000000000000001',NULL,'foto','Gemini_Generated_Image_6ndvlz6ndvlz6ndv-removebg-preview-Photoroom.png','Gemini_Generated_Image_6ndvlz6ndvlz6ndv-removebg-preview-Photoroom.png','image/png',302056,'2026-11-12 13:53:32.718'),
('a64d0f03dc1545f99e072d11baf9bd2d','139f4a889dd54b24955281522a0ef16b',NULL,'foto','Gemini_Generated_Image_6ndvlz6ndvlz6ndv-removebg-preview-Photoroom.png','Gemini_Generated_Image_6ndvlz6ndvlz6ndv-removebg-preview-Photoroom.png','image/png',302056,'2026-11-12 12:18:02.088'),
('ca1d3b3070a3462ea5dcdbf1d9781ac0','u-admin-0000000000000000000001',NULL,'foto','foto.png','foto.png','image/png',731,'2026-11-12 12:58:04.834'),
('cf59a8ad01f940bc9494d9cfc0d45a25','06744e1c24b14d99aa6cf197a931e4df',NULL,'foto','Gemini_Generated_Image_6ndvlz6ndvlz6ndv-removebg-preview.png','Gemini_Generated_Image_6ndvlz6ndvlz6ndv-removebg-preview.png','image/png',366964,'2026-11-12 14:14:13.468'),
('e38f8f67a92d4dccb9bf50eed822740b','097fb600da344b0c8fdc1f094fbba02d',NULL,'foto','images.jpeg','images.jpeg','image/jpeg',20664,'2026-11-12 13:08:07.771');
/*!40000 ALTER TABLE `attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `competences`
--

DROP TABLE IF EXISTS `competences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `competences` (
  `id` varchar(32) NOT NULL,
  `name` varchar(80) NOT NULL,
  `short_name` varchar(40) NOT NULL,
  `description` varchar(255) NOT NULL,
  `color` char(7) NOT NULL,
  `dimension_id` varchar(24) NOT NULL,
  `sort_order` tinyint(3) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_competences_dimension` (`dimension_id`),
  CONSTRAINT `fk_competences_dimension` FOREIGN KEY (`dimension_id`) REFERENCES `dimensions` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `competences`
--

LOCK TABLES `competences` WRITE;
/*!40000 ALTER TABLE `competences` DISABLE KEYS */;
INSERT INTO `competences` VALUES
('alfabetica','Alfabetica funzionale','Alfabetica','Alfabetica funzionale: leggere, scrivere, argomentare, comprendere testi','#2f4b7c','fare',1),
('cittadinanza','Cittadinanza','Cittadinanza','Cittadinanza: impegno civico, volontariato, ambiente, responsabilit?? verso la comunit??','#7a2e4a','essere',6),
('cultura','Consapevolezza culturale','Cultura','Consapevolezza ed espressione culturali: arte, musica, teatro, fotografia, design, libri','#4f7a5a','essere',8),
('digitale','Digitale','Digitale','Digitale: creare contenuti e strumenti digitali, programmare, usare software con criterio','#5b4b8a','lavorare',4),
('imprenditoriale','Imprenditoriale','Imprendit.','Imprenditoriale: iniziativa, organizzazione, guida di un gruppo, progetti e budget','#b0576e','lavorare',7),
('multilingue','Multilinguistica','Multilingue','Multilinguistica: usare lingue straniere in contesti reali','#2f6f9f','fare',2),
('personale','Personale e sociale','Personale','Personale, sociale e imparare a imparare: costanza, tempo, autoregolazione, relazioni','#a61b3f','essere',5),
('stem','Matematica, scienze e tecnologie','STEM','Matematica, scienze, tecnologie e ingegneria: logica, metodo scientifico, progettazione','#0e6b6b','fare',3);
/*!40000 ALTER TABLE `competences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `competency_analyses`
--

DROP TABLE IF EXISTS `competency_analyses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `competency_analyses` (
  `id` varchar(32) NOT NULL,
  `user_id` varchar(32) DEFAULT NULL,
  `target_type` enum('prova','obiettivo','documento','libera') NOT NULL DEFAULT 'libera',
  `target_id` varchar(64) DEFAULT NULL,
  `input_text` text NOT NULL,
  `engine` enum('modello','algoritmo') NOT NULL DEFAULT 'algoritmo',
  `top_competence` varchar(32) DEFAULT NULL,
  `confidence` enum('alta','media','bassa') DEFAULT NULL,
  `scores` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'punteggio per ogni competenza' CHECK (json_valid(`scores`)),
  `result` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'risposta completa (comp, perche, segnali)' CHECK (json_valid(`result`)),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_analysis_user_date` (`user_id`,`created_at`),
  KEY `idx_analysis_target` (`target_type`,`target_id`),
  KEY `fk_analysis_competence` (`top_competence`),
  CONSTRAINT `fk_analysis_competence` FOREIGN KEY (`top_competence`) REFERENCES `competences` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_analysis_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `competency_analyses`
--

LOCK TABLES `competency_analyses` WRITE;
/*!40000 ALTER TABLE `competency_analyses` DISABLE KEYS */;
INSERT INTO `competency_analyses` VALUES
('40b13d1448ed4618a19a0b819f2f6cdc','u-admin-0000000000000000000001','obiettivo',NULL,'Corso di teatro\nrecitazione','algoritmo','cultura','alta','{\"cultura\": 0.98}','{\"comp\": [{\"id\": \"cultura\", \"p\": 0.98}], \"dims\": [\"essere\"], \"perche\": \"espressione creativa e consapevolezza culturale. Segnali: recitazione, teatro\", \"segnali\": [\"recitazione\", \"teatro\"], \"conf\": \"alta\", \"engine\": \"algoritmo\", \"punteggi\": {\"cultura\": 0.98}, \"kind\": \"piano\"}','2026-11-12 11:52:04.024'),
('a1','u-admin-0000000000000000000001','prova','e1','Robot per la gara regionale ??? ho montato e programmato un robot con Arduino, gestito sensori e test','algoritmo','stem','alta','{\"stem\": 0.92, \"digitale\": 0.72}','{\"comp\": [{\"id\": \"stem\", \"p\": 0.92}, {\"id\": \"digitale\", \"p\": 0.72}], \"perche\": \"progettazione tecnica, logica e uso di strumenti digitali\", \"segnali\": [\"robot\", \"arduino\", \"programmato\", \"sensori\"]}','2026-11-06 17:12:00.000'),
('bd959480cfd644ae80c736edd1c7c9ad','06744e1c24b14d99aa6cf197a931e4df','prova',NULL,'Hackaton\nporco di','algoritmo','imprenditoriale','media','{\"imprenditoriale\": 0.72}','{\"comp\": [{\"id\": \"imprenditoriale\", \"p\": 0.72}], \"dims\": [\"lavorare\"], \"perche\": \"iniziativa, organizzazione e guida di un gruppo. Segnali: hackaton\", \"segnali\": [\"hackaton\"], \"conf\": \"media\", \"engine\": \"algoritmo\", \"punteggi\": {\"imprenditoriale\": 0.72}, \"kind\": \"foto\"}','2026-11-12 14:14:09.286');
/*!40000 ALTER TABLE `competency_analyses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dimensions`
--

DROP TABLE IF EXISTS `dimensions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `dimensions` (
  `id` varchar(24) NOT NULL,
  `name` varchar(60) NOT NULL,
  `color` char(7) NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dimensions`
--

LOCK TABLES `dimensions` WRITE;
/*!40000 ALTER TABLE `dimensions` DISABLE KEYS */;
INSERT INTO `dimensions` VALUES
('essere','Essere','#5b4b8a','Chi sei: valori, carattere, motivazioni'),
('fare','Fare','#0e6b6b','Cosa realizzi: progetti, attivit??, risultati'),
('lavorare','Lavorare','#a61b3f','Come operi: metodo, team, leadership');
/*!40000 ALTER TABLE `dimensions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` varchar(32) NOT NULL,
  `user_id` varchar(32) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `kind` enum('attestato','certificato','corso','esperienza','altro','appunti') NOT NULL DEFAULT 'altro',
  `doc_date` date DEFAULT NULL,
  `note` text DEFAULT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `mime` varchar(120) DEFAULT NULL,
  `size_bytes` int(10) unsigned DEFAULT NULL,
  `extracted_text` mediumtext DEFAULT NULL,
  `analysis` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`analysis`)),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_documents_user_kind` (`user_id`,`kind`),
  KEY `idx_documents_date` (`doc_date`),
  CONSTRAINT `fk_documents_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES
('290bc61405ab4927b66c550cec4c49c9','139f4a889dd54b24955281522a0ef16b','perito sborrato','esperienza',NULL,'l\'Arianna me lo ha messo in culo','Careless_Employee.jpg','Careless_Employee.jpg','image/jpeg',903029,NULL,NULL,'2026-11-12 12:18:56.737'),
('3f0828440f224727ad94d327b8a09b20','06744e1c24b14d99aa6cf197a931e4df','inglese','certificato',NULL,NULL,'the_signal.txt','the_signal.txt','text/plain',2303,'----- .---- ----- ----- .---- .---- .---- ----- ----- .---- .---- .---- .---- ----- .---- ----- ----- ----- .---- .---- ----- ----- ----- ----- ----- .---- .---- .---- .---- ----- ----- .---- ----- .---- ----- ----- .---- .---- .---- .---- ----- .---- ----- ----- ----- .---- ----- .---- ----- .---- .---- .---- .---- ----- ----- ----- ----- .---- ----- .---- ----- ----- .---- .---- ----- .---- ----- .---- ----- .---- ----- ----- ----- ----- .---- .---- ----- ----- ----- .---- ----- .---- ----- .---- ----- ----- ----- .---- ----- ----- .---- .---- ----- ----- ----- ----- ----- .---- ----- ----- .---- .---- .---- ----- ----- .---- .---- .---- .---- ----- .---- ----- ----- ----- .---- .---- ----- .---- ----- .---- ----- .---- .---- ----- .---- ----- .---- ----- ----- .---- ----- .---- ----- ----- .---- ----- ----- .---- ----- ----- ----- .---- ----- ----- ----- .---- .---- .---- .---- ----- ----- ----- ----- .---- .---- ----- .---- ----- .---- .---- ----- .---- ----- ----- .---- .---- ----- .---- ----- .---- ----- ----- ----- .---- ----- ----- ----- ----- .---- .---- ----- .---- ----- .---- ----- .---- .---- ----- ----- .---- .---- ----- ----- .---- ----- .---- ----- ----- ----- .---- ----- ----- .---- .---- ----- ----- .---- ----- ----- .---- ----- ----- .---- ----- ----- .---- ----- .---- .---- .---- ----- .---- .---- .---- ----- .---- ----- .---- .---- ----- .---- ----- ----- .---- .---- ----- .---- ----- .---- ----- ----- .---- .---- ----- .---- .---- ----- ----- ----- .---- .---- ----- .---- ----- .---- ----- ----- .---- ----- .---- ----- ----- ----- ----- ----- .---- .---- .---- .---- ----- .---- ----- ----- .---- ----- ----- ----- ----- ----- .---- ----- ----- .---- .---- .---- ----- ----- .---- ----- .---- ----- .---- .---- ----- ----- .---- ----- .---- .---- ----- .---- ----- .---- .---- ----- .---- ----- .---- ----- .---- .---- ----- ----- .---- ----- ----- ----- .---- .---- ----- ----- .---- ----- .---- .---- ----- ----- .---- ----- .---- .---- ----- .---- ----- .---- .---- ----- .---- ----- ----- .---- .---- .---- ----- ----- .---- .---- ----- .---- ----- .---- .---- ----- .---- ----- .---- ----- .---- ----- ----- ----- .---- .---- ----- ----- .---- .---- .---- ----- ----- .---- .---- .---- .---- ----- .---- ----- ----- .---- .---- .---- .---- ----- .----',NULL,'2026-11-12 14:14:28.674'),
('6ee5c3f199244a4face02a3afe89aada','139f4a889dd54b24955281522a0ef16b','prima guerra mondiale','appunti',NULL,NULL,'prima guerra mondiale.txt','prima guerra mondiale.txt','text/plain',3888,'World War I,[b] or the First World War (28 July 1914 – 11 November 1918), also known as the Great War, was a global conflict between two coalitions: the Allies (or Entente) and the Central Powers. One of the deadliest conflicts in history, World War I caused 15 to 22 million deaths, including those resulting from war crimes and genocides. The war also contributed to the spread of the Spanish flu pandemic. The conflict saw important developments in weaponry, including machine guns, artillery, aircraft, chemical weapons, and tanks.\n\nThe causes of World War I included the rise of the German Empire, which disturbed the long-standing balance of power in Europe, and the exacerbation of imperial rivalries, as reflected in new alliances and an arms race between the great powers. Tensions in the Balkans reached a breaking point on 28 June 1914 when Gavrilo Princip, a Bosnian Serb, assassinated Franz Ferdinand, the heir to the Austro-Hungarian throne. Austria-Hungary blamed Serbia and declared war on 28 July, upon which the Russian Empire mobilised in Serbia\'s defence. In early August, Germany declared war on Russia and France; the United Kingdom entered the war after Germany invaded Belgium. Germany\'s strategy in 1914 was to quickly defeat France, but its advance was halted in September, and the Western Front solidified into a near-continuous line of fortified trenches. The Eastern Front was more dynamic, but neither side gained a decisive advantage, despite costly offensives. The Ottoman Empire joined the Central Powers in November, which was followed by a failed Allied campaign at Gallipoli. Japan and Italy also joined the Allies.\n\nMajor battles, including those at Verdun, the Somme, and Passchendaele, failed to break the stalemate on the Western Front. In April 1917, the United States joined the Allies after Germany resumed unrestricted submarine warfare against Atlantic shipping. Later that year, the Bolsheviks seized power in Russia in the October Revolution; Soviet Russia signed an armistice with the Central Powers in December, followed by a separate peace in March 1918. That month, Germany launched a spring offensive in the west, which despite initial successes left the German Army exhausted and demoralised. The Allied Hundred Days Offensive, beginning in August 1918, caused a collapse of the German front line. By early November, the Allies had signed armistices with the Ottomans and with Austria-Hungary, leaving Germany isolated. Facing a revolution at home, Kaiser Wilhelm II abdicated on 9 November, and the war ended with the Armistice of 11 November 1918.\n\nThe Paris Peace Conference of 1919–1920 imposed settlements on the defeated powers. Under the Treaty of Versailles, Germany lost significant territories, was disarmed, and was required to pay large war reparations to the Allies. The collapse of the Russian, German, Austro-Hungarian, and Ottoman empires resulted in new national boundaries and the creation of new independent states including Poland, Finland, the Baltic states, Czechoslovakia, and Yugoslavia. The League of Nations was established to maintain world peace, but its failure to manage the instability during the interwar period contributed to the outbreak of World War II in 1939.\n\nNames\nBefore World War II, the events of 1914–1918 were commonly referred to as the Great War or simply the World War.[1] In August 1914, The Independent stated of the conflict, \"This is the Great War. It names itself.\"[2] In the decade after its end, many hoped it would be \"the war to end all wars,\" because of its unprecedented destructiveness and death toll.[3] The earliest known use of the term First World War appeared in the Indianapolis Star on 20 September 1914, when German biologist and philosopher Ernst Haeckel wrote that the ongoing \"European War\" would become \"the first world war in the full sense of the word.\"[4]',NULL,'2026-11-12 12:20:31.713');
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evidence_competences`
--

DROP TABLE IF EXISTS `evidence_competences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `evidence_competences` (
  `evidence_id` varchar(64) NOT NULL,
  `competence_id` varchar(32) NOT NULL,
  `score` decimal(4,3) NOT NULL DEFAULT 0.500,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`evidence_id`,`competence_id`),
  KEY `idx_evcomp_competence` (`competence_id`),
  CONSTRAINT `fk_evcomp_competence` FOREIGN KEY (`competence_id`) REFERENCES `competences` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_evcomp_evidence` FOREIGN KEY (`evidence_id`) REFERENCES `evidences` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_evcomp_score` CHECK (`score` >= 0 and `score` <= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evidence_competences`
--

LOCK TABLES `evidence_competences` WRITE;
/*!40000 ALTER TABLE `evidence_competences` DISABLE KEYS */;
INSERT INTO `evidence_competences` VALUES
('06744e1c24b14d99aa6cf197a931e4df:e1794489253486','imprenditoriale',0.900,1),
('u-admin-0000000000000000000001:e1','digitale',0.600,0),
('u-admin-0000000000000000000001:e1','stem',0.900,1),
('u-admin-0000000000000000000001:e2','cittadinanza',0.900,1),
('u-admin-0000000000000000000001:e2','personale',0.600,0),
('u-admin-0000000000000000000001:e3','digitale',0.600,0),
('u-admin-0000000000000000000001:e3','multilingue',0.900,1),
('u-admin-0000000000000000000001:e4','imprenditoriale',0.900,1),
('u-admin-0000000000000000000001:e4','personale',0.600,0),
('u-admin-0000000000000000000001:e5','alfabetica',0.900,1),
('u-admin-0000000000000000000001:e6','cultura',0.900,1),
('u-admin-0000000000000000000001:e6','digitale',0.600,0),
('u-admin-0000000000000000000001:e7','cittadinanza',0.600,0),
('u-admin-0000000000000000000001:e7','personale',0.900,1);
/*!40000 ALTER TABLE `evidence_competences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evidence_dimensions`
--

DROP TABLE IF EXISTS `evidence_dimensions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `evidence_dimensions` (
  `evidence_id` varchar(64) NOT NULL,
  `dimension_id` varchar(24) NOT NULL,
  PRIMARY KEY (`evidence_id`,`dimension_id`),
  KEY `fk_evdim_dimension` (`dimension_id`),
  CONSTRAINT `fk_evdim_dimension` FOREIGN KEY (`dimension_id`) REFERENCES `dimensions` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_evdim_evidence` FOREIGN KEY (`evidence_id`) REFERENCES `evidences` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evidence_dimensions`
--

LOCK TABLES `evidence_dimensions` WRITE;
/*!40000 ALTER TABLE `evidence_dimensions` DISABLE KEYS */;
INSERT INTO `evidence_dimensions` VALUES
('06744e1c24b14d99aa6cf197a931e4df:e1794489253486','lavorare'),
('u-admin-0000000000000000000001:e1','fare'),
('u-admin-0000000000000000000001:e1','lavorare'),
('u-admin-0000000000000000000001:e2','essere'),
('u-admin-0000000000000000000001:e3','fare'),
('u-admin-0000000000000000000001:e3','lavorare'),
('u-admin-0000000000000000000001:e4','essere'),
('u-admin-0000000000000000000001:e4','lavorare'),
('u-admin-0000000000000000000001:e5','fare'),
('u-admin-0000000000000000000001:e6','essere'),
('u-admin-0000000000000000000001:e6','lavorare'),
('u-admin-0000000000000000000001:e7','essere');
/*!40000 ALTER TABLE `evidence_dimensions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evidences`
--

DROP TABLE IF EXISTS `evidences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `evidences` (
  `id` varchar(64) NOT NULL,
  `user_id` varchar(32) NOT NULL,
  `title` varchar(160) NOT NULL,
  `description` text DEFAULT NULL,
  `kind` enum('foto','link','testo','voce') NOT NULL DEFAULT 'testo',
  `scope` enum('scuola','extra','altro') NOT NULL DEFAULT 'scuola',
  `evidence_date` date DEFAULT NULL,
  `confidence` enum('alta','media','bassa') DEFAULT NULL,
  `why` varchar(255) DEFAULT NULL,
  `source` enum('manuale','modello','algoritmo','esempio') NOT NULL DEFAULT 'manuale',
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_evidences_user_date` (`user_id`,`evidence_date`),
  KEY `idx_evidences_scope` (`user_id`,`scope`),
  CONSTRAINT `fk_evidences_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evidences`
--

LOCK TABLES `evidences` WRITE;
/*!40000 ALTER TABLE `evidences` DISABLE KEYS */;
INSERT INTO `evidences` VALUES
('06744e1c24b14d99aa6cf197a931e4df:e1794489253486','06744e1c24b14d99aa6cf197a931e4df','Hackaton','porco di','foto','scuola','2026-11-10','media','iniziativa, organizzazione e guida di un gruppo. Segnali: hackaton','manuale',0,'2026-11-12 14:16:59.120',NULL),
('u-admin-0000000000000000000001:e1','u-admin-0000000000000000000001','Robot per la gara regionale','Con il gruppo di laboratorio ho montato e programmato un robot con Arduino. Io ho gestito i sensori e i test.','foto','scuola','2026-11-06','alta','Progettazione tecnica, programmazione e lavoro di squadra su un obiettivo concreto.','manuale',1,'2026-11-12 14:10:56.124',NULL),
('u-admin-0000000000000000000001:e2','u-admin-0000000000000000000001','Volontaria alla biblioteca di quartiere','Due pomeriggi al mese aiuto a catalogare i libri e a leggere ai bambini delle elementari.','testo','extra','2026-11-02','alta','Impegno civico continuativo e responsabilit?? verso gli altri.','manuale',0,'2026-11-12 14:10:56.125',NULL),
('u-admin-0000000000000000000001:e3','u-admin-0000000000000000000001','Podcast in inglese con studenti spagnoli','Episodio di 12 minuti registrato con una classe di Valencia sul tema del clima. Ho scritto la scaletta e montato l\'audio.','link','scuola','2026-10-27','alta','Uso reale di una lingua straniera e produzione audio digitale.','manuale',0,'2026-11-12 14:10:56.130',NULL),
('u-admin-0000000000000000000001:e4','u-admin-0000000000000000000001','Mercatino solidale di Natale','Ho coordinato un gruppo di 6 persone: budget, contatti con i negozi, turni e comunicazione sui social.','foto','extra','2026-10-20','alta','Iniziativa, gestione di un budget e coordinamento di un gruppo.','manuale',1,'2026-11-12 14:10:56.131',NULL),
('u-admin-0000000000000000000001:e5','u-admin-0000000000000000000001','Recensione di \"La coscienza di Zeno\"','Recensione di 900 parole pubblicata sul giornalino scolastico.','testo','scuola','2026-10-14','media','Produzione di un testo argomentativo destinato a un pubblico reale.','manuale',0,'2026-11-12 14:10:56.132',NULL),
('u-admin-0000000000000000000001:e6','u-admin-0000000000000000000001','Locandina per la mostra fotografica','Ho progettato la locandina della mostra della classe usando Photoshop e i colori della scuola.','foto','scuola','2026-10-08','alta','Alfabetizzazione visiva e uso consapevole di strumenti di design.','manuale',0,'2026-11-12 14:10:56.133',NULL),
('u-admin-0000000000000000000001:e7','u-admin-0000000000000000000001','Capitana della squadra di pallavolo','Gestisco gli allenamenti quando l\'allenatore ?? assente e tengo i rapporti con le altre squadre.','testo','extra','2026-09-30','media','Leadership, costanza e gestione delle relazioni.','manuale',0,'2026-11-12 14:10:56.135',NULL);
/*!40000 ALTER TABLE `evidences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grades`
--

DROP TABLE IF EXISTS `grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `grades` (
  `id` varchar(64) NOT NULL,
  `subject_id` varchar(64) NOT NULL,
  `value` decimal(3,1) NOT NULL,
  `kind` enum('scritto','orale','pratico') DEFAULT NULL,
  `grade_date` date DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_grades_subject_date` (`subject_id`,`grade_date`),
  CONSTRAINT `fk_grades_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_grades_value` CHECK (`value` >= 1 and `value` <= 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grades`
--

LOCK TABLES `grades` WRITE;
/*!40000 ALTER TABLE `grades` DISABLE KEYS */;
INSERT INTO `grades` VALUES
('06744e1c24b14d99aa6cf197a931e4df:m1794489287642:0','06744e1c24b14d99aa6cf197a931e4df:m1794489287642',6.0,'scritto','2026-11-10','2026-11-12 14:16:59.121'),
('06744e1c24b14d99aa6cf197a931e4df:m1794489287642:1','06744e1c24b14d99aa6cf197a931e4df:m1794489287642',5.0,'scritto','2026-11-10','2026-11-12 14:16:59.122'),
('06744e1c24b14d99aa6cf197a931e4df:m1794489287642:2','06744e1c24b14d99aa6cf197a931e4df:m1794489287642',7.0,'scritto','2026-11-10','2026-11-12 14:16:59.122'),
('u-admin-0000000000000000000001:m1:0','u-admin-0000000000000000000001:m1',8.0,'scritto','2026-10-02','2026-11-12 14:10:56.137'),
('u-admin-0000000000000000000001:m1:1','u-admin-0000000000000000000001:m1',7.5,'orale','2026-10-15','2026-11-12 14:10:56.137'),
('u-admin-0000000000000000000001:m1:2','u-admin-0000000000000000000001:m1',9.0,'scritto','2026-11-05','2026-11-12 14:10:56.137'),
('u-admin-0000000000000000000001:m2:0','u-admin-0000000000000000000001:m2',7.0,'orale','2026-10-10','2026-11-12 14:10:56.138'),
('u-admin-0000000000000000000001:m2:1','u-admin-0000000000000000000001:m2',8.0,'scritto','2026-11-02','2026-11-12 14:10:56.138'),
('u-admin-0000000000000000000001:m3:0','u-admin-0000000000000000000001:m3',6.5,'pratico','2026-10-20','2026-11-12 14:10:56.138'),
('u-admin-0000000000000000000001:m3:1','u-admin-0000000000000000000001:m3',7.5,'scritto','2026-11-08','2026-11-12 14:10:56.138');
/*!40000 ALTER TABLE `grades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notes`
--

DROP TABLE IF EXISTS `notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notes` (
  `id` varchar(64) NOT NULL,
  `user_id` varchar(32) NOT NULL,
  `title` varchar(200) DEFAULT NULL,
  `body` mediumtext DEFAULT NULL,
  `folder` varchar(80) DEFAULT NULL,
  `tags` varchar(255) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notes_user_updated` (`user_id`,`updated_at`),
  FULLTEXT KEY `ft_notes_body` (`title`,`body`),
  CONSTRAINT `fk_notes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notes`
--

LOCK TABLES `notes` WRITE;
/*!40000 ALTER TABLE `notes` DISABLE KEYS */;
INSERT INTO `notes` VALUES
('n1','u-admin-0000000000000000000001','Fotosintesi ??? appunti','La fotosintesi clorofilliana trasforma energia luminosa in energia chimica. Fase luminosa nei tilacoidi, ciclo di Calvin nello stroma. Serve acqua, CO2 e luce.','Scienze','fotosintesi,biologia,verifica','2026-11-04 15:00:00.000','2026-11-08 18:30:00.000'),
('n2','u-admin-0000000000000000000001','Reading per il C1','Esercizi di reading: skimming per il senso generale, scanning per i dettagli. Attenzione ai distrattori nei true/false/not given.','Inglese','cambridge,C1,reading','2026-11-06 17:45:00.000','2026-11-09 20:10:00.000');
/*!40000 ALTER TABLE `notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_data`
--

DROP TABLE IF EXISTS `personal_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_data` (
  `user_id` varchar(32) NOT NULL,
  `first_name` varchar(60) DEFAULT NULL,
  `last_name` varchar(60) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `city` varchar(80) DEFAULT NULL,
  `phone` varchar(40) DEFAULT NULL,
  `contact_email` varchar(190) DEFAULT NULL,
  `school` varchar(160) DEFAULT NULL,
  `class_name` varchar(20) DEFAULT NULL,
  `school_year` varchar(20) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `languages` varchar(255) DEFAULT NULL,
  `digital_skills` varchar(255) DEFAULT NULL,
  `interests` varchar(255) DEFAULT NULL,
  `sports` varchar(255) DEFAULT NULL,
  `avatar_path` varchar(255) DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_personal_data_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_data`
--

LOCK TABLES `personal_data` WRITE;
/*!40000 ALTER TABLE `personal_data` DISABLE KEYS */;
INSERT INTO `personal_data` VALUES
('06744e1c24b14d99aa6cf197a931e4df','davide','gaole','2026-11-11','Verona','','','ITS Digital Academy','Kali','','','','','','',NULL,1,'2026-11-12 14:16:59.117'),
('097fb600da344b0c8fdc1f094fbba02d','','',NULL,'','','christian.ceola@allievi.itsdigitalacademy.com','','','','','','','','',NULL,1,'2026-11-12 13:33:36.737'),
('139f4a889dd54b24955281522a0ef16b','Nadir','Martini','2006-04-16','Velo d\'Astico','','nadir.martini@allievi.itsdigitalacademy.com','ITS Digital Academy \"Mario Volpato\"','Kali','','sono gay','Italiano (A1)\nInglese (C4)','Valorant','boku no pico','danza',NULL,1,'2026-11-12 12:24:45.830'),
('23e49e15ee914c83bb09640d91c6a6cd','aaa','aaa',NULL,'aaa','','','aaa','aaa','','','','','','',NULL,1,'2026-11-12 13:53:02.505'),
('b2911274faa84aeeac2e591de3433880','','',NULL,'','','','','','','','','','','',NULL,1,'2026-11-12 12:11:40.250'),
('fe16fedaee274f8f92b27dd7d82c8f91','','',NULL,'','','','','','','','','','','',NULL,1,'2026-11-12 11:53:27.756'),
('u-admin-0000000000000000000001','Aura','Jackson','2009-03-14','Bologna','','giulia.ferrari@example.com','Liceo Scientifico opzione Scienze Applicate','4B','2026/27','Studentessa di quarta, appassionata di robotica e fotografia. Documento quello che imparo per capire dove andare dopo il diploma.','Italiano (madrelingua); Inglese (B2); Spagnolo (A2)','Arduino, Python di base, Photoshop, Audacity','Robotica, fotografia, podcast','Pallavolo',NULL,1,'2026-11-12 14:10:56.122'),
('u-demo2-0000000000000000000002',NULL,NULL,NULL,NULL,NULL,'demo2@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-09-01 08:30:00.000');
/*!40000 ALTER TABLE `personal_data` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `planner_competences`
--

DROP TABLE IF EXISTS `planner_competences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `planner_competences` (
  `planner_item_id` varchar(64) NOT NULL,
  `competence_id` varchar(32) NOT NULL,
  `score` decimal(4,3) NOT NULL DEFAULT 0.500,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`planner_item_id`,`competence_id`),
  KEY `idx_plancomp_competence` (`competence_id`),
  CONSTRAINT `fk_plancomp_competence` FOREIGN KEY (`competence_id`) REFERENCES `competences` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_plancomp_item` FOREIGN KEY (`planner_item_id`) REFERENCES `planner_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_plancomp_score` CHECK (`score` >= 0 and `score` <= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `planner_competences`
--

LOCK TABLES `planner_competences` WRITE;
/*!40000 ALTER TABLE `planner_competences` DISABLE KEYS */;
INSERT INTO `planner_competences` VALUES
('u-admin-0000000000000000000001:p-api-1','digitale',0.900,1),
('u-admin-0000000000000000000001:p1','cittadinanza',0.900,1),
('u-admin-0000000000000000000001:p1','personale',0.600,0),
('u-admin-0000000000000000000001:p1794480691145','cultura',0.900,1),
('u-admin-0000000000000000000001:p2','multilingue',0.900,1);
/*!40000 ALTER TABLE `planner_competences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `planner_items`
--

DROP TABLE IF EXISTS `planner_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `planner_items` (
  `id` varchar(64) NOT NULL,
  `user_id` varchar(32) NOT NULL,
  `item_type` enum('attivita','obiettivo') NOT NULL DEFAULT 'attivita',
  `title` varchar(200) NOT NULL COMMENT 'il "cosa": testo analizzato per scegliere le competenze',
  `details` text DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `is_done` tinyint(1) NOT NULL DEFAULT 0,
  `done_at` datetime(3) DEFAULT NULL,
  `why` varchar(255) DEFAULT NULL COMMENT 'spiegazione dell''analisi',
  `analysis_engine` enum('modello','algoritmo','simulata','manuale') DEFAULT NULL,
  `confidence` enum('alta','media','bassa') DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_planner_user_date` (`user_id`,`due_date`),
  KEY `idx_planner_user_done` (`user_id`,`is_done`),
  CONSTRAINT `fk_planner_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `planner_items`
--

LOCK TABLES `planner_items` WRITE;
/*!40000 ALTER TABLE `planner_items` DISABLE KEYS */;
INSERT INTO `planner_items` VALUES
('u-admin-0000000000000000000001:p-api-1','u-admin-0000000000000000000001','obiettivo','Sito web per la biblioteca','HTML e CSS','2027-01-15',0,NULL,'creazione di contenuti digitali','algoritmo','alta','2026-11-12 14:10:56.140',NULL),
('u-admin-0000000000000000000001:p1','u-admin-0000000000000000000001','attivita','Corso di primo soccorso con la Croce Rossa','Tre incontri il sabato mattina','2026-12-05',0,NULL,'impegno verso gli altri e responsabilit??',NULL,'alta','2026-11-12 14:10:56.139',NULL),
('u-admin-0000000000000000000001:p1794480691145','u-admin-0000000000000000000001','attivita','Corso di teatro con la compagnia della scuola','Recitazione e spettacolo finale',NULL,0,NULL,'espressione creativa e consapevolezza culturale. Segnali: recitazione, spettacolo, teatro','algoritmo','alta','2026-11-12 14:10:56.140',NULL),
('u-admin-0000000000000000000001:p2','u-admin-0000000000000000000001','obiettivo','Certificazione Cambridge C1','Preparare reading e writing','2027-05-30',0,NULL,'uso di una lingua straniera a livello avanzato',NULL,'alta','2026-11-12 14:10:56.140',NULL);
/*!40000 ALTER TABLE `planner_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `subjects` (
  `id` varchar(64) NOT NULL,
  `user_id` varchar(32) NOT NULL,
  `name` varchar(80) NOT NULL,
  `color` char(7) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_subjects_user` (`user_id`),
  CONSTRAINT `fk_subjects_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subjects`
--

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;
INSERT INTO `subjects` VALUES
('06744e1c24b14d99aa6cf197a931e4df:m1794489287642','06744e1c24b14d99aa6cf197a931e4df','Cyber','#2f4b7c','2026-11-12 14:16:59.121'),
('u-admin-0000000000000000000001:m1','u-admin-0000000000000000000001','Matematica','#2f4b7c','2026-11-12 14:10:56.136'),
('u-admin-0000000000000000000001:m2','u-admin-0000000000000000000001','Italiano','#a61b3f','2026-11-12 14:10:56.137'),
('u-admin-0000000000000000000001:m3','u-admin-0000000000000000000001','Scienze','#0e6b6b','2026-11-12 14:10:56.138');
/*!40000 ALTER TABLE `subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_settings`
--

DROP TABLE IF EXISTS `user_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_settings` (
  `user_id` varchar(32) NOT NULL,
  `setting_key` varchar(64) NOT NULL,
  `setting_value` text NOT NULL,
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`user_id`,`setting_key`),
  CONSTRAINT `fk_user_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_settings`
--

LOCK TABLES `user_settings` WRITE;
/*!40000 ALTER TABLE `user_settings` DISABLE KEYS */;
INSERT INTO `user_settings` VALUES
('06744e1c24b14d99aa6cf197a931e4df','role_selected','studente-lavoratore','2026-11-12 14:12:44.365'),
('06744e1c24b14d99aa6cf197a931e4df','text_size','normale','2026-11-12 14:12:44.365'),
('06744e1c24b14d99aa6cf197a931e4df','theme','light','2026-11-12 14:12:44.364'),
('097fb600da344b0c8fdc1f094fbba02d','role_selected','studente','2026-11-12 13:07:49.856'),
('097fb600da344b0c8fdc1f094fbba02d','text_size','normale','2026-11-12 13:07:49.854'),
('097fb600da344b0c8fdc1f094fbba02d','theme','light','2026-11-12 13:07:49.852'),
('139f4a889dd54b24955281522a0ef16b','role_selected','studente','2026-11-12 12:24:45.842'),
('139f4a889dd54b24955281522a0ef16b','text_size','normale','2026-11-12 12:24:42.611'),
('139f4a889dd54b24955281522a0ef16b','theme','light','2026-11-12 12:22:52.416'),
('23e49e15ee914c83bb09640d91c6a6cd','role_selected','studente','2026-11-12 13:34:22.312'),
('23e49e15ee914c83bb09640d91c6a6cd','text_size','normale','2026-11-12 13:34:22.311'),
('23e49e15ee914c83bb09640d91c6a6cd','theme','light','2026-11-12 13:34:22.310'),
('b2911274faa84aeeac2e591de3433880','role_selected','studente','2026-11-12 12:04:34.876'),
('b2911274faa84aeeac2e591de3433880','text_size','normale','2026-11-12 12:04:34.876'),
('b2911274faa84aeeac2e591de3433880','theme','light','2026-11-12 12:04:34.875'),
('fe16fedaee274f8f92b27dd7d82c8f91','role_selected','studente','2026-11-12 11:53:27.769'),
('fe16fedaee274f8f92b27dd7d82c8f91','text_size','normale','2026-11-12 11:53:27.768'),
('fe16fedaee274f8f92b27dd7d82c8f91','theme','light','2026-11-12 11:53:27.765'),
('u-admin-0000000000000000000001','role_selected','studente','2026-11-12 13:37:59.715'),
('u-admin-0000000000000000000001','text_size','normale','2026-11-12 11:54:02.331'),
('u-admin-0000000000000000000001','theme','light','2026-11-12 12:49:43.001');
/*!40000 ALTER TABLE `user_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_state`
--

DROP TABLE IF EXISTS `user_state`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_state` (
  `user_id` varchar(32) NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`data`)),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_user_state_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_state`
--

LOCK TABLES `user_state` WRITE;
/*!40000 ALTER TABLE `user_state` DISABLE KEYS */;
INSERT INTO `user_state` VALUES
('06744e1c24b14d99aa6cf197a931e4df','{\"evidences\": [{\"id\": \"e1794489253486\", \"ambito\": \"scuola\", \"titolo\": \"Hackaton\", \"descrizione\": \"porco di\", \"tipo\": \"foto\", \"data\": \"2026-11-10\", \"comp\": [\"imprenditoriale\"], \"dims\": [\"lavorare\"], \"conf\": \"media\", \"perche\": \"iniziativa, organizzazione e guida di un gruppo. Segnali: hackaton\", \"corretta\": false, \"nuovo\": true, \"attachment\": {\"id\": \"cf59a8ad01f940bc9494d9cfc0d45a25\", \"evidence_id\": null, \"kind\": \"foto\", \"filename\": \"Gemini_Generated_Image_6ndvlz6ndvlz6ndv-removebg-preview.png\", \"original_name\": \"Gemini_Generated_Image_6ndvlz6ndvlz6ndv-removebg-preview.png\", \"mime\": \"image/png\", \"created_at\": 1794489253468, \"size\": 366964, \"url\": \"/api/attachments/cf59a8ad01f940bc9494d9cfc0d45a25/file\"}}], \"diarioFilter\": null, \"privacy\": {\"tutor\": true, \"orientatore\": false, \"ai\": true, \"export\": true}, \"dailyTip\": \"Oggi prova a documentare un\'esperienza sportiva o un hobby: diventa una prova nel tuo passaporto.\", \"theme\": \"light\", \"streak\": 5, \"textSize\": \"normale\", \"materie\": [{\"id\": \"m1794489287642\", \"nome\": \"Cyber\", \"color\": \"#2f4b7c\", \"voti\": [{\"v\": 6, \"tipo\": \"scritto\", \"data\": \"2026-11-10\"}, {\"v\": 5, \"tipo\": \"scritto\", \"data\": \"2026-11-10\"}, {\"v\": 7, \"tipo\": \"scritto\", \"data\": \"2026-11-10\"}]}], \"profilo\": {\"nome\": \"davide\", \"cognome\": \"gaole\", \"nascita\": \"2026-11-11\", \"citta\": \"Verona\", \"email\": \"\", \"telefono\": \"\", \"scuola\": \"ITS Digital Academy\", \"classe\": \"Kali\", \"anno\": \"\", \"presentazione\": \"\", \"lingue\": \"\", \"digitali\": \"\", \"interessi\": \"\", \"sport\": \"\", \"foto\": \"\"}, \"ruolo\": \"studente-lavoratore\", \"planner\": [], \"docEvidenza\": [], \"recapPeriodo\": \"mese\", \"isSample\": false, \"sampleBanner\": false, \"portfolioAt\": null, \"portfolioSel\": [], \"tourDone\": true, \"shareWithTutor\": false, \"espFiltro\": \"esperienze\"}','2026-11-12 14:16:59.117'),
('097fb600da344b0c8fdc1f094fbba02d','{\"evidences\": [], \"diarioFilter\": null, \"privacy\": {\"tutor\": true, \"orientatore\": false, \"ai\": false, \"export\": true}, \"dailyTip\": \"Oggi prova a documentare un\'esperienza sportiva o un hobby: diventa una prova nel tuo passaporto.\", \"theme\": \"light\", \"streak\": 5, \"textSize\": \"normale\", \"materie\": [], \"profilo\": {\"nome\": \"\", \"cognome\": \"\", \"nascita\": \"\", \"citta\": \"\", \"email\": \"christian.ceola@allievi.itsdigitalacademy.com\", \"telefono\": \"\", \"scuola\": \"\", \"classe\": \"\", \"anno\": \"\", \"presentazione\": \"\", \"lingue\": \"\", \"digitali\": \"\", \"interessi\": \"\", \"sport\": \"\", \"foto\": \"\"}, \"ruolo\": \"studente\", \"planner\": [], \"docEvidenza\": [], \"recapPeriodo\": \"mese\", \"isSample\": false, \"sampleBanner\": false, \"portfolioAt\": null, \"portfolioSel\": [], \"shareWithTutor\": false, \"espFiltro\": null}','2026-11-12 13:33:36.736'),
('139f4a889dd54b24955281522a0ef16b','{\"prove\": {\"alfabetica\": 0, \"multilingue\": 0, \"stem\": 0, \"digitale\": 0, \"personale\": 0, \"cittadinanza\": 0, \"imprenditoriale\": 0, \"cultura\": 0}, \"evidences\": [], \"diarioFilter\": null, \"privacy\": {\"tutor\": true, \"orientatore\": false, \"ai\": false, \"export\": true}, \"dailyTip\": \"Oggi prova a documentare un\'esperienza sportiva o un hobby: diventa una prova nel tuo passaporto.\", \"theme\": \"light\", \"streak\": 5, \"textSize\": \"normale\", \"materie\": [], \"profilo\": {\"nome\": \"Nadir\", \"cognome\": \"Martini\", \"nascita\": \"2006-04-16\", \"citta\": \"Velo d\'Astico\", \"email\": \"nadir.martini@allievi.itsdigitalacademy.com\", \"telefono\": \"\", \"scuola\": \"ITS Digital Academy \\\"Mario Volpato\\\"\", \"classe\": \"Kali\", \"anno\": \"\", \"presentazione\": \"sono gay\", \"lingue\": \"Italiano (A1)\\nInglese (C4)\", \"digitali\": \"Valorant\", \"interessi\": \"boku no pico\", \"sport\": \"danza\"}, \"ruolo\": \"studente\", \"planner\": [], \"docEvidenza\": [], \"recapPeriodo\": \"mese\", \"isSample\": false, \"sampleBanner\": false, \"portfolioAt\": null, \"shareWithTutor\": false, \"espFiltro\": null}','2026-11-12 12:24:45.829'),
('23e49e15ee914c83bb09640d91c6a6cd','{\"evidences\": [], \"diarioFilter\": null, \"privacy\": {\"tutor\": true, \"orientatore\": false, \"ai\": false, \"export\": true}, \"dailyTip\": \"Oggi prova a documentare un\'esperienza sportiva o un hobby: diventa una prova nel tuo passaporto.\", \"theme\": \"light\", \"streak\": 5, \"textSize\": \"normale\", \"materie\": [], \"profilo\": {\"nome\": \"aaa\", \"cognome\": \"aaa\", \"nascita\": \"\", \"citta\": \"aaa\", \"email\": \"\", \"telefono\": \"\", \"scuola\": \"aaa\", \"classe\": \"aaa\", \"anno\": \"\", \"presentazione\": \"\", \"lingue\": \"\", \"digitali\": \"\", \"interessi\": \"\", \"sport\": \"\", \"foto\": \"\"}, \"ruolo\": \"studente\", \"planner\": [], \"docEvidenza\": [], \"recapPeriodo\": \"mese\", \"isSample\": false, \"sampleBanner\": false, \"portfolioAt\": null, \"portfolioSel\": [], \"tourDone\": true, \"shareWithTutor\": false, \"espFiltro\": null}','2026-11-12 13:53:02.504'),
('b2911274faa84aeeac2e591de3433880','{\"prove\": {\"alfabetica\": 0, \"multilingue\": 0, \"stem\": 0, \"digitale\": 0, \"personale\": 0, \"cittadinanza\": 0, \"imprenditoriale\": 0, \"cultura\": 0}, \"evidences\": [], \"diarioFilter\": null, \"privacy\": {\"tutor\": true, \"orientatore\": false, \"ai\": false, \"export\": true}, \"dailyTip\": \"Oggi prova a documentare un\'esperienza sportiva o un hobby: diventa una prova nel tuo passaporto.\", \"theme\": \"light\", \"streak\": 5, \"textSize\": \"normale\", \"materie\": [], \"profilo\": {\"nome\": \"\", \"cognome\": \"\", \"nascita\": \"\", \"citta\": \"\", \"email\": \"\", \"telefono\": \"\", \"scuola\": \"\", \"classe\": \"\", \"anno\": \"\", \"presentazione\": \"\", \"lingue\": \"\", \"digitali\": \"\", \"interessi\": \"\", \"sport\": \"\"}, \"ruolo\": \"studente\", \"planner\": [], \"docEvidenza\": [], \"recapPeriodo\": \"mese\", \"isSample\": false, \"sampleBanner\": false, \"portfolioAt\": null, \"shareWithTutor\": false, \"espFiltro\": null}','2026-11-12 12:11:40.250'),
('fe16fedaee274f8f92b27dd7d82c8f91','{\"prove\": {\"alfabetica\": 0, \"multilingue\": 0, \"stem\": 0, \"digitale\": 0, \"personale\": 0, \"cittadinanza\": 0, \"imprenditoriale\": 0, \"cultura\": 0}, \"evidences\": [], \"diarioFilter\": null, \"privacy\": {\"tutor\": true, \"orientatore\": false, \"ai\": false, \"export\": true}, \"dailyTip\": \"Oggi prova a documentare un\'esperienza sportiva o un hobby: diventa una prova nel tuo passaporto.\", \"theme\": \"light\", \"streak\": 5, \"textSize\": \"normale\", \"materie\": [], \"profilo\": {\"nome\": \"\", \"cognome\": \"\", \"nascita\": \"\", \"citta\": \"\", \"email\": \"\", \"telefono\": \"\", \"scuola\": \"\", \"classe\": \"\", \"anno\": \"\", \"presentazione\": \"\", \"lingue\": \"\", \"digitali\": \"\", \"interessi\": \"\", \"sport\": \"\"}, \"ruolo\": \"studente\", \"planner\": [], \"docEvidenza\": [], \"recapPeriodo\": \"mese\", \"isSample\": false, \"sampleBanner\": false, \"portfolioAt\": null, \"shareWithTutor\": false, \"espFiltro\": null}','2026-11-12 11:53:27.755'),
('u-admin-0000000000000000000001','{\"evidences\": [{\"id\": \"e1\", \"ambito\": \"scuola\", \"evidenza\": true, \"titolo\": \"Robot per la gara regionale\", \"tipo\": \"foto\", \"data\": \"2026-11-06\", \"descrizione\": \"Con il gruppo di laboratorio ho montato e programmato un robot con Arduino. Io ho gestito i sensori e i test.\", \"comp\": [\"stem\", \"digitale\"], \"dims\": [\"fare\", \"lavorare\"], \"conf\": \"alta\", \"perche\": \"Progettazione tecnica, programmazione e lavoro di squadra su un obiettivo concreto.\"}, {\"id\": \"e2\", \"ambito\": \"extra\", \"evidenza\": false, \"titolo\": \"Volontaria alla biblioteca di quartiere\", \"tipo\": \"testo\", \"data\": \"2026-11-02\", \"descrizione\": \"Due pomeriggi al mese aiuto a catalogare i libri e a leggere ai bambini delle elementari.\", \"comp\": [\"cittadinanza\", \"personale\"], \"dims\": [\"essere\"], \"conf\": \"alta\", \"perche\": \"Impegno civico continuativo e responsabilit?? verso gli altri.\"}, {\"id\": \"e3\", \"ambito\": \"scuola\", \"evidenza\": false, \"titolo\": \"Podcast in inglese con studenti spagnoli\", \"tipo\": \"link\", \"data\": \"2026-10-27\", \"descrizione\": \"Episodio di 12 minuti registrato con una classe di Valencia sul tema del clima. Ho scritto la scaletta e montato l\'audio.\", \"comp\": [\"multilingue\", \"digitale\"], \"dims\": [\"fare\", \"lavorare\"], \"conf\": \"alta\", \"perche\": \"Uso reale di una lingua straniera e produzione audio digitale.\"}, {\"id\": \"e4\", \"ambito\": \"extra\", \"evidenza\": true, \"titolo\": \"Mercatino solidale di Natale\", \"tipo\": \"foto\", \"data\": \"2026-10-20\", \"descrizione\": \"Ho coordinato un gruppo di 6 persone: budget, contatti con i negozi, turni e comunicazione sui social.\", \"comp\": [\"imprenditoriale\", \"personale\"], \"dims\": [\"essere\", \"lavorare\"], \"conf\": \"alta\", \"perche\": \"Iniziativa, gestione di un budget e coordinamento di un gruppo.\"}, {\"id\": \"e5\", \"ambito\": \"scuola\", \"evidenza\": false, \"titolo\": \"Recensione di \\\"La coscienza di Zeno\\\"\", \"tipo\": \"testo\", \"data\": \"2026-10-14\", \"descrizione\": \"Recensione di 900 parole pubblicata sul giornalino scolastico.\", \"comp\": [\"alfabetica\"], \"dims\": [\"fare\"], \"conf\": \"media\", \"perche\": \"Produzione di un testo argomentativo destinato a un pubblico reale.\"}, {\"id\": \"e6\", \"ambito\": \"scuola\", \"evidenza\": false, \"titolo\": \"Locandina per la mostra fotografica\", \"tipo\": \"foto\", \"data\": \"2026-10-08\", \"descrizione\": \"Ho progettato la locandina della mostra della classe usando Photoshop e i colori della scuola.\", \"comp\": [\"cultura\", \"digitale\"], \"dims\": [\"essere\", \"lavorare\"], \"conf\": \"alta\", \"perche\": \"Alfabetizzazione visiva e uso consapevole di strumenti di design.\"}, {\"id\": \"e7\", \"ambito\": \"extra\", \"evidenza\": false, \"titolo\": \"Capitana della squadra di pallavolo\", \"tipo\": \"testo\", \"data\": \"2026-09-30\", \"descrizione\": \"Gestisco gli allenamenti quando l\'allenatore ?? assente e tengo i rapporti con le altre squadre.\", \"comp\": [\"personale\", \"cittadinanza\"], \"dims\": [\"essere\"], \"conf\": \"media\", \"perche\": \"Leadership, costanza e gestione delle relazioni.\"}], \"diarioFilter\": null, \"privacy\": {\"tutor\": true, \"orientatore\": false, \"ai\": true, \"export\": true}, \"dailyTip\": \"Oggi prova a documentare un\'esperienza sportiva o un hobby: diventa una prova nel tuo passaporto.\", \"theme\": \"light\", \"streak\": 5, \"textSize\": \"normale\", \"materie\": [{\"id\": \"m1\", \"nome\": \"Matematica\", \"color\": \"#2f4b7c\", \"voti\": [{\"v\": 8, \"tipo\": \"scritto\", \"data\": \"2026-10-02\"}, {\"v\": 7.5, \"tipo\": \"orale\", \"data\": \"2026-10-15\"}, {\"v\": 9, \"tipo\": \"scritto\", \"data\": \"2026-11-05\"}]}, {\"id\": \"m2\", \"nome\": \"Italiano\", \"color\": \"#a61b3f\", \"voti\": [{\"v\": 7, \"tipo\": \"orale\", \"data\": \"2026-10-10\"}, {\"v\": 8, \"tipo\": \"scritto\", \"data\": \"2026-11-02\"}]}, {\"id\": \"m3\", \"nome\": \"Scienze\", \"color\": \"#0e6b6b\", \"voti\": [{\"v\": 6.5, \"tipo\": \"pratico\", \"data\": \"2026-10-20\"}, {\"v\": 7.5, \"tipo\": \"scritto\", \"data\": \"2026-11-08\"}]}], \"profilo\": {\"nome\": \"Aura\", \"cognome\": \"Jackson\", \"nascita\": \"2009-03-14\", \"citta\": \"Bologna\", \"email\": \"giulia.ferrari@example.com\", \"telefono\": \"\", \"scuola\": \"Liceo Scientifico opzione Scienze Applicate\", \"classe\": \"4B\", \"anno\": \"2026/27\", \"presentazione\": \"Studentessa di quarta, appassionata di robotica e fotografia. Documento quello che imparo per capire dove andare dopo il diploma.\", \"lingue\": \"Italiano (madrelingua); Inglese (B2); Spagnolo (A2)\", \"digitali\": \"Arduino, Python di base, Photoshop, Audacity\", \"interessi\": \"Robotica, fotografia, podcast\", \"sport\": \"Pallavolo\", \"foto\": \"/api/attachments/28f875c16fa3423e8f99d01ab101162c/file\"}, \"ruolo\": \"studente\", \"planner\": [{\"id\": \"p1\", \"tipo\": \"attivita\", \"titolo\": \"Corso di primo soccorso con la Croce Rossa\", \"note\": \"Tre incontri il sabato mattina\", \"data\": \"2026-12-05\", \"comp\": [\"cittadinanza\", \"personale\"], \"perche\": \"impegno verso gli altri e responsabilit??\", \"fonte\": \"esempio\", \"fatto\": false, \"conf\": \"alta\"}, {\"id\": \"p2\", \"tipo\": \"obiettivo\", \"titolo\": \"Certificazione Cambridge C1\", \"note\": \"Preparare reading e writing\", \"data\": \"2027-05-30\", \"comp\": [\"multilingue\"], \"perche\": \"uso di una lingua straniera a livello avanzato\", \"fonte\": \"esempio\", \"fatto\": false, \"conf\": \"alta\"}, {\"id\": \"p-api-1\", \"tipo\": \"obiettivo\", \"titolo\": \"Sito web per la biblioteca\", \"note\": \"HTML e CSS\", \"data\": \"2027-01-15\", \"comp\": [\"digitale\"], \"perche\": \"creazione di contenuti digitali\", \"fonte\": \"algoritmo\", \"conf\": \"alta\", \"fatto\": false}, {\"id\": \"p1794480691145\", \"tipo\": \"attivita\", \"titolo\": \"Corso di teatro con la compagnia della scuola\", \"note\": \"Recitazione e spettacolo finale\", \"data\": \"\", \"comp\": [\"cultura\"], \"pending\": false, \"fatto\": false, \"perche\": \"espressione creativa e consapevolezza culturale. Segnali: recitazione, spettacolo, teatro\", \"fonte\": \"algoritmo\", \"conf\": \"alta\", \"segnali\": [\"recitazione\", \"spettacolo\", \"teatro\"]}], \"docEvidenza\": [], \"recapPeriodo\": \"mese\", \"isSample\": false, \"sampleBanner\": false, \"portfolioAt\": null, \"portfolioSel\": [], \"tourDone\": true, \"shareWithTutor\": false, \"espFiltro\": \"esperienze\"}','2026-11-12 14:10:56.121');
/*!40000 ALTER TABLE `user_state` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(32) NOT NULL,
  `username` varchar(40) NOT NULL,
  `email` varchar(190) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('studente','lavoratore','studente-lavoratore') NOT NULL DEFAULT 'studente',
  `display_name` varchar(80) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `last_login_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
('06744e1c24b14d99aa6cf197a931e4df','davideGaole',NULL,'pbkdf2_sha256$210000$7fa3cbf170c5b4d18c526a3c4cafaea5$081c32e5a3c6ec463e7b385e7b462f57dbca551460bc1e2edd14355a3624d86a','studente-lavoratore','davide gaole',1,'2026-11-12 14:12:43.515','2026-11-12 14:12:43.520'),
('097fb600da344b0c8fdc1f094fbba02d','Krio23','christian.ceola@allievi.itsdigitalacademy.com','pbkdf2_sha256$210000$d729040bbffc94a492e6e1ee70531edb$468c0d14c584f054f03e66c929c8510aff673c7f65784eaf59a30d272f3848cc','studente','Christian Ceola',1,'2026-11-12 13:07:49.013','2026-11-12 13:33:27.278'),
('139f4a889dd54b24955281522a0ef16b','KataNadir','nadir.martini@allievi.itsdigitalacademy.com','pbkdf2_sha256$210000$32f56aed5ef17cde53cf748d36fbdd4e$052dc7fc345cc58315292e9e93762600ebc9b959a633d6bba878059a55a7f2c4','studente-lavoratore','Nadir Martini',1,'2026-11-12 12:14:48.327','2026-11-12 12:14:48.334'),
('23e49e15ee914c83bb09640d91c6a6cd','123456',NULL,'pbkdf2_sha256$210000$f57f734b02cbda6f0c1801970b18ebd3$f6ee931f8081efaa7e8c67475da64c5fe8f84477c2cd55603a79517364fa74fc','studente','aaa aaa',1,'2026-11-12 13:34:21.473','2026-11-12 13:34:21.479'),
('b2911274faa84aeeac2e591de3433880','Arumih',NULL,'pbkdf2_sha256$210000$7d2997c68e506279fe8e80dd849eb2bb$a42dee569cb6318cbd561d8d99a93193cb1559216bc3a6feed0fbe20d353e051','studente','Arumih',1,'2026-11-12 12:04:34.025','2026-11-12 12:04:34.030'),
('fe16fedaee274f8f92b27dd7d82c8f91','test',NULL,'pbkdf2_sha256$210000$6cddd770d37f7948aa2ffcf8d1d75be7$4e51ed4949c39caf7e892265f2183ff9250026c05fd4d5f79622e1a6dc6c4805','studente','test',1,'2026-11-12 11:53:27.021','2026-11-12 11:53:27.025'),
('u-admin-0000000000000000000001','admin','giulia.ferrari@example.com','pbkdf2_sha256$210000$df7f7cab5b27733771fee26dddb82f37$1a78df8d7cb528ecfe89c673074bf86255bcfce7a4eac71d175a5b995a414a5a','studente','Giulia Ferrari',1,'2026-09-01 08:30:00.000','2026-11-12 13:53:17.278'),
('u-demo2-0000000000000000000002','demo2','demo2@example.com','pbkdf2_sha256$210000$df7f7cab5b27733771fee26dddb82f37$1a78df8d7cb528ecfe89c673074bf86255bcfce7a4eac71d175a5b995a414a5a','lavoratore','Account di prova',1,'2026-09-01 08:30:00.000',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `v_competenze_utente`
--

DROP TABLE IF EXISTS `v_competenze_utente`;
/*!50001 DROP VIEW IF EXISTS `v_competenze_utente`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_competenze_utente` AS SELECT
 1 AS `user_id`,
  1 AS `username`,
  1 AS `competence_id`,
  1 AS `short_name`,
  1 AS `prove`,
  1 AS `punteggio_medio` */;
SET character_set_client = @saved_cs_client;

--
-- Temporary table structure for view `v_obiettivi_competenze`
--

DROP TABLE IF EXISTS `v_obiettivi_competenze`;
/*!50001 DROP VIEW IF EXISTS `v_obiettivi_competenze`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_obiettivi_competenze` AS SELECT
 1 AS `planner_item_id`,
  1 AS `user_id`,
  1 AS `item_type`,
  1 AS `cosa`,
  1 AS `due_date`,
  1 AS `is_done`,
  1 AS `analysis_engine`,
  1 AS `confidence`,
  1 AS `competence_id`,
  1 AS `short_name`,
  1 AS `score`,
  1 AS `is_primary` */;
SET character_set_client = @saved_cs_client;

--
-- Temporary table structure for view `v_riepilogo_utenti`
--

DROP TABLE IF EXISTS `v_riepilogo_utenti`;
/*!50001 DROP VIEW IF EXISTS `v_riepilogo_utenti`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_riepilogo_utenti` AS SELECT
 1 AS `user_id`,
  1 AS `username`,
  1 AS `role`,
  1 AS `display_name`,
  1 AS `nome_completo`,
  1 AS `school`,
  1 AS `class_name`,
  1 AS `prove`,
  1 AS `voci_planner`,
  1 AS `documenti`,
  1 AS `appunti`,
  1 AS `created_at`,
  1 AS `last_login_at` */;
SET character_set_client = @saved_cs_client;

--
-- Dumping routines for database 'talent_radar'
--

--
-- Current Database: `talent_radar`
--

USE `talent_radar`;

--
-- Final view structure for view `v_competenze_utente`
--

/*!50001 DROP VIEW IF EXISTS `v_competenze_utente`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_competenze_utente` AS select `u`.`id` AS `user_id`,`u`.`username` AS `username`,`c`.`id` AS `competence_id`,`c`.`short_name` AS `short_name`,count(`ec`.`evidence_id`) AS `prove`,round(avg(`ec`.`score`),2) AS `punteggio_medio` from (((`users` `u` join `competences` `c`) left join `evidences` `e` on(`e`.`user_id` = `u`.`id`)) left join `evidence_competences` `ec` on(`ec`.`evidence_id` = `e`.`id` and `ec`.`competence_id` = `c`.`id`)) group by `u`.`id`,`u`.`username`,`c`.`id`,`c`.`short_name`,`c`.`sort_order` order by `u`.`username`,`c`.`sort_order` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_obiettivi_competenze`
--

/*!50001 DROP VIEW IF EXISTS `v_obiettivi_competenze`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_obiettivi_competenze` AS select `p`.`id` AS `planner_item_id`,`p`.`user_id` AS `user_id`,`p`.`item_type` AS `item_type`,`p`.`title` AS `cosa`,`p`.`due_date` AS `due_date`,`p`.`is_done` AS `is_done`,`p`.`analysis_engine` AS `analysis_engine`,`p`.`confidence` AS `confidence`,`pc`.`competence_id` AS `competence_id`,`c`.`short_name` AS `short_name`,`pc`.`score` AS `score`,`pc`.`is_primary` AS `is_primary` from ((`planner_items` `p` left join `planner_competences` `pc` on(`pc`.`planner_item_id` = `p`.`id`)) left join `competences` `c` on(`c`.`id` = `pc`.`competence_id`)) order by `p`.`due_date` is null,`p`.`due_date`,`p`.`id`,`pc`.`score` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_riepilogo_utenti`
--

/*!50001 DROP VIEW IF EXISTS `v_riepilogo_utenti`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_riepilogo_utenti` AS select `u`.`id` AS `user_id`,`u`.`username` AS `username`,`u`.`role` AS `role`,`u`.`display_name` AS `display_name`,concat_ws(' ',`pd`.`first_name`,`pd`.`last_name`) AS `nome_completo`,`pd`.`school` AS `school`,`pd`.`class_name` AS `class_name`,(select count(0) from `evidences` `e` where `e`.`user_id` = `u`.`id`) AS `prove`,(select count(0) from `planner_items` `p` where `p`.`user_id` = `u`.`id`) AS `voci_planner`,(select count(0) from `documents` `d` where `d`.`user_id` = `u`.`id`) AS `documenti`,(select count(0) from `notes` `n` where `n`.`user_id` = `u`.`id`) AS `appunti`,`u`.`created_at` AS `created_at`,`u`.`last_login_at` AS `last_login_at` from (`users` `u` left join `personal_data` `pd` on(`pd`.`user_id` = `u`.`id`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-12 14:31:11
