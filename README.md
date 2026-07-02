# AI Software Engineering Assistant

An AI coding assistant built with LangGraph. It understands coding tasks, creates a plan, writes code, reviews its own work, and then returns the final solution.

## Setup

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
cp sample.env .env
```

Open `.env` and update the required values:

- `OPENROUTER_API_KEY`
- `PROJECT_ROOT`

## Run

Default Run:

```bash
npx ts-node src/index.ts
```

Run with task:

```bash
npx ts-node src/index.ts "Add rate limiting to my Express API using Redis"
```
