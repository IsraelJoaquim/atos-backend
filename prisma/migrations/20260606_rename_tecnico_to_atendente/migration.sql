-- Migration: rename atendente to atendente in Role enum
-- Estratégia: criar novo enum, migrar dados, remover enum antigo

-- 1. Cria o novo enum com o valor correto
CREATE TYPE "Role_new" AS ENUM ('admin', 'atendente', 'usuario');

-- 2. Migra a coluna para o novo enum (converte atendente -> atendente)
ALTER TABLE "Users"
  ALTER COLUMN "role" TYPE "Role_new"
  USING (
    CASE "role"::text
      WHEN 'atendente' THEN 'atendente'
      ELSE "role"::text
    END
  )::"Role_new";

-- 3. Remove o enum antigo
DROP TYPE "Role";

-- 4. Renomeia o novo enum para o nome original
ALTER TYPE "Role_new" RENAME TO "Role";