# Launching the app

1. Install Node.js 18+ so the Vite toolchain can run, then run `npm install` from this repo to pull in all dev dependencies.
2. Use `npm run dev -- --host` to start the Vite dev server; it defaults to port 5173 and `--host` makes it reachable from `localhost` and other machines on your network.
3. When you want to simulate production, execute `npm run build` and then `npm run preview -- --host` to serve the optimized bundle for verification.

## Notes

- Keep `src/`, `public/`, and `index.html` aligned: Vite hot-reloads them automatically while the dev server is running.
- If you hit missing tooling, check `setup.sh` in the repo root; it contains any manual prep steps the npm scripts don’t cover.
