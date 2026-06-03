import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useXP } from '../hooks/useXP'
import { useProgress } from '../hooks/useProgress'
import { useIsMobile, useIsTablet } from '../hooks/useIsMobile'
import { useUnlockedLessons } from '../hooks/useUnlockedLessons'
import ShareResult from '../components/ShareResult'
import QuizCountdown from '../components/QuizCountdown'
import Confetti from '../components/Confetti'
import { getStoredQuizSize } from '../utils/localSettings'
import { getTrackedLessons } from '../utils/lessonProgress'
import { prefersReducedMotion as getPrefersReducedMotion } from '../utils/motion'

const prefersReducedMotion = getPrefersReducedMotion()

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// =====================
// ADJECTIVE DATA
// =====================

const iAdjectives = [
  {
    japanese: '大きい', romaji: 'ookii', meaning: 'big', lesson: 8,
    forms: {
      presentAff: 'おおきいです', presentNeg: 'おおきくないです',
      pastAff: 'おおきかったです', pastNeg: 'おおきくなかったです',
      adverb: 'おおきく', teForm: 'おおきくて',
    },
  },
  {
    japanese: '小さい', romaji: 'chiisai', meaning: 'small', lesson: 8,
    forms: {
      presentAff: 'ちいさいです', presentNeg: 'ちいさくないです',
      pastAff: 'ちいさかったです', pastNeg: 'ちいさくなかったです',
      adverb: 'ちいさく', teForm: 'ちいさくて',
    },
  },
  {
    japanese: '高い', romaji: 'takai', meaning: 'expensive / tall', lesson: 8,
    forms: {
      presentAff: 'たかいです', presentNeg: 'たかくないです',
      pastAff: 'たかかったです', pastNeg: 'たかくなかったです',
      adverb: 'たかく', teForm: 'たかくて',
    },
  },
  {
    japanese: '安い', romaji: 'yasui', meaning: 'cheap', lesson: 8,
    forms: {
      presentAff: 'やすいです', presentNeg: 'やすくないです',
      pastAff: 'やすかったです', pastNeg: 'やすくなかったです',
      adverb: 'やすく', teForm: 'やすくて',
    },
  },
  {
    japanese: '新しい', romaji: 'atarashii', meaning: 'new', lesson: 8,
    forms: {
      presentAff: 'あたらしいです', presentNeg: 'あたらしくないです',
      pastAff: 'あたらしかったです', pastNeg: 'あたらしくなかったです',
      adverb: 'あたらしく', teForm: 'あたらしくて',
    },
  },
  {
    japanese: '古い', romaji: 'furui', meaning: 'old (things)', lesson: 8,
    forms: {
      presentAff: 'ふるいです', presentNeg: 'ふるくないです',
      pastAff: 'ふるかったです', pastNeg: 'ふるくなかったです',
      adverb: 'ふるく', teForm: 'ふるくて',
    },
  },
  {
    japanese: 'いい', romaji: 'ii', meaning: 'good', lesson: 8,
    irregular: true,
    forms: {
      presentAff: 'いいです', presentNeg: 'よくないです',
      pastAff: 'よかったです', pastNeg: 'よくなかったです',
      adverb: 'よく', teForm: 'よくて',
    },
  },
  {
    japanese: '暑い', romaji: 'atsui', meaning: 'hot (weather)', lesson: 8,
    forms: {
      presentAff: 'あついです', presentNeg: 'あつくないです',
      pastAff: 'あつかったです', pastNeg: 'あつくなかったです',
      adverb: 'あつく', teForm: 'あつくて',
    },
  },
  {
    japanese: '寒い', romaji: 'samui', meaning: 'cold (weather)', lesson: 8,
    forms: {
      presentAff: 'さむいです', presentNeg: 'さむくないです',
      pastAff: 'さむかったです', pastNeg: 'さむくなかったです',
      adverb: 'さむく', teForm: 'さむくて',
    },
  },
  {
    japanese: '難しい', romaji: 'muzukashii', meaning: 'difficult', lesson: 8,
    forms: {
      presentAff: 'むずかしいです', presentNeg: 'むずかしくないです',
      pastAff: 'むずかしかったです', pastNeg: 'むずかしくなかったです',
      adverb: 'むずかしく', teForm: 'むずかしくて',
    },
  },
  {
    japanese: 'やさしい', romaji: 'yasashii', meaning: 'easy / kind', lesson: 8,
    forms: {
      presentAff: 'やさしいです', presentNeg: 'やさしくないです',
      pastAff: 'やさしかったです', pastNeg: 'やさしくなかったです',
      adverb: 'やさしく', teForm: 'やさしくて',
    },
  },
  {
    japanese: 'おもしろい', romaji: 'omoshiroi', meaning: 'interesting', lesson: 8,
    forms: {
      presentAff: 'おもしろいです', presentNeg: 'おもしろくないです',
      pastAff: 'おもしろかったです', pastNeg: 'おもしろくなかったです',
      adverb: 'おもしろく', teForm: 'おもしろくて',
    },
  },
  {
    japanese: 'つまらない', romaji: 'tsumaranai', meaning: 'boring', lesson: 8,
    forms: {
      presentAff: 'つまらないです', presentNeg: 'つまらなくないです',
      pastAff: 'つまらなかったです', pastNeg: 'つまらなくなかったです',
      adverb: 'つまらなく', teForm: 'つまらなくて',
    },
  },
  {
    japanese: '忙しい', romaji: 'isogashii', meaning: 'busy', lesson: 8,
    forms: {
      presentAff: 'いそがしいです', presentNeg: 'いそがしくないです',
      pastAff: 'いそがしかったです', pastNeg: 'いそがしくなかったです',
      adverb: 'いそがしく', teForm: 'いそがしくて',
    },
  },
  {
    japanese: '近い', romaji: 'chikai', meaning: 'near', lesson: 12,
    forms: {
      presentAff: 'ちかいです', presentNeg: 'ちかくないです',
      pastAff: 'ちかかったです', pastNeg: 'ちかくなかったです',
      adverb: 'ちかく', teForm: 'ちかくて',
    },
  },
  {
    japanese: '遠い', romaji: 'tooi', meaning: 'far', lesson: 12,
    forms: {
      presentAff: 'とおいです', presentNeg: 'とおくないです',
      pastAff: 'とおかったです', pastNeg: 'とおくなかったです',
      adverb: 'とおく', teForm: 'とおくて',
    },
  },
  {
    japanese: '早い', romaji: 'hayai', meaning: 'early / fast', lesson: 12,
    forms: {
      presentAff: 'はやいです', presentNeg: 'はやくないです',
      pastAff: 'はやかったです', pastNeg: 'はやくなかったです',
      adverb: 'はやく', teForm: 'はやくて',
    },
  },
  {
    japanese: '遅い', romaji: 'osoi', meaning: 'late / slow', lesson: 12,
    forms: {
      presentAff: 'おそいです', presentNeg: 'おそくないです',
      pastAff: 'おそかったです', pastNeg: 'おそくなかったです',
      adverb: 'おそく', teForm: 'おそくて',
    },
  },
  {
    japanese: '多い', romaji: 'ooi', meaning: 'many', lesson: 12,
    forms: {
      presentAff: 'おおいです', presentNeg: 'おおくないです',
      pastAff: 'おおかったです', pastNeg: 'おおくなかったです',
      adverb: 'おおく', teForm: 'おおくて',
    },
  },
  {
    japanese: '少ない', romaji: 'sukunai', meaning: 'few', lesson: 12,
    forms: {
      presentAff: 'すくないです', presentNeg: 'すくなくないです',
      pastAff: 'すくなかったです', pastNeg: 'すくなくなかったです',
      adverb: 'すくなく', teForm: 'すくなくて',
    },
  },
  {
    japanese: '悪い', romaji: 'warui', meaning: 'bad', lesson: 8,
    forms: {
      presentAff: 'わるいです', presentNeg: 'わるくないです',
      pastAff: 'わるかったです', pastNeg: 'わるくなかったです',
      adverb: 'わるく', teForm: 'わるくて',
    },
  },
  {
    japanese: '冷たい', romaji: 'tsumetai', meaning: 'cold (things)', lesson: 8,
    forms: {
      presentAff: 'つめたいです', presentNeg: 'つめたくないです',
      pastAff: 'つめたかったです', pastNeg: 'つめたくなかったです',
      adverb: 'つめたく', teForm: 'つめたくて',
    },
  },
  {
    japanese: '楽しい', romaji: 'tanoshii', meaning: 'fun / enjoyable', lesson: 8,
    forms: {
      presentAff: 'たのしいです', presentNeg: 'たのしくないです',
      pastAff: 'たのしかったです', pastNeg: 'たのしくなかったです',
      adverb: 'たのしく', teForm: 'たのしくて',
    },
  },
  {
    japanese: 'おいしい', romaji: 'oishii', meaning: 'delicious', lesson: 8,
    forms: {
      presentAff: 'おいしいです', presentNeg: 'おいしくないです',
      pastAff: 'おいしかったです', pastNeg: 'おいしくなかったです',
      adverb: 'おいしく', teForm: 'おいしくて',
    },
  },
  {
    japanese: '白い', romaji: 'shiroi', meaning: 'white', lesson: 8,
    forms: {
      presentAff: 'しろいです', presentNeg: 'しろくないです',
      pastAff: 'しろかったです', pastNeg: 'しろくなかったです',
      adverb: 'しろく', teForm: 'しろくて',
    },
  },
  {
    japanese: '黒い', romaji: 'kuroi', meaning: 'black', lesson: 8,
    forms: {
      presentAff: 'くろいです', presentNeg: 'くろくないです',
      pastAff: 'くろかったです', pastNeg: 'くろくなかったです',
      adverb: 'くろく', teForm: 'くろくて',
    },
  },
  {
    japanese: '赤い', romaji: 'akai', meaning: 'red', lesson: 8,
    forms: {
      presentAff: 'あかいです', presentNeg: 'あかくないです',
      pastAff: 'あかかったです', pastNeg: 'あかくなかったです',
      adverb: 'あかく', teForm: 'あかくて',
    },
  },
  {
    japanese: '青い', romaji: 'aoi', meaning: 'blue', lesson: 8,
    forms: {
      presentAff: 'あおいです', presentNeg: 'あおくないです',
      pastAff: 'あおかったです', pastNeg: 'あおくなかったです',
      adverb: 'あおく', teForm: 'あおくて',
    },
  },
  {
    japanese: '低い', romaji: 'hikui', meaning: 'low', lesson: 8,
    forms: {
      presentAff: 'ひくいです', presentNeg: 'ひくくないです',
      pastAff: 'ひくかったです', pastNeg: 'ひくくなかったです',
      adverb: 'ひくく', teForm: 'ひくくて',
    },
  },
  {
    japanese: '暖かい', romaji: 'atatakai', meaning: 'warm', lesson: 12,
    forms: {
      presentAff: 'あたたかいです', presentNeg: 'あたたかくないです',
      pastAff: 'あたたかかったです', pastNeg: 'あたたかくなかったです',
      adverb: 'あたたかく', teForm: 'あたたかくて',
    },
  },
  {
    japanese: '涼しい', romaji: 'suzushii', meaning: 'cool (weather)', lesson: 12,
    forms: {
      presentAff: 'すずしいです', presentNeg: 'すずしくないです',
      pastAff: 'すずしかったです', pastNeg: 'すずしくなかったです',
      adverb: 'すずしく', teForm: 'すずしくて',
    },
  },
  {
    japanese: '甘い', romaji: 'amai', meaning: 'sweet', lesson: 12,
    forms: {
      presentAff: 'あまいです', presentNeg: 'あまくないです',
      pastAff: 'あまかったです', pastNeg: 'あまくなかったです',
      adverb: 'あまく', teForm: 'あまくて',
    },
  },
  {
    japanese: '辛い', romaji: 'karai', meaning: 'spicy / hot (taste)', lesson: 12,
    forms: {
      presentAff: 'からいです', presentNeg: 'からくないです',
      pastAff: 'からかったです', pastNeg: 'からくなかったです',
      adverb: 'からく', teForm: 'からくて',
    },
  },
  {
    japanese: '重い', romaji: 'omoi', meaning: 'heavy', lesson: 12,
    forms: {
      presentAff: 'おもいです', presentNeg: 'おもくないです',
      pastAff: 'おもかったです', pastNeg: 'おもくなかったです',
      adverb: 'おもく', teForm: 'おもくて',
    },
  },
  {
    japanese: '軽い', romaji: 'karui', meaning: 'light (weight)', lesson: 12,
    forms: {
      presentAff: 'かるいです', presentNeg: 'かるくないです',
      pastAff: 'かるかったです', pastNeg: 'かるくなかったです',
      adverb: 'かるく', teForm: 'かるくて',
    },
  },
  {
    japanese: '広い', romaji: 'hiroi', meaning: 'wide / spacious', lesson: 13,
    forms: {
      presentAff: 'ひろいです', presentNeg: 'ひろくないです',
      pastAff: 'ひろかったです', pastNeg: 'ひろくなかったです',
      adverb: 'ひろく', teForm: 'ひろくて',
    },
  },
  {
    japanese: '狭い', romaji: 'semai', meaning: 'narrow / cramped', lesson: 13,
    forms: {
      presentAff: 'せまいです', presentNeg: 'せまくないです',
      pastAff: 'せまかったです', pastNeg: 'せまくなかったです',
      adverb: 'せまく', teForm: 'せまくて',
    },
  },
  {
    japanese: '若い', romaji: 'wakai', meaning: 'young', lesson: 16,
    forms: {
      presentAff: 'わかいです', presentNeg: 'わかくないです',
      pastAff: 'わかかったです', pastNeg: 'わかくなかったです',
      adverb: 'わかく', teForm: 'わかくて',
    },
  },
  {
    japanese: '長い', romaji: 'nagai', meaning: 'long', lesson: 16,
    forms: {
      presentAff: 'ながいです', presentNeg: 'ながくないです',
      pastAff: 'ながかったです', pastNeg: 'ながくなかったです',
      adverb: 'ながく', teForm: 'ながくて',
    },
  },
  {
    japanese: '短い', romaji: 'mijikai', meaning: 'short', lesson: 16,
    forms: {
      presentAff: 'みじかいです', presentNeg: 'みじかくないです',
      pastAff: 'みじかかったです', pastNeg: 'みじかくなかったです',
      adverb: 'みじかく', teForm: 'みじかくて',
    },
  },
  {
    japanese: '明るい', romaji: 'akarui', meaning: 'bright', lesson: 16,
    forms: {
      presentAff: 'あかるいです', presentNeg: 'あかるくないです',
      pastAff: 'あかるかったです', pastNeg: 'あかるくなかったです',
      adverb: 'あかるく', teForm: 'あかるくて',
    },
  },
  {
    japanese: '暗い', romaji: 'kurai', meaning: 'dark', lesson: 16,
    forms: {
      presentAff: 'くらいです', presentNeg: 'くらくないです',
      pastAff: 'くらかったです', pastNeg: 'くらくなかったです',
      adverb: 'くらく', teForm: 'くらくて',
    },
  },
  {
    japanese: '危ない', romaji: 'abunai', meaning: 'dangerous', lesson: 17,
    forms: {
      presentAff: 'あぶないです', presentNeg: 'あぶなくないです',
      pastAff: 'あぶなかったです', pastNeg: 'あぶなくなかったです',
      adverb: 'あぶなく', teForm: 'あぶなくて',
    },
  },
  {
    japanese: '眠い', romaji: 'nemui', meaning: 'sleepy', lesson: 19,
    forms: {
      presentAff: 'ねむいです', presentNeg: 'ねむくないです',
      pastAff: 'ねむかったです', pastNeg: 'ねむくなかったです',
      adverb: 'ねむく', teForm: 'ねむくて',
    },
  },
  {
    japanese: '強い', romaji: 'tsuyoi', meaning: 'strong', lesson: 19,
    forms: {
      presentAff: 'つよいです', presentNeg: 'つよくないです',
      pastAff: 'つよかったです', pastNeg: 'つよくなかったです',
      adverb: 'つよく', teForm: 'つよくて',
    },
  },
  {
    japanese: '弱い', romaji: 'yowai', meaning: 'weak', lesson: 19,
    forms: {
      presentAff: 'よわいです', presentNeg: 'よわくないです',
      pastAff: 'よわかったです', pastNeg: 'よわくなかったです',
      adverb: 'よわく', teForm: 'よわくて',
    },
  },
  {
    japanese: 'すごい', romaji: 'sugoi', meaning: 'amazing / wow', lesson: 21,
    forms: {
      presentAff: 'すごいです', presentNeg: 'すごくないです',
      pastAff: 'すごかったです', pastNeg: 'すごくなかったです',
      adverb: 'すごく', teForm: 'すごくて',
    },
  },
  {
    japanese: '寂しい', romaji: 'sabishii', meaning: 'lonely / sad', lesson: 23,
    forms: {
      presentAff: 'さびしいです', presentNeg: 'さびしくないです',
      pastAff: 'さびしかったです', pastNeg: 'さびしくなかったです',
      adverb: 'さびしく', teForm: 'さびしくて',
    },
  },
]

