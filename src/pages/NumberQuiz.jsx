import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useXP } from '../hooks/useXP'
import { useProgress } from '../hooks/useProgress'
import { useIsMobile, useIsTablet } from '../hooks/useIsMobile'
import Confetti from '../components/Confetti'
import ShareResult from '../components/ShareResult'
import { getStoredQuizSize } from '../utils/localSettings'
import { prefersReducedMotion as getPrefersReducedMotion } from '../utils/motion'

const prefersReducedMotion = getPrefersReducedMotion()

// ─── DATA ──────────────────────────────────────────────────────────

const basicNumbers1to100 = [
  { japanese: '一', romaji: 'ichi', display: '1', note: null },
  { japanese: '二', romaji: 'ni', display: '2', note: null },
  { japanese: '三', romaji: 'san', display: '3', note: null },
  { japanese: '四', romaji: 'yon', display: '4', note: 'also "shi" — but "yon" is more common' },
  { japanese: '五', romaji: 'go', display: '5', note: null },
  { japanese: '六', romaji: 'roku', display: '6', note: null },
  { japanese: '七', romaji: 'nana', display: '7', note: 'also "shichi"' },
  { japanese: '八', romaji: 'hachi', display: '8', note: null },
  { japanese: '九', romaji: 'kyuu', display: '9', note: 'also "ku"' },
  { japanese: '十', romaji: 'juu', display: '10', note: null },
  { japanese: '十一', romaji: 'juuichi', display: '11', note: null },
  { japanese: '十二', romaji: 'juuni', display: '12', note: null },
  { japanese: '十三', romaji: 'juusan', display: '13', note: null },
  { japanese: '十四', romaji: 'juuyon', display: '14', note: null },
  { japanese: '十五', romaji: 'juugo', display: '15', note: null },
  { japanese: '十六', romaji: 'juuroku', display: '16', note: null },
  { japanese: '十七', romaji: 'juunana', display: '17', note: 'also "juushichi"' },
  { japanese: '十八', romaji: 'juuhachi', display: '18', note: null },
  { japanese: '十九', romaji: 'juukyuu', display: '19', note: null },
  { japanese: '二十', romaji: 'nijuu', display: '20', note: null },
  { japanese: '三十', romaji: 'sanjuu', display: '30', note: null },
  { japanese: '四十', romaji: 'yonjuu', display: '40', note: null },
  { japanese: '五十', romaji: 'gojuu', display: '50', note: null },
  { japanese: '六十', romaji: 'rokujuu', display: '60', note: null },
  { japanese: '七十', romaji: 'nanajuu', display: '70', note: null },
  { japanese: '八十', romaji: 'hachijuu', display: '80', note: null },
  { japanese: '九十', romaji: 'kyuujuu', display: '90', note: null },
  { japanese: '百', romaji: 'hyaku', display: '100', note: null },
]

const basicNumbers100to1000 = [
  { japanese: '百', romaji: 'hyaku', display: '100', note: null },
  { japanese: '二百', romaji: 'nihyaku', display: '200', note: null },
  { japanese: '三百', romaji: 'sanbyaku', display: '300', note: 'irregular! hyaku -> byaku' },
  { japanese: '四百', romaji: 'yonhyaku', display: '400', note: null },
  { japanese: '五百', romaji: 'gohyaku', display: '500', note: null },
  { japanese: '六百', romaji: 'roppyaku', display: '600', note: 'irregular! hyaku -> ppyaku' },
  { japanese: '七百', romaji: 'nanahyaku', display: '700', note: null },
  { japanese: '八百', romaji: 'happyaku', display: '800', note: 'irregular! hyaku -> ppyaku' },
  { japanese: '九百', romaji: 'kyuuhyaku', display: '900', note: null },
  { japanese: '千', romaji: 'sen', display: '1000', note: null },
]

const basicNumbers1000to10000 = [
  { japanese: '千', romaji: 'sen', display: '1,000', note: null },
  { japanese: '二千', romaji: 'nisen', display: '2,000', note: null },
  { japanese: '三千', romaji: 'sanzen', display: '3,000', note: 'irregular! sen -> zen' },
  { japanese: '四千', romaji: 'yonsen', display: '4,000', note: null },
  { japanese: '五千', romaji: 'gosen', display: '5,000', note: null },
  { japanese: '六千', romaji: 'rokusen', display: '6,000', note: null },
  { japanese: '七千', romaji: 'nanasen', display: '7,000', note: null },
  { japanese: '八千', romaji: 'hassen', display: '8,000', note: 'irregular! sen -> ssen' },
  { japanese: '九千', romaji: 'kyuusen', display: '9,000', note: null },
  { japanese: '一万', romaji: 'ichiman', display: '10,000', note: null },
]

const timeHours = [
  { japanese: '一時', romaji: 'ichiji', display: '1:00', note: null },
  { japanese: '二時', romaji: 'niji', display: '2:00', note: null },
  { japanese: '三時', romaji: 'sanji', display: '3:00', note: null },
  { japanese: '四時', romaji: 'yoji', display: '4:00', note: 'irregular! not "yonji" or "shiji"' },
  { japanese: '五時', romaji: 'goji', display: '5:00', note: null },
  { japanese: '六時', romaji: 'rokuji', display: '6:00', note: null },
  { japanese: '七時', romaji: 'shichiji', display: '7:00', note: 'irregular! "shichi" not "nana"' },
  { japanese: '八時', romaji: 'hachiji', display: '8:00', note: null },
  { japanese: '九時', romaji: 'kuji', display: '9:00', note: 'irregular! "ku" not "kyuu"' },
  { japanese: '十時', romaji: 'juuji', display: '10:00', note: null },
  { japanese: '十一時', romaji: 'juuichiji', display: '11:00', note: null },
  { japanese: '十二時', romaji: 'juuniji', display: '12:00', note: null },
]

