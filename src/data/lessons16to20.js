// =============================================================================
// Minna no Nihongo Lessons 16-20: Vocabulary & Grammar
// Extracted from: Минна но Нихонго (РУССКИЙ).pdf
// =============================================================================

// ---------------------------------------------------------------------------
// LESSON 16 - Урок 16: Соединение предложений (て-форма), описание последовательности
// ---------------------------------------------------------------------------
export const lesson16Vocabulary = [
  // Verbs (порядок по учебнику)
  { japanese: "のります", romaji: "norimasu", russian: "ехать, садиться [на поезд]", type: "гл. I", kanji: "乗ります" },
  { japanese: "おります", romaji: "orimasu", russian: "выходить, сходить [из/с поезда]", type: "гл. II", kanji: "降ります" },
  { japanese: "のりかえます", romaji: "norikaemasu", russian: "делать пересадку (на транспорте)", type: "гл. II", kanji: "乗り換えます" },
  { japanese: "あびます [シャワーを〜]", romaji: "abimasu [shawaa wo ~]", russian: "принимать [душ]", type: "гл. II", kanji: "浴びます [シャワーを〜]" },
  { japanese: "いれます", romaji: "iremasu", russian: "вкладывать, вставлять, опускать", type: "гл. II", kanji: "入れます" },
  { japanese: "だします", romaji: "dashimasu", russian: "подавать (доклад); отправлять (письмо); доставать (из портфеля)", type: "гл. I", kanji: "出します" },
  { japanese: "おろします [おかねを〜]", romaji: "oroshimasu [okane wo ~]", russian: "снимать [деньги с банковского счёта]", type: "гл. I", kanji: "下ろします [お金を〜]" },
  { japanese: "はいります [だいがくに〜]", romaji: "hairimasu [daigaku ni ~]", russian: "поступать [в университет]", type: "гл. I", kanji: "入ります [大学に〜]" },
  { japanese: "でます [だいがくを〜]", romaji: "demasu [daigaku wo ~]", russian: "окончить [университет]", type: "гл. II", kanji: "出ます [大学を〜]" },
  { japanese: "おします", romaji: "oshimasu", russian: "нажимать, жать, толкать", type: "гл. I", kanji: "押します" },
  { japanese: "のみます", romaji: "nomimasu", russian: "пить алкогольные напитки", type: "гл. I", kanji: "飲みます" },
  { japanese: "はじめます", romaji: "hajimemasu", russian: "начинать", type: "гл. II", kanji: "始めます" },
  { japanese: "けんがくします", romaji: "kengaku shimasu", russian: "посещать, осматривать (экскурсия)", type: "гл. III", kanji: "見学します" },
  { japanese: "でんわします", romaji: "denwa shimasu", russian: "звонить по телефону", type: "гл. III", kanji: "電話します" },
  // い-adjectives
  { japanese: "わかい", romaji: "wakai", russian: "молодой", kanji: "若い" },
  { japanese: "ながい", romaji: "nagai", russian: "длинный, долгий", kanji: "長い" },
  { japanese: "みじかい", romaji: "mijikai", russian: "короткий", kanji: "短い" },
  { japanese: "あかるい", romaji: "akarui", russian: "светлый (есть свет)", kanji: "明るい" },
  { japanese: "くらい", romaji: "kurai", russian: "тёмный (нет света)", kanji: "暗い" },
  // Nouns — тело
  { japanese: "からだ", romaji: "karada", russian: "тело", kanji: "体" },
  { japanese: "あたま", romaji: "atama", russian: "голова", kanji: "頭" },
  { japanese: "かみ", romaji: "kami", russian: "волосы", kanji: "髪" },
  { japanese: "かお", romaji: "kao", russian: "лицо", kanji: "顔" },
  { japanese: "め", romaji: "me", russian: "глаз, глаза", kanji: "目" },
  { japanese: "みみ", romaji: "mimi", russian: "ухо, уши", kanji: "耳" },
  { japanese: "はな", romaji: "hana", russian: "нос", kanji: "鼻" },
  { japanese: "くち", romaji: "kuchi", russian: "рот", kanji: "口" },
  { japanese: "は", romaji: "ha", russian: "зуб, зубы", kanji: "歯" },
  { japanese: "おなか", romaji: "onaka", russian: "живот" },
  { japanese: "あし", romaji: "ashi", russian: "нога, ноги (от ступни до паха)", kanji: "足" },
  { japanese: "せ", romaji: "se", russian: "спина; рост", kanji: "背" },
  // Other nouns
  { japanese: "サービス", romaji: "saabisu", russian: "обслуживание, сервис" },
  { japanese: "ジョギング", romaji: "jogingu", russian: "спортивный бег (〜をします — бегать)" },
  { japanese: "シャワー", romaji: "shawaa", russian: "душ" },
  { japanese: "みどり", romaji: "midori", russian: "зелёный; зелень (зеленый город и т.п.)", kanji: "緑" },
  { japanese: "[お]てら", romaji: "[o]tera", russian: "буддистский храм", kanji: "[お]寺" },
  { japanese: "じんじゃ", romaji: "jinja", russian: "синтоистский храм", kanji: "神社" },
  { japanese: "〜ばん", romaji: "~ban", russian: "номер (№3, №4 и т.д.)", kanji: "〜番" },
  // Question words / adverbs
  { japanese: "どうやって", romaji: "dou yatte", russian: "как, каким образом" },
  { japanese: "どの〜", romaji: "dono ~", russian: "который, какой из ~ (из трёх и более)" },
  { japanese: "どれ", romaji: "dore", russian: "который? какой? (из трёх и более предметов)" },
  // 練習C
  { japanese: "すごいですね。", romaji: "sugoi desu ne.", russian: "Вот это да!" },
  { japanese: "[いいえ、]まだまだです。", romaji: "[iie,] mada mada desu.", russian: "[Нет,] пока нет. (скромный ответ на похвалу)" },
  // 会話
  { japanese: "おひきだしですか。", romaji: "ohikidashi desu ka.", russian: "Вы хотите снять деньги со счёта?", kanji: "お引き出しですか。" },
  { japanese: "まず", romaji: "mazu", russian: "сначала, в первую очередь" },
  { japanese: "つぎに", romaji: "tsugi ni", russian: "затем, далее", kanji: "次に" },
  { japanese: "キャッシュカード", romaji: "kyasshu kaado", russian: "банковская карта" },
  { japanese: "あんしょうばんごう", romaji: "anshou bangou", russian: "PIN-код, секретный номер", kanji: "暗証番号" },
  { japanese: "きんがく", romaji: "kingaku", russian: "денежная сумма", kanji: "金額" },
  { japanese: "かくにん", romaji: "kakunin", russian: "подтверждение (~します подтверждать)", kanji: "確認" },
  { japanese: "ボタン", romaji: "botan", russian: "кнопка, клавиша" },
];

export const lesson16Grammar = [
  {
    pattern: "い-ПРИЛ(〜くて)、〜",
    patternJp: "i-ADJ (-kute), ~",
    meaning: "соединение い-прилагательных (и..., и...)",
    explanation: "Для соединения い-прилагательных: убрать い и добавить くて. Исключение: いい -> よくて.",
    examples: [
      { jp: "ミラーさんは 若くて、元気です。", romaji: "Miraa-san wa wakakute, genki desu.", ru: "Г-н Миллер молодой и энергичный." },
      { jp: "きのうは 天気が よくて、暑かったです。", romaji: "Kinou wa tenki ga yokute, atsukatta desu.", ru: "Вчера погода была хорошая и жаркая." },
      { jp: "この 部屋は 広くて、明るいです。", romaji: "Kono heya wa hirokute, akarui desu.", ru: "Эта комната просторная и светлая." },
    ],
  },
  {
    pattern: "な-ПРИЛ(〜で)、〜 / СУЩ で、〜",
    patternJp: "na-ADJ (-de), ~ / N de, ~",
    meaning: "соединение な-прилагательных и существительных (и..., и...)",
    explanation: "Для соединения な-прилагательных: добавить で вместо な. Для существительных: добавить で после существительного.",
    examples: [
      { jp: "ワットさんは ハンサムで、親切です。", romaji: "Watto-san wa hansamu de, shinsetsu desu.", ru: "Г-н Уотт красивый и добрый." },
      { jp: "奈良は 静かで、きれいな 町です。", romaji: "Nara wa shizuka de, kirei na machi desu.", ru: "Нара -- тихий и красивый город." },
      { jp: "ミラーさんは IMCの 社員で、独身です。", romaji: "Miraa-san wa IMC no shain de, dokushin desu.", ru: "Г-н Миллер -- сотрудник IMC и холост." },
    ],
  },
  {
    pattern: "ГЛАГ1(て-форма)、ГЛАГ2(て-форма)、ГЛАГ3",
    patternJp: "V1-te, V2-te, V3",
    meaning: "последовательные действия (сделал ..., потом ..., потом ...)",
    explanation: "Действия перечисляются в хронологическом порядке. Последний глагол определяет время предложения.",
    examples: [
      { jp: "朝 起きて、ジョギングをして、シャワーを 浴びます。", romaji: "Asa okite, jogingu wo shite, shawaa wo abimasu.", ru: "Утром встаю, бегаю и принимаю душ." },
      { jp: "神戸へ 行って、映画を 見て、お茶を 飲みました。", romaji: "Koube e itte, eiga wo mite, ocha wo nomimashita.", ru: "Поехал в Кобе, посмотрел фильм и выпил чай." },
      { jp: "家へ 帰って、晩ごはんを 食べて、寝ます。", romaji: "Ie e kaette, bangohan wo tabete, nemasu.", ru: "Возвращаюсь домой, ужинаю и ложусь спать." },
    ],
  },
  {
    pattern: "ГЛАГ1(て-форма) から、ГЛАГ2",
    patternJp: "V1-te kara, V2",
    meaning: "после того как сделал V1, делаю V2",
    explanation: "Выражает последовательность: V1 обязательно предшествует V2. Отличается от простого て-соединения тем, что подчёркивает, что V2 произойдёт только после завершения V1.",
    examples: [
      { jp: "薬を 飲んでから、寝ます。", romaji: "Kusuri wo nonde kara, nemasu.", ru: "Приму лекарство и потом лягу спать." },
      { jp: "映画が 終わってから、レストランへ 行きましょう。", romaji: "Eiga ga owatte kara, resutoran e ikimashoo.", ru: "После окончания фильма пойдём в ресторан." },
      { jp: "国へ 帰ってから、日本語の 勉強を 続けます。", romaji: "Kuni e kaette kara, nihongo no benkyou wo tsuzukemasu.", ru: "После возвращения на родину буду продолжать учить японский." },
    ],
  },
  {
    pattern: "СУЩ は [описание内容]",
    patternJp: "N wa [description]",
    meaning: "описание свойств предмета/человека",
    explanation: "Описание характеристик объекта с помощью цепочки прилагательных, соединённых через 〜くて / 〜で.",
    examples: [
      { jp: "大阪城は 立派で、きれいです。", romaji: "Oosaka-jou wa rippa de, kirei desu.", ru: "Осакский замок величественный и красивый." },
      { jp: "カリナさんは 髪が 長くて、きれいです。", romaji: "Karina-san wa kami ga nagakute, kirei desu.", ru: "У Карины длинные и красивые волосы." },
    ],
  },
  {
    pattern: "ГЛАГ(ます-основа) + ながら、ГЛАГ2",
    patternJp: "V-stem + nagara, V2",
    meaning: "одновременные действия (делать V1 и V2 одновременно)",
    explanation: "Конструкция〜ながら описывает два действия, которые происходят одновременно. Основное действие — второй глагол, а〜ながら — сопутствующее. Образование: ます-форма без ます + ながら.",
    examples: [
      { jp: "音楽を 聴きながら、勉強します。", romaji: "Ongaku o kikinagara, benkyō shimasu.", ru: "Учусь, слушая музыку." },
      { jp: "テレビを 見ながら、ご飯を 食べます。", romaji: "Terebi o minagara, gohan o tabemasu.", ru: "Ем, глядя телевизор." },
      { jp: "歩きながら、電話しないでください。", romaji: "Arukinagara, denwa shinaide kudasai.", ru: "Не разговаривайте по телефону на ходу." },
    ],
  },
];

// ---------------------------------------------------------------------------
// LESSON 17 - Урок 17: ない-форма, обязанности и запреты
// ---------------------------------------------------------------------------
export const lesson17Vocabulary = [
  // Verbs (порядок по учебнику)
  { japanese: "おぼえます", romaji: "oboemasu", russian: "помнить, запоминать", type: "гл. II", kanji: "覚えます" },
  { japanese: "わすれます", romaji: "wasuremasu", russian: "забывать", type: "гл. II", kanji: "忘れます" },
  { japanese: "なくします", romaji: "nakushimasu", russian: "терять", type: "гл. I" },
  { japanese: "はらいます", romaji: "haraimasu", russian: "платить (деньги)", type: "гл. I", kanji: "払います" },
  { japanese: "かえします", romaji: "kaeshimasu", russian: "возвращать", type: "гл. I", kanji: "返します" },
  { japanese: "でかけます", romaji: "dekakemasu", russian: "выходить, отправляться (из дома куда-либо)", type: "гл. II", kanji: "出かけます" },
  { japanese: "ぬぎます", romaji: "nugimasu", russian: "снимать (одежду, обувь)", type: "гл. I", kanji: "脱ぎます" },
  { japanese: "もっていきます", romaji: "motte ikimasu", russian: "уносить", type: "гл. I", kanji: "持って行きます" },
  { japanese: "もってきます", romaji: "motte kimasu", russian: "приносить", type: "гл. III", kanji: "持って来ます" },
  { japanese: "しんぱいします", romaji: "shinpai shimasu", russian: "волноваться, беспокоиться", type: "гл. III", kanji: "心配します" },
  { japanese: "ざんぎょうします", romaji: "zangyou shimasu", russian: "работать сверхурочно", type: "гл. III", kanji: "残業します" },
  { japanese: "しゅっちょうします", romaji: "shucchou shimasu", russian: "уезжать в командировку", type: "гл. III", kanji: "出張します" },
  { japanese: "のみます [くすりを〜]", romaji: "nomimasu [kusuri wo ~]", russian: "принимать [лекарство]", type: "гл. I", kanji: "飲みます [薬を〜]" },
  { japanese: "はいります [おふろに〜]", romaji: "hairimasu [ofuro ni ~]", russian: "принимать [ванну]", type: "гл. I", kanji: "入ります [お風呂に〜]" },
  // な-adjectives
  { japanese: "たいせつ[な]", romaji: "taisetsu [na]", russian: "важный, ценный, требующий бережного отношения", kanji: "大切[な]" },
  { japanese: "だいじょうぶ[な]", romaji: "daijoubu [na]", russian: "всё в порядке, ничего", kanji: "大丈夫[な]" },
  // い-adjective
  { japanese: "あぶない", romaji: "abunai", russian: "опасный", kanji: "危ない" },
  // Nouns
  { japanese: "きんえん", romaji: "kin-en", russian: "Не курить! (запрет курения)", kanji: "禁煙" },
  { japanese: "[けんこう]ほけんしょう", romaji: "[kenkou] hokenshou", russian: "свидетельство о медицинском страховании", kanji: "[健康]保険証" },
  { japanese: "ねつ", romaji: "netsu", russian: "жар, повышенная температура", kanji: "熱" },
  { japanese: "びょうき", romaji: "byouki", russian: "болезнь", kanji: "病気" },
  { japanese: "くすり", romaji: "kusuri", russian: "лекарство", kanji: "薬" },
  { japanese: "[お]ふろ", romaji: "[o]furo", russian: "ванна", kanji: "[お]風呂" },
  { japanese: "うわぎ", romaji: "uwagi", russian: "пиджак, жакет", kanji: "上着" },
  { japanese: "したぎ", romaji: "shitagi", russian: "нижнее бельё", kanji: "下着" },
  // Time expressions
  { japanese: "に、さんにち", romaji: "ni, san nichi", russian: "2-3 дня; несколько дней", kanji: "2、3日" },
  { japanese: "に、さん〜", romaji: "ni, san ~", russian: "немного ~; 2-3 ~ (счётный суффикс)", kanji: "2、3〜" },
  { japanese: "〜までに", romaji: "~made ni", russian: "до ~ (крайний срок, предел во времени)" },
  { japanese: "ですから", romaji: "desu kara", russian: "поэтому" },
  // 会話
  { japanese: "どう しましたか。", romaji: "dou shimashita ka.", russian: "Что (с вами) случилось?" },
  { japanese: "のど", romaji: "nodo", russian: "горло", kanji: "喉" },
  { japanese: "[〜が]いたいです。", romaji: "[~ ga] itai desu.", russian: "(у кого) болит [~].", kanji: "[〜が]痛いです。" },
  { japanese: "かぜ", romaji: "kaze", russian: "простуда, ОРЗ", kanji: "風邪" },
  { japanese: "それから", romaji: "sore kara", russian: "и ещё; кроме того" },
  { japanese: "おだいじに。", romaji: "odaiji ni.", russian: "Берегите себя! Выздоравливайте!", kanji: "お大事に。" },
];

