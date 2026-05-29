import prisma from '../../lib/prisma.js';

export async function cleanupPendingUsers() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hora

  const deleted = await prisma.users.deleteMany({
    where: {
      email_verified: false,
      createdAt: {
        lt: oneHourAgo,
      },
    },
  });

  if (deleted.count > 0) {
    console.log(`🧹 ${deleted.count} usuário(s) pendente(s) excluído(s) por falta de verificação.`);
  }
}
