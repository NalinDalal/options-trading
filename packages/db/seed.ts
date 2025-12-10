import { prisma } from "./index";

async function main() {
  console.log("Seeding database...");

  // --- USER ---
  const user = await prisma.user.create({
    data: {
      email: "test@example.com",
      password: "$2b$10$3b9FfWqG7h9E1ZcC1uMmTOyNxrHU0rgZ7iYz1C9lI7ayaRxhgIY1C", // "password" bcrypt
      name: "Test User",
      balance: BigInt(100000000), // 1e8 units
    },
  });

  // --- UNDERLYINGS ---
  const btc = await prisma.underlying.create({
    data: {
      symbol: "BTC",
      decimals: 2,
    },
  });

  const eth = await prisma.underlying.create({
    data: {
      symbol: "ETH",
      decimals: 2,
    },
  });

  const nifty = await prisma.underlying.create({
    data: {
      symbol: "NIFTY",
      decimals: 2,
    },
  });

  // --- OPTION CONTRACTS ---
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7); // 1-week expiry

  const contracts = await prisma.optionContract.createMany({
    data: [
      {
        underlyingId: btc.id,
        optionType: "CALL",
        strike: BigInt(9000000), // 90,000.00
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
        strike: BigInt(300000), // 3,000.00
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
  });

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
