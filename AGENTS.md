# Launch Briefing

## How to get running

1. Install a current Node.js runtime (Vite 6 expects Node 18+), then run `npm install` from the repo root to sync `package.json` dependencies.
2. Start the development server with `npm run dev -- --host`; Vite listens on port 5173 by default and `--host` makes it reachable from `localhost` and the LAN.
3. When you need a production build, run `npm run build` and then `npm run preview -- --host` to serve the optimized output for verification.

## Notes

- `index.html` plus the files in `src/` and `public/` power the app. Keep them synced while developing so the dev server updates automatically.
- `setup.sh` exists for any manual environment prep that isn’t handled by npm; inspect it before you launch if the repo feels surprised by missing tooling.