const timeMinutes = [
  { japanese: '一分', romaji: 'ippun', display: '1 min', note: 'irregular! "ippun" not "ichifun"' },
  { japanese: '二分', romaji: 'nifun', display: '2 min', note: null },
  { japanese: '三分', romaji: 'sanpun', display: '3 min', note: 'irregular! "pun" not "fun"' },
  { japanese: '四分', romaji: 'yonpun', display: '4 min', note: 'irregular! "pun" not "fun"' },
  { japanese: '五分', romaji: 'gofun', display: '5 min', note: null },
  { japanese: '六分', romaji: 'roppun', display: '6 min', note: 'irregular! "roppun" not "rokufun"' },
  { japanese: '七分', romaji: 'nanafun', display: '7 min', note: null },
  { japanese: '八分', romaji: 'happun', display: '8 min', note: 'irregular! "happun" (also "hachifun")' },
  { japanese: '九分', romaji: 'kyuufun', display: '9 min', note: null },
  { japanese: '十分', romaji: 'juppun', display: '10 min', note: 'irregular! "juppun" not "juufun"' },
  { japanese: '十五分', romaji: 'juugofun', display: '15 min', note: null },
  { japanese: '二十分', romaji: 'nijuppun', display: '20 min', note: 'irregular! "juppun"' },
  { japanese: '二十五分', romaji: 'nijuugofun', display: '25 min', note: null },
  { japanese: '三十分', romaji: 'sanjuppun', display: '30 min', note: 'also "han" (half)' },
  { japanese: '四十五分', romaji: 'yonjuugofun', display: '45 min', note: null },
]

const months = [
  { japanese: '一月', romaji: 'ichigatsu', display: 'January', note: null },
  { japanese: '二月', romaji: 'nigatsu', display: 'February', note: null },
  { japanese: '三月', romaji: 'sangatsu', display: 'March', note: null },
  { japanese: '四月', romaji: 'shigatsu', display: 'April', note: 'irregular! "shi" not "yon"' },
  { japanese: '五月', romaji: 'gogatsu', display: 'May', note: null },
  { japanese: '六月', romaji: 'rokugatsu', display: 'June', note: null },
  { japanese: '七月', romaji: 'shichigatsu', display: 'July', note: 'irregular! "shichi" not "nana"' },
  { japanese: '八月', romaji: 'hachigatsu', display: 'August', note: null },
  { japanese: '九月', romaji: 'kugatsu', display: 'September', note: 'irregular! "ku" not "kyuu"' },
  { japanese: '十月', romaji: 'juugatsu', display: 'October', note: null },
  { japanese: '十一月', romaji: 'juuichigatsu', display: 'November', note: null },
  { japanese: '十二月', romaji: 'juunigatsu', display: 'December', note: null },
]

const days = [
  { japanese: '一日', romaji: 'tsuitachi', display: '1st', note: 'completely irregular! unique reading' },
  { japanese: '二日', romaji: 'futsuka', display: '2nd', note: 'wago (Japanese) reading' },
  { japanese: '三日', romaji: 'mikka', display: '3rd', note: 'wago reading' },
  { japanese: '四日', romaji: 'yokka', display: '4th', note: 'wago reading' },
  { japanese: '五日', romaji: 'itsuka', display: '5th', note: 'wago reading' },
  { japanese: '六日', romaji: 'muika', display: '6th', note: 'wago reading' },
  { japanese: '七日', romaji: 'nanoka', display: '7th', note: 'wago reading' },
  { japanese: '八日', romaji: 'youka', display: '8th', note: 'wago reading' },
  { japanese: '九日', romaji: 'kokonoka', display: '9th', note: 'wago reading' },
  { japanese: '十日', romaji: 'tooka', display: '10th', note: 'wago reading' },
  { japanese: '十一日', romaji: 'juuichinichi', display: '11th', note: null },
  { japanese: '十二日', romaji: 'juuninichi', display: '12th', note: null },
  { japanese: '十三日', romaji: 'juusannichi', display: '13th', note: null },
  { japanese: '十四日', romaji: 'juuyokka', display: '14th', note: 'irregular! uses "yokka"' },
  { japanese: '十五日', romaji: 'juugonichi', display: '15th', note: null },
  { japanese: '十六日', romaji: 'juurokunichi', display: '16th', note: null },
  { japanese: '十七日', romaji: 'juushichinichi', display: '17th', note: null },
  { japanese: '十八日', romaji: 'juuhachinichi', display: '18th', note: null },
  { japanese: '十九日', romaji: 'juukunichi', display: '19th', note: null },
  { japanese: '二十日', romaji: 'hatsuka', display: '20th', note: 'completely irregular! unique reading' },
  { japanese: '二十一日', romaji: 'nijuuichinichi', display: '21st', note: null },
  { japanese: '二十二日', romaji: 'nijuuninichi', display: '22nd', note: null },
  { japanese: '二十三日', romaji: 'nijuusannichi', display: '23rd', note: null },
  { japanese: '二十四日', romaji: 'nijuuyokka', display: '24th', note: 'irregular! uses "yokka"' },
  { japanese: '二十五日', romaji: 'nijuugonichi', display: '25th', note: null },
  { japanese: '二十六日', romaji: 'nijuurokunichi', display: '26th', note: null },
  { japanese: '二十七日', romaji: 'nijuushichinichi', display: '27th', note: null },
  { japanese: '二十八日', romaji: 'nijuuhachinichi', display: '28th', note: null },
  { japanese: '二十九日', romaji: 'nijuukunichi', display: '29th', note: null },
  { japanese: '三十日', romaji: 'sanjuunichi', display: '30th', note: null },
  { japanese: '三十一日', romaji: 'sanjuuichinichi', display: '31st', note: null },
]

const counterMai = [
  { japanese: '一枚', romaji: 'ichimai', display: '1 flat thing', note: 'paper, shirts, plates' },
  { japanese: '二枚', romaji: 'nimai', display: '2 flat things', note: null },
  { japanese: '三枚', romaji: 'sanmai', display: '3 flat things', note: null },
  { japanese: '四枚', romaji: 'yonmai', display: '4 flat things', note: null },
  { japanese: '五枚', romaji: 'gomai', display: '5 flat things', note: null },
  { japanese: '六枚', romaji: 'rokumai', display: '6 flat things', note: null },
  { japanese: '七枚', romaji: 'nanamai', display: '7 flat things', note: null },
  { japanese: '八枚', romaji: 'hachimai', display: '8 flat things', note: null },
  { japanese: '九枚', romaji: 'kyuumai', display: '9 flat things', note: null },
  { japanese: '十枚', romaji: 'juumai', display: '10 flat things', note: null },
]

const counterDai = [
  { japanese: '一台', romaji: 'ichidai', display: '1 machine/vehicle', note: 'cars, computers, TVs' },
  { japanese: '二台', romaji: 'nidai', display: '2 machines', note: null },
  { japanese: '三台', romaji: 'sandai', display: '3 machines', note: null },
  { japanese: '四台', romaji: 'yondai', display: '4 machines', note: null },
  { japanese: '五台', romaji: 'godai', display: '5 machines', note: null },
  { japanese: '六台', romaji: 'rokudai', display: '6 machines', note: null },
  { japanese: '七台', romaji: 'nanadai', display: '7 machines', note: null },
  { japanese: '八台', romaji: 'hachidai', display: '8 machines', note: null },
  { japanese: '九台', romaji: 'kyuudai', display: '9 machines', note: null },
  { japanese: '十台', romaji: 'juudai', display: '10 machines', note: null },
]

const counterHiki = [
  { japanese: '一匹', romaji: 'ippiki', display: '1 small animal', note: 'irregular! "ippiki"' },
  { japanese: '二匹', romaji: 'nihiki', display: '2 small animals', note: null },
  { japanese: '三匹', romaji: 'sanbiki', display: '3 small animals', note: 'irregular! "biki"' },
  { japanese: '四匹', romaji: 'yonhiki', display: '4 small animals', note: null },
  { japanese: '五匹', romaji: 'gohiki', display: '5 small animals', note: null },
  { japanese: '六匹', romaji: 'roppiki', display: '6 small animals', note: 'irregular! "roppiki"' },
  { japanese: '七匹', romaji: 'nanahiki', display: '7 small animals', note: null },
  { japanese: '八匹', romaji: 'happiki', display: '8 small animals', note: 'irregular! "happiki"' },
  { japanese: '九匹', romaji: 'kyuuhiki', display: '9 small animals', note: null },
  { japanese: '十匹', romaji: 'juppiki', display: '10 small animals', note: 'irregular! "juppiki"' },
]

const counterHon = [
  { japanese: '一本', romaji: 'ippon', display: '1 long thing', note: 'irregular! pens, bottles, trees' },
  { japanese: '二本', romaji: 'nihon', display: '2 long things', note: null },
  { japanese: '三本', romaji: 'sanbon', display: '3 long things', note: 'irregular! "bon"' },
  { japanese: '四本', romaji: 'yonhon', display: '4 long things', note: null },
  { japanese: '五本', romaji: 'gohon', display: '5 long things', note: null },
  { japanese: '六本', romaji: 'roppon', display: '6 long things', note: 'irregular! "roppon"' },
  { japanese: '七本', romaji: 'nanahon', display: '7 long things', note: null },
  { japanese: '八本', romaji: 'happon', display: '8 long things', note: 'irregular! "happon"' },
  { japanese: '九本', romaji: 'kyuuhon', display: '9 long things', note: null },
  { japanese: '十本', romaji: 'juppon', display: '10 long things', note: 'irregular! "juppon"' },
]

const counterHai = [
  { japanese: '一杯', romaji: 'ippai', display: '1 cup/glass', note: 'irregular! drinks, bowls' },
  { japanese: '二杯', romaji: 'nihai', display: '2 cups', note: null },
  { japanese: '三杯', romaji: 'sanbai', display: '3 cups', note: 'irregular! "bai"' },
  { japanese: '四杯', romaji: 'yonhai', display: '4 cups', note: null },
  { japanese: '五杯', romaji: 'gohai', display: '5 cups', note: null },
  { japanese: '六杯', romaji: 'roppai', display: '6 cups', note: 'irregular! "roppai"' },
  { japanese: '七杯', romaji: 'nanahai', display: '7 cups', note: null },
  { japanese: '八杯', romaji: 'happai', display: '8 cups', note: 'irregular! "happai"' },
  { japanese: '九杯', romaji: 'kyuuhai', display: '9 cups', note: null },
  { japanese: '十杯', romaji: 'juppai', display: '10 cups', note: 'irregular! "juppai"' },
]

const counterKai = [
  { japanese: '一回', romaji: 'ikkai', display: '1 time', note: 'irregular! "ikkai"' },
  { japanese: '二回', romaji: 'nikai', display: '2 times', note: null },
  { japanese: '三回', romaji: 'sankai', display: '3 times', note: null },
  { japanese: '四回', romaji: 'yonkai', display: '4 times', note: null },
  { japanese: '五回', romaji: 'gokai', display: '5 times', note: null },
  { japanese: '六回', romaji: 'rokkai', display: '6 times', note: 'irregular! "rokkai"' },
  { japanese: '七回', romaji: 'nanakai', display: '7 times', note: null },
  { japanese: '八回', romaji: 'hakkai', display: '8 times', note: 'irregular! "hakkai"' },
  { japanese: '九回', romaji: 'kyuukai', display: '9 times', note: null },
  { japanese: '十回', romaji: 'jukkai', display: '10 times', note: 'irregular! "jukkai"' },
]

const counterTsu = [
  { japanese: '一つ', romaji: 'hitotsu', display: '1 (general)', note: 'wago reading, general counter' },
  { japanese: '二つ', romaji: 'futatsu', display: '2 (general)', note: 'wago reading' },
  { japanese: '三つ', romaji: 'mittsu', display: '3 (general)', note: 'wago reading' },
  { japanese: '四つ', romaji: 'yottsu', display: '4 (general)', note: 'wago reading' },
  { japanese: '五つ', romaji: 'itsutsu', display: '5 (general)', note: 'wago reading' },
  { japanese: '六つ', romaji: 'muttsu', display: '6 (general)', note: 'wago reading' },
  { japanese: '七つ', romaji: 'nanatsu', display: '7 (general)', note: 'wago reading' },
  { japanese: '八つ', romaji: 'yattsu', display: '8 (general)', note: 'wago reading' },
  { japanese: '九つ', romaji: 'kokonotsu', display: '9 (general)', note: 'wago reading' },
  { japanese: '十', romaji: 'too', display: '10 (general)', note: 'wago reading, no "tsu" ending' },
]

const categories = [
  { key: 'basic1', label: 'numbers 1-100', labelJp: '1〜100', emoji: '🔢', data: basicNumbers1to100 },
  { key: 'basic2', label: 'hundreds', labelJp: '100〜1000', emoji: '💯', data: basicNumbers100to1000 },
  { key: 'basic3', label: 'thousands', labelJp: '1000〜10000', emoji: '🏔️', data: basicNumbers1000to10000 },
  { key: 'hours', label: 'hours', labelJp: '〜時', emoji: '🕐', data: timeHours },
  { key: 'minutes', label: 'minutes', labelJp: '〜分', emoji: '⏱️', data: timeMinutes },
  { key: 'months', label: 'months', labelJp: '〜月', emoji: '📅', data: months },
  { key: 'days', label: 'days of month', labelJp: '〜日', emoji: '📆', data: days },
  { key: 'mai', label: '~mai (flat)', labelJp: '〜枚', emoji: '📄', data: counterMai },
  { key: 'dai', label: '~dai (machines)', labelJp: '〜台', emoji: '🚗', data: counterDai },
  { key: 'hiki', label: '~hiki (animals)', labelJp: '〜匹', emoji: '🐱', data: counterHiki },
  { key: 'hon', label: '~hon (long)', labelJp: '〜本', emoji: '🖊️', data: counterHon },
  { key: 'hai', label: '~hai (cups)', labelJp: '〜杯', emoji: '🍵', data: counterHai },
  { key: 'kai', label: '~kai (times)', labelJp: '〜回', emoji: '🔄', data: counterKai },
  { key: 'tsu', label: '~tsu (general)', labelJp: '〜つ', emoji: '🌸', data: counterTsu },
]

// ─── HELPERS ───────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function normalizeRomaji(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[\s\-.]/g, '')
    .replace(/ou/g, 'oo')
    .replace(/uu/g, 'uu')
    .replace(/[ōô]/g, 'oo')
    .replace(/[ūû]/g, 'uu')
}

function checkAnswer(userInput, correctRomaji) {
  const norm = normalizeRomaji(userInput)
  const correct = normalizeRomaji(correctRomaji)
  if (norm === correct) return true
  // allow common alternate long vowel notations
  const altCorrect = correct
    .replace(/oo/g, 'ou')
  if (norm === altCorrect) return true
  // allow without double vowels
  const relaxed = correct
    .replace(/uu/g, 'u')
    .replace(/oo/g, 'o')
  if (norm === relaxed) return true
  return false
}

const scoreReactions = [
  { min: 90, emoji: '🎉✨🐱', text: 'sugoi!! numbers are no match for you!', textJp: 'すごい！' },
  { min: 70, emoji: '🌸😊', text: 'yoku dekimashita! almost there~', textJp: 'よくできました！' },
  { min: 50, emoji: '🐱💪', text: 'mada mada~ numbers are tricky!', textJp: 'まだまだ！' },
  { min: 0, emoji: '🌙📚', text: 'ganbatte! practice makes perfect~', textJp: 'がんばって！' },
]

const PHASE_SETUP = 'setup'
const PHASE_QUIZ = 'quiz'
const PHASE_RESULTS = 'results'

// ─── MAIN COMPONENT ───────────────────────────────────────────────

