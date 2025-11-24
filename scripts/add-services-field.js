// Migration script to add 'services' field to Teacher model

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`ALTER TABLE teachers ADD COLUMN services jsonb;`;
  console.log('Added services column to teachers table.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
