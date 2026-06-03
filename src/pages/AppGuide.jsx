import { Link } from 'react-router-dom'
import { useIsMobile } from '../hooks/useIsMobile'

const SECTIONS = [
  {
    icon: '🧭',
    title: 'Навигация',
    color: '#f472b6',
    items: [
      { icon: '🏠', text: 'Панель снизу — быстрый доступ к главным разделам: главная, уроки, словарный квиз (✨), домашка, кандзи-квиз (漢). Quiz Hub со всеми квизами — через «more».' },
      { icon: '•••', text: 'Кнопка «more» открывает расширенное меню со всеми разделами приложения.' },
      { icon: '📖', text: 'Кнопка с книжкой (правый нижний угол) — мини-словарь. Быстрый поиск по всем словам и кандзи прямо во время занятий. Горячая клавиша: ⌘K.' },
    ],
  },
  {
    icon: '📚',
    title: 'Уроки Минна',
    color: '#a855f7',
    link: '/lessons',
    items: [
      { icon: '🟢', text: 'Зелёная рамка на уроке — ты его открывала. Фиолетовая — прошла квиз на 90%+.' },
      { icon: '漢字', text: 'Кнопка «漢字 — фильтр: только с кандзи» в уроке скрывает слова без иероглифов, оставляя только те, у которых есть кандзи-форма.' },
      { icon: 'かな', text: 'Переключатель かな / 漢字 меняет отображение слов: либо хирагана/катакана, либо иероглифы.' },
      { icon: '🔓', text: 'Уроки 16–25 заблокированы по умолчанию. На странице «Уроки» внизу списка есть кнопка «unlock lesson X» — нажми её, чтобы открывать уроки по одному.' },
    ],
  },
  {
    icon: '🎯',
    title: 'Квизы',
    color: '#f472b6',
    link: '/quiz-hub',
    items: [
      { icon: '⌨️', text: 'В квизах работают горячие клавиши: 1–4 для выбора варианта, ← → для навигации в KanaStudy/KanjiStudy, Пробел — перевернуть карточку в FlashCards.' },
      { icon: '🔁', text: 'После результатов можно повторить только ошибки — кнопка «Retry Mistakes».' },
      { icon: '🎯', text: 'Weak Words Sprint автоматически определяет слова, которые ты чаще всего пропускаешь, и тренирует именно их.' },
      { icon: '🏅', text: 'N5 Quiz — тест по словам уровня JLPT N5, независимо от уроков Минна.' },
    ],
  },
  {
    icon: '🌅',
    title: 'Ежедневный вызов',
    color: '#f59e0b',
    link: '/daily',
    items: [
      { icon: '🔥', text: 'Стрик = количество дней подряд с активностью. Засчитывают любые квизы (словарный, кана, кандзи, грамматика) или Daily Challenge.' },
      { icon: '🧊', text: 'Заморозка стрика — купи на главной странице (панель монет, кнопка «freeze») за 80 монет Сакуры. Максимум 3 заморозки. Если не занималась сегодня — нажми «protect streak» на главной, пока не кончился день.' },
      { icon: '🌸', text: 'Daily Challenge появляется на главной как баннер напоминания, если ты ещё не делала его сегодня.' },
      { icon: '🏆', text: 'Еженедельный вызов — цель на неделю (квизы, перфекты, XP, дни активности). Выполнила — забирай +100 XP бонуса на главной.' },
    ],
  },
  {
    icon: '⭐',
    title: 'XP, уровень и монеты',
    color: '#a855f7',
    link: '/stats',
    items: [
      { icon: '✨', text: 'За каждый квиз начисляется XP. Бонус за идеальный результат (100%). Уровень растёт вместе с XP.' },
      { icon: '🌸', text: 'Монеты Сакуры зарабатываются автоматически вместе с XP. Тратятся на заморозку стрика — панель монет на главной, кнопка «freeze».' },
      { icon: '📈', text: 'Страница «Stats» показывает полную статистику: сколько квизов пройдено, лучшие и сложные уроки, хитмэп активности.' },
    ],
  },
  {
    icon: '✍️',
    title: 'Письмо и чтение',
    color: 'var(--correct-text)',
    link: '/kanji',
    items: [
      { icon: '漢', text: 'KanjiStudy (/kanji) — 250 кандзи из BKB1: количество черт для всех уроков, пошаговое описание порядка черт для уроков 1–10. Карточки уроков показывают лучший результат квиза.' },
      { icon: 'あ', text: 'KanaStudy (/kana) — изучение хираганы и катаканы с анимацией черт. Мини-тест по строке или «test all» для всей категории. Показывает аналог на катакане/хирагане.' },
      { icon: '📊', text: 'KanaChart — таблица всех кана с дакутэн и комбинациями. Клик по ячейке открывает порядок черт в KanaStudy.' },
      { icon: '📰', text: 'Reading Practice — диалоги из уроков с вопросами на понимание.' },
    ],
  },
  {
    icon: '🔧',
    title: 'Инструменты',
    color: '#f472b6',
    link: '/search',
    items: [
      { icon: '🔍', text: 'Поиск (/search) — поиск по всем 1000+ словам, грамматике и кандзи одновременно.' },
      { icon: '📋', text: 'Журнал ошибок — все слова, которые ты пропустила в квизах. Отсюда можно сразу перейти в Weak Words Sprint, чтобы потренировать их.' },
      { icon: '📝', text: 'Домашка — записи с хэштегами. #kanji, #kana и другие автоматически становятся ссылками.' },
      { icon: '📜', text: 'Grammar Explorer — справочник по грамматике с примерами (не квиз). Conjugation Ref — все формы глаголов.' },
      { icon: '📚', text: 'Учебники (/materials) — список учебных материалов. В публичной версии PDF-файлы не публикуются, чтобы не раздавать учебники наружу.' },
    ],
  },
  {
    icon: '⚙️',
    title: 'Настройки',
    color: '#a855f7',
    link: '/settings',
    items: [
      { icon: '🌙', text: 'Тёмная / светлая тема — переключается тоглом в разделе «Appearance».' },
      { icon: 'ふ', text: 'Фуригана — включить/выключить отображение произношения над иероглифами в GrammarPractice.' },
      { icon: '⏱️', text: 'Study Goal — дневная цель в минутах (15 / 30 / 45 / 60). Прогресс видно на главной.' },
      { icon: '🎮', text: 'Поведение квизов — обратный отсчёт 3-2-1, количество вопросов по умолчанию, показывать ли ромадзи в подсказке.' },
      { icon: '💾', text: 'Резервная копия — экспортируй прогресс в JSON и импортируй обратно. Полезно при смене браузера или устройства.' },
      { icon: '🗑️', text: 'Удаление данных — кнопка «delete all» очищает весь прогресс, XP, историю квизов и настройки.' },
    ],
  },
]

