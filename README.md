# LookBook Smart Pricing AI

Progetto completo React + Node.js per stimare automaticamente il prezzo di capi usati tramite LLM.

## Architettura

- frontend: React (Vite)
- backend: Node.js + Express
- AI: OpenAI Chat Completions con system prompt dedicato
- persistenza conversazionale: file JSON locale tramite lowdb

## Output richiesto

Il backend restituisce esattamente questo schema:

```json
{
  "suggested_price": 22,
  "range": {
    "min": 18,
    "max": 27
  },
  "motivation": "...",
  "selling_tips": ["...", "..."]
}
```

## Requisiti

- Node.js 20+
- API key OpenAI

## Setup locale

1. Configura backend:

```bash
cd backend
copy .env.example .env
```

Compila in `.env`:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default: `gpt-4.1-mini`)
- `ALLOWED_ORIGIN` (es. `http://localhost:5173`)

2. Configura frontend:

```bash
cd ../frontend
copy .env.example .env
```

Imposta in `.env`:

- `VITE_API_URL=http://localhost:8787`

3. Avvia backend:

```bash
cd ../backend
npm run dev
```

4. Avvia frontend:

```bash
cd ../frontend
npm run dev
```

## Endpoint

Unico endpoint backend:

- `POST /api/valuate`

Body richiesto:

```json
{
  "sessionId": "uuid-opzionale",
  "category": "Giacca",
  "brand": "Levi's",
  "condition": "buono",
  "imageBase64": "...",
  "imageMimeType": "image/jpeg"
}
```

Risposta:

```json
{
  "sessionId": "uuid-sessione",
  "estimate": {
    "suggested_price": 22,
    "range": { "min": 18, "max": 27 },
    "motivation": "...",
    "selling_tips": ["...", "..."]
  }
}
```

## Persistenza chat

Le conversazioni sono salvate in:

- `backend/data/conversations.json`

Ogni richiesta salva:

- messaggio utente (input del capo)
- risposta assistant (stima AI)

La sessione e recuperata tramite `sessionId` (salvato anche nel localStorage del frontend).

## Deploy gratuito

### Backend su Render

- File incluso: `backend/render.yaml`
- In Render imposta:
  - `OPENAI_API_KEY`
  - `ALLOWED_ORIGIN` (URL Netlify del frontend)

### Frontend su Netlify

- File incluso: `frontend/netlify.toml`
- Variabile ambiente Netlify:
  - `VITE_API_URL=https://<tuo-backend-render>.onrender.com`

## Note sul system prompt

Il system prompt e in:

- `backend/src/systemPrompt.js`

Contiene le regole di valutazione, motivazione strutturata e vincolo di output JSON puro.
