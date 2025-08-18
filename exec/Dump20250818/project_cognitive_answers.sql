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
-- Table structure for table `cognitive_answers`
--

DROP TABLE IF EXISTS `cognitive_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cognitive_answers` (
  `answer_id` int NOT NULL AUTO_INCREMENT COMMENT '답변 ID',
  `question_id` int NOT NULL COMMENT 'cognitive_questions.question_id',
  `user_id` bigint NOT NULL COMMENT 'users.id',
  `answer` text NOT NULL COMMENT '대답',
  `media_type` enum('audio','image') NOT NULL COMMENT '미디어 타입',
  `score` double DEFAULT NULL COMMENT '질문과 응답 유사도 점수',
  `is_match` tinyint(1) NOT NULL DEFAULT '0' COMMENT '매칭 여부',
  `video_path` varchar(255) NOT NULL COMMENT '대답 영상(S3) 주소',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`answer_id`),
  KEY `idx_cog_ans_q` (`question_id`),
  KEY `idx_cog_ans_u` (`user_id`),
  CONSTRAINT `fk_cog_answers_question` FOREIGN KEY (`question_id`) REFERENCES `cognitive_questions` (`question_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cog_answers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cognitive_answers`
--

LOCK TABLES `cognitive_answers` WRITE;
/*!40000 ALTER TABLE `cognitive_answers` DISABLE KEYS */;
/*!40000 ALTER TABLE `cognitive_answers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-18 11:25:16
