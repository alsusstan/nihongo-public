import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { lessons } from '../data/lessons'
import { useProgress } from '../hooks/useProgress'
import { useXP } from '../hooks/useXP'
import { useUnlockedLessons } from '../hooks/useUnlockedLessons'
import { useIsMobile, useIsTablet } from '../hooks/useIsMobile'
import ShareResult from '../components/ShareResult'
import QuizCountdown from '../components/QuizCountdown'
import Confetti from '../components/Confetti'
import { useWordTracker } from '../hooks/useWordTracker'
import { getStoredInverseFlag, getStoredJson, getStoredNonNegativeInt, getStoredQuizSize, setStoredJson } from '../utils/localSettings'
import { prefersReducedMotion as getPrefersReducedMotion } from '../utils/motion'

const prefersReducedMotion = getPrefersReducedMotion()

// JLPT N5 essential vocabulary — curated list of common N5-level words (Japanese text)
const jlptN5Words = new Set([
  // Basic verbs (ます-form)
  '食べます', '飲みます', '行きます', '来ます', '帰ります', '見ます', '聞きます',
  '読みます', '書きます', '話します', '買います', '教えます', '勉強します', '働きます',
  '休みます', '起きます', '寝ます', '遊びます', '泳ぎます', '作ります', '使います',
  '待ちます', '持ちます', '住みます', '知ります', '分かります', 'あります', 'います',
  '立ちます', '座ります', '歩きます', '走ります', '飛びます', '歌います', '踊ります',
  '開けます', '閉めます', '入れます', '出します', '出かけます', '着ます', '脱ぎます',
  '掛けます', '消します', 'つけます', '止めます', '始めます', '終わります',
  '会います', '渡します', '渡ります', '乗ります', '降ります', '乗り換えます',
  '洗います', '浴びます', '磨きます', 'もらいます', 'あげます', '貸します', '借ります',
  '送ります', '届けます', '押します', '引きます', '切ります', '撮ります',
  '呼びます', '掃除します', '洗濯します', '料理します', '散歩します', '練習します',
  '結婚します', '電話します', 'コピーします', '要ります', '死にます',
  '置きます', '売ります', '換えます', '忘れます', '覚えます', 'なくします',
  '出ます', '入ります', '卒業します',

  // Dictionary / plain forms of common verbs
  '食べる', '飲む', '行く', '来る', '帰る', '見る', '聞く',
  '読む', '書く', '話す', '買う', '教える', '働く',
  '休む', '起きる', '寝る', '遊ぶ', '泳ぐ', '作る', '使う',
  '待つ', '持つ', '住む', '知る', '分かる', 'ある', 'いる',
  '立つ', '座る', '歩く', '走る', '飛ぶ', '歌う', '踊る',
  '開ける', '閉める', '入れる', '出す', '着る', '脱ぐ',
  '消す', '止める', '始める', '終わる', '会う',
  '乗る', '降りる', '洗う', '浴びる',
  'もらう', 'あげる', '貸す', '借りる', '送る',
  '押す', '引く', '切る', '撮る', '呼ぶ',
  '置く', '売る', '忘れる', '覚える', '出る', '入る',

  // い-adjectives
  '大きい', '小さい', '新しい', '古い', '高い', '安い', 'おいしい', 'まずい',
  'いい', '悪い', '暑い', '寒い', '暖かい', '涼しい', '広い', '狭い',
  '近い', '遠い', '速い', '遅い', '多い', '少ない', '長い', '短い',
  '難しい', '易しい', '忙しい', '楽しい', '面白い', 'つまらない',
  '白い', '黒い', '赤い', '青い', '甘い', '辛い', '若い',
  '明るい', '暗い', '重い', '軽い', '強い', '弱い', '丸い',
  '優しい', '厳しい', '美しい', '嬉しい', '悲しい',
  '冷たい', '温かい', '危ない', '痛い', '欲しい',

  // な-adjectives
  '元気', '静か', 'にぎやか', '親切', '好き', '嫌い', '上手', '下手',
  '有名', '暇', '便利', '不便', '大変', '大丈夫', '大切', '大好き',
  'きれい', 'ハンサム', '簡単',

  // People & pronouns
  '人', '男', '女', '子供', '友達', '先生', '学生', '会社員',
  'わたし', 'あなた', 'かれ', 'かのじょ',
  '男の人', '女の人', '男の子', '女の子', 'お母さん', 'お父さん',
  'お兄さん', 'お姉さん', '弟', '妹', '家族', '両親', '兄弟',
  '彼', '彼女', '皆さん', '方', 'あの人',

  // Time words
  '時間', '朝', '昼', '夜', '今日', '明日', '昨日', '毎日',
  '毎朝', '毎晩', '毎週', '毎月', '毎年', '今', '先週', '来週',
  '先月', '来月', '今年', '去年', '来年', '午前', '午後',
  '今朝', '今晩', '夕べ', '月曜日', '火曜日', '水曜日', '木曜日',
  '金曜日', '土曜日', '日曜日', '誕生日', '休み',

  // Languages
  '日本語', '英語',

  // Transport & places
  '電車', '車', '駅', '空港', '学校', '病院', '銀行', '郵便局',
  'デパート', 'スーパー', 'レストラン', 'ホテル', '図書館',
  '公園', '映画館', '会社', '部屋', '教室', '食堂', '庭',
  'バス', '地下鉄', '自転車', 'タクシー', '飛行機', '船',
  'エレベーター', '階段', '門', '橋', '交差点', '信号',
  '入り口', '出口', 'トイレ', 'お手洗い', 'プール',

  // Things & objects
  '本', '新聞', '映画', '音楽', 'テレビ', '電話', 'パソコン',
  '花', '水', 'お茶', 'コーヒー', 'ご飯', '傘', '鍵', '時計',
  '写真', '手紙', '切手', '荷物', 'かばん', '財布',
  'ノート', 'ペン', '鉛筆', '消しゴム', '辞書', '雑誌', '新聞',
  'テーブル', '椅子', '机', 'ベッド', 'ドア', '窓',
  'シャツ', '靴', '帽子', '眼鏡', '薬', '切符',
  'お金', 'お土産', 'プレゼント', 'カメラ', 'ラジオ',
  'お皿', 'コップ', 'スプーン', 'フォーク', '箸',

  // Food & drink
  '肉', '魚', '野菜', '果物', '卵', 'パン', '牛乳',
  'ジュース', 'ビール', 'お酒', '料理', '朝ご飯', '昼ご飯', '晩ご飯',

  // Nature & weather
  '天気', '雨', '雪', '風', '空', '海', '山', '川', '木',

  // Body
  '頭', '目', '耳', '口', '手', '足', '体', '顔', '歯', '声',

  // Directions & position
  '上', '下', '右', '左', '前', '後ろ', '中', '外', '隣', '近く', '間',
  '北', '南', '東', '西',

  // Numbers & counters
  '一つ', '二つ', '三つ', '四つ', '五つ', '六つ', '七つ', '八つ', '九つ', '十',
  '百', '千', '万', '円',

  // Common nouns
  '名前', '仕事', '趣味', '旅行', '散歩', '試験', '問題', '答え',
  '意味', '言葉', '話', '質問', '宿題', '授業', '練習',
  '国', '町', '道', '所', '店', '物', '事', '色',

  // Romaji / hiragana forms of common words (as they appear in Minna no Nihongo)
  'たべます', 'のみます', 'いきます', 'きます', 'かえります', 'みます', 'ききます',
  'よみます', 'かきます', 'はなします', 'かいます', 'おしえます', 'べんきょうします',
  'はたらきます', 'やすみます', 'おきます', 'ねます', 'あそびます', 'およぎます',
  'つくります', 'つかいます', 'まちます', 'もちます', 'すみます', 'しります', 'わかります',
  'あいます', 'のります', 'おります', 'あらいます', 'あびます',
  'かします', 'かります', 'おくります', 'おします', 'ひきます', 'きります', 'とります',
  'よびます', 'うります', 'わすれます', 'おぼえます', 'でます', 'はいります',
  'おおきい', 'ちいさい', 'あたらしい', 'ふるい', 'たかい', 'やすい',
  'わるい', 'あつい', 'さむい', 'あたたかい', 'すずしい', 'ひろい', 'せまい',
  'ちかい', 'とおい', 'はやい', 'おそい', 'おおい', 'すくない', 'ながい', 'みじかい',
  'むずかしい', 'やさしい', 'いそがしい', 'たのしい', 'おもしろい',
  'しろい', 'くろい', 'あかい', 'あおい', 'あまい', 'からい', 'わかい',
  'あかるい', 'くらい', 'おもい', 'かるい', 'つよい', 'よわい',
  'ひと', 'おとこ', 'おんな', 'こども', 'ともだち', 'せんせい', 'がくせい', 'かいしゃいん',
  'じかん', 'あさ', 'ひる', 'よる', 'きょう', 'あした', 'きのう', 'まいにち',
  'にほんご', 'えいご', 'でんしゃ', 'くるま', 'えき', 'くうこう',
  'がっこう', 'びょういん', 'ぎんこう', 'ゆうびんきょく',
  'ほん', 'しんぶん', 'えいが', 'おんがく', 'でんわ',
  'はな', 'みず', 'おちゃ', 'ごはん', 'かさ', 'かぎ', 'とけい',
  'しゃしん', 'てがみ', 'きって', 'にもつ',
  'てんき', 'あめ', 'ゆき', 'かぜ', 'そら', 'うみ', 'やま', 'かわ', 'き',
  'あたま', 'め', 'みみ', 'くち', 'て', 'あし', 'からだ', 'かお', 'は', 'こえ',
  'うえ', 'した', 'みぎ', 'ひだり', 'まえ', 'うしろ', 'なか', 'そと', 'となり',
  'なまえ', 'しごと', 'しゅみ', 'りょこう', 'さんぽ', 'しけん', 'もんだい', 'こたえ',
  'いみ', 'ことば', 'はなし', 'しつもん', 'しゅくだい', 'じゅぎょう', 'れんしゅう',
  'くに', 'まち', 'みち', 'ところ', 'みせ', 'もの', 'こと', 'いろ',
])

// Difficult words helpers
const DIFFICULT_WORDS_KEY = 'nihongo-difficult-words'

function loadDifficultWords() {
  const parsed = getStoredJson(DIFFICULT_WORDS_KEY, [])
  return Array.isArray(parsed) ? parsed : []
}

function saveDifficultWords(words) {
  setStoredJson(DIFFICULT_WORDS_KEY, words)
}

const stripBr = s => (s || '').replace(/\[.*?\]/g, '').trim()

function isSameVocabWord(a, b) {
  return stripBr(a?.japanese || a?.kanji) === stripBr(b?.japanese || b?.kanji)
    && stripBr(a?.romaji) === stripBr(b?.romaji)
    && (a?.lesson == null || b?.lesson == null || a.lesson === b.lesson)
}

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getWordType(word) {
  if (word.type && word.type.includes('гл.')) return 'verb'
  if (word.japanese && word.japanese.includes('[な]')) return 'na-adj'
  const canonical = (word.kanji || word.japanese || '').replace(/\[.*?\]/g, '').trim()
  if (canonical.endsWith('い') && (!word.type || !word.type.includes('гл.'))) return 'i-adj'
  return 'noun'
}

function pickUniqueDistractors(pools, correctWord) {
  const seenJapanese = new Set([stripBr(correctWord.japanese || correctWord.kanji)])
  const seenRussian = new Set([correctWord.russian || ''])
  const options = []

  for (const pool of pools) {
    for (const word of shuffle(pool)) {
      const japaneseKey = stripBr(word.japanese || word.kanji)
      const russianKey = word.russian || ''
      if (!japaneseKey || !russianKey || seenJapanese.has(japaneseKey) || seenRussian.has(russianKey)) continue
      seenJapanese.add(japaneseKey)
      seenRussian.add(russianKey)
      options.push(word)
      if (options.length >= 3) return options
    }
  }

  return options
}

function generateOptions(correctWord, allWords) {
  const correctType = getWordType(correctWord)
  const wrongPool = allWords.filter(w => w.russian !== correctWord.russian)

  // Prefer same part-of-speech distractors
  const sameType = wrongPool.filter(w => getWordType(w) === correctType)
  const wrongOptions = pickUniqueDistractors([sameType, wrongPool], correctWord)

  return shuffle([correctWord, ...wrongOptions])
}

const scoreReactions = [
  { min: 100, emoji: '🎉✨🌟', text: 'kanpeki!! идеально, умничка!', textJp: '完璧！' },
  { min: 90, emoji: '🎊✨🐱', text: 'sugoi!! ты просто няшка!', textJp: 'すごい！' },
  { min: 70, emoji: '🌸😊', text: 'yoku dekimashita! хорошо!', textJp: 'よくできました！' },
  { min: 50, emoji: '🐱💪', text: 'mada mada~ ещё чуть-чуть!', textJp: 'まだまだ！' },
  { min: 0, emoji: '🌙📚', text: 'ganbatte! давай повторим~', textJp: 'がんばって！' },
]

// Russian lesson topic names for display in setup screen
const LESSON_TOPICS_RU = {
  1: 'знакомство', 2: 'это и то', 3: 'где что', 4: 'цены', 5: 'время',
  6: 'еда и действия', 7: 'давать и получать', 8: 'прилагательные',
  9: 'желания и умения', 10: 'место и существование',
  11: 'счётные слова', 12: 'сравнение', 13: 'хочу (たい)', 14: 'て-форма',
  15: 'разрешение', 16: 'て-цепочки', 17: 'ない-форма', 18: 'словарная форма',
  19: 'та-форма', 20: 'косвенная речь', 21: 'мнения', 22: 'относительные',
  23: 'условие', 24: 'давать/получать', 25: 'если/даже если',
}

// Varied feedback phrases
const CORRECT_PHRASES = [
  '✨ correct! sugoi~', '🌸 yatta! правильно!', '⭐ えらい! молодец!',
  '🎉 nice! すごい!', '💮 正解! отлично!', '🔥 в точку!',
  '🌟 perfect! よかった~', '💖 そう！ именно!', '🎯 えらい! точно!',
]
const INCORRECT_PREFIX = ['✗', '☓', '😔 ой,', '🙈 нет,']

const PHASE_SETUP = 'setup'
const PHASE_QUIZ = 'quiz'
const PHASE_RESULTS = 'results'
const PHASE_REVIEW = 'review'

function getWordCategory(word) {
  if (word.type && word.type.includes('гл.')) return 'verb'
  const jp = word.japanese || ''
  if (jp.includes('[な]')) return 'adj'
  const canonical = (word.kanji || jp).replace(/[[\]（）\s・、。]/g, '')
  if (canonical.endsWith('い') && !word.type) return 'adj'
  return 'noun'
}

