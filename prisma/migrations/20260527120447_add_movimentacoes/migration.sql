-- AlterTable
ALTER TABLE "Chamados"
ADD COLUMN "assignedToId" TEXT,
ADD COLUMN "assignedToName" TEXT,
ALTER COLUMN "status"
SET DEFAULT 'aberto';

-- CreateTable
CREATE TABLE "Movimentacoes" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "atendenteId" TEXT,
    "atendenteNome" TEXT,
    "statusAntes" "Status" NOT NULL,
    "statusDepois" "Status" NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Movimentacoes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Movimentacoes"
ADD CONSTRAINT "Movimentacoes_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Chamados" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimentacoes"
ADD CONSTRAINT "Movimentacoes_atendenteId_fkey" FOREIGN KEY ("atendenteId") REFERENCES "Users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;