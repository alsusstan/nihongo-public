// =============================================================================
// Minna no Nihongo Lessons 11-15: Vocabulary & Grammar
// Extracted from: Минна но Нихонго (РУССКИЙ).pdf
// =============================================================================

// ---------------------------------------------------------------------------
// LESSON 11 - Урок 11: Счётные суффиксы
// ---------------------------------------------------------------------------
export const lesson11Vocabulary = [
  // Verbs (первыми, как в учебнике)
  { japanese: "います [こどもが〜]", romaji: "imasu [kodomo ga~]", russian: "есть, иметься [ребёнок]", type: "гл. II" },
  { japanese: "います [にほんに〜]", romaji: "imasu [nihon ni~]", russian: "находиться [в Японии]", type: "гл. II" },
  { japanese: "かかります", romaji: "kakarimasu", russian: "требоваться (о времени или деньгах)", type: "гл. I" },
  { japanese: "やすみます [かいしゃを〜]", romaji: "yasumimasu [kaisha wo~]", russian: "брать отпуск или выходной [на работе]", type: "гл. I", kanji: "休みます [会社を〜]" },
  // Счётные слова (собственно японские)
  { japanese: "ひとつ", romaji: "hitotsu", russian: "один", kanji: "一つ" },
  { japanese: "ふたつ", romaji: "futatsu", russian: "два", kanji: "二つ" },
  { japanese: "みっつ", romaji: "mittsu", russian: "три", kanji: "三つ" },
  { japanese: "よっつ", romaji: "yottsu", russian: "четыре", kanji: "四つ" },
  { japanese: "いつつ", romaji: "itsutsu", russian: "пять", kanji: "五つ" },
  { japanese: "むっつ", romaji: "muttsu", russian: "шесть", kanji: "六つ" },
  { japanese: "ななつ", romaji: "nanatsu", russian: "семь", kanji: "七つ" },
  { japanese: "やっつ", romaji: "yattsu", russian: "восемь", kanji: "八つ" },
  { japanese: "ここのつ", romaji: "kokonotsu", russian: "девять", kanji: "九つ" },
  { japanese: "とお", romaji: "too", russian: "десять", kanji: "十" },
  { japanese: "いくつ", romaji: "ikutsu", russian: "сколько" },
  // Люди
  { japanese: "ひとり", romaji: "hitori", russian: "один человек", kanji: "一人" },
  { japanese: "ふたり", romaji: "futari", russian: "два человека", kanji: "二人" },
  { japanese: "〜にん", romaji: "~nin", russian: "~ чел.", kanji: "〜人" },
  // Счётные суффиксы
  { japanese: "〜だい", romaji: "~dai", russian: "счётный суффикс для машин, механизмов", kanji: "〜台" },
  { japanese: "〜まい", romaji: "~mai", russian: "счётный суффикс для листов бумаги и т.п.", kanji: "〜枚" },
  { japanese: "〜かい", romaji: "~kai", russian: "~ раз", kanji: "〜回" },
  // Еда
  { japanese: "りんご", romaji: "ringo", russian: "яблоко" },
  { japanese: "みかん", romaji: "mikan", russian: "мандарин" },
  { japanese: "サンドイッチ", romaji: "sandoicchi", russian: "бутерброд" },
  { japanese: "カレー[ライス]", romaji: "karee [raisu]", russian: "соус карри [с рисом]" },
  { japanese: "アイスクリーム", romaji: "aisukuriimu", russian: "мороженое" },
  // Почта
  { japanese: "きって", romaji: "kitte", russian: "почтовая марка", kanji: "切手" },
  { japanese: "はがき", romaji: "hagaki", russian: "почтовая открытка" },
  { japanese: "ふうとう", romaji: "fuutou", russian: "конверт", kanji: "封筒" },
  // Семья
  { japanese: "りょうしん", romaji: "ryoushin", russian: "родители", kanji: "両親" },
  { japanese: "きょうだい", romaji: "kyoudai", russian: "братья и сёстры", kanji: "兄弟" },
  { japanese: "あに", romaji: "ani", russian: "старший брат (мой)", kanji: "兄" },
  { japanese: "おにいさん", romaji: "oniisan", russian: "старший брат (чей-то)", kanji: "お兄さん" },
  { japanese: "あね", romaji: "ane", russian: "старшая сестра (моя)", kanji: "姉" },
  { japanese: "おねえさん", romaji: "oneesan", russian: "старшая сестра (чья-то)", kanji: "お姉さん" },
  { japanese: "おとうと", romaji: "otouto", russian: "младший брат (мой)", kanji: "弟" },
  { japanese: "おとうとさん", romaji: "otoutosan", russian: "младший брат (чей-то)", kanji: "弟さん" },
  { japanese: "いもうと", romaji: "imouto", russian: "младшая сестра (моя)", kanji: "妹" },
  { japanese: "いもうとさん", romaji: "imoutosan", russian: "младшая сестра (чья-то)", kanji: "妹さん" },
  // Прочие существительные
  { japanese: "がいこく", romaji: "gaikoku", russian: "заграница", kanji: "外国" },
  { japanese: "りゅうがくせい", romaji: "ryuugakusei", russian: "иностранный студент", kanji: "留学生" },
  { japanese: "クラス", romaji: "kurasu", russian: "класс, группа" },
  // Длительность
  { japanese: "〜じかん", romaji: "~jikan", russian: "~ часов (длительность)", kanji: "〜時間" },
  { japanese: "〜しゅうかん", romaji: "~shuukan", russian: "~ недель", kanji: "〜週間" },
  { japanese: "〜かげつ", romaji: "~kagetsu", russian: "~ месяцев", kanji: "〜か月" },
  { japanese: "〜ねん", romaji: "~nen", russian: "~ лет", kanji: "〜年" },
  // Количество и степень
  { japanese: "〜ぐらい", romaji: "~gurai", russian: "приблизительно, около" },
  { japanese: "どのくらい", romaji: "dono kurai", russian: "примерно сколько (о количестве, времени)" },
  { japanese: "ぜんぶで", romaji: "zenbu de", russian: "всего, в общей сложности", kanji: "全部で" },
  { japanese: "みんな", romaji: "minna", russian: "все" },
  { japanese: "〜だけ", romaji: "~dake", russian: "только, лишь" },
  // 練習C
  { japanese: "かしこまりました", romaji: "kashikomarimashita", russian: "Слушаюсь и исполняю! (после приёма заказа)" },
  // 会話
  { japanese: "ふなびん", romaji: "funabin", russian: "корабельное сообщение, морская почта", kanji: "船便" },
  { japanese: "こうくうびん(エアメール)", romaji: "koukuubin (eameeru)", russian: "авиапочта", kanji: "航空便(エアメール)" },
  { japanese: "[〜を]おねがいします", romaji: "[~wo] onegai shimasu", russian: "Будьте любезны, [~], пожалуйста", kanji: "[〜を]お願いします" },
];

