This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

https://heatmap-peta-kebisingan.vercel.app/

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy on Neon.tech

```postgres
-- 1. Mengaktifkan fitur PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Membuat tabel pengukuran kebisingan
CREATE TABLE noise_measurements (
    id BIGSERIAL PRIMARY KEY,
    timestamp_utc TIMESTAMP NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    altitude_m DOUBLE PRECISION,
    noise_db DOUBLE PRECISION NOT NULL,
    geom geometry(Point, 4326) NOT NULL
);

-- 3. Membuat indeks spasial GiST
CREATE INDEX idx_noise_measurements_geom ON noise_measurements USING GIST (geom);
```

https://console.neon.tech/app/projects/aged-salad-39708577