export const lesson17Grammar = [
  {
    pattern: "ない-форма глаголов (образование)",
    patternJp: "V nai-form (formation)",
    meaning: "как образовать ない-форму глаголов",
    explanation: "Группа I (окончание ます-формы → ない-форма):\n〜います → 〜わない　　〜きます → 〜かない\n〜ぎます → 〜がない　　〜みます → 〜まない\n〜びます → 〜ばない　　〜にます → 〜なない\n〜ります → 〜らない　　〜ちます → 〜たない\n〜します → 〜さない\n\nГруппа II: 〜ます → 〜ない\n\nГруппа III: します → しない、来ます → 来ない（こない）",
    examples: [
      { jp: "書きます → 書かない", romaji: "kakimasu -> kakanai", ru: "писать (ない-форма)" },
      { jp: "読みます → 読まない", romaji: "yomimasu -> yomanai", ru: "читать (ない-форма)" },
      { jp: "食べます → 食べない", romaji: "tabemasu -> tabenai", ru: "есть (ない-форма)" },
      { jp: "します → しない", romaji: "shimasu -> shinai", ru: "делать (ない-форма)" },
    ],
  },
  {
    pattern: "ГЛАГ(ない-форма) ないでください",
    patternJp: "V-nai de kudasai",
    meaning: "пожалуйста, не делайте",
    explanation: "Вежливая просьба не совершать действие. ない-форма глагола + でください.",
    examples: [
      { jp: "ここで 写真を 撮らないでください。", romaji: "Koko de shashin wo toranaide kudasai.", ru: "Не фотографируйте здесь, пожалуйста." },
      { jp: "忘れないでください。", romaji: "Wasurenaide kudasai.", ru: "Не забудьте, пожалуйста." },
      { jp: "ここに 車を 止めないでください。", romaji: "Koko ni kuruma wo tomenaide kudasai.", ru: "Не паркуйтесь здесь, пожалуйста." },
    ],
  },
  {
    pattern: "ГЛАГ(ない-форма) なければ なりません",
    patternJp: "V-nakereba narimasen",
    meaning: "должен, обязан (сделать)",
    explanation: "Выражение обязанности, долга. ない -> なければなりません. Буквально: «если не сделать, не пойдёт».",
    examples: [
      { jp: "薬を 飲まなければ なりません。", romaji: "Kusuri wo nomanakereba narimasen.", ru: "Нужно принять лекарство." },
      { jp: "あした 6時に 起きなければ なりません。", romaji: "Ashita rokuji ni okinakereba narimasen.", ru: "Завтра нужно встать в 6 часов." },
      { jp: "レポートを 書かなければ なりません。", romaji: "Repooto wo kakanakereba narimasen.", ru: "Нужно написать отчёт." },
    ],
  },
  {
    pattern: "ГЛАГ(ない-форма) なくても いいです",
    patternJp: "V-nakutemo ii desu",
    meaning: "можно не делать, не обязательно",
    explanation: "Выражение необязательности. ない -> なくてもいいです. Буквально: «даже если не сделать, всё равно хорошо».",
    examples: [
      { jp: "あした 来なくても いいです。", romaji: "Ashita konakutemo ii desu.", ru: "Завтра можно не приходить." },
      { jp: "靴を 脱がなくても いいです。", romaji: "Kutsu wo nuganakutemo ii desu.", ru: "Обувь можно не снимать." },
      { jp: "全部 覚えなくても いいです。", romaji: "Zenbu oboenakutemo ii desu.", ru: "Всё запоминать не обязательно." },
    ],
  },
  {
    pattern: "ГЛАГ(て-форма) は いけません",
    patternJp: "V-te wa ikemasen",
    meaning: "нельзя, запрещается делать",
    explanation: "Выражение запрета. Строже, чем 〜ないでください. Используется в правилах и объявлениях.",
    examples: [
      { jp: "ここで たばこを 吸っては いけません。", romaji: "Koko de tabako wo sutte wa ikemasen.", ru: "Здесь нельзя курить." },
      { jp: "教室で 食べては いけません。", romaji: "Kyoushitsu de tabete wa ikemasen.", ru: "В классе нельзя есть." },
      { jp: "この 部屋に 入っては いけません。", romaji: "Kono heya ni haitte wa ikemasen.", ru: "В эту комнату входить запрещено." },
    ],
  },
];

