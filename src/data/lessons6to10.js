// =============================================================================
// Minna no Nihongo Lessons 6-10: Vocabulary & Grammar
// Extracted from: Минна но Нихонго (РУССКИЙ).pdf
// =============================================================================

// ---------------------------------------------------------------------------
// LESSON 6 - Урок 6
// ---------------------------------------------------------------------------
export const lesson6Vocabulary = [
  // Verbs (глаголы)
  { japanese: "たべます", romaji: "tabemasu", russian: "есть", type: "гл. II", kanji: "食べます" },
  { japanese: "のみます", romaji: "nomimasu", russian: "пить, глотать", type: "гл. I", kanji: "飲みます" },
  { japanese: "すいます", romaji: "suimasu", russian: "курить [сигареты, табак]", type: "гл. I", kanji: "吸います" },
  { japanese: "みます", romaji: "mimasu", russian: "смотреть, видеть", type: "гл. II", kanji: "見ます" },
  { japanese: "ききます", romaji: "kikimasu", russian: "слушать, слышать", type: "гл. I", kanji: "聞きます" },
  { japanese: "よみます", romaji: "yomimasu", russian: "читать, произносить", type: "гл. I", kanji: "読みます" },
  { japanese: "かきます", romaji: "kakimasu", russian: "писать (письмо), рисовать (картину)", type: "гл. I", kanji: "書きます" },
  { japanese: "かいます", romaji: "kaimasu", russian: "покупать", type: "гл. I", kanji: "買います" },
  { japanese: "とります", romaji: "torimasu", russian: "снимать [фотографию]", type: "гл. I", kanji: "撮ります" },
  { japanese: "します", romaji: "shimasu", russian: "делать", type: "гл. III" },
  { japanese: "あいます", romaji: "aimasu", russian: "встречать [друга]", type: "гл. I", kanji: "会います" },
  // Food (еда)
  { japanese: "ごはん", romaji: "gohan", russian: "еда, варёный рис" },
  { japanese: "あさごはん", romaji: "asagohan", russian: "завтрак", kanji: "朝ごはん" },
  { japanese: "ひるごはん", romaji: "hirugohan", russian: "обед", kanji: "昼ごはん" },
  { japanese: "ばんごはん", romaji: "bangohan", russian: "ужин", kanji: "晩ごはん" },
  { japanese: "パン", romaji: "pan", russian: "хлеб" },
  { japanese: "たまご", romaji: "tamago", russian: "яйцо", kanji: "卵" },
  { japanese: "にく", romaji: "niku", russian: "мясо", kanji: "肉" },
  { japanese: "さかな", romaji: "sakana", russian: "рыба", kanji: "魚" },
  { japanese: "やさい", romaji: "yasai", russian: "овощи", kanji: "野菜" },
  { japanese: "くだもの", romaji: "kudamono", russian: "фрукты", kanji: "果物" },
  // Drinks (напитки)
  { japanese: "みず", romaji: "mizu", russian: "вода", kanji: "水" },
  { japanese: "おちゃ", romaji: "ocha", russian: "чай, зелёный чай (японский чай)", kanji: "お茶" },
  { japanese: "こうちゃ", romaji: "koucha", russian: "чёрный чай (английский чай)", kanji: "紅茶" },
  { japanese: "ぎゅうにゅう", romaji: "gyuunyuu", russian: "молоко", kanji: "牛乳" },
  { japanese: "ジュース", romaji: "juusu", russian: "сок, безалкогольные напитки" },
  { japanese: "ビール", romaji: "biiru", russian: "пиво" },
  { japanese: "[お]さけ", romaji: "[o]sake", russian: "спиртное, японское рисовое вино", kanji: "[お]酒" },
  { japanese: "たばこ", romaji: "tabako", russian: "табак, сигареты" },
  // Written/media items
  { japanese: "てがみ", romaji: "tegami", russian: "письмо", kanji: "手紙" },
  { japanese: "レポート", romaji: "repooto", russian: "доклад" },
  { japanese: "しゃしん", romaji: "shashin", russian: "фотография", kanji: "写真" },
  { japanese: "ビデオ", romaji: "bideo", russian: "видео" },
  // Places and things
  { japanese: "みせ", romaji: "mise", russian: "магазин, мастерская", kanji: "店" },
  { japanese: "にわ", romaji: "niwa", russian: "сад", kanji: "庭" },
  { japanese: "しゅくだい", romaji: "shukudai", russian: "домашнее задание", kanji: "宿題" },
  // Sports & activities
  { japanese: "テニス", romaji: "tenisu", russian: "теннис" },
  { japanese: "サッカー", romaji: "sakkaa", russian: "футбол" },
  { japanese: "[お]はなみ", romaji: "[o]hanami", russian: "любование цветением сакуры", kanji: "[お]花見" },
  // Question word
  { japanese: "なに", romaji: "nani", russian: "что (вопросительное местоимение)", kanji: "何" },
  // Adverbs
  { japanese: "いっしょに", romaji: "isshoni", russian: "вместе" },
  { japanese: "ちょっと", romaji: "chotto", russian: "немного" },
  { japanese: "いつも", romaji: "itsumo", russian: "всегда" },
  { japanese: "ときどき", romaji: "tokidoki", russian: "иногда", kanji: "時々" },
  { japanese: "それから", romaji: "sorekara", russian: "после, далее, затем" },
  { japanese: "ええ", romaji: "ee", russian: "да" },
  // Expressions
  { japanese: "いいですね。", romaji: "ii desu ne.", russian: "Хорошо! С удовольствием! Замечательно!" },
  { japanese: "わかりました。", romaji: "wakarimashita.", russian: "Понятно." },
  // Dialogue
  { japanese: "何ですか。", romaji: "nan desu ka.", russian: "Да? Что?" },
  { japanese: "じゃ、また[あした]。", romaji: "ja, mata [ashita].", russian: "Пока, [до завтра]." },
];

