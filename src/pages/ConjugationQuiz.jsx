import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { useXP } from '../hooks/useXP'
import { useIsMobile, useIsTablet } from '../hooks/useIsMobile'
import { useUnlockedLessons } from '../hooks/useUnlockedLessons'
import Confetti from '../components/Confetti'
import ShareResult from '../components/ShareResult'
import QuizCountdown from '../components/QuizCountdown'
import { getStoredQuizSize } from '../utils/localSettings'
import { getTrackedLessons } from '../utils/lessonProgress'
import { prefersReducedMotion as getPrefersReducedMotion } from '../utils/motion'

const prefersReducedMotion = getPrefersReducedMotion()

// ─── Verb dataset ───────────────────────────────────────────────────────────
// Each verb: { masu, romaji, russian, group, forms: { masu, te, nai, ta, jisho, kanou, teiru, ukemi, ishi } }
// forms include both japanese and romaji for each

const VERBS = [
  // ── Group I (五段動詞 / godan) ──
  {
    masu: '書きます', romaji: 'kakimasu', russian: 'писать', group: 1, lesson: 6,
    forms: {
      masu:  { jp: '書きます', rm: 'kakimasu' },
      te:    { jp: '書いて', rm: 'kaite' },
      nai:   { jp: '書かない', rm: 'kakanai' },
      ta:    { jp: '書いた', rm: 'kaita' },
      jisho: { jp: '書く', rm: 'kaku' },
      kanou: { jp: '書ける', rm: 'kakeru' },
      teiru: { jp: '書いている', rm: 'kaiteiru' },
      ukemi: { jp: '書かれる', rm: 'kakareru' },
      ishi:  { jp: '書こう', rm: 'kakou' },
    },
  },
  {
    masu: '読みます', romaji: 'yomimasu', russian: 'читать', group: 1, lesson: 6,
    forms: {
      masu:  { jp: '読みます', rm: 'yomimasu' },
      te:    { jp: '読んで', rm: 'yonde' },
      nai:   { jp: '読まない', rm: 'yomanai' },
      ta:    { jp: '読んだ', rm: 'yonda' },
      jisho: { jp: '読む', rm: 'yomu' },
      kanou: { jp: '読める', rm: 'yomeru' },
      teiru: { jp: '読んでいる', rm: 'yondeiru' },
      ukemi: { jp: '読まれる', rm: 'yomareru' },
      ishi:  { jp: '読もう', rm: 'yomou' },
    },
  },
  {
    masu: '飲みます', romaji: 'nomimasu', russian: 'пить', group: 1, lesson: 6,
    forms: {
      masu:  { jp: '飲みます', rm: 'nomimasu' },
      te:    { jp: '飲んで', rm: 'nonde' },
      nai:   { jp: '飲まない', rm: 'nomanai' },
      ta:    { jp: '飲んだ', rm: 'nonda' },
      jisho: { jp: '飲む', rm: 'nomu' },
      kanou: { jp: '飲める', rm: 'nomeru' },
      teiru: { jp: '飲んでいる', rm: 'nondeiru' },
      ukemi: { jp: '飲まれる', rm: 'nomareru' },
      ishi:  { jp: '飲もう', rm: 'nomou' },
    },
  },
  {
    masu: '行きます', romaji: 'ikimasu', russian: 'идти', group: 1, lesson: 5,
    forms: {
      masu:  { jp: '行きます', rm: 'ikimasu' },
      te:    { jp: '行って', rm: 'itte' },
      nai:   { jp: '行かない', rm: 'ikanai' },
      ta:    { jp: '行った', rm: 'itta' },
      jisho: { jp: '行く', rm: 'iku' },
      kanou: { jp: '行ける', rm: 'ikeru' },
      teiru: { jp: '行っている', rm: 'itteiru' },
      ukemi: { jp: '行かれる', rm: 'ikareru' },
      ishi:  { jp: '行こう', rm: 'ikou' },
    },
  },
  {
    masu: '話します', romaji: 'hanashimasu', russian: 'говорить', group: 1, lesson: 14,
    forms: {
      masu:  { jp: '話します', rm: 'hanashimasu' },
      te:    { jp: '話して', rm: 'hanashite' },
      nai:   { jp: '話さない', rm: 'hanasanai' },
      ta:    { jp: '話した', rm: 'hanashita' },
      jisho: { jp: '話す', rm: 'hanasu' },
      kanou: { jp: '話せる', rm: 'hanaseru' },
      teiru: { jp: '話している', rm: 'hanashiteiru' },
      ukemi: { jp: '話される', rm: 'hanasareru' },
      ishi:  { jp: '話そう', rm: 'hanasou' },
    },
  },
  {
    masu: '聞きます', romaji: 'kikimasu', russian: 'слушать', group: 1, lesson: 6,
    forms: {
      masu:  { jp: '聞きます', rm: 'kikimasu' },
      te:    { jp: '聞いて', rm: 'kiite' },
      nai:   { jp: '聞かない', rm: 'kikanai' },
      ta:    { jp: '聞いた', rm: 'kiita' },
      jisho: { jp: '聞く', rm: 'kiku' },
      kanou: { jp: '聞ける', rm: 'kikeru' },
      teiru: { jp: '聞いている', rm: 'kiiteiru' },
      ukemi: { jp: '聞かれる', rm: 'kikareru' },
      ishi:  { jp: '聞こう', rm: 'kikou' },
    },
  },
  {
    masu: '待ちます', romaji: 'machimasu', russian: 'ждать', group: 1, lesson: 14,
    forms: {
      masu:  { jp: '待ちます', rm: 'machimasu' },
      te:    { jp: '待って', rm: 'matte' },
      nai:   { jp: '待たない', rm: 'matanai' },
      ta:    { jp: '待った', rm: 'matta' },
      jisho: { jp: '待つ', rm: 'matsu' },
      kanou: { jp: '待てる', rm: 'materu' },
      teiru: { jp: '待っている', rm: 'matteiru' },
      ukemi: { jp: '待たれる', rm: 'matareru' },
      ishi:  { jp: '待とう', rm: 'matou' },
    },
  },
  {
    masu: '買います', romaji: 'kaimasu', russian: 'покупать', group: 1, lesson: 6,
    forms: {
      masu:  { jp: '買います', rm: 'kaimasu' },
      te:    { jp: '買って', rm: 'katte' },
      nai:   { jp: '買わない', rm: 'kawanai' },
      ta:    { jp: '買った', rm: 'katta' },
      jisho: { jp: '買う', rm: 'kau' },
      kanou: { jp: '買える', rm: 'kaeru' },
      teiru: { jp: '買っている', rm: 'katteiru' },
      ukemi: { jp: '買われる', rm: 'kawareru' },
      ishi:  { jp: '買おう', rm: 'kaou' },
    },
  },
  {
    masu: '帰ります', romaji: 'kaerimasu', russian: 'возвращаться', group: 1, lesson: 5,
    forms: {
      masu:  { jp: '帰ります', rm: 'kaerimasu' },
      te:    { jp: '帰って', rm: 'kaette' },
      nai:   { jp: '帰らない', rm: 'kaeranai' },
      ta:    { jp: '帰った', rm: 'kaetta' },
      jisho: { jp: '帰る', rm: 'kaeru' },
      kanou: { jp: '帰れる', rm: 'kaereru' },
      teiru: { jp: '帰っている', rm: 'kaetteiru' },
      ukemi: { jp: '帰られる', rm: 'kaerareru' },
      ishi:  { jp: '帰ろう', rm: 'kaerou' },
    },
  },
  {
    masu: '泳ぎます', romaji: 'oyogimasu', russian: 'плавать', group: 1, lesson: 13,
    forms: {
      masu:  { jp: '泳ぎます', rm: 'oyogimasu' },
      te:    { jp: '泳いで', rm: 'oyoide' },
      nai:   { jp: '泳がない', rm: 'oyoganai' },
      ta:    { jp: '泳いだ', rm: 'oyoida' },
      jisho: { jp: '泳ぐ', rm: 'oyogu' },
      kanou: { jp: '泳げる', rm: 'oyogeru' },
      teiru: { jp: '泳いでいる', rm: 'oyoideiru' },
      ukemi: { jp: '泳がれる', rm: 'oyogareru' },
      ishi:  { jp: '泳ごう', rm: 'oyogou' },
    },
  },
  {
    masu: '遊びます', romaji: 'asobimasu', russian: 'играть', group: 1, lesson: 13,
    forms: {
      masu:  { jp: '遊びます', rm: 'asobimasu' },
      te:    { jp: '遊んで', rm: 'asonde' },
      nai:   { jp: '遊ばない', rm: 'asobanai' },
      ta:    { jp: '遊んだ', rm: 'asonda' },
      jisho: { jp: '遊ぶ', rm: 'asobu' },
      kanou: { jp: '遊べる', rm: 'asoberu' },
      teiru: { jp: '遊んでいる', rm: 'asondeiru' },
      ukemi: { jp: '遊ばれる', rm: 'asobareru' },
      ishi:  { jp: '遊ぼう', rm: 'asobou' },
    },
  },
  {
    masu: '死にます', romaji: 'shinimasu', russian: 'умирать', group: 1,
    forms: {
      masu:  { jp: '死にます', rm: 'shinimasu' },
      te:    { jp: '死んで', rm: 'shinde' },
      nai:   { jp: '死なない', rm: 'shinanai' },
      ta:    { jp: '死んだ', rm: 'shinda' },
      jisho: { jp: '死ぬ', rm: 'shinu' },
      kanou: { jp: '死ねる', rm: 'shineru' },
      teiru: { jp: '死んでいる', rm: 'shindeiru' },
      ukemi: { jp: '死なれる', rm: 'shinareru' },
      ishi:  { jp: '死のう', rm: 'shinou' },
    },
  },
  {
    masu: '作ります', romaji: 'tsukurimasu', russian: 'делать/создавать', group: 1, lesson: 15,
    forms: {
      masu:  { jp: '作ります', rm: 'tsukurimasu' },
      te:    { jp: '作って', rm: 'tsukutte' },
      nai:   { jp: '作らない', rm: 'tsukuranai' },
      ta:    { jp: '作った', rm: 'tsukutta' },
      jisho: { jp: '作る', rm: 'tsukuru' },
      kanou: { jp: '作れる', rm: 'tsukureru' },
      teiru: { jp: '作っている', rm: 'tsukutteiru' },
      ukemi: { jp: '作られる', rm: 'tsukurareru' },
      ishi:  { jp: '作ろう', rm: 'tsukurou' },
    },
  },
  {
    masu: '持ちます', romaji: 'mochimasu', russian: 'держать/иметь', group: 1, lesson: 14,
    forms: {
      masu:  { jp: '持ちます', rm: 'mochimasu' },
      te:    { jp: '持って', rm: 'motte' },
      nai:   { jp: '持たない', rm: 'motanai' },
      ta:    { jp: '持った', rm: 'motta' },
      jisho: { jp: '持つ', rm: 'motsu' },
      kanou: { jp: '持てる', rm: 'moteru' },
      teiru: { jp: '持っている', rm: 'motteiru' },
      ukemi: { jp: '持たれる', rm: 'motareru' },
      ishi:  { jp: '持とう', rm: 'motou' },
    },
  },
  {
    masu: '立ちます', romaji: 'tachimasu', russian: 'стоять/вставать', group: 1, lesson: 14,
    forms: {
      masu:  { jp: '立ちます', rm: 'tachimasu' },
      te:    { jp: '立って', rm: 'tatte' },
      nai:   { jp: '立たない', rm: 'tatanai' },
      ta:    { jp: '立った', rm: 'tatta' },
      jisho: { jp: '立つ', rm: 'tatsu' },
      kanou: { jp: '立てる', rm: 'tateru' },
      teiru: { jp: '立っている', rm: 'tatteiru' },
      ukemi: { jp: '立たれる', rm: 'tatareru' },
      ishi:  { jp: '立とう', rm: 'tatou' },
    },
  },

  // ── Group II (一段動詞 / ichidan) ──
  {
    masu: '食べます', romaji: 'tabemasu', russian: 'есть (кушать)', group: 2, lesson: 6,
    forms: {
      masu:  { jp: '食べます', rm: 'tabemasu' },
      te:    { jp: '食べて', rm: 'tabete' },
      nai:   { jp: '食べない', rm: 'tabenai' },
      ta:    { jp: '食べた', rm: 'tabeta' },
      jisho: { jp: '食べる', rm: 'taberu' },
      kanou: { jp: '食べられる', rm: 'taberareru' },
      teiru: { jp: '食べている', rm: 'tabeteiru' },
      ukemi: { jp: '食べられる', rm: 'taberareru' },
      ishi:  { jp: '食べよう', rm: 'tabeyou' },
    },
  },
  {
    masu: '見ます', romaji: 'mimasu', russian: 'смотреть', group: 2, lesson: 6,
    forms: {
      masu:  { jp: '見ます', rm: 'mimasu' },
      te:    { jp: '見て', rm: 'mite' },
      nai:   { jp: '見ない', rm: 'minai' },
      ta:    { jp: '見た', rm: 'mita' },
      jisho: { jp: '見る', rm: 'miru' },
      kanou: { jp: '見られる', rm: 'mirareru' },
      teiru: { jp: '見ている', rm: 'miteiru' },
      ukemi: { jp: '見られる', rm: 'mirareru' },
      ishi:  { jp: '見よう', rm: 'miyou' },
    },
  },
  {
    masu: '起きます', romaji: 'okimasu', russian: 'вставать', group: 2, lesson: 4,
    forms: {
      masu:  { jp: '起きます', rm: 'okimasu' },
      te:    { jp: '起きて', rm: 'okite' },
      nai:   { jp: '起きない', rm: 'okinai' },
      ta:    { jp: '起きた', rm: 'okita' },
      jisho: { jp: '起きる', rm: 'okiru' },
      kanou: { jp: '起きられる', rm: 'okirareru' },
      teiru: { jp: '起きている', rm: 'okiteiru' },
      ukemi: { jp: '起きられる', rm: 'okirareru' },
      ishi:  { jp: '起きよう', rm: 'okiyou' },
    },
  },
  {
    masu: '寝ます', romaji: 'nemasu', russian: 'спать', group: 2, lesson: 4,
    forms: {
      masu:  { jp: '寝ます', rm: 'nemasu' },
      te:    { jp: '寝て', rm: 'nete' },
      nai:   { jp: '寝ない', rm: 'nenai' },
      ta:    { jp: '寝た', rm: 'neta' },
      jisho: { jp: '寝る', rm: 'neru' },
      kanou: { jp: '寝られる', rm: 'nerareru' },
      teiru: { jp: '寝ている', rm: 'neteiru' },
      ukemi: { jp: '寝られる', rm: 'nerareru' },
      ishi:  { jp: '寝よう', rm: 'neyou' },
    },
  },
  {
    masu: '教えます', romaji: 'oshiemasu', russian: 'учить/преподавать', group: 2, lesson: 7,
    forms: {
      masu:  { jp: '教えます', rm: 'oshiemasu' },
      te:    { jp: '教えて', rm: 'oshiete' },
      nai:   { jp: '教えない', rm: 'oshienai' },
      ta:    { jp: '教えた', rm: 'oshieta' },
      jisho: { jp: '教える', rm: 'oshieru' },
      kanou: { jp: '教えられる', rm: 'oshierareru' },
      teiru: { jp: '教えている', rm: 'oshieteiru' },
      ukemi: { jp: '教えられる', rm: 'oshierareru' },
      ishi:  { jp: '教えよう', rm: 'oshieyou' },
    },
  },
  {
    masu: '開けます', romaji: 'akemasu', russian: 'открывать', group: 2, lesson: 14,
    forms: {
      masu:  { jp: '開けます', rm: 'akemasu' },
      te:    { jp: '開けて', rm: 'akete' },
      nai:   { jp: '開けない', rm: 'akenai' },
      ta:    { jp: '開けた', rm: 'aketa' },
      jisho: { jp: '開ける', rm: 'akeru' },
      kanou: { jp: '開けられる', rm: 'akerareru' },
      teiru: { jp: '開けている', rm: 'aketeiru' },
      ukemi: { jp: '開けられる', rm: 'akerareru' },
      ishi:  { jp: '開けよう', rm: 'akeyou' },
    },
  },
  {
    masu: '閉めます', romaji: 'shimemasu', russian: 'закрывать', group: 2, lesson: 14,
    forms: {
      masu:  { jp: '閉めます', rm: 'shimemasu' },
      te:    { jp: '閉めて', rm: 'shimete' },
      nai:   { jp: '閉めない', rm: 'shimenai' },
      ta:    { jp: '閉めた', rm: 'shimeta' },
      jisho: { jp: '閉める', rm: 'shimeru' },
      kanou: { jp: '閉められる', rm: 'shimerareru' },
      teiru: { jp: '閉めている', rm: 'shimeteiru' },
      ukemi: { jp: '閉められる', rm: 'shimerareru' },
      ishi:  { jp: '閉めよう', rm: 'shimeyou' },
    },
  },
  {
    masu: '着ます', romaji: 'kimasu', russian: 'надевать', group: 2, lesson: 22,
    forms: {
      masu:  { jp: '着ます', rm: 'kimasu' },
      te:    { jp: '着て', rm: 'kite' },
      nai:   { jp: '着ない', rm: 'kinai' },
      ta:    { jp: '着た', rm: 'kita' },
      jisho: { jp: '着る', rm: 'kiru' },
      kanou: { jp: '着られる', rm: 'kirareru' },
      teiru: { jp: '着ている', rm: 'kiteiru' },
      ukemi: { jp: '着られる', rm: 'kirareru' },
      ishi:  { jp: '着よう', rm: 'kiyou' },
    },
  },
  {
    masu: '出ます', romaji: 'demasu', russian: 'выходить', group: 2, lesson: 14,
    forms: {
      masu:  { jp: '出ます', rm: 'demasu' },
      te:    { jp: '出て', rm: 'dete' },
      nai:   { jp: '出ない', rm: 'denai' },
      ta:    { jp: '出た', rm: 'deta' },
      jisho: { jp: '出る', rm: 'deru' },
      kanou: { jp: '出られる', rm: 'derareru' },
      teiru: { jp: '出ている', rm: 'deteiru' },
      ukemi: { jp: '出られる', rm: 'derareru' },
      ishi:  { jp: '出よう', rm: 'deyou' },
    },
  },
  {
    masu: '忘れます', romaji: 'wasuremasu', russian: 'забывать', group: 2, lesson: 17,
    forms: {
      masu:  { jp: '忘れます', rm: 'wasuremasu' },
      te:    { jp: '忘れて', rm: 'wasurete' },
      nai:   { jp: '忘れない', rm: 'wasurenai' },
      ta:    { jp: '忘れた', rm: 'wasureta' },
      jisho: { jp: '忘れる', rm: 'wasureru' },
      kanou: { jp: '忘れられる', rm: 'wasurerareru' },
      teiru: { jp: '忘れている', rm: 'wasureteiru' },
      ukemi: { jp: '忘れられる', rm: 'wasurerareru' },
      ishi:  { jp: '忘れよう', rm: 'wasureyou' },
    },
  },

  // ── Group III (不規則動詞 / irregular) ──
  {
    masu: 'します', romaji: 'shimasu', russian: 'делать', group: 3, lesson: 6,
    forms: {
      masu:  { jp: 'します', rm: 'shimasu' },
      te:    { jp: 'して', rm: 'shite' },
      nai:   { jp: 'しない', rm: 'shinai' },
      ta:    { jp: 'した', rm: 'shita' },
      jisho: { jp: 'する', rm: 'suru' },
      kanou: { jp: 'できる', rm: 'dekiru' },
      teiru: { jp: 'している', rm: 'shiteiru' },
      ukemi: { jp: 'される', rm: 'sareru' },
      ishi:  { jp: 'しよう', rm: 'shiyou' },
    },
  },
  {
    masu: '来ます', romaji: 'kimasu', russian: 'приходить', group: 3, lesson: 5,
    forms: {
      masu:  { jp: '来ます', rm: 'kimasu' },
      te:    { jp: '来て', rm: 'kite' },
      nai:   { jp: '来ない', rm: 'konai' },
      ta:    { jp: '来た', rm: 'kita' },
      jisho: { jp: '来る', rm: 'kuru' },
      kanou: { jp: '来られる', rm: 'korareru' },
      teiru: { jp: '来ている', rm: 'kiteiru' },
      ukemi: { jp: '来られる', rm: 'korareru' },
      ishi:  { jp: '来よう', rm: 'koyou' },
    },
  },
  {
    masu: '洗います', romaji: 'araimasu', russian: 'мыть', group: 1, lesson: 18,
    forms: {
      masu:  { jp: '洗います', rm: 'araimasu' },
      te:    { jp: '洗って', rm: 'aratte' },
      nai:   { jp: '洗わない', rm: 'arawanai' },
      ta:    { jp: '洗った', rm: 'aratta' },
      jisho: { jp: '洗う', rm: 'arau' },
      kanou: { jp: '洗える', rm: 'araeru' },
      teiru: { jp: '洗っている', rm: 'aratteiru' },
      ukemi: { jp: '洗われる', rm: 'arawareru' },
      ishi:  { jp: '洗おう', rm: 'araou' },
    },
  },
  {
    masu: '消します', romaji: 'keshimasu', russian: 'выключать / стирать', group: 1, lesson: 14,
    forms: {
      masu:  { jp: '消します', rm: 'keshimasu' },
      te:    { jp: '消して', rm: 'keshite' },
      nai:   { jp: '消さない', rm: 'kesanai' },
      ta:    { jp: '消した', rm: 'keshita' },
      jisho: { jp: '消す', rm: 'kesu' },
      kanou: { jp: '消せる', rm: 'keseru' },
      teiru: { jp: '消している', rm: 'keshiteiru' },
      ukemi: { jp: '消される', rm: 'kesareru' },
      ishi:  { jp: '消そう', rm: 'kesou' },
    },
  },
  {
    masu: 'つけます', romaji: 'tsukemasu', russian: 'включать / надевать', group: 2, lesson: 14,
    forms: {
      masu:  { jp: 'つけます', rm: 'tsukemasu' },
      te:    { jp: 'つけて', rm: 'tsukete' },
      nai:   { jp: 'つけない', rm: 'tsukenai' },
      ta:    { jp: 'つけた', rm: 'tsuketa' },
      jisho: { jp: 'つける', rm: 'tsukeru' },
      kanou: { jp: 'つけられる', rm: 'tsukerareru' },
      teiru: { jp: 'つけている', rm: 'tsuketeiru' },
      ukemi: { jp: 'つけられる', rm: 'tsukerareru' },
      ishi:  { jp: 'つけよう', rm: 'tsukeyou' },
    },
  },
  {
    masu: '取ります', romaji: 'torimasu', russian: 'брать / снимать', group: 1,
    forms: {
      masu:  { jp: '取ります', rm: 'torimasu' },
      te:    { jp: '取って', rm: 'totte' },
      nai:   { jp: '取らない', rm: 'toranai' },
      ta:    { jp: '取った', rm: 'totta' },
      jisho: { jp: '取る', rm: 'toru' },
      kanou: { jp: '取れる', rm: 'toreru' },
      teiru: { jp: '取っている', rm: 'totteiru' },
      ukemi: { jp: '取られる', rm: 'torareru' },
      ishi:  { jp: '取ろう', rm: 'torou' },
    },
  },
  // ── Lesson 7 ──
  {
    masu: '送ります', romaji: 'okurimasu', russian: 'отправлять', group: 1, lesson: 7,
    forms: {
      masu:  { jp: '送ります', rm: 'okurimasu' },
      te:    { jp: '送って', rm: 'okutte' },
      nai:   { jp: '送らない', rm: 'okuranai' },
      ta:    { jp: '送った', rm: 'okutta' },
      jisho: { jp: '送る', rm: 'okuru' },
      kanou: { jp: '送れる', rm: 'okureru' },
      teiru: { jp: '送っている', rm: 'okutteiru' },
      ukemi: { jp: '送られる', rm: 'okurareru' },
      ishi:  { jp: '送ろう', rm: 'okurou' },
    },
  },
  {
    masu: '貸します', romaji: 'kashimasu', russian: 'давать в долг', group: 1, lesson: 7,
    forms: {
      masu:  { jp: '貸します', rm: 'kashimasu' },
      te:    { jp: '貸して', rm: 'kashite' },
      nai:   { jp: '貸さない', rm: 'kasanai' },
      ta:    { jp: '貸した', rm: 'kashita' },
      jisho: { jp: '貸す', rm: 'kasu' },
      kanou: { jp: '貸せる', rm: 'kaseru' },
      teiru: { jp: '貸している', rm: 'kashiteiru' },
      ukemi: { jp: '貸される', rm: 'kasareru' },
      ishi:  { jp: '貸そう', rm: 'kasou' },
    },
  },
  // ── Lesson 12 ──
  {
    masu: '使います', romaji: 'tsukaimasu', russian: 'использовать', group: 1, lesson: 12,
    forms: {
      masu:  { jp: '使います', rm: 'tsukaimasu' },
      te:    { jp: '使って', rm: 'tsukatte' },
      nai:   { jp: '使わない', rm: 'tsukawanai' },
      ta:    { jp: '使った', rm: 'tsukatta' },
      jisho: { jp: '使う', rm: 'tsukau' },
      kanou: { jp: '使える', rm: 'tsukaeru' },
      teiru: { jp: '使っている', rm: 'tsukatteiru' },
      ukemi: { jp: '使われる', rm: 'tsukawareru' },
      ishi:  { jp: '使おう', rm: 'tsukaou' },
    },
  },
  {
    masu: '呼びます', romaji: 'yobimasu', russian: 'звать / вызывать', group: 1, lesson: 12,
    forms: {
      masu:  { jp: '呼びます', rm: 'yobimasu' },
      te:    { jp: '呼んで', rm: 'yonde' },
      nai:   { jp: '呼ばない', rm: 'yobanai' },
      ta:    { jp: '呼んだ', rm: 'yonda' },
      jisho: { jp: '呼ぶ', rm: 'yobu' },
      kanou: { jp: '呼べる', rm: 'yoberu' },
      teiru: { jp: '呼んでいる', rm: 'yondeiru' },
      ukemi: { jp: '呼ばれる', rm: 'yobareru' },
      ishi:  { jp: '呼ぼう', rm: 'yobou' },
    },
  },
  // ── Lesson 16 ──
  {
    masu: '入れます', romaji: 'iremasu', russian: 'вкладывать / вставлять', group: 2, lesson: 16,
    forms: {
      masu:  { jp: '入れます', rm: 'iremasu' },
      te:    { jp: '入れて', rm: 'irete' },
      nai:   { jp: '入れない', rm: 'irenai' },
      ta:    { jp: '入れた', rm: 'ireta' },
      jisho: { jp: '入れる', rm: 'ireru' },
      kanou: { jp: '入れられる', rm: 'irerareru' },
      teiru: { jp: '入れている', rm: 'ireteiru' },
      ukemi: { jp: '入れられる', rm: 'irerareru' },
      ishi:  { jp: '入れよう', rm: 'ireyou' },
    },
  },
  {
    masu: '始めます', romaji: 'hajimemasu', russian: 'начинать', group: 2, lesson: 16,
    forms: {
      masu:  { jp: '始めます', rm: 'hajimemasu' },
      te:    { jp: '始めて', rm: 'hajimete' },
      nai:   { jp: '始めない', rm: 'hajimenai' },
      ta:    { jp: '始めた', rm: 'hajimeta' },
      jisho: { jp: '始める', rm: 'hajimeru' },
      kanou: { jp: '始められる', rm: 'hajimerareru' },
      teiru: { jp: '始めている', rm: 'hajimeteiru' },
      ukemi: { jp: '始められる', rm: 'hajimerareru' },
      ishi:  { jp: '始めよう', rm: 'hajimeyou' },
    },
  },
  // ── Lesson 18 ──
  {
    masu: '弾きます', romaji: 'hikimasu', russian: 'играть (на инструменте)', group: 1, lesson: 18,
    forms: {
      masu:  { jp: '弾きます', rm: 'hikimasu' },
      te:    { jp: '弾いて', rm: 'hiite' },
      nai:   { jp: '弾かない', rm: 'hikanai' },
      ta:    { jp: '弾いた', rm: 'hiita' },
      jisho: { jp: '弾く', rm: 'hiku' },
      kanou: { jp: '弾ける', rm: 'hikeru' },
      teiru: { jp: '弾いている', rm: 'hiiteiru' },
      ukemi: { jp: '弾かれる', rm: 'hikareru' },
      ishi:  { jp: '弾こう', rm: 'hikou' },
    },
  },
  {
    masu: '歌います', romaji: 'utaimasu', russian: 'петь', group: 1, lesson: 18,
    forms: {
      masu:  { jp: '歌います', rm: 'utaimasu' },
      te:    { jp: '歌って', rm: 'utatte' },
      nai:   { jp: '歌わない', rm: 'utawanai' },
      ta:    { jp: '歌った', rm: 'utatta' },
      jisho: { jp: '歌う', rm: 'utau' },
      kanou: { jp: '歌える', rm: 'utaeru' },
      teiru: { jp: '歌っている', rm: 'utatteiru' },
      ukemi: { jp: '歌われる', rm: 'utawareru' },
      ishi:  { jp: '歌おう', rm: 'utaou' },
    },
  },
  // ── Lesson 19 ──
  {
    masu: '登ります', romaji: 'noborimasu', russian: 'подниматься / взбираться', group: 1, lesson: 19,
    forms: {
      masu:  { jp: '登ります', rm: 'noborimasu' },
      te:    { jp: '登って', rm: 'nobotte' },
      nai:   { jp: '登らない', rm: 'noboranai' },
      ta:    { jp: '登った', rm: 'nobotta' },
      jisho: { jp: '登る', rm: 'noboru' },
      kanou: { jp: '登れる', rm: 'noboreru' },
      teiru: { jp: '登っている', rm: 'nobotteiru' },
      ukemi: { jp: '登られる', rm: 'noborareru' },
      ishi:  { jp: '登ろう', rm: 'noborou' },
    },
  },
  {
    masu: 'なります', romaji: 'narimasu', russian: 'становиться', group: 1, lesson: 19,
    forms: {
      masu:  { jp: 'なります', rm: 'narimasu' },
      te:    { jp: 'なって', rm: 'natte' },
      nai:   { jp: 'ならない', rm: 'naranai' },
      ta:    { jp: 'なった', rm: 'natta' },
      jisho: { jp: 'なる', rm: 'naru' },
      kanou: { jp: 'なれる', rm: 'nareru' },
      teiru: { jp: 'なっている', rm: 'natteiru' },
      ukemi: { jp: 'なられる', rm: 'narareru' },
      ishi:  { jp: 'なろう', rm: 'narou' },
    },
  },
  {
    masu: '言います', romaji: 'iimasu', russian: 'говорить / сказать', group: 1, lesson: 20,
    forms: {
      masu:  { jp: '言います', rm: 'iimasu' },
      te:    { jp: '言って', rm: 'itte' },
      nai:   { jp: '言わない', rm: 'iwanai' },
      ta:    { jp: '言った', rm: 'itta' },
      jisho: { jp: '言う', rm: 'iu' },
      kanou: { jp: '言える', rm: 'ieru' },
      teiru: { jp: '言っている', rm: 'itteiru' },
      ukemi: { jp: '言われる', rm: 'iwareru' },
      ishi:  { jp: '言おう', rm: 'iou' },
    },
  },
  {
    masu: '知ります', romaji: 'shirimasu', russian: 'узнавать (知っている = знать)', group: 1, lesson: 21,
    forms: {
      masu:  { jp: '知ります', rm: 'shirimasu' },
      te:    { jp: '知って', rm: 'shitte' },
      nai:   { jp: '知らない', rm: 'shiranai' },
      ta:    { jp: '知った', rm: 'shitta' },
      jisho: { jp: '知る', rm: 'shiru' },
      kanou: { jp: '知れる', rm: 'shireru' },
      teiru: { jp: '知っている', rm: 'shitteiru' },
      ukemi: { jp: '知られる', rm: 'shirareru' },
      ishi:  { jp: '知ろう', rm: 'shirou' },
    },
  },
  {
    masu: '押します', romaji: 'oshimasu', russian: 'нажимать / толкать', group: 1, lesson: 23,
    forms: {
      masu:  { jp: '押します', rm: 'oshimasu' },
      te:    { jp: '押して', rm: 'oshite' },
      nai:   { jp: '押さない', rm: 'osanai' },
      ta:    { jp: '押した', rm: 'oshita' },
      jisho: { jp: '押す', rm: 'osu' },
      kanou: { jp: '押せる', rm: 'oseru' },
      teiru: { jp: '押している', rm: 'oshiteiru' },
      ukemi: { jp: '押される', rm: 'osareru' },
      ishi:  { jp: '押そう', rm: 'osou' },
    },
  },
  {
    masu: '直します', romaji: 'naoshimasu', russian: 'исправлять / чинить', group: 1, lesson: 24,
    forms: {
      masu:  { jp: '直します', rm: 'naoshimasu' },
      te:    { jp: '直して', rm: 'naoshite' },
      nai:   { jp: '直さない', rm: 'naosanai' },
      ta:    { jp: '直した', rm: 'naoshita' },
      jisho: { jp: '直す', rm: 'naosu' },
      kanou: { jp: '直せる', rm: 'naoseru' },
      teiru: { jp: '直している', rm: 'naoshiteiru' },
      ukemi: { jp: '直される', rm: 'naosareru' },
      ishi:  { jp: '直そう', rm: 'naosou' },
    },
  },
  {
    masu: '困ります', romaji: 'komarimasu', russian: 'быть в затруднении / страдать', group: 1, lesson: 25,
    forms: {
      masu:  { jp: '困ります', rm: 'komarimasu' },
      te:    { jp: '困って', rm: 'komatte' },
      nai:   { jp: '困らない', rm: 'komaranai' },
      ta:    { jp: '困った', rm: 'komatta' },
      jisho: { jp: '困る', rm: 'komaru' },
      kanou: { jp: '困れる', rm: 'komareru' },
      teiru: { jp: '困っている', rm: 'komatteiru' },
      ukemi: { jp: '困られる', rm: 'komarareru' },
      ishi:  { jp: '困ろう', rm: 'komarou' },
    },
  },
]

