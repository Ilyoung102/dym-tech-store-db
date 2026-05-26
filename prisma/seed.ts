import { seedDatabase } from "../lib/seed";
import { prisma } from "../lib/prisma";

seedDatabase()
  .then((result) => {
    console.log("Seed complete", result);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