export const lesson6Grammar = [
  {
    pattern: "СУЩ を ГЛАГ (переходный)",
    patternJp: "N wo V (transitive)",
    meaning: "прямое дополнение при переходном глаголе",
    explanation: "Частица「を」обозначает прямое дополнение при переходном глаголе.",
    examples: [
      { jp: "ジュースを 飲みます。", romaji: "Juusu wo nomimasu.", ru: "Я пью сок." },
      { jp: "本を 読みます。", romaji: "Hon wo yomimasu.", ru: "Я читаю книгу." },
    ],
  },
  {
    pattern: "СУЩ を します",
    patternJp: "N wo shimasu",
    meaning: "делать что-то (спорт, мероприятия, работу)",
    explanation: "Глагол「します」присоединяется к существительным для обозначения действий: спорт, мероприятия, домашние задания и т.д.",
    examples: [
      { jp: "サッカーを します。", romaji: "Sakkaa wo shimasu.", ru: "Играю в футбол." },
      { jp: "宿題を します。", romaji: "Shukudai wo shimasu.", ru: "Делаю домашнее задание." },
      { jp: "電話を します。", romaji: "Denwa wo shimasu.", ru: "Звоню по телефону." },
    ],
  },
  {
    pattern: "何を しますか",
    patternJp: "nani wo shimasu ka",
    meaning: "что делаете / что делали?",
    explanation: "Вопрос о содержании планируемого или выполненного действия.",
    examples: [
      { jp: "月曜日 何を しますか。", romaji: "Getsuyoubi nani wo shimasu ka.", ru: "Что вы делаете в понедельник?" },
      { jp: "きのう 何を しましたか。-- テニスを しました。", romaji: "Kinou nani wo shimashita ka. -- Tenisu wo shimashita.", ru: "Что вы делали вчера? -- Играл в теннис." },
    ],
  },
  {
    pattern: "なん и なに",
    patternJp: "nan / nani",
    meaning: "что (два варианта чтения)",
    explanation: "「なん」используется перед строками た, だ, な.「なに」-- в остальных случаях.",
    examples: [
      { jp: "それは 何ですか。", romaji: "Sore wa nan desu ka.", ru: "Что это? (なん перед で)" },
      { jp: "何を 買いますか。", romaji: "Nani wo kaimasu ka.", ru: "Что покупаете? (なに перед を)" },
    ],
  },
  {
    pattern: "СУЩ(место) で ГЛАГ",
    patternJp: "N (place) de V",
    meaning: "место действия",
    explanation: "Частица「で」указывает на место, где происходит действие.",
    examples: [
      { jp: "駅で 新聞を 買います。", romaji: "Eki de shinbun wo kaimasu.", ru: "Покупаю газету на станции." },
      { jp: "図書館で 勉強します。", romaji: "Toshokan de benkyou shimasu.", ru: "Занимаюсь в библиотеке." },
    ],
  },
  {
    pattern: "ГЛАГ ませんか",
    patternJp: "V masen ka",
    meaning: "приглашение к действию (вежливое)",
    explanation: "Выражение приглашения к действию. Звучит с уважением к намерениям собеседника.",
    examples: [
      { jp: "いっしょに 京都へ 行きませんか。", romaji: "Isshoni Kyouto e ikimasen ka.", ru: "Не поедете ли с нами в Киото?" },
      { jp: "いっしょに コーヒーを 飲みませんか。", romaji: "Isshoni koohii wo nomimasen ka.", ru: "Не хотите ли вместе выпить кофе?" },
    ],
  },
  {
    pattern: "ГЛАГ ましょう",
    patternJp: "V mashou",
    meaning: "давайте сделаем / настоятельное предложение",
    explanation: "Выражение настоятельного предложения или приглашения. Также используется как положительный ответ на приглашение.",
    examples: [
      { jp: "ちょっと 休みましょう。", romaji: "Chotto yasumimashoo.", ru: "Давайте немного отдохнём." },
      { jp: "いっしょに 食べましょう。", romaji: "Isshoni tabemashoo.", ru: "Давайте поедим вместе." },
    ],
  },
  {
    pattern: "〜か",
    patternJp: "~ka",
    meaning: "получение новой информации",
    explanation: "「〜か」в конце предложения выражает, что говорящий получил новую информацию.",
    examples: [
      { jp: "日曜日 京都へ 行きました。-- 京都ですか。いいですね。", romaji: "Nichiyoubi Kyouto e ikimashita. -- Kyouto desu ka. Ii desu ne.", ru: "В воскресенье ездил в Киото. -- В Киото? Замечательно!" },
    ],
  },
];