// ---------------------------------------------------------------------------
// LESSON 18 - Урок 18: Словарная форма, способности, хобби
// ---------------------------------------------------------------------------
export const lesson18Vocabulary = [
  // Verbs (порядок по учебнику; できます — 1-е слово!)
  { japanese: "できます", romaji: "dekimasu", russian: "быть в состоянии, мочь, уметь", type: "гл. II" },
  { japanese: "あらいます", romaji: "araimasu", russian: "мыть, стирать", type: "гл. I", kanji: "洗います" },
  { japanese: "ひきます", romaji: "hikimasu", russian: "играть (на музыкальных инструментах)", type: "гл. I", kanji: "弾きます" },
  { japanese: "うたいます", romaji: "utaimasu", russian: "петь", type: "гл. I", kanji: "歌います" },
  { japanese: "あつめます", romaji: "atsumemasu", russian: "собирать, коллекционировать", type: "гл. II", kanji: "集めます" },
  { japanese: "すてます", romaji: "sutemasu", russian: "выбрасывать", type: "гл. II", kanji: "捨てます" },
  { japanese: "かえます", romaji: "kaemasu", russian: "менять, обменивать", type: "гл. II", kanji: "換えます" },
  { japanese: "うんてんします", romaji: "unten shimasu", russian: "водить машину (и др. транспорт)", type: "гл. III", kanji: "運転します" },
  { japanese: "よやくします", romaji: "yoyaku shimasu", russian: "заказывать, бронировать", type: "гл. III", kanji: "予約します" },
  // Nouns
  { japanese: "ピアノ", romaji: "piano", russian: "пианино, рояль" },
  { japanese: "〜メートル", romaji: "~meetoru", russian: "~ метров" },
  { japanese: "げんきん", romaji: "genkin", russian: "наличные деньги", kanji: "現金" },
  { japanese: "しゅみ", romaji: "shumi", russian: "хобби, увлечение", kanji: "趣味" },
  { japanese: "にっき", romaji: "nikki", russian: "дневник", kanji: "日記" },
  { japanese: "おいのり", romaji: "oinori", russian: "молитва (~をします молиться)", kanji: "お祈り" },
  { japanese: "かちょう", romaji: "kachou", russian: "начальник отдела", kanji: "課長" },
  { japanese: "ぶちょう", romaji: "buchou", russian: "начальник департамента", kanji: "部長" },
  { japanese: "しゃちょう", romaji: "shachou", russian: "президент компании", kanji: "社長" },
  { japanese: "どうぶつ", romaji: "doubutsu", russian: "животное", kanji: "動物" },
  { japanese: "うま", romaji: "uma", russian: "лошадь", kanji: "馬" },
  { japanese: "インターネット", romaji: "intaanetto", russian: "Интернет" },
  // 会話
  { japanese: "とくに", romaji: "toku ni", russian: "особенно", kanji: "特に" },
  { japanese: "へえ", romaji: "hee", russian: "Да?! (удивление)" },
  { japanese: "それはおもしろいですね。", romaji: "sore wa omoshiroi desu ne.", russian: "Это, вероятно, интересно." },
  { japanese: "なかなか", romaji: "nakanaka", russian: "не легко, не просто, никак (с отриц.)" },
  { japanese: "ほんとうですか。", romaji: "hontou desu ka.", russian: "В самом деле?" },
  { japanese: "ぜひ", romaji: "zehi", russian: "обязательно, непременно" },
];

export const lesson18Grammar = [
  {
    pattern: "Словарная форма глаголов (辞書形)",
    patternJp: "V jisho-kei (dictionary form)",
    meaning: "как образовать словарную (базовую) форму глаголов",
    explanation: "Группа I (ます-форма → словарная):\n〜います → 〜う　　〜きます → 〜く\n〜ぎます → 〜ぐ　　〜みます → 〜む\n〜びます → 〜ぶ　　〜にます → 〜ぬ\n〜ります → 〜る　　〜ちます → 〜つ\n〜します → 〜す\n\nГруппа II: 〜ます → 〜る\n\nГруппа III: します → する、来ます → 来る（くる）",
    examples: [
      { jp: "書きます → 書く", romaji: "kakimasu -> kaku", ru: "писать (словарная форма)" },
      { jp: "食べます → 食べる", romaji: "tabemasu -> taberu", ru: "есть (словарная форма)" },
      { jp: "します → する", romaji: "shimasu -> suru", ru: "делать (словарная форма)" },
    ],
  },
  {
    pattern: "ГЛАГ(словарная) ことが できます",
    patternJp: "V (dict) koto ga dekimasu",
    meaning: "уметь, мочь (делать что-то)",
    explanation: "Выражение способности или возможности. Глагол в словарной форме + ことができます.",
    examples: [
      { jp: "ピアノを 弾く ことが できます。", romaji: "Piano wo hiku koto ga dekimasu.", ru: "Я умею играть на пианино." },
      { jp: "日本語を 話す ことが できますか。", romaji: "Nihongo wo hanasu koto ga dekimasu ka.", ru: "Вы можете говорить по-японски?" },
      { jp: "ここで 泳ぐ ことが できません。", romaji: "Koko de oyogu koto ga dekimasen.", ru: "Здесь нельзя плавать." },
    ],
  },
  {
    pattern: "趣味は ГЛАГ(словарная) ことです",
    patternJp: "Shumi wa V (dict) koto desu",
    meaning: "моё хобби -- (делать что-то)",
    explanation: "Номинализация глагола с помощью こと для описания хобби.",
    examples: [
      { jp: "趣味は 映画を 見る ことです。", romaji: "Shumi wa eiga wo miru koto desu.", ru: "Моё хобби -- смотреть фильмы." },
      { jp: "趣味は 音楽を 聞く ことです。", romaji: "Shumi wa ongaku wo kiku koto desu.", ru: "Моё хобби -- слушать музыку." },
      { jp: "趣味は 料理を する ことです。", romaji: "Shumi wa ryouri wo suru koto desu.", ru: "Моё хобби -- готовить." },
    ],
  },
  {
    pattern: "ГЛАГ(словарная) / СУЩ の + 前に、〜",
    patternJp: "V (dict) / N no + mae ni, ~",
    meaning: "перед тем как (сделать); до (чего-то)",
    explanation: "Глагол в словарной форме + 前に: перед тем как... Существительное + の前に: до...",
    examples: [
      { jp: "寝る 前に、本を 読みます。", romaji: "Neru mae ni, hon wo yomimasu.", ru: "Перед сном читаю книгу." },
      { jp: "食事の 前に、手を 洗います。", romaji: "Shokuji no mae ni, te wo araimasu.", ru: "Перед едой мою руки." },
      { jp: "日本へ 来る 前に、日本語を 勉強しました。", romaji: "Nihon e kuru mae ni, nihongo wo benkyou shimashita.", ru: "До приезда в Японию учил японский." },
    ],
  },
  {
    pattern: "ГЛАГ(словарная) のに 時間がかかります",
    patternJp: "V (dict) no ni jikan ga kakarimasu",
    meaning: "на то, чтобы сделать, уходит время",
    explanation: "のに — частица целевого назначения («для того чтобы»). Выражает количество времени, необходимого для действия.",
    examples: [
      { jp: "新幹線の チケットを 買うのに 20分 かかりました。", romaji: "Shinkansen no chiketto wo kau no ni nijuppun kakarimashita.", ru: "На покупку билета на синкансен ушло 20 минут." },
      { jp: "この 漢字を 覚えるのに 時間が かかります。", romaji: "Kono kanji wo oboeru no ni jikan ga kakarimasu.", ru: "На запоминание этого кандзи уходит время." },
    ],
  },
];

