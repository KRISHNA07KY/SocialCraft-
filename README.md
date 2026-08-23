# Social Media Content Analyzer

SocialForge is a focused MVP for turning a social-media document, screenshot, or scanned image into a practical editorial brief. Upload a PDF or PNG/JPG, review the extracted text, and get a structured Groq analysis covering the hook, clarity, audience appeal, call to action, and an improved version.

## Features

- Drag-and-drop and keyboard-accessible file picker.
- PDF text extraction with `pdf-parse`.
- OCR for PNG/JPG/JPEG uploads with `tesseract.js`.
- Server-side Groq integration with validated JSON output.
- Firebase Authentication and Firestore persistence for profiles, history, and feedback.
- Client and server file validation, including file signatures and a configurable 10 MB limit.
- Clear processing, extraction, empty-content, configuration, and API error states.
- Responsive, accessible interface with a source-text review step.

## Tech stack and architecture

Next.js App Router and TypeScript keep the frontend and small server routes in one deployable project. Tailwind CSS supplies the responsive visual system. Firebase handles authentication and client-authorized Firestore persistence; uploaded files stay in memory and are never written to permanent storage.

```mermaid
flowchart LR
  A[PDF or image upload] --> B[/api/extract]
  B --> C{File kind}
  C -->|PDF| D[pdf-parse]
  C -->|PNG/JPG| E[Tesseract OCR]
  D --> F[Extracted text]
  E --> F
  F --> G[/api/analyze]
  G --> H[Groq JSON + Zod validation]
  H --> I[Analysis cards]
  I --> J[Firebase Firestore history]
```

## Local setup

Requirements: Node.js 20.9+, a Firebase project with Authentication and Cloud Firestore enabled, and a Groq API key.

```bash
npm install
copy .env.example .env.local   # Windows PowerShell: Copy-Item .env.example .env.local
# Add GROQ_API_KEY to .env.local
npm run dev
```

Open <http://localhost:3000>. A synthetic text fixture is available at `sample-data/sample-post.txt`; convert or paste it into a simple PDF if you want to exercise PDF extraction. OCR works with any clear screenshot or scanned image containing text.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `GROQ_API_KEY` | Yes for analysis | Groq API key, used only by `/api/analyze`. |
| `GROQ_MODEL` | No | Groq model name; defaults to `openai/gpt-oss-120b`. |

Firebase web configuration values are already provided as public client fallbacks in `lib/firebase/client.ts`; use `.env.local` overrides for another Firebase project. Enable Email/Password (and any desired social providers) in Firebase Authentication, create a Cloud Firestore database, and publish [`firestore.rules`](./firestore.rules).

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The automated tests cover file-signature validation and AI response schema validation. Full OCR and Groq calls require their runtime assets and credentials, so those are manual integration checks using the UI.

## Vercel deployment

1. Push the repository to GitHub and import it into Vercel.
2. Add `GROQ_API_KEY` (and optionally `GROQ_MODEL`) under Project Settings → Environment Variables.
3. Enable Firebase Authentication and Firestore, then publish `firestore.rules` for the same Firebase project.
4. Deploy with the default Next.js build settings.

The API routes use Node.js because PDF parsing and Tesseract are server-side dependencies. OCR is CPU- and memory-intensive; for larger production workloads, move OCR to a dedicated worker. The MVP persists metadata, extracted text, and analysis results in Firestore, but never uploads the original files.

## Limitations

OCR accuracy depends on image resolution, contrast, language, and orientation. Scanned PDFs with no selectable text are reported as unreadable rather than silently running page-by-page OCR. Groq output is advisory and grounded only in supplied text; the product makes no guaranteed engagement claims. Cold starts can be longer for OCR because the language data must be loaded.

## Assessment approach

See [`ASSESSMENT.md`](./ASSESSMENT.md) for the requested 200-word write-up.

