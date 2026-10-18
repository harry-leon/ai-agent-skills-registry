import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const total = await prisma.skill.count();
  const publicCount = await prisma.skill.count({ where: { visibility: 'PUBLIC', deletedAt: null } });
  console.log(`Total skills: ${total}, Public skills: ${publicCount}`);

  const sample = await prisma.skill.findMany({
    where: { visibility: 'PUBLIC', deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      owner: { select: { handle: true, name: true } },
    },
    take: 20,
    orderBy: { createdAt: 'desc' },
  });

  console.log('Sample public skills:');
  for (const s of sample) {
    console.log(`- ${s.name} (${s.slug}) by @${s.owner.handle} [${s.createdAt.toISOString()}]`);
  }
}

main().finally(() => prisma.$disconnect());