// ---------------------------------------------------------------------------
// LESSON 19 - Урок 19: た-форма, опыт, перечисление действий
// ---------------------------------------------------------------------------
export const lesson19Vocabulary = [
  // Verbs (порядок по учебнику)
  { japanese: "のぼります", romaji: "noborimasu", russian: "подниматься, взбираться, восходить", type: "гл. I", kanji: "登ります" },
  { japanese: "とまります [ホテルに〜]", romaji: "tomarimasu [hoteru ni ~]", russian: "останавливаться на ночь [в гостинице]", type: "гл. I", kanji: "泊まります [ホテルに〜]" },
  { japanese: "そうじします", romaji: "souji shimasu", russian: "делать уборку, убирать (комнату)", type: "гл. III", kanji: "掃除します" },
  { japanese: "せんたくします", romaji: "sentaku shimasu", russian: "стирать (одежду, бельё)", type: "гл. III", kanji: "洗濯します" },
  { japanese: "なります", romaji: "narimasu", russian: "становиться; наступить (о временах года)", type: "гл. I" },
  // い-adjectives
  { japanese: "ねむい", romaji: "nemui", russian: "сонный", kanji: "眠い" },
  { japanese: "つよい", romaji: "tsuyoi", russian: "сильный", kanji: "強い" },
  { japanese: "よわい", romaji: "yowai", russian: "слабый", kanji: "弱い" },
  // Nouns
  { japanese: "れんしゅう", romaji: "renshuu", russian: "упражнение (~をします заниматься, упражняться)", kanji: "練習" },
  { japanese: "ゴルフ", romaji: "gorufu", russian: "гольф (~をします играть в гольф)" },
  { japanese: "すもう", romaji: "sumou", russian: "борьба сумо (~をします заниматься сумо)", kanji: "相撲" },
  { japanese: "おちゃ", romaji: "ocha", russian: "чайная церемония", kanji: "お茶" },
  { japanese: "ひ", romaji: "hi", russian: "день, дата", kanji: "日" },
  { japanese: "ちょうし", romaji: "choushi", russian: "состояние, настроение", kanji: "調子" },
  // Adverbs & expressions
  { japanese: "いちど", romaji: "ichido", russian: "один раз, однажды", kanji: "一度" },
  { japanese: "いちども", romaji: "ichido mo", russian: "ни разу, никогда (с отрицанием)", kanji: "一度も" },
  { japanese: "だんだん", romaji: "dandan", russian: "постепенно" },
  { japanese: "もうすぐ", romaji: "mou sugu", russian: "скоро" },
  { japanese: "おかげさまで", romaji: "okage sama de", russian: "Спасибо за заботу. (Благодаря вашей заботе)" },
  { japanese: "でも", romaji: "demo", russian: "но; однако" },
  // 会話
  { japanese: "かんぱい", romaji: "kanpai", russian: "За ваше здоровье! Канпай! (тост)", kanji: "乾杯" },
  { japanese: "ダイエット", romaji: "daietto", russian: "диета (~をします сидеть на диете)" },
  { japanese: "むり[な]", romaji: "muri [na]", russian: "чрезмерный, бессмысленный; невозможный", kanji: "無理[な]" },
  { japanese: "からだにいい", romaji: "karada ni ii", russian: "полезный для здоровья", kanji: "体にいい" },
];

