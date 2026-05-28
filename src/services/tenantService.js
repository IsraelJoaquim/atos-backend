import prisma from '../../lib/prisma.js';

export async function createTenant(name) {
  if (!name || !name.trim()) throw new Error('Nome da empresa é obrigatório.');

  const tenant = await prisma.tenants.create({
    data: { name: name.trim() },
  });
  return tenant;
}

export async function getTenants() {
  return prisma.tenants.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, createdAt: true },
  });
}

export async function getTenantById(id) {
  const tenant = await prisma.tenants.findUnique({
    where: { id },
    select: { id: true, name: true, createdAt: true },
  });
  if (!tenant) throw new Error('Empresa não encontrada.');
  return tenant;
}
