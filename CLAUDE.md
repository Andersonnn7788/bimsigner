# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BimSigner is a sign language application with two components:
- **bimsigner1/**: Next.js 16 web frontend (React 19, TypeScript, Tailwind CSS v4)
- **ActionDetectionforSignLanguage/**: Python-based ML component for sign language action detection (Jupyter notebook)

## Commands

All Next.js commands run from the `bimsigner1/` directory:

```bash
cd bimsigner1
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint (flat config, eslint-config-next with core-web-vitals + typescript)
```

The Python ML component uses a virtual environment in `ActionDetectionforSignLanguage/.venv/`.

## Architecture

### Next.js App (bimsigner1/)
- Uses the **App Router** (`src/app/` directory)
- **React Compiler** is enabled (`reactCompiler: true` in next.config.ts)
- **Tailwind CSS v4** via PostCSS (not the older config-based setup — styles use `@import "tailwindcss"` and `@theme inline` in globals.css)
- Fonts: Geist Sans and Geist Mono loaded via `next/font/google`
- Path alias: `@/*` maps to `./src/*`
- TypeScript strict mode enabled

### ML Component (ActionDetectionforSignLanguage/)
- Single Jupyter notebook: `Action Detection Refined.ipynb`
- Separate git history (has its own `.git` directory)
