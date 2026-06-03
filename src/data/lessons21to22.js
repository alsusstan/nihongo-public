// =============================================================================
// Minna no Nihongo Lessons 21-22: Vocabulary & Grammar
// Extracted from: Минна но Нихонго (РУССКИЙ).pdf
// =============================================================================

// ---------------------------------------------------------------------------
// LESSON 21 - Урок 21: Мнения и цитаты (~とおもいます, ~と言っていました)
// ---------------------------------------------------------------------------
export const lesson21Vocabulary = [
  // Verbs (порядок по учебнику)
  { japanese: "おもいます", romaji: "omoimasu", russian: "думать, считать, полагать", type: "гл. I", kanji: "思います" },
  { japanese: "いいます", romaji: "iimasu", russian: "говорить, сказать", type: "гл. I", kanji: "言います" },
  { japanese: "かちます", romaji: "kachimasu", russian: "побеждать", type: "гл. I", kanji: "勝ちます" },
  { japanese: "まけます", romaji: "makemasu", russian: "проигрывать, терпеть поражение", type: "гл. II", kanji: "負けます" },
  { japanese: "あります [おまつりが〜]", romaji: "arimasu [omatsuri ga ~]", russian: "быть, состояться; проводится [праздник]", type: "гл. I", kanji: "あります [お祭りが〜]" },
  { japanese: "やくにたちます", romaji: "yaku ni tachimasu", russian: "пригодиться, быть полезным", type: "гл. I", kanji: "役に立ちます" },
  { japanese: "うごきます", romaji: "ugokimasu", russian: "двигаться; работать, функционировать", type: "гл. I", kanji: "動きます" },
  { japanese: "やめます [かいしゃを〜]", romaji: "yamemasu [kaisha wo ~]", russian: "закончить, бросить [работу в компании]", type: "гл. II", kanji: "やめます [会社を〜]" },
  { japanese: "きをつけます", romaji: "ki wo tsukemasu", russian: "быть внимательным, осторожным", type: "гл. II", kanji: "気をつけます" },
  { japanese: "りゅうがくします", romaji: "ryuugaku shimasu", russian: "учиться за границей", type: "гл. III", kanji: "留学します" },
  // な-adjectives
  { japanese: "むだ[な]", romaji: "muda [na]", russian: "ненужный, излишний, тщетный", kanji: "無駄[な]" },
  { japanese: "ふべん[な]", romaji: "fuben [na]", russian: "неудобный", kanji: "不便[な]" },
  // い-adjective / exclamation
  { japanese: "すごい", romaji: "sugoi", russian: "Отлично! Ужасно! Вот это да! (восхищение или удивление)" },
  // Nouns
  { japanese: "ほんとう", romaji: "hontou", russian: "правда", kanji: "本当" },
  { japanese: "うそ", romaji: "uso", russian: "ложь, неправда", kanji: "嘘" },
  { japanese: "じどうしゃ", romaji: "jidousha", russian: "машина, автомобиль", kanji: "自動車" },
  { japanese: "こうつう", romaji: "koutsuu", russian: "транспорт, дорожное движение", kanji: "交通" },
  { japanese: "ぶっか", romaji: "bukka", russian: "цены (на потребительские товары)", kanji: "物価" },
  { japanese: "ほうそう", romaji: "housou", russian: "радио~, теле~ -передача, -вещание", kanji: "放送" },
  { japanese: "ニュース", romaji: "nyuusu", russian: "новости" },
  { japanese: "アニメ", romaji: "anime", russian: "анимация (японские мультфильмы, аниме)" },
  { japanese: "マンガ", romaji: "manga", russian: "комиксы, манга" },
  { japanese: "デザイン", romaji: "dezain", russian: "дизайн" },
  { japanese: "ゆめ", romaji: "yume", russian: "мечта; сон", kanji: "夢" },
  { japanese: "てんさい", romaji: "tensai", russian: "гений; исключительный талант", kanji: "天才" },
  { japanese: "しあい", romaji: "shiai", russian: "матч, игра (~をします играть (в футбол и т.п.))", kanji: "試合" },
  { japanese: "いけん", romaji: "iken", russian: "мнение", kanji: "意見" },
  { japanese: "はなし", romaji: "hanashi", russian: "разговор, речь, рассказ (~をします говорить, рассказывать)", kanji: "話" },
  { japanese: "ちきゅう", romaji: "chikyuu", russian: "Земля (планета солнечной системы)", kanji: "地球" },
  { japanese: "つき", romaji: "tsuki", russian: "Луна; луна (месяц)", kanji: "月" },
  // Adverbs
  { japanese: "さいきん", romaji: "saikin", russian: "недавно, в последнее время", kanji: "最近" },
  { japanese: "たぶん", romaji: "tabun", russian: "наверное, может быть" },
  { japanese: "きっと", romaji: "kitto", russian: "непременно, обязательно, наверняка" },
  { japanese: "ほんとうに", romaji: "hontou ni", russian: "действительно, на самом деле", kanji: "本当に" },
  { japanese: "そんなに", romaji: "sonnani", russian: "так, настолько (часто с отрицанием)" },
  { japanese: "〜について", romaji: "~ni tsuite", russian: "о ~, про ~" },
  // 会話
  { japanese: "ひさしぶりですね。", romaji: "hisashiburi desu ne.", russian: "Давно не виделись.", kanji: "久しぶりですね。" },
  { japanese: "〜でものみませんか。", romaji: "~demo nomimasen ka.", russian: "А не выпить ли нам ~?", kanji: "〜でも飲みませんか。" },
  { japanese: "もちろん", romaji: "mochiron", russian: "конечно, разумеется" },
  { japanese: "もうかえらないと……。", romaji: "mou kaeranai to......", russian: "Мне уже нужно (пора) возвращаться.", kanji: "もう帰らないと……。" },
];