export const lesson11Grammar = [
  {
    pattern: "СУЩ が いくつ ありますか / 何人 いますか",
    patternJp: "N ga ikutsu arimasu ka / nannin imasu ka",
    meaning: "сколько (предметов/людей) есть?",
    explanation: "Вопрос о количестве предметов или людей. いくつ -- для предметов, 何人 -- для людей.",
    examples: [
      { jp: "みかんが いくつ ありますか。-- 四つ あります。", romaji: "Mikan ga ikutsu arimasu ka. -- Yottsu arimasu.", ru: "Сколько мандаринов? -- Четыре." },
      { jp: "子どもが 何人 いますか。-- 二人 います。", romaji: "Kodomo ga nannin imasu ka. -- Futari imasu.", ru: "Сколько у вас детей? -- Двое." },
    ],
  },
  {
    pattern: "Счётные суффиксы (助数詞)",
    patternJp: "josuushi",
    meaning: "счётные суффиксы для разных категорий предметов",
    explanation: "〜つ -- универсальный (до 10). 〜人 -- для людей. 〜台 -- для машин и механизмов. 〜枚 -- для плоских предметов (бумага, марки). 〜回 -- для счёта раз. Количество ставится после частицы を и перед глаголом.",
    examples: [
      { jp: "切手を 3枚 ください。", romaji: "Kitte wo sanmai kudasai.", ru: "Дайте 3 марки, пожалуйста." },
      { jp: "りんごを 二つ 買いました。", romaji: "Ringo wo futatsu kaimashita.", ru: "Купил два яблока." },
    ],
  },
  {
    pattern: "Выражение длительности: 〜時間 / 〜日 / 〜週間 / 〜か月 / 〜年",
    patternJp: "~jikan / ~nichi / ~shuukan / ~kagetsu / ~nen",
    meaning: "выражение длительности (часы, дни, недели, месяцы, годы)",
    explanation: "Длительность ставится перед глаголом. Частица に не используется.",
    examples: [
      { jp: "1時間 かかります。", romaji: "Ichijikan kakarimasu.", ru: "Уйдёт 1 час." },
      { jp: "3か月 日本語を 勉強しました。", romaji: "Sankagetsu nihongo wo benkyou shimashita.", ru: "Учил японский 3 месяца." },
    ],
  },
  {
    pattern: "СУЩ(количество) ГЛАГ",
    patternJp: "N (quantity) V",
    meaning: "количественное слово ставится перед глаголом",
    explanation: "Количество ставится непосредственно перед глаголом.",
    examples: [
      { jp: "りんごを 四つ 買いました。", romaji: "Ringo wo yottsu kaimashita.", ru: "Купил 4 яблока." },
      { jp: "外国人の 友達が 3人 います。", romaji: "Gaikokujin no tomodachi ga sannin imasu.", ru: "У меня 3 друга-иностранца." },
    ],
  },
  {
    pattern: "СУЩ だけ",
    patternJp: "N dake",
    meaning: "только N",
    explanation: "Частица「だけ」выражает ограничение.",
    examples: [
      { jp: "10分だけ 休みましょう。", romaji: "Juppun dake yasumimashoo.", ru: "Отдохнём только 10 минут." },
      { jp: "1回だけ 行きました。", romaji: "Ikkai dake ikimashita.", ru: "Ходил только один раз." },
    ],
  },
];