// ─── Form metadata ──────────────────────────────────────────────────────────

const FORM_DEFS = [
  { key: 'masu',  label: 'ます形', labelRm: 'masu-kei', desc: 'polite present' },
  { key: 'te',    label: 'て形',   labelRm: 'te-kei',   desc: 'te-form' },
  { key: 'nai',   label: 'ない形', labelRm: 'nai-kei',  desc: 'negative' },
  { key: 'ta',    label: 'た形',   labelRm: 'ta-kei',   desc: 'past' },
  { key: 'jisho', label: '辞書形', labelRm: 'jisho-kei', desc: 'dictionary' },
  { key: 'kanou', label: '可能形', labelRm: 'kanou-kei', desc: 'potential' },
  { key: 'teiru', label: 'ている', labelRm: 'te-iru',   desc: 'progressive' },
  { key: 'ukemi', label: '受身形', labelRm: 'ukemi-kei', desc: 'passive' },
  { key: 'ishi',  label: '意向形', labelRm: 'ishi-kei',  desc: 'volitional (let\'s)' },
]

const GROUP_DEFS = [
  { key: 1, label: 'Group I',   labelJp: '五段動詞',   emoji: '1️⃣' },
  { key: 2, label: 'Group II',  labelJp: '一段動詞',   emoji: '2️⃣' },
  { key: 3, label: 'Group III', labelJp: '不規則動詞', emoji: '3️⃣' },
]