export const lesson19Grammar = [
  {
    pattern: "た-форма глаголов (образование)",
    patternJp: "V ta-form (formation)",
    meaning: "как образовать た-форму глаголов (прошедшее простое)",
    explanation: "Образуется так же, как て-форма, только て→た и で→だ.\n\nГруппа I:\n〜いて → 〜いた　　〜いで → 〜いだ\n〜んで → 〜んだ　　〜って → 〜った\n〜して → 〜した\n\nГруппа II: 〜て → 〜た\n\nГруппа III: して → した、来て → 来た（きた）",
    examples: [
      { jp: "書きます → 書いた", romaji: "kakimasu -> kaita", ru: "писать (た-форма)" },
      { jp: "読みます → 読んだ", romaji: "yomimasu -> yonda", ru: "читать (та-форма)" },
      { jp: "食べます → 食べた", romaji: "tabemasu -> tabeta", ru: "есть (та-форма)" },
      { jp: "行きます → 行った", romaji: "ikimasu -> itta", ru: "идти (та-форма)" },
    ],
  },
  {
    pattern: "ГЛАГ(た-форма) ことが あります",
    patternJp: "V-ta koto ga arimasu",
    meaning: "иметь опыт (делал когда-то)",
    explanation: "Выражение жизненного опыта. «Когда-либо делал». Отрицание: 〜たことがありません. Обычно с наречием 一度 (один раз), 何度も (много раз), 一度も〜ありません (ни разу).",
    examples: [
      { jp: "馬に 乗った ことが あります。", romaji: "Uma ni notta koto ga arimasu.", ru: "Я когда-то ездил верхом на лошади." },
      { jp: "富士山に 登った ことが ありますか。-- いいえ、一度も ありません。", romaji: "Fujisan ni nobotta koto ga arimasu ka. -- Iie, ichido mo arimasen.", ru: "Вы поднимались на Фудзи? -- Нет, ни разу." },
      { jp: "日本の お酒を 飲んだ ことが あります。", romaji: "Nihon no osake wo nonda koto ga arimasu.", ru: "Я пробовал японское сакэ." },
    ],
  },
  {
    pattern: "ГЛАГ1(た-форма) り、ГЛАГ2(た-форма) りします",
    patternJp: "V1-tari, V2-tari shimasu",
    meaning: "делать такие вещи, как V1, V2, и т.д.",
    explanation: "Перечисление нескольких действий (не исчерпывающий список). Подразумевается: «и тому подобное». Время определяется формой します/しました.",
    examples: [
      { jp: "日曜日は 映画を 見たり、買い物に 行ったり します。", romaji: "Nichiyoubi wa eiga wo mitari, kaimono ni ittari shimasu.", ru: "В воскресенье смотрю фильмы, хожу за покупками и т.д." },
      { jp: "冬休みは スキーを したり、温泉に 行ったり しました。", romaji: "Fuyuyasumi wa sukii wo shitari, onsen ni ittari shimashita.", ru: "На зимних каникулах катался на лыжах, ездил на онсэн и т.п." },
      { jp: "休みの日は 掃除したり、洗濯したり します。", romaji: "Yasumi no hi wa souji shitari, sentaku shitari shimasu.", ru: "В выходные делаю уборку, стираю и т.д." },
    ],
  },
  {
    pattern: "ПРИЛ(〜く) / な-ПРИЛ(〜に) なります",
    patternJp: "i-ADJ (-ku) / na-ADJ (-ni) narimasu",
    meaning: "становиться (каким-то)",
    explanation: "い-прилагательное: убрать い, добавить くなります. な-прилагательное: убрать な, добавить になります. Существительное: СУЩ になります.",
    examples: [
      { jp: "日本語が 上手に なりました。", romaji: "Nihongo ga jouzu ni narimashita.", ru: "Мой японский стал лучше." },
      { jp: "もう 暖かく なりましたね。", romaji: "Mou atatakaku narimashita ne.", ru: "Уже потеплело, правда?" },
      { jp: "子どもが 大きく なりました。", romaji: "Kodomo ga ookiku narimashita.", ru: "Ребёнок вырос." },
    ],
  },
];

// ---------------------------------------------------------------------------
// LESSON 20 - Урок 20: Простая (ふつう) форма, цитирование, мнение
// ---------------------------------------------------------------------------
export const lesson20Vocabulary = [
  // Verbs (порядок по учебнику)
  { japanese: "いります [ビザが〜]", romaji: "irimasu [biza ga ~]", russian: "быть нужным, требоваться; требуется [виза]", type: "гл. I", kanji: "要ります [ビザが〜]" },
  { japanese: "しらべます", romaji: "shirabemasu", russian: "узнавать, изучать, расследовать, проверять", type: "гл. II", kanji: "調べます" },
  { japanese: "しゅうりします", romaji: "shuuri shimasu", russian: "исправлять, чинить, ремонтировать", type: "гл. III", kanji: "修理します" },
  // Pronouns (мужская речь)
  { japanese: "ぼく", romaji: "boku", russian: "я (муж.; разг. эквивалент わたし)", kanji: "僕" },
  { japanese: "きみ", romaji: "kimi", russian: "ты (муж.; разг. эквивалент あなた)", kanji: "君" },
  { japanese: "〜くん", romaji: "~kun", russian: "дружочек, г-н (суффикс для мальч./младших; эквивалент 〜さん)", kanji: "〜君" },
  // Colloquial
  { japanese: "うん", romaji: "un", russian: "да, ага (разг. эквивалент はい)" },
  { japanese: "ううん", romaji: "uun", russian: "нет (разг. эквивалент いいえ)" },
  // Nouns
  { japanese: "ことば", romaji: "kotoba", russian: "слово; язык (японский, русский и т.п.)", kanji: "言葉" },
  { japanese: "きもの", romaji: "kimono", russian: "кимоно", kanji: "着物" },
  { japanese: "ビザ", romaji: "biza", russian: "виза" },
  { japanese: "はじめ", romaji: "hajime", russian: "начало", kanji: "初め" },
  { japanese: "おわり", romaji: "owari", russian: "конец", kanji: "終わり" },
  // Demonstratives (разговорные)
  { japanese: "こっち", romaji: "kocchi", russian: "здесь, сюда (разг. эквивалент こちら)" },
  { japanese: "そっち", romaji: "socchi", russian: "там, туда (разг. эквивалент そちら)" },
  { japanese: "あっち", romaji: "acchi", russian: "там, туда (разг. эквивалент あちら)" },
  { japanese: "どっち", romaji: "docchi", russian: "который из двух, где (разг. эквивалент どちら)" },
  // Particles & expressions
  { japanese: "みんなで", romaji: "minna de", russian: "все вместе (только в речи о людях)" },
  { japanese: "〜けど", romaji: "~kedo", russian: "~, но (разг. эквивалент противит. частицы が)" },
  { japanese: "おなかがいっぱいです", romaji: "onaka ga ippai desu", russian: "быть сытым (дословно: полный живот)" },
  // 会話
  { japanese: "よかったら", romaji: "yokattara", russian: "если не возражаете; если хотите" },
  { japanese: "いろいろ", romaji: "iroiro", russian: "по-всякому, разнообразно (наречие)" },
];