// ---------------------------------------------------------------------------
// LESSON 12 - Урок 12: Сравнение, прошедшее время прилагательных
// ---------------------------------------------------------------------------
export const lesson12Vocabulary = [
  // Прилагательные
  { japanese: "かんたん[な]", romaji: "kantan [na]", russian: "простой, лёгкий (для решения вопросов и т.п.)", kanji: "簡単[な]" },
  { japanese: "ちかい", romaji: "chikai", russian: "близкий", kanji: "近い" },
  { japanese: "とおい", romaji: "tooi", russian: "далёкий", kanji: "遠い" },
  { japanese: "はやい、はやい", romaji: "hayai", russian: "быстрый, ранний (о скорости и времени)", kanji: "速い、早い" },
  { japanese: "おそい", romaji: "osoi", russian: "медленный, поздний", kanji: "遅い" },
  { japanese: "おおい [ひとが〜]", romaji: "ooi [hito ga~]", russian: "много [людей]", kanji: "多い [人が〜]" },
  { japanese: "すくない [ひとが〜]", romaji: "sukunai [hito ga~]", russian: "мало [людей]", kanji: "少ない [人が〜]" },
  { japanese: "あたたかい、あたたかい", romaji: "atatakai", russian: "тёплый (погода, воздух и предметы, напр., суп)", kanji: "暖かい、温かい" },
  { japanese: "すずしい", romaji: "suzushii", russian: "прохладный (погода, воздух)", kanji: "涼しい" },
  { japanese: "あまい", romaji: "amai", russian: "сладкий", kanji: "甘い" },
  { japanese: "からい", romaji: "karai", russian: "острый (о вкусе)", kanji: "辛い" },
  { japanese: "おもい", romaji: "omoi", russian: "тяжёлый", kanji: "重い" },
  { japanese: "かるい", romaji: "karui", russian: "лёгкий", kanji: "軽い" },
  { japanese: "いい [コーヒーが〜]", romaji: "ii [koohii ga~]", russian: "выбирать, предпочитать [кофе] (при выборе одного предмета из двух или более)" },
  // Времена года
  { japanese: "きせつ", romaji: "kisetsu", russian: "время года, сезон", kanji: "季節" },
  { japanese: "はる", romaji: "haru", russian: "весна", kanji: "春" },
  { japanese: "なつ", romaji: "natsu", russian: "лето", kanji: "夏" },
  { japanese: "あき", romaji: "aki", russian: "осень", kanji: "秋" },
  { japanese: "ふゆ", romaji: "fuyu", russian: "зима", kanji: "冬" },
  // Погода
  { japanese: "てんき", romaji: "tenki", russian: "погода (конкретно на улице, а не климат)", kanji: "天気" },
  { japanese: "あめ", romaji: "ame", russian: "дождь", kanji: "雨" },
  { japanese: "ゆき", romaji: "yuki", russian: "снег", kanji: "雪" },
  { japanese: "くもり", romaji: "kumori", russian: "пасмурно", kanji: "曇り" },
  // Места
  { japanese: "ホテル", romaji: "hoteru", russian: "гостиница, отель" },
  { japanese: "くうこう", romaji: "kuukou", russian: "аэропорт", kanji: "空港" },
  { japanese: "うみ", romaji: "umi", russian: "море, океан", kanji: "海" },
  { japanese: "せかい", romaji: "sekai", russian: "мир", kanji: "世界" },
  // Мероприятия
  { japanese: "パーティー", romaji: "paatii", russian: "вечеринка (~をします: устраивать вечеринку)" },
  { japanese: "[お]まつり", romaji: "[o]matsuri", russian: "праздник, фестиваль" },
  { japanese: "しあい", romaji: "shiai", russian: "состязание, матч", kanji: "試合" },
  // Еда
  { japanese: "すきやき", romaji: "sukiyaki", russian: "сукияки (жаркое из мяса и овощей)", kanji: "すき焼き" },
  { japanese: "さしみ", romaji: "sashimi", russian: "сасими (тонко нарезанные ломтики сырой рыбы)", kanji: "刺し身" },
  { japanese: "[お]すし", romaji: "[o]sushi", russian: "суши" },
  { japanese: "てんぷら", romaji: "tenpura", russian: "темпура (морепродукты или овощи в кляре)" },
  { japanese: "ぶたにく", romaji: "butaniku", russian: "свинина", kanji: "豚肉" },
  { japanese: "とりにく", romaji: "toriniku", russian: "куриное мясо", kanji: "とり肉" },
  { japanese: "ぎゅうにく", romaji: "gyuuniku", russian: "говядина", kanji: "牛肉" },
  { japanese: "レモン", romaji: "remon", russian: "лимон" },
  // Прочее
  { japanese: "いけばな", romaji: "ikebana", russian: "икебана, аранжировка срезанных цветов (~をします: заниматься икебаной)", kanji: "生け花" },
  { japanese: "もみじ", romaji: "momiji", russian: "клён, красные осенние листья клёна" },
  // Сравнение
  { japanese: "どちら", romaji: "dochira", russian: "какой, который (вопросит. местоимение — при выборе из двух предметов)" },
  { japanese: "どちらも", romaji: "dochira mo", russian: "оба; и то, и другое" },
  { japanese: "いちばん", romaji: "ichiban", russian: "самый (для образования превосходной степени)" },
  { japanese: "ずっと", romaji: "zutto", russian: "гораздо, значительно" },
  { japanese: "はじめて", romaji: "hajimete", russian: "впервые, в первый раз", kanji: "初めて" },
  // 会話
  { japanese: "ただいま。", romaji: "tadaima.", russian: "Я вернулся." },
  { japanese: "お帰りなさい。", romaji: "okaerinasai.", russian: "С возвращением." },
  { japanese: "わあ、すごい人ですね。", romaji: "waa, sugoi hito desu ne.", russian: "Вот это да! (о большом скоплении людей)" },
  { japanese: "疲れました。", romaji: "tsukaremashita.", russian: "(Я) устал." },
];