export default function VocabQuiz() {
  const { saveQuizResult } = useProgress()
  const { awardXP, calculateQuizXP } = useXP()
  const { unlockedLessons } = useUnlockedLessons()
  const { recordMiss, recordHit } = useWordTracker()
  const [searchParams] = useSearchParams()
  const [phase, setPhase] = useState(PHASE_SETUP)
  const sharedLessonId = parseInt(searchParams.get('lesson') || '', 10)
  const sharedLesson = lessons.find(l => l.id === sharedLessonId)
  const lessonPool = useMemo(() => (
    sharedLesson && !unlockedLessons.some(l => l.id === sharedLesson.id)
      ? [...unlockedLessons, sharedLesson]
      : unlockedLessons
  ), [sharedLesson, unlockedLessons])

  // setup state
  const [selectedLessons, setSelectedLessons] = useState(() => {
    const unlocked = getStoredNonNegativeInt('nihongo-unlocked-max', 15) || 15
    return lessons.filter(l => l.id <= unlocked).map(l => l.id)
  })
  const [questionCount, setQuestionCount] = useState(getStoredQuizSize)
  const [wordTypeFilter, setWordTypeFilter] = useState('all') // 'all' | 'verb' | 'adj' | 'noun'
  const romajiInQuiz = getStoredInverseFlag('nihongo-quiz-romaji', '0', true)

  // quiz state
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [mistakes, setMistakes] = useState([])
  const [correctWords, setCorrectWords] = useState([])
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [isEndless, setIsEndless] = useState(false)
  const [isSuddenDeath, setIsSuddenDeath] = useState(false)
  const [isReverse, setIsReverse] = useState(false) // reverse mode: show Russian, guess Japanese
  const [typingMode, setTypingMode] = useState(false) // typing romaji instead of 4-choice
  const [isTimed, setIsTimed] = useState(false)
  const [timeLimit, setTimeLimit] = useState(10)
  const [customTimerVal, setCustomTimerVal] = useState('')
  const [showCountdown, setShowCountdown] = useState(false)
  const timerRef = useRef(null)
  const quickStartTimerRef = useRef(null)
  const quickStarted = useRef(false)
  const answerLockedRef = useRef(false)
  const advanceLockedRef = useRef(false)
  const xpAwardedRef = useRef(false)
  useEffect(() => () => clearTimeout(quickStartTimerRef.current), [])
  const quizStartTimeRef = useRef(null)
  const questionsLengthRef = useRef(0)
  const [avgResponseMs, setAvgResponseMs] = useState(null)
  const [reviewWords, setReviewWords] = useState([])

  const availableLessons = lessonPool.map(l => ({ id: l.id, title: l.title, titleJp: l.titleJp, count: l.vocabulary.length }))

  const toggleLesson = (id) => {
    setSelectedLessons(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selectedLessons.length === availableLessons.length) {
      setSelectedLessons([])
    } else {
      setSelectedLessons(availableLessons.map(l => l.id))
    }
  }

  // Quick start with a single lesson (e.g., ?lesson=5)
  useEffect(() => {
    const lessonParam = searchParams.get('lesson')
    const quick = searchParams.get('quick')
    if (lessonParam && !quick && phase === PHASE_SETUP) {
      const quickKey = `lesson:${lessonParam}`
      if (quickStarted.current === quickKey) return
      const lid = parseInt(lessonParam, 10)
      const lessonData = lessons.find(l => l.id === lid)
      if (!lessonData) return
      quickStarted.current = quickKey
      setSelectedLessons([lid])
      setQuestionCount(lessonData.vocabulary.length)
      const pool = lessonData.vocabulary
      if (pool.length < 4) return
      const optionPool = [...pool, ...lessonPool.flatMap(l => l.vocabulary)]
      const selected = shuffle([...pool])
      const qs = selected.map(word => ({
        word,
        options: generateOptions(word, optionPool),
      }))
      setQuestions(qs)
      setCurrentIndex(0)
      setScore(0)
      setSelectedAnswer(null)
      setIsCorrect(null)
      setMistakes([])
      setCorrectWords([])
      setStreak(0)
      setBestStreak(0)
      answerLockedRef.current = false
      xpAwardedRef.current = false
      setPhase(PHASE_QUIZ)
    }
  }, [searchParams, phase, lessonPool])

  // Quick start from URL params (e.g., ?quick=5 or ?quick=5&lesson=19)
  useEffect(() => {
    const quick = searchParams.get('quick')
    if (quick && phase === PHASE_SETUP) {
      const lessonParam = searchParams.get('lesson')
      const lessonId = parseInt(lessonParam || '', 10)
      const lessonData = Number.isFinite(lessonId) ? lessons.find(l => l.id === lessonId) : null
      const quickKey = `quick:${quick}:lesson:${lessonData?.id || 'all'}`
      if (quickStarted.current === quickKey) return
      quickStarted.current = quickKey
      const count = parseInt(quick, 10) || 5
      const quickLessons = lessonData ? [lessonData] : lessonPool
      const allIds = quickLessons.map(l => l.id)
      setSelectedLessons(allIds)
      setQuestionCount(count)
      // defer startQuiz to next tick so state is updated
      clearTimeout(quickStartTimerRef.current)
      quickStartTimerRef.current = setTimeout(() => {
        const pool = quickLessons.flatMap(l => l.vocabulary)
        if (pool.length < 4) return
        const optionPool = lessonData ? [...pool, ...lessonPool.flatMap(l => l.vocabulary)] : pool
        const difficultWords = loadDifficultWords()
        const weightedPool = [...pool]
        pool.forEach(word => {
          if (difficultWords.some(dw => stripBr(dw.japanese) === stripBr(word.japanese) && stripBr(dw.romaji) === stripBr(word.romaji) && (dw.lesson == null || word.lesson == null || dw.lesson === word.lesson))) {
            weightedPool.push(word)
          }
        })
        const selected = shuffle(weightedPool).slice(0, Math.min(count, pool.length))
        const qs = selected.map(word => ({
          word,
          options: generateOptions(word, optionPool),
        }))
        setQuestions(qs)
        setCurrentIndex(0)
        setScore(0)
        setSelectedAnswer(null)
        setIsCorrect(null)
        setMistakes([])
        setCorrectWords([])
        setStreak(0)
        setBestStreak(0)
        answerLockedRef.current = false
        xpAwardedRef.current = false
        setPhase(PHASE_QUIZ)
      }, 0)
    }
  }, [searchParams, phase, lessonPool])

  const startQuiz = () => {
    let pool = lessonPool
      .filter(l => selectedLessons.includes(l.id))
      .flatMap(l => l.vocabulary)

    if (wordTypeFilter !== 'all') {
      pool = pool.filter(w => getWordCategory(w) === wordTypeFilter)
    }

    if (pool.length < 4) return
    xpAwardedRef.current = false

    // Weight difficult words: duplicate them so they appear more often
    const difficultWords = loadDifficultWords()
    const weightedPool = [...pool]
    pool.forEach(word => {
      if (difficultWords.some(dw => stripBr(dw.japanese) === stripBr(word.japanese) && stripBr(dw.romaji) === stripBr(word.romaji) && (dw.lesson == null || word.lesson == null || dw.lesson === word.lesson))) {
        weightedPool.push(word) // 2x weight for difficult words
      }
    })

    const count = questionCount === 'all' ? pool.length : Math.min(questionCount, pool.length)
    const selected = shuffle(weightedPool).slice(0, count)
    const allWords = pool

    const qs = selected.map(word => ({
      word,
      options: generateOptions(word, allWords),
    }))

    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setMistakes([])
    setCorrectWords([])
    setSelectedAnswer(null)
    setIsCorrect(null)
    setStreak(0)
    setBestStreak(0)
    setIsEndless(false)
    setIsSuddenDeath(false)
    answerLockedRef.current = false
    setShowCountdown(true)
    setPhase(PHASE_QUIZ)
  }

  const startReview = () => {
    const pool = lessonPool
      .filter(l => selectedLessons.includes(l.id))
      .flatMap(l => l.vocabulary)
    setReviewWords(shuffle([...pool]))
    answerLockedRef.current = false
    setPhase(PHASE_REVIEW)
  }

  const startWeakWordsQuiz = () => {
    const weakWords = loadDifficultWords()
    if (weakWords.length < 4) return

    const allPool = lessonPool.flatMap(l => l.vocabulary)
    // match weak words against full vocab pool (prefer lesson-specific match for homonyms)
    const pool = weakWords
      .map(dw => (dw.lesson != null && allPool.find(w => stripBr(w.japanese) === stripBr(dw.japanese) && stripBr(w.romaji) === stripBr(dw.romaji) && w.lesson === dw.lesson))
        || allPool.find(w => stripBr(w.japanese) === stripBr(dw.japanese) && stripBr(w.romaji) === stripBr(dw.romaji)))
      .filter(Boolean)

    if (pool.length < 4) return

    const count = Math.min(pool.length, 20)
    const selected = shuffle(pool).slice(0, count)
    const qs = selected.map(word => ({
      word,
      options: generateOptions(word, allPool),
    }))

    setSelectedLessons([...new Set(pool.map(w => w.lesson))])
    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setMistakes([])
    setCorrectWords([])
    setSelectedAnswer(null)
    setIsCorrect(null)
    setStreak(0)
    setBestStreak(0)
    setIsEndless(false)
    setIsSuddenDeath(false)
    answerLockedRef.current = false
    xpAwardedRef.current = false
    setShowCountdown(true)
    setPhase(PHASE_QUIZ)
  }

  const startMistakesQuiz = (repeatCount) => {
    if (mistakes.length === 0) return
    const pool = lessonPool
      .filter(l => selectedLessons.includes(l.id))
      .flatMap(l => l.vocabulary)
    const mistakeWords = mistakes.map(m => m.word)
    let repeated = []
    for (let i = 0; i < repeatCount; i++) {
      repeated = repeated.concat(mistakeWords)
    }
    const qs = shuffle(repeated).map(word => ({
      word,
      options: generateOptions(word, pool.length >= 4 ? pool : mistakeWords),
    }))
    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setMistakes([])
    setCorrectWords([])
    setSelectedAnswer(null)
    setIsCorrect(null)
    setStreak(0)
    setBestStreak(0)
    setIsEndless(false)
    setIsSuddenDeath(false)
    answerLockedRef.current = false
    setShowCountdown(true)
    setPhase(PHASE_QUIZ)
  }

  const startJlptMode = () => {
    const allPool = lessonPool.flatMap(l => l.vocabulary)
    // Filter words that match JLPT N5 list by japanese text, kanji, or romaji
    const n5Pool = allPool.filter(w =>
      jlptN5Words.has(w.japanese) || (w.kanji && jlptN5Words.has(w.kanji))
    )

    if (n5Pool.length < 4) return

    const difficultWords = loadDifficultWords()
    const weightedPool = [...n5Pool]
    n5Pool.forEach(word => {
      if (difficultWords.some(dw => stripBr(dw.japanese) === stripBr(word.japanese) && stripBr(dw.romaji) === stripBr(word.romaji) && (dw.lesson == null || word.lesson == null || dw.lesson === word.lesson))) {
        weightedPool.push(word)
      }
    })

    const count = Math.min(20, n5Pool.length)
    const selected = shuffle(weightedPool).slice(0, count)
    const qs = selected.map(word => ({
      word,
      options: generateOptions(word, allPool),
    }))

    setSelectedLessons([...new Set(n5Pool.map(w => w.lesson))])
    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setMistakes([])
    setCorrectWords([])
    setSelectedAnswer(null)
    setIsCorrect(null)
    setStreak(0)
    setBestStreak(0)
    setIsEndless(false)
    setIsSuddenDeath(false)
    answerLockedRef.current = false
    xpAwardedRef.current = false
    setShowCountdown(true)
    setPhase(PHASE_QUIZ)
  }

  const startEndless = () => {
    let pool = lessonPool
      .filter(l => selectedLessons.includes(l.id))
      .flatMap(l => l.vocabulary)

    if (wordTypeFilter !== 'all') {
      pool = pool.filter(w => getWordCategory(w) === wordTypeFilter)
    }

    if (pool.length < 4) return

    // Generate a big pool, repeating and shuffling to create variety
    const bigPool = []
    for (let i = 0; i < 5; i++) bigPool.push(...pool)
    const selected = shuffle(bigPool).slice(0, Math.min(200, bigPool.length))
    const allWords = pool

    const qs = selected.map(word => ({
      word,
      options: generateOptions(word, allWords),
    }))

    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setMistakes([])
    setCorrectWords([])
    setSelectedAnswer(null)
    setIsCorrect(null)
    setStreak(0)
    setBestStreak(0)
    setIsEndless(true)
    setIsSuddenDeath(false)
    answerLockedRef.current = false
    xpAwardedRef.current = false
    setShowCountdown(true)
    setPhase(PHASE_QUIZ)
  }

  const startSuddenDeath = () => {
    const pool = lessonPool
      .filter(l => selectedLessons.includes(l.id))
      .flatMap(l => l.vocabulary)
    if (pool.length < 4) return
    const difficultWords = loadDifficultWords()
    const weightedPool = [...pool]
    pool.forEach(word => {
      if (difficultWords.some(dw => stripBr(dw.japanese) === stripBr(word.japanese) && stripBr(dw.romaji) === stripBr(word.romaji) && (dw.lesson == null || word.lesson == null || dw.lesson === word.lesson))) {
        weightedPool.push(word)
      }
    })
    const count = questionCount === 'all' ? pool.length : Math.min(questionCount, pool.length)
    const selected = shuffle(weightedPool).slice(0, count)
    const qs = selected.map(word => ({ word, options: generateOptions(word, pool) }))
    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setMistakes([])
    setCorrectWords([])
    setSelectedAnswer(null)
    setIsCorrect(null)
    setStreak(0)
    setBestStreak(0)
    setIsSuddenDeath(true)
    answerLockedRef.current = false
    xpAwardedRef.current = false
    setShowCountdown(true)
    setPhase(PHASE_QUIZ)
  }

  const handleAnswer = useCallback((option) => {
    if (selectedAnswer !== null || answerLockedRef.current) return
    answerLockedRef.current = true
    advanceLockedRef.current = false

    const correct = isSameVocabWord(option, questions[currentIndex].word)
    setSelectedAnswer(option)
    setIsCorrect(correct)

    if (correct) {
      setScore(prev => prev + 1)
      setCorrectWords(prev => [...prev, questions[currentIndex].word])
      setStreak(prev => {
        const newStreak = prev + 1
        setBestStreak(best => Math.max(best, newStreak))
        return newStreak
      })
      recordHit(questions[currentIndex].word)
    } else {
      setMistakes(prev => [...prev, {
        word: questions[currentIndex].word,
        yourAnswer: isReverse ? option.japanese : option.russian,
      }])
      setStreak(0)
      recordMiss(questions[currentIndex].word, 'vocab-quiz')
    }

    const delay = correct ? 1000 : (isSuddenDeath ? 1500 : 4000)

    timerRef.current = setTimeout(() => {
      if (advanceLockedRef.current) return
      advanceLockedRef.current = true

      // In endless or sudden death mode, end on first mistake
      if ((isEndless || isSuddenDeath) && !correct) {
        setPhase(PHASE_RESULTS)
      } else if (currentIndex + 1 >= questions.length) {
        setPhase(PHASE_RESULTS)
      } else {
        setCurrentIndex(prev => prev + 1)
        setSelectedAnswer(null)
        setIsCorrect(null)
        answerLockedRef.current = false
      }
    }, delay)
  }, [selectedAnswer, questions, currentIndex, isEndless, isSuddenDeath, isReverse, recordMiss, recordHit])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // Track quiz timing for avg response time
  useEffect(() => {
    if (phase === PHASE_QUIZ) {
      quizStartTimeRef.current = Date.now()
      questionsLengthRef.current = questions.length
    }
    if (phase === PHASE_RESULTS && quizStartTimeRef.current && questionsLengthRef.current > 0) {
      setAvgResponseMs(Math.round((Date.now() - quizStartTimeRef.current) / questionsLengthRef.current))
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Advance to next question (called by Enter/Space or tap on wrong answer)
  const handleNext = useCallback(() => {
    if (selectedAnswer === null || advanceLockedRef.current) return
    advanceLockedRef.current = true
    clearTimeout(timerRef.current)
    if (((isEndless || isSuddenDeath) && isCorrect === false) || currentIndex + 1 >= questions.length) {
      setPhase(PHASE_RESULTS)
    } else {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
      answerLockedRef.current = false
    }
  }, [selectedAnswer, currentIndex, questions.length, isEndless, isSuddenDeath, isCorrect])

  // Enter/Space to skip delay after answering
  useEffect(() => {
    if (phase !== PHASE_QUIZ || selectedAnswer === null) return
    const handler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, selectedAnswer, handleNext])

  // save score on results & award XP (only once per quiz session)
  useEffect(() => {
    if (phase === PHASE_RESULTS && questions.length > 0 && !xpAwardedRef.current) {
      xpAwardedRef.current = true
      // for endless/sudden death, only questions actually answered count toward total
      const effectiveTotal = (isEndless || isSuddenDeath) ? currentIndex + 1 : questions.length
      saveQuizResult('vocab', { lessons: selectedLessons, score, total: effectiveTotal })
      const xp = calculateQuizXP(score, effectiveTotal)
      const isPerfect = !isEndless && !isSuddenDeath && score === questions.length && questions.length > 0
      if (xp > 0) awardXP(xp, 'vocab quiz', isPerfect)
    }
  }, [phase, score, questions.length, currentIndex, isEndless, isSuddenDeath, selectedLessons, saveQuizResult, awardXP, calculateQuizXP])

  const effectiveTotal = (isEndless || isSuddenDeath) ? Math.max(currentIndex + 1, 1) : questions.length
  const percentage = effectiveTotal > 0 ? Math.round((score / effectiveTotal) * 100) : 0
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
        <SetupScreen
          availableLessons={availableLessons}
          selectedLessons={selectedLessons}
          toggleLesson={toggleLesson}
          selectAll={selectAll}
          questionCount={questionCount}
          setQuestionCount={setQuestionCount}
          onStart={startQuiz}
          onStartWeakWords={startWeakWordsQuiz}
          onStartJlpt={startJlptMode}
          onStartEndless={startEndless}
          onStartSuddenDeath={startSuddenDeath}
          onStartReview={startReview}
          isReverse={isReverse}
          setIsReverse={setIsReverse}
          typingMode={typingMode}
          setTypingMode={setTypingMode}
          isTimed={isTimed}
          setIsTimed={setIsTimed}
          timeLimit={timeLimit}
          setTimeLimit={setTimeLimit}
          customTimerVal={customTimerVal}
          setCustomTimerVal={setCustomTimerVal}
          unlockedLessons={lessonPool}
          wordTypeFilter={wordTypeFilter}
          setWordTypeFilter={setWordTypeFilter}
        />
      )}

      {phase === PHASE_REVIEW && (
        <ReviewMode
          words={reviewWords}
          onBack={() => setPhase(PHASE_SETUP)}
        />
      )}

      {showCountdown && (
        <QuizCountdown onComplete={() => setShowCountdown(false)} />
      )}

      {phase === PHASE_QUIZ && questions.length > 0 && (
        <QuizScreen
          question={questions[currentIndex]}
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          selectedAnswer={selectedAnswer}
          isCorrect={isCorrect}
          score={score}
          streak={streak}
          onAnswer={handleAnswer}
          onNext={handleNext}
          isEndless={isEndless}
          isSuddenDeath={isSuddenDeath}
          isReverse={isReverse}
          typingMode={typingMode && isReverse}
          isTimed={isTimed}
          timeLimit={timeLimit}
          isPaused={showCountdown}
          romajiInQuiz={romajiInQuiz}
        />
      )}

      {phase === PHASE_RESULTS && (
        <ResultsScreen
          score={score}
          total={isEndless ? score + mistakes.length : effectiveTotal}
          percentage={isEndless ? ((score + mistakes.length) > 0 ? Math.round((score / (score + mistakes.length)) * 100) : 0) : percentage}
          reaction={isSuddenDeath
            ? (score >= 15
              ? { emoji: '💀🏆', text: 'incredible! no mistakes on ' + score + ' words!', textJp: 'すごすぎる！' }
              : score >= 8
              ? { emoji: '💀✨', text: 'great run! ' + score + ' words survived!', textJp: 'よくできました！' }
              : score >= 3
              ? { emoji: '💀💪', text: score + ' words before game over~', textJp: 'もう一度！' }
              : { emoji: '💀😅', text: 'game over fast! try again~', textJp: 'がんばって！' })
            : isEndless
            ? (score >= 20
              ? { emoji: '🎉✨🐱', text: 'sugoi!! incredible run!', textJp: 'すごい！' }
              : score >= 10
              ? { emoji: '🌸😊', text: 'nice run! keep going~', textJp: 'よくできました！' }
              : score >= 5
              ? { emoji: '🐱💪', text: 'not bad! try again~', textJp: 'まだまだ！' }
              : { emoji: '🌙📚', text: 'ganbatte! practice more~', textJp: 'がんばって！' })
            : reaction}
          mistakes={mistakes}
          correctWords={correctWords}
          xpEarned={calculateQuizXP(score, isEndless ? score + mistakes.length : effectiveTotal)}
          bestStreak={bestStreak}
          isEndless={isEndless}
          endlessScore={score}
          isTimed={isTimed}
          timeLimit={timeLimit}
          isReverse={isReverse}
          avgResponseMs={isTimed ? avgResponseMs : null}
          allQuestions={questions}
          onRetry={() => { setIsEndless(false); setIsSuddenDeath(false); setIsReverse(false); setPhase(PHASE_SETUP) }}
          onRetryMistakes={startMistakesQuiz}
        />
      )}
    </div>
  )
}

