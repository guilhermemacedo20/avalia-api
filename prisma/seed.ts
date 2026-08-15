// Script construido para gerar um usuário administrador no banco de dados
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedAdminUser() {
  const passwordHash = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
    10,
  );

  await prisma.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL || 'admin@educacao.dev' },
    update: {
      passwordHash,
      mustChangePassword: false,
      role: Role.ADMIN,
    },
    create: {
      name: 'Administrador',
      email: process.env.SEED_ADMIN_EMAIL || 'admin@educacao.dev',
      passwordHash,
      role: Role.ADMIN,
      mustChangePassword: false,
    },
  });

  console.log('Seed gerado');
}

seedAdminUser();