export const lesson12Grammar = [
  {
    pattern: "Прошедшее время прилагательных",
    patternJp: "adjective past tense",
    meaning: "прошедшее время い- и な-прилагательных",
    explanation: "な-ПРИЛ: утв. ~でした, отриц. ~じゃありませんでした. い-ПРИЛ: утв. ~かったです (отсечь い + かった), отриц. ~くなかったです. Исключение: いい -> よかったです / よくなかったです.",
    examples: [
      { jp: "きのうは 暑かったです。", romaji: "Kinou wa atsukatta desu.", ru: "Вчера было жарко." },
      { jp: "その 映画は おもしろくなかったです。", romaji: "Sono eiga wa omoshirokunakatta desu.", ru: "Тот фильм не был интересным." },
      { jp: "旅行は よかったです。", romaji: "Ryokou wa yokatta desu.", ru: "Поездка была хорошей." },
    ],
  },
  {
    pattern: "СУЩ1 は СУЩ2 より ПРИЛ です",
    patternJp: "N1 wa N2 yori ADJ desu",
    meaning: "N1 более [ПРИЛ], чем N2",
    explanation: "Сравнение двух предметов.",
    examples: [
      { jp: "日本は 韓国より 大きいです。", romaji: "Nihon wa Kankoku yori ookii desu.", ru: "Япония больше Кореи." },
      { jp: "東京の 冬は モスクワの 冬より 暖かいです。", romaji: "Toukyou no fuyu wa Mosukuwa no fuyu yori atatakai desu.", ru: "Зима в Токио теплее, чем в Москве." },
    ],
  },
  {
    pattern: "СУЩ1 と СУЩ2 と どちらが ПРИЛ ですか",
    patternJp: "N1 to N2 to dochira ga ADJ desu ka",
    meaning: "какой из двух более [ПРИЛ]?",
    explanation: "Вопрос при сравнении двух предметов. Ответ: СУЩ1のほうが〜です (N1 более ~). Если равны: どちらも〜です.",
    examples: [
      { jp: "海と 山と どちらが 好きですか。-- 海の ほうが 好きです。", romaji: "Umi to yama to dochira ga suki desu ka. -- Umi no hou ga suki desu.", ru: "Море или горы -- что больше нравится? -- Больше нравится море." },
      { jp: "日本語と 英語と どちらが 難しいですか。-- 日本語の ほうが 難しいです。", romaji: "Nihongo to eigo to dochira ga muzukashii desu ka. -- Nihongo no hou ga muzukashii desu.", ru: "Японский или английский -- что сложнее? -- Японский сложнее." },
    ],
  },
  {
    pattern: "СУЩ [の中]で 何/どこ/だれ が いちばん ПРИЛ ですか",
    patternJp: "N [no naka] de nani/doko/dare ga ichiban ADJ desu ka",
    meaning: "что/где/кто самый [ПРИЛ] из [группы]?",
    explanation: "Вопрос о самом выдающемся предмете из группы (3+).",
    examples: [
      { jp: "日本料理[の中]で 何が いちばん おいしいですか。-- てんぷらが いちばん おいしいです。", romaji: "Nihon ryouri [no naka] de nani ga ichiban oishii desu ka. -- Tenpura ga ichiban oishii desu.", ru: "Что самое вкусное в японской кухне? -- Темпура." },
      { jp: "季節[の中]で いつが いちばん 好きですか。-- 春が いちばん 好きです。", romaji: "Kisetsu [no naka] de itsu ga ichiban suki desu ka. -- Haru ga ichiban suki desu.", ru: "Какое время года вам нравится больше всего? -- Весна." },
    ],
  },
];

// ---------------------------------------------------------------------------
// LESSON 13 - Урок 13: Желания (ほしい / 〜たい)
// ---------------------------------------------------------------------------
export const lesson13Vocabulary = [
  // Глаголы (в порядке учебника)
  { japanese: "あそびます", romaji: "asobimasu", russian: "развлекаться, играть", type: "гл. I", kanji: "遊びます" },
  { japanese: "およぎます", romaji: "oyogimasu", russian: "плавать", type: "гл. I", kanji: "泳ぎます" },
  { japanese: "むかえます", romaji: "mukaemasu", russian: "встречать, принимать", type: "гл. II", kanji: "迎えます" },
  { japanese: "つかれます", romaji: "tsukaremasu", russian: "уставать (наступившая усталость: つかれました)", type: "гл. II", kanji: "疲れます" },
  { japanese: "けっこんします", romaji: "kekkon shimasu", russian: "жениться, выходить замуж", type: "гл. III", kanji: "結婚します" },
  { japanese: "かいものします", romaji: "kaimono shimasu", russian: "делать покупки", type: "гл. III", kanji: "買い物します" },
  { japanese: "しょくじします", romaji: "shokuji shimasu", russian: "есть, принимать пищу", type: "гл. III", kanji: "食事します" },
  { japanese: "さんぽします [こうえんを〜]", romaji: "sanpo shimasu [kouen wo~]", russian: "прогуляться, гулять [в парке]", type: "гл. III", kanji: "散歩します [公園を〜]" },
  // Прилагательные
  { japanese: "たいへん[な]", romaji: "taihen [na]", russian: "трудный, тяжёлый, ужасный", kanji: "大変[な]" },
  { japanese: "ほしい", romaji: "hoshii", russian: "желаемый, хотеть (что-либо)" },
  { japanese: "ひろい", romaji: "hiroi", russian: "широкий", kanji: "広い" },
  { japanese: "せまい", romaji: "semai", russian: "узкий, тесный (о комнате, дороге и т.п.)", kanji: "狭い" },
  // Существительные
  { japanese: "プール", romaji: "puuru", russian: "бассейн" },
  { japanese: "かわ", romaji: "kawa", russian: "река", kanji: "川" },
  { japanese: "びじゅつ", romaji: "bijutsu", russian: "изобразительное искусство", kanji: "美術" },
  { japanese: "つり", romaji: "tsuri", russian: "рыбалка (~をします: ловить рыбу, рыбачить)", kanji: "釣り" },
  { japanese: "スキー", romaji: "sukii", russian: "лыжи, лыжный спорт (~をします: кататься на лыжах)" },
  { japanese: "しゅうまつ", romaji: "shuumatsu", russian: "конец недели, выходные", kanji: "週末" },
  { japanese: "[お]しょうがつ", romaji: "[o]shougatsu", russian: "Новый год", kanji: "[お]正月" },
  // Прочее
  { japanese: "〜ごろ", romaji: "~goro", russian: "примерно, около (о времени)" },
  { japanese: "なにか", romaji: "nanika", russian: "что-то, что-нибудь", kanji: "何か" },
  { japanese: "どこか", romaji: "dokoka", russian: "где-то, где-нибудь" },
  // 練習C
  { japanese: "のどが かわきます", romaji: "nodo ga kawakimasu", russian: "испытывать жажду, хотеть пить (о жажде: のどが かわきました)", type: "гл. I" },
  { japanese: "おなかが すきます", romaji: "onaka ga sukimasu", russian: "быть голодным, хотеть есть (о голоде: おなかが すきました)", type: "гл. I" },
  { japanese: "そうしましょう。", romaji: "sou shimashou.", russian: "Давайте так и сделаем. (согласие с предложением)" },
  // 会話
  { japanese: "ごちゅうもんは?", romaji: "go-chuumon wa?", russian: "Что будете заказывать?", kanji: "ご注文は?" },
  { japanese: "ていしょく", romaji: "teishoku", russian: "комплексный обед", kanji: "定食" },
  { japanese: "ぎゅうどん", romaji: "gyuudon", russian: "гюдон (рис с говядиной)", kanji: "牛どん" },
  { japanese: "[少々]お待ちください。", romaji: "[shoushou] omachi kudasai.", russian: "Пожалуйста, [немного] подождите." },
  { japanese: "〜でございます。", romaji: "~de gozaimasu.", russian: "является ~ (вежл. эквивалент связки です)" },
  { japanese: "べつべつに", romaji: "betsubetsu ni", russian: "отдельно", kanji: "別々に" },
];

export const lesson13Grammar = [
  {
    pattern: "СУЩ が ほしいです",
    patternJp: "N ga hoshii desu",
    meaning: "хочу N (вещь, предмет)",
    explanation: "Выражение желания иметь какой-либо предмет. Объект оформляется частицей「が」. Отрицание: ほしくないです. Примечание: не используется для описания желаний 3-го лица.",
    examples: [
      { jp: "新しい 車が ほしいです。", romaji: "Atarashii kuruma ga hoshii desu.", ru: "Хочу новую машину." },
      { jp: "何が ほしいですか。-- 時計が ほしいです。", romaji: "Nani ga hoshii desu ka. -- Tokei ga hoshii desu.", ru: "Что хотите? -- Хочу часы." },
    ],
  },
  {
    pattern: "ГЛАГ(основа-ます) たいです",
    patternJp: "V (masu-stem) tai desu",
    meaning: "хочу делать (действие)",
    explanation: "Желание совершить действие. Отсечь ます и добавить たいです. Объект может оформляться が или を. Отрицание: たくないです. Примечание: не используется для 3-го лица.",
    examples: [
      { jp: "沖縄へ 行きたいです。", romaji: "Okinawa e ikitai desu.", ru: "Хочу поехать на Окинаву." },
      { jp: "何を 食べたいですか。-- 寿司を 食べたいです。", romaji: "Nani wo tabetai desu ka. -- Sushi wo tabetai desu.", ru: "Что хотите съесть? -- Хочу суши." },
    ],
  },
  {
    pattern: "СУЩ(место) へ ГЛАГ(основа-ます) に 行きます／来ます／帰ります",
    patternJp: "N (basho) e V (masu-stem) ni ikimasu / kimasu / kaerimasu",
    meaning: "идти/приходить/возвращаться куда-то с целью делать что-то",
    explanation: "Цель поездки выражается основой глагола + に.",
    examples: [
      { jp: "神戸へ ステーキを 食べに 行きます。", romaji: "Koube e suteeki wo tabe ni ikimasu.", ru: "Поеду в Кобе есть стейк." },
      { jp: "デパートへ 買い物に 行きます。", romaji: "Depaato e kaimono ni ikimasu.", ru: "Пойду в универмаг за покупками." },
      { jp: "日本へ 美術を 勉強しに 来ました。", romaji: "Nihon e bijutsu wo benkyou shi ni kimashita.", ru: "Приехал в Японию изучать искусство." },
    ],
  },
  {
    pattern: "何か / どこか",
    patternJp: "nanika / dokoka",
    meaning: "что-нибудь / где-нибудь, куда-нибудь",
    explanation: "Неопределённые местоимения. Частица を/へ после них обычно опускается.",
    examples: [
      { jp: "何か 食べませんか。", romaji: "Nanika tabemasen ka.", ru: "Не хотите что-нибудь поесть?" },
      { jp: "どこか 行きたいですか。", romaji: "Dokoka ikitai desu ka.", ru: "Хотите куда-нибудь пойти?" },
      { jp: "のどが 渇きましたから、何か 飲みたいです。", romaji: "Nodo ga kawakimashita kara, nanika nomitai desu.", ru: "Хочу пить, хочу что-нибудь выпить." },
    ],
  },
];

// ---------------------------------------------------------------------------
// LESSON 14 - Урок 14: て-форма глаголов
// ---------------------------------------------------------------------------
export const lesson14Vocabulary = [
  // Verbs (порядок по учебнику)
  { japanese: "つけます", romaji: "tsukemasu", russian: "включать (свет, кондиционер)", type: "гл. II" },
  { japanese: "けします", romaji: "keshimasu", russian: "выключать; стирать", type: "гл. I", kanji: "消します" },
  { japanese: "あけます", romaji: "akemasu", russian: "открывать", type: "гл. II", kanji: "開けます" },
  { japanese: "しめます", romaji: "shimemasu", russian: "закрывать", type: "гл. II", kanji: "閉めます" },
  { japanese: "いそぎます", romaji: "isogimasu", russian: "спешить, торопиться", type: "гл. I", kanji: "急ぎます" },
  { japanese: "まちます", romaji: "machimasu", russian: "ждать", type: "гл. I", kanji: "待ちます" },
  { japanese: "もちます", romaji: "mochimasu", russian: "держать, нести", type: "гл. I", kanji: "持ちます" },
  { japanese: "とります", romaji: "torimasu", russian: "брать, передавать [соль]", type: "гл. I", kanji: "取ります" },
  { japanese: "てつだいます", romaji: "tetsudaimasu", russian: "помогать", type: "гл. I", kanji: "手伝います" },
  { japanese: "よびます", romaji: "yobimasu", russian: "звать, вызывать", type: "гл. I", kanji: "呼びます" },
  { japanese: "はなします", romaji: "hanashimasu", russian: "говорить, разговаривать", type: "гл. I", kanji: "話します" },
  { japanese: "つかいます", romaji: "tsukaimasu", russian: "использовать, пользоваться", type: "гл. I", kanji: "使います" },
  { japanese: "とめます", romaji: "tomemasu", russian: "останавливать; парковать", type: "гл. II", kanji: "止めます" },
  { japanese: "みせます", romaji: "misemasu", russian: "показывать", type: "гл. II", kanji: "見せます" },
  { japanese: "おしえます", romaji: "oshiemasu", russian: "учить; сообщать [адрес, номер телефона]", type: "гл. II", kanji: "教えます" },
  { japanese: "すわります", romaji: "suwarimasu", russian: "садиться", type: "гл. I", kanji: "座ります" },
  { japanese: "たちます", romaji: "tachimasu", russian: "вставать, стоять", type: "гл. I", kanji: "立ちます" },
  { japanese: "はいります", romaji: "hairimasu", russian: "входить [в кафе]", type: "гл. I", kanji: "入ります" },
  { japanese: "でます", romaji: "demasu", russian: "выходить [из кафе]", type: "гл. II", kanji: "出ます" },
  { japanese: "ふります [あめが〜]", romaji: "furimasu [ame ga ~]", russian: "идти [о дожде, снеге]", type: "гл. I", kanji: "降ります [雨が〜]" },
  { japanese: "コピーします", romaji: "kopii shimasu", russian: "копировать, снимать копию", type: "гл. III" },
  // Nouns
  { japanese: "でんき", romaji: "denki", russian: "электричество, свет", kanji: "電気" },
  { japanese: "エアコン", romaji: "eakon", russian: "кондиционер" },
  { japanese: "パスポート", romaji: "pasupooto", russian: "паспорт" },
  { japanese: "なまえ", romaji: "namae", russian: "имя", kanji: "名前" },
  { japanese: "じゅうしょ", romaji: "juusho", russian: "адрес", kanji: "住所" },
  { japanese: "ちず", romaji: "chizu", russian: "карта, план", kanji: "地図" },
  { japanese: "しお", romaji: "shio", russian: "соль", kanji: "塩" },
  { japanese: "さとう", romaji: "satou", russian: "сахар", kanji: "砂糖" },
  { japanese: "もんだい", romaji: "mondai", russian: "вопрос, проблема, задача", kanji: "問題" },
  { japanese: "こたえ", romaji: "kotae", russian: "ответ", kanji: "答え" },
  { japanese: "よみかた", romaji: "yomikata", russian: "способ чтения; как читается", kanji: "読み方" },
  { japanese: "〜かた", romaji: "~kata", russian: "способ ~; как делать ~", kanji: "〜方" },
  // Adverbs
  { japanese: "まっすぐ", romaji: "massugu", russian: "прямо" },
  { japanese: "ゆっくり", romaji: "yukkuri", russian: "медленно, не спеша" },
  { japanese: "すぐ", romaji: "sugu", russian: "сразу, немедленно" },
  { japanese: "また", romaji: "mata", russian: "снова, ещё раз" },
  { japanese: "あとで", romaji: "ato de", russian: "потом, позже" },
  { japanese: "もうすこし", romaji: "mou sukoshi", russian: "ещё немного", kanji: "もう少し" },
  { japanese: "もう〜", romaji: "mou ~", russian: "уже ~; ещё ~ (с числительным)" },
  // 練習C
  { japanese: "さあ", romaji: "saa", russian: "ну что ж; ну-ка; давай" },
  { japanese: "あれ?", romaji: "are?", russian: "а?; что?; странно (удивление)" },
  // 会話
  { japanese: "信号を右へ曲がってください。", romaji: "shingou wo migi e magatte kudasai.", russian: "Поверните направо на светофоре." },
  { japanese: "これでお願いします。", romaji: "kore de onegai shimasu.", russian: "На вот это, пожалуйста. (при оплате)" },
  { japanese: "おつり", romaji: "otsuri", russian: "сдача (с денег)", kanji: "お釣り" },
];

