# nihongo app 🇯🇵🌸

A kawaii Japanese learning web app built with React. Designed for students of **Minna no Nihongo** and **Basic Kanji Book 1**.

## Features

### Quizzes & Practice
- **Vocab Quiz** — test vocabulary from lessons 1–25 (JP↔RU, timed mode, endless mode)
- **Kana Quiz** — hiragana & katakana (208 characters)
- **Kanji Quiz** — kanji readings & meanings from Basic Kanji Book
- **Grammar Quiz** — test grammar patterns from each lesson
- **Te-form Quiz** — verb て-form conjugation practice
- **Particle Quiz** — は, が, を, に, で and more
- **Number Quiz** — numbers, time, dates, counters
- **Counter Quiz** — つ, 人, 本, 枚, 匹 counting words
- **Adjective Quiz** — い and な adjective conjugation
- **Conjugation Quiz** — all verb forms (て, ない, た, potential...)
- **Sentence Builder** — arrange words in correct order
- **JLPT N5 Quiz** — focused N5 certification vocabulary drill
- **Weak Words Sprint** — targeted quiz on your difficult words
- **Fill-in-the-blank** — grammar practice with blanks

### Study Tools
- **Lessons** — browse all 25 lessons with vocab & grammar
- **Kanji Study** — 108 kanji with stroke order (SVG animation), readings, examples, and visual meaning hints
- **Kanji Practice** — drawing canvas with ghost overlay and check comparison
- **Flash Cards** — flip cards for vocabulary review
- **Grammar Explorer** — search & browse all grammar patterns
- **Conjugation Reference** — complete verb conjugation tables
- **Kana Chart** — hiragana & katakana reference
- **Vocab Search** — search across all lessons
- **Reading Practice** — dialogues with comprehension questions
- **Homework** — save notes and constructions

### Games
- **Matching Game** — pair words with translations
- **Typing Challenge** — type romaji/russian as fast as you can
- **Daily Challenge** — 5 mixed questions daily with streak tracking

### Gamification
- **XP & Levels** — earn XP from quizzes, level up through 30 levels
- **Combo Multiplier** — 1.5x–2x XP for multiple quizzes per day
- **Comeback Bonus** — 2x XP when returning after 2+ days
- **Weekly Challenge** — rotating weekly goals with bonus rewards
- **54 Achievements** — badges for streaks, perfects, milestones
- **Study Timer** — daily goal tracking with progress ring
- **Streak Tracking** — daily study streak with reminders
- **Statistics** — learning analytics, trends & activity heatmap

### Design
- Pink-purple glass-morphism theme with Nunito font
- Sanrio mascots (My Melody, Kuromi, Cinnamoroll, Hello Kitty)
- Dark mode support
- Floating decorations & falling sakura
- Confetti animation for perfect scores

## Tech Stack

- **React 19** + **React Router 7** (HashRouter)
- **Vite 7** for dev & build
- All data stored in **localStorage** (no backend required)
- All styles as **inline JavaScript objects**
- Lazy-loaded pages with Suspense

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Build

```bash
npm run build
```

## Project Structure

```
src/
├── App.jsx              # routing (30+ routes)
├── main.jsx             # entry point
├── index.css            # global styles, CSS variables
├── components/          # Navbar, FloatingDeco, Confetti, XPToast, etc.
├── pages/               # 30+ page components
├── data/                # lessons, kana, kanji, stroke order data
├── hooks/               # useProgress, useXP, useAchievements, useWeeklyChallenge, etc.
└── assets/sanrio/       # mascot images
```

## Data Sources

- **Vocabulary & Grammar**: Minna no Nihongo lessons 1–25
- **Kanji**: Basic Kanji Book 1 (108 kanji, lessons 1–10)
- **Stroke Order**: KanjiVG (open-source SVG data)
- **Kana**: 208 hiragana + katakana characters

---

made with 🩷 for learning にほんご
