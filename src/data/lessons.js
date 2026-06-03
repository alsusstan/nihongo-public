// Minna no Nihongo Lessons 1-20
// Vocabulary and Grammar extracted from the Russian translation companion book

import {
  lesson6Vocabulary, lesson6Grammar,
  lesson7Vocabulary, lesson7Grammar,
  lesson8Vocabulary, lesson8Grammar,
  lesson9Vocabulary, lesson9Grammar,
  lesson10Vocabulary, lesson10Grammar,
} from './lessons6to10'

import {
  lesson11Vocabulary, lesson11Grammar,
  lesson12Vocabulary, lesson12Grammar,
  lesson13Vocabulary, lesson13Grammar,
  lesson14Vocabulary, lesson14Grammar,
  lesson15Vocabulary, lesson15Grammar,
} from './lessons11to15'

import {
  lesson16Vocabulary, lesson16Grammar,
  lesson17Vocabulary, lesson17Grammar,
  lesson18Vocabulary, lesson18Grammar,
  lesson19Vocabulary, lesson19Grammar,
  lesson20Vocabulary, lesson20Grammar,
} from './lessons16to20'

import {
  lesson21Vocabulary, lesson21Grammar,
  lesson22Vocabulary, lesson22Grammar,
} from './lessons21to22'

import {
  lesson23Vocabulary, lesson23Grammar,
  lesson24Vocabulary, lesson24Grammar,
} from './lessons23to24'

import {
  lesson25Vocabulary, lesson25Grammar,
} from './lessons25'

// Lesson titles (Japanese)
const lessonTitlesJp = {
  6: "だいろっか",
  7: "だいななか",
  8: "だいはっか",
  9: "だいきゅうか",
  10: "だいじゅっか",
  11: "だいじゅういっか",
  12: "だいじゅうにか",
  13: "だいじゅうさんか",
  14: "だいじゅうよんか",
  15: "だいじゅうごか",
  16: "だいじゅうろっか",
  17: "だいじゅうななか",
  18: "だいじゅうはっか",
  19: "だいじゅうきゅうか",
  20: "だいにじゅっか",
  21: "だいにじゅういっか",
  22: "だいにじゅうにか",
  23: "だいにじゅうさんか",
  24: "だいにじゅうよんか",
  25: "だいにじゅうごか",
}

// Lesson topic titles
const lessonTopics = {
  1: "Introductions & Identity",
  2: "Demonstratives & Numbers",
  3: "Locations & Places",
  4: "Time & Daily Routine",
  5: "Going, Coming & Returning",
  6: "Eating & Actions",
  7: "Giving & Receiving",
  8: "Adjectives",
  9: "Likes & Abilities",
  10: "Existence & Location",
  11: "Counters & Duration",
  12: "Comparison & Past Adjectives",
  13: "Desires (ほしい / 〜たい)",
  14: "て-form & Requests",
  15: "Permission & States",
  16: "Connecting Sentences (て-form)",
  17: "ない-form & Obligations",
  18: "Dictionary Form & Abilities",
  19: "た-form & Experiences",
  20: "Plain Form & Quotation",
  21: "Opinions & Quoting (~と思う)",
  22: "Noun Modification (relative clauses)",
  23: "Conditional Forms (~とき, ~と)",
  24: "Giving & Receiving Actions (てくれる/てもらう)",
  25: "Conditional Forms (~たら, ~ても)",
}

// Build lesson objects from imported data
function buildLesson(id, vocabulary, grammar) {
  return {
    id,
    title: `Lesson ${id}`,
    titleJp: lessonTitlesJp[id],
    topic: lessonTopics[id],
    vocabulary: vocabulary.map(w => ({ ...w, lesson: w.lesson || id })),
    grammar: grammar.map((g, i) => ({ ...g, id: g.id || `${id}-${i + 1}`, lesson: g.lesson || id })),
  }
}

const lessons1to5 = [
  // ===================== LESSON 1 =====================
  {
    id: 1,
    title: "Lesson 1",
    titleJp: "だいいっか",
    topic: lessonTopics[1],
    vocabulary: [
      // Pronouns & People
      { japanese: "わたし", romaji: "watashi", russian: "я", lesson: 1 },
      { japanese: "あなた", romaji: "anata", russian: "вы (ты)", lesson: 1 },
      { japanese: "あのひと", romaji: "ano hito", russian: "он, она", lesson: 1, kanji: "あの人" },
      { japanese: "あのかた", romaji: "ano kata", russian: "он, она (вежл.)", lesson: 1, kanji: "あの方" },

      // Suffixes
      { japanese: "~さん", romaji: "~san", russian: "господин, госпожа (суффикс)", lesson: 1 },
      { japanese: "~ちゃん", romaji: "~chan", russian: "уменьшительно-ласкательный суффикс (для детей)", lesson: 1 },
      { japanese: "~じん", romaji: "~jin", russian: "человек (национальность)", lesson: 1 },

      // Occupations
      { japanese: "せんせい", romaji: "sensei", russian: "учитель, преподаватель", lesson: 1, kanji: "先生" },
      { japanese: "きょうし", romaji: "kyoushi", russian: "учитель, преподаватель", lesson: 1, kanji: "教師" },
      { japanese: "がくせい", romaji: "gakusei", russian: "студент", lesson: 1, kanji: "学生" },
      { japanese: "かいしゃいん", romaji: "kaishain", russian: "служащий фирмы", lesson: 1, kanji: "会社員" },
      { japanese: "しゃいん", romaji: "shain", russian: "служащий фирмы ~", lesson: 1, kanji: "社員" },
      { japanese: "ぎんこういん", romaji: "ginkouin", russian: "служащий банка", lesson: 1, kanji: "銀行員" },
      { japanese: "いしゃ", romaji: "isha", russian: "врач", lesson: 1, kanji: "医者" },
      { japanese: "けんきゅうしゃ", romaji: "kenkyuusha", russian: "исследователь, учёный", lesson: 1, kanji: "研究者" },

      // Places
      { japanese: "だいがく", romaji: "daigaku", russian: "университет", lesson: 1, kanji: "大学" },
      { japanese: "びょういん", romaji: "byouin", russian: "больница", lesson: 1, kanji: "病院" },

      // Question words
      { japanese: "だれ", romaji: "dare", russian: "кто", lesson: 1 },
      { japanese: "どなた", romaji: "donata", russian: "кто (вежл.)", lesson: 1 },

      // Age
      { japanese: "~さい", romaji: "~sai", russian: "~ лет (возраст)", lesson: 1, kanji: "~歳" },
      { japanese: "なんさい", romaji: "nansai", russian: "сколько лет?", lesson: 1, kanji: "何歳" },
      { japanese: "おいくつ", romaji: "oikutsu", russian: "сколько лет? (вежл.)", lesson: 1 },

      // Yes/No
      { japanese: "はい", romaji: "hai", russian: "да", lesson: 1 },
      { japanese: "いいえ", romaji: "iie", russian: "нет", lesson: 1 },

      // Expressions (Renshuu C & Kaiwa)
      { japanese: "はじめまして", romaji: "hajimemashite", russian: "приятно познакомиться (впервые встречаемся)", lesson: 1, kanji: "初めまして" },
      { japanese: "~からきました", romaji: "~kara kimashita", russian: "приехал из ~", lesson: 1, kanji: "~から来ました" },
      { japanese: "どうぞよろしく[おねがいします]", romaji: "douzo yoroshiku [onegaishimasu]", russian: "прошу вашего расположения", lesson: 1, kanji: "どうぞよろしく[お願いします]" },
      { japanese: "しつれいですが", romaji: "shitsurei desu ga", russian: "извините, но...", lesson: 1, kanji: "失礼ですが" },
      { japanese: "おなまえは？", romaji: "onamae wa?", russian: "как вас зовут?", lesson: 1, kanji: "お名前は" },
      { japanese: "こちらは~さんです", romaji: "kochira wa ~san desu", russian: "это г-н / г-жа ~", lesson: 1 },

      // Countries
      { japanese: "アメリカ", romaji: "Amerika", russian: "Америка, США", lesson: 1 },
      { japanese: "イギリス", romaji: "Igirisu", russian: "Англия, Великобритания", lesson: 1 },
      { japanese: "インド", romaji: "Indo", russian: "Индия", lesson: 1 },
      { japanese: "インドネシア", romaji: "Indoneshia", russian: "Индонезия", lesson: 1 },
      { japanese: "かんこく", romaji: "Kankoku", russian: "Южная Корея", lesson: 1, kanji: "韓国" },
      { japanese: "タイ", romaji: "Tai", russian: "Таиланд", lesson: 1 },
      { japanese: "ちゅうごく", romaji: "Chuugoku", russian: "Китай", lesson: 1, kanji: "中国" },
      { japanese: "ドイツ", romaji: "Doitsu", russian: "Германия", lesson: 1 },
      { japanese: "にほん", romaji: "Nihon", russian: "Япония", lesson: 1, kanji: "日本" },
      { japanese: "ブラジル", romaji: "Burajiru", russian: "Бразилия", lesson: 1 },
    ],
    grammar: [
      {
        id: "1-1",
        pattern: "СУЩ1 は СУЩ2 です",
        patternJp: "N1 wa N2 desu",
        meaning: "N1 является N2",
        explanation: "Частица は указывает тему высказывания. です -- связка, выражающая вежливый стиль речи.",
        examples: [
          { jp: "わたしは マイク・ミラーです。", romaji: "Watashi wa Maiku Miraa desu.", ru: "Я Майк Миллер." },
          { jp: "わたしは 学生です。", romaji: "Watashi wa gakusei desu.", ru: "Я студент." },
        ],
        lesson: 1,
      },
      {
        id: "1-2",
        pattern: "СУЩ1 は СУЩ2 じゃ(では)ありません",
        patternJp: "N1 wa N2 ja (dewa) arimasen",
        meaning: "N1 не является N2 (отрицание)",
        explanation: "じゃありません -- отрицательная форма связки です. В формальной речи используется ではありません.",
        examples: [
          { jp: "サントスさんは 学生じゃ ありません。", romaji: "Santosu-san wa gakusei ja arimasen.", ru: "Г-н Сантос не студент." },
          { jp: "わたしは アメリカ人では ありません。", romaji: "Watashi wa amerikajin dewa arimasen.", ru: "Я не американец." },
        ],
        lesson: 1,
      },
      {
        id: "1-3",
        pattern: "СУЩ1 は СУЩ2 ですか",
        patternJp: "N1 wa N2 desu ka",
        meaning: "N1 является N2? (вопрос)",
        explanation: "Частица か в конце предложения образует вопрос. Порядок слов не меняется. Ответ: はい (да) или いいえ (нет).",
        examples: [
          { jp: "ミラーさんは アメリカ人ですか。", romaji: "Miraa-san wa amerikajin desu ka.", ru: "Г-н Миллер американец?" },
          { jp: "あの方は 先生ですか。", romaji: "Ano kata wa sensei desu ka.", ru: "Тот человек -- учитель?" },
        ],
        lesson: 1,
      },
      {
        id: "1-4",
        pattern: "СУЩ も",
        patternJp: "N mo",
        meaning: "N тоже",
        explanation: "Частица も используется вместо は, когда утверждается то же самое.",
        examples: [
          { jp: "グプタさんも 会社員です。", romaji: "Guputa-san mo kaishain desu.", ru: "Г-н Гупта тоже служащий фирмы." },
          { jp: "わたしも 日本人です。", romaji: "Watashi mo nihonjin desu.", ru: "Я тоже японец." },
        ],
        lesson: 1,
      },
      {
        id: "1-5",
        pattern: "СУЩ1 の СУЩ2",
        patternJp: "N1 no N2",
        meaning: "N2 принадлежит N1 / N2 из N1",
        explanation: "Частица の связывает два существительных. В Уроке 1 выражает принадлежность к организации.",
        examples: [
          { jp: "ミラーさんは IMCの 社員です。", romaji: "Miraa-san wa IMC no shain desu.", ru: "Г-н Миллер -- служащий фирмы IMC." },
          { jp: "わたしは 大学の 学生です。", romaji: "Watashi wa daigaku no gakusei desu.", ru: "Я студент университета." },
        ],
        lesson: 1,
      },
      {
        id: "1-6",
        pattern: "~さん",
        patternJp: "~san",
        meaning: "господин / госпожа ~",
        explanation: "Уважительный суффикс, добавляется к имени/фамилии собеседника или третьего лица. Говорящий не использует его после собственного имени. Для детей используется ちゃん.",
        examples: [
          { jp: "ミラーさんは アメリカ人です。", romaji: "Miraa-san wa amerikajin desu.", ru: "Г-н Миллер -- американец." },
          { jp: "サントスさんは ブラジル人です。", romaji: "Santosu-san wa burajirujin desu.", ru: "Г-н Сантос -- бразилец." },
        ],
        lesson: 1,
      },
    ],
  },

  // ===================== LESSON 2 =====================
  {
    id: 2,
    title: "Lesson 2",
    titleJp: "だいにか",
    topic: lessonTopics[2],
    vocabulary: [
      // Demonstratives
      { japanese: "これ", romaji: "kore", russian: "это (близко к говорящему)", lesson: 2 },
      { japanese: "それ", romaji: "sore", russian: "это, то (близко к собеседнику)", lesson: 2 },
      { japanese: "あれ", romaji: "are", russian: "то (далеко от обоих)", lesson: 2 },
      { japanese: "この~", romaji: "kono~", russian: "этот", lesson: 2 },
      { japanese: "その~", romaji: "sono~", russian: "этот, тот", lesson: 2 },
      { japanese: "あの~", romaji: "ano~", russian: "тот", lesson: 2 },

      // Books & Stationery
      { japanese: "ほん", romaji: "hon", russian: "книга", lesson: 2, kanji: "本" },
      { japanese: "じしょ", romaji: "jisho", russian: "словарь", lesson: 2, kanji: "辞書" },
      { japanese: "ざっし", romaji: "zasshi", russian: "журнал", lesson: 2, kanji: "雑誌" },
      { japanese: "しんぶん", romaji: "shinbun", russian: "газета", lesson: 2, kanji: "新聞" },
      { japanese: "ノート", romaji: "nooto", russian: "тетрадь", lesson: 2 },
      { japanese: "てちょう", romaji: "techou", russian: "записная книжка, блокнот", lesson: 2, kanji: "手帳" },
      { japanese: "めいし", romaji: "meishi", russian: "визитная карточка", lesson: 2, kanji: "名刺" },
      { japanese: "カード", romaji: "kaado", russian: "карта, карточка, открытка", lesson: 2 },

      // Writing tools
      { japanese: "えんぴつ", romaji: "enpitsu", russian: "карандаш", lesson: 2, kanji: "鉛筆" },
      { japanese: "ボールペン", romaji: "boorupen", russian: "шариковая ручка", lesson: 2 },
      { japanese: "シャープペンシル", romaji: "shaapupenshiru", russian: "автоматический карандаш", lesson: 2 },

      // Personal items
      { japanese: "かぎ", romaji: "kagi", russian: "ключ", lesson: 2 },
      { japanese: "とけい", romaji: "tokei", russian: "часы", lesson: 2, kanji: "時計" },
      { japanese: "かさ", romaji: "kasa", russian: "зонт", lesson: 2, kanji: "傘" },
      { japanese: "かばん", romaji: "kaban", russian: "портфель, кейс", lesson: 2 },

      // Electronics
      { japanese: "CD", romaji: "shiidii", russian: "CD (компакт-диск)", lesson: 2 },
      { japanese: "テレビ", romaji: "terebi", russian: "телевизор", lesson: 2 },
      { japanese: "ラジオ", romaji: "rajio", russian: "радио", lesson: 2 },
      { japanese: "カメラ", romaji: "kamera", russian: "фотоаппарат", lesson: 2 },
      { japanese: "コンピューター", romaji: "konpyuutaa", russian: "компьютер", lesson: 2 },
      { japanese: "くるま", romaji: "kuruma", russian: "автомобиль", lesson: 2, kanji: "車" },

      // Furniture
      { japanese: "つくえ", romaji: "tsukue", russian: "стол, письменный стол", lesson: 2, kanji: "机" },
      { japanese: "いす", romaji: "isu", russian: "стул", lesson: 2 },

      // Food & Drink
      { japanese: "チョコレート", romaji: "chokoreeto", russian: "шоколад", lesson: 2 },
      { japanese: "コーヒー", romaji: "koohii", russian: "кофе", lesson: 2 },

      // Gifts & Languages
      { japanese: "[お]みやげ", romaji: "[o]miyage", russian: "сувенир, подарок", lesson: 2, kanji: "[お]土産" },
      { japanese: "えいご", romaji: "eigo", russian: "английский язык", lesson: 2, kanji: "英語" },
      { japanese: "にほんご", romaji: "nihongo", russian: "японский язык", lesson: 2, kanji: "日本語" },
      { japanese: "~ご", romaji: "~go", russian: "~ язык", lesson: 2, kanji: "~語" },

      // Other
      { japanese: "なん", romaji: "nan", russian: "что? (вопросительное местоимение)", lesson: 2, kanji: "何" },
      { japanese: "そう", romaji: "sou", russian: "так", lesson: 2 },

      // Expressions (Renshuu C)
      { japanese: "あのう", romaji: "anou", russian: "м-м... / ну / как вам сказать...", lesson: 2 },
      { japanese: "えっ", romaji: "e'", russian: "что? / вот как? / правда?", lesson: 2 },
      { japanese: "どうぞ", romaji: "douzo", russian: "пожалуйста (при предложении чего-либо)", lesson: 2 },
      { japanese: "[どうも]ありがとう[ございます]", romaji: "[doumo] arigatou [gozaimasu]", russian: "большое спасибо!", lesson: 2 },
      { japanese: "そうですか", romaji: "sou desu ka", russian: "вот оно что / понятно", lesson: 2 },
      { japanese: "ちがいます", romaji: "chigaimasu", russian: "нет, это не так / не правильно", lesson: 2, type: "гл. I", kanji: "違います" },
      { japanese: "あ", romaji: "a", russian: "ах! (лёгкое удивление)", lesson: 2 },

      // Kaiwa
      { japanese: "これからおせわになります", romaji: "korekara osewa ni narimasu", russian: "с надеждой на вашу поддержку", lesson: 2, kanji: "これからお世話になります" },
      { japanese: "こちらこそ[どうぞ]よろしく", romaji: "kochira koso [douzo] yoroshiku", russian: "мне тоже очень приятно", lesson: 2 },
    ],
    grammar: [
      {
        id: "2-1",
        pattern: "これ / それ / あれ",
        patternJp: "kore / sore / are",
        meaning: "это / это, то / то (указательные местоимения предмета)",
        explanation: "これ -- предмет близко к говорящему. それ -- близко к собеседнику. あれ -- далеко от обоих. Используются как существительные.",
        examples: [
          { jp: "これは 本です。", romaji: "Kore wa hon desu.", ru: "Это книга." },
          { jp: "それは 辞書ですか。", romaji: "Sore wa jisho desu ka.", ru: "Это словарь?" },
          { jp: "あれは テレビです。", romaji: "Are wa terebi desu.", ru: "То -- телевизор." },
        ],
        lesson: 2,
      },
      {
        id: "2-2",
        pattern: "この СУЩ / その СУЩ / あの СУЩ",
        patternJp: "kono N / sono N / ano N",
        meaning: "этот N / тот N / тот N (определяют существительное)",
        explanation: "Относительно-указательные местоимения, используются только перед существительными.",
        examples: [
          { jp: "この 本は わたしのです。", romaji: "Kono hon wa watashi no desu.", ru: "Эта книга моя." },
          { jp: "その ノートは だれのですか。", romaji: "Sono nooto wa dare no desu ka.", ru: "Чья эта тетрадь?" },
          { jp: "あの かばんは ミラーさんのです。", romaji: "Ano kaban wa Miraa-san no desu.", ru: "Тот портфель -- г-на Миллера." },
        ],
        lesson: 2,
      },
      {
        id: "2-3",
        pattern: "そうです",
        patternJp: "sou desu",
        meaning: "да, это так (подтверждение)",
        explanation: "Используется при утвердительном ответе. При отрицании используется не そう, а ちがいます (быть другим).",
        examples: [
          { jp: "それは 辞書ですか。-- はい、そうです。", romaji: "Sore wa jisho desu ka. -- Hai, sou desu.", ru: "Это словарь? -- Да, это так." },
          { jp: "それは ノートですか。-- いいえ、ちがいます。", romaji: "Sore wa nooto desu ka. -- Iie, chigaimasu.", ru: "Это тетрадь? -- Нет, не так." },
        ],
        lesson: 2,
      },
      {
        id: "2-4",
        pattern: "~か、~か",
        patternJp: "~ka, ~ka",
        meaning: "~ или ~ (альтернативный вопрос)",
        explanation: "Альтернативный вопрос, где надо выбрать из двух вариантов. Ответ -- повторение правильного утверждения без はい или いいえ.",
        examples: [
          { jp: "これは「9」ですか、「7」ですか。-- 「9」です。", romaji: "Kore wa \"9\" desu ka, \"7\" desu ka. -- \"9\" desu.", ru: "Это 9 или 7? -- Это 9." },
          { jp: "それは ボールペンですか、シャープペンシルですか。-- ボールペンです。", romaji: "Sore wa boorupen desu ka, shaapupenshiru desu ka. -- Boorupen desu.", ru: "Это шариковая ручка или механический карандаш? -- Шариковая ручка." },
        ],
        lesson: 2,
      },
      {
        id: "2-5",
        pattern: "СУЩ1 の СУЩ2",
        patternJp: "N1 no N2",
        meaning: "N2 о N1 (о чём) / N2 принадлежит N1 (чей)",
        explanation: "1) N1 указывает, о чём N2. 2) N1 указывает, кому принадлежит N2.",
        examples: [
          { jp: "コンピューターの 本", romaji: "Konpyuutaa no hon", ru: "Книга о компьютерах." },
          { jp: "わたしの 本", romaji: "Watashi no hon", ru: "Моя книга." },
        ],
        lesson: 2,
      },
      {
        id: "2-6",
        pattern: "Частица の вместо существительного",
        patternJp: "no (вместо существительного)",
        meaning: "Замена существительного частицей の",
        explanation: "Если из контекста понятно, о чём речь, вместо существительного используется の.",
        examples: [
          { jp: "あれは だれの かばんですか。-- 佐藤さんのです。", romaji: "Are wa dare no kaban desu ka. -- Satou-san no desu.", ru: "Чей это портфель? -- Г-жи Сато." },
          { jp: "この 本は わたしのです。", romaji: "Kono hon wa watashi no desu.", ru: "Эта книга -- моя." },
        ],
        lesson: 2,
      },
      {
        id: "2-7",
        pattern: "お~",
        patternJp: "o~",
        meaning: "вежливый префикс",
        explanation: "Префикс お перед существительным выражает вежливость или почтительность.",
        examples: [
          { jp: "おみやげ", romaji: "omiyage", ru: "Сувенир (вежл.)." },
          { jp: "おさけ", romaji: "osake", ru: "Спиртное (вежл.)." },
        ],
        lesson: 2,
      },
      {
        id: "2-8",
        pattern: "そうですか",
        patternJp: "sou desu ka",
        meaning: "Понятно. / Вот оно что.",
        explanation: "Используется для подтверждения понимания полученной информации. Произносится с понижающейся интонацией.",
        examples: [
          { jp: "わたしは ドイツ人です。-- そうですか。", romaji: "Watashi wa doitsujin desu. -- Sou desu ka.", ru: "Я немец. -- Понятно." },
        ],
        lesson: 2,
      },
    ],
  },

  // ===================== LESSON 3 =====================
  {
    id: 3,
    title: "Lesson 3",
    titleJp: "だいさんか",
    topic: lessonTopics[3],
    vocabulary: [
      // Place demonstratives
      { japanese: "ここ", romaji: "koko", russian: "здесь (близко к говорящему)", lesson: 3 },
      { japanese: "そこ", romaji: "soko", russian: "здесь, там (близко к собеседнику)", lesson: 3 },
      { japanese: "あそこ", romaji: "asoko", russian: "там (далеко от обоих)", lesson: 3 },
      { japanese: "どこ", romaji: "doko", russian: "где", lesson: 3 },
      { japanese: "こちら", romaji: "kochira", russian: "здесь; сюда (вежл. эквивалент ここ)", lesson: 3 },
      { japanese: "そちら", romaji: "sochira", russian: "здесь, там; туда (вежл. эквивалент そこ)", lesson: 3 },
      { japanese: "あちら", romaji: "achira", russian: "там; туда (вежл. эквивалент あそこ)", lesson: 3 },
      { japanese: "どちら", romaji: "dochira", russian: "где; куда (вежл. эквивалент どこ)", lesson: 3 },

      // Rooms & Places
      { japanese: "きょうしつ", romaji: "kyoushitsu", russian: "аудитория, класс", lesson: 3, kanji: "教室" },
      { japanese: "しょくどう", romaji: "shokudou", russian: "столовая", lesson: 3, kanji: "食堂" },
      { japanese: "じむしょ", romaji: "jimusho", russian: "контора, офис", lesson: 3, kanji: "事務所" },
      { japanese: "かいぎしつ", romaji: "kaigishitsu", russian: "зал заседаний", lesson: 3, kanji: "会議室" },
      { japanese: "うけつけ", romaji: "uketsuke", russian: "приёмная, регистратура, ресепшен", lesson: 3, kanji: "受付" },

      // Building areas
      { japanese: "ロビー", romaji: "robii", russian: "вестибюль, холл", lesson: 3 },
      { japanese: "へや", romaji: "heya", russian: "комната", lesson: 3, kanji: "部屋" },
      { japanese: "トイレ", romaji: "toire", russian: "туалет", lesson: 3 },
      { japanese: "おてあらい", romaji: "otearai", russian: "туалет (вежл.)", lesson: 3, kanji: "お手洗い" },

      // Building infrastructure
      { japanese: "かいだん", romaji: "kaidan", russian: "лестница", lesson: 3, kanji: "階段" },
      { japanese: "エレベーター", romaji: "erebeetaa", russian: "лифт", lesson: 3 },
      { japanese: "エスカレーター", romaji: "esukareetaa", russian: "эскалатор", lesson: 3 },
      { japanese: "じどうはんばいき", romaji: "jidouhanbaiki", russian: "автомат по продаже", lesson: 3, kanji: "自動販売機" },

      // General places
      { japanese: "でんわ", romaji: "denwa", russian: "телефон, телефонный разговор", lesson: 3, kanji: "電話" },
      { japanese: "[お]くに", romaji: "[o]kuni", russian: "страна", lesson: 3, kanji: "[お]国" },
      { japanese: "かいしゃ", romaji: "kaisha", russian: "компания, фирма", lesson: 3, kanji: "会社" },
      { japanese: "うち", romaji: "uchi", russian: "дом", lesson: 3 },

      // Items
      { japanese: "くつ", romaji: "kutsu", russian: "обувь, туфли", lesson: 3, kanji: "靴" },
      { japanese: "ネクタイ", romaji: "nekutai", russian: "галстук", lesson: 3 },
      { japanese: "ワイン", romaji: "wain", russian: "вино", lesson: 3 },

      // Shopping
      { japanese: "うりば", romaji: "uriba", russian: "прилавок, отдел (в магазине)", lesson: 3, kanji: "売り場" },
      { japanese: "ちか", romaji: "chika", russian: "подвальное помещение, подвальный этаж", lesson: 3, kanji: "地下" },
      { japanese: "~かい(がい)", romaji: "~kai (gai)", russian: "~-й этаж", lesson: 3, kanji: "~階" },
      { japanese: "なんがい", romaji: "nangai", russian: "какой этаж?", lesson: 3, kanji: "何階" },

      // Money & Numbers
      { japanese: "~えん", romaji: "~en", russian: "~ иен", lesson: 3, kanji: "~円" },
      { japanese: "いくら", romaji: "ikura", russian: "сколько стоит", lesson: 3 },
      { japanese: "ひゃく", romaji: "hyaku", russian: "сто", lesson: 3, kanji: "百" },
      { japanese: "せん", romaji: "sen", russian: "тысяча", lesson: 3, kanji: "千" },
      { japanese: "まん", romaji: "man", russian: "десять тысяч", lesson: 3, kanji: "万" },

      // Expressions (Renshuu C & Kaiwa)
      { japanese: "すみません", romaji: "sumimasen", russian: "извините", lesson: 3 },
      { japanese: "どうも", romaji: "doumo", russian: "спасибо", lesson: 3 },
      { japanese: "いらっしゃいませ", romaji: "irasshaimase", russian: "добро пожаловать!", lesson: 3 },
      { japanese: "[~を]みせてください", romaji: "[~o] misete kudasai", russian: "пожалуйста, покажите [~]", lesson: 3, kanji: "[~を]見せてください" },
      { japanese: "じゃ", romaji: "ja", russian: "что ж... (перед принятием решения)", lesson: 3 },
      { japanese: "[~を]ください", romaji: "[~o] kudasai", russian: "пожалуйста, дайте [~]", lesson: 3 },

      // Countries/Cities
      { japanese: "イタリア", romaji: "Itaria", russian: "Италия", lesson: 3 },
      { japanese: "スイス", romaji: "Suisu", russian: "Швейцария", lesson: 3 },
      { japanese: "フランス", romaji: "Furansu", russian: "Франция", lesson: 3 },
      { japanese: "ジャカルタ", romaji: "Jakaruta", russian: "Джакарта", lesson: 3 },
      { japanese: "バンコク", romaji: "Bankoku", russian: "Бангкок", lesson: 3 },
      { japanese: "ベルリン", romaji: "Berurin", russian: "Берлин", lesson: 3 },
      { japanese: "しんおおさか", romaji: "Shin-Oosaka", russian: "Син-Осака (станция)", lesson: 3, kanji: "新大阪" },
    ],
    grammar: [
      {
        id: "3-1",
        pattern: "ここ / そこ / あそこ / こちら / そちら / あちら",
        patternJp: "koko / soko / asoko / kochira / sochira / achira",
        meaning: "здесь / там / там (далеко) -- указательные местоимения места",
        explanation: "ここ -- место говорящего, そこ -- место собеседника, あそこ -- далеко от обоих. こちら, そちら, あちら -- вежливые эквиваленты, также указывают направление.",
        examples: [
          { jp: "ここは 教室です。", romaji: "Koko wa kyoushitsu desu.", ru: "Здесь -- аудитория." },
          { jp: "トイレは あそこです。", romaji: "Toire wa asoko desu.", ru: "Туалет -- там." },
        ],
        lesson: 3,
      },
      {
        id: "3-2",
        pattern: "СУЩ は МЕСТО です",
        patternJp: "N wa BASHO desu",
        meaning: "N находится в МЕСТО",
        explanation: "Сообщает, где расположен предмет или человек.",
        examples: [
          { jp: "お手洗いは あそこです。", romaji: "Otearai wa asoko desu.", ru: "Туалет там." },
          { jp: "電話は 2階です。", romaji: "Denwa wa nikai desu.", ru: "Телефон на втором этаже." },
        ],
        lesson: 3,
      },
      {
        id: "3-3",
        pattern: "どこ / どちら",
        patternJp: "doko / dochira",
        meaning: "где? / куда? (вопрос о месте)",
        explanation: "どこ -- вопрос о местонахождении. どちら -- вежливый эквивалент, также используется для вопроса о направлении, стране, компании.",
        examples: [
          { jp: "お手洗いは どこですか。", romaji: "Otearai wa doko desu ka.", ru: "Где туалет?" },
          { jp: "会社は どちらですか。", romaji: "Kaisha wa dochira desu ka.", ru: "Где ваша компания? (вежл.)" },
        ],
        lesson: 3,
      },
      {
        id: "3-4",
        pattern: "СУЩ1 の СУЩ2",
        patternJp: "N1 no N2",
        meaning: "N2 из/произведённый в N1",
        explanation: "Если N1 -- название страны/компании, а N2 -- название изделия, значит изделие произведено в этой стране/компании.",
        examples: [
          { jp: "これは どこの コンピューターですか。-- 日本の コンピューターです。", romaji: "Kore wa doko no konpyuutaa desu ka. -- Nihon no konpyuutaa desu.", ru: "Где сделан этот компьютер? -- Японский." },
          { jp: "それは フランスの ワインです。", romaji: "Sore wa Furansu no wain desu.", ru: "Это французское вино." },
        ],
        lesson: 3,
      },
      {
        id: "3-5",
        pattern: "Система указательных местоимений こ/そ/あ/ど",
        patternJp: "ko/so/a/do system",
        meaning: "Система указательных местоимений",
        explanation: "こ (близко к говорящему):　これ · この · ここ · こちら\nそ (близко к собеседнику): それ · その · そこ · そちら\nあ (далеко от обоих):　　あれ · あの · あそこ · あちら\nど (вопрос):　　　　　　どれ · どの · どこ · どちら",
        examples: [
          { jp: "これは 何ですか。", romaji: "Kore wa nan desu ka.", ru: "Это что?" },
          { jp: "あの 人は だれですか。", romaji: "Ano hito wa dare desu ka.", ru: "Кто тот человек?" },
          { jp: "どこに ありますか。", romaji: "Doko ni arimasu ka.", ru: "Где находится?" },
        ],
        lesson: 3,
      },
      {
        id: "3-6",
        pattern: "お~",
        patternJp: "o~",
        meaning: "вежливый префикс (продолжение)",
        explanation: "Префикс お добавляется к слову, относящемуся к собеседнику или третьему лицу, для выражения уважения.",
        examples: [
          { jp: "お国は どちらですか。", romaji: "Okuni wa dochira desu ka.", ru: "Вы из какой страны?" },
          { jp: "お名前は 何ですか。", romaji: "Onamae wa nan desu ka.", ru: "Как вас зовут?" },
        ],
        lesson: 3,
      },
    ],
  },

  // ===================== LESSON 4 =====================
  {
    id: 4,
    title: "Lesson 4",
    titleJp: "だいよんか",
    topic: lessonTopics[4],
    vocabulary: [
      // Verbs
      { japanese: "おきます", romaji: "okimasu", russian: "вставать, просыпаться", lesson: 4, kanji: "起きます", type: "гл. II" },
      { japanese: "ねます", romaji: "nemasu", russian: "ложиться спать, спать", lesson: 4, kanji: "寝ます", type: "гл. II" },
      { japanese: "はたらきます", romaji: "hatarakimasu", russian: "работать", lesson: 4, kanji: "働きます", type: "гл. I" },
      { japanese: "やすみます", romaji: "yasumimasu", russian: "отдыхать, брать отпуск", lesson: 4, kanji: "休みます", type: "гл. I" },
      { japanese: "べんきょうします", romaji: "benkyoushimasu", russian: "заниматься, учиться", lesson: 4, kanji: "勉強します", type: "гл. III" },
      { japanese: "おわります", romaji: "owarimasu", russian: "заканчивать, заканчиваться", lesson: 4, kanji: "終わります", type: "гл. I" },

      // Places
      { japanese: "デパート", romaji: "depaato", russian: "универмаг", lesson: 4 },
      { japanese: "ぎんこう", romaji: "ginkou", russian: "банк", lesson: 4, kanji: "銀行" },
      { japanese: "ゆうびんきょく", romaji: "yuubinkyoku", russian: "почта, почтовое отделение", lesson: 4, kanji: "郵便局" },
      { japanese: "としょかん", romaji: "toshokan", russian: "библиотека", lesson: 4, kanji: "図書館" },
      { japanese: "びじゅつかん", romaji: "bijutsukan", russian: "художественный музей", lesson: 4, kanji: "美術館" },

      // Time words
      { japanese: "いま", romaji: "ima", russian: "сейчас", lesson: 4, kanji: "今" },
      { japanese: "~じ", romaji: "~ji", russian: "~ часов", lesson: 4, kanji: "~時" },
      { japanese: "~ふん(~ぷん)", romaji: "~fun (~pun)", russian: "~ минут", lesson: 4, kanji: "~分" },
      { japanese: "はん", romaji: "han", russian: "половина (напр. половина седьмого)", lesson: 4, kanji: "半" },
      { japanese: "なんじ", romaji: "nanji", russian: "сколько времени", lesson: 4, kanji: "何時" },
      { japanese: "なんぷん", romaji: "nanpun", russian: "сколько минут", lesson: 4, kanji: "何分" },

      // AM/PM
      { japanese: "ごぜん", romaji: "gozen", russian: "первая половина дня (AM)", lesson: 4, kanji: "午前" },
      { japanese: "ごご", romaji: "gogo", russian: "вторая половина дня (PM)", lesson: 4, kanji: "午後" },

      // Parts of day
      { japanese: "あさ", romaji: "asa", russian: "утро", lesson: 4, kanji: "朝" },
      { japanese: "ひる", romaji: "hiru", russian: "день", lesson: 4, kanji: "昼" },
      { japanese: "ばん(よる)", romaji: "ban (yoru)", russian: "вечер (поздний вечер)", lesson: 4, kanji: "晩(夜)" },

      // Relative time
      { japanese: "おととい", romaji: "ototoi", russian: "позавчера", lesson: 4 },
      { japanese: "きのう", romaji: "kinou", russian: "вчера", lesson: 4 },
      { japanese: "きょう", romaji: "kyou", russian: "сегодня", lesson: 4 },
      { japanese: "あした", romaji: "ashita", russian: "завтра", lesson: 4 },
      { japanese: "あさって", romaji: "asatte", russian: "послезавтра", lesson: 4 },
      { japanese: "けさ", romaji: "kesa", russian: "сегодня утром", lesson: 4 },
      { japanese: "こんばん", romaji: "konban", russian: "сегодня вечером", lesson: 4, kanji: "今晩" },

      // Rest
      { japanese: "やすみ", romaji: "yasumi", russian: "выходной день, отдых, перерыв", lesson: 4, kanji: "休み" },
      { japanese: "ひるやすみ", romaji: "hiruyasumi", russian: "обеденный перерыв", lesson: 4, kanji: "昼休み" },

      // Events
      { japanese: "しけん", romaji: "shiken", russian: "экзамен", lesson: 4, kanji: "試験" },
      { japanese: "かいぎ", romaji: "kaigi", russian: "собрание, заседание, совещание", lesson: 4, kanji: "会議" },
      { japanese: "えいが", romaji: "eiga", russian: "кинофильм", lesson: 4, kanji: "映画" },

      // Frequency
      { japanese: "まいあさ", romaji: "maiasa", russian: "каждое утро", lesson: 4, kanji: "毎朝" },
      { japanese: "まいばん", romaji: "maiban", russian: "каждый вечер", lesson: 4, kanji: "毎晩" },
      { japanese: "まいにち", romaji: "mainichi", russian: "каждый день", lesson: 4, kanji: "毎日" },

      // Days of week
      { japanese: "げつようび", romaji: "getsuyoubi", russian: "понедельник", lesson: 4, kanji: "月曜日" },
      { japanese: "かようび", romaji: "kayoubi", russian: "вторник", lesson: 4, kanji: "火曜日" },
      { japanese: "すいようび", romaji: "suiyoubi", russian: "среда", lesson: 4, kanji: "水曜日" },
      { japanese: "もくようび", romaji: "mokuyoubi", russian: "четверг", lesson: 4, kanji: "木曜日" },
      { japanese: "きんようび", romaji: "kinyoubi", russian: "пятница", lesson: 4, kanji: "金曜日" },
      { japanese: "どようび", romaji: "doyoubi", russian: "суббота", lesson: 4, kanji: "土曜日" },
      { japanese: "にちようび", romaji: "nichiyoubi", russian: "воскресенье", lesson: 4, kanji: "日曜日" },
      { japanese: "なんようび", romaji: "nanyoubi", russian: "какой день недели", lesson: 4, kanji: "何曜日" },

      // Particles
      { japanese: "~から", romaji: "~kara", russian: "с ~ (начало)", lesson: 4 },
      { japanese: "~まで", romaji: "~made", russian: "до ~", lesson: 4 },
      { japanese: "~と~", romaji: "~to~", russian: "и (соединяет существительные)", lesson: 4 },

      // Expressions
      { japanese: "たいへんですね", romaji: "taihen desu ne", russian: "да, ужасно / тяжело, не так ли", lesson: 4, kanji: "大変ですね" },

      // Kaiwa
      { japanese: "ばんごう", romaji: "bangou", russian: "номер (телефона, квартиры)", lesson: 4, kanji: "番号" },
      { japanese: "なんばん", romaji: "nanban", russian: "какой номер", lesson: 4, kanji: "何番" },
      { japanese: "そちら", romaji: "sochira", russian: "у вас (место собеседника)", lesson: 4 },

      // Cities
      { japanese: "ニューヨーク", romaji: "Nyuuyooku", russian: "Нью-Йорк", lesson: 4 },
      { japanese: "ペキン", romaji: "Pekin", russian: "Пекин", lesson: 4 },
      { japanese: "ロサンゼルス", romaji: "Rosanzerusu", russian: "Лос-Анджелес", lesson: 4 },
      { japanese: "ロンドン", romaji: "Rondon", russian: "Лондон", lesson: 4 },
    ],
    grammar: [
      {
        id: "4-1",
        pattern: "今 ー時ー分です",
        patternJp: "ima ~ji ~fun desu",
        meaning: "Сейчас ~ часов ~ минут",
        explanation: "Для выражения времени используются счётные суффиксы 時 (часы) и 分 (минуты).",
        examples: [
          { jp: "今 何時ですか。", romaji: "Ima nanji desu ka.", ru: "Сейчас сколько времени?" },
          { jp: "今 7時10分です。", romaji: "Ima shichiji juppun desu.", ru: "Сейчас 7 часов 10 минут." },
        ],
        lesson: 4,
      },
      {
        id: "4-2",
        pattern: "ГЛАГ ます / ГЛАГ ません / ГЛАГ ました / ГЛАГ ませんでした",
        patternJp: "V-masu / V-masen / V-mashita / V-masen deshita",
        meaning: "Формы глагола: утверждение / отрицание / прошедшее / прошедшее отрицание",
        explanation: "ます -- настоящее-будущее утвердительное. ません -- настоящее-будущее отрицательное. ました -- прошедшее утвердительное. ませんでした -- прошедшее отрицательное.",
        examples: [
          { jp: "毎日 勉強します。", romaji: "Mainichi benkyou shimasu.", ru: "Каждый день занимаюсь." },
          { jp: "きのう 勉強しましたか。-- はい、勉強しました。", romaji: "Kinou benkyou shimashita ka. -- Hai, benkyou shimashita.", ru: "Вчера занимались? -- Да, занимался." },
          { jp: "きのう 働きませんでした。", romaji: "Kinou hatarakimasen deshita.", ru: "Вчера не работал." },
        ],
        lesson: 4,
      },
      {
        id: "4-3",
        pattern: "СУЩ (выражение времени) に ГЛАГ",
        patternJp: "N (jikan) ni V",
        meaning: "делать V в/во время N",
        explanation: "Частица に после существительного, выражающего время, указывает на момент совершения действия. Примечание: с きょう, あした, きのう, まいにち и т.п. に не используется.",
        examples: [
          { jp: "6時半に 起きます。", romaji: "Rokuji han ni okimasu.", ru: "Встаю в половине седьмого." },
          { jp: "11時に 寝ます。", romaji: "Juuichiji ni nemasu.", ru: "Ложусь спать в одиннадцать." },
        ],
        lesson: 4,
      },
      {
        id: "4-4",
        pattern: "СУЩ1 から СУЩ2 まで",
        patternJp: "N1 kara N2 made",
        meaning: "от/с N1 до N2 (время или место)",
        explanation: "から указывает начало, まで -- конец. Могут использоваться и отдельно.",
        examples: [
          { jp: "9時から 5時まで 勉強します。", romaji: "Kuji kara goji made benkyou shimasu.", ru: "Занимаюсь с девяти до пяти." },
          { jp: "銀行は ごぜん9時から ごご3時までです。", romaji: "Ginkou wa gozen kuji kara gogo sanji made desu.", ru: "Банк открыт с 9 утра до 3 дня." },
        ],
        lesson: 4,
      },
      {
        id: "4-5",
        pattern: "СУЩ1 と СУЩ2",
        patternJp: "N1 to N2",
        meaning: "N1 и N2 (соединение существительных)",
        explanation: "Частица と соединяет два существительных.",
        examples: [
          { jp: "銀行の 休みは 土曜日と 日曜日です。", romaji: "Ginkou no yasumi wa doyoubi to nichiyoubi desu.", ru: "Банк закрыт по субботам и воскресеньям." },
          { jp: "朝ごはんは パンと 卵です。", romaji: "Asagohan wa pan to tamago desu.", ru: "На завтрак -- хлеб и яйцо." },
        ],
        lesson: 4,
      },
      {
        id: "4-6",
        pattern: "~ね",
        patternJp: "~ne",
        meaning: "не так ли? / да? (ожидание согласия)",
        explanation: "Частица ね в конце предложения выражает ожидание подтверждения от собеседника.",
        examples: [
          { jp: "毎日 10時ごろまで 勉強します。-- 大変ですね。", romaji: "Mainichi juuji goro made benkyou shimasu. -- Taihen desu ne.", ru: "Каждый день занимаюсь до десяти. -- Тяжело, не так ли?" },
          { jp: "いい 天気ですね。", romaji: "Ii tenki desu ne.", ru: "Хорошая погода, правда?" },
        ],
        lesson: 4,
      },
    ],
  },

  // ===================== LESSON 5 =====================
  {
    id: 5,
    title: "Lesson 5",
    titleJp: "だいごか",
    topic: lessonTopics[5],
    vocabulary: [
      // Verbs of movement
      { japanese: "いきます", romaji: "ikimasu", russian: "идти, ехать", lesson: 5, kanji: "行きます", type: "гл. I" },
      { japanese: "きます", romaji: "kimasu", russian: "приходить, приезжать", lesson: 5, kanji: "来ます", type: "гл. III" },
      { japanese: "かえります", romaji: "kaerimasu", russian: "уходить домой, возвращаться", lesson: 5, kanji: "帰ります", type: "гл. I" },

      // Places
      { japanese: "がっこう", romaji: "gakkou", russian: "школа", lesson: 5, kanji: "学校" },
      { japanese: "スーパー", romaji: "suupaa", russian: "супермаркет", lesson: 5 },
      { japanese: "えき", romaji: "eki", russian: "станция, вокзал", lesson: 5, kanji: "駅" },

      // Transport
      { japanese: "ひこうき", romaji: "hikouki", russian: "самолёт", lesson: 5, kanji: "飛行機" },
      { japanese: "ふね", romaji: "fune", russian: "корабль", lesson: 5, kanji: "船" },
      { japanese: "でんしゃ", romaji: "densha", russian: "поезд", lesson: 5, kanji: "電車" },
      { japanese: "ちかてつ", romaji: "chikatetsu", russian: "метро", lesson: 5, kanji: "地下鉄" },
      { japanese: "しんかんせん", romaji: "shinkansen", russian: "скоростная ж/д Синкансэн", lesson: 5, kanji: "新幹線" },
      { japanese: "バス", romaji: "basu", russian: "автобус", lesson: 5 },
      { japanese: "タクシー", romaji: "takushii", russian: "такси", lesson: 5 },
      { japanese: "じてんしゃ", romaji: "jitensha", russian: "велосипед", lesson: 5, kanji: "自転車" },
      { japanese: "あるいて", romaji: "aruite", russian: "пешком", lesson: 5, kanji: "歩いて" },

      // People
      { japanese: "ひと", romaji: "hito", russian: "человек", lesson: 5, kanji: "人" },
      { japanese: "ともだち", romaji: "tomodachi", russian: "друг", lesson: 5, kanji: "友達" },
      { japanese: "かれ", romaji: "kare", russian: "он, бойфренд", lesson: 5, kanji: "彼" },
      { japanese: "かのじょ", romaji: "kanojo", russian: "она, гёрлфренд", lesson: 5, kanji: "彼女" },
      { japanese: "かぞく", romaji: "kazoku", russian: "семья", lesson: 5, kanji: "家族" },
      { japanese: "ひとりで", romaji: "hitori de", russian: "один, в одиночку", lesson: 5, kanji: "一人で" },

      // Time periods (week)
      { japanese: "せんしゅう", romaji: "senshuu", russian: "прошлая неделя", lesson: 5, kanji: "先週" },
      { japanese: "こんしゅう", romaji: "konshuu", russian: "эта (текущая) неделя", lesson: 5, kanji: "今週" },
      { japanese: "らいしゅう", romaji: "raishuu", russian: "следующая неделя", lesson: 5, kanji: "来週" },

      // Time periods (month)
      { japanese: "せんげつ", romaji: "sengetsu", russian: "прошлый месяц", lesson: 5, kanji: "先月" },
      { japanese: "こんげつ", romaji: "kongetsu", russian: "этот (текущий) месяц", lesson: 5, kanji: "今月" },
      { japanese: "らいげつ", romaji: "raigetsu", russian: "следующий месяц", lesson: 5, kanji: "来月" },

      // Time periods (year)
      { japanese: "きょねん", romaji: "kyonen", russian: "прошлый год", lesson: 5, kanji: "去年" },
      { japanese: "ことし", romaji: "kotoshi", russian: "этот (текущий) год", lesson: 5, kanji: "今年" },
      { japanese: "らいねん", romaji: "rainen", russian: "следующий год", lesson: 5, kanji: "来年" },

      // Year/Month counters
      { japanese: "~ねん", romaji: "~nen", russian: "~-ый (-ой, -ий) год", lesson: 5, kanji: "~年" },
      { japanese: "なんねん", romaji: "nannen", russian: "какой год?", lesson: 5, kanji: "何年" },
      { japanese: "~がつ", romaji: "~gatsu", russian: "~ месяц года (январь, февраль...)", lesson: 5, kanji: "~月" },
      { japanese: "なんがつ", romaji: "nangatsu", russian: "какой месяц?", lesson: 5, kanji: "何月" },

      // Dates
      { japanese: "ついたち", romaji: "tsuitachi", russian: "1-е число", lesson: 5, kanji: "1日" },
      { japanese: "ふつか", romaji: "futsuka", russian: "2-е число", lesson: 5, kanji: "2日" },
      { japanese: "みっか", romaji: "mikka", russian: "3-е число", lesson: 5, kanji: "3日" },
      { japanese: "よっか", romaji: "yokka", russian: "4-е число", lesson: 5, kanji: "4日" },
      { japanese: "いつか", romaji: "itsuka", russian: "5-е число", lesson: 5, kanji: "5日" },
      { japanese: "むいか", romaji: "muika", russian: "6-е число", lesson: 5, kanji: "6日" },
      { japanese: "なのか", romaji: "nanoka", russian: "7-е число", lesson: 5, kanji: "7日" },
      { japanese: "ようか", romaji: "youka", russian: "8-е число", lesson: 5, kanji: "8日" },
      { japanese: "ここのか", romaji: "kokonoka", russian: "9-е число", lesson: 5, kanji: "9日" },
      { japanese: "とおか", romaji: "tooka", russian: "10-е число", lesson: 5, kanji: "10日" },
      { japanese: "じゅうよっか", romaji: "juuyokka", russian: "14-е число", lesson: 5, kanji: "14日" },
      { japanese: "はつか", romaji: "hatsuka", russian: "20-е число", lesson: 5, kanji: "20日" },
      { japanese: "にじゅうよっか", romaji: "nijuuyokka", russian: "24-е число", lesson: 5, kanji: "24日" },
      { japanese: "~にち", romaji: "~nichi", russian: "~-е число, ~ дней", lesson: 5, kanji: "~日" },
      { japanese: "なんにち", romaji: "nannichi", russian: "какое число / сколько дней", lesson: 5, kanji: "何日" },

      // Question word
      { japanese: "いつ", romaji: "itsu", russian: "когда", lesson: 5 },

      // Other
      { japanese: "たんじょうび", romaji: "tanjoubi", russian: "день рождения", lesson: 5, kanji: "誕生日" },

      // Expressions
      { japanese: "そうですね", romaji: "sou desu ne", russian: "да, не так ли / да, вы правы", lesson: 5 },
      { japanese: "[どうも]ありがとうございました", romaji: "[doumo] arigatou gozaimashita", russian: "большое спасибо! (за прошлое)", lesson: 5 },
      { japanese: "どういたしまして", romaji: "dou itashimashite", russian: "не за что / не стоит благодарности", lesson: 5 },

      // Train-related (Kaiwa)
      { japanese: "~ばんせん", romaji: "~bansen", russian: "платформа (путь) № ~", lesson: 5, kanji: "~番線" },
      { japanese: "つぎの", romaji: "tsugi no", russian: "следующий", lesson: 5, kanji: "次の" },
      { japanese: "ふつう", romaji: "futsuu", russian: "обычный поезд (со всеми остановками)", lesson: 5, kanji: "普通" },
      { japanese: "きゅうこう", romaji: "kyuukou", russian: "поезд-экспресс", lesson: 5, kanji: "急行" },
      { japanese: "とっきゅう", romaji: "tokkyuu", russian: "скорый поезд", lesson: 5, kanji: "特急" },

      // Place names
      { japanese: "こうしえん", romaji: "Koushien", russian: "г. Косиэн", lesson: 5, kanji: "甲子園" },
      { japanese: "おおさかじょう", romaji: "Oosaka-jou", russian: "Осакский замок", lesson: 5, kanji: "大阪城" },
    ],
    grammar: [
      {
        id: "5-1",
        pattern: "СУЩ(место) へ 行きます / 来ます / 帰ります",
        patternJp: "N (basho) e ikimasu / kimasu / kaerimasu",
        meaning: "идти/приходить/возвращаться куда-то",
        explanation: "Частица へ (читается え) после существительного-места указывает направление движения.",
        examples: [
          { jp: "京都へ 行きます。", romaji: "Kyouto e ikimasu.", ru: "Поеду в Киото." },
          { jp: "日本へ 来ました。", romaji: "Nihon e kimashita.", ru: "Приехал в Японию." },
          { jp: "うちへ 帰ります。", romaji: "Uchi e kaerimasu.", ru: "Возвращаюсь домой." },
        ],
        lesson: 5,
      },
      {
        id: "5-2",
        pattern: "どこ[へ]も 行きません / 行きませんでした",
        patternJp: "doko [e] mo ikimasen / ikimasen deshita",
        meaning: "никуда не ходил / не пойду (полное отрицание)",
        explanation: "Вопросительное местоимение + も + отрицательная форма глагола = полное отрицание.",
        examples: [
          { jp: "どこ[へ]も 行きません。", romaji: "Doko [e] mo ikimasen.", ru: "Никуда не иду." },
          { jp: "何も 食べません。", romaji: "Nani mo tabemasen.", ru: "Ничего не ем." },
          { jp: "だれも 来ませんでした。", romaji: "Dare mo kimasen deshita.", ru: "Никто не приходил." },
        ],
        lesson: 5,
      },
      {
        id: "5-3",
        pattern: "СУЩ(вид транспорта) で 行きます / 来ます / 帰ります",
        patternJp: "N (norimono) de ikimasu / kimasu / kaerimasu",
        meaning: "ехать/приезжать/возвращаться на (транспорте)",
        explanation: "Частица で указывает способ передвижения. Для «пешком» используется あるいて без で.",
        examples: [
          { jp: "電車で 行きます。", romaji: "Densha de ikimasu.", ru: "Поеду на поезде." },
          { jp: "タクシーで 来ました。", romaji: "Takushii de kimashita.", ru: "Приехал на такси." },
          { jp: "駅から 歩いて 帰りました。", romaji: "Eki kara aruite kaerimashita.", ru: "Со станции вернулся пешком." },
        ],
        lesson: 5,
      },
      {
        id: "5-4",
        pattern: "СУЩ(одушевлённое) と ГЛАГ",
        patternJp: "N (hito) to V",
        meaning: "делать что-то с кем-то",
        explanation: "Частица と после одушевлённого существительного указывает на совместное действие. При действии в одиночку используется 一人で.",
        examples: [
          { jp: "家族と 日本へ 来ました。", romaji: "Kazoku to Nihon e kimashita.", ru: "Приехал в Японию с семьёй." },
          { jp: "一人で 東京へ 行きます。", romaji: "Hitori de Toukyou e ikimasu.", ru: "Поеду в Токио один." },
        ],
        lesson: 5,
      },
      {
        id: "5-5",
        pattern: "いつ",
        patternJp: "itsu",
        meaning: "когда (вопросительное слово)",
        explanation: "Вопрос о времени. Частица に не используется с いつ.",
        examples: [
          { jp: "いつ 日本へ 来ましたか。-- 3月25日に 来ました。", romaji: "Itsu Nihon e kimashita ka. -- Sangatsu nijuugonichi ni kimashita.", ru: "Когда приехали в Японию? -- 25 марта." },
          { jp: "いつ 帰りますか。-- 来週 帰ります。", romaji: "Itsu kaerimasu ka. -- Raishuu kaerimasu.", ru: "Когда вернётесь? -- На следующей неделе." },
        ],
        lesson: 5,
      },
      {
        id: "5-6",
        pattern: "~よ",
        patternJp: "~yo",
        meaning: "~ (выделение новой информации)",
        explanation: "Частица よ в конце предложения служит для выделения новой информации или подчёркивания.",
        examples: [
          { jp: "この 電車は 甲子園へ 行きますか。-- いいえ、行きません。次の「普通」ですよ。", romaji: "Kono densha wa Koushien e ikimasu ka. -- Iie, ikimasen. Tsugi no \"futsuu\" desu yo.", ru: "Этот поезд идёт в Косиэн? -- Нет. Следующий, со всеми остановками." },
          { jp: "あした テストですよ。", romaji: "Ashita tesuto desu yo.", ru: "Завтра тест!" },
        ],
        lesson: 5,
      },
      {
        id: "5-7",
        pattern: "そうですね",
        patternJp: "sou desu ne",
        meaning: "Да, не так ли / Да, вы правы",
        explanation: "Выражает согласие с мнением или чувствами собеседника. В отличие от そうですか (получение новой информации), そうですね используется, когда говорящий разделяет мнение.",
        examples: [
          { jp: "あしたは 日曜日ですね。-- あ、そうですね。", romaji: "Ashita wa nichiyoubi desu ne. -- A, sou desu ne.", ru: "Завтра воскресенье, не так ли? -- А, да, конечно!" },
        ],
        lesson: 5,
      },
    ],
  },
];

// Combine all lessons 1-20
export const lessons = [
  ...lessons1to5,
  buildLesson(6, lesson6Vocabulary, lesson6Grammar),
  buildLesson(7, lesson7Vocabulary, lesson7Grammar),
  buildLesson(8, lesson8Vocabulary, lesson8Grammar),
  buildLesson(9, lesson9Vocabulary, lesson9Grammar),
  buildLesson(10, lesson10Vocabulary, lesson10Grammar),
  buildLesson(11, lesson11Vocabulary, lesson11Grammar),
  buildLesson(12, lesson12Vocabulary, lesson12Grammar),
  buildLesson(13, lesson13Vocabulary, lesson13Grammar),
  buildLesson(14, lesson14Vocabulary, lesson14Grammar),
  buildLesson(15, lesson15Vocabulary, lesson15Grammar),
  buildLesson(16, lesson16Vocabulary, lesson16Grammar),
  buildLesson(17, lesson17Vocabulary, lesson17Grammar),
  buildLesson(18, lesson18Vocabulary, lesson18Grammar),
  buildLesson(19, lesson19Vocabulary, lesson19Grammar),
  buildLesson(20, lesson20Vocabulary, lesson20Grammar),
  buildLesson(21, lesson21Vocabulary, lesson21Grammar),
  buildLesson(22, lesson22Vocabulary, lesson22Grammar),
  buildLesson(23, lesson23Vocabulary, lesson23Grammar),
  buildLesson(24, lesson24Vocabulary, lesson24Grammar),
  buildLesson(25, lesson25Vocabulary, lesson25Grammar),
];

// Helper: get all vocabulary as flat array
export const getAllVocabulary = () => {
  return lessons.flatMap((lesson) => lesson.vocabulary);
};

// Helper: get vocabulary by lesson number
export const getVocabularyByLesson = (lessonId) => {
  const lesson = lessons.find((l) => l.id === lessonId);
  return lesson ? lesson.vocabulary : [];
};

// Helper: get grammar by lesson number
export const getGrammarByLesson = (lessonId) => {
  const lesson = lessons.find((l) => l.id === lessonId);
  return lesson ? lesson.grammar : [];
};

// Helper: get all grammar as flat array
export const getAllGrammar = () => {
  return lessons.flatMap((lesson) => lesson.grammar);
};

// Stats
export const getLessonStats = () => {
  return lessons.map((l) => ({
    id: l.id,
    title: l.title,
    vocabularyCount: l.vocabulary.length,
    grammarCount: l.grammar.length,
  }));
};
