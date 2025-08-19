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
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL COMMENT '이메일',
  `name` varchar(100) NOT NULL COMMENT '이름',
  `birth_date` date DEFAULT NULL COMMENT '생년월일',
  `phone` varchar(20) DEFAULT NULL COMMENT '전화번호',
  `password` varchar(255) DEFAULT NULL COMMENT '비밀번호',
  `profile_image_url` varchar(255) DEFAULT NULL COMMENT '프로필 사진',
  `uuid` varchar(36) NOT NULL COMMENT 'uuid',
  `provider` enum('KAKAO','LOCAL') NOT NULL COMMENT '가입 방식',
  `provider_id` varchar(255) DEFAULT NULL COMMENT '소셜 제공자 ID',
  `role` enum('USER','ELDER','GUARDIAN','ADMIN') NOT NULL COMMENT '권한',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_phone` (`phone`),
  UNIQUE KEY `uk_provider_id` (`provider`,`provider_id`)
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'ssafy2@naver.com','김노인','1956-08-08','01012341234','$2a$10$m9K9iTlkD0CIMWWs/BzF2eP8wloVkVtPJsmURMSyzdJ2JCN2Ly3Q2','answer/profile/7cb84bcf-d93d-426b-9a40-14764137ffe8_images.jpg','eb704e62-a1ae-468f-b335-63d58168de40','LOCAL','ssafy2@naver.com','ELDER','2025-08-14 17:34:58','2025-08-14 08:35:17'),(2,'ssafy1@naver.com','김보호자','1980-08-13','01012341233','$2a$10$fXxLUDcfUXqpofLKEROpcunk7RK8WZH5GGjhZ8YjdjzNE.ymSO3Ui',NULL,'dd9c4578-7fc5-426e-85bb-1ccc7eab84b3','LOCAL','ssafy1@naver.com','GUARDIAN','2025-08-14 17:36:14','2025-08-14 17:36:14'),(5,'kakao kjh_0717@naver.com','고준환',NULL,NULL,NULL,NULL,'79ba67f8-37bb-4d36-b6d3-92233a828641','KAKAO','4385936362','USER','2025-08-14 23:01:42','2025-08-14 23:01:42'),(6,'ko@recode.com','고','2025-08-06','01000000000','$2a$10$vMKI5/StHodJAf5nJrlI3.xcbdE1B72Y3UhnUgVUy.Zo3W1Nphz4C',NULL,'c9bde6a3-e7f5-4f71-90a4-e53b2e553e72','LOCAL','ko@recode.com','ELDER','2025-08-14 23:53:59','2025-08-14 23:53:59'),(8,'ko2@recode.com','보호자1','2025-08-12','01000000001','$2a$10$Lc1hEu5WYoqKCIUCIC66YuFjddclDTXB2kMPw.uGmm0yBShATeKK6',NULL,'c98fe346-91b1-450b-917d-599ecd50bf19','LOCAL','ko2@recode.com','GUARDIAN','2025-08-14 23:58:18','2025-08-14 23:58:18'),(9,'kco3459@naver.com','김준수','1920-08-03','01034428243','$2a$10$Rw8oHMSugO5YUk4jvoO.Nuavl5WtqTOD1yYiA9n6ujjKqsFbH75ma',NULL,'276f098a-70c9-41b1-9993-567cdbbb8420','LOCAL','kco3459@naver.com','ELDER','2025-08-15 13:13:54','2025-08-16 15:34:19'),(10,'qik3326@gmail.com','김준수보호자','1999-08-19','01034418244','$2a$10$AkZyDMOr4mhrCOXpakko7e/nXKAkziMd.kNIl4kwaWlrL3JrbyfzC',NULL,'e4b97bc0-5ce8-42d1-9bfc-4d7952db54c3','LOCAL','qik3326@gmail.com','GUARDIAN','2025-08-15 13:52:55','2025-08-15 13:52:55'),(12,'kakao jung980514@kakao.com','정지용',NULL,NULL,NULL,NULL,'58f79e78-c0ab-4935-b368-e48c40dac11c','KAKAO','4394887615','USER','2025-08-15 15:18:39','2025-08-15 15:18:39'),(21,'kakao dudals7142@naver.com','김영민','2025-08-05','01023411232',NULL,'answer/profile/fb56fc60-e26a-4c7b-aeba-c616a1f1c3eb_스크린샷 2025-08-15 18.46.41.png','59ee042d-20b7-4c1a-adea-9f628cf2477a','KAKAO','4362299087','ELDER','2025-08-15 18:03:42','2025-08-15 18:52:36'),(26,'test@naver.com','정지용','2025-08-06','01034242342','$2a$10$/v30Sl0deQz.IvXakzBZuOdk/Ohwme9yg/WWLNSqOvE3OgsY8s72C',NULL,'077bf503-b1f2-463a-b849-480e3b798430','LOCAL','test@naver.com','ELDER','2025-08-15 20:20:30','2025-08-15 20:20:30'),(28,'kakao miri219000@gmail.com','test','2025-08-03','01088998899',NULL,NULL,'efd8b6a1-3a47-4d27-bf09-d86394c57799','KAKAO','4398034309','ELDER','2025-08-15 20:22:26','2025-08-15 20:22:36'),(32,'gun@recode.com','황병갑','2025-08-13','01011111111','$2a$10$hniwvRwEmKCdqWm5A2owleKnv88TyqRzeK38Xu1IGFlbGe2p3l5GS',NULL,'aec3239e-efed-457f-9a07-7ac1c91baa7d','LOCAL','gun@recode.com','ELDER','2025-08-15 21:09:39','2025-08-15 21:09:39'),(33,'hello@naver.com','이노인','1954-08-12','01098765432','$2a$10$SD3HJHikzpV2qg3G9jWtX.MDiMlZgNji6Zsh1GvQ18fjkPsLIjJXO',NULL,'f4981cb7-8346-4542-94b6-aab56d6fda46','LOCAL','hello@naver.com','ELDER','2025-08-16 02:46:10','2025-08-16 02:46:10'),(34,'abcd@1234','테스트22','2025-08-05','ddddddddddddd','$2a$10$XckWMfKuCXEa/tlUmiWq4OeRR2DB.n/bX8xk31oJ2/U3lgO5eb5Gq',NULL,'71d60a08-62b1-43e2-8358-1b1deb086c23','LOCAL','abcd@1234','GUARDIAN','2025-08-16 04:19:35','2025-08-16 04:19:35'),(47,'telder@gmail.com','이영자','1942-04-08','01088578896','$2a$10$Ew51Ghz6QcjM59yh211VP.yXMkenWZD7.rYj66rvGpRkyKLXbQnVW',NULL,'e16d214c-142f-4131-9e60-ff170756f53c','LOCAL','telder@gmail.com','ELDER','2025-08-16 14:01:25','2025-08-16 14:01:25'),(48,'tguardian@gmail.com','김수호','1987-08-05','01088576697','$2a$10$xFAWioJfF0ozVgOJoZ2nCe27NBQekguQe7S4BVjwReHqmivW/.mii',NULL,'67e90f17-d447-481f-a63c-139e32ba20da','LOCAL','tguardian@gmail.com','GUARDIAN','2025-08-16 14:05:13','2025-08-16 14:05:13'),(49,'myssafy@gmail.com','김옥자','2025-08-12','01012312312','$2a$10$b0blqQRCQR45Fkdp8A5wx.rvNvNNcqYDdx70FK/l29hDhJbFN3rTi',NULL,'1ae65e77-eebc-40ed-ada9-c80b36ce6e6d','LOCAL','myssafy@gmail.com','ELDER','2025-08-16 15:18:30','2025-08-16 15:18:30'),(50,'qwer@qwer.qwer','asd','2025-08-05','01023423322','$2a$10$hgMA.VekIESqmLlAzjhV0egZwe8xL0JHHw9hSmhTsFV1kS.fH7QYq',NULL,'7880cd12-e75b-4dd5-b2b8-3f591d598ed0','LOCAL','qwer@qwer.qwer','ELDER','2025-08-16 16:50:30','2025-08-16 16:50:30'),(55,'siyeone@naver.com','김준수','1942-04-08','01034420000','$2a$10$r97y8mKTGEKTu8aN0BmYzeSEUY18Qm9pKn/4OoTB7NXcF71PehA82',NULL,'6f7bf75d-ad6e-4ef1-9968-fcb7192bd704','LOCAL','siyeone@naver.com','ELDER','2025-08-17 14:02:11','2025-08-17 14:02:11'),(56,'siyeong@naver.com','김수혁','1987-08-05','01034420001','$2a$10$HE2xxa6V2hQ5Ot2bCcg.yu1WS1tnXi9CrCvom4R6xrRi1CDTEJqMa',NULL,'3dd03f0a-b2fc-4414-ac36-cfed7a499f62','LOCAL','siyeong@naver.com','GUARDIAN','2025-08-17 14:02:51','2025-08-17 14:02:51'),(57,'tcast@naver.com','김준수','1987-08-12','01000000007','$2a$10$0eGS.Jd5lsVe84iEmlYzT.dlt8SCXwrhZBQMa.iL4aF4KhUSwHWO6',NULL,'ea321ba5-6508-4fb4-99a8-d87c789f0b37','LOCAL','tcast@naver.com','ELDER','2025-08-17 23:48:51','2025-08-17 23:48:51');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-18 11:25:43
