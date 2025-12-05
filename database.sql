-- 用户管理系统数据库脚本
-- 支持签到、会员、积分功能

-- 用户表
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `nickname` varchar(100) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `points` int NOT NULL DEFAULT 0,
  `is_member` tinyint(1) NOT NULL DEFAULT 0,
  `member_expire_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_member_expire` (`member_expire_at`),
  KEY `idx_points` (`points`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 签到记录表
CREATE TABLE `checkins` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `checkin_date` date NOT NULL,
  `points_earned` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_date` (`user_id`,`checkin_date`),
  KEY `idx_checkin_date` (`checkin_date`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 积分记录表（可选，用于详细积分流水）
CREATE TABLE `points_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `points_change` int NOT NULL,
  `type` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `related_id` bigint DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_type` (`user_id`,`type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 会员兑换记录表（可选，用于会员兑换历史）
CREATE TABLE `membership_redeem_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `points_cost` int NOT NULL,
  `duration_days` int NOT NULL,
  `expire_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expire_at` (`expire_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始化数据（可选）
-- 创建一个管理员用户，密码为 'admin123'
-- INSERT INTO `users` (`email`, `password_hash`, `nickname`, `points`, `is_member`) 
-- VALUES ('admin@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '管理员', 1000, 1);

-- 索引优化
-- 用于快速查询用户今日签到状态
CREATE INDEX `idx_today_checkin` ON `checkins` (`user_id`, `checkin_date`);

-- 用于快速查询会员状态
CREATE INDEX `idx_member_status` ON `users` (`id`, `is_member`, `member_expire_at`);

-- 触发器：更新积分时记录日志（可选）
DELIMITER $$
CREATE TRIGGER `after_points_update`
AFTER UPDATE ON `users`
FOR EACH ROW
BEGIN
  IF NEW.points != OLD.points THEN
    INSERT INTO `points_log` (`user_id`, `points_change`, `type`, `description`)
    VALUES (NEW.id, NEW.points - OLD.points, 'update', '积分变更');
  END IF;
END$$
DELIMITER ;

-- 存储过程：获取用户统计信息（可选）
DELIMITER $$
CREATE PROCEDURE `get_user_stats`(IN `p_user_id` BIGINT)
BEGIN
  SELECT 
    u.id,
    u.email,
    u.nickname,
    u.points,
    u.is_member,
    u.member_expire_at,
    (SELECT COUNT(*) FROM checkins WHERE user_id = p_user_id) as total_checkins,
    (SELECT SUM(points_earned) FROM checkins WHERE user_id = p_user_id) as total_earned_points,
    (SELECT checkin_date FROM checkins WHERE user_id = p_user_id ORDER BY checkin_date DESC LIMIT 1) as last_checkin_date
  FROM users u
  WHERE u.id = p_user_id;
END$$
DELIMITER ;