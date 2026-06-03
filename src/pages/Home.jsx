import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { loadDifficultWords, saveDifficultWords } from '../hooks/useWordTracker'
import { kanaToRomaji } from '../utils/kanaToRomaji'
import { strokeData } from '../data/strokeOrder'
import { lessons } from '../data/lessons'
import { kanji } from '../data/kanji'
import { useProgress } from '../hooks/useProgress'
import { useUnlockedLessons } from '../hooks/useUnlockedLessons'
import { useStudyTimer } from '../hooks/useStudyTimer'
import { useXP } from '../hooks/useXP'
import { useAchievements } from '../hooks/useAchievements'
import { useWeeklyChallenge } from '../hooks/useWeeklyChallenge'
import { useIsMobile } from '../hooks/useIsMobile'
import { useTheme } from '../hooks/useTheme'
import { useCoins } from '../hooks/useCoins'
import { copyTextToClipboard } from '../utils/clipboard'
import { getStoredBkbUnlocked, getStoredJson, getStoredNonNegativeInt, getStoredString, setStoredJson, setStoredString } from '../utils/localSettings'
import myMelody1 from '../assets/sanrio/my-melody-1.png'
import myMelody2 from '../assets/sanrio/my-melody-2.png'
import kuromi1 from '../assets/sanrio/kuromi-1.png'
import kuromi2 from '../assets/sanrio/kuromi-2.png'
import kuromi3 from '../assets/sanrio/kuromi-3.png'
import myMelody3 from '../assets/sanrio/my-melody-3.png'
import helloKitty1 from '../assets/sanrio/hello-kitty-1.png'
import helloKitty2 from '../assets/sanrio/hello-kitty-2.png'
import helloKitty3 from '../assets/sanrio/hello-kitty-3.png'
import cinnamoroll1 from '../assets/sanrio/cinnamoroll-1.png'
import cinnamoroll2 from '../assets/sanrio/cinnamoroll-2.png'
import cinnamoroll3 from '../assets/sanrio/cinnamoroll-3.png'
import pompompurin1 from '../assets/sanrio/pompompurin-1.png'
import pompompurin2 from '../assets/sanrio/pompompurin-2.png'
import pompompurin3 from '../assets/sanrio/pompompurin-3.png'
import keroppi1 from '../assets/sanrio/keroppi-1.png'
import keroppi2 from '../assets/sanrio/keroppi-2.png'
import keroppi3 from '../assets/sanrio/keroppi-3.png'
import littleTwinStars1 from '../assets/sanrio/little-twin-stars-1.png'
import littleTwinStars2 from '../assets/sanrio/little-twin-stars-2.png'
import littleTwinStars3 from '../assets/sanrio/little-twin-stars-3.png'
import pochacco1 from '../assets/sanrio/pochacco-1.png'
import pochacco2 from '../assets/sanrio/pochacco-2.png'
import pochacco3 from '../assets/sanrio/pochacco-3.png'
import { prefersReducedMotion as getPrefersReducedMotion } from '../utils/motion'

const prefersReducedMotion = getPrefersReducedMotion()

function getDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseValidDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function toDateStringSafe(value) {
  return parseValidDate(value)?.toDateString() || null
}

// --- Schedule helpers ---
const SCHEDULE_KEY = 'nihongo-schedule-data'
const OVERRIDES_KEY = 'nihongo-schedule-overrides'
const SCHEDULE_DEFAULTS = { days: [1, 3], time: '18:00', emoji: '📚' }
const DAY_NAMES_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
const DAY_LABELS_ORDERED = [
  { idx: 1, label: 'пн' }, { idx: 2, label: 'вт' }, { idx: 3, label: 'ср' },
  { idx: 4, label: 'чт' }, { idx: 5, label: 'пт' }, { idx: 6, label: 'сб' }, { idx: 0, label: 'вс' },
]

function loadScheduleData() {
  const parsed = getStoredJson(SCHEDULE_KEY, null)
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return { ...SCHEDULE_DEFAULTS, ...parsed }
  }
  return { ...SCHEDULE_DEFAULTS }
}

function loadOverrides() {
  const parsed = getStoredJson(OVERRIDES_KEY, {})
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
}
function saveOverrides(data) { setStoredJson(OVERRIDES_KEY, data) }

function formatScheduleNote(data) {
  const dayStr = (data.days || [1, 5]).map(d => DAY_NAMES_SHORT[d]).join(' & ')
  return `${dayStr} ~ ${data.time || '16:15'} ${data.emoji || '🇯🇵'}`
}

function parseScheduleTime(timeStr) {
  const [h, m] = (timeStr || '16:15').split(':')
  return { hour: parseInt(h, 10) || 16, minute: parseInt(m, 10) || 15 }
}

function getNextLessonDate(days, hour, minute, overrides = {}) {
  const lessonDays = days || [1, 5]
  const h = hour ?? 16
  const m = minute ?? 15
  const now = new Date()

  // Build set of cancelled original dates
  const cancelledDates = new Set(Object.entries(overrides).filter(([, o]) => o.cancelled).map(([k]) => k))
  // Build extra dates from reschedules (newDate entries)
  const rescheduledTo = {} // newDate -> { time, note }
  Object.values(overrides).forEach(o => {
    if (o.newDate && !o.cancelled) rescheduledTo[o.newDate] = o
  })

  for (let offset = 0; offset < 14; offset++) {
    const d = new Date(now)
    d.setDate(d.getDate() + offset)
    const key = getDateKey(d)

    // Skip cancelled lessons
    if (cancelledDates.has(key)) continue

    const reschedOverride = rescheduledTo[key] // this date is a reschedule-to target
    const isRegularLesson = lessonDays.includes(d.getDay())

    if (reschedOverride || isRegularLesson) {
      const localDayOfWeek = d.getDay()
      const localDate = d.getDate()
      const localMonth = d.getMonth()
      const timeStr = reschedOverride?.time || `${h}:${String(m).padStart(2,'0')}`
      const { hour: hour2, minute: minute2 } = parseScheduleTime(timeStr)
      d.setHours(hour2, minute2, 0, 0)
      if (d > now) return { date: d, hour: hour2, minute: minute2, override: reschedOverride, localDayOfWeek, localDate, localMonth }
    }
  }
  return null
}

function formatNextLesson(result, emoji = '🇯🇵') {
  if (!result) return 'no upcoming'
  const { date, hour, minute, override, localDayOfWeek, localDate, localMonth } = result
  const days = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
  const dayName = days[localDayOfWeek]
  const d = localDate
  const m = months[localMonth]
  const timeStr = `${hour}:${String(minute).padStart(2, '0')}`

  const now = new Date()
  const diffMs = date - now
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMins = Math.floor((diffMs / (1000 * 60)) % 60)

  let countdown = ''
  if (diffHours < 24) {
    countdown = diffHours > 0 ? ` (через ${diffHours}ч ${diffMins}м)` : ` (через ${diffMins}м)`
  }

  const note = override?.note ? ` ⚠️` : ''
  return `${dayName}, ${d} ${m} ${timeStr} ${emoji}${countdown}${note}`
}

// Japanese proverbs for daily motivation
const proverbs = [
  { jp: '七転び八起き', romaji: 'nana korobi ya oki', ru: 'упал семь раз — встань восемь', context: 'Говорят в поддержку тому, кто переживает неудачи и не сдаётся. Это кредо японцев: важна не победа, а способность подниматься снова.' },
  { jp: '継続は力なり', romaji: 'keizoku wa chikara nari', ru: 'постоянство — это сила', context: 'О том, что регулярные занятия важнее таланта. Именно поэтому японцы учатся каждый день понемногу — не рывками, а стабильно.' },
  { jp: '千里の道も一歩から', romaji: 'senri no michi mo ippo kara', ru: 'путь в тысячу ри начинается с одного шага', context: 'Когда цель кажется недостижимой. Аналог нашего «дорогу осилит идущий». Главное — сделать первый маленький шаг.' },
  { jp: '石の上にも三年', romaji: 'ishi no ue ni mo sannen', ru: 'три года на холодном камне', context: 'Говорят тем, кто хочет бросить трудное дело. Буквально: если сидеть на холодном камне три года — он нагреется. Терпение побеждает всё.' },
  { jp: '塵も積もれば山となる', romaji: 'chiri mo tsumoreba yama to naru', ru: 'и пыль, накопившись, станет горой', context: 'Каждое малое усилие имеет значение. Учить 5 слов в день — через год будет гора знаний. Аналог нашего «капля камень точит».' },
  { jp: '習うより慣れよ', romaji: 'narau yori nareyo', ru: 'лучше привыкнуть, чем учиться', context: 'Лучший учитель — практика. Говорят тем, кто читает учебники, но не говорит. Меньше теории, больше живого языка!' },
  { jp: '失敗は成功のもと', romaji: 'shippai wa seikou no moto', ru: 'неудача — основа успеха', context: 'Японский аналог «не ошибается тот, кто ничего не делает». Говорят после провала — как мотивацию пробовать снова без стыда.' },
  { jp: '案ずるより産むが易し', romaji: 'anzuru yori umu ga yasushi', ru: 'рожать легче, чем беспокоиться', context: 'Буквально: родить легче, чем тревожиться о родах. Говорят, когда кто-то слишком долго боится начать. Наш аналог: «глаза боятся, руки делают».' },
  { jp: '花より団子', romaji: 'hana yori dango', ru: 'лучше данго, чем цветы', context: 'Данго — рисовые шарики, которые едят на ханами. Говорят иронично о том, кто предпочитает практичное красивому. Пришёл любоваться цветами — думает о еде.' },
  { jp: '一期一会', romaji: 'ichigo ichie', ru: 'одна жизнь, одна встреча', context: 'Из дзен-буддизма и чайной церемонии. Каждая встреча уникальна и не повторится. Японцы применяют её ко всему — встречам с людьми, путешествиям, моментам жизни.' },
  { jp: '猿も木から落ちる', romaji: 'saru mo ki kara ochiru', ru: 'и обезьяна падает с дерева', context: 'Говорят, когда опытный человек ошибается. Аналог «и на старуху бывает проруха». Никто не застрахован от промахов — даже мастер.' },
  { jp: '雨降って地固まる', romaji: 'ame futte ji katamaru', ru: 'после дождя земля крепчает', context: 'После конфликта или трудности отношения становятся крепче. Японцы говорят это, когда ссора оказывается точкой роста. Аналог: «всё, что нас не убивает, делает нас сильнее».' },
  { jp: '初心忘るべからず', romaji: 'shoshin wasuru bekarazu', ru: 'не забывай начального настроя', context: 'Помни, с каким вдохновением ты начинал. Особенно важно в традиционных искусствах — каллиграфии, боевых искусствах, чайной церемонии. И, конечно, при изучении языка.' },
  { jp: '笑う門には福来る', romaji: 'warau kado ni wa fuku kitaru', ru: 'в смеющийся дом приходит счастье', context: 'Японский аналог «смех — лучшее лекарство». Говорят в знак пожелания: улыбайся, сохраняй лёгкость — и удача не заставит себя ждать.' },
  { jp: '急がば回れ', romaji: 'isogaba maware', ru: 'поспешишь — езжай в обход', context: 'Когда спешишь, надёжный путь лучше короткого. Аналог «тише едешь — дальше будешь». При изучении языка: не пропускай основы ради скорости.' },
  { jp: '好きこそ物の上手なれ', romaji: 'suki koso mono no jouzu nare', ru: 'в чём любовь — в том и мастерство', context: 'Лучшими становятся те, кто любит своё дело. Если изучаешь японский с душой — ты уже на верном пути к мастерству.' },
  { jp: '百聞は一見にしかず', romaji: 'hyakubun wa ikken ni shikazu', ru: 'сто слышаний хуже одного взгляда', context: 'Лучше один раз увидеть, чем сто раз услышать. Смотри дорамы, аниме, читай — живой язык лучше учебника.' },
  { jp: '明日は明日の風が吹く', romaji: 'ashita wa ashita no kaze ga fuku', ru: 'завтра подует ветер завтрашнего дня', context: 'Не беспокойся о том, что будет. Живи настоящим. Не пугайся будущих сложных уроков — сосредоточься на сегодняшнем.' },
  { jp: '知らぬが仏', romaji: 'shiranu ga hotoke', ru: 'не знаешь — спокоен, как Будда', context: 'Незнание бывает блаженством. Иногда лучше не знать о трудностях заранее — просто идти вперёд и учиться.' },
  { jp: '出る杭は打たれる', romaji: 'deru kui wa utareru', ru: 'торчащий гвоздь забивают', context: 'О японской культуре коллективизма. Но в учёбе — не бойся задавать вопросы, даже если кажется, что «все это знают».' },
  { jp: '目は口ほどに物を言う', romaji: 'me wa kuchi hodo ni mono wo iu', ru: 'глаза говорят не меньше рта', context: 'Невербальная коммуникация очень важна в Японии. Учись слушать не только слова — читай контекст и интонацию.' },
  { jp: '三人寄れば文殊の知恵', romaji: 'sannin yoreba monju no chie', ru: 'трое вместе — мудрость бодхисаттвы', context: 'Три головы лучше одной. Учись с другими — в разговорной практике, в языковом обмене, в группе.' },
  { jp: '朱に交われば赤くなる', romaji: 'shu ni majiwareba akaku naru', ru: 'с киноварью поживёшь — покраснеешь', context: 'Окружение формирует человека. Окружи себя японским языком и культурой — и результат не заставит ждать.' },
  { jp: '芸は身を助ける', romaji: 'gei wa mi wo tasukeru', ru: 'умение поможет в жизни', context: 'Любой освоенный навык не пропадёт. Японский язык, который ты учишь сейчас, однажды откроет новые двери.' },
  { jp: '転んでもただでは起きない', romaji: 'koronde mo tada de wa okinai', ru: 'упав — не вставай с пустыми руками', context: 'Каждая ошибка — это урок. После неправильного ответа ты запомнишь слово гораздо лучше.' },
  { jp: '虎穴に入らずんば虎子を得ず', romaji: 'koketsu ni irazunba koji wo ezu', ru: 'не войдёшь в логово тигра — не поймаешь тигрёнка', context: 'Без риска нет результата. Говори по-японски, даже если страшно ошибиться — только так осваивается язык.' },
  { jp: '言わぬが花', romaji: 'iwanu ga hana', ru: 'не говорить — красивее', context: 'Иногда молчание красивее слов. В японской культуре недосказанность ценится как искусство — именно это делает японский таким богатым.' },
  { jp: '情けは人の為ならず', romaji: 'nasake wa hito no tame narazu', ru: 'доброта возвращается к тебе', context: 'Добро, сделанное другим, возвращается. Помоги кому-то с японским — и это укрепит твои знания тоже.' },
  { jp: '親しき仲にも礼儀あり', romaji: 'shitashiki naka ni mo reigi ari', ru: 'даже среди близких нужна вежливость', context: 'Японцы соблюдают этикет даже с ближайшими. Это объясняет, почему в японском столько уровней вежливости.' },
  { jp: '一日一善', romaji: 'ichinichi ichizen', ru: 'одно доброе дело в день', context: 'Делай что-то хорошее каждый день. В учёбе — одно новое слово или конструкция в день за год создаёт гору знаний.' },
  { jp: '花は桜木', romaji: 'hana wa sakuragi', ru: 'среди цветов — вишня', context: 'Сакура — символ красоты и мимолётности. Японцы ценят уникальность каждого момента. Каждый день учёбы — это уникальный цветок.' },
  { jp: '縁の下の力持ち', romaji: 'en no shita no chikaramochi', ru: 'силач под полом (незаметный труд)', context: 'О тех, кто работает за кулисами без признания. Ежедневная учёба — именно такой скрытый труд, который накапливается в знания.' },
  { jp: '井の中の蛙大海を知らず', romaji: 'i no naka no kawazu taikai wo shirazu', ru: 'лягушка в колодце не знает великого океана', context: 'Об ограниченном кругозоре. При изучении языка напоминает: за пределами учебника — огромный живой мир японского. Выходи за рамки и исследуй.' },
  { jp: '郷に入っては郷に従え', romaji: 'gou ni itte wa gou ni shitagae', ru: 'войдёшь в деревню — следуй её обычаям', context: 'Японский аналог «в чужой монастырь со своим уставом не ходят». В Японии очень ценится умение приспосабливаться к контексту — и в языке тоже.' },
]

