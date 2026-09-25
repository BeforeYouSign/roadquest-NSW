# 🚗 RoadQuest NSW

**Learn the road. Beat the test. Rule your suburb.**

RoadQuest NSW is a road-rules game for 16–17 year olds getting ready for their NSW Learner licence. Players drive through NSW-inspired locations, make road-rule decisions, see what happens when they get one wrong, level up, unlock cars and compete for their suburb.

> RoadQuest NSW is an independent study game and is not affiliated with or endorsed by Transport for NSW or the NSW Government. Always consult official NSW Government resources for current road rules and licensing requirements.

---

## What's inside

- **358 questions** from the supplied Class C Driver Knowledge Test PDF, with their correct answers and source codes (CG…, IN…, SI… and so on).
- **193 diagrams and photos redrawn** as original SVG game art: intersections, roundabouts, lanes, 60+ road signs, traffic lights and driver's-eye scenes.
- **A driving simulator** (keyboard or big touch controls) with live speed zones, red lights, pedestrian crossings, STOP and GIVE WAY signs, road works, following distance and railway crossings.
- **What happens when you're wrong:** a near miss, getting pulled over or a camera flash, then *What happened? / Correct rule / Why it matters* with an animated demo of the right move.
- **An 11-location NSW journey map**, 9 licence ranks, 17 cars and hundreds of cosmetic combinations.
- **15 mini-games**, including drag-and-drop Sign Snap, tap-the-vehicle Who Goes First?, Spot the Hazard and Legal or Illegal?.
- **XP and levels**, a **Skill Rating** (Bronze up to Road Elite) and **weekly competition points**.
- **Leaderboards:** Global, This Week, Skill, XP, My Suburb and the **NSW Suburb Championship**, plus an archive of past weekly winners.
- **A daily challenge** (the same for everyone, one ranked attempt), a **weekly event**, practice tests and the **Ultimate NSW Learner Test**.
- **150 achievements** in four rarities, and a downloadable **Virtual Learner Licence** card.
- **Demo mode** that works straight away with no database.

---

## 1. Run it on your computer (optional)

You only need this if you want to try it before putting it online.

1. Install **Node.js** (choose the "LTS" version) from https://nodejs.org
2. Download this project folder and open a terminal inside it.
   - On a Mac: right-click the folder → *New Terminal at Folder*.
   - On Windows: open the folder, type `cmd` in the address bar and press Enter.
3. Type this and press Enter (it downloads everything the game needs, which takes a minute or two):
   ```
   npm install
   ```
4. Start the game:
   ```
   npm run dev
   ```
5. Open **http://localhost:3000** in your browser.

With no database set up, it runs in **DEMO MODE**. You'll see a small purple badge, and progress is saved in your browser only.

---

## 2. Put it online (GitHub + Vercel)

1. Create a free account at https://github.com and click **New repository**. Name it, for example, `roadquest-nsw`, then click **Create repository**.
2. On the new repository's page, click **uploading an existing file** and drag in **everything inside** this project folder. Don't upload a `node_modules` folder if you have one. Click **Commit changes**.
3. Create a free account at https://vercel.com and choose **Continue with GitHub**.
4. In Vercel, click **Add New… → Project**, find `roadquest-nsw` and click **Import**.
5. Leave all the settings as they are and click **Deploy**.

After about two minutes you'll have a live link. It runs in **DEMO MODE** until you complete step 3 below.

---

## 3. Turn on real accounts and leaderboards (Supabase)

### 3a. Create the database
1. Create a free account at https://supabase.com and click **New project**.
2. Give it a name and a strong database password, and choose the region **Sydney**. Click **Create new project** and wait a minute.

### 3b. Add the tables (paste the SQL)
1. In the left menu, click **SQL Editor**, then **New query**.
2. Open the file **`supabase/schema.sql`** from this project, copy **all** of it and paste it into the editor.
3. Click **Run**. You should see "Success". It's safe to run it again later.

