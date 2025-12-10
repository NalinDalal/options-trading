# db

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.19. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

for starting docker

```sh
╰─❯ docker run -d --name exness -p 5432:5432 \
          -e POSTGRES_PASSWORD=postgres postgres

125bc5faf7a8ca6b17368eaf4e22f3547782855e581c6b3e21bd704df6aba133
```

to set env variable:

```sh
cp .env.example .env
```

run client generation and migration:

```sh
╰─❯ bunx prisma migrate dev --name init
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "localhost:5432"

Applying migration `20251210105834_init`

The following migration(s) have been created and applied from new schema changes:

prisma/migrations/
  └─ 20251210105834_init/
    └─ migration.sql

Your database is now in sync with your schema.

╰─❯ bunx prisma generate
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (7.1.0) to ./generated/prisma in 33ms
```

then you have a seed.ts file to seed the db:

```sh
bunx prisma db seed
```

to visualise:

```sh
bunx prisma studio --config ./prisma.config.ts
```
