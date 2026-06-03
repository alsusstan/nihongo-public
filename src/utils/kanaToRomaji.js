// kana → romaji converter (Hepburn romanization)
// Handles hiragana, katakana, combinations, っ/ッ, ん/ン, ー

const HIRAGANA_MAP = {
  // combinations (must come before singles)
  'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
  'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
  'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
  'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
  'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
  'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
  'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
  'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
  'じゃ': 'ja',  'じゅ': 'ju',  'じょ': 'jo',
  'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
  'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
  'でゃ': 'dya', 'でゅ': 'dyu', 'でょ': 'dyo',
  'てゃ': 'tha', 'てゅ': 'thu', 'てょ': 'tho',
  'ふぁ': 'fa',  'ふぃ': 'fi',  'ふぇ': 'fe',  'ふぉ': 'fo',
  'うぁ': 'wa',
  // singles
  'あ': 'a',  'い': 'i',  'う': 'u',  'え': 'e',  'お': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'さ': 'sa', 'し': 'shi','す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'ち': 'chi','つ': 'tsu','て': 'te', 'と': 'to',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'ゐ': 'i',  'ゑ': 'e',  'を': 'wo',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
  'ゔ': 'vu',
  // small vowels (standalone)
  'ぁ': 'a', 'ぃ': 'i', 'ぅ': 'u', 'ぇ': 'e', 'ぉ': 'o',
  'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo',
}

const KATAKANA_MAP = {
  // combinations
  'キャ': 'kya', 'キュ': 'kyu', 'キョ': 'kyo',
  'シャ': 'sha', 'シュ': 'shu', 'ショ': 'sho',
  'チャ': 'cha', 'チュ': 'chu', 'チョ': 'cho',
  'ニャ': 'nya', 'ニュ': 'nyu', 'ニョ': 'nyo',
  'ヒャ': 'hya', 'ヒュ': 'hyu', 'ヒョ': 'hyo',
  'ミャ': 'mya', 'ミュ': 'myu', 'ミョ': 'myo',
  'リャ': 'rya', 'リュ': 'ryu', 'リョ': 'ryo',
  'ギャ': 'gya', 'ギュ': 'gyu', 'ギョ': 'gyo',
  'ジャ': 'ja',  'ジュ': 'ju',  'ジョ': 'jo',
  'ビャ': 'bya', 'ビュ': 'byu', 'ビョ': 'byo',
  'ピャ': 'pya', 'ピュ': 'pyu', 'ピョ': 'pyo',
  'ファ': 'fa',  'フィ': 'fi',  'フェ': 'fe',  'フォ': 'fo',
  'ウァ': 'wa',
  'ティ': 'ti',  'ディ': 'di',  'デュ': 'dyu',
  'テュ': 'tyu',
  'ヴァ': 'va',  'ヴィ': 'vi',  'ヴェ': 've',  'ヴォ': 'vo',
  'ウィ': 'wi',  'ウェ': 'we',  'ウォ': 'wo',
  // singles
  'ア': 'a',  'イ': 'i',  'ウ': 'u',  'エ': 'e',  'オ': 'o',
  'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
  'サ': 'sa', 'シ': 'shi','ス': 'su', 'セ': 'se', 'ソ': 'so',
  'タ': 'ta', 'チ': 'chi','ツ': 'tsu','テ': 'te', 'ト': 'to',
  'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
  'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
  'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
  'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
  'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
  'ワ': 'wa', 'ヲ': 'wo',
  'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
  'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
  'ダ': 'da', 'ヂ': 'ji', 'ヅ': 'zu', 'デ': 'de', 'ド': 'do',
  'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
  'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po',
  'ヴ': 'vu',
  // small
  'ァ': 'a', 'ィ': 'i', 'ゥ': 'u', 'ェ': 'e', 'ォ': 'o',
  'ャ': 'ya', 'ュ': 'yu', 'ョ': 'yo',
}

const COMBINED = { ...HIRAGANA_MAP, ...KATAKANA_MAP }

// vowels for ん/ン before-vowel check and ー expansion
const VOWELS = new Set(['a', 'i', 'u', 'e', 'o'])

export function kanaToRomaji(text) {
  if (!text) return ''
  const chars = [...text] // split by Unicode code point
  let result = ''
  let i = 0
  let lastVowel = ''

  while (i < chars.length) {
    const ch = chars[i]

    // っ / ッ — double the next consonant
    if (ch === 'っ' || ch === 'ッ') {
      // peek at next kana to get its first consonant
      const next2 = chars.slice(i + 1, i + 3).join('')
      const next1 = chars.slice(i + 1, i + 2).join('')
      const nextRomaji = COMBINED[next2] || COMBINED[next1] || ''
      if (nextRomaji) {
        const firstConsonant = nextRomaji[0]
        // For 'chi' → double as 'c', for 'tsu' → double as 't', for 'shi' → double as 's'
        const doubler = nextRomaji.startsWith('ch') ? 't'
          : nextRomaji.startsWith('sh') ? 's'
          : firstConsonant
        result += doubler
      } else {
        result += 'tt'
      }
      i++
      continue
    }

    // ん / ン — 'n', apostrophe before vowel or 'n'
    if (ch === 'ん' || ch === 'ン') {
      const nextChar = chars[i + 1]
      let nextRomaji = ''
      if (nextChar) {
        const next2 = chars.slice(i + 1, i + 3).join('')
        nextRomaji = COMBINED[next2] || COMBINED[nextChar] || nextChar
      }
      if (nextRomaji && (VOWELS.has(nextRomaji[0]) || nextRomaji[0] === 'n')) {
        result += "n'"
      } else {
        result += 'n'
      }
      i++
      continue
    }

    // ー — repeat last vowel
    if (ch === 'ー') {
      result += lastVowel || '-'
      i++
      continue
    }

    // try 2-char combination first
    if (i + 1 < chars.length) {
      const pair = chars[i] + chars[i + 1]
      if (COMBINED[pair]) {
        const romaji = COMBINED[pair]
        result += romaji
        lastVowel = romaji[romaji.length - 1]
        i += 2
        continue
      }
    }

    // try single kana
    if (COMBINED[ch]) {
      const romaji = COMBINED[ch]
      result += romaji
      lastVowel = romaji[romaji.length - 1]
      i++
      continue
    }

    // pass through non-kana (kanji, punctuation, Latin, numbers, etc.)
    result += ch
    // update lastVowel if it's a Latin vowel (e.g. mid-word Latin)
    if (VOWELS.has(ch.toLowerCase())) lastVowel = ch.toLowerCase()
    i++
  }

  return result
}
