// =============================================================================
// Minna no Nihongo Lessons 23-24: Vocabulary & Grammar
// Extracted from: Минна но Нихонго (РУССКИЙ).pdf
// =============================================================================

// ---------------------------------------------------------------------------
// LESSON 23 - Урок 23: Условные формы (~とき, ~と)
// ---------------------------------------------------------------------------
export const lesson23Vocabulary = [
  // Verbs
  { japanese: "ききます [せんせいに~]", romaji: "kikimasu [sensei ni~]", russian: "спрашивать [у преподавателя]", type: "гл. I", kanji: "聞きます [先生に~]" },
  { japanese: "まわします", romaji: "mawashimasu", russian: "поворачивать, вертеть (руль, ручку и т.п.)", type: "гл. I", kanji: "回します" },
  { japanese: "ひきます", romaji: "hikimasu", russian: "тянуть", type: "гл. I", kanji: "引きます" },
  { japanese: "かえます", romaji: "kaemasu", russian: "менять, изменять", type: "гл. II", kanji: "変えます" },
  { japanese: "さわります [ドアに~]", romaji: "sawarimasu [doa ni~]", russian: "трогать, прикасаться [к двери]", type: "гл. I", kanji: "触ります [ドアに~]" },
  { japanese: "でます [おつりが~]", romaji: "demasu [otsuri ga~]", russian: "выходить, появляться; появится [сдача]", type: "гл. II", kanji: "出ます [お釣りが~]" },
  { japanese: "あるきます", romaji: "arukimasu", russian: "идти, ходить пешком", type: "гл. I", kanji: "歩きます" },
  { japanese: "わたります [はしを~]", romaji: "watarimasu [hashi wo~]", russian: "переходить [по мосту]", type: "гл. I", kanji: "渡ります [橋を~]" },
  { japanese: "まがります [みぎへ~]", romaji: "magarimasu [migi e~]", russian: "поворачивать [направо]", type: "гл. I", kanji: "曲がります [右へ~]" },
  // Adjectives
  { japanese: "さびしい", romaji: "sabishii", russian: "грустный, одинокий", kanji: "寂しい" },
  // Nouns
  { japanese: "[お]ゆ", romaji: "[o]yu", russian: "горячая вода, кипяток", kanji: "[お]湯" },
  { japanese: "おと", romaji: "oto", russian: "звук", kanji: "音" },
  { japanese: "サイズ", romaji: "saizu", russian: "размер" },
  { japanese: "こしょう", romaji: "koshou", russian: "неисправность, авария (~します ломаться)", kanji: "故障" },
  { japanese: "みち", romaji: "michi", russian: "дорога, улица", kanji: "道" },
  { japanese: "こうさてん", romaji: "kousaten", russian: "перекрёсток", kanji: "交差点" },
  { japanese: "しんごう", romaji: "shingou", russian: "светофор", kanji: "信号" },
  { japanese: "かど", romaji: "kado", russian: "угол (внешний, угол дома и т.п.)", kanji: "角" },
  { japanese: "はし", romaji: "hashi", russian: "мост", kanji: "橋" },
  { japanese: "ちゅうしゃじょう", romaji: "chuushajou", russian: "автостоянка, парковка", kanji: "駐車場" },
  { japanese: "たてもの", romaji: "tatemono", russian: "здание", kanji: "建物" },
  // Adverbs / suffixes
  { japanese: "なんかいも", romaji: "nankai mo", russian: "много раз, не раз", kanji: "何回も" },
  { japanese: "~め", romaji: "~me", russian: "(какой)-й по счёту (суффикс порядковых числительных)", kanji: "~目" },
  // Expressions
  { japanese: "みちを おしえてください。", romaji: "Michi wo oshiete kudasai.", russian: "Подскажите дорогу, пожалуйста.", kanji: "道を 教えてください。" },
]

export const lesson23Grammar = [
  {
    pattern: "ГЛАГ(словарная форма) + とき (когда делаю / буду делать)",
    patternJp: "V (dictionary form) + toki",
    meaning: "когда делаю / буду делать (до наступления действия)",
    explanation: "Словарная форма + とき указывает на то, что действие в придаточном ещё НЕ совершено на момент действия главного предложения. Используется, когда говорящий описывает ситуацию до наступления события.",
    examples: [
      { jp: "国へ 帰る とき、かばんを 買いました。", romaji: "Kuni e kaeru toki, kaban wo kaimashita.", ru: "Когда я ехал (=собирался ехать) на родину, купил чемодан." },
      { jp: "図書館で 本を 借りる とき、カードが いります。", romaji: "Toshokan de hon wo kariru toki, kaado ga irimasu.", ru: "Когда берёшь книгу в библиотеке, нужна карточка." },
      { jp: "寝る とき、「おやすみなさい」と 言います。", romaji: "Neru toki, 'oyasuminasai' to iimasu.", ru: "Когда ложишься спать, говоришь «спокойной ночи»." },
    ],
  },
  {
    pattern: "ГЛАГ(た-форма) + とき (когда сделал / после того как)",
    patternJp: "V (ta-form) + toki",
    meaning: "когда сделал / после того как сделал (после завершения действия)",
    explanation: "Прошедшая форма + とき указывает на то, что действие в придаточном уже СОВЕРШЕНО на момент действия главного предложения. Важно различать со словарной формой + とき.",
    examples: [
      { jp: "国へ 帰った とき、かばんを 買いました。", romaji: "Kuni e kaetta toki, kaban wo kaimashita.", ru: "Когда я вернулся (=уже приехал) на родину, купил чемодан." },
      { jp: "辞書を 使った とき、棚に 返してください。", romaji: "Jisho wo tsukatta toki, tana ni kaeshite kudasai.", ru: "Когда воспользуетесь словарём, верните его на полку." },
      { jp: "若かった とき、よく 旅行しました。", romaji: "Wakakatta toki, yoku ryokou shimashita.", ru: "Когда я был молодым, часто путешествовал." },
    ],
  },
  {
    pattern: "い-ПРИЛ / な-ПРИЛ な / СУЩ の + とき",
    patternJp: "i-adj / na-adj na / N no + toki",
    meaning: "когда (прилагательное/существительное)",
    explanation: "Для прилагательных и существительных: い-прилагательное напрямую + とき; な-прилагательное + な + とき; существительное + の + とき. Прошедшее время: い → かったとき, な → だったとき.",
    examples: [
      { jp: "寂しい とき、友達に 電話します。", romaji: "Sabishii toki, tomodachi ni denwa shimasu.", ru: "Когда мне одиноко, звоню друзьям." },
      { jp: "暇な とき、映画を 見ます。", romaji: "Hima na toki, eiga wo mimasu.", ru: "Когда свободен, смотрю фильмы." },
      { jp: "子供の とき、よく 公園で 遊びました。", romaji: "Kodomo no toki, yoku kouen de asobimashita.", ru: "В детстве (когда был ребёнком) часто играл в парке." },
    ],
  },
  {
    pattern: "ГЛАГ(словарная форма) + と (если..., то обязательно)",
    patternJp: "V (dictionary form) + to",
    meaning: "если / когда (автоматическое/естественное следствие)",
    explanation: "Конструкция ~と используется для описания автоматического, закономерного или естественного результата. Если делаешь A, то обязательно происходит B. Используется для описания дорог, инструкций, законов природы. НЕ используется для просьб, приглашений, намерений.",
    examples: [
      { jp: "この ボタンを 押すと、電気が つきます。", romaji: "Kono botan wo osu to, denki ga tsukimasu.", ru: "Если нажать эту кнопку, загорится свет." },
      { jp: "まっすぐ 行くと、駅が あります。", romaji: "Massugu iku to, eki ga arimasu.", ru: "Если пойти прямо, будет станция." },
      { jp: "春に なると、花が 咲きます。", romaji: "Haru ni naru to, hana ga sakimasu.", ru: "Когда наступает весна, расцветают цветы." },
    ],
  },
  {
    pattern: "ГЛАГ(て-форма) + も (даже если)",
    patternJp: "V-te mo / i-adj -kute mo / na-adj de mo",
    meaning: "даже если / даже когда / несмотря на то, что",
    explanation: "Конструкция ~ても выражает значение «даже если / несмотря на». Глагол: て-форма + も. い-прилагательное: ~くても. な-прилагательное: ~でも. Существительное: ~でも. Отрицание: ~なくても (даже если не...).",
    examples: [
      { jp: "雨が 降っても、サッカーを します。", romaji: "Ame ga futte mo, sakkaa wo shimasu.", ru: "Даже если пойдёт дождь, буду играть в футбол." },
      { jp: "安くても、買いません。", romaji: "Yasukute mo, kaimasen.", ru: "Даже если дёшево, не куплю." },
      { jp: "日曜日でも、働きます。", romaji: "Nichiyoubi de mo, hatarakimasu.", ru: "Даже в воскресенье работаю." },
    ],
  },
];