const naAdjectives = [
  {
    japanese: '静か', romaji: 'shizuka', meaning: 'quiet', lesson: 8,
    forms: {
      presentAff: 'しずかです', presentNeg: 'しずかじゃないです',
      pastAff: 'しずかでした', pastNeg: 'しずかじゃなかったです',
      adverb: 'しずかに', teForm: 'しずかで',
    },
  },
  {
    japanese: 'にぎやか', romaji: 'nigiyaka', meaning: 'lively', lesson: 8,
    forms: {
      presentAff: 'にぎやかです', presentNeg: 'にぎやかじゃないです',
      pastAff: 'にぎやかでした', pastNeg: 'にぎやかじゃなかったです',
      adverb: 'にぎやかに', teForm: 'にぎやかで',
    },
  },
  {
    japanese: '元気', romaji: 'genki', meaning: 'energetic', lesson: 8,
    forms: {
      presentAff: 'げんきです', presentNeg: 'げんきじゃないです',
      pastAff: 'げんきでした', pastNeg: 'げんきじゃなかったです',
      adverb: 'げんきに', teForm: 'げんきで',
    },
  },
  {
    japanese: 'きれい', romaji: 'kirei', meaning: 'beautiful / clean', lesson: 8,
    forms: {
      presentAff: 'きれいです', presentNeg: 'きれいじゃないです',
      pastAff: 'きれいでした', pastNeg: 'きれいじゃなかったです',
      adverb: 'きれいに', teForm: 'きれいで',
    },
  },
  {
    japanese: '有名', romaji: 'yuumei', meaning: 'famous', lesson: 8,
    forms: {
      presentAff: 'ゆうめいです', presentNeg: 'ゆうめいじゃないです',
      pastAff: 'ゆうめいでした', pastNeg: 'ゆうめいじゃなかったです',
      adverb: 'ゆうめいに', teForm: 'ゆうめいで',
    },
  },
  {
    japanese: '便利', romaji: 'benri', meaning: 'convenient', lesson: 8,
    forms: {
      presentAff: 'べんりです', presentNeg: 'べんりじゃないです',
      pastAff: 'べんりでした', pastNeg: 'べんりじゃなかったです',
      adverb: 'べんりに', teForm: 'べんりで',
    },
  },
  {
    japanese: '好き', romaji: 'suki', meaning: 'liked', lesson: 9,
    forms: {
      presentAff: 'すきです', presentNeg: 'すきじゃないです',
      pastAff: 'すきでした', pastNeg: 'すきじゃなかったです',
      adverb: 'すきに', teForm: 'すきで',
    },
  },
  {
    japanese: '嫌い', romaji: 'kirai', meaning: 'disliked', lesson: 9,
    forms: {
      presentAff: 'きらいです', presentNeg: 'きらいじゃないです',
      pastAff: 'きらいでした', pastNeg: 'きらいじゃなかったです',
      adverb: 'きらいに', teForm: 'きらいで',
    },
  },
  {
    japanese: '上手', romaji: 'jouzu', meaning: 'skillful', lesson: 9,
    forms: {
      presentAff: 'じょうずです', presentNeg: 'じょうずじゃないです',
      pastAff: 'じょうずでした', pastNeg: 'じょうずじゃなかったです',
      adverb: 'じょうずに', teForm: 'じょうずで',
    },
  },
  {
    japanese: '下手', romaji: 'heta', meaning: 'unskillful', lesson: 9,
    forms: {
      presentAff: 'へたです', presentNeg: 'へたじゃないです',
      pastAff: 'へたでした', pastNeg: 'へたじゃなかったです',
      adverb: 'へたに', teForm: 'へたで',
    },
  },
  {
    japanese: '親切', romaji: 'shinsetsu', meaning: 'kind', lesson: 8,
    forms: {
      presentAff: 'しんせつです', presentNeg: 'しんせつじゃないです',
      pastAff: 'しんせつでした', pastNeg: 'しんせつじゃなかったです',
      adverb: 'しんせつに', teForm: 'しんせつで',
    },
  },
  {
    japanese: '簡単', romaji: 'kantan', meaning: 'simple', lesson: 12,
    forms: {
      presentAff: 'かんたんです', presentNeg: 'かんたんじゃないです',
      pastAff: 'かんたんでした', pastNeg: 'かんたんじゃなかったです',
      adverb: 'かんたんに', teForm: 'かんたんで',
    },
  },
  {
    japanese: 'ハンサム', romaji: 'hansamu', meaning: 'handsome', lesson: 8,
    forms: {
      presentAff: 'ハンサムです', presentNeg: 'ハンサムじゃないです',
      pastAff: 'ハンサムでした', pastNeg: 'ハンサムじゃなかったです',
      adverb: 'ハンサムに', teForm: 'ハンサムで',
    },
  },
  {
    japanese: '大変', romaji: 'taihen', meaning: 'tough', lesson: 13,
    forms: {
      presentAff: 'たいへんです', presentNeg: 'たいへんじゃないです',
      pastAff: 'たいへんでした', pastNeg: 'たいへんじゃなかったです',
      adverb: 'たいへんに', teForm: 'たいへんで',
    },
  },
  {
    japanese: '大切', romaji: 'taisetsu', meaning: 'important', lesson: 17,
    forms: {
      presentAff: 'たいせつです', presentNeg: 'たいせつじゃないです',
      pastAff: 'たいせつでした', pastNeg: 'たいせつじゃなかったです',
      adverb: 'たいせつに', teForm: 'たいせつで',
    },
  },
  {
    japanese: '暇', romaji: 'hima', meaning: 'free (time)', lesson: 8,
    forms: {
      presentAff: 'ひまです', presentNeg: 'ひまじゃないです',
      pastAff: 'ひまでした', pastNeg: 'ひまじゃなかったです',
      adverb: 'ひまに', teForm: 'ひまで',
    },
  },
  {
    japanese: 'すてき', romaji: 'suteki', meaning: 'wonderful / nice', lesson: 8,
    forms: {
      presentAff: 'すてきです', presentNeg: 'すてきじゃないです',
      pastAff: 'すてきでした', pastNeg: 'すてきじゃなかったです',
      adverb: 'すてきに', teForm: 'すてきで',
    },
  },
  {
    japanese: 'いろいろ', romaji: 'iroiro', meaning: 'various', lesson: 10,
    forms: {
      presentAff: 'いろいろです', presentNeg: 'いろいろじゃないです',
      pastAff: 'いろいろでした', pastNeg: 'いろいろじゃなかったです',
      adverb: 'いろいろに', teForm: 'いろいろで',
    },
  },
  {
    japanese: '大丈夫', romaji: 'daijoubu', meaning: 'OK / alright', lesson: 17,
    forms: {
      presentAff: 'だいじょうぶです', presentNeg: 'だいじょうぶじゃないです',
      pastAff: 'だいじょうぶでした', pastNeg: 'だいじょうぶじゃなかったです',
      adverb: 'だいじょうぶに', teForm: 'だいじょうぶで',
    },
  },
  {
    japanese: '無理', romaji: 'muri', meaning: 'unreasonable / impossible', lesson: 19,
    forms: {
      presentAff: 'むりです', presentNeg: 'むりじゃないです',
      pastAff: 'むりでした', pastNeg: 'むりじゃなかったです',
      adverb: 'むりに', teForm: 'むりで',
    },
  },
  {
    japanese: '無駄', romaji: 'muda', meaning: 'wasteful / useless', lesson: 21,
    forms: {
      presentAff: 'むだです', presentNeg: 'むだじゃないです',
      pastAff: 'むだでした', pastNeg: 'むだじゃなかったです',
      adverb: 'むだに', teForm: 'むだで',
    },
  },
  {
    japanese: '不便', romaji: 'fuben', meaning: 'inconvenient', lesson: 21,
    forms: {
      presentAff: 'ふべんです', presentNeg: 'ふべんじゃないです',
      pastAff: 'ふべんでした', pastNeg: 'ふべんじゃなかったです',
      adverb: 'ふべんに', teForm: 'ふべんで',
    },
  },
]

