import { useState, useCallback, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useXP } from '../hooks/useXP'
import { useProgress } from '../hooks/useProgress'
import { useIsMobile, useIsTablet } from '../hooks/useIsMobile'
import { useUnlockedLessons } from '../hooks/useUnlockedLessons'
import ShareResult from '../components/ShareResult'
import Confetti from '../components/Confetti'
import { getStoredJson, setStoredJson } from '../utils/localSettings'
import { prefersReducedMotion as getPrefersReducedMotion } from '../utils/motion'

const prefersReducedMotion = getPrefersReducedMotion()

const readingData = [
  {
    id: 1,
    lesson: 1,
    title: 'At the office',
    titleJp: 'かいしゃで',
    lines: [
      { speaker: 'A', jp: 'はじめまして。マイク・ミラーです。', romaji: 'Hajimemashite. Maiku Miraa desu.', ru: 'Приятно познакомиться. Я Майк Миллер.' },
      { speaker: 'B', jp: 'はじめまして。たなか よしおです。どうぞ よろしく。', romaji: 'Hajimemashite. Tanaka Yoshio desu. Douzo yoroshiku.', ru: 'Приятно познакомиться. Я Танака Ёсио. Рад знакомству.' },
      { speaker: 'A', jp: 'アメリカから きました。IMCの しゃいんです。', romaji: 'Amerika kara kimashita. IMC no shain desu.', ru: 'Я приехал из Америки. Я сотрудник компании IMC.' },
      { speaker: 'B', jp: 'そうですか。どうぞ よろしく おねがいします。', romaji: 'Sou desu ka. Douzo yoroshiku onegaishimasu.', ru: 'Вот как. Прошу вас, рад знакомству.' },
    ],
    questions: [
      { question: 'Where is Mike from?', questionJp: 'ミラーさんは どこから きましたか。', options: ['アメリカ', 'イギリス', 'フランス', 'ドイツ'], answer: 0 },
      { question: 'What company does Mike work for?', questionJp: 'ミラーさんは なんの かいしゃですか。', options: ['IMC', 'ABC', 'NHK', 'Toyota'], answer: 0 },
      { question: "What is Mike's role at the company?", questionJp: 'ミラーさんは どんな しごとを していますか。', options: ['しゃいん (сотрудник)', 'せんせい', 'いしゃ', 'がくせい'], answer: 0 },
    ]
  },
  {
    id: 2,
    lesson: 2,
    title: 'Is this yours?',
    titleJp: 'これは あなたのですか',
    lines: [
      { speaker: 'A', jp: 'すみません、これは あなたの かさですか。', romaji: 'Sumimasen, kore wa anata no kasa desu ka.', ru: 'Извините, это ваш зонт?' },
      { speaker: 'B', jp: 'いいえ、わたしのじゃ ありません。', romaji: 'Iie, watashi no ja arimasen.', ru: 'Нет, не мой.' },
      { speaker: 'A', jp: 'これは だれの かさですか。', romaji: 'Kore wa dare no kasa desu ka.', ru: 'Чей это зонт?' },
      { speaker: 'C', jp: 'あ、それは わたしのです。ありがとう ございます。', romaji: 'A, sore wa watashi no desu. Arigatou gozaimasu.', ru: 'Ах, это мой. Спасибо большое.' },
    ],
    questions: [
      { question: 'What item are they talking about?', questionJp: 'なにの はなしですか。', options: ['かさ (зонт)', 'かばん (сумка)', 'ほん (книга)', 'くつ (обувь)'], answer: 0 },
      { question: 'Does the umbrella belong to person B?', questionJp: 'かさは Bさんのですか。', options: ['いいえ', 'はい', 'わかりません', 'たぶん'], answer: 0 },
      { question: 'Who does the umbrella actually belong to?', questionJp: 'かさは だれのですか。', options: ['Cさん (третий человек)', 'Aさん', 'Bさん', 'だれのも ない'], answer: 0 },
    ]
  },
  {
    id: 3,
    lesson: 3,
    title: 'Where is the elevator?',
    titleJp: 'エレベーターは どこですか',
    lines: [
      { speaker: 'A', jp: 'すみません。エレベーターは どこですか。', romaji: 'Sumimasen. Erebeetaa wa doko desu ka.', ru: 'Извините. Где лифт?' },
      { speaker: 'B', jp: 'エレベーターは あそこです。', romaji: 'Erebeetaa wa asoko desu.', ru: 'Лифт вон там.' },
      { speaker: 'A', jp: 'トイレも あそこですか。', romaji: 'Toire mo asoko desu ka.', ru: 'Туалет тоже там?' },
      { speaker: 'B', jp: 'いいえ、トイレは 2かいです。かいだんの ちかくです。', romaji: 'Iie, toire wa ni-kai desu. Kaidan no chikaku desu.', ru: 'Нет, туалет на 2 этаже. Рядом с лестницей.' },
    ],
    questions: [
      { question: 'Where is the elevator?', questionJp: 'エレベーターは どこですか。', options: ['あそこ (вон там)', '2かい (2 этаж)', '1かい (1 этаж)', 'ここ (здесь)'], answer: 0 },
      { question: 'What floor is the toilet on?', questionJp: 'トイレは なんかいですか。', options: ['2かい', '1かい', '3かい', 'ちかい'], answer: 0 },
      { question: 'What is near the stairs?', questionJp: 'かいだんの ちかくに なにが ありますか。', options: ['トイレ (туалет)', 'エレベーター', 'じむしょ', 'レストラン'], answer: 0 },
    ]
  },
  {
    id: 4,
    lesson: 4,
    title: 'Daily schedule',
    titleJp: 'まいにちの スケジュール',
    lines: [
      { speaker: 'A', jp: 'まいあさ なんじに おきますか。', romaji: 'Maiasa nanji ni okimasu ka.', ru: 'Во сколько вы встаёте каждое утро?' },
      { speaker: 'B', jp: '6じはんに おきます。', romaji: 'Roku-ji han ni okimasu.', ru: 'Встаю в 6:30.' },
      { speaker: 'A', jp: 'なんじから なんじまで はたらきますか。', romaji: 'Nanji kara nanji made hatarakimasu ka.', ru: 'С которого до которого часа вы работаете?' },
      { speaker: 'B', jp: '9じから 5じまで はたらきます。どようびと にちようびは やすみます。', romaji: 'Ku-ji kara go-ji made hatarakimasu. Doyoubi to nichiyoubi wa yasumimasu.', ru: 'Работаю с 9 до 5. По субботам и воскресеньям отдыхаю.' },
    ],
    questions: [
      { question: 'What time does B wake up?', questionJp: 'Bさんは なんじに おきますか。', options: ['6:30', '7:00', '6:00', '8:00'], answer: 0 },
      { question: 'What days does B not work?', questionJp: 'Bさんは いつ やすみますか。', options: ['どようび と にちようび', 'げつようび', 'きんようび', 'まいにち'], answer: 0 },
      { question: 'What time does B finish work?', questionJp: 'Bさんは なんじに しごとが おわりますか。', options: ['5じ', '6じ', '4じ', '7じ'], answer: 0 },
    ]
  },
  {
    id: 5,
    lesson: 5,
    title: 'Going to the station',
    titleJp: 'えきへ いきます',
    lines: [
      { speaker: 'A', jp: 'どこへ いきますか。', romaji: 'Doko e ikimasu ka.', ru: 'Куда вы идёте?' },
      { speaker: 'B', jp: 'きょうとへ いきます。', romaji: 'Kyouto e ikimasu.', ru: 'Еду в Киото.' },
      { speaker: 'A', jp: 'なにで いきますか。', romaji: 'Nani de ikimasu ka.', ru: 'На чём поедете?' },
      { speaker: 'B', jp: 'しんかんせんで いきます。ともだちと いきます。', romaji: 'Shinkansen de ikimasu. Tomodachi to ikimasu.', ru: 'Поеду на синкансэне. Поеду с другом.' },
    ],
    questions: [
      { question: 'Where is B going?', questionJp: 'Bさんは どこへ いきますか。', options: ['きょうと', 'とうきょう', 'おおさか', 'なら'], answer: 0 },
      { question: 'How will B get there?', questionJp: 'なにで いきますか。', options: ['しんかんせん', 'ひこうき', 'バス', 'タクシー'], answer: 0 },
      { question: 'Who is B going with?', questionJp: 'Bさんは だれと いきますか。', options: ['ともだち (с другом)', 'ひとりで', 'かぞくと', 'どうりょうと'], answer: 0 },
    ]
  },
  {
    id: 6,
    lesson: 6,
    title: 'At a restaurant',
    titleJp: 'レストランで',
    lines: [
      { speaker: 'A', jp: 'いっしょに ひるごはんを たべませんか。', romaji: 'Issho ni hirugohan o tabemasen ka.', ru: 'Не хотите ли вместе пообедать?' },
      { speaker: 'B', jp: 'いいですね。なにを たべますか。', romaji: 'Ii desu ne. Nani o tabemasu ka.', ru: 'Хорошая идея. Что будем есть?' },
      { speaker: 'A', jp: 'てんぷらを たべましょう。', romaji: 'Tenpura o tabemashou.', ru: 'Давайте съедим темпуру.' },
      { speaker: 'B', jp: 'いいですね。なにを のみますか。', romaji: 'Ii desu ne. Nani o nomimasu ka.', ru: 'Хорошо. Что будете пить?' },
      { speaker: 'A', jp: 'おちゃを のみます。', romaji: 'Ocha o nomimasu.', ru: 'Буду пить чай.' },
    ],
    questions: [
      { question: 'What will they eat?', questionJp: 'なにを たべますか。', options: ['てんぷら', 'すし', 'ラーメン', 'カレー'], answer: 0 },
      { question: 'What will A drink?', questionJp: 'Aさんは なにを のみますか。', options: ['おちゃ', 'コーヒー', 'ジュース', 'みず'], answer: 0 },
      { question: 'How did A invite B to lunch?', questionJp: 'Aさんは どうやって Bさんを さそいましたか。', options: ['〜たべませんか (не поели бы?)', '〜たべましょう', '〜たべます', '〜たべてください'], answer: 0 },
    ]
  },
  {
    id: 7,
    lesson: 7,
    title: 'A birthday gift',
    titleJp: 'たんじょうびの プレゼント',
    lines: [
      { speaker: 'A', jp: 'あした やまださんの たんじょうびですね。', romaji: 'Ashita Yamada-san no tanjoubi desu ne.', ru: 'Завтра день рождения Ямады, да?' },
      { speaker: 'B', jp: 'そうですね。なにを あげますか。', romaji: 'Sou desu ne. Nani o agemasu ka.', ru: 'Да, верно. Что подарим?' },
      { speaker: 'A', jp: 'はなを あげましょう。やまださんは はなが すきですから。', romaji: 'Hana o agemashou. Yamada-san wa hana ga suki desu kara.', ru: 'Давайте подарим цветы. Ведь Ямада любит цветы.' },
      { speaker: 'B', jp: 'いいですね。わたしは チョコレートも あげます。', romaji: 'Ii desu ne. Watashi wa chokoreeto mo agemasu.', ru: 'Хорошая идея. Я ещё подарю шоколад.' },
    ],
    questions: [
      { question: 'Whose birthday is tomorrow?', questionJp: 'だれの たんじょうびですか。', options: ['やまださん', 'たなかさん', 'ミラーさん', 'さとうさん'], answer: 0 },
      { question: 'What will they give?', questionJp: 'なにを あげますか。', options: ['はな と チョコレート', 'ほん', 'ケーキ', 'おかね'], answer: 0 },
      { question: 'Why does A suggest giving flowers?', questionJp: 'なぜ はなを あげますか。', options: ['やまださんが はなが すきだから', 'やすいから', 'みせが ちかいから', 'きれいだから'], answer: 0 },
    ]
  },
  {
    id: 8,
    lesson: 8,
    title: 'Describing a city',
    titleJp: 'まちの ようす',
    lines: [
      { speaker: 'A', jp: 'とうきょうは どんな まちですか。', romaji: 'Toukyou wa donna machi desu ka.', ru: 'Какой город Токио?' },
      { speaker: 'B', jp: 'おおきくて、にぎやかな まちです。', romaji: 'Ookikute, nigiyaka na machi desu.', ru: 'Большой и оживлённый город.' },
      { speaker: 'A', jp: 'たべものは どうですか。', romaji: 'Tabemono wa dou desu ka.', ru: 'А как еда?' },
      { speaker: 'B', jp: 'たべものは おいしいですが、たかいです。', romaji: 'Tabemono wa oishii desu ga, takai desu.', ru: 'Еда вкусная, но дорогая.' },
      { speaker: 'A', jp: 'そうですか。わたしは しずかな まちが すきです。', romaji: 'Sou desu ka. Watashi wa shizuka na machi ga suki desu.', ru: 'Вот как. Мне нравятся тихие города.' },
    ],
    questions: [
      { question: 'How is Tokyo described?', questionJp: 'とうきょうは どんな まちですか。', options: ['おおきくて にぎやか', 'ちいさくて しずか', 'ふるくて きれい', 'あたらしくて しずか'], answer: 0 },
      { question: 'What is said about food in Tokyo?', questionJp: 'たべものは どうですか。', options: ['おいしいが たかい', 'やすくて おいしい', 'まずい', 'ふつう'], answer: 0 },
      { question: 'What kind of city does A prefer?', questionJp: 'Aさんは どんな まちが すきですか。', options: ['しずかな まち (тихий город)', 'にぎやかな まち', 'おおきな まち', 'あたらしい まち'], answer: 0 },
    ]
  },
  {
    id: 9,
    lesson: 9,
    title: 'Talking about hobbies',
    titleJp: 'しゅみの はなし',
    lines: [
      { speaker: 'A', jp: 'しゅみは なんですか。', romaji: 'Shumi wa nan desu ka.', ru: 'Какое у вас хобби?' },
      { speaker: 'B', jp: 'おんがくを きくことが すきです。にほんの おんがくが よく わかります。', romaji: 'Ongaku o kiku koto ga suki desu. Nihon no ongaku ga yoku wakarimasu.', ru: 'Мне нравится слушать музыку. Хорошо понимаю японскую музыку.' },
      { speaker: 'A', jp: 'りょうりも できますか。', romaji: 'Ryouri mo dekimasu ka.', ru: 'А готовить тоже умеете?' },
      { speaker: 'B', jp: 'はい、すこし できます。にほんりょうりが すきですから。', romaji: 'Hai, sukoshi dekimasu. Nihon ryouri ga suki desu kara.', ru: 'Да, немного умею. Потому что люблю японскую кухню.' },
    ],
    questions: [
      { question: 'What does B like to do?', questionJp: 'Bさんの しゅみは なんですか。', options: ['おんがくを きく', 'えいがを みる', 'スポーツ', 'りょこう'], answer: 0 },
      { question: 'Can B cook?', questionJp: 'Bさんは りょうりが できますか。', options: ['すこし できます', 'できません', 'とても できます', 'わかりません'], answer: 0 },
      { question: 'Why does B like Japanese food?', questionJp: 'Bさんは なぜ にほんりょうりが すきですか。', options: ['にほんりょうりが すきだから (просто нравится)', 'やすいから', 'からだに いいから', 'かんたんだから'], answer: 0 },
    ]
  },
  {
    id: 10,
    lesson: 10,
    title: 'In the apartment',
    titleJp: 'へやの なかに',
    lines: [
      { speaker: 'A', jp: 'あたらしい へやは どうですか。', romaji: 'Atarashii heya wa dou desu ka.', ru: 'Как новая квартира?' },
      { speaker: 'B', jp: 'ひろくて、きれいです。まどの ちかくに つくえが あります。', romaji: 'Hirokute, kirei desu. Mado no chikaku ni tsukue ga arimasu.', ru: 'Просторная и красивая. Около окна стоит стол.' },
      { speaker: 'A', jp: 'テレビは ありますか。', romaji: 'Terebi wa arimasu ka.', ru: 'Телевизор есть?' },
      { speaker: 'B', jp: 'はい、たなの うえに あります。ねこも いますよ。', romaji: 'Hai, tana no ue ni arimasu. Neko mo imasu yo.', ru: 'Да, стоит на полке. А ещё есть кот!' },
    ],
    questions: [
      { question: 'How is the new room?', questionJp: 'あたらしい へやは どうですか。', options: ['ひろくて きれい', 'せまくて くらい', 'ふるい', 'ちいさい'], answer: 0 },
      { question: 'Where is the TV?', questionJp: 'テレビは どこに ありますか。', options: ['たなの うえ', 'つくえの うえ', 'ゆかの うえ', 'まどの ちかく'], answer: 0 },
      { question: 'What else is in the room?', questionJp: 'へやに ほかに なにが いますか。', options: ['ねこ (кот)', 'いぬ', 'さかな', 'とり'], answer: 0 },
    ]
  },
  {
    id: 11,
    lesson: 11,
    title: 'Morning routine',
    titleJp: 'あさの ルーティン',
    lines: [
      { speaker: 'A', jp: 'けさ、なにを しましたか。', romaji: 'Kesa, nani o shimashita ka.', ru: 'Что вы делали сегодня утром?' },
      { speaker: 'B', jp: 'シャワーを あびて、ごはんを たべて、かいしゃへ きました。', romaji: 'Shawaa o abite, gohan o tabete, kaisha e kimashita.', ru: 'Принял душ, поел и пришёл на работу.' },
      { speaker: 'A', jp: 'しんぶんも よみましたか。', romaji: 'Shinbun mo yomimashita ka.', ru: 'Вы ещё и газету читали?' },
      { speaker: 'B', jp: 'はい、ごはんを たべながら よみました。', romaji: 'Hai, gohan o tabenagara yomimashita.', ru: 'Да, читал за едой.' },
    ],
    questions: [
      { question: 'What did B do first in the morning?', questionJp: 'Bさんは あさ はじめに なにを しましたか。', options: ['シャワーを あびる', 'ごはんを たべる', 'しんぶんを よむ', 'かいしゃへ いく'], answer: 0 },
      { question: 'What did B do while eating?', questionJp: 'Bさんは ごはんを たべながら なにを しましたか。', options: ['しんぶんを よむ', 'テレビを みる', 'でんわを かける', 'おちゃを のむ'], answer: 0 },
      { question: "After showering, what did B do next?", questionJp: 'シャワーの あとで、Bさんは なにを しましたか。', options: ['ごはんを たべた', 'しんぶんを よんだ', 'かいしゃへ いった', 'でんわを かけた'], answer: 0 },
    ]
  },
  {
    id: 12,
    lesson: 12,
    title: 'Which do you prefer?',
    titleJp: 'どちらが すきですか',
    lines: [
      { speaker: 'A', jp: 'コーヒーと こうちゃと、どちらのほうが すきですか。', romaji: 'Koohii to koucha to, dochira no hou ga suki desu ka.', ru: 'Что вы предпочитаете — кофе или чай?' },
      { speaker: 'B', jp: 'こうちゃのほうが すきです。コーヒーは にがいですから。', romaji: 'Koucha no hou ga suki desu. Koohii wa nigai desu kara.', ru: 'Предпочитаю чай. Потому что кофе горький.' },
      { speaker: 'A', jp: 'そうですか。わたしは コーヒーのほうが すきです。', romaji: 'Sou desu ka. Watashi wa koohii no hou ga suki desu.', ru: 'Вот как. Я предпочитаю кофе.' },
      { speaker: 'B', jp: 'このみせで いちばん おいしいのは なんですか。', romaji: 'Kono mise de ichiban oishii no wa nan desu ka.', ru: 'Что в этом магазине самое вкусное?' },
      { speaker: 'A', jp: 'チーズケーキが いちばん おいしいですよ。', romaji: 'Chiizu keeki ga ichiban oishii desu yo.', ru: 'Чизкейк — самое вкусное!' },
    ],
    questions: [
      { question: 'Why does B prefer tea over coffee?', questionJp: 'Bさんは なぜ こうちゃのほうが すきですか。', options: ['コーヒーは にがいから', 'こうちゃは やすいから', 'コーヒーは からいから', 'こうちゃは おいしいから'], answer: 0 },
      { question: 'What is the most delicious thing in the shop?', questionJp: 'このみせで いちばん おいしいのは なんですか。', options: ['チーズケーキ', 'コーヒー', 'こうちゃ', 'ケーキ'], answer: 0 },
      { question: 'Who prefers coffee?', questionJp: 'コーヒーのほうが すきな のは だれですか。', options: ['Aさん', 'Bさん', 'ふたりとも', 'どちらでもない'], answer: 0 },
    ]
  },
  {
    id: 13,
    lesson: 13,
    title: 'Vacation wishes',
    titleJp: 'やすみに したいこと',
    lines: [
      { speaker: 'A', jp: 'やすみに なにを したいですか。', romaji: 'Yasumi ni nani o shitai desu ka.', ru: 'Что хотите делать в отпуске?' },
      { speaker: 'B', jp: 'おきなわへ いきたいです。うみで およぎたいです。', romaji: 'Okinawa e ikitai desu. Umi de oyogitai desu.', ru: 'Хочу поехать на Окинаву. Хочу поплавать в море.' },
      { speaker: 'A', jp: 'いいですね。わたしは きょうとで おてらを みたいです。', romaji: 'Ii desu ne. Watashi wa Kyouto de otera o mitai desu.', ru: 'Здорово. А я хочу посмотреть храмы в Киото.' },
      { speaker: 'B', jp: 'にほんりょうりも たべたいですか。', romaji: 'Nihon ryouri mo tabetai desu ka.', ru: 'А японскую кухню тоже хотите попробовать?' },
      { speaker: 'A', jp: 'もちろん！おすしが たべたいです。', romaji: 'Mochiron! Osushi ga tabetai desu.', ru: 'Конечно! Хочу суши.' },
    ],
    questions: [
      { question: 'Where does B want to go?', questionJp: 'Bさんは どこへ いきたいですか。', options: ['おきなわ', 'きょうと', 'とうきょう', 'ほっかいどう'], answer: 0 },
      { question: 'What does A want to see in Kyoto?', questionJp: 'Aさんは きょうとで なにを みたいですか。', options: ['おてら', 'やま', 'うみ', 'こうえん'], answer: 0 },
      { question: 'What food does A want to eat?', questionJp: 'Aさんは なにを たべたいですか。', options: ['おすし', 'てんぷら', 'ラーメン', 'カレー'], answer: 0 },
    ]
  },
  {
    id: 14,
    lesson: 14,
    title: 'Asking for help',
    titleJp: 'おねがい',
    lines: [
      { speaker: 'A', jp: 'すみません、ちょっと てつだって くださいませんか。', romaji: 'Sumimasen, chotto tetsudatte kudasaimasen ka.', ru: 'Извините, не могли бы вы мне немного помочь?' },
      { speaker: 'B', jp: 'いいですよ。なにを しますか。', romaji: 'Ii desu yo. Nani o shimasu ka.', ru: 'Конечно. Что нужно сделать?' },
      { speaker: 'A', jp: 'この にもつを もって ください。おもいですから。', romaji: 'Kono nimotsu o motte kudasai. Omoi desu kara.', ru: 'Возьмите, пожалуйста, этот багаж. Он тяжёлый.' },
      { speaker: 'B', jp: 'わかりました。どこに おきますか。', romaji: 'Wakarimashita. Doko ni okimasu ka.', ru: 'Понял. Куда поставить?' },
      { speaker: 'A', jp: 'あの つくえの うえに おいて ください。ありがとう ございます。', romaji: 'Ano tsukue no ue ni oite kudasai. Arigatou gozaimasu.', ru: 'Поставьте, пожалуйста, на тот стол. Спасибо большое.' },
    ],
    questions: [
      { question: 'What does A ask B to do?', questionJp: 'Aさんは Bさんに なにを たのみましたか。', options: ['にもつを もつ', 'でんわを かける', 'ドアを あける', 'まどを しめる'], answer: 0 },
      { question: 'Why does A need help?', questionJp: 'なぜ Aさんは てつだいが ひつようですか。', options: ['にもつが おもいから', 'じかんが ないから', 'びょうきだから', 'わからないから'], answer: 0 },
      { question: 'Where should the luggage be placed?', questionJp: 'にもつを どこに おきますか。', options: ['あのつくえのうえ (на том столе)', 'まどのちかく', 'ゆかのうえ', 'たなのうえ'], answer: 0 },
    ]
  },
  {
    id: 15,
    lesson: 15,
    title: 'May I use it?',
    titleJp: 'つかっても いいですか',
    lines: [
      { speaker: 'A', jp: 'すみません、でんし じしょを つかっても いいですか。', romaji: 'Sumimasen, denshi jisho o tsukatte mo ii desu ka.', ru: 'Извините, можно воспользоваться электронным словарём?' },
      { speaker: 'B', jp: 'はい、どうぞ。でも、じゅぎょうちゅうは つかわないで ください。', romaji: 'Hai, douzo. Demo, jugyouchuu wa tsukawanaide kudasai.', ru: 'Да, пожалуйста. Но во время урока не пользуйтесь.' },
      { speaker: 'A', jp: 'わかりました。ここで たべても いいですか。', romaji: 'Wakarimashita. Koko de tabete mo ii desu ka.', ru: 'Понял. Можно здесь поесть?' },
      { speaker: 'B', jp: 'いいえ、きょうしつで たべては いけません。しょくどうで たべて ください。', romaji: 'Iie, kyoushitsu de tabete wa ikemasen. Shokudou de tabete kudasai.', ru: 'Нет, в аудитории есть нельзя. Пожалуйста, ешьте в столовой.' },
    ],
    questions: [
      { question: 'What does A want to use?', questionJp: 'Aさんは なにを つかいたいですか。', options: ['でんし じしょ', 'スマートフォン', 'パソコン', 'ノート'], answer: 0 },
      { question: 'Where can you eat?', questionJp: 'どこで たべても いいですか。', options: ['しょくどう', 'きょうしつ', 'ろうか', 'にわ'], answer: 0 },
      { question: 'When must you NOT use the electronic dictionary?', questionJp: 'いつ でんし じしょを つかっては いけませんか。', options: ['じゅぎょうちゅう (во время урока)', 'やすみじかん', 'かえりに', 'あさ'], answer: 0 },
    ]
  },
  {
    id: 16,
    lesson: 16,
    title: 'Directions to the shrine',
    titleJp: 'じんじゃへの みちあんない',
    lines: [
      { speaker: 'A', jp: 'すみません、じんじゃへは どうやって いきますか。', romaji: 'Sumimasen, jinja e wa douyatte ikimasu ka.', ru: 'Извините, как добраться до святилища?' },
      { speaker: 'B', jp: 'バスで いくと べんりですよ。えきまえから のって ください。', romaji: 'Basu de iku to benri desu yo. Ekimae kara notte kudasai.', ru: 'На автобусе удобно. Садитесь у станции.' },
      { speaker: 'A', jp: 'バスで なんぷんぐらい かかりますか。', romaji: 'Basu de nanpun gurai kakarimasu ka.', ru: 'Сколько минут ехать на автобусе?' },
      { speaker: 'B', jp: 'じゅっぷんぐらいです。じんじゃは みどりの おおきい とりいが めじるしです。', romaji: 'Juppun gurai desu. Jinja wa midori no ookii torii ga mejirushi desu.', ru: 'Около 10 минут. Ориентир — большие зелёные ворота тории.' },
    ],
    questions: [
      { question: 'How does B suggest getting to the shrine?', questionJp: 'Bさんは どうやって じんじゃへ いくと いいましたか。', options: ['バスで', 'あるいて', 'でんしゃで', 'タクシーで'], answer: 0 },
      { question: 'What is the landmark for the shrine?', questionJp: 'じんじゃの めじるしは なんですか。', options: ['みどりの おおきい とりい', 'あかい おてら', 'しろい たてもの', 'ちいさい こうえん'], answer: 0 },
      { question: 'Where should you board the bus?', questionJp: 'バスは どこから のりますか。', options: ['えきまえ (у станции)', 'こうえんのまえ', 'じんじゃのちかく', 'バスターミナル'], answer: 0 },
    ]
  },
  {
    id: 17,
    lesson: 17,
    title: 'Rules at the library',
    titleJp: 'としょかんの ルール',
    lines: [
      { speaker: 'A', jp: 'としょかんで たべないで ください。', romaji: 'Toshokan de tabenaide kudasai.', ru: 'Пожалуйста, не ешьте в библиотеке.' },
      { speaker: 'B', jp: 'はい、わかりました。しゃしんは とっても いいですか。', romaji: 'Hai, wakarimashita. Shashin wa tottemo ii desu ka.', ru: 'Да, поняла. А фотографировать можно?' },
      { speaker: 'A', jp: 'いいえ、しゃしんを とらないで ください。でんわも つかわないで ください。', romaji: 'Iie, shashin o toranaide kudasai. Denwa mo tsukawanaide kudasai.', ru: 'Нет, пожалуйста, не фотографируйте. И телефоном тоже не пользуйтесь.' },
      { speaker: 'B', jp: 'わかりました。ほんを かりても いいですか。', romaji: 'Wakarimashita. Hon o karitemo ii desu ka.', ru: 'Поняла. А книги можно брать?' },
      { speaker: 'A', jp: 'はい、5さつまで かりることが できます。', romaji: 'Hai, go-satsu made kariru koto ga dekimasu.', ru: 'Да, можно взять до 5 книг.' },
    ],
    questions: [
      { question: 'What is NOT allowed at the library?', questionJp: 'としょかんで してはいけないことは?', options: ['たべること と しゃしん', 'ほんを よむこと', 'べんきょう', 'すわること'], answer: 0 },
      { question: 'How many books can you borrow?', questionJp: 'なんさつまで かりることが できますか。', options: ['5さつ', '3さつ', '10さつ', '1さつ'], answer: 0 },
      { question: 'What else is prohibited in the library?', questionJp: 'としょかんで、ほかに してはいけないことは なんですか。', options: ['でんわを つかうこと (телефон)', 'ほんを よむこと', 'べんきょう', 'すわること'], answer: 0 },
    ]
  },
  {
    id: 18,
    lesson: 18,
    title: 'What can you do?',
    titleJp: 'なにが できますか',
    lines: [
      { speaker: 'A', jp: 'ピアノを ひく ことが できますか。', romaji: 'Piano o hiku koto ga dekimasu ka.', ru: 'Вы умеете играть на пианино?' },
      { speaker: 'B', jp: 'はい、すこし できます。でも、じょうずじゃ ありません。', romaji: 'Hai, sukoshi dekimasu. Demo, jouzu ja arimasen.', ru: 'Да, немного умею. Но не очень хорошо.' },
      { speaker: 'A', jp: 'りょうりは どうですか。', romaji: 'Ryouri wa dou desu ka.', ru: 'А как насчёт готовки?' },
      { speaker: 'B', jp: 'にほんりょうりは つくる ことが できます。でも、おかしは つくる ことが できません。', romaji: 'Nihon ryouri wa tsukuru koto ga dekimasu. Demo, okashi wa tsukuru koto ga dekimasen.', ru: 'Японскую кухню умею готовить. Но десерты делать не умею.' },
    ],
    questions: [
      { question: 'Can B play the piano?', questionJp: 'Bさんは ピアノを ひく ことが できますか。', options: ['すこし できる', 'まったく できない', 'とても じょうず', 'ならっている'], answer: 0 },
      { question: 'What can B NOT make?', questionJp: 'Bさんは なにを つくる ことが できませんか。', options: ['おかし', 'にほんりょうり', 'ごはん', 'みそしる'], answer: 0 },
      { question: 'How does B play the piano?', questionJp: 'Bさんは ピアノを どのくらい ひけますか。', options: ['すこし できる (немного)', 'まったく できない', 'とても じょうず', 'プロレベル'], answer: 0 },
    ]
  },
  {
    id: 19,
    lesson: 19,
    title: 'Travel experiences',
    titleJp: 'りょこうの けいけん',
    lines: [
      { speaker: 'A', jp: 'にほんへ いったことが ありますか。', romaji: 'Nihon e itta koto ga arimasu ka.', ru: 'Вы бывали в Японии?' },
      { speaker: 'B', jp: 'はい、2かい いったことが あります。とうきょうと おおさかへ いきました。', romaji: 'Hai, ni-kai itta koto ga arimasu. Toukyou to Oosaka e ikimashita.', ru: 'Да, был 2 раза. Ездил в Токио и Осаку.' },
      { speaker: 'A', jp: 'おおさかで なにを しましたか。', romaji: 'Oosaka de nani o shimashita ka.', ru: 'Что делали в Осаке?' },
      { speaker: 'B', jp: 'おおさかじょうを みました。それから たこやきを たべました。とても おいしかったです。', romaji: 'Oosaka-jou o mimashita. Sorekara takoyaki o tabemashita. Totemo oishikatta desu.', ru: 'Посмотрел замок Осаки. Потом ел такояки. Было очень вкусно.' },
    ],
    questions: [
      { question: 'How many times has B been to Japan?', questionJp: 'Bさんは なんかい にほんへ いきましたか。', options: ['2かい', '1かい', '3かい', 'まだ いっていない'], answer: 0 },
      { question: 'What did B eat in Osaka?', questionJp: 'Bさんは おおさかで なにを たべましたか。', options: ['たこやき', 'すし', 'ラーメン', 'うどん'], answer: 0 },
      { question: 'What did B see in Osaka?', questionJp: 'Bさんは おおさかで なにを みましたか。', options: ['おおさかじょう (замок Осаки)', 'きょうとのおてら', 'とうきょうタワー', 'ふじさん'], answer: 0 },
    ]
  },
  {
    id: 20,
    lesson: 20,
    title: 'Weekend plans',
    titleJp: 'しゅうまつの よてい',
    lines: [
      { speaker: 'A', jp: 'しゅうまつ、なにを する？', romaji: 'Shuumatsu, nani o suru?', ru: 'Что будешь делать на выходных?' },
      { speaker: 'B', jp: 'えいがを みると おもう。あたらしい にほんの えいがが あるよ。', romaji: 'Eiga o miru to omou. Atarashii Nihon no eiga ga aru yo.', ru: 'Думаю, посмотрю фильм. Есть новый японский фильм.' },
      { speaker: 'A', jp: 'いいね。いっしょに いかない？', romaji: 'Ii ne. Issho ni ikanai?', ru: 'Здорово. Не хочешь вместе пойти?' },
      { speaker: 'B', jp: 'うん、いこう！どようびは ひまだと おもう。', romaji: 'Un, ikou! Doyoubi wa hima da to omou.', ru: 'Да, пойдём! Думаю, в субботу свободен.' },
      { speaker: 'A', jp: 'じゃ、どようびの ごごに しよう。', romaji: 'Ja, doyoubi no gogo ni shiyou.', ru: 'Тогда давай в субботу после обеда.' },
    ],
    questions: [
      { question: 'What are they planning to do?', questionJp: 'ふたりは なにを するよていですか。', options: ['えいがを みる', 'かいものに いく', 'べんきょうする', 'りょこうする'], answer: 0 },
      { question: 'When will they go?', questionJp: 'いつ いきますか。', options: ['どようびの ごご', 'にちようびの あさ', 'きんようびの よる', 'どようびの あさ'], answer: 0 },
      { question: "What does B think about Saturday's schedule?", questionJp: 'Bさんは どようびに ついて どう おもっていますか。', options: ['ひまだと おもう (думает, что свободен)', 'しごとが あると おもう', 'わからないと おもう', 'むりだと おもう'], answer: 0 },
    ]
  },
  {
    id: 21,
    lesson: 21,
    title: 'Are you okay?',
    titleJp: 'どうしたんですか',
    lines: [
      { speaker: 'A', jp: '顔色が わるいですね。どうしたんですか。', romaji: 'Kaoshoku ga warui desu ne. Doushita n desu ka.', ru: 'Вы плохо выглядите. Что случилось?' },
      { speaker: 'B', jp: 'ゆうべ ねむれなかったんです。しごとが いそがしくて。', romaji: 'Yuube nemuremanakatta n desu. Shigoto ga isogashikute.', ru: 'Я не смог спать прошлой ночью. Из-за работы.' },
      { speaker: 'A', jp: 'そうなんですか。たいへんですね。', romaji: 'Sou na n desu ka. Taihen desu ne.', ru: 'Вот как. Это тяжело.' },
      { speaker: 'B', jp: 'ええ、くにから りょうしんが くるんですよ。へやの そうじで いそがしくて。', romaji: 'Ee, kuni kara ryoushin ga kuru n desu yo. Heya no souji de isogashikute.', ru: 'Да, из деревни приедут родители. Занят уборкой комнаты.' },
    ],
    questions: [
      { question: 'Why could B not sleep?', questionJp: 'Bさんは なぜ ねむれませんでしたか。', options: ['しごとが いそがしいから', 'びょうきだから', 'うるさかったから', 'ねつが あったから'], answer: 0 },
      { question: 'Who is coming from the countryside?', questionJp: 'くにから だれが きますか。', options: ['りょうしん', 'ともだち', 'せんせい', 'かいしゃの ひと'], answer: 0 },
      { question: 'What is B busy with at home?', questionJp: 'Bさんは おうちで なにに いそがしいですか。', options: ['へやの そうじ (уборка)', 'しごとの レポート', 'りょうりの じゅんび', 'かいもの'], answer: 0 },
    ]
  },
  {
    id: 22,
    lesson: 22,
    title: 'Who is that person?',
    titleJp: 'あの ひとは だれですか',
    lines: [
      { speaker: 'A', jp: 'あそこに たっている ひとは だれですか。', romaji: 'Asoko ni tatte iru hito wa dare desu ka.', ru: 'Кто тот человек, стоящий вон там?' },
      { speaker: 'B', jp: 'あの あかい ふくを きている ひとですか。あれは やまだせんせいです。', romaji: 'Ano akai fuku o kite iru hito desu ka. Are wa Yamada-sensei desu.', ru: 'Тот, кто в красной одежде? Это учитель Ямада.' },
      { speaker: 'A', jp: 'そうですか。むこうに すわっている ひとは？', romaji: 'Sou desu ka. Mukou ni suwatte iru hito wa?', ru: 'Вот как. А кто сидит вон там?' },
      { speaker: 'B', jp: 'あの めがねを かけている ひとですか。しらないです。', romaji: 'Ano megane o kakete iru hito desu ka. Shiranai desu.', ru: 'Тот, кто в очках? Не знаю.' },
    ],
    questions: [
      { question: 'Who is the person in red clothes?', questionJp: 'あかい ふくを きている ひとは だれですか。', options: ['やまだせんせい', 'たなかさん', 'しらない ひと', 'Aさんの ともだち'], answer: 0 },
      { question: 'Does B know the person with glasses?', questionJp: 'Bさんは めがねを かけている ひとを しっていますか。', options: ['いいえ、しらない', 'はい、ともだち', 'はい、せんせい', 'はい、かぞく'], answer: 0 },
      { question: 'What is the person with glasses doing?', questionJp: 'めがねを かけている ひとは なにを していますか。', options: ['すわっている (сидит)', 'はしっている', 'たっている', 'あるいている'], answer: 0 },
    ]
  },
  {
    id: 23,
    lesson: 23,
    title: 'When you press this...',
    titleJp: 'これを おすと',
    lines: [
      { speaker: 'A', jp: 'ここを おすと、でんきが きえますよ。', romaji: 'Koko o osu to, denki ga kiemasu yo.', ru: 'Если нажать здесь, свет погаснет.' },
      { speaker: 'B', jp: 'そうですか。スイッチが みつからなくて こまっていたんです。', romaji: 'Sou desu ka. Suicchi ga mitsukaranakute komatte ita n desu.', ru: 'Вот как. Я не мог найти выключатель.' },
      { speaker: 'A', jp: 'こうやって いれると、ひかりが つきます。', romaji: 'Kou yatte ireru to, hikari ga tsukimasu.', ru: 'Если вот так нажать, свет включается.' },
      { speaker: 'B', jp: 'なるほど。これは べんりですね。ありがとうございます。', romaji: 'Naruhodo. Kore wa benri desu ne. Arigatou gozaimasu.', ru: 'Понятно. Это удобно. Спасибо.' },
    ],
    questions: [
      { question: 'What happens when you press here?', questionJp: 'ここを おすと、どうなりますか。', options: ['でんきが きえる', 'おとが でる', 'ドアが あく', 'テレビが つく'], answer: 0 },
      { question: 'What was B having trouble with?', questionJp: 'Bさんは なにに こまっていましたか。', options: ['スイッチが みつからなかった', 'でんきが こわれた', 'かぎが なかった', 'でんわが つながらなかった'], answer: 0 },
      { question: 'What happens when the switch is turned on?', questionJp: 'スイッチを いれると、どうなりますか。', options: ['ひかりが つく (свет включается)', 'おとが でる', 'でんきが きえる', 'ドアが あく'], answer: 0 },
    ]
  },
  {
    id: 24,
    lesson: 24,
    title: 'Birthday gifts',
    titleJp: 'たんじょうびの プレゼント',
    lines: [
      { speaker: 'A', jp: 'たんじょうびに なにか もらいましたか。', romaji: 'Tanjoubi ni nanika moraimashita ka.', ru: 'Получили что-нибудь на день рождения?' },
      { speaker: 'B', jp: 'はい、かぞくから ケーキを もらいました。ともだちは はなを くれました。', romaji: 'Hai, kazoku kara keeki o moraimashita. Tomodachi wa hana o kuremashita.', ru: 'Да, от семьи получил торт. Друг подарил цветы.' },
      { speaker: 'A', jp: 'いいですね。Bさんは ともだちに なにか あげましたか。', romaji: 'Ii desu ne. B-san wa tomodachi ni nanika agemashita ka.', ru: 'Хорошо. А вы что-нибудь дарили другу?' },
      { speaker: 'B', jp: 'ハンカチを あげました。よろこんで くれましたよ。', romaji: 'Hankachi o agemashita. Yorokonde kuremashita yo.', ru: 'Подарил носовой платок. Он обрадовался.' },
    ],
    questions: [
      { question: 'What did B receive from friends?', questionJp: 'Bさんは ともだちから なにを もらいましたか。', options: ['はな', 'ケーキ', 'ハンカチ', 'プレゼント'], answer: 0 },
      { question: 'What did B give to a friend?', questionJp: 'Bさんは ともだちに なにを あげましたか。', options: ['ハンカチ', 'ケーキ', 'はな', 'ほん'], answer: 0 },
      { question: "How did B's friend react to the gift?", questionJp: 'Bさんの ともだちは どうしましたか。', options: ['よろこんで くれた (обрадовался)', 'かなしんだ', 'おこった', 'あまり よろこばなかった'], answer: 0 },
    ]
  },
  {
    id: 25,
    lesson: 25,
    title: 'Rain or shine',
    titleJp: 'あめでも ひでも',
    lines: [
      { speaker: 'A', jp: 'あした あめが ふっても、ピクニックに いきますか。', romaji: 'Ashita ame ga futte mo, pikunikku ni ikimasu ka.', ru: 'Пойдёте на пикник завтра, даже если будет дождь?' },
      { speaker: 'B', jp: 'うーん、あめが ふったら、やめた ほうが いいですね。', romaji: 'Uun, ame ga futtara, yameta hou ga ii desu ne.', ru: 'Хм, если пойдёт дождь, лучше не ходить.' },
      { speaker: 'A', jp: 'では、てんきが よかったら、ぜひ いきましょう。', romaji: 'Dewa, tenki ga yokattara, zehi ikimashou.', ru: 'Тогда если погода будет хорошей, обязательно пойдём.' },
      { speaker: 'B', jp: 'はい、たとえ さむくても、そとで たべると おいしいですよね。', romaji: 'Hai, tatoe samukute mo, soto de taberu to oishii desu yo ne.', ru: 'Да, даже если холодно, есть на улице вкусно, правда?' },
    ],
    questions: [
      { question: 'What will they do if it rains?', questionJp: 'あめが ふったら どうしますか。', options: ['ピクニックを やめる', 'かさを もっていく', 'うちで たべる', 'びじゅつかんに いく'], answer: 0 },
      { question: 'According to B, eating outside is...?', questionJp: 'Bさんに よると、そとで たべると どうですか。', options: ['おいしい', 'さむい', 'たのしくない', 'めんどうだ'], answer: 0 },
      { question: 'What will they definitely do if the weather is good?', questionJp: 'てんきが よかったら、ぜひ なにを しますか。', options: ['ピクニックに いく (пикник)', 'えいがを みる', 'おうちで たべる', 'やすむ'], answer: 0 },
    ]
  },
]

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Shuffle options and return { options, answer } with new correct-answer index
function shuffleQuestionOptions(q) {
  const correct = q.options[q.answer]
  const shuffled = shuffle(q.options)
  return { ...q, options: shuffled, answer: shuffled.indexOf(correct) }
}

