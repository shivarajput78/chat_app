# Dedo — a WhatsApp-style chat app

Full-stack real-time messaging app: 1-on-1 & group chat, media sharing, online/last-seen,
delivered/read ticks, typing indicators, status/stories (24h expiry), and voice/video calls (WebRTC).

```
dedo/
  server/   Node + Express + Socket.io + MongoDB (Mongoose) + Cloudinary
  client/   Next.js 14 (App Router) + Tailwind CSS + socket.io-client
```

## Features

- Email/password auth (JWT)
- 1-on-1 chats and group chats (create, rename, add/remove members)
- Real-time messaging via Socket.io
- Media sharing — images, videos, files (stored on Cloudinary)
- Typing indicators
- Online status + "last seen"
- Delivered ✓ / Read ✓✓ (blue) receipts
- Status/Stories — image, video or text, auto-expire after 24 hours, viewer tracking
- Voice & video calls (WebRTC, signaled over Socket.io) for 1-on-1 chats
- Editable profile (name, about, avatar)

**Known simplifications** (this is a learning/demo clone, not production WhatsApp):
- No end-to-end encryption.
- Delivered/read are merged into one event (real WhatsApp separates the two).
- Calls use only public STUN servers — most home/office networks work fine, but very
  restrictive corporate NATs may need a TURN server (see "Scaling further" below).
- No push notifications when the browser tab is closed.
- Group calls aren't supported, only 1-on-1.

---

## 1. Local setup

### Prerequisites
- Node.js 18+
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster
- A free [Cloudinary](https://cloudinary.com/users/register/free) account (for media uploads)

### Backend
```bash
cd server
cp .env.example .env
# fill in MONGO_URI, JWT_SECRET, CLOUDINARY_* in .env
npm install
npm run dev
```
Runs on `http://localhost:5000`.

### Frontend
```bash
cd client
cp .env.local.example .env.local
npm install
npm run dev
```
Runs on `http://localhost:3000`.

Open two browser windows (or one normal + one incognito), register two different accounts,
and start chatting.

---

## 2. Deploying for free (Render + Vercel)

This split is deliberate: Socket.io needs a long-lived server process (not a great fit for
Vercel's serverless functions), so the **backend goes on Render** and the **frontend goes on
Vercel**. Both have generous free tiers.

### Step 1 — MongoDB Atlas
1. Create a free cluster at Atlas → "Database" → "Build a Database" → M0 Free tier.
2. Under "Database Access", create a user with a password.
3. Under "Network Access", add `0.0.0.0/0` (allow access from anywhere) so Render can connect.
4. Copy the connection string (Connect → "Drivers") — it looks like
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/dedo`.

### Step 2 — Cloudinary
1. Sign up, then from the Dashboard copy your **Cloud name**, **API key**, and **API secret**.

### Step 3 — Push this project to GitHub
```bash
cd dedo
git init
git add .
git commit -m "Dedo - initial commit"
# create a new repo on GitHub, then:
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 4 — Backend on Render
1. Go to [render.com](https://render.com) → New → Web Service → connect your GitHub repo.
2. Root directory: `server`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables (from your `.env`):
   - `MONGO_URI`
   - `JWT_SECRET`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `CLIENT_URL` — set this **after** step 5, once you know your Vercel URL (e.g.
     `https://dedo.vercel.app`). You can redeploy after adding it.
6. Deploy. Render gives you a URL like `https://dedo-server.onrender.com`.

> Free Render web services sleep after inactivity and take ~30–60s to wake up on the first
> request — normal for the free tier, not a bug.

### Step 5 — Frontend on Vercel
1. Go to [vercel.com](https://vercel.com) → New Project → import the same GitHub repo.
2. Root directory: `client`
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = your Render URL (e.g. `https://dedo-server.onrender.com`)
   - `NEXT_PUBLIC_SOCKET_URL` = same Render URL
4. Deploy. Vercel gives you a URL like `https://dedo.vercel.app`.
5. Go back to Render and set `CLIENT_URL` to this Vercel URL, then redeploy the backend
   (needed so CORS and Socket.io allow requests from your frontend's real domain).

That's it — visit your Vercel URL, register a couple of accounts, and test it end to end.

---

## 3. Scaling further (optional, not required to run the app)

- **TURN server for calls**: if voice/video calls fail to connect on some networks, add a TURN
  server (e.g. a free tier from Metered or Twilio) to the `ICE_SERVERS` list in
  `client/components/CallModal.js`.
- **Push notifications**: add a service worker + Web Push (or FCM) so messages arrive even when
  the tab isn't open.
- **Read/delivered split**: emit a "delivered" event the instant `receive_message` reaches a
  client (regardless of which chat is open), separate from "read" which only fires when that
  chat is actually opened.
- **Contacts model**: the status/stories feed currently shows every user's status; add a
  contacts list to scope it to people you actually know.