### 3c. Allow password-free sign-in
1. In the left menu, click **Authentication**, then **Sign In / Providers** (on some dashboards it's under *Settings*).
2. Turn on **Allow anonymous sign-ins** and click **Save**.

*Optional but recommended:* turn on CAPTCHA under Authentication → Attack Protection to stop bots creating accounts.

### 3d. Copy your keys
Go to **Project Settings → API** (or **API Keys**) and copy these three values:

| Put this value… | …into this setting |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` / **publishable** key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` / **secret** key | `SUPABASE_SERVICE_ROLE_KEY` ⚠️ keep this one secret |

### 3e. Give the keys to Vercel
1. In Vercel, open your project and go to **Settings → Environment Variables**.
2. Add all three names and values from the table above.
3. Go to **Deployments**, click the **⋯** menu on the latest one and choose **Redeploy**.

The DEMO MODE badge will disappear, and players will get real accounts and global leaderboards.

*Running on your own computer instead?* Copy `.env.example` to a new file called `.env.local`, paste the three values in, and restart `npm run dev`.

---

## 4. Play-test checklist

Play through these on **a phone and a computer** after each deploy:

- [ ] The homepage loads, and both **Start your journey** and **Leaderboards** work.
- [ ] Register. An offensive username is rejected, and a taken username (try `LaneLegend` in demo mode) shows "already taken".
- [ ] Choose a starter car. The tutorial and **first drive** work: steer, indicate, stop at the STOP sign, and answer the decision point.
- [ ] "YOU'RE ON THE ROAD." appears, **FIRST DRIVE** unlocks and the map opens.
- [ ] Map: location 1 is open and the others are locked. Clear location 1 (60%+ correct) and location 2 unlocks.
- [ ] While driving, speed through a zone, run a red light and skip indicating. Each shows a consequence, then the rule.
- [ ] Get a question wrong. You see the consequence animation, then What happened / Correct rule / Why it matters.
- [ ] **Quick Drive**, **Smart Practice**, **Daily Challenge** (a replay isn't ranked), **Weekly Event** and **Practice Test** all run and show results.
- [ ] Mini-games: **Sign Snap** (drag *and* tap), **Who Goes First?**, **Spot the Hazard**, **Legal or Illegal?** and **Beat the Lights**.
- [ ] Garage: buy a paint with coins, change the plate text and switch cars.
- [ ] Leaderboards: every tab works, you're highlighted, and your real name is **never** shown.
- [ ] Profile: stats, mastery wheel, achievements and settings (mute and reduce motion).
- [ ] The phone layout has no sideways scrolling, and buttons are easy to tap.

Found a glitch? Take a screenshot, note the device and what you tapped, and fix it (or ask for help).

---

## 5. Changing the game (no coding needed)

All game content lives in **`/data`**:

| File | What it controls |
|---|---|
| `data/questions/questions.json` | Every question and answer, its diagram, difficulty and tags ([details](data/questions/README.md)) |
| `data/config/game.json` | XP values, coins, skill rating, competition points, test format and pass marks, anti-cheat limits, suburb scoring |
| `data/config/levels.json` | The 11 map locations: which rules appear in each, speed limits and driving events |
| `data/config/ranks.json` | Licence rank names and requirements |
| `data/config/minigames.json` | The 15 mini-games |
| `data/achievements/achievements.json` | 150 achievements (generated by `scripts/generate-achievements.py`) |
| `data/cars/cars.json`, `cosmetics.json` | Cars, paints, wheels, decals, plates and prices |
| `data/categories/categories.json` | Categories, colours and "Why it matters" text |

**Before going public, read `CONTENT_REVIEW.md`.** It lists questions that may be outdated or unclear, or whose diagram was recreated.

---

## 6. How it works (for the curious)

- **Tech:** Next.js (App Router), React, TypeScript, Tailwind CSS, Supabase and Vercel. All artwork is SVG or Canvas: no image files and no paid assets. Sounds are generated in code.
- **Accounts:** players never type a password. The browser gets a secure Supabase *anonymous* session tied to that device.
- **Privacy:** first names and surnames are stored in a separate private table. Only the owner can read it, and it's never shown on screen to anyone else. Leaderboards show **username + suburb** only. There is no messaging and no public text.
- **Anti-cheat:** browsers **can't write** to the database (Row Level Security plus revoked permissions). Every scoring run is started by the server, the answers are **graded again on the server**, and the server checks timing, completeness and rate limits. Daily and weekly challenges allow **one ranked attempt**. Easy questions can't be farmed for skill rating (repeat cooldown, Elo-style maths).
- **Fair suburb scoring:** the average of a suburb's top 10 active players' capped weekly points, plus a participation bonus of up to 50%. A suburb needs at least 3 active players to appear on the official ladder.
- **Weeks and days** run on Sydney time, with weeks starting on Monday. Past weekly winners are archived automatically.

### Project layout
```
app/            pages (home, map, drive, run/[mode], garage, leaderboards, profile, licence…) + api/ routes
components/     art/ (signs, scenes, cars) · drive/ (driving simulator) · game/ (QuestionEngine, consequences) · screens/ · ui/
lib/            scoring, questions, progression, store, api, time, validation, supabase helpers
data/           all editable content (see above)
supabase/       schema.sql, the database setup
tools/          scripts that rebuilt the question bank from the PDF
```

### Known limits of this first version
- A player's profile lives on the device or browser they signed up on. Clearing browser data loses access. A "link another device" feature could be added later.
- Cosmetic unlocks tied to achievements are checked in the browser. They're cosmetic only and never affect leaderboards.
- The Virtual Learner Licence is a game reward, **not a government licence**.