const PHASE_BROWSE = 'browse'
const PHASE_READING = 'reading'
const PHASE_QUESTIONS = 'questions'
const PHASE_RESULTS = 'results'

const STORAGE_KEY = 'nihongo-reading-completed'

function loadCompleted() {
  const parsed = getStoredJson(STORAGE_KEY, [])
  return Array.isArray(parsed) ? parsed : []
}

function saveCompleted(ids) {
  setStoredJson(STORAGE_KEY, ids)
}

export default function ReadingPractice() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const [searchParams] = useSearchParams()
  const [phase, setPhase] = useState(PHASE_BROWSE)
  const [selectedDialogue, setSelectedDialogue] = useState(null)
  const [showRomaji, setShowRomaji] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [revealAll, setRevealAll] = useState(false)
  const [revealedLines, setRevealedLines] = useState(1)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [shuffledQuestions, setShuffledQuestions] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState([])
  const [completedIds, setCompletedIds] = useState(() => loadCompleted())
  const [resetConfirm, setResetConfirm] = useState(false)
  const answerTimerRef = useRef(null)
  const answerLockedRef = useRef(false)
  const advanceLockedRef = useRef(false)
  const xpAwardedRef = useRef(false)
  const [showPassage, setShowPassage] = useState(false)

  useEffect(() => { setShowPassage(false) }, [currentQuestion])

  const { awardXP, calculateQuizXP } = useXP()
  const { saveQuizResult } = useProgress()
  const { unlockedMax } = useUnlockedLessons()
  const sharedLessonId = parseInt(searchParams.get('lesson') || '', 10)
  const sharedDialogue = Number.isFinite(sharedLessonId)
    ? readingData.find(d => d.lesson === sharedLessonId)
    : null

  // Award XP and mark completed when results phase is reached
  useEffect(() => {
    if (phase === PHASE_RESULTS && selectedDialogue) {
      const total = selectedDialogue.questions.length
      if (!xpAwardedRef.current) {
        xpAwardedRef.current = true
        saveQuizResult('grammar', { lessons: [selectedDialogue.lesson], score, total })
        const xp = calculateQuizXP(score, total)
        if (xp > 0) awardXP(xp, 'reading practice', score === total && total > 0)
      }

      // Mark dialogue as completed
      setCompletedIds(prev => {
        const id = selectedDialogue.id
        if (prev.includes(id)) return prev
        const next = [...prev, id]
        saveCompleted(next)
        return next
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Cleanup answer transition timer on unmount
  useEffect(() => {
    return () => { if (answerTimerRef.current) clearTimeout(answerTimerRef.current) }
  }, [])

  const handleReset = useCallback(() => {
    if (!resetConfirm) {
      setResetConfirm(true)
      return
    }
    setCompletedIds([])
    saveCompleted([])
    setResetConfirm(false)
  }, [resetConfirm])

  const openDialogue = useCallback((dialogue, resetXP = true) => {
    clearTimeout(answerTimerRef.current)
    if (resetXP) xpAwardedRef.current = false
    setSelectedDialogue(dialogue)
    setShuffledQuestions((dialogue.questions || []).map(shuffleQuestionOptions))
    setShowRomaji(false)
    setShowTranslation(false)
    setRevealAll(false)
    setRevealedLines(1)
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setScore(0)
    setAnswers([])
    answerLockedRef.current = false
    advanceLockedRef.current = false
    setPhase(PHASE_READING)
  }, [])

  const revealNext = useCallback(() => {
    if (selectedDialogue && revealedLines < selectedDialogue.lines.length) {
      setRevealedLines(prev => prev + 1)
    }
  }, [selectedDialogue, revealedLines])

  const goToQuestions = useCallback(() => {
    clearTimeout(answerTimerRef.current)
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setScore(0)
    setAnswers([])
    answerLockedRef.current = false
    advanceLockedRef.current = false
    setPhase(PHASE_QUESTIONS)
  }, [])

  const handleAnswer = useCallback((optionIndex) => {
    if (selectedAnswer !== null || answerLockedRef.current || !selectedDialogue) return
    answerLockedRef.current = true
    advanceLockedRef.current = false
    const q = shuffledQuestions[currentQuestion] || selectedDialogue.questions[currentQuestion]
    const correct = optionIndex === q.answer
    setSelectedAnswer(optionIndex)
    setIsCorrect(correct)
    if (correct) setScore(prev => prev + 1)
    setAnswers(prev => [...prev, { questionIndex: currentQuestion, selected: optionIndex, correct }])

    answerTimerRef.current = setTimeout(() => {
      if (advanceLockedRef.current) return
      advanceLockedRef.current = true

      if (currentQuestion + 1 >= selectedDialogue.questions.length) {
        setPhase(PHASE_RESULTS)
      } else {
        setCurrentQuestion(prev => prev + 1)
        setSelectedAnswer(null)
        setIsCorrect(null)
        answerLockedRef.current = false
      }
    }, correct ? 1000 : 1500)
  }, [selectedAnswer, selectedDialogue, currentQuestion, shuffledQuestions])

  const skipDelay = useCallback(() => {
    if (selectedAnswer === null || !selectedDialogue || advanceLockedRef.current) return
    advanceLockedRef.current = true
    clearTimeout(answerTimerRef.current)
    if (currentQuestion + 1 >= selectedDialogue.questions.length) {
      setPhase(PHASE_RESULTS)
    } else {
      setCurrentQuestion(prev => prev + 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
      answerLockedRef.current = false
    }
  }, [selectedAnswer, selectedDialogue, currentQuestion])

  const goBack = useCallback(() => {
    clearTimeout(answerTimerRef.current)
    setPhase(PHASE_BROWSE)
    setSelectedDialogue(null)
  }, [])

  const retryDialogue = useCallback(() => {
    if (selectedDialogue) openDialogue(selectedDialogue, false)
  }, [selectedDialogue, openDialogue])

  // Keyboard shortcuts: 1-4 to answer in question phase, Enter to advance in reading phase
  // NOTE: must be after handleAnswer and skipDelay to avoid TDZ const access
  useEffect(() => {
    const handler = (e) => {
      if (phase === 'questions') {
        if ((e.key === 'Enter' || e.key === ' ') && selectedAnswer !== null && !isCorrect) {
          e.preventDefault(); skipDelay(); return
        }
        const idx = parseInt(e.key, 10) - 1
        if (idx >= 0 && idx <= 3) handleAnswer(idx)
      }
      if (phase === 'reading' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        if (selectedDialogue && revealedLines < selectedDialogue.lines.length) {
          setRevealedLines(prev => prev + 1)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, handleAnswer, selectedDialogue, revealedLines, selectedAnswer, isCorrect, skipDelay])

  // Auto-open dialogue when ?lesson=X param present
  useEffect(() => {
    const lessonParam = searchParams.get('lesson')
    if (!lessonParam) return
    const lessonId = parseInt(lessonParam, 10)
    const dialogue = readingData.find(d => d.lesson === lessonId)
    if (dialogue) openDialogue(dialogue)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // scroll to top when results phase begins
  useEffect(() => {
    if (phase === PHASE_RESULTS) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [phase])

  // Browse screen
  if (phase === PHASE_BROWSE) {
    const availableData = readingData.filter(d => d.lesson <= unlockedMax || d.id === sharedDialogue?.id)
    const completedCount = completedIds.filter(id => availableData.some(d => d.id === id)).length
    const totalCount = availableData.length

    return (
      <div className="page">
        <div style={s.header} className="animate-fadeInUp">
          <h1 style={s.title}>
            <span>📖</span> reading <span style={s.titleJp}>どっかい</span>
          </h1>
          <p style={s.subtitle}>read dialogues & test comprehension 🐱</p>
          <div style={s.completionRow}>
            <span style={s.completionCounter}>{completedCount}/{totalCount} completed</span>
            <button
              onClick={handleReset}
              onBlur={() => setResetConfirm(false)}
              style={resetConfirm ? s.resetBtnConfirm : s.resetBtn}
            >
              {resetConfirm ? 'reset?' : 'reset progress'}
            </button>
          </div>
        </div>

        <div style={s.grid}>
          {availableData.map((d, i) => {
            const done = completedIds.includes(d.id)
            return (
              <button
                key={d.id}
                onClick={() => openDialogue(d)}
                className="glass animate-pop"
                style={{ ...s.card, animationDelay: `${i * 0.05}s` }}
              >
                <div style={s.cardBadge}>
                  <span style={s.cardBadgeNum}>{d.lesson}</span>
                </div>
                {done && (
                  <div style={s.checkBadge}>
                    <span style={s.checkMark}>✓</span>
                  </div>
                )}
                <div style={s.cardTitleJp}>{d.titleJp}</div>
                <div style={s.cardTitleEn}>{d.title}</div>
                <div style={s.cardMeta}>
                  <span style={s.cardMetaItem}>{d.lines.length} lines</span>
                  <span style={s.cardMetaDot}>·</span>
                  <span style={s.cardMetaItem}>{d.questions.length} questions</span>
                </div>
              </button>
            )
          })}
        </div>

        <div style={s.footerNote} className="animate-fadeInUp">
          <p style={s.footerText}>lessons 1-25 ~ dialogues from minna no nihongo 🌸</p>
        </div>
        <div style={{ textAlign: 'center', marginTop: 16, paddingBottom: 90, display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Link to="/lessons" className="btn btn-cute" style={{ fontSize: '0.85rem' }}>lessons 📚</Link>
          <Link to="/" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>home 🏠</Link>
        </div>
      </div>
    )
  }

  // Reading screen
  if (phase === PHASE_READING && selectedDialogue) {
    const linesToShow = revealAll ? selectedDialogue.lines : selectedDialogue.lines.slice(0, revealedLines)
    const allRevealed = revealAll || revealedLines >= selectedDialogue.lines.length

    return (
      <div className="page">
        <div className="animate-fadeInUp">
          {/* back button & header */}
          <div style={s.readingHeader}>
            <button onClick={goBack} style={s.backBtn} className="glass-sm btn-hover">
              ← back
            </button>
            <div style={s.readingTitleWrap}>
              <span style={s.readingLesson}>lesson {selectedDialogue.lesson}</span>
              <h2 style={s.readingTitle}>{selectedDialogue.titleJp}</h2>
              <p style={s.readingSubtitle}>{selectedDialogue.title}</p>
            </div>
          </div>

          {/* line progress dots */}
          {!revealAll && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {selectedDialogue.lines.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i < revealedLines ? 10 : 8,
                    height: i < revealedLines ? 10 : 8,
                    borderRadius: '50%',
                    background: i < revealedLines
                      ? 'linear-gradient(135deg, #f472b6, #c084fc)'
                      : 'rgba(192,132,252,0.2)',
                    transition: 'all 0.3s ease',
                    boxShadow: i < revealedLines ? '0 2px 6px rgba(236,72,153,0.35)' : 'none',
                  }}
                />
              ))}
            </div>
          )}

          {/* toggle controls */}
          <div className="glass-sm" style={s.toggleBar}>
            <button
              onClick={() => setShowRomaji(prev => !prev)}
              style={{
                ...s.toggleBtn,
                ...(showRomaji ? s.toggleBtnActive : {}),
              }}
            >
              romaji {showRomaji ? 'on' : 'off'}
            </button>
            <button
              onClick={() => setShowTranslation(prev => !prev)}
              style={{
                ...s.toggleBtn,
                ...(showTranslation ? s.toggleBtnActive : {}),
              }}
            >
              translation {showTranslation ? 'on' : 'off'}
            </button>
            <button
              onClick={() => {
                setRevealAll(prev => !prev)
                if (!revealAll) setRevealedLines(selectedDialogue.lines.length)
              }}
              style={{
                ...s.toggleBtn,
                ...(revealAll ? s.toggleBtnActive : {}),
              }}
            >
              {revealAll ? 'full text' : 'line by line'}
            </button>
          </div>

          {/* dialogue lines */}
          <div className="glass" style={s.dialogueCard}>
            {linesToShow.map((line, i) => (
              <div
                key={i}
                style={{
                  ...s.dialogueLine,
                  ...(i < linesToShow.length - 1 ? { borderBottom: '1px solid rgba(192,132,252,0.12)' } : {}),
                }}
                className="animate-fadeInUp"
              >
                <div style={s.speakerBubble}>
                  <span style={s.speakerLabel}>{line.speaker}</span>
                </div>
                <div style={s.lineContent}>
                  <div style={s.lineJp}>{line.jp}</div>
                  {showRomaji && (
                    <div style={s.lineRomaji}>{line.romaji}</div>
                  )}
                  {showTranslation && (
                    <div style={s.lineRu}>{line.ru}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* reveal next / go to questions */}
          <div style={s.readingActions}>
            {!allRevealed && (
              <button className="btn btn-cute" onClick={revealNext}>
                next line 👆
              </button>
            )}
            {allRevealed && (
              <button className="btn btn-cute" onClick={goToQuestions}>
                answer questions ✨
              </button>
            )}
            {!allRevealed && !isMobile && (
              <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-light)', opacity: 0.5, marginTop: 4 }}>
                press Enter or Space
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Questions screen
  if (phase === PHASE_QUESTIONS && selectedDialogue) {
    const q = (shuffledQuestions.length > 0 ? shuffledQuestions : selectedDialogue.questions)[currentQuestion]
    if (!q) return null
    const progress = ((currentQuestion + 1) / selectedDialogue.questions.length) * 100

    return (
      <div className="page">
        <div className="animate-fadeInUp">
          {/* progress */}
          <div style={s.progressWrap}>
            <div style={s.progressInfo}>
              <Link to="/" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', opacity: 0.5, textDecoration: 'none', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', flexShrink: 0 }} aria-label="exit quiz">✕</Link>
              <span style={s.progressText}>{currentQuestion + 1} / {selectedDialogue.questions.length}</span>
              <span style={s.scoreText} aria-live="polite" aria-atomic="true">score: {score} 🐱</span>
            </div>
            <div style={s.progressBar}>
              <div style={{ ...s.progressFill, width: `${progress}%` }} />
            </div>
          </div>

          {/* question */}
          <div
            className="glass"
            style={{
              ...s.questionCard,
              ...(!prefersReducedMotion && isCorrect === false ? { animation: 'shake 0.4s ease' } : {}),
            }}
          >
            <div style={s.questionLabel}>comprehension question 🤔</div>
            <div style={s.questionJp}>{q.questionJp}</div>
            <div style={s.questionEn}>{q.question}</div>
          </div>

          {/* passage hint */}
          {selectedAnswer === null && (
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              {showPassage ? (
                <div className="glass-sm animate-pop" style={{ padding: '12px 16px', borderRadius: 14, marginBottom: 8, textAlign: 'left' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', marginBottom: 8, textTransform: 'lowercase', letterSpacing: '0.04em' }}>
                    📖 {selectedDialogue.titleJp}
                  </div>
                  {selectedDialogue.lines.map((line, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: i < selectedDialogue.lines.length - 1 ? '1px solid rgba(192,132,252,0.1)' : 'none' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--text-light)', minWidth: 16 }}>{line.speaker}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.4 }}>{line.jp}</span>
                    </div>
                  ))}
                  <button onClick={() => setShowPassage(false)} style={{ marginTop: 8, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '6px 0', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>
                    скрыть ↑
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPassage(true)}
                  style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', background: 'rgba(168,85,247,0.08)', border: 'none', borderRadius: 50, padding: '3px 12px', cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}
                >
                  📖 показать текст
                </button>
              )}
            </div>
          )}

          {/* options */}
          <div key={`reading-options-${currentQuestion}`} style={{ ...s.optionsGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
            {q.options.map((opt, i) => {
              let optStyle = { ...s.option }

              if (selectedAnswer !== null) {
                if (i === q.answer) {
                  optStyle = { ...optStyle, ...s.optionCorrect }
                } else if (selectedAnswer === i && !isCorrect) {
                  optStyle = { ...optStyle, ...s.optionIncorrect }
                } else {
                  optStyle = { ...optStyle, opacity: 0.5 }
                }
              }

              return (
                <button
                  key={opt}
                  onClick={() => handleAnswer(i)}
                  className="glass-sm quiz-option"
                  style={optStyle}
                  disabled={selectedAnswer !== null}
                >
                  {opt}
                </button>
              )
            })}
          </div>

          {/* keyboard hint */}
          {selectedAnswer === null && !isMobile && (
            <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-light)', opacity: 0.55, marginTop: 4 }}>
              press 1–4 to answer
            </div>
          )}

          {/* feedback */}
          {selectedAnswer !== null && (
            <div
              style={{
                ...s.feedback,
                color: isCorrect ? 'var(--correct-text)' : 'var(--incorrect-text)',
                cursor: isCorrect ? 'default' : 'pointer',
              }}
              className="animate-pop"
              onClick={isCorrect ? undefined : skipDelay}
              role={isCorrect ? undefined : 'button'}
              tabIndex={isCorrect ? undefined : 0}
              aria-label={isCorrect ? undefined : 'continue to next question'}
              onKeyDown={isCorrect ? undefined : (e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skipDelay() } })}
            >
              {isCorrect ? '✨ correct! sugoi~' : `✗ the answer was: ${q.options[q.answer]}`}
              {!isCorrect && <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 4 }}>нажми чтобы продолжить →</div>}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Results screen
  if (phase === PHASE_RESULTS && selectedDialogue) {
    const total = selectedDialogue.questions.length
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0
    const xpEarned = calculateQuizXP(score, total)

    let reactionEmoji, reactionText, reactionJp
    if (percentage >= 90) {
      reactionEmoji = '🎉✨🐱'
      reactionText = 'sugoi!! perfect reading!'
      reactionJp = 'すごい！'
    } else if (percentage >= 70) {
      reactionEmoji = '🌸😊'
      reactionText = 'yoku dekimashita! great job!'
      reactionJp = 'よくできました！'
    } else if (percentage >= 50) {
      reactionEmoji = '🐱💪'
      reactionText = 'mada mada~ read it again!'
      reactionJp = 'まだまだ！'
    } else {
      reactionEmoji = '🌙📚'
      reactionText = 'ganbatte! try once more~'
      reactionJp = 'がんばって！'
    }

    return (
      <div className="page">
        <div className="animate-fadeInUp" style={s.resultsWrap}>
          <div className="glass" style={{ ...s.resultsCard, ...(isTablet ? s.resultsCardTablet : {}) }}>
            {percentage >= 90 && <Confetti trigger={true} />}
            <div style={s.resultsEmoji}>{reactionEmoji}</div>
            <h2 style={s.resultsTitle}>{reactionJp}</h2>
            <p style={s.resultsText}>{reactionText}</p>

            <div style={s.scoreCircle} className={percentage >= 90 ? 'score-perfect' : 'score-circle'}>
              <div style={s.scoreCircleInner}>
                <span style={s.scoreBig}>{percentage}%</span>
                <span style={s.scoreDetail}>{score}/{total}</span>
              </div>
            </div>

            {xpEarned > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(168,85,247,0.1)', borderRadius: 50, padding: '4px 14px', marginBottom: 12 }} className="animate-pop">
                <span style={{ fontSize: '0.9rem' }}>⚡</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>+{xpEarned} XP</span>
              </div>
            )}

            <div style={s.resultsDialogueInfo}>
              <span style={s.resultsDialogueLabel}>lesson {selectedDialogue.lesson}</span>
              <span style={s.resultsDialogueTitle}>{selectedDialogue.titleJp}</span>
            </div>

            {/* review answers */}
            {answers.some(a => !a.correct) && (
              <div style={s.mistakesSection}>
                <div style={s.mistakesLabel}>review mistakes ✏️</div>
                {answers.filter(a => !a.correct).map((a) => {
                  const q = (shuffledQuestions.length > 0 ? shuffledQuestions : selectedDialogue.questions)[a.questionIndex]
                  return (
                    <div key={a.questionIndex} style={s.mistakeItem}>
                      <div style={s.mistakeQuestion}>{q.questionJp}</div>
                      <div style={s.mistakeCorrect}>✓ {q.options[q.answer]}</div>
                      <div style={s.mistakeYours}>✗ {q.options[a.selected]}</div>
                      {selectedDialogue.lesson && (
                        <Link to={`/lessons/${selectedDialogue.lesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none' }}>
                          lesson {selectedDialogue.lesson} →
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div style={s.resultsActions}>
              <button className="btn btn-cute" onClick={retryDialogue}>
                read again 🌸
              </button>
              <ShareResult
                quizName="reading practice"
                score={score}
                total={total}
                percentage={percentage}
                xpEarned={xpEarned}
              />
              <div style={{ display: 'flex', gap: 10, width: '100%', flexWrap: 'wrap' }}>
                {selectedDialogue?.lesson && (
                  <Link to={`/quiz/vocab?lesson=${selectedDialogue.lesson}`} className="btn btn-cute" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>
                    vocab quiz ✨
                  </Link>
                )}
                <Link to={`/lessons/${selectedDialogue?.lesson}`} className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>
                  lesson {selectedDialogue?.lesson} →
                </Link>
              </div>
              <div style={{ display: 'flex', gap: 10, width: '100%', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={goBack} style={{ flex: 1 }}>
                  all dialogues 📖
                </button>
                <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
                  home 🏠
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

const s = {
  // --- header ---
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
    fontSize: '1rem',
    color: 'var(--text-light)',
    fontWeight: 500,
  },

  // --- completion row ---
  completionRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  completionCounter: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--text-light)',
  },
  resetBtn: {
    padding: '3px 10px',
    borderRadius: 50,
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    background: 'var(--tint-light)',
    border: '1px solid rgba(192,132,252,0.2)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    minHeight: 44,
  },
  resetBtnConfirm: {
    padding: '3px 10px',
    borderRadius: 50,
    fontSize: '0.75rem',
    fontWeight: 800,
    color: 'var(--incorrect-text)',
    background: 'rgba(244,63,94,0.08)',
    border: '1px solid rgba(244,63,94,0.3)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    minHeight: 44,
  },

  // --- completion badge ---
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#10b981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(16,185,129,0.3)',
  },
  checkMark: {
    fontSize: '0.72rem',
    fontWeight: 900,
    color: 'white',
    lineHeight: 1,
  },

  // --- browse grid ---
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 12,
    marginBottom: 32,
  },
  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px 12px 16px',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    border: 'none',
    fontFamily: 'inherit',
    textAlign: 'center',
    width: '100%',
  },
  cardBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadgeNum: {
    fontSize: '0.72rem',
    fontWeight: 800,
    color: 'white',
  },
  cardTitleJp: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--text-main)',
    marginBottom: 2,
  },
  cardTitleEn: {
    fontSize: '0.82rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    textTransform: 'lowercase',
    marginBottom: 8,
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: '0.72rem',
    color: 'var(--text-light)',
    fontWeight: 700,
  },
  cardMetaItem: {},
  cardMetaDot: {
    color: 'var(--text-light)',
  },
  footerNote: {
    textAlign: 'center',
    padding: '12px 0',
  },
  footerText: {
    fontSize: '0.8rem',
    color: 'var(--text-light)',
    fontWeight: 500,
  },

  // --- reading screen ---
  readingHeader: {
    marginBottom: 16,
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 14px',
    borderRadius: 50,
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    fontFamily: 'inherit',
    marginBottom: 12,
    minHeight: 44,
  },
  readingTitleWrap: {
    textAlign: 'center',
  },
  readingLesson: {
    fontSize: '0.72rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  readingTitle: {
    fontSize: '1.5rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    marginBottom: 2,
  },
  readingSubtitle: {
    fontSize: '1rem',
    color: 'var(--text-light)',
    fontWeight: 500,
    textTransform: 'lowercase',
  },

  // --- toggle bar ---
  toggleBar: {
    display: 'flex',
    gap: 6,
    padding: '8px 10px',
    marginBottom: 16,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  toggleBtn: {
    padding: '6px 14px',
    borderRadius: 50,
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    background: 'var(--tint-medium)',
    border: '1.5px solid rgba(192,132,252,0.25)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    textTransform: 'lowercase',
    minHeight: 44,
  },
  toggleBtnActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    color: 'white',
    border: '1.5px solid transparent',
    boxShadow: '0 2px 8px rgba(244, 114, 182, 0.2)',
  },

  // --- dialogue card ---
  dialogueCard: {
    padding: '16px 14px',
    marginBottom: 16,
  },
  dialogueLine: {
    display: 'flex',
    gap: 12,
    padding: '12px 0',
    alignItems: 'flex-start',
  },
  speakerBubble: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  speakerLabel: {
    fontSize: '0.75rem',
    fontWeight: 800,
    color: 'white',
  },
  lineContent: {
    flex: 1,
    minWidth: 0,
  },
  lineJp: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--text-main)',
    marginBottom: 4,
    lineHeight: 1.6,
  },
  lineRomaji: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  lineRu: {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--text-light)',
  },

  // --- reading actions ---
  readingActions: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },

  // --- questions ---
  progressWrap: {
    marginBottom: 20,
  },
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
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
    padding: '28px 20px',
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: '1rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    marginBottom: 12,
    textTransform: 'lowercase',
  },
  questionJp: {
    fontSize: '1.3rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    marginBottom: 8,
    lineHeight: 1.5,
  },
  questionEn: {
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
    padding: '18px 12px',
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-main)',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    background: 'var(--tint)',
    fontFamily: 'inherit',
    minHeight: 62,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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

  // --- results ---
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
    margin: '0 auto 20px',
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
  resultsDialogueInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    marginBottom: 16,
  },
  resultsDialogueLabel: {
    fontSize: '0.72rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  resultsDialogueTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-main)',
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
  mistakeItem: {
    background: 'rgba(244, 63, 94, 0.06)',
    border: '1px solid rgba(244, 63, 94, 0.15)',
    borderLeft: '3px solid var(--incorrect-text)',
    borderRadius: 10,
    padding: '8px 12px',
    marginBottom: 6,
  },
  mistakeQuestion: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--text-main)',
    marginBottom: 4,
  },
  mistakeCorrect: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--correct-text)',
  },
  mistakeYours: {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--incorrect-text)',
    fontStyle: 'italic',
  },
  resultsActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    alignItems: 'center',
  },
}
