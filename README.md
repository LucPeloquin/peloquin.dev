# peloquin.dev

Jean-Luc Peloquin’s personal portfolio site, built with Next.js, React, TypeScript, Tailwind CSS, and Framer Motion.

## Local development

Install dependencies and start the development server:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production build

Build the static export and preview it locally:

```bash
npm run build
python3 -m http.server 3010 --directory out
```

Open [http://localhost:3010](http://localhost:3010).

The previous vanilla HTML/CSS site is preserved in [`past-designs/vanilla-site`](past-designs/vanilla-site).