// ─── Quiz mode types ────────────────────────────────────────────────────────

const QUIZ_MODES = [
  { key: 'conjugate',  label: 'conjugate',      desc: 'verb -> target form',     emoji: '🔄' },
  { key: 'identify',   label: 'identify verb',   desc: 'form -> base verb',       emoji: '🔍' },
  { key: 'pick_form',  label: 'pick the form',   desc: 'verb + form name -> pick', emoji: '🎯' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const scoreReactions = [
  { min: 95, emoji: '🎉✨🔥', text: 'kanpeki!! perfect conjugation master!', textJp: 'かんぺき！すごい！' },
  { min: 90, emoji: '🎉✨', text: 'sugoi!! спряжения на высшем уровне!', textJp: 'すごい！' },
  { min: 70, emoji: '🌸😊', text: 'yoku dekimashita! отлично!', textJp: 'よくできました！' },
  { min: 50, emoji: '🐱💪', text: 'mada mada~ ещё немножко!', textJp: 'まだまだ！' },
  { min: 0, emoji: '🌙📚', text: 'ganbatte! давай повторим~', textJp: 'がんばって！' },
]

const CORRECT_FEEDBACK = [
  '✨ correct! sugoi~',
  '✨ that\'s right! kanpeki!',
  '✨ perfect! yoku dekita!',
  '✨ hai! correct!',
  '✨ nailed it! saikou!',
]

function randomFeedback() {
  return CORRECT_FEEDBACK[Math.floor(Math.random() * CORRECT_FEEDBACK.length)]
}

const PHASE_SETUP = 'setup'
const PHASE_QUIZ = 'quiz'
const PHASE_RESULTS = 'results'

// ─── Question generators ────────────────────────────────────────────────────

function generateConjugateQuestion(verb, targetFormKey, allVerbs) {
  // Show verb in masu form, ask for target form
  const formDef = FORM_DEFS.find(f => f.key === targetFormKey)
  const correctAnswer = verb.forms[targetFormKey].jp
  const correctRm = verb.forms[targetFormKey].rm

  // Generate 3 wrong options from other verbs in the same target form
  const wrongPool = allVerbs
    .filter(v => v.forms[targetFormKey].jp !== correctAnswer)
    .map(v => ({ jp: v.forms[targetFormKey].jp, rm: v.forms[targetFormKey].rm }))
  const wrongOptions = pickUniqueVerbOptions(shuffle(wrongPool), correctAnswer)

  const options = shuffle([
    { jp: correctAnswer, rm: correctRm, correct: true },
    ...wrongOptions.map(w => ({ jp: w.jp, rm: w.rm, correct: false })),
  ])

  return {
    type: 'conjugate',
    prompt: `${formDef.label} (${formDef.desc})`,
    verbDisplay: verb.masu,
    verbRomaji: verb.romaji,
    verbRussian: verb.russian,
    groupLabel: `Group ${verb.group}`,
    correctJp: correctAnswer,
    correctRm: correctRm,
    options,
    _verb: verb,
    _askedFormKey: targetFormKey,
  }
}

function pickUniqueVerbOptions(candidates, correctJp, limit = 3) {
  const seen = new Set([correctJp])
  const picked = []

  candidates.forEach(option => {
    if (picked.length >= limit || !option?.jp || seen.has(option.jp)) return
    seen.add(option.jp)
    picked.push(option)
  })

  return picked
}

function generateIdentifyQuestion(verb, formKey, allVerbs) {
  // Show conjugated form, ask which base verb it is
  const conjugated = verb.forms[formKey].jp
  const conjugatedRm = verb.forms[formKey].rm
  const formDef = FORM_DEFS.find(f => f.key === formKey)

  // Wrong options: other verbs' masu form
  const wrongPool = allVerbs
    .filter(v => v.masu !== verb.masu)
    .map(v => ({ jp: v.masu, rm: v.romaji, russian: v.russian, correct: false }))
  const wrongOptions = pickUniqueVerbOptions(shuffle(wrongPool), verb.masu)

  const options = shuffle([
    { jp: verb.masu, rm: verb.romaji, russian: verb.russian, correct: true },
    ...wrongOptions,
  ])

  return {
    type: 'identify',
    prompt: `which verb is this? (${formDef.label})`,
    verbDisplay: conjugated,
    verbRomaji: conjugatedRm,
    verbRussian: '',
    groupLabel: formDef.label,
    correctJp: verb.masu,
    correctRm: verb.romaji,
    options,
  }
}

function generatePickFormQuestion(verb, targetFormKey, allVerbs) {
  // Show verb + form name, pick the correct conjugation
  const formDef = FORM_DEFS.find(f => f.key === targetFormKey)
  const correctAnswer = verb.forms[targetFormKey].jp
  const correctRm = verb.forms[targetFormKey].rm

  // Wrong options: same verb but other forms, or same form from other verbs
  const wrongFromOtherForms = Object.keys(verb.forms)
    .filter(k => k !== targetFormKey && k !== 'masu')
    .map(k => ({ jp: verb.forms[k].jp, rm: verb.forms[k].rm, correct: false }))
  const wrongFromOtherVerbs = allVerbs
    .filter(v => v.masu !== verb.masu)
    .map(v => ({ jp: v.forms[targetFormKey].jp, rm: v.forms[targetFormKey].rm, correct: false }))

  const allWrong = shuffle([...wrongFromOtherForms, ...wrongFromOtherVerbs])
    .filter(w => w.jp !== correctAnswer)
  const wrongOptions = pickUniqueVerbOptions(allWrong, correctAnswer)

  const options = shuffle([
    { jp: correctAnswer, rm: correctRm, correct: true },
    ...wrongOptions,
  ])

  return {
    type: 'pick_form',
    prompt: `${verb.masu} (${verb.romaji}) -> ${formDef.label}`,
    verbDisplay: verb.masu,
    verbRomaji: verb.romaji,
    verbRussian: verb.russian,
    groupLabel: `Group ${verb.group}`,
    formLabel: formDef.label,
    formDesc: formDef.desc,
    correctJp: correctAnswer,
    correctRm: correctRm,
    options,
    _verb: verb,
    _askedFormKey: targetFormKey,
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ConjugationQuiz() {
  const { saveQuizResult } = useProgress()
  const { awardXP, calculateQuizXP } = useXP()
  const { unlockedLessons } = useUnlockedLessons()
  const unlockedIds = unlockedLessons.map(l => l.id)
  const [phase, setPhase] = useState(PHASE_SETUP)
  const [showCountdown, setShowCountdown] = useState(false)

  // setup state
  const [selectedGroups, setSelectedGroups] = useState([1, 2, 3])
  const [selectedForms, setSelectedForms] = useState(['te', 'nai', 'ta'])
  const [selectedModes, setSelectedModes] = useState(['conjugate'])
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

  const toggleGroup = (g) => {
    setSelectedGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  const toggleForm = (f) => {
    setSelectedForms(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  const toggleMode = (m) => {
    setSelectedModes(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }

  const getPool = () => VERBS.filter(v => selectedGroups.includes(v.group) && unlockedIds.includes(v.lesson))

  const startQuiz = () => {
    const pool = getPool()
    if (pool.length < 4) return
    xpAwardedRef.current = false

    const formsToUse = selectedForms.filter(f => f !== 'masu') // don't quiz masu->masu
    if (formsToUse.length === 0) return

    const count = questionCount === 'all'
      ? pool.length * formsToUse.length
      : Math.min(questionCount, pool.length * formsToUse.length)

    // Generate candidate questions
    const candidates = []
    for (const verb of pool) {
      for (const formKey of formsToUse) {
        for (const mode of selectedModes) {
          candidates.push({ verb, formKey, mode })
        }
      }
    }

    const selected = shuffle(candidates).slice(0, count)

    const qs = selected.map(({ verb, formKey, mode }) => {
      if (mode === 'conjugate') return generateConjugateQuestion(verb, formKey, pool)
      if (mode === 'identify') return generateIdentifyQuestion(verb, formKey, pool)
      return generatePickFormQuestion(verb, formKey, pool)
    })

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
    setQuestions(shuffle(repeated))
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
    setSelectedAnswer(option)
    const correct = option.correct
    setIsCorrect(correct)

    if (correct) {
      setScore(prev => prev + 1)
      setStreak(prev => { const n = prev + 1; setBestStreak(b => Math.max(b, n)); return n })
    } else {
      setMistakes(prev => [...prev, {
        question: questions[currentIndex],
        yourAnswer: option.jp,
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
          handleAnswer({ correct: false, jp: '__TIMEOUT__', rm: '' })
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
      saveQuizResult('grammar', {
        lessons: getTrackedLessons(questions, q => q._verb?.lesson),
        type: 'conjugation',
        score,
        total: questions.length,
      })
      const xp = calculateQuizXP(score, questions.length)
      if (xp > 0) awardXP(xp, 'conjugation quiz', score === questions.length && questions.length > 0)
    }
  }, [phase, score, questions, saveQuizResult, awardXP, calculateQuizXP])

  const pool = getPool()
  const activeForms = selectedForms.filter(f => f !== 'masu')
  const maxQuestions = pool.length * Math.max(activeForms.length, 1) * selectedModes.length
  const canStart = pool.length >= 4 && activeForms.length > 0 && selectedModes.length > 0
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
          selectedGroups={selectedGroups}
          toggleGroup={toggleGroup}
          selectedForms={selectedForms}
          toggleForm={toggleForm}
          selectedModes={selectedModes}
          toggleMode={toggleMode}
          questionCount={questionCount}
          setQuestionCount={setQuestionCount}
          poolSize={pool.length}
          maxQuestions={maxQuestions}
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
          inputPaused={showCountdown}
          verbForCurrentQ={questions[currentIndex]._verb || null}
          isTimed={isTimed} timeLeft={timeLeft} timeLimit={timeLimit}
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
          onRetry={() => setPhase(PHASE_SETUP)}
          onRetryMistakes={startMistakesQuiz}
          calculateQuizXP={calculateQuizXP}
        />
      )}
    </div>
  )
}

// ─── Setup Screen ───────────────────────────────────────────────────────────

function SetupScreen({
  selectedGroups, toggleGroup,
  selectedForms, toggleForm,
  selectedModes, toggleMode,
  questionCount, setQuestionCount,
  poolSize, maxQuestions, canStart, onStart,
  isTimed, setIsTimed, timeLimit, setTimeLimit, customTimerVal, setCustomTimerVal,
}) {
  return (
    <div className="animate-fadeInUp">
      <div style={s.header}>
        <h1 style={s.title}>
          <span>🔀</span> conjugation quiz <span style={s.titleJp}>活用テスト</span>
        </h1>
        <p style={s.subtitle}>master verb conjugation patterns 🌸</p>
      </div>

      {/* verb groups */}
      <div className="glass" style={s.setupCard}>
        <div style={s.setupLabel}><span>📚</span> verb groups</div>
        <div style={s.groupRow}>
          {GROUP_DEFS.map(g => (
            <label
              key={g.key}
              style={{
                ...s.groupBtn,
                ...(selectedGroups.includes(g.key) ? s.groupBtnActive : {}),
              }}
            >
              <input
                type="checkbox"
                checked={selectedGroups.includes(g.key)}
                onChange={() => toggleGroup(g.key)}
                style={{ display: 'none' }}
              />
              <span>{g.emoji}</span>
              <span style={s.groupBtnLabel}>{g.label}</span>
              <span style={s.groupBtnJp}>{g.labelJp}</span>
            </label>
          ))}
        </div>
        <div style={s.poolInfo}>
          {poolSize} verbs in pool 🌸
        </div>
      </div>

      {/* target forms */}
      <div className="glass" style={s.setupCard}>
        <div style={s.setupLabel}><span>🎯</span> conjugation forms</div>
        <div style={s.formGrid}>
          {FORM_DEFS.filter(f => f.key !== 'masu').map(f => (
            <label
              key={f.key}
              style={{
                ...s.formBtn,
                ...(selectedForms.includes(f.key) ? s.formBtnActive : {}),
              }}
            >
              <input
                type="checkbox"
                checked={selectedForms.includes(f.key)}
                onChange={() => toggleForm(f.key)}
                style={{ display: 'none' }}
              />
              <span style={s.formLabelJp}>{f.label}</span>
              <span style={s.formLabelDesc}>{f.desc}</span>
            </label>
          ))}
        </div>
      </div>

      {/* quiz modes */}
      <div className="glass" style={s.setupCard}>
        <div style={s.setupLabel}><span>🎮</span> quiz modes</div>
        <div style={s.modeGrid}>
          {QUIZ_MODES.map(m => (
            <label
              key={m.key}
              style={{
                ...s.modeBtn,
                ...(selectedModes.includes(m.key) ? s.modeBtnActive : {}),
              }}
            >
              <input
                type="checkbox"
                checked={selectedModes.includes(m.key)}
                onChange={() => toggleMode(m.key)}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: '1.2rem' }}>{m.emoji}</span>
              <span style={s.modeBtnLabel}>{m.label}</span>
              <span style={s.modeBtnDesc}>{m.desc}</span>
            </label>
          ))}
        </div>
      </div>

      {/* question count */}
      <div className="glass" style={s.setupCard}>
        <div style={s.setupLabel}><span>🔢</span> how many questions?</div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          {[5, 10, 20].map(n => (
            <button key={n} onClick={() => setQuestionCount(Math.min(n, maxQuestions))} style={{
              padding: '4px 14px', borderRadius: 14, border: 'none', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit',
              background: questionCount === n ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
              color: questionCount === n ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s', minHeight: 44, minWidth: 44,
            }}>{n}</button>
          ))}
          <button onClick={() => setQuestionCount('all')} style={{
            padding: '4px 14px', borderRadius: 14, border: 'none', cursor: 'pointer',
            fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit',
            background: questionCount === 'all' ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
            color: questionCount === 'all' ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s', minHeight: 44,
          }}>all ({maxQuestions})</button>
        </div>
        <div style={s.sliderWrap}>
          <div style={s.sliderValueRow}>
            <input
              type="number"
              aria-label="number of questions"
              min={5}
              max={Math.max(maxQuestions, 5)}
              value={questionCount === 'all' ? maxQuestions : questionCount}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === '') { setQuestionCount(5); return }
                const v = parseInt(raw, 10)
                if (isNaN(v)) return
                if (v >= maxQuestions) setQuestionCount('all')
                else setQuestionCount(Math.max(1, v))
              }}
              onBlur={() => {
                if (questionCount !== 'all' && questionCount < 5) setQuestionCount(5)
              }}
              disabled={maxQuestions < 5}
              style={s.numberInput}
            />
          </div>
          <input
            type="range"
            className="kawaii-slider"
            min={5}
            max={Math.max(maxQuestions, 5)}
            value={questionCount === 'all' ? maxQuestions : questionCount}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10)
              setQuestionCount(v >= maxQuestions ? 'all' : v)
            }}
            aria-label="number of questions"
            disabled={maxQuestions < 5}
          />
          <div style={s.sliderLabels}>
            <span>5</span>
            <button
              onClick={() => setQuestionCount('all')}
              style={{
                ...s.allBtn,
                ...(questionCount === 'all' ? s.allBtnActive : {}),
              }}
            >all</button>
          </div>
        </div>
      </div>

      {/* timer */}
      <div className="glass" style={s.setupCard}>
        <div style={s.setupLabel}><span>⏱</span> timer</div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[{ label: 'выкл', val: 0 }, { label: '10с', val: 10 }, { label: '15с', val: 15 }, { label: '20с', val: 20 }, { label: '30с', val: 30 }].map(({ label, val }) => (
            <button key={label} onClick={() => { if (val === 0) { setIsTimed(false) } else { setIsTimed(true); setTimeLimit(val); setCustomTimerVal('') } }} style={{
              padding: '4px 14px', borderRadius: 14, border: 'none', cursor: 'pointer',
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
            style={{ width: 60, padding: '4px 8px', borderRadius: 14, border: 'none', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit', textAlign: 'center', background: customTimerVal ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)', color: customTimerVal ? '#fff' : 'var(--text-secondary)', minHeight: 44 }}
          />
        </div>
      </div>

      {/* start */}
      <div style={s.startWrap}>
        <button
          className="btn btn-cute"
          onClick={onStart}
          disabled={!canStart}
          style={{ opacity: canStart ? 1 : 0.5, pointerEvents: canStart ? 'auto' : 'none', maxWidth: 240 }}
        >
          start quiz ✨
        </button>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <Link to="/quiz/te-form" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>te-form 🔄</Link>
          <Link to="/conjugation" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>ref 📖</Link>
          <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
        </div>
        {!canStart && poolSize > 0 && (
          <p style={s.warnText}>select at least one form and mode</p>
        )}
      </div>
    </div>
  )
}

// ─── Conjugation rules (shown as hint) ──────────────────────────────────────

const CONJ_RULES = {
  te: {
    1: 'Гл. I: います/ちます/ります→って・にます/びます/みます→んで・きます→いて・ぎます→いで・します→して',
    2: 'Гл. II: убрать ます → て',
    3: 'Гл. III: します→して・きます→きて',
  },
  nai: {
    1: 'Гл. I: убрать ます, замена: う→わ+ない (います→わない, きます→かない, etc.)',
    2: 'Гл. II: убрать ます → ない',
    3: 'Гл. III: します→しない・きます→こない',
  },
  ta: {
    1: 'Гл. I: то же, что て-форма, но て→た и で→だ',
    2: 'Гл. II: убрать ます → た',
    3: 'Гл. III: します→した・きます→きた',
  },
  jisho: {
    1: 'Гл. I: убрать ます, замена: い→う (きます→く, みます→む, etc.)',
    2: 'Гл. II: убрать ます → る',
    3: 'Гл. III: します→する・きます→くる',
  },
  kanou: {
    1: 'Гл. I: убрать ます, замена: い→え + る (きます→ける, みます→める, etc.)',
    2: 'Гл. II: убрать ます → られる',
    3: 'Гл. III: します→できる・きます→こられる',
  },
  teiru: {
    1: 'Гл. I: て-форма + います',
    2: 'Гл. II: て-форма + います',
    3: 'Гл. III: して + います / きて + います',
  },
}

// ─── Quiz Screen ────────────────────────────────────────────────────────────

function QuizScreen({ question, currentIndex, totalQuestions, selectedAnswer, isCorrect, score, streak, onAnswer, inputPaused = false, verbForCurrentQ, isTimed, timeLeft, timeLimit, onSkip }) {
  const isMobile = useIsMobile()
  const progress = ((currentIndex + 1) / totalQuestions) * 100
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

  const renderPrompt = () => {
    if (question.type === 'conjugate') {
      return (
        <>
          <div style={s.questionLabel}>conjugate to</div>
          <div style={s.formBanner}>
            <span style={s.formBannerJp}>{question.prompt.split(' (')[0]}</span>
            <span style={s.formBannerDesc}>{question.prompt.split('(')[1]?.replace(')', '') || ''}</span>
          </div>
          <div style={{ ...s.questionWord, fontSize: isMobile ? '1.9rem' : '2.6rem', marginTop: 10 }}>{question.verbDisplay}</div>
          <div style={s.questionRomaji}>{question.verbRomaji}</div>
          <div style={s.questionRu}>{question.verbRussian}</div>
          <div style={s.verbType}>{question.groupLabel}</div>
        </>
      )
    }
    if (question.type === 'identify') {
      return (
        <>
          <div style={s.questionLabel}>which verb is this?</div>
          <div style={s.formBanner}>
            <span style={s.formBannerJp}>{question.groupLabel}</span>
          </div>
          <div style={{ ...s.questionWord, fontSize: isMobile ? '1.9rem' : '2.6rem', marginTop: 10 }}>{question.verbDisplay}</div>
          <div style={s.questionRomaji}>{question.verbRomaji}</div>
        </>
      )
    }
    // pick_form
    return (
      <>
        <div style={s.questionLabel}>pick the correct form</div>
        <div style={s.formBanner}>
          <span style={s.formBannerJp}>{question.formLabel}</span>
          <span style={s.formBannerDesc}>{question.formDesc}</span>
        </div>
        <div style={{ ...s.questionWord, fontSize: isMobile ? '1.9rem' : '2.6rem', marginTop: 10 }}>{question.verbDisplay}</div>
        <div style={s.questionRomaji}>{question.verbRomaji}</div>
        <div style={s.questionRu}>{question.verbRussian}</div>
        <div style={s.verbType}>{question.groupLabel}</div>
      </>
    )
  }

  const renderOptionText = (opt) => {
    if (question.type === 'identify') {
      return (
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 700 }}>{opt.jp}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: 2 }}>{opt.russian}</div>
        </div>
      )
    }
    return (
      <div>
        <div style={{ fontSize: '1rem', fontWeight: 700 }}>{opt.jp}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: 2 }}>{opt.rm}</div>
      </div>
    )
  }

  return (
    <div className="animate-fadeInUp">
      {/* progress */}
      <div style={s.progressWrap}>
        <div style={s.progressInfo}>
          <Link to="/" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', opacity: 0.5, textDecoration: 'none', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', flexShrink: 0 }} aria-label="exit quiz">✕</Link>
          <span style={s.progressText}>{currentIndex + 1} / {totalQuestions}</span>
          <span style={s.scoreText} aria-live="polite" aria-atomic="true">score: {score} 🌸{streak >= 3 && <span style={s.streakBadge} className="animate-pop" key={streak}>{streak >= 7 ? '🔥🔥' : streak >= 5 ? '🔥' : '⚡'} {streak}x</span>}</span>
        </div>
        <div style={s.progressBar}>
          <div style={{ ...s.progressFill, width: `${progress}%` }} />
        </div>
        {isTimed && (
          <div style={{ height: 4, background: 'rgba(192,132,252,0.15)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / timeLimit) * 100}%`, background: timeLeft <= 3 ? '#ef4444' : '#c084fc', transition: 'width 0.1s linear', borderRadius: 2 }} />
          </div>
        )}
      </div>

      {/* question card */}
      <div
        className={`glass animate-pop`}
        style={{
          ...s.questionCard,
          ...(!prefersReducedMotion && isCorrect === false ? { animation: 'shake 0.4s ease' } : {}),
        }}
        key={`question-card-${currentIndex}`}
      >
        {renderPrompt()}
      </div>

      {/* conjugation rule hint */}
      {!selectedAnswer && question.type !== 'identify' && question._askedFormKey && CONJ_RULES[question._askedFormKey] && (
        showHint
          ? <div style={s.hintBox} className="animate-pop">
              {CONJ_RULES[question._askedFormKey][question._verb?.group] || ''}
            </div>
          : <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <button onClick={() => setShowHint(true)} className="btn-hover" style={s.hintBtn}>
                💡 правило
              </button>
            </div>
      )}

      {/* keyboard hint */}
      {!selectedAnswer && (
        <div style={s.keyboardHint}>
          <span style={s.keyboardHintChip}>⌨ 1–4</span>
          <span style={s.keyboardHintText}>to answer</span>
        </div>
      )}

      {/* options */}
      <div key={`question-options-${currentIndex}`} style={{ ...s.optionsGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
        {question.options.map((opt, i) => {
          let optStyle = { ...s.option }
          if (selectedAnswer) {
            if (opt.correct) {
              optStyle = { ...optStyle, ...s.optionCorrect }
            } else if (selectedAnswer === opt && !isCorrect) {
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
              disabled={inputPaused || selectedAnswer !== null}
            >
              {renderOptionText(opt)}
            </button>
          )
        })}
      </div>

      {/* feedback */}
      {selectedAnswer && (
        <div
          style={{ ...s.feedback, color: isCorrect ? 'var(--correct-text)' : 'var(--incorrect-text)' }}
          className="animate-pop"
        >
          {isCorrect
            ? feedbackMsg
            : `✗ ${question.correctJp} (${question.correctRm})`
          }
        </div>
      )}

      {/* conjugation table — shown after answering */}
      {selectedAnswer && verbForCurrentQ && (
        <div className="glass animate-pop" style={s.conjTable}>
          <div style={{ ...s.conjTableTitle, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>all forms of {verbForCurrentQ.masu} — {verbForCurrentQ.russian}</span>
            {verbForCurrentQ.lesson && (
              <Link to={`/lessons/${verbForCurrentQ.lesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none', marginLeft: 'auto', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                lesson {verbForCurrentQ.lesson} →
              </Link>
            )}
          </div>
          <div style={s.conjTableGrid}>
            {FORM_DEFS.map(f => (
              <div key={f.key} style={{
                ...s.conjRow,
                gridTemplateColumns: isMobile ? '55px 1fr 1fr' : '70px 1fr 1fr 1fr',
                ...(f.key === question._askedFormKey ? s.conjRowHighlight : {}),
              }}>
                <span style={s.conjFormLabel}>{f.label}</span>
                {!isMobile && <span style={s.conjFormDesc}>{f.desc}</span>}
                <span style={s.conjFormJp}>{verbForCurrentQ.forms[f.key].jp}</span>
                <span style={s.conjFormRm}>{verbForCurrentQ.forms[f.key].rm}</span>
              </div>
            ))}
          </div>
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

// ─── Results Screen ─────────────────────────────────────────────────────────

function ResultsScreen({ score, total, percentage, reaction, mistakes, bestStreak, onRetry, onRetryMistakes, calculateQuizXP }) {
  const [repeatCount, setRepeatCount] = useState(1)
  const isTablet = useIsTablet()

  return (
    <div className="animate-fadeInUp" style={s.resultsWrap}>
      <div className="glass" style={{ ...s.resultsCard, ...(isTablet ? s.resultsCardTablet : {}) }}>
        {percentage >= 90 && <Confetti trigger={true} />}
        <div style={s.resultsEmoji}>{reaction.emoji}</div>
        <h2 style={s.resultsTitle}>{reaction.textJp}</h2>
        <p style={s.resultsText}>{reaction.text}</p>

        <div style={s.scoreCircle} className={percentage >= 90 ? 'score-perfect' : 'score-circle'}>
          <div style={s.scoreCircleInner}>
            <span style={s.scoreBig}>{percentage}%</span>
            <span style={s.scoreDetail}>{score}/{total}</span>
          </div>
        </div>

        {calculateQuizXP(score, total) > 0 && (
          <div style={s.xpBadge} className="animate-pop">
            <span style={s.xpIcon}>⚡</span>
            <span style={s.xpAmount}>+{calculateQuizXP(score, total)} XP</span>
          </div>
        )}

        {bestStreak >= 3 && <div style={s.bestStreak} className="animate-pop">{bestStreak >= 7 ? '🔥🔥' : bestStreak >= 5 ? '🔥' : '⚡'} best streak: {bestStreak}x</div>}

        {/* mistakes list */}
        {mistakes.length > 0 && (
          <div style={s.mistakesSection}>
            <div style={s.mistakesLabel}>mistakes ({mistakes.length}) ✏️</div>
            <div style={s.mistakesList}>
              {mistakes.map((m, i) => (
                <div key={(m.question.verbDisplay || '') + (m.question.formLabel || '') + i} style={s.mistakeItem}>
                  <div style={{ ...s.mistakeVerb, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span>{m.question.verbDisplay}</span>
                    {m.question.formLabel && (
                      <span style={s.mistakeFormTag}>{m.question.formLabel || m.question.prompt}</span>
                    )}
                    {m.question._verb?.lesson && (
                      <Link to={`/lessons/${m.question._verb.lesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none', marginLeft: 'auto', flexShrink: 0 }}>
                        lesson {m.question._verb.lesson} →
                      </Link>
                    )}
                  </div>
                  <div style={s.mistakeCorrect}>{m.question.correctJp} ({m.question.correctRm})</div>
                  <div style={s.mistakeYours}>you: {m.yourAnswer === '__TIMEOUT__' ? '⏱ время вышло' : m.yourAnswer}</div>
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

        <div style={s.resultsActions}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-cute" onClick={onRetry} style={{ flex: 1 }}>try again 🌸</button>
            <ShareResult quizName="conjugation quiz" score={score} total={total} percentage={percentage} bestStreak={bestStreak} xpEarned={calculateQuizXP(score, total)} />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/quiz/te-form" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>te-form 🔄</Link>
            <Link to="/conjugation" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>ref 📖</Link>
            <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const s = {
  header: { textAlign: 'center', marginBottom: 20, padding: '8px 0' },
  title: {
    fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)', textTransform: 'lowercase',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4,
  },
  titleJp: { fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 600, marginLeft: 4 },
  subtitle: { fontSize: '1rem', color: 'var(--text-light)', fontWeight: 500 },
  setupCard: { padding: 18, marginBottom: 14 },
  setupLabel: {
    fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 12,
    display: 'flex', alignItems: 'center', gap: 8, textTransform: 'lowercase',
  },

  // group buttons
  groupRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  groupBtn: {
    flex: 1, minWidth: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    padding: '10px 8px', borderRadius: 12, background: 'var(--tint)',
    border: '1.5px solid rgba(192,132,252,0.25)', cursor: 'pointer', transition: 'all 0.2s ease',
    fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'lowercase',
  },
  groupBtnActive: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(192,132,252,0.15))',
    border: '1.5px solid #c084fc', boxShadow: '0 2px 8px rgba(192, 132, 252, 0.15)',
  },
  groupBtnLabel: { fontWeight: 700 },
  groupBtnJp: { fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 500 },
  poolInfo: {
    marginTop: 10, fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 700, textAlign: 'center',
  },

  // form checkboxes
  formGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8,
  },
  formBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    padding: '10px 8px', borderRadius: 12, background: 'var(--tint)',
    border: '1.5px solid rgba(192,132,252,0.25)', cursor: 'pointer', transition: 'all 0.2s ease',
  },
  formBtnActive: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(192,132,252,0.15))',
    border: '1.5px solid #f472b6', boxShadow: '0 2px 8px rgba(244, 114, 182, 0.15)',
  },
  formLabelJp: { fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' },
  formLabelDesc: { fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 500 },

  // mode checkboxes
  modeGrid: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  modeBtn: {
    flex: 1, minWidth: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    padding: '12px 8px', borderRadius: 12, background: 'var(--tint)',
    border: '1.5px solid rgba(192,132,252,0.25)', cursor: 'pointer', transition: 'all 0.2s ease',
  },
  modeBtnActive: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(192,132,252,0.15))',
    border: '1.5px solid #f472b6', boxShadow: '0 2px 8px rgba(244, 114, 182, 0.15)',
  },
  modeBtnLabel: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' },
  modeBtnDesc: { fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 500 },

  // slider
  sliderWrap: { display: 'flex', flexDirection: 'column', gap: 8 },
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
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)',
  },
  allBtn: {
    padding: '3px 14px', borderRadius: 14, background: 'var(--tint-medium)',
    border: '1.5px solid rgba(192,132,252,0.25)', fontSize: '0.75rem', fontWeight: 700,
    color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s ease', minHeight: 44,
  },
  allBtnActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: 'white',
    border: '1.5px solid transparent',
  },
  startWrap: { textAlign: 'center', marginTop: 20 },
  warnText: { marginTop: 8, fontSize: '0.75rem', color: 'var(--incorrect-text)', fontWeight: 600 },

  // quiz progress
  progressWrap: { marginTop: 28, marginBottom: 20 },
  progressInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progressText: { fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' },
  scoreText: { fontSize: '1rem', fontWeight: 700, color: 'var(--text-light)' },
  progressBar: { height: 8, borderRadius: 50, background: 'var(--tint-strong)', overflow: 'hidden' },
  progressFill: {
    height: '100%', borderRadius: 50, background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    transition: 'width 0.4s ease',
  },

  // question card
  questionCard: { textAlign: 'center', padding: '28px 20px', marginBottom: 14 },
  questionLabel: {
    fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600, marginBottom: 8, textTransform: 'lowercase',
  },
  formBanner: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'linear-gradient(135deg, rgba(244,114,182,0.14), rgba(192,132,252,0.14))',
    borderRadius: 50, padding: '6px 18px', marginBottom: 2,
    border: '1.5px solid rgba(192,132,252,0.3)',
  },
  formBannerJp: { fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)' },
  formBannerDesc: { fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 600 },
  questionWord: { fontSize: '2.6rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: 4 },
  questionRomaji: {
    fontSize: '1rem', color: 'var(--text-light)', fontWeight: 600, fontStyle: 'italic', marginBottom: 4,
  },
  questionRu: { fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 4 },
  verbType: { fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 700, marginTop: 4 },
  formTag: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'linear-gradient(135deg, rgba(244,114,182,0.12), rgba(192,132,252,0.12))',
    borderRadius: 50, padding: '4px 14px', marginBottom: 6,
  },
  formTagInner: { fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' },
  formTagDesc: { fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 500 },

  hintBtn: {
    padding: '4px 14px', borderRadius: 20, border: '1.5px solid rgba(192,132,252,0.35)',
    background: 'var(--tint)', color: 'var(--text-light)', fontSize: '0.8rem',
    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44,
  },
  hintBox: {
    fontSize: '0.82rem', fontWeight: 700, color: 'var(--gold-text)',
    background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
    borderRadius: 10, padding: '8px 14px', marginBottom: 8, lineHeight: 1.5,
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

  // conjugation table (shown after correct answer)
  conjTable: {
    padding: '14px 16px', marginBottom: 16, marginTop: 4,
  },
  conjTableTitle: {
    fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 10, textAlign: 'center',
    textTransform: 'lowercase',
  },
  conjTableGrid: { display: 'flex', flexDirection: 'column', gap: 4 },
  conjRow: {
    display: 'grid', gridTemplateColumns: '70px 1fr 1fr 1fr', gap: 6, alignItems: 'center',
    padding: '5px 8px', borderRadius: 8, background: 'rgba(192,132,252,0.06)',
  },
  conjRowHighlight: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.12), rgba(192,132,252,0.12))',
    border: '1px solid rgba(192,132,252,0.3)',
  },
  conjFormLabel: { fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' },
  conjFormDesc: { fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 500 },
  conjFormJp: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' },
  conjFormRm: { fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 500, fontStyle: 'italic' },

  // options
  optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 },
  option: {
    padding: '18px 14px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center',
    cursor: 'pointer', transition: 'all 0.2s ease', border: 'none', background: 'var(--tint)',
    minHeight: 62, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  },
  optionCorrect: {
    background: 'rgba(16, 185, 129, 0.15)', border: '2px solid var(--correct-text)', color: 'var(--correct-text)',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
  },
  optionIncorrect: {
    background: 'rgba(244, 63, 94, 0.12)', border: '2px solid var(--incorrect-text)', color: 'var(--incorrect-text)',
    ...(prefersReducedMotion ? {} : { animation: 'shake 0.4s ease' }),
  },
  feedback: { textAlign: 'center', fontSize: '1rem', fontWeight: 800, padding: 12 },

  // results
  resultsWrap: {
    display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)', paddingBottom: 90,
  },
  resultsCard: { textAlign: 'center', padding: '32px 24px', maxWidth: 440, width: '100%' },
  resultsCardTablet: { maxWidth: 560, padding: '42px 34px' },
  resultsEmoji: { fontSize: '2.5rem', marginBottom: 8 },
  resultsTitle: { fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: 4 },
  resultsText: {
    fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 20, textTransform: 'lowercase',
  },
  scoreCircle: {
    width: 120, height: 120, borderRadius: '50%',
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(236, 72, 153, 0.25)',
  },
  scoreCircleInner: {
    width: 100, height: 100, borderRadius: '50%', background: 'var(--tint-solid)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  },
  scoreBig: { fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 },
  scoreDetail: { fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600 },

  // mistakes
  mistakesSection: { marginBottom: 20, textAlign: 'left' },
  mistakesLabel: {
    fontSize: '0.8rem', fontWeight: 800, color: 'var(--incorrect-text)', textTransform: 'lowercase',
    marginBottom: 8, textAlign: 'center',
  },
  mistakesList: { display: 'flex', flexDirection: 'column', gap: 6 },
  mistakeItem: {
    background: 'rgba(244, 63, 94, 0.06)', border: '1px solid rgba(244, 63, 94, 0.15)',
    borderLeft: '3px solid var(--incorrect-text)', borderRadius: 10, padding: '8px 12px',
  },
  mistakeVerb: { fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' },
  mistakeFormTag: {
    fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)',
    background: 'rgba(192,132,252,0.1)', borderRadius: 50, padding: '2px 8px', marginLeft: 6,
  },
  mistakeCorrect: { fontSize: '0.82rem', fontWeight: 600, color: 'var(--correct-text)' },
  mistakeYours: { fontSize: '0.78rem', fontWeight: 500, color: 'var(--incorrect-text)', fontStyle: 'italic' },

  // retry mistakes
  retryMistakesWrap: {
    marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
  },
  repeatRow: { display: 'flex', alignItems: 'center', gap: 6 },
  repeatLabel: { fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' },
  repeatBtn: {
    padding: '4px 12px', borderRadius: 50, background: 'var(--tint-medium)',
    border: '1.5px solid rgba(192,132,252,0.25)', fontSize: '0.75rem', fontWeight: 700,
    color: 'var(--text-secondary)', cursor: 'pointer', minHeight: 44,
  },
  repeatBtnActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: 'white',
    border: '1.5px solid transparent',
  },
  resultsActions: { display: 'flex', flexDirection: 'column', gap: 10 },
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
