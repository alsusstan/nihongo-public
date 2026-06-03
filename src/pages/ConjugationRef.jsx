import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUnlockedLessons } from '../hooks/useUnlockedLessons'

const verbGroups = [
  {
    group: 'Group I',
    nameJp: '五段動詞',
    romaji: 'godan doushi',
    description: 'verbs ending in い/ち/り/み/び/に/き/ぎ/し + ます',
    examples: 'のみます (nomimasu), かきます (kakimasu), はなします (hanashimasu)',
    color: '#a855f7',
  },
  {
    group: 'Group II',
    nameJp: '一段動詞',
    romaji: 'ichidan doushi',
    description: 'verbs ending in え/い + ます',
    examples: 'たべます (tabemasu), みます (mimasu), おきます (okimasu)',
    color: '#f472b6',
  },
  {
    group: 'Group III',
    nameJp: '不規則動詞',
    romaji: 'fukisoku doushi',
    description: 'irregular verbs — only two!',
    examples: 'します (shimasu), きます (kimasu)',
    color: '#c084fc',
  },
]

const conjugationForms = [
  {
    form: 'ます form',
    formRomaji: 'masu',
    lesson: '1-4',
    meaning: 'polite present / future',
    meaningRu: 'вежливое настоящее / будущее',
    groupI: { jp: 'のみます', romaji: 'nomimasu' },
    groupII: { jp: 'たべます', romaji: 'tabemasu' },
    groupIII: { jp: 'します', romaji: 'shimasu' },
    icon: '🎯',
    usage: 'Основная вежливая форма — используется в формальных ситуациях, с незнакомыми людьми, с коллегами и начальством. Выражает настоящее или будущее действие. Это первая форма, которую учат в японском — отсюда и начинается изучение глаголов.',
    formation: {
      group1: 'Изменяем: の→のみ, か→かき, はな→はなし + ます',
      group2: 'Убираем る, добавляем ます: たべる→たべます',
      group3: 'します (shimasu), きます (kimasu)',
    },
    sentences: [
      { jp: '毎日日本語を勉強します。', romaji: 'Mainichi nihongo wo benkyou shimasu.', ru: 'Каждый день занимаюсь японским.' },
      { jp: 'コーヒーを飲みます。', romaji: 'Koohii wo nomimasu.', ru: 'Пью кофе.' },
      { jp: '明日東京へ行きます。', romaji: 'Ashita toukyou e ikimasu.', ru: 'Завтра поеду в Токио.' },
    ],
  },
  {
    form: 'ません',
    formRomaji: 'masen',
    lesson: '1-4',
    meaning: 'polite negative',
    meaningRu: 'вежливое отрицательное',
    groupI: { jp: 'のみません', romaji: 'nomimasen' },
    groupII: { jp: 'たべません', romaji: 'tabemasen' },
    groupIII: { jp: 'しません', romaji: 'shimasen' },
    icon: '🚫',
    usage: 'Отрицательная форма настоящего/будущего в вежливой речи. Образуется заменой ます на ません. Используется так же, как ます, но для отрицания действия.',
    formation: {
      group1: 'Основа + ません: のみません (nomimasen)',
      group2: 'Основа + ません: たべません (tabemasen)',
      group3: 'しません (shimasen), きません (kimasen)',
    },
    sentences: [
      { jp: 'お酒を飲みません。', romaji: 'Osake wo nomimasen.', ru: 'Алкоголь не пью.' },
      { jp: '肉は食べません。', romaji: 'Niku wa tabemasen.', ru: 'Мясо не ем.' },
      { jp: '車を持っていません。', romaji: 'Kuruma wo motte imasen.', ru: 'У меня нет машины.' },
    ],
  },
  {
    form: 'ました',
    formRomaji: 'mashita',
    lesson: '1-4',
    meaning: 'polite past',
    meaningRu: 'вежливое прошедшее',
    groupI: { jp: 'のみました', romaji: 'nomimashita' },
    groupII: { jp: 'たべました', romaji: 'tabemashita' },
    groupIII: { jp: 'しました', romaji: 'shimashita' },
    icon: '⏮️',
    usage: 'Прошедшее время в вежливой речи. Образуется заменой ます на ました. Описывает действие, которое уже завершилось.',
    formation: {
      group1: 'Основа + ました: のみました (nomimashita)',
      group2: 'Основа + ました: たべました (tabemashita)',
      group3: 'しました (shimashita), きました (kimashita)',
    },
    sentences: [
      { jp: '昨日映画を見ました。', romaji: 'Kinou eiga wo mimashita.', ru: 'Вчера смотрела фильм.' },
      { jp: '先週日本語を勉強しました。', romaji: 'Senshu nihongo wo benkyou shimashita.', ru: 'На прошлой неделе занималась японским.' },
      { jp: '友達が来ました。', romaji: 'Tomodachi ga kimashita.', ru: 'Пришёл друг.' },
    ],
  },
  {
    form: 'ませんでした',
    formRomaji: 'masen deshita',
    lesson: '1-4',
    meaning: 'polite past negative',
    meaningRu: 'вежливое прошедшее отрицательное',
    groupI: { jp: 'のみませんでした', romaji: 'nomimasen deshita' },
    groupII: { jp: 'たべませんでした', romaji: 'tabemasen deshita' },
    groupIII: { jp: 'しませんでした', romaji: 'shimasen deshita' },
    icon: '❌',
    usage: 'Прошедшее отрицательное в вежливой речи. Образуется заменой ます на ませんでした.',
    formation: {
      group1: 'Основа + ませんでした',
      group2: 'Основа + ませんでした',
      group3: 'しませんでした, きませんでした',
    },
    sentences: [
      { jp: '昨日学校へ行きませんでした。', romaji: 'Kinou gakkou e ikimasen deshita.', ru: 'Вчера не пошла в школу.' },
      { jp: '宿題をしませんでした。', romaji: 'Shukudai wo shimasen deshita.', ru: 'Домашнюю работу не сделала.' },
    ],
  },
  {
    form: '～たい',
    formRomaji: '~tai',
    lesson: '13',
    meaning: 'want to do',
    meaningRu: 'хочу сделать',
    groupI: { jp: 'のみたい', romaji: 'nomitai' },
    groupII: { jp: 'たべたい', romaji: 'tabetai' },
    groupIII: { jp: 'したい', romaji: 'shitai' },
    icon: '💭',
    usage: 'Выражает ЖЕЛАНИЕ говорящего (только от 1-го лица!). Для желаний третьих лиц используй 〜たがっています. Склоняется как い-прилагательное: たくない (не хочу), たかった (хотела).',
    formation: {
      group1: 'Основа ます + たい: のみます→のみたい',
      group2: 'Основа ます + たい: たべます→たべたい',
      group3: 'します→したい, きます→きたい',
    },
    sentences: [
      { jp: '日本へ行きたいです。', romaji: 'Nihon e ikitai desu.', ru: 'Хочу поехать в Японию.' },
      { jp: 'ラーメンが食べたいです。', romaji: 'Raamen ga tabetai desu.', ru: 'Хочу съесть рамэн.' },
      { jp: '何も食べたくないです。', romaji: 'Nanimo tabetaku nai desu.', ru: 'Ничего не хочу есть.' },
    ],
  },
  {
    form: 'て form',
    formRomaji: 'te',
    lesson: '14',
    meaning: 'conjunctive / request form',
    meaningRu: 'соединительная / просьба',
    groupI: { jp: 'のんで', romaji: 'nonde' },
    groupII: { jp: 'たべて', romaji: 'tabete' },
    groupIII: { jp: 'して', romaji: 'shite' },
    icon: '🔗',
    usage: 'Самая многофункциональная форма! Используется для: соединения последовательных действий, просьб (〜てください), разрешений (〜てもいい), прогресса (〜ている), запрета (〜てはいけない), после того как (〜てから). Запомни исключение: 行きます→行って!',
    formation: {
      group1: 'Зависит от окончания: い/ち/り→って; み/び/に→んで; き→いて; ぎ→いで; し→して',
      group2: 'Основа + て: たべます→たべて',
      group3: 'します→して; きます→きて',
    },
    sentences: [
      { jp: '手を洗って、食べます。', romaji: 'Te wo aratte, tabemasu.', ru: 'Помою руки и поем.' },
      { jp: '窓を開けてください。', romaji: 'Mado wo akete kudasai.', ru: 'Откройте окно, пожалуйста.' },
      { jp: '音楽を聞きながら、勉強しています。', romaji: 'Ongaku wo kikinagara, benkyou shite imasu.', ru: 'Занимаюсь, слушая музыку.' },
    ],
    notes: 'Исключение: 行きます → 行って (itte), а не 行いて!',
  },
  {
    form: '～てもいい',
    formRomaji: '~te mo ii',
    lesson: '15',
    meaning: 'permission (may I...)',
    meaningRu: 'разрешение (можно...)',
    groupI: { jp: 'のんでもいい', romaji: 'nonde mo ii' },
    groupII: { jp: 'たべてもいい', romaji: 'tabete mo ii' },
    groupIII: { jp: 'してもいい', romaji: 'shite mo ii' },
    icon: '✅',
    usage: 'Просишь разрешения или даёшь его. Вопрос: 〜てもいいですか? (Можно мне...?). Ответ да: はい、〜てもいいです. Ответ нет: いいえ、〜てはいけません.',
    formation: {
      group1: 'て-форма + もいい: のんでもいい',
      group2: 'て-форма + もいい: たべてもいい',
      group3: 'してもいい; きてもいい',
    },
    sentences: [
      { jp: 'ここで写真を撮ってもいいですか。', romaji: 'Koko de shashin wo totte mo ii desu ka?', ru: 'Здесь можно фотографировать?' },
      { jp: '窓を開けてもいいですか。', romaji: 'Mado wo akete mo ii desu ka?', ru: 'Можно открыть окно?' },
      { jp: 'もう帰ってもいいです。', romaji: 'Mou kaette mo ii desu.', ru: 'Уже можно идти домой.' },
    ],
  },
  {
    form: '～てはいけない',
    formRomaji: '~te wa ikenai',
    lesson: '15',
    meaning: 'prohibition (must not)',
    meaningRu: 'запрет (нельзя)',
    groupI: { jp: 'のんではいけない', romaji: 'nonde wa ikenai' },
    groupII: { jp: 'たべてはいけない', romaji: 'tabete wa ikenai' },
    groupIII: { jp: 'してはいけない', romaji: 'shite wa ikenai' },
    icon: '⛔',
    usage: 'Запрет — нельзя делать. Более мягкая форма: 〜ないほうがいいです (лучше не делать). В официальных объявлениях часто: 〜禁止 (kinjou).',
    formation: {
      group1: 'て-форма + はいけない: のんではいけない',
      group2: 'て-форма + はいけない: たべてはいけない',
      group3: 'してはいけない; きてはいけない',
    },
    sentences: [
      { jp: 'ここでタバコを吸ってはいけません。', romaji: 'Koko de tabako wo sutte wa ikemasen.', ru: 'Здесь курить нельзя.' },
      { jp: '授業中に携帯を使ってはいけません。', romaji: 'Jugyou chuu ni keitai wo tsukatte wa ikemasen.', ru: 'На уроке нельзя пользоваться телефоном.' },
    ],
  },
  {
    form: '～ている',
    formRomaji: '~te iru',
    lesson: '14-15',
    meaning: 'ongoing action / state',
    meaningRu: 'продолжающееся действие / состояние',
    groupI: { jp: 'のんでいる', romaji: 'nonde iru' },
    groupII: { jp: 'たべている', romaji: 'tabete iru' },
    groupIII: { jp: 'している', romaji: 'shite iru' },
    icon: '▶️',
    usage: 'Два значения: 1) ПРОЦЕСС — действие сейчас выполняется (今食べています — сейчас ем); 2) СОСТОЯНИЕ — результат завершённого действия (結婚しています — женат/замужем; 知っています — знаю). Контекст проясняет значение.',
    formation: {
      group1: 'て-форма + いる: のんでいる (→のんでいます)',
      group2: 'て-форма + いる: たべている (→たべています)',
      group3: 'している; きている',
    },
    sentences: [
      { jp: '今、音楽を聞いています。', romaji: 'Ima, ongaku wo kiite imasu.', ru: 'Сейчас слушаю музыку.' },
      { jp: '山田さんは結婚しています。', romaji: 'Yamada san wa kekkon shite imasu.', ru: 'Ямада-сан замужем/женат.' },
      { jp: '日本語を勉強しています。', romaji: 'Nihongo wo benkyou shite imasu.', ru: 'Изучаю японский.' },
    ],
  },
  {
    form: 'ない form',
    formRomaji: 'nai',
    lesson: '17',
    meaning: 'plain negative',
    meaningRu: 'простое отрицательное',
    groupI: { jp: 'のまない', romaji: 'nomanai' },
    groupII: { jp: 'たべない', romaji: 'tabenai' },
    groupIII: { jp: 'しない', romaji: 'shinai' },
    icon: '🚫',
    usage: 'Простое/разговорное отрицание. Основа для: 〜ないでください (не делай), 〜なければならない (должен), 〜なくてもいい (не нужно). У существительных с だ → じゃない.',
    formation: {
      group1: 'Меняем い-ряд ます на あ-ряд + ない: のみます→のまない. Исключение: います→いない',
      group2: 'Убираем る + ない: たべる→たべない',
      group3: 'する→しない; くる→こない',
    },
    sentences: [
      { jp: '今日は学校へ行かない。', romaji: 'Kyou wa gakkou e ikanai.', ru: 'Сегодня в школу не иду (разг.).' },
      { jp: '肉を食べないでください。', romaji: 'Niku wo tabenai de kudasai.', ru: 'Пожалуйста, не ешьте мясо.' },
      { jp: '知らない。', romaji: 'Shiranai.', ru: 'Не знаю (разг.).' },
    ],
  },
  {
    form: 'dictionary form',
    formRomaji: 'jisho-kei',
    lesson: '18',
    meaning: 'plain present / dictionary',
    meaningRu: 'простое настоящее / словарная',
    groupI: { jp: 'のむ', romaji: 'nomu' },
    groupII: { jp: 'たべる', romaji: 'taberu' },
    groupIII: { jp: 'する', romaji: 'suru' },
    icon: '📖',
    usage: 'Простая/разговорная форма настоящего/будущего. Используется: в разговорной речи, в словарях, с конструкциями ことができる (умею), つもりだ (намерен), まえに (до того как), 時 (когда). Это форма, под которой глаголы записаны в словарях.',
    formation: {
      group1: 'и-ряд → у-ряд: のみ→のむ, かき→かく, はなし→はなす',
      group2: 'Основа + る: たべ→たべる',
      group3: 'する; くる',
    },
    sentences: [
      { jp: '寿司を食べることができます。', romaji: 'Sushi wo taberu koto ga dekimasu.', ru: 'Я умею есть суши / Могу есть суши.' },
      { jp: '寝るまえに歯を磨きます。', romaji: 'Neru mae ni ha wo migakimasu.', ru: 'До сна чищу зубы.' },
      { jp: '来年日本へ行くつもりです。', romaji: 'Rainen nihon e iku tsumori desu.', ru: 'Намереваюсь поехать в Японию в следующем году.' },
    ],
  },
  {
    form: '～ことができる',
    formRomaji: '~koto ga dekiru',
    lesson: '18',
    meaning: 'ability (can do)',
    meaningRu: 'возможность (мочь)',
    groupI: { jp: 'のむことができる', romaji: 'nomu koto ga dekiru' },
    groupII: { jp: 'たべることができる', romaji: 'taberu koto ga dekiru' },
    groupIII: { jp: 'することができる', romaji: 'suru koto ga dekiru' },
    icon: '💪',
    usage: 'Способность или возможность что-то сделать. Более формальный вариант потенциальной формы (〜える/〜られる). Словарная форма + ことができる. Отрицание: ことができない или ことができません.',
    formation: {
      group1: '辞書形 + ことができる: のむことができる',
      group2: '辞書形 + ことができる: たべることができる',
      group3: 'することができる; くることができる',
    },
    sentences: [
      { jp: '私はピアノを弾くことができます。', romaji: 'Watashi wa piano wo hiku koto ga dekimasu.', ru: 'Я умею играть на пианино.' },
      { jp: 'ここで泳ぐことができますか。', romaji: 'Koko de oyogu koto ga dekimasu ka?', ru: 'Здесь можно плавать?' },
    ],
  },
  {
    form: 'た form',
    formRomaji: 'ta',
    lesson: '19',
    meaning: 'plain past',
    meaningRu: 'простое прошедшее',
    groupI: { jp: 'のんだ', romaji: 'nonda' },
    groupII: { jp: 'たべた', romaji: 'tabeta' },
    groupIII: { jp: 'した', romaji: 'shita' },
    icon: '⏪',
    usage: 'Прошедшее время в простой/разговорной речи. Отличается от ました (вежливое). Используется: с たことがある (опыт), たら (когда/если), たり〜たり (то одно то другое). По правилам образования совпадает с て-формой (только て→た, で→だ).',
    formation: {
      group1: 'По тем же правилам, что て-форма, но て→た, で→だ: のんだ, かいた, はなした',
      group2: 'Основа + た: たべた',
      group3: 'した; きた',
    },
    sentences: [
      { jp: '昨日何を食べた？', romaji: 'Kinou nani wo tabeta?', ru: 'Что вчера ел? (разг.)' },
      { jp: '昨日テレビを見た。', romaji: 'Kinou terebi wo mita.', ru: 'Вчера смотрел телевизор (разг.).' },
      { jp: '雨が降った。', romaji: 'Ame ga futta.', ru: 'Пошёл дождь.' },
    ],
  },
  {
    form: '～たことがある',
    formRomaji: '~ta koto ga aru',
    lesson: '19',
    meaning: 'have done (experience)',
    meaningRu: 'опыт — однажды делал / бывало делал',
    groupI: { jp: 'のんだことがある', romaji: 'nonda koto ga aru' },
    groupII: { jp: 'たべたことがある', romaji: 'tabeta koto ga aru' },
    groupIII: { jp: 'したことがある', romaji: 'shita koto ga aru' },
    icon: '🌟',
    usage: 'Выражает ОПЫТ — когда-то делал хотя бы один раз. Говорит о прошлом опыте без привязки к конкретному времени. Отрицание: たことがない (никогда не делал).',
    formation: {
      group1: 'た-форма + ことがある: のんだことがある',
      group2: 'た-форма + ことがある: たべたことがある',
      group3: 'したことがある; きたことがある',
    },
    sentences: [
      { jp: '日本へ行ったことがあります。', romaji: 'Nihon e itta koto ga arimasu.', ru: 'Я была в Японии (бывало).' },
      { jp: '納豆を食べたことがありますか。', romaji: 'Nattou wo tabeta koto ga arimasu ka?', ru: 'Вы когда-нибудь ели натто?' },
      { jp: '富士山に登ったことがない。', romaji: 'Fujisan ni nobotta koto ga nai.', ru: 'Никогда не поднимался на Фудзи.' },
    ],
  },
  {
    form: 'plain form (all)',
    formRomaji: 'futsuu-kei',
    lesson: '20',
    meaning: 'for quoting / casual speech',
    meaningRu: 'для цитирования / разговорная речь',
    groupI: {
      jp: 'のむ / のまない / のんだ / のまなかった',
      romaji: 'nomu / nomanai / nonda / nomanakatta',
    },
    groupII: {
      jp: 'たべる / たべない / たべた / たべなかった',
      romaji: 'taberu / tabenai / tabeta / tabenakatta',
    },
    groupIII: {
      jp: 'する / しない / した / しなかった',
      romaji: 'suru / shinai / shita / shinakatta',
    },
    icon: '💬',
    usage: 'Разговорная речь с близкими, цитирование мыслей (〜と思います), слухов (〜そうです), намерений. 4 варианта: настоящее / отрицание / прошедшее / прош. отрицание. Вежливая речь использует ます/ません/ました/ませんでした.',
    formation: {
      group1: 'のむ / のまない / のんだ / のまなかった',
      group2: 'たべる / たべない / たべた / たべなかった',
      group3: 'する/しない/した/しなかった; くる/こない/きた/こなかった',
    },
    sentences: [
      { jp: '明日雨が降ると思います。', romaji: 'Ashita ame ga furu to omoimasu.', ru: 'Думаю, завтра будет дождь.' },
      { jp: '彼は来ないと言いました。', romaji: 'Kare wa konai to iimashita.', ru: 'Он сказал, что не придёт.' },
    ],
  },
  {
    form: 'volitional',
    formRomaji: '~you / ~mashou',
    lesson: '14',
    meaning: 'let\'s / shall we',
    meaningRu: 'пойдём / давайте сделаем (предложение)',
    groupI: { jp: 'のもう / のみましょう', romaji: 'nomou / nomimashou' },
    groupII: { jp: 'たべよう / たべましょう', romaji: 'tabeyou / tabemashou' },
    groupIII: { jp: 'しよう / しましょう', romaji: 'shiyou / shimashou' },
    icon: '🙋',
    usage: 'Предложение сделать что-то вместе ("давайте", "пойдём"). ましょう — вежливая форма; よう — разговорная. Вопрос: 〜ましょうか? (Не пойдём ли мы...? Shall we...?)',
    formation: {
      group1: 'и-ряд → お-ряд + う: のむ→のもう / のみましょう',
      group2: 'Основа + よう: たべる→たべよう / たべましょう',
      group3: 'する→しよう/しましょう; くる→こよう/きましょう',
    },
    sentences: [
      { jp: '一緒に行きましょう。', romaji: 'Issho ni ikimashou.', ru: 'Пойдём вместе!' },
      { jp: 'カフェに入りましょうか。', romaji: 'Kafe ni hairimashou ka?', ru: 'Может зайдём в кафе?' },
      { jp: 'もう帰ろう。', romaji: 'Mou kaerou.', ru: 'Пойдём домой (разг.).' },
    ],
  },
  {
    form: 'passive',
    formRomaji: '~areru / ~rareru',
    lesson: '21',
    meaning: 'passive voice — action done to subject',
    meaningRu: 'пассивный залог — действие совершается над кем-то',
    groupI: { jp: 'のまれる', romaji: 'nomareru' },
    groupII: { jp: 'たべられる', romaji: 'taberareru' },
    groupIII: { jp: 'される', romaji: 'sareru' },
    icon: '😮',
    usage: 'Пассивный залог — действие совершается НАД подлежащим. В японском часто выражает НЕПРИЯТНОЕ событие, которое произошло с говорящим (меня укусила собака = пострадал я). Не путай с русским пассивом: нюанс страдательный.',
    formation: {
      group1: 'あ-ряд + れる: のむ→のまれる',
      group2: 'Основа + られる: たべる→たべられる',
      group3: 'する→される; くる→こられる',
    },
    sentences: [
      { jp: '犬に噛まれました。', romaji: 'Inu ni kamaremashita.', ru: 'Меня укусила собака (я пострадал).' },
      { jp: '先生に褒められました。', romaji: 'Sensei ni homeraremashita.', ru: 'Учитель похвалил меня.' },
      { jp: '財布を盗まれました。', romaji: 'Saifu wo nusumaremashita.', ru: 'У меня украли кошелёк.' },
    ],
  },
  {
    form: 'potential',
    formRomaji: '~eru / ~rareru',
    lesson: '24',
    meaning: 'can / be able to',
    meaningRu: 'потенциальная форма — мочь, уметь',
    groupI: { jp: 'のめる', romaji: 'nomeru' },
    groupII: { jp: 'たべられる', romaji: 'taberareru' },
    groupIII: { jp: 'できる', romaji: 'dekiru' },
    icon: '⚡',
    usage: 'Способность или возможность — "умею", "могу". Менее формальный аналог ことができる. У Group II и III потенциальная форма = страдательная (たべられる). Отрицание: 〜られない/〜えない.',
    formation: {
      group1: 'え-ряд + る: のむ→のめる, かく→かける',
      group2: 'Основа + られる: たべる→たべられる',
      group3: 'する→できる; くる→こられる',
    },
    sentences: [
      { jp: '日本語が話せます。', romaji: 'Nihongo ga hanasemasu.', ru: 'Умею говорить по-японски.' },
      { jp: '納豆が食べられません。', romaji: 'Nattou ga taberaremasen.', ru: 'Не могу есть натто.' },
      { jp: '明日来られますか。', romaji: 'Ashita koraremasuka?', ru: 'Вы сможете прийти завтра?' },
    ],
  },
  {
    form: '～たら conditional',
    formRomaji: '~tara',
    lesson: '22',
    meaning: 'when / if (after completing action)',
    meaningRu: '条件形 — когда / если (после завершения)',
    groupI: { jp: 'のんだら', romaji: 'nondara' },
    groupII: { jp: 'たべたら', romaji: 'tabetara' },
    groupIII: { jp: 'したら / きたら', romaji: 'shitara / kitara' },
    icon: '🔮',
    usage: 'Условие "когда/если выполнится, то...". Используется когда условие скорее всего выполнится, или для конкретных/единичных условий. Образуется от た-формы + ら. Отличается от ば-формы: たら больше для конкретных ситуаций.',
    formation: {
      group1: 'た-форма + ら: のんだら',
      group2: 'た-форма + ら: たべたら',
      group3: 'したら; きたら',
    },
    sentences: [
      { jp: '家に帰ったら、電話します。', romaji: 'Ie ni kaettara, denwa shimasu.', ru: 'Когда вернусь домой — позвоню.' },
      { jp: '雨が降ったら、行きません。', romaji: 'Ame ga futtara, ikimasen.', ru: 'Если пойдёт дождь, не пойду.' },
      { jp: '宝くじに当たったら、旅行します。', romaji: 'Takarakuji ni atattara, ryokou shimasu.', ru: 'Если выиграю в лотерею — поеду путешествовать.' },
    ],
  },
  {
    form: '～ば conditional',
    formRomaji: '~ba',
    lesson: '25',
    meaning: 'if (hypothetical / general condition)',
    meaningRu: '仮定形 — если (гипотетическое условие)',
    groupI: { jp: 'のめば', romaji: 'nomeba' },
    groupII: { jp: 'たべれば', romaji: 'tabereba' },
    groupIII: { jp: 'すれば / くれば', romaji: 'sureba / kureba' },
    icon: '🌈',
    usage: 'Гипотетическое условие "если...". Используется для общих истин, советов, вопросов "что если?". Часто в вопросах: 〜ばよかった (если бы тогда сделал...) — сожаление о прошлом.',
    formation: {
      group1: 'え-ряд + ば: のむ→のめば, かく→かけば',
      group2: 'Основа + れば: たべる→たべれば',
      group3: 'する→すれば; くる→くれば',
    },
    sentences: [
      { jp: '毎日練習すれば、上手になります。', romaji: 'Mainichi renshuu sureba, jouzu ni narimasu.', ru: 'Если будешь практиковаться каждый день — станешь хорошим.' },
      { jp: 'もっと勉強すればよかった。', romaji: 'Motto benkyou sureba yokatta.', ru: 'Надо было больше учиться (жаль, что не учила).' },
    ],
  },
  {
    form: 'causative',
    formRomaji: '~aseru / ~saseru',
    lesson: '21',
    meaning: 'make / let someone do',
    meaningRu: 'побудительная форма — заставить / позволить сделать',
    groupI: { jp: 'のませる', romaji: 'nomaseru' },
    groupII: { jp: 'たべさせる', romaji: 'tabesaseru' },
    groupIII: { jp: 'させる / こさせる', romaji: 'saseru / kosaseru' },
    icon: '👆',
    usage: 'Два значения: 1) ЗАСТАВИТЬ кого-то что-то сделать (родитель → ребёнок); 2) ПОЗВОЛИТЬ кому-то что-то сделать. Контекст определяет значение. В уважительной речи: 〜させていただけますか (можно ли мне сделать...?).',
    formation: {
      group1: 'あ-ряд + せる: のむ→のませる',
      group2: 'Основа + させる: たべる→たべさせる',
      group3: 'する→させる; くる→こさせる',
    },
    sentences: [
      { jp: '母は私に野菜を食べさせます。', romaji: 'Haha wa watashi ni yasai wo tabesasemasu.', ru: 'Мама заставляет меня есть овощи.' },
      { jp: '子どもを一人で行かせません。', romaji: 'Kodomo wo hitori de ikasemasen.', ru: 'Не позволяю ребёнку идти одному.' },
    ],
  },
  {
    form: 'imperative',
    formRomaji: '~e / ~ro',
    lesson: '21',
    meaning: 'direct command (plain, rough)',
    meaningRu: 'повелительная форма — прямое (грубоватое) требование',
    groupI: { jp: 'のめ', romaji: 'nome' },
    groupII: { jp: 'たべろ', romaji: 'tabero' },
    groupIII: { jp: 'しろ / こい', romaji: 'shiro / koi' },
    icon: '⚠️',
    usage: 'Прямой приказ — ГРУБЫЙ стиль. Используется в крайних ситуациях (пожар, опасность), военных командах, мужской речи в аниме. В повседневном общении слишком резкий — используй てください для вежливых просьб.',
    formation: {
      group1: 'え-ряд без る: のむ→のめ',
      group2: 'Основа + ろ или よ: たべる→たべろ',
      group3: 'する→しろ; くる→こい',
    },
    sentences: [
      { jp: '逃げろ！', romaji: 'Nigero!', ru: 'Беги! (в опасной ситуации)' },
      { jp: 'うるさい！黙れ！', romaji: 'Urusai! Damare!', ru: 'Тихо! Замолчи! (грубо)' },
    ],
    notes: 'Не используй с людьми, которым ты должен проявлять уважение! Это очень грубая форма.',
  },
  {
    form: '～てから',
    formRomaji: '~te kara',
    lesson: '16',
    meaning: 'after doing … (sequence)',
    meaningRu: 'после того, как сделаешь — действие в последовательности',
    groupI: { jp: 'のんでから', romaji: 'nonde kara' },
    groupII: { jp: 'たべてから', romaji: 'tabete kara' },
    groupIII: { jp: 'してから / きてから', romaji: 'shite kara / kite kara' },
    icon: '⏩',
    usage: '"После того как..." — действие B происходит ПОСЛЕ ЗАВЕРШЕНИЯ действия A. Последовательность строгая. Отличается от 〜て (просто последовательность без акцента на завершении).',
    formation: {
      group1: 'て-форма + から: のんでから',
      group2: 'て-форма + から: たべてから',
      group3: 'してから; きてから',
    },
    sentences: [
      { jp: '手を洗ってから、食べます。', romaji: 'Te wo aratte kara, tabemasu.', ru: 'После того как вымою руки, поем.' },
      { jp: '大学を卒業してから、働きます。', romaji: 'Daigaku wo sotsugyou shite kara, hatarakimasu.', ru: 'После того как окончу университет, буду работать.' },
    ],
  },
  {
    form: '～なければならない',
    formRomaji: '~nakereba naranai',
    lesson: '17',
    meaning: 'must / have to (obligation)',
    meaningRu: 'должен / необходимо (обязанность)',
    groupI: { jp: 'のまなければならない', romaji: 'nomanakerebanaranai' },
    groupII: { jp: 'たべなければならない', romaji: 'tabenakereba naranai' },
    groupIII: { jp: 'しなければならない', romaji: 'shinakereba naranai' },
    icon: '📋',
    usage: '"Должен", "необходимо". Выражает обязательство или долг. Разговорные сокращения: なければ→なきゃ, ならない→いけない. Слабее, чем はずだ. Добавляет оттенок неизбежности или личного долга.',
    formation: {
      group1: 'ない-форма + ければならない: のまなければならない',
      group2: 'ない-форма + ければならない: たべなければならない',
      group3: 'しなければならない; こなければならない',
    },
    sentences: [
      { jp: '薬を飲まなければなりません。', romaji: 'Kusuri wo nomanakereba narimasen.', ru: 'Нужно принять лекарство.' },
      { jp: '明日早く起きなきゃ。', romaji: 'Ashita hayaku oki nakya.', ru: 'Завтра нужно встать рано (разг.).' },
      { jp: '宿題をしなければならない。', romaji: 'Shukudai wo shinakereba naranai.', ru: 'Нужно сделать домашнее задание.' },
    ],
  },
]