export const lesson14Grammar = [
  {
    pattern: "て-форма глаголов (образование)",
    patternJp: "V te-form (formation)",
    meaning: "как образовать て-форму глаголов",
    explanation: "Группа I:\n〜きます → 〜いて　　〜ぎます → 〜いで\n〜みます/びます/にます → 〜んで\n〜ります/ちます/います → 〜って\n〜します → 〜して\n⚠ Исключение: 行きます → 行って\n\nГруппа II: 〜ます → 〜て\n\nГруппа III: します → して、来ます → 来て（きて）",
    examples: [
      { jp: "書きます → 書いて", romaji: "kakimasu -> kaite", ru: "писать (те-форма)" },
      { jp: "読みます → 読んで", romaji: "yomimasu -> yonde", ru: "читать (те-форма)" },
      { jp: "食べます → 食べて", romaji: "tabemasu -> tabete", ru: "есть (те-форма)" },
      { jp: "行きます → 行って", romaji: "ikimasu -> itte", ru: "идти (те-форма, исключение)" },
    ],
  },
  {
    pattern: "ГЛАГ(て-форма) ください",
    patternJp: "V-te kudasai",
    meaning: "пожалуйста, сделайте (вежливая просьба)",
    explanation: "Вежливая форма просьбы.",
    examples: [
      { jp: "すみません、塩を 取ってください。", romaji: "Sumimasen, shio wo totte kudasai.", ru: "Передайте, пожалуйста, соль." },
      { jp: "この 漢字の 読み方を 教えてください。", romaji: "Kono kanji no yomikata wo oshiete kudasai.", ru: "Скажите, как читается этот кандзи." },
      { jp: "ここに 住所と 名前を 書いてください。", romaji: "Koko ni juusho to namae wo kaite kudasai.", ru: "Напишите здесь адрес и имя." },
    ],
  },
  {
    pattern: "ГЛАГ(て-форма) います",
    patternJp: "V-te imasu",
    meaning: "действие в процессе (длящееся действие)",
    explanation: "Выражает действие, которое происходит в данный момент.",
    examples: [
      { jp: "ミラーさんは 今 電話を かけています。", romaji: "Miraa-san wa ima denwa wo kakete imasu.", ru: "Г-н Миллер сейчас звонит по телефону." },
      { jp: "今 雨が 降っています。", romaji: "Ima ame ga futte imasu.", ru: "Сейчас идёт дождь." },
      { jp: "今 何を していますか。-- 本を 読んでいます。", romaji: "Ima nani wo shite imasu ka. -- Hon wo yonde imasu.", ru: "Что делаете? -- Читаю книгу." },
    ],
  },
  {
    pattern: "ГЛАГ(ます-основа) ましょうか",
    patternJp: "V-mashou ka",
    meaning: "давайте я сделаю...? (предложение помощи)",
    explanation: "Предложение своей помощи собеседнику.",
    examples: [
      { jp: "荷物を 持ちましょうか。", romaji: "Nimotsu wo mochimashoo ka.", ru: "Давайте я понесу багаж?" },
      { jp: "タクシーを 呼びましょうか。", romaji: "Takushii wo yobimashoo ka.", ru: "Вызвать такси?" },
      { jp: "窓を 開けましょうか。-- ええ、お願いします。", romaji: "Mado wo akemashoo ka. -- Ee, onegai shimasu.", ru: "Открыть окно? -- Да, пожалуйста." },
    ],
  },
  {
    pattern: "СУЩ1(место) を ГЛАГ(движение) / ГЛАГ1 て ГЛАГ2",
    patternJp: "N wo V (movement) / V1-te V2",
    meaning: "маршрут движения / последовательность действий",
    explanation: "1) Частица を обозначает маршрут или место прохождения. 2) Соединение действий через て-форму.",
    examples: [
      { jp: "この 道を まっすぐ 行ってください。", romaji: "Kono michi wo massugu itte kudasai.", ru: "Идите прямо по этой дороге." },
      { jp: "次の 交差点を 右へ 曲がってください。", romaji: "Tsugi no kousaten wo migi e magatte kudasai.", ru: "На следующем перекрёстке поверните направо." },
      { jp: "まっすぐ 行って、信号を 左へ 曲がってください。", romaji: "Massugu itte, shingou wo hidari e magatte kudasai.", ru: "Идите прямо, на светофоре поверните налево." },
    ],
  },
];