function getDailyProverb() {
  if (proverbs.length === 0) return null
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate() + 99
  return proverbs[seed % proverbs.length]
}

// deterministic daily grammar pattern (seeded by date)
function getDailyGrammar(lessonPool) {
  const allGrammar = lessonPool.flatMap(l => (l.grammar || []).map(g => ({ ...g, lessonId: l.id })))
  if (allGrammar.length === 0) return null
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate() + 77
  return allGrammar[seed % allGrammar.length]
}

// deterministic daily word (seeded by date + optional offset for refresh)
function getDailyWord(lessonPool, offset = 0) {
  const allWords = lessonPool.flatMap(l => l.vocabulary)
  if (allWords.length === 0) return null
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const index = (seed + offset) % allWords.length
  return allWords[index]
}

// deterministic daily kanji (only from unlocked BKB lessons)
function getBkbUnlocked() {
  return getStoredBkbUnlocked()
}

function getDailyKanji() {
  const bkbUnlocked = getBkbUnlocked()
  const pool = kanji.filter(k => (k.lesson || 1) <= bkbUnlocked)
  if (pool.length === 0) return null
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate() + 42
  return pool[seed % pool.length]
}

// spaced repetition: find lessons needing review
function getReviewSuggestions(progress) {
  const { vocabQuizzes, grammarQuizzes = [], lessonsViewed } = progress
  const lessonQuizzes = [...vocabQuizzes, ...grammarQuizzes]
  const now = Date.now()
  const suggestions = []

  // for each viewed lesson, find last quiz and best score
  for (const lessonId of lessonsViewed) {
    const quizzes = lessonQuizzes.filter(q => q.lessons && q.lessons.includes(lessonId))
    if (quizzes.length === 0) {
      // viewed but never quizzed
      suggestions.push({ lessonId, reason: 'never quizzed', priority: 3, emoji: '❓' })
      continue
    }

    const lastQuiz = quizzes[quizzes.length - 1]
    const lastQuizDate = parseValidDate(lastQuiz.date)
    const daysSince = lastQuizDate
      ? Math.floor((now - lastQuizDate.getTime()) / (1000 * 60 * 60 * 24))
      : Infinity
    const bestScore = Math.max(...quizzes.map(q => q.total > 0 ? Math.round((q.score / q.total) * 100) : 0))

    // spaced repetition intervals based on score
    let interval = 1
    if (bestScore >= 95) interval = 14
    else if (bestScore >= 85) interval = 7
    else if (bestScore >= 70) interval = 3
    else if (bestScore >= 50) interval = 2

    if (daysSince >= interval) {
      if (bestScore < 70) {
        suggestions.push({ lessonId, reason: 'low score', score: bestScore, daysSince, priority: 2, emoji: '📉' })
      } else {
        suggestions.push({ lessonId, reason: 'time to review', daysSince, priority: 1, emoji: '🔄' })
      }
    }
  }

  // sort by priority (higher = more urgent)
  return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 4)
}

// check if daily challenge is completed today
function isDailyChallengeCompleted() {
  const data = getStoredJson('nihongo-daily-challenge', null)
  if (!data || typeof data !== 'object') return false
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  return data.lastSeed === seed && data.completed
}

// count difficult words from localStorage
function getDifficultWordsCount() {
  const parsed = getStoredJson('nihongo-difficult-words', [])
  return Array.isArray(parsed) ? parsed.length : 0
}

const DAY_JP = [
  { jp: '日曜日', romaji: 'nichiyōbi', ru: 'воскресенье' },
  { jp: '月曜日', romaji: 'getsuyōbi', ru: 'понедельник' },
  { jp: '火曜日', romaji: 'kayōbi', ru: 'вторник' },
  { jp: '水曜日', romaji: 'suiyōbi', ru: 'среда' },
  { jp: '木曜日', romaji: 'mokuyōbi', ru: 'четверг' },
  { jp: '金曜日', romaji: 'kin\'yōbi', ru: 'пятница' },
  { jp: '土曜日', romaji: 'doyōbi', ru: 'суббота' },
]

function getTodayJp() {
  return DAY_JP[new Date().getDay()]
}

// time-based greeting
function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return {
    jp: 'おはようございます!',
    romaji: 'ohayou gozaimasu!',
    ru: 'доброе утро!',
    ru2: 'давай учить японский 🌅',
    emoji: '☀️',
  }
  if (hour >= 12 && hour < 17) return {
    jp: 'こんにちは!',
    romaji: 'konnichiwa!',
    ru: 'добрый день!',
    ru2: 'время учиться 🌸',
    emoji: '🌤️',
  }
  if (hour >= 17 && hour < 22) return {
    jp: 'こんばんは!',
    romaji: 'konbanwa!',
    ru: 'добрый вечер!',
    ru2: 'немного японского? 🌙',
    emoji: '🌆',
  }
  return {
    jp: 'おやすみ~',
    romaji: 'oyasumi~',
    ru: 'ночная учёба?',
    ru2: 'すごい! 🌟',
    emoji: '🌙',
  }
}

const mascots = [
  { src: myMelody1, alt: 'My Melody' },
  { src: cinnamoroll1, alt: 'Cinnamoroll' },
  { src: pompompurin1, alt: 'Pompompurin' },
  { src: kuromi1, alt: 'Kuromi' },
  { src: keroppi1, alt: 'Keroppi' },
  { src: myMelody2, alt: 'My Melody' },
  { src: cinnamoroll2, alt: 'Cinnamoroll' },
  { src: pompompurin2, alt: 'Pompompurin' },
  { src: kuromi2, alt: 'Kuromi' },
  { src: keroppi2, alt: 'Keroppi' },
  { src: littleTwinStars1, alt: 'Little Twin Stars' },
  { src: kuromi3, alt: 'Kuromi' },
  { src: myMelody3, alt: 'My Melody' },
  { src: pompompurin3, alt: 'Pompompurin' },
  { src: helloKitty1, alt: 'Hello Kitty' },
  { src: keroppi3, alt: 'Keroppi' },
  { src: littleTwinStars2, alt: 'Little Twin Stars' },
  { src: pochacco1, alt: 'Pochacco' },
  { src: helloKitty2, alt: 'Hello Kitty' },
  { src: pochacco2, alt: 'Pochacco' },
  { src: littleTwinStars3, alt: 'Little Twin Stars' },
  { src: pochacco3, alt: 'Pochacco' },
  { src: helloKitty3, alt: 'Hello Kitty' },
  { src: cinnamoroll3, alt: 'Cinnamoroll' },
]

function DailyWordCard({ word, onRefresh }) {
  const isMobile = useIsMobile()
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef(null)
  useEffect(() => () => clearTimeout(copyTimerRef.current), [])
  const [isDifficult, setIsDifficult] = useState(() => {
    const stripBr = s => (s || '').replace(/\[.*?\]/g, '').trim()
    const dw = loadDifficultWords()
    return dw.some(d =>
      stripBr(d.japanese) === stripBr(word.japanese) && stripBr(d.romaji) === stripBr(word.romaji) &&
      (d.lesson == null || word.lesson == null || d.lesson === word.lesson)
    )
  })

  const handleCopy = (e) => {
    e.stopPropagation()
    const text = `${word.kanji || word.japanese.replace(/\[.*?\]/g, '').trim()} (${(word.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}) — ${word.russian}`
    copyTextToClipboard(text).then((success) => {
      if (!success) return
      setCopied(true)
      clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopied(false), 1500)
    })
  }

  const handleToggleDifficult = (e) => {
    e.stopPropagation()
    const stripBr = s => (s || '').replace(/\[.*?\]/g, '').trim()
    const current = loadDifficultWords()
    const idx = current.findIndex(d =>
      stripBr(d.japanese) === stripBr(word.japanese) && stripBr(d.romaji) === stripBr(word.romaji) &&
      (d.lesson == null || word.lesson == null || d.lesson === word.lesson)
    )
    if (idx >= 0) {
      current.splice(idx, 1)
      setIsDifficult(false)
    } else {
      current.push({
        japanese: word.japanese,
        kanji: word.kanji,
        romaji: word.romaji,
        russian: word.russian,
        lesson: word.lesson,
        source: 'daily',
        missCount: 1,
        hitCount: 0,
        addedAt: new Date().toISOString(),
        lastMissed: new Date().toISOString(),
      })
      setIsDifficult(true)
    }
    saveDifficultWords(current)
  }

  return (
    <div
      className="glass-sm glass-hover"
      style={{ ...styles.dailyCard, cursor: 'pointer' }}
      onClick={() => setRevealed(r => !r)}
      role="button"
      tabIndex={0}
      aria-expanded={revealed}
      aria-label="word of the day card — click to reveal"
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRevealed(r => !r) } }}
    >
      <div style={styles.dailyLabel}>word of the day</div>
      <div style={{ ...styles.dailyJp, ...(isMobile ? { fontSize: '1.75rem' } : {}) }}>{word.kanji || word.japanese.replace(/\[.*?\]/g, '').trim()}</div>
      {word.kanji && <div style={styles.dailyKanjiSmall}>{word.japanese.replace(/\[.*?\]/g, '').trim()}</div>}
      {revealed ? (
        <>
          <div style={styles.dailyRomaji}>{(word.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}</div>
          <div style={styles.dailyRu}>{word.russian}</div>
          <div style={styles.dailyCopyRow}>
            {word.lesson && (
              <Link to={`/lessons/${word.lesson}`} style={{ ...styles.dailyLessonTag, textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
                lesson {word.lesson} →
              </Link>
            )}
            <button onClick={handleToggleDifficult} className="btn-hover" style={{ ...styles.dailyCopyBtn, color: isDifficult ? '#f472b6' : 'rgba(192,132,252,0.6)' }} title={isDifficult ? 'убрать из сложных' : 'добавить в сложные'} aria-label={isDifficult ? 'убрать из сложных' : 'добавить в сложные'}>
              {isDifficult ? '★' : '☆'}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onRefresh?.() }} className="btn-hover" style={styles.dailyCopyBtn} title="другое слово" aria-label="другое слово">
              🔀
            </button>
            <button onClick={handleCopy} className="btn-hover" style={styles.dailyCopyBtn} aria-label={copied ? 'copied' : 'copy word'}>
              {copied ? '✅' : '📋'}
            </button>
          </div>
        </>
      ) : (
        <div style={styles.dailyTapHint}>tap to reveal</div>
      )}
    </div>
  )
}

function DailyKanjiCard({ kanji: k }) {
  const isMobile = useIsMobile()
  const [revealed, setRevealed] = useState(false)
  return (
    <div
      className="glass-sm glass-hover"
      style={{ ...styles.dailyCard, cursor: 'pointer' }}
      onClick={() => setRevealed(r => !r)}
      role="button"
      tabIndex={0}
      aria-expanded={revealed}
      aria-label="kanji of the day card — click to reveal"
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRevealed(r => !r) } }}
    >
      <div style={styles.dailyLabel}>kanji of the day</div>
      <div style={{ ...styles.dailyKanjiChar, ...(isMobile ? { fontSize: '2.2rem' } : {}) }}>{k.kanji}</div>
      {revealed ? (
        <>
          <div style={styles.dailyRomaji}>
            {k.kun} / {k.on}
            {(k.kun || k.on) && (() => {
              const kunRm = kanaToRomaji(k.kun)
              const onRm = kanaToRomaji(k.on)
              const rm = [kunRm, onRm].filter(Boolean).join(' · ')
              return rm ? <span style={{ display: 'block', fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-light)', marginTop: 2 }}>{rm}</span> : null
            })()}
          </div>
          <div style={styles.dailyRu}>{k.meaning}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 6, flexWrap: 'wrap' }}>
            {k.lesson && (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', background: 'rgba(168,85,247,0.1)', padding: '2px 8px', borderRadius: 50 }}>
                BKB L{k.lesson}
              </span>
            )}
            {strokeData[k.kanji]?.strokes && (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', opacity: 0.7 }}>
                {strokeData[k.kanji].strokes}画
              </span>
            )}
            <Link to={`/kanji?kanji=${encodeURIComponent(k.kanji)}`} style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textDecoration: 'none', marginLeft: 'auto' }} onClick={(e) => e.stopPropagation()}>
              study →
            </Link>
          </div>
        </>
      ) : (
        <div style={styles.dailyTapHint}>tap to reveal</div>
      )}
    </div>
  )
}

