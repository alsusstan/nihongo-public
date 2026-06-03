import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useXP } from '../hooks/useXP'
import { useProgress } from '../hooks/useProgress'
import { useIsTablet } from '../hooks/useIsMobile'

// ── helpers ────────────────────────────────────────────────────────────────

const isKanji = ch => {
  const c = ch.charCodeAt(0)
  return (c >= 0x4E00 && c <= 0x9FFF) || (c >= 0x3400 && c <= 0x4DBF)
}

function katakanaToHiragana(str) {
  return str.replace(/[\u30A1-\u30F6]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60))
}

function getReadings(entry) {
  const result = new Set()
  if (entry.on) {
    entry.on.split(/[・／/\s]+/).forEach(r => {
      const h = katakanaToHiragana(r.trim())
      if (/^[ぁ-ん]+$/.test(h) && h.length > 0) result.add(h)
    })
  }
  if (entry.kun) {
    entry.kun.split(/[・／/\s]+/).forEach(r => {
      const clean = r.trim().replace(/[（(][^）)]*[）)]/g, '').replace(/[。、]+$/, '')
      if (/^[ぁ-ん]+$/.test(clean) && clean.length > 0) result.add(clean)
    })
  }
  return [...result]
}

// Rendaku (連濁): voiced consonant alternation in compound readings
const RENDAKU = {
  'か':'が','き':'ぎ','く':'ぐ','け':'げ','こ':'ご',
  'さ':'ざ','し':'じ','す':'ず','せ':'ぜ','そ':'ぞ',
  'た':'だ','ち':'ぢ','つ':'づ','て':'で','と':'ど',
  'は':'ば','ひ':'び','ふ':'ぶ','へ':'べ','ほ':'ぼ',
  'ぱ':'ば','ぴ':'び','ぷ':'ぶ','ぺ':'べ','ぽ':'ぼ',
}
const HANDAKU = { 'は':'ぱ','ひ':'ぴ','ふ':'ぷ','へ':'ぺ','ほ':'ぽ' }

function readingVariants(reading) {
  const f = reading[0]; const rest = reading.slice(1)
  const v = [reading]
  if (RENDAKU[f]) v.push(RENDAKU[f] + rest)
  if (HANDAKU[f]) v.push(HANDAKU[f] + rest)
  return v
}

function trySplitWord(kanjiForm, kanaReading, kanjiMap) {
  const chars = [...kanjiForm]
  let remaining = kanaReading
  const parts = []
  for (const char of chars) {
    const entry = kanjiMap.get(char)
    if (!entry) return null
    const base = getReadings(entry)
    // Include rendaku/handaku variants, longest first
    const allVariants = [...new Set(base.flatMap(readingVariants))].sort((a, b) => b.length - a.length)
    const match = allVariants.find(r => remaining.startsWith(r))
    if (!match) return null
    // Store the canonical (un-voiced) reading for display
    const canonicalReading = base.find(r => readingVariants(r).includes(match)) || match
    parts.push({ char, reading: canonicalReading, matchedReading: match, entry })
    remaining = remaining.slice(match.length)
  }
  return remaining === '' ? parts : null
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateOptions(correctReading, entry, allPoolReadings, extras = []) {
  const options = new Set([correctReading])
  // Add caller-provided extras first (e.g., un-rendaku form)
  for (const r of extras) { if (options.size >= 4) break; options.add(r) }
  const sameKanji = shuffle(getReadings(entry).filter(r => r !== correctReading))
  for (const r of sameKanji) { if (options.size >= 4) break; options.add(r) }
  const byLength = shuffle(allPoolReadings.filter(r => !options.has(r) && Math.abs(r.length - correctReading.length) <= 1))
  for (const r of byLength) { if (options.size >= 4) break; options.add(r) }
  const rest = shuffle(allPoolReadings.filter(r => !options.has(r)))
  for (const r of rest) { if (options.size >= 4) break; options.add(r) }
  return shuffle([...options])
}

// Extra kanji not in BKB1 but needed for MNN vocabulary
const EXTRA_KANJI = {
  師: { kun: '', on: 'シ' },                     // 教師
  員: { kun: '', on: 'イン' },                   // 社員・会社員・銀行員
  銀: { kun: 'しろがね', on: 'ギン' },            // 銀行
  者: { kun: 'もの', on: 'シャ' },               // 医者・研究者
  歳: { kun: 'とし', on: 'サイ・セイ' },          // 何歳
  辞: { kun: 'やめる', on: 'ジ' },               // 辞書・電子辞書
  帳: { kun: '', on: 'チョウ' },                 // 手帳
  刺: { kun: 'さす', on: 'シ' },                 // 名刺
  鉛: { kun: 'なまり', on: 'エン' },             // 鉛筆
  筆: { kun: 'ふで', on: 'ヒツ' },               // 鉛筆
  堂: { kun: '', on: 'ドウ' },                   // 食堂
  事: { kun: 'こと', on: 'ジ・ズ' },             // 用事・事務所
  議: { kun: '', on: 'ギ' },                     // 会議・会議室
  階: { kun: '', on: 'カイ' },                   // 何階・階段
  段: { kun: '', on: 'ダン' },                   // 階段
  自: { kun: 'みずから', on: 'ジ' },             // 自転車・自動車・自動販売機
  郵: { kun: '', on: 'ユウ' },                   // 郵便局
  美: { kun: 'うつくしい', on: 'ビ' },           // 美術・美術館
  術: { kun: '', on: 'ジュツ' },                 // 美術
  試: { kun: 'こころみる', on: 'シ' },           // 試験・試合
  験: { kun: '', on: 'ケン' },                   // 試験
  映: { kun: 'うつる', on: 'エイ' },             // 映画・映画館
  画: { kun: '', on: 'ガ・カク' },               // 映画
  朝: { kun: 'あさ', on: 'チョウ' },             // 毎朝
  飛: { kun: 'とぶ', on: 'ヒ' },                // 飛行機
  幹: { kun: 'みき', on: 'カン' },               // 新幹線
  線: { kun: '', on: 'セン' },                   // 新幹線
  達: { kun: 'たち', on: 'タツ' },               // 友達
  族: { kun: '', on: 'ゾク' },                   // 家族
  去: { kun: 'さる', on: 'キョ・コ' },           // 去年
  誕: { kun: '', on: 'タン' },                   // 誕生日
  普: { kun: '', on: 'フ' },                     // 普通
  急: { kun: 'いそぐ', on: 'キュウ' },           // 急行
  野: { kun: 'の', on: 'ヤ' },                   // 野菜・野球
  菜: { kun: 'な', on: 'サイ' },                 // 野菜
  果: { kun: 'くだ・はたす', on: 'カ' },         // 果物
  紅: { kun: 'くれない・べに', on: 'コウ' },      // 紅茶
  乳: { kun: 'ちち', on: 'ニュウ' },             // 牛乳
  紙: { kun: 'かみ', on: 'シ' },                 // 手紙
  写: { kun: 'うつす', on: 'シャ' },             // 写真
  真: { kun: 'ま', on: 'シン' },                 // 写真
  賀: { kun: '', on: 'ガ' },                     // 年賀状
  状: { kun: '', on: 'ジョウ' },                 // 年賀状
  活: { kun: 'いきる', on: 'カツ' },             // 生活
  料: { kun: '', on: 'リョウ' },                 // 料理・資料
  旅: { kun: 'たび', on: 'リョ' },               // 旅行
  音: { kun: 'おと・ね', on: 'オン・イン' },       // 音楽
  楽: { kun: 'たのしい', on: 'ガク・ラク' },      // 音楽
  漢: { kun: '', on: 'カン' },                   // 漢字
  用: { kun: 'もちいる', on: 'ヨウ' },           // 用事
  約: { kun: '', on: 'ヤク' },                   // 約束
  束: { kun: 'たば', on: 'ソク' },               // 約束
  全: { kun: 'すべて', on: 'ゼン' },             // 全然・全部
  池: { kun: 'いけ', on: 'チ' },                 // 電池
  冷: { kun: 'つめたい', on: 'レイ' },           // 冷蔵庫
  蔵: { kun: 'くら', on: 'ゾウ' },               // 冷蔵庫
  庫: { kun: 'くら', on: 'コ' },                 // 冷蔵庫
  封: { kun: '', on: 'フウ' },                   // 封筒
  筒: { kun: 'つつ', on: 'トウ' },               // 封筒
  両: { kun: '', on: 'リョウ' },                 // 両親
  船: { kun: 'ふね・ふな', on: 'セン' },          // 船便
  季: { kun: '', on: 'キ' },                     // 季節
  節: { kun: 'ふし', on: 'セツ・セチ' },          // 季節
  天: { kun: 'あめ・あま', on: 'テン' },          // 天気・天才
  空: { kun: 'そら・から', on: 'クウ・コウ' },     // 空港
  港: { kun: 'みなと', on: 'コウ' },             // 空港
  世: { kun: 'よ', on: 'セイ・セ' },             // 世界
  界: { kun: '', on: 'カイ' },                   // 世界
  豚: { kun: 'ぶた', on: 'トン' },               // 豚肉
  末: { kun: 'すえ', on: 'マツ・バツ' },          // 週末
  定: { kun: 'さだめる', on: 'テイ・ジョウ' },    // 定食
  砂: { kun: 'すな', on: 'サ・シャ' },           // 砂糖
  糖: { kun: '', on: 'トウ' },                   // 砂糖
  資: { kun: '', on: 'シ' },                     // 資料
  刻: { kun: 'きざむ', on: 'コク' },             // 時刻表
  表: { kun: 'おもて', on: 'ヒョウ' },           // 時刻表
  製: { kun: '', on: 'セイ' },                   // 製品
  品: { kun: 'しな', on: 'ヒン' },               // 製品
  役: { kun: 'やく', on: 'ヤク・エキ' },          // 市役所
  歯: { kun: 'は', on: 'シ' },                   // 歯医者
  独: { kun: 'ひとり', on: 'ドク' },             // 独身
  神: { kun: 'かみ・かん', on: 'ジン・シン' },    // 神社
  証: { kun: 'あかし', on: 'ショウ' },           // 暗証番号
  額: { kun: 'ひたい', on: 'ガク' },             // 金額
  確: { kun: 'たしか', on: 'カク' },             // 確認
  認: { kun: 'みとめる', on: 'ニン' },           // 確認
  禁: { kun: '', on: 'キン' },                   // 禁煙
  煙: { kun: 'けむり', on: 'エン' },             // 禁煙
  現: { kun: 'あらわれる', on: 'ゲン' },         // 現金
  趣: { kun: 'おもむき', on: 'シュ' },           // 趣味
  味: { kun: 'あじ', on: 'ミ' },                 // 趣味・意味
  課: { kun: '', on: 'カ' },                     // 課長
  調: { kun: 'しらべる', on: 'チョウ' },         // 調子
  乾: { kun: 'かわく', on: 'カン' },             // 乾杯
  杯: { kun: 'さかずき', on: 'ハイ' },           // 乾杯
  当: { kun: 'あてる・あたる', on: 'トウ' },      // 本当
  意: { kun: '', on: 'イ' },                     // 意見・意味
  球: { kun: 'たま', on: 'キュウ' },             // 野球・地球
  最: { kun: 'もっとも', on: 'サイ' },           // 最近
  帽: { kun: '', on: 'ボウ' },                   // 帽子
  賃: { kun: '', on: 'チン' },                   // 家賃
  和: { kun: 'やわらぐ', on: 'ワ' },             // 和室
  布: { kun: 'ぬの', on: 'フ' },                 // 布団
  団: { kun: '', on: 'ダン・トン' },             // 布団
  故: { kun: 'ゆえ', on: 'コ' },                 // 故障
  障: { kun: 'さわる', on: 'ショウ' },           // 故障
  交: { kun: 'まじわる', on: 'コウ' },           // 交通・交差点
  差: { kun: 'さす', on: 'サ' },                 // 交差点
  点: { kun: 'てん', on: 'テン' },               // 交差点・時刻表
  放: { kun: 'はなす', on: 'ホウ' },             // 放送
  信: { kun: '', on: 'シン' },                   // 信号
  駐: { kun: '', on: 'チュウ' },                 // 駐車場
  建: { kun: 'たてる・たて', on: 'ケン・コン' }, // 建物
  準: { kun: '', on: 'ジュン' },                 // 準備
  備: { kun: 'そなえる', on: 'ビ' },             // 準備
  転: { kun: 'ころがる', on: 'テン' },           // 自転車・転勤
  機: { kun: 'はた', on: 'キ' },                 // 飛行機・自動販売機
  販: { kun: '', on: 'ハン' },                   // 自動販売機
  韓: { kun: '', on: 'カン' },                   // 韓国
  舞: { kun: 'まう・まい', on: 'ブ' },           // 歌舞伎
  伎: { kun: '', on: 'キ・ギ' },                 // 歌舞伎
}

function buildQuestions(allVocab, kanjiData) {
  const kanjiMap = new Map(kanjiData.map(k => [k.kanji, k]))
  // Supplement with extra kanji not in BKB1 but needed for MNN vocabulary
  Object.entries(EXTRA_KANJI).forEach(([char, data]) => {
    if (!kanjiMap.has(char)) {
      kanjiMap.set(char, { kanji: char, kun: data.kun, on: data.on, meaning: '', keywords: [] })
    }
  })
  // pool of all readings for distractors (BKB1 + EXTRA_KANJI)
  const extraReadings = Object.values(EXTRA_KANJI).flatMap(data => getReadings({ kun: data.kun, on: data.on }))
  const allReadings = [...new Set([...kanjiData.flatMap(k => getReadings(k)), ...extraReadings])]

  const questions = []
  for (const word of allVocab) {
    if (!word.kanji || !word.japanese) continue
    const kanjiForm = word.kanji
    // Must be all-kanji (no hiragana/katakana mixed in)
    if (![...kanjiForm].every(ch => isKanji(ch))) continue
    if (kanjiForm.length < 2) continue

    const parts = trySplitWord(kanjiForm, word.japanese, kanjiMap)
    if (!parts) continue

    const partsWithOptions = parts.map(p => {
      // Use the actual reading as it appears in the word (including rendaku)
      const correctReading = p.matchedReading
      // Add both the matched (rendaku) and canonical as options if different
      const extraOptions = p.matchedReading !== p.reading ? [p.reading] : []
      return {
        char: p.char,
        reading: correctReading,
        options: generateOptions(correctReading, p.entry, allReadings, extraOptions),
      }
    })

    questions.push({
      kanjiForm,
      kanaReading: word.japanese,
      russian: word.russian,
      lesson: word.lesson || word.lessonId,
      parts: partsWithOptions,
    })
  }

  return questions
}

// ── component ──────────────────────────────────────────────────────────────

const PHASES = { SETUP: 'setup', QUIZ: 'quiz', DONE: 'done' }

export default function FuriganaQuiz() {
  const isTablet = useIsTablet()
  const { awardXP } = useXP()
  const { saveQuizResult } = useProgress()
  const [searchParams] = useSearchParams()
  const xpAwardedRef = useRef(false)

  const [phase, setPhase] = useState(PHASES.SETUP)
  const [allQuestions, setAllQuestions] = useState([])
  const [questions, setQuestions] = useState([])
  const [wordIdx, setWordIdx] = useState(0)
  const [kanjiIdx, setKanjiIdx] = useState(0)
  const [answers, setAnswers] = useState([]) // per-kanji answers for current word
  const [wordStatus, setWordStatus] = useState(null) // null | 'correct' | 'wrong'
  const [score, setScore] = useState({ correct: 0, wrong: 0 })
  const [questionCount, setQuestionCount] = useState(10)
  const [lessonFilter, setLessonFilter] = useState(() => {
    const lessonId = Number(searchParams.get('lesson'))
    return Number.isFinite(lessonId) && lessonId > 0 ? lessonId : 0
  }) // 0 = all
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [mistakes, setMistakes] = useState([]) // words answered wrong
  const advanceTimerRef = useRef(null)

  // Load data lazily
  useEffect(() => {
    Promise.all([
      import('../data/lessons'),
      import('../data/kanji'),
    ])
      .then(([{ lessons }, { kanji }]) => {
        const allVocab = lessons.flatMap(l => l.vocabulary.map(w => ({ ...w, lessonId: l.id })))
        setAllQuestions(buildQuestions(allVocab, kanji))
        setLoadError(false)
      })
      .catch(() => {
        setAllQuestions([])
        setLoadError(true)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const filteredQuestions = useMemo(() => {
    if (lessonFilter === 0) return allQuestions
    return allQuestions.filter(q => q.lesson === lessonFilter)
  }, [allQuestions, lessonFilter])

  const availableLessons = useMemo(() => {
    const lessons = [...new Set(allQuestions.map(q => q.lesson).filter(Boolean))].sort((a, b) => a - b)
    return lessons
  }, [allQuestions])

  function startQuiz() {
    xpAwardedRef.current = false
    clearTimeout(advanceTimerRef.current)
    const qs = shuffle(filteredQuestions).slice(0, questionCount)
    setQuestions(qs)
    setWordIdx(0)
    setKanjiIdx(0)
    setAnswers([])
    setWordStatus(null)
    setScore({ correct: 0, wrong: 0 })
    setMistakes([])
    setPhase(PHASES.QUIZ)
  }

  const currentQuestion = questions[wordIdx]

  function handleOptionSelect(reading) {
    if (wordStatus !== null) return // already answered this word
    const part = currentQuestion.parts[kanjiIdx]
    const isCorrect = reading === part.reading
    const newAnswers = [...answers, { reading, correct: isCorrect }]
    setAnswers(newAnswers)

    const nextKanjiIdx = kanjiIdx + 1
    if (nextKanjiIdx < currentQuestion.parts.length) {
      // Move to next kanji
      setKanjiIdx(nextKanjiIdx)
    } else {
      // All kanji answered — check word
      const allCorrect = newAnswers.every(a => a.correct)
      const status = allCorrect ? 'correct' : 'wrong'
      setWordStatus(status)
      setScore(s => allCorrect ? { ...s, correct: s.correct + 1 } : { ...s, wrong: s.wrong + 1 })
      if (!allCorrect) {
        setMistakes(prev => [...prev, {
          kanjiForm: currentQuestion.kanjiForm,
          kanaReading: currentQuestion.kanaReading,
          russian: currentQuestion.russian,
          parts: currentQuestion.parts,
          userAnswers: newAnswers,
        }])
      }

      advanceTimerRef.current = setTimeout(() => {
        const nextWordIdx = wordIdx + 1
        if (nextWordIdx >= questions.length) {
          finishQuiz(newAnswers, allCorrect)
        } else {
          setWordIdx(nextWordIdx)
          setKanjiIdx(0)
          setAnswers([])
          setWordStatus(null)
        }
      }, 1600)
    }
  }

  function finishQuiz(lastAnswers, lastWordCorrect) {
    const finalCorrect = score.correct + (lastWordCorrect ? 1 : 0)
    const total = questions.length
    if (!xpAwardedRef.current) {
      xpAwardedRef.current = true
      const base = Math.round(finalCorrect * 8 + total * 2)
      const isPerfect = finalCorrect === total && total > 0
      awardXP(base, 'furigana-quiz', isPerfect)
      const lessons = lessonFilter > 0
        ? [lessonFilter]
        : [...new Set(questions.map(q => q.lesson).filter(Boolean))]
      saveQuizResult('kanji', { lessons, score: finalCorrect, total })
    }
    setPhase(PHASES.DONE)
  }

  useEffect(() => {
    return () => { if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current) }
  }, [])

  // Keyboard: press 1–4 to select option
  useEffect(() => {
    if (phase !== PHASES.QUIZ || wordStatus !== null || !currentQuestion) return
    const opts = currentQuestion.parts[kanjiIdx]?.options
    if (!opts) return
    const handler = (e) => {
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= 4 && opts[num - 1]) handleOptionSelect(opts[num - 1])
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, wordStatus, currentQuestion, kanjiIdx])

  // ── render ────────────────────────────────────────────────────────────────

  if (phase === PHASES.SETUP) {
    return (
      <div className="page">
        <div style={s.header}>
          <Link to="/quiz-hub" style={s.backLink}>← back</Link>
          <h1 style={s.title}>読み方クイズ</h1>
          <p style={s.subtitle}>select the reading for each kanji to build the word</p>
        </div>

        <div className="glass animate-fadeInUp" style={s.setupCard}>
          <div style={s.setupLabel}>🔢 how many words?</div>
          <div style={s.countRow}>
            {[10, 20, 30].map(n => (
              <button key={n} onClick={() => setQuestionCount(n)} style={{
                ...s.countBtn,
                ...(questionCount === n ? s.countBtnActive : {}),
              }}>{n}</button>
            ))}
          </div>
        </div>

        <div className="glass animate-fadeInUp" style={s.setupCard}>
          <div style={s.setupLabel}>📚 lesson filter</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => setLessonFilter(0)} style={{
              ...s.lessonBtn, ...(lessonFilter === 0 ? s.lessonBtnActive : {}),
            }}>all</button>
            {availableLessons.map(l => (
              <button key={l} onClick={() => setLessonFilter(l)} style={{
                ...s.lessonBtn, ...(lessonFilter === l ? s.lessonBtnActive : {}),
              }}>L{l}</button>
            ))}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', textAlign: 'center', marginTop: 8 }}>
            {loading ? 'loading...' : loadError ? 'failed to load questions' : `${filteredQuestions.length} words available`}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <div style={s.howItWorks}>
            <div style={{ fontWeight: 800, marginBottom: 6, fontSize: '0.82rem' }}>how it works</div>
            <div style={{ fontSize: '0.78rem', lineHeight: 1.6 }}>
              a kanji word appears — pick the reading for each character one by one.
              combine them to build the full reading! 🎉
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={startQuiz}
            disabled={loading || loadError || filteredQuestions.length < 3}
            style={{
              ...s.startBtn,
              opacity: (loading || loadError || filteredQuestions.length < 3) ? 0.5 : 1,
              cursor: (loading || loadError || filteredQuestions.length < 3) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'loading...' : loadError ? 'reload page ↻' : 'start quiz →'}
          </button>
        </div>
      </div>
    )
  }

  if (phase === PHASES.DONE) {
    const total = questions.length
    const finalScore = score.correct
    const pct = Math.round((finalScore / total) * 100)
    const isPerfect = finalScore === total
    return (
      <div className="page">
        <div style={s.header}>
          <h1 style={s.title}>読み方クイズ</h1>
        </div>
        <div className="glass animate-fadeInUp" style={{ ...s.resultCard, ...(isTablet ? s.resultCardTablet : {}), textAlign: 'center', padding: isTablet ? '42px 34px' : 32 }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>
            {isPerfect ? '🌸' : pct >= 70 ? '⭐' : '📖'}
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: 4 }}>
            {finalScore} / {total}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 16 }}>
            {isPerfect ? 'perfect! 完璧！' : pct >= 70 ? 'great work! 頑張った！' : 'keep practicing! 頑張って！'}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginBottom: 24 }}>
            {pct}% correct
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={startQuiz} style={s.startBtn}>play again</button>
            <button onClick={() => setPhase(PHASES.SETUP)} style={s.secondaryBtn}>settings</button>
          </div>
          <Link to="/quiz-hub" style={{ display: 'block', marginTop: 16, fontSize: '0.78rem', color: 'var(--text-light)' }}>
            ← back to quiz hub
          </Link>
        </div>

        {/* Mistakes review */}
        {mistakes.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-light)', opacity: 0.7, marginBottom: 10, textAlign: 'center' }}>
              разбор ошибок — {mistakes.length} слов
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mistakes.map((m, mi) => (
                <div key={mi} className="glass-sm" style={{ padding: '12px 16px', borderRadius: 14 }}>
                  {/* Kanji + readings */}
                  <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                    {m.parts.map((part, pi) => {
                      const ua = m.userAnswers[pi]
                      const correct = ua?.correct
                      return (
                        <div key={pi} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: correct ? 'var(--correct-text)' : 'var(--incorrect-text)' }}>
                            {part.reading}
                          </span>
                          {!correct && ua && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-light)', textDecoration: 'line-through' }}>
                              {ua.reading}
                            </span>
                          )}
                          <span style={{ fontSize: '1.6rem', fontWeight: 900, lineHeight: 1, color: correct ? 'var(--text-secondary)' : 'var(--incorrect-text)' }}>
                            {part.char}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'center' }}>
                    {m.kanaReading} · {m.russian}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: 90 }} />
          </div>
        )}
      </div>
    )
  }

  // ── quiz phase ────────────────────────────────────────────────────────────

  if (!currentQuestion) return null

  const progress = (wordIdx / questions.length) * 100
  const { parts } = currentQuestion
  const currentOptions = wordStatus === null ? parts[kanjiIdx]?.options : null

  return (
    <div className="page">
      {/* progress */}
      <div style={s.progressWrap}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            {wordIdx + 1} / {questions.length}
          </span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--correct-text)' }}>
            ✓ {score.correct}
          </span>
        </div>
        <div style={s.progressBar}>
          <div style={{ ...s.progressFill, width: `${progress}%` }} />
        </div>
      </div>

      {/* word card */}
      <div
        key={wordIdx}
        className="glass animate-pop"
        style={{
          ...s.wordCard,
          ...(wordStatus === 'correct' ? s.wordCardCorrect : {}),
          ...(wordStatus === 'wrong' ? s.wordCardWrong : {}),
        }}
      >
        {/* kanji display */}
        <div style={s.kanjiRow}>
          {parts.map((part, i) => {
            const isActive = i === kanjiIdx && wordStatus === null
            const isAnswered = i < kanjiIdx || wordStatus !== null
            const answerData = answers[i]
            return (
              <div key={i} style={s.kanjiSlot}>
                {/* reading box */}
                <div style={{
                  ...s.readingBox,
                  ...(isActive ? s.readingBoxActive : {}),
                  ...(isAnswered && answerData?.correct ? s.readingBoxCorrect : {}),
                  ...(isAnswered && answerData && !answerData.correct ? s.readingBoxWrong : {}),
                  ...(wordStatus === 'wrong' && !answerData?.correct && isAnswered ? s.readingBoxShowCorrect : {}),
                }}>
                  {answerData?.correct
                    ? answerData.reading
                    : answerData && !answerData.correct
                      ? (wordStatus !== null ? part.reading : answerData.reading)
                      : isActive ? '・' : ''
                  }
                </div>
                {/* kanji char */}
                <div style={{
                  ...s.kanjiChar,
                  ...(isActive ? s.kanjiCharActive : {}),
                  ...(isAnswered ? s.kanjiCharDone : {}),
                }}>
                  {part.char}
                </div>
              </div>
            )
          })}
        </div>

        {/* status line */}
        {wordStatus && (
          <div style={{
            textAlign: 'center', fontSize: '0.9rem', fontWeight: 800,
            color: wordStatus === 'correct' ? 'var(--correct-text)' : 'var(--incorrect-text)',
            marginTop: 4, marginBottom: -4,
          }}>
            {wordStatus === 'correct'
              ? `${currentQuestion.kanaReading} ✓`
              : `correct: ${currentQuestion.kanaReading}`
            }
          </div>
        )}

        {/* Russian meaning */}
        <div style={s.meaning}>{currentQuestion.russian}</div>
        <div style={s.lessonTag}>L{currentQuestion.lesson}</div>
      </div>

      {/* kanji position indicator */}
      {wordStatus === null && (
        <div style={s.kanjiIndicator}>
          reading for: <span style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--text-main)' }}>
            {parts[kanjiIdx]?.char}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginLeft: 6 }}>
            ({kanjiIdx + 1}/{parts.length})
          </span>
        </div>
      )}

      {/* options */}
      {currentOptions && (
        <div style={s.optionsGrid}>
          {currentOptions.map((opt, i) => (
            <button
              key={opt + i}
              onClick={() => handleOptionSelect(opt)}
              style={s.optionBtn}
              className="glass-sm quiz-option"
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* keyboard hint */}
      {wordStatus === null && (
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 50, background: 'rgba(168,85,247,0.08)', color: 'var(--text-light)', fontSize: '0.72rem', fontWeight: 700 }}>
            ⌨ 1–4
          </span>
        </div>
      )}

      {/* skip / quit */}
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <button
          onClick={() => {
            if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
            setPhase(PHASES.DONE)
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--text-light)', padding: '8px 12px', fontFamily: 'inherit' }}
        >
          finish early
        </button>
      </div>
    </div>
  )
}

// ── styles ────────────────────────────────────────────────────────────────

const s = {
  header: { textAlign: 'center', marginBottom: 24, paddingTop: 8 },
  backLink: { display: 'inline-block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-light)', textDecoration: 'none', marginBottom: 12 },
  title: { fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 },
  subtitle: { fontSize: '0.82rem', color: 'var(--text-light)', fontWeight: 600, marginTop: 4 },

  setupCard: { padding: 20, marginBottom: 14 },
  setupLabel: { fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 12, textTransform: 'lowercase' },

  countRow: { display: 'flex', gap: 10, justifyContent: 'center' },
  countBtn: {
    flex: 1, maxWidth: 90, padding: '12px 8px', borderRadius: 14,
    border: '1.5px solid rgba(192,132,252,0.2)', background: 'var(--tint-light)',
    fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-secondary)',
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', minHeight: 44,
  },
  countBtnActive: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.18), rgba(192,132,252,0.12))',
    border: '1.5px solid #f472b6', color: '#f472b6',
    boxShadow: '0 2px 10px rgba(244,114,182,0.2)',
  },

  lessonBtn: {
    padding: '6px 12px', borderRadius: 14, border: '1.5px solid rgba(192,132,252,0.2)',
    background: 'var(--tint-light)', fontSize: '0.78rem', fontWeight: 700,
    color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.15s', minHeight: 44, minWidth: 48,
  },
  lessonBtnActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: '#fff',
    border: '1.5px solid transparent',
  },

  howItWorks: {
    display: 'inline-block', padding: '12px 20px', borderRadius: 14,
    background: 'rgba(192,132,252,0.06)', border: '1px solid rgba(192,132,252,0.15)',
    color: 'var(--text-light)', textAlign: 'left', maxWidth: 340,
  },

  startBtn: {
    padding: '14px 40px', borderRadius: 50,
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    border: 'none', color: '#fff', fontSize: '1rem', fontWeight: 800,
    cursor: 'pointer', fontFamily: 'inherit', minHeight: 48,
    boxShadow: '0 4px 20px rgba(244,114,182,0.35)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  secondaryBtn: {
    padding: '12px 24px', borderRadius: 50,
    background: 'rgba(192,132,252,0.12)', border: '1.5px solid rgba(192,132,252,0.25)',
    color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit', minHeight: 44,
  },

  progressWrap: { marginBottom: 16 },
  progressBar: { height: 6, borderRadius: 3, background: 'var(--bar-track)', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #f472b6, #c084fc)', borderRadius: 3, transition: 'width 0.4s ease' },

  wordCard: {
    padding: '24px 20px', marginBottom: 16, textAlign: 'center',
    transition: 'all 0.3s',
  },
  wordCardCorrect: {
    background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
  },
  wordCardWrong: {
    background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
  },

  kanjiRow: {
    display: 'flex', justifyContent: 'center', gap: 20,
    marginBottom: 12, flexWrap: 'wrap',
  },
  kanjiSlot: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
  },
  readingBox: {
    minWidth: 52, minHeight: 32, padding: '4px 8px',
    borderRadius: 8, border: '2px dashed rgba(192,132,252,0.25)',
    background: 'rgba(192,132,252,0.04)',
    fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-light)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s',
  },
  readingBoxActive: {
    border: '2px solid rgba(244,114,182,0.6)',
    background: 'rgba(244,114,182,0.08)',
    color: 'var(--text-secondary)',
    boxShadow: '0 0 8px rgba(244,114,182,0.2)',
  },
  readingBoxCorrect: {
    border: '2px solid rgba(16,185,129,0.5)',
    background: 'rgba(16,185,129,0.1)',
    color: 'var(--correct-text)',
  },
  readingBoxWrong: {
    border: '2px solid rgba(244,63,94,0.5)',
    background: 'rgba(244,63,94,0.1)',
    color: 'var(--incorrect-text)',
  },
  readingBoxShowCorrect: {
    border: '2px solid rgba(16,185,129,0.5)',
    background: 'rgba(16,185,129,0.08)',
    color: 'var(--correct-text)',
  },

  kanjiChar: {
    fontSize: '2.8rem', fontWeight: 900, lineHeight: 1,
    color: 'var(--text-light)', transition: 'all 0.2s',
  },
  kanjiCharActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(0 2px 6px rgba(244,114,182,0.3))',
  },
  kanjiCharDone: {
    color: 'var(--text-secondary)',
  },

  meaning: {
    fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)',
    marginTop: 10,
  },
  lessonTag: {
    display: 'inline-block', marginTop: 6,
    fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)',
    background: 'rgba(168,85,247,0.1)', padding: '2px 8px', borderRadius: 50,
  },

  kanjiIndicator: {
    textAlign: 'center', marginBottom: 14,
    fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)',
  },

  optionsGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: 10, marginBottom: 8,
  },
  optionBtn: {
    padding: '18px 14px', fontSize: '1.1rem', fontWeight: 700,
    borderRadius: 16, border: 'none', cursor: 'pointer',
    background: 'transparent', color: 'var(--text-main)',
    fontFamily: 'inherit', transition: 'all 0.15s', minHeight: 62,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    letterSpacing: '0.02em',
  },

  resultCard: { maxWidth: 420, margin: '0 auto' },
  resultCardTablet: { maxWidth: 560 },
}
