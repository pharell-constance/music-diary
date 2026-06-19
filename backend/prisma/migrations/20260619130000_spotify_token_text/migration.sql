-- Spotify OAuth columns (add if missing, then widen to TEXT for long tokens)

SET @db := DATABASE();

-- spotifyId
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'User' AND COLUMN_NAME = 'spotifyId');
SET @sql := IF(@col = 0,
  'ALTER TABLE `User` ADD COLUMN `spotifyId` VARCHAR(191) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- spotifyAccessToken
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'User' AND COLUMN_NAME = 'spotifyAccessToken');
SET @sql := IF(@col = 0,
  'ALTER TABLE `User` ADD COLUMN `spotifyAccessToken` TEXT NULL',
  'ALTER TABLE `User` MODIFY COLUMN `spotifyAccessToken` TEXT NULL');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- spotifyRefreshToken
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'User' AND COLUMN_NAME = 'spotifyRefreshToken');
SET @sql := IF(@col = 0,
  'ALTER TABLE `User` ADD COLUMN `spotifyRefreshToken` TEXT NULL',
  'ALTER TABLE `User` MODIFY COLUMN `spotifyRefreshToken` TEXT NULL');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- spotifyTokenExpiresAt
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'User' AND COLUMN_NAME = 'spotifyTokenExpiresAt');
SET @sql := IF(@col = 0,
  'ALTER TABLE `User` ADD COLUMN `spotifyTokenExpiresAt` DATETIME(3) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
