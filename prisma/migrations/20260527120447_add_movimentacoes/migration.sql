-- AlterTable
ALTER TABLE "Chamados" ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "assignedToName" TEXT,
ALTER COLUMN "status" SET DEFAULT 'aberto';

-- CreateTable
CREATE TABLE "Movimentacoes" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "tecnicoId" TEXT,
    "tecnicoNome" TEXT,
    "statusAntes" "Status" NOT NULL,
    "statusDepois" "Status" NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Movimentacoes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Movimentacoes" ADD CONSTRAINT "Movimentacoes_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Chamados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimentacoes" ADD CONSTRAINT "Movimentacoes_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