// ---------------------------------------------------------------------------
// LESSON 7 - Урок 7
// ---------------------------------------------------------------------------
export const lesson7Vocabulary = [
  // Verbs (глаголы)
  { japanese: "きります", romaji: "kirimasu", russian: "резать, нарезать", type: "гл. I", kanji: "切ります" },
  { japanese: "おくります", romaji: "okurimasu", russian: "посылать, отправлять (факс, посылку, груз)", type: "гл. I", kanji: "送ります" },
  { japanese: "あげます", romaji: "agemasu", russian: "давать, преподносить, отдавать, дарить", type: "гл. II" },
  { japanese: "もらいます", romaji: "moraimasu", russian: "получать", type: "гл. I" },
  { japanese: "かします", romaji: "kashimasu", russian: "давать в долг, на прокат", type: "гл. I", kanji: "貸します" },
  { japanese: "かります", romaji: "karimasu", russian: "брать в долг, на прокат, в лизинг", type: "гл. II", kanji: "借ります" },
  { japanese: "おしえます", romaji: "oshiemasu", russian: "преподавать, обучать", type: "гл. II", kanji: "教えます" },
  { japanese: "ならいます", romaji: "naraimasu", russian: "изучать", type: "гл. I", kanji: "習います" },
  { japanese: "かけます", romaji: "kakemasu", russian: "звонить [по телефону]", type: "гл. II" },
  // Body parts & utensils
  { japanese: "て", romaji: "te", russian: "рука, кисть", kanji: "手" },
  { japanese: "はし", romaji: "hashi", russian: "палочки для еды" },
  { japanese: "スプーン", romaji: "supuun", russian: "ложка" },
  { japanese: "ナイフ", romaji: "naifu", russian: "нож" },
  { japanese: "フォーク", romaji: "fooku", russian: "вилка" },
  { japanese: "はさみ", romaji: "hasami", russian: "ножницы" },
  // Electronics
  { japanese: "パソコン", romaji: "pasokon", russian: "персональный компьютер" },
  { japanese: "ケータイ", romaji: "keetai", russian: "мобильный телефон" },
  // Communication
  { japanese: "メール", romaji: "meeru", russian: "электронное письмо (мейл)" },
  { japanese: "ねんがじょう", romaji: "nengajou", russian: "новогодняя открытка", kanji: "年賀状" },
  // Office supplies
  { japanese: "パンチ", romaji: "panchi", russian: "дырокол" },
  { japanese: "ホッチキス", romaji: "hotchikisu", russian: "скоросшиватель (стаплер)" },
  { japanese: "セロテープ", romaji: "seroteepu", russian: "клейкая лента, скотч" },
  { japanese: "けしゴム", romaji: "keshigomu", russian: "ластик, резинка", kanji: "消しゴム" },
  { japanese: "かみ", romaji: "kami", russian: "бумага", kanji: "紙" },
  // Things
  { japanese: "はな", romaji: "hana", russian: "цветок, цветы", kanji: "花" },
  { japanese: "シャツ", romaji: "shatsu", russian: "рубашка" },
  { japanese: "プレゼント", romaji: "purezento", russian: "подарок" },
  { japanese: "にもつ", romaji: "nimotsu", russian: "багаж, груз, посылка", kanji: "荷物" },
  { japanese: "おかね", romaji: "okane", russian: "деньги", kanji: "お金" },
  { japanese: "きっぷ", romaji: "kippu", russian: "билет (на транспорт)", kanji: "切符" },
  // Holidays
  { japanese: "クリスマス", romaji: "kurisumasu", russian: "Рождество" },
  // Family
  { japanese: "ちち", romaji: "chichi", russian: "(мой) отец", kanji: "父" },
  { japanese: "はは", romaji: "haha", russian: "(моя) мать", kanji: "母" },
  { japanese: "おとうさん", romaji: "otousan", russian: "(чей-то) отец", kanji: "お父さん" },
  { japanese: "おかあさん", romaji: "okaasan", russian: "(чья-то) мать", kanji: "お母さん" },
  // Adverbs
  { japanese: "もう", romaji: "mou", russian: "уже" },
  { japanese: "まだ", romaji: "mada", russian: "ещё не" },
  { japanese: "これから", romaji: "korekara", russian: "с этих пор, скоро" },
  // Expressions
  { japanese: "[〜、]すてきですね。", romaji: "[~,] suteki desu ne.", russian: "Как это [~] прекрасно!" },
  { japanese: "いらっしゃい。", romaji: "irasshai.", russian: "Добро пожаловать." },
  { japanese: "どうぞ お上がり ください。", romaji: "douzo oagari kudasai.", russian: "Заходите, пожалуйста." },
  { japanese: "失礼します。", romaji: "shitsurei shimasu.", russian: "Извините за беспокойство." },
  { japanese: "[〜は]いかがですか。", romaji: "[~wa] ikaga desu ka.", russian: "Может быть, [~]? Не хотите ли [~]?" },
  { japanese: "いただきます。", romaji: "itadakimasu.", russian: "С удовольствием! (перед началом трапезы)" },
  { japanese: "ごちそうさま[でした]。", romaji: "gochisousama [deshita].", russian: "Благодарю за угощение." },
];

export const lesson7Grammar = [
  {
    pattern: "СУЩ (орудие/инструмент/средство) で ГЛАГ",
    patternJp: "N (tool/means) de V",
    meaning: "средство или способ осуществления действия",
    explanation: "Частица「で」выражает средство или способ действия.",
    examples: [
      { jp: "はしで 食べます。", romaji: "Hashi de tabemasu.", ru: "Ем палочками." },
      { jp: "日本語で レポートを 書きます。", romaji: "Nihongo de repooto wo kakimasu.", ru: "Пишу доклад по-японски." },
    ],
  },
  {
    pattern: "\"Слово\" は 〜語で 何ですか。",
    patternJp: "\"Word\" wa ~go de nan desu ka.",
    meaning: "как сказать слово на другом языке?",
    explanation: "Вопрос о переводе слова на другой язык.",
    examples: [
      { jp: "「ありがとう」は 英語で 何ですか。-- 「Thank you」です。", romaji: "\"Arigatou\" wa eigo de nan desu ka. -- \"Thank you\" desu.", ru: "Как по-английски «аригатоу»? -- «Thank you»." },
    ],
  },
  {
    pattern: "СУЩ1 (человек) に СУЩ2 を あげます/かします/おしえます и др.",
    patternJp: "N1 (person) ni N2 wo agemasu/kashimasu/oshiemasu",
    meaning: "давать/одалживать/преподавать что-то кому-то",
    explanation: "Глаголы дарения требуют наличия адресата (СУЩ1), который оформляется частицей「に」.",
    examples: [
      { jp: "[わたしは] 木村さんに 花を あげました。", romaji: "[Watashi wa] Kimura-san ni hana wo agemashita.", ru: "Я подарил цветы г-же Кимура." },
      { jp: "友達に 本を 貸しました。", romaji: "Tomodachi ni hon wo kashimashita.", ru: "Я одолжил книгу другу." },
    ],
  },
  {
    pattern: "СУЩ1 (человек) に СУЩ2 を もらいます/かります/ならいます и др.",
    patternJp: "N1 (person) ni N2 wo moraimasu/karimasu/naraimasu",
    meaning: "получать/брать/учиться у кого-то",
    explanation: "Глаголы получения требуют наличия источника (СУЩ1), оформленного частицей「に」или「から」. Обе частицы допустимы: に — акцент на самом человеке (от кого), から — акцент на происхождении (из какого источника).",
    examples: [
      { jp: "[わたしは] 山田さんに 花を もらいました。", romaji: "[Watashi wa] Yamada-san ni hana wo moraimashita.", ru: "Я получила цветы от г-на Ямады." },
      { jp: "先生に/から 日本語を 習います。", romaji: "Sensei ni/kara nihongo wo naraimasu.", ru: "Учу японский у учителя (に = конкретный человек, から = источник знания)." },
    ],
  },
  {
    pattern: "もう ГЛАГ ました",
    patternJp: "mou V mashita",
    meaning: "уже сделал (действие завершено)",
    explanation: "「もう」означает «уже» и используется с формой прошедшего времени. Отрицательный ответ: まだです (ещё нет).",
    examples: [
      { jp: "もう 荷物を 送りましたか。-- はい、もう 送りました。", romaji: "Mou nimotsu wo okurimashita ka. -- Hai, mou okurimashita.", ru: "Вы уже отправили посылку? -- Да, уже отправил." },
      { jp: "もう 昼ごはんを 食べましたか。-- いいえ、まだです。", romaji: "Mou hirugohan wo tabemashita ka. -- Iie, mada desu.", ru: "Вы уже обедали? -- Нет, ещё нет." },
    ],
  },
  {
    pattern: "Сокращение частиц",
    patternJp: "Particle omission",
    meaning: "опускание частиц в разговорной речи",
    explanation: "В разговорной речи частицы「は」「を」часто опускаются.",
    examples: [
      { jp: "このスプーン[は]、すてきですね。", romaji: "Kono supuun [wa], suteki desu ne.", ru: "Какая изящная ложечка!" },
      { jp: "コーヒー[を]、もう一杯 いかがですか。", romaji: "Koohii [wo], mou ippai ikaga desu ka.", ru: "Ещё чашечку кофе?" },
    ],
  },
];

