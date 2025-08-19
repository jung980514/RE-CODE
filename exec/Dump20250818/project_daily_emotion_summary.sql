-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: project
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `daily_emotion_summary`
--

DROP TABLE IF EXISTS `daily_emotion_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_emotion_summary` (
  `summary_id` bigint NOT NULL AUTO_INCREMENT COMMENT '감정 요약 ID',
  `user_id` bigint NOT NULL COMMENT 'users 테이블의 id (답변한 사용자)',
  `summary_date` date NOT NULL COMMENT '감정 분석 날짜 (YYYY-MM-DD)',
  `answer_type` enum('BASIC','PERSONAL','COGNITIVE_AUDIO','COGNITIVE_IMAGE') NOT NULL COMMENT '질문 유형',
  `dominant_emotion` enum('NEUTRAL','HAPPY','SAD','ANGRY','FEARFUL','DISGUSTED','SURPRISED') NOT NULL COMMENT '감정 분석 결과 (가장 뚜렷한 감정)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시각',
  PRIMARY KEY (`summary_id`),
  UNIQUE KEY `uq_user_date_type` (`user_id`,`summary_date`,`answer_type`),
  CONSTRAINT `fk_summary_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='하루 감정 분석 결과 요약';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_emotion_summary`
--

LOCK TABLES `daily_emotion_summary` WRITE;
/*!40000 ALTER TABLE `daily_emotion_summary` DISABLE KEYS */;
/*!40000 ALTER TABLE `daily_emotion_summary` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-18 11:25:14