export const lesson21Grammar = [
  {
    pattern: "простая форма + と思います",
    patternJp: "plain form + to omoimasu",
    meaning: "я думаю, что...",
    explanation: "Выражение собственного мнения или предположения. Глагол/прилагательное/существительное в простой форме + と思います. Для な-прилагательных и существительных в настоящем утвердительном: だ заменяется на だと思います. Отрицание: 〜ないと思います (я думаю, что не...). В вопросе: 〜と思いますか.",
    examples: [
      { jp: "あした 雨が 降ると 思います。", romaji: "Ashita ame ga furu to omoimasu.", ru: "Я думаю, завтра пойдёт дождь." },
      { jp: "日本は 安全だと 思います。", romaji: "Nihon wa anzen da to omoimasu.", ru: "Я думаю, что Япония безопасная." },
      { jp: "ミラーさんは 来ないと 思います。", romaji: "Miraa-san wa konai to omoimasu.", ru: "Я думаю, г-н Миллер не придёт." },
    ],
  },
  {
    pattern: "простая форма + と言っていました",
    patternJp: "plain form + to itte imashita",
    meaning: "кто-то говорил, что...",
    explanation: "Передача чужих слов (косвенная речь в прошедшем длительном). Используется, когда пересказываете то, что кто-то сказал раньше. Отличие от と言いました: と言っていました подчёркивает, что информация передаётся «из вторых рук».",
    examples: [
      { jp: "ミラーさんは 出張は 疲れると 言っていました。", romaji: "Miraa-san wa shucchou wa tsukareru to itte imashita.", ru: "Г-н Миллер говорил, что командировки утомляют." },
      { jp: "天気予報は あした 雪が 降ると 言っていました。", romaji: "Tenki yohou wa ashita yuki ga furu to itte imashita.", ru: "Прогноз погоды говорил, что завтра пойдёт снег." },
      { jp: "先生は テストは 簡単だと 言っていました。", romaji: "Sensei wa tesuto wa kantan da to itte imashita.", ru: "Учитель говорил, что тест лёгкий." },
    ],
  },
  {
    pattern: "простая форма + でしょう？",
    patternJp: "plain form + deshou?",
    meaning: "ведь..., не так ли? / наверное...",
    explanation: "1) С повышением интонации (でしょう？↑): вопрос-подтверждение, ожидание согласия. 2) С понижением интонации (でしょう↓): предположение, «наверное». Для な-прилагательных и существительных: だ убирается перед でしょう.",
    examples: [
      { jp: "あした パーティーに 行くでしょう？", romaji: "Ashita paatii ni iku deshou?", ru: "Ты ведь пойдёшь завтра на вечеринку?" },
      { jp: "この 映画は おもしろかったでしょう？", romaji: "Kono eiga wa omoshirokatta deshou?", ru: "Фильм ведь был интересный, правда?" },
      { jp: "あしたは いい 天気でしょう。", romaji: "Ashita wa ii tenki deshou.", ru: "Завтра, наверное, будет хорошая погода." },
    ],
  },
  {
    pattern: "простая форма + んです",
    patternJp: "plain form + n desu",
    meaning: "дело в том, что... / (объяснение причины)",
    explanation: "Используется для объяснения ситуации, уточнения причины, выражения удивления. В вопросе: 〜んですか (прошу объяснения). Для な-прилагательных и существительных: な + んです / だった + んです.",
    examples: [
      { jp: "どうしたんですか。-- 頭が 痛いんです。", romaji: "Doushita n desu ka. -- Atama ga itai n desu.", ru: "Что случилось? -- У меня болит голова." },
      { jp: "なぜ 遅れたんですか。-- バスが 来なかったんです。", romaji: "Naze okureta n desu ka. -- Basu ga konakatta n desu.", ru: "Почему опоздал? -- Автобус не пришёл." },
      { jp: "日本語を 勉強しているんです。", romaji: "Nihongo wo benkyou shite iru n desu.", ru: "Дело в том, что я учу японский." },
    ],
  },
];

