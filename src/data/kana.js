// ============================================================
// Complete Hiragana & Katakana data for the Nihongo learning app
// ============================================================

// --------------- HIRAGANA ---------------

export const hiragana = {
  basic: [
    // あ行 (a-gyou)
    { kana: 'あ', romaji: 'a', row: 'あ行' },
    { kana: 'い', romaji: 'i', row: 'あ行' },
    { kana: 'う', romaji: 'u', row: 'あ行' },
    { kana: 'え', romaji: 'e', row: 'あ行' },
    { kana: 'お', romaji: 'o', row: 'あ行' },

    // か行 (ka-gyou)
    { kana: 'か', romaji: 'ka', row: 'か行' },
    { kana: 'き', romaji: 'ki', row: 'か行' },
    { kana: 'く', romaji: 'ku', row: 'か行' },
    { kana: 'け', romaji: 'ke', row: 'か行' },
    { kana: 'こ', romaji: 'ko', row: 'か行' },

    // さ行 (sa-gyou)
    { kana: 'さ', romaji: 'sa', row: 'さ行' },
    { kana: 'し', romaji: 'shi', row: 'さ行' },
    { kana: 'す', romaji: 'su', row: 'さ行' },
    { kana: 'せ', romaji: 'se', row: 'さ行' },
    { kana: 'そ', romaji: 'so', row: 'さ行' },

    // た行 (ta-gyou)
    { kana: 'た', romaji: 'ta', row: 'た行' },
    { kana: 'ち', romaji: 'chi', row: 'た行' },
    { kana: 'つ', romaji: 'tsu', row: 'た行' },
    { kana: 'て', romaji: 'te', row: 'た行' },
    { kana: 'と', romaji: 'to', row: 'た行' },

    // な行 (na-gyou)
    { kana: 'な', romaji: 'na', row: 'な行' },
    { kana: 'に', romaji: 'ni', row: 'な行' },
    { kana: 'ぬ', romaji: 'nu', row: 'な行' },
    { kana: 'ね', romaji: 'ne', row: 'な行' },
    { kana: 'の', romaji: 'no', row: 'な行' },

    // は行 (ha-gyou)
    { kana: 'は', romaji: 'ha', row: 'は行' },
    { kana: 'ひ', romaji: 'hi', row: 'は行' },
    { kana: 'ふ', romaji: 'fu', row: 'は行' },
    { kana: 'へ', romaji: 'he', row: 'は行' },
    { kana: 'ほ', romaji: 'ho', row: 'は行' },

    // ま行 (ma-gyou)
    { kana: 'ま', romaji: 'ma', row: 'ま行' },
    { kana: 'み', romaji: 'mi', row: 'ま行' },
    { kana: 'む', romaji: 'mu', row: 'ま行' },
    { kana: 'め', romaji: 'me', row: 'ま行' },
    { kana: 'も', romaji: 'mo', row: 'ま行' },

    // や行 (ya-gyou)
    { kana: 'や', romaji: 'ya', row: 'や行' },
    { kana: 'ゆ', romaji: 'yu', row: 'や行' },
    { kana: 'よ', romaji: 'yo', row: 'や行' },

    // ら行 (ra-gyou)
    { kana: 'ら', romaji: 'ra', row: 'ら行' },
    { kana: 'り', romaji: 'ri', row: 'ら行' },
    { kana: 'る', romaji: 'ru', row: 'ら行' },
    { kana: 'れ', romaji: 're', row: 'ら行' },
    { kana: 'ろ', romaji: 'ro', row: 'ら行' },

    // わ行 (wa-gyou)
    { kana: 'わ', romaji: 'wa', row: 'わ行' },
    { kana: 'を', romaji: 'wo', row: 'わ行' },

    // ん
    { kana: 'ん', romaji: 'n', row: 'ん' },
  ],

  dakuten: [
    // が行 (ga-gyou)
    { kana: 'が', romaji: 'ga', row: 'が行' },
    { kana: 'ぎ', romaji: 'gi', row: 'が行' },
    { kana: 'ぐ', romaji: 'gu', row: 'が行' },
    { kana: 'げ', romaji: 'ge', row: 'が行' },
    { kana: 'ご', romaji: 'go', row: 'が行' },

    // ざ行 (za-gyou)
    { kana: 'ざ', romaji: 'za', row: 'ざ行' },
    { kana: 'じ', romaji: 'ji', row: 'ざ行' },
    { kana: 'ず', romaji: 'zu', row: 'ざ行' },
    { kana: 'ぜ', romaji: 'ze', row: 'ざ行' },
    { kana: 'ぞ', romaji: 'zo', row: 'ざ行' },

    // だ行 (da-gyou)
    { kana: 'だ', romaji: 'da', row: 'だ行' },
    { kana: 'ぢ', romaji: 'ji', row: 'だ行' },
    { kana: 'づ', romaji: 'zu', row: 'だ行' },
    { kana: 'で', romaji: 'de', row: 'だ行' },
    { kana: 'ど', romaji: 'do', row: 'だ行' },

    // ば行 (ba-gyou)
    { kana: 'ば', romaji: 'ba', row: 'ば行' },
    { kana: 'び', romaji: 'bi', row: 'ば行' },
    { kana: 'ぶ', romaji: 'bu', row: 'ば行' },
    { kana: 'べ', romaji: 'be', row: 'ば行' },
    { kana: 'ぼ', romaji: 'bo', row: 'ば行' },

    // ぱ行 (pa-gyou) — handakuten
    { kana: 'ぱ', romaji: 'pa', row: 'ぱ行' },
    { kana: 'ぴ', romaji: 'pi', row: 'ぱ行' },
    { kana: 'ぷ', romaji: 'pu', row: 'ぱ行' },
    { kana: 'ぺ', romaji: 'pe', row: 'ぱ行' },
    { kana: 'ぽ', romaji: 'po', row: 'ぱ行' },
  ],

  combo: [
    // きゃ行
    { kana: 'きゃ', romaji: 'kya', row: 'きゃ行' },
    { kana: 'きゅ', romaji: 'kyu', row: 'きゃ行' },
    { kana: 'きょ', romaji: 'kyo', row: 'きゃ行' },

    // しゃ行
    { kana: 'しゃ', romaji: 'sha', row: 'しゃ行' },
    { kana: 'しゅ', romaji: 'shu', row: 'しゃ行' },
    { kana: 'しょ', romaji: 'sho', row: 'しゃ行' },

    // ちゃ行
    { kana: 'ちゃ', romaji: 'cha', row: 'ちゃ行' },
    { kana: 'ちゅ', romaji: 'chu', row: 'ちゃ行' },
    { kana: 'ちょ', romaji: 'cho', row: 'ちゃ行' },

    // にゃ行
    { kana: 'にゃ', romaji: 'nya', row: 'にゃ行' },
    { kana: 'にゅ', romaji: 'nyu', row: 'にゃ行' },
    { kana: 'にょ', romaji: 'nyo', row: 'にゃ行' },

    // ひゃ行
    { kana: 'ひゃ', romaji: 'hya', row: 'ひゃ行' },
    { kana: 'ひゅ', romaji: 'hyu', row: 'ひゃ行' },
    { kana: 'ひょ', romaji: 'hyo', row: 'ひゃ行' },

    // みゃ行
    { kana: 'みゃ', romaji: 'mya', row: 'みゃ行' },
    { kana: 'みゅ', romaji: 'myu', row: 'みゃ行' },
    { kana: 'みょ', romaji: 'myo', row: 'みゃ行' },

    // りゃ行
    { kana: 'りゃ', romaji: 'rya', row: 'りゃ行' },
    { kana: 'りゅ', romaji: 'ryu', row: 'りゃ行' },
    { kana: 'りょ', romaji: 'ryo', row: 'りゃ行' },

    // ぎゃ行
    { kana: 'ぎゃ', romaji: 'gya', row: 'ぎゃ行' },
    { kana: 'ぎゅ', romaji: 'gyu', row: 'ぎゃ行' },
    { kana: 'ぎょ', romaji: 'gyo', row: 'ぎゃ行' },

    // じゃ行
    { kana: 'じゃ', romaji: 'ja', row: 'じゃ行' },
    { kana: 'じゅ', romaji: 'ju', row: 'じゃ行' },
    { kana: 'じょ', romaji: 'jo', row: 'じゃ行' },

    // びゃ行
    { kana: 'びゃ', romaji: 'bya', row: 'びゃ行' },
    { kana: 'びゅ', romaji: 'byu', row: 'びゃ行' },
    { kana: 'びょ', romaji: 'byo', row: 'びゃ行' },

    // ぴゃ行
    { kana: 'ぴゃ', romaji: 'pya', row: 'ぴゃ行' },
    { kana: 'ぴゅ', romaji: 'pyu', row: 'ぴゃ行' },
    { kana: 'ぴょ', romaji: 'pyo', row: 'ぴゃ行' },
  ],
}

