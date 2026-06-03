import { useState, useMemo, useRef, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Confetti from '../components/Confetti'
import ShareResult from '../components/ShareResult'
import { useXP } from '../hooks/useXP'
import { useProgress } from '../hooks/useProgress'
import { useIsMobile, useIsTablet } from '../hooks/useIsMobile'
import { useUnlockedLessons } from '../hooks/useUnlockedLessons'
import { getStoredFlag, getStoredQuizSize, setStoredString } from '../utils/localSettings'

// Fill-in-the-blank grammar exercises organized by Minna no Nihongo lesson
const exercises = [
  // Lesson 4-5: verbs, time
  { sentence: '毎朝 7時___起きます。', furigana: '{毎朝|まいあさ} 7{時|じ}___{起|お}きます。', answer: 'に', romaji: 'Maiasa shichiji ni okimasu.', russian: 'Каждое утро встаю в 7 часов.', lesson: 4 },
  { sentence: '昨日 東京___行きました。', furigana: '{昨日|きのう} {東京|とうきょう}___{行|い}きました。', answer: 'へ', romaji: 'Kinō Tōkyō e ikimashita.', russian: 'Вчера ездил в Токио.', lesson: 5 },
  { sentence: '友達___映画を 見ました。', furigana: '{友達|ともだち}___{映画|えいが}を {見|み}ました。', answer: 'と', romaji: 'Tomodachi to eiga o mimashita.', russian: 'Смотрел фильм с другом.', lesson: 5 },
  { sentence: 'バス___学校へ 行きます。', furigana: 'バス___{学校|がっこう}へ {行|い}きます。', answer: 'で', romaji: 'Basu de gakkō e ikimasu.', russian: 'Еду в школу на автобусе.', lesson: 5 },

  // Lesson 6: eating, actions
  { sentence: 'レストラン___昼ごはんを 食べます。', furigana: 'レストラン___{昼|ひる}ごはんを {食|た}べます。', answer: 'で', romaji: 'Resutoran de hirugohan o tabemasu.', russian: 'Обедаю в ресторане.', lesson: 6 },
  { sentence: 'コーヒー___飲みますか。', furigana: 'コーヒー___{飲|の}みますか。', answer: 'を', romaji: 'Kōhī o nomimasu ka.', russian: 'Будете пить кофе?', lesson: 6 },

  // Lesson 7: giving/receiving
  { sentence: 'ミラーさん___日本語を 教えます。', furigana: 'ミラーさん___{日本語|にほんご}を {教|おし}えます。', answer: 'に', romaji: 'Mirā-san ni nihongo o oshiemasu.', russian: 'Учу Миллера японскому языку.', lesson: 7 },
  { sentence: '私は 母___花を あげました。', furigana: '{私|わたし}は {母|はは}___{花|はな}を あげました。', answer: 'に', romaji: 'Watashi wa haha ni hana o agemashita.', russian: 'Я подарил маме цветы.', lesson: 7 },
  { sentence: '友達___プレゼントを もらいました。', furigana: '{友達|ともだち}___プレゼントを もらいました。', answer: 'に', romaji: 'Tomodachi ni purezento o moraimashita.', russian: 'Получил подарок от друга.', lesson: 7 },

  // Lesson 8: adjectives
  { sentence: '日本語___おもしろいです。', furigana: '{日本語|にほんご}___おもしろいです。', answer: 'は', romaji: 'Nihongo wa omoshiroi desu.', russian: 'Японский язык интересный.', lesson: 8 },
  { sentence: 'この 本___好きです。', furigana: 'この {本|ほん}___{好|す}きです。', answer: 'が', romaji: 'Kono hon ga suki desu.', russian: 'Мне нравится эта книга.', lesson: 8 },
  { sentence: '東京は にぎやか___町です。', furigana: '{東京|とうきょう}は にぎやか___{町|まち}です。', answer: 'な', romaji: 'Tōkyō wa nigiyaka na machi desu.', russian: 'Токио — оживлённый город.', lesson: 9 },

  // Lesson 9: likes, abilities
  { sentence: '田中さんは 料理___上手です。', furigana: '{田中|たなか}さんは {料理|りょうり}___{上手|じょうず}です。', answer: 'が', romaji: 'Tanaka-san wa ryōri ga jōzu desu.', russian: 'Танака хорошо готовит.', lesson: 9 },
  { sentence: '日本語___少し わかります。', furigana: '{日本語|にほんご}___少し わかります。', answer: 'が', romaji: 'Nihongo ga sukoshi wakarimasu.', russian: 'Немного понимаю японский.', lesson: 9 },
  { sentence: 'サッカー___できますか。', furigana: 'サッカー___できますか。', answer: 'が', romaji: 'Sakkā ga dekimasu ka.', russian: 'Вы умеете играть в футбол?', lesson: 9 },

  // Lesson 10: existence
  { sentence: '部屋___テレビが あります。', furigana: '{部屋|へや}___テレビが あります。', answer: 'に', romaji: 'Heya ni terebi ga arimasu.', russian: 'В комнате есть телевизор.', lesson: 10 },
  { sentence: '公園___子どもが います。', furigana: '{公園|こうえん}___子どもが います。', answer: 'に', romaji: 'Kōen ni kodomo ga imasu.', russian: 'В парке есть дети.', lesson: 10 },
  { sentence: '机の 上___本が あります。', furigana: '{机|つくえ}の {上|うえ}___{本|ほん}が あります。', answer: 'に', romaji: 'Tsukue no ue ni hon ga arimasu.', russian: 'На столе есть книга.', lesson: 10 },
  { sentence: 'テーブルの 上___花が あります。', furigana: 'テーブルの {上|うえ}___花が あります。', answer: 'に', romaji: 'Tēburu no ue ni hana ga arimasu.', russian: 'На столе есть цветы.', lesson: 10 },
  { sentence: 'あそこ___犬が います。', furigana: 'あそこ___{犬|いぬ}が います。', answer: 'に', romaji: 'Asoko ni inu ga imasu.', russian: 'Вон там есть собака.', lesson: 10 },

  // Lesson 11: counting
  { sentence: 'りんご___3つ ください。', furigana: 'りんご___3つ ください。', answer: 'を', romaji: 'Ringo o mittsu kudasai.', russian: 'Дайте, пожалуйста, 3 яблока.', lesson: 11 },
  { sentence: '切手___5枚 買いました。', furigana: '{切手|きって}___5{枚|まい} {買|か}いました。', answer: 'を', romaji: 'Kitte o gomai kaimashita.', russian: 'Купил 5 марок.', lesson: 11 },
  { sentence: 'ビール___3本 飲みました。', furigana: 'ビール___3{本|ほん} {飲|の}みました。', answer: 'を', romaji: 'Bīru o sanbon nomimashita.', russian: 'Выпил 3 бутылки пива.', lesson: 11 },
  { sentence: 'ジュース___2本 ください。', furigana: 'ジュース___2{本|ほん} ください。', answer: 'を', romaji: 'Jūsu o nihon kudasai.', russian: 'Дайте, пожалуйста, 2 бутылки сока.', lesson: 11 },
  { sentence: 'この 本___3冊 買いました。', furigana: 'この {本|ほん}___3{冊|さつ} {買|か}いました。', answer: 'を', romaji: 'Kono hon o sansatsu kaimashita.', russian: 'Купил 3 экземпляра этой книги.', lesson: 11 },

  // Lesson 12: comparisons (past tense + adjectives)
  { sentence: '昨日は 暑かった___。', furigana: '{昨日|きのう}は {暑|あつ}かった___。', answer: 'です', romaji: 'Kinō wa atsukatta desu.', russian: 'Вчера было жарко.', lesson: 12 },
  { sentence: '先週の テスト___簡単でした。', furigana: '{先週|せんしゅう}の テスト___{簡単|かんたん}でした。', answer: 'は', romaji: 'Senshū no tesuto wa kantan deshita.', russian: 'Тест на прошлой неделе был простой.', lesson: 12 },
  { sentence: '東京は 大阪___大きいです。', furigana: '{東京|とうきょう}は {大阪|おおさか}___大きいです。', answer: 'より', romaji: 'Tōkyō wa Ōsaka yori ōkii desu.', russian: 'Токио больше Осаки.', lesson: 12 },

  // Lesson 13: desires
  { sentence: '日本___行きたいです。', furigana: '{日本|にほん}___{行|い}きたいです。', answer: 'へ', romaji: 'Nihon e ikitai desu.', russian: 'Хочу поехать в Японию.', lesson: 13 },
  { sentence: '何___食べたいですか。', furigana: '{何|なに}___{食|た}べたいですか。', answer: 'が', romaji: 'Nani ga tabetai desu ka.', russian: 'Что хотите поесть?', lesson: 13 },
  { sentence: '新しい カメラ___ほしいです。', furigana: '{新|あたら}しい カメラ___ほしいです。', answer: 'が', romaji: 'Atarashii kamera ga hoshii desu.', russian: 'Хочу новую камеру.', lesson: 13 },
  { sentence: 'コーヒー___飲みたいです。', furigana: 'コーヒー___{飲|の}みたいです。', answer: 'を', romaji: 'Kōhī o nomitai desu.', russian: 'Хочу выпить кофе.', lesson: 13 },
  { sentence: '新しい 友達___ほしいです。', furigana: '{新|あたら}しい {友達|ともだち}___ほしいです。', answer: 'が', romaji: 'Atarashii tomodachi ga hoshii desu.', russian: 'Хочу новых друзей.', lesson: 13 },

  // Lesson 14: te-form
  { sentence: 'すみません、道___教えてください。', furigana: 'すみません、{道|みち}___{教|おし}えてください。', answer: 'を', romaji: 'Sumimasen, michi o oshiete kudasai.', russian: 'Извините, подскажите дорогу.', lesson: 14 },
  { sentence: 'ちょっと 待っ___ください。', furigana: 'ちょっと {待|ま}っ___ください。', answer: 'て', romaji: 'Chotto matte kudasai.', russian: 'Подождите, пожалуйста.', lesson: 14 },
  { sentence: '窓___開けてください。', furigana: '{窓|まど}___{開|あ}けてください。', answer: 'を', romaji: 'Mado o akete kudasai.', russian: 'Откройте окно, пожалуйста.', lesson: 14 },
  { sentence: 'ここ___写真を 撮っても いいですか。', furigana: 'ここ___{写真|しゃしん}を {撮|と}っても いいですか。', answer: 'で', romaji: 'Koko de shashin o tottemo ii desu ka.', russian: 'Можно здесь фотографировать?', lesson: 15 },
  { sentence: '今、雨___降っています。', furigana: '{今|いま}、{雨|あめ}___降っています。', answer: 'が', romaji: 'Ima, ame ga futte imasu.', russian: 'Сейчас идёт дождь.', lesson: 14 },
  { sentence: '塩___取ってください。', furigana: '{塩|しお}___取ってください。', answer: 'を', romaji: 'Shio o totte kudasai.', russian: 'Передайте, пожалуйста, соль.', lesson: 14 },
  { sentence: '荷物___持ちましょうか。', furigana: '{荷物|にもつ}___持ちましょうか。', answer: 'を', romaji: 'Nimotsu o mochimashoo ka.', russian: 'Давайте я понесу багаж?', lesson: 14 },
  { sentence: 'ミラーさんは 今 電話___かけています。', furigana: 'ミラーさんは {今|いま} {電話|でんわ}___かけています。', answer: 'を', romaji: 'Miraa-san wa ima denwa o kakete imasu.', russian: 'Г-н Миллер сейчас разговаривает по телефону.', lesson: 14 },

  // Lesson 15: ~てもいいです / ~てはいけません
  { sentence: 'ここで 写真を 撮っ___いいですか。', furigana: 'ここで {写真|しゃしん}を {撮|と}っ___いいですか。', answer: 'ても', romaji: 'Koko de shashin o tottemo ii desu ka.', russian: 'Можно здесь фотографировать?', lesson: 15 },
  { sentence: 'この 部屋で タバコを 吸っ___いけません。', furigana: 'この {部屋|へや}で タバコを {吸|す}っ___いけません。', answer: 'ては', romaji: 'Kono heya de tabako o sutte wa ikemasen.', russian: 'В этой комнате нельзя курить.', lesson: 15 },
  { sentence: 'もう 帰っ___いいですか。', furigana: 'もう {帰|かえ}っ___いいですか。', answer: 'ても', romaji: 'Mō kaettemo ii desu ka.', russian: 'Уже можно уйти?', lesson: 15 },
  { sentence: '電車の 中で ご飯を 食べ___いけません。', furigana: '{電車|でんしゃ}の {中|なか}で ご{飯|はん}を {食|た}べ___いけません。', answer: 'ては', romaji: 'Densha no naka de gohan o tabete wa ikemasen.', russian: 'Нельзя есть в поезде.', lesson: 15 },
  { sentence: 'この 本___使っても いいですか。', furigana: 'この {本|ほん}___使っても いいですか。', answer: 'を', romaji: 'Kono hon o tsukatte mo ii desu ka.', russian: 'Можно воспользоваться этой книгой?', lesson: 15 },
  { sentence: '試験中に 携帯電話___使っては いけません。', furigana: '{試験|しけん}{中|ちゅう}に {携帯電話|けいたいでんわ}___使っては いけません。', answer: 'を', romaji: 'Shiken-chuu ni keitai denwa o tsukatte wa ikemasen.', russian: 'Нельзя пользоваться телефоном во время экзамена.', lesson: 15 },

  // Lesson 16: ~ながら (simultaneous actions)
  { sentence: '音楽を 聴き___、勉強します。', furigana: '{音楽|おんがく}を {聴|き}き___、{勉強|べんきょう}します。', answer: 'ながら', romaji: 'Ongaku o kikinagara benkyō shimasu.', russian: 'Учусь, слушая музыку.', lesson: 16 },
  { sentence: '歩き___、電話しないでください。', furigana: '{歩|ある}き___、{電話|でんわ}しないでください。', answer: 'ながら', romaji: 'Arukinagara denwa shinaide kudasai.', russian: 'Пожалуйста, не разговаривайте по телефону на ходу.', lesson: 16 },
  { sentence: 'テレビを 見___、ご飯を 食べます。', furigana: 'テレビを {見|み}___、ご{飯|はん}を {食|た}べます。', answer: 'ながら', romaji: 'Terebi o minagara gohan o tabemasu.', russian: 'Ем, глядя телевизор.', lesson: 16 },
  { sentence: '音楽を 聴き___、散歩します。', furigana: '{音楽|おんがく}を {聴|き}き___、{散歩|さんぽ}します。', answer: 'ながら', romaji: 'Ongaku o kikinagara sanpo shimasu.', russian: 'Гуляю, слушая музыку.', lesson: 16 },
  { sentence: '新聞を 読み___、朝ごはんを 食べます。', furigana: '{新聞|しんぶん}を {読|よ}み___、{朝|あさ}ごはんを {食|た}べます。', answer: 'ながら', romaji: 'Shinbun o yominagara asagohan o tabemasu.', russian: 'Завтракаю, читая газету.', lesson: 16 },
  { sentence: '手を 洗って___、ご飯を 食べます。', furigana: '{手|て}を {洗|あら}って___、ご{飯|はん}を {食|た}べます。', answer: 'から', romaji: 'Te o aratte kara, gohan o tabemasu.', russian: 'После того как помою руки, поем.', lesson: 16 },
  { sentence: '宿題を して___、テレビを 見ます。', furigana: '{宿題|しゅくだい}を して___、テレビを {見|み}ます。', answer: 'から', romaji: 'Shukudai o shite kara, terebi o mimasu.', russian: 'После домашнего задания посмотрю телевизор.', lesson: 16 },

  // Lesson 17: ~なければなりません / ~なくてもいいです
  { sentence: '毎日 薬を 飲ま___なりません。', furigana: '{毎日|まいにち} {薬|くすり}を {飲|の}ま___なりません。', answer: 'なければ', romaji: 'Mainichi kusuri o nomanakereba narimasen.', russian: 'Нужно каждый день принимать лекарство.', lesson: 17 },
  { sentence: '今日は 学校___来なくても いいです。', furigana: '{今日|きょう}は {学校|がっこう}___来なくても いいです。', answer: 'に', romaji: 'Kyō wa gakkō ni konakute mo ii desu.', russian: 'Сегодня не нужно приходить в школу.', lesson: 17 },
  { sentence: 'もっと 野菜を 食べ___なりません。', furigana: 'もっと {野菜|やさい}を {食|た}べ___なりません。', answer: 'なければ', romaji: 'Motto yasai o tabenakereba narimasen.', russian: 'Нужно есть больше овощей.', lesson: 17 },
  { sentence: '明日 早く 起き___なりません。', furigana: '{明日|あした} {早|はや}く {起|お}き___なりません。', answer: 'なければ', romaji: 'Ashita hayaku okina kereba narimasen.', russian: 'Завтра нужно встать рано.', lesson: 17 },
  { sentence: '宿題___しなくても いいですか。', furigana: '{宿題|しゅくだい}___しなくても いいですか。', answer: 'は', romaji: 'Shukudai wa shinakute mo ii desu ka.', russian: 'Домашнее задание делать не обязательно?', lesson: 17 },

  // Lesson 18: dictionary form + ことができます
  { sentence: '私は 日本語___話すことが できます。', furigana: '{私|わたし}は {日本語|にほんご}___{話|はな}すことが できます。', answer: 'を', romaji: 'Watashi wa nihongo o hanasu koto ga dekimasu.', russian: 'Я умею говорить по-японски.', lesson: 18 },
  { sentence: 'ここで 泳ぐ___が できません。', furigana: 'ここで {泳|およ}ぐ___が できません。', answer: 'こと', romaji: 'Koko de oyogu koto ga dekimasen.', russian: 'Здесь нельзя плавать.', lesson: 18 },
  { sentence: 'かれは 車を 運転する___ができます。', furigana: 'かれは {車|くるま}を {運転|うんてん}する___ができます。', answer: 'こと', romaji: 'Kare wa kuruma o unten suru koto ga dekimasu.', russian: 'Он умеет водить машину.', lesson: 18 },
  { sentence: 'ピアノ___弾くことが できます。', furigana: 'ピアノ___{弾|ひ}くことが できます。', answer: 'を', romaji: 'Piano o hiku koto ga dekimasu.', russian: 'Умею играть на пианино.', lesson: 18 },
  { sentence: '漢字を 読む___が できません。', furigana: '{漢字|かんじ}を {読|よ}む___が できません。', answer: 'こと', romaji: 'Kanji o yomu koto ga dekimasen.', russian: 'Не умею читать кандзи.', lesson: 18 },

  // Lesson 19: た form + ことがあります / ~たり~たりします / ~になります
  { sentence: '富士山___登ったことが あります。', furigana: '{富士山|ふじさん}___{登|のぼ}ったことが あります。', answer: 'に', romaji: 'Fujisan ni nobotta koto ga arimasu.', russian: 'Я взбирался на Фудзи.', lesson: 19 },
  { sentence: '週末は 映画を 見たり、音楽を 聴い___します。', furigana: '{週末|しゅうまつ}は {映画|えいが}を {見|み}たり、{音楽|おんがく}を {聴|き}い___します。', answer: 'たり', romaji: 'Shūmatsu wa eiga o mitari, ongaku o kiitari shimasu.', russian: 'По выходным смотрю фильмы, слушаю музыку и т.д.', lesson: 19 },
  { sentence: 'すし___食べたことが ありますか。', furigana: 'すし___{食|た}べたことが ありますか。', answer: 'を', romaji: 'Sushi o tabeta koto ga arimasu ka.', russian: 'Вы когда-нибудь ели суши?', lesson: 19 },
  { sentence: 'ヨーロッパに 行っ___ことが ありますか。', furigana: 'ヨーロッパに {行|い}っ___ことが ありますか。', answer: 'た', romaji: 'Yōroppa ni itta koto ga arimasu ka.', russian: 'Вы когда-нибудь бывали в Европе?', lesson: 19 },
  { sentence: '音楽___聴いたり、本を 読んだり します。', furigana: '{音楽|おんがく}___{聴|き}いたり、{本|ほん}を {読|よ}んだり します。', answer: 'を', romaji: 'Ongaku o kiitari, hon o yondari shimasu.', russian: 'То слушаю музыку, то читаю книги.', lesson: 19 },
  { sentence: '日本語が 上手___なりました。', furigana: '{日本語|にほんご}が {上手|じょうず}___なりました。', answer: 'に', romaji: 'Nihongo ga jouzu ni narimashita.', russian: 'Мой японский стал лучше.', lesson: 19 },

  // Lesson 20: plain form quotation + と言います / と思います
  { sentence: '先生は 明日 試験___あると 言いました。', furigana: '{先生|せんせい}は {明日|あした} {試験|しけん}___あると {言|い}いました。', answer: 'が', romaji: 'Sensei wa ashita shiken ga aru to iimashita.', russian: 'Преподаватель сказал, что завтра экзамен.', lesson: 20 },
  { sentence: '彼女は 来ない___思います。', furigana: '{彼女|かのじょ}は 来ない___思います。', answer: 'と', romaji: 'Kanojo wa konai to omoimasu.', russian: 'Думаю, она не придёт.', lesson: 20 },
  { sentence: '山田さんは 日本語___上手だと 言っています。', furigana: '{山田|やまだ}さんは {日本語|にほんご}___{上手|じょうず}だと {言|い}っています。', answer: 'が', romaji: 'Yamada-san wa nihongo ga jōzu da to itte imasu.', russian: 'Говорят, что Ямада хорошо говорит по-японски.', lesson: 20 },
  { sentence: '田中さんは 明日 来ない___言いました。', furigana: '{田中|たなか}さんは {明日|あした} 来ない___言いました。', answer: 'と', romaji: 'Tanaka-san wa ashita konai to iimashita.', russian: 'Танака сказал, что завтра не придёт.', lesson: 20 },
  { sentence: 'あの 映画は おもしろい___思います。', furigana: 'あの {映画|えいが}は おもしろい___思います。', answer: 'と', romaji: 'Ano eiga wa omoshiroi to omoimasu.', russian: 'Думаю, тот фильм интересный.', lesson: 20 },

  // Lesson 21: と思います / と言っていました / んです
  { sentence: 'あした 雨が 降る___思います。', furigana: 'あした {雨|あめ}が {降|ふ}る___思います。', answer: 'と', romaji: 'Ashita ame ga furu to omoimasu.', russian: 'Думаю, завтра пойдёт дождь.', lesson: 21 },
  { sentence: '田中さんは 忙しい___言っていました。', furigana: '{田中|たなか}さんは {忙|いそが}しい___言っていました。', answer: 'と', romaji: 'Tanaka-san wa isogashii to itte imashita.', russian: 'Танака говорил, что он занят.', lesson: 21 },
  { sentence: 'どうした___ですか。', furigana: 'どうした___ですか。', answer: 'ん', romaji: 'Doushita n desu ka.', russian: 'Что случилось?', lesson: 21 },
  { sentence: '体が 痛い___です。病院に 行ってください。', furigana: '{体|からだ}が {痛|いた}い___です。{病院|びょういん}に 行ってください。', answer: 'ん', romaji: 'Karada ga itai n desu. Byōin ni itte kudasai.', russian: 'У меня болит тело. Идите в больницу.', lesson: 21 },
  { sentence: 'もっと 難しい___思っていました。', furigana: 'もっと {難|むずか}しい___思っていました。', answer: 'と', romaji: 'Motto muzukashii to omotte imashita.', russian: 'Думал, что будет сложнее.', lesson: 21 },

  // Lesson 22: noun modification (plain form + noun, て-form iru + noun)
  { sentence: 'あそこに___人は だれですか。', furigana: 'あそこに___{人|ひと}は だれですか。', answer: 'いる', romaji: 'Asoko ni iru hito wa dare desu ka.', russian: 'Кто тот человек, стоящий вон там?', lesson: 22 },
  { sentence: 'きのう 買っ___本は おもしろかったです。', furigana: 'きのう {買|か}っ___{本|ほん}は おもしろかったです。', answer: 'た', romaji: 'Kinou katta hon wa omoshirokatta desu.', russian: 'Книга, которую я купил вчера, была интересной.', lesson: 22 },
  { sentence: '眼鏡を かけて___人は 山田さんです。', furigana: '{眼鏡|めがね}を かけて___{人|ひと}は {山田|やまだ}さんです。', answer: 'いる', romaji: 'Megane o kakete iru hito wa Yamada-san desu.', russian: 'Человек в очках — это Ямада.', lesson: 22 },
  { sentence: 'あそこに 立って___女の人は だれですか。', furigana: 'あそこに 立って___{女|おんな}の{人|ひと}は だれですか。', answer: 'いる', romaji: 'Asoko ni tatte iru onna no hito wa dare desu ka.', russian: 'Кто та женщина, стоящая вон там?', lesson: 22 },
  { sentence: '山田さんが 作っ___料理は おいしかったです。', furigana: '{山田|やまだ}さんが {作|つく}っ___{料理|りょうり}は おいしかったです。', answer: 'た', romaji: 'Yamada-san ga tsukutta ryōri wa oishikatta desu.', russian: 'Блюдо, приготовленное Ямадой, было вкусным.', lesson: 22 },

  // Lesson 23: とき / conditional と
  { sentence: 'ボタンを 押す___、ドアが 開きます。', furigana: 'ボタンを {押|お}す___、ドアが {開|あ}きます。', answer: 'と', romaji: 'Botan o osu to, doa ga akimasu.', russian: 'Если нажать кнопку, дверь откроется.', lesson: 23 },
  { sentence: '困っ___とき、電話してください。', furigana: '{困|こま}っ___とき、{電話|でんわ}してください。', answer: 'た', romaji: 'Komatta toki, denwa shite kudasai.', russian: 'Если окажетесь в затруднении, позвоните.', lesson: 23 },
  { sentence: '日本に___とき、富士山を 見ました。', furigana: '{日本|にほん}に___とき、{富士山|ふじさん}を {見|み}ました。', answer: 'いった', romaji: 'Nihon ni itta toki, Fujisan o mimashita.', russian: 'Когда я был в Японии, видел Фудзи.', lesson: 23 },
  { sentence: '暇な___、遊びに 来てください。', furigana: '暇な___、{遊|あそ}びに 来てください。', answer: 'とき', romaji: 'Hima na toki, asobi ni kite kudasai.', russian: 'Когда свободны, приходите в гости.', lesson: 23 },
  { sentence: '右___曲がると、郵便局が あります。', furigana: '{右|みぎ}___曲がると、{郵便局|ゆうびんきょく}が あります。', answer: 'に', romaji: 'Migi ni magaru to, yūbinkyoku ga arimasu.', russian: 'Если свернёте направо, увидите почту.', lesson: 23 },

  // Lesson 24: て-form + あげます / もらいます / くれます
  { sentence: '友達が 荷物を 持って___ました。', furigana: '{友達|ともだち}が {荷物|にもつ}を {持|も}って___ました。', answer: 'くれ', romaji: 'Tomodachi ga nimotsu o motte kuremashita.', russian: 'Друг понёс мои вещи за меня.', lesson: 24 },
  { sentence: '先生に 日本語を 教えて___ました。', furigana: '{先生|せんせい}に {日本語|にほんご}を {教|おし}えて___ました。', answer: 'もらい', romaji: 'Sensei ni nihongo o oshiete moraimashita.', russian: 'Учитель обучил меня японскому.', lesson: 24 },
  { sentence: '弟に 本を 読んで___ました。', furigana: '{弟|おとうと}に {本|ほん}を {読|よ}んで___ました。', answer: 'あげ', romaji: 'Otouto ni hon o yonde agemashita.', russian: 'Я прочитал книгу младшему брату.', lesson: 24 },
  { sentence: '姉が ケーキを 作って___ました。', furigana: '{姉|あね}が ケーキを {作|つく}って___ました。', answer: 'くれ', romaji: 'Ane ga kēki o tsukutte kuremashita.', russian: 'Старшая сестра испекла для меня торт.', lesson: 24 },
  { sentence: '山田さんに 傘___貸して あげました。', furigana: '{山田|やまだ}さんに {傘|かさ}___貸して あげました。', answer: 'を', romaji: 'Yamada-san ni kasa o kashite agemashita.', russian: 'Я одолжил зонт Ямаде.', lesson: 24 },

  // Lesson 25: たら (conditional) / ても (concessive)
  { sentence: '日本に 行っ___、お寺を 見たいです。', furigana: '{日本|にほん}に {行|い}っ___、お{寺|てら}を {見|み}たいです。', answer: 'たら', romaji: 'Nihon ni ittara, otera o mitai desu.', russian: 'Если поеду в Японию, хочу посмотреть храмы.', lesson: 25 },
  { sentence: '雨が 降っ___、行きます。', furigana: '{雨|あめ}が {降|ふ}っ___、{行|い}きます。', answer: 'ても', romaji: 'Ame ga futte mo, ikimasu.', russian: 'Пойду, даже если будет дождь.', lesson: 25 },
  { sentence: 'お金が あっ___、旅行したいです。', furigana: 'お{金|かね}が あっ___、{旅行|りょこう}したいです。', answer: 'たら', romaji: 'Okane ga attara, ryokou shitai desu.', russian: 'Если бы были деньги, хотел бы путешествовать.', lesson: 25 },
  { sentence: '明日 晴れ___、ピクニックに 行きましょう。', furigana: '{明日|あした} {晴|は}れ___、ピクニックに {行|い}きましょう。', answer: 'たら', romaji: 'Ashita haretara, pikunikku ni ikimashō.', russian: 'Если завтра будет ясно, пойдём на пикник.', lesson: 25 },
  { sentence: '高く___、買えません。', furigana: '{高|たか}く___、{買|か}えません。', answer: 'ても', romaji: 'Takakute mo, kaemasen.', russian: 'Даже если дорого, не могу купить.', lesson: 25 },

  // More basic particles
  { sentence: '私___学生です。', furigana: '{私|わたし}___学生です。', answer: 'は', romaji: 'Watashi wa gakusei desu.', russian: 'Я студент.', lesson: 1 },
  { sentence: 'ミラーさん___先生では ありません。', furigana: 'ミラーさん___{先生|せんせい}では ありません。', answer: 'は', romaji: 'Mirā-san wa sensei de wa arimasen.', russian: 'Миллер не является учителем.', lesson: 1 },
  { sentence: 'これは 田中さん___本です。', furigana: 'これは {田中|たなか}さん___{本|ほん}です。', answer: 'の', romaji: 'Kore wa Tanaka-san no hon desu.', russian: 'Это книга Танаки.', lesson: 1 },
  { sentence: 'これ___何ですか。', furigana: 'これ___{何|なん}ですか。', answer: 'は', romaji: 'Kore wa nan desu ka.', russian: 'Что это?', lesson: 2 },
  { sentence: 'あれは だれ___かばんですか。', furigana: 'あれは だれ___かばんですか。', answer: 'の', romaji: 'Are wa dare no kaban desu ka.', russian: 'Чья это сумка?', lesson: 2 },
  { sentence: 'これはミラーさん___本ですか。', furigana: 'これはミラーさん___{本|ほん}ですか。', answer: 'の', romaji: 'Kore wa Mirā-san no hon desu ka.', russian: 'Это книга Миллера?', lesson: 2 },
  { sentence: 'この ペン___いくらですか。', furigana: 'この ペン___いくらですか。', answer: 'は', romaji: 'Kono pen wa ikura desu ka.', russian: 'Сколько стоит эта ручка?', lesson: 3 },
  { sentence: '銀行は あそこ___あります。', furigana: '{銀行|ぎんこう}は あそこ___あります。', answer: 'に', romaji: 'Ginkō wa asoko ni arimasu.', russian: 'Банк находится вон там.', lesson: 3 },
  { sentence: 'トイレは 2階___あります。', furigana: 'トイレは 2{階|かい}___あります。', answer: 'に', romaji: 'Toire wa nikai ni arimasu.', russian: 'Туалет находится на 2-м этаже.', lesson: 3 },
  { sentence: '毎日 6時___起きます。', furigana: '{毎日|まいにち} 6{時|じ}___{起|お}きます。', answer: 'に', romaji: 'Mainichi rokuji ni okimasu.', russian: 'Каждый день встаю в 6 часов.', lesson: 4 },
  { sentence: '図書館___本を 読みます。', furigana: '{図書館|としょかん}___{本|ほん}を {読|よ}みます。', answer: 'で', romaji: 'Toshokan de hon o yomimasu.', russian: 'Читаю книги в библиотеке.', lesson: 6 },
  { sentence: '日曜日___何を しますか。', furigana: '{日曜日|にちようび}___{何|なに}を しますか。', answer: 'に', romaji: 'Nichiyōbi ni nani o shimasu ka.', russian: 'Что делаете в воскресенье?', lesson: 4 },
  { sentence: '山田さん___本を 貸しました。', furigana: '{山田|やまだ}さん___{本|ほん}を {貸|か}しました。', answer: 'に', romaji: 'Yamada-san ni hon o kashimashita.', russian: 'Одолжил книгу Ямаде.', lesson: 7 },
  { sentence: 'お母さん___チョコレートを もらいました。', furigana: 'お{母|かあ}さん___チョコレートを もらいました。', answer: 'に', romaji: 'Okaasan ni chokoreeto o moraimashita.', russian: 'Получил шоколад от мамы.', lesson: 7 },
  { sentence: 'この 映画は あの 映画___おもしろいです。', furigana: 'この {映画|えいが}は あの {映画|えいが}___おもしろいです。', answer: 'より', romaji: 'Kono eiga wa ano eiga yori omoshiroi desu.', russian: 'Этот фильм интереснее того.', lesson: 12 },
  { sentence: 'クラスで 山田さん___いちばん 上手です。', furigana: 'クラスで {山田|やまだ}さん___いちばん {上手|じょうず}です。', answer: 'が', romaji: 'Kurasu de Yamada-san ga ichiban jouzu desu.', russian: 'В классе Ямада лучший.', lesson: 12 },

  // Lesson 1: は topic
  { sentence: 'あれ___だれですか。', furigana: 'あれ___だれですか。', answer: 'は', romaji: 'Are wa dare desu ka.', russian: 'Кто это?', lesson: 1 },
  { sentence: 'それ___わたしの じしょです。', furigana: 'それ___わたしの じしょです。', answer: 'は', romaji: 'Sore wa watashi no jisho desu.', russian: 'Это мой словарь.', lesson: 1 },

  // Lesson 2: の possession
  { sentence: 'これ___だれのじしょですか。', furigana: 'これ___だれのじしょですか。', answer: 'は', romaji: 'Kore wa dare no jisho desu ka.', russian: 'Чей это словарь?', lesson: 2 },
  { sentence: '山田さん___かばんは どれですか。', furigana: '{山田|やまだ}さん___かばんは どれですか。', answer: 'の', romaji: 'Yamada-san no kaban wa dore desu ka.', russian: 'Какая сумка Ямады?', lesson: 2 },

  // Lesson 3: location に / は topic
  { sentence: '駅は あそこ___あります。', furigana: '{駅|えき}は あそこ___あります。', answer: 'に', romaji: 'Eki wa asoko ni arimasu.', russian: 'Станция находится вон там.', lesson: 3 },
  { sentence: 'トイレは どこ___ありますか。', furigana: 'トイレは どこ___ありますか。', answer: 'に', romaji: 'Toire wa doko ni arimasu ka.', russian: 'Где находится туалет?', lesson: 3 },

  // Lesson 4: に for time
  { sentence: '土曜日___友達と 会います。', furigana: '{土曜日|どようび}___{友達|ともだち}と {会|あ}います。', answer: 'に', romaji: 'Doyōbi ni tomodachi to aimasu.', russian: 'В субботу встречусь с другом.', lesson: 4 },
  { sentence: '3時___映画が 始まります。', furigana: '3{時|じ}___{映画|えいが}が {始|はじ}まります。', answer: 'に', romaji: 'Sanji ni eiga ga hajimarimasu.', russian: 'Фильм начинается в 3 часа.', lesson: 4 },

  // Lesson 5: へ / と / で transport
  { sentence: '電車___大阪へ 行きました。', furigana: '{電車|でんしゃ}___{大阪|おおさか}へ {行|い}きました。', answer: 'で', romaji: 'Densha de Ōsaka e ikimashita.', russian: 'Поехал в Осаку на поезде.', lesson: 5 },
  { sentence: '家族___旅行しました。', furigana: '{家族|かぞく}___{旅行|りょこう}しました。', answer: 'と', romaji: 'Kazoku to ryokō shimashita.', russian: 'Путешествовал с семьёй.', lesson: 5 },

  // Lesson 6: で place of action / を object
  { sentence: '公園___走ります。', furigana: '{公園|こうえん}___{走|はし}ります。', answer: 'で', romaji: 'Kōen de hashirimasu.', russian: 'Бегаю в парке.', lesson: 6 },
  { sentence: '何___食べますか。', furigana: '{何|なに}___{食|た}べますか。', answer: 'を', romaji: 'Nani o tabemasu ka.', russian: 'Что будете есть?', lesson: 6 },

  // Lesson 8: adjectives は/が
  { sentence: 'この 料理___おいしくないです。', furigana: 'この {料理|りょうり}___おいしくないです。', answer: 'は', romaji: 'Kono ryōri wa oishikunai desu.', russian: 'Это блюдо невкусное.', lesson: 8 },

  // Lesson 16 — extra: な-adjective で-connection
  { sentence: '田中さんは 親切___やさしい 人です。', furigana: '{田中|たなか}さんは {親切|しんせつ}___やさしい {人|ひと}です。', answer: 'で', romaji: 'Tanaka-san wa shinsetsu de yasashii hito desu.', russian: 'Танака — добрый и мягкий человек.', lesson: 16 },

  // Lesson 9: が for likes and abilities
  { sentence: 'この 映画___好きですか。', furigana: 'この {映画|えいが}___{好|す}きですか。', answer: 'が', romaji: 'Kono eiga ga suki desu ka.', russian: 'Вам нравится этот фильм?', lesson: 9 },
  { sentence: '田中さんは ギター___できます。', furigana: '{田中|たなか}さんは ギター___できます。', answer: 'が', romaji: 'Tanaka-san wa gitā ga dekimasu.', russian: 'Танака умеет играть на гитаре.', lesson: 9 },
]

// filter out broken entries
const validExercises = exercises.filter(e => e.answer && e.answer !== '×')

// Grammar hints by lesson
const lessonGrammarHint = {
  1: 'は — topic marker',
  2: 'は / の — topic, possession',
  3: 'に / は — location, topic',
  4: 'に — time, location',
  5: 'へ / と / で — direction, with, means',
  6: 'で / を — place of action, object',
  7: 'に — giving/receiving (あげる・もらう)',
  8: 'は / が / な — topic, subject, na-adj',
  9: 'が — likes & abilities (好き・上手・できる)',
  10: 'に — existence (あります・います)',
  11: 'を — counters (ください)',
  12: 'より — comparison; past adjective',
  13: '〜たいです / ほしいです — desires',
  14: '〜てください — requests (て-form)',
  15: '〜てもいいです / てはいけません — permission',
  16: '〜ながら / てから — simultaneous actions; after doing',
  17: '〜なければなりません / なくてもいいです — obligation',
  18: '〜ことができます — potential (dictionary form)',
  19: '〜たことがあります / 〜たり〜たりします — experience',
  20: 'と思います / と言っていました — quoting (plain form)',
  21: 'んです / と思います / と言っていました',
  22: 'noun modification — い/な adj + noun, relative clause',
  23: '〜と (conditional) / 〜とき (when)',
  24: 'てあげます / てもらいます / てくれます — giving/receiving actions',
  25: '〜たら (conditional) / 〜ても (concessive)',
}

// All unique answers for generating distractors
const allAnswerPool = [...new Set(validExercises.map(e => e.answer))]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateOptions(correct) {
  const pool = allAnswerPool.filter(a => a !== correct)
  const wrong = shuffle(pool).slice(0, 3)
  return shuffle([correct, ...wrong])
}

const scoreReactions = [
  { min: 90, emoji: '🎉✨', text: 'sugoi!! грамматика тебе по плечу!', textJp: 'すごい！' },
  { min: 70, emoji: '🌸😊', text: 'yoku dekimashita!', textJp: 'よくできました！' },
  { min: 50, emoji: '🐱💪', text: 'ещё немного практики~', textJp: 'まだまだ！' },
  { min: 0, emoji: '🌙📚', text: 'ganbatte! давай повторим~', textJp: 'がんばって！' },
]

// Grammar construction hints by answer
const GRAMMAR_HINTS = {
  'に': '〜に — место/время/получатель',
  'へ': '〜へ — направление движения',
  'で': '〜で — место действия / средство',
  'を': '〜を — прямое дополнение',
  'と': '〜と — «вместе с» / «думаю, что»',
  'は': '〜は — тема предложения',
  'が': '〜が — подлежащее / нравится/умею',
  'から': '〜から — «от / с» / て-форма + から — «после того как»',
  'まで': '〜まで — «до» (предел)',
  'より': '〜より — «чем» (сравнение)',
  'も': '〜も — «тоже / даже»',
  'だけ': '〜だけ — «только»',
  'ながら': '〜ながら — одновременные действия',
  'ても': '〜てもいいです — разрешение',
  'ては': '〜てはいけません — запрет',
  'なければ': '〜なければなりません — долженствование',
  'こと': '〜ことができます — умение/возможность',
  'たり': '〜たり〜たりします — перечисление действий',
  'です': '〜です — вежливое окончание',
  'な': '〜な形容詞 — な-прилагательное',
  'ので': '〜ので — причина («потому что»)',
  'のに': '〜のに — «несмотря на то что»',
  'ば': '〜ば — условие («если»)',
  'たら': '〜たら — условие/после («если/когда»)',
  'て': '〜て — те-форма глагола',
  'ん': '〜んです — объяснение/причина',
  'の': '〜の — принадлежность / номинализатор',
  'とき': '〜とき — «когда» (момент/период)',
  'た': '〜た形 — прошедшая форма (в придаточном)',
  'いる': '〜ている / いる-придаточное',
  'いった': '〜いった — относительное придаточное (прошедшее)',
  'くれ': '〜てくれる — делает что-то для меня/нас',
  'もらい': '〜てもらう — прошу/получаю услугу от кого-то',
  'あげ': '〜てあげる — делаю что-то для другого',
}

const PHASE_SETUP = 'setup'
const PHASE_QUIZ = 'quiz'
const PHASE_RESULTS = 'results'

// Renders a string with {kanji|reading} annotations as ruby HTML
function FuriganaText({ text }) {
  const parts = text.split(/(\{[^}]+\})/)
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\{([^|]+)\|([^}]+)\}$/)
        if (m) return <ruby key={i}>{m[1]}<rt style={{ fontSize: '0.55em', letterSpacing: '0.02em' }}>{m[2]}</rt></ruby>
        return <span key={i}>{p}</span>
      })}
    </>
  )
}

