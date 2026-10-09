# Arc website

Landing page, Privacy Policy, Terms and Support for the Arc skydiving app.
Static [Astro](https://astro.build) site, deployed on Vercel.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
```

- Open details (support email, operator, App Store link): `src/data/site.ts`
- Privacy / Terms text: `src/data/legal.ts` — copied from the app
  (`ARC/app/privacy.tsx`, `ARC/app/terms.tsx`); change both together.
- Colors mirror `ARC/constants/tokens.ts`.