// ---------------------------------------------------------------------------
// LESSON 24 - Урок 24: Давать и получать действия (てくれる / てもらう / てあげる)
// ---------------------------------------------------------------------------
export const lesson24Vocabulary = [
  // Verbs
  { japanese: "くれます", romaji: "kuremasu", russian: "давать (мне / моей группе)", type: "гл. II" },
  { japanese: "なおします", romaji: "naoshimasu", russian: "исправлять, чинить", type: "гл. I", kanji: "直します" },
  { japanese: "つれていきます", romaji: "tsurete ikimasu", russian: "брать с собой, идти вместе с кем-то", type: "гл. I", kanji: "連れて行きます" },
  { japanese: "つれてきます", romaji: "tsurete kimasu", russian: "приводить с собой, приходить с кем-то", type: "гл. III", kanji: "連れて来ます" },
  { japanese: "おくります [ひとを~]", romaji: "okurimasu [hito wo~]", russian: "провожать [человека] (до станции и т.п.)", type: "гл. I", kanji: "送ります [人を~]" },
  { japanese: "しょうかいします", romaji: "shoukai shimasu", russian: "представлять, знакомить", type: "гл. III", kanji: "紹介します" },
  { japanese: "あんないします", romaji: "annai shimasu", russian: "показывать, знакомить (с чем-либо)", type: "гл. III", kanji: "案内します" },
  { japanese: "せつめいします", romaji: "setsumei shimasu", russian: "объяснять", type: "гл. III", kanji: "説明します" },
  // Nouns
  { japanese: "おじいさん/おじいちゃん", romaji: "ojiisan/ojiichan", russian: "дедушка, пожилой мужчина" },
  { japanese: "おばあさん/おばあちゃん", romaji: "obaasan/obaachan", russian: "бабушка, пожилая женщина" },
  { japanese: "じゅんび", romaji: "junbi", russian: "подготовка (~します готовить)", kanji: "準備" },
  { japanese: "ひっこし", romaji: "hikkoshi", russian: "переезд (~します переезжать на новую квартиру)", kanji: "引っ越し" },
  { japanese: "[お]かし", romaji: "[o]kashi", russian: "сладости, конфеты", kanji: "[お]菓子" },
  { japanese: "ホームステイ", romaji: "hoomusutei", russian: "проживание в принимающей семье" },
  { japanese: "ぜんぶ", romaji: "zenbu", russian: "всё (не употребляется по отношению к людям)", kanji: "全部" },
  { japanese: "じぶんで", romaji: "jibun de", russian: "(делать) самому", kanji: "自分で" },
  // 会話 expressions
  { japanese: "ほかに", romaji: "hoka ni", russian: "кроме того, что-нибудь ещё" },
]