function SetupScreen({ availableLessons, selectedLessons, toggleLesson, selectAll, questionCount, setQuestionCount, onStart, onStartWeakWords, onStartJlpt, onStartEndless, isReverse, setIsReverse, typingMode, setTypingMode, isTimed, setIsTimed, timeLimit, setTimeLimit, customTimerVal, setCustomTimerVal, unlockedLessons, wordTypeFilter, setWordTypeFilter }) {
  const { progress: setupProgress } = useProgress()
  const lessonBestScores = {}
  if (setupProgress?.vocabQuizzes) {
    setupProgress.vocabQuizzes.forEach(q => {
      const pct = q.total > 0 ? Math.round((q.score / q.total) * 100) : 0
      ;(q.lessons || []).forEach(id => {
        if (lessonBestScores[id] === undefined || pct > lessonBestScores[id]) {
          lessonBestScores[id] = pct
        }
      })
    })
  }

  const totalWords = useMemo(() =>
    unlockedLessons
      .filter(l => selectedLessons.includes(l.id))
      .reduce((sum, l) => sum + l.vocabulary.length, 0),
  [unlockedLessons, selectedLessons])

  const filteredWords = useMemo(() => {
    if (wordTypeFilter === 'all') return totalWords
    const pool = unlockedLessons
      .filter(l => selectedLessons.includes(l.id))
      .flatMap(l => l.vocabulary)
    return pool.filter(w => getWordCategory(w) === wordTypeFilter).length
  }, [wordTypeFilter, totalWords, unlockedLessons, selectedLessons])

  const canStart = selectedLessons.length > 0 && filteredWords >= 4
  const weakCount = loadDifficultWords().length

  return (
    <div className="animate-fadeInUp">
      <div style={styles.header}>
        <h1 style={styles.title}>
          <span style={{ display: 'inline-block', animation: prefersReducedMotion ? undefined : 'float 3s ease-in-out infinite' }}>✨</span>
          {' '}vocab quiz{' '}
          <span style={styles.titleJp}>たんごテスト</span>
        </h1>
        <p style={styles.subtitle}>твоя ежедневная практика 🌸</p>
      </div>

      {/* JLPT N5 quick start */}
      <div className="glass" style={{ ...styles.jlptCard, borderRadius: 16 }}>
        <span style={styles.jlptIcon}>🏅</span>
        <div style={styles.jlptContent}>
          <div style={styles.jlptTitle}>JLPT N5 vocab</div>
          <p style={styles.jlptDesc}>essential N5 words from all lessons</p>
        </div>
        <button onClick={onStartJlpt} className="btn-hover" style={{ ...styles.jlptBtn, borderRadius: 10, minHeight: 44 }}>
          старт
        </button>
      </div>

      {/* weak words quick start */}
      {weakCount >= 4 && (
        <div className="glass" style={{ ...styles.setupCard, marginBottom: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={styles.setupLabel}>
            <span>💪</span> weak words mode
          </div>
          <p style={{
            fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 500, marginBottom: 10, textAlign: 'left',
          }}>
            focus on {weakCount} words you've missed before
          </p>
          <button className="btn btn-primary" onClick={onStartWeakWords} style={{ fontSize: '0.85rem', alignSelf: 'flex-start' }}>
            practice weak words 🎯
          </button>
        </div>
      )}

      {/* two-column: lessons left, settings right */}
      <div style={styles.setupTwoCol}>
        {/* LEFT: lesson selection */}
        <div className="glass" style={styles.setupCard}>
          <div style={styles.setupLabelRow}>
            <div style={styles.setupLabel}><span>📚</span> уроки</div>
            <button onClick={selectAll} className="btn-hover" style={styles.selectAllBtn}>
              {selectedLessons.length === availableLessons.length ? 'снять всё' : 'все'}
            </button>
          </div>
          <div style={styles.lessonCheckList}>
            {availableLessons.map(l => {
              const isSelected = selectedLessons.includes(l.id)
              return (
                <label
                  key={l.id}
                  className="btn-hover"
                  style={{
                    ...styles.lessonCheck,
                    ...(isSelected ? styles.lessonCheckActive : {}),
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleLesson(l.id)}
                    style={{ display: 'none' }}
                  />
                  <span style={{
                    ...styles.checkNum,
                    ...(isSelected ? { color: '#ec4899', fontWeight: 900 } : {}),
                    minWidth: 24, textAlign: 'center', flexShrink: 0,
                  }}>
                    {l.id}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ ...styles.checkJp, fontSize: '0.82rem', fontWeight: 800, display: 'block' }}>
                      {l.titleJp}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 600, display: 'block' }}>
                      {LESSON_TOPICS_RU[l.id] || ''}
                    </span>
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', background: 'rgba(168,85,247,0.1)', padding: '2px 8px', borderRadius: 50 }}>
                      {l.count} сл.
                    </span>
                    {lessonBestScores[l.id] !== undefined && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: lessonBestScores[l.id] >= 80 ? 'var(--correct-text)' : lessonBestScores[l.id] >= 60 ? 'var(--gold-text)' : 'var(--incorrect-text)' }}>
                        ✓ {lessonBestScores[l.id]}%
                      </span>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
          {/* word type filter */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginTop: 8 }}>
            {[
              { key: 'all', label: 'все слова' },
              { key: 'verb', label: 'глаголы' },
              { key: 'adj', label: 'прилагательные' },
              { key: 'noun', label: 'существительные' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setWordTypeFilter(key)}
                style={{
                  padding: '5px 8px', borderRadius: 10, fontFamily: 'inherit',
                  fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.15s',
                  border: wordTypeFilter === key ? 'none' : '1.5px solid rgba(168,85,247,0.3)',
                  background: wordTypeFilter === key ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(168,85,247,0.06)',
                  color: wordTypeFilter === key ? '#fff' : 'var(--text-secondary)',
                  textAlign: 'center', minHeight: 44,
                }}
              >{label}</button>
            ))}
          </div>
          {selectedLessons.length > 0 && (
            <div style={styles.poolInfo}>
              {filteredWords} слов в пуле 🌸
              {wordTypeFilter !== 'all' && filteredWords < 4 && (
                <span style={{ color: 'var(--incorrect-text)', marginLeft: 6, fontWeight: 700 }}>мало слов для теста!</span>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: settings */}
        <div className="glass" style={{ ...styles.setupCard, alignSelf: 'start' }}>
          <div style={styles.settingsGrid}>
            {/* question count */}
            <div style={styles.settingsCol}>
              <div style={styles.settingsSection}>
                <span style={styles.settingsSectionIcon}>🔢</span>
                <span style={styles.settingsColLabel}>количество вопросов</span>
              </div>
              <div style={styles.settingsCountRow}>
                {[5, 10, 15].map(n => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n > totalWords ? 'all' : n)}
                    className="btn-hover"
                    style={{
                      ...styles.settingsChip,
                      ...((questionCount === n) ? styles.settingsChipActive : {}),
                    }}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setQuestionCount('all')}
                  className="btn-hover"
                  style={{
                    ...styles.settingsChip,
                    ...(questionCount === 'all' ? styles.settingsChipActive : {}),
                  }}
                >
                  все
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <input
                    type="number"
                    min={1}
                    max={totalWords || 999}
                    placeholder="?"
                    aria-label="custom question count"
                    value={typeof questionCount === 'number' && ![5, 10, 15].includes(questionCount) ? questionCount : ''}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10)
                      if (!isNaN(v) && v > 0) setQuestionCount(v)
                      else if (e.target.value === '') setQuestionCount(5)
                    }}
                    style={styles.customTimerInput}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 600 }}>своё</span>
                </div>
              </div>
            </div>

            {/* direction */}
            <div style={styles.settingsCol}>
              <div style={styles.settingsSection}>
                <span style={styles.settingsSectionIcon}>🔄</span>
                <span style={styles.settingsColLabel}>направление</span>
              </div>
              <div style={styles.settingsDirRow}>
                <button
                  onClick={() => setIsReverse(false)}
                  className="btn-hover"
                  style={{ ...styles.settingsDirChip, ...(!isReverse ? styles.settingsChipActive : {}) }}
                >
                  <span style={styles.settingsDirFlag}>🇯🇵</span>
                  <span style={styles.settingsDirLabel}>яп → рус</span>
                </button>
                <button
                  onClick={() => setIsReverse(true)}
                  className="btn-hover"
                  style={{ ...styles.settingsDirChip, ...(isReverse ? styles.settingsChipActive : {}) }}
                >
                  <span style={styles.settingsDirFlag}>🇷🇺</span>
                  <span style={styles.settingsDirLabel}>рус → яп</span>
                </button>
              </div>
              {isReverse && (
                <button
                  onClick={() => setTypingMode(p => !p)}
                  className="btn-hover"
                  style={{ ...styles.settingsDirChip, marginTop: 6, ...(typingMode ? styles.settingsChipActive : {}) }}
                >
                  <span style={styles.settingsDirFlag}>✏️</span>
                  <span style={styles.settingsDirLabel}>ввод ромадзи</span>
                </button>
              )}
            </div>

            {/* timer — all in one row */}
            <div style={styles.settingsCol}>
              <div style={styles.settingsSection}>
                <span style={styles.settingsSectionIcon}>⏱️</span>
                <span style={styles.settingsColLabel}>таймер</span>
              </div>
              <div style={{ ...styles.settingsCountRow, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setIsTimed(false)}
                  className="btn-hover"
                  style={{ ...styles.settingsChip, flexShrink: 0, ...(!isTimed ? styles.settingsChipActive : {}) }}
                >
                  выкл
                </button>
                {[10, 15, 30].map(t => (
                  <button
                    key={t}
                    onClick={() => { setIsTimed(true); setTimeLimit(t); setCustomTimerVal('') }}
                    className="btn-hover"
                    style={{ ...styles.settingsChip, flexShrink: 0, ...(isTimed && timeLimit === t && !customTimerVal ? styles.settingsChipActive : {}) }}
                  >
                    {t}с
                  </button>
                ))}
                <input
                  type="number"
                  min={5}
                  max={120}
                  placeholder="сек"
                  aria-label="custom time limit in seconds"
                  value={customTimerVal}
                  onChange={e => {
                    const v = e.target.value
                    setCustomTimerVal(v)
                    const n = parseInt(v, 10)
                    if (!isNaN(n) && n >= 5 && n <= 120) {
                      setIsTimed(true)
                      setTimeLimit(n)
                    }
                  }}
                  style={{ ...styles.customTimerInput, flexShrink: 0 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* start buttons below both columns */}
      <div style={styles.startWrap}>
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button
            className="btn btn-cute"
            onClick={onStart}
            disabled={!canStart}
            style={{
              opacity: canStart ? 1 : 0.5,
              pointerEvents: canStart ? 'auto' : 'none',
              flex: 1,
              fontSize: '1rem',
              padding: '13px 20px',
              borderRadius: 14,
              ...(!prefersReducedMotion && canStart ? { animation: 'glow 2.5s ease-in-out infinite' } : {}),
            }}
          >
            начать квиз ✨
          </button>
          <button
            onClick={onStartEndless}
            disabled={!canStart}
            className="btn-hover"
            style={{ ...styles.endlessBtn, opacity: canStart ? 1 : 0.5, pointerEvents: canStart ? 'auto' : 'none', flex: 1, padding: '13px 20px', borderRadius: 14 }}
          >
            бесконечный ♾️
          </button>
        </div>
        {!canStart && selectedLessons.length > 0 && (
          <p style={styles.warnText}>нужно минимум 4 слова</p>
        )}
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <Link to="/lessons" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>lessons 📚</Link>
          <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
        </div>
      </div>
    </div>
  )
}

