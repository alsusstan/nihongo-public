import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useXP } from '../hooks/useXP'
import { useProgress } from '../hooks/useProgress'
import { useIsMobile, useIsTablet } from '../hooks/useIsMobile'
import { useUnlockedLessons } from '../hooks/useUnlockedLessons'
import ShareResult from '../components/ShareResult'
import Confetti from '../components/Confetti'
import { prefersReducedMotion as getPrefersReducedMotion } from '../utils/motion'

const prefersReducedMotion = getPrefersReducedMotion()

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Sentence data (70+ sentences, lessons 1–25) ───
const sentences = [
  // Lesson 1: X は Y です
  {
    correct: ['わたし', 'は', '学生', 'です'],
    translation: 'Я студент.',
    romaji: 'Watashi wa gakusei desu.',
    hint: 'я + тема + студент + есть',
    lesson: 1,
  },
  {
    correct: ['マイクさん', 'は', 'アメリカ人', 'です'],
    translation: 'Майк — американец.',
    romaji: 'Maiku-san wa amerikajin desu.',
    hint: 'Майк + тема + американец + есть',
    lesson: 1,
  },
  {
    correct: ['わたし', 'は', '日本人', 'じゃ', 'ありません'],
    translation: 'Я не японец.',
    romaji: 'Watashi wa nihonjin ja arimasen.',
    hint: 'я + тема + японец + не + есть(отриц.)',
    lesson: 1,
  },
  // Lesson 2: これ / それ / あれ
  {
    correct: ['これ', 'は', '本', 'です'],
    translation: 'Это книга.',
    romaji: 'Kore wa hon desu.',
    hint: 'это(близко) + тема + книга + есть',
    lesson: 2,
  },
  {
    correct: ['それ', 'は', 'わたし', 'の', 'かばん', 'です'],
    translation: 'То — моя сумка.',
    romaji: 'Sore wa watashi no kaban desu.',
    hint: 'то + тема + я + притяж. + сумка + есть',
    lesson: 2,
  },
  {
    correct: ['あれ', 'は', '何', 'です', 'か'],
    translation: 'Что это (вон то)?',
    romaji: 'Are wa nan desu ka.',
    hint: 'вон то + тема + что + есть + вопрос',
    lesson: 2,
  },
  // Lesson 3: ここ / そこ / あそこ
  {
    correct: ['トイレ', 'は', 'あそこ', 'です'],
    translation: 'Туалет — вон там.',
    romaji: 'Toire wa asoko desu.',
    hint: 'туалет + тема + вон там + есть',
    lesson: 3,
  },
  {
    correct: ['エレベーター', 'は', 'あちら', 'です'],
    translation: 'Лифт — вон в том направлении.',
    romaji: 'Erebeetaa wa achira desu.',
    hint: 'лифт + тема + то направление(вежл.) + есть',
    lesson: 3,
  },
  {
    correct: ['本屋', 'は', 'どこ', 'です', 'か'],
    translation: 'Где книжный магазин?',
    romaji: 'Hon\'ya wa doko desu ka.',
    hint: 'книжный магазин + тема + где + есть + вопрос',
    lesson: 3,
  },
  // Lesson 4: time expressions, movement
  {
    correct: ['毎朝', '7時', 'に', '起きます'],
    translation: 'Каждое утро я встаю в 7 часов.',
    romaji: 'Maiasa shichi-ji ni okimasu.',
    hint: 'каждое утро + 7 часов + в(время) + вставать',
    lesson: 4,
  },
  {
    correct: ['きのう', '9時', 'から', '5時', 'まで', '働きました'],
    translation: 'Вчера я работал с 9 до 5 часов.',
    romaji: 'Kinou ku-ji kara go-ji made hatarakimashita.',
    hint: 'вчера + 9 часов + от + 5 часов + до + работал',
    lesson: 4,
  },
  {
    correct: ['バス', 'で', '30分', 'かかります'],
    translation: 'На автобусе занимает 30 минут.',
    romaji: 'Basu de sanjuppun kakarimasu.',
    hint: 'автобус + средство + 30 минут + занимает',
    lesson: 4,
  },
  // Lesson 5: movement verbs
  {
    correct: ['わたし', 'は', '学校', 'へ', '行きます'],
    translation: 'Я иду в школу.',
    romaji: 'Watashi wa gakkou e ikimasu.',
    hint: 'я + тема + школа + направление + идти',
    lesson: 5,
  },
  {
    correct: ['田中さん', 'は', '日本', 'から', '来ました'],
    translation: 'Танака-сан приехал из Японии.',
    romaji: 'Tanaka-san wa Nihon kara kimashita.',
    hint: 'Танака + тема + Япония + из + приехал',
    lesson: 5,
  },
  {
    correct: ['わたし', 'は', '毎日', 'うち', 'へ', '帰ります'],
    translation: 'Я каждый день возвращаюсь домой.',
    romaji: 'Watashi wa mainichi uchi e kaerimasu.',
    hint: 'я + тема + каждый день + дом + направление + возвращаться',
    lesson: 5,
  },
  {
    correct: ['友達', 'と', 'タクシー', 'で', '来ました'],
    translation: 'Я приехал с другом на такси.',
    romaji: 'Tomodachi to takushii de kimashita.',
    hint: 'друг + с + такси + средство + приехал',
    lesson: 5,
  },
  {
    correct: ['らいねん', '日本', 'へ', '行きます'],
    translation: 'В следующем году поеду в Японию.',
    romaji: 'Rainen Nihon e ikimasu.',
    hint: 'в следующем году + Япония + направление + поеду',
    lesson: 5,
  },
  // Lesson 6: を particle with verbs
  {
    correct: ['わたし', 'は', '日本語', 'を', '勉強します'],
    translation: 'Я учу японский язык.',
    romaji: 'Watashi wa nihongo o benkyou shimasu.',
    hint: 'я + тема + японский язык + объект + учить',
    lesson: 6,
  },
  {
    correct: ['毎朝', 'コーヒー', 'を', '飲みます'],
    translation: 'Каждое утро я пью кофе.',
    romaji: 'Maiasa koohii o nomimasu.',
    hint: 'каждое утро + кофе + объект + пить',
    lesson: 6,
  },
  {
    correct: ['図書館', 'で', '本', 'を', '読みます'],
    translation: 'Я читаю книгу в библиотеке.',
    romaji: 'Toshokan de hon o yomimasu.',
    hint: 'библиотека + место действия + книга + объект + читать',
    lesson: 6,
  },
  {
    correct: ['昼', 'レストラン', 'で', '昼ご飯', 'を', '食べます'],
    translation: 'Днём я ем обед в ресторане.',
    romaji: 'Hiru resutoran de hirugohan o tabemasu.',
    hint: 'день + ресторан + место + обед + объект + есть(кушать)',
    lesson: 6,
  },
  {
    correct: ['スーパー', 'で', '野菜', 'を', '買います'],
    translation: 'Покупаю овощи в супермаркете.',
    romaji: 'Suupaa de yasai o kaimasu.',
    hint: 'супермаркет + место действия + овощи + объект + покупать',
    lesson: 6,
  },
  // Lesson 7: あげます / もらいます
  {
    correct: ['わたし', 'は', '友達', 'に', '花', 'を', 'あげます'],
    translation: 'Я дарю цветы другу.',
    romaji: 'Watashi wa tomodachi ni hana o agemasu.',
    hint: 'я + тема + друг + кому + цветы + объект + дать',
    lesson: 7,
  },
  {
    correct: ['わたし', 'は', '先生', 'に', '本', 'を', 'もらいました'],
    translation: 'Я получил книгу от учителя.',
    romaji: 'Watashi wa sensei ni hon o moraimashita.',
    hint: 'я + тема + учитель + от кого + книга + объект + получить',
    lesson: 7,
  },
  {
    correct: ['田中さん', 'は', 'マリアさん', 'に', 'チョコレート', 'を', 'あげました'],
    translation: 'Танака подарил Марии шоколад.',
    romaji: 'Tanaka-san wa Maria-san ni chokoreto o agemashita.',
    hint: 'Танака + тема + Мария + кому + шоколад + объект + подарить(прош.)',
    lesson: 7,
  },
  // Lesson 8: い-adjectives
  {
    correct: ['この', 'りんご', 'は', 'おいしい', 'です'],
    translation: 'Это яблоко вкусное.',
    romaji: 'Kono ringo wa oishii desu.',
    hint: 'это(опред.) + яблоко + тема + вкусный + есть',
    lesson: 8,
  },
  {
    correct: ['きのう', 'の', '天気', 'は', 'よかった', 'です'],
    translation: 'Вчера погода была хорошей.',
    romaji: 'Kinou no tenki wa yokatta desu.',
    hint: 'вчера + притяж. + погода + тема + хорош.(прош.) + есть',
    lesson: 8,
  },
  {
    correct: ['日本語', 'は', 'おもしろい', 'です'],
    translation: 'Японский язык интересный.',
    romaji: 'Nihongo wa omoshiroi desu.',
    hint: 'японский язык + тема + интересный + есть',
    lesson: 8,
  },
  // Lesson 9: 好き / 嫌い / 上手 / 下手
  {
    correct: ['わたし', 'は', '音楽', 'が', '好き', 'です'],
    translation: 'Я люблю музыку.',
    romaji: 'Watashi wa ongaku ga suki desu.',
    hint: 'я + тема + музыка + объект(чувство) + нравится + есть',
    lesson: 9,
  },
  {
    correct: ['カリナさん', 'は', '料理', 'が', '上手', 'です'],
    translation: 'Карина хорошо готовит.',
    romaji: 'Karina-san wa ryouri ga jouzu desu.',
    hint: 'Карина + тема + готовка + объект(чувство) + умелый + есть',
    lesson: 9,
  },
  {
    correct: ['わたし', 'は', 'スポーツ', 'が', '下手', 'です'],
    translation: 'Я плохо занимаюсь спортом.',
    romaji: 'Watashi wa supootsu ga heta desu.',
    hint: 'я + тема + спорт + объект(чувство) + неумелый + есть',
    lesson: 9,
  },
  {
    correct: ['わたし', 'は', '野菜', 'が', '嫌い', 'です'],
    translation: 'Я не люблю овощи.',
    romaji: 'Watashi wa yasai ga kirai desu.',
    hint: 'я + тема + овощи + объект(чувство) + не нравится + есть',
    lesson: 9,
  },
  {
    correct: ['田中さん', 'は', '絵', 'が', '大好き', 'です'],
    translation: 'Танака очень любит рисование.',
    romaji: 'Tanaka-san wa e ga daisuki desu.',
    hint: 'Танака + тема + рисование/картины + объект(чувство) + очень нравится + есть',
    lesson: 9,
  },
  // Lesson 10: あります / います
  {
    correct: ['部屋', 'に', 'テーブル', 'が', 'あります'],
    translation: 'В комнате есть стол.',
    romaji: 'Heya ni teeburu ga arimasu.',
    hint: 'комната + в(место) + стол + подлежащее + есть(неодуш.)',
    lesson: 10,
  },
  {
    correct: ['公園', 'に', '猫', 'が', 'います'],
    translation: 'В парке есть кошка.',
    romaji: 'Kouen ni neko ga imasu.',
    hint: 'парк + в(место) + кошка + подлежащее + есть(одуш.)',
    lesson: 10,
  },
  {
    correct: ['机', 'の', '上', 'に', '本', 'が', 'あります'],
    translation: 'На столе лежит книга.',
    romaji: 'Tsukue no ue ni hon ga arimasu.',
    hint: 'стол + притяж. + верх + в(место) + книга + подлежащее + есть(неодуш.)',
    lesson: 10,
  },
  // Lesson 11: counters
  {
    correct: ['りんご', 'を', '3つ', '買いました'],
    translation: 'Я купил три яблока.',
    romaji: 'Ringo o mittsu kaimashita.',
    hint: 'яблоки + объект + три штуки + купил',
    lesson: 11,
  },
  {
    correct: ['この', 'クラス', 'に', '学生', 'が', '15人', 'います'],
    translation: 'В этом классе 15 учеников.',
    romaji: 'Kono kurasu ni gakusei ga juugo-nin imasu.',
    hint: 'этот + класс + в(место) + ученики + подлежащее + 15 человек + есть(одуш.)',
    lesson: 11,
  },
  {
    correct: ['本', 'を', '2冊', '読みました'],
    translation: 'Я прочитал две книги.',
    romaji: 'Hon o ni-satsu yomimashita.',
    hint: 'книга + объект + 2 тома + прочитал',
    lesson: 11,
  },
  // Lesson 12: comparisons
  {
    correct: ['日本', 'は', '中国', 'より', '小さい', 'です'],
    translation: 'Япония меньше Китая.',
    romaji: 'Nihon wa Chuugoku yori chiisai desu.',
    hint: 'Япония + тема + Китай + чем + маленький + есть',
    lesson: 12,
  },
  {
    correct: ['東京', 'と', '大阪', 'と', 'どちら', 'が', '大きい', 'です', 'か'],
    translation: 'Что больше — Токио или Осака?',
    romaji: 'Toukyou to Oosaka to dochira ga ookii desu ka.',
    hint: 'Токио + и + Осака + и + какой из двух + подлежащее + большой + есть + вопрос',
    lesson: 12,
  },
  {
    correct: ['この', 'レストラン', 'が', 'いちばん', 'おいしい', 'です'],
    translation: 'Этот ресторан самый вкусный.',
    romaji: 'Kono resutoran ga ichiban oishii desu.',
    hint: 'этот + ресторан + подлежащее + самый + вкусный + есть',
    lesson: 12,
  },
  // Lesson 13: ～たいです
  {
    correct: ['わたし', 'は', '日本', 'へ', '行きたい', 'です'],
    translation: 'Я хочу поехать в Японию.',
    romaji: 'Watashi wa Nihon e ikitai desu.',
    hint: 'я + тема + Япония + направление + хочу поехать + есть',
    lesson: 13,
  },
  {
    correct: ['すし', 'を', '食べたい', 'です'],
    translation: 'Я хочу съесть суши.',
    romaji: 'Sushi o tabetai desu.',
    hint: 'суши + объект + хочу съесть + есть',
    lesson: 13,
  },
  {
    correct: ['何', 'も', '飲みたく', 'ない', 'です'],
    translation: 'Я не хочу ничего пить.',
    romaji: 'Nani mo nomitaku nai desu.',
    hint: 'что + тоже(отриц.) + хотеть пить(отриц.) + нет + есть',
    lesson: 13,
  },
  // Lesson 14: て-form — ～てください / V1-てV2
  {
    correct: ['ちょっと', '待って', 'ください'],
    translation: 'Подождите, пожалуйста.',
    romaji: 'Chotto matte kudasai.',
    hint: 'немного + ждать(て) + пожалуйста',
    lesson: 14,
  },
  {
    correct: ['名前', 'を', '書いて', 'ください'],
    translation: 'Напишите имя, пожалуйста.',
    romaji: 'Namae o kaite kudasai.',
    hint: 'имя + объект + писать(て) + пожалуйста',
    lesson: 14,
  },
  {
    correct: ['写真', 'を', '撮って', 'も', 'いい', 'です', 'か'],
    translation: 'Можно сфотографировать?',
    romaji: 'Shashin o totte mo ii desu ka.',
    hint: 'фото + объект + фотографировать(て) + тоже + хорошо + есть + вопрос',
    lesson: 15,
  },
  {
    correct: ['ここ', 'で', 'タバコ', 'を', '吸わないで', 'ください'],
    translation: 'Пожалуйста, не курите здесь.',
    romaji: 'Koko de tabako o suwanaide kudasai.',
    hint: 'здесь + место + табак + объект + не курить(ないで) + пожалуйста',
    lesson: 17,
  },
  {
    correct: ['手', 'を', '洗って', 'ご飯', 'を', '食べます'],
    translation: 'Я мою руки и ем.',
    romaji: 'Te o aratte gohan o tabemasu.',
    hint: 'руки + объект + мыть(て) + еда + объект + есть',
    lesson: 14,
  },
  {
    correct: ['電気', 'を', '消して', 'ください'],
    translation: 'Пожалуйста, выключите свет.',
    romaji: 'Denki o keshite kudasai.',
    hint: 'свет + объект + выключить(て) + пожалуйста',
    lesson: 14,
  },
  // Lesson 15: ～ています (progressive / state) + ～てもいいです / ～てはいけません
  {
    correct: ['わたし', 'は', '今', 'テレビ', 'を', '見て', 'います'],
    translation: 'Я сейчас смотрю телевизор.',
    romaji: 'Watashi wa ima terebi o mite imasu.',
    hint: 'я + тема + сейчас + телевизор + объект + смотреть(て) + быть(прогрессив)',
    lesson: 15,
  },
  {
    correct: ['兄', 'は', '東京', 'に', '住んで', 'います'],
    translation: 'Мой старший брат живёт в Токио.',
    romaji: 'Ani wa Toukyou ni sunde imasu.',
    hint: 'старший брат + тема + Токио + в(место) + жить(て) + быть(состояние)',
    lesson: 15,
  },
  {
    correct: ['雨', 'が', '降って', 'います'],
    translation: 'Идёт дождь.',
    romaji: 'Ame ga futte imasu.',
    hint: 'дождь + подлежащее + идти(て) + есть(состояние)',
    lesson: 15,
  },
  // Lesson 16: ～てから / sequential actions
  {
    correct: ['手', 'を', '洗って', 'から', '食べます'],
    translation: 'Помою руки, а потом буду есть.',
    romaji: 'Te o aratte kara tabemasu.',
    hint: 'руки + объект + мыть(て) + после + есть(кушать)',
    lesson: 16,
  },
  {
    correct: ['シャワー', 'を', '浴びて', 'から', '寝ます'],
    translation: 'Приму душ, а потом лягу спать.',
    romaji: 'Shawaa o abite kara nemasu.',
    hint: 'душ + объект + принимать(те) + после + спать',
    lesson: 16,
  },
  {
    correct: ['宿題', 'を', 'して', 'から', '遊びます'],
    translation: 'Сделаю домашнее задание, а потом поиграю.',
    romaji: 'Shukudai o shite kara asobimasu.',
    hint: 'домашнее задание + объект + делать(て) + после + играть',
    lesson: 16,
  },
  // Lesson 17: ～ないでください / ～なければなりません
  {
    correct: ['明日', '早く', '起きなければ', 'なりません'],
    translation: 'Завтра надо встать рано.',
    romaji: 'Ashita hayaku okinakereba narimasen.',
    hint: 'завтра + рано + должен встать + необходимо',
    lesson: 17,
  },
  {
    correct: ['薬', 'を', '飲まなければ', 'なりません'],
    translation: 'Надо принять лекарство.',
    romaji: 'Kusuri o nomanakeba narimasen.',
    hint: 'лекарство + объект + должен пить + необходимо',
    lesson: 17,
  },
  {
    correct: ['ここ', 'で', 'タバコ', 'を', 'すって', 'は', 'いけません'],
    translation: 'Здесь нельзя курить.',
    romaji: 'Koko de tabako o sutte wa ikemasen.',
    hint: 'здесь + место + табак + объект + курить(て) + тема + нельзя',
    lesson: 17,
  },
  // Lesson 18: dictionary form + ことができます
  {
    correct: ['わたし', 'は', '漢字', 'を', '読む', 'こと', 'が', 'できます'],
    translation: 'Я умею читать кандзи.',
    romaji: 'Watashi wa kanji o yomu koto ga dekimasu.',
    hint: 'я + тема + кандзи + объект + читать(словарн.) + дело + подлежащее + мочь',
    lesson: 18,
  },
  {
    correct: ['日本語', 'で', '電話', 'を', 'かける', 'こと', 'が', 'できます', 'か'],
    translation: 'Вы можете позвонить по-японски?',
    romaji: 'Nihongo de denwa o kakeru koto ga dekimasu ka.',
    hint: 'японский + средство + телефон + объект + звонить(словарн.) + дело + подлежащее + мочь + вопрос',
    lesson: 18,
  },
  {
    correct: ['わたし', 'は', 'ピアノ', 'を', '弾く', 'こと', 'が', 'できます'],
    translation: 'Я умею играть на пианино.',
    romaji: 'Watashi wa piano o hiku koto ga dekimasu.',
    hint: 'я + тема + пианино + объект + играть(словарн.) + дело + подлежащее + мочь',
    lesson: 18,
  },
  // Lesson 19: ～たことがあります (experience)
  {
    correct: ['わたし', 'は', '富士山', 'に', '登った', 'こと', 'が', 'あります'],
    translation: 'Я поднимался на гору Фудзи.',
    romaji: 'Watashi wa Fujisan ni nobotta koto ga arimasu.',
    hint: 'я + тема + Фудзи + на(направление) + взбираться(прош.) + дело + подлежащее + иметь опыт',
    lesson: 19,
  },
  {
    correct: ['すき焼き', 'を', '食べた', 'こと', 'が', 'ありません'],
    translation: 'Я никогда не ел сукияки.',
    romaji: 'Sukiyaki o tabeta koto ga arimasen.',
    hint: 'сукияки + объект + есть(прош.) + дело + подлежащее + нет опыта',
    lesson: 19,
  },
  {
    correct: ['スキー', 'を', 'した', 'こと', 'が', 'あります'],
    translation: 'Я катался на лыжах.',
    romaji: 'Sukii o shita koto ga arimasu.',
    hint: 'лыжи + объект + делать(прош.) + дело + подлежащее + иметь опыт',
    lesson: 19,
  },
  // Lesson 20: plain form
  {
    correct: ['わたし', 'は', '明日', '雨', 'が', '降る', 'と', '思います'],
    translation: 'Я думаю, что завтра пойдёт дождь.',
    romaji: 'Watashi wa ashita ame ga furu to omoimasu.',
    hint: 'я + тема + завтра + дождь + подлежащее + идти(дождь)(словарн.) + что + думать',
    lesson: 20,
  },
  {
    correct: ['田中さん', 'は', 'もう', '帰った', 'と', '思います'],
    translation: 'Я думаю, что Танака уже ушёл домой.',
    romaji: 'Tanaka-san wa mou kaetta to omoimasu.',
    hint: 'Танака + тема + уже + вернулся(прост.прош.) + что + думать',
    lesson: 20,
  },
  {
    correct: ['山田さん', 'は', '来年', '結婚する', 'と', '言って', 'いました'],
    translation: 'Ямада-сан говорил, что женится в следующем году.',
    romaji: 'Yamada-san wa rainen kekkon suru to itte imashita.',
    hint: 'Ямада + тема + в следующем году + жениться(словарн.) + что + говорить(て) + было',
    lesson: 20,
  },
  // Lesson 21 (supplementary): passive form ～られます (advanced grammar)
  {
    correct: ['わたし', 'は', '先生', 'に', 'ほめられました'],
    translation: 'Меня похвалил учитель.',
    romaji: 'Watashi wa sensei ni homeraremashita.',
    hint: 'я + тема + учитель + агент(пассив) + похвалили(пассив)',
    lesson: 21,
  },
  {
    correct: ['ケーキ', 'が', '子供', 'に', '食べられました'],
    translation: 'Торт съели дети.',
    romaji: 'Keeki ga kodomo ni taberaremashita.',
    hint: 'торт + подлежащее + дети + агент + съели(пассив)',
    lesson: 21,
  },
  {
    correct: ['雨', 'に', '降られました'],
    translation: 'Я попал под дождь.',
    romaji: 'Ame ni furaremashita.',
    hint: 'дождь + агент + попал под дождь(пассив)',
    lesson: 21,
  },
  // Lesson 22: relative clauses — plain form + noun modification
  {
    correct: ['これ', 'は', 'ミラーさん', 'が', '作った', 'ケーキ', 'です'],
    translation: 'Это торт, который приготовил г-н Миллер.',
    romaji: 'Kore wa Miraa-san ga tsukutta keeki desu.',
    hint: 'это + тема + Миллер(подл.) + приготовил(прост.прош.) + торт + есть',
    lesson: 22,
  },
  {
    correct: ['眼鏡', 'を', 'かけている', '人', 'は', 'だれ', 'です', 'か'],
    translation: 'Кто тот человек в очках?',
    romaji: 'Megane wo kakete iru hito wa dare desu ka.',
    hint: 'очки + объект + носить(て+いる) + человек + тема + кто + есть + вопрос',
    lesson: 22,
  },
  {
    correct: ['きのう', '買った', '本', 'は', 'おもしろかった', 'です'],
    translation: 'Книга, которую я купил вчера, была интересной.',
    romaji: 'Kinou katta hon wa omoshirokatta desu.',
    hint: 'вчера + купил(прост.прош.) + книга + тема + интересная(прош.) + есть',
    lesson: 22,
  },
  // Lesson 23: とき / と conditional
  {
    correct: ['日本', 'へ', '帰る', 'とき', 'お土産', 'を', '買います'],
    translation: 'Когда буду возвращаться в Японию, куплю сувениры.',
    romaji: 'Nihon e kaeru toki, omiyage wo kaimasu.',
    hint: 'Япония + направление + возвращаться(словарн.) + когда + сувениры + объект + куплю',
    lesson: 23,
  },
  {
    correct: ['このボタン', 'を', '押す', 'と', 'ドア', 'が', '開きます'],
    translation: 'Если нажать эту кнопку, дверь откроется.',
    romaji: 'Kono botan wo osu to, doa ga akimasu.',
    hint: 'эта кнопка + объект + нажать(словарн.) + если/то + дверь + подлежащее + откроется',
    lesson: 23,
  },
  {
    correct: ['子供', 'の', 'とき', 'よく', '公園', 'で', '遊びました'],
    translation: 'В детстве я часто играл в парке.',
    romaji: 'Kodomo no toki, yoku kouen de asobimashita.',
    hint: 'ребёнок + притяж. + когда + часто + парк + в + играл',
    lesson: 23,
  },
  // Lesson 24: giving/receiving actions — てくれます / てもらいます / てあげます
  {
    correct: ['田中さん', 'は', 'わたし', 'に', '花', 'を', 'くれました'],
    translation: 'Танака-сан подарил мне цветы.',
    romaji: 'Tanaka-san wa watashi ni hana o kuremashita.',
    hint: 'Танака + тема + мне + направление + цветы + объект + дал(в мою пользу)',
    lesson: 24,
  },
  {
    correct: ['わたし', 'は', '友達', 'に', 'プレゼント', 'を', 'あげました'],
    translation: 'Я подарил другу подарок.',
    romaji: 'Watashi wa tomodachi ni purezento o agemashita.',
    hint: 'я + тема + друг + направление + подарок + объект + дал(от меня)',
    lesson: 24,
  },
  {
    correct: ['先生', 'に', '日本語', 'を', '教えて', 'もらいました'],
    translation: 'Учитель научил меня японскому языку.',
    romaji: 'Sensei ni nihongo o oshiete moraimashita.',
    hint: 'учитель + агент + японский + объект + учить(て) + получил(услугу)',
    lesson: 24,
  },
  // Lesson 24 (supplementary): potential form + てみます

  {
    correct: ['わたし', 'は', '日本語', 'が', '話せます'],
    translation: 'Я умею говорить по-японски.',
    romaji: 'Watashi wa nihongo ga hanasemasu.',
    hint: 'я + тема + японский + подлежащее(способность) + умею говорить',
    lesson: 24,
  },
  {
    correct: ['この', '料理', 'を', '食べて', 'みました'],
    translation: 'Я попробовал это блюдо.',
    romaji: 'Kono ryouri o tabete mimashita.',
    hint: 'это + блюдо + объект + есть(て) + попробовал',
    lesson: 24,
  },
  {
    correct: ['わたし', 'は', '車', 'が', '運転できます'],
    translation: 'Я умею водить машину.',
    romaji: 'Watashi wa kuruma ga unten dekimasu.',
    hint: 'я + тема + машина + подлежащее(способность) + умею водить',
    lesson: 24,
  },
  // Lesson 25: ～たら conditional + ～ても + transitive/intransitive verbs
  {
    correct: ['駅', 'に', '着いたら', '電話して', 'ください'],
    translation: 'Когда приедете на станцию, позвоните.',
    romaji: 'Eki ni tsuitara, denwa shite kudasai.',
    hint: 'станция + место + прибыть(если/когда) + позвонить(て) + пожалуйста',
    lesson: 25,
  },
  {
    correct: ['お金', 'が', 'あったら', '旅行します'],
    translation: 'Если будут деньги, поеду путешествовать.',
    romaji: 'Okane ga attara, ryokou shimasu.',
    hint: 'деньги + подлежащее + быть(если бы) + путешествовать',
    lesson: 25,
  },
  {
    correct: ['春', 'に', 'なったら', '花見', 'を', 'しましょう'],
    translation: 'Когда наступит весна, давайте пойдём на ханами.',
    romaji: 'Haru ni nattara, hanami o shimashou.',
    hint: 'весна + направление + настанет(если) + ханами + объект + давайте',
    lesson: 25,
  },
  {
    correct: ['雨', 'が', '降っても', '洗濯します'],
    translation: 'Несмотря на дождь, постираю.',
    romaji: 'Ame ga futte mo, sentaku shimasu.',
    hint: 'дождь + подлежащее + идти(て+も=даже если) + стирать',
    lesson: 25,
  },
  {
    correct: ['ドア', 'が', '開きました'],
    translation: 'Дверь открылась.',
    romaji: 'Doa ga akimashita.',
    hint: 'дверь + подлежащее + открылась(непереходн.)',
    lesson: 25,
  },
  {
    correct: ['窓', 'を', '開けました'],
    translation: 'Я открыл окно.',
    romaji: 'Mado o akemashita.',
    hint: 'окно + объект + открыл(переходн.)',
    lesson: 25,
  },
  {
    correct: ['電気', 'が', '消えました'],
    translation: 'Свет погас.',
    romaji: 'Denki ga kiemashita.',
    hint: 'свет + подлежащее + погас(непереходн.)',
    lesson: 25,
  },
  {
    correct: ['電気', 'を', '消しました'],
    translation: 'Я выключил свет.',
    romaji: 'Denki o keshimashita.',
    hint: 'свет + объект + выключил(переходн.)',
    lesson: 25,
  },
  {
    correct: ['水', 'を', '出したら', 'お湯', 'が', '出ました'],
    translation: 'Когда открыл воду, потёк кипяток.',
    romaji: 'Mizu o dashitara, oyu ga demashita.',
    hint: 'вода + объект + пустить(если) + горячая вода + подлежащее + вышла(непереходн.)',
    lesson: 25,
  },

  // Lesson 1 — extra
  {
    correct: ['これ', 'は', 'わたし', 'の', '名刺', 'です'],
    translation: 'Это моя визитка.',
    romaji: 'Kore wa watashi no meishi desu.',
    hint: 'это + тема + я + притяж. + визитка + есть',
    lesson: 1,
  },
  {
    correct: ['田中さん', 'は', '先生', 'です', 'か'],
    translation: 'Танака — учитель?',
    romaji: 'Tanaka-san wa sensei desu ka.',
    hint: 'Танака + тема + учитель + есть + вопрос',
    lesson: 1,
  },

  // Lesson 2 — extra
  {
    correct: ['その', 'かばん', 'は', 'いくら', 'です', 'か'],
    translation: 'Сколько стоит эта сумка?',
    romaji: 'Sono kaban wa ikura desu ka.',
    hint: 'та(рядом) + сумка + тема + сколько + есть + вопрос',
    lesson: 2,
  },
  {
    correct: ['これ', 'は', '山田さん', 'の', '傘', 'では', 'ありません'],
    translation: 'Это не зонт Ямады.',
    romaji: 'Kore wa Yamada-san no kasa de wa arimasen.',
    hint: 'это + тема + Ямада + притяж. + зонт + не + есть',
    lesson: 2,
  },

  // Lesson 3 — extra
  {
    correct: ['銀行', 'は', 'どこ', 'です', 'か'],
    translation: 'Где банк?',
    romaji: 'Ginkou wa doko desu ka.',
    hint: 'банк + тема + где + есть + вопрос',
    lesson: 3,
  },
  {
    correct: ['郵便局', 'は', 'あの', 'ビル', 'の', '中', 'です'],
    translation: 'Почта находится в том здании.',
    romaji: 'Yuubinkyoku wa ano biru no naka desu.',
    hint: 'почта + тема + то + здание + притяж. + внутри + есть',
    lesson: 3,
  },

  // Lesson 4 — extra
  {
    correct: ['日曜日', 'に', '友達', 'と', '映画', 'を', '見ます'],
    translation: 'В воскресенье смотрю фильм с другом.',
    romaji: 'Nichiyoubi ni tomodachi to eiga o mimasu.',
    hint: 'воскресенье + в(время) + друг + с + фильм + объект + смотреть',
    lesson: 4,
  },
  {
    correct: ['先週', 'の', '月曜日', 'に', '病院', 'へ', '行きました'],
    translation: 'На прошлой неделе в понедельник ходил в больницу.',
    romaji: 'Senshuu no getsuyoubi ni byouin e ikimashita.',
    hint: 'прошлая неделя + притяж. + понедельник + в(время) + больница + направление + ходил',
    lesson: 4,
  },

  // Lesson 7 — extra
  {
    correct: ['母', 'に', 'バッグ', 'を', 'もらいました'],
    translation: 'Я получила сумку от мамы.',
    romaji: 'Haha ni baggu o moraimashita.',
    hint: 'мама + от + сумка + объект + получить',
    lesson: 7,
  },
  {
    correct: ['友達', 'の', '誕生日', 'に', 'ケーキ', 'を', 'あげました'],
    translation: 'Я подарил торт другу на день рождения.',
    romaji: 'Tomodachi no tanjoubi ni keeki o agemashita.',
    hint: 'друг + притяж. + день рождения + в(время) + торт + объект + подарил',
    lesson: 7,
  },

  // Lesson 16 — extra: adjective て-connection
  {
    correct: ['この', 'かばん', 'は', '高くて', '重い', 'です'],
    translation: 'Эта сумка дорогая и тяжёлая.',
    romaji: 'Kono kaban wa takakute omoi desu.',
    hint: 'эта + сумка + тема + дорогая(くて-соед.) + тяжёлая + есть',
    lesson: 16,
  },
  {
    correct: ['東京', 'は', 'にぎやか', 'で', 'きれい', 'な', '町', 'です'],
    translation: 'Токио — оживлённый и красивый город.',
    romaji: 'Toukyou wa nigiyaka de kirei na machi desu.',
    hint: 'Токио + тема + оживлённый(で-соед.) + красивый(な-прил.) + город + есть',
    lesson: 16,
  },

  // Lesson 10 — extra
  {
    correct: ['冷蔵庫', 'の', '中', 'に', 'ビール', 'が', 'あります'],
    translation: 'В холодильнике есть пиво.',
    romaji: 'Reizouko no naka ni biiru ga arimasu.',
    hint: 'холодильник + притяж. + внутри + в(место) + пиво + подлежащее + есть(неодуш.)',
    lesson: 10,
  },
  {
    correct: ['会社', 'の', 'そば', 'に', 'コンビニ', 'が', 'あります'],
    translation: 'Рядом с офисом есть магазин.',
    romaji: 'Kaisha no soba ni konbini ga arimasu.',
    hint: 'офис + притяж. + рядом + в(место) + конбини + подлежащее + есть(неодуш.)',
    lesson: 10,
  },

  // Lesson 11 — extra
  {
    correct: ['切手', 'を', '5枚', '買いました'],
    translation: 'Купил 5 марок.',
    romaji: 'Kitte o go-mai kaimashita.',
    hint: 'марка + объект + 5 штук(плоских) + купил',
    lesson: 11,
  },
  {
    correct: ['このクラス', 'に', 'ペン', 'が', '3本', 'あります'],
    translation: 'В этом классе 3 ручки.',
    romaji: 'Kono kurasu ni pen ga san-bon arimasu.',
    hint: 'этот класс + в(место) + ручка + подлежащее + 3 штуки(длинных) + есть',
    lesson: 11,
  },

  // Lesson 12 — extra
  {
    correct: ['サッカー', 'は', '野球', 'より', '人気', 'が', 'あります'],
    translation: 'Футбол популярнее бейсбола.',
    romaji: 'Sakkaa wa yakyuu yori ninki ga arimasu.',
    hint: 'футбол + тема + бейсбол + чем + популярность + подлежащее + есть',
    lesson: 12,
  },
  {
    correct: ['夏', 'と', '冬', 'と', 'どちら', 'が', '好き', 'です', 'か'],
    translation: 'Что нравится больше — лето или зима?',
    romaji: 'Natsu to fuyu to dochira ga suki desu ka.',
    hint: 'лето + и + зима + и + какой из двух + подлежащее + нравится + есть + вопрос',
    lesson: 12,
  },

  // Lesson 13 — extra
  {
    correct: ['新しい', 'パソコン', 'が', 'ほしい', 'です'],
    translation: 'Хочу новый компьютер.',
    romaji: 'Atarashii pasokon ga hoshii desu.',
    hint: 'новый + компьютер + подлежащее(желание) + хочу + есть',
    lesson: 13,
  },
  {
    correct: ['今日', 'は', 'どこ', 'へも', '行きたく', 'ない', 'です'],
    translation: 'Сегодня никуда не хочу идти.',
    romaji: 'Kyou wa doko e mo ikitaku nai desu.',
    hint: 'сегодня + тема + никуда + не хочу идти + нет + есть',
    lesson: 13,
  },

  // Lesson 15 — extra
  {
    correct: ['田中さん', 'は', '今', '何', 'を', 'して', 'います', 'か'],
    translation: 'Чем сейчас занимается Танака?',
    romaji: 'Tanaka-san wa ima nani o shite imasu ka.',
    hint: 'Танака + тема + сейчас + что + объект + делать(て) + есть(прогрессив) + вопрос',
    lesson: 15,
  },
  {
    correct: ['姉', 'は', '銀行', 'で', '働いて', 'います'],
    translation: 'Сестра работает в банке.',
    romaji: 'Ane wa ginkou de hataraite imasu.',
    hint: 'старшая сестра + тема + банк + место + работать(て) + быть(состояние)',
    lesson: 15,
  },
  {
    correct: ['ここ', 'で', '写真', 'を', '撮っても', 'いいですか'],
    translation: 'Можно здесь фотографировать?',
    romaji: 'Koko de shashin o tottemo ii desu ka.',
    hint: 'здесь + в(место) + фото + объект + снять(て)も + можно?',
    lesson: 15,
  },
  {
    correct: ['この', '部屋', 'で', 'タバコ', 'を', '吸っては', 'いけません'],
    translation: 'В этой комнате нельзя курить.',
    romaji: 'Kono heya de tabako o sutte wa ikemasen.',
    hint: 'эта + комната + в(место) + сигарета + объект + курить(て)は + нельзя',
    lesson: 15,
  },

  // Lesson 16 — extra
  {
    correct: ['歯', 'を', '磨いて', 'から', '寝ます'],
    translation: 'Почищу зубы и лягу спать.',
    romaji: 'Ha o migaite kara nemasu.',
    hint: 'зубы + объект + чистить(те) + после + спать',
    lesson: 16,
  },
  {
    correct: ['大学', 'を', '卒業して', 'から', '働きます'],
    translation: 'После окончания университета буду работать.',
    romaji: 'Daigaku o sotsugyou shite kara hatarakimasu.',
    hint: 'университет + объект + окончить(те) + после + работать',
    lesson: 16,
  },

  // Lesson 17 — extra
  {
    correct: ['もっと', '野菜', 'を', '食べなければ', 'なりません'],
    translation: 'Нужно есть больше овощей.',
    romaji: 'Motto yasai o tabenakereba narimasen.',
    hint: 'ещё + овощи + объект + должен есть + необходимо',
    lesson: 17,
  },
  {
    correct: ['今日', 'は', '学校', 'に', '来なくて', 'も', 'いいです'],
    translation: 'Сегодня необязательно приходить в школу.',
    romaji: 'Kyou wa gakkou ni konakute mo ii desu.',
    hint: 'сегодня + тема + школа + в + не приходить(те) + тоже + хорошо + есть',
    lesson: 17,
  },

  // Lesson 18 — extra
  {
    correct: ['子供', 'の', 'とき', '水泳', 'が', 'できました'],
    translation: 'В детстве я умел плавать.',
    romaji: 'Kodomo no toki suiei ga dekimashita.',
    hint: 'ребёнок + притяж. + время + плавание + подлежащее + мог',
    lesson: 18,
  },
  {
    correct: ['漢字', 'を', '書く', 'こと', 'が', 'できません'],
    translation: 'Я не умею писать кандзи.',
    romaji: 'Kanji o kaku koto ga dekimasen.',
    hint: 'кандзи + объект + писать(словарн.) + дело + подлежащее + не мочь',
    lesson: 18,
  },

  // Lesson 19 — extra
  {
    correct: ['ヨーロッパ', 'に', '行った', 'こと', 'が', 'あります', 'か'],
    translation: 'Вы когда-нибудь бывали в Европе?',
    romaji: 'Yooroppa ni itta koto ga arimasu ka.',
    hint: 'Европа + в(место) + ехать(прош.) + дело + подлежащее + иметь опыт + вопрос',
    lesson: 19,
  },
  {
    correct: ['週末', 'は', '映画', 'を', '見たり', '音楽', 'を', '聴いたり', 'します'],
    translation: 'По выходным смотрю фильмы, слушаю музыку.',
    romaji: 'Shuumatsu wa eiga o mitari ongaku o kiitari shimasu.',
    hint: 'выходные + тема + фильм + объект + смотреть(たり) + музыка + объект + слушать(たり) + делать',
    lesson: 19,
  },

  // Lesson 20 — extra
  {
    correct: ['彼女', 'は', 'もう', '来ない', 'と', '思います'],
    translation: 'Думаю, она больше не придёт.',
    romaji: 'Kanojo wa mou konai to omoimasu.',
    hint: 'она + тема + уже + не прийти(прост.) + что + думать',
    lesson: 20,
  },
  {
    correct: ['先生', 'は', '明日', 'テスト', 'が', 'あると', '言いました'],
    translation: 'Учитель сказал, что завтра тест.',
    romaji: 'Sensei wa ashita tesuto ga aru to iimashita.',
    hint: 'учитель + тема + завтра + тест + подлежащее + есть(прост.) + что + сказал',
    lesson: 20,
  },

  // Lesson 21 — extra
  {
    correct: ['財布', 'を', '盗まれました'],
    translation: 'У меня украли кошелёк.',
    romaji: 'Saifu o nusumaremashita.',
    hint: 'кошелёк + объект + украли(пассив)',
    lesson: 21,
  },
  {
    correct: ['わたし', 'は', '犬', 'に', 'かまれました'],
    translation: 'Меня укусила собака.',
    romaji: 'Watashi wa inu ni kamaremashita.',
    hint: 'я + тема + собака + агент + укусили(пассив)',
    lesson: 21,
  },

  // Lesson 22 — extra (relative clauses / noun modification)
  {
    correct: ['さっき', '電話', 'した', '人', 'は', '田中さん', 'です'],
    translation: 'Человек, который только что звонил, — Танака.',
    romaji: 'Sakki denwa shita hito wa Tanaka-san desu.',
    hint: 'только что + звонить + сделавший + человек + тема + Танака + есть',
    lesson: 22,
  },
  {
    correct: ['山田さん', 'が', '作った', '料理', 'は', 'おいしかった', 'です'],
    translation: 'Блюдо, приготовленное Ямадой, было вкусным.',
    romaji: 'Yamada-san ga tsukutta ryouri wa oishikatta desu.',
    hint: 'Ямада + подлежащее + приготовил + еда + тема + вкусным + было',
    lesson: 22,
  },

  // Lesson 23 — extra (と conditional / とき)
  {
    correct: ['ここ', 'を', '押す', 'と', '電気', 'が', 'つきます'],
    translation: 'Если нажать здесь, свет включится.',
    romaji: 'Koko o osu to, denki ga tsukimasu.',
    hint: 'здесь + объект + нажать + если(то) + свет + подлежащее + включится',
    lesson: 23,
  },
  {
    correct: ['暇な', 'とき', '映画', 'を', '見ます'],
    translation: 'Когда свободен, смотрю кино.',
    romaji: 'Hima na toki, eiga o mimasu.',
    hint: 'свободный + когда + кино + объект + смотрю',
    lesson: 23,
  },

  // Lesson 24 — extra (てあげる / てもらう / てくれる)
  {
    correct: ['妹', 'に', 'ケーキ', 'を', '作って', 'あげました'],
    translation: 'Испекла торт для сестры.',
    romaji: 'Imouto ni keeki o tsukutte agemashita.',
    hint: 'младшая сестра + кому + торт + объект + делать(те) + дала(ей)',
    lesson: 24,
  },
  {
    correct: ['友達', 'が', '荷物', 'を', '持って', 'くれました'],
    translation: 'Друг перенёс мои вещи за меня.',
    romaji: 'Tomodachi ga nimotsu o motte kuremashita.',
    hint: 'друг + подлежащее + багаж + объект + нести(те) + дал(в мою пользу)',
    lesson: 24,
  },

  // Hard sentences (7+ tokens) for lessons with no hard difficulty options
  // Lesson 1 — hard (8 tokens)
  {
    correct: ['これ', 'は', 'わたし', 'の', '会社', 'の', '名刺', 'です'],
    translation: 'Это визитка моей компании.',
    romaji: 'Kore wa watashi no kaisha no meishi desu.',
    hint: 'это + тема + я + притяж. + компания + притяж. + визитка + есть',
    lesson: 1,
  },

  // Lesson 5 — hard (9 tokens)
  {
    correct: ['友達', 'と', 'いっしょ', 'に', 'デパート', 'へ', '買い物', 'に', '行きます'],
    translation: 'Иду за покупками в торговый центр с другом.',
    romaji: 'Tomodachi to issho ni depaato e kaimono ni ikimasu.',
    hint: 'друг + с + вместе + в + торговый центр + направление + шоппинг + в(цель) + иду',
    lesson: 5,
  },

  // Lesson 6 — hard (7 tokens)
  {
    correct: ['レストラン', 'で', '友達', 'と', '昼ご飯', 'を', '食べました'],
    translation: 'Пообедал в ресторане с другом.',
    romaji: 'Resutoran de tomodachi to hirugohan o tabemashita.',
    hint: 'ресторан + в(место) + друг + с + обед + объект + ел',
    lesson: 6,
  },

  // Lesson 9 — hard (10 tokens)
  {
    correct: ['わたし', 'の', '父', 'は', 'スポーツ', 'が', 'あまり', '好き', 'じゃ', 'ありません'],
    translation: 'Мой папа не очень любит спорт.',
    romaji: 'Watashi no chichi wa supootsu ga amari suki ja arimasen.',
    hint: 'я + притяж. + папа + тема + спорт + объект(чувство) + не очень + нравится + не + есть',
    lesson: 9,
  },

  // Lesson 16 — hard (7 tokens)
  {
    correct: ['シャワー', 'を', 'あびて', 'から', '朝ご飯', 'を', '食べました'],
    translation: 'После того как принял душ, позавтракал.',
    romaji: 'Shawaa o abite kara asagohan o tabemashita.',
    hint: 'душ + объект + принять(те) + после + завтрак + объект + ел',
    lesson: 16,
  },

  // Lesson 21 — hard (9 tokens)
  {
    correct: ['となり', 'の', '部屋', 'の', '人', 'に', 'うるさい', 'と', 'いわれました'],
    translation: 'Сосед из соседней комнаты сказал, что я шумлю.',
    romaji: 'Tonari no heya no hito ni urusai to iwaremashita.',
    hint: 'соседний + притяж. + комната + притяж. + человек + агент + шумный + цитата + сказали(пассив)',
    lesson: 21,
  },

  // Lesson 24 — hard (11 tokens)
  {
    correct: ['母', 'は', 'いつも', 'わたし', 'の', 'ために', 'おいしい', '料理', 'を', '作って', 'くれます'],
    translation: 'Мама всегда готовит вкусную еду для меня.',
    romaji: 'Haha wa itsumo watashi no tame ni oishii ryouri o tsukutte kuremasu.',
    hint: 'мама + тема + всегда + я + притяж. + ради + вкусный + еда + объект + готовит(те) + даёт(в мою пользу)',
    lesson: 24,
  },

  // Lesson 25 — hard (8 tokens)
  {
    correct: ['もし', '明日', '雨', 'が', '降ったら', 'うち', 'に', 'います'],
    translation: 'Если завтра пойдёт дождь, буду дома.',
    romaji: 'Moshi ashita ame ga futtara, uchi ni imasu.',
    hint: 'если + завтра + дождь + подлежащее + пойдёт(если) + дома + в(место) + буду',
    lesson: 25,
  },

  // Lesson 8 — extra (to replace sentences moved to L16)
  {
    correct: ['きのう', 'は', 'とても', '寒かった', 'です'],
    translation: 'Вчера было очень холодно.',
    romaji: 'Kinou wa totemo samukatta desu.',
    hint: 'вчера + тема + очень + холодный(прош.) + есть',
    lesson: 8,
  },
  {
    correct: ['この', 'ラーメン', 'は', 'おいしく', 'ない', 'です'],
    translation: 'Этот рамен невкусный.',
    romaji: 'Kono raamen wa oishiku nai desu.',
    hint: 'этот + рамен + тема + вкусный(く-отриц.) + нет + есть',
    lesson: 8,
  },
]