export const lesson24Grammar = [
  {
    pattern: "кто が わたしに ГЛАГ(て-форма) + くれます",
    patternJp: "(person) ga watashi ni V-te kuremasu",
    meaning: "кто-то делает что-то для меня / моей группы",
    explanation: "Конструкция ~てくれます выражает, что кто-то совершает действие в мою пользу (или в пользу моей группы). Подчёркивает благодарность говорящего. Подлежащее — тот, кто делает; получатель — я или мои близкие (часто опускается).",
    examples: [
      { jp: "母が（わたしに）セーターを 作って くれました。", romaji: "Haha ga (watashi ni) seetaa wo tsukutte kuremashita.", ru: "Мама связала мне свитер." },
      { jp: "友達が 駅まで 迎えに 来て くれました。", romaji: "Tomodachi ga eki made mukae ni kite kuremashita.", ru: "Друг приехал встретить меня на станцию." },
      { jp: "山田さんが 日本語を 教えて くれます。", romaji: "Yamada-san ga nihongo wo oshiete kuremasu.", ru: "Г-н Ямада учит меня японскому." },
    ],
  },
  {
    pattern: "わたしは кому に ГЛАГ(て-форма) + もらいます",
    patternJp: "watashi wa (person) ni V-te moraimasu",
    meaning: "я получаю действие от кого-то (мне кто-то делает что-то)",
    explanation: "Конструкция ~てもらいます выражает, что я получаю пользу от чьего-то действия. Фокус на получателе (= на мне). Подлежащее — я; исполнитель обозначается частицей に. Часто подразумевает просьбу или договорённость.",
    examples: [
      { jp: "わたしは 友達に 引っ越しを 手伝って もらいました。", romaji: "Watashi wa tomodachi ni hikkoshi wo tetsudatte moraimashita.", ru: "Мне друг помог с переездом." },
      { jp: "わたしは 先生に 作文を 直して もらいました。", romaji: "Watashi wa sensei ni sakubun wo naoshite moraimashita.", ru: "Учитель исправил мне сочинение." },
      { jp: "わたしは 山田さんに 病院を 紹介して もらいました。", romaji: "Watashi wa Yamada-san ni byouin wo shoukai shite moraimashita.", ru: "Г-н Ямада посоветовал мне больницу." },
    ],
  },
  {
    pattern: "わたしは кому に ГЛАГ(て-форма) + あげます",
    patternJp: "watashi wa (person) ni V-te agemasu",
    meaning: "я делаю что-то для кого-то (в его пользу)",
    explanation: "Конструкция ~てあげます выражает, что я (или кто-то) делаю действие в пользу другого. Внимание: в повседневной речи может звучать покровительственно, поэтому используется осторожно, часто — о третьих лицах или о предложении помощи.",
    examples: [
      { jp: "わたしは 木村さんに 本を 貸して あげました。", romaji: "Watashi wa Kimura-san ni hon wo kashite agemashita.", ru: "Я одолжил г-ну Кимуре книгу." },
      { jp: "わたしは おばあさんの 荷物を 持って あげました。", romaji: "Watashi wa obaasan no nimotsu wo motte agemashita.", ru: "Я понёс бабушке сумку." },
      { jp: "田中さんは 友達に 空港を 案内して あげました。", romaji: "Tanaka-san wa tomodachi ni kuukou wo annai shite agemashita.", ru: "Г-н Танака показал другу аэропорт." },
    ],
  },
  {
    pattern: "ГЛАГ(て-форма) + いただけませんか",
    patternJp: "V-te itadakemasen ka",
    meaning: "не могли бы вы... (очень вежливая просьба)",
    explanation: "Самая вежливая форма просьбы. ~ていただけませんか — уважительная (keigo) форма от ~てもらえませんか. Используется по отношению к старшим, начальникам, незнакомым людям. Буквально: «не получу ли я от вас действие?».",
    examples: [
      { jp: "すみませんが、この 漢字の 読み方を 教えて いただけませんか。", romaji: "Sumimasen ga, kono kanji no yomikata wo oshiete itadakemasen ka.", ru: "Извините, не могли бы вы подсказать, как читается этот иероглиф?" },
      { jp: "ちょっと 荷物を 見て いただけませんか。", romaji: "Chotto nimotsu wo mite itadakemasen ka.", ru: "Не могли бы вы присмотреть за моим багажом?" },
      { jp: "ここに 名前を 書いて いただけませんか。", romaji: "Koko ni namae wo kaite itadakemasen ka.", ru: "Не могли бы вы написать здесь своё имя?" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Combined exports
// ---------------------------------------------------------------------------
export const allLessons23to24 = {
  23: { vocabulary: lesson23Vocabulary, grammar: lesson23Grammar },
  24: { vocabulary: lesson24Vocabulary, grammar: lesson24Grammar },
};