function ReviewMode({ words, onBack }) {
  const isTablet = useIsTablet()
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const word = words[index]
  const total = words.length

  const next = useCallback(() => { setRevealed(false); setIndex(i => Math.min(i + 1, total - 1)) }, [total])
  const prev = useCallback(() => { setRevealed(false); setIndex(i => Math.max(i - 1, 0)) }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
      else if (e.key === ' ') { e.preventDefault(); setRevealed(r => !r) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])

  return (
    <div className="animate-fadeInUp" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={styles.header}>
        <h1 style={styles.title}>просмотр 📖</h1>
        <p style={styles.subtitle}>{total} слов · листай и запоминай</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)' }}>
        <button onClick={prev} disabled={index === 0} aria-label="previous word" style={{ ...rvStyles.navBtn, opacity: index === 0 ? 0.3 : 1 }}>←</button>
        <span>{index + 1} / {total}</span>
        <button onClick={next} disabled={index === total - 1} aria-label="next word" style={{ ...rvStyles.navBtn, opacity: index === total - 1 ? 0.3 : 1 }}>→</button>
      </div>

      <div
        className="glass"
        style={{ ...rvStyles.card, ...(isTablet ? rvStyles.cardTablet : {}) }}
        onClick={() => setRevealed(r => !r)}
        role="button"
        tabIndex={0}
        aria-label={revealed ? 'hide translation' : 'reveal translation'}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRevealed(r => !r) } }}
      >
        <div style={{ ...rvStyles.japanese, ...(isTablet ? rvStyles.japaneseTablet : {}) }}>{((word.kanji || word.japanese) || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}</div>
        {word.kanji && <div style={rvStyles.kanji}>{word.japanese}</div>}
        <div style={rvStyles.romaji}>{(word.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}</div>
        <div style={{ height: 1, background: 'rgba(192,132,252,0.2)', margin: '12px 0' }} />
        {revealed ? (
          <div style={rvStyles.russian}>{word.russian}</div>
        ) : (
          <div style={rvStyles.tap}>нажми чтобы открыть</div>
        )}
      </div>

      <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 600, textAlign: 'center' }}>
        ← → листать · пробел открыть
      </div>

      <button onClick={onBack} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
        ← назад
      </button>
    </div>
  )
}

const rvStyles = {
  card: {
    width: '100%', maxWidth: 400, padding: '32px 28px', textAlign: 'center',
    cursor: 'pointer', userSelect: 'none',
  },
  cardTablet: {
    maxWidth: 560,
    padding: '42px 36px',
  },
  japanese: {
    fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: 6, lineHeight: 1.2,
  },
  japaneseTablet: {
    fontSize: '2.45rem',
  },
  kanji: {
    fontSize: '1rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 4,
  },
  romaji: {
    fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 2,
  },
  russian: {
    fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)', lineHeight: 1.4,
  },
  tap: {
    fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic',
  },
  navBtn: {
    background: 'none', border: '1.5px solid rgba(192,132,252,0.3)', borderRadius: 8,
    padding: '4px 10px', cursor: 'pointer', color: 'var(--text-light)', fontWeight: 800, fontFamily: 'inherit',
    fontSize: '0.9rem', transition: 'all 0.15s', minHeight: 44, minWidth: 44,
  },
}

