# ResumeOwl Deployment Guide

ResumeOwl is built for Vercel as a browser-based resume builder and analyzer. AI features are optional, but production AI requires server-side environment variables.

## 1. Local Verification

Create `.env.local` locally:

```env
GEMINI_API_KEY=your_key_here
AI_PROVIDER=gemini
AI_MODEL=gemini-3.5-flash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Never commit `.env.local`.

Run:

```bash
npm install
npm run lint
npm run test
npm run build
npm run dev
```

Open:

- `http://localhost:3000/analyzer`
- `http://localhost:3000/maker`
- `http://localhost:3000/refactor`
- `http://localhost:3000/preview`

Test AI features with non-sensitive dummy data first.

## 2. Vercel Project Setup

1. Go to `https://vercel.com/new`.
2. Import `abdullahx404/ResumeOwl` from GitHub.
3. Framework preset should be `Next.js`.
4. Keep the default build command:

```bash
npm run build
```

5. Keep the default output behavior for Next.js.

## 3. Environment Variables

Important: `.env.local` is only for your local machine. Vercel production will not use your local `.env.local` file. In Vercel Project Settings, open Environment Variables and add:

```env
GEMINI_API_KEY=your_key_here
AI_PROVIDER=gemini
AI_MODEL=gemini-3.5-flash
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

Apply variables to:

- Production
- Preview
- Development, if you use Vercel CLI locally

Redeploy after adding or changing environment variables.

If AI works locally but not on Vercel, check these first:

- `GEMINI_API_KEY` exists in Vercel Project Settings, not only `.env.local`.
- `AI_PROVIDER` is set to `gemini`.
- `AI_MODEL` is set to `gemini-3.5-flash`.
- The variables are enabled for the environment you are testing: Production or Preview.
- You redeployed after saving the variables.

## 4. Deploy

Recommended GitHub flow:

1. Push to `master`.
2. Let Vercel create a preview deployment.
3. Test the preview URL.
4. Promote or merge for production deployment.

Optional CLI flow:

```bash
npm install -g vercel
vercel login
vercel link
vercel env pull .env.local
vercel deploy
vercel deploy --prod
```

## 5. Production Verification

After deployment, test:

- Home page loads.
- Analyzer local scan works.
- Analyzer AI feedback works.
- Maker local bullet generation works.
- Maker AI bullet generation works.
- Refactor local fallback works.
- Refactor AI refactor works.
- Preview opens.
- PDF print opens browser print dialog.
- DOCX download creates a `.docx`.
- LaTeX Code download creates a `.tex`.
- Security headers are present.

## 6. Privacy Notes

ResumeOwl stores user profile and latest resume drafts in the user's own browser storage until they clear browser history or site data.

Gemini free-tier API usage is different: Google states unpaid Gemini API quota may be used to improve Google products, and human reviewers may process API input/output. For production with real resume data, the more privacy-aligned choice is a paid Gemini API project with billing enabled.

Do not paste real sensitive resumes into free-tier AI testing.

## 7. Secret Safety

- Do not commit API keys.
- Do not expose keys with `NEXT_PUBLIC_`.
- Store keys only in `.env.local` locally and Vercel environment variables in production.
- Rotate the key if it is ever pasted into chat, GitHub, logs, or screenshots.
