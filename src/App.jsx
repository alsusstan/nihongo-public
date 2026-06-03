import { Routes, Route, useLocation, Link } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import Navbar from './components/Navbar'
import FloatingDeco from './components/FloatingDeco'
import FallingItems from './components/FallingItems'
import PeekingCharacter from './components/PeekingCharacter'
import MiniDictionary from './components/MiniDictionary'
import XPToast from './components/XPToast'
import { useStudyTimer } from './hooks/useStudyTimer'
import { useWeeklyChallenge } from './hooks/useWeeklyChallenge'
import { prefersReducedMotion as getPrefersReducedMotion } from './utils/motion'

// Eagerly load Home (landing page)
import Home from './pages/Home'

const prefersReducedMotion = getPrefersReducedMotion()

// Lazy load all other pages
const Lessons = lazy(() => import('./pages/Lessons'))
const LessonDetail = lazy(() => import('./pages/LessonDetail'))
const VocabQuiz = lazy(() => import('./pages/VocabQuiz'))
const KanaQuiz = lazy(() => import('./pages/KanaQuiz'))
const KanjiQuiz = lazy(() => import('./pages/KanjiQuiz'))
const GrammarQuiz = lazy(() => import('./pages/GrammarQuiz'))
const TeFormQuiz = lazy(() => import('./pages/TeFormQuiz'))
const KanjiStudy = lazy(() => import('./pages/KanjiStudy'))
const Homework = lazy(() => import('./pages/Homework'))
const FlashCards = lazy(() => import('./pages/FlashCards'))
const VocabSearch = lazy(() => import('./pages/VocabSearch'))
const MistakesJournal = lazy(() => import('./pages/MistakesJournal'))
const ParticleQuiz = lazy(() => import('./pages/ParticleQuiz'))
const GrammarPractice = lazy(() => import('./pages/GrammarPractice'))
const NumberQuiz = lazy(() => import('./pages/NumberQuiz'))
const KanaStudy = lazy(() => import('./pages/KanaStudy'))
const KanaChart = lazy(() => import('./pages/KanaChart'))
const MatchingGame = lazy(() => import('./pages/MatchingGame'))
const Settings = lazy(() => import('./pages/Settings'))
const ConjugationRef = lazy(() => import('./pages/ConjugationRef'))
const TypingChallenge = lazy(() => import('./pages/TypingChallenge'))
const AdjectiveQuiz = lazy(() => import('./pages/AdjectiveQuiz'))
const SentenceBuilder = lazy(() => import('./pages/SentenceBuilder'))
const KanjiPractice = lazy(() => import('./pages/KanjiPractice'))
const Stats = lazy(() => import('./pages/Stats'))
const ReadingPractice = lazy(() => import('./pages/ReadingPractice'))
const CounterQuiz = lazy(() => import('./pages/CounterQuiz'))
const DailyChallenge = lazy(() => import('./pages/DailyChallenge'))
const ConjugationQuiz = lazy(() => import('./pages/ConjugationQuiz'))
const GrammarExplorer = lazy(() => import('./pages/GrammarExplorer'))
const WeakWordsSprint = lazy(() => import('./pages/WeakWordsSprint'))
const N5Quiz = lazy(() => import('./pages/N5Quiz'))
const Materials = lazy(() => import('./pages/Materials'))
const QuizHub = lazy(() => import('./pages/QuizHub'))
const AppGuide = lazy(() => import('./pages/AppGuide'))
const FuriganaQuiz = lazy(() => import('./pages/FuriganaQuiz'))

function NotFound() {
  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="glass animate-fadeInUp" style={{ textAlign: 'center', padding: 32, maxWidth: 340 }}>
        <div style={{ fontSize: '3rem', marginBottom: 8 }}>🐱</div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>
          nyan~ page not found
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: 16 }}>
          this page doesn't exist... gomen ne!
        </p>
        <Link to="/" className="btn btn-cute">home 🏠</Link>
      </div>
    </div>
  )
}

function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', fontSize: '1.2rem', color: 'var(--text-light)', fontWeight: 700,
    }}>
      <span style={{ animation: prefersReducedMotion ? undefined : 'float 2s ease-in-out infinite' }}>loading... 🌸</span>
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function App() {
  // Keep study timer ticking on every page (not just Home/Settings/Stats)
  useStudyTimer()
  // Keep weekly challenge tracking active on every page (event listener always mounted)
  useWeeklyChallenge()
  const location = useLocation()
  const isStudyPage = location.pathname.startsWith('/quiz/') ||
    location.pathname.startsWith('/lessons/') ||
    ['/daily', '/game/matching', '/game/typing', '/typing', '/reading', '/review',
     '/kanji/practice', '/kanji', '/kana', '/kana-chart', '/grammar',
     '/conjugation', '/quiz-hub', '/search', '/game/sentence', '/sprint'].includes(location.pathname)

  return (
    <>
      <ScrollToTop />
      <FallingItems />
      <FloatingDeco isHome={location.pathname === '/'} />
      {isStudyPage && <PeekingCharacter />}
      <Navbar />
      <MiniDictionary />
      <XPToast />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/lessons/:id" element={<LessonDetail />} />
          <Route path="/quiz/vocab" element={<VocabQuiz />} />
          <Route path="/quiz/kana" element={<KanaQuiz />} />
          <Route path="/quiz/kanji" element={<KanjiQuiz />} />
          <Route path="/quiz/grammar" element={<GrammarQuiz />} />
          <Route path="/quiz/te-form" element={<TeFormQuiz />} />
          <Route path="/kanji" element={<KanjiStudy />} />
          <Route path="/homework" element={<Homework />} />
          <Route path="/review" element={<FlashCards />} />
          <Route path="/search" element={<VocabSearch />} />
          <Route path="/mistakes" element={<MistakesJournal />} />
          <Route path="/quiz/particles" element={<ParticleQuiz />} />
          <Route path="/quiz/fill-in" element={<GrammarPractice />} />
          <Route path="/quiz/numbers" element={<NumberQuiz />} />
          <Route path="/kana" element={<KanaStudy />} />
          <Route path="/kana-chart" element={<KanaChart />} />
          <Route path="/game/matching" element={<MatchingGame />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/conjugation" element={<ConjugationRef />} />
          <Route path="/game/typing" element={<TypingChallenge />} />
          <Route path="/typing" element={<TypingChallenge />} />
          <Route path="/quiz/adjectives" element={<AdjectiveQuiz />} />
          <Route path="/quiz/sentences" element={<SentenceBuilder />} />
          <Route path="/game/sentence" element={<SentenceBuilder />} />
          <Route path="/kanji/practice" element={<KanjiPractice />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/reading" element={<ReadingPractice />} />
          <Route path="/quiz/counters" element={<CounterQuiz />} />
          <Route path="/daily" element={<DailyChallenge />} />
          <Route path="/quiz/conjugation" element={<ConjugationQuiz />} />
          <Route path="/grammar" element={<GrammarExplorer />} />
          <Route path="/quiz/weak" element={<WeakWordsSprint />} />
          <Route path="/sprint" element={<WeakWordsSprint />} />
          <Route path="/quiz/n5" element={<N5Quiz />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/quiz-hub" element={<QuizHub />} />
          <Route path="/guide" element={<AppGuide />} />
          <Route path="/quiz/furigana" element={<FuriganaQuiz />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
