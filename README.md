# VaultMark 🔖

> Your personal bookmark manager + local file browser — all in one place.

Save URLs in nested folders like a real bookmark bar. Browse your local filesystem. Access it from any browser. Host it yourself.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- 📁 **Folder-based bookmarks** — nested folders with colors, just like a bookmark bar
- 🔗 **Save anything** — URLs, local file paths, network paths
- 🖥 **File browser** — browse your local filesystem, copy paths with one click
- 🔍 **Search + tags** — instant search across all bookmarks, filter by tags
- 🪟 **Windows support** — browse all drives (C:\, D:\, etc.)
- 💾 **JSON storage** — data saved in a plain `bookmarks.json` file you own
- 🔒 **Optional password** — protect with a password when hosted online
- 🌐 **Self-hostable** — run locally or deploy to Vercel/Railway/any Node host

---

## Quick Start (Local)

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/vaultmark.git
cd vaultmark

# 2. Install dependencies
npm install

# 3. Start
npm run dev

# Open http://localhost:3000
```

Your bookmarks are saved to `data/bookmarks.json` (auto-created, gitignored).

---

## Deploy to Vercel (Free)

Vercel is the easiest way to host VaultMark online and access it from anywhere.

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vaultmark.git
git push -u origin main
```

### Step 2 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Click **Deploy** (no config needed — Next.js is auto-detected)

> ⚠️ **Important:** Vercel is serverless — `data/bookmarks.json` won't persist between deployments.
> For persistent storage on Vercel, see [Persistent Storage on Vercel](#persistent-storage-on-vercel) below.

### Step 3 — Add Password Protection (optional but recommended)

In Vercel dashboard → **Settings → Environment Variables**:

```
VAULTMARK_PASSWORD = your-secret-password
```

Redeploy. Now visiting your site shows a password prompt.

---

## Deploy to Railway (Persistent, Recommended)

Railway runs a real Node.js server, so `bookmarks.json` persists normally.

1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
2. Select your repo
3. Add environment variable: `VAULTMARK_PASSWORD=your-password`
4. Railway auto-detects Next.js and deploys

Your data lives on the server and persists across deploys. ✅

---

## Deploy to a VPS (Full Control)

```bash
# On your server
git clone https://github.com/YOUR_USERNAME/vaultmark.git
cd vaultmark
npm install
npm run build

# Run with PM2 (keeps it alive)
npm install -g pm2
VAULTMARK_PASSWORD=your-password pm2 start npm --name vaultmark -- start
pm2 save
```

Use nginx as a reverse proxy to expose port 3000.

---

## Persistent Storage on Vercel

Vercel's filesystem resets on each deploy. Options:

**Option A — Use a GitHub Gist as storage** *(coming soon)*

**Option B — Switch to a database**
- Add [Vercel KV](https://vercel.com/docs/storage/vercel-kv) (Redis) — free tier available
- Change `src/lib/data.ts` to read/write from KV instead of JSON file

**Option C — Mount a volume via Railway** *(recommended)*
Railway provides persistent volumes — just use Railway instead.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VAULTMARK_PASSWORD` | *(none)* | Password to protect the app when hosted online |
| `DATA_DIR` | `./data` | Custom path for `bookmarks.json` storage |

---

## Project Structure

```
vaultmark/
├── data/                          ← auto-created, gitignored
│   └── bookmarks.json             ← your bookmark data
├── src/
│   ├── middleware.ts               ← password protection
│   ├── app/
│   │   ├── page.tsx                ← main app UI
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── login/page.tsx          ← login screen
│   │   └── api/
│   │       ├── bookmarks/route.ts  ← GET, POST bookmarks
│   │       ├── bookmarks/[id]/     ← PATCH, DELETE
│   │       ├── files/route.ts      ← local filesystem browser
│   │       └── login/route.ts      ← auth
│   ├── components/
│   │   ├── BookmarkTree.tsx        ← sidebar folder tree
│   │   ├── FileBrowser.tsx         ← local file browser
│   │   └── ItemModal.tsx           ← add/edit modal
│   └── lib/
│       └── data.ts                 ← JSON read/write + types
├── .env.example                    ← copy to .env.local
├── .gitignore
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## How to Use

### Bookmarks
- **+ Add link** — save a URL or local path into any folder
- **Folder** — create a new folder with a custom color
- Hover a folder → **+** to add a link inside it
- Hover any item → **✎** edit · **×** delete
- Click a link → opens URL or copies local path to clipboard
- **Browse** button in the add modal → pick a path from the file browser

### File Browser
- Starts at your home directory
- **🖥 This PC** button (Windows) → see all drives (C:\, D:\, etc.)
- Click folders → navigate in
- Click files → copy path to clipboard
- Click path bar → type any path directly (e.g. `D:\Projects`)
- Breadcrumb → jump to any parent folder

---

## Development

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
```

---

## License

MIT — use it however you want.