const FORM_KEYS = {
  presentAff: { label: 'наст. утвердительная', labelJp: '現在肯定', example: '~です' },
  presentNeg: { label: 'наст. отрицательная', labelJp: '現在否定', example: '~くないです / ~じゃないです' },
  pastAff: { label: 'прош. утвердительная', labelJp: '過去肯定', example: '~かったです / ~でした' },
  pastNeg: { label: 'прош. отрицательная', labelJp: '過去否定', example: '~くなかったです / ~じゃなかったです' },
  adverb: { label: 'наречие', labelJp: '副詞形', example: 'い→く / な→に' },
  teForm: { label: 'て-форма', labelJp: 'て形', example: 'い→くて / な→で' },
}

// Conjugation rules shown as hints
const FORM_RULES = {
  i: {
    presentAff: 'い-прил: основа + いです',
    presentNeg: 'い-прил: основа → くないです',
    pastAff: 'い-прил: основа → かったです',
    pastNeg: 'い-прил: основа → くなかったです',
    adverb: 'い-прил: основа → く (используется с глаголом)',
    teForm: 'い-прил: основа → くて (соединяет предложения)',
  },
  na: {
    presentAff: 'な-прил: основа + です',
    presentNeg: 'な-прил: основа + じゃないです',
    pastAff: 'な-прил: основа + でした',
    pastNeg: 'な-прил: основа + じゃなかったです',
    adverb: 'な-прил: основа + に (используется с глаголом)',
    teForm: 'な-прил: основа + で (соединяет предложения)',
  },
}