// --------------- KATAKANA ---------------

export const katakana = {
  basic: [
    // ア行 (a-gyou)
    { kana: 'ア', romaji: 'a', row: 'ア行' },
    { kana: 'イ', romaji: 'i', row: 'ア行' },
    { kana: 'ウ', romaji: 'u', row: 'ア行' },
    { kana: 'エ', romaji: 'e', row: 'ア行' },
    { kana: 'オ', romaji: 'o', row: 'ア行' },

    // カ行 (ka-gyou)
    { kana: 'カ', romaji: 'ka', row: 'カ行' },
    { kana: 'キ', romaji: 'ki', row: 'カ行' },
    { kana: 'ク', romaji: 'ku', row: 'カ行' },
    { kana: 'ケ', romaji: 'ke', row: 'カ行' },
    { kana: 'コ', romaji: 'ko', row: 'カ行' },

    // サ行 (sa-gyou)
    { kana: 'サ', romaji: 'sa', row: 'サ行' },
    { kana: 'シ', romaji: 'shi', row: 'サ行' },
    { kana: 'ス', romaji: 'su', row: 'サ行' },
    { kana: 'セ', romaji: 'se', row: 'サ行' },
    { kana: 'ソ', romaji: 'so', row: 'サ行' },

    // タ行 (ta-gyou)
    { kana: 'タ', romaji: 'ta', row: 'タ行' },
    { kana: 'チ', romaji: 'chi', row: 'タ行' },
    { kana: 'ツ', romaji: 'tsu', row: 'タ行' },
    { kana: 'テ', romaji: 'te', row: 'タ行' },
    { kana: 'ト', romaji: 'to', row: 'タ行' },

    // ナ行 (na-gyou)
    { kana: 'ナ', romaji: 'na', row: 'ナ行' },
    { kana: 'ニ', romaji: 'ni', row: 'ナ行' },
    { kana: 'ヌ', romaji: 'nu', row: 'ナ行' },
    { kana: 'ネ', romaji: 'ne', row: 'ナ行' },
    { kana: 'ノ', romaji: 'no', row: 'ナ行' },

    // ハ行 (ha-gyou)
    { kana: 'ハ', romaji: 'ha', row: 'ハ行' },
    { kana: 'ヒ', romaji: 'hi', row: 'ハ行' },
    { kana: 'フ', romaji: 'fu', row: 'ハ行' },
    { kana: 'ヘ', romaji: 'he', row: 'ハ行' },
    { kana: 'ホ', romaji: 'ho', row: 'ハ行' },

    // マ行 (ma-gyou)
    { kana: 'マ', romaji: 'ma', row: 'マ行' },
    { kana: 'ミ', romaji: 'mi', row: 'マ行' },
    { kana: 'ム', romaji: 'mu', row: 'マ行' },
    { kana: 'メ', romaji: 'me', row: 'マ行' },
    { kana: 'モ', romaji: 'mo', row: 'マ行' },

    // ヤ行 (ya-gyou)
    { kana: 'ヤ', romaji: 'ya', row: 'ヤ行' },
    { kana: 'ユ', romaji: 'yu', row: 'ヤ行' },
    { kana: 'ヨ', romaji: 'yo', row: 'ヤ行' },

    // ラ行 (ra-gyou)
    { kana: 'ラ', romaji: 'ra', row: 'ラ行' },
    { kana: 'リ', romaji: 'ri', row: 'ラ行' },
    { kana: 'ル', romaji: 'ru', row: 'ラ行' },
    { kana: 'レ', romaji: 're', row: 'ラ行' },
    { kana: 'ロ', romaji: 'ro', row: 'ラ行' },

    // ワ行 (wa-gyou)
    { kana: 'ワ', romaji: 'wa', row: 'ワ行' },
    { kana: 'ヲ', romaji: 'wo', row: 'ワ行' },

    // ン
    { kana: 'ン', romaji: 'n', row: 'ン' },
  ],

  dakuten: [
    // ガ行 (ga-gyou)
    { kana: 'ガ', romaji: 'ga', row: 'ガ行' },
    { kana: 'ギ', romaji: 'gi', row: 'ガ行' },
    { kana: 'グ', romaji: 'gu', row: 'ガ行' },
    { kana: 'ゲ', romaji: 'ge', row: 'ガ行' },
    { kana: 'ゴ', romaji: 'go', row: 'ガ行' },

    // ザ行 (za-gyou)
    { kana: 'ザ', romaji: 'za', row: 'ザ行' },
    { kana: 'ジ', romaji: 'ji', row: 'ザ行' },
    { kana: 'ズ', romaji: 'zu', row: 'ザ行' },
    { kana: 'ゼ', romaji: 'ze', row: 'ザ行' },
    { kana: 'ゾ', romaji: 'zo', row: 'ザ行' },

    // ダ行 (da-gyou)
    { kana: 'ダ', romaji: 'da', row: 'ダ行' },
    { kana: 'ヂ', romaji: 'ji', row: 'ダ行' },
    { kana: 'ヅ', romaji: 'zu', row: 'ダ行' },
    { kana: 'デ', romaji: 'de', row: 'ダ行' },
    { kana: 'ド', romaji: 'do', row: 'ダ行' },

    // バ行 (ba-gyou)
    { kana: 'バ', romaji: 'ba', row: 'バ行' },
    { kana: 'ビ', romaji: 'bi', row: 'バ行' },
    { kana: 'ブ', romaji: 'bu', row: 'バ行' },
    { kana: 'ベ', romaji: 'be', row: 'バ行' },
    { kana: 'ボ', romaji: 'bo', row: 'バ行' },

    // パ行 (pa-gyou) — handakuten
    { kana: 'パ', romaji: 'pa', row: 'パ行' },
    { kana: 'ピ', romaji: 'pi', row: 'パ行' },
    { kana: 'プ', romaji: 'pu', row: 'パ行' },
    { kana: 'ペ', romaji: 'pe', row: 'パ行' },
    { kana: 'ポ', romaji: 'po', row: 'パ行' },
  ],

  combo: [
    // キャ行
    { kana: 'キャ', romaji: 'kya', row: 'キャ行' },
    { kana: 'キュ', romaji: 'kyu', row: 'キャ行' },
    { kana: 'キョ', romaji: 'kyo', row: 'キャ行' },

    // シャ行
    { kana: 'シャ', romaji: 'sha', row: 'シャ行' },
    { kana: 'シュ', romaji: 'shu', row: 'シャ行' },
    { kana: 'ショ', romaji: 'sho', row: 'シャ行' },

    // チャ行
    { kana: 'チャ', romaji: 'cha', row: 'チャ行' },
    { kana: 'チュ', romaji: 'chu', row: 'チャ行' },
    { kana: 'チョ', romaji: 'cho', row: 'チャ行' },

    // ニャ行
    { kana: 'ニャ', romaji: 'nya', row: 'ニャ行' },
    { kana: 'ニュ', romaji: 'nyu', row: 'ニャ行' },
    { kana: 'ニョ', romaji: 'nyo', row: 'ニャ行' },

    // ヒャ行
    { kana: 'ヒャ', romaji: 'hya', row: 'ヒャ行' },
    { kana: 'ヒュ', romaji: 'hyu', row: 'ヒャ行' },
    { kana: 'ヒョ', romaji: 'hyo', row: 'ヒャ行' },

    // ミャ行
    { kana: 'ミャ', romaji: 'mya', row: 'ミャ行' },
    { kana: 'ミュ', romaji: 'myu', row: 'ミャ行' },
    { kana: 'ミョ', romaji: 'myo', row: 'ミャ行' },

    // リャ行
    { kana: 'リャ', romaji: 'rya', row: 'リャ行' },
    { kana: 'リュ', romaji: 'ryu', row: 'リャ行' },
    { kana: 'リョ', romaji: 'ryo', row: 'リャ行' },

    // ギャ行
    { kana: 'ギャ', romaji: 'gya', row: 'ギャ行' },
    { kana: 'ギュ', romaji: 'gyu', row: 'ギャ行' },
    { kana: 'ギョ', romaji: 'gyo', row: 'ギャ行' },

    // ジャ行
    { kana: 'ジャ', romaji: 'ja', row: 'ジャ行' },
    { kana: 'ジュ', romaji: 'ju', row: 'ジャ行' },
    { kana: 'ジョ', romaji: 'jo', row: 'ジャ行' },

    // ビャ行
    { kana: 'ビャ', romaji: 'bya', row: 'ビャ行' },
    { kana: 'ビュ', romaji: 'byu', row: 'ビャ行' },
    { kana: 'ビョ', romaji: 'byo', row: 'ビャ行' },

    // ピャ行
    { kana: 'ピャ', romaji: 'pya', row: 'ピャ行' },
    { kana: 'ピュ', romaji: 'pyu', row: 'ピャ行' },
    { kana: 'ピョ', romaji: 'pyo', row: 'ピャ行' },
  ],
}

// --------------- HELPERS ---------------

/** Get all kana of a given script as a flat array */
export function getAllKana(script) {
  const data = script === 'hiragana' ? hiragana : katakana
  return [...data.basic, ...data.dakuten, ...data.combo]
}

/** Get kana filtered by category (basic / dakuten / combo) */
export function getKanaByCategory(script, category) {
  const data = script === 'hiragana' ? hiragana : katakana
  return data[category] || []
}

/** Get unique row names for a given script and category */
export function getRows(script, category) {
  const items = getKanaByCategory(script, category)
  return [...new Set(items.map((item) => item.row))]
}
