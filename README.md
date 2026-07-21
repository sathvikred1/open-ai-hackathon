# Brolife

Brolife is a supportive AI productivity companion for setting goals, building a
realistic daily timetable, recovering from disruptions, and tracking progress.

## Current MVP

- Local onboarding and profile preferences
- Goals and task management
- Deterministic daily planning
- AI-assisted disruption interpretation with local replanning
- Context-aware Brolife chat
- Daily and weekly progress summaries

All user data is currently stored in the browser's localStorage. OpenAI requests
go through server-only Next.js route handlers; the API key is never exposed to
the client. Replanning and chat continue with deterministic local fallbacks when
OpenAI is unavailable.

## Local development

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Add a valid
`OPENAI_API_KEY` to `.env.local` to enable AI responses. The app remains usable
without one.

## Quality checks

```bash
npm run lint
npm run build
```

## Deployment

The app is ready for a standard Next.js deployment on Vercel:

1. Import the repository into Vercel.
2. Add `OPENAI_API_KEY` as a server-side environment variable.
3. Optionally set `OPENAI_REPLANNING_MODEL` and `OPENAI_CHAT_MODEL`; both default
   to `gpt-5.6-sol`.
4. Deploy using the detected Next.js defaults.

Because storage is browser-local in this MVP, data does not sync between devices
or browsers and clearing site data removes it.
