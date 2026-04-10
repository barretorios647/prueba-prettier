-- =====================================================
--  H & L ALIMCERV Group — Database Schema
--  Compatible: MySQL 5.7+ / InfinityFree
-- =====================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- ---------------------------------------------------
-- Tabla: users
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`          VARCHAR(100) NOT NULL,
  `phone`         VARCHAR(20) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role`          ENUM('user','admin') NOT NULL DEFAULT 'user',
  `is_verified`   TINYINT(1) NOT NULL DEFAULT 0,
  `avatar`        VARCHAR(255) DEFAULT NULL,
  `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login`    TIMESTAMP NULL DEFAULT NULL,
  INDEX `idx_phone` (`phone`),
  INDEX `idx_role`  (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------
-- Tabla: otp_codes
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS `otp_codes` (
  `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `phone`      VARCHAR(20) NOT NULL,
  `code`       VARCHAR(6) NOT NULL,
  `purpose`    ENUM('register','login','reset') NOT NULL DEFAULT 'register',
  `expires_at` TIMESTAMP NOT NULL,
  `used`       TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_phone_code` (`phone`, `code`),
  INDEX `idx_expires`    (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------
-- Tabla: products
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`        VARCHAR(120) NOT NULL,
  `description` TEXT,
  `price`       DECIMAL(10,2) NOT NULL,
  `old_price`   DECIMAL(10,2) DEFAULT NULL,
  `category`    ENUM('alimentos','bebidas','aceites','limpieza','general') NOT NULL DEFAULT 'general',
  `image`       VARCHAR(255) NOT NULL DEFAULT 'uploads/default.jpg',
  `badge`       VARCHAR(50) DEFAULT NULL,
  `stock`       INT NOT NULL DEFAULT 0,
  `is_active`   TINYINT(1) NOT NULL DEFAULT 1,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category`),
  INDEX `idx_active`   (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------
-- Tabla: orders
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`     INT UNSIGNED DEFAULT NULL,
  `user_name`   VARCHAR(100) NOT NULL DEFAULT '',
  `user_phone`  VARCHAR(20) NOT NULL DEFAULT '',
  `total`       DECIMAL(10,2) NOT NULL,
  `status`      ENUM('pendiente','confirmado','en_camino','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  `notes`       TEXT,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_user`    (`user_id`),
  INDEX `idx_status`  (`status`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------
-- Tabla: order_items
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_items` (
  `id`           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id`     INT UNSIGNED NOT NULL,
  `product_id`   INT UNSIGNED DEFAULT NULL,
  `product_name` VARCHAR(120) NOT NULL,
  `quantity`     INT UNSIGNED NOT NULL,
  `unit_price`   DECIMAL(10,2) NOT NULL,
  `subtotal`     DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (`order_id`)   REFERENCES `orders`(`id`)   ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------
-- Tabla: activity_log
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_log` (
  `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT UNSIGNED DEFAULT NULL,
  `action`     VARCHAR(120) NOT NULL,
  `details`    TEXT,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_user`    (`user_id`),
  INDEX `idx_action`  (`action`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------
-- Datos iniciales: productos de ejemplo
-- ---------------------------------------------------
INSERT IGNORE INTO `products` (`name`, `description`, `price`, `old_price`, `category`, `image`, `badge`, `stock`, `is_featured`) VALUES
('Arroz Premium',     'Arroz de grano largo, ideal para todas tus comidas del día. Calidad garantizada.',         50.00, NULL,  'alimentos', 'img/arroz.jpg',    'Nuevo',   100, 1),
('Refresco Cola 2L',  'Refresco de cola 2L, perfecto para compartir en familia. Frío y refrescante.',             30.00, 35.00, 'bebidas',   'img/refresco.jpg', 'Oferta',  80,  0),
('Aceite Vegetal 1L', 'Aceite vegetal 100% puro, botella de 1 litro. Para freír o aderezar tus platillos.',      80.00, NULL,  'aceites',   'img/aceite.jpg',   NULL,      60,  0),
('Frijol Negro 1kg',  'Frijol negro seleccionado, limpio y de primera calidad. Rinde mucho en la cocina.',       45.00, NULL,  'alimentos', 'img/arroz.jpg',    'Popular', 120, 1),
('Agua Natural 5L',   'Agua purificada de 5 litros, perfecta para el hogar. Entrega inmediata disponible.',      25.00, NULL,  'bebidas',   'img/refresco.jpg', NULL,      200, 0),
('Sal de Mesa 1kg',   'Sal refinada yodada, esencial en cada cocina. Presentación familiar de 1 kilogramo.',     15.00, NULL,  'alimentos', 'img/arroz.jpg',    NULL,      150, 0);

-- ---------------------------------------------------
-- NOTA: El usuario administrador se crea ejecutando setup.php
-- Admin phone: 51500033 | Admin password: Caleb08
-- ---------------------------------------------------