// ---------------------------------------------------------------------------
// LESSON 15 - Урок 15: Разрешение, запрет, состояния (〜てもいい / 〜てはいけません / 〜ています)
// ---------------------------------------------------------------------------
export const lesson15Vocabulary = [
  // Verbs
  { japanese: "おきます", romaji: "okimasu", russian: "класть, ставить", type: "гл. I", kanji: "置きます" },
  { japanese: "つくります／つくります", romaji: "tsukurimasu", russian: "делать, производить; создавать; строить; готовить", type: "гл. I", kanji: "作ります／造ります" },
  { japanese: "うります", romaji: "urimasu", russian: "продавать", type: "гл. I", kanji: "売ります" },
  { japanese: "しります", romaji: "shirimasu", russian: "узнавать (в момент получения информации)", type: "гл. I", kanji: "知ります" },
  { japanese: "すみます", romaji: "sumimasu", russian: "жить, селиться", type: "гл. I", kanji: "住みます" },
  { japanese: "けんきゅうします", romaji: "kenkyuu shimasu", russian: "изучать, исследовать", type: "гл. III", kanji: "研究します" },
  // State expressions (〜ています)
  { japanese: "しっています", romaji: "shitte imasu", russian: "знать (состояние)", kanji: "知っています" },
  { japanese: "すんでいます", romaji: "sunde imasu", russian: "жить, проживать (состояние)", kanji: "住んでいます" },
  // Nouns
  { japanese: "しりょう", romaji: "shiryou", russian: "материалы, данные", kanji: "資料" },
  { japanese: "カタログ", romaji: "katarogu", russian: "каталог" },
  { japanese: "じこくひょう", romaji: "jikokuhyou", russian: "расписание (поездов)", kanji: "時刻表" },
  { japanese: "ふく", romaji: "fuku", russian: "одежда", kanji: "服" },
  { japanese: "せいひん", romaji: "seihin", russian: "изделие, продукт, товар", kanji: "製品" },
  { japanese: "ソフト", romaji: "sofuto", russian: "программное обеспечение" },
  { japanese: "でんしじしょ", romaji: "denshi jisho", russian: "электронный словарь", kanji: "電子辞書" },
  { japanese: "けいざい", romaji: "keizai", russian: "экономика", kanji: "経済" },
  { japanese: "しやくしょ", romaji: "shiyakusho", russian: "мэрия, городская администрация", kanji: "市役所" },
  { japanese: "こうこう", romaji: "koukou", russian: "старшая школа", kanji: "高校" },
  { japanese: "はいしゃ", romaji: "haisha", russian: "зубной врач, стоматолог", kanji: "歯医者" },
  { japanese: "どくしん", romaji: "dokushin", russian: "холостой, незамужняя", kanji: "独身" },
  // Expressions
  { japanese: "すみません", romaji: "sumimasen", russian: "Извините. (мягкий отказ, извинение)" },
  // 練習C
  { japanese: "みなさん", romaji: "mina-san", russian: "все, дамы и господа (обращение к группе)", kanji: "皆さん" },
  // 会話
  { japanese: "おもいだします", romaji: "omoidashimasu", russian: "вспоминать, вспомнить", type: "гл. I", kanji: "思い出します" },
  { japanese: "いらっしゃいます", romaji: "irasshaimasu", russian: "быть (вежл. эквивалент います)", type: "гл. I" },
];

export const lesson15Grammar = [
  {
    pattern: "ГЛАГ(て-форма) も いいです",
    patternJp: "V-te mo ii desu",
    meaning: "можно сделать / разрешается",
    explanation: "Выражение разрешения. Вопрос: 〜てもいいですか. Ответ: はい、いいですよ (Да, пожалуйста).",
    examples: [
      { jp: "写真を 撮っても いいですか。-- はい、いいですよ。", romaji: "Shashin wo totte mo ii desu ka. -- Hai, ii desu yo.", ru: "Можно сфотографировать? -- Да, пожалуйста." },
      { jp: "ここで 食べても いいですか。-- はい、いいですよ。", romaji: "Koko de tabete mo ii desu ka. -- Hai, ii desu yo.", ru: "Можно здесь поесть? -- Да, пожалуйста." },
    ],
  },
  {
    pattern: "ГЛАГ(て-форма) は いけません",
    patternJp: "V-te wa ikemasen",
    meaning: "нельзя делать / запрещается",
    explanation: "Выражение запрета. Используется для отрицательного ответа на вопрос 〜てもいいですか.",
    examples: [
      { jp: "ここで たばこを 吸っても いいですか。-- いいえ、吸っては いけません。", romaji: "Koko de tabako wo sutte mo ii desu ka. -- Iie, sutte wa ikemasen.", ru: "Можно здесь курить? -- Нет, нельзя." },
      { jp: "ここに 車を 止めては いけません。", romaji: "Koko ni kuruma wo tomete wa ikemasen.", ru: "Здесь нельзя парковаться." },
    ],
  },
  {
    pattern: "ГЛАГ(て-форма) います (состояние)",
    patternJp: "V-te imasu (state)",
    meaning: "описание состояния (результат завершённого действия)",
    explanation: "В уроке 14「〜ています」выражало действие в процессе. Здесь оно описывает состояние как результат действия.",
    examples: [
      { jp: "私は 結婚しています。", romaji: "Watashi wa kekkon shite imasu.", ru: "Я женат/замужем." },
      { jp: "ミラーさんを 知っていますか。-- はい、知っています。", romaji: "Miraa-san wo shitte imasu ka. -- Hai, shitte imasu.", ru: "Вы знаете г-на Миллера? -- Да, знаю." },
      { jp: "私は 大阪に 住んでいます。", romaji: "Watashi wa Oosaka ni sunde imasu.", ru: "Я живу в Осаке." },
    ],
  },
  {
    pattern: "知りません vs 知っています",
    patternJp: "shirimasen vs shitte imasu",
    meaning: "не знаю vs знаю",
    explanation: "Утвердительная форма: 知っています (знаю -- состояние). Отрицательная форма: 知りません (не знаю -- НЕ 知っていません).",
    examples: [
      { jp: "マリアさんの 電話番号を 知っていますか。-- いいえ、知りません。", romaji: "Maria-san no denwa bangou wo shitte imasu ka. -- Iie, shirimasen.", ru: "Вы знаете номер телефона Марии? -- Нет, не знаю." },
      { jp: "あの レストランを 知っていますか。-- はい、知っています。", romaji: "Ano resutoran wo shitte imasu ka. -- Hai, shitte imasu.", ru: "Вы знаете тот ресторан? -- Да, знаю." },
    ],
  },
];

// ---------------------------------------------------------------------------
// Combined exports
// ---------------------------------------------------------------------------
export const allLessons11to15 = {
  11: { vocabulary: lesson11Vocabulary, grammar: lesson11Grammar },
  12: { vocabulary: lesson12Vocabulary, grammar: lesson12Grammar },
  13: { vocabulary: lesson13Vocabulary, grammar: lesson13Grammar },
  14: { vocabulary: lesson14Vocabulary, grammar: lesson14Grammar },
  15: { vocabulary: lesson15Vocabulary, grammar: lesson15Grammar },
};