function formatReschedDate(dateKey) {
  if (!dateKey) return ''
  const [y, m, d] = dateKey.split('-').map(Number)
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
  const days = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
  const date = new Date(y, m - 1, d)
  return `${days[date.getDay()]}, ${d} ${months[m - 1]}`
}

function StudyCalendar({ progress, scheduleData, onScheduleChange, overrides, onOverrideChange }) {
  const isMobile = useIsMobile()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(null)
  const [rescheduling, setRescheduling] = useState(null) // YYYY-MM-DD key or null
  const [reschedDraft, setReschedDraft] = useState({ newDate: '', time: '', note: '', cancelled: false })
  const [monthOffset, setMonthOffset] = useState(0) // 0 = current month, 1 = next, -1 = prev

  const openEditor = () => { setDraft({ ...scheduleData }); setEditing(true) }
  const cancelEditor = () => setEditing(false)
  const saveEditor = () => {
    if (onScheduleChange) onScheduleChange(draft)
    setEditing(false)
  }
  const toggleDay = (idx) => {
    setDraft(d => {
      const has = d.days.includes(idx)
      const next = has ? d.days.filter(x => x !== idx) : [...d.days, idx].sort((a, b) => {
        // sort Mon–Sun order (1,2,3,4,5,6,0)
        const order = [1,2,3,4,5,6,0]
        return order.indexOf(a) - order.indexOf(b)
      })
      return { ...d, days: next.length ? next : d.days } // prevent empty
    })
  }

  const openReschedule = (dateKey) => {
    const existing = (overrides || {})[dateKey] || {}
    setReschedDraft({
      newDate: existing.newDate || '',
      time: existing.time || scheduleData.time || '',
      note: existing.note || '',
      cancelled: !!existing.cancelled,
    })
    setRescheduling(dateKey)
  }

  const saveReschedule = () => {
    if (!rescheduling) return
    const next = { ...(overrides || {}) }
    if (reschedDraft.cancelled || reschedDraft.newDate) {
      next[rescheduling] = {
        newDate: reschedDraft.newDate,
        time: reschedDraft.time,
        note: reschedDraft.note,
        cancelled: reschedDraft.cancelled,
      }
    } else {
      delete next[rescheduling]
    }
    if (onOverrideChange) onOverrideChange(next)
    setRescheduling(null)
  }

  const deleteOverride = () => {
    const next = { ...(overrides || {}) }
    delete next[rescheduling]
    if (onOverrideChange) onOverrideChange(next)
    setRescheduling(null)
  }

  // Build a map: dateKey → override info (also marks reschedule targets)
  const overrideMap = useMemo(() => {
    const map = {}
    Object.entries(overrides || {}).forEach(([k, o]) => {
      map[k] = { ...o, origKey: k }
    })
    Object.entries(overrides || {}).forEach(([k, o]) => {
      if (o.newDate && !o.cancelled) {
        map[o.newDate] = { ...(map[o.newDate] || {}), isRescheduledTarget: true, origKey: k, reschedTime: o.time }
      }
    })
    return map
  }, [overrides])

  const note = formatScheduleNote(scheduleData)
  const lessonDays = scheduleData.days || [1, 5]

  const now = new Date()
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const isCurrentMonth = monthOffset === 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const startOffset = (firstDayOfWeek + 6) % 7
  const monthNames = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']

  const studyDays = useMemo(() => {
    const days = new Set()
    const allQuizzes = [
      ...progress.vocabQuizzes,
      ...progress.kanaQuizzes,
      ...(progress.kanjiQuizzes || []),
      ...(progress.grammarQuizzes || []),
    ]
    allQuizzes.forEach(q => {
      const d = parseValidDate(q.date)
      if (d && d.getMonth() === month && d.getFullYear() === year) days.add(d.getDate())
    })
    return days
  }, [progress, month, year])

  const today = isCurrentMonth ? now.getDate() : -1
  const dayLabels = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']

  const inputStyle = { padding: '5px 8px', borderRadius: 8, border: '1.5px solid rgba(192,132,252,0.35)', background: 'var(--glass-bg)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'inherit', outline: 'none' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
        <button
          onClick={() => setMonthOffset(o => o - 1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-light)', padding: '2px 6px', minHeight: 44, minWidth: 44, borderRadius: 8, lineHeight: 1 }}
          aria-label="previous month"
        >‹</button>
        <div style={{ ...calStyles.monthLabel, marginBottom: 0, minWidth: 100, textAlign: 'center' }}>
          {monthNames[month]}{year !== now.getFullYear() ? ` ${year}` : ''}
        </div>
        <button
          onClick={() => setMonthOffset(o => o + 1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-light)', padding: '2px 6px', minHeight: 44, minWidth: 44, borderRadius: 8, lineHeight: 1 }}
          aria-label="next month"
        >›</button>
        {monthOffset !== 0 && (
          <button
            onClick={() => setMonthOffset(0)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: '#f472b6', padding: '2px 5px', fontFamily: 'inherit', fontWeight: 700, minHeight: 44, borderRadius: 8 }}
          >сегодня</button>
        )}
      </div>

      {/* schedule note row */}
      {!editing && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 8 }}>
          <span style={calStyles.calNote}>{note}</span>
          {onScheduleChange && (
            <button onClick={openEditor} title="изменить расписание" aria-label="изменить расписание"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--text-light)', padding: '1px 3px', opacity: 0.55, lineHeight: 1, minHeight: 44, minWidth: 44 }}>✏️</button>
          )}
        </div>
      )}

      {/* inline schedule editor */}
      {editing && draft && (
        <div style={{ background: 'rgba(192,132,252,0.07)', borderRadius: 12, padding: '10px 10px 8px', marginBottom: 10, border: '1px solid rgba(192,132,252,0.18)' }}>
          {/* day toggles */}
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5, textAlign: 'center' }}>дни занятий</div>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            {DAY_LABELS_ORDERED.map(({ idx, label }) => {
              const active = draft.days.includes(idx)
              return (
                <button key={idx} onClick={() => toggleDay(idx)}
                  style={{ padding: '4px 8px', borderRadius: 20, border: '1.5px solid rgba(192,132,252,0.3)', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', minHeight: 44,
                    background: active ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.08)',
                    color: active ? 'white' : 'var(--text-secondary)' }}>
                  {label}
                </button>
              )
            })}
          </div>
          {/* time + emoji row */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)' }}>⏰</span>
            <input value={draft.time} onChange={e => setDraft(d => ({ ...d, time: e.target.value }))}
              placeholder="16:15" aria-label="lesson time" style={{ ...inputStyle, width: 58, textAlign: 'center' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)' }}>🌍</span>
            <input value={draft.emoji} onChange={e => setDraft(d => ({ ...d, emoji: e.target.value }))}
              placeholder="🇯🇵" aria-label="lesson emoji" style={{ ...inputStyle, width: 48, textAlign: 'center', fontSize: '1rem' }} />
          </div>
          {/* preview */}
          <div style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 8, opacity: 0.8 }}>
            → {formatScheduleNote(draft)}
          </div>
          {/* save/cancel */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            <button onClick={saveEditor} style={{ padding: '5px 16px', borderRadius: 20, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>сохранить</button>
            <button onClick={cancelEditor} style={{ padding: '5px 14px', borderRadius: 20, border: 'none', background: 'rgba(168,85,247,0.1)', color: 'var(--text-light)', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>отмена</button>
          </div>
        </div>
      )}

      <div style={{ ...calStyles.grid, ...(isMobile ? { gap: 2 } : {}) }}>
        {dayLabels.map(d => (
          <div key={d} style={{ ...calStyles.dayHeader, ...(isMobile ? { fontSize: '0.78rem' } : {}) }}>{d}</div>
        ))}
        {Array.from({ length: startOffset }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const studied = studyDays.has(day)
          const isToday = day === today
          const dayOfWeek = new Date(year, month, day).getDay()
          const isLessonDay = lessonDays.includes(dayOfWeek)
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const ov = overrideMap[dateKey]
          const isCancelled = ov && !ov.isRescheduledTarget && ov.cancelled
          const isRescheduledAway = ov && !ov.isRescheduledTarget && ov.newDate && !ov.cancelled
          const isRescheduledTarget = ov && ov.isRescheduledTarget
          const isClickable = !!onOverrideChange && (isLessonDay || isRescheduledTarget)
          // For a reschedule target, clicking opens the override for the original date
          const clickKey = isRescheduledTarget ? ov.origKey : dateKey

          let lessonIcon = null
          if (isLessonDay && !isCancelled && !isRescheduledAway) lessonIcon = '⛩️'
          if (isCancelled) lessonIcon = '❌'
          if (isRescheduledAway) lessonIcon = '↪️'
          if (isRescheduledTarget) lessonIcon = '📅'

          return (
            <div
              key={day}
              onClick={isClickable ? () => openReschedule(clickKey) : undefined}
              title={isClickable ? 'нажми, чтобы перенести занятие' : undefined}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              aria-label={isClickable ? `${dateKey} — нажми, чтобы перенести занятие` : undefined}
              onKeyDown={isClickable ? (e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openReschedule(clickKey) } }) : undefined}
              style={{
                ...calStyles.day,
                ...(isMobile ? { fontSize: '0.75rem', padding: '3px 0' } : {}),
                ...(studied && !isToday ? calStyles.dayStudied : {}),
                ...(isToday ? calStyles.dayToday : {}),
                ...(isCancelled ? { opacity: 0.45 } : {}),
                ...(isClickable ? { cursor: 'pointer' } : {}),
              }}
            >
              {day}
              {lessonIcon && <div style={calStyles.studiedFlame}>{lessonIcon}</div>}
            </div>
          )
        })}
      </div>

      {/* Reschedule modal */}
      {rescheduling && (
        <div
          role="dialog" aria-modal="true" aria-label="reschedule lesson"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setRescheduling(null)}
        >
          <div
            style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: 18, padding: '22px 22px 18px', maxWidth: 340, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.28)', border: '1px solid rgba(192,132,252,0.22)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 14, color: 'var(--text-main)', textAlign: 'center' }}>
              {scheduleData.emoji || '📅'} {formatReschedDate(rescheduling)}
            </div>

            {/* cancelled toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, cursor: 'pointer', padding: '10px 12px', borderRadius: 10, background: reschedDraft.cancelled ? 'rgba(239,68,68,0.08)' : 'rgba(192,132,252,0.07)', transition: 'background 0.15s' }}>
              <input type="checkbox" checked={reschedDraft.cancelled}
                onChange={e => setReschedDraft(d => ({ ...d, cancelled: e.target.checked, newDate: e.target.checked ? '' : d.newDate }))}
                style={{ width: 17, height: 17, cursor: 'pointer', accentColor: '#dc2626' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: reschedDraft.cancelled ? 'var(--incorrect-text)' : 'var(--text-secondary)' }}>занятие отменено</span>
            </label>

            {/* reschedule fields */}
            {!reschedDraft.cancelled && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 4 }}>перенести на дату</div>
                <input type="date" value={reschedDraft.newDate}
                  onChange={e => setReschedDraft(d => ({ ...d, newDate: e.target.value }))}
                  aria-label="reschedule date"
                  style={{ ...inputStyle, width: '100%', marginBottom: 8, boxSizing: 'border-box' }} />
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 4 }}>время ({Intl.DateTimeFormat().resolvedOptions().timeZone})</div>
                <input value={reschedDraft.time}
                  onChange={e => setReschedDraft(d => ({ ...d, time: e.target.value }))}
                  placeholder={scheduleData.time || '16:15'}
                  aria-label="reschedule time"
                  style={{ ...inputStyle, width: '100%', marginBottom: 8, boxSizing: 'border-box' }} />
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 4 }}>заметка</div>
                <input value={reschedDraft.note}
                  onChange={e => setReschedDraft(d => ({ ...d, note: e.target.value }))}
                  placeholder="причина переноса..."
                  aria-label="reschedule note"
                  style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
              </div>
            )}

            {/* buttons */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: reschedDraft.cancelled ? 0 : 4 }}>
              {(overrides || {})[rescheduling] && (
                <button onClick={deleteOverride}
                  style={{ padding: '7px 12px', borderRadius: 20, border: 'none', background: 'rgba(239,68,68,0.12)', color: 'var(--incorrect-text)', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>
                  удалить
                </button>
              )}
              <button onClick={() => setRescheduling(null)}
                style={{ padding: '7px 12px', borderRadius: 20, border: 'none', background: 'rgba(168,85,247,0.1)', color: 'var(--text-light)', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>
                отмена
              </button>
              <button onClick={saveReschedule}
                style={{ padding: '7px 14px', borderRadius: 20, border: 'none', background: 'linear-gradient(135deg,#f472b6,#c084fc)', color: 'white', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>
                сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const calStyles = {
  monthLabel: {
    fontSize: '1.05rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    textAlign: 'center',
    marginBottom: 4,
    textTransform: 'lowercase',
  },
  calNote: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    textAlign: 'center',
    marginBottom: 8,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 3,
  },
  dayHeader: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    textAlign: 'center',
    textTransform: 'lowercase',
    paddingBottom: 4,
  },
  day: {
    fontSize: '0.88rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textAlign: 'center',
    padding: '4px 0',
    borderRadius: 8,
    lineHeight: 1.3,
    minHeight: 40,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: {
    background: 'rgba(168,85,247,0.12)',
    boxShadow: '0 0 0 2px #a855f7',
    fontWeight: 900,
    color: 'var(--text-main)',
  },
  dayStudied: {
    borderRadius: 8,
  },
  studiedFlame: {
    fontSize: '0.85rem',
    lineHeight: 1,
    marginTop: 1,
  },
}

function NavTabs({ groups }) {
  const [activeTab, setActiveTab] = useState(null)
  return (
    <div className="animate-fadeInUp" style={tabStyles.wrap}>
      {/* three tabs in one row */}
      <div style={tabStyles.tabRow}>
        {groups.map((g, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(activeTab === i ? null : i)}
            style={{
              ...tabStyles.tab,
              ...(activeTab === i ? tabStyles.tabActive : {}),
            }}
            className={activeTab === i ? '' : 'glass-sm glass-hover'}
          >
            <span style={tabStyles.tabTitle}>{g.title}</span>
            <span style={tabStyles.tabCount}>{g.cards.length}</span>
          </button>
        ))}
      </div>
      {/* expanded cards */}
      {activeTab !== null && groups[activeTab] && (
        <div style={{ ...tabStyles.grid }} className="animate-fadeInUp">
          {groups[activeTab].cards.map(card => (
            <Link
              key={card.to}
              to={card.to}
              className="glass-sm glass-hover"
              style={{ ...tabStyles.card, position: 'relative' }}
            >
              {card.badge && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  background: 'linear-gradient(135deg,#ef4444,#f97316)',
                  color: 'white', fontSize: '0.58rem', fontWeight: 900,
                  borderRadius: 50, minWidth: 18, height: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px', lineHeight: 1,
                }}>
                  {card.badge}
                </span>
              )}
              <div style={{ ...tabStyles.iconWrap, background: card.gradient }}>
                <span style={tabStyles.icon}>{card.icon}</span>
              </div>
              <div style={tabStyles.cardTitle}>{card.title}</div>
              <div style={tabStyles.cardSub}>{card.subtitle}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

const tabStyles = {
  wrap: {
    marginBottom: 10,
  },
  tabRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 6,
    marginBottom: 6,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '13px 8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: 'var(--text-main)',
    transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
    borderRadius: 14,
    background: 'var(--glass-bg)',
    border: 'none',
    boxShadow: '0 0 0 1px rgba(192,132,252,0.2)',
  },
  tabActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    color: 'white',
    boxShadow: '0 4px 18px rgba(236, 72, 153, 0.35)',
  },
  tabTitle: {
    fontSize: '1.05rem',
    fontWeight: 800,
    textTransform: 'lowercase',
  },
  tabCount: {
    fontSize: '0.82rem',
    fontWeight: 800,
    opacity: 0.7,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10,
    padding: '4px 0',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 7,
    padding: '16px 10px',
    textDecoration: 'none',
    color: 'inherit',
    borderRadius: 16,
    textAlign: 'center',
    minHeight: 104,
    justifyContent: 'center',
    overflow: 'hidden',
    transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
  },
  icon: {
    fontSize: '1.35rem',
  },
  cardTitle: {
    fontSize: '0.92rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    textTransform: 'lowercase',
    lineHeight: 1.2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  },
  cardSub: {
    fontSize: '0.78rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  },
}

const randomQuizRoutes = [
  '/quiz/vocab?quick=5',
  '/quiz/kana?quick=10',
  '/quiz/kanji?quick=5',
  '/quiz/grammar?quick=5',
  '/quiz/te-form',
  '/quiz/particles',
  '/quiz/conjugation',
  '/quiz/adjectives',
  '/quiz/counters',
  '/quiz/numbers',
  '/quiz/fill-in',
  '/quiz/sentences',
  '/quiz/n5',
  '/quiz/weak',
  '/game/matching',
  '/game/typing',
]

export default function Home() {
  const isMobile = useIsMobile()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const { progress, getStats } = useProgress()
  const { formatTime, goalProgress, goalReached, dailyGoal } = useStudyTimer()
  const { level, levelProgress, totalXP, progressInLevel, xpNeededForLevel, comboCount, comboMultiplier, comebackActive, awardXP, history: xpHistory } = useXP()
  const { totalCoins, freezesOwned, freezeDates, freezeCost, maxFreezes, buyFreeze, useFreeze, isTodayFrozen } = useCoins()
  const todayXP = useMemo(() => {
    const today = new Date().toDateString()
    return (xpHistory || [])
      .filter(h => toDateStringSafe(h.date) === today)
      .reduce((s, h) => s + h.amount, 0)
  }, [xpHistory])
  const { challenge: weeklyChallenge, progress: weeklyProgress, target: weeklyTarget, progressPct: weeklyPct, completed: weeklyCompleted, claimed: weeklyClaimed, daysLeft: weeklyDaysLeft, claimReward: claimWeeklyReward } = useWeeklyChallenge()
  const { unlockedLessons } = useUnlockedLessons()
  const [mascotIndex, setMascotIndex] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(() => !getStoredString('nihongo-onboarded'))
  const [searchParams] = useSearchParams()
  const [scheduleData, setScheduleData] = useState(() => {
    // Support legacy ?schedule= URL param on very first load
    const data = loadScheduleData()
    return data
  })
  const [overrides, setOverrides] = useState(() => loadOverrides())

  useEffect(() => {
    // ?schedule=пн+пт+18:00+🇷🇺 style param — parse days/time/emoji if possible
    const sp = searchParams.get('schedule')
    if (sp) {
      // Try to parse structured: days comma-separated indices|time|emoji e.g. "1,5|16:15|🇯🇵"
      const parts = sp.split('|')
      if (parts.length === 3) {
        const days = parts[0].split(',').map(Number).filter(n => n >= 0 && n <= 6)
        const d = { days: days.length ? days : [1, 5], time: parts[1] || '16:15', emoji: parts[2] || '🇯🇵' }
        setStoredJson(SCHEDULE_KEY, d)
        setScheduleData(d)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleScheduleChange = (data) => {
    const d = { ...SCHEDULE_DEFAULTS, ...data }
    setStoredJson(SCHEDULE_KEY, d)
    setScheduleData(d)
  }

  const handleOverrideChange = (newOverrides) => {
    saveOverrides(newOverrides)
    setOverrides(newOverrides)
  }

  const goRandomQuiz = useCallback(() => {
    const route = randomQuizRoutes[Math.floor(Math.random() * randomQuizRoutes.length)]
    navigate(route)
  }, [navigate])

  const goRandomLesson = useCallback(() => {
    const viewed = progress.lessonsViewed
    if (viewed.length === 0) { navigate('/lessons'); return }
    const id = viewed[Math.floor(Math.random() * viewed.length)]
    navigate(`/lessons/${id}`)
  }, [navigate, progress.lessonsViewed])

  const stats = useMemo(() => getStats(), [getStats])
  const nextLesson = useMemo(() => {
    const { hour, minute } = parseScheduleTime(scheduleData.time)
    return getNextLessonDate(scheduleData.days, hour, minute, overrides)
  }, [scheduleData, overrides])
  const reviewSuggestions = useMemo(() => getReviewSuggestions(progress), [progress])
  const difficultCount = useMemo(() => getDifficultWordsCount(), [])
  const dailyChallengeCompleted = useMemo(() => isDailyChallengeCompleted(), [])
  const [wordOffset, setWordOffset] = useState(() => getStoredNonNegativeInt('nihongo-word-offset', 0))
  const dailyWord = useMemo(() => getDailyWord(unlockedLessons, wordOffset), [unlockedLessons, wordOffset])
  const refreshDailyWord = useCallback(() => {
    const next = (isNaN(wordOffset) ? 0 : wordOffset) + 1
    setWordOffset(next)
    setStoredString('nihongo-word-offset', next)
  }, [wordOffset])
  const dailyKanji = useMemo(() => getDailyKanji(), [])
  const dailyGrammar = useMemo(() => getDailyGrammar(unlockedLessons), [unlockedLessons])
  const dailyProverb = useMemo(() => getDailyProverb(), [])
  const [proverbFlipped, setProverbFlipped] = useState(false)
  const greeting = useMemo(() => getGreeting(), [])
  const todayJp = useMemo(() => getTodayJp(), [])

  // "continue lesson" card logic
  const continueLesson = useMemo(() => {
    // Priority 1: bookmarked lesson
    if (progress.bookmarkedLesson) {
      return lessons.find(l => l.id === progress.bookmarkedLesson) || null
    }
    // Priority 2: next lesson after last viewed
    if (progress.lessonsViewed.length > 0) {
      const lastId = Math.max(...progress.lessonsViewed)
      const nextId = lastId + 1
      const next = unlockedLessons.find(l => l.id === nextId)
      if (next) return next
      return lessons.find(l => l.id === lastId) || null
    }
    // Priority 3: first unlocked lesson
    return unlockedLessons[0] || null
  }, [progress.bookmarkedLesson, progress.lessonsViewed, unlockedLessons])

  const continueLessonLabel = useMemo(() => {
    if (!continueLesson) return null
    if (progress.bookmarkedLesson === continueLesson.id) return 'закладка'
    if (progress.lessonsViewed.length > 0 && Math.max(...progress.lessonsViewed) + 1 === continueLesson.id) return 'следующий'
    if (progress.lessonsViewed.includes(continueLesson.id)) return 'продолжи'
    return 'начни'
  }, [continueLesson, progress.bookmarkedLesson, progress.lessonsViewed])

  // "repeat last quiz" button logic
  const lastPlayedQuiz = useMemo(() => {
    const candidates = [
      ...progress.vocabQuizzes.map(q => ({ ...q, quizType: 'vocab' })),
      ...progress.kanaQuizzes.map(q => ({ ...q, quizType: 'kana' })),
      ...progress.kanjiQuizzes.map(q => ({ ...q, quizType: 'kanji' })),
      ...progress.grammarQuizzes.map(q => ({ ...q, quizType: 'grammar' })),
    ]
    if (candidates.length === 0) return null
    const latest = candidates.reduce((a, b) => {
      const aDate = parseValidDate(a.date)?.getTime() || 0
      const bDate = parseValidDate(b.date)?.getTime() || 0
      return aDate > bDate ? a : b
    })
    const labels = { vocab: 'vocab quiz', kana: 'kana quiz', kanji: 'kanji quiz', grammar: 'grammar quiz' }
    const paths = { vocab: '/quiz/vocab', kana: '/quiz/kana', kanji: '/quiz/kanji', grammar: '/quiz/grammar' }
    const lessonSuffix = latest.lessons && latest.lessons.length === 1 ? `?lesson=${latest.lessons[0]}` : ''
    return { label: labels[latest.quizType], to: paths[latest.quizType] + lessonSuffix, score: latest.score, total: latest.total }
  }, [progress.vocabQuizzes, progress.kanaQuizzes, progress.kanjiQuizzes, progress.grammarQuizzes])

  // count quizzes completed today
  const quizzesToday = useMemo(() => {
    const today = new Date().toDateString()
    const all = [
      ...progress.vocabQuizzes,
      ...progress.kanaQuizzes,
      ...(progress.kanjiQuizzes || []),
      ...(progress.grammarQuizzes || []),
    ]
    return all.filter(q => toDateStringSafe(q.date) === today).length
  }, [progress])

  // check if today's daily challenge was completed
  const isDailyDoneToday = useMemo(() => {
    const d = new Date()
    const todaySeed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
    const saved = getStoredJson('nihongo-daily-challenge', null)
    if (!saved || typeof saved !== 'object') return false
    return saved?.lastSeed === todaySeed && saved?.completed === true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]) // re-check when progress changes (daily awards XP which triggers progress update)

  const quizTypeBreakdown = useMemo(() => {
    const today = new Date().toDateString()
    const isToday = (q) => toDateStringSafe(q.date) === today
    return {
      vocab: progress.vocabQuizzes.filter(isToday).length,
      kana: progress.kanaQuizzes.filter(isToday).length,
      kanji: (progress.kanjiQuizzes || []).filter(isToday).length,
      grammar: (progress.grammarQuizzes || []).filter(isToday).length,
    }
  }, [progress])

  // 14-day activity (includes frozen days)
  const last14Days = useMemo(() => {
    const quizAll = [
      ...progress.vocabQuizzes,
      ...progress.kanaQuizzes,
      ...(progress.kanjiQuizzes || []),
      ...(progress.grammarQuizzes || []),
      ...(xpHistory || []),
    ]
    const activeDates = new Set(quizAll.map(q => toDateStringSafe(q.date)).filter(Boolean))
    // Mark frozen dates as active too
    freezeDates.forEach(dateStr => {
      const frozenDate = toDateStringSafe(dateStr + 'T12:00:00')
      if (frozenDate) activeDates.add(frozenDate)
    })
    const DAY_LABELS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (13 - i))
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const isFrozen = freezeDates.includes(dateKey)
      return {
        active: activeDates.has(d.toDateString()),
        isFrozen,
        isToday: i === 13,
        dayLabel: DAY_LABELS[d.getDay()],
      }
    })
  }, [progress, xpHistory, freezeDates])

  // Augmented streak: uses XP history (all quiz types) + frozen dates
  const augmentedStreak = useMemo(() => {
    const quizAll = [
      ...progress.vocabQuizzes,
      ...progress.kanaQuizzes,
      ...(progress.kanjiQuizzes || []),
      ...(progress.grammarQuizzes || []),
      ...(xpHistory || []),
    ]
    const activeDates = new Set(quizAll.map(q => toDateStringSafe(q.date)).filter(Boolean))
    freezeDates.forEach(dateStr => {
      const frozenDate = toDateStringSafe(dateStr + 'T12:00:00')
      if (frozenDate) activeDates.add(frozenDate)
    })
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 400; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      if (activeDates.has(d.toDateString())) {
        streak++
      } else if (i === 0) {
        continue // today not studied yet — still check yesterday
      } else {
        break
      }
    }
    return streak
  }, [progress, xpHistory, freezeDates])

  // Achievements
  const achievementStats = useMemo(() => {
    const allQuizzes = [
      ...progress.vocabQuizzes,
      ...progress.kanaQuizzes,
      ...(progress.kanjiQuizzes || []),
      ...(progress.grammarQuizzes || []),
    ]
    return {
      totalQuizzes: allQuizzes.length,
      vocabQuizCount: stats.vocabQuizCount || 0,
      kanaQuizCount: stats.kanaQuizCount || 0,
      kanjiQuizCount: stats.kanjiQuizCount || 0,
      grammarQuizCount: stats.grammarQuizCount || 0,
      streak: augmentedStreak,
      bestVocabScore: stats.bestVocabScore || 0,
      bestKanaScore: stats.bestKanaScore || 0,
      lessonsViewedCount: stats.lessonsViewedCount || 0,
      totalLessons: unlockedLessons.length,
      totalXP,
      level,
      perfectScores: allQuizzes.filter(q => q.total > 0 && q.score === q.total).length,
      difficultWordsCleared: difficultCount === 0 && allQuizzes.length > 0,
      nightStudy: new Date().getHours() >= 0 && new Date().getHours() < 5,
      earlyStudy: new Date().getHours() >= 5 && new Date().getHours() < 7,
      weekendStudy: [0, 6].includes(new Date().getDay()),
    }
  }, [progress, stats, totalXP, level, difficultCount, unlockedLessons, augmentedStreak])

  const { achievements, unlockedCount, totalCount } = useAchievements(achievementStats)
  const recentBadges = useMemo(() =>
    achievements
      .filter(a => a.unlocked && a.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
      .slice(0, 6)
  , [achievements])

  // find achievements close to being unlocked (for "next goals" section)
  const nextGoals = useMemo(() => {
    return achievements
      .filter(a => !a.unlocked)
      .map(a => {
        // estimate proximity based on stats
        let progress = 0
        const s = achievementStats
        if (a.id.includes('quiz') || a.id === 'first_quiz') {
          const targets = { first_quiz: 1, five_quizzes: 5, ten_quizzes: 10, twenty_five_quizzes: 25, fifty_quizzes: 50, hundred_quizzes: 100, two_hundred_quizzes: 200, five_hundred_quizzes: 500 }
          const target = targets[a.id] || 1
          progress = Math.min(s.totalQuizzes / target, 0.99)
        } else if (a.id.startsWith('streak_')) {
          const target = parseInt(a.id.split('_')[1], 10) || 1
          progress = Math.min(s.streak / target, 0.99)
        } else if (a.id.startsWith('xp_')) {
          const target = parseInt(a.id.split('_')[1], 10) || 1
          progress = Math.min(s.totalXP / target, 0.99)
        } else if (a.id === 'level_50') {
          // level_50 condition is totalXP >= 50000, not a real level
          progress = Math.min(s.totalXP / 50000, 0.99)
        } else if (a.id.startsWith('level_')) {
          const target = parseInt(a.id.split('_')[1], 10) || 1
          progress = Math.min(s.level / target, 0.99)
        } else if (a.id === 'vocab_90') {
          progress = Math.min(s.bestVocabScore / 90, 0.99)
        } else if (a.id === 'vocab_perfect') {
          progress = Math.min(s.bestVocabScore / 100, 0.99)
        } else if (a.id === 'kana_90') {
          progress = Math.min(s.bestKanaScore / 90, 0.99)
        } else if (a.id === 'kana_perfect') {
          progress = Math.min(s.bestKanaScore / 100, 0.99)
        } else if (a.id.includes('perfect')) {
          const targets = { first_perfect: 1, five_perfects: 5, ten_perfects: 10, twenty_perfects: 20, fifty_perfects: 50 }
          const target = targets[a.id] || 1
          progress = Math.min(s.perfectScores / target, 0.99)
        } else if (a.id.includes('lesson')) {
          const targets = { first_lesson: 1, five_lessons: 5, ten_lessons: 10, fifteen_lessons: 15, twenty_lessons: 20 }
          const target = targets[a.id] || s.totalLessons || 25
          progress = Math.min(s.lessonsViewedCount / target, 0.99)
        } else if (a.id === 'vocab_20') {
          progress = Math.min(s.vocabQuizCount / 20, 0.99)
        } else if (a.id === 'kana_20') {
          progress = Math.min(s.kanaQuizCount / 20, 0.99)
        } else if (a.id === 'kanji_20') {
          progress = Math.min(s.kanjiQuizCount / 20, 0.99)
        } else if (a.id === 'grammar_20') {
          progress = Math.min(s.grammarQuizCount / 20, 0.99)
        } else {
          progress = 0
        }
        return { ...a, progress }
      })
      .filter(a => a.progress > 0.3) // only show ones >30% done
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3)
  }, [achievements, achievementStats])

  useEffect(() => {
    const interval = setInterval(() => {
      setMascotIndex(prev => (prev + 1) % mascots.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const cards = [
    {
      to: '/lessons',
      icon: '📚',
      title: 'lessons',
      subtitle: 'минна но нихонго',
      desc: 'all lessons with vocab & grammar',
      gradient: 'linear-gradient(135deg, #f9a8d4, #c084fc)',
    },
    {
      to: '/quiz/vocab',
      icon: '✨',
      title: 'vocab quiz',
      subtitle: 'тест по словам',
      desc: 'test your vocabulary knowledge',
      gradient: 'linear-gradient(135deg, #f472b6, #a78bfa)',
    },
    {
      to: '/quiz/kana',
      icon: 'あ',
      title: 'kana quiz',
      subtitle: 'хирагана и катакана',
      desc: 'practice reading kana characters',
      gradient: 'linear-gradient(135deg, #c084fc, #f472b6)',
    },
    {
      to: '/quiz/te-form',
      icon: '🔄',
      title: 'te-form quiz',
      subtitle: 'тест по て-форме',
      desc: 'practice verb conjugation',
      gradient: 'linear-gradient(135deg, #f472b6, #fbbf24)',
    },
    {
      to: '/quiz/kanji',
      icon: '漢',
      title: 'kanji quiz',
      subtitle: 'тест по кандзи',
      desc: `${kanji.length} kanji from Basic Kanji Book`,
      gradient: 'linear-gradient(135deg, #a78bfa, #ec4899)',
    },
    {
      to: '/quiz/grammar',
      icon: '文',
      title: 'grammar quiz',
      subtitle: 'тест по грамматике',
      desc: 'test grammar patterns from lessons',
      gradient: 'linear-gradient(135deg, #f472b6, #fbbf24)',
    },
    {
      to: '/kanji',
      icon: '📖',
      title: 'kanji study',
      subtitle: 'изучение кандзи',
      desc: 'browse kanji by lesson, readings & compounds',
      gradient: 'linear-gradient(135deg, #c084fc, #a78bfa)',
    },
    {
      to: '/kana',
      icon: '✍️',
      title: 'kana study',
      subtitle: 'порядок черт каны',
      desc: 'stroke order for hiragana & katakana',
      gradient: 'linear-gradient(135deg, #f9a8d4, #c084fc)',
    },
    {
      to: '/review',
      icon: '🃏',
      title: 'flash cards',
      subtitle: 'флешкарточки',
      desc: 'flip cards to review vocabulary',
      gradient: 'linear-gradient(135deg, #f9a8d4, #a78bfa)',
    },
    {
      to: '/quiz/particles',
      icon: '助',
      title: 'particle quiz',
      subtitle: 'тест по частицам',
      desc: 'practice は, が, を, に, で...',
      gradient: 'linear-gradient(135deg, #34d399, #a78bfa)',
    },
    {
      to: '/quiz/fill-in',
      icon: '✏️',
      title: 'fill in',
      subtitle: 'вставь пропуск',
      desc: 'fill in the blank grammar practice',
      gradient: 'linear-gradient(135deg, #fbbf24, #a78bfa)',
    },
    {
      to: '/quiz/numbers',
      icon: '🔢',
      title: 'number quiz',
      subtitle: 'тест по числам',
      desc: 'practice numbers, counters, time & dates',
      gradient: 'linear-gradient(135deg, #34d399, #f472b6)',
    },
    {
      to: '/quiz/counters',
      icon: '数',
      title: 'counter quiz',
      subtitle: 'счётные слова',
      desc: 'practice つ, 人, 本, 枚, 匹 and more',
      gradient: 'linear-gradient(135deg, #fbbf24, #34d399)',
    },
    {
      to: '/mistakes',
      icon: '📋',
      title: 'mistakes',
      subtitle: 'ошибки',
      desc: 'review your difficult words',
      gradient: 'linear-gradient(135deg, #ef4444, #f472b6)',
    },
    {
      to: '/quiz/conjugation',
      icon: '🔀',
      title: 'conjugation quiz',
      subtitle: 'тест по спряжению',
      desc: 'quiz all verb forms: て, ない, た, potential...',
      gradient: 'linear-gradient(135deg, #34d399, #a855f7)',
    },
    {
      to: '/conjugation',
      icon: '📐',
      title: 'conjugation ref',
      subtitle: 'справочник глаголов',
      desc: 'all verb forms: て, ない, た, dictionary...',
      gradient: 'linear-gradient(135deg, #a78bfa, #f472b6)',
    },
    {
      to: '/kana-chart',
      icon: '📊',
      title: 'kana chart',
      subtitle: 'таблица каны',
      desc: 'hiragana & katakana reference + tips',
      gradient: 'linear-gradient(135deg, #c084fc, #34d399)',
    },
    {
      to: '/search',
      icon: '🔍',
      title: 'search',
      subtitle: 'поиск слов',
      desc: 'search across all lessons',
      gradient: 'linear-gradient(135deg, #a78bfa, #34d399)',
    },
    {
      to: '/quiz/sentences',
      icon: '🧩',
      title: 'sentence builder',
      subtitle: 'составь предложение',
      desc: 'arrange words in the correct order',
      gradient: 'linear-gradient(135deg, #c084fc, #ec4899)',
    },
    {
      to: '/game/matching',
      icon: '🎮',
      title: 'matching game',
      subtitle: 'игра на совпадение',
      desc: 'pair words with translations!',
      gradient: 'linear-gradient(135deg, #ec4899, #fbbf24)',
    },
    {
      to: '/kanji/practice',
      icon: '✍️',
      title: 'kanji practice',
      subtitle: 'пиши кандзи',
      desc: 'draw kanji on canvas & quiz yourself',
      gradient: 'linear-gradient(135deg, #a78bfa, #34d399)',
    },
    {
      to: '/quiz/adjectives',
      icon: '形',
      title: 'adjective quiz',
      subtitle: 'прилагательные',
      desc: 'practice い and な adjective conjugation',
      gradient: 'linear-gradient(135deg, #f9a8d4, #fbbf24)',
    },
    {
      to: '/game/typing',
      icon: '⌨️',
      title: 'typing challenge',
      subtitle: 'печатаем по-японски',
      desc: 'type romaji or russian as fast as you can!',
      gradient: 'linear-gradient(135deg, #34d399, #a78bfa)',
    },
    {
      to: '/stats',
      icon: '📈',
      title: 'statistics',
      subtitle: 'статистика',
      desc: 'learning analytics, trends & heatmap',
      gradient: 'linear-gradient(135deg, #a78bfa, #ec4899)',
    },
    {
      to: '/reading',
      icon: '📖',
      title: 'reading practice',
      subtitle: 'чтение диалогов',
      desc: 'read dialogues with comprehension questions',
      gradient: 'linear-gradient(135deg, #34d399, #c084fc)',
    },
    {
      to: '/homework',
      icon: '📝',
      title: 'homework',
      subtitle: 'домашка',
      desc: 'notes, sentences & constructions',
      gradient: 'linear-gradient(135deg, #fbbf24, #f472b6)',
    },
    {
      to: '/materials',
      icon: '📖',
      title: 'materials',
      subtitle: 'учебники',
      desc: 'textbooks, workbooks & audio',
      gradient: 'linear-gradient(135deg, #34d399, #60a5fa)',
    },
    {
      to: '/grammar',
      icon: '📜',
      title: 'grammar explorer',
      subtitle: 'грамматика',
      desc: 'search & browse all grammar patterns',
      gradient: 'linear-gradient(135deg, #c084fc, #fbbf24)',
    },
    {
      to: '/quiz/weak',
      icon: '🎯',
      title: 'weak words sprint',
      subtitle: 'трудные слова',
      desc: 'focused quiz on your difficult words',
      gradient: 'linear-gradient(135deg, #ef4444, #a78bfa)',
      badge: difficultCount > 0 ? difficultCount : null,
    },
    {
      to: '/quiz/n5',
      icon: '🏅',
      title: 'JLPT N5 quiz',
      subtitle: 'подготовка к N5',
      desc: 'certification-style N5 vocabulary drill',
      gradient: 'linear-gradient(135deg, #f59e0b, #ec4899)',
    },
  ]

  return (
    <div className="page" style={{ position: 'relative' }}>
      {/* theme toggle */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'fixed',
          top: 'calc(env(safe-area-inset-top, 0px) + 10px)',
          right: 16,
          zIndex: 50,
          width: 44,
          height: 44,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          background: isDark ? 'rgba(40, 20, 55, 0.7)' : 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: isDark
            ? '0 2px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(192,132,252,0.3)'
            : '0 2px 12px rgba(236,72,153,0.2), 0 0 0 1px rgba(255,255,255,0.5)',
          transition: 'all 0.3s ease',
        }}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? '☀️' : '🌙'}
      </button>

      {/* onboarding overlay — shown only on first visit */}
      {showOnboarding && (
        <div role="dialog" aria-modal="true" aria-label="welcome" style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(10,4,20,0.82)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 12px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
          <div className="animate-fadeInUp" style={{ width: '100%', maxWidth: 480, borderRadius: 24, padding: '28px 24px', textAlign: 'center', background: 'var(--onboard-bg)', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize: '2.4rem', marginBottom: 8 }}>🌸</div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: 6 }}>добро пожаловать!</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-light)', fontWeight: 600, marginBottom: 20 }}>приложение для изучения японского по учебнику «Минна но Нихонго»</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 22 }}>
              {[
                { icon: '📚', title: 'уроки', desc: '25 уроков МнН — словарь, грамматика, диалоги' },
                { icon: '✨', title: 'квизы', desc: '15+ типов квизов — слова, кана, кандзи, частицы' },
                { icon: '📈', title: 'прогресс', desc: 'XP, уровни, стрики и достижения' },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{ background: 'var(--onboard-card-bg, rgba(244,114,182,0.08))', borderRadius: 14, padding: '12px 8px', border: '1.5px solid rgba(244,114,182,0.2)' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)', lineHeight: 1.35 }}>{desc}</div>
                </div>
              ))}
            </div>
            <button
              className="btn btn-cute"
              style={{ width: '100%', fontSize: '1rem' }}
              onClick={() => { setStoredString('nihongo-onboarded', 'true'); setShowOnboarding(false) }}
            >
              始めましょう！ начнём 🚀
            </button>
            <Link
              to="/guide"
              onClick={() => { setStoredString('nihongo-onboarded', 'true'); setShowOnboarding(false) }}
              style={{ display: 'block', marginTop: 10, fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-light)', textDecoration: 'none' }}
            >
              🌸 читать гайд по приложению →
            </Link>
          </div>
        </div>
      )}

      {/* hero section */}
      <div style={styles.hero} className="animate-fadeInUp">
        <div style={styles.heroDecoTop}>
          <span>🌸</span>
          <span>✨</span>
          <span>🎀</span>
        </div>

        <div style={{ ...styles.mascotWrap, height: 130, alignItems: 'flex-end' }}>
          <img
            src={mascots[mascotIndex].src}
            alt={mascots[mascotIndex].alt}
            style={{ maxWidth: 130, maxHeight: 130, width: 'auto', height: 'auto', filter: 'drop-shadow(0 6px 10px rgba(236,72,153,0.2))', transition: 'opacity 0.4s ease', display: 'block', transform: 'translateZ(0)' }}
          />
        </div>

        <h1 style={styles.title}>
          nihongo app <span style={styles.flag}>🇯🇵</span>
        </h1>

        <p style={styles.greeting}>
          {greeting.ru}<br />{greeting.ru2}
        </p>

        <p style={{ ...styles.subGreeting, ...(isMobile ? { fontSize: '1rem' } : {}) }}>
          {greeting.jp} ~ {greeting.romaji}
        </p>
        {todayJp && (
          <p style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: 700, color: 'var(--text-light)', marginTop: 4, letterSpacing: '0.01em' }}>
            今日は{todayJp.jp}です ·{' '}
            <span style={{ fontWeight: 600, color: 'var(--text-light)', fontSize: '0.78rem' }}>
              {todayJp.romaji} — {todayJp.ru}
            </span>
          </p>
        )}

        <div style={styles.heroDecoBottom}>
          <span>🌙</span>
          <span>💮</span>
          <span>⭐</span>
        </div>
      </div>

      {/* daily: word + kanji side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }} className="animate-fadeInUp home-daily-grid">
        {dailyWord && (
          <div style={{ minWidth: 0, height: '100%' }}>
            <DailyWordCard word={dailyWord} onRefresh={refreshDailyWord} />
          </div>
        )}
        {dailyKanji && (
          <div style={{ minWidth: 0, height: '100%' }}>
            <DailyKanjiCard kanji={dailyKanji} />
          </div>
        )}
      </div>

      {/* grammar of the day — full width */}
      {dailyGrammar && (
        <div
          className="glass-sm animate-fadeInUp"
          style={{ ...styles.dailyCard, cursor: 'default', marginBottom: 10 }}
        >
          <div style={styles.dailyLabel}>grammar of the day 文</div>
          <div style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: 4, letterSpacing: '-0.01em' }}>
            {dailyGrammar.pattern}
          </div>
          {dailyGrammar.patternJp && (
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 4 }}>
              {dailyGrammar.patternJp}
            </div>
          )}
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            {dailyGrammar.meaning}
          </div>
          {dailyGrammar.examples?.[0] && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontStyle: 'italic', borderTop: '1px solid rgba(192,132,252,0.1)', paddingTop: 6 }}>
              {dailyGrammar.examples[0].jp}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <Link to={`/lessons/${dailyGrammar.lessonId}`} style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', background: 'rgba(168,85,247,0.1)', padding: '2px 8px', borderRadius: 50, textDecoration: 'none' }}>
              L{dailyGrammar.lessonId} →
            </Link>
            <Link to="/grammar" style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textDecoration: 'none' }}>
              explorer →
            </Link>
          </div>
        </div>
      )}


      {/* proverb — flip card */}
      {dailyProverb && (
        <div
          className="animate-fadeInUp"
          style={{ perspective: '900px', marginBottom: 12, cursor: 'pointer' }}
          onClick={() => setProverbFlipped(f => !f)}
          role="button"
          tabIndex={0}
          aria-label={proverbFlipped ? 'flip proverb back' : 'flip proverb to reveal context'}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProverbFlipped(f => !f) } }}
        >
          <div style={{
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.55s cubic-bezier(0.34, 1.0, 0.64, 1)',
            transform: proverbFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: 170,
          }}>
            {/* front */}
            <div className="glass-sm" style={{ ...styles.dailyCard, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', minHeight: 170, position: 'relative' }}>
              <div style={styles.dailyLabel}>proverb 🌿</div>
              <div style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: 4, lineHeight: 1.3, textShadow: '0 2px 8px rgba(192,132,252,0.15)' }}>{dailyProverb.jp}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 4, letterSpacing: '0.01em' }}>{dailyProverb.romaji}</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-secondary)', lineHeight: 1.4 }}>«{dailyProverb.ru}»</div>
              <div style={{ position: 'absolute', bottom: 10, right: 14, fontSize: '0.72rem', color: 'var(--text-light)', opacity: 0.5 }}>нажми →</div>
            </div>
            {/* back */}
            <div className="glass-sm" style={{
              ...styles.dailyCard,
              backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              position: 'absolute', top: 0, left: 0, right: 0,
              minHeight: 170,
              background: 'linear-gradient(135deg, rgba(192,132,252,0.18), rgba(244,114,182,0.12))',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
            }}>
              <div style={{ ...styles.dailyLabel, marginBottom: 8 }}>смысл 🌸</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.55 }}>{dailyProverb.context}</div>
              <div style={{ position: 'absolute', bottom: 10, right: 14, fontSize: '0.72rem', color: 'var(--text-light)', opacity: 0.5 }}>← назад</div>
            </div>
          </div>
        </div>
      )}

      {/* streak milestone celebration */}
      {[7, 14, 30, 60, 100, 365].includes(augmentedStreak) && (
        <div className="glass animate-pop" style={styles.streakCelebration}>
          <div style={styles.streakCelebEmoji}>
            {augmentedStreak >= 100 ? '👑' : augmentedStreak >= 30 ? '🏆' : '🎉'}
          </div>
          <div style={styles.streakCelebText}>
            {augmentedStreak} day streak! すごい!
          </div>
          <div style={styles.streakCelebSub}>
            {augmentedStreak >= 100 ? 'you are a legend!' :
             augmentedStreak >= 30 ? 'one month strong!' :
             augmentedStreak >= 14 ? 'two weeks! keep going!' :
             'one week! がんばれ!'}
          </div>
        </div>
      )}

      {/* streak protection reminder */}
      {quizzesToday === 0 && !isDailyDoneToday && !isTodayFrozen && (
        <Link to="/daily" className="glass animate-fadeInUp" style={styles.streakReminder}>
          <span style={styles.streakReminderIcon}>{augmentedStreak > 0 ? '🔥' : '🌅'}</span>
          <div style={styles.streakReminderContent}>
            <div style={styles.streakReminderTitle}>
              {augmentedStreak > 0 ? `protect your ${augmentedStreak}-day streak!` : 'daily challenge'}
            </div>
            <div style={styles.streakReminderDesc}>
              {augmentedStreak > 0 ? 'complete today\'s challenge to keep your streak' : 'complete today\'s challenge to start your streak'}
            </div>
          </div>
          <span style={styles.streakReminderArrow}>→</span>
        </Link>
      )}

      {/* weekly challenge */}
      <div className="animate-fadeInUp" style={{ marginBottom: 12 }}>
        <div className="glass" style={styles.weeklyCard}>
          <div style={styles.weeklyHeader}>
            <span style={styles.weeklyIcon}>{weeklyChallenge.icon}</span>
            <div style={styles.weeklyInfo}>
              <div style={styles.weeklyTitle}>{weeklyChallenge.title}</div>
              <div style={styles.weeklyDesc}>{weeklyChallenge.desc}</div>
            </div>
            {weeklyCompleted && !weeklyClaimed && (
              <button
                className="btn btn-cute"
                style={styles.weeklyClaimBtn}
                onClick={() => {
                  const bonus = claimWeeklyReward()
                  awardXP(bonus, 'weekly challenge')
                }}
              >
                +100 XP
              </button>
            )}
            {weeklyClaimed && (
              <span style={styles.weeklyDone}>✓</span>
            )}
          </div>
          <div style={styles.weeklyBarTrack}>
            <div
              style={{
                ...styles.weeklyBarFill,
                width: `${weeklyPct * 100}%`,
                background: weeklyCompleted
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : 'linear-gradient(90deg, #f472b6, #c084fc)',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={styles.weeklyProgress}>{weeklyProgress}/{weeklyTarget}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 600 }}>
              {weeklyDaysLeft === 1 ? 'resets tomorrow' : `resets in ${weeklyDaysLeft}d`}
            </div>
          </div>
        </div>
      </div>

      {/* continue lesson card */}
      {continueLesson && (
        <Link
          to={`/lessons/${continueLesson.id}`}
          className="glass animate-fadeInUp"
          style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
            marginBottom: 10, textDecoration: 'none', color: 'inherit',
            background: 'var(--tint-medium)',
            border: '1.5px solid rgba(244,114,182,0.4)', borderRadius: 18, transition: 'all 0.2s',
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg, #f472b6, #c084fc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', boxShadow: '0 4px 14px rgba(244,114,182,0.3)',
          }}>
            📖
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textTransform: 'lowercase', letterSpacing: '0.04em', marginBottom: 2 }}>
              {continueLessonLabel} урок {continueLesson.id}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {continueLesson.titleJp}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 1 }}>
              {continueLesson.title}
            </div>
          </div>
          <span style={{ fontSize: '1.1rem', color: 'var(--text-light)', fontWeight: 900, flexShrink: 0 }}>→</span>
        </Link>
      )}

      {/* quick practice buttons */}
      <div className="glass animate-fadeInUp" style={styles.quickCard}>
        <div style={styles.quickTitle}>quick practice ⚡</div>
        <div style={styles.quickRow}>
          <Link to="/quiz/vocab?quick=5" style={styles.quickBtn} className="glass-sm">
            <span>✨</span> 5 words
          </Link>
          <Link to="/quiz/kana?quick=10" style={styles.quickBtn} className="glass-sm">
            <span>あ</span> 10 kana
          </Link>
          <Link to="/quiz/kanji?quick=5" style={styles.quickBtn} className="glass-sm">
            <span>漢</span> 5 kanji
          </Link>
          <Link to="/quiz/grammar?quick=5" style={styles.quickBtn} className="glass-sm">
            <span>文</span> 5 grammar
          </Link>
          {lastPlayedQuiz && (
            <Link to={lastPlayedQuiz.to} style={styles.quickBtn} className="glass-sm">
              <span>▶</span> repeat
            </Link>
          )}
          <button onClick={goRandomQuiz} style={styles.quickBtn} className="glass-sm btn-hover">
            <span>🎲</span> surprise!
          </button>
          <button onClick={goRandomLesson} style={styles.quickBtn} className="glass-sm btn-hover">
            <span>📖</span> random lesson
          </button>
          <Link to="/quiz-hub" style={{ ...styles.quickBtn, background: 'linear-gradient(135deg, rgba(244,114,182,0.18), rgba(192,132,252,0.18))', fontWeight: 800 }} className="glass-sm">
            <span>🎯</span> all quizzes
          </Link>
        </div>
      </div>

      {/* dashboard: daily challenge (left, narrower) + stats (right, compact) */}
      <div style={{ display: 'grid', gridTemplateColumns: '0.65fr 2fr', gap: isMobile ? 6 : 8, marginBottom: 10 }} className="animate-fadeInUp">
        {/* left: daily challenge */}
        <Link to="/daily" className="glass-sm glass-hover" style={{ ...styles.dashItem, textDecoration: 'none', color: 'inherit', padding: isMobile ? '14px 8px' : '18px 12px', gap: 8 }}>
          <span style={{ fontSize: isMobile ? '2.2rem' : '2.6rem' }}>{dailyChallengeCompleted ? '✅' : '🌅'}</span>
          <span style={{ fontSize: isMobile ? '0.82rem' : '0.9rem', fontWeight: 900, color: 'var(--text-main)', textAlign: 'center', lineHeight: 1.25 }}>
            {dailyChallengeCompleted ? 'done! ✓' : 'daily\nchallenge'}
          </span>
        </Link>
        {/* right: timer + XP + quizzes in mini 3-col */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.9fr', gap: isMobile ? 3 : 5 }}>
          <div className="glass-sm" style={{ ...styles.dashItem, padding: isMobile ? '8px 3px' : '10px 5px' }}>
            <div style={{ position: 'relative', width: isMobile ? 62 : 68, height: isMobile ? 62 : 68, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={isMobile ? 62 : 68} height={isMobile ? 62 : 68} viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(192,132,252,0.15)" strokeWidth="4" />
                <circle cx="36" cy="36" r="30" fill="none" stroke={goalReached ? '#10b981' : '#c084fc'} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${goalProgress * 188.5} 188.5`} transform="rotate(-90 36 36)" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
              </svg>
              <span style={{ position: 'absolute', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>{formatTime()}</span>
            </div>
            <span style={{ ...styles.dashLabel, fontSize: '0.72rem' }}>{goalReached ? 'done!' : `${dailyGoal}m`}</span>
          </div>
          <Link to="/stats" className="glass-sm" style={{ ...styles.dashItem, padding: isMobile ? '8px 3px' : '10px 5px', textDecoration: 'none', color: 'inherit' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--text-light)', letterSpacing: '0.04em' }}>lv.{level}</span>
            <span style={{ ...styles.dashNum, fontSize: isMobile ? '1.4rem' : '2rem' }}>{totalXP >= 1000 ? `${Math.floor(totalXP / 1000)}к` : totalXP}</span>
            <span style={{ ...styles.dashLabel, fontSize: '0.72rem' }}>XP</span>
          </Link>
          <div className="glass-sm" style={{ ...styles.dashItem, padding: isMobile ? '8px 3px' : '10px 5px' }}>
            <span style={styles.dashIcon}>🎯</span>
            <span style={{ ...styles.dashNum, fontSize: isMobile ? '1.4rem' : '2rem' }}>{quizzesToday}</span>
            <span style={{ ...styles.dashLabel, fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>сегодня</span>
            {(quizzesToday > 0 || isDailyDoneToday) && (
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center', marginTop: 2 }}>
                {isDailyDoneToday && <span aria-label="daily challenge done" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', borderRadius: 50, padding: '1px 5px' }}>🌅✓</span>}
                {quizTypeBreakdown.vocab > 0 && <span aria-label={`vocab: ${quizTypeBreakdown.vocab}`} style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', background: 'rgba(192,132,252,0.12)', borderRadius: 50, padding: '1px 5px' }}>📚{quizTypeBreakdown.vocab}</span>}
                {quizTypeBreakdown.kana > 0 && <span aria-label={`kana: ${quizTypeBreakdown.kana}`} style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', background: 'rgba(192,132,252,0.12)', borderRadius: 50, padding: '1px 5px' }}>あ{quizTypeBreakdown.kana}</span>}
                {quizTypeBreakdown.kanji > 0 && <span aria-label={`kanji: ${quizTypeBreakdown.kanji}`} style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', background: 'rgba(192,132,252,0.12)', borderRadius: 50, padding: '1px 5px' }}>漢{quizTypeBreakdown.kanji}</span>}
                {quizTypeBreakdown.grammar > 0 && <span aria-label={`grammar: ${quizTypeBreakdown.grammar}`} style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', background: 'rgba(192,132,252,0.12)', borderRadius: 50, padding: '1px 5px' }}>文{quizTypeBreakdown.grammar}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* XP progress bar (compact) */}
      <div className="glass-sm animate-fadeInUp" style={{ ...styles.xpCompact, ...(isMobile ? { flexDirection: 'column', alignItems: 'stretch', gap: 5 } : {}) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <div style={styles.xpCompactBar}>
            <div style={{ ...styles.xpCompactFill, width: `${levelProgress * 100}%` }} />
          </div>
          <span style={{ ...styles.xpCompactText, fontSize: isMobile ? '0.85rem' : '1rem', whiteSpace: 'nowrap' }}>{progressInLevel}/{xpNeededForLevel} to lv.{level + 1}</span>
        </div>
        {(todayXP > 0 || comboCount >= 3 || comebackActive) && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {todayXP > 0 && (
              <span style={styles.todayXPTag}>+{todayXP} XP today ✨</span>
            )}
            {comboCount >= 3 && (
              <span style={styles.comboTag}>{comboMultiplier}x combo 🔥</span>
            )}
            {comebackActive && (
              <span style={styles.comebackTag}>welcome back! 2x XP 💪</span>
            )}
          </div>
        )}
      </div>

      {/* streak + 14-day activity */}
      <div className="glass-sm animate-fadeInUp" style={styles.activityRow}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, paddingRight: 10, borderRight: '1px solid rgba(192,132,252,0.2)', marginRight: 10, minWidth: isMobile ? 44 : 52, flexShrink: 0 }}>
          <span style={{ fontSize: isMobile ? '1.6rem' : '1.8rem', lineHeight: 1 }}>{augmentedStreak > 0 ? '🔥' : '❄️'}</span>
          <span style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 900, color: augmentedStreak > 0 ? '#f97316' : '#60a5fa', lineHeight: 1 }}>{augmentedStreak}</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)' }}>{augmentedStreak % 100 >= 11 && augmentedStreak % 100 <= 14 ? 'дней' : augmentedStreak % 10 === 1 ? 'день' : augmentedStreak % 10 >= 2 && augmentedStreak % 10 <= 4 ? 'дня' : 'дней'}</span>
          {stats.maxStreak > augmentedStreak && <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', opacity: 0.7 }}>рекорд {stats.maxStreak}</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={styles.activityDots}>
            {last14Days.map((day, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.72rem', fontWeight: 800,
                  color: 'var(--text-light)',
                  opacity: day.isToday ? 1 : 0.55,
                  letterSpacing: '0.01em',
                }}>{day.dayLabel}</div>
                {day.active ? (
                  <span style={{ fontSize: '1rem', lineHeight: 1 }}>{day.isFrozen ? '❄️' : '🔥'}</span>
                ) : (
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(192,132,252,0.15)',
                    border: day.isToday ? '2px solid #f472b6' : '2px solid rgba(192,132,252,0.2)',
                  }} />
                )}
              </div>
            ))}
          </div>
          {/* coins + freeze bar */}
          <div style={styles.coinsBar}>
            <span style={styles.coinsBadge}>🌸 {totalCoins}</span>
            {freezesOwned > 0 && (
              <span style={styles.freezeBadge}>❄️ ×{freezesOwned}</span>
            )}
            {totalCoins >= freezeCost && freezesOwned < maxFreezes && (
              <button onClick={buyFreeze} style={styles.buyFreezeBtn}>
                freeze 🌸×{freezeCost}
              </button>
            )}
            {freezesOwned > 0 && augmentedStreak > 0 && quizzesToday === 0 && !isDailyDoneToday && !isTodayFrozen && (
              <button onClick={useFreeze} style={styles.activateFreezeBtn}>
                ❄️ protect streak
              </button>
            )}
            {isTodayFrozen && (
              <span style={styles.frozenTodayBadge}>❄️ protected today</span>
            )}
          </div>
        </div>
      </div>

      {/* badges row (compact) */}
      {recentBadges.length > 0 && (
        <Link to="/stats" className="glass-sm animate-fadeInUp" style={{ ...styles.badgesCompact, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', whiteSpace: 'nowrap', marginRight: 4 }}>ачивки 🏅</span>
          {recentBadges.map(a => (
            <span key={a.id} style={styles.badge} title={`${a.title}: ${a.description}`}>{a.icon}</span>
          ))}
          <span style={styles.badgeCount}>{unlockedCount}/{totalCount}</span>
        </Link>
      )}

      {/* two-column: review + calendar */}
      <div style={{ ...styles.twoCol, ...(isMobile ? { gridTemplateColumns: '1fr' } : {}) }} className="animate-fadeInUp">
        {/* review suggestions + goals */}
        <div className="glass" style={styles.twoColCard}>
          <div style={styles.twoColTitle}>review today 🧠</div>
          {difficultCount > 0 && (
            <Link to="/review" style={styles.reviewDifficult}>
              <span>💪</span>
              <span>{difficultCount} difficult {difficultCount === 1 ? 'word' : 'words'}</span>
              <span style={styles.reviewArrow}>→</span>
            </Link>
          )}
          {reviewSuggestions.slice(0, 3).map(s => (
            <Link
              key={s.lessonId}
              to={`/quiz/vocab?lesson=${s.lessonId}`}
              style={styles.reviewItem}
            >
              <span>{s.emoji}</span>
              <span style={styles.reviewLesson}>L{s.lessonId}</span>
              <span style={styles.reviewReason}>
                {s.reason === 'never quizzed' && 'not quizzed'}
                {s.reason === 'low score' && `${s.score}%`}
                {s.reason === 'time to review' && `${s.daysSince}d ago`}
              </span>
              <span style={styles.reviewArrow}>→</span>
            </Link>
          ))}
          {reviewSuggestions.length === 0 && difficultCount === 0 && (
            <div style={{ fontSize: '0.88rem', color: 'var(--text-light)', textAlign: 'center', padding: '10px 6px', fontStyle: 'italic', lineHeight: 1.5 }}>
              all caught up! 🎉<br /><span style={{ fontSize: '0.82rem', opacity: 0.75 }}>you&apos;re doing amazing ✨</span>
            </div>
          )}
          {/* next goals */}
          {nextGoals.length > 0 && (
            <div style={styles.goalsInReview}>
              <div style={styles.goalsInReviewTitle}>next goals 🎯</div>
              {nextGoals.map(goal => (
                <div key={goal.id} style={styles.goalRow}>
                  <span>{goal.icon}</span>
                  <span style={styles.goalRowText}>{goal.title}</span>
                  <div style={styles.goalMiniBar}>
                    <div style={{ ...styles.goalMiniBarFill, width: `${goal.progress * 100}%` }} />
                  </div>
                  <span style={styles.goalRowPct}>{Math.round(goal.progress * 100)}%</span>
                </div>
              ))}
            </div>
          )}
          {/* homework link */}
          <Link to="/homework" style={styles.reviewHwLink}>
            <span>📝</span> <span>домашка</span> <span style={styles.reviewArrow}>→</span>
          </Link>
          {/* mini study stats */}
          <div style={styles.miniStatsRow}>
            <div style={styles.miniStat}>
              <span style={styles.miniStatNum}>{stats.lessonsViewedCount || 0}</span>
              <span style={styles.miniStatLabel}>lessons</span>
            </div>
            <div style={styles.miniStat}>
              <span style={styles.miniStatNum}>{stats.totalQuizzes || 0}</span>
              <span style={styles.miniStatLabel}>quizzes</span>
            </div>
            <div style={styles.miniStat}>
              <span style={styles.miniStatNum}>{augmentedStreak || 0}🔥</span>
              <span style={styles.miniStatLabel}>streak</span>
            </div>
          </div>
        </div>

        {/* calendar + zoom */}
        <div className="glass" style={styles.twoColCard}>
          <StudyCalendar progress={progress} scheduleData={scheduleData} onScheduleChange={handleScheduleChange} overrides={overrides} onOverrideChange={handleOverrideChange} />
          <div style={{ marginTop: 8, borderTop: '1px solid rgba(192,132,252,0.12)', paddingTop: 8 }}>
            {(() => {
              const minsUntil = nextLesson ? Math.floor((nextLesson.date - new Date()) / 60000) : null
              const isImminent = minsUntil !== null && minsUntil >= 0 && minsUntil < 90
              return (
                <div style={{ ...styles.scheduleNext, ...(isImminent ? { color: '#f472b6' } : {}) }}>
                  {isImminent && <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#f472b6', marginRight: 6, verticalAlign: 'middle', animation: prefersReducedMotion ? undefined : 'pulse 1.5s ease-in-out infinite' }} />}
                  {formatNextLesson(nextLesson, scheduleData.emoji)}
                </div>
              )
            })()}
            <div style={{ textAlign: 'center' }}>
              <a
                href="https://zoom.us"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={styles.zoomBtn}
              >
                🎥 Zoom
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* nav tabs — three in a row */}
      <NavTabs groups={[
        { title: 'quizzes 🎯', cards: cards.filter(c => ['/quiz/vocab', '/quiz/kana', '/quiz/kanji', '/quiz/grammar', '/quiz/particles', '/quiz/te-form', '/quiz/adjectives', '/quiz/n5', '/quiz/fill-in'].includes(c.to)) },
        { title: 'study 📚', cards: cards.filter(c => ['/lessons', '/kanji', '/kana', '/review', '/conjugation', '/kana-chart', '/search', '/grammar', '/reading', '/homework', '/materials'].includes(c.to)) },
        { title: 'games 🎮', cards: cards.filter(c => ['/game/matching', '/game/typing', '/quiz/sentences', '/quiz/numbers', '/quiz/counters', '/quiz/conjugation', '/quiz/weak', '/kanji/practice', '/mistakes', '/stats'].includes(c.to)) },
      ]} />

      {/* kawaii footer */}
      <div style={styles.footer} className="animate-fadeInUp">
        <p style={styles.footerText}>
          made with 🩷 for learning にほんご
        </p>
        <p style={styles.footerCat}>
          (=^..^=) nyaa~
        </p>
      </div>
    </div>
  )
}

const styles = {
  hero: {
    textAlign: 'center',
    padding: '18px 20px 14px',
    marginBottom: 14,
    position: 'relative',
  },
  heroDecoTop: {
    display: 'flex',
    justifyContent: 'center',
    gap: 10,
    fontSize: '1.25rem',
    marginBottom: 10,
    opacity: 0.75,
  },
  heroDecoBottom: {
    display: 'flex',
    justifyContent: 'center',
    gap: 18,
    fontSize: '1.15rem',
    marginTop: 16,
    opacity: 0.55,
  },
  mascotWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: '2.6rem',
    fontWeight: 900,
    background: 'linear-gradient(135deg, #ec4899, #a855f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textTransform: 'lowercase',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
    marginBottom: 8,
    textShadow: 'none',
    paddingLeft: 0,
  },
  flag: {
    WebkitTextFillColor: 'initial',
    fontSize: '2rem',
  },
  greeting: {
    fontSize: '1.65rem',
    color: 'var(--text-secondary)',
    fontWeight: 700,
    marginBottom: 6,
    lineHeight: 1.3,
  },
  subGreeting: {
    fontSize: '1.2rem',
    color: 'var(--text-light)',
    fontWeight: 500,
    fontStyle: 'italic',
    lineHeight: 1.4,
    opacity: 0.88,
  },
  dailyTrioRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 8,
    marginBottom: 12,
  },
  dailyCard: {
    padding: '18px 14px',
    textAlign: 'center',
    transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
  },
  dailyLabel: {
    fontSize: '0.82rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 8,
    opacity: 0.9,
  },
  dailyJp: {
    fontSize: '2.2rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    marginBottom: 3,
    lineHeight: 1.15,
    textShadow: '0 2px 8px rgba(192,132,252,0.15)',
  },
  dailyKanjiChar: {
    fontSize: '2.8rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    lineHeight: 1,
    marginBottom: 6,
    textShadow: '0 2px 12px rgba(192,132,252,0.2)',
  },
  dailyRomaji: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    fontStyle: 'italic',
    marginBottom: 3,
  },
  dailyRu: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
  },
  dailyKanjiSmall: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    marginBottom: 3,
  },
  dailyTapHint: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    marginTop: 6,
    opacity: 0.65,
    letterSpacing: '0.03em',
  },
  dailyLessonTag: {
    fontSize: '0.78rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    background: 'rgba(168, 85, 247, 0.1)',
    padding: '2px 8px',
    borderRadius: 50,
    display: 'inline-block',
  },
  dailyCopyRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  dailyCopyBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.85rem',
    padding: '2px 4px',
    borderRadius: 4,
    transition: 'transform 0.2s',
    minHeight: 44,
    minWidth: 44,
  },
  streakReminder: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    marginBottom: 12,
    textDecoration: 'none',
    color: 'inherit',
    background: 'linear-gradient(135deg, rgba(251,191,36,0.22), rgba(249,115,22,0.16))',
    border: '2px solid rgba(249,115,22,0.5)',
    boxShadow: '0 2px 12px rgba(249,115,22,0.18)',
  },
  streakReminderIcon: {
    fontSize: '1.4rem',
    flexShrink: 0,
  },
  streakReminderContent: {
    flex: 1,
  },
  streakReminderTitle: {
    fontSize: '0.9rem',
    fontWeight: 800,
    color: 'var(--gold-text)',
    textTransform: 'lowercase',
  },
  streakReminderDesc: {
    fontSize: '0.82rem',
    fontWeight: 500,
    color: 'var(--text-light)',
  },
  streakReminderArrow: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--gold-text)',
    flexShrink: 0,
  },
  streakCelebration: {
    textAlign: 'center',
    padding: '20px 20px',
    marginBottom: 12,
    background: 'linear-gradient(135deg, rgba(251,191,36,0.18), rgba(244,114,182,0.18))',
    border: '2px solid rgba(251,191,36,0.35)',
    borderRadius: 18,
    boxShadow: '0 6px 24px rgba(251,191,36,0.15)',
  },
  streakCelebEmoji: {
    fontSize: '2.8rem',
    marginBottom: 6,
    display: 'block',
    filter: 'drop-shadow(0 2px 8px rgba(251,191,36,0.4))',
  },
  streakCelebText: {
    fontSize: '1.2rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    marginBottom: 4,
  },
  streakCelebSub: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--gold-text)',
  },
  coinsBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  coinsBadge: {
    fontSize: '0.72rem',
    fontWeight: 800,
    color: '#f472b6',
    background: 'rgba(244,114,182,0.1)',
    padding: '2px 8px',
    borderRadius: 50,
    border: '1px solid rgba(244,114,182,0.25)',
  },
  freezeBadge: {
    fontSize: '0.72rem',
    fontWeight: 800,
    color: '#60a5fa',
    background: 'rgba(96,165,250,0.1)',
    padding: '2px 8px',
    borderRadius: 50,
    border: '1px solid rgba(96,165,250,0.25)',
  },
  buyFreezeBtn: {
    fontSize: '0.72rem',
    fontWeight: 800,
    padding: '3px 10px',
    borderRadius: 50,
    border: '1.5px solid rgba(244,114,182,0.4)',
    background: 'rgba(244,114,182,0.08)',
    color: '#ec4899',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    minHeight: 44,
  },
  activateFreezeBtn: {
    fontSize: '0.72rem',
    fontWeight: 800,
    padding: '3px 10px',
    borderRadius: 50,
    border: '1.5px solid rgba(96,165,250,0.5)',
    background: 'rgba(96,165,250,0.1)',
    color: '#60a5fa',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    minHeight: 44,
  },
  frozenTodayBadge: {
    fontSize: '0.72rem',
    fontWeight: 800,
    color: '#60a5fa',
    padding: '2px 8px',
    borderRadius: 50,
    background: 'rgba(96,165,250,0.1)',
    border: '1px solid rgba(96,165,250,0.3)',
  },
  challengeRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 12,
  },
  dailyBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 16px',
    textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer',
    border: 'none',
    boxShadow: '0 3px 16px rgba(236,72,153,0.12), 0 0 0 1.5px rgba(244,114,182,0.3)',
  },
  dailyBannerIcon: {
    fontSize: '1.8rem',
    flexShrink: 0,
  },
  dailyBannerContent: {
    flex: 1,
    minWidth: 0,
  },
  dailyBannerTitle: {
    fontSize: '1rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    textTransform: 'lowercase',
    marginBottom: 2,
  },
  dailyBannerDesc: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-light)',
  },
  dailyBannerArrow: {
    fontSize: '1.2rem',
    color: 'var(--text-light)',
    fontWeight: 700,
    flexShrink: 0,
  },
  weeklyCard: {
    padding: '14px 16px',
    borderRadius: 16,
    border: 'none',
  },
  weeklyHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  weeklyIcon: {
    fontSize: '1.3rem',
    flexShrink: 0,
  },
  weeklyInfo: {
    flex: 1,
    minWidth: 0,
  },
  weeklyTitle: {
    fontSize: '0.98rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    textTransform: 'lowercase',
  },
  weeklyDesc: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-light)',
  },
  weeklyClaimBtn: {
    fontSize: '0.78rem',
    padding: '6px 14px',
    borderRadius: 50,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  weeklyDone: {
    fontSize: '0.82rem',
    fontWeight: 800,
    color: 'var(--correct-text)',
    flexShrink: 0,
  },
  weeklyBarTrack: {
    height: 8,
    borderRadius: 50,
    background: 'rgba(192, 132, 252, 0.15)',
    overflow: 'hidden',
    marginBottom: 4,
  },
  weeklyBarFill: {
    height: '100%',
    borderRadius: 50,
    transition: 'width 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
    boxShadow: '0 0 8px rgba(236,72,153,0.3)',
  },
  weeklyProgress: {
    fontSize: '0.82rem',
    fontWeight: 700,
    color: 'var(--text-light)',
  },
  quickCard: {
    padding: '12px 14px',
    marginBottom: 10,
    textAlign: 'center',
  },
  quickTitle: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    textTransform: 'lowercase',
    marginBottom: 10,
  },
  quickRow: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  quickBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    minHeight: 44,
    borderRadius: 50,
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--text-main)',
    textDecoration: 'none',
    transition: 'all 0.2s',
    border: 'none',
    boxShadow: '0 0 0 1.5px rgba(192,132,252,0.25)',
  },
  dashRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 8,
    marginBottom: 10,
  },
  dashItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 6px',
    gap: 2,
  },
  dashIcon: {
    fontSize: '1.2rem',
  },
  dashNum: {
    fontSize: '2.6rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    lineHeight: 1,
  },
  dashLabel: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    textTransform: 'lowercase',
    textAlign: 'center',
  },
  miniGoalRing: {
    position: 'relative',
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniGoalTime: {
    position: 'absolute',
    fontSize: '0.78rem',
    fontWeight: 800,
    color: 'var(--text-main)',
  },
  xpMiniWrap: {
    marginBottom: 2,
  },
  xpMiniBadge: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(236,72,153,0.2)',
  },
  xpMiniNum: {
    fontSize: '0.78rem',
    fontWeight: 900,
    color: 'white',
  },
  xpCompact: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    marginBottom: 8,
  },
  xpCompactBar: {
    flex: 1,
    height: 8,
    borderRadius: 50,
    background: 'rgba(192,132,252,0.15)',
    overflow: 'hidden',
    position: 'relative',
  },
  xpCompactFill: {
    height: '100%',
    borderRadius: 50,
    background: 'linear-gradient(90deg, #f472b6, #c084fc, #f472b6)',
    backgroundSize: '200% 100%',
    ...(prefersReducedMotion ? {} : { animation: 'shimmer 2.5s linear infinite' }),
    transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
    minWidth: 4,
    boxShadow: '0 0 8px rgba(236,72,153,0.35)',
  },
  xpCompactText: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    whiteSpace: 'nowrap',
  },
  todayXPTag: {
    fontSize: '0.85rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    background: 'rgba(192,132,252,0.12)',
    padding: '2px 10px',
    borderRadius: 50,
    whiteSpace: 'nowrap',
  },
  comboTag: {
    fontSize: '0.85rem',
    fontWeight: 800,
    color: 'var(--gold-text)',
    background: 'rgba(217, 119, 6, 0.12)',
    padding: '2px 10px',
    borderRadius: 50,
    whiteSpace: 'nowrap',
  },
  comebackTag: {
    fontSize: '0.85rem',
    fontWeight: 800,
    color: 'var(--correct-text)',
    background: 'rgba(16, 185, 129, 0.12)',
    padding: '2px 10px',
    borderRadius: 50,
    whiteSpace: 'nowrap',
  },
  activityRow: {
    display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', marginBottom: 8,
  },
  activityDots: {
    display: 'flex', gap: 3, flex: 1,
  },
  activityLabel: {
    fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', whiteSpace: 'nowrap',
  },
  badgesCompact: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '8px 14px',
    marginBottom: 12,
    textDecoration: 'none',
    color: 'inherit',
  },
  badge: {
    fontSize: '1.3rem',
    filter: 'drop-shadow(0 1px 3px rgba(236,72,153,0.15))',
  },
  badgeCount: {
    fontSize: '0.82rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    background: 'rgba(192,132,252,0.1)',
    padding: '2px 8px',
    borderRadius: 50,
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 12,
  },
  twoColCard: {
    padding: '16px 14px',
  },
  twoColTitle: {
    fontSize: '1.2rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    textTransform: 'lowercase',
    marginBottom: 10,
    textAlign: 'center',
  },
  reviewHwLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 10px',
    borderRadius: 8,
    background: 'rgba(251,191,36,0.1)',
    border: '1px solid rgba(251,191,36,0.2)',
    textDecoration: 'none',
    color: 'var(--text-main)',
    fontSize: '0.92rem',
    fontWeight: 700,
    marginTop: 8,
    transition: 'all 0.2s',
  },
  reviewDifficult: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '7px 10px',
    borderRadius: 8,
    background: 'linear-gradient(135deg, rgba(244,114,182,0.08), rgba(192,132,252,0.08))',
    border: '1px solid rgba(244,114,182,0.15)',
    textDecoration: 'none',
    color: 'var(--text-main)',
    fontSize: '0.88rem',
    fontWeight: 700,
    marginBottom: 4,
    transition: 'all 0.2s',
  },
  reviewItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 10px',
    borderRadius: 8,
    background: 'rgba(192, 132, 252, 0.1)',
    textDecoration: 'none',
    color: 'var(--text-main)',
    fontSize: '0.88rem',
    fontWeight: 600,
    marginBottom: 3,
    transition: 'all 0.2s',
  },
  reviewLesson: {
    fontWeight: 800,
    color: 'var(--text-light)',
    fontSize: '0.95rem',
  },
  reviewReason: {
    flex: 1,
    color: 'var(--text-light)',
    fontSize: '0.88rem',
  },
  reviewArrow: {
    color: 'var(--text-light)',
    fontWeight: 700,
    fontSize: '0.92rem',
  },
  miniStatsRow: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1px solid rgba(192,132,252,0.1)',
  },
  miniStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1,
  },
  miniStatNum: {
    fontSize: '1.3rem',
    fontWeight: 900,
    color: 'var(--text-main)',
  },
  miniStatLabel: {
    fontSize: '0.82rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    textTransform: 'lowercase',
  },
  scheduleDays: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    marginBottom: 3,
    textAlign: 'center',
  },
  scheduleNext: {
    fontSize: '1rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    textAlign: 'center',
    marginBottom: 8,
  },
  zoomBtn: {
    fontSize: '0.82rem',
    padding: '6px 16px',
    display: 'inline-block',
    textAlign: 'center',
    maxWidth: 140,
  },
  miniDotsLabel: {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    textTransform: 'lowercase',
    textAlign: 'center',
    marginBottom: 4,
  },
  miniDotsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'center',
  },
  miniDotFull: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
  },
  miniDotEmpty: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    border: '1.5px solid rgba(192,132,252,0.25)',
    boxSizing: 'border-box',
  },
  goalsInReview: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1px solid rgba(192,132,252,0.1)',
  },
  goalsInReviewTitle: {
    fontSize: '0.95rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 8,
    textAlign: 'center',
  },
  goalRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 0',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  goalRowText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '0.9rem',
    flexShrink: 0,
    width: '38%',
  },
  goalMiniBar: {
    flex: 1,
    height: 7,
    borderRadius: 50,
    background: 'rgba(192,132,252,0.12)',
    overflow: 'hidden',
    minWidth: 30,
  },
  goalMiniBarFill: {
    height: '100%',
    borderRadius: 50,
    background: 'linear-gradient(90deg, #f472b6, #c084fc)',
  },
  goalRowPct: {
    color: 'var(--text-light)',
    fontWeight: 800,
    fontSize: '0.9rem',
    minWidth: 30,
    textAlign: 'right',
  },
  footer: {
    textAlign: 'center',
    padding: '24px 0',
  },
  footerText: {
    fontSize: '0.85rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    marginBottom: 4,
  },
  footerCat: {
    fontSize: '0.88rem',
    color: 'var(--text-light)',
    fontFamily: 'monospace',
    fontWeight: 600,
  },
}
