import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { lessons } from '../data/lessons'
import { supplementaryVocab } from '../data/supplementary'
import { getDialog, SPEAKER_JP } from '../data/dialogs'
import { kanaToRomaji } from '../utils/kanaToRomaji'
import { useProgress } from '../hooks/useProgress'
import { loadDifficultWords, saveDifficultWords } from '../hooks/useWordTracker'
import { useIsMobile, useIsTablet } from '../hooks/useIsMobile'
import { useUnlockedLessons } from '../hooks/useUnlockedLessons'
import { copyTextToClipboard } from '../utils/clipboard'

// Lesson page images are local-only so textbook scans are not published in production builds.
const localLessonImagesEnabled = import.meta.env.DEV

function getLocalLessonImage(kind, lessonId) {
  if (!localLessonImagesEnabled) return null
  return `/src/assets/lessons/${kind}/lesson_${String(lessonId).padStart(2, '0')}.jpg`
}

function getSupplementaryImage(imageName) {
  if (!localLessonImagesEnabled || !imageName) return null
  const fileName = imageName.split('/').pop()
  return `/src/assets/lessons/supplementary/${fileName}`
}

const tabs = [
  { key: 'words', label: 'слова', labelJp: 'たんご', icon: '📝' },
  { key: 'grammar', label: 'грамм.', labelJp: 'ぶんぽう', icon: '📖' },
  { key: 'dialogue', label: 'диалог', labelJp: 'かいわ', icon: '💬' },
  { key: 'reference', label: 'справка', labelJp: 'さんこう', icon: '📋' },
]

export default function LessonDetail() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('words')
  const { markLessonViewed, toggleBookmark, getBookmarkedLesson } = useProgress()
  const { isUnlocked } = useUnlockedLessons()

  const lessonId = parseInt(id, 10)
  const isBookmarked = getBookmarkedLesson() === lessonId
  const lesson = lessons.find(l => l.id === lessonId)
  const dialog = getDialog(lessonId)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (lesson) markLessonViewed(lessonId)
  }, [lessonId, lesson, markLessonViewed])

  if (!lesson) {
    return (
      <div className="page" style={s.notFound}>
        <div className="glass" style={s.notFoundCard}>
          <span style={{ fontSize: '3rem' }}>🐱</span>
          <h2 style={s.notFoundTitle}>nyan~ lesson not found</h2>
          <p style={s.notFoundText}>this lesson doesn't exist yet... gomen ne!</p>
          <Link to="/lessons" className="btn btn-primary" style={{ marginTop: 12 }}>
            back to lessons
          </Link>
        </div>
      </div>
    )
  }

  const prevLesson = lessons.find(l => l.id === lessonId - 1)
  const nextLesson = lessons.find(l => l.id === lessonId + 1)

  return (
    <div className="page">
      <div style={s.header} className="animate-fadeInUp">
        <Link to="/lessons" style={s.backLink}>← все уроки</Link>
        <div style={s.badgeRow}>
          <div style={s.lessonBadge}>
            <span style={s.lessonNum}>урок {lesson.id}</span>
          </div>
          <Link
            to={`/quiz/vocab?lesson=${lesson.id}`}
            style={s.quizStartBtn}
            title="начать квиз по этому уроку" aria-label="начать квиз по этому уроку"
          >
            quiz ▶
          </Link>
          <Link
            to={`/review?lesson=${lesson.id}`}
            style={{ ...s.quizStartBtn, background: 'rgba(168,85,247,0.12)', color: 'var(--text-secondary)' }}
            title="флеш-карточки по этому уроку" aria-label="флеш-карточки по этому уроку"
          >
            cards 🃏
          </Link>
          <Link
            to={`/game/matching?lesson=${lesson.id}`}
            style={{ ...s.quizStartBtn, background: 'rgba(168,85,247,0.12)', color: 'var(--text-secondary)' }}
            title="игра на совпадение" aria-label="игра на совпадение"
          >
            match 🎴
          </Link>
          <Link
            to={`/game/typing?lesson=${lesson.id}`}
            style={{ ...s.quizStartBtn, background: 'rgba(168,85,247,0.12)', color: 'var(--text-secondary)' }}
            title="тренировка ввода" aria-label="тренировка ввода"
          >
            type ⌨
          </Link>
          <button
            onClick={() => toggleBookmark(lessonId)}
            style={{ ...s.bookmarkBtn, ...(isBookmarked ? s.bookmarkBtnActive : {}) }}
            title={isBookmarked ? 'убрать закладку' : 'добавить закладку'} aria-label={isBookmarked ? 'убрать закладку' : 'добавить закладку'}
          >
            {isBookmarked ? '⭐' : '☆'}
          </button>
        </div>
        <h1 style={s.titleJpBig}>{lesson.titleJp}</h1>
        <p style={s.titleRu}>{lesson.title}</p>
        <div style={s.metaRow}>
          <div style={s.metaPill}>
            <span style={s.metaPillIcon}>📝</span>
            <span style={s.metaPillText}>{lesson.vocabulary.length} слов</span>
          </div>
          <div style={s.metaPillDot} />
          <div style={s.metaPill}>
            <span style={s.metaPillIcon}>📖</span>
            <span style={s.metaPillText}>{lesson.grammar.length} конструкций</span>
          </div>
        </div>
      </div>

      <div style={{ ...s.tabRow, ...(isMobile ? s.tabRowMobile : {}) }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{ ...s.tab, ...(isMobile ? s.tabMobile : {}), ...(activeTab === tab.key ? s.tabActive : {}) }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            <span style={s.tabJp}>{tab.labelJp}</span>
          </button>
        ))}
      </div>

      <div className="animate-fadeInUp" style={{ animationDuration: '0.3s' }}>
        {activeTab === 'words' && (
          <>
            <VocabSection vocabulary={lesson.vocabulary} lessonId={lessonId} />
            {supplementaryVocab[lessonId] && (
              <SupplementarySection data={supplementaryVocab[lessonId]} />
            )}
          </>
        )}
        {activeTab === 'grammar' && (
          <GrammarList grammar={lesson.grammar} lessonId={lessonId} />
        )}
        {activeTab === 'dialogue' && (
          <>
            <DialogueSection dialog={dialog} vocabulary={lesson.vocabulary} />
            {getLocalLessonImage('dialog', lessonId) && (
              <div style={{ marginTop: 20 }}>
                <div style={s.imgSectionLabel}>📄 страница учебника — диалог</div>
                <img
                  src={getLocalLessonImage('dialog', lessonId)}
                  alt={`Диалог урок ${lessonId}`}
                  style={s.lessonPageImg}
                  loading="lazy"
                />
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to={`/reading?lesson=${lessonId}`} className="btn btn-cute" style={{ fontSize: '0.9rem' }}>
                reading practice 📖
              </Link>
              {nextLesson && isUnlocked(nextLesson.id) && (
                <Link to={`/lessons/${nextLesson.id}`} className="btn btn-secondary" style={{ fontSize: '0.9rem' }}>
                  следующий урок {nextLesson.id} →
                </Link>
              )}
            </div>
          </>
        )}
        {activeTab === 'reference' && (
          <div style={{ paddingBottom: 16 }}>
            {getLocalLessonImage('ref', lessonId) ? (
              <>
                <div style={s.imgSectionLabel}>📋 справочная информация</div>
                <img
                  src={getLocalLessonImage('ref', lessonId)}
                  alt={`Справочная информация урок ${lessonId}`}
                  style={s.lessonPageImg}
                  loading="lazy"
                />
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)', fontSize: '0.9rem' }}>
                {localLessonImagesEnabled ? 'справочная информация не доступна для этого урока' : 'страницы учебника доступны только в локальной версии'}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={s.navRow}>
        {prevLesson ? (
          <Link to={`/lessons/${prevLesson.id}`} style={s.navBtnPrev}>
            <span style={s.navArrow}>←</span>
            <div style={s.navBtnInner}>
              <span style={s.navBtnLabel}>предыдущий</span>
              <span style={s.navBtnNum}>урок {prevLesson.id}</span>
            </div>
          </Link>
        ) : <div />}
        {nextLesson ? (
          isUnlocked(nextLesson.id) ? (
            <Link to={`/lessons/${nextLesson.id}`} style={s.navBtnNext}>
              <div style={s.navBtnInner}>
                <span style={s.navBtnLabel}>следующий</span>
                <span style={s.navBtnNum}>урок {nextLesson.id}</span>
              </div>
              <span style={s.navArrow}>→</span>
            </Link>
          ) : (
            <div style={{ ...s.navBtnNext, opacity: 0.45, cursor: 'default' }}>
              <div style={s.navBtnInner}>
                <span style={s.navBtnLabel}>следующий</span>
                <span style={s.navBtnNum}>урок {nextLesson.id} 🔒</span>
              </div>
              <span style={s.navArrow}>→</span>
            </div>
          )
        ) : <div />}
      </div>
    </div>
  )
}

/* ─── VOCAB SECTION ─────────────────────────────────────────── */

const stripBrackets = s => s ? s.replace(/\[.*?\]/g, '').trim() : s

function parseValidDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const TYPE_ORDER = { 'гл. I': 0, 'гл. II': 1, 'гл. III': 2, 'i-adj': 3, 'na-adj': 4, 'noun': 5 }
function getWordType(w) {
  if (w.type) return w.type
  const jp = w.japanese || ''
  if (jp.includes('[な]')) return 'na-adj'
  const canonical = w.kanji || jp
  const stripped = canonical.replace(/[。．！？…（）[\]～〜]/g, '')
  if (/い$/.test(stripped) && !canonical.includes('。')) return 'i-adj'
  return 'noun'
}

function VocabSection({ vocabulary, lessonId }) {
  const isMobile = useIsMobile()
  const [filter, setFilter] = useState('')
  const [viewMode, setViewMode] = useState('table')
  const [sortMode, setSortMode] = useState('order')
  const kanjiOnly = false
  const [showPractice, setShowPractice] = useState(false)

  const [showRomaji, setShowRomaji] = useState(true)
  const [showKanji, setShowKanji] = useState(false)
  const kanjiCount = vocabulary.filter(w => !!w.kanji).length
  const hasVerbs = vocabulary.some(w => w.type && w.type.startsWith('гл.'))

  const [difficultRevision, setDifficultRevision] = useState(0)
  const difficultSet = useMemo(() => {
    const words = loadDifficultWords()
    // Only include entries matching this lesson (or legacy entries with no lesson).
    // Normalize brackets so FlashCards-stripped entries match LessonDetail-raw entries.
    return new Set(words
      .filter(w => w.lesson == null || w.lesson === lessonId)
      .map(w => `${stripBrackets(w.japanese)}|${stripBrackets(w.romaji)}`)
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficultRevision, lessonId])

  const toggleDifficult = useCallback((word) => {
    const current = loadDifficultWords()
    const key = `${stripBrackets(word.japanese)}|${stripBrackets(word.romaji)}`
    const idx = current.findIndex(w =>
      `${stripBrackets(w.japanese)}|${stripBrackets(w.romaji)}` === key &&
      (w.lesson == null || w.lesson === lessonId)
    )
    if (idx >= 0) {
      current.splice(idx, 1)
    } else {
      current.push({
        japanese: word.japanese, kanji: word.kanji, romaji: word.romaji, russian: word.russian,
        lesson: lessonId, source: 'lesson', missCount: 1, hitCount: 0,
        addedAt: new Date().toISOString(), lastMissed: new Date().toISOString(),
      })
    }
    saveDifficultWords(current)
    setDifficultRevision(r => r + 1)
  }, [lessonId])
  const filtered = vocabulary.filter(w => {
    if (kanjiOnly && !w.kanji) return false
    if (!filter) return true
    return (
      w.japanese.includes(filter) ||
      w.romaji.toLowerCase().includes(filter.toLowerCase()) ||
      w.russian.toLowerCase().includes(filter.toLowerCase()) ||
      (w.kanji && w.kanji.includes(filter))
    )
  })

  const sorted = sortMode === 'alpha'
    ? [...filtered].sort((a, b) => (a.kanji || a.japanese).localeCompare(b.kanji || b.japanese, 'ja'))
    : sortMode === 'type'
    ? [...filtered].sort((a, b) => (TYPE_ORDER[getWordType(a)] ?? 9) - (TYPE_ORDER[getWordType(b)] ?? 9))
    : filtered

  return (
    <div>
      <div style={sh.wrap}>
        <div style={sh.left}>
          <div style={sh.accent} />
          <span style={sh.title}>словарь</span>
          <span style={sh.titleJp}>たんご</span>
        </div>
        <div style={{ ...sh.right, gap: 5 }}>
          <Link to={`/quiz/vocab?lesson=${lessonId}`} style={{ ...gr.practiceBtn, background: 'rgba(168,85,247,0.1)', color: 'var(--text-light)', boxShadow: 'none', minHeight: 44, display: 'inline-flex', alignItems: 'center', padding: '4px 10px' }} title="квиз по словам урока">
            quiz →
          </Link>
          {hasVerbs && (
            <Link to={`/quiz/te-form?lesson=${lessonId}`} style={{ ...gr.practiceBtn, background: 'rgba(168,85,247,0.1)', color: 'var(--text-light)', boxShadow: 'none', minHeight: 44, display: 'inline-flex', alignItems: 'center', padding: '4px 10px' }} title="квиз на て-форму глаголов" aria-label="квиз на て-форму глаголов">
              て →
            </Link>
          )}
          <button onClick={() => setShowPractice(v => !v)} style={{
            padding: '4px 10px', borderRadius: 50,
            border: showPractice ? 'none' : '1.5px solid rgba(168,85,247,0.4)',
            background: showPractice ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(168,85,247,0.08)',
            color: showPractice ? 'white' : 'var(--text-light)',
            fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', flexShrink: 0, minHeight: 44, minWidth: 44,
          }} title={showPractice ? 'вернуться к таблице слов' : 'режим карточек: закрой ромадзи и вспомни'} aria-label={showPractice ? 'вернуться к таблице слов' : 'режим карточек: закрой ромадзи и вспомни'}>{showPractice ? '📋' : '✍️'}</button>
          {!showPractice && (
            <>
              <button onClick={() => setShowRomaji(v => !v)} style={{
                padding: '4px 10px', borderRadius: 50,
                border: showRomaji ? 'none' : '1.5px solid rgba(168,85,247,0.4)',
                background: showRomaji ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(168,85,247,0.08)',
                color: showRomaji ? 'white' : 'var(--text-light)',
                fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', flexShrink: 0, minHeight: 44,
              }} title={showRomaji ? 'скрыть ромадзи (для самопроверки)' : 'показать ромадзи'} aria-label={showRomaji ? 'скрыть ромадзи (для самопроверки)' : 'показать ромадзи'}>{showRomaji ? 'ро 👁' : 'ро 🙈'}</button>
              <div style={sh.viewToggle}>
                <button
                  onClick={() => setViewMode('cards')}
                  style={{ ...sh.viewBtn, ...(viewMode === 'cards' ? sh.viewBtnActive : {}) }}
                  title="вид: карточки" aria-label="вид: карточки"
                >⊞</button>
                <button
                  onClick={() => setViewMode('table')}
                  style={{ ...sh.viewBtn, ...(viewMode === 'table' ? sh.viewBtnActive : {}) }}
                  title="вид: таблица" aria-label="вид: таблица"
                >☰</button>
              </div>
            </>
          )}
        </div>
      </div>

      {showPractice ? (
        <PracticeMode vocabulary={vocabulary} />
      ) : (
        <>
          <div style={vs.filterWrap}>
            <div style={vs.filterInner}>
              <span style={vs.filterIcon}>🔍</span>
              <input
                type="text"
                placeholder="поиск слов..."
                aria-label="поиск слов"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
                style={vs.filterInput}
              />
              {filter && <span style={vs.filterCount}>{filtered.length}/{vocabulary.length}</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
              {/* sort row — 3 equal buttons filling full width */}
              <div style={{ display: 'flex', gap: 6 }}>
                {[{ key: 'order', label: 'по порядку', title: 'сортировать в порядке учебника' }, { key: 'alpha', label: 'А→Я', title: 'сортировать по алфавиту' }, { key: 'type', label: 'по типу', title: 'сортировать: глаголы, прилагательные, существительные' }].map(({ key, label, title }) => (
                  <button key={key} onClick={() => setSortMode(key)} title={title} aria-label={title} style={{
                    flex: 1, padding: '4px 8px', borderRadius: 50,
                    border: sortMode === key ? 'none' : '1.5px solid rgba(168,85,247,0.4)',
                    background: sortMode === key ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(168,85,247,0.1)',
                    color: sortMode === key ? 'white' : 'var(--text-secondary)',
                    fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', minHeight: 44,
                  }}>{label}</button>
                ))}
              </div>
              {/* kana/kanji toggle — mobile only (desktop shows both columns always) */}
              {kanjiCount > 0 && isMobile && (
                <div style={{ display: 'flex', gap: 0 }}>
                  <button onClick={() => setShowKanji(false)} title="показать слова в кане" aria-label="показать слова в кане" style={{ ...vs.mobileToggleBtn, ...(!showKanji ? vs.mobileToggleBtnActive : {}), borderRadius: '10px 0 0 10px', padding: '4px 16px', fontSize: '0.72rem' }}>かな</button>
                  <button onClick={() => setShowKanji(true)} title="показать слова в иероглифах" aria-label="показать слова в иероглифах" style={{ ...vs.mobileToggleBtn, ...(showKanji ? vs.mobileToggleBtnActive : {}), borderRadius: '0 10px 10px 0', padding: '4px 16px', fontSize: '0.72rem' }}>漢字</button>
                </div>
              )}
            </div>
          </div>

          {viewMode === 'cards' ? (
            <div style={vs.cardsGrid}>
              {sorted.map((word, i) => {
                const isExpr = word.japanese.endsWith('。')
                const prevIsExpr = i > 0 && sorted[i - 1].japanese.endsWith('。')
                const showSep = sortMode === 'order' && isExpr && !prevIsExpr
                return (
                  <React.Fragment key={word.japanese || i}>
                    {showSep && (
                      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 4px' }}>
                        <div style={{ flex: 1, height: 1, background: 'rgba(192,132,252,0.2)' }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', letterSpacing: '0.06em' }}>выражения</span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(192,132,252,0.2)' }} />
                      </div>
                    )}
                    <VocabCard word={word} isMobile={isMobile} showRomaji={showRomaji} showKanji={showKanji} isDifficult={difficultSet.has(`${stripBrackets(word.japanese)}|${stripBrackets(word.romaji)}`)} onToggleDifficult={() => toggleDifficult(word)} />
                  </React.Fragment>
                )
              })}
              {sorted.length === 0 && (
                <div style={vs.noResults}>ничего не найдено 🔍</div>
              )}
            </div>
          ) : (
            <div className="glass" style={vs.tableWrap}>
              <VocabTable vocabulary={sorted} sortMode={sortMode} isMobile={isMobile} showRomaji={showRomaji} showKanji={showKanji} />
              {sorted.length === 0 && (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600 }}>
                  ничего не найдено 🔍
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

const verbGroupMap = { 'гл. I': 'I', 'гл. II': 'II', 'гл. III': 'III' }

function VocabCard({ word, showRomaji = true, isDifficult = false, showKanji = false, onToggleDifficult }) {
  const primary = showKanji && word.kanji ? word.kanji : stripBrackets(word.japanese)
  const secondary = showKanji && word.kanji ? stripBrackets(word.japanese) : word.kanji
  return (
    <div className="glass glass-hover" style={vs.card}>
      <div style={vs.cardJp}>{primary}</div>
      {secondary && <div style={vs.cardKanji}>{secondary}</div>}
      {showRomaji && <div style={vs.cardRomaji}>{(word.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}</div>}
      <div style={vs.cardRu}>{word.russian}</div>
      {word.type && (
        <div style={vs.verbBadge}>
          {verbGroupMap[word.type] ? `гл. ${verbGroupMap[word.type]}` : word.type}
        </div>
      )}
      {onToggleDifficult && (
        <button
          onClick={onToggleDifficult}
          title={isDifficult ? 'убрать из сложных' : 'добавить в сложные'}
          style={{
            marginTop: 6, width: '100%',
            fontSize: '0.72rem', fontWeight: 900,
            color: isDifficult ? 'var(--incorrect-text)' : 'var(--text-light)',
            background: isDifficult ? 'rgba(220,38,38,0.1)' : 'rgba(0,0,0,0.03)',
            border: isDifficult ? '1px solid rgba(220,38,38,0.2)' : '1px solid rgba(192,132,252,0.12)',
            borderRadius: 6, padding: '2px 6px',
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s', minHeight: 44,
          }}
        >
          {isDifficult ? '💪 сложное' : '+ сложное'}
        </button>
      )}
    </div>
  )
}

function VocabTable({ vocabulary, sortMode, isMobile, showRomaji = true, showKanji = false }) {
  // Desktop: 4 columns (かな | 漢字 | ромадзи | перевод)
  // Mobile: 3 columns, primary column controlled by showKanji from parent
  return (
    <>
      <table style={vs.table}>
        <thead>
          <tr>
            {isMobile ? (
              <>
                <th style={{ ...vs.th, width: '30%', fontSize: '0.78rem', padding: '8px 6px' }}>
                  {showKanji ? '漢字' : 'かな'}
                </th>
                <th style={{ ...vs.th, width: '28%', fontSize: '0.78rem', padding: '8px 6px' }}>ромадзи</th>
                <th style={{ ...vs.th, width: '42%', fontSize: '0.78rem', padding: '8px 6px' }}>перевод</th>
              </>
            ) : (
              <>
                <th style={{ ...vs.th, width: '22%' }}>かな</th>
                <th style={{ ...vs.th, width: '18%' }}>漢字</th>
                <th style={{ ...vs.th, width: '25%' }}>ромадзи</th>
                <th style={{ ...vs.th, width: '35%' }}>перевод</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {vocabulary.map((word, i) => {
            const isExpr = word.japanese.endsWith('。')
            const prevIsExpr = i > 0 && vocabulary[i - 1].japanese.endsWith('。')
            const showSep = sortMode === 'order' && isExpr && !prevIsExpr
            const colCount = isMobile ? 3 : 4
            return (<React.Fragment key={word.japanese || i}>
            {showSep && (
              <tr>
                <td colSpan={colCount} style={{ padding: '6px 12px 2px', background: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(192,132,252,0.2)' }} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', letterSpacing: '0.06em' }}>выражения</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(192,132,252,0.2)' }} />
                  </div>
                </td>
              </tr>
            )}
            <tr style={i % 2 === 0 ? vs.rowEven : vs.rowOdd}>
              {isMobile ? (
                <>
                  <td style={{ ...vs.tdJp, fontSize: '0.9rem', padding: '7px 6px' }}>
                    <span>{showKanji ? (word.kanji || stripBrackets(word.japanese)) : stripBrackets(word.japanese)}</span>
                    {word.type && <span style={vs.verbGroup}> ({verbGroupMap[word.type]})</span>}
                  </td>
                  <td style={{ ...vs.tdRomaji, fontSize: '0.85rem', padding: '7px 6px' }}>{showRomaji ? (word.romaji || '').replace(/\s*\[.*?\]/g, '').trim() : '···'}</td>
                  <td style={{ ...vs.tdRu, fontSize: '0.85rem', padding: '7px 6px' }}>{word.russian}</td>
                </>
              ) : (
                <>
                  <td style={vs.tdJp}>
                    <span>{stripBrackets(word.japanese)}</span>
                    {word.type && <span style={vs.verbGroup}> ({verbGroupMap[word.type]})</span>}
                  </td>
                  <td style={vs.tdKanji}>{word.kanji || '—'}</td>
                  <td style={vs.tdRomaji}>{showRomaji ? (word.romaji || '').replace(/\s*\[.*?\]/g, '').trim() : '···'}</td>
                  <td style={vs.tdRu}>{word.russian}</td>
                </>
              )}
            </tr>
            </React.Fragment>)
          })}
        </tbody>
      </table>
    </>
  )
}

/* ─── SUPPLEMENTARY ─────────────────────────────────────────── */

function SupplementarySection({ data }) {
  const isTablet = useIsTablet()
  const [open, setOpen] = useState(false)
  const imageSrc = getSupplementaryImage(data.image)
  return (
    <div className="glass" style={supp.wrap}>
      <button onClick={() => setOpen(o => !o)} style={supp.header} className="btn-hover">
        <span style={supp.badge}>bonus</span>
        <span style={supp.title}>{data.title}</span>
        <span style={supp.titleJp}>{data.titleJp}</span>
        {(data.words || []).length > 0 && <span style={supp.count}>{data.words.length}</span>}
        <span style={{ ...supp.arrow, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </button>
      {open && (
        <div style={{ padding: '4px 12px 12px' }}>
          {imageSrc && (
            <img
              src={imageSrc}
              alt={data.titleJp}
              style={{ width: '100%', maxWidth: isTablet ? 680 : 420, display: 'block', margin: '0 auto 14px', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}
            />
          )}
          <div style={supp.list}>
            {(data.words || []).map((w, i) => (
              <div key={i} style={supp.row}>
                <div style={supp.rowLeft}>
                  <span style={supp.wordJp}>{w.kanji || stripBrackets(w.japanese)}</span>
                  {w.kanji && <span style={supp.wordKana}>{stripBrackets(w.japanese)}</span>}
                  <span style={supp.wordRomaji}>{(w.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}</span>
                </div>
                <div style={supp.wordRu}>{w.russian}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── GRAMMAR ───────────────────────────────────────────────── */

function GrammarList({ grammar, lessonId }) {
  const [copiedId, setCopiedId] = useState(null)
  const [expandedIds, setExpandedIds] = useState(new Set())
  const copyTimerRef = useRef(null)
  useEffect(() => () => clearTimeout(copyTimerRef.current), [])

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleCopy = (id, text) => {
    copyTextToClipboard(text).then((success) => {
      if (!success) return
      setCopiedId(id)
      clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopiedId(null), 1500)
    })
  }

  return (
    <div>
      <div style={sh.wrap}>
        <div style={sh.left}>
          <div style={{ ...sh.accent, background: 'linear-gradient(180deg, #c084fc, #a855f7)' }} />
          <span style={sh.title}>грамматика</span>
          <span style={sh.titleJp}>ぶんぽう</span>
        </div>
        <div style={{ ...sh.right, gap: 8 }}>
          <span style={sh.count}>{grammar.length} конструкций</span>
          <Link
            to={`/quiz/grammar?lesson=${lessonId}`}
            style={{ ...gr.practiceBtn, background: 'rgba(168,85,247,0.1)', color: 'var(--text-light)', boxShadow: 'none' }}
          >
            quiz →
          </Link>
          <Link
            to={`/quiz/fill-in?lesson=${lessonId}`}
            style={gr.practiceBtn}
          >
            практика →
          </Link>
          <Link
            to={`/grammar?lesson=${lessonId}`}
            style={{ ...gr.practiceBtn, background: 'rgba(168,85,247,0.1)', color: 'var(--text-light)', boxShadow: 'none' }}
          >
            explore →
          </Link>
          {lessonId <= 20 && (
            <Link
              to={`/quiz/sentences?lesson=${lessonId}`}
              style={{ ...gr.practiceBtn, background: 'rgba(168,85,247,0.1)', color: 'var(--text-light)', boxShadow: 'none' }}
            >
              строить →
            </Link>
          )}
        </div>
      </div>
      <div style={gr.list}>
        {grammar.map((g, i) => {
          const gid = g.id || i
          const isExpanded = expandedIds.has(gid)
          return (
          <div key={gid} className="glass" style={gr.card}>
            <div
              style={{ ...gr.cardHeader, cursor: g.examples?.length > 0 ? 'pointer' : 'default' }}
              onClick={() => g.examples?.length > 0 && toggleExpand(gid)}
              role={g.examples?.length > 0 ? 'button' : undefined}
              tabIndex={g.examples?.length > 0 ? 0 : undefined}
              aria-expanded={g.examples?.length > 0 ? isExpanded : undefined}
              aria-label={g.examples?.length > 0 ? `${isExpanded ? 'collapse' : 'expand'} examples for ${g.pattern}` : undefined}
              onKeyDown={g.examples?.length > 0 ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(gid) } } : undefined}
            >
              <div style={gr.numBadge}>#{i + 1}</div>
              <div style={gr.patternWrap}>
                <span style={gr.pattern}>{g.pattern}</span>
              </div>
              {g.examples?.length > 0 && (
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-light)', marginRight: 2, flexShrink: 0 }}>
                  {isExpanded ? '−' : '+'}
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleCopy(g.id || i, g.pattern) }}
                style={{
                  fontSize: '0.78rem', fontWeight: 800, flexShrink: 0,
                  color: copiedId === (g.id || i) ? 'var(--correct-text)' : 'var(--text-light)',
                  background: copiedId === (g.id || i) ? 'rgba(16,185,129,0.12)' : 'rgba(168,85,247,0.08)',
                  border: 'none', borderRadius: 8, padding: '3px 8px',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', minHeight: 44,
                }}
              >
                {copiedId === (g.id || i) ? '✓' : '⎘'}
              </button>
            </div>
            {g.patternJp && <div style={gr.patternJp}>{g.patternJp}</div>}
            <div style={gr.meaningBox}>
              <span style={gr.meaningIcon}>💡</span>
              <span style={gr.meaningText}>{g.meaning}</span>
            </div>
            <div style={gr.explanation}>{g.explanation}</div>
            {isExpanded && g.examples && g.examples.length > 0 && (
              <div style={gr.examplesWrap}>
                <div style={gr.examplesLabel}>примеры ✏️</div>
                <div style={gr.examplesList}>
                  {g.examples.map((ex, j) => (
                    <div key={j} style={gr.exampleCard}>
                      <div style={gr.exampleJp}>{ex.jp}</div>
                      <div style={gr.exampleRomaji}>{ex.romaji}</div>
                      <div style={gr.exampleRu}>{ex.ru}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── PRACTICE ──────────────────────────────────────────────── */

function PracticeMode({ vocabulary }) {
  const [index, setIndex] = useState(0)
  const [showRomaji, setShowRomaji] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [direction, setDirection] = useState('jp→ru')
  const [shuffled, setShuffled] = useState(() => {
    const a = [...vocabulary]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  })

  const word = shuffled[index]
  const total = shuffled.length

  const resetCard = () => { setShowAnswer(false); setShowRomaji(false) }
  const next = () => { if (total === 0) return; resetCard(); setIndex(prev => (prev + 1) % total) }
  const prev = () => { if (total === 0) return; resetCard(); setIndex(prev => (prev - 1 + total) % total) }
  const reshuffle = () => {
    const a = [...vocabulary]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    setShuffled(a); setIndex(0); resetCard()
  }

  if (!word) return null

  const dirBtnBase = { padding: '5px 14px', borderRadius: 50, fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', border: 'none', minHeight: 44 }

  return (
    <div style={pr.wrap}>
      <div style={{ display: 'flex', gap: 0, justifyContent: 'center', marginBottom: 12 }}>
        <button onClick={() => { setDirection('jp→ru'); resetCard() }} style={{
          ...dirBtnBase, borderRadius: '50px 0 0 50px',
          background: direction === 'jp→ru' ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(168,85,247,0.1)',
          color: direction === 'jp→ru' ? 'white' : 'var(--text-light)',
        }}>яп → рус</button>
        <button onClick={() => { setDirection('ru→jp'); resetCard() }} style={{
          ...dirBtnBase, borderRadius: '0 50px 50px 0',
          background: direction === 'ru→jp' ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(168,85,247,0.1)',
          color: direction === 'ru→jp' ? 'white' : 'var(--text-light)',
        }}>рус → яп ✍️</button>
      </div>
      <div style={pr.counter}>{index + 1} / {total}</div>
      <div className="glass" style={pr.card}>
        {direction === 'jp→ru' ? (
          <>
            <div style={pr.japanese}>{word.kanji || stripBrackets(word.japanese)}</div>
            {word.kanji && <div style={pr.kanji}>{stripBrackets(word.japanese)}</div>}
            <button onClick={() => setShowRomaji(v => !v)} style={pr.hintBtn}>
              {showRomaji ? (word.romaji || '').replace(/\s*\[.*?\]/g, '').trim() : 'показать ромадзи 👀'}
            </button>
            <button onClick={() => setShowAnswer(v => !v)} style={{ ...pr.hintBtn, ...pr.hintBtnRu }}>
              {showAnswer ? word.russian : 'показать перевод 🔍'}
            </button>
          </>
        ) : (
          <>
            <div style={{ ...pr.japanese, fontSize: '1.5rem', color: 'var(--text-main)' }}>{word.russian}</div>
            <button onClick={() => setShowAnswer(v => !v)} style={{ ...pr.hintBtn, ...pr.hintBtnRu }}>
              {showAnswer ? (word.kanji || stripBrackets(word.japanese)) : 'показать ответ ✍️'}
            </button>
            {showAnswer && word.kanji && <div style={pr.kanji}>{stripBrackets(word.japanese)}</div>}
            {showAnswer && (
              <button onClick={() => setShowRomaji(v => !v)} style={pr.hintBtn}>
                {showRomaji ? (word.romaji || '').replace(/\s*\[.*?\]/g, '').trim() : 'показать ромадзи 👀'}
              </button>
            )}
          </>
        )}
        {word.type && <div style={pr.verbBadge}>{word.type}</div>}
      </div>
      <div style={pr.controls}>
        <button onClick={prev} className="btn-hover" style={pr.navBtn}>← пред</button>
        <button onClick={reshuffle} className="btn-hover" aria-label="shuffle cards" style={pr.shuffleBtn}>🔀</button>
        <button onClick={next} className="btn-hover" style={pr.navBtn}>след →</button>
      </div>
    </div>
  )
}

/* ─── MATCHING MINI GAME ────────────────────────────────────── */

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function MatchingMini({ vocabulary }) {
  const initGame = useCallback(() => {
    const pool = shuffle([...vocabulary]).slice(0, 6)
    return {
      pairs: pool,
      left: shuffle(pool.map(w => stripBrackets(w.kanji || w.japanese))),
      right: shuffle(pool.map(w => w.russian)),
      matched: new Set(),
      selectedLeft: null,
      selectedRight: null,
      wrongLeft: null,
      wrongRight: null,
      done: false,
    }
  }, [vocabulary])

  const [game, setGame] = useState(() => initGame())
  const wrongTimerRef = useRef(null)
  useEffect(() => () => clearTimeout(wrongTimerRef.current), [])

  const selectLeft = (word) => {
    if (game.matched.has(word) || game.done) return
    setGame(g => ({ ...g, selectedLeft: word, wrongLeft: null, wrongRight: null }))
  }

  const selectRight = (word) => {
    if (game.done) return
    const { selectedLeft, pairs, matched } = game
    if (!selectedLeft) return

    // find the pair for selectedLeft
    const pair = pairs.find(p => stripBrackets(p.kanji || p.japanese) === selectedLeft)
    const correct = pair && pair.russian === word

    if (correct) {
      const newMatched = new Set(matched)
      newMatched.add(selectedLeft)
      const done = newMatched.size === pairs.length
      setGame(g => ({ ...g, matched: newMatched, selectedLeft: null, selectedRight: null, wrongLeft: null, wrongRight: null, done }))
    } else {
      setGame(g => ({ ...g, wrongLeft: selectedLeft, wrongRight: word, selectedLeft: null }))
      clearTimeout(wrongTimerRef.current)
      wrongTimerRef.current = setTimeout(() => setGame(g => ({ ...g, wrongLeft: null, wrongRight: null })), 600)
    }
  }

  const { pairs, left, right, matched, selectedLeft, wrongLeft, wrongRight, done } = game

  // map russian → japanese for checking
  const ruToJp = useMemo(() => {
    const m = {}
    pairs.forEach(p => { m[p.russian] = stripBrackets(p.kanji || p.japanese) })
    return m
  }, [pairs])

  const isMatchedRight = (ru) => {
    const jp = ruToJp[ru]
    return matched.has(jp)
  }

  return (
    <div style={mm.wrap}>
      <div style={mm.header}>
        <span style={mm.title}>🎯 сопоставь слова</span>
        <span style={mm.progress}>{matched.size}/{pairs.length}</span>
      </div>
      {done ? (
        <div className="glass animate-pop" style={mm.doneCard}>
          <div style={{ fontSize: '2rem' }}>🎉</div>
          <div style={mm.doneText}>все пары найдены!</div>
          <button onClick={() => setGame(initGame())} style={mm.retryBtn}>ещё раз 🔀</button>
        </div>
      ) : (
        <div style={mm.grid}>
          <div style={mm.col}>
            {left.filter(w => !matched.has(w)).map(w => {
              const isSelected = selectedLeft === w
              const isWrong = wrongLeft === w
              return (
                <button
                  key={w}
                  onClick={() => selectLeft(w)}
                  style={{
                    ...mm.cell,
                    ...(isSelected ? mm.cellSelected : {}),
                    ...(isWrong ? mm.cellWrong : {}),
                  }}
                >
                  {w}
                </button>
              )
            })}
          </div>
          <div style={mm.col}>
            {right.filter(w => !isMatchedRight(w)).map(w => {
              const isWrong = wrongRight === w
              return (
                <button
                  key={w}
                  onClick={() => selectRight(w)}
                  style={{
                    ...mm.cell,
                    ...(isWrong ? mm.cellWrong : {}),
                  }}
                >
                  {w}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const mm = {
  wrap: { marginBottom: 16 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' },
  progress: { fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-light)' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  col: { display: 'flex', flexDirection: 'column', gap: 6 },
  cell: {
    padding: '10px 8px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700,
    textAlign: 'center', cursor: 'pointer', border: '1.5px solid rgba(192,132,252,0.25)',
    background: 'var(--tint-medium)', color: 'var(--text-main)', fontFamily: 'inherit',
    transition: 'all 0.15s', lineHeight: 1.2, minHeight: 44,
  },
  cellSelected: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.2), rgba(192,132,252,0.2))',
    border: '1.5px solid #c084fc', boxShadow: '0 0 0 2px rgba(192,132,252,0.2)',
  },
  cellMatched: {
    background: 'rgba(16,185,129,0.12)',
    boxShadow: '0 0 0 1.5px var(--correct-text)',
    color: 'var(--correct-text)', cursor: 'default', opacity: 0.7,
  },
  cellWrong: {
    background: 'rgba(239,68,68,0.1)',
    boxShadow: '0 0 0 1.5px var(--incorrect-text)',
    color: 'var(--incorrect-text)',
  },
  doneCard: { padding: '20px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  doneText: { fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' },
  retryBtn: {
    padding: '6px 20px', borderRadius: 50, fontSize: '0.82rem', fontWeight: 800,
    background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: 'white',
    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 2px 8px rgba(244,114,182,0.3)', minHeight: 44,
  },
}

/* ─── DIALOGUE ──────────────────────────────────────────────── */

function highlightWords(text, vocabulary, onWordClick) {
  if (!vocabulary || vocabulary.length === 0) return [text]

  // Build list of {word, vocabItem} sorted by length descending for greedy match
  // Strip bracket annotations so na-adj like "たいせつ[な]" → "たいせつ" matches dialog text
  const stripBr = s => (s || '').replace(/\[.*?\]/g, '').trim()
  const targets = []
  vocabulary.forEach(item => {
    const jp = stripBr(item.japanese)
    if (jp) targets.push({ word: jp, item })
    const kj = stripBr(item.kanji)
    if (kj && kj !== jp) targets.push({ word: kj, item })
  })
  targets.sort((a, b) => b.word.length - a.word.length)

  const result = []
  let remaining = text
  let keyIdx = 0

  while (remaining.length > 0) {
    let matched = false
    for (const { word, item } of targets) {
      if (remaining.startsWith(word)) {
        result.push(
          <span
            key={keyIdx++}
            style={dl.wordHighlight}
            onClick={e => { e.stopPropagation(); onWordClick(item) }}
          >
            {word}
          </span>
        )
        remaining = remaining.slice(word.length)
        matched = true
        break
      }
    }
    if (!matched) {
      // advance one character as plain text
      const ch = [...remaining][0]
      if (result.length > 0 && typeof result[result.length - 1] === 'string') {
        result[result.length - 1] += ch
      } else {
        result.push(ch)
      }
      remaining = remaining.slice(ch.length)
    }
  }

  return result
}

function LessonStats({ lessonId, lesson, progress }) {
  const vocabQuizzes = (progress.vocabQuizzes || []).filter(q => q.lessons?.includes(lessonId))
  const grammarQuizzes = (progress.grammarQuizzes || []).filter(q => q.lessons?.includes(lessonId))
  const allQuizzes = [...vocabQuizzes, ...grammarQuizzes]

  const bestVocab = vocabQuizzes.length > 0
    ? Math.max(...vocabQuizzes.map(q => q.total > 0 ? Math.round((q.score / q.total) * 100) : 0))
    : null
  const bestGrammar = grammarQuizzes.length > 0
    ? Math.max(...grammarQuizzes.map(q => q.total > 0 ? Math.round((q.score / q.total) * 100) : 0))
    : null
  const lastQuiz = allQuizzes.length > 0
    ? [...allQuizzes].sort((a, b) => (parseValidDate(b.date)?.getTime() || 0) - (parseValidDate(a.date)?.getTime() || 0))[0]
    : null
  const lastQuizDate = parseValidDate(lastQuiz?.date)

  const statItems = [
    { label: 'слов в уроке', value: lesson.vocabulary.length, color: '#f472b6', icon: '📝' },
    { label: 'паттернов', value: lesson.grammar?.length || 0, color: 'var(--text-light)', icon: '文' },
    { label: 'vocab квизов', value: vocabQuizzes.length, color: 'var(--correct-text)', icon: '🎯' },
    { label: 'grammar квизов', value: grammarQuizzes.length, color: '#60a5fa', icon: '📖' },
    ...(bestVocab !== null ? [{ label: 'лучший vocab', value: `${bestVocab}%`, color: bestVocab >= 90 ? 'var(--correct-text)' : bestVocab >= 70 ? 'var(--gold-text)' : '#f472b6', icon: '⭐' }] : []),
    ...(bestGrammar !== null ? [{ label: 'лучший grammar', value: `${bestGrammar}%`, color: bestGrammar >= 90 ? 'var(--correct-text)' : bestGrammar >= 70 ? 'var(--gold-text)' : '#f472b6', icon: '📊' }] : []),
  ]

  return (
    <div className="animate-fadeInUp">
      <div style={{ ...sh.wrap, marginBottom: 16 }}>
        <div style={sh.left}>
          <div style={sh.accent} />
          <span style={sh.title}>статистика</span>
          <span style={sh.titleJp}>とうけい</span>
        </div>
      </div>

      <div className="glass" style={{ padding: '18px 20px', marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {statItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 8px', borderRadius: 12, background: 'rgba(192,132,252,0.05)' }}>
              <div style={{ fontSize: '1.2rem' }}>{item.icon}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: item.color, lineHeight: 1 }}>{item.value}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textAlign: 'center' }}>{item.label}</div>
            </div>
          ))}
        </div>

        {lastQuiz && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(192,132,252,0.12)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)', textAlign: 'center' }}>
            последний квиз: {lastQuizDate ? lastQuizDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : 'дата неизвестна'}
            {' · '}{Math.round((lastQuiz.score / lastQuiz.total) * 100)}%
          </div>
        )}

        {allQuizzes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-light)', fontSize: '0.82rem', fontWeight: 600 }}>
            квизов ещё не было · <Link to={`/quiz/vocab?lesson=${lessonId}`} style={{ color: '#f472b6', textDecoration: 'none', fontWeight: 800 }}>пройти →</Link>
          </div>
        )}
      </div>
    </div>
  )
}

function DialogueSection({ dialog, vocabulary }) {
  const [revealed, setRevealed] = useState(new Set())
  const [showAll, setShowAll] = useState(false)
  const [showRomaji, setShowRomaji] = useState(false)
  const [popupWord, setPopupWord] = useState(null)
  const vocab = vocabulary || []

  if (!dialog) {
    return (
      <div className="glass" style={dl.empty}>
        <span style={{ fontSize: '2rem' }}>💬</span>
        <p style={dl.emptyText}>диалог для этого урока ещё не добавлен</p>
      </div>
    )
  }

  const toggleLine = (i) => {
    if (showAll) return
    setRevealed(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

  const toggleAll = () => {
    if (showAll) {
      setShowAll(false)
      setRevealed(new Set())
    } else {
      setShowAll(true)
    }
  }

  // Collect unique speakers (excluding null/stage directions)
  const speakers = [...new Set(dialog.lines.filter(l => l.speaker).map(l => l.speaker))]
  const speakerColors = ['#f472b6', '#8b5cf6', '#0284c7', '#059669', '#ea580c', '#f59e0b']
  const colorMap = {}
  speakers.forEach((sp, i) => { colorMap[sp] = speakerColors[i % speakerColors.length] })

  const replicaCount = dialog.lines.filter(l => l.speaker).length

  return (
    <div>
      <div style={sh.wrap}>
        <div style={sh.left}>
          <div style={{ ...sh.accent, background: 'linear-gradient(180deg, #38bdf8, #a855f7)' }} />
          <span style={sh.title}>диалог</span>
          <span style={sh.titleJp}>会話</span>
        </div>
        <div style={sh.right}>
          <button
            onClick={() => setShowRomaji(v => !v)}
            style={{
              fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: 50,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: showRomaji ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.1)',
              color: showRomaji ? 'white' : 'var(--text-light)', transition: 'all 0.2s',
              minHeight: 44,
            }}
          >
            {showRomaji ? 'скрыть ромадзи' : 'ромадзи'}
          </button>
          <button
            onClick={toggleAll}
            style={{
              fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: 50,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: showAll ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.1)',
              color: showAll ? 'white' : 'var(--text-light)', transition: 'all 0.2s',
              minHeight: 44,
            }}
          >
            {showAll ? '🙈 скрыть' : '👁 перевод'}
          </button>
          <span style={{ ...sh.count }}>
            {replicaCount} реплик
          </span>
        </div>
      </div>

      <div className="glass" style={dl.titleCard}>
        <span style={dl.titleIcon}>💬</span>
        <div>
          <div style={dl.titleText}>{dialog.titleJp || dialog.title}</div>
          {dialog.titleJp && <div style={dl.titleSub}>{dialog.title}</div>}
        </div>
        <span style={dl.titleHint}>нажми → перевод</span>
      </div>

      <div style={dl.lines}>
        {dialog.lines.map((line, i) => {
          if (!line.speaker) {
            return <div key={i} style={dl.pause}>…</div>
          }
          const color = colorMap[line.speaker] || '#8b5cf6'
          const isRevealed = showAll || revealed.has(i)
          const hasJp = !!line.jp
          const speakerLabel = SPEAKER_JP[line.speaker] || line.speaker
          const isRight = speakers.indexOf(line.speaker) === 1
          return (
            <div
              key={i}
              style={{ ...dl.lineRow, alignItems: isRight ? 'flex-end' : 'flex-start' }}
              onClick={() => hasJp && toggleLine(i)}
              role={hasJp ? 'button' : undefined}
              tabIndex={hasJp ? 0 : undefined}
              aria-label={hasJp ? `${speakerLabel} — нажми чтобы показать/скрыть перевод` : undefined}
              onKeyDown={hasJp ? (e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleLine(i) } }) : undefined}
            >
              <div style={{ ...dl.speakerBadge, background: color + '30', color, border: `1px solid ${color}55` }}>
                {speakerLabel}
              </div>
              <div
                style={{
                  ...dl.bubble,
                  maxWidth: '85%',
                  borderLeft: isRight ? 'none' : `3px solid ${color}`,
                  borderRight: isRight ? `3px solid ${color}` : 'none',
                  borderRadius: isRight ? '14px 0 14px 14px' : '0 14px 14px 14px',
                  background: isRight ? color + '14' : undefined,
                  cursor: hasJp ? 'pointer' : 'default',
                }}
              >
                {hasJp && (
                  <div style={dl.jpText}>
                    {highlightWords(line.jp, vocab, setPopupWord)}
                  </div>
                )}
                {hasJp && showRomaji && (
                  <div style={dl.romajiText}>{kanaToRomaji(line.jp)}</div>
                )}
                {isRevealed && (
                  <div style={dl.ruText}>{line.ru}</div>
                )}
                {!hasJp && (
                  <div style={dl.jpText}>{line.ru}</div>
                )}
                {hasJp && !isRevealed && (
                  <div style={dl.tapHint}>нажми для перевода</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {popupWord && (
        <div style={dl.wordPopup} onClick={() => setPopupWord(null)} role="dialog" aria-modal="true" aria-label={`${popupWord.kanji || popupWord.japanese} — word details`}>
          <div style={dl.wordPopupJp}>{popupWord.kanji || stripBrackets(popupWord.japanese)}</div>
          <div style={dl.wordPopupRomaji}>{(popupWord.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}</div>
          <div style={dl.wordPopupRu}>{popupWord.russian}</div>
          <div style={dl.wordPopupClose}>✕ закрыть</div>
        </div>
      )}
    </div>
  )
}

/* ─── STYLES ────────────────────────────────────────────────── */

// section header shared styles
const sh = {
  wrap: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, marginTop: 4, flexWrap: 'wrap', gap: 6 },
  left: { display: 'flex', alignItems: 'center', gap: 10 },
  accent: { width: 4, height: 22, borderRadius: 50, background: 'linear-gradient(180deg, #f472b6, #c084fc)', flexShrink: 0 },
  title: { fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)', textTransform: 'lowercase', letterSpacing: '-0.01em' },
  titleJp: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-light)' },
  right: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  count: { fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-light)', background: 'rgba(168,85,247,0.1)', padding: '3px 10px', borderRadius: 50 },
  viewToggle: { display: 'flex', background: 'var(--tint-medium)', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(192,132,252,0.2)' },
  viewBtn: { padding: '4px 10px', border: 'none', background: 'transparent', fontSize: '0.85rem', color: 'var(--text-light)', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', minHeight: 44, minWidth: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  viewBtnActive: { background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: 'white' },
}

// vocab styles
const vs = {
  filterWrap: { marginBottom: 12 },
  filterInner: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--tint-medium)', backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)', borderRadius: 12, padding: '8px 14px',
    border: '1px solid rgba(192,132,252,0.15)',
  },
  filterIcon: { fontSize: '0.9rem', flexShrink: 0 },
  filterInput: {
    flex: 1, border: 'none', background: 'transparent', fontSize: '1rem',
    fontWeight: 600, color: 'var(--text-main)', fontFamily: 'inherit', outline: 'none',
    minHeight: 32,
  },
  filterCount: { fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', whiteSpace: 'nowrap' },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(140px, 44%), 1fr))', gap: 10, marginBottom: 16 },
  card: { padding: '14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 3 },
  cardJp: { fontSize: 'clamp(1.1rem, 4vw, 1.35rem)', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.2, letterSpacing: '-0.01em' },
  cardKanji: { fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-light)', marginTop: 2 },
  cardRomaji: { fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic', marginTop: 2 },
  cardRu: { fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)', lineHeight: 1.3, marginTop: 2 },
  verbBadge: { fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', background: 'rgba(192,132,252,0.12)', padding: '2px 8px', borderRadius: 50, marginTop: 4 },
  noResults: { gridColumn: '1 / -1', textAlign: 'center', padding: 24, color: 'var(--text-light)', fontSize: '0.88rem', fontWeight: 600 },
  mobileToggleWrap: { display: 'flex', justifyContent: 'center', gap: 0, padding: '8px 12px 4px', background: 'transparent' },
  mobileToggleBtn: { padding: '6px 18px', fontSize: '0.82rem', fontWeight: 800, border: '1.5px solid rgba(168,85,247,0.35)', background: 'rgba(168,85,247,0.08)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', borderRadius: 0, minHeight: 44 },
  mobileToggleBtnActive: { background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: 'white', border: '1.5px solid transparent' },
  tableWrap: { overflowX: 'auto', padding: 0, marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 14px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'lowercase', borderBottom: '2px solid rgba(192,132,252,0.15)', letterSpacing: '0.03em' },
  rowEven: { background: 'rgba(255,255,255,0.12)' },
  rowOdd: { background: 'transparent' },
  tdJp: { padding: '10px 14px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', borderBottom: '1px solid rgba(192,132,252,0.08)', textAlign: 'center' },
  verbGroup: { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)' },
  tdKanji: { padding: '10px 14px', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-light)', borderBottom: '1px solid rgba(192,132,252,0.08)', textAlign: 'center' },
  tdRomaji: { padding: '10px 14px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-light)', fontStyle: 'italic', borderBottom: '1px solid rgba(192,132,252,0.08)', textAlign: 'center' },
  tdRu: { padding: '10px 14px', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', borderBottom: '1px solid rgba(192,132,252,0.08)', textAlign: 'center' },
}

// supplementary styles
const supp = {
  wrap: { marginTop: 12, overflow: 'hidden' },
  header: { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '12px 16px', background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(244,114,182,0.08))', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-main)', borderRadius: 12, minHeight: 44 },
  badge: { fontSize: '0.72rem', fontWeight: 800, color: 'var(--gold-text)', background: 'rgba(251,191,36,0.15)', padding: '2px 8px', borderRadius: 50, textTransform: 'uppercase', letterSpacing: '0.05em' },
  title: { fontSize: '1rem', fontWeight: 800, textTransform: 'lowercase' },
  titleJp: { fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-light)' },
  count: { fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-light)', background: 'rgba(168,85,247,0.1)', padding: '2px 6px', borderRadius: 50, marginLeft: 'auto' },
  arrow: { fontSize: '0.72rem', color: 'var(--text-light)', transition: 'transform 0.3s ease' },
  list: { display: 'flex', flexDirection: 'column', gap: 0 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 4px', borderBottom: '1px solid rgba(251,191,36,0.12)' },
  rowLeft: { display: 'flex', alignItems: 'baseline', gap: 8, flexShrink: 0 },
  wordJp: { fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' },
  wordKana: { fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)' },
  wordRomaji: { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic' },
  wordRu: { fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' },
}

// grammar styles
const gr = {
  practiceBtn: {
    fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: 50,
    background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: 'white',
    textDecoration: 'none', display: 'inline-block',
    boxShadow: '0 2px 8px rgba(244,114,182,0.25)',
  },
  list: { display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 },
  card: { padding: '16px 14px' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  numBadge: { fontSize: '0.72rem', fontWeight: 900, color: '#f472b6', background: 'rgba(244,114,182,0.12)', padding: '3px 9px', borderRadius: 50, flexShrink: 0 },
  patternWrap: { flex: 1 },
  pattern: { fontSize: 'clamp(0.95rem, 3.5vw, 1.15rem)', fontWeight: 900, background: 'linear-gradient(135deg, #f472b6, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.3, display: 'inline-block', wordBreak: 'break-word' },
  patternJp: { fontSize: '0.88rem', color: 'var(--text-light)', fontWeight: 700, marginBottom: 10, paddingLeft: 2 },
  meaningBox: { display: 'flex', alignItems: 'flex-start', gap: 8, background: 'linear-gradient(135deg, rgba(244,114,182,0.07), rgba(192,132,252,0.07))', border: '1px solid rgba(244,114,182,0.15)', padding: '10px 14px', borderRadius: 12, marginBottom: 10 },
  meaningIcon: { fontSize: '1rem', flexShrink: 0, marginTop: 1 },
  meaningText: { fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-secondary)', lineHeight: 1.5 },
  explanation: { fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-main)', lineHeight: 1.65, marginBottom: 4, whiteSpace: 'pre-line' },
  examplesWrap: { marginTop: 14 },
  examplesLabel: { fontSize: '0.72rem', fontWeight: 900, color: 'var(--text-light)', textTransform: 'lowercase', letterSpacing: '0.05em', marginBottom: 8 },
  examplesList: { display: 'flex', flexDirection: 'column', gap: 8 },
  exampleCard: { background: 'rgba(192,132,252,0.06)', borderLeft: '3px solid #c084fc', borderRadius: '0 12px 12px 0', padding: '10px 14px' },
  exampleJp: { fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 3, letterSpacing: '-0.01em' },
  exampleRomaji: { fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 3 },
  exampleRu: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' },
}

// practice styles
const pr = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0' },
  counter: { fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)' },
  card: { width: '100%', maxWidth: 360, padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  japanese: { fontSize: 'clamp(1.8rem, 7vw, 2.5rem)', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.2 },
  kanji: { fontSize: '1rem', fontWeight: 600, color: 'var(--text-light)', marginTop: -4 },
  hintBtn: { padding: '8px 20px', borderRadius: 50, border: '1.5px solid rgba(192,132,252,0.3)', background: 'var(--tint-strong)', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', minWidth: 180, minHeight: 44 },
  hintBtnRu: { borderColor: 'rgba(244,114,182,0.3)' },
  verbBadge: { fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', background: 'rgba(192,132,252,0.1)', padding: '3px 10px', borderRadius: 50, marginTop: 4 },
  controls: { display: 'flex', alignItems: 'center', gap: 12 },
  navBtn: { padding: '8px 20px', borderRadius: 50, background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: 'white', border: 'none', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', minHeight: 44 },
  shuffleBtn: { padding: '8px 14px', borderRadius: 50, background: 'var(--tint-strong)', border: '1.5px solid rgba(192,132,252,0.3)', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s', minHeight: 44 },
}

// main page styles
const s = {
  header: { textAlign: 'center', marginBottom: 16, padding: '0' },
  backLink: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.88rem', color: 'var(--text-light)', fontWeight: 700, marginBottom: 14, textDecoration: 'none', background: 'rgba(168,85,247,0.08)', padding: '5px 14px', borderRadius: 50, transition: 'all 0.2s', minHeight: 44 },
  badgeRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  lessonBadge: { display: 'inline-block', background: 'linear-gradient(135deg, #f472b6, #c084fc)', padding: '5px 18px', borderRadius: 50, boxShadow: '0 4px 14px rgba(244,114,182,0.3)' },
  lessonNum: { fontSize: '0.95rem', fontWeight: 900, color: 'white', textTransform: 'lowercase' },
  quizStartBtn: { background: 'linear-gradient(135deg, #f472b6, #c084fc)', border: 'none', borderRadius: 50, padding: '5px 14px', fontSize: '0.78rem', fontWeight: 800, color: 'white', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', boxShadow: '0 2px 8px rgba(244,114,182,0.3)', transition: 'all 0.2s', minHeight: 44 },
  bookmarkBtn: { background: 'var(--tint-strong)', border: '1.5px solid rgba(192,132,252,0.3)', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.3s ease', color: 'var(--text-light)' },
  bookmarkBtnActive: { background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', border: '1.5px solid transparent', boxShadow: '0 2px 8px rgba(251,191,36,0.3)' },
  titleJpBig: { fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 900, color: 'var(--text-main)', marginBottom: 4, letterSpacing: '-0.02em' },
  titleRu: { fontSize: '1rem', color: 'var(--text-light)', fontWeight: 600, marginBottom: 10 },
  metaRow: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 },
  metaPill: { display: 'flex', alignItems: 'center', gap: 5, background: 'var(--tint-medium)', padding: '5px 12px', borderRadius: 50, border: '1px solid rgba(192,132,252,0.2)' },
  metaPillIcon: { fontSize: '0.85rem' },
  metaPillText: { fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' },
  metaPillDot: { width: 4, height: 4, borderRadius: '50%', background: 'rgba(192,132,252,0.4)' },
  tabRow: { display: 'flex', gap: 6, marginBottom: 18, justifyContent: 'center' },
  tabRowMobile: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 },
  tab: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, padding: '10px 10px', borderRadius: 50, background: 'var(--tint-medium)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1.5px solid rgba(192,132,252,0.25)', fontSize: 'clamp(0.78rem, 3vw, 0.9rem)', fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.3s ease', textTransform: 'lowercase', flex: 1, minWidth: 0, justifyContent: 'center' },
  tabMobile: { flex: 'initial', padding: '10px 8px' },
  tabActive: { background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: 'white', border: '1.5px solid transparent', boxShadow: '0 4px 14px rgba(236,72,153,0.3)' },
  tabJp: { fontSize: '0.72rem', opacity: 0.75 },
  navRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', marginTop: 32, marginBottom: 90, gap: 12 },
  navBtnPrev: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 12px', background: 'var(--tint-medium)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 16, border: '1.5px solid rgba(192,132,252,0.2)', textDecoration: 'none', color: 'inherit', transition: 'all 0.25s ease', flex: 1, minWidth: 0 },
  navBtnNext: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 12px', background: 'var(--tint-medium)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 16, border: '1.5px solid rgba(192,132,252,0.2)', textDecoration: 'none', color: 'inherit', transition: 'all 0.25s ease', flex: 1, minWidth: 0 },
  navArrow: { fontSize: '1.1rem', color: 'var(--text-light)', fontWeight: 900, flexShrink: 0 },
  navBtnInner: { display: 'flex', flexDirection: 'column', gap: 1 },
  navBtnLabel: { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'lowercase' },
  navBtnNum: { fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'lowercase' },
  imgSectionLabel: { fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-light)', marginBottom: 10, textTransform: 'lowercase' },
  lessonPageImg: { width: '100%', borderRadius: 16, border: '1px solid var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', display: 'block' },
  notFound: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
  notFoundCard: { textAlign: 'center', padding: 32, maxWidth: 340 },
  notFoundTitle: { fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'lowercase', marginTop: 8, marginBottom: 8 },
  notFoundText: { fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 500 },
  quickQuizCard: { padding: 18, marginTop: 16, textAlign: 'center' },
  quickQuizTitle: { fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'lowercase', marginBottom: 12 },
  quickQuizGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  quickQuizBtn: { fontSize: '0.8rem', padding: '10px 8px' },
}

// dialogue styles
const dl = {
  empty: { padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  emptyText: { fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 600 },
  titleCard: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', marginBottom: 16, background: 'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(168,85,247,0.08))', border: '1px solid rgba(56,189,248,0.15)', flexWrap: 'wrap', borderRadius: 12 },
  titleIcon: { fontSize: '1.1rem' },
  titleText: { fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' },
  titleSub: { fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 },
  titleHint: { fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)', letterSpacing: '0.01em', marginLeft: 'auto' },
  lines: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 },
  pause: { textAlign: 'center', color: 'var(--text-light)', fontSize: '1.1rem', letterSpacing: '0.2em', padding: '2px 0' },
  lineRow: { display: 'flex', flexDirection: 'column', gap: 4 },
  speakerBadge: { alignSelf: 'flex-start', fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: 50, letterSpacing: '0.01em' },
  bubble: { padding: '10px 16px', borderRadius: '0 14px 14px 14px', color: 'var(--text-main)', lineHeight: 1.6 },
  jpText: { fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.65 },
  romajiText: { fontSize: '0.78rem', color: 'var(--text-light)', fontStyle: 'italic', marginTop: 3, lineHeight: 1.4 },
  ruText: { fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)', marginTop: 4, borderTop: '1px solid rgba(192,132,252,0.15)', paddingTop: 4, lineHeight: 1.5 },
  tapHint: { fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 4, letterSpacing: '0.02em' },
  wordHighlight: {
    textDecoration: 'underline', textDecorationStyle: 'dotted',
    textDecorationColor: 'rgba(244,114,182,0.6)', cursor: 'pointer',
    color: 'inherit',
  },
  wordPopup: {
    position: 'fixed', bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', left: '50%', transform: 'translateX(-50%)',
    zIndex: 200, padding: '14px 20px', borderRadius: 16, minWidth: 200,
    background: 'var(--glass-bg)', backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)', textAlign: 'center', cursor: 'pointer',
    border: '1px solid rgba(192,132,252,0.3)',
  },
  wordPopupJp: { fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: 4 },
  wordPopupRomaji: { fontSize: '0.85rem', color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 4 },
  wordPopupRu: { fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 },
  wordPopupClose: { fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 600 },
}