// ---------------------------------------------------------------------------
// LESSON 22 - Урок 22: Определение существительных (относительные предложения)
// ---------------------------------------------------------------------------
export const lesson22Vocabulary = [
  // Verbs
  { japanese: "きます", romaji: "kimasu", russian: "надевать (одежду на верхнюю часть тела)", type: "гл. II", kanji: "着ます" },
  { japanese: "はきます", romaji: "hakimasu", russian: "надевать (одежду на нижнюю часть тела, обувь)", type: "гл. I" },
  { japanese: "かぶります", romaji: "kaburimasu", russian: "надевать (головной убор)", type: "гл. I" },
  { japanese: "かけます [めがねを~]", romaji: "kakemasu [megane wo~]", russian: "надевать, навешивать [очки]", type: "гл. II", kanji: "かけます [眼鏡を~]" },
  { japanese: "します [ネクタイを~]", romaji: "shimasu [nekutai wo~]", russian: "прикалывать, повязывать [галстук]", type: "гл. III" },
  { japanese: "うまれます", romaji: "umaremasu", russian: "родиться", type: "гл. II", kanji: "生まれます" },
  // Pronouns
  { japanese: "わたしたち", romaji: "watashitachi", russian: "мы" },
  // Nouns — clothing
  { japanese: "コート", romaji: "kooto", russian: "пальто" },
  { japanese: "セーター", romaji: "seetaa", russian: "свитер" },
  { japanese: "スーツ", romaji: "suutsu", russian: "костюм" },
  { japanese: "ぼうし", romaji: "boushi", russian: "головной убор (шапка, шляпа и т.д.)", kanji: "帽子" },
  { japanese: "めがね", romaji: "megane", russian: "очки", kanji: "眼鏡" },
  // Nouns — other
  { japanese: "ケーキ", romaji: "keeki", russian: "торт, пирожное" },
  { japanese: "[お]べんとう", romaji: "[o]bentou", russian: "бэнто, коробка с готовым обедом", kanji: "[お]弁当" },
  { japanese: "ロボット", romaji: "robotto", russian: "робот" },
  { japanese: "ユーモア", romaji: "yuumoa", russian: "юмор" },
  { japanese: "つごう", romaji: "tsugou", russian: "обстоятельства, ситуация, обстановка", kanji: "都合" },
  // Adverbs
  { japanese: "よく", romaji: "yoku", russian: "часто" },
  // 練習C expressions
  { japanese: "えーと", romaji: "eeto", russian: "так (междометие)" },
  { japanese: "おめでとう[ございます]", romaji: "omedetou [gozaimasu]", russian: "Поздравляю!" },
  // 会話 expressions
  { japanese: "おさがしですか", romaji: "osagashi desu ka", russian: "Вы ищете...?", kanji: "お探しですか" },
  { japanese: "では", romaji: "dewa", russian: "тогда; в таком случае" },
  { japanese: "こちら", romaji: "kochira", russian: "это (учтиво-вежливый эквивалент これ)" },
  { japanese: "やちん", romaji: "yachin", russian: "арендная плата за квартиру", kanji: "家賃" },
  { japanese: "ダイニングキッチン", romaji: "dainingu kicchin", russian: "кухня-столовая" },
  { japanese: "わしつ", romaji: "washitsu", russian: "комната в японском стиле", kanji: "和室" },
  { japanese: "おしいれ", romaji: "oshiire", russian: "стенной шкаф", kanji: "押し入れ" },
  { japanese: "ふとん", romaji: "futon", russian: "матрас для сна на полу на циновках", kanji: "布団" },
]