export default function GrammarPractice() {
  const { awardXP, calculateQuizXP } = useXP()
  const { saveQuizResult } = useProgress()
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const { unlockedMax } = useUnlockedLessons()
  const [searchParams] = useSearchParams()
  const [phase, setPhase] = useState(PHASE_SETUP)
  const [questionCount, setQuestionCount] = useState(getStoredQuizSize)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answeredWith, setAnsweredWith] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [inputMode, setInputMode] = useState(false)
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState([])
  const [hintLevel, setHintLevel] = useState(0) // 0=no hint, 1=first char, 2=first 2 chars
  const [completionSeconds, setCompletionSeconds] = useState(null)
  const [nextReady, setNextReady] = useState(false)
  const [inputOnlyMode, setInputOnlyMode] = useState(false)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [showFurigana, setShowFurigana] = useState(() => getStoredFlag('nihongo-show-furigana', '1', false))
  const startTimeRef = useRef(null)
  const xpAwardedRef = useRef(false)
  const advanceLockedRef = useRef(false)

  useEffect(() => {
    advanceLockedRef.current = false
  }, [currentIndex])

  const lessonIds = useMemo(() =>
    [...new Set(validExercises
      .filter(e => e.lesson <= unlockedMax || e.lesson === parseInt(searchParams.get('lesson') || '', 10))
      .map(e => e.lesson))]
      .sort((a, b) => a - b),
    [searchParams, unlockedMax]
  )
  const [selectedLessons, setSelectedLessons] = useState(() => {
    const lessonParam = searchParams.get('lesson')
    if (lessonParam) {
      const id = parseInt(lessonParam, 10)
      if (validExercises.some(e => e.lesson === id)) return [id]
    }
    return lessonIds
  })

  const toggleLesson = (id) => {
    setSelectedLessons(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const startQuiz = () => {
    const pool = validExercises.filter(e => selectedLessons.includes(e.lesson))
    if (pool.length === 0) return
    const count = Math.min(questionCount, pool.length)
    const qs = shuffle(pool).slice(0, count).map(e => ({ ...e, options: generateOptions(e.answer) }))
    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setMistakes([])
    setAnsweredWith(null)
    setInputValue('')
    setInputMode(inputOnlyMode)
    setHintLevel(0)
    setCompletionSeconds(null)
    setStreak(0)
    setBestStreak(0)
    startTimeRef.current = Date.now()
    xpAwardedRef.current = false
    advanceLockedRef.current = false
    setPhase(PHASE_QUIZ)
  }

  const handleAnswer = (ans) => {
    if (answeredWith !== null) return
    const trimmed = ans.trim()
    if (!trimmed) return
    const correct = trimmed === questions[currentIndex].answer
    setAnsweredWith(trimmed)
    if (correct) {
      setScore(prev => prev + 1)
      setStreak(prev => {
        const next = prev + 1
        setBestStreak(b => Math.max(b, next))
        return next
      })
    } else {
      setStreak(0)
      setMistakes(prev => [...prev, { ...questions[currentIndex], userAnswer: trimmed }])
    }
  }

  const nextQuestion = () => {
    if (advanceLockedRef.current) return
    advanceLockedRef.current = true
    if (currentIndex + 1 >= questions.length) {
      if (startTimeRef.current) setCompletionSeconds(Math.round((Date.now() - startTimeRef.current) / 1000))
      setPhase(PHASE_RESULTS)
    } else {
      setCurrentIndex(prev => prev + 1)
      setAnsweredWith(null)
      setInputValue('')
      setInputMode(inputOnlyMode)
      setHintLevel(0)
    }
  }

  const retryMistakes = () => {
    if (mistakes.length === 0) return
    const qs = shuffle(mistakes).map(e => ({ ...e, options: generateOptions(e.answer) }))
    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setMistakes([])
    setAnsweredWith(null)
    setInputValue('')
    setInputMode(false)
    setCompletionSeconds(null)
    startTimeRef.current = Date.now()
    setPhase(PHASE_QUIZ)
  }

  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
  const reaction = scoreReactions.find(r => percentage >= r.min)
  const q = questions[currentIndex]

  useEffect(() => {
    if (phase === PHASE_RESULTS && questions.length > 0 && !xpAwardedRef.current) {
      xpAwardedRef.current = true
      saveQuizResult('grammar', { lessons: selectedLessons, score, total: questions.length })
      const xp = calculateQuizXP(score, questions.length)
      if (xp > 0) awardXP(xp, 'grammar fill-in', score === questions.length && questions.length > 0)
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Enter to advance after answering (only when nextReady)
  useEffect(() => {
    if (phase !== PHASE_QUIZ || answeredWith === null) return
    const handler = (e) => { if (e.key === 'Enter' && nextReady) nextQuestion() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, answeredWith, nextReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // Delay "next" button to prevent accidental taps after answering
  useEffect(() => {
    if (answeredWith !== null) {
      const t = setTimeout(() => setNextReady(true), 600)
      return () => clearTimeout(t)
    } else {
      setNextReady(false)
    }
  }, [answeredWith])


  // scroll to top when results phase begins
  useEffect(() => {
    if (phase === PHASE_RESULTS) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [phase])

  return (
    <div className="page">
      {phase === PHASE_SETUP && (
        <div className="animate-fadeInUp">
          <div style={s.header}>
            <h1 style={s.title}>
              <span>✏️</span> fill in <span style={s.titleJp}>かきこみ</span>
            </h1>
            <p style={s.subtitle}>fill in the correct particle or word</p>
          </div>

          <div className="glass" style={s.setupCard}>
            <div style={s.setupLabel}>lessons</div>
            <div style={s.chipsWrap}>
              <button
                onClick={() => setSelectedLessons(selectedLessons.length === lessonIds.length ? [] : lessonIds)}
                style={{ ...s.chip, ...(selectedLessons.length === lessonIds.length ? s.chipActive : {}) }}
              >
                all
              </button>
              {lessonIds.map(id => (
                <button
                  key={id}
                  onClick={() => toggleLesson(id)}
                  style={{ ...s.chip, ...(selectedLessons.includes(id) ? s.chipActive : {}) }}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          <div className="glass" style={s.setupCard}>
            <div style={s.setupLabel}>questions: {questionCount}</div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
              {[5, 10, 20].map(n => {
                const maxQ = validExercises.filter(e => selectedLessons.includes(e.lesson)).length
                return (
                  <button key={n} onClick={() => setQuestionCount(Math.min(n, maxQ))} style={{
                    padding: '4px 14px', borderRadius: 50, border: 'none', cursor: 'pointer',
                    fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit',
                    background: questionCount === n ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
                    color: questionCount === n ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s', minHeight: 44,
                  }}>{n}</button>
                )
              })}
            </div>
            <input
              type="range"
              className="kawaii-slider"
              min={5}
              max={Math.max(validExercises.filter(e => selectedLessons.includes(e.lesson)).length, 5)}
              value={questionCount}
              onChange={e => setQuestionCount(parseInt(e.target.value, 10))}
              aria-label="number of questions"
            />
          </div>

          <div className="glass" style={s.setupCard}>
            <div style={s.setupLabel}>режим</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setInputOnlyMode(false)}
                style={{ ...s.chip, ...(!inputOnlyMode ? s.chipActive : {}), flex: 1, padding: '8px 4px' }}
              >
                варианты 🔘
              </button>
              <button
                onClick={() => setInputOnlyMode(true)}
                style={{ ...s.chip, ...(inputOnlyMode ? s.chipActive : {}), flex: 1, padding: '8px 4px' }}
              >
                только ввод ✏️
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              className="btn btn-cute"
              onClick={startQuiz}
              disabled={validExercises.filter(e => selectedLessons.includes(e.lesson)).length === 0}
              style={{ opacity: validExercises.filter(e => selectedLessons.includes(e.lesson)).length === 0 ? 0.5 : 1 }}
            >
              start ✏️
            </button>
            <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
              <Link to="/quiz/grammar" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>grammar quiz 文</Link>
              <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
            </div>
          </div>
        </div>
      )}

      {phase === PHASE_QUIZ && q && (
        <div className="animate-fadeInUp" style={s.quizWrap}>
          <div style={s.progressBar}>
            <div style={{ ...s.progressFill, width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
          </div>
          <div style={{ ...s.questionNum, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Link to="/" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', opacity: 0.5, textDecoration: 'none', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', flexShrink: 0 }} aria-label="exit quiz">✕</Link>
            <span>{currentIndex + 1} / {questions.length} · score: {score} 🐱</span>
            {streak >= 2 && <span style={{ marginLeft: 8, color: '#f472b6', fontWeight: 900 }}>🔥 {streak}</span>}
          </div>

          <div className="glass" style={s.questionCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              {lessonGrammarHint[q.lesson] ? (
                <div style={s.grammarHintBadge}>
                  <span style={s.grammarHintL}>L{q.lesson}</span>
                  <span style={s.grammarHintText}>{lessonGrammarHint[q.lesson]}</span>
                </div>
              ) : <div />}
              {q.furigana && (
                <button
                  onClick={() => setShowFurigana(v => { const next = !v; setStoredString('nihongo-show-furigana', next ? '1' : '0'); return next })}
                  style={{
                    padding: '3px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    fontSize: '0.72rem', fontWeight: 700,
                    background: showFurigana ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(168,85,247,0.1)',
                    color: showFurigana ? '#fff' : 'var(--text-secondary)',
                    flexShrink: 0, minHeight: 44,
                  }}
                >
                  振り仮名
                </button>
              )}
            </div>
            <div style={s.sentenceLabel}>fill in ___</div>
            <div style={s.sentence}>
              {(showFurigana && q.furigana ? q.furigana : q.sentence).split('___').map((part, i, arr) => (
                <span key={i}>
                  {showFurigana && q.furigana ? <FuriganaText text={part} /> : part}
                  {i < arr.length - 1 && (
                    <span style={{
                      ...s.blank,
                      ...(answeredWith !== null ? {
                        color: answeredWith === q.answer ? 'var(--correct-text)' : 'var(--incorrect-text)',
                        background: answeredWith === q.answer ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        padding: '2px 8px', borderRadius: 8,
                      } : {}),
                    }}>
                      {answeredWith !== null ? q.answer : '___'}
                    </span>
                  )}
                </span>
              ))}
            </div>
            {/* Russian translation — shown only after answering */}
            {answeredWith !== null && <div style={s.russianHint}>{q.russian}</div>}
          </div>

          {/* Hint */}
          {answeredWith === null && hintLevel > 0 && (
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-light)', background: 'rgba(168,85,247,0.1)', padding: '3px 12px', borderRadius: 50 }}>
                💡 подсказка: «{q.answer.slice(0, hintLevel)}{'_'.repeat(Math.max(0, q.answer.length - hintLevel))}»
              </span>
            </div>
          )}

          {/* Options or input */}
          {answeredWith === null ? (
            inputMode ? (
              <div style={s.inputRow}>
                <input
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAnswer(inputValue) }}
                  onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                  placeholder="type answer..." aria-label="type answer"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  style={s.input}
                  autoFocus
                />
                <button className="btn btn-cute" onClick={() => handleAnswer(inputValue)} style={{ fontSize: '0.85rem' }}>
                  check
                </button>
              </div>
            ) : (
              <div key={`options-${currentIndex}`} style={{ ...s.optionsGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                {q.options.map((opt) => (
                  <button
                    key={`${currentIndex}-${opt}`}
                    className="glass-sm quiz-option"
                    onClick={() => handleAnswer(opt)}
                    style={s.optionBtn}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )
          ) : (
            <div style={s.resultInfo}>
              <div style={{
                ...s.resultBadge,
                background: answeredWith === q.answer ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: answeredWith === q.answer ? 'var(--correct-text)' : 'var(--incorrect-text)',
              }}>
                {answeredWith === q.answer ? 'correct! ✨' : 'wrong ✕'}
              </div>
              {answeredWith !== q.answer && (
                <div className="glass animate-fadeInUp" style={s.explanationCard}>
                  <div style={s.explanationLabel}>правильный ответ</div>
                  <div style={s.explanationAnswer}>{q.answer}</div>
                  {GRAMMAR_HINTS[q.answer] && (
                    <div style={s.explanationConstruction}>{GRAMMAR_HINTS[q.answer]}</div>
                  )}
                  <div style={s.explanationSentence}>
                    {q.sentence.replace('___', `【${q.answer}】`)}
                  </div>
                  <div style={s.explanationRomaji}>{q.romaji}</div>
                  <div style={s.explanationRussian}>{q.russian}</div>
                  {answeredWith && (
                    <div style={s.explanationYours}>твой ответ: <span style={{ color: 'var(--incorrect-text)', fontWeight: 800 }}>{answeredWith}</span></div>
                  )}
                  {q.lesson && (
                    <Link to={`/lessons/${q.lesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none', marginTop: 4, display: 'inline-block' }}>
                      lesson {q.lesson} →
                    </Link>
                  )}
                </div>
              )}
              {answeredWith === q.answer && (
                <div style={s.romaji}>{q.romaji}</div>
              )}
              {!isMobile && (
                <div style={{ textAlign: 'center', marginTop: 8, marginBottom: 2, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)' }}>
                  ⌨ enter ↵ · далее
                </div>
              )}
              <button
                className="btn btn-cute"
                onClick={nextReady ? nextQuestion : undefined}
                style={{ marginTop: 6, fontSize: '0.85rem', opacity: nextReady ? 1 : 0.4, cursor: nextReady ? 'pointer' : 'default', transition: 'opacity 0.3s' }}
              >
                {currentIndex + 1 >= questions.length ? 'see results' : 'next →'}
              </button>
            </div>
          )}

          {/* Toggle mode + hint */}
          {answeredWith === null && (
            <div style={{ ...s.toggleModeWrap, gap: 8 }}>
              <button style={s.toggleModeBtn} onClick={() => setInputMode(!inputMode)}>
                {inputMode ? '← show options' : 'type instead ✏️'}
              </button>
              {hintLevel < 2 && (
                <button style={{ ...s.toggleModeBtn, color: 'var(--text-light)' }} onClick={() => setHintLevel(h => h + 1)}>
                  💡 подсказка {hintLevel > 0 ? '(ещё)' : ''}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {phase === PHASE_RESULTS && (
        <div className="animate-fadeInUp" style={s.resultsWrap}>
          <div className="glass" style={{ ...s.resultsCard, ...(isTablet ? s.resultsCardTablet : {}) }}>
            {percentage >= 90 && <Confetti trigger={true} />}
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>{reaction.emoji}</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: 4 }}>{reaction.textJp}</h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 20 }}>{reaction.text}</p>

            <div style={s.scoreCircle} className={percentage >= 90 ? 'score-perfect' : 'score-circle'}>
              <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>{percentage}%</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{score}/{questions.length}</span>
            </div>

            {calculateQuizXP(score, questions.length) > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(168,85,247,0.1)', borderRadius: 50, padding: '4px 14px', marginBottom: 12 }} className="animate-pop">
                <span style={{ fontSize: '0.9rem' }}>⚡</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>+{calculateQuizXP(score, questions.length)} XP</span>
              </div>
            )}
            {completionSeconds !== null && (
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 8 }}>
                ⏱ {completionSeconds < 60 ? `${completionSeconds}с` : `${Math.floor(completionSeconds / 60)}м ${completionSeconds % 60}с`} · {questions.length > 0 ? Math.round(completionSeconds / questions.length) : 0}с/вопрос
              </div>
            )}
            {bestStreak >= 2 && (
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f472b6', marginBottom: 16 }}>
                🔥 лучший streak: {bestStreak}
              </div>
            )}

            {mistakes.length > 0 && (
              <div style={s.mistakesSection}>
                <div style={s.mistakesLabel}>mistakes ({mistakes.length})</div>
                {mistakes.map((m, i) => (
                  <div key={(m.sentence || '') + i} style={s.mistakeItem}>
                    <div>{m.sentence.replace('___', `[${m.answer}]`)}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--incorrect-text)' }}>your answer: {m.userAnswer}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{m.russian}</div>
                    {m.lesson && (
                      <Link to={`/lessons/${m.lesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none' }}>
                        lesson {m.lesson} →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
              <button className="btn btn-cute" onClick={() => setPhase(PHASE_SETUP)}>
                try again 🌸
              </button>
              {mistakes.length > 0 && (
                <button className="btn btn-primary" onClick={retryMistakes}>
                  повторить ошибки ({mistakes.length}) 🔁
                </button>
              )}
              <ShareResult
                quizName="grammar fill-in"
                score={score}
                total={questions.length}
                percentage={percentage}
                bestStreak={bestStreak}
                xpEarned={calculateQuizXP(score, questions.length)}
              />
              <Link to="/quiz/grammar" className="btn btn-secondary">grammar quiz 文</Link>
              <Link to="/" className="btn btn-secondary">home 🏠</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  header: { textAlign: 'center', marginBottom: 20, padding: '8px 0' },
  title: {
    fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)', textTransform: 'lowercase',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4,
  },
  titleJp: { fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 600, marginLeft: 4 },
  subtitle: { fontSize: '1rem', color: 'var(--text-light)', fontWeight: 500 },
  setupCard: { padding: 22, marginBottom: 16, textAlign: 'center' },
  setupLabel: {
    fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 12,
    textTransform: 'lowercase',
  },
  chipsWrap: {
    display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center',
  },
  chip: {
    padding: '4px 12px', borderRadius: 50, border: '1.5px solid rgba(192,132,252,0.3)',
    background: 'var(--tint-medium)', fontSize: '0.72rem', fontWeight: 700,
    color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
    minHeight: 44,
  },
  chipActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: 'white',
    border: '1.5px solid transparent',
  },
  quizWrap: { maxWidth: 'min(500px, 100%)', margin: '0 auto' },
  progressBar: {
    height: 4, borderRadius: 50, background: 'rgba(192,132,252,0.15)',
    overflow: 'hidden', marginBottom: 8,
  },
  progressFill: {
    height: '100%', borderRadius: 50, background: 'linear-gradient(90deg, #f472b6, #c084fc)',
    transition: 'width 0.3s ease',
  },
  questionNum: {
    textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 12,
  },
  questionCard: { padding: 'clamp(14px, 4vw, 24px)', textAlign: 'center' },
  grammarHintBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.2)',
    borderRadius: 50, padding: '4px 12px', marginBottom: 14,
    maxWidth: '100%', flexWrap: 'wrap', justifyContent: 'center',
  },
  grammarHintL: {
    fontSize: '0.78rem', fontWeight: 900, color: '#f472b6',
    background: 'rgba(244,114,182,0.15)', padding: '1px 7px', borderRadius: 50,
    flexShrink: 0,
  },
  grammarHintText: {
    fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)',
    fontStyle: 'italic',
  },
  sentenceLabel: {
    fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'lowercase',
    marginBottom: 12,
  },
  sentence: {
    fontSize: 'clamp(1.1rem, 4.5vw, 1.4rem)', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.6, marginBottom: 12,
  },
  blank: { color: 'var(--text-light)', fontWeight: 900 },
  russianHint: {
    fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', fontStyle: 'italic',
    marginTop: 4,
  },
  optionsGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12, marginBottom: 8,
  },
  optionBtn: {
    padding: '18px 14px', fontSize: '1.1rem', fontWeight: 800,
    color: 'var(--text-main)', textAlign: 'center', cursor: 'pointer',
    transition: 'all 0.2s ease', border: 'none', background: 'var(--tint)', minHeight: 64,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  inputRow: {
    display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', marginTop: 12,
  },
  input: {
    padding: '10px 16px', borderRadius: 16, border: '2px solid rgba(192,132,252,0.3)',
    background: 'var(--tint-heavy)', fontSize: '1rem', fontWeight: 700,
    color: 'var(--text-main)', fontFamily: 'inherit', outline: 'none', width: 'min(140px, 80%)', textAlign: 'center',
  },
  toggleModeWrap: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  toggleModeBtn: {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
    color: 'var(--text-light)', fontFamily: 'inherit', padding: '4px 8px', minHeight: 44,
  },
  resultInfo: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 12 },
  resultBadge: {
    padding: '6px 16px', borderRadius: 50, fontSize: '1rem', fontWeight: 800,
  },
  romaji: { fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic' },
  russian: { fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-secondary)' },
  explanationCard: {
    padding: '14px 18px', borderRadius: 14, width: '100%', textAlign: 'left',
    borderLeft: '3px solid #f97316', display: 'flex', flexDirection: 'column', gap: 4,
  },
  explanationLabel: { fontSize: '0.78rem', fontWeight: 800, color: '#f97316' },
  explanationAnswer: { fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.2 },
  explanationConstruction: { fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 2 },
  explanationSentence: { fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: 4 },
  explanationRomaji: { fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic' },
  explanationRussian: { fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' },
  explanationYours: { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 2 },
  resultsWrap: {
    display: 'flex', justifyContent: 'center', padding: '20px 0', paddingBottom: 90,
  },
  resultsCard: {
    textAlign: 'center', padding: 'clamp(18px, 5vw, 32px) clamp(12px, 4vw, 24px)', maxWidth: 440, width: '100%',
    position: 'relative', overflow: 'hidden',
  },
  resultsCardTablet: {
    maxWidth: 560,
    padding: '42px 34px',
  },
  scoreCircle: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    marginBottom: 16,
  },
  mistakesSection: { marginTop: 16, textAlign: 'left' },
  mistakesLabel: {
    fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 8,
    textAlign: 'center',
  },
  mistakeItem: {
    padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.05)',
    border: '1px solid rgba(239,68,68,0.15)', marginBottom: 6,
    fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)',
  },
}