export const lesson20Grammar = [
  {
    pattern: "Простая (ふつう) форма — обзор",
    patternJp: "futsuu-kei (plain form) overview",
    meaning: "простая (неформальная) форма глаголов, прилагательных, существительных",
    explanation: "Глаголы: утв. наст. -- словарная форма (行く), отриц. наст. -- ない-форма (行かない), утв. прош. -- た-форма (行った), отриц. прош. -- なかった (行かなかった). い-ПРИЛ: 高い / 高くない / 高かった / 高くなかった. な-ПРИЛ: 静かだ / 静かじゃない / 静かだった / 静かじゃなかった. СУЩ: 学生だ / 学生じゃない / 学生だった / 学生じゃなかった.",
    examples: [
      { jp: "あした 行く。（= 行きます）", romaji: "Ashita iku. (= ikimasu)", ru: "Завтра пойду. (простая форма)" },
      { jp: "きのう 暑かった。（= 暑かったです）", romaji: "Kinou atsukatta. (= atsukatta desu)", ru: "Вчера было жарко. (простая форма)" },
      { jp: "ここは 静かだ。（= 静かです）", romaji: "Koko wa shizuka da. (= shizuka desu)", ru: "Здесь тихо. (простая форма)" },
    ],
  },
  {
    pattern: "Простая форма + と思います",
    patternJp: "plain form + to omoimasu",
    meaning: "я думаю, что...",
    explanation: "Выражение мнения или предположения. Глагол/прилагательное/существительное в простой форме + と思います. В вопросе: 〜と思いますか.",
    examples: [
      { jp: "あした 雨が 降ると 思います。", romaji: "Ashita ame ga furu to omoimasu.", ru: "Я думаю, завтра пойдёт дождь." },
      { jp: "日本語は おもしろいと 思います。", romaji: "Nihongo wa omoshiroi to omoimasu.", ru: "Я думаю, японский язык интересный." },
      { jp: "ミラーさんは 来ないと 思います。", romaji: "Miraa-san wa konai to omoimasu.", ru: "Я думаю, г-н Миллер не придёт." },
    ],
  },
  {
    pattern: "Простая форма + と言いました",
    patternJp: "plain form + to iimashita",
    meaning: "кто-то сказал, что...",
    explanation: "Передача чужих слов. Частица と используется как в прямой речи (「слова」と言いました), так и в косвенной (простая форма + と言いました). Для な-прилагательных и существительных: だ перед と.",
    examples: [
      { jp: "ミラーさんは 「こんにちは」と 言いました。", romaji: "Miraa-san wa 'konnichiwa' to iimashita.", ru: "Г-н Миллер сказал «здравствуйте»." },
      { jp: "先生は あした テストが あると 言いました。", romaji: "Sensei wa ashita tesuto ga aru to iimashita.", ru: "Учитель сказал, что завтра будет тест." },
      { jp: "カリナさんは 日本の 生活は 楽しいと 言いました。", romaji: "Karina-san wa Nihon no seikatsu wa tanoshii to iimashita.", ru: "Карина сказала, что жизнь в Японии весёлая." },
    ],
  },
  {
    pattern: "Простая форма + でしょう？",
    patternJp: "plain form + deshou?",
    meaning: "ведь..., не так ли?",
    explanation: "Вопрос-подтверждение, когда говорящий ожидает согласия собеседника.",
    examples: [
      { jp: "あした パーティーに 行くでしょう？", romaji: "Ashita paatii ni iku deshou?", ru: "Ты ведь пойдёшь завтра на вечеринку?" },
      { jp: "この 映画は おもしろかったでしょう？", romaji: "Kono eiga wa omoshirokatta deshou?", ru: "Фильм ведь был интересный, правда?" },
      { jp: "日本語の テストは 難しいでしょう？", romaji: "Nihongo no tesuto wa muzukashii deshou?", ru: "Тест по японскому ведь сложный, да?" },
    ],
  },
  {
    pattern: "Простая форма в неформальной речи",
    patternJp: "plain form in casual speech",
    meaning: "использование простой формы в повседневном общении",
    explanation: "В неформальной речи (с друзьями, близкими) вместо вежливых форм (~ます, ~です) используются простые формы. Вопрос: повышение интонации (без か). Частица の/んだ добавляется для объяснения/уточнения.",
    examples: [
      { jp: "コーヒー、飲む？ -- うん、飲む。", romaji: "Koohii, nomu? -- Un, nomu.", ru: "Кофе будешь? -- Ага, буду." },
      { jp: "あした 暇？ -- ううん、忙しい。", romaji: "Ashita hima? -- Uun, isogashii.", ru: "Завтра свободен? -- Не-а, занят." },
      { jp: "どうしたの？ -- ちょっと 疲れた。", romaji: "Doushita no? -- Chotto tsukareta.", ru: "Что случилось? -- Немного устал." },
    ],
  },
];

// ---------------------------------------------------------------------------
// Combined exports
// ---------------------------------------------------------------------------
export const allLessons16to20 = {
  16: { vocabulary: lesson16Vocabulary, grammar: lesson16Grammar },
  17: { vocabulary: lesson17Vocabulary, grammar: lesson17Grammar },
  18: { vocabulary: lesson18Vocabulary, grammar: lesson18Grammar },
  19: { vocabulary: lesson19Vocabulary, grammar: lesson19Grammar },
  20: { vocabulary: lesson20Vocabulary, grammar: lesson20Grammar },
};
