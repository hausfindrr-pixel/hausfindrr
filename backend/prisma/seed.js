const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hausfindrr.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'Admin1234!';

  const passwordHash = await bcrypt.hash(adminPass, 12);
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'HausFindrr Admin',
        phone: '+675 000 0000',
        passwordHash,
        role: 'admin',
        status: 'active',
      },
    });
    console.log(`Admin created: ${adminEmail}`);
  } else {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { passwordHash },
    });
    console.log(`Admin password synced: ${adminEmail}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
