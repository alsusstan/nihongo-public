import { useState, useEffect, useCallback, useMemo } from 'react'
import { getStoredJson, setStoredJson } from '../utils/localSettings'

const STORAGE_KEY = 'nihongo-achievements'

/**
 * Achievement definitions.
 * Each has: id, title, description, icon, condition(stats).
 * Stats object shape:
 *   { totalQuizzes, vocabQuizCount, kanaQuizCount, kanjiQuizCount, grammarQuizCount, streak, bestVocabScore, bestKanaScore,
 *     lessonsViewedCount, totalXP, level, totalWords, perfectScores, difficultWordsCleared }
 */
const ACHIEVEMENTS = [
  // Getting started
  { id: 'first_quiz', title: 'first steps', titleJp: 'はじめの一歩', icon: '🌱', description: 'complete your first quiz', condition: s => s.totalQuizzes >= 1 },
  { id: 'five_quizzes', title: 'warming up', titleJp: 'ウォーミングアップ', icon: '🔥', description: 'complete 5 quizzes', condition: s => s.totalQuizzes >= 5 },
  { id: 'ten_quizzes', title: 'getting serious', titleJp: '本気モード', icon: '💪', description: 'complete 10 quizzes', condition: s => s.totalQuizzes >= 10 },
  { id: 'twenty_five_quizzes', title: 'quiz machine', titleJp: 'クイズマシン', icon: '⚡', description: 'complete 25 quizzes', condition: s => s.totalQuizzes >= 25 },
  { id: 'fifty_quizzes', title: 'unstoppable', titleJp: '止まらない', icon: '🚀', description: 'complete 50 quizzes', condition: s => s.totalQuizzes >= 50 },
  { id: 'hundred_quizzes', title: 'centurion', titleJp: '百人力', icon: '👑', description: 'complete 100 quizzes', condition: s => s.totalQuizzes >= 100 },

  // Perfection
  { id: 'first_perfect', title: 'perfect!', titleJp: 'パーフェクト', icon: '✨', description: 'get 100% on any quiz', condition: s => s.perfectScores >= 1 },
  { id: 'five_perfects', title: 'perfectionist', titleJp: '完璧主義', icon: '💎', description: 'get 100% on 5 quizzes', condition: s => s.perfectScores >= 5 },
  { id: 'ten_perfects', title: 'flawless', titleJp: '完全無欠', icon: '🏆', description: 'get 100% on 10 quizzes', condition: s => s.perfectScores >= 10 },

  // Streaks
  { id: 'streak_3', title: '3-day streak', titleJp: '三日坊主じゃない', icon: '🔥', description: 'study 3 days in a row', condition: s => s.streak >= 3 },
  { id: 'streak_7', title: 'weekly warrior', titleJp: '一週間戦士', icon: '⭐', description: 'study 7 days in a row', condition: s => s.streak >= 7 },
  { id: 'streak_14', title: 'two-week titan', titleJp: '二週間の達人', icon: '🌟', description: 'study 14 days in a row', condition: s => s.streak >= 14 },
  { id: 'streak_30', title: 'monthly master', titleJp: '月間マスター', icon: '🏅', description: 'study 30 days in a row', condition: s => s.streak >= 30 },

  // Lessons
  { id: 'first_lesson', title: 'curious mind', titleJp: '好奇心旺盛', icon: '📖', description: 'view your first lesson', condition: s => s.lessonsViewedCount >= 1 },
  { id: 'five_lessons', title: 'studious', titleJp: '勉強家', icon: '📚', description: 'view 5 lessons', condition: s => s.lessonsViewedCount >= 5 },
  { id: 'ten_lessons', title: 'bookworm', titleJp: '本の虫', icon: '🐛', description: 'view 10 lessons', condition: s => s.lessonsViewedCount >= 10 },
  { id: 'all_lessons', title: 'completionist', titleJp: 'コンプリート', icon: '🎓', description: 'view all available lessons', condition: s => s.lessonsViewedCount >= s.totalLessons && s.totalLessons > 0 },

  // XP milestones
  { id: 'xp_100', title: 'first hundred', titleJp: '百XP', icon: '💫', description: 'earn 100 XP', condition: s => s.totalXP >= 100 },
  { id: 'xp_500', title: 'XP collector', titleJp: 'XPコレクター', icon: '⚡', description: 'earn 500 XP', condition: s => s.totalXP >= 500 },
  { id: 'xp_1000', title: 'XP hunter', titleJp: 'XPハンター', icon: '🎯', description: 'earn 1,000 XP', condition: s => s.totalXP >= 1000 },
  { id: 'xp_5000', title: 'XP legend', titleJp: 'XPレジェンド', icon: '🌸', description: 'earn 5,000 XP', condition: s => s.totalXP >= 5000 },

  // Level milestones
  { id: 'level_5', title: 'student', titleJp: '生徒', icon: '🎒', description: 'reach level 5', condition: s => s.level >= 5 },
  { id: 'level_10', title: 'apprentice', titleJp: '見習い', icon: '🧑‍🎓', description: 'reach level 10', condition: s => s.level >= 10 },
  { id: 'level_20', title: 'scholar', titleJp: '学者', icon: '🎓', description: 'reach level 20', condition: s => s.level >= 20 },

  // Vocab mastery
  { id: 'vocab_90', title: 'vocab ace', titleJp: '語彙エース', icon: '📝', description: 'score 90%+ on a vocab quiz', condition: s => s.bestVocabScore >= 90 },
  { id: 'kana_90', title: 'kana master', titleJp: 'かなマスター', icon: '🅰️', description: 'score 90%+ on a kana quiz', condition: s => s.bestKanaScore >= 90 },

  // Weak words
  { id: 'clear_weak', title: 'no weaknesses', titleJp: '弱点なし', icon: '💪', description: 'clear all difficult words', condition: s => s.difficultWordsCleared === true },

  // Quiz variety
  { id: 'try_vocab', title: 'word explorer', titleJp: '言葉探検家', icon: '📝', description: 'complete a vocab quiz', condition: s => s.vocabQuizCount >= 1 },
  { id: 'try_kana', title: 'kana rookie', titleJp: 'かな初心者', icon: 'あ', description: 'complete a kana quiz', condition: s => s.kanaQuizCount >= 1 },
  { id: 'try_kanji', title: 'kanji curious', titleJp: '漢字好き', icon: '漢', description: 'complete a kanji quiz', condition: s => s.kanjiQuizCount >= 1 },
  { id: 'try_grammar', title: 'grammar rookie', titleJp: '文法初心者', icon: '文', description: 'complete a grammar quiz', condition: s => s.grammarQuizCount >= 1 },
  { id: 'vocab_20', title: 'word warrior', titleJp: '言葉の戦士', icon: '⚔️', description: 'complete 20 vocab quizzes', condition: s => s.vocabQuizCount >= 20 },
  { id: 'kana_20', title: 'kana sensei', titleJp: 'かな先生', icon: '🎌', description: 'complete 20 kana quizzes', condition: s => s.kanaQuizCount >= 20 },
  { id: 'kanji_20', title: 'kanji scholar', titleJp: '漢字学者', icon: '🖌️', description: 'complete 20 kanji quizzes', condition: s => s.kanjiQuizCount >= 20 },
  { id: 'grammar_20', title: 'grammar guru', titleJp: '文法の達人', icon: '📐', description: 'complete 20 grammar quizzes', condition: s => s.grammarQuizCount >= 20 },

  // More quiz milestones
  { id: 'two_hundred_quizzes', title: 'quiz legend', titleJp: 'クイズ伝説', icon: '🐉', description: 'complete 200 quizzes', condition: s => s.totalQuizzes >= 200 },
  { id: 'five_hundred_quizzes', title: 'quiz god', titleJp: 'クイズの神', icon: '⛩️', description: 'complete 500 quizzes', condition: s => s.totalQuizzes >= 500 },

  // More perfects
  { id: 'twenty_perfects', title: 'diamond mind', titleJp: 'ダイヤモンド', icon: '💠', description: 'get 100% on 20 quizzes', condition: s => s.perfectScores >= 20 },
  { id: 'fifty_perfects', title: 'perfect master', titleJp: '完璧マスター', icon: '🌟', description: 'get 100% on 50 quizzes', condition: s => s.perfectScores >= 50 },

  // More streaks
  { id: 'streak_60', title: 'two-month hero', titleJp: '二ヶ月の英雄', icon: '🦸', description: 'study 60 days in a row', condition: s => s.streak >= 60 },
  { id: 'streak_100', title: 'hundred days', titleJp: '百日達成', icon: '💯', description: 'study 100 days in a row', condition: s => s.streak >= 100 },
  { id: 'streak_365', title: 'year of nihongo', titleJp: '日本語の年', icon: '🎆', description: 'study 365 days in a row', condition: s => s.streak >= 365 },

  // More XP
  { id: 'xp_2000', title: 'XP warrior', titleJp: 'XP戦士', icon: '🗡️', description: 'earn 2,000 XP', condition: s => s.totalXP >= 2000 },
  { id: 'xp_10000', title: 'XP master', titleJp: 'XPマスター', icon: '🔮', description: 'earn 10,000 XP', condition: s => s.totalXP >= 10000 },
  { id: 'xp_25000', title: 'XP emperor', titleJp: 'XP皇帝', icon: '👸', description: 'earn 25,000 XP', condition: s => s.totalXP >= 25000 },

  // More levels
  { id: 'level_3', title: 'beginner', titleJp: '初心者', icon: '🌱', description: 'reach level 3', condition: s => s.level >= 3 },
  { id: 'level_15', title: 'advanced', titleJp: '上級者', icon: '🎯', description: 'reach level 15', condition: s => s.level >= 15 },
  { id: 'level_30', title: 'grandmaster', titleJp: '大師匠', icon: '🐲', description: 'reach level 30', condition: s => s.level >= 30 },
  { id: 'level_50', title: 'nihongo sage', titleJp: '日本語の賢者', icon: '🧙', description: 'reach level 50', condition: s => s.level >= 50 },

  // Lessons milestones
  { id: 'fifteen_lessons', title: 'dedicated', titleJp: '献身的', icon: '🔥', description: 'view 15 lessons', condition: s => s.lessonsViewedCount >= 15 },
  { id: 'twenty_lessons', title: 'lesson master', titleJp: 'レッスンマスター', icon: '🏛️', description: 'view 20 lessons', condition: s => s.lessonsViewedCount >= 20 },

  // Score milestones
  { id: 'vocab_perfect', title: 'vocab genius', titleJp: '語彙の天才', icon: '🧠', description: 'score 100% on a vocab quiz', condition: s => s.bestVocabScore >= 100 },
  { id: 'kana_perfect', title: 'kana genius', titleJp: 'かなの天才', icon: '✍️', description: 'score 100% on a kana quiz', condition: s => s.bestKanaScore >= 100 },

  // Fun / hidden
  { id: 'night_owl', title: 'night owl', titleJp: '夜更かし', icon: '🦉', description: 'study after midnight', condition: s => s.nightStudy === true },
  { id: 'early_bird', title: 'early bird', titleJp: '早起き', icon: '🐦', description: 'study before 7am', condition: s => s.earlyStudy === true },
  { id: 'weekend_warrior', title: 'weekend warrior', titleJp: '週末戦士', icon: '🛡️', description: 'study on a weekend', condition: s => s.weekendStudy === true },
]