function QuizScreen({ question, currentIndex, totalQuestions, selectedAnswer, isCorrect, score, streak, onAnswer, onNext, isEndless, isSuddenDeath, isReverse, typingMode, isTimed, timeLimit, isPaused, romajiInQuiz }) {
  const isMobile = useIsMobile()
  const progress = (isEndless || isSuddenDeath) ? 100 : ((currentIndex + 1) / totalQuestions) * 100
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const countdownRef = useRef(null)
  const [showCombo, setShowCombo] = useState(false)
  const [typingInput, setTypingInput] = useState('')
  const [hintShown, setHintShown] = useState(false)
  const [gameOverFlash, setGameOverFlash] = useState(false)
  const typingRef = useRef(null)
  const comboTimerRef = useRef(null)

  // Show combo flash when streak hits a multiple of 5
  useEffect(() => {
    if (streak > 0 && streak % 5 === 0) {
      setShowCombo(true)
      clearTimeout(comboTimerRef.current)
      comboTimerRef.current = setTimeout(() => setShowCombo(false), 1200)
    }
    return () => clearTimeout(comboTimerRef.current)
  }, [streak])

  // Flash red on sudden death game over
  useEffect(() => {
    if (isSuddenDeath && isCorrect === false && selectedAnswer !== null) {
      setGameOverFlash(true)
      const t = setTimeout(() => setGameOverFlash(false), 600)
      return () => clearTimeout(t)
    }
  }, [isSuddenDeath, isCorrect, selectedAnswer])

  // Reset timer + typing input on new question
  useEffect(() => {
    if (isTimed) setTimeLeft(timeLimit)
    setTypingInput('')
    setHintShown(false)
    if (typingMode && typingRef.current) typingRef.current.focus()
  }, [currentIndex, isTimed, timeLimit, typingMode])

  // Countdown timer
  useEffect(() => {
    if (!isTimed || isPaused || selectedAnswer !== null) {
      if (countdownRef.current) clearInterval(countdownRef.current)
      return
    }
    if (countdownRef.current) clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(countdownRef.current)
          // Time's up — auto-answer wrong
          onAnswer({ russian: '__TIMEOUT__', japanese: '', romaji: '' })
          return 0
        }
        return Math.max(0, prev - 0.1)
      })
    }, 100)
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [isTimed, isPaused, selectedAnswer, currentIndex, timeLimit, onAnswer])

  const timerPct = isTimed ? (timeLeft / timeLimit) * 100 : 100
  const timerUrgent = isTimed && timeLeft <= 3

  // Keyboard shortcuts: press 1-4 to select answer (only in choice mode, not typing)
  useEffect(() => {
    if (typingMode || isPaused) return
    const handler = (e) => {
      if (selectedAnswer !== null) return
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= 4 && question.options[num - 1]) {
        onAnswer(question.options[num - 1])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedAnswer, question, onAnswer, typingMode, isPaused])

  // Pick feedback phrase once when answer is selected (stable across re-renders)
  const feedbackPhrase = useMemo(() => {
    if (!selectedAnswer) return null
    if (isCorrect) return CORRECT_PHRASES[Math.floor(Math.random() * CORRECT_PHRASES.length)]
    if (selectedAnswer?.russian === '__TIMEOUT__') return '⏱️ время вышло!'
    return INCORRECT_PREFIX[Math.floor(Math.random() * INCORRECT_PREFIX.length)]
  }, [selectedAnswer, isCorrect])

  return (
    <div className="animate-fadeInUp" style={gameOverFlash ? { animation: 'none', outline: '3px solid #ef4444', borderRadius: 16, transition: 'outline 0.1s' } : {}}>
      {/* game over flash overlay */}
      {gameOverFlash && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(239,68,68,0.18)', zIndex: 100, pointerEvents: 'none', borderRadius: 0 }} />
      )}
      {/* combo overlay */}
      {showCombo && (
        <div style={styles.comboOverlay} className="animate-pop">
          <div style={styles.comboBadge}>
            <div style={styles.comboEmoji}>{streak >= 20 ? '🔥🔥🔥' : streak >= 10 ? '🔥🔥' : '🔥'}</div>
            <div style={styles.comboText}>combo! {streak}x</div>
          </div>
        </div>
      )}

      {/* progress */}
      <div style={{ ...styles.progressWrap, marginTop: 28 }}>
        <div style={styles.progressInfo}>
          <Link to="/" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', opacity: 0.5, textDecoration: 'none', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', flexShrink: 0 }} aria-label="exit quiz">✕</Link>
          <span style={styles.progressText}>
            {isEndless
              ? <>
                  {score >= 50 ? '🔥🔥🔥' : score >= 30 ? '🔥🔥' : score >= 20 ? '🔥' : score >= 10 ? '⭐' : '🌱'}
                  {' '}♾️ #{currentIndex + 1}
                  {score >= 10 && <span style={{ fontSize: '0.72rem', marginLeft: 4, color: 'var(--text-light)', fontWeight: 800 }}>
                    {score >= 50 ? 'master' : score >= 30 ? 'expert' : score >= 20 ? 'pro' : `lv.${Math.floor(score / 10)}`}
                  </span>}
                </>
              : isSuddenDeath ? `💀 ${score} survived` : `${currentIndex + 1} / ${totalQuestions}`}
          </span>
          <span style={styles.scoreText} aria-live="polite" aria-atomic="true">
            score: {score} 🐱
            {streak >= 1 && (
              <span style={styles.streakBadge} className="animate-pop" key={streak}>
                {streak >= 7 ? '🔥🔥' : streak >= 5 ? '🔥' : streak >= 3 ? '⚡' : '✨'} {streak}x
              </span>
            )}
          </span>
        </div>
        <div style={styles.progressBar}>
          <div style={{
            ...styles.progressFill,
            width: `${progress}%`,
            ...(isEndless ? { background: 'linear-gradient(90deg, #a855f7, #ec4899, #a855f7)', backgroundSize: '200% 100%', ...(prefersReducedMotion ? {} : { animation: 'shimmer 2s linear infinite' }) } : {}),
            ...(isSuddenDeath ? { background: 'linear-gradient(90deg, #ef4444, #f97316)', backgroundSize: '200% 100%', ...(prefersReducedMotion ? {} : { animation: 'shimmer 2s linear infinite' }) } : {}),
          }} />
        </div>
      </div>

      {/* countdown timer */}
      {isTimed && selectedAnswer === null && (
        <div style={styles.timerWrap}>
          <div style={styles.timerBar}>
            <div style={{
              ...styles.timerFill,
              width: `${timerPct}%`,
              background: timerUrgent
                ? 'linear-gradient(90deg, #f43f5e, #ef4444)'
                : 'linear-gradient(90deg, #a855f7, #ec4899)',
              transition: 'width 0.1s linear',
            }} />
          </div>
          <span style={{
            ...styles.timerText,
            color: timerUrgent ? 'var(--incorrect-text)' : 'var(--text-light)',
            ...(!prefersReducedMotion && timerUrgent ? { animation: 'pulse 0.5s ease infinite' } : {}),
          }}>
            {Math.ceil(timeLeft)}s
          </span>
        </div>
      )}

      {/* question card — re-animates on new question via key */}
      <div
        key={`question-card-${currentIndex}`}
        className="glass animate-fadeInUp"
        onClick={isCorrect === false && selectedAnswer !== null ? onNext : undefined}
        role={isCorrect === false && selectedAnswer !== null ? 'button' : undefined}
        tabIndex={isCorrect === false && selectedAnswer !== null ? 0 : undefined}
        aria-label={isCorrect === false && selectedAnswer !== null ? 'continue to next question' : undefined}
        onKeyDown={isCorrect === false && selectedAnswer !== null ? (e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNext() } }) : undefined}
        style={{
          ...styles.questionCard,
          ...(!prefersReducedMotion && isCorrect === false ? { animation: 'shake 0.4s ease', cursor: 'pointer' } : {}),
          ...(isCorrect === true ? { boxShadow: '0 0 0 2px rgba(16,185,129,0.35), 0 8px 32px rgba(16,185,129,0.12)' } : {}),
        }}
      >
        {isReverse ? (
          <>
            <div style={styles.questionLabel}>как сказать по-японски? 🤔</div>
            <div style={styles.questionRussian}>{question.word.russian}</div>
            {romajiInQuiz && selectedAnswer === null && !hintShown && (
              <button
                onClick={() => setHintShown(true)}
                aria-label="показать написание слова"
                style={{ marginTop: 8, fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', background: 'rgba(168,85,247,0.08)', border: 'none', borderRadius: 50, padding: '3px 12px', cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}
              >
                показать написание 💡
              </button>
            )}
            {hintShown && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }} className="animate-pop">
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-light)', letterSpacing: '0.05em' }}>
                  {((question.word.kanji || question.word.japanese) || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}
                </div>
                {question.word.kanji && (
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-light)' }}>
                    {(question.word.japanese || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}
                  </div>
                )}
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-light)', fontStyle: 'italic' }}>
                  {(question.word.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div style={styles.questionLabel}>что это значит? 🤔</div>
            <div style={styles.questionWord}>{((question.word.kanji || question.word.japanese) || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}</div>
            {question.word.kanji && (
              <div style={styles.questionKanji}>{(question.word.japanese || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}</div>
            )}
            {romajiInQuiz && <div style={styles.questionRomaji}>{(question.word.romaji || '').replace(/\s*\[[^\]]*\]/g, '').trim()}</div>}
          </>
        )}
      </div>

      {/* tap to continue hint on wrong answer */}
      {isCorrect === false && selectedAnswer !== null && (
        <div
          onClick={onNext}
          role="button"
          tabIndex={0}
          aria-label="continue to next question"
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNext() } }}
          style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(192,132,252,0.6)', cursor: 'pointer', marginBottom: 4, letterSpacing: '0.04em' }}
        >
          нажми чтобы продолжить →
        </div>
      )}

      {/* typing mode input */}
      {typingMode && (
        <div style={{ marginBottom: 12 }}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (selectedAnswer !== null || !typingInput.trim()) return
              const input = typingInput.trim().toLowerCase().replace(/ō/g, 'o').replace(/ū/g, 'u')
              const correct = (question.word.romaji || '').replace(/\s*\[.*?\]/g, '').replace(/~/g, '').trim().toLowerCase().replace(/ō/g, 'o').replace(/ū/g, 'u')
              const match = input === correct
              onAnswer(match ? question.word : { russian: '__WRONG__', japanese: '', romaji: '' })
            }}
            style={{ display: 'flex', gap: 8 }}
          >
            <input
              ref={typingRef}
              type="text"
              value={typingInput}
              onChange={(e) => setTypingInput(e.target.value)}
              disabled={isPaused || selectedAnswer !== null}
              placeholder="type romaji..." aria-label="type romaji reading"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              style={{
                flex: 1, padding: '14px 16px', borderRadius: 14, fontFamily: 'inherit',
                fontSize: '1rem', fontWeight: 700, border: selectedAnswer !== null
                  ? `2px solid ${isCorrect ? 'var(--correct-text)' : 'var(--incorrect-text)'}`
                  : '2px solid rgba(192,132,252,0.3)',
                background: selectedAnswer !== null
                  ? isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)'
                  : 'var(--glass-bg)',
                color: 'var(--text-main)', outline: 'none', transition: 'border-color 0.2s',
              }}
            />
            <button
              type="submit"
              disabled={isPaused || selectedAnswer !== null || !typingInput.trim()}
              className="btn btn-cute"
              style={{ flexShrink: 0, opacity: isPaused || selectedAnswer !== null || !typingInput.trim() ? 0.5 : 1, pointerEvents: isPaused || selectedAnswer !== null ? 'none' : 'auto' }}
            >
              →
            </button>
          </form>
          {selectedAnswer !== null && (
            <div style={{ marginTop: 6, fontSize: '0.85rem', fontWeight: 700, color: isCorrect ? 'var(--correct-text)' : 'var(--incorrect-text)', textAlign: 'center' }}>
              {isCorrect ? '✓ правильно!' : `✗ правильно: ${(question.word.romaji || '').replace(/\s*\[.*?\]/g, '').replace(/~/g, '').trim()}`}
            </div>
          )}
          {selectedAnswer === null && (
            <button
              onClick={() => setHintShown(true)}
              disabled={hintShown}
              aria-label={hintShown ? 'hint shown' : 'show romaji hint'}
              style={{
                marginTop: 6, fontSize: '0.72rem', fontWeight: 700,
                color: 'var(--text-light)',
                background: 'rgba(168,85,247,0.06)', border: 'none', borderRadius: 8,
                padding: '4px 10px', cursor: hintShown ? 'default' : 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s', minHeight: 44,
              }}
            >
              {hintShown ? `💡 L${question.word.lesson} · ${(question.word.romaji || '').replace(/\s*\[.*?\]/g, '').trim().slice(0, 4)}...` : '💡 подсказка'}
            </button>
          )}
        </div>
      )}

      {/* options */}
      {!typingMode && <div key={`question-options-${currentIndex}`} style={{ ...styles.optionsGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
        {question.options.map((opt, i) => {
          let optStyle = { ...styles.option }
          const isOptionCorrect = isSameVocabWord(opt, question.word)
          // key uses currentIndex so buttons are fresh per question (prevents focus-carry-over bug)
          const isSelectedWrong = isSameVocabWord(selectedAnswer, opt) && !isCorrect

          if (selectedAnswer) {
            if (isOptionCorrect) {
              optStyle = { ...optStyle, ...styles.optionCorrect }
            } else if (isSelectedWrong) {
              optStyle = { ...optStyle, ...styles.optionIncorrect }
            } else {
              optStyle = { ...optStyle, opacity: 0.4 }
            }
          }

          return (
            <button
              key={`${currentIndex}-${i}`}
              onClick={() => onAnswer(opt)}
              className="glass-sm quiz-option"
              style={optStyle}
              disabled={isPaused || selectedAnswer !== null}
            >
              <span style={styles.optionNumber}>{i + 1}</span>
              {isReverse ? (
                <span>
                  {(opt.kanji || opt.japanese || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}
                  <span style={styles.optionRomaji}> ({(opt.romaji || '').replace(/\s*\[.*?\]/g, '').trim()})</span>
                </span>
              ) : (
                opt.russian
              )}
            </button>
          )
        })}
      </div>}

      {/* keyboard hint */}
      {!selectedAnswer && (
        <div style={{ textAlign: 'center', marginTop: -4, marginBottom: 10 }}>
          <span style={{
            fontSize: '0.75rem', fontWeight: 700,
            color: 'var(--text-light)',
            background: 'var(--tint-strong)',
            padding: '4px 12px',
            borderRadius: 50,
            letterSpacing: '0.03em',
          }}>
            ⌨ 1–4
          </span>
        </div>
      )}

      {/* feedback */}
      {selectedAnswer && (
        <div
          style={{
            ...styles.feedback,
            color: isCorrect ? 'var(--correct-text)' : '#f97316',
            background: isCorrect
              ? 'rgba(16, 185, 129, 0.08)'
              : 'rgba(249, 115, 22, 0.08)',
            borderRadius: 14,
            padding: '14px 16px',
          }}
          className="animate-pop"
        >
          {feedbackPhrase}
        </div>
      )}

      {/* explanation card for wrong answers */}
      {selectedAnswer && !isCorrect && (
        <div className="glass animate-fadeInUp" style={{
          padding: '12px 16px', borderRadius: 14, marginTop: 4,
          borderLeft: '3px solid #f97316', display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f97316', textTransform: 'lowercase', letterSpacing: '0.04em' }}>
            правильный ответ
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
            {((question.word.kanji || question.word.japanese) || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}
          </div>
          {question.word.kanji && (
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-light)' }}>{(question.word.japanese || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}</div>
          )}
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic' }}>{(question.word.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{question.word.russian}</div>
          {question.word.lesson && (
            <Link to={`/lessons/${question.word.lesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none', alignSelf: 'flex-start', marginTop: 2 }}>
              lesson {question.word.lesson} →
            </Link>
          )}
        </div>
      )}

      {selectedAnswer && (
        <div style={{ textAlign: 'center', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 6 }}>
          нажми enter, чтобы продолжить →
        </div>
      )}
    </div>
  )
}

function ResultsScreen({ score, total, percentage, reaction, mistakes, onRetry, onRetryMistakes, correctWords, xpEarned, bestStreak, isEndless, endlessScore, isTimed, timeLimit, avgResponseMs, allQuestions }) {
  const isTablet = useIsTablet()
  const [repeatCount, setRepeatCount] = useState(1)
  const [showReview, setShowReview] = useState(false)
  const [showCorrect, setShowCorrect] = useState(false)

  // Update difficult words list
  useEffect(() => {
    const stripBr = s => (s || '').replace(/\[.*?\]/g, '').trim()
    const current = loadDifficultWords()

    // Add mistake words (skip if already tracked by recordMiss during quiz)
    const mistakeWords = mistakes.map(m => ({ japanese: m.word.japanese, romaji: m.word.romaji, lesson: m.word.lesson }))
    let updated = [...current]
    mistakeWords.forEach(mw => {
      if (!updated.some(dw =>
        stripBr(dw.japanese) === stripBr(mw.japanese) && stripBr(dw.romaji) === stripBr(mw.romaji) &&
        (dw.lesson == null || mw.lesson == null || dw.lesson === mw.lesson)
      )) {
        updated.push(mw)
      }
    })

    // Remove words answered correctly (lesson-aware to avoid clearing homonyms)
    if (correctWords && correctWords.length > 0) {
      updated = updated.filter(dw =>
        !correctWords.some(cw =>
          stripBr(cw.japanese) === stripBr(dw.japanese) && stripBr(cw.romaji) === stripBr(dw.romaji) &&
          (cw.lesson == null || dw.lesson == null || cw.lesson === dw.lesson)
        )
      )
    }

    saveDifficultWords(updated)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="animate-fadeInUp" style={styles.resultsWrap}>
      <div className="glass" style={{ ...styles.resultsCard, ...(isTablet ? styles.resultsCardTablet : {}) }}>
        <Confetti trigger={score === total} />
        <div style={{ ...styles.resultsEmoji, animation: prefersReducedMotion ? undefined : 'float 3s ease-in-out infinite' }}>{reaction.emoji}</div>
        <h2 style={styles.resultsTitle}>{reaction.textJp}</h2>
        <p style={styles.resultsText}>{reaction.text}</p>

        {isEndless && (
          <div style={styles.endlessBadge} className="animate-pop">
            <span>♾️</span> выжила <span style={styles.endlessCount}>{endlessScore}</span> вопросов!
          </div>
        )}

        {isTimed && !isEndless && (
          <div style={styles.timedBadge} className="animate-pop">
            ⏱️ режим таймера — {timeLimit}с на вопрос
            {avgResponseMs > 0 && (
              <span style={{ marginLeft: 8, opacity: 0.8 }}>· avg {(avgResponseMs / 1000).toFixed(1)}с/вопрос</span>
            )}
          </div>
        )}

        <div style={{
          ...styles.scoreCircle,
          ...(percentage === 100 ? { background: 'linear-gradient(135deg, #10b981, #34d399)' } : {}),
        }} className={percentage >= 90 ? 'score-perfect' : 'score-circle'}>
          <div style={styles.scoreCircleInner}>
            <span style={{
              ...styles.scoreBig,
              ...(percentage === 100 ? { color: 'var(--correct-text)' } : {}),
            }}>{isEndless ? endlessScore : `${percentage}%`}</span>
            <span style={styles.scoreDetail}>{isEndless ? 'подряд!' : (score === total ? '完璧！' : `${score}/${total}`)}</span>
          </div>
        </div>

        {xpEarned > 0 && (
          <div style={styles.xpBadge} className="animate-pop">
            <span style={styles.xpIcon}>⚡</span>
            <span style={styles.xpAmount}>+{xpEarned} XP</span>
          </div>
        )}

        {bestStreak >= 3 && (
          <div style={styles.streakResult}>
            {bestStreak >= 7 ? '🔥🔥' : bestStreak >= 5 ? '🔥' : '⚡'} лучшая серия: {bestStreak}x
          </div>
        )}

        {/* word type breakdown */}
        {mistakes.length > 1 && allQuestions && (() => {
          const cats = { verb: { label: 'глаголы', emoji: '🔵' }, adj: { label: 'прилагательные', emoji: '🟣' }, noun: { label: 'существительные', emoji: '🟡' } }
          const rows = Object.entries(cats).map(([cat, meta]) => {
            const total = allQuestions.filter(q => getWordCategory(q.word) === cat).length
            if (total === 0) return null
            const missed = mistakes.filter(m => getWordCategory(m.word) === cat).length
            const pct = Math.round(((total - missed) / total) * 100)
            return { ...meta, cat, total, missed, pct }
          }).filter(Boolean)
          if (rows.length < 2) return null
          return (
            <div style={{ marginBottom: 14, width: '100%' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, textAlign: 'center' }}>по типам</div>
              {rows.map(r => (
                <div key={r.cat} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{r.label}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: r.pct >= 80 ? 'var(--correct-text)' : r.pct >= 50 ? 'var(--gold-text)' : 'var(--incorrect-text)' }}>{r.pct}%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 50, background: 'rgba(192,132,252,0.12)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${r.pct}%`, borderRadius: 50, background: r.pct >= 80 ? 'var(--correct-text)' : r.pct >= 50 ? 'var(--gold-text)' : 'var(--incorrect-text)', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          )
        })()}

        {/* mistakes list */}
        {mistakes.length > 0 && (
          <div style={styles.mistakesSection}>
            <div style={{ ...styles.mistakesLabel, color: 'var(--text-light)' }}>
              эти слова стоит повторить ✏️ ({mistakes.length})
            </div>
            <div style={styles.mistakesList}>
              {mistakes.map((m, i) => (
                <div key={(m.word.japanese || '') + i} style={styles.mistakeItem}>
                  <div style={styles.mistakeWord}>{(m.word.japanese || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}</div>
                  <div style={styles.mistakeCorrect}>✓ {m.word.russian}</div>
                  <div style={styles.mistakeYours}>{m.yourAnswer === '__TIMEOUT__' ? '⏱️ время вышло' : `твой ответ: ${m.yourAnswer}`}</div>
                  {m.word.lesson && (
                    <Link to={`/lessons/${m.word.lesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none' }}>
                      lesson {m.word.lesson} →
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* retry mistakes */}
            <div style={styles.retryMistakesWrap}>
              <div style={styles.repeatRow}>
                <span style={styles.repeatLabel}>повторить:</span>
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    onClick={() => setRepeatCount(n)}
                    className="btn-hover"
                    style={{
                      ...styles.repeatBtn,
                      ...(repeatCount === n ? styles.repeatBtnActive : {}),
                    }}
                  >
                    x{n}
                  </button>
                ))}
              </div>
              <button
                className="btn btn-primary"
                onClick={() => onRetryMistakes(repeatCount)}
                style={{ fontSize: '0.85rem' }}
              >
                работать над ошибками ({mistakes.length * repeatCount} вопр.)
              </button>
            </div>
          </div>
        )}

        {/* correct words list */}
        {correctWords && correctWords.length > 0 && !isEndless && (
          <div style={styles.correctSection}>
            <button
              onClick={() => setShowCorrect(v => !v)}
              className="btn-hover"
              style={styles.correctToggle}
            >
              {showCorrect ? 'скрыть правильные ▲' : `правильные слова (${correctWords.length}) ▼`}
            </button>
            {showCorrect && (
              <div style={styles.correctList}>
                {correctWords.map((w, i) => (
                  <div key={(w.japanese || '') + i} style={styles.correctItem}>
                    <span style={styles.correctJp}>{w.kanji || (w.japanese || '').replace(/\[.*?\]/g, '').trim()}</span>
                    <span style={styles.correctRu}>{w.russian}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* review all questions */}
        {allQuestions && allQuestions.length > 0 && !isEndless && (
          <div style={styles.reviewSection}>
            <button
              onClick={() => setShowReview(!showReview)}
              className="btn-hover"
              style={styles.reviewToggle}
            >
              {showReview ? 'скрыть разбор ▲' : `разобрать все ${allQuestions.length} вопросов ▼`}
            </button>
            {showReview && (
              <div style={styles.reviewList}>
                {allQuestions.map((q, i) => {
                  const wasMistake = mistakes.some(m => isSameVocabWord(m.word, q.word))
                  return (
                    <div key={(q.word.japanese || '') + i} style={{
                      ...styles.reviewItem,
                      borderLeftColor: wasMistake ? 'var(--incorrect-text)' : 'var(--correct-text)',
                    }}>
                      <div style={styles.reviewNum}>{i + 1}</div>
                      <div style={styles.reviewContent}>
                        <div style={styles.reviewJp}>{(q.word.japanese || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}</div>
                        <div style={styles.reviewRomaji}>{(q.word.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}</div>
                        <div style={styles.reviewRu}>{q.word.russian}</div>
                      </div>
                      <div style={{
                        ...styles.reviewStatus,
                        color: wasMistake ? 'var(--incorrect-text)' : 'var(--correct-text)',
                      }}>
                        {wasMistake ? '✗' : '✓'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div style={styles.resultsActions}>
          <div style={styles.resultsActionsTop}>
            <button className="btn btn-cute" onClick={onRetry} style={{ flex: 1 }}>
              ещё раз 🌸
            </button>
            <ShareResult
              quizName="vocab quiz"
              score={score}
              total={total}
              percentage={percentage}
              bestStreak={bestStreak || 0}
              xpEarned={xpEarned || 0}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/quiz/weak" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>weak words 🔥</Link>
            <Link to="/search" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>search 🔍</Link>
            <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

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
    fontSize: '1rem',
    color: 'var(--text-light)',
    fontWeight: 700,
    marginLeft: 4,
  },
  subtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  jlptCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    marginBottom: 14,
    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(245, 158, 11, 0.08), rgba(192, 132, 252, 0.1))',
    border: '1.5px solid rgba(251, 191, 36, 0.35)',
  },
  jlptIcon: {
    fontSize: '1.3rem',
    lineHeight: 1,
    flexShrink: 0,
  },
  jlptContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  jlptTitle: {
    fontSize: '0.88rem',
    fontWeight: 900,
    color: 'var(--text-main)',
  },
  jlptDesc: {
    fontSize: '0.78rem',
    color: 'var(--text-light)',
    fontWeight: 500,
    margin: 0,
  },
  jlptBtn: {
    fontSize: '0.8rem',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    border: 'none',
    color: 'white',
    fontWeight: 700,
    padding: '8px 16px',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flexShrink: 0,
    whiteSpace: 'nowrap',
    minHeight: 44,
  },
  setupTwoCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 10,
    marginBottom: 12,
  },
  setupLabelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  setupCard: {
    padding: 16,
    marginBottom: 0,
  },
  settingsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    flex: 1,
  },
  settingsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  settingsSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  settingsSectionIcon: {
    fontSize: '1.2rem',
  },
  settingsColLabel: {
    fontSize: '1rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    textTransform: 'lowercase',
  },
  settingsDirRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  settingsDirChip: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '12px 8px',
    borderRadius: 14,
    border: '1.5px solid rgba(192,132,252,0.25)',
    background: 'var(--tint-strong)',
    fontSize: '0.88rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.18s',
    minHeight: 44,
  },
  settingsDirFlag: {
    fontSize: '1.6rem',
  },
  settingsDirLabel: {
    fontSize: '0.82rem',
    fontWeight: 700,
    color: 'inherit',
  },
  customTimerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  customTimerLabel: {
    fontSize: '0.88rem',
    fontWeight: 700,
    color: 'var(--text-light)',
  },
  customTimerInput: {
    width: 70,
    padding: '6px 10px',
    borderRadius: 10,
    border: '1.5px solid rgba(192,132,252,0.3)',
    background: 'var(--tint-heavy)',
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-main)',
    fontFamily: 'inherit',
    outline: 'none',
    textAlign: 'center',
    appearance: 'textfield',
  },
  settingsCountRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  settingsChip: {
    padding: '6px 12px',
    borderRadius: 12,
    border: '1.5px solid rgba(192,132,252,0.25)',
    background: 'var(--tint-strong)',
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.18s',
    minHeight: 38,
  },
  settingsChipActive: {
    background: 'linear-gradient(135deg, #ec4899, #a855f7)',
    color: 'white',
    border: '1.5px solid rgba(236,72,153,0.4)',
    boxShadow: '0 2px 8px rgba(236,72,153,0.25)',
  },
  setupLabel: {
    fontSize: '1rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textTransform: 'lowercase',
  },
  selectAllBtn: {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    background: 'rgba(168, 85, 247, 0.08)',
    padding: '6px 10px',
    borderRadius: 12,
    textTransform: 'lowercase',
    cursor: 'pointer',
    border: 'none',
    minHeight: 38,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonCheckList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    maxHeight: 300,
    overflowY: 'auto',
    paddingRight: 2,
  },
  lessonCheckGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: 8,
  },
  lessonCheck: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 12,
    background: 'var(--tint)',
    border: '1.5px solid rgba(192,132,252,0.2)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '0.9rem',
    userSelect: 'none',
    minHeight: 44,
  },
  lessonCheckActive: {
    background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(192,132,252,0.14))',
    border: '1.5px solid rgba(168,85,247,0.5)',
    boxShadow: '0 0 0 2px rgba(168,85,247,0.1), 0 4px 12px rgba(168,85,247,0.1)',
  },
  checkNum: {
    fontWeight: 900,
    color: 'var(--text-light)',
    fontSize: '0.82rem',
    minWidth: 22,
    textAlign: 'center',
  },
  checkJp: {
    fontWeight: 600,
    color: 'var(--text-main)',
    flex: 1,
    fontSize: '0.88rem',
  },
  checkCount: {
    fontSize: '0.78rem',
    color: 'var(--text-light)',
    fontWeight: 600,
  },
  poolInfo: {
    marginTop: 10,
    fontSize: '0.92rem',
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
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  numberInput: {
    width: 70,
    textAlign: 'center',
    fontSize: '1.3rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    background: 'var(--tint)',
    border: '2px solid rgba(192,132,252,0.3)',
    borderRadius: 12,
    padding: '4px 8px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--text-light)',
  },
  allBtn: {
    padding: '3px 14px',
    borderRadius: 12,
    background: 'var(--tint-medium)',
    border: '1.5px solid rgba(192,132,252,0.25)',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textTransform: 'lowercase',
    minHeight: 36,
  },
  allBtnActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    color: 'white',
    border: '1.5px solid transparent',
  },
  startWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 12,
    marginBottom: 90,
  },
  endlessBtn: {
    padding: '10px 20px',
    borderRadius: 14,
    background: 'rgba(168,85,247,0.08)',
    border: '1.5px solid rgba(168,85,247,0.3)',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    minHeight: 44,
  },
  endlessBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 18px',
    borderRadius: 50,
    background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(236,72,153,0.08))',
    border: '1.5px solid rgba(168,85,247,0.25)',
    fontSize: '0.82rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    marginBottom: 12,
  },
  endlessCount: {
    fontSize: '1.1rem',
    fontWeight: 900,
    color: '#ec4899',
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
    marginBottom: 6,
  },
  progressText: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
  },
  scoreText: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--text-light)',
  },
  progressBar: {
    height: 10,
    borderRadius: 50,
    background: 'var(--tint-strong)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 50,
    background: 'linear-gradient(90deg, #f472b6, #c084fc)',
    transition: 'width 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
  },
  questionCard: {
    textAlign: 'center',
    padding: '28px 20px',
    marginBottom: 16,
  },
  questionLabel: {
    fontSize: '0.95rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    marginBottom: 16,
    textTransform: 'lowercase',
    letterSpacing: '0.02em',
  },
  questionWord: {
    fontSize: 'clamp(2rem, 8vw, 3rem)',
    fontWeight: 900,
    color: 'var(--text-main)',
    marginBottom: 8,
    lineHeight: 1.15,
  },
  questionKanji: {
    fontSize: '1.05rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    marginBottom: 6,
  },
  questionRomaji: {
    fontSize: '1.2rem',
    color: 'var(--text-light)',
    fontWeight: 700,
    fontStyle: 'italic',
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 16,
  },
  option: {
    padding: '18px 14px',
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-main)',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    background: 'var(--tint)',
    position: 'relative',
    minHeight: 62,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1.35,
  },
  optionNumber: {
    position: 'absolute',
    top: 7,
    left: 9,
    fontSize: '0.72rem',
    fontWeight: 900,
    color: 'var(--text-light)',
    opacity: 0.55,
    lineHeight: 1,
    background: 'var(--tint-strong)',
    borderRadius: '50%',
    width: 16,
    height: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCorrect: {
    background: 'rgba(16, 185, 129, 0.15)',
    border: '2px solid var(--correct-text)',
    color: 'var(--correct-text)',
    boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.12), 0 6px 18px rgba(16, 185, 129, 0.18)',
  },
  optionIncorrect: {
    background: 'rgba(244, 63, 94, 0.1)',
    border: '2px solid var(--incorrect-text)',
    color: 'var(--incorrect-text)',
    ...(prefersReducedMotion ? {} : { animation: 'shake 0.4s ease' }),
    boxShadow: '0 0 0 3px rgba(244, 63, 94, 0.1)',
  },
  feedback: {
    textAlign: 'center',
    fontSize: '1rem',
    fontWeight: 800,
    padding: 12,
  },
  resultsWrap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: 'calc(100vh - 120px)',
    paddingTop: 12,
    paddingBottom: 90,
  },
  resultsCard: {
    textAlign: 'center',
    padding: '36px 28px',
    maxWidth: 460,
    width: '100%',
  },
  resultsCardTablet: {
    maxWidth: 560,
    padding: '42px 34px',
  },
  resultsEmoji: {
    fontSize: '3rem',
    marginBottom: 10,
    display: 'block',
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
    width: 128,
    height: 128,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    boxShadow: '0 10px 30px rgba(236, 72, 153, 0.3)',
  },
  scoreCircleInner: {
    width: 108,
    height: 108,
    borderRadius: '50%',
    background: 'var(--tint-solid)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBig: {
    fontSize: '2rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    lineHeight: 1,
  },
  scoreDetail: {
    fontSize: '0.82rem',
    color: 'var(--text-light)',
    fontWeight: 700,
    marginTop: 2,
  },
  mistakesSection: {
    marginBottom: 20,
    textAlign: 'left',
  },
  mistakesLabel: {
    fontSize: '0.85rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    textTransform: 'lowercase',
    marginBottom: 10,
    textAlign: 'center',
  },
  mistakesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  mistakeItem: {
    background: 'rgba(168, 85, 247, 0.05)',
    border: '1px solid rgba(168, 85, 247, 0.18)',
    borderLeft: '3px solid #a855f7',
    borderRadius: 10,
    padding: '9px 13px',
  },
  mistakeWord: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--text-main)',
  },
  mistakeCorrect: {
    fontSize: '0.82rem',
    fontWeight: 700,
    color: 'var(--correct-text)',
  },
  mistakeYours: {
    fontSize: '0.78rem',
    fontWeight: 500,
    color: 'var(--text-light)',
    fontStyle: 'italic',
    marginTop: 1,
  },
  retryMistakesWrap: {
    marginTop: 12,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  repeatRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  repeatLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
  },
  repeatBtn: {
    padding: '4px 12px',
    borderRadius: 50,
    background: 'var(--tint-medium)',
    border: '1.5px solid rgba(192,132,252,0.25)',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatBtnActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    color: 'white',
    border: '1.5px solid transparent',
  },
  resultsActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 4,
  },
  resultsActionsTop: {
    display: 'flex',
    gap: 10,
  },
  comboOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, pointerEvents: 'none',
    background: 'rgba(0,0,0,0.08)',
  },
  comboBadge: {
    textAlign: 'center',
    background: 'var(--tint-solid)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRadius: 24,
    padding: '24px 40px',
    boxShadow: '0 12px 40px rgba(244,114,182,0.35)',
    border: '2px solid rgba(244,114,182,0.5)',
  },
  comboEmoji: { fontSize: '2.4rem', marginBottom: 4 },
  comboText: {
    fontSize: '1.6rem', fontWeight: 900, color: '#f472b6',
    textTransform: 'lowercase', letterSpacing: '0.02em',
  },
  streakBadge: {
    marginLeft: 8,
    fontSize: '0.75rem',
    fontWeight: 800,
    color: 'var(--gold-text)',
    background: 'rgba(217, 119, 6, 0.12)',
    padding: '2px 8px',
    borderRadius: 50,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
  },
  streakResult: {
    textAlign: 'center',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--gold-text)',
    marginBottom: 16,
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
  directionRow: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
  },
  directionBtn: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: 12,
    border: '1.5px solid rgba(192,132,252,0.2)',
    background: 'var(--tint-light)',
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
  },
  directionBtnActive: {
    background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.1))',
    border: '1.5px solid #a855f7',
    color: 'var(--text-light)',
    boxShadow: '0 2px 8px rgba(168, 85, 247, 0.15)',
  },
  directionIcon: {
    fontSize: '1rem',
  },
  directionLabel: {
    fontSize: '0.72rem',
    fontWeight: 600,
  },
  questionRussian: {
    fontSize: '1.8rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    lineHeight: 1.4,
  },
  optionRomaji: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-light)',
  },
  timedRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 6,
  },
  timedSpeedsLabel: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    textAlign: 'center',
    marginBottom: 6,
    textTransform: 'lowercase',
  },
  timedToggle: {
    padding: '8px 24px',
    borderRadius: 50,
    border: '1.5px solid rgba(192,132,252,0.3)',
    background: 'var(--tint-medium)',
    fontSize: '0.88rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    minWidth: 52,
    minHeight: 44,
  },
  timedToggleActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    color: 'white',
    border: '1.5px solid transparent',
  },
  timedSpeeds: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
  },
  timedSpeedBtn: {
    padding: '6px 16px',
    borderRadius: 50,
    border: '1.5px solid rgba(192,132,252,0.2)',
    background: 'var(--tint-light)',
    fontSize: '0.82rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    minHeight: 44,
  },
  timedSpeedBtnActive: {
    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
    color: 'white',
    border: '1.5px solid transparent',
  },
  timerWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    padding: '6px 0',
  },
  timerBar: {
    flex: 1,
    height: 8,
    borderRadius: 50,
    background: 'var(--tint-strong)',
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: 50,
  },
  timerText: {
    fontSize: '0.85rem',
    fontWeight: 900,
    minWidth: 30,
    textAlign: 'right',
  },
  correctSection: {
    marginTop: 12,
    marginBottom: 4,
  },
  correctToggle: {
    width: '100%',
    padding: '8px 14px',
    borderRadius: 10,
    border: '1.5px solid rgba(16,185,129,0.2)',
    background: 'rgba(16,185,129,0.05)',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--correct-text)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    minHeight: 44,
  },
  correctList: {
    marginTop: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    maxHeight: 240,
    overflowY: 'auto',
  },
  correctItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    padding: '5px 10px',
    borderRadius: 8,
    background: 'rgba(16,185,129,0.06)',
    borderLeft: '3px solid var(--correct-text)',
  },
  correctJp: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--text-main)',
  },
  correctRu: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  reviewSection: {
    marginTop: 16,
    marginBottom: 4,
  },
  reviewToggle: {
    width: '100%',
    padding: '8px 14px',
    borderRadius: 10,
    border: '1.5px solid rgba(192,132,252,0.2)',
    background: 'rgba(168,85,247,0.05)',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    minHeight: 44,
  },
  reviewList: {
    marginTop: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    maxHeight: 300,
    overflowY: 'auto',
  },
  reviewItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    borderRadius: 8,
    background: 'rgba(192,132,252,0.1)',
    borderLeft: '3px solid',
  },
  reviewNum: {
    fontSize: '0.72rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    minWidth: 18,
    textAlign: 'center',
  },
  reviewContent: {
    flex: 1,
    minWidth: 0,
    textAlign: 'left',
  },
  reviewJp: {
    fontSize: '0.82rem',
    fontWeight: 800,
    color: 'var(--text-main)',
  },
  reviewRomaji: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--text-light)',
  },
  reviewRu: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  reviewStatus: {
    fontSize: '0.9rem',
    fontWeight: 900,
    flexShrink: 0,
  },
  timedBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '6px 16px',
    borderRadius: 50,
    background: 'linear-gradient(135deg, rgba(244,114,182,0.1), rgba(168,85,247,0.08))',
    border: '1.5px solid rgba(244,114,182,0.25)',
    fontSize: '0.78rem',
    fontWeight: 700,
    color: '#ec4899',
    marginBottom: 12,
  },
}
