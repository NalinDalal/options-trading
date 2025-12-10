import { prisma } from "./index";
import { hashPassword } from "@repo/utils";

async function main() {
  console.log("Seeding database...");

  // --- USER ---
  const plainPassword = "password"; // seed password
  const hashed = await hashPassword(plainPassword);

  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      password: hashed,
      name: "Test User",
      balance: BigInt(100000000),
    },
  });

  // --- UNDERLYINGS ---
  const btc = await prisma.underlying.upsert({
    where: { symbol: "BTC" },
    update: {},
    create: { symbol: "BTC", decimals: 2 },
  });

  const eth = await prisma.underlying.upsert({
    where: { symbol: "ETH" },
    update: {},
    create: { symbol: "ETH", decimals: 2 },
  });

  const nifty = await prisma.underlying.upsert({
    where: { symbol: "NIFTY" },
    update: {},
    create: { symbol: "NIFTY", decimals: 2 },
  });

  // --- OPTION CONTRACTS ---
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);

  await prisma.optionContract.deleteMany({
    where: {
      expiry: {
        lte: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      },
    },
  });

  await prisma.optionContract.createMany({
    data: [
      {
        underlyingId: btc.id,
        optionType: "CALL",
        strike: BigInt(9000000),
        expiry,
        multiplier: 1,
      },
      {
        underlyingId: btc.id,
        optionType: "PUT",
        strike: BigInt(9000000),
        expiry,
        multiplier: 1,
      },
      {
        underlyingId: eth.id,
        optionType: "CALL",
        strike: BigInt(300000),
        expiry,
        multiplier: 1,
      },
      {
        underlyingId: eth.id,
        optionType: "PUT",
        strike: BigInt(300000),
        expiry,
        multiplier: 1,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed complete! ✓");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