function loadAchievements() {
  const parsed = getStoredJson(STORAGE_KEY, null)
  if (!parsed || typeof parsed !== 'object') {
    return { unlocked: {}, newBadges: [] }
  }
  return {
    unlocked: parsed && typeof parsed.unlocked === 'object' && !Array.isArray(parsed.unlocked) ? parsed.unlocked : {},
    newBadges: Array.isArray(parsed?.newBadges) ? parsed.newBadges : [],
  }
}

function saveAchievements(data) {
  setStoredJson(STORAGE_KEY, data)
}

/**
 * Hook for tracking achievements/badges.
 * Pass in stats from other hooks to check conditions.
 */
export function useAchievements(stats) {
  const [data, setData] = useState(loadAchievements)

  // Check for newly unlocked achievements whenever stats change
  useEffect(() => {
    if (!stats) return

    const current = loadAchievements()
    let changed = false
    const newBadges = [...(current.newBadges || [])]
    const newlyUnlocked = []

    ACHIEVEMENTS.forEach(achievement => {
      if (current.unlocked[achievement.id]) return
      try {
        if (achievement.condition(stats)) {
          current.unlocked[achievement.id] = new Date().toISOString()
          newBadges.push(achievement.id)
          newlyUnlocked.push(achievement.id)
          changed = true
        }
      } catch {
        // condition check failed, skip
      }
    })

    if (!changed) return

    current.newBadges = newBadges
    saveAchievements(current)
    setData({ ...current })

    // dispatch one toast per newly unlocked badge
    const timers = []
    newlyUnlocked.forEach((id, i) => {
      const badge = ACHIEVEMENTS.find(a => a.id === id)
      if (badge) {
        timers.push(setTimeout(() => {
          window.dispatchEvent(new CustomEvent('nihongo-achievement', {
            detail: { badge },
          }))
        }, i * 600))
      }
    })
    return () => timers.forEach(t => clearTimeout(t))
  }, [stats])

  // Persist whenever data changes
  useEffect(() => {
    saveAchievements(data)
  }, [data])

  const clearNewBadges = useCallback(() => {
    setData(prev => {
      const updated = { ...prev, newBadges: [] }
      saveAchievements(updated)
      return updated
    })
  }, [])

  const achievements = useMemo(() => {
    return ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: !!data.unlocked[a.id],
      unlockedAt: data.unlocked[a.id] || null,
      isNew: (data.newBadges || []).includes(a.id),
    }))
  }, [data])

  const unlockedCount = useMemo(() =>
    Object.keys(data.unlocked).length
  , [data])

  return {
    achievements,
    unlockedCount,
    totalCount: ACHIEVEMENTS.length,
    newBadgeCount: (data.newBadges || []).length,
    clearNewBadges,
  }
}

export { ACHIEVEMENTS }