const teFormRules = [
  {
    ending: 'います / ちます / ります',
    endingRomaji: 'imasu / chimasu / rimasu',
    teForm: '～って',
    teRomaji: '~tte',
    example: 'かいます → かって',
    exampleRomaji: 'kaimasu → katte',
    exampleRu: 'покупать',
  },
  {
    ending: 'にます / びます / みます',
    endingRomaji: 'nimasu / bimasu / mimasu',
    teForm: '～んで',
    teRomaji: '~nde',
    example: 'のみます → のんで',
    exampleRomaji: 'nomimasu → nonde',
    exampleRu: 'пить',
  },
  {
    ending: 'きます',
    endingRomaji: 'kimasu',
    teForm: '～いて',
    teRomaji: '~ite',
    example: 'かきます → かいて',
    exampleRomaji: 'kakimasu → kaite',
    exampleRu: 'писать',
  },
  {
    ending: 'ぎます',
    endingRomaji: 'gimasu',
    teForm: '～いで',
    teRomaji: '~ide',
    example: 'およぎます → およいで',
    exampleRomaji: 'oyogimasu → oyoide',
    exampleRu: 'плавать',
  },
  {
    ending: 'します',
    endingRomaji: 'shimasu',
    teForm: '～して',
    teRomaji: '~shite',
    example: 'はなします → はなして',
    exampleRomaji: 'hanashimasu → hanashite',
    exampleRu: 'говорить',
  },
]

