# crate - Tutorial Generator

![alt text](/client/public/image.png)

A tool that scrapes documentation sites and uses AI to generate comprehensive tutorial scaffolds in markdown format.

## Project Structure

```
.
├── api/          # Express backend server
├── client/       # Next.js frontend
└── README.md     # This file
```

## Features

- 📚 Scrapes documentation sites (up to 15 pages)
- 🤖 AI-powered tutorial generation using GPT-4o-mini
- 📝 Generates structured markdown tutorials
- 💾 Export individual tutorials or CSV index
- 🔄 Refine generated content with follow-up prompts
- 💰 Cost estimation for each tutorial

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd bunchee
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:

**API (.env in /api folder):**
```bash
cp api/.env.example api/.env
# Add your OPENAI_API_KEY
```

**Client (.env.local in /client folder):**
```bash
cp client/.env.example client/.env.local
# Add NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Development

Run both client and API in development mode:
```bash
npm run dev
```

Or run them separately:
```bash
npm run dev:api     # API on port 3001
npm run dev:client  # Client on port 3000
```

### Production

Build both projects:
```bash
npm run build
```

Start production servers:
```bash
npm start
```

## Deployment

### API
Deploy the Express server in `/api` folder to any Node.js hosting service (Railway, Render, Fly.io, etc.)

### Client
Deploy the Next.js app in `/client` folder to Vercel, Netlify, or any Next.js-compatible host.

Don't forget to set the `NEXT_PUBLIC_API_URL` environment variable in your client deployment to point to your API URL.

## Tech Stack

### Backend (API)
- Express.js
- TypeScript
- OpenAI API
- Cheerio (web scraping)

### Frontend (Client)
- Next.js 15
- React
- TypeScript
- Tailwind CSS
- Server-Sent Events for streaming

## License

MIT
