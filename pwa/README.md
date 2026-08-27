# Inkbound — install and beta test

A ready-to-deploy Vite + React build of Inkbound, set up to install as a
fullscreen, landscape-locked app on your phone. Everything below is free.

---

## 1. Run it locally first (2 minutes)

You need Node 18 or newer.

```bash
npm install
npm run dev -- --host
```

Vite prints two URLs. The second one (something like `http://192.168.1.14:5173`)
works from any device on the same Wi-Fi, so you can open it on your phone
immediately without deploying anything. This is the fastest way to iterate:
edit `src/Inkbound.jsx`, save, and the phone reloads.

## 2. Put it on the internet (Git route, recommended)

Because you will be changing this constantly, connect a repo rather than
dragging files. Cloudflare builds it for you, so you do not even need Node
installed, and every branch gets its own preview URL you can open on a phone
before testers see it.

1. Push this folder to a GitHub repo.
2. Cloudflare dashboard -> Workers & Pages -> Create application -> Pages ->
   Connect to Git.
3. Framework preset: Vite. Build command `npm run build`. Output directory `dist`.
4. Deploy. Production lives at `<project>.pages.dev`; every other branch gets
   `<branch>.<project>.pages.dev` automatically.

Workflow from then on: commit to a branch, open the preview URL on your phone,
and merge to main only when it feels right. Testers on the production URL never
see a broken build.

Note: a project created by drag-and-drop cannot be converted to Git later --
you would have to make a new project. Pick Git now.

## Other free hosts

`npm run build` produces a `dist/` folder of plain static files. Any of these
will host it free, with HTTPS, which the install prompt requires:

- **Cloudflare Pages** — cloudflare.com/pages, connect a GitHub repo or drag
  the `dist` folder in. No credit card, unlimited bandwidth.
- **Netlify** — app.netlify.com/drop, literally drag `dist` onto the page. You
  get a URL in about ten seconds. No account needed for a first look.
- **GitHub Pages** — push the repo, Settings → Pages → deploy from a branch.
  `vite.config.js` already sets `base: './'` so it works from a `/repo-name/`
  subpath.
- **Vercel** — vercel.com, import the repo, framework preset "Vite".

Share that URL with anyone you want testing. That is the whole beta programme:
no signup, no invite codes, no review. When you push a change they get it on
next load.

## 3. Install it on your devices

**iPhone / iPad.** Open the URL in Safari (it must be Safari, not Chrome).
Share button → Add to Home Screen. It launches with no browser chrome, no
address bar. iOS ignores the manifest's orientation lock, which is why the
game ships its own "turn your device" screen.

**Android.** Open in Chrome. You should get an "Install app" prompt; if not,
menu → Add to Home screen. Android does honour the landscape lock, so it will
rotate itself.

**Desktop.** Chrome or Edge show an install icon in the address bar.

---

## What is different from the Claude artifact

**Saves.** The game is written against `window.storage`, which only exists
inside Claude. `src/storage.js` shims it onto `localStorage` with the same four
methods, so nothing in the game needed changing.

**The leaderboard is local-only.** In the artifact, `shared: true` writes go to
a real shared store. Here they go to the same device's localStorage, so every
tester sees only their own times. To make it genuinely shared you need a tiny
backend — the smallest free options are a Cloudflare Worker with a KV
namespace, or Supabase's free tier. You would replace the `shared === true`
branch of `src/storage.js` with `fetch` calls; the game itself does not need to
know.

**localStorage can be evicted.** iOS clears it for sites you haven't opened in
seven days. Installing to the home screen makes this much less likely, but for
a long campaign it is worth telling testers, or moving saves to IndexedDB.

## If you later want it in an actual app store

Free stops here. Wrapping this in Capacitor (`npm i @capacitor/core @capacitor/cli`,
`npx cap add ios android`) gives you real native projects pointing at the same
web build. But TestFlight requires an Apple Developer account at $99/year, and
Google Play a one-time $25. Android sideloading a debug APK to your own devices
is free if you just want it off the browser.

For beta testing on your own devices, the home-screen install is not a
compromise — it is fullscreen, it keeps the screen awake, it has an icon, and
it updates instantly.
