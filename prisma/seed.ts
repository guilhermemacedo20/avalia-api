import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123',
    10,
  );

  await prisma.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL ?? 'admin@educacao.dev' },
    update: {
      passwordHash,
      mustChangePassword: false,
      role: Role.ADMIN,
    },
    create: {
      name: 'Administrador',
      email: process.env.SEED_ADMIN_EMAIL ?? 'admin@educacao.dev',
      passwordHash,
      role: Role.ADMIN,
      mustChangePassword: false,
    },
  });

  console.log('Seed OK');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