export default function NumberQuiz() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const { awardXP, calculateQuizXP } = useXP()
  const { saveQuizResult } = useProgress()
  const [phase, setPhase] = useState(PHASE_SETUP)

  // setup
  const [selectedCategories, setSelectedCategories] = useState([])
  const [questionCount, setQuestionCount] = useState(getStoredQuizSize)

  // quiz
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [userInput, setUserInput] = useState('')
  const streakRef = useRef(0)
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(null)
  const [mistakes, setMistakes] = useState([])
  const timerRef = useRef(null)
  const inputRef = useRef(null)
  const answerLockedRef = useRef(false)
  const advanceLockedRef = useRef(false)
  const xpAwardedRef = useRef(false)

  const toggleCategory = (key) => {
    setSelectedCategories(prev =>
      prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]
    )
  }

  const selectAll = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([])
    } else {
      setSelectedCategories(categories.map(c => c.key))
    }
  }

  const getPool = () => {
    return categories
      .filter(c => selectedCategories.includes(c.key))
      .flatMap(c => c.data.map(item => ({ ...item, category: c.key, categoryLabel: c.label })))
  }

  const startQuiz = () => {
    const pool = getPool()
    if (pool.length === 0) return
    clearTimeout(timerRef.current)
    const count = Math.min(questionCount, pool.length)
    const selected = shuffle(pool).slice(0, count)
    xpAwardedRef.current = false
    setQuestions(selected)
    setCurrentIndex(0)
    setScore(0)
    streakRef.current = 0
    setBestStreak(0)
    setUserInput('')
    setAnswered(false)
    setIsCorrect(null)
    setMistakes([])
    answerLockedRef.current = false
    advanceLockedRef.current = false
    setPhase(PHASE_QUIZ)
  }

  const handleSubmit = useCallback((e) => {
    if (e) e.preventDefault()
    if (answered || answerLockedRef.current || !userInput.trim()) return
    answerLockedRef.current = true
    advanceLockedRef.current = false

    const current = questions[currentIndex]
    const correct = checkAnswer(userInput, current.romaji)

    setAnswered(true)
    setIsCorrect(correct)

    if (correct) {
      setScore(prev => prev + 1)
      streakRef.current += 1
      setBestStreak(b => Math.max(b, streakRef.current))
    } else {
      streakRef.current = 0
      setMistakes(prev => [...prev, {
        question: current,
        yourAnswer: userInput.trim(),
      }])
    }

    timerRef.current = setTimeout(() => {
      if (advanceLockedRef.current) return
      advanceLockedRef.current = true

      if (currentIndex + 1 >= questions.length) {
        setPhase(PHASE_RESULTS)
      } else {
        setCurrentIndex(prev => prev + 1)
        setUserInput('')
        setAnswered(false)
        setIsCorrect(null)
        answerLockedRef.current = false
      }
    }, correct ? 1200 : 2200)
  }, [answered, userInput, questions, currentIndex])

  // focus input when new question appears
  useEffect(() => {
    if (phase === PHASE_QUIZ && !answered && inputRef.current) {
      inputRef.current.focus()
    }
  }, [currentIndex, phase, answered])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const skipDelay = useCallback(() => {
    if (!answered || advanceLockedRef.current) return
    advanceLockedRef.current = true
    clearTimeout(timerRef.current)
    if (currentIndex + 1 >= questions.length) {
      setPhase(PHASE_RESULTS)
    } else {
      setCurrentIndex(prev => prev + 1)
      setUserInput('')
      setAnswered(false)
      setIsCorrect(null)
      answerLockedRef.current = false
    }
  }, [answered, currentIndex, questions.length])

  // Enter/Space to skip delay after wrong answer
  useEffect(() => {
    if (phase !== PHASE_QUIZ || !answered || isCorrect) return
    const handler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skipDelay() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, answered, isCorrect, skipDelay])

  useEffect(() => {
    if (phase === PHASE_RESULTS && questions.length > 0 && !xpAwardedRef.current) {
      xpAwardedRef.current = true
      saveQuizResult('vocab', { score, total: questions.length })
      const xp = calculateQuizXP(score, questions.length)
      if (xp > 0) awardXP(xp, 'number quiz', score === questions.length && questions.length > 0)
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const pool = getPool()
  const totalItems = pool.length
  const canStart = selectedCategories.length > 0 && totalItems > 0
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
  const reaction = scoreReactions.find(r => percentage >= r.min) || scoreReactions[scoreReactions.length - 1]


  // scroll to top when results phase begins
  useEffect(() => {
    if (phase === PHASE_RESULTS) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [phase])

  return (
    <div className="page">
      {phase === PHASE_SETUP && (
        <SetupPhase
          selectedCategories={selectedCategories}
          toggleCategory={toggleCategory}
          selectAll={selectAll}
          questionCount={questionCount}
          setQuestionCount={setQuestionCount}
          totalItems={totalItems}
          canStart={canStart}
          onStart={startQuiz}
        />
      )}

      {phase === PHASE_QUIZ && questions.length > 0 && (
        <QuizPhase
          question={questions[currentIndex]}
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          score={score}
          userInput={userInput}
          setUserInput={setUserInput}
          answered={answered}
          isCorrect={isCorrect}
          onSubmit={handleSubmit}
          inputRef={inputRef}
          isMobile={isMobile}
          onSkipDelay={skipDelay}
        />
      )}

      {phase === PHASE_RESULTS && (
        <ResultsPhase
          score={score}
          total={questions.length}
          percentage={percentage}
          reaction={reaction}
          mistakes={mistakes}
          bestStreak={bestStreak}
          isTablet={isTablet}
          onRetry={() => setPhase(PHASE_SETUP)}
          calculateQuizXP={calculateQuizXP}
          onRetryMistakes={() => {
            if (mistakes.length === 0) return
            const mistakeQs = mistakes.map(m => m.question)
            const doubled = shuffle([...mistakeQs, ...mistakeQs])
            setQuestions(doubled)
            setCurrentIndex(0)
            setScore(0)
            streakRef.current = 0
            setBestStreak(0)
            setUserInput('')
            setAnswered(false)
            setIsCorrect(null)
            setMistakes([])
            setPhase(PHASE_QUIZ)
          }}
        />
      )}
    </div>
  )
}

// ─── SETUP PHASE ──────────────────────────────────────────────────

function SetupPhase({ selectedCategories, toggleCategory, selectAll, questionCount, setQuestionCount, totalItems, canStart, onStart }) {
  const basicCats = categories.filter(c => ['basic1', 'basic2', 'basic3'].includes(c.key))
  const timeCats = categories.filter(c => ['hours', 'minutes'].includes(c.key))
  const dateCats = categories.filter(c => ['months', 'days'].includes(c.key))
  const counterCats = categories.filter(c => ['mai', 'dai', 'hiki', 'hon', 'hai', 'kai', 'tsu'].includes(c.key))

  const renderCategoryGroup = (title, cats) => (
    <div style={{ marginBottom: 12 }}>
      <div style={styles.groupTitle}>{title}</div>
      <div style={styles.catGrid}>
        {cats.map(c => (
          <label
            key={c.key}
            style={{
              ...styles.catCheck,
              ...(selectedCategories.includes(c.key) ? styles.catCheckActive : {}),
            }}
          >
            <input
              type="checkbox"
              checked={selectedCategories.includes(c.key)}
              onChange={() => toggleCategory(c.key)}
              style={{ display: 'none' }}
            />
            <span style={styles.catEmoji}>{c.emoji}</span>
            <span style={styles.catLabel}>{c.label}</span>
            <span style={styles.catJp}>{c.labelJp}</span>
            <span style={styles.catCount}>{c.data.length}</span>
          </label>
        ))}
      </div>
    </div>
  )

  return (
    <div className="animate-fadeInUp">
      <div style={styles.header}>
        <h1 style={styles.title}>
          <span>🔢</span> number quiz <span style={styles.titleJp}>すうじテスト</span>
        </h1>
        <p style={styles.subtitle}>master Japanese numbers & counters</p>
      </div>

      {/* category selection */}
      <div className="glass" style={styles.setupCard}>
        <div style={styles.setupLabel}>
          <span>📚</span> choose categories
        </div>
        <button onClick={selectAll} className="btn-hover" style={styles.selectAllBtn}>
          {selectedCategories.length === categories.length ? 'deselect all' : 'select all'}
        </button>

        {renderCategoryGroup('basic numbers', basicCats)}
        {renderCategoryGroup('time', timeCats)}
        {renderCategoryGroup('dates', dateCats)}
        {renderCategoryGroup('counters', counterCats)}

        {selectedCategories.length > 0 && (
          <div style={styles.poolInfo}>
            {totalItems} questions in pool
          </div>
        )}
      </div>

      {/* question count */}
      <div className="glass" style={styles.setupCard}>
        <div style={styles.setupLabel}>
          <span>🎯</span> how many questions?
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          {[5, 10, 20].map(n => (
            <button key={n} onClick={() => setQuestionCount(n)} style={{
              padding: '4px 14px', borderRadius: 50, border: 'none', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit',
              background: questionCount === n ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
              color: questionCount === n ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s', minHeight: 44,
            }}>{n}</button>
          ))}
        </div>
        <div style={styles.sliderWrap}>
          <div style={styles.sliderValueRow}>
            <input
              type="number"
              min={5}
              max={30}
              value={questionCount}
              aria-label="number of questions"
              onChange={(e) => {
                const raw = e.target.value
                if (raw === '') { setQuestionCount(5); return }
                const v = parseInt(raw, 10)
                if (isNaN(v)) return
                setQuestionCount(Math.min(30, Math.max(1, v)))
              }}
              onBlur={() => {
                if (questionCount < 5) setQuestionCount(5)
              }}
              style={styles.numberInput}
            />
          </div>
          <input
            type="range"
            className="kawaii-slider"
            min={5}
            max={30}
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
            aria-label="number of questions"
          />
          <div style={styles.sliderLabels}>
            <span>5</span>
            <span>30</span>
          </div>
        </div>
      </div>

      {/* start */}
      <div style={styles.startWrap}>
        <button
          className="btn btn-cute"
          onClick={onStart}
          disabled={!canStart}
          style={{ opacity: canStart ? 1 : 0.5, pointerEvents: canStart ? 'auto' : 'none', maxWidth: 240 }}
        >
          start quiz
        </button>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <Link to="/quiz/counters" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>counters 数</Link>
          <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
        </div>
        {!canStart && (
          <p style={styles.warnText}>select at least one category</p>
        )}
      </div>
    </div>
  )
}

// ─── QUIZ PHASE ───────────────────────────────────────────────────

function QuizPhase({ question, currentIndex, totalQuestions, score, userInput, setUserInput, answered, isCorrect, onSubmit, inputRef, isMobile, onSkipDelay }) {
  const progress = ((currentIndex + 1) / totalQuestions) * 100
  const [hintLevel, setHintLevel] = useState(0)
  useEffect(() => { setHintLevel(0) }, [currentIndex])

  return (
    <div className="animate-fadeInUp">
      {/* progress bar */}
      <div style={styles.progressWrap}>
        <div style={styles.progressInfo}>
          <Link to="/" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', opacity: 0.5, textDecoration: 'none', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', flexShrink: 0 }} aria-label="exit quiz">✕</Link>
          <span style={styles.progressText}>{currentIndex + 1} / {totalQuestions}</span>
          <span style={styles.scoreText} aria-live="polite" aria-atomic="true">score: {score}</span>
        </div>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
      </div>

      {/* question card */}
      <div
        className="glass"
        style={{
          ...styles.questionCard,
          ...(!prefersReducedMotion && isCorrect === false ? { animation: 'shake 0.4s ease' } : {}),
        }}
      >
        <div style={styles.questionLabel}>how do you read this?</div>
        <div style={{ ...styles.questionJapanese, fontSize: isMobile ? '2.2rem' : '3rem' }}>{question.japanese}</div>
        <div style={styles.questionDisplay}>{question.display}</div>
        <div style={styles.questionCategory}>{question.categoryLabel}</div>
      </div>

      {/* input */}
      <form onSubmit={onSubmit} style={styles.inputWrap}>
        <div className="glass" style={styles.inputCard}>
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="type romaji reading..." aria-label="type romaji reading"
            disabled={answered}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
            style={{
              ...styles.textInput,
              ...(answered
                ? isCorrect
                  ? styles.inputCorrect
                  : styles.inputIncorrect
                : {}
              ),
            }}
          />
          {!answered && (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!userInput.trim()}
              style={{
                ...styles.submitBtn,
                opacity: userInput.trim() ? 1 : 0.5,
              }}
            >
              check
            </button>
          )}
        </div>
      </form>

      {/* hint */}
      {!answered && (
        <div style={{ textAlign: 'center', marginTop: 8, minHeight: 28 }}>
          {hintLevel > 0 && (
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-light)', background: 'rgba(168,85,247,0.1)', padding: '3px 14px', borderRadius: 50 }} className="animate-pop">
              💡 {question.romaji.slice(0, hintLevel)}{'_'.repeat(Math.max(0, question.romaji.length - hintLevel))}
            </span>
          )}
          {hintLevel < question.romaji.length && (
            <button
              onClick={() => setHintLevel(h => Math.min(h + 1, question.romaji.length))}
              style={{ marginLeft: hintLevel > 0 ? 8 : 0, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)', fontFamily: 'inherit', padding: '4px 8px', minHeight: 44 }}
            >
              💡 {hintLevel > 0 ? 'ещё' : 'подсказка'}
            </button>
          )}
        </div>
      )}

      {/* feedback */}
      {answered && (
        <div className="animate-pop" style={styles.feedbackWrap} onClick={onSkipDelay} role="button" tabIndex={0} aria-label="continue to next question" onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSkipDelay() } }}>
          <div
            className="glass-sm"
            style={{
              ...styles.feedbackCard,
              borderColor: isCorrect ? 'var(--correct-text)' : 'var(--incorrect-text)',
              borderLeftWidth: 4,
              borderLeftStyle: 'solid',
              cursor: isCorrect ? 'default' : 'pointer',
            }}
          >
            <div style={{
              ...styles.feedbackTitle,
              color: isCorrect ? 'var(--correct-text)' : 'var(--incorrect-text)',
            }}>
              {isCorrect ? '✨ correct! sugoi~' : '✗ not quite...'}
            </div>

            {!isCorrect && (
              <div style={styles.feedbackCorrect}>
                correct: <strong>{question.romaji}</strong>
              </div>
            )}

            {question.note && (
              <div style={styles.feedbackNote}>
                💡 {question.note}
              </div>
            )}

            {!isCorrect && (
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 4 }}>нажми чтобы продолжить →</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── RESULTS PHASE ────────────────────────────────────────────────

function ResultsPhase({ score, total, percentage, reaction, mistakes, onRetry, onRetryMistakes, calculateQuizXP, bestStreak, isTablet }) {
  return (
    <div className="animate-fadeInUp" style={styles.resultsWrap}>
      <div className="glass" style={{ ...styles.resultsCard, ...(isTablet ? styles.resultsCardTablet : {}) }}>
        {percentage >= 90 && <Confetti trigger={true} />}
        <div style={styles.resultsEmoji}>{reaction.emoji}</div>
        <h2 style={styles.resultsTitle}>{reaction.textJp}</h2>
        <p style={styles.resultsText}>{reaction.text}</p>

        <div style={styles.scoreCircle} className={percentage >= 90 ? 'score-perfect' : 'score-circle'}>
          <div style={styles.scoreCircleInner}>
            <span style={styles.scoreBig}>{percentage}%</span>
            <span style={styles.scoreDetail}>{score}/{total}</span>
          </div>
        </div>

        {calculateQuizXP(score, total) > 0 && (
          <div style={styles.xpBadge} className="animate-pop">
            <span style={styles.xpIcon}>⚡</span>
            <span style={styles.xpAmount}>+{calculateQuizXP(score, total)} XP</span>
          </div>
        )}

        {/* mistakes by category */}
        {mistakes.length > 1 && (() => {
          const counts = {}
          mistakes.forEach(m => {
            const key = m.question.category
            if (!counts[key]) counts[key] = { label: m.question.categoryLabel, emoji: '', count: 0 }
            counts[key].count++
          })
          const sorted = Object.entries(counts).sort((a, b) => b[1].count - a[1].count)
          if (sorted.length < 2) return null
          return (
            <div style={{ marginBottom: 14, width: '100%' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, textAlign: 'center' }}>missed by category</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {sorted.map(([key, { label, count }]) => (
                  <div key={key} style={{ padding: '4px 10px', borderRadius: 50, background: count >= 3 ? 'rgba(244,63,94,0.12)' : 'rgba(192,132,252,0.1)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: count >= 3 ? 'var(--incorrect-text)' : 'var(--text-main)' }}>{label}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)' }}>×{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* mistakes list */}
        {mistakes.length > 0 && (
          <div style={styles.mistakesSection}>
            <div style={styles.mistakesLabel}>mistakes ({mistakes.length})</div>
            <div style={styles.mistakesList}>
              {mistakes.map((m, i) => (
                <div key={(m.question.japanese || '') + i} style={styles.mistakeItem}>
                  <div style={styles.mistakeTop}>
                    <span style={styles.mistakeJp}>{m.question.japanese}</span>
                    <span style={styles.mistakeDisplay}>{m.question.display}</span>
                  </div>
                  <div style={styles.mistakeCorrectText}>
                    correct: {m.question.romaji}
                  </div>
                  <div style={styles.mistakeYoursText}>
                    you typed: {m.yourAnswer}
                  </div>
                  {m.question.note && (
                    <div style={styles.mistakeNote}>
                      💡 {m.question.note}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={styles.retryMistakesWrap}>
              <button
                className="btn btn-primary"
                onClick={onRetryMistakes}
                style={{ fontSize: '0.85rem' }}
              >
                work on mistakes ({mistakes.length * 2} qs)
              </button>
            </div>
          </div>
        )}

        <div style={styles.resultsActions}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-cute" onClick={onRetry} style={{ flex: 1 }}>try again 🌸</button>
            <ShareResult quizName="number quiz" score={score} total={total} percentage={percentage} bestStreak={bestStreak} xpEarned={calculateQuizXP(score, total)} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/quiz/counters" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>counters 数</Link>
            <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────

const styles = {
  header: {
    textAlign: 'center',
    marginBottom: 20,
    padding: '8px 0',
  },
  title: {
    fontSize: '1.65rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    textTransform: 'lowercase',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },
  titleJp: {
    fontSize: '0.9rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    marginLeft: 4,
  },
  subtitle: {
    fontSize: '1rem',
    color: 'var(--text-light)',
    fontWeight: 500,
  },
  setupCard: {
    padding: 22,
    marginBottom: 16,
  },
  setupLabel: {
    fontSize: '0.95rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textTransform: 'lowercase',
  },
  selectAllBtn: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    background: 'rgba(168, 85, 247, 0.08)',
    padding: '4px 12px',
    borderRadius: 50,
    marginBottom: 10,
    textTransform: 'lowercase',
    cursor: 'pointer',
    border: 'none',
    minHeight: 44,
  },
  groupTitle: {
    fontSize: '0.88rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'lowercase',
    marginBottom: 6,
    paddingLeft: 2,
  },
  catGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 8,
  },
  catCheck: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 10px',
    borderRadius: 12,
    background: 'var(--tint)',
    border: '1.5px solid rgba(192,132,252,0.25)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '0.75rem',
    minHeight: 44,
  },
  catCheckActive: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(192,132,252,0.15))',
    border: '1.5px solid #f472b6',
    boxShadow: '0 2px 8px rgba(244, 114, 182, 0.15)',
  },
  catEmoji: {
    fontSize: '1rem',
    minWidth: 20,
    textAlign: 'center',
  },
  catLabel: {
    fontWeight: 600,
    color: 'var(--text-main)',
    flex: 1,
    fontSize: '0.82rem',
    lineHeight: 1.2,
  },
  catJp: {
    fontSize: '0.75rem',
    color: 'var(--text-light)',
    fontWeight: 700,
  },
  catCount: {
    fontSize: '0.72rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    background: 'rgba(168, 106, 154, 0.1)',
    borderRadius: 50,
    padding: '2px 6px',
  },
  poolInfo: {
    marginTop: 10,
    fontSize: '0.8rem',
    color: 'var(--text-light)',
    fontWeight: 700,
    textAlign: 'center',
  },
  sliderWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  sliderValueRow: {
    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  numberInput: {
    width: 70, textAlign: 'center', fontSize: '1.3rem', fontWeight: 900,
    color: 'var(--text-main)', background: 'var(--tint)',
    border: '2px solid rgba(192,132,252,0.3)', borderRadius: 12,
    padding: '4px 8px', fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.2s',
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-light)',
  },
  startWrap: {
    textAlign: 'center',
    marginTop: 20,
  },
  warnText: {
    marginTop: 8,
    fontSize: '0.75rem',
    color: 'var(--incorrect-text)',
    fontWeight: 600,
  },
  progressWrap: {
    marginBottom: 20,
  },
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressText: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
  },
  scoreText: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-light)',
  },
  progressBar: {
    height: 8,
    borderRadius: 50,
    background: 'var(--tint-strong)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 50,
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    transition: 'width 0.4s ease',
  },
  questionCard: {
    textAlign: 'center',
    padding: '28px 20px',
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: '1rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    marginBottom: 12,
    textTransform: 'lowercase',
  },
  questionJapanese: {
    fontSize: '3rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    marginBottom: 8,
    lineHeight: 1.1,
  },
  questionDisplay: {
    fontSize: '1rem',
    color: 'var(--text-light)',
    fontWeight: 700,
    marginBottom: 4,
  },
  questionCategory: {
    fontSize: '0.75rem',
    color: 'var(--text-light)',
    fontWeight: 500,
    fontStyle: 'italic',
  },
  inputWrap: {
    marginBottom: 16,
  },
  inputCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 18,
  },
  textInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--text-main)',
    fontFamily: "'Nunito', sans-serif",
    letterSpacing: '0.02em',
    padding: '8px 4px',
  },
  inputCorrect: {
    color: 'var(--correct-text)',
  },
  inputIncorrect: {
    color: 'var(--incorrect-text)',
    textDecoration: 'line-through',
  },
  submitBtn: {
    padding: '8px 20px',
    fontSize: '0.85rem',
    borderRadius: 50,
  },
  feedbackWrap: {
    marginBottom: 16,
  },
  feedbackCard: {
    padding: '14px 16px',
  },
  feedbackTitle: {
    fontSize: '1rem',
    fontWeight: 800,
    marginBottom: 4,
  },
  feedbackCorrect: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-main)',
    marginBottom: 4,
  },
  feedbackNote: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    background: 'rgba(168, 85, 247, 0.08)',
    borderRadius: 8,
    padding: '6px 10px',
    marginTop: 6,
  },
  resultsWrap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 120px)',
    paddingBottom: 90,
  },
  resultsCard: {
    textAlign: 'center',
    padding: '32px 24px',
    maxWidth: 440,
    width: '100%',
    position: 'relative',
  },
  resultsCardTablet: {
    maxWidth: 560,
    padding: '42px 34px',
  },
  resultsEmoji: {
    fontSize: '2.5rem',
    marginBottom: 8,
  },
  resultsTitle: {
    fontSize: '1.5rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    marginBottom: 4,
  },
  resultsText: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    marginBottom: 20,
    textTransform: 'lowercase',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    boxShadow: '0 8px 24px rgba(236, 72, 153, 0.25)',
  },
  scoreCircleInner: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    background: 'var(--tint-solid)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBig: {
    fontSize: '1.8rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    lineHeight: 1,
  },
  scoreDetail: {
    fontSize: '0.8rem',
    color: 'var(--text-light)',
    fontWeight: 600,
  },
  mistakesSection: {
    marginBottom: 20,
    textAlign: 'left',
  },
  mistakesLabel: {
    fontSize: '0.8rem',
    fontWeight: 800,
    color: 'var(--incorrect-text)',
    textTransform: 'lowercase',
    marginBottom: 8,
    textAlign: 'center',
  },
  mistakesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  mistakeItem: {
    background: 'rgba(244, 63, 94, 0.06)',
    border: '1px solid rgba(244, 63, 94, 0.15)',
    borderLeft: '3px solid var(--incorrect-text)',
    borderRadius: 10,
    padding: '10px 12px',
  },
  mistakeTop: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  mistakeJp: {
    fontSize: '1.1rem',
    fontWeight: 800,
    color: 'var(--text-main)',
  },
  mistakeDisplay: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-light)',
  },
  mistakeCorrectText: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--correct-text)',
  },
  mistakeYoursText: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'var(--incorrect-text)',
    fontStyle: 'italic',
  },
  mistakeNote: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginTop: 4,
    background: 'rgba(168, 85, 247, 0.06)',
    borderRadius: 6,
    padding: '4px 8px',
  },
  retryMistakesWrap: {
    marginTop: 12,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  resultsActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    alignItems: 'center',
  },
  xpBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '6px 18px',
    borderRadius: 50,
    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))',
    border: '1.5px solid rgba(251, 191, 36, 0.4)',
    margin: '-10px auto 20px',
    width: 'fit-content',
  },
  xpIcon: {
    fontSize: '1rem',
  },
  xpAmount: {
    fontSize: '0.9rem',
    fontWeight: 800,
    color: 'var(--gold-text)',
  },
}