export default function AppGuide() {
  const isMobile = useIsMobile()

  return (
    <div className="page animate-fadeInUp">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: 4 }}>
          Знакомство с приложением 🌸
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', ...(isMobile ? { paddingLeft: 54 } : {}) }}>
          Что есть в приложении и как этим пользоваться
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {SECTIONS.map(section => (
          <div key={section.title} className="glass animate-fadeInUp" style={{ padding: '16px 16px 12px', borderRadius: 20 }}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: `${section.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem',
              }}>
                {section.icon}
              </div>
              <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)', flex: 1 }}>
                {section.title}
              </span>
              {section.link && (
                <Link to={section.link} style={{
                  fontSize: '0.72rem', fontWeight: 800, color: section.color,
                  background: `${section.color}15`, padding: '4px 10px',
                  borderRadius: 50, textDecoration: 'none', flexShrink: 0,
                  minHeight: 44, display: 'inline-flex', alignItems: 'center',
                }}>
                  открыть →
                </Link>
              )}
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {section.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(192,132,252,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.9rem', fontWeight: 900, color: section.color,
                  }}>
                    {item.icon}
                  </div>
                  <p style={{
                    fontSize: '0.85rem', color: 'var(--text-light)', lineHeight: 1.5,
                    margin: 0, paddingTop: 6,
                  }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer links */}
      <div style={{ marginTop: 28, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        {[
          { to: '/daily', label: '🌅 Ежедневный вызов' },
          { to: '/quiz-hub', label: '🎯 Все квизы' },
          { to: '/stats', label: '📈 Статистика' },
          { to: '/materials', label: '📚 Учебники' },
          { to: '/settings', label: '⚙️ Настройки' },
        ].map(link => (
          <Link key={link.to} to={link.to} className="glass-sm" style={{
            padding: '10px 16px', borderRadius: 14, textDecoration: 'none',
            fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
