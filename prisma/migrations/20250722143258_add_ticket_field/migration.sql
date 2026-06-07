/*
Warnings:

- The values [ADMIN,TECNICO,USUARIO] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
- The values [ABERTO,EM_ANDAMENTO,FINALIZADO] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.
- A unique constraint covering the columns `[ticket]` on the table `Chamados` will be added. If there are existing duplicate values, this will fail.
- Added the required column `ticket` to the `Chamados` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;

CREATE TYPE "Role_new" AS ENUM ('admin', 'atendente', 'usuario');

ALTER TABLE "Users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");

ALTER TYPE "Role" RENAME TO "Role_old";

ALTER TYPE "Role_new" RENAME TO "Role";

DROP TYPE "Role_old";

COMMIT;

-- AlterEnum
BEGIN;

CREATE TYPE "Status_new" AS ENUM ('aberto', 'em_andamento', 'finalizado');

ALTER TABLE "Chamados" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");

ALTER TYPE "Status" RENAME TO "Status_old";

ALTER TYPE "Status_new" RENAME TO "Status";

DROP TYPE "Status_old";

COMMIT;

-- AlterTable
ALTER TABLE "Chamados" ADD COLUMN "ticket" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Chamados_ticket_key" ON "Chamados" ("ticket");