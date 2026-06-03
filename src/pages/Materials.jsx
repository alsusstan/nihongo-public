import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useIsMobile } from '../hooks/useIsMobile'

const materialsAvailable = import.meta.env.DEV && import.meta.env.VITE_ENABLE_LOCAL_MATERIALS === '1'

const localMaterialFiles = materialsAvailable ? {
  'minna-ru': '/materials/minna-ru.pdf',
  'minna-exercises': '/materials/minna-exercises.pdf',
  'minna-texts': '/materials/minna-texts.pdf',
  'basic-kanji': '/materials/basic-kanji-1-ru.pdf',
  'basic-workbook': '/materials/basic-workbook-1.pdf',
  'sentence-pattern': '/materials/sentence-pattern-workbook.pdf',
  'eriko-sato': '/materials/eriko-sato-reading-writing.pdf',
} : {}

const books = [
  {
    id: 'minna-ru',
    title: 'Минна но Нихонго',
    subtitle: 'основной учебник (русский перевод)',
    icon: '📘',
    size: '13 МБ',
    color: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
    tags: ['главный', 'урок 1–25'],
  },
  {
    id: 'minna-exercises',
    title: 'Минна — Упражнения',
    subtitle: 'рабочая тетрадь',
    icon: '✏️',
    size: '31 МБ',
    color: 'linear-gradient(135deg, #34d399, #059669)',
    tags: ['упражнения'],
  },
  {
    id: 'minna-texts',
    title: 'Минна — Тексты топику',
    subtitle: 'тексты для чтения и понимания',
    icon: '📖',
    size: '22 МБ',
    color: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
    tags: ['чтение', 'топику'],
  },
  {
    id: 'basic-kanji',
    title: 'Basic Kanji Book 1',
    subtitle: 'с русским переводом (уроки 1–22)',
    icon: '漢',
    size: '74 МБ',
    color: 'linear-gradient(135deg, #f97316, #ea580c)',
    tags: ['кандзи', 'BKB1'],
  },
  {
    id: 'basic-workbook',
    title: 'Basic Workbook I',
    subtitle: 'базовый воркбук',
    icon: '📓',
    size: '3.4 МБ',
    color: 'linear-gradient(135deg, #fbbf24, #d97706)',
    tags: ['упражнения'],
  },
  {
    id: 'sentence-pattern',
    title: 'Sentence Pattern Workbook I',
    subtitle: 'воркбук по паттернам предложений',
    icon: '📋',
    size: '6.5 МБ',
    color: 'linear-gradient(135deg, #f472b6, #ec4899)',
    tags: ['грамматика', 'паттерны'],
  },
  {
    id: 'eriko-sato',
    title: 'Reading & Writing Japanese',
    subtitle: 'рабочая тетрадь по чтению и письму (Eriko Sato)',
    icon: '✍️',
    size: '8.3 МБ',
    color: 'linear-gradient(135deg, #818cf8, #6366f1)',
    tags: ['чтение', 'письмо', 'кана'],
  },
]

export default function Materials() {
  const isMobile = useIsMobile()
  const [opening, setOpening] = useState(null)
  const openTimerRef = useRef(null)
  useEffect(() => () => clearTimeout(openTimerRef.current), [])

  const handleOpen = (book) => {
    setOpening(book.id)
    clearTimeout(openTimerRef.current)
    openTimerRef.current = setTimeout(() => setOpening(null), 1200)
  }

  return (
    <div className="page">
      <div className="animate-fadeInUp" style={s.header}>
        <h1 style={s.title}>
          <span>📚</span> учебники
        </h1>
        <p style={s.subtitle}>{materialsAvailable ? 'все материалы для занятий' : 'локальные учебные файлы не публикуются на сайте'}</p>
      </div>

      {materialsAvailable ? (
        <div style={{ ...s.grid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)' }}>
          {books.map(book => {
            const file = localMaterialFiles[book.id]
            return (
            <div key={book.id} className="glass animate-fadeInUp" style={s.card}>
              {/* Icon + gradient bar */}
              <div style={{ ...s.bar, background: book.color }}>
                <span style={s.barIcon}>{book.icon}</span>
              </div>

              <div style={s.body}>
                <div style={s.bookTitle}>{book.title}</div>
                <div style={s.bookSubtitle}>{book.subtitle}</div>

                <div style={s.tags}>
                  {book.tags.map(tag => (
                    <span key={tag} style={s.tag}>{tag}</span>
                  ))}
                  <span style={s.sizeBadge}>{book.size}</span>
                </div>

                <div style={s.actions}>
                  {file && (
                    <>
                      <a
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={s.openBtn}
                        aria-label={`открыть ${book.title}`}
                        onClick={() => handleOpen(book)}
                      >
                        {opening === book.id ? 'открывается...' : 'открыть 📖'}
                      </a>
                      <a
                        href={file}
                        download
                        style={s.downloadBtn}
                        aria-label={`скачать ${book.title}`}
                      >
                        скачать ⬇️
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
            )
          })}
        </div>
      ) : (
        <div className="glass animate-fadeInUp" style={s.publicNotice}>
          <div style={s.noticeIcon}>📚</div>
          <div style={s.noticeTitle}>материалы скрыты в публичной версии</div>
          <div style={s.noticeText}>
            PDF и сканы учебников не выкладываются наружу. На сайте остаются только упражнения,
            словари, квизы и конспекты, которые нужны для занятий.
          </div>
        </div>
      )}

      <p style={s.note}>
        {materialsAvailable ? 'файлы открываются прямо в браузере 📖' : 'публичная версия не публикует учебные PDF'}
      </p>

      <div style={{ textAlign: 'center', marginTop: 16, paddingBottom: 90, display: 'flex', gap: 10, justifyContent: 'center' }}>
        <Link to="/lessons" className="btn btn-cute" style={{ fontSize: '0.85rem' }}>lessons 📚</Link>
        <Link to="/" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>home 🏠</Link>
      </div>
    </div>
  )
}

const s = {
  header: {
    textAlign: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: '1.65rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    margin: 0,
    marginBottom: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  subtitle: {
    fontSize: '1rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    margin: 0,
  },
  grid: {
    display: 'grid',
    gap: 16,
    maxWidth: 760,
    margin: '0 auto',
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  publicNotice: {
    maxWidth: 560,
    margin: '0 auto',
    padding: '32px 24px',
    textAlign: 'center',
    borderRadius: 24,
  },
  noticeIcon: {
    fontSize: '2.4rem',
    marginBottom: 10,
  },
  noticeTitle: {
    fontSize: '1.15rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: '0.92rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    lineHeight: 1.55,
  },
  bar: {
    height: 56,
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 20,
  },
  barIcon: {
    fontSize: '1.6rem',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
  },
  body: {
    padding: '16px 20px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  bookTitle: {
    fontSize: '1rem',
    fontWeight: 900,
    color: 'var(--text-main)',
  },
  bookSubtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-light)',
    fontWeight: 600,
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  tag: {
    fontSize: '0.72rem',
    fontWeight: 700,
    background: 'rgba(168,85,247,0.1)',
    color: 'var(--text-light)',
    padding: '2px 8px',
    borderRadius: 50,
  },
  sizeBadge: {
    fontSize: '0.72rem',
    fontWeight: 700,
    background: 'rgba(0,0,0,0.06)',
    color: 'var(--text-light)',
    padding: '2px 8px',
    borderRadius: 50,
  },
  actions: {
    display: 'flex',
    gap: 8,
    marginTop: 4,
  },
  openBtn: {
    flex: 1,
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '9px 12px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    color: '#fff',
    fontWeight: 800,
    fontSize: '0.85rem',
    textDecoration: 'none',
    textAlign: 'center',
    fontFamily: 'inherit',
    transition: 'opacity 0.2s',
  },
  downloadBtn: {
    flex: 1,
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '9px 12px',
    borderRadius: 12,
    background: 'rgba(168,85,247,0.1)',
    color: 'var(--text-light)',
    fontWeight: 800,
    fontSize: '0.85rem',
    textDecoration: 'none',
    textAlign: 'center',
    fontFamily: 'inherit',
    border: '1.5px solid rgba(192,132,252,0.2)',
    transition: 'all 0.2s',
  },
  localOnlyBadge: {
    width: '100%',
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '9px 12px',
    borderRadius: 12,
    background: 'rgba(168,85,247,0.08)',
    color: 'var(--text-light)',
    fontWeight: 800,
    fontSize: '0.85rem',
    textAlign: 'center',
    border: '1.5px solid rgba(192,132,252,0.18)',
  },
  note: {
    textAlign: 'center',
    fontSize: '0.78rem',
    color: 'var(--text-light)',
    marginTop: 24,
    opacity: 0.7,
  },
}