export const lesson22Grammar = [
  {
    pattern: "ГЛАГ(простая форма) + СУЩ (определение существительного)",
    patternJp: "V (plain form) + N (noun modification)",
    meaning: "существительное, определяемое глаголом (который/которая делает...)",
    explanation: "Глагол в простой форме ставится перед существительным и определяет его, как прилагательное. Аналог русских придаточных предложений с «который». Порядок: определение → существительное.",
    examples: [
      { jp: "これは ミラーさんが 作った ケーキです。", romaji: "Kore wa Miraa-san ga tsukutta keeki desu.", ru: "Это торт, который сделал г-н Миллер." },
      { jp: "きのう 買った 本は おもしろかったです。", romaji: "Kinou katta hon wa omoshirokatta desu.", ru: "Книга, которую я купил вчера, была интересной." },
      { jp: "あそこに いる 人は だれですか。", romaji: "Asoko ni iru hito wa dare desu ka.", ru: "Кто тот человек, который находится вон там?" },
    ],
  },
  {
    pattern: "ГЛАГ(て-форма) いる + СУЩ (описание состояния/внешности)",
    patternJp: "V-te iru + N (describing appearance/state)",
    meaning: "существительное в состоянии (человек, который носит/делает...)",
    explanation: "Для описания внешнего вида или текущего состояния человека/предмета используется て-форма + いる перед существительным. Часто применяется с глаголами одежды: 着ています (надет), かぶっています (на голове), はいています (обувь/брюки), かけています (очки).",
    examples: [
      { jp: "眼鏡を かけている 人は だれですか。", romaji: "Megane wo kakete iru hito wa dare desu ka.", ru: "Кто тот человек в очках?" },
      { jp: "赤い セーターを 着ている 女の人は カリナさんです。", romaji: "Akai seetaa wo kite iru onna no hito wa Karina-san desu.", ru: "Женщина в красном свитере -- это Карина." },
      { jp: "帽子を かぶっている 男の人は ミラーさんです。", romaji: "Boushi wo kabutte iru otoko no hito wa Miraa-san desu.", ru: "Мужчина в шляпе -- это г-н Миллер." },
    ],
  },
  {
    pattern: "ПРИЛ / СУЩ + СУЩ (определение прилагательным или существительным)",
    patternJp: "ADJ / N no + N (adjective/noun modification)",
    meaning: "определение существительного прилагательным или другим существительным",
    explanation: "Определение стоит перед определяемым существительным: い-прилагательное + СУЩ (длинная юбка), な-прилагательное + な + СУЩ (тихая комната), СУЩ + の + СУЩ (учитель японского).",
    examples: [
      { jp: "白い 靴を はいている 人は だれですか。", romaji: "Shiroi kutsu wo haite iru hito wa dare desu ka.", ru: "Кто тот человек в белых туфлях?" },
      { jp: "髪が 長い 女の人は カリナさんです。", romaji: "Kami ga nagai onna no hito wa Karina-san desu.", ru: "Женщина с длинными волосами -- это Карина." },
      { jp: "日本語の 先生は あの 方です。", romaji: "Nihongo no sensei wa ano kata desu.", ru: "Учитель японского -- вон тот человек." },
    ],
  },
  {
    pattern: "わたしが ГЛАГ(простая форма) + СУЩ (уточнение с が внутри определения)",
    patternJp: "watashi ga V (plain) + N",
    meaning: "существительное, которое я (делаю/делал)...",
    explanation: "Внутри придаточного определения (перед существительным) подлежащее обозначается частицей が, а не は. Это важное отличие от главного предложения.",
    examples: [
      { jp: "わたしが 住んでいる 町は 静かです。", romaji: "Watashi ga sunde iru machi wa shizuka desu.", ru: "Город, в котором я живу, тихий." },
      { jp: "母が 作った 料理は おいしいです。", romaji: "Haha ga tsukutta ryouri wa oishii desu.", ru: "Блюда, которые готовит мама, вкусные." },
      { jp: "彼女が 働いている 会社は 大きいです。", romaji: "Kanojo ga hataraite iru kaisha wa ookii desu.", ru: "Компания, в которой она работает, большая." },
    ],
  },
];

// ---------------------------------------------------------------------------
// Combined exports
// ---------------------------------------------------------------------------
export const allLessons21to22 = {
  21: { vocabulary: lesson21Vocabulary, grammar: lesson21Grammar },
  22: { vocabulary: lesson22Vocabulary, grammar: lesson22Grammar },
};