// ---------------------------------------------------------------------------
// LESSON 8 - Урок 8
// ---------------------------------------------------------------------------
export const lesson8Vocabulary = [
  // な-adjectives (な-прилагательные)
  { japanese: "ハンサム[な]", romaji: "hansamu [na]", russian: "красавец, привлекательный (о мужчине)" },
  { japanese: "きれい[な]", romaji: "kirei [na]", russian: "красивый, чистый" },
  { japanese: "しずか[な]", romaji: "shizuka [na]", russian: "тихий, спокойный", kanji: "静か[な]" },
  { japanese: "にぎやか[な]", romaji: "nigiyaka [na]", russian: "оживлённый, шумный" },
  { japanese: "ゆうめい[な]", romaji: "yuumei [na]", russian: "знаменитый", kanji: "有名[な]" },
  { japanese: "しんせつ[な]", romaji: "shinsetsu [na]", russian: "добрый, доброжелательный", kanji: "親切[な]" },
  { japanese: "げんき[な]", romaji: "genki [na]", russian: "здоровый, бодрый", kanji: "元気[な]" },
  { japanese: "ひま[な]", romaji: "hima [na]", russian: "свободный (о времени)", kanji: "暇[な]" },
  { japanese: "べんり[な]", romaji: "benri [na]", russian: "удобный", kanji: "便利[な]" },
  { japanese: "すてき[な]", romaji: "suteki [na]", russian: "красивый, изящный, чудесный" },
  // い-adjectives (い-прилагательные)
  { japanese: "おおきい", romaji: "ookii", russian: "большой, обширный", kanji: "大きい" },
  { japanese: "ちいさい", romaji: "chiisai", russian: "маленький", kanji: "小さい" },
  { japanese: "あたらしい", romaji: "atarashii", russian: "новый", kanji: "新しい" },
  { japanese: "ふるい", romaji: "furui", russian: "старый (о неодушевленных предметах)", kanji: "古い" },
  { japanese: "いい（よい）", romaji: "ii (yoi)", russian: "хороший" },
  { japanese: "わるい", romaji: "warui", russian: "плохой", kanji: "悪い" },
  { japanese: "あつい、あつい", romaji: "atsui", russian: "жаркий, горячий", kanji: "暑い、熱い" },
  { japanese: "さむい", romaji: "samui", russian: "холодный (о температуре воздуха)", kanji: "寒い" },
  { japanese: "つめたい", romaji: "tsumetai", russian: "холодный, прохладный", kanji: "冷たい" },
  { japanese: "むずかしい", romaji: "muzukashii", russian: "трудный, сложный", kanji: "難しい" },
  { japanese: "やさしい", romaji: "yasashii", russian: "лёгкий, простой", kanji: "易しい" },
  { japanese: "たかい", romaji: "takai", russian: "высокий; дорогой", kanji: "高い" },
  { japanese: "やすい", romaji: "yasui", russian: "дешёвый (о цене)", kanji: "安い" },
  { japanese: "ひくい", romaji: "hikui", russian: "низкий", kanji: "低い" },
  { japanese: "おもしろい", romaji: "omoshiroi", russian: "интересный" },
  { japanese: "おいしい", romaji: "oishii", russian: "вкусный" },
  { japanese: "いそがしい", romaji: "isogashii", russian: "занятый", kanji: "忙しい" },
  { japanese: "たのしい", romaji: "tanoshii", russian: "радостный, приятный, весёлый", kanji: "楽しい" },
  { japanese: "しろい", romaji: "shiroi", russian: "белый", kanji: "白い" },
  { japanese: "くろい", romaji: "kuroi", russian: "чёрный", kanji: "黒い" },
  { japanese: "あかい", romaji: "akai", russian: "красный", kanji: "赤い" },
  { japanese: "あおい", romaji: "aoi", russian: "синий, голубой", kanji: "青い" },
  // Nouns
  { japanese: "さくら", romaji: "sakura", russian: "сакура (дерево и/или цветы японской вишни)", kanji: "桜" },
  { japanese: "やま", romaji: "yama", russian: "гора", kanji: "山" },
  { japanese: "まち", romaji: "machi", russian: "город", kanji: "町" },
  { japanese: "たべもの", romaji: "tabemono", russian: "еда, продукты", kanji: "食べ物" },
  { japanese: "ところ", romaji: "tokoro", russian: "место", kanji: "所" },
  { japanese: "りょう", romaji: "ryou", russian: "общежитие", kanji: "寮" },
  { japanese: "レストラン", romaji: "resutoran", russian: "ресторан" },
  { japanese: "せいかつ", romaji: "seikatsu", russian: "жизнь, быт", kanji: "生活" },
  { japanese: "[お]しごと", romaji: "[o]shigoto", russian: "работа", kanji: "[お]仕事" },
  // Question words
  { japanese: "どう", romaji: "dou", russian: "как (вопросительное местоимение)" },
  { japanese: "どんな〜", romaji: "donna ~", russian: "какой ~, что за ~, какого качества" },
  // Adverbs
  { japanese: "とても", romaji: "totemo", russian: "очень, весьма" },
  { japanese: "あまり", romaji: "amari", russian: "не очень (с отрицательной формой)" },
  // Conjunctions
  { japanese: "そして", romaji: "soshite", russian: "и также; к тому же" },
  { japanese: "〜が、〜", romaji: "~ga, ~", russian: "~, но ~; однако" },
  // Expressions
  { japanese: "お元気ですか。", romaji: "ogenki desu ka.", russian: "Как дела? Как поживаете?" },
  { japanese: "そうですね。", romaji: "sou desu ne.", russian: "Ясно. / Понятно. / Вот как!" },
  { japanese: "[〜、]もう一杯いかがですか。", romaji: "[~,] mou ippai ikaga desu ka.", russian: "Может быть, ещё чашечку [~]?" },
  { japanese: "[いいえ、]けっこうです。", romaji: "[iie,] kekkou desu.", russian: "Нет, (спасибо,) достаточно." },
  { japanese: "もう〜です[ね]。", romaji: "mou ~ desu [ne].", russian: "Уже ~ [, не правда ли?]." },
  { japanese: "そろそろ失礼します。", romaji: "sorosoro shitsurei shimasu.", russian: "Пора прощаться." },
  { japanese: "いいえ。", romaji: "iie.", russian: "Не стоит (благодарности)." },
  { japanese: "また いらっしゃって ください。", romaji: "mata irasshatte kudasai.", russian: "Приходите ещё." },
];

export const lesson8Grammar = [
  {
    pattern: "Прилагательные (な-ПРИЛ и い-ПРИЛ)",
    patternJp: "na-adjectives / i-adjectives",
    meaning: "два типа прилагательных в японском языке",
    explanation: "В японском существуют 2 группы прилагательных: い-прилагательные (оканчиваются на い) и な-прилагательные (оканчиваются на な). Способы их использования отличаются.",
    examples: [
      { jp: "大きい (い-прилагательное)", romaji: "ookii (i-adjective)", ru: "Большой." },
      { jp: "静かな (な-прилагательное)", romaji: "shizuka na (na-adjective)", ru: "Тихий, спокойный." },
    ],
  },
  {
    pattern: "СУЩ は な-ПРИЛ[な] です / СУЩ は い-ПРИЛ(〜い) です",
    patternJp: "N wa na-ADJ [na] desu / N wa i-ADJ (~i) desu",
    meaning: "сказуемое-прилагательное",
    explanation: "Утвердительные предложения со сказуемым-прилагательным. Отрицание な-ПРИЛ: じゃ(では)ありません. Отрицание い-ПРИЛ: отсечение い + くないです.",
    examples: [
      { jp: "ワット先生は 親切です。", romaji: "Watto-sensei wa shinsetsu desu.", ru: "Учитель Уотт добрый." },
      { jp: "富士山は 高いです。", romaji: "Fujisan wa takai desu.", ru: "Гора Фудзи высокая." },
      { jp: "この 部屋は 静かじゃ ありません。", romaji: "Kono heya wa shizuka ja arimasen.", ru: "Эта комната не тихая." },
    ],
  },
  {
    pattern: "な-ПРИЛ[な] СУЩ / い-ПРИЛ(〜い) СУЩ",
    patternJp: "na-ADJ [na] N / i-ADJ (~i) N",
    meaning: "прилагательное как определение к существительному",
    explanation: "Прилагательное стоит перед существительным. な-прилагательное требует конечного「な」.",
    examples: [
      { jp: "親切な 先生", romaji: "shinsetsu na sensei", ru: "Доброжелательный преподаватель." },
      { jp: "高い 山", romaji: "takai yama", ru: "Высокая гора." },
      { jp: "きれいな 花", romaji: "kirei na hana", ru: "Красивый цветок." },
    ],
  },
  {
    pattern: "〜が、〜",
    patternJp: "~ga, ~",
    meaning: "но, однако (противительная связь)",
    explanation: "Частица「が」служит для соединения противительной связью двух частей предложения.",
    examples: [
      { jp: "日本の 食べ物は おいしいですが、高いです。", romaji: "Nihon no tabemono wa oishii desu ga, takai desu.", ru: "Японские продукты вкусные, но дорогие." },
      { jp: "この 町は にぎやかですが、あまり きれいじゃ ありません。", romaji: "Kono machi wa nigiyaka desu ga, amari kirei ja arimasen.", ru: "Этот город оживлённый, но не очень красивый." },
    ],
  },
  {
    pattern: "とても / あまり",
    patternJp: "totemo / amari",
    meaning: "очень / не очень",
    explanation: "「とても」-- очень (с утвердительными формами).「あまり」-- не очень (с отрицательными формами).",
    examples: [
      { jp: "ペキンは とても 寒いです。", romaji: "Pekin wa totemo samui desu.", ru: "В Пекине очень холодно." },
      { jp: "シャンハイは あまり 寒くないです。", romaji: "Shanhai wa amari samukunai desu.", ru: "В Шанхае не очень холодно." },
    ],
  },
  {
    pattern: "СУЩ は どうですか",
    patternJp: "N wa dou desu ka",
    meaning: "как вам ~? (вопрос о впечатлении)",
    explanation: "Вопрос собеседнику о впечатлении или мнении.",
    examples: [
      { jp: "日本の 生活は どうですか。-- 楽しいです。", romaji: "Nihon no seikatsu wa dou desu ka. -- Tanoshii desu.", ru: "Как вам жизнь в Японии? -- Замечательно." },
    ],
  },
  {
    pattern: "СУЩ1 は どんな СУЩ2 ですか",
    patternJp: "N1 wa donna N2 desu ka",
    meaning: "какой ~? (вопрос о качествах)",
    explanation: "「どんな」-- вопрос о качествах или свойствах.",
    examples: [
      { jp: "奈良は どんな 町ですか。-- 古い 町です。", romaji: "Nara wa donna machi desu ka. -- Furui machi desu.", ru: "Нара -- это какой город? -- Старинный город." },
      { jp: "ミラーさんは どんな 人ですか。-- 親切な 人です。", romaji: "Miraa-san wa donna hito desu ka. -- Shinsetsu na hito desu.", ru: "Г-н Миллер -- какой человек? -- Добрый человек." },
    ],
  },
  {
    pattern: "そうですね",
    patternJp: "sou desu ne",
    meaning: "реакция на вопрос (обдумывание ответа)",
    explanation: "В диалоге「そうですね」произносится как реакция на вопрос и указывает, что говорящий обдумывает ответ.",
    examples: [
      { jp: "お仕事は どうですか。-- そうですね。忙しいですが、おもしろいです。", romaji: "Oshigoto wa dou desu ka. -- Sou desu ne. Isogashii desu ga, omoshiroi desu.", ru: "Как работа? -- Ну... Занятая, но интересная." },
    ],
  },
];

// ---------------------------------------------------------------------------
// LESSON 9 - Урок 9
// ---------------------------------------------------------------------------
export const lesson9Vocabulary = [
  // Verbs
  { japanese: "わかります", romaji: "wakarimasu", russian: "понимать", type: "гл. I" },
  { japanese: "あります", romaji: "arimasu", russian: "иметь, быть (в наличии), у (кого-то) есть", type: "гл. I" },
  // な-adjectives
  { japanese: "すき[な]", romaji: "suki [na]", russian: "любимый", kanji: "好き[な]" },
  { japanese: "きらい[な]", romaji: "kirai [na]", russian: "нелюбимый, противный, ненавистный", kanji: "嫌い[な]" },
  { japanese: "じょうず[な]", romaji: "jouzu [na]", russian: "умелый", kanji: "上手[な]" },
  { japanese: "へた[な]", romaji: "heta [na]", russian: "неумелый", kanji: "下手[な]" },
  // Nouns - food & drink
  { japanese: "のみもの", romaji: "nomimono", russian: "напиток, питьё", kanji: "飲み物" },
  { japanese: "りょうり", romaji: "ryouri", russian: "блюдо, приготовление блюд, кулинария, кухня", kanji: "料理" },
  // Activities & entertainment
  { japanese: "スポーツ", romaji: "supootsu", russian: "спорт" },
  { japanese: "やきゅう", romaji: "yakyuu", russian: "бейсбол", kanji: "野球" },
  { japanese: "ダンス", romaji: "dansu", russian: "танец" },
  { japanese: "りょこう", romaji: "ryokou", russian: "поездка, тур", kanji: "旅行" },
  { japanese: "おんがく", romaji: "ongaku", russian: "музыка", kanji: "音楽" },
  { japanese: "うた", romaji: "uta", russian: "песня", kanji: "歌" },
  { japanese: "クラシック", romaji: "kurashikku", russian: "классическая музыка" },
  { japanese: "ジャズ", romaji: "jazu", russian: "джаз" },
  { japanese: "コンサート", romaji: "konsaato", russian: "концерт" },
  { japanese: "カラオケ", romaji: "karaoke", russian: "караоке" },
  { japanese: "かぶき", romaji: "kabuki", russian: "кабуки (японский традиционный музыкальный театр)", kanji: "歌舞伎" },
  // Writing & characters
  { japanese: "え", romaji: "e", russian: "картина", kanji: "絵" },
  { japanese: "じ", romaji: "ji", russian: "буква, знак", kanji: "字" },
  { japanese: "かんじ", romaji: "kanji", russian: "иероглиф", kanji: "漢字" },
  { japanese: "ひらがな", romaji: "hiragana", russian: "хирагана" },
  { japanese: "かたかな", romaji: "katakana", russian: "катакана" },
  { japanese: "ローマじ", romaji: "roomaji", russian: "латинские буквы, латинский алфавит", kanji: "ローマ字" },
  // Other nouns
  { japanese: "こまかい おかね", romaji: "komakai okane", russian: "мелкие деньги, монеты, мелочь", kanji: "細かい お金" },
  { japanese: "チケット", romaji: "chiketto", russian: "билет (на концерт, в кино и т.п.)" },
  { japanese: "じかん", romaji: "jikan", russian: "время", kanji: "時間" },
  { japanese: "ようじ", romaji: "youji", russian: "дело, занятие (время занято)", kanji: "用事" },
  { japanese: "やくそく", romaji: "yakusoku", russian: "обещание, договорённость", kanji: "約束" },
  { japanese: "アルバイト", romaji: "arubaito", russian: "подработка" },
  // Family
  { japanese: "ごしゅじん", romaji: "goshujin", russian: "муж, супруг (2-го или 3-го лица)", kanji: "ご主人" },
  { japanese: "おっと／しゅじん", romaji: "otto / shujin", russian: "муж (мой)", kanji: "夫／主人" },
  { japanese: "おくさん", romaji: "okusan", russian: "жена, супруга (2-го или 3-го лица)", kanji: "奥さん" },
  { japanese: "つま／かない", romaji: "tsuma / kanai", russian: "жена (моя)", kanji: "妻／家内" },
  { japanese: "こども", romaji: "kodomo", russian: "ребёнок", kanji: "子ども" },
  // Adverbs of degree
  { japanese: "よく", romaji: "yoku", russian: "хорошо" },
  { japanese: "だいたい", romaji: "daitai", russian: "примерно, около" },
  { japanese: "たくさん", romaji: "takusan", russian: "много" },
  { japanese: "すこし", romaji: "sukoshi", russian: "мало", kanji: "少し" },
  { japanese: "ぜんぜん", romaji: "zenzen", russian: "совсем не (с отрицанием)", kanji: "全然" },
  { japanese: "はやく、はやく", romaji: "hayaku", russian: "рано; быстро", kanji: "早く、速く" },
  // Conjunctions
  { japanese: "〜から", romaji: "~kara", russian: "потому что ~, из-за ~, так как ~" },
  { japanese: "どうして", romaji: "doushite", russian: "почему" },
  // Expressions
  { japanese: "貸して ください。", romaji: "kashite kudasai.", russian: "Разрешите воспользоваться (вашей вещью)." },
  { japanese: "いいですよ。", romaji: "ii desu yo.", russian: "Да, пожалуйста." },
  { japanese: "ざんねんです[が]", romaji: "zannen desu [ga]", russian: "Очень сожалею, но...", kanji: "残念です[が]" },
  { japanese: "ああ", romaji: "aa", russian: "А-а... (междометие, выражение лёгкого удивления)" },
  { japanese: "いっしょに いかがですか。", romaji: "isshoni ikaga desu ka.", russian: "Не хотите ли пойти вместе (со мной)." },
  { japanese: "[〜は]ちょっと……。", romaji: "[~wa] chotto......", russian: "[~] боюсь, что...; немного сложно... (вежливый отказ)" },
  { japanese: "だめですか。", romaji: "dame desu ka.", russian: "Не получится?" },
  { japanese: "また 今度 お願いします。", romaji: "mata kondo onegai shimasu.", russian: "Может быть, в следующий раз." },
];

export const lesson9Grammar = [
  {
    pattern: "СУЩ が あります / わかります / 好きです / 嫌いです / 上手です / 下手です",
    patternJp: "N ga arimasu / wakarimasu / suki desu / kirai desu / jouzu desu / heta desu",
    meaning: "объект оформляется частицей が",
    explanation: "С некоторыми глаголами и прилагательными объект (дополнение) оформляется частицей「が」.",
    examples: [
      { jp: "わたしは イタリア料理が 好きです。", romaji: "Watashi wa Itaria ryouri ga suki desu.", ru: "Мне нравится итальянская кухня." },
      { jp: "わたしは 日本語が わかります。", romaji: "Watashi wa nihongo ga wakarimasu.", ru: "Я понимаю по-японски." },
      { jp: "カリナさんは 歌が 上手です。", romaji: "Karina-san wa uta ga jouzu desu.", ru: "Карина хорошо поёт." },
    ],
  },
  {
    pattern: "どんな СУЩ",
    patternJp: "donna N",
    meaning: "какой (конкретный ответ)",
    explanation: "На вопрос с「どんな」можно ответить конкретным существительным с「が」.",
    examples: [
      { jp: "どんな スポーツが 好きですか。-- サッカーが 好きです。", romaji: "Donna supootsu ga suki desu ka. -- Sakkaa ga suki desu.", ru: "Какой спорт вам нравится? -- Люблю футбол." },
      { jp: "どんな 音楽が 好きですか。-- ジャズが 好きです。", romaji: "Donna ongaku ga suki desu ka. -- Jazu ga suki desu.", ru: "Какая музыка вам нравится? -- Люблю джаз." },
    ],
  },
  {
    pattern: "よく / だいたい / たくさん / 少し / あまり / 全然",
    patternJp: "yoku / daitai / takusan / sukoshi / amari / zenzen",
    meaning: "наречия степени и количества",
    explanation: "Ставятся перед глаголом. С утвердительными: よく・だいたい・すこし. С отрицательными: あまり・ぜんぜん.",
    examples: [
      { jp: "日本語が よく わかります。", romaji: "Nihongo ga yoku wakarimasu.", ru: "Хорошо понимаю японский." },
      { jp: "漢字が 全然 わかりません。", romaji: "Kanji ga zenzen wakarimasen.", ru: "Совсем не понимаю кандзи." },
      { jp: "お金が たくさん あります。", romaji: "Okane ga takusan arimasu.", ru: "У меня много денег." },
    ],
  },
  {
    pattern: "〜から、〜",
    patternJp: "~kara, ~",
    meaning: "потому что ~, поэтому ~",
    explanation: "Сказанное перед「から」является причиной того, что изложено во второй части. Причину можно также ставить в конце.",
    examples: [
      { jp: "時間が ありませんから、新聞を 読みません。", romaji: "Jikan ga arimasen kara, shinbun wo yomimasen.", ru: "Так как нет времени, не читаю газет." },
      { jp: "今日は 疲れましたから、早く 寝ます。", romaji: "Kyou wa tsukaremashita kara, hayaku nemasu.", ru: "Сегодня устал, поэтому лягу пораньше." },
    ],
  },
  {
    pattern: "どうして",
    patternJp: "doushite",
    meaning: "почему",
    explanation: "Вопрос о причине. В ответе причина и в конце ставится「から」. Сокращение: どうしてですか.",
    examples: [
      { jp: "どうして 朝 新聞を 読みませんか。-- 時間が ありませんから。", romaji: "Doushite asa shinbun wo yomimasen ka. -- Jikan ga arimasen kara.", ru: "Почему утром не читаете газеты? -- Потому что нет времени." },
    ],
  },
];

// ---------------------------------------------------------------------------
// LESSON 10 - Урок 10
// ---------------------------------------------------------------------------
export const lesson10Vocabulary = [
  // Verbs
  { japanese: "あります", romaji: "arimasu", russian: "быть, находиться (о неодушевлённых предметах)", type: "гл. I" },
  { japanese: "います", romaji: "imasu", russian: "быть, находиться (об одушевлённых предметах)", type: "гл. II" },
  // Adjectives
  { japanese: "いろいろ[な]", romaji: "iroiro [na]", russian: "различный" },
  // People
  { japanese: "おとこのひと", romaji: "otoko no hito", russian: "мужчина", kanji: "男の人" },
  { japanese: "おんなのひと", romaji: "onna no hito", russian: "женщина", kanji: "女の人" },
  { japanese: "おとこのこ", romaji: "otoko no ko", russian: "мальчик", kanji: "男の子" },
  { japanese: "おんなのこ", romaji: "onna no ko", russian: "девочка", kanji: "女の子" },
  // Animals & nature
  { japanese: "いぬ", romaji: "inu", russian: "собака", kanji: "犬" },
  { japanese: "ねこ", romaji: "neko", russian: "кот, кошка", kanji: "猫" },
  { japanese: "パンダ", romaji: "panda", russian: "панда (бамбуковый медведь)" },
  { japanese: "ぞう", romaji: "zou", russian: "слон", kanji: "象" },
  { japanese: "き", romaji: "ki", russian: "дерево, древесина", kanji: "木" },
  // Things
  { japanese: "もの", romaji: "mono", russian: "вещь", kanji: "物" },
  { japanese: "でんち", romaji: "denchi", russian: "батарейка", kanji: "電池" },
  { japanese: "はこ", romaji: "hako", russian: "коробка, ящик", kanji: "箱" },
  // Appliances & furniture
  { japanese: "スイッチ", romaji: "suicchi", russian: "выключатель" },
  { japanese: "れいぞうこ", romaji: "reizouko", russian: "холодильник", kanji: "冷蔵庫" },
  { japanese: "テーブル", romaji: "teeburu", russian: "стол (обеденный)" },
  { japanese: "ベッド", romaji: "beddo", russian: "кровать" },
  { japanese: "たな", romaji: "tana", russian: "полка", kanji: "棚" },
  { japanese: "ドア", romaji: "doa", russian: "дверь" },
  { japanese: "まど", romaji: "mado", russian: "окно", kanji: "窓" },
  // Places
  { japanese: "ポスト", romaji: "posuto", russian: "почтовый ящик (уличный)" },
  { japanese: "ビル", romaji: "biru", russian: "здание" },
  { japanese: "ATM", romaji: "ATM", russian: "банкомат" },
  { japanese: "コンビニ", romaji: "konbini", russian: "круглосуточный магазин товаров повседневного спроса" },
  { japanese: "こうえん", romaji: "kouen", russian: "парк", kanji: "公園" },
  { japanese: "きっさてん", romaji: "kissaten", russian: "кафе", kanji: "喫茶店" },
  { japanese: "〜や", romaji: "~ya", russian: "~ магазин", kanji: "〜屋" },
  { japanese: "のりば", romaji: "noriba", russian: "стоянка такси, остановка общественного транспорта", kanji: "乗り場" },
  { japanese: "けん", romaji: "ken", russian: "префектура", kanji: "県" },
  // Position words (все являются именами существительными)
  { japanese: "うえ", romaji: "ue", russian: "верх, вверх, наверху", kanji: "上" },
  { japanese: "した", romaji: "shita", russian: "низ, вниз, внизу", kanji: "下" },
  { japanese: "まえ", romaji: "mae", russian: "перёд, вперёд, спереди", kanji: "前" },
  { japanese: "うしろ", romaji: "ushiro", russian: "зад, сзади, позади" },
  { japanese: "みぎ", romaji: "migi", russian: "право, справа, направо", kanji: "右" },
  { japanese: "ひだり", romaji: "hidari", russian: "лево, налево, слева", kanji: "左" },
  { japanese: "なか", romaji: "naka", russian: "в, внутри", kanji: "中" },
  { japanese: "そと", romaji: "soto", russian: "снаружи", kanji: "外" },
  { japanese: "となり", romaji: "tonari", russian: "рядом, по соседству", kanji: "隣" },
  { japanese: "ちかく", romaji: "chikaku", russian: "близко, окрестность(-и)", kanji: "近く" },
  { japanese: "あいだ", romaji: "aida", russian: "между, посреди", kanji: "間" },
  // Particles & expressions
  { japanese: "〜や〜[など]", romaji: "~ya~ [nado]", russian: "~ и так далее" },
  // Dialogue expressions
  { japanese: "[どうも]すみません。", romaji: "[doumo] sumimasen.", russian: "Большое спасибо. (выражение благодарности)" },
];

export const lesson10Grammar = [
  {
    pattern: "СУЩ が あります / います",
    patternJp: "N ga arimasu / imasu",
    meaning: "есть, имеется, находится",
    explanation: "「あります」-- для неодушевлённых предметов (включая растения).「います」-- для одушевлённых (людей и животных). Существительные оформляются частицей「が」.",
    examples: [
      { jp: "コンピューターが あります。", romaji: "Konpyuutaa ga arimasu.", ru: "Есть компьютер." },
      { jp: "男の人が います。", romaji: "Otoko no hito ga imasu.", ru: "Есть (находится) мужчина." },
    ],
  },
  {
    pattern: "МЕСТО に СУЩ が あります / います",
    patternJp: "PLACE ni N ga arimasu / imasu",
    meaning: "в (месте) есть/находится (что-то/кто-то)",
    explanation: "Слово, обозначающее место, оформляется частицей「に」.",
    examples: [
      { jp: "わたしの 部屋に 机が あります。", romaji: "Watashi no heya ni tsukue ga arimasu.", ru: "В моей комнате есть стол." },
      { jp: "事務所に ミラーさんが います。", romaji: "Jimusho ni Miraa-san ga imasu.", ru: "В офисе находится г-н Миллер." },
    ],
  },
  {
    pattern: "СУЩ は МЕСТО に あります / います",
    patternJp: "N wa PLACE ni arimasu / imasu",
    meaning: "(предмет/человек) находится в (месте)",
    explanation: "Существительное становится темой (は) и сообщается о его местонахождении.",
    examples: [
      { jp: "東京ディズニーランドは 千葉県に あります。", romaji: "Toukyou Dizuniirando wa Chiba-ken ni arimasu.", ru: "Токийский Диснейлэнд находится в префектуре Тиба." },
      { jp: "ミラーさんは 事務所に います。", romaji: "Miraa-san wa jimusho ni imasu.", ru: "Г-н Миллер находится в офисе." },
    ],
  },
  {
    pattern: "СУЩ1 (предмет/человек/место) の СУЩ2 (расположение)",
    patternJp: "N1 no N2 (position)",
    meaning: "расположение относительно предмета",
    explanation: "СУЩ2「上、下、前、うしろ、右、左、中、外、隣、近く、間」обозначает расположение.",
    examples: [
      { jp: "机の 上に 写真が あります。", romaji: "Tsukue no ue ni shashin ga arimasu.", ru: "На столе стоит фотография." },
      { jp: "郵便局は 銀行の 隣に あります。", romaji: "Yuubinkyoku wa ginkou no tonari ni arimasu.", ru: "Почта находится рядом с банком." },
    ],
  },
  {
    pattern: "СУЩ1 や СУЩ2",
    patternJp: "N1 ya N2",
    meaning: "перечисление (не полный список)",
    explanation: "Соединительная частица「や」используется при неполном перечислении (в отличие от「と」). Последнее из перечисленных может оформляться「など」.",
    examples: [
      { jp: "箱の 中に 手紙や 写真などが あります。", romaji: "Hako no naka ni tegami ya shashin nado ga arimasu.", ru: "В коробке письма, фотографии и прочее." },
      { jp: "机の 上に 本や ノートが あります。", romaji: "Tsukue no ue ni hon ya nooto ga arimasu.", ru: "На столе книги, тетради и другое." },
    ],
  },
  {
    pattern: "アジアストアですか (уточняющий переспрос)",
    patternJp: "N desu ka (clarifying question)",
    meaning: "переспрос для уточнения",
    explanation: "В разговорной речи на вопрос часто отвечают не сразу, а после уточнения смысла вопроса.",
    examples: [
      { jp: "すみません。アジアストアは どこですか。-- アジアストアですか。あの ビルの 中です。", romaji: "Sumimasen. Ajia Sutoa wa doko desu ka. -- Ajia Sutoa desu ka. Ano biru no naka desu.", ru: "Извините. Где Азия-стор? -- Азия-стор? Вон в том здании." },
    ],
  },
];

// ---------------------------------------------------------------------------
// Combined exports
// ---------------------------------------------------------------------------
export const allLessons = {
  6: { vocabulary: lesson6Vocabulary, grammar: lesson6Grammar },
  7: { vocabulary: lesson7Vocabulary, grammar: lesson7Grammar },
  8: { vocabulary: lesson8Vocabulary, grammar: lesson8Grammar },
  9: { vocabulary: lesson9Vocabulary, grammar: lesson9Grammar },
  10: { vocabulary: lesson10Vocabulary, grammar: lesson10Grammar },
};

export const allVocabulary = [
  ...lesson6Vocabulary.map(w => ({ ...w, lesson: 6 })),
  ...lesson7Vocabulary.map(w => ({ ...w, lesson: 7 })),
  ...lesson8Vocabulary.map(w => ({ ...w, lesson: 8 })),
  ...lesson9Vocabulary.map(w => ({ ...w, lesson: 9 })),
  ...lesson10Vocabulary.map(w => ({ ...w, lesson: 10 })),
];

export const allGrammar = [
  ...lesson6Grammar.map(g => ({ ...g, lesson: 6 })),
  ...lesson7Grammar.map(g => ({ ...g, lesson: 7 })),
  ...lesson8Grammar.map(g => ({ ...g, lesson: 8 })),
  ...lesson9Grammar.map(g => ({ ...g, lesson: 9 })),
  ...lesson10Grammar.map(g => ({ ...g, lesson: 10 })),
];
