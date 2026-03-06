# bligo deployment checklist

## Current publish state

- Local branch: `main`
- Latest local commit: `02d7fcfaf99c9b5b2fd937695ea56cb3b1793dc8`
- Remote: `https://github.com/bligobot12/bligo.git`
- Push status: blocked until GitHub credentials are provided in this environment

## 1) Push to GitHub

```bash
cd /Users/mac/projects
git push -u origin main
```

Authenticate with GitHub username + PAT (repo write).

## 2) Cloudflare Pages (Next.js)

In Cloudflare dashboard:

1. Go to **Workers & Pages** → **Create application** → **Pages**.
2. Connect GitHub and select repo `bligobot12/bligo`.
3. Build settings:
   - Framework preset: **Next.js**
   - Build command: `npx @cloudflare/next-on-pages@1`
   - Build output directory: `.vercel/output/static`
4. Environment:
   - Node.js version: `20`
5. Save and deploy.

## 3) Required project deps for Next.js on Pages

If missing, add:

```bash
npm install next react react-dom
npm install -D @cloudflare/next-on-pages
```

Optional scripts in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "pages:build": "npx @cloudflare/next-on-pages@1"
  }
}
```

## 4) Verification

After deploy:

- Confirm production URL loads.
- Confirm latest commit hash appears in deployment details.
- Add custom domain if needed.
