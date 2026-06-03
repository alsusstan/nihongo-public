import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { useXP } from '../hooks/useXP'
import { useIsMobile, useIsTablet } from '../hooks/useIsMobile'
import { useUnlockedLessons } from '../hooks/useUnlockedLessons'
import ShareResult from '../components/ShareResult'
import QuizCountdown from '../components/QuizCountdown'
import Confetti from '../components/Confetti'
import { useWordTracker } from '../hooks/useWordTracker'
import { getStoredQuizSize } from '../utils/localSettings'
import { getTrackedLessons } from '../utils/lessonProgress'
import { prefersReducedMotion as getPrefersReducedMotion } from '../utils/motion'

const prefersReducedMotion = getPrefersReducedMotion()

// JLPT N5 essential vocabulary — curated list of common N5-level words (Japanese text)
const jlptN5Words = new Set([
  // Basic verbs (masu-form)
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

  // i-adjectives
  '大きい', '小さい', '新しい', '古い', '高い', '安い', 'おいしい', 'まずい',
  'いい', '悪い', '暑い', '寒い', '暖かい', '涼しい', '広い', '狭い',
  '近い', '遠い', '速い', '遅い', '多い', '少ない', '長い', '短い',
  '難しい', '易しい', '忙しい', '楽しい', '面白い', 'つまらない',
  '白い', '黒い', '赤い', '青い', '甘い', '辛い', '若い',
  '明るい', '暗い', '重い', '軽い', '強い', '弱い', '丸い',
  '優しい', '厳しい', '美しい', '嬉しい', '悲しい',
  '冷たい', '温かい', '危ない', '痛い', '欲しい',

  // na-adjectives
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

const stripBr = s => (s || '').replace(/\[.*?\]/g, '').trim()

function isSameVocabWord(a, b) {
  return stripBr(a?.japanese || a?.kanji) === stripBr(b?.japanese || b?.kanji)
    && stripBr(a?.romaji) === stripBr(b?.romaji)
    && (a?.lesson == null || b?.lesson == null || a.lesson === b.lesson)
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

  const sameType = wrongPool.filter(w => getWordType(w) === correctType)
  const wrongOptions = pickUniqueDistractors([sameType, wrongPool], correctWord)

  return shuffle([correctWord, ...wrongOptions])
}

const scoreReactions = [
  { min: 95, emoji: '🎌🏆🎉', text: 'kanpeki!! flawless N5 performance!', textJp: '合格！かんぺき！' },
  { min: 90, emoji: '🎌✨', text: 'gokaku! you passed with flying colors!', textJp: '合格！すごい！' },
  { min: 70, emoji: '🌸', text: 'yoku dekimashita! almost there~', textJp: 'よくできました！' },
  { min: 50, emoji: '📖', text: 'mou sukoshi~ keep studying!', textJp: 'もう少し！' },
  { min: 0, emoji: '💪', text: 'ganbatte! review and try again~', textJp: 'がんばって！' },
]

const CORRECT_FEEDBACK = [
  '✨ correct! sugoi~',
  '✨ seikai! yoku dekita!',
  '✨ perfect! kanpeki!',
  '✨ that\'s right! ii ne~',
  '✨ hai, seikai! N5 power!',
]

function randomFeedback() {
  return CORRECT_FEEDBACK[Math.floor(Math.random() * CORRECT_FEEDBACK.length)]
}

const PHASE_SETUP = 'setup'
const PHASE_QUIZ = 'quiz'
const PHASE_RESULTS = 'results'

export default function N5Quiz() {
  const isTablet = useIsTablet()
  const { saveQuizResult } = useProgress()
  const { awardXP, calculateQuizXP } = useXP()
  const { recordMiss, recordHit } = useWordTracker()
  const { unlockedLessons } = useUnlockedLessons()
  const [phase, setPhase] = useState(PHASE_SETUP)

  // setup state
  const [questionCount, setQuestionCount] = useState(getStoredQuizSize)
  const [isReverse, setIsReverse] = useState(false)
  const [isTimed, setIsTimed] = useState(false)
  const [timeLimit, setTimeLimit] = useState(15)
  const [customTimerVal, setCustomTimerVal] = useState('')

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
  const [showCountdown, setShowCountdown] = useState(false)
  const timerRef = useRef(null)
  const answerLockedRef = useRef(false)
  const advanceLockedRef = useRef(false)
  const xpAwardedRef = useRef(false)

  // Build N5 word pool (deduplicated by japanese field — same word can appear in multiple lessons)
  const allPool = unlockedLessons.flatMap(l => l.vocabulary)
  const n5PoolRaw = allPool.filter(w =>
    jlptN5Words.has(w.japanese) || (w.kanji && jlptN5Words.has(w.kanji))
  )
  const n5Pool = [...new Map(n5PoolRaw.map(w => [w.japanese, w])).values()]

  const startQuiz = () => {
    if (n5Pool.length < 4) return
    xpAwardedRef.current = false

    const count = Math.min(questionCount, n5Pool.length)
    const selected = shuffle(n5Pool).slice(0, count)
    const qs = selected.map(word => ({
      word,
      options: generateOptions(word, allPool.length >= 4 ? allPool : n5Pool),
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
    answerLockedRef.current = false
    setShowCountdown(true)
    setPhase(PHASE_QUIZ)
  }

  const startMistakesQuiz = (repeatCount) => {
    if (mistakes.length === 0) return
    const mistakeWords = mistakes.map(m => m.word)
    let repeated = []
    for (let i = 0; i < repeatCount; i++) {
      repeated = repeated.concat(mistakeWords)
    }
    const qs = shuffle(repeated).map(word => ({
      word,
      options: generateOptions(word, allPool.length >= 4 ? allPool : mistakeWords),
    }))
    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setMistakes([])
    setCorrectWords([])
    setStreak(0)
    setBestStreak(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    answerLockedRef.current = false
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
        yourAnswer: option.russian === '__TIMEOUT__' ? '__TIMEOUT__' : (isReverse ? option.japanese : option.russian),
      }])
      setStreak(0)
      recordMiss(questions[currentIndex].word, 'n5-quiz')
    }

    const delay = correct ? 1000 : 4000

    timerRef.current = setTimeout(() => {
      if (advanceLockedRef.current) return
      advanceLockedRef.current = true

      if (currentIndex + 1 >= questions.length) {
        setPhase(PHASE_RESULTS)
      } else {
        setCurrentIndex(prev => prev + 1)
        setSelectedAnswer(null)
        setIsCorrect(null)
        answerLockedRef.current = false
      }
    }, delay)
  }, [selectedAnswer, questions, currentIndex, isReverse, recordMiss, recordHit])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const skipDelay = useCallback(() => {
    if (advanceLockedRef.current) return
    advanceLockedRef.current = true
    clearTimeout(timerRef.current)
    if (currentIndex + 1 >= questions.length) {
      setPhase(PHASE_RESULTS)
    } else {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
      answerLockedRef.current = false
    }
  }, [currentIndex, questions.length])

  // Enter/Space to skip delay after answering
  useEffect(() => {
    if (phase !== PHASE_QUIZ || selectedAnswer === null) return
    const handler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        skipDelay()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, selectedAnswer, skipDelay])

  // save score on results & award XP (only once per quiz session)
  useEffect(() => {
    if (phase === PHASE_RESULTS && questions.length > 0 && !xpAwardedRef.current) {
      xpAwardedRef.current = true
      saveQuizResult('vocab', {
        lessons: getTrackedLessons(questions, q => q.word?.lesson),
        score,
        total: questions.length,
      })
      const xp = calculateQuizXP(score, questions.length)
      if (xp > 0) awardXP(xp, 'N5 vocab quiz', score === questions.length && questions.length > 0)
    }
  }, [phase, score, questions, saveQuizResult, awardXP, calculateQuizXP])

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
        <SetupScreen
          questionCount={questionCount}
          setQuestionCount={setQuestionCount}
          isReverse={isReverse}
          setIsReverse={setIsReverse}
          isTimed={isTimed}
          setIsTimed={setIsTimed}
          timeLimit={timeLimit}
          setTimeLimit={setTimeLimit}
          customTimerVal={customTimerVal}
          setCustomTimerVal={setCustomTimerVal}
          n5Count={n5Pool.length}
          onStart={startQuiz}
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
          isReverse={isReverse}
          isTimed={isTimed}
          timeLimit={timeLimit}
          onSkip={skipDelay}
        />
      )}

      {phase === PHASE_RESULTS && (
        <ResultsScreen
          score={score}
          total={questions.length}
          percentage={percentage}
          reaction={reaction}
          mistakes={mistakes}
          correctWords={correctWords}
          xpEarned={calculateQuizXP(score, questions.length)}
          bestStreak={bestStreak}
          isReverse={isReverse}
          allQuestions={questions}
          isTablet={isTablet}
          onRetry={() => { setIsReverse(false); setPhase(PHASE_SETUP) }}
          onRetryMistakes={startMistakesQuiz}
        />
      )}
    </div>
  )
}

function SetupScreen({ questionCount, setQuestionCount, isReverse, setIsReverse, isTimed, setIsTimed, timeLimit, setTimeLimit, customTimerVal, setCustomTimerVal, n5Count, onStart }) {
  const canStart = n5Count >= 4

  return (
    <div className="animate-fadeInUp">
      <div style={s.header}>
        <div style={s.titleRow}>
          <h1 style={s.title}>JLPT N5 Vocab</h1>
          <span style={s.n5Badge}>N5</span>
        </div>
        <p style={s.subtitle}>certification prep quiz</p>
        <div style={s.n5InfoRow}>
          <span style={s.n5InfoIcon}>🎌</span>
          <span style={s.n5InfoText}>{n5Count} N5 words available from your lessons</span>
        </div>
      </div>

      {/* question count */}
      <div className="glass" style={s.setupCard}>
        <div style={s.setupLabel}>
          <span>🔢</span> number of questions
        </div>
        <div style={s.countRow}>
          {[10, 20, 30].map(n => (
            <button
              key={n}
              onClick={() => setQuestionCount(n)}
              className="btn-hover"
              style={{
                ...s.countBtn,
                ...(questionCount === n ? s.countBtnActive : {}),
              }}
            >
              {n}
            </button>
          ))}
        </div>
        {n5Count > 0 && n5Count < questionCount && (
          <div style={s.countNote}>
            only {n5Count} N5 words available — quiz will use {Math.min(questionCount, n5Count)}
          </div>
        )}
      </div>

      {/* quiz direction */}
      <div className="glass" style={s.setupCard}>
        <div style={s.setupLabel}>
          <span>🔄</span> quiz direction
        </div>
        <div style={s.directionRow}>
          <button
            onClick={() => setIsReverse(false)}
            style={{
              ...s.directionBtn,
              ...(isReverse ? {} : s.directionBtnActive),
            }}
          >
            <span style={s.directionIcon}>🇯🇵 → 🇷🇺</span>
            <span style={s.directionLabel}>japanese → russian</span>
          </button>
          <button
            onClick={() => setIsReverse(true)}
            style={{
              ...s.directionBtn,
              ...(isReverse ? s.directionBtnActive : {}),
            }}
          >
            <span style={s.directionIcon}>🇷🇺 → 🇯🇵</span>
            <span style={s.directionLabel}>russian → japanese</span>
          </button>
        </div>
      </div>

      {/* timer */}
      <div className="glass" style={s.setupCard}>
        <div style={s.setupLabel}>
          <span>⏱</span> timer per question
        </div>
        <div style={s.countRow}>
          {[{ label: 'выкл', val: 0 }, { label: '10с', val: 10 }, { label: '15с', val: 15 }, { label: '20с', val: 20 }, { label: '30с', val: 30 }].map(({ label, val }) => (
            <button
              key={label}
              onClick={() => { setIsTimed(val > 0); if (val > 0) setTimeLimit(val); setCustomTimerVal('') }}
              className="btn-hover"
              style={{
                ...s.countBtn,
                ...(!isTimed && val === 0 ? s.countBtnActive : (isTimed && timeLimit === val && !customTimerVal ? s.countBtnActive : {})),
              }}
            >
              {label}
            </button>
          ))}
          <input
            type="number"
            min={5}
            max={120}
            placeholder="своё" aria-label="custom time limit in seconds"
            value={customTimerVal}
            onChange={e => {
              setCustomTimerVal(e.target.value)
              const v = parseInt(e.target.value, 10)
              if (v >= 5) { setIsTimed(true); setTimeLimit(v) }
            }}
            style={{ ...s.countBtn, width: 58, textAlign: 'center', background: customTimerVal ? 'linear-gradient(135deg, #f472b6, #c084fc)' : 'rgba(255,255,255,0.25)', color: customTimerVal ? '#fff' : 'var(--text-light)', fontFamily: 'inherit', cursor: 'text' }}
          />
        </div>
      </div>

      {/* what is N5 info card */}
      <div className="glass" style={s.infoCard}>
        <div style={s.infoTitle}>what is JLPT N5?</div>
        <p style={s.infoText}>
          the easiest level of the Japanese Language Proficiency Test.
          covers basic vocabulary, grammar, and kanji (~800 words, ~100 kanji).
          this quiz focuses on N5 vocabulary from your studied lessons.
        </p>
      </div>

      {/* start */}
      <div style={s.startWrap}>
        <button
          className="btn btn-cute"
          onClick={onStart}
          disabled={!canStart}
          style={{ opacity: canStart ? 1 : 0.5, pointerEvents: canStart ? 'auto' : 'none', maxWidth: 260 }}
        >
          start N5 quiz 🎌
        </button>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <Link to="/quiz/vocab" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>vocab quiz ✨</Link>
          <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
        </div>
        {!canStart && (
          <p style={s.warnText}>need at least 4 N5 words — study more lessons first!</p>
        )}
      </div>
    </div>
  )
}

function QuizScreen({ question, currentIndex, totalQuestions, selectedAnswer, isCorrect, score, streak, onAnswer, isReverse, isTimed, timeLimit, onSkip }) {
  const isMobile = useIsMobile()
  const progress = ((currentIndex + 1) / totalQuestions) * 100
  const [feedbackMsg] = useState(() => randomFeedback())
  const [showHint, setShowHint] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const countdownRef = useRef(null)

  useEffect(() => { setShowHint(false) }, [currentIndex])

  useEffect(() => { if (isTimed) setTimeLeft(timeLimit) }, [currentIndex, isTimed, timeLimit])

  useEffect(() => {
    if (!isTimed || selectedAnswer !== null) { clearInterval(countdownRef.current); return }
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) { clearInterval(countdownRef.current); onAnswer({ russian: '__TIMEOUT__', japanese: '', romaji: '' }); return 0 }
        return Math.max(0, prev - 0.1)
      })
    }, 100)
    return () => clearInterval(countdownRef.current)
  }, [isTimed, selectedAnswer, currentIndex, onAnswer])

  const timerPct = isTimed ? (timeLeft / timeLimit) * 100 : 100
  const timerUrgent = isTimed && timeLeft <= 3

  // Keyboard shortcuts: press 1-4 to select answer
  useEffect(() => {
    const handler = (e) => {
      if (selectedAnswer !== null) return
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= 4 && question.options[num - 1]) {
        onAnswer(question.options[num - 1])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedAnswer, question, onAnswer])

  return (
    <div className="animate-fadeInUp">
      {/* progress */}
      <div style={s.progressWrap}>
        <div style={s.progressInfo}>
          <Link to="/" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', opacity: 0.5, textDecoration: 'none', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', flexShrink: 0 }} aria-label="exit quiz">✕</Link>
          <span style={s.progressText}>{currentIndex + 1} / {totalQuestions}</span>
          <span style={s.scoreText} aria-live="polite" aria-atomic="true">
            score: {score}
            {streak >= 3 && (
              <span style={s.streakBadge} className="animate-pop" key={streak}>
                {streak >= 7 ? '🔥🔥' : streak >= 5 ? '🔥' : '⚡'} {streak}x
              </span>
            )}
          </span>
        </div>
        <div style={s.progressBar}>
          <div style={{ ...s.progressFill, width: `${progress}%` }} />
        </div>
        {isTimed && (
          <div style={{ height: 4, background: 'rgba(192,132,252,0.15)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPct}%`, background: timerUrgent ? 'var(--incorrect-text)' : '#c084fc', borderRadius: 2, transition: 'width 0.1s linear, background 0.3s ease' }} />
          </div>
        )}
      </div>

      {/* N5 indicator */}
      <div style={s.quizN5Tag}>
        <span style={s.quizN5TagText}>JLPT N5</span>
      </div>

      {/* question card */}
      <div
        className="glass animate-pop"
        key={`question-card-${currentIndex}`}
        style={{
          ...s.questionCard,
          ...(!prefersReducedMotion && isCorrect === false ? { animation: 'shake 0.4s ease' } : {}),
        }}
      >
        {isReverse ? (
          <>
            <div style={s.questionLabel}>how do you say this in japanese? 🤔</div>
            <div style={s.questionRussian}>{question.word.russian}</div>
            {selectedAnswer === null && !showHint && (
              <button
                onClick={() => setShowHint(true)}
                style={{ marginTop: 8, fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', background: 'rgba(168,85,247,0.08)', border: 'none', borderRadius: 50, padding: '3px 12px', cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}
              >
                показать написание 💡
              </button>
            )}
            {showHint && (
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
            <div style={s.questionLabel}>what does this mean? 🤔</div>
            <div style={{ ...s.questionWord, fontSize: isMobile ? '1.8rem' : '2.4rem' }}>{((question.word.kanji || question.word.japanese) || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}</div>
            {question.word.kanji && (
              <div style={s.questionKanji}>{(question.word.japanese || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}</div>
            )}
            <div style={s.questionRomaji}>{(question.word.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}</div>
          </>
        )}
      </div>

      {/* options */}
      <div key={`question-options-${currentIndex}`} style={{ ...s.optionsGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
        {question.options.map((opt, i) => {
          let optStyle = { ...s.option }
          const isOptionCorrect = isSameVocabWord(opt, question.word)
          const isSelectedWrong = isSameVocabWord(selectedAnswer, opt) && !isCorrect

          if (selectedAnswer) {
            if (isOptionCorrect) {
              optStyle = { ...optStyle, ...s.optionCorrect }
            } else if (isSelectedWrong) {
              optStyle = { ...optStyle, ...s.optionIncorrect }
            } else {
              optStyle = { ...optStyle, opacity: 0.5 }
            }
          }

          return (
            <button
              key={`${currentIndex}-${i}`}
              onClick={() => onAnswer(opt)}
              className="glass-sm quiz-option"
              style={optStyle}
              disabled={selectedAnswer !== null}
            >
              <span style={s.optionNumber}>{i + 1}</span>
              {isReverse ? (
                <span>
                  {((opt.kanji || opt.japanese) || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}
                  <span style={s.optionRomaji}> {(opt.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}</span>
                </span>
              ) : (
                opt.russian
              )}
            </button>
          )
        })}
      </div>

      {/* keyboard hint */}
      {!selectedAnswer && (
        <div style={s.keyboardHint}>
          <span style={s.keyboardHintChip}>⌨ 1–4</span>
          <span style={s.keyboardHintText}>to answer</span>
        </div>
      )}

      {/* feedback */}
      {selectedAnswer && isCorrect && (
        <div style={{ ...s.feedback, color: 'var(--correct-text)' }} className="animate-pop">
          {feedbackMsg}
        </div>
      )}
      {selectedAnswer && !isCorrect && (
        <div className="glass animate-pop" style={s.explanationCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
            <div style={s.explanationWrong}>✗ wrong</div>
            {(() => {
              const t = getWordType(question.word)
              const label = { verb: 'глагол', 'na-adj': 'нa-прилаг.', 'i-adj': 'и-прилаг.', noun: 'сущ.' }[t]
              return label ? (
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', background: 'rgba(168,85,247,0.1)', padding: '2px 8px', borderRadius: 50 }}>
                  {label}
                </span>
              ) : null
            })()}
          </div>
          {isReverse ? (
            <>
              <div style={s.explanationAnswer}>{((question.word.kanji || question.word.japanese) || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}</div>
              {question.word.kanji && <div style={s.explanationJp}>{(question.word.japanese || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}</div>}
              <div style={s.explanationRomaji}>{(question.word.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}</div>
              <div style={s.explanationRu}>{question.word.russian}</div>
            </>
          ) : (
            <>
              <div style={s.explanationAnswer}>{question.word.russian}</div>
              <div style={s.explanationJp}>{((question.word.kanji || question.word.japanese) || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}</div>
              <div style={s.explanationRomaji}>{(question.word.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}</div>
            </>
          )}
          <div style={s.explanationYours}>
            your answer: {selectedAnswer.russian === '__TIMEOUT__' ? '⏱ время вышло' : isReverse ? selectedAnswer.japanese : selectedAnswer.russian}
          </div>
          {question.word.lesson && (
            <Link to={`/lessons/${question.word.lesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none', marginTop: 4, display: 'inline-block' }}>
              lesson {question.word.lesson} →
            </Link>
          )}
        </div>
      )}

      {selectedAnswer && (
        <div onClick={onSkip} role="button" tabIndex={0} aria-label="continue to next question" onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSkip() } }} style={{ ...s.enterHint, cursor: 'pointer' }}>
          нажми чтобы продолжить →
        </div>
      )}
    </div>
  )
}

function ResultsScreen({ score, total, percentage, reaction, mistakes, onRetry, onRetryMistakes, xpEarned, bestStreak, allQuestions, isTablet }) {
  const [repeatCount, setRepeatCount] = useState(1)
  const [showReview, setShowReview] = useState(false)

  return (
    <div className="animate-fadeInUp" style={s.resultsWrap}>
      <div className="glass" style={{ ...s.resultsCard, ...(isTablet ? s.resultsCardTablet : {}) }}>
        <Confetti trigger={score === total} />
        <div style={s.resultsEmoji}>{reaction.emoji}</div>
        <h2 style={s.resultsTitle}>{reaction.textJp}</h2>
        <p style={s.resultsText}>{reaction.text}</p>

        <div style={s.resultsN5Badge}>JLPT N5</div>

        <div style={s.scoreCircle} className={percentage >= 90 ? 'score-perfect' : 'score-circle'}>
          <div style={s.scoreCircleInner}>
            <span style={s.scoreBig}>{percentage}%</span>
            <span style={s.scoreDetail}>{score === total ? 'perfect!' : `${score}/${total}`}</span>
          </div>
        </div>

        {xpEarned > 0 && (
          <div style={s.xpBadge} className="animate-pop">
            <span style={s.xpIcon}>⚡</span>
            <span style={s.xpAmount}>+{xpEarned} XP</span>
          </div>
        )}

        {bestStreak >= 3 && (
          <div style={s.streakResult}>
            {bestStreak >= 7 ? '🔥🔥' : bestStreak >= 5 ? '🔥' : '⚡'} best streak: {bestStreak}x
          </div>
        )}

        {/* pass/fail indicator */}
        <div style={{
          ...s.passFailBadge,
          background: percentage >= 70
            ? 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.06))'
            : 'linear-gradient(135deg, rgba(244,63,94,0.12), rgba(244,63,94,0.06))',
          border: percentage >= 70
            ? '1.5px solid rgba(16,185,129,0.3)'
            : '1.5px solid rgba(244,63,94,0.3)',
          color: percentage >= 70 ? 'var(--correct-text)' : 'var(--incorrect-text)',
        }}>
          {percentage >= 70 ? '🎌 N5 pass level!' : '📖 keep studying~'}
        </div>

        {/* mistakes list */}
        {mistakes.length > 0 && (
          <div style={s.mistakesSection}>
            <div style={s.mistakesLabel}>mistakes ({mistakes.length})</div>
            <div style={s.mistakesList}>
              {mistakes.map((m, i) => (
                <div key={(m.word.japanese || '') + i} style={s.mistakeItem}>
                  <div style={s.mistakeWord}>{((m.word.kanji || m.word.japanese) || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}</div>
                  <div style={s.mistakeCorrect}>{m.word.russian}</div>
                  <div style={s.mistakeYours}>you: {m.yourAnswer === '__TIMEOUT__' ? '⏱ время вышло' : m.yourAnswer}</div>
                  {m.word.lesson && (
                    <Link to={`/lessons/${m.word.lesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none' }}>
                      lesson {m.word.lesson} →
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* retry mistakes */}
            <div style={s.retryMistakesWrap}>
              <div style={s.repeatRow}>
                <span style={s.repeatLabel}>repeat:</span>
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    onClick={() => setRepeatCount(n)}
                    style={{
                      ...s.repeatBtn,
                      ...(repeatCount === n ? s.repeatBtnActive : {}),
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
                work on mistakes ({mistakes.length * repeatCount} qs)
              </button>
            </div>
          </div>
        )}

        {/* review all questions */}
        {allQuestions && allQuestions.length > 0 && (
          <div style={s.reviewSection}>
            <button
              onClick={() => setShowReview(!showReview)}
              style={s.reviewToggle}
            >
              {showReview ? 'hide review ▲' : `review all ${allQuestions.length} questions ▼`}
            </button>
            {showReview && (
              <div style={s.reviewList}>
                {allQuestions.map((q, i) => {
                  const wasMistake = mistakes.some(m => isSameVocabWord(m.word, q.word))
                  return (
                    <div key={(q.word.japanese || '') + i} style={{
                      ...s.reviewItem,
                      borderLeftColor: wasMistake ? 'var(--incorrect-text)' : 'var(--correct-text)',
                    }}>
                      <div style={s.reviewNum}>{i + 1}</div>
                      <div style={s.reviewContent}>
                        <div style={s.reviewJp}>{((q.word.kanji || q.word.japanese) || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}</div>
                        <div style={s.reviewRomaji}>{(q.word.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}</div>
                        <div style={s.reviewRu}>{q.word.russian}</div>
                      </div>
                      <div style={s.reviewStatus}>
                        {wasMistake ? '✗' : '✓'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div style={s.resultsActions}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-cute" onClick={onRetry} style={{ flex: 1 }}>try again 🌸</button>
            <ShareResult
              quizName="JLPT N5 vocab"
              score={score}
              total={total}
              percentage={percentage}
              bestStreak={bestStreak || 0}
              xpEarned={xpEarned || 0}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/quiz/vocab" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>vocab quiz ✨</Link>
            <Link to="/mistakes" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>mistakes 📒</Link>
            <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  header: {
    textAlign: 'center',
    marginBottom: 20,
    padding: '8px 0',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 4,
  },
  title: {
    fontSize: '1.65rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    textTransform: 'lowercase',
    margin: 0,
  },
  n5Badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 12px',
    borderRadius: 8,
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: 'white',
    fontSize: '0.88rem',
    fontWeight: 900,
    letterSpacing: '1px',
    boxShadow: '0 2px 10px rgba(245, 158, 11, 0.4)',
  },
  subtitle: {
    fontSize: '1rem',
    color: 'var(--text-light)',
    fontWeight: 500,
    textTransform: 'lowercase',
    marginBottom: 10,
  },
  n5InfoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '6px 16px',
    borderRadius: 50,
    background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.06))',
    border: '1.5px solid rgba(251,191,36,0.25)',
    width: 'fit-content',
    margin: '0 auto',
  },
  n5InfoIcon: {
    fontSize: '0.9rem',
  },
  n5InfoText: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--amber-text)',
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
  countRow: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
  },
  countBtn: {
    flex: 1,
    maxWidth: 90,
    padding: '12px 8px',
    borderRadius: 14,
    border: '1.5px solid rgba(192,132,252,0.2)',
    background: 'var(--tint-light)',
    fontSize: '1.1rem',
    fontWeight: 900,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    minHeight: 44,
    textAlign: 'center',
  },
  countBtnActive: {
    background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(217,119,6,0.12))',
    border: '1.5px solid #f59e0b',
    color: 'var(--amber-text)',
    boxShadow: '0 2px 10px rgba(245,158,11,0.2)',
  },
  countNote: {
    marginTop: 8,
    fontSize: '0.72rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    textAlign: 'center',
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
    fontSize: '0.78rem',
    fontWeight: 600,
  },
  infoCard: {
    padding: 16,
    marginBottom: 14,
    background: 'linear-gradient(135deg, rgba(251,191,36,0.06), rgba(192,132,252,0.04))',
    border: '1.5px solid rgba(251,191,36,0.2)',
  },
  infoTitle: {
    fontSize: '0.82rem',
    fontWeight: 800,
    color: 'var(--amber-text)',
    marginBottom: 6,
    textTransform: 'lowercase',
  },
  infoText: {
    fontSize: '0.75rem',
    color: 'var(--text-light)',
    fontWeight: 500,
    lineHeight: 1.5,
    margin: 0,
  },
  startWrap: {
    textAlign: 'center',
    marginTop: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  warnText: {
    marginTop: 8,
    fontSize: '0.75rem',
    color: 'var(--incorrect-text)',
    fontWeight: 600,
  },
  // Quiz screen styles
  progressWrap: {
    marginTop: 28,
    marginBottom: 20,
  },
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
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
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    transition: 'width 0.4s ease',
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
  quizN5Tag: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quizN5TagText: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 16px',
    borderRadius: 50,
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    fontSize: '0.78rem',
    fontWeight: 900,
    color: 'white',
    letterSpacing: '1px',
    boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
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
  questionWord: {
    fontSize: '2.4rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    marginBottom: 4,
  },
  questionKanji: {
    fontSize: '0.85rem',
    color: 'var(--text-light)',
    fontWeight: 500,
    marginBottom: 4,
  },
  questionRomaji: {
    fontSize: '1rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    fontStyle: 'italic',
  },
  questionRussian: {
    fontSize: '1.6rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    lineHeight: 1.4,
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 16,
  },
  option: {
    padding: '18px 12px',
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
  },
  optionNumber: {
    position: 'absolute',
    top: 4,
    left: 6,
    fontSize: '0.72rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    opacity: 0.6,
    lineHeight: 1,
  },
  optionCorrect: {
    background: 'rgba(16, 185, 129, 0.15)',
    boxShadow: '0 0 0 2px var(--correct-text), 0 4px 12px rgba(16, 185, 129, 0.2)',
    color: 'var(--correct-text)',
  },
  optionIncorrect: {
    background: 'rgba(244, 63, 94, 0.12)',
    boxShadow: '0 0 0 2px var(--incorrect-text)',
    color: 'var(--incorrect-text)',
    ...(prefersReducedMotion ? {} : { animation: 'shake 0.4s ease' }),
  },
  optionRomaji: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-light)',
  },
  feedback: {
    textAlign: 'center',
    fontSize: '1rem',
    fontWeight: 800,
    padding: 12,
  },
  keyboardHint: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginBottom: 8, marginTop: -8,
  },
  keyboardHintChip: {
    padding: '2px 10px', borderRadius: 50,
    background: 'rgba(245,158,11,0.12)',
    border: '1px solid rgba(245,158,11,0.3)',
    fontSize: '0.72rem', fontWeight: 800, color: 'var(--amber-text)',
  },
  keyboardHintText: { fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 500 },
  enterHint: {
    textAlign: 'center', fontSize: '0.72rem', fontWeight: 600,
    color: 'var(--text-light)', marginTop: 4,
  },
  explanationCard: {
    padding: '14px 18px', textAlign: 'center', marginBottom: 8,
    background: 'linear-gradient(135deg, rgba(244,63,94,0.06), rgba(251,113,133,0.03))',
    border: '1.5px solid rgba(244,63,94,0.2)',
  },
  explanationWrong: {
    fontSize: '0.72rem', fontWeight: 800, color: 'var(--incorrect-text)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
  },
  explanationAnswer: {
    fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.2, marginBottom: 2,
  },
  explanationJp: {
    fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 2,
  },
  explanationRomaji: {
    fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 4,
  },
  explanationRu: {
    fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4,
  },
  explanationYours: {
    fontSize: '0.78rem', fontWeight: 600, color: 'var(--incorrect-text)', fontStyle: 'italic',
    opacity: 0.8,
  },
  // Results screen styles
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
    marginBottom: 12,
    textTransform: 'lowercase',
  },
  resultsN5Badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 16px',
    borderRadius: 50,
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: 'white',
    fontSize: '0.78rem',
    fontWeight: 900,
    letterSpacing: '0.5px',
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    boxShadow: '0 8px 24px rgba(245, 158, 11, 0.25)',
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
  streakResult: {
    textAlign: 'center',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--gold-text)',
    marginBottom: 16,
  },
  passFailBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 18px',
    borderRadius: 50,
    fontSize: '0.82rem',
    fontWeight: 800,
    marginBottom: 20,
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
    gap: 6,
  },
  mistakeItem: {
    background: 'rgba(244, 63, 94, 0.06)',
    border: '1px solid rgba(244, 63, 94, 0.15)',
    borderLeft: '3px solid var(--incorrect-text)',
    borderRadius: 10,
    padding: '8px 12px',
  },
  mistakeWord: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--text-main)',
  },
  mistakeCorrect: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--correct-text)',
  },
  mistakeYours: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'var(--incorrect-text)',
    fontStyle: 'italic',
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
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: 'white',
    border: '1.5px solid transparent',
  },
  resultsActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
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
    fontSize: '0.75rem',
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
    fontSize: '0.88rem',
    fontWeight: 800,
    color: 'var(--text-main)',
  },
  reviewRomaji: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-light)',
  },
  reviewRu: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  reviewStatus: {
    fontSize: '0.9rem',
    fontWeight: 900,
    flexShrink: 0,
  },
}