// Helper: parse lesson string to max lesson number
function parseLessonMax(lessonStr) {
  const parts = String(lessonStr).split('-').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
  return parts.length > 0 ? Math.max(...parts) : 0
}

export default function ConjugationRef() {
  const [expandedRow, setExpandedRow] = useState(null)
  const [expandedCard, setExpandedCard] = useState(null)
  const [activeSection, setActiveSection] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showRomaji, setShowRomaji] = useState(true)

  const { unlockedLessons } = useUnlockedLessons()
  const maxLesson = unlockedLessons && unlockedLessons.length > 0
    ? Math.max(...unlockedLessons.map(l => l.id))
    : 15

  // Scroll to top when switching sections (except 'all' which shows everything)
  useEffect(() => {
    if (activeSection !== 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [activeSection])

  const toggleRow = (index) => {
    setExpandedRow(prev => (prev === index ? null : index))
  }

  const toggleCard = (index) => {
    setExpandedCard(prev => (prev === index ? null : index))
  }

  const q = searchQuery.toLowerCase().trim()
  const filteredForms = q
    ? conjugationForms.filter(row =>
        row.form.toLowerCase().includes(q) ||
        row.formRomaji.toLowerCase().includes(q) ||
        row.meaning.toLowerCase().includes(q) ||
        row.meaningRu.toLowerCase().includes(q) ||
        row.groupI.jp.includes(q) ||
        row.groupI.romaji.toLowerCase().includes(q) ||
        row.groupII.jp.includes(q) ||
        row.groupII.romaji.toLowerCase().includes(q) ||
        row.groupIII.jp.includes(q) ||
        row.groupIII.romaji.toLowerCase().includes(q)
      )
    : conjugationForms

  // For details tab: show all forms if maxLesson > 20, otherwise filter by lesson
  const detailForms = maxLesson > 20
    ? conjugationForms
    : conjugationForms.filter(f => parseLessonMax(f.lesson) <= maxLesson)

  const sections = [
    { key: 'all', label: 'all', labelJp: 'ぜんぶ' },
    { key: 'groups', label: 'groups', labelJp: 'グループ' },
    { key: 'forms', label: 'forms', labelJp: 'かたち' },
    { key: 'te-rules', label: 'te-form', labelJp: 'て' },
    { key: 'details', label: 'подробно', labelJp: 'くわしく' },
  ]

  return (
    <div className="page">
      {/* header */}
      <div style={s.header} className="animate-fadeInUp">
        <Link to="/" style={s.backLink}>
          ← home
        </Link>
        <div style={s.badgeWrap}>
          <div style={s.badge}>
            <span style={s.badgeText}>reference</span>
          </div>
        </div>
        <h1 style={s.title}>verb conjugation</h1>
        <p style={s.titleJp}>どうしのかつよう</p>
        <p style={s.titleRomaji}>doushi no katsuyou</p>
        <p style={s.subtitle}>all verb forms from lessons 1-25</p>
      </div>

      {/* section tabs */}
      <div style={s.tabRow}>
        {sections.map(sec => (
          <button
            key={sec.key}
            onClick={() => setActiveSection(sec.key)}
            style={{
              ...s.tab,
              ...(activeSection === sec.key ? s.tabActive : {}),
            }}
          >
            <span>{sec.label}</span>
            <span style={s.tabJp}>{sec.labelJp}</span>
          </button>
        ))}
      </div>

      {/* search */}
      {(activeSection === 'all' || activeSection === 'forms') && (
        <div style={s.searchWrap} className="animate-fadeInUp">
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setExpandedRow(null) }}
            placeholder="search forms, romaji, translation…"
            aria-label="search conjugation forms"
            autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
            style={s.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={s.searchClear} aria-label="clear search">✕</button>
          )}
        </div>
      )}

      {/* verb groups */}
      {(activeSection === 'all' || activeSection === 'groups') && (
        <div className="animate-fadeInUp" style={s.section}>
          <div style={s.sectionHeader}>
            <span style={s.sectionIcon}>📋</span>
            <span style={s.sectionTitle}>verb groups</span>
            <span style={s.sectionTitleJp}>どうしのグループ (doushi no guruupu)</span>
          </div>

          <div style={s.groupsGrid}>
            {verbGroups.map((g) => (
              <div key={g.group} className="glass" style={s.groupCard}>
                <div style={{ ...s.groupBadge, background: g.color }}>
                  <span style={s.groupBadgeText}>{g.group}</span>
                </div>
                <div style={s.groupNameJp}>{g.nameJp}</div>
                <div style={s.groupRomaji}>{g.romaji}</div>
                <div style={s.groupDesc}>{g.description}</div>
                <div style={s.groupExamples}>
                  <span style={s.groupExLabel}>examples:</span> {g.examples}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* conjugation table */}
      {(activeSection === 'all' || activeSection === 'forms') && (
        <div className="animate-fadeInUp" style={s.section}>
          <div style={s.sectionHeader}>
            <span style={s.sectionIcon}>📝</span>
            <span style={s.sectionTitle}>conjugation forms</span>
            <span style={s.sectionTitleJp}>かつようひょう (katsuyou hyou)</span>
          </div>

          <div style={{ textAlign: 'right', marginBottom: 8 }}>
            <button
              onClick={() => setShowRomaji(r => !r)}
              style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit', border: 'none', cursor: 'pointer', borderRadius: 50, padding: '4px 14px', background: showRomaji ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)', color: showRomaji ? '#fff' : 'var(--text-secondary)', transition: 'all 0.2s', minHeight: 44 }}
            >
              {showRomaji ? 'скрыть ромадзи' : 'показать ромадзи'}
            </button>
          </div>
          <div className="glass" style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={{ ...s.th, width: '22%' }}>form</th>
                  <th style={{ ...s.th, width: '26%' }}>Group I</th>
                  <th style={{ ...s.th, width: '26%' }}>Group II</th>
                  <th style={{ ...s.th, width: '26%' }}>Group III</th>
                </tr>
              </thead>
              <tbody>
                {filteredForms.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)', fontSize: '0.88rem' }}>
                      no results for "{searchQuery}"
                    </td>
                  </tr>
                )}
                {filteredForms.map((row, i) => {
                  const isExpanded = expandedRow === i
                  return (
                    <tr
                      key={row.form}
                      onClick={() => toggleRow(i)}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      aria-label={`${row.form} — нажми чтобы ${isExpanded ? 'свернуть' : 'раскрыть'}`}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRow(i) } }}
                      style={{
                        ...(i % 2 === 0 ? s.rowEven : s.rowOdd),
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <td style={s.tdForm}>
                        <div style={s.formName}>{row.form}</div>
                        {isExpanded && (
                          <div style={s.formDetail}>
                            <div style={s.formRomaji}>{row.formRomaji}</div>
                            <div style={s.formMeaning}>{row.meaning}</div>
                            <div style={s.formMeaningRu}>{row.meaningRu}</div>
                            <div style={s.formLesson}>lesson {row.lesson}</div>
                          </div>
                        )}
                        {!isExpanded && (
                          <div style={s.formLessonSmall}>L{row.lesson}</div>
                        )}
                      </td>
                      <td style={s.tdVerb}>
                        <div style={s.verbJp}>{row.groupI.jp}</div>
                        {(isExpanded || showRomaji) && (
                          <div style={s.verbRomaji}>{row.groupI.romaji}</div>
                        )}
                      </td>
                      <td style={s.tdVerb}>
                        <div style={s.verbJp}>{row.groupII.jp}</div>
                        {(isExpanded || showRomaji) && (
                          <div style={s.verbRomaji}>{row.groupII.romaji}</div>
                        )}
                      </td>
                      <td style={s.tdVerb}>
                        <div style={s.verbJp}>{row.groupIII.jp}</div>
                        {(isExpanded || showRomaji) && (
                          <div style={s.verbRomaji}>{row.groupIII.romaji}</div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={s.tapHint}>tap any row to see romaji & details</div>
        </div>
      )}

      {/* te-form rules */}
      {(activeSection === 'all' || activeSection === 'te-rules') && (
        <div className="animate-fadeInUp" style={s.section}>
          <div style={s.sectionHeader}>
            <span style={s.sectionIcon}>🔄</span>
            <span style={s.sectionTitle}>te-form rules (Group I)</span>
            <span style={s.sectionTitleJp}>て形のルール (te-kei no ruuru)</span>
          </div>

          <div style={s.teRulesGrid}>
            {teFormRules.map((rule) => (
              <div key={rule.ending} className="glass" style={s.teRuleCard}>
                <div style={s.teRuleTop}>
                  <div style={s.teRuleEnding}>
                    <div style={s.teRuleEndingJp}>{rule.ending}</div>
                    <div style={s.teRuleEndingRomaji}>{rule.endingRomaji}</div>
                  </div>
                  <div style={s.teArrow}>→</div>
                  <div style={s.teRuleResult}>
                    <div style={s.teRuleResultJp}>{rule.teForm}</div>
                    <div style={s.teRuleResultRomaji}>{rule.teRomaji}</div>
                  </div>
                </div>
                <div style={s.teRuleExample}>
                  <div style={s.teExampleJp}>{rule.example}</div>
                  <div style={s.teExampleRomaji}>{rule.exampleRomaji}</div>
                  <div style={s.teExampleRu}>{rule.exampleRu}</div>
                </div>
              </div>
            ))}

            {/* exception card */}
            <div className="glass" style={{ ...s.teRuleCard, ...s.teRuleException }}>
              <div style={s.exceptionBadge}>
                <span style={s.exceptionBadgeText}>exception!</span>
              </div>
              <div style={s.teRuleTop}>
                <div style={s.teRuleEnding}>
                  <div style={s.teRuleEndingJp}>いきます</div>
                  <div style={s.teRuleEndingRomaji}>ikimasu</div>
                </div>
                <div style={s.teArrow}>→</div>
                <div style={s.teRuleResult}>
                  <div style={s.teRuleResultJp}>いって</div>
                  <div style={s.teRuleResultRomaji}>itte</div>
                </div>
              </div>
              <div style={s.teRuleExample}>
                <div style={s.teExampleRu}>
                  идти (not いいて!) ~ iru (not iite!)
                </div>
              </div>
            </div>
          </div>

          {/* Group II & III te-form note */}
          <div className="glass-sm" style={s.teNote}>
            <div style={s.teNoteTitle}>Group II & III te-form</div>
            <div style={s.teNoteContent}>
              <div style={s.teNoteRow}>
                <span style={s.teNoteLabel}>Group II:</span>
                <span style={s.teNoteValue}>
                  drop ます (masu), add て (te)
                </span>
              </div>
              <div style={s.teNoteExample}>
                たべます → たべて (tabemasu → tabete)
              </div>
              <div style={s.teNoteRow}>
                <span style={s.teNoteLabel}>Group III:</span>
                <span style={s.teNoteValue}>
                  memorize!
                </span>
              </div>
              <div style={s.teNoteExample}>
                します → して (shimasu → shite) / きます → きて (kimasu → kite)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* details section */}
      {activeSection === 'details' && (
        <div className="animate-fadeInUp" style={s.section}>
          <div style={s.sectionHeader}>
            <span style={s.sectionIcon}>📚</span>
            <span style={s.sectionTitle}>подробные объяснения</span>
            <span style={s.sectionTitleJp}>くわしいせつめい</span>
          </div>

          {/* lesson filter info */}
          <div className="glass-sm" style={s.lessonFilterNote}>
            <span style={s.lessonFilterIcon}>🔓</span>
            <span style={s.lessonFilterText}>
              {maxLesson > 20
                ? 'Показаны все формы (уроки 1–25)'
                : `Показаны формы до урока ${maxLesson} · Открой больше уроков, чтобы увидеть все`}
            </span>
          </div>

          <div style={s.detailGrid}>
            {detailForms.map((form, i) => {
              const isOpen = expandedCard === i
              return (
                <div key={form.form} className="glass" style={s.detailCard}>
                  {/* card header */}
                  <div style={s.detailCardHeader}>
                    <div style={s.detailCardLeft}>
                      <span style={s.detailIcon}>{form.icon || '📌'}</span>
                      <div style={s.detailCardTitles}>
                        <div style={s.detailFormName}>{form.form}</div>
                        <div style={s.detailFormRomaji}>{form.formRomaji}</div>
                      </div>
                    </div>
                    <div style={s.detailCardRight}>
                      <div style={s.detailLessonBadge}>L{form.lesson}</div>
                    </div>
                  </div>

                  {/* meaning */}
                  <div style={s.detailMeaning}>{form.meaningRu}</div>

                  {/* usage */}
                  <div style={s.detailBlock}>
                    <div style={s.detailBlockLabel}>
                      <span style={s.detailBlockEmoji}>💡</span>
                      <span style={s.detailBlockTitle}>Когда использовать</span>
                    </div>
                    <div style={s.detailBlockText}>{form.usage}</div>
                  </div>

                  {/* formation */}
                  {form.formation && (
                    <div style={s.detailBlock}>
                      <div style={s.detailBlockLabel}>
                        <span style={s.detailBlockEmoji}>📐</span>
                        <span style={s.detailBlockTitle}>Образование</span>
                      </div>
                      <div style={s.formationGrid}>
                        <div style={s.formationRow}>
                          <span style={{ ...s.formationGroupTag, background: '#a855f7' }}>I</span>
                          <span style={s.formationText}>{form.formation.group1}</span>
                        </div>
                        <div style={s.formationRow}>
                          <span style={{ ...s.formationGroupTag, background: '#f472b6' }}>II</span>
                          <span style={s.formationText}>{form.formation.group2}</span>
                        </div>
                        <div style={s.formationRow}>
                          <span style={{ ...s.formationGroupTag, background: '#c084fc' }}>III</span>
                          <span style={s.formationText}>{form.formation.group3}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* expand / collapse button */}
                  <button
                    onClick={() => toggleCard(i)}
                    style={s.expandBtn}
                  >
                    <span style={s.expandBtnEmoji}>✏️</span>
                    <span>{isOpen ? 'скрыть примеры' : 'показать примеры'}</span>
                    <span style={{ ...s.expandChevron, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                  </button>

                  {/* sentences — shown when expanded */}
                  {isOpen && form.sentences && form.sentences.length > 0 && (
                    <div style={s.sentencesBlock}>
                      <div style={s.detailBlockLabel}>
                        <span style={s.detailBlockEmoji}>✏️</span>
                        <span style={s.detailBlockTitle}>Примеры</span>
                      </div>
                      <div style={s.sentencesList}>
                        {form.sentences.map((sent, si) => (
                          <div key={si} style={s.sentenceItem}>
                            <div style={s.sentenceJp}>{sent.jp}</div>
                            <div style={s.sentenceRomaji}>{sent.romaji}</div>
                            <div style={s.sentenceRu}>{sent.ru}</div>
                          </div>
                        ))}
                      </div>
                      {/* notes if present */}
                      {form.notes && (
                        <div style={s.notesBlock}>
                          <span style={s.notesEmoji}>⚡</span>
                          <span style={s.notesText}>{form.notes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* back to home + practice */}
      <div style={s.navRow}>
        <Link to="/" className="btn btn-secondary" style={s.navBtn}>
          ← home
        </Link>
        <Link to="/quiz/te-form" className="btn btn-cute" style={s.navBtn}>
          て-form quiz →
        </Link>
        <Link to="/quiz/conjugation" className="btn btn-cute" style={s.navBtn}>
          conj quiz →
        </Link>
      </div>
    </div>
  )
}

const s = {
  header: {
    textAlign: 'center',
    marginBottom: 20,
    padding: '4px 0',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.85rem',
    color: 'var(--text-light)',
    fontWeight: 700,
    marginBottom: 12,
    textDecoration: 'none',
    minHeight: 44,
  },
  badgeWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badge: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    padding: '4px 16px',
    borderRadius: 50,
  },
  badgeText: {
    fontSize: '0.8rem',
    fontWeight: 800,
    color: 'white',
    textTransform: 'lowercase',
  },
  title: {
    fontSize: '1.65rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    marginBottom: 2,
    textTransform: 'lowercase',
  },
  titleJp: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    marginBottom: 2,
  },
  titleRomaji: {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: 'var(--text-light)',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: '1rem',
    color: 'var(--text-light)',
    fontWeight: 500,
  },

  /* search */
  searchWrap: {
    position: 'relative', marginBottom: 16, display: 'flex', alignItems: 'center',
  },
  searchInput: {
    flex: 1, padding: '10px 40px 10px 16px', borderRadius: 50,
    background: 'var(--tint-medium)', border: '1.5px solid rgba(192,132,252,0.3)',
    fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)',
    fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s',
  },
  searchClear: {
    position: 'absolute', right: 12, background: 'none', border: 'none',
    fontSize: '0.85rem', color: 'var(--text-light)', cursor: 'pointer',
    fontFamily: 'inherit', padding: '4px 6px', minHeight: 44,
  },

  /* tabs */
  tabRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 50,
    background: 'var(--tint-medium)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1.5px solid rgba(192,132,252,0.25)',
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'lowercase',
    fontFamily: 'inherit',
    minHeight: 44,
  },
  tabActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    color: 'white',
    border: '1.5px solid transparent',
    boxShadow: '0 4px 14px rgba(236, 72, 153, 0.3)',
  },
  tabJp: {
    fontSize: '0.78rem',
    opacity: 0.8,
  },

  /* sections */
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  sectionIcon: {
    fontSize: '1.2rem',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    textTransform: 'lowercase',
  },
  sectionTitleJp: {
    fontSize: '0.88rem',
    fontWeight: 600,
    color: 'var(--text-light)',
  },

  /* verb groups */
  groupsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  groupCard: {
    padding: 18,
  },
  groupBadge: {
    display: 'inline-block',
    padding: '4px 14px',
    borderRadius: 50,
    marginBottom: 8,
  },
  groupBadgeText: {
    fontSize: '0.8rem',
    fontWeight: 800,
    color: 'white',
  },
  groupNameJp: {
    fontSize: '1.1rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    marginBottom: 2,
  },
  groupRomaji: {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: 'var(--text-light)',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  groupDesc: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 8,
    lineHeight: 1.5,
  },
  groupExamples: {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: 'var(--text-main)',
    background: 'rgba(192, 132, 252, 0.08)',
    padding: '8px 12px',
    borderRadius: 10,
    borderLeft: '3px solid #c084fc',
    lineHeight: 1.5,
  },
  groupExLabel: {
    fontWeight: 700,
    color: 'var(--text-light)',
  },

  /* conjugation table */
  tableWrap: {
    overflowX: 'auto',
    padding: 0,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px 10px',
    textAlign: 'center',
    fontSize: '0.85rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    textTransform: 'lowercase',
    borderBottom: '2px solid rgba(192, 132, 252, 0.15)',
    letterSpacing: '0.03em',
  },
  rowEven: {
    background: 'rgba(255, 255, 255, 0.15)',
  },
  rowOdd: {
    background: 'transparent',
  },
  tdForm: {
    padding: '10px',
    borderBottom: '1px solid rgba(192, 132, 252, 0.08)',
    verticalAlign: 'top',
  },
  formName: {
    fontSize: '0.95rem',
    fontWeight: 800,
    color: 'var(--text-main)',
  },
  formDetail: {
    marginTop: 6,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  formRomaji: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    fontStyle: 'italic',
  },
  formMeaning: {
    fontSize: '0.82rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  formMeaningRu: {
    fontSize: '0.82rem',
    fontWeight: 500,
    color: 'var(--text-light)',
    fontStyle: 'italic',
  },
  formLesson: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    background: 'rgba(192, 132, 252, 0.1)',
    padding: '2px 8px',
    borderRadius: 50,
    display: 'inline-block',
    marginTop: 2,
  },
  formLessonSmall: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    marginTop: 2,
  },
  tdVerb: {
    padding: '10px 8px',
    borderBottom: '1px solid rgba(192, 132, 252, 0.08)',
    textAlign: 'center',
    verticalAlign: 'top',
  },
  verbJp: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-main)',
    lineHeight: 1.4,
  },
  verbRomaji: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    marginTop: 2,
    lineHeight: 1.3,
    letterSpacing: '0.02em',
  },
  tapHint: {
    textAlign: 'center',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    marginTop: 8,
    fontStyle: 'italic',
  },

  /* te-form rules */
  teRulesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  teRuleCard: {
    padding: 16,
  },
  teRuleTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  teRuleEnding: {
    textAlign: 'center',
  },
  teRuleEndingJp: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
  },
  teRuleEndingRomaji: {
    fontSize: '0.82rem',
    fontWeight: 500,
    color: 'var(--text-light)',
    fontStyle: 'italic',
  },
  teArrow: {
    fontSize: '1.2rem',
    fontWeight: 800,
    color: '#f472b6',
  },
  teRuleResult: {
    textAlign: 'center',
  },
  teRuleResultJp: {
    fontSize: '1.1rem',
    fontWeight: 800,
    color: 'var(--text-main)',
  },
  teRuleResultRomaji: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    fontStyle: 'italic',
  },
  teRuleExample: {
    background: 'rgba(192, 132, 252, 0.08)',
    border: '1px solid rgba(192, 132, 252, 0.15)',
    borderRadius: 10,
    padding: '8px 12px',
    borderLeft: '3px solid #c084fc',
    textAlign: 'center',
  },
  teExampleJp: {
    fontSize: '0.88rem',
    fontWeight: 700,
    color: 'var(--text-main)',
    marginBottom: 2,
  },
  teExampleRomaji: {
    fontSize: '0.78rem',
    fontWeight: 500,
    color: 'var(--text-light)',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  teExampleRu: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  teRuleException: {
    border: '2px solid rgba(244, 114, 182, 0.3)',
    background: 'rgba(244, 114, 182, 0.04)',
  },
  exceptionBadge: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #f472b6, #ef4444)',
    padding: '3px 12px',
    borderRadius: 50,
    marginBottom: 8,
  },
  exceptionBadgeText: {
    fontSize: '0.72rem',
    fontWeight: 800,
    color: 'white',
    textTransform: 'lowercase',
  },

  /* te-form note */
  teNote: {
    padding: 16,
    marginTop: 12,
  },
  teNoteTitle: {
    fontSize: '0.85rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    marginBottom: 10,
    textTransform: 'lowercase',
  },
  teNoteContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  teNoteRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  teNoteLabel: {
    fontSize: '0.78rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    minWidth: 70,
  },
  teNoteValue: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  teNoteExample: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'var(--text-main)',
    background: 'rgba(192, 132, 252, 0.06)',
    padding: '6px 12px',
    borderRadius: 8,
    marginLeft: 'clamp(0px, 12vw, 78px)',
    fontStyle: 'italic',
  },

  /* details section */
  lessonFilterNote: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    marginBottom: 16,
    borderRadius: 12,
  },
  lessonFilterIcon: {
    fontSize: '1rem',
    flexShrink: 0,
  },
  lessonFilterText: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  detailGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  detailCard: {
    padding: '20px 18px 16px',
    borderRadius: 16,
  },
  detailCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  detailCardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  detailIcon: {
    fontSize: '1.5rem',
    flexShrink: 0,
    lineHeight: 1,
  },
  detailCardTitles: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  detailFormName: {
    fontSize: '1.1rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    lineHeight: 1.2,
  },
  detailFormRomaji: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    fontStyle: 'italic',
  },
  detailCardRight: {
    flexShrink: 0,
  },
  detailLessonBadge: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    color: 'white',
    fontSize: '0.72rem',
    fontWeight: 800,
    padding: '4px 10px',
    borderRadius: 50,
    whiteSpace: 'nowrap',
  },
  detailMeaning: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    marginBottom: 14,
    lineHeight: 1.4,
  },
  detailBlock: {
    marginBottom: 14,
  },
  detailBlockLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  detailBlockEmoji: {
    fontSize: '1rem',
    lineHeight: 1,
  },
  detailBlockTitle: {
    fontSize: '0.82rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  detailBlockText: {
    fontSize: '0.92rem',
    fontWeight: 500,
    color: 'var(--text-main)',
    lineHeight: 1.65,
    paddingLeft: 26,
  },
  formationGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
    paddingLeft: 26,
  },
  formationRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
  },
  formationGroupTag: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 22,
    height: 22,
    borderRadius: 6,
    fontSize: '0.72rem',
    fontWeight: 900,
    color: 'white',
    flexShrink: 0,
    marginTop: 1,
  },
  formationText: {
    fontSize: '0.88rem',
    fontWeight: 500,
    color: 'var(--text-main)',
    lineHeight: 1.5,
  },
  expandBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    padding: '10px 14px',
    marginTop: 4,
    background: 'rgba(192, 132, 252, 0.1)',
    border: '1.5px solid rgba(192, 132, 252, 0.2)',
    borderRadius: 10,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    transition: 'all 0.2s ease',
    minHeight: 44,
    justifyContent: 'space-between',
  },
  expandBtnEmoji: {
    fontSize: '1rem',
  },
  expandChevron: {
    fontSize: '1rem',
    fontWeight: 900,
    transition: 'transform 0.25s ease',
    display: 'inline-block',
  },
  sentencesBlock: {
    marginTop: 14,
    paddingTop: 14,
    borderTop: '1px solid rgba(192, 132, 252, 0.15)',
  },
  sentencesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    paddingLeft: 26,
    marginTop: 8,
  },
  sentenceItem: {
    background: 'rgba(192, 132, 252, 0.06)',
    border: '1px solid rgba(192, 132, 252, 0.12)',
    borderLeft: '3px solid #c084fc',
    borderRadius: 10,
    padding: '10px 14px',
  },
  sentenceJp: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-main)',
    marginBottom: 3,
    lineHeight: 1.4,
  },
  sentenceRomaji: {
    fontSize: '0.82rem',
    fontWeight: 500,
    color: 'var(--text-light)',
    fontStyle: 'italic',
    marginBottom: 3,
    lineHeight: 1.4,
  },
  sentenceRu: {
    fontSize: '0.88rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  notesBlock: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    background: 'rgba(244, 114, 182, 0.08)',
    border: '1px solid rgba(244, 114, 182, 0.2)',
    borderLeft: '3px solid #f472b6',
    borderRadius: 10,
    padding: '10px 14px',
  },
  notesEmoji: {
    fontSize: '1rem',
    flexShrink: 0,
    marginTop: 1,
  },
  notesText: {
    fontSize: '0.88rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },

  /* nav */
  navRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 90,
    gap: 12,
  },
  navBtn: {
    fontSize: '0.8rem',
    textTransform: 'lowercase',
  },
}