const scoreReactions = [
  { min: 95, emoji: '🎉✨🐱🔥', text: 'kanpeki!! adjective master!', textJp: 'かんぺき！すごい！' },
  { min: 90, emoji: '🎉✨🐱', text: 'sugoi!! ты просто няшка!', textJp: 'すごい！' },
  { min: 70, emoji: '🌸😊', text: 'yoku dekimashita! хорошо!', textJp: 'よくできました！' },
  { min: 50, emoji: '🐱💪', text: 'mada mada~ ещё чуть-чуть!', textJp: 'まだまだ！' },
  { min: 0, emoji: '🌙📚', text: 'ganbatte! давай повторим~', textJp: 'がんばって！' },
]

const CORRECT_FEEDBACK = [
  '✨ correct! sugoi~',
  '✨ that\'s right! yoku dekita!',
  '✨ perfect! kanpeki!',
  '✨ hai, seikai!',
  '✨ nailed it! saikou!',
]

function randomFeedback() {
  return CORRECT_FEEDBACK[Math.floor(Math.random() * CORRECT_FEEDBACK.length)]
}

const PHASE_SETUP = 'setup'
const PHASE_QUIZ = 'quiz'
const PHASE_RESULTS = 'results'

// Build a question: given an adjective and a target form, generate 4 options
function buildQuestion(adj, formKey, allAdjs) {
  const correctAnswer = adj.forms[formKey]

  // Gather wrong answers from same-type adjectives only (い-adj wrongs for い-adj questions)
  const sameType = allAdjs.filter(a => a.type === adj.type && a.japanese !== adj.japanese)
  const wrongPool = sameType
    .map(a => a.forms[formKey])
    .filter(f => f !== correctAnswer)

  // Deduplicate
  const uniqueWrong = [...new Set(wrongPool)]
  const wrongOptions = shuffle(uniqueWrong).slice(0, 3)

  // Fallback: use other forms of same-type adjectives if not enough
  if (wrongOptions.length < 3) {
    const otherFormKeys = Object.keys(FORM_KEYS).filter(k => k !== formKey)
    const extraPool = sameType
      .flatMap(a => otherFormKeys.map(k => a.forms[k]))
      .filter(f => f !== correctAnswer && !wrongOptions.includes(f))
    const uniqueExtra = [...new Set(extraPool)]
    const needed = 3 - wrongOptions.length
    wrongOptions.push(...shuffle(uniqueExtra).slice(0, needed))
  }

  const options = shuffle([correctAnswer, ...wrongOptions.slice(0, 3)])

  return {
    adj,
    formKey,
    correctAnswer,
    options,
  }
}

export default function AdjectiveQuiz() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const { awardXP, calculateQuizXP } = useXP()
  const { saveQuizResult } = useProgress()
  const { unlockedMax } = useUnlockedLessons()
  const [phase, setPhase] = useState(PHASE_SETUP)
  const [showCountdown, setShowCountdown] = useState(false)

  // setup state
  const [selectedTypes, setSelectedTypes] = useState(['i', 'na'])
  const [selectedForms, setSelectedForms] = useState(['presentAff', 'presentNeg', 'pastAff', 'pastNeg'])
  const [questionCount, setQuestionCount] = useState(getStoredQuizSize)
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
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15)
  const timerRef = useRef(null)
  const countdownRef = useRef(null)
  const answerLockedRef = useRef(false)
  const advanceLockedRef = useRef(false)
  const xpAwardedRef = useRef(false)

  const toggleType = (key) => {
    setSelectedTypes(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key])
  }

  const toggleForm = (key) => {
    setSelectedForms(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key])
  }

  const getPool = () => {
    let pool = []
    if (selectedTypes.includes('i')) pool = pool.concat(iAdjectives.filter(a => !a.lesson || a.lesson <= unlockedMax).map(a => ({ ...a, type: 'i' })))
    if (selectedTypes.includes('na')) pool = pool.concat(naAdjectives.filter(a => !a.lesson || a.lesson <= unlockedMax).map(a => ({ ...a, type: 'na' })))
    return pool
  }

  const startQuiz = () => {
    const pool = getPool()
    if (pool.length === 0 || selectedForms.length === 0) return

    // Build all possible questions: each adj x each form
    const allPossible = []
    for (const adj of pool) {
      for (const formKey of selectedForms) {
        allPossible.push({ adj, formKey })
      }
    }

    const count = questionCount === 'all'
      ? allPossible.length
      : Math.min(questionCount, allPossible.length)

    const selected = shuffle(allPossible).slice(0, count)
    const qs = selected.map(({ adj, formKey }) => buildQuestion(adj, formKey, pool))

    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setMistakes([])
    setStreak(0)
    setBestStreak(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    answerLockedRef.current = false
    setShowCountdown(true)
    xpAwardedRef.current = false
    setPhase(PHASE_QUIZ)
  }

  const startMistakesQuiz = (repeatCount) => {
    if (mistakes.length === 0) return
    const pool = getPool()
    let repeated = []
    for (let i = 0; i < repeatCount; i++) {
      repeated = repeated.concat(mistakes)
    }
    const qs = shuffle(repeated).map(m => buildQuestion(m.adj, m.formKey, pool))
    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setMistakes([])
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

    const correct = option === questions[currentIndex].correctAnswer
    setSelectedAnswer(option)
    setIsCorrect(correct)

    if (correct) {
      setScore(prev => prev + 1)
      setStreak(prev => { const n = prev + 1; setBestStreak(b => Math.max(b, n)); return n })
    } else {
      setMistakes(prev => [...prev, {
        adj: questions[currentIndex].adj,
        formKey: questions[currentIndex].formKey,
        correctAnswer: questions[currentIndex].correctAnswer,
        yourAnswer: option,
      }])
      setStreak(0)
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
  }, [selectedAnswer, questions, currentIndex])

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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  useEffect(() => {
    if (isTimed && !showCountdown) setTimeLeft(timeLimit)
  }, [currentIndex, isTimed, timeLimit, showCountdown])

  useEffect(() => {
    if (!isTimed || showCountdown || selectedAnswer !== null || phase !== PHASE_QUIZ) {
      clearInterval(countdownRef.current)
      return
    }
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(countdownRef.current)
          handleAnswer('__TIMEOUT__')
          return 0
        }
        return Math.max(0, prev - 0.1)
      })
    }, 100)
    return () => clearInterval(countdownRef.current)
  }, [isTimed, showCountdown, selectedAnswer, currentIndex, phase, handleAnswer])

  useEffect(() => {
    if (phase === PHASE_RESULTS && questions.length > 0 && !xpAwardedRef.current) {
      xpAwardedRef.current = true
      saveQuizResult('grammar', {
        lessons: getTrackedLessons(questions, q => q.adj?.lesson),
        type: 'adjective',
        score,
        total: questions.length,
      })
      const xp = calculateQuizXP(score, questions.length)
      if (xp > 0) awardXP(xp, 'adjective quiz', score === questions.length && questions.length > 0)
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const pool = getPool()
  const totalPossible = pool.length * selectedForms.length
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
        <div className="animate-fadeInUp">
          {/* header */}
          <div style={styles.header}>
            <h1 style={styles.title}>
              <span>形</span> adjective quiz <span style={styles.titleJp}>けいようしテスト</span>
            </h1>
            <p style={styles.subtitle}>practice い and な adjective conjugation 🐱</p>
          </div>

          {/* adjective type */}
          <div className="glass" style={styles.setupCard}>
            <div style={styles.setupLabel}>
              <span>📝</span> adjective type
            </div>
            <div style={styles.typeRow}>
              <button
                onClick={() => toggleType('i')}
                style={{
                  ...styles.typeBtn,
                  ...(selectedTypes.includes('i') ? styles.typeBtnActive : {}),
                }}
              >
                <span style={styles.typeBtnEmoji}>い</span>
                <span>i-adjectives</span>
                <span style={styles.typeBtnJp}>い形容詞 ({iAdjectives.length})</span>
              </button>
              <button
                onClick={() => toggleType('na')}
                style={{
                  ...styles.typeBtn,
                  ...(selectedTypes.includes('na') ? styles.typeBtnActive : {}),
                }}
              >
                <span style={styles.typeBtnEmoji}>な</span>
                <span>na-adjectives</span>
                <span style={styles.typeBtnJp}>な形容詞 ({naAdjectives.length})</span>
              </button>
            </div>
          </div>

          {/* conjugation forms */}
          <div className="glass" style={styles.setupCard}>
            <div style={styles.setupLabel}>
              <span>🎀</span> conjugation forms
            </div>
            <div style={{ ...styles.formGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
              {Object.entries(FORM_KEYS).map(([key, info]) => (
                <label
                  key={key}
                  style={{
                    ...styles.formBtn,
                    ...(selectedForms.includes(key) ? styles.formBtnActive : {}),
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedForms.includes(key)}
                    onChange={() => toggleForm(key)}
                    style={{ display: 'none' }}
                  />
                  <span style={styles.formBtnLabel}>{info.label}</span>
                  <span style={styles.formBtnJp}>{info.labelJp}</span>
                  <span style={styles.formBtnExample}>{info.example}</span>
                </label>
              ))}
            </div>
            <div style={styles.poolInfo}>
              {totalPossible} questions in pool 🌸
            </div>
          </div>

          {/* question count */}
          <div className="glass" style={styles.setupCard}>
            <div style={styles.setupLabel}>
              <span>🔢</span> how many questions?
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
              {[5, 10, 20].map(n => (
                <button key={n} onClick={() => setQuestionCount(Math.min(n, totalPossible))} style={{
                  padding: '4px 14px', borderRadius: 50, border: 'none', cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit',
                  background: questionCount === n ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
                  color: questionCount === n ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s', minHeight: 44,
                }}>{n}</button>
              ))}
              <button onClick={() => setQuestionCount('all')} style={{
                padding: '4px 14px', borderRadius: 50, border: 'none', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit',
                background: questionCount === 'all' ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
                color: questionCount === 'all' ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s', minHeight: 44,
              }}>all ({totalPossible})</button>
            </div>
            <div style={styles.sliderWrap}>
              <div style={styles.sliderValueRow}>
                <input
                  type="number"
                  aria-label="number of questions"
                  min={5}
                  max={Math.max(totalPossible, 5)}
                  value={questionCount === 'all' ? totalPossible : questionCount}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (raw === '') { setQuestionCount(5); return }
                    const v = parseInt(raw, 10)
                    if (isNaN(v)) return
                    if (v >= totalPossible) setQuestionCount('all')
                    else setQuestionCount(Math.max(1, v))
                  }}
                  onBlur={() => {
                    if (questionCount !== 'all' && questionCount < 5) setQuestionCount(5)
                  }}
                  disabled={totalPossible < 5}
                  style={styles.numberInput}
                />
              </div>
              <input
                type="range"
                className="kawaii-slider"
                min={5}
                max={Math.max(totalPossible, 5)}
                value={questionCount === 'all' ? totalPossible : questionCount}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10)
                  setQuestionCount(v >= totalPossible ? 'all' : v)
                }}
                aria-label="number of questions"
                disabled={totalPossible < 5}
              />
              <div style={styles.sliderLabels}>
                <span>5</span>
                <button
                  onClick={() => setQuestionCount('all')}
                  style={{
                    ...styles.allBtn,
                    ...(questionCount === 'all' ? styles.allBtnActive : {}),
                  }}
                >
                  all
                </button>
              </div>
            </div>
          </div>

          {/* timer */}
          <div className="glass" style={styles.setupCard}>
            <div style={styles.setupLabel}><span>⏱</span> timer</div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[{ label: 'выкл', val: 0 }, { label: '10с', val: 10 }, { label: '15с', val: 15 }, { label: '20с', val: 20 }, { label: '30с', val: 30 }].map(({ label, val }) => (
                <button key={label} onClick={() => { if (val === 0) { setIsTimed(false) } else { setIsTimed(true); setTimeLimit(val); setCustomTimerVal('') } }} style={{
                  padding: '4px 14px', borderRadius: 50, border: 'none', cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit', minHeight: 44,
                  background: (!isTimed && val === 0) || (isTimed && timeLimit === val && !customTimerVal) ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
                  color: (!isTimed && val === 0) || (isTimed && timeLimit === val && !customTimerVal) ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s',
                }}>{label}</button>
              ))}
              <input
                type="number" min={5} max={120} placeholder="сек"
                aria-label="custom time limit in seconds"
                value={customTimerVal}
                onChange={e => { const v = parseInt(e.target.value, 10); setCustomTimerVal(e.target.value); if (!isNaN(v) && v >= 5) { setIsTimed(true); setTimeLimit(v) } }}
                style={{ width: 60, padding: '4px 8px', borderRadius: 50, border: 'none', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit', textAlign: 'center', background: customTimerVal ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)', color: customTimerVal ? '#fff' : 'var(--text-secondary)', minHeight: 44 }}
              />
            </div>
          </div>

          {/* start */}
          <div style={styles.startWrap}>
            <button
              className="btn btn-cute"
              onClick={startQuiz}
              disabled={totalPossible < 4}
              style={{ opacity: totalPossible >= 4 ? 1 : 0.5, pointerEvents: totalPossible >= 4 ? 'auto' : 'none', maxWidth: 240 }}
            >
              start quiz ✨
            </button>
            <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
              <Link to="/quiz/grammar" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>grammar quiz 文</Link>
              <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
            </div>
            {totalPossible < 4 && totalPossible > 0 && (
              <p style={styles.warnText}>need at least 4 combinations</p>
            )}
          </div>
        </div>
      )}

      {showCountdown && <QuizCountdown onComplete={() => setShowCountdown(false)} />}

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
          inputPaused={showCountdown}
          isTimed={isTimed}
          timeLeft={timeLeft}
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
          bestStreak={bestStreak}
          isTablet={isTablet}
          onRetry={() => setPhase(PHASE_SETUP)}
          onRetryMistakes={startMistakesQuiz}
          calculateQuizXP={calculateQuizXP}
        />
      )}
    </div>
  )
}

function QuizScreen({ question, currentIndex, totalQuestions, selectedAnswer, isCorrect, score, streak, onAnswer, inputPaused = false, isTimed, timeLeft, timeLimit, onSkip }) {
  const isMobile = useIsMobile()
  const progress = ((currentIndex + 1) / totalQuestions) * 100
  const formInfo = FORM_KEYS[question.formKey]
  const [feedbackMsg] = useState(() => randomFeedback())
  const [showHint, setShowHint] = useState(false)

  // Reset hint on new question
  useEffect(() => { setShowHint(false) }, [currentIndex])

  // Keyboard shortcuts: 1-4 to select answer
  useEffect(() => {
    if (inputPaused || selectedAnswer !== null) return
    const handler = (e) => {
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= 4 && question.options[num - 1]) {
        onAnswer(question.options[num - 1])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [inputPaused, selectedAnswer, question.options, onAnswer])

  const typeLabel = question.adj.type === 'i' ? 'い adjective' : 'な adjective'
  const typeBadgeStyle = question.adj.type === 'i' ? styles.badgeI : styles.badgeNa

  return (
    <div className="animate-fadeInUp">
      {/* progress */}
      <div style={styles.progressWrap}>
        <div style={styles.progressInfo}>
          <Link to="/" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', opacity: 0.5, textDecoration: 'none', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', flexShrink: 0 }} aria-label="exit quiz">✕</Link>
          <span style={styles.progressText}>{currentIndex + 1} / {totalQuestions}</span>
          <span style={styles.scoreText} aria-live="polite" aria-atomic="true">score: {score} 🐱{streak >= 3 && <span style={styles.streakBadge} className="animate-pop" key={streak}>{streak >= 7 ? '🔥🔥' : streak >= 5 ? '🔥' : '⚡'} {streak}x</span>}</span>
        </div>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
        {isTimed && (
          <div style={{ height: 4, background: 'rgba(192,132,252,0.15)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / timeLimit) * 100}%`, background: timeLeft <= 3 ? '#ef4444' : '#c084fc', transition: 'width 0.1s linear', borderRadius: 2 }} />
          </div>
        )}
      </div>

      {/* question card */}
      <div
        className="glass animate-pop"
        key={`question-card-${currentIndex}`}
        style={{
          ...styles.questionCard,
          ...(!prefersReducedMotion && isCorrect === false ? { animation: 'shake 0.4s ease' } : {}),
        }}
      >
        <div style={styles.badgeRow}>
          <span style={typeBadgeStyle}>{typeLabel}</span>
          {question.adj.irregular && <span style={styles.badgeIrregular}>irregular!</span>}
        </div>

        <div style={{ ...styles.questionWord, fontSize: isMobile ? '1.9rem' : '2.6rem' }}>{question.adj.japanese}</div>
        <div style={styles.questionRomaji}>{question.adj.romaji}</div>
        <div style={styles.questionMeaning}>{question.adj.meaning}</div>

        <div style={styles.targetForm}>
          <span style={styles.targetFormArrow}>→</span>
          <span style={styles.targetFormText}>{formInfo.label}</span>
          <span style={styles.targetFormJp}>{formInfo.labelJp}</span>
        </div>

        {/* conjugation rule hint */}
        {(showHint || (selectedAnswer !== null && !isCorrect))
          ? <div style={styles.hintBox} className="animate-pop">{FORM_RULES[question.adj.type]?.[question.formKey]}</div>
          : <button onClick={() => setShowHint(true)} className="btn-hover" style={styles.hintBtn}>💡 правило</button>
        }
      </div>

      {/* keyboard hint */}
      {!selectedAnswer && (
        <div style={styles.keyboardHint}>
          <span style={styles.keyboardHintChip}>⌨ 1–4</span>
          <span style={styles.keyboardHintText}>to answer</span>
        </div>
      )}

      {/* options */}
      <div key={`question-options-${currentIndex}`} style={{ ...styles.optionsGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
        {question.options.map((opt, i) => {
          let optStyle = { ...styles.option }

          if (selectedAnswer !== null) {
            if (opt === question.correctAnswer) {
              optStyle = { ...optStyle, ...styles.optionCorrect }
            } else if (opt === selectedAnswer && !isCorrect) {
              optStyle = { ...optStyle, ...styles.optionIncorrect }
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
              disabled={inputPaused || selectedAnswer !== null}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {/* feedback */}
      {selectedAnswer !== null && (
        <div
          style={{
            ...styles.feedback,
            color: isCorrect ? 'var(--correct-text)' : 'var(--incorrect-text)',
          }}
          className="animate-pop"
        >
          {isCorrect
            ? feedbackMsg
            : `✗ it was: ${question.correctAnswer}`
          }
        </div>
      )}

      {/* conjugation pattern — shown after answering */}
      {selectedAnswer !== null && (
        <div className="glass animate-pop" style={styles.conjTable}>
          <div style={{ ...styles.conjTableTitle, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>all forms of {question.adj.japanese} — {question.adj.meaning}</span>
            {question.adj.lesson && (
              <Link to={`/lessons/${question.adj.lesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none', marginLeft: 'auto', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                lesson {question.adj.lesson} →
              </Link>
            )}
          </div>
          <div style={styles.conjTableGrid}>
            {Object.entries(FORM_KEYS).map(([key, info]) => (
              <div key={key} style={{
                ...styles.conjRow,
                ...(key === question.formKey ? styles.conjRowHighlight : {}),
              }}>
                <span style={styles.conjFormLabel}>{info.label}</span>
                <span style={styles.conjFormJp}>{question.adj.forms[key]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {selectedAnswer !== null && (
        <div onClick={onSkip} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSkip() } }} aria-label="continue to next question" style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 4, cursor: 'pointer' }}>
          нажми чтобы продолжить →
        </div>
      )}
    </div>
  )
}

function ResultsScreen({ score, total, percentage, reaction, mistakes, bestStreak, isTablet, onRetry, onRetryMistakes, calculateQuizXP }) {
  const [repeatCount, setRepeatCount] = useState(1)

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

        {bestStreak >= 3 && <div style={styles.bestStreak} className="animate-pop">{bestStreak >= 7 ? '🔥🔥' : bestStreak >= 5 ? '🔥' : '⚡'} best streak: {bestStreak}x</div>}

        {/* mistakes list */}
        {mistakes.length > 0 && (
          <div style={styles.mistakesSection}>
            <div style={styles.mistakesLabel}>mistakes ({mistakes.length}) ✏️</div>
            <div style={styles.mistakesList}>
              {mistakes.map((m, i) => {
                const formInfo = FORM_KEYS[m.formKey]
                return (
                  <div key={(m.adj.japanese || '') + m.formKey + i} style={styles.mistakeItem}>
                    <div style={styles.mistakeTop}>
                      <span style={styles.mistakeWord}>{m.adj.japanese}</span>
                      <span style={styles.mistakeFormTag}>{formInfo.label}</span>
                      {m.adj.lesson && (
                        <Link to={`/lessons/${m.adj.lesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none', marginLeft: 'auto', flexShrink: 0 }}>
                          lesson {m.adj.lesson} →
                        </Link>
                      )}
                    </div>
                    <div style={styles.mistakeCorrect}>correct: {m.correctAnswer}</div>
                    <div style={styles.mistakeYours}>you: {m.yourAnswer === '__TIMEOUT__' ? '⏱ время вышло' : m.yourAnswer}</div>
                  </div>
                )
              })}
            </div>

            {/* retry mistakes */}
            <div style={styles.retryMistakesWrap}>
              <div style={styles.repeatRow}>
                <span style={styles.repeatLabel}>repeat:</span>
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    onClick={() => setRepeatCount(n)}
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
                className="btn btn-cute"
                onClick={() => onRetryMistakes(repeatCount)}
                style={{ fontSize: '0.85rem' }}
              >
                work on mistakes ({mistakes.length * repeatCount} qs)
              </button>
            </div>
          </div>
        )}

        <div style={styles.resultsActions}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-cute" onClick={onRetry} style={{ flex: 1 }}>try again 🌸</button>
            <ShareResult quizName="adjective quiz" score={score} total={total} percentage={percentage} bestStreak={bestStreak} xpEarned={calculateQuizXP(score, total)} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/quiz/grammar" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>grammar 文</Link>
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
  typeRow: {
    display: 'flex',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '14px 12px',
    borderRadius: 16,
    background: 'var(--tint-medium)',
    border: '2px solid rgba(192,132,252,0.25)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'lowercase',
  },
  typeBtnActive: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(192,132,252,0.15))',
    border: '2px solid #f472b6',
    boxShadow: '0 4px 12px rgba(244, 114, 182, 0.15)',
  },
  typeBtnEmoji: {
    fontSize: '1.6rem',
  },
  typeBtnJp: {
    fontSize: '0.72rem',
    color: 'var(--text-light)',
    fontWeight: 500,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  formBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    padding: '10px 8px',
    borderRadius: 12,
    background: 'var(--tint)',
    border: '1.5px solid rgba(192,132,252,0.25)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textTransform: 'lowercase',
  },
  formBtnActive: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(192,132,252,0.15))',
    border: '1.5px solid #c084fc',
    boxShadow: '0 2px 8px rgba(192, 132, 252, 0.15)',
  },
  formBtnLabel: {
    fontSize: '0.85rem',
    fontWeight: 800,
    color: 'var(--text-main)',
  },
  formBtnJp: {
    fontSize: '0.72rem',
    color: 'var(--text-light)',
    fontWeight: 600,
  },
  formBtnExample: {
    fontSize: '0.78rem',
    color: 'var(--text-light)',
    fontWeight: 500,
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
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--text-light)',
  },
  allBtn: {
    padding: '3px 14px',
    borderRadius: 50,
    background: 'var(--tint-medium)',
    border: '1.5px solid rgba(192,132,252,0.25)',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textTransform: 'lowercase',
    minHeight: 44,
  },
  allBtnActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    color: 'white',
    border: '1.5px solid transparent',
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

  // keyboard hint
  keyboardHint: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginBottom: 8, marginTop: -6,
  },
  keyboardHintChip: {
    padding: '2px 10px', borderRadius: 50,
    background: 'rgba(168,85,247,0.1)',
    border: '1px solid rgba(168,85,247,0.2)',
    fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)',
  },
  keyboardHintText: { fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 500 },

  // conjugation pattern table
  conjTable: {
    padding: '12px 14px', marginBottom: 14, marginTop: 4,
  },
  conjTableTitle: {
    fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 8, textAlign: 'center',
    textTransform: 'lowercase',
  },
  conjTableGrid: { display: 'flex', flexDirection: 'column', gap: 3 },
  conjRow: {
    display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8, alignItems: 'center',
    padding: '5px 8px', borderRadius: 8, background: 'rgba(192,132,252,0.06)',
  },
  conjRowHighlight: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.12), rgba(192,132,252,0.12))',
    border: '1px solid rgba(192,132,252,0.3)',
  },
  conjFormLabel: { fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)' },
  conjFormJp: { fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' },

  // Quiz screen
  progressWrap: {
    marginTop: 28,
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
    marginBottom: 14,
  },
  questionLabel: {
    fontSize: '1rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    marginBottom: 8,
    textTransform: 'lowercase',
  },
  questionWord: {
    fontSize: '2.6rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    marginBottom: 4,
  },
  questionRomaji: {
    fontSize: '1rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    fontStyle: 'italic',
  },
  questionMeaning: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    marginTop: 2,
    marginBottom: 10,
  },
  badgeRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  badgeI: {
    fontSize: '0.82rem',
    fontWeight: 800,
    color: '#ec4899',
    background: 'rgba(236, 72, 153, 0.12)',
    padding: '4px 14px',
    borderRadius: 50,
    border: '1.5px solid rgba(236, 72, 153, 0.3)',
  },
  badgeNa: {
    fontSize: '0.82rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    background: 'rgba(168, 85, 247, 0.12)',
    padding: '4px 14px',
    borderRadius: 50,
    border: '1.5px solid rgba(168, 85, 247, 0.3)',
  },
  badgeIrregular: {
    fontSize: '0.82rem',
    fontWeight: 800,
    color: 'var(--gold-text)',
    background: 'rgba(217, 119, 6, 0.12)',
    padding: '4px 14px',
    borderRadius: 50,
    border: '1.5px solid rgba(217, 119, 6, 0.3)',
  },
  targetForm: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 16px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, rgba(244,114,182,0.08), rgba(192,132,252,0.08))',
    border: '1.5px solid rgba(192, 132, 252, 0.2)',
  },
  targetFormArrow: {
    fontSize: '1.1rem',
    fontWeight: 900,
    color: 'var(--text-light)',
  },
  targetFormText: {
    fontSize: '0.95rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    textTransform: 'lowercase',
  },
  targetFormJp: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-light)',
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
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
    minHeight: 62,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  hintBtn: {
    padding: '4px 14px', borderRadius: 20, border: '1.5px solid rgba(192,132,252,0.35)',
    background: 'var(--tint)', color: 'var(--text-light)', fontSize: '0.8rem',
    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8, minHeight: 44,
  },
  hintBox: {
    fontSize: '0.82rem', fontWeight: 700, color: 'var(--gold-text)',
    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
    borderRadius: 8, padding: '5px 12px', marginTop: 8,
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  optionCorrect: {
    background: 'rgba(16, 185, 129, 0.15)',
    border: '2px solid var(--correct-text)',
    color: 'var(--correct-text)',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
  },
  optionIncorrect: {
    background: 'rgba(244, 63, 94, 0.12)',
    border: '2px solid var(--incorrect-text)',
    color: 'var(--incorrect-text)',
    ...(prefersReducedMotion ? {} : { animation: 'shake 0.4s ease' }),
  },
  feedback: {
    textAlign: 'center',
    fontSize: '1rem',
    fontWeight: 800,
    padding: 12,
  },

  // Results screen
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
    gap: 6,
  },
  mistakeItem: {
    background: 'rgba(244, 63, 94, 0.06)',
    border: '1px solid rgba(244, 63, 94, 0.15)',
    borderLeft: '3px solid var(--incorrect-text)',
    borderRadius: 10,
    padding: '8px 12px',
  },
  mistakeTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  mistakeWord: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--text-main)',
  },
  mistakeFormTag: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    background: 'rgba(168, 85, 247, 0.1)',
    padding: '2px 8px',
    borderRadius: 50,
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
  streakBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 12px', borderRadius: 50,
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    color: 'white', fontSize: '0.75rem', fontWeight: 800,
    boxShadow: '0 2px 8px rgba(251, 191, 36, 0.4)',
    marginLeft: 8,
  },
  bestStreak: {
    fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-text)',
    margin: '-10px 0 16px', textAlign: 'center',
  },
}
