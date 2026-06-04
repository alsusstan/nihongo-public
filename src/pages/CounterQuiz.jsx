import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { useXP } from '../hooks/useXP'
import { useIsMobile, useIsTablet } from '../hooks/useIsMobile'
import ShareResult from '../components/ShareResult'
import QuizCountdown from '../components/QuizCountdown'
import Confetti from '../components/Confetti'
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

const scoreReactions = [
  { min: 90, emoji: '🎉✨🐱', text: 'sugoi!! counter master!', textJp: 'すごい！' },
  { min: 70, emoji: '🌸😊', text: 'yoku dekimashita! хорошо!', textJp: 'よくできました！' },
  { min: 50, emoji: '🐱💪', text: 'mada mada~ ещё чуть-чуть!', textJp: 'まだまだ！' },
  { min: 0, emoji: '🌙📚', text: 'ganbatte! давай повторим~', textJp: 'がんばって！' },
]

const PHASE_SETUP = 'setup'
const PHASE_QUIZ = 'quiz'
const PHASE_RESULTS = 'results'

// ─── Counter data ───────────────────────────────────────────────────────────────

const countersData = [
  {
    id: 'tsu',
    counter: 'つ',
    name: 'tsu',
    nameRu: 'общий счётчик',
    description: 'general counter (universal)',
    emoji: '📦',
    readings: [
      { num: 1, kanji: '一つ', kana: 'ひとつ', romaji: 'hitotsu', ru: 'один (предмет)' },
      { num: 2, kanji: '二つ', kana: 'ふたつ', romaji: 'futatsu', ru: 'два (предмета)' },
      { num: 3, kanji: '三つ', kana: 'みっつ', romaji: 'mittsu', ru: 'три' },
      { num: 4, kanji: '四つ', kana: 'よっつ', romaji: 'yottsu', ru: 'четыре' },
      { num: 5, kanji: '五つ', kana: 'いつつ', romaji: 'itsutsu', ru: 'пять' },
      { num: 6, kanji: '六つ', kana: 'むっつ', romaji: 'muttsu', ru: 'шесть' },
      { num: 7, kanji: '七つ', kana: 'ななつ', romaji: 'nanatsu', ru: 'семь' },
      { num: 8, kanji: '八つ', kana: 'やっつ', romaji: 'yattsu', ru: 'восемь' },
      { num: 9, kanji: '九つ', kana: 'ここのつ', romaji: 'kokonotsu', ru: 'девять' },
      { num: 10, kanji: '十', kana: 'とお', romaji: 'too', ru: 'десять' },
    ],
    exampleNouns: [
      { jp: 'りんご', romaji: 'ringo', ru: 'яблоко' },
      { jp: 'いす', romaji: 'isu', ru: 'стул' },
      { jp: 'かばん', romaji: 'kaban', ru: 'сумка' },
    ],
  },
  {
    id: 'nin',
    counter: '人',
    name: 'nin / ri',
    nameRu: 'люди',
    description: 'people',
    emoji: '👥',
    readings: [
      { num: 1, kanji: '一人', kana: 'ひとり', romaji: 'hitori', ru: 'один человек' },
      { num: 2, kanji: '二人', kana: 'ふたり', romaji: 'futari', ru: 'два человека' },
      { num: 3, kanji: '三人', kana: 'さんにん', romaji: 'sannin', ru: 'три человека' },
      { num: 4, kanji: '四人', kana: 'よにん', romaji: 'yonin', ru: 'четыре человека' },
      { num: 5, kanji: '五人', kana: 'ごにん', romaji: 'gonin', ru: 'пять человек' },
      { num: 6, kanji: '六人', kana: 'ろくにん', romaji: 'rokunin', ru: 'шесть человек' },
      { num: 7, kanji: '七人', kana: 'しちにん', romaji: 'shichinin', ru: 'семь человек' },
      { num: 8, kanji: '八人', kana: 'はちにん', romaji: 'hachinin', ru: 'восемь человек' },
      { num: 9, kanji: '九人', kana: 'きゅうにん', romaji: 'kyuunin', ru: 'девять человек' },
      { num: 10, kanji: '十人', kana: 'じゅうにん', romaji: 'juunin', ru: 'десять человек' },
    ],
    exampleNouns: [
      { jp: '学生', romaji: 'gakusei', ru: 'студент' },
      { jp: '友達', romaji: 'tomodachi', ru: 'друг' },
      { jp: '子ども', romaji: 'kodomo', ru: 'ребёнок' },
    ],
  },
  {
    id: 'hon',
    counter: '本',
    name: 'hon / bon / pon',
    nameRu: 'длинные тонкие предметы',
    description: 'long thin objects (pens, bottles, trees, umbrellas)',
    emoji: '🖊',
    readings: [
      { num: 1, kanji: '一本', kana: 'いっぽん', romaji: 'ippon', ru: 'один (длинный предмет)' },
      { num: 2, kanji: '二本', kana: 'にほん', romaji: 'nihon', ru: 'два' },
      { num: 3, kanji: '三本', kana: 'さんぼん', romaji: 'sanbon', ru: 'три' },
      { num: 4, kanji: '四本', kana: 'よんほん', romaji: 'yonhon', ru: 'четыре' },
      { num: 5, kanji: '五本', kana: 'ごほん', romaji: 'gohon', ru: 'пять' },
      { num: 6, kanji: '六本', kana: 'ろっぽん', romaji: 'roppon', ru: 'шесть' },
      { num: 7, kanji: '七本', kana: 'ななほん', romaji: 'nanahon', ru: 'семь' },
      { num: 8, kanji: '八本', kana: 'はっぽん', romaji: 'happon', ru: 'восемь' },
      { num: 9, kanji: '九本', kana: 'きゅうほん', romaji: 'kyuuhon', ru: 'девять' },
      { num: 10, kanji: '十本', kana: 'じゅっぽん', romaji: 'juppon', ru: 'десять' },
    ],
    exampleNouns: [
      { jp: 'えんぴつ', romaji: 'enpitsu', ru: 'карандаш' },
      { jp: '傘', romaji: 'kasa', ru: 'зонт' },
      { jp: 'ビール', romaji: 'biiru', ru: 'бутылка пива' },
      { jp: 'バナナ', romaji: 'banana', ru: 'банан' },
    ],
  },
  {
    id: 'mai',
    counter: '枚',
    name: 'mai',
    nameRu: 'плоские предметы',
    description: 'flat objects (paper, tickets, shirts, plates)',
    emoji: '📄',
    readings: [
      { num: 1, kanji: '一枚', kana: 'いちまい', romaji: 'ichimai', ru: 'один (плоский предмет)' },
      { num: 2, kanji: '二枚', kana: 'にまい', romaji: 'nimai', ru: 'два' },
      { num: 3, kanji: '三枚', kana: 'さんまい', romaji: 'sanmai', ru: 'три' },
      { num: 4, kanji: '四枚', kana: 'よんまい', romaji: 'yonmai', ru: 'четыре' },
      { num: 5, kanji: '五枚', kana: 'ごまい', romaji: 'gomai', ru: 'пять' },
      { num: 6, kanji: '六枚', kana: 'ろくまい', romaji: 'rokumai', ru: 'шесть' },
      { num: 7, kanji: '七枚', kana: 'ななまい', romaji: 'nanamai', ru: 'семь' },
      { num: 8, kanji: '八枚', kana: 'はちまい', romaji: 'hachimai', ru: 'восемь' },
      { num: 9, kanji: '九枚', kana: 'きゅうまい', romaji: 'kyuumai', ru: 'девять' },
      { num: 10, kanji: '十枚', kana: 'じゅうまい', romaji: 'juumai', ru: 'десять' },
    ],
    exampleNouns: [
      { jp: '紙', romaji: 'kami', ru: 'бумага' },
      { jp: '切符', romaji: 'kippu', ru: 'билет' },
      { jp: 'シャツ', romaji: 'shatsu', ru: 'рубашка' },
      { jp: '皿', romaji: 'sara', ru: 'тарелка' },
    ],
  },
  {
    id: 'hiki',
    counter: '匹',
    name: 'hiki / biki / piki',
    nameRu: 'маленькие животные',
    description: 'small animals (cats, dogs, fish, insects)',
    emoji: '🐱',
    readings: [
      { num: 1, kanji: '一匹', kana: 'いっぴき', romaji: 'ippiki', ru: 'одно (животное)' },
      { num: 2, kanji: '二匹', kana: 'にひき', romaji: 'nihiki', ru: 'два' },
      { num: 3, kanji: '三匹', kana: 'さんびき', romaji: 'sanbiki', ru: 'три' },
      { num: 4, kanji: '四匹', kana: 'よんひき', romaji: 'yonhiki', ru: 'четыре' },
      { num: 5, kanji: '五匹', kana: 'ごひき', romaji: 'gohiki', ru: 'пять' },
      { num: 6, kanji: '六匹', kana: 'ろっぴき', romaji: 'roppiki', ru: 'шесть' },
      { num: 7, kanji: '七匹', kana: 'ななひき', romaji: 'nanahiki', ru: 'семь' },
      { num: 8, kanji: '八匹', kana: 'はっぴき', romaji: 'happiki', ru: 'восемь' },
      { num: 9, kanji: '九匹', kana: 'きゅうひき', romaji: 'kyuuhiki', ru: 'девять' },
      { num: 10, kanji: '十匹', kana: 'じゅっぴき', romaji: 'juppiki', ru: 'десять' },
    ],
    exampleNouns: [
      { jp: '猫', romaji: 'neko', ru: 'кошка' },
      { jp: '犬', romaji: 'inu', ru: 'собака' },
      { jp: '魚', romaji: 'sakana', ru: 'рыба' },
    ],
  },
  {
    id: 'dai',
    counter: '台',
    name: 'dai',
    nameRu: 'машины, техника',
    description: 'machines, vehicles, appliances',
    emoji: '🚗',
    readings: [
      { num: 1, kanji: '一台', kana: 'いちだい', romaji: 'ichidai', ru: 'одна (машина/техника)' },
      { num: 2, kanji: '二台', kana: 'にだい', romaji: 'nidai', ru: 'две' },
      { num: 3, kanji: '三台', kana: 'さんだい', romaji: 'sandai', ru: 'три' },
      { num: 4, kanji: '四台', kana: 'よんだい', romaji: 'yondai', ru: 'четыре' },
      { num: 5, kanji: '五台', kana: 'ごだい', romaji: 'godai', ru: 'пять' },
      { num: 6, kanji: '六台', kana: 'ろくだい', romaji: 'rokudai', ru: 'шесть' },
      { num: 7, kanji: '七台', kana: 'ななだい', romaji: 'nanadai', ru: 'семь' },
      { num: 8, kanji: '八台', kana: 'はちだい', romaji: 'hachidai', ru: 'восемь' },
      { num: 9, kanji: '九台', kana: 'きゅうだい', romaji: 'kyuudai', ru: 'девять' },
      { num: 10, kanji: '十台', kana: 'じゅうだい', romaji: 'juudai', ru: 'десять' },
    ],
    exampleNouns: [
      { jp: '車', romaji: 'kuruma', ru: 'машина' },
      { jp: 'パソコン', romaji: 'pasokon', ru: 'компьютер' },
      { jp: 'テレビ', romaji: 'terebi', ru: 'телевизор' },
    ],
  },
  {
    id: 'satsu',
    counter: '冊',
    name: 'satsu',
    nameRu: 'книги, тома',
    description: 'books, volumes, bound objects',
    emoji: '📚',
    readings: [
      { num: 1, kanji: '一冊', kana: 'いっさつ', romaji: 'issatsu', ru: 'одна (книга)' },
      { num: 2, kanji: '二冊', kana: 'にさつ', romaji: 'nisatsu', ru: 'две' },
      { num: 3, kanji: '三冊', kana: 'さんさつ', romaji: 'sansatsu', ru: 'три' },
      { num: 4, kanji: '四冊', kana: 'よんさつ', romaji: 'yonsatsu', ru: 'четыре' },
      { num: 5, kanji: '五冊', kana: 'ごさつ', romaji: 'gosatsu', ru: 'пять' },
      { num: 6, kanji: '六冊', kana: 'ろくさつ', romaji: 'rokusatsu', ru: 'шесть' },
      { num: 7, kanji: '七冊', kana: 'ななさつ', romaji: 'nanasatsu', ru: 'семь' },
      { num: 8, kanji: '八冊', kana: 'はっさつ', romaji: 'hassatsu', ru: 'восемь' },
      { num: 9, kanji: '九冊', kana: 'きゅうさつ', romaji: 'kyuusatsu', ru: 'девять' },
      { num: 10, kanji: '十冊', kana: 'じゅっさつ', romaji: 'jussatsu', ru: 'десять' },
    ],
    exampleNouns: [
      { jp: '本', romaji: 'hon', ru: 'книга' },
      { jp: 'ノート', romaji: 'nooto', ru: 'тетрадь' },
      { jp: '辞書', romaji: 'jisho', ru: 'словарь' },
    ],
  },
  {
    id: 'hai',
    counter: '杯',
    name: 'hai / bai / pai',
    nameRu: 'чашки, стаканы',
    description: 'cups, glasses, bowls of liquid/food',
    emoji: '☕',
    readings: [
      { num: 1, kanji: '一杯', kana: 'いっぱい', romaji: 'ippai', ru: 'одна (чашка/стакан)' },
      { num: 2, kanji: '二杯', kana: 'にはい', romaji: 'nihai', ru: 'две' },
      { num: 3, kanji: '三杯', kana: 'さんばい', romaji: 'sanbai', ru: 'три' },
      { num: 4, kanji: '四杯', kana: 'よんはい', romaji: 'yonhai', ru: 'четыре' },
      { num: 5, kanji: '五杯', kana: 'ごはい', romaji: 'gohai', ru: 'пять' },
      { num: 6, kanji: '六杯', kana: 'ろっぱい', romaji: 'roppai', ru: 'шесть' },
      { num: 7, kanji: '七杯', kana: 'ななはい', romaji: 'nanahai', ru: 'семь' },
      { num: 8, kanji: '八杯', kana: 'はっぱい', romaji: 'happai', ru: 'восемь' },
      { num: 9, kanji: '九杯', kana: 'きゅうはい', romaji: 'kyuuhai', ru: 'девять' },
      { num: 10, kanji: '十杯', kana: 'じゅっぱい', romaji: 'juppai', ru: 'десять' },
    ],
    exampleNouns: [
      { jp: 'コーヒー', romaji: 'koohii', ru: 'кофе' },
      { jp: 'お茶', romaji: 'ocha', ru: 'чай' },
      { jp: 'ビール', romaji: 'biiru', ru: 'пиво (стакан)' },
    ],
  },
  {
    id: 'kai_floor',
    counter: '階',
    name: 'kai / gai',
    nameRu: 'этажи',
    description: 'floors of a building',
    emoji: '🏢',
    readings: [
      { num: 1, kanji: '一階', kana: 'いっかい', romaji: 'ikkai', ru: 'первый этаж' },
      { num: 2, kanji: '二階', kana: 'にかい', romaji: 'nikai', ru: 'второй этаж' },
      { num: 3, kanji: '三階', kana: 'さんがい', romaji: 'sangai', ru: 'третий этаж' },
      { num: 4, kanji: '四階', kana: 'よんかい', romaji: 'yonkai', ru: 'четвёртый этаж' },
      { num: 5, kanji: '五階', kana: 'ごかい', romaji: 'gokai', ru: 'пятый этаж' },
      { num: 6, kanji: '六階', kana: 'ろっかい', romaji: 'rokkai', ru: 'шестой этаж' },
      { num: 7, kanji: '七階', kana: 'ななかい', romaji: 'nanakai', ru: 'седьмой этаж' },
      { num: 8, kanji: '八階', kana: 'はっかい', romaji: 'hakkai', ru: 'восьмой этаж' },
      { num: 9, kanji: '九階', kana: 'きゅうかい', romaji: 'kyuukai', ru: 'девятый этаж' },
      { num: 10, kanji: '十階', kana: 'じゅっかい', romaji: 'jukkai', ru: 'десятый этаж' },
    ],
    exampleNouns: [
      { jp: 'ビル', romaji: 'biru', ru: 'здание' },
      { jp: 'デパート', romaji: 'depaato', ru: 'универмаг' },
      { jp: 'マンション', romaji: 'manshon', ru: 'квартирный дом' },
    ],
  },
  {
    id: 'kai_times',
    counter: '回',
    name: 'kai',
    nameRu: 'разы',
    description: 'times, occurrences',
    emoji: '🔁',
    readings: [
      { num: 1, kanji: '一回', kana: 'いっかい', romaji: 'ikkai', ru: 'один раз' },
      { num: 2, kanji: '二回', kana: 'にかい', romaji: 'nikai', ru: 'два раза' },
      { num: 3, kanji: '三回', kana: 'さんかい', romaji: 'sankai', ru: 'три раза' },
      { num: 4, kanji: '四回', kana: 'よんかい', romaji: 'yonkai', ru: 'четыре раза' },
      { num: 5, kanji: '五回', kana: 'ごかい', romaji: 'gokai', ru: 'пять раз' },
      { num: 6, kanji: '六回', kana: 'ろっかい', romaji: 'rokkai', ru: 'шесть раз' },
      { num: 7, kanji: '七回', kana: 'ななかい', romaji: 'nanakai', ru: 'семь раз' },
      { num: 8, kanji: '八回', kana: 'はっかい', romaji: 'hakkai', ru: 'восемь раз' },
      { num: 9, kanji: '九回', kana: 'きゅうかい', romaji: 'kyuukai', ru: 'девять раз' },
      { num: 10, kanji: '十回', kana: 'じゅっかい', romaji: 'jukkai', ru: 'десять раз' },
    ],
    exampleNouns: [
      { jp: '練習', romaji: 'renshuu', ru: 'тренировка' },
      { jp: '旅行', romaji: 'ryokou', ru: 'путешествие' },
    ],
  },
  {
    id: 'sai',
    counter: '歳/才',
    name: 'sai',
    nameRu: 'возраст',
    description: 'age (years old)',
    emoji: '🎂',
    readings: [
      { num: 1, kanji: '一歳', kana: 'いっさい', romaji: 'issai', ru: 'один год (возраст)' },
      { num: 2, kanji: '二歳', kana: 'にさい', romaji: 'nisai', ru: 'два года' },
      { num: 3, kanji: '三歳', kana: 'さんさい', romaji: 'sansai', ru: 'три года' },
      { num: 4, kanji: '四歳', kana: 'よんさい', romaji: 'yonsai', ru: 'четыре года' },
      { num: 5, kanji: '五歳', kana: 'ごさい', romaji: 'gosai', ru: 'пять лет' },
      { num: 6, kanji: '六歳', kana: 'ろくさい', romaji: 'rokusai', ru: 'шесть лет' },
      { num: 7, kanji: '七歳', kana: 'ななさい', romaji: 'nanasai', ru: 'семь лет' },
      { num: 8, kanji: '八歳', kana: 'はっさい', romaji: 'hassai', ru: 'восемь лет' },
      { num: 9, kanji: '九歳', kana: 'きゅうさい', romaji: 'kyuusai', ru: 'девять лет' },
      { num: 10, kanji: '十歳', kana: 'じゅっさい', romaji: 'jussai', ru: 'десять лет' },
    ],
    exampleNouns: [
      { jp: '子ども', romaji: 'kodomo', ru: 'ребёнок' },
      { jp: '赤ちゃん', romaji: 'akachan', ru: 'малыш' },
    ],
  },
  {
    id: 'ko',
    counter: '個',
    name: 'ko',
    nameRu: 'маленькие предметы',
    description: 'small (often round) objects',
    emoji: '🍎',
    readings: [
      { num: 1, kanji: '一個', kana: 'いっこ', romaji: 'ikko', ru: 'один (маленький предмет)' },
      { num: 2, kanji: '二個', kana: 'にこ', romaji: 'niko', ru: 'два' },
      { num: 3, kanji: '三個', kana: 'さんこ', romaji: 'sanko', ru: 'три' },
      { num: 4, kanji: '四個', kana: 'よんこ', romaji: 'yonko', ru: 'четыре' },
      { num: 5, kanji: '五個', kana: 'ごこ', romaji: 'goko', ru: 'пять' },
      { num: 6, kanji: '六個', kana: 'ろっこ', romaji: 'rokko', ru: 'шесть' },
      { num: 7, kanji: '七個', kana: 'ななこ', romaji: 'nanako', ru: 'семь' },
      { num: 8, kanji: '八個', kana: 'はっこ', romaji: 'hakko', ru: 'восемь' },
      { num: 9, kanji: '九個', kana: 'きゅうこ', romaji: 'kyuuko', ru: 'девять' },
      { num: 10, kanji: '十個', kana: 'じゅっこ', romaji: 'jukko', ru: 'десять' },
    ],
    exampleNouns: [
      { jp: 'りんご', romaji: 'ringo', ru: 'яблоко' },
      { jp: '卵', romaji: 'tamago', ru: 'яйцо' },
      { jp: 'ボール', romaji: 'booru', ru: 'мяч' },
    ],
  },
  {
    id: 'ji',
    counter: '時',
    name: 'ji',
    nameRu: 'часы (время)',
    description: "o'clock (hours)",
    emoji: '🕐',
    readings: [
      { num: 1, kanji: '一時', kana: 'いちじ', romaji: 'ichiji', ru: 'один час' },
      { num: 2, kanji: '二時', kana: 'にじ', romaji: 'niji', ru: 'два часа' },
      { num: 3, kanji: '三時', kana: 'さんじ', romaji: 'sanji', ru: 'три часа' },
      { num: 4, kanji: '四時', kana: 'よじ', romaji: 'yoji', ru: 'четыре часа' },
      { num: 5, kanji: '五時', kana: 'ごじ', romaji: 'goji', ru: 'пять часов' },
      { num: 6, kanji: '六時', kana: 'ろくじ', romaji: 'rokuji', ru: 'шесть часов' },
      { num: 7, kanji: '七時', kana: 'しちじ', romaji: 'shichiji', ru: 'семь часов' },
      { num: 8, kanji: '八時', kana: 'はちじ', romaji: 'hachiji', ru: 'восемь часов' },
      { num: 9, kanji: '九時', kana: 'くじ', romaji: 'kuji', ru: 'девять часов' },
      { num: 10, kanji: '十時', kana: 'じゅうじ', romaji: 'juuji', ru: 'десять часов' },
    ],
    exampleNouns: [
      { jp: '朝', romaji: 'asa', ru: 'утро' },
      { jp: '会議', romaji: 'kaigi', ru: 'собрание' },
    ],
  },
  {
    id: 'fun',
    counter: '分',
    name: 'fun / pun',
    nameRu: 'минуты',
    description: 'minutes',
    emoji: '⏱',
    readings: [
      { num: 1, kanji: '一分', kana: 'いっぷん', romaji: 'ippun', ru: 'одна минута' },
      { num: 2, kanji: '二分', kana: 'にふん', romaji: 'nifun', ru: 'две минуты' },
      { num: 3, kanji: '三分', kana: 'さんぷん', romaji: 'sanpun', ru: 'три минуты' },
      { num: 4, kanji: '四分', kana: 'よんぷん', romaji: 'yonpun', ru: 'четыре минуты' },
      { num: 5, kanji: '五分', kana: 'ごふん', romaji: 'gofun', ru: 'пять минут' },
      { num: 6, kanji: '六分', kana: 'ろっぷん', romaji: 'roppun', ru: 'шесть минут' },
      { num: 7, kanji: '七分', kana: 'ななふん', romaji: 'nanafun', ru: 'семь минут' },
      { num: 8, kanji: '八分', kana: 'はっぷん', romaji: 'happun', ru: 'восемь минут' },
      { num: 9, kanji: '九分', kana: 'きゅうふん', romaji: 'kyuufun', ru: 'девять минут' },
      { num: 10, kanji: '十分', kana: 'じゅっぷん', romaji: 'juppun', ru: 'десять минут' },
    ],
    exampleNouns: [
      { jp: '時間', romaji: 'jikan', ru: 'время' },
      { jp: '電車', romaji: 'densha', ru: 'поезд' },
    ],
  },
  {
    id: 'nichi',
    counter: '日',
    name: 'nichi / ka',
    nameRu: 'дни месяца',
    description: 'days of the month',
    emoji: '📅',
    readings: [
      { num: 1, kanji: '一日', kana: 'ついたち', romaji: 'tsuitachi', ru: 'первое (число)' },
      { num: 2, kanji: '二日', kana: 'ふつか', romaji: 'futsuka', ru: 'второе' },
      { num: 3, kanji: '三日', kana: 'みっか', romaji: 'mikka', ru: 'третье' },
      { num: 4, kanji: '四日', kana: 'よっか', romaji: 'yokka', ru: 'четвёртое' },
      { num: 5, kanji: '五日', kana: 'いつか', romaji: 'itsuka', ru: 'пятое' },
      { num: 6, kanji: '六日', kana: 'むいか', romaji: 'muika', ru: 'шестое' },
      { num: 7, kanji: '七日', kana: 'なのか', romaji: 'nanoka', ru: 'седьмое' },
      { num: 8, kanji: '八日', kana: 'ようか', romaji: 'youka', ru: 'восьмое' },
      { num: 9, kanji: '九日', kana: 'ここのか', romaji: 'kokonoka', ru: 'девятое' },
      { num: 10, kanji: '十日', kana: 'とおか', romaji: 'tooka', ru: 'десятое' },
    ],
    exampleNouns: [
      { jp: '誕生日', romaji: 'tanjoubi', ru: 'день рождения' },
      { jp: '休み', romaji: 'yasumi', ru: 'выходной' },
    ],
  },
]

// ─── Quiz modes ─────────────────────────────────────────────────────────────────

const MODES = [
  { key: 'counter', label: 'counter selection', labelJp: '助数詞えらび', description: 'given a noun + number, pick the correct reading' },
  { key: 'reading', label: 'reading quiz', labelJp: '読み方', description: 'given kanji expression, pick the correct reading' },
  { key: 'usage', label: 'usage quiz', labelJp: '使い方', description: 'given an object, pick the correct counter' },
]

// ─── Question generators ────────────────────────────────────────────────────────

function pickUniqueOptions(candidates, correctText, limit = 3) {
  const seen = new Set([correctText])
  const picked = []

  candidates.forEach(option => {
    if (picked.length >= limit || !option?.text || seen.has(option.text)) return
    seen.add(option.text)
    picked.push(option)
  })

  return picked
}

function generateCounterQuestion(selectedCounters) {
  const counter = selectedCounters[Math.floor(Math.random() * selectedCounters.length)]
  const reading = counter.readings[Math.floor(Math.random() * counter.readings.length)]
  const noun = counter.exampleNouns[Math.floor(Math.random() * counter.exampleNouns.length)]

  // Build wrong options from other counters' readings with the same number
  const wrongPool = selectedCounters
    .filter(c => c.id !== counter.id)
    .map(c => c.readings.find(r => r.num === reading.num))
    .filter(Boolean)

  // Also add some readings from the same counter but different numbers
  const sameCounterWrong = counter.readings
    .filter(r => r.num !== reading.num)

  const allWrong = shuffle([...wrongPool, ...sameCounterWrong]).map(r => ({
    text: r.kana,
    romaji: r.romaji,
    isCorrect: false,
  }))
  const wrongOptions = pickUniqueOptions(allWrong, reading.kana)

  const correctOption = {
    text: reading.kana,
    romaji: reading.romaji,
    isCorrect: true,
  }

  // Ensure we have 4 options
  let guard = 0
  while (wrongOptions.length < 3 && guard++ < 100) {
    const fallback = selectedCounters[Math.floor(Math.random() * selectedCounters.length)]
    const fallbackReading = fallback.readings[Math.floor(Math.random() * fallback.readings.length)]
    if (fallbackReading.kana !== reading.kana && !wrongOptions.some(w => w.text === fallbackReading.kana)) {
      wrongOptions.push({ text: fallbackReading.kana, romaji: fallbackReading.romaji, isCorrect: false })
    }
  }

  return {
    prompt: `${noun.jp}（${noun.romaji}）${reading.num}${counter.counter}`,
    promptRu: `${reading.num} ${noun.ru}`,
    promptNum: reading.num,
    questionLabel: 'how do you read this?',
    correct: correctOption,
    options: shuffle([correctOption, ...wrongOptions.slice(0, 3)]),
    detail: `${reading.kanji} = ${reading.kana}（${reading.romaji}）`,
    counterName: counter.name,
    counterEmoji: counter.emoji || '🔢',
    counterDesc: counter.description,
    counterKanji: counter.counter,
  }
}

function generateReadingQuestion(selectedCounters) {
  const counter = selectedCounters[Math.floor(Math.random() * selectedCounters.length)]
  const reading = counter.readings[Math.floor(Math.random() * counter.readings.length)]

  // Wrong options: other readings from same counter + other counters
  const sameCounterWrong = counter.readings
    .filter(r => r.num !== reading.num)
    .map(r => ({ text: r.kana, romaji: r.romaji, isCorrect: false }))

  const otherCounterWrong = selectedCounters
    .filter(c => c.id !== counter.id)
    .flatMap(c => c.readings)
    .filter(r => r.kana !== reading.kana)
    .map(r => ({ text: r.kana, romaji: r.romaji, isCorrect: false }))

  const allWrong = shuffle([...sameCounterWrong, ...otherCounterWrong])
  const wrongOptions = pickUniqueOptions(allWrong, reading.kana)

  const correctOption = {
    text: reading.kana,
    romaji: reading.romaji,
    isCorrect: true,
  }

  let guard2 = 0
  while (wrongOptions.length < 3 && guard2++ < 100) {
    const fallback = selectedCounters[Math.floor(Math.random() * selectedCounters.length)]
    const fallbackReading = fallback.readings[Math.floor(Math.random() * fallback.readings.length)]
    if (fallbackReading.kana !== reading.kana && !wrongOptions.some(w => w.text === fallbackReading.kana)) {
      wrongOptions.push({ text: fallbackReading.kana, romaji: fallbackReading.romaji, isCorrect: false })
    }
  }

  return {
    prompt: reading.kanji,
    promptRu: reading.ru,
    promptNum: reading.num,
    questionLabel: 'how do you read this kanji?',
    correct: correctOption,
    options: shuffle([correctOption, ...wrongOptions.slice(0, 3)]),
    detail: `${reading.kanji} = ${reading.kana}（${reading.romaji}）`,
    counterName: counter.name,
    counterEmoji: counter.emoji || '🔢',
    counterDesc: counter.description,
    counterKanji: counter.counter,
  }
}

function generateUsageQuestion(selectedCounters) {
  const counter = selectedCounters[Math.floor(Math.random() * selectedCounters.length)]
  const noun = counter.exampleNouns[Math.floor(Math.random() * counter.exampleNouns.length)]

  const wrongCounters = shuffle(selectedCounters.filter(c => c.id !== counter.id))
  const wrongOptions = pickUniqueOptions(wrongCounters.map(c => ({
    text: c.counter,
    romaji: c.name,
    isCorrect: false,
    description: c.nameRu,
  })), counter.counter)

  const correctOption = {
    text: counter.counter,
    romaji: counter.name,
    isCorrect: true,
    description: counter.nameRu,
  }

  let guard = 0
  while (wrongOptions.length < 3 && guard < 200) {
    guard++
    const fallback = countersData[Math.floor(Math.random() * countersData.length)]
    if (fallback.id !== counter.id && !wrongOptions.some(w => w.text === fallback.counter)) {
      wrongOptions.push({ text: fallback.counter, romaji: fallback.name, isCorrect: false, description: fallback.nameRu })
    }
  }

  return {
    prompt: `${noun.jp}（${noun.romaji}）`,
    promptRu: `${noun.ru} — какой счётчик?`,
    questionLabel: 'which counter do you use?',
    correct: correctOption,
    options: shuffle([correctOption, ...wrongOptions.slice(0, 3)]),
    detail: `${noun.jp} → ${counter.counter}（${counter.name}）— ${counter.nameRu}`,
    counterName: counter.name,
    counterEmoji: counter.emoji || '🔢',
    counterDesc: counter.description,
    counterKanji: counter.counter,
  }
}

function generateQuestions(selectedCounters, mode, count) {
  const generators = {
    counter: generateCounterQuestion,
    reading: generateReadingQuestion,
    usage: generateUsageQuestion,
  }
  const gen = generators[mode]
  const questions = []
  const seen = new Set()

  for (let i = 0; i < count * 3 && questions.length < count; i++) {
    const q = gen(selectedCounters)
    const key = q.prompt + q.correct.text
    if (!seen.has(key)) {
      seen.add(key)
      questions.push(q)
    }
  }

  return shuffle(questions)
}

// ─── Main component ─────────────────────────────────────────────────────────────

export default function CounterQuiz() {
  const isTablet = useIsTablet()
  const { saveQuizResult } = useProgress()
  const { awardXP, calculateQuizXP } = useXP()
  const [phase, setPhase] = useState(PHASE_SETUP)
  const [showCountdown, setShowCountdown] = useState(false)

  // setup state
  const [selectedCounterIds, setSelectedCounterIds] = useState([])
  const [quizMode, setQuizMode] = useState('counter')
  const [questionCount, setQuestionCount] = useState(10)
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

  const toggleCounter = (id) => {
    setSelectedCounterIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selectedCounterIds.length === countersData.length) {
      setSelectedCounterIds([])
    } else {
      setSelectedCounterIds(countersData.map(c => c.id))
    }
  }

  const selectedCounters = countersData.filter(c => selectedCounterIds.includes(c.id))
  const canStart = selectedCounters.length >= (quizMode === 'usage' ? 4 : 2)

  const startQuiz = () => {
    if (!canStart) return
    xpAwardedRef.current = false
    const qs = generateQuestions(selectedCounters, quizMode, questionCount)
    if (!qs || qs.length === 0) return
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

  const startMistakesQuiz = (repeatCount) => {
    if (mistakes.length === 0) return
    let repeated = []
    for (let i = 0; i < repeatCount; i++) {
      repeated = repeated.concat(mistakes.map(m => m.question))
    }
    const qs = shuffle(repeated)
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
    if (showCountdown || selectedAnswer !== null || answerLockedRef.current) return
    answerLockedRef.current = true
    advanceLockedRef.current = false

    const correct = option.isCorrect
    setSelectedAnswer(option)
    setIsCorrect(correct)

    if (correct) {
      setScore(prev => prev + 1)
      setStreak(prev => { const n = prev + 1; setBestStreak(b => Math.max(b, n)); return n })
    } else {
      setMistakes(prev => [...prev, {
        question: questions[currentIndex],
        yourAnswer: option.text,
      }])
      setStreak(0)
    }

    const delay = correct ? 1000 : 3500

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
  }, [showCountdown, selectedAnswer, questions, currentIndex])

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
          handleAnswer({ isCorrect: false, text: '__TIMEOUT__' })
          return 0
        }
        return Math.max(0, prev - 0.1)
      })
    }, 100)
    return () => clearInterval(countdownRef.current)
  }, [isTimed, showCountdown, selectedAnswer, currentIndex, phase, handleAnswer])

  // save score on results (only once per quiz session)
  useEffect(() => {
    if (phase === PHASE_RESULTS && questions.length > 0 && !xpAwardedRef.current) {
      xpAwardedRef.current = true
      saveQuizResult('vocab', { mode: quizMode, score, total: questions.length })
      const xp = calculateQuizXP(score, questions.length)
      if (xp > 0) awardXP(xp, 'counter quiz', score === questions.length && questions.length > 0)
    }
  }, [phase, score, questions.length, quizMode, saveQuizResult, awardXP, calculateQuizXP])

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
          selectedCounterIds={selectedCounterIds}
          toggleCounter={toggleCounter}
          selectAll={selectAll}
          quizMode={quizMode}
          setQuizMode={setQuizMode}
          questionCount={questionCount}
          setQuestionCount={setQuestionCount}
          canStart={canStart}
          onStart={startQuiz}
          isTimed={isTimed} setIsTimed={setIsTimed}
          timeLimit={timeLimit} setTimeLimit={setTimeLimit}
          customTimerVal={customTimerVal} setCustomTimerVal={setCustomTimerVal}
        />
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
          quizMode={quizMode}
          isTimed={isTimed} timeLeft={timeLeft} timeLimit={timeLimit}
          inputPaused={showCountdown}
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

// ─── Setup Screen ───────────────────────────────────────────────────────────────

function SetupScreen({ selectedCounterIds, toggleCounter, selectAll, quizMode, setQuizMode, questionCount, setQuestionCount, canStart, onStart, isTimed, setIsTimed, timeLimit, setTimeLimit, customTimerVal, setCustomTimerVal }) {
  const totalReadings = countersData
    .filter(c => selectedCounterIds.includes(c.id))
    .reduce((sum, c) => sum + c.readings.length, 0)

  return (
    <div className="animate-fadeInUp">
      <div style={styles.header}>
        <h1 style={styles.title}>
          <span>数</span> counter quiz <span style={styles.titleJp}>助数詞テスト</span>
        </h1>
        <p style={styles.subtitle}>practice Japanese counter words 🐱</p>
      </div>

      {/* quiz mode */}
      <div className="glass" style={styles.setupCard}>
        <div style={styles.setupLabel}>
          <span>🎯</span> quiz mode
        </div>
        <div style={styles.modeRow}>
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => setQuizMode(m.key)}
              style={{
                ...styles.modeBtn,
                ...(quizMode === m.key ? styles.modeBtnActive : {}),
              }}
            >
              <span style={styles.modeBtnLabel}>{m.label}</span>
              <span style={styles.modeBtnJp}>{m.labelJp}</span>
            </button>
          ))}
        </div>
        <p style={styles.modeDesc}>
          {MODES.find(m => m.key === quizMode)?.description}
        </p>
      </div>

      {/* counter selection */}
      <div className="glass" style={styles.setupCard}>
        <div style={styles.setupLabel}>
          <span>📚</span> choose counters
        </div>
        <button onClick={selectAll} className="btn-hover" style={styles.selectAllBtn}>
          {selectedCounterIds.length === countersData.length ? 'deselect all' : 'select all'}
        </button>
        <div style={styles.counterCheckGrid}>
          {countersData.map(c => (
            <label
              key={c.id}
              style={{
                ...styles.counterCheck,
                ...(selectedCounterIds.includes(c.id) ? styles.counterCheckActive : {}),
              }}
            >
              <input
                type="checkbox"
                checked={selectedCounterIds.includes(c.id)}
                onChange={() => toggleCounter(c.id)}
                style={{ display: 'none' }}
              />
              <span style={styles.checkEmoji}>{c.emoji || '🔢'}</span>
              <span style={styles.checkCounter}>{c.counter}</span>
              <span style={styles.checkName}>{c.name}</span>
              <span style={styles.checkNameRu}>{c.nameRu}</span>
            </label>
          ))}
        </div>
        {selectedCounterIds.length > 0 && (
          <div style={styles.poolInfo}>
            {selectedCounterIds.length} counters, {totalReadings} readings in pool 🌸
          </div>
        )}
      </div>

      {/* question count */}
      <div className="glass" style={styles.setupCard}>
        <div style={styles.setupLabel}>
          <span>🔢</span> how many questions?
        </div>
        <div style={styles.countRow}>
          {[10, 20, 30].map(n => (
            <button
              key={n}
              onClick={() => setQuestionCount(n)}
              style={{
                ...styles.countBtn,
                ...(questionCount === n ? styles.countBtnActive : {}),
              }}
            >
              {n}
            </button>
          ))}
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

      {/* start button */}
      <div style={styles.startWrap}>
        <button
          className="btn btn-cute"
          onClick={onStart}
          disabled={!canStart}
          style={{ opacity: canStart ? 1 : 0.5, pointerEvents: canStart ? 'auto' : 'none', maxWidth: 240 }}
        >
          start quiz ✨
        </button>
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <Link to="/quiz/numbers" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>number quiz 🔢</Link>
          <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
        </div>
        {!canStart && selectedCounterIds.length > 0 && (
          <p style={styles.warnText}>
            {quizMode === 'usage' ? 'need at least 4 counters for usage mode' : 'need at least 2 counters'}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Quiz Screen ────────────────────────────────────────────────────────────────

function QuizScreen({ question, currentIndex, totalQuestions, selectedAnswer, isCorrect, score, streak, onAnswer, quizMode, isTimed, timeLeft, timeLimit, inputPaused = false, onSkip }) {
  const isMobile = useIsMobile()
  const progress = ((currentIndex + 1) / totalQuestions) * 100

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

  const COUNTER_FEEDBACK = ['✨ correct! sugoi~', '✨ yoku dekita!', '✨ kanpeki!', '✨ hai, seikai!', '✨ counter master!']
  const feedbackMsg = COUNTER_FEEDBACK[currentIndex % COUNTER_FEEDBACK.length]

  return (
    <div className="animate-fadeInUp">
      {/* progress */}
      <div style={styles.progressWrap}>
        <div style={styles.progressInfo}>
          <Link to="/" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', opacity: 0.5, textDecoration: 'none', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', flexShrink: 0 }} aria-label="exit quiz">✕</Link>
          <span style={styles.progressText}>{currentIndex + 1} / {totalQuestions}</span>
          <span style={styles.scoreText} aria-live="polite" aria-atomic="true">
            score: {score} 🐱
            {streak >= 3 && <span style={styles.streakBadge} className="animate-pop" key={streak}>{streak >= 7 ? '🔥🔥' : streak >= 5 ? '🔥' : '⚡'} {streak}x</span>}
          </span>
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

      {/* counter type badge */}
      {question.counterEmoji && (
        <div style={styles.counterTypeBadge}>
          <span style={styles.counterTypeEmoji}>{question.counterEmoji}</span>
          <span style={styles.counterTypeKanji}>{question.counterKanji}</span>
          <span style={styles.counterTypeDesc}>{question.counterDesc}</span>
        </div>
      )}

      {/* question card */}
      <div
        className="glass animate-pop"
        key={`question-card-${currentIndex}`}
        style={{
          ...styles.questionCard,
          ...(!prefersReducedMotion && isCorrect === false ? { animation: 'shake 0.4s ease' } : {}),
        }}
      >
        <div style={styles.questionLabel}>{question.questionLabel}</div>
        <div style={{ ...styles.questionWord, fontSize: isMobile ? '1.8rem' : '2.4rem' }}>{question.prompt}</div>
        <div style={styles.questionRomaji}>{question.promptRu}</div>
      </div>

      {/* keyboard hint */}
      {!inputPaused && !selectedAnswer && (
        <div style={styles.keyboardHint}>
          <span style={styles.keyboardHintChip}>⌨ 1–4</span>
          <span style={styles.keyboardHintText}>to answer</span>
        </div>
      )}

      {/* options */}
      <div key={`question-options-${currentIndex}`} style={{ ...styles.optionsGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
        {question.options.map((opt, i) => {
          let optStyle = { ...styles.option }

          if (selectedAnswer) {
            if (opt.isCorrect) {
              optStyle = { ...optStyle, ...styles.optionCorrect }
            } else if (selectedAnswer === opt && !isCorrect) {
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
              <span style={styles.optionMain}>{opt.text}</span>
              {quizMode === 'usage' && opt.description && (
                <span style={styles.optionSub}>{opt.description}</span>
              )}
              {quizMode !== 'usage' && (
                <span style={styles.optionRomaji}>{opt.romaji}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* feedback */}
      {selectedAnswer && (
        <div
          style={{
            ...styles.feedback,
            color: isCorrect ? 'var(--correct-text)' : 'var(--incorrect-text)',
          }}
          className="animate-pop"
        >
          {isCorrect
            ? feedbackMsg
            : (
              <span>
                ✗ {question.detail}
                {question.counterDesc && (
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(244,63,94,0.75)', marginTop: 5 }}>
                    {question.counterDesc}
                  </div>
                )}
              </span>
            )
          }
        </div>
      )}
      {selectedAnswer && (
        <div onClick={onSkip} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSkip() } }} aria-label="continue to next question" style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 4, cursor: 'pointer' }}>
          нажми чтобы продолжить →
        </div>
      )}
    </div>
  )
}

// ─── Results Screen ─────────────────────────────────────────────────────────────

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

        {/* missed counter breakdown */}
        {mistakes.length > 0 && (() => {
          const counts = {}
          mistakes.forEach(m => {
            const key = m.question.counterName || m.question.counterKanji
            if (!counts[key]) counts[key] = { count: 0, emoji: m.question.counterEmoji, kanji: m.question.counterKanji }
            counts[key].count++
          })
          const sorted = Object.entries(counts).sort((a, b) => b[1].count - a[1].count)
          if (sorted.length < 2) return null
          return (
            <div style={{ marginBottom: 14, width: '100%' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                missed counters
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {sorted.map(([name, info]) => (
                  <div key={name} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', borderRadius: 50,
                    background: info.count >= 3 ? 'rgba(244,63,94,0.12)' : 'rgba(192,132,252,0.1)',
                    border: `1.5px solid ${info.count >= 3 ? 'rgba(244,63,94,0.25)' : 'rgba(192,132,252,0.2)'}`,
                  }}>
                    <span style={{ fontSize: '0.85rem' }}>{info.emoji}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: info.count >= 3 ? 'var(--incorrect-text)' : 'var(--text-main)' }}>{info.kanji}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)' }}>×{info.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* mistakes list */}
        {mistakes.length > 0 && (
          <div style={styles.mistakesSection}>
            <div style={styles.mistakesLabel}>mistakes ({mistakes.length}) ✏️</div>
            <div style={styles.mistakesList}>
              {mistakes.map((m, i) => (
                <div key={(m.question.prompt || '') + i} style={styles.mistakeItem}>
                  <div style={styles.mistakeWord}>{m.question.prompt}</div>
                  <div style={styles.mistakeCorrect}>{m.question.correct.text}（{m.question.correct.romaji}）</div>
                  <div style={styles.mistakeYours}>you: {m.yourAnswer === '__TIMEOUT__' ? '⏱ время вышло' : m.yourAnswer}</div>
                </div>
              ))}
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
                className="btn btn-primary"
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
            <ShareResult quizName="counter quiz" score={score} total={total} percentage={percentage} bestStreak={bestStreak} xpEarned={calculateQuizXP(score, total)} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/quiz/numbers" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>numbers 🔢</Link>
            <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

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
    fontSize: '0.85rem',
    color: 'var(--text-light)',
    fontWeight: 500,
  },
  setupCard: {
    padding: 18,
    marginBottom: 14,
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
  modeRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  modeBtn: {
    flex: 1,
    minWidth: 90,
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
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'lowercase',
  },
  modeBtnActive: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(192,132,252,0.15))',
    border: '1.5px solid #c084fc',
    boxShadow: '0 2px 8px rgba(192, 132, 252, 0.15)',
  },
  modeBtnLabel: {
    fontWeight: 700,
  },
  modeBtnJp: {
    fontSize: '0.78rem',
    color: 'var(--text-light)',
    fontWeight: 500,
  },
  modeDesc: {
    marginTop: 10,
    fontSize: '0.75rem',
    color: 'var(--text-light)',
    fontWeight: 500,
    textAlign: 'center',
    fontStyle: 'italic',
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
  counterCheckGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 8,
  },
  counterCheck: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '10px 8px',
    borderRadius: 12,
    background: 'var(--tint)',
    border: '1.5px solid rgba(192,132,252,0.25)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '0.8rem',
    minHeight: 44,
  },
  counterCheckActive: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(192,132,252,0.15))',
    border: '1.5px solid #f472b6',
    boxShadow: '0 2px 8px rgba(244, 114, 182, 0.15)',
  },
  checkEmoji: {
    fontSize: '1.1rem',
    lineHeight: 1,
  },
  checkCounter: {
    fontWeight: 900,
    color: 'var(--text-light)',
    fontSize: '1.2rem',
  },
  checkName: {
    fontWeight: 700,
    color: 'var(--text-main)',
    fontSize: '0.72rem',
  },
  checkNameRu: {
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
  countRow: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
  },
  countBtn: {
    padding: '10px 24px',
    borderRadius: 50,
    background: 'var(--tint-medium)',
    border: '1.5px solid rgba(192,132,252,0.25)',
    fontSize: '1rem',
    fontWeight: 800,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: 44,
  },
  countBtnActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    color: 'white',
    border: '1.5px solid transparent',
    boxShadow: '0 4px 12px rgba(236, 72, 153, 0.25)',
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
    marginTop: 28,
    marginBottom: 14,
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

  // counter type badge
  counterTypeBadge: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginBottom: 8,
    padding: '6px 16px',
    borderRadius: 50,
    background: 'linear-gradient(135deg, rgba(244,114,182,0.1), rgba(192,132,252,0.1))',
    border: '1.5px solid rgba(192,132,252,0.25)',
    width: 'fit-content',
    margin: '0 auto 10px',
  },
  counterTypeEmoji: { fontSize: '1.1rem' },
  counterTypeKanji: { fontSize: '1rem', fontWeight: 900, color: 'var(--text-light)' },
  counterTypeDesc: { fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 500 },

  // keyboard hint
  keyboardHint: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginBottom: 8, marginTop: -4,
  },
  keyboardHintChip: {
    padding: '2px 10px', borderRadius: 50,
    background: 'rgba(168,85,247,0.1)',
    border: '1px solid rgba(168,85,247,0.2)',
    fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)',
  },
  keyboardHintText: { fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 500 },
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
    padding: '24px 20px',
    marginBottom: 12,
  },
  questionLabel: {
    fontSize: '0.9rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    marginBottom: 10,
    textTransform: 'lowercase',
  },
  questionWord: {
    fontSize: '2.2rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    marginBottom: 8,
    lineHeight: 1.2,
  },
  questionRomaji: {
    fontSize: '0.9rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    fontStyle: 'italic',
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
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 66,
  },
  optionMain: {
    fontSize: '1.1rem',
    fontWeight: 800,
  },
  optionSub: {
    fontSize: '0.78rem',
    color: 'var(--text-light)',
    fontWeight: 500,
  },
  optionRomaji: {
    fontSize: '0.75rem',
    color: 'var(--text-light)',
    fontWeight: 500,
    fontStyle: 'italic',
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
}