const PHASE_SETUP = 'setup'
const PHASE_GAME = 'game'
const PHASE_RESULTS = 'results'

const DIFFICULTY = {
  easy: { label: 'easy', labelRu: 'легко', min: 3, max: 5, emoji: '🌸' },
  medium: { label: 'medium', labelRu: 'средне', min: 5, max: 7, emoji: '🌺' },
  hard: { label: 'hard', labelRu: 'сложно', min: 7, max: 99, emoji: '🔥' },
}

const scoreReactions = [
  { min: 100, emoji: '🎉✨🐱', text: 'kanpeki! идеально!', textJp: '完璧！' },
  { min: 90, emoji: '🎉✨', text: 'sugoi!! потрясающе!', textJp: 'すごい！' },
  { min: 70, emoji: '🌸😊', text: 'yoku dekimashita! хорошо!', textJp: 'よくできました！' },
  { min: 50, emoji: '🐱💪', text: 'mada mada~ ещё чуть-чуть!', textJp: 'まだまだ！' },
  { min: 0, emoji: '🌙📚', text: 'ganbatte! давай повторим~', textJp: 'がんばって！' },
]

// get all unique lessons from data
const allLessonNums = [...new Set(sentences.map(s => s.lesson))].sort((a, b) => a - b)

export default function SentenceBuilder() {
  const [searchParams] = useSearchParams()
  const [phase, setPhase] = useState(PHASE_SETUP)

  // setup state
  const [difficulty, setDifficulty] = useState('medium')
  const [selectedLessons, setSelectedLessons] = useState(() => {
    const lessonParam = searchParams.get('lesson')
    if (lessonParam) {
      const id = parseInt(lessonParam, 10)
      if (allLessonNums.includes(id)) return [id]
    }
    return []
  })
  const [questionCount, setQuestionCount] = useState(10)

  // game state
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState([])     // indices of tiles user tapped (into answer area)
  const [shuffledWords, setShuffledWords] = useState([])
  const [showHint, setShowHint] = useState(false)
  const [isCorrect, setIsCorrect] = useState(null)  // null | true | false
  const [score, setScore] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const streakRef = useRef(0)
  const [mistakes, setMistakes] = useState([])
  const [shaking, setShaking] = useState(false)
  const [greenFlash, setGreenFlash] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [totalHintsUsed, setTotalHintsUsed] = useState(0)
  const [hintedIndices, setHintedIndices] = useState(new Set())
  const [glowingTileIdx, setGlowingTileIdx] = useState(null)
  const maxHints = 3
  const advanceTimer = useRef(null)
  const hintTimer = useRef(null)
  const advanceLockedRef = useRef(false)
  const xpAwardedRef = useRef(false)

  const { awardXP, calculateQuizXP } = useXP()
  const { saveQuizResult } = useProgress()
  const { unlockedLessons } = useUnlockedLessons()
  const sharedLessonId = parseInt(searchParams.get('lesson') || '', 10)
  const unlockedIds = unlockedLessons.map(l => l.id)
  // Only show unlocked lessons by default; a direct ?lesson=X link may add one shared lesson.
  const availableLessonNums = allLessonNums.filter(n =>
    unlockedIds.includes(n) || n === sharedLessonId
  )

  // Award XP when results phase is reached
  useEffect(() => {
    if (phase === PHASE_RESULTS && questions.length > 0 && !xpAwardedRef.current) {
      xpAwardedRef.current = true
      saveQuizResult('grammar', { lessons: selectedLessons.length > 0 ? selectedLessons : availableLessonNums, score, total: questions.length })
      const xp = calculateQuizXP(score, questions.length)
      if (xp > 0) awardXP(xp, 'sentence builder', score === questions.length && questions.length > 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // toggle lesson selection
  const toggleLesson = (num) => {
    setSelectedLessons(prev =>
      prev.includes(num) ? prev.filter(x => x !== num) : [...prev, num]
    )
  }

  const selectAll = () => {
    if (selectedLessons.length === availableLessonNums.length) {
      setSelectedLessons([])
    } else {
      setSelectedLessons([...availableLessonNums])
    }
  }

  // start the game
  const startGame = () => {
    xpAwardedRef.current = false
    const diff = DIFFICULTY[difficulty]
    const lessonsToUse = selectedLessons.length > 0 ? selectedLessons : availableLessonNums
    const pool = sentences.filter(s => {
      if (!lessonsToUse.includes(s.lesson)) return false
      const len = s.correct.length
      return len >= diff.min && len <= diff.max
    })
    if (pool.length === 0) return

    const count = Math.min(questionCount, pool.length)
    const picked = shuffle(pool).slice(0, count)
    setQuestions(picked)
    setCurrentIndex(0)
    setScore(0)
    streakRef.current = 0
    setBestStreak(0)
    setMistakes([])
    setSelected([])
    setShowHint(false)
    setIsCorrect(null)
    setShaking(false)
    setGreenFlash(false)
    setHintsUsed(0)
    setTotalHintsUsed(0)
    setHintedIndices(new Set())
    setGlowingTileIdx(null)
    setShuffledWords(shuffle(picked[0].correct.map((w, i) => ({ word: w, originalIndex: i }))))
    setPhase(PHASE_GAME)
  }

  const startMistakesGame = () => {
    if (mistakes.length === 0) return
    const picked = shuffle(mistakes.map(m => m.sentence))
    // xpAwardedRef stays true — no re-award on retry
    setQuestions(picked)
    setCurrentIndex(0)
    setScore(0)
    streakRef.current = 0
    setBestStreak(0)
    setMistakes([])
    setSelected([])
    setShowHint(false)
    setIsCorrect(null)
    setShaking(false)
    setGreenFlash(false)
    setHintsUsed(0)
    setTotalHintsUsed(0)
    setHintedIndices(new Set())
    setGlowingTileIdx(null)
    setShuffledWords(shuffle(picked[0].correct.map((w, i) => ({ word: w, originalIndex: i }))))
    setPhase(PHASE_GAME)
  }

  // load shuffled words when question changes
  useEffect(() => {
    if (phase === PHASE_GAME && questions[currentIndex]) {
      setShuffledWords(shuffle(questions[currentIndex].correct.map((w, i) => ({ word: w, originalIndex: i }))))
      setSelected([])
      setShowHint(false)
      setIsCorrect(null)
      advanceLockedRef.current = false
      setShaking(false)
      setGreenFlash(false)
      setHintsUsed(0)
      setHintedIndices(new Set())
      setGlowingTileIdx(null)
    }
  }, [currentIndex, phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // tap a tile to add to answer
  const tapTile = useCallback((tileIndex) => {
    if (isCorrect !== null) return
    setSelected(prev => {
      if (prev.includes(tileIndex)) return prev
      return [...prev, tileIndex]
    })
  }, [isCorrect])

  // tap a slot to remove from answer
  const removeTile = useCallback((positionInAnswer) => {
    if (isCorrect !== null) return
    setSelected(prev => prev.filter((_, i) => i !== positionInAnswer))
  }, [isCorrect])

  // clear all
  const clearAll = useCallback(() => {
    if (isCorrect !== null) return
    setSelected([])
  }, [isCorrect])

  // use a hint: find the next correct tile, glow it, then auto-place after 500ms
  const useHintAction = useCallback(() => {
    if (isCorrect !== null) return
    if (hintsUsed >= maxHints) return
    if (!questions[currentIndex]) return

    const q = questions[currentIndex]
    // The next position in the answer is selected.length
    const nextPos = selected.length
    if (nextPos >= q.correct.length) return

    const nextCorrectWord = q.correct[nextPos]
    // Find the tile index in shuffledWords that matches and is not yet used
    const tileIdx = shuffledWords.findIndex((item, idx) =>
      !selected.includes(idx) && item.word === nextCorrectWord
    )
    if (tileIdx === -1) return

    // Track hint usage
    setHintsUsed(prev => prev + 1)
    setTotalHintsUsed(prev => prev + 1)
    setHintedIndices(prev => new Set([...prev, tileIdx]))
    setGlowingTileIdx(tileIdx)

    // Auto-place after 500ms delay
    clearTimeout(hintTimer.current)
    hintTimer.current = setTimeout(() => {
      setGlowingTileIdx(null)
      setSelected(prev => {
        if (prev.includes(tileIdx)) return prev
        return [...prev, tileIdx]
      })
    }, 500)
  }, [isCorrect, hintsUsed, maxHints, questions, currentIndex, selected, shuffledWords])

  // cleanup hint timer on unmount
  useEffect(() => {
    return () => {
      if (hintTimer.current) clearTimeout(hintTimer.current)
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
    }
  }, [])

  // check answer when all tiles are placed
  useEffect(() => {
    if (phase !== PHASE_GAME) return
    if (!questions[currentIndex]) return
    if (isCorrect !== null) return

    const q = questions[currentIndex]
    if (selected.length !== q.correct.length) return

    // build user's answer
    const userAnswer = selected.map(idx => shuffledWords[idx].word)
    const correct = userAnswer.every((w, i) => w === q.correct[i])

    setIsCorrect(correct)

    if (correct) {
      // Each hint reduces score by 1, but minimum contribution is 0
      const pointsEarned = Math.max(0, 1 - hintsUsed)
      setScore(prev => prev + pointsEarned)
      streakRef.current += 1
      setBestStreak(b => Math.max(b, streakRef.current))
      setGreenFlash(true)
    } else {
      streakRef.current = 0
      setShaking(true)
      setMistakes(prev => [...prev, {
        sentence: q,
        userOrder: userAnswer,
      }])
    }
  }, [selected, phase, currentIndex, questions, shuffledWords, isCorrect, hintsUsed])

  // auto-advance after answering (separate effect so the check effect's cleanup
  // doesn't cancel the timer when isCorrect state change triggers a re-render)
  useEffect(() => {
    if (phase !== PHASE_GAME || isCorrect === null) return
    advanceLockedRef.current = false
    const delay = isCorrect ? 1200 : 2500
    advanceTimer.current = setTimeout(() => {
      if (advanceLockedRef.current) return
      advanceLockedRef.current = true
      setShaking(false)
      if (currentIndex + 1 >= questions.length) {
        setPhase(PHASE_RESULTS)
      } else {
        setCurrentIndex(prev => prev + 1)
      }
    }, delay)
    return () => { if (advanceTimer.current) clearTimeout(advanceTimer.current) }
  }, [phase, isCorrect, currentIndex, questions.length])

  // keyboard support: 1-9 selects tile, Backspace removes last tile
  useEffect(() => {
    if (phase !== PHASE_GAME) return
    const handler = (e) => {
      if (isCorrect !== null) return
      if (e.key === 'Backspace') {
        if (selected.length > 0) removeTile(selected.length - 1)
        return
      }
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= shuffledWords.length) {
        const tileIdx = num - 1
        if (!selected.includes(tileIdx)) tapTile(tileIdx)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, isCorrect, selected, shuffledWords, tapTile, removeTile])

  const skipDelay = useCallback(() => {
    if (isCorrect === null || advanceLockedRef.current) return
    advanceLockedRef.current = true
    clearTimeout(advanceTimer.current)
    setShaking(false)
    if (currentIndex + 1 >= questions.length) {
      setPhase(PHASE_RESULTS)
    } else {
      setCurrentIndex(prev => prev + 1)
    }
  }, [isCorrect, currentIndex, questions.length])

  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
  const reaction = scoreReactions.find(r => percentage >= r.min) || scoreReactions[scoreReactions.length - 1]

  // filter available sentences count for UI
  const countLessons = selectedLessons.length > 0 ? selectedLessons : availableLessonNums
  const availableCount = sentences.filter(s => {
    if (!countLessons.includes(s.lesson)) return false
    const diff = DIFFICULTY[difficulty]
    return s.correct.length >= diff.min && s.correct.length <= diff.max
  }).length


  // scroll to top when results phase begins
  useEffect(() => {
    if (phase === PHASE_RESULTS) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [phase])

  return (
    <div className="page">
      <style>{`
        .sb-tile:not(:disabled):hover {
          transform: translateY(-3px) scale(1.06);
          box-shadow: 0 6px 20px rgba(168,85,247,0.18), 0 2px 6px rgba(0,0,0,0.06);
          border-color: rgba(192,132,252,0.5);
        }
        .sb-tile:not(:disabled):active {
          transform: scale(0.96) translateY(-1px);
        }
        .sb-slot-filled:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(244,114,182,0.18);
        }
        .sb-slot-filled:active {
          transform: scale(0.96);
        }
        [data-theme="dark"] .sb-tile:not(:disabled) {
          background: rgba(40,20,60,0.7);
        }
      `}</style>

      {phase === PHASE_SETUP && (
        <SetupScreen
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          selectedLessons={selectedLessons}
          toggleLesson={toggleLesson}
          selectAll={selectAll}
          availableLessonNums={availableLessonNums}
          questionCount={questionCount}
          setQuestionCount={setQuestionCount}
          availableCount={availableCount}
          onStart={startGame}
        />
      )}

      {phase === PHASE_GAME && questions[currentIndex] && (
        <GameScreen
          question={questions[currentIndex]}
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          score={score}
          shuffledWords={shuffledWords}
          selected={selected}
          showHint={showHint}
          setShowHint={setShowHint}
          isCorrect={isCorrect}
          shaking={shaking}
          greenFlash={greenFlash}
          onTapTile={tapTile}
          onRemoveTile={removeTile}
          onClear={clearAll}
          hintsUsed={hintsUsed}
          maxHints={maxHints}
          hintedIndices={hintedIndices}
          glowingTileIdx={glowingTileIdx}
          onUseHint={useHintAction}
          onSkipDelay={skipDelay}
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
          xpEarned={questions.length > 0 ? calculateQuizXP(score, questions.length) : 0}
          totalHintsUsed={totalHintsUsed}
          onRetry={() => setPhase(PHASE_SETUP)}
          onRetryMistakes={startMistakesGame}
        />
      )}
    </div>
  )
}

// ─── Setup Screen ───

function SetupScreen({ difficulty, setDifficulty, selectedLessons, toggleLesson, selectAll, availableLessonNums, questionCount, setQuestionCount, availableCount, onStart }) {
  const isMobile = useIsMobile()
  const canStart = availableCount > 0

  return (
    <div className="animate-fadeInUp" style={{ paddingBottom: 100 }}>
      <div style={s.header}>
        <div style={s.headerIcon}>🧩</div>
        <h1 style={s.title}>
          sentence builder <span style={s.titleJp}>文を作ろう</span>
        </h1>
        <p style={s.subtitle}>tap words in the correct order to build japanese sentences</p>
      </div>

      {/* difficulty */}
      <div className="glass" style={s.setupCard}>
        <div style={s.setupLabel}><span>🎯</span> difficulty</div>
        <div style={{ ...s.difficultyRow, gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' }}>
          {Object.entries(DIFFICULTY).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setDifficulty(key)}
              className="glass-sm"
              style={{
                ...s.diffBtn,
                ...(difficulty === key ? s.diffBtnActive : {}),
              }}
            >
              <span style={s.diffEmoji}>{val.emoji}</span>
              <span style={s.diffLabel}>{val.label}</span>
              <span style={s.diffLabelRu}>{val.labelRu}</span>
              <span style={s.diffRange}>{val.min}–{val.max === 99 ? '∞' : val.max} words</span>
            </button>
          ))}
        </div>
      </div>

      {/* lesson selection */}
      <div className="glass" style={s.setupCard}>
        <div style={s.setupLabel}><span>📚</span> lessons</div>
        <button onClick={selectAll} className="btn-hover" style={s.selectAllBtn}>
          {selectedLessons.length === availableLessonNums.length ? 'deselect all' : 'select all'}
        </button>
        <div style={s.lessonGrid}>
          {availableLessonNums.map(num => {
            const count = sentences.filter(se => se.lesson === num).length
            const isActive = selectedLessons.includes(num)
            return (
              <label
                key={num}
                style={{
                  ...s.lessonCheck,
                  ...(isActive ? s.lessonCheckActive : {}),
                }}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => toggleLesson(num)}
                  style={{ display: 'none' }}
                />
                <span style={s.checkNum}>{num}</span>
                <span style={s.checkCount}>{count} sent.</span>
              </label>
            )
          })}
        </div>
        {selectedLessons.length === 0 && (
          <div style={s.poolInfo}>all lessons selected by default</div>
        )}
      </div>

      {/* question count */}
      <div className="glass" style={s.setupCard}>
        <div style={s.setupLabel}><span>🔢</span> how many questions?</div>
        <div style={s.sliderWrap}>
          <div style={s.sliderValueRow}>
            <input
              type="number"
              aria-label="number of questions"
              min={3}
              max={Math.max(availableCount, 3)}
              value={questionCount}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === '') { setQuestionCount(3); return }
                const v = parseInt(raw, 10)
                if (isNaN(v)) return
                setQuestionCount(Math.min(Math.max(availableCount, 3), Math.max(1, v)))
              }}
              onBlur={() => {
                if (questionCount < 3) setQuestionCount(3)
              }}
              style={s.numberInput}
            />
          </div>
          <input
            type="range"
            className="kawaii-slider"
            min={3}
            max={Math.max(availableCount, 3)}
            value={Math.min(questionCount, Math.max(availableCount, 3))}
            onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
            aria-label="number of questions"
          />
          <div style={s.sliderLabels}>
            <span>3</span>
            <span>{availableCount} available</span>
          </div>
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
          start building 🧩
        </button>
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <Link to="/quiz/vocab" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>vocab quiz ✨</Link>
          <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
        </div>
        {!canStart && (
          <p style={s.warnText}>no sentences match your filters — try changing difficulty or lessons</p>
        )}
      </div>
    </div>
  )
}

// ─── Game Screen ───

function GameScreen({
  question, currentIndex, totalQuestions, score,
  shuffledWords, selected, showHint, setShowHint,
  isCorrect, shaking, greenFlash,
  onTapTile, onRemoveTile, onClear,
  hintsUsed, maxHints, glowingTileIdx, onUseHint, onSkipDelay,
}) {
  const isMobile = useIsMobile()
  const progress = ((currentIndex + 1) / totalQuestions) * 100
  const totalSlots = question.correct.length

  return (
    <div className="animate-fadeInUp">
      {/* progress bar */}
      <div style={s.progressWrap}>
        <div style={s.progressInfo}>
          <Link to="/" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', opacity: 0.5, textDecoration: 'none', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', flexShrink: 0 }} aria-label="exit quiz">✕</Link>
          <span style={s.progressText}>{currentIndex + 1} / {totalQuestions}</span>
          <span style={s.scoreText} aria-live="polite" aria-atomic="true">score: {score} 🧩</span>
        </div>
        <div style={s.progressBar}>
          <div style={{ ...s.progressFill, width: `${progress}%` }} />
        </div>
      </div>

      {/* translation prompt */}
      <div
        className="glass"
        style={{
          ...s.promptCard,
          ...(!prefersReducedMotion && shaking ? { animation: 'shake 0.4s ease' } : {}),
          ...(greenFlash ? s.promptCardCorrect : {}),
        }}
      >
        <div style={s.promptLabel}>translate this sentence:</div>
        <div style={s.promptText}>{question.translation}</div>
        {question.lesson && (
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', marginTop: 6, opacity: 0.7 }}>L{question.lesson}</div>
        )}
        {showHint && (
          <div style={s.hintBox} className="animate-fadeInUp">
            <div style={s.hintRomaji}>{question.romaji}</div>
            <div style={s.hintStructure}>{question.hint}</div>
          </div>
        )}
      </div>

      {/* answer area — slots */}
      <div className="glass" style={s.answerArea}>
        <div style={s.answerLabel}>your sentence:</div>
        <div style={s.slotsRow}>
          {Array.from({ length: totalSlots }, (_, i) => {
            const tileIdx = selected[i]
            const word = tileIdx !== undefined ? shuffledWords[tileIdx].word : null

            if (word) {
              return (
                <button
                  key={i}
                  onClick={() => onRemoveTile(i)}
                  className="glass-sm animate-pop sb-slot-filled"
                  style={{
                    ...s.slotFilled,
                    ...(isCorrect === true ? s.slotCorrect : {}),
                    ...(isCorrect === false ? s.slotWrong : {}),
                  }}
                >
                  {word}
                </button>
              )
            }

            return (
              <div key={i} style={s.slotEmpty}>
                <span style={s.slotNum}>{i + 1}</span>
              </div>
            )
          })}
        </div>

        {/* correct answer reveal on mistake */}
        {isCorrect === false && (
          <div style={s.correctReveal} className="animate-fadeInUp">
            <div style={s.correctRevealLabel}>correct order:</div>
            <div style={s.correctRevealRow}>
              {question.correct.map((w, i) => (
                <span key={i} style={s.correctRevealWord}>{w}</span>
              ))}
            </div>
            {question.lesson && (
              <Link to={`/lessons/${question.lesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none', marginTop: 4, display: 'inline-block' }}>
                lesson {question.lesson} →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* word tiles */}
      <div style={s.tilesArea}>
        <div style={s.tilesGrid}>
          {shuffledWords.map((item, idx) => {
            const isUsed = selected.includes(idx)
            const isGlowing = glowingTileIdx === idx
            return (
              <button
                key={idx}
                onClick={() => onTapTile(idx)}
                className={`sb-tile glass-sm`}
                style={{
                  ...s.tile,
                  ...(isUsed ? s.tileUsed : {}),
                  ...(isGlowing ? s.tileGlow : {}),
                }}
                disabled={isUsed || isCorrect !== null || isGlowing}
              >
                {item.word}
              </button>
            )
          })}
        </div>
      </div>

      {/* keyboard hint — desktop only */}
      {!isMobile && isCorrect === null && (
        <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-light)', opacity: 0.6, marginBottom: 4, fontWeight: 600 }}>
          press 1–{shuffledWords.length} to place a tile · backspace to undo
        </div>
      )}

      {/* hint button */}
      <div style={s.hintBtnWrap}>
        <button
          className="glass-sm"
          onClick={onUseHint}
          disabled={hintsUsed >= maxHints || isCorrect !== null || selected.length >= question.correct.length}
          style={{
            ...s.hintBtn,
            ...(hintsUsed >= maxHints || isCorrect !== null || selected.length >= question.correct.length
              ? s.hintBtnDisabled
              : {}),
          }}
        >
          hint {'\uD83D\uDCA1'} ({maxHints - hintsUsed} left)
        </button>
      </div>

      {/* controls */}
      <div style={s.controlsRow}>
        <button
          className="btn btn-secondary"
          onClick={() => setShowHint(prev => !prev)}
          style={s.controlBtn}
        >
          {showHint ? 'hide hint' : 'hint 💡'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onClear}
          style={s.controlBtn}
          disabled={isCorrect !== null || selected.length === 0}
        >
          clear 🗑️
        </button>
      </div>

      {/* feedback flash */}
      {isCorrect === true && (
        <div style={s.feedbackCorrect} className="animate-pop">
          ✨ correct! sugoi~
        </div>
      )}
      {isCorrect === false && (
        <div style={{ ...s.feedbackWrong, cursor: 'pointer' }} className="animate-pop" onClick={onSkipDelay} role="button" tabIndex={0} aria-label="continue to next question" onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSkipDelay() } }}>
          <div>✗ not quite... check the correct order above</div>
          {question.hint && (
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 6, opacity: 0.9 }}>
              {question.hint}
            </div>
          )}
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 4 }}>нажми чтобы продолжить →</div>
        </div>
      )}
    </div>
  )
}

// ─── Results Screen ───

function ResultsScreen({ score, total, percentage, reaction, mistakes, bestStreak, xpEarned, totalHintsUsed, onRetry, onRetryMistakes }) {
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

        {/* hints used info */}
        {totalHintsUsed > 0 && (
          <div style={s.hintsUsedInfo}>
            hints used: {totalHintsUsed} (-{totalHintsUsed} pts)
          </div>
        )}

        {/* mistakes list */}
        {mistakes.length > 0 && (
          <div style={s.mistakesSection}>
            <div style={s.mistakesLabel}>mistakes ({mistakes.length}) ✏️</div>
            <div style={s.mistakesList}>
              {mistakes.map((m, i) => (
                <div key={(m.sentence.translation || '') + i} style={s.mistakeItem}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <div style={s.mistakeTranslation}>{m.sentence.translation}</div>
                    {m.sentence.lesson && (
                      <Link to={`/lessons/${m.sentence.lesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none', flexShrink: 0 }}>
                        lesson {m.sentence.lesson} →
                      </Link>
                    )}
                  </div>
                  <div style={s.mistakeCorrectRow}>
                    <span style={s.mistakeTag}>correct:</span>
                    <span style={s.mistakeCorrectText}>{m.sentence.correct.join(' ')}</span>
                  </div>
                  <div style={s.mistakeYoursRow}>
                    <span style={s.mistakeTag}>yours:</span>
                    <span style={s.mistakeYoursText}>{m.userOrder.join(' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={s.resultsActions}>
          <button className="btn btn-cute" onClick={onRetry}>
            try again 🧩
          </button>
          {mistakes.length > 0 && (
            <button className="btn btn-cute" onClick={onRetryMistakes} style={{ fontSize: '0.85rem' }}>
              retry mistakes ({mistakes.length} qs) 🎯
            </button>
          )}
          <ShareResult
            quizName="sentence builder"
            score={score}
            total={total}
            percentage={percentage}
            bestStreak={bestStreak}
            xpEarned={xpEarned}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/quiz/grammar" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>grammar 文</Link>
            <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Styles ───

const s = {
  // header
  header: {
    textAlign: 'center',
    marginBottom: 24,
    padding: '12px 0 4px',
  },
  headerIcon: {
    fontSize: '2.8rem',
    marginBottom: 8,
    filter: 'drop-shadow(0 4px 12px rgba(168,85,247,0.28))',
  },
  title: {
    fontSize: '1.65rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    textTransform: 'lowercase',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  titleJp: {
    fontSize: '0.88rem',
    color: 'var(--text-light)',
    fontWeight: 600,
  },
  subtitle: {
    fontSize: '1rem',
    color: 'var(--text-light)',
    fontWeight: 500,
  },

  // setup
  setupCard: {
    padding: 22,
    marginBottom: 16,
  },
  setupLabel: {
    fontSize: '0.95rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textTransform: 'lowercase',
  },
  difficultyRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
  },
  diffBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '18px 8px',
    gap: 4,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1.5px solid rgba(192,132,252,0.25)',
    background: 'var(--tint)',
  },
  diffBtnActive: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(192,132,252,0.15))',
    border: '1.5px solid #f472b6',
    boxShadow: '0 2px 8px rgba(244, 114, 182, 0.15)',
  },
  diffEmoji: {
    fontSize: '1.4rem',
  },
  diffLabel: {
    fontWeight: 800,
    fontSize: '0.95rem',
    color: 'var(--text-main)',
    textTransform: 'lowercase',
  },
  diffLabelRu: {
    fontWeight: 600,
    fontSize: '0.78rem',
    color: 'var(--text-light)',
  },
  diffRange: {
    fontWeight: 600,
    fontSize: '0.72rem',
    color: 'var(--text-light)',
  },
  selectAllBtn: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    background: 'rgba(168, 85, 247, 0.08)',
    padding: '4px 12px',
    borderRadius: 50,
    marginBottom: 10,
    textTransform: 'lowercase',
    cursor: 'pointer',
    border: 'none',
    minHeight: 44,
  },
  lessonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: 8,
  },
  lessonCheck: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    borderRadius: 12,
    background: 'var(--tint)',
    border: '1.5px solid rgba(192,132,252,0.25)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '0.8rem',
    minHeight: 44,
  },
  lessonCheckActive: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(192,132,252,0.15))',
    border: '1.5px solid #f472b6',
    boxShadow: '0 2px 8px rgba(244, 114, 182, 0.15)',
  },
  checkNum: {
    fontWeight: 800,
    color: 'var(--text-light)',
    fontSize: '0.85rem',
    minWidth: 22,
    textAlign: 'center',
  },
  checkCount: {
    fontSize: '0.72rem',
    color: 'var(--text-light)',
    fontWeight: 600,
  },
  poolInfo: {
    marginTop: 10,
    fontSize: '0.78rem',
    color: 'var(--text-light)',
    fontWeight: 700,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sliderWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-light)',
  },
  startWrap: {
    textAlign: 'center',
    marginTop: 20,
  },
  warnText: {
    marginTop: 8,
    fontSize: '0.75rem',
    color: 'var(--incorrect-text)',
    fontWeight: 600,
  },

  // game — progress
  progressWrap: {
    marginBottom: 20,
  },
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
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

  // game — prompt
  promptCard: {
    textAlign: 'center',
    padding: '26px 22px',
    marginBottom: 16,
    transition: 'all 0.35s ease',
  },
  promptCardCorrect: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1.5px solid rgba(16, 185, 129, 0.28)',
    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.12)',
  },
  promptLabel: {
    fontSize: '0.78rem',
    color: 'var(--text-light)',
    fontWeight: 700,
    marginBottom: 10,
    textTransform: 'lowercase',
    letterSpacing: '0.04em',
  },
  promptText: {
    fontSize: '1.35rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    lineHeight: 1.45,
  },
  hintBox: {
    marginTop: 12,
    padding: '10px 14px',
    borderRadius: 12,
    background: 'rgba(168, 85, 247, 0.06)',
    border: '1px solid rgba(168, 85, 247, 0.15)',
  },
  hintRomaji: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  hintStructure: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },

  // game — answer area
  answerArea: {
    padding: '18px 16px',
    marginBottom: 16,
  },
  answerLabel: {
    fontSize: '0.72rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    textTransform: 'lowercase',
    letterSpacing: '0.06em',
    marginBottom: 12,
    textAlign: 'center',
  },
  slotsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    minHeight: 56,
    alignItems: 'center',
  },
  slotEmpty: {
    minWidth: 52,
    height: 48,
    borderRadius: 14,
    border: '2px dashed rgba(192, 132, 252, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 14px',
    background: 'rgba(192,132,252,0.03)',
    transition: 'all 0.2s ease',
  },
  slotNum: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'rgba(192, 132, 252, 0.35)',
  },
  slotFilled: {
    minWidth: 52,
    height: 48,
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.05rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1.5px solid rgba(244, 114, 182, 0.35)',
    background: 'linear-gradient(135deg, rgba(244,114,182,0.12), rgba(192,132,252,0.12))',
    boxShadow: '0 2px 8px rgba(244,114,182,0.1)',
  },
  slotCorrect: {
    background: 'rgba(16, 185, 129, 0.14)',
    border: '1.5px solid var(--correct-text)',
    color: 'var(--correct-text)',
    boxShadow: '0 2px 10px rgba(16,185,129,0.2)',
  },
  slotWrong: {
    background: 'rgba(244, 63, 94, 0.1)',
    border: '1.5px solid var(--incorrect-text)',
    color: 'var(--incorrect-text)',
    boxShadow: '0 2px 10px rgba(244,63,94,0.15)',
  },

  // correct answer reveal
  correctReveal: {
    marginTop: 14,
    padding: '10px 14px',
    borderRadius: 12,
    background: 'rgba(16, 185, 129, 0.06)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    textAlign: 'center',
  },
  correctRevealLabel: {
    fontSize: '0.78rem',
    fontWeight: 800,
    color: 'var(--correct-text)',
    textTransform: 'lowercase',
    marginBottom: 6,
  },
  correctRevealRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  correctRevealWord: {
    padding: '4px 10px',
    borderRadius: 8,
    background: 'rgba(16, 185, 129, 0.12)',
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--correct-text)',
  },

  // game — word tiles
  tilesArea: {
    marginBottom: 16,
  },
  tilesGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  tile: {
    padding: '12px 20px',
    fontSize: '1.1rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    cursor: 'pointer',
    transition: 'all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
    border: '1.5px solid rgba(192,132,252,0.3)',
    background: 'var(--tint)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(168,85,247,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    fontFamily: 'inherit',
    minHeight: 44,
  },
  tileUsed: {
    opacity: 0.2,
    transform: 'scale(0.88)',
    pointerEvents: 'none',
    background: 'rgba(192, 132, 252, 0.06)',
    border: '1.5px solid rgba(192, 132, 252, 0.1)',
    boxShadow: 'none',
  },
  tileGlow: {
    border: '2px solid #fbbf24',
    boxShadow: '0 0 16px rgba(251,191,36,0.5), 0 0 0 3px rgba(251,191,36,0.1)',
    transform: 'scale(1.08) translateY(-2px)',
    transition: 'all 0.3s ease',
  },

  // game — controls
  controlsRow: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 16,
  },
  controlBtn: {
    fontSize: '0.95rem',
    padding: '8px 20px',
  },

  // hint button
  hintBtnWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 12,
  },
  hintBtn: {
    fontSize: '0.8rem',
    fontWeight: 700,
    padding: '6px 16px',
    color: 'var(--gold-text)',
    border: '1.5px solid rgba(217, 119, 6, 0.35)',
    background: 'rgba(251, 191, 36, 0.08)',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textTransform: 'lowercase',
    minHeight: 44,
  },
  hintBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },

  // game — feedback
  feedbackCorrect: {
    textAlign: 'center',
    fontSize: '1.1rem',
    fontWeight: 800,
    color: 'var(--correct-text)',
    padding: 12,
  },
  feedbackWrong: {
    textAlign: 'center',
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--incorrect-text)',
    padding: 12,
  },

  // results
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
    maxWidth: 500,
    width: '100%',
  },
  resultsCardTablet: {
    maxWidth: 620,
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
    margin: '0 auto 24px',
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
  hintsUsedInfo: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--gold-text)',
    background: 'rgba(217, 119, 6, 0.08)',
    border: '1px solid rgba(217, 119, 6, 0.2)',
    borderRadius: 10,
    padding: '6px 14px',
    marginBottom: 16,
    textAlign: 'center',
  },

  // results — mistakes
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
  mistakesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  mistakeItem: {
    background: 'rgba(244, 63, 94, 0.06)',
    border: '1px solid rgba(244, 63, 94, 0.15)',
    borderLeft: '3px solid var(--incorrect-text)',
    borderRadius: 10,
    padding: '10px 14px',
  },
  mistakeTranslation: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--text-main)',
    marginBottom: 6,
  },
  mistakeCorrectRow: {
    display: 'flex',
    gap: 6,
    alignItems: 'baseline',
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  mistakeYoursRow: {
    display: 'flex',
    gap: 6,
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  mistakeTag: {
    fontSize: '0.72rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    flexShrink: 0,
  },
  mistakeCorrectText: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--correct-text)',
    wordBreak: 'break-word',
  },
  mistakeYoursText: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--incorrect-text)',
    wordBreak: 'break-word',
  },

  // results — actions
  resultsActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    alignItems: 'center',
  },
}
