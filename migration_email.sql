-- Migración: agregar email y supabase_id a la tabla users
-- Ejecutar en phpMyAdmin de InfinityFree

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `email`       VARCHAR(255) DEFAULT NULL AFTER `phone`,
  ADD COLUMN IF NOT EXISTS `supabase_id` VARCHAR(100) DEFAULT NULL AFTER `email`;

-- Índices
ALTER TABLE `users`
  ADD INDEX IF NOT EXISTS `idx_email`       (`email`),
  ADD INDEX IF NOT EXISTS `idx_supabase_id` (`supabase_id`);
