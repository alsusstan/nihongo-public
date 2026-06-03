import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useXP } from '../hooks/useXP'
import { useProgress } from '../hooks/useProgress'
import { useIsMobile, useIsTablet } from '../hooks/useIsMobile'
import { useUnlockedLessons } from '../hooks/useUnlockedLessons'
import Confetti from '../components/Confetti'
import ShareResult from '../components/ShareResult'
import QuizCountdown from '../components/QuizCountdown'
import { getStoredQuizSize } from '../utils/localSettings'
import { getTrackedLessons } from '../utils/lessonProgress'
import { prefersReducedMotion as getPrefersReducedMotion } from '../utils/motion'

const prefersReducedMotion = getPrefersReducedMotion()

// Phase constants
const PHASE_SETUP = 'setup'
const PHASE_QUIZ = 'quiz'
const PHASE_RESULTS = 'results'

// Score reactions
const scoreReactions = [
  { min: 90, emoji: '🎉✨🐱', text: 'sugoi!! ты знаешь частицы отлично!', textJp: 'すごい！', encouragement: 'Частицы — невидимый клей японского языка. Теперь ты его чувствуешь.' },
  { min: 70, emoji: '🌸😊', text: 'yoku dekimashita! хорошо!', textJp: 'よくできました！', encouragement: 'Отличный результат! Частицы становятся всё естественнее.' },
  { min: 50, emoji: '🐱💪', text: 'mada mada~ ещё чуть-чуть!', textJp: 'まだまだ！', encouragement: 'Хорошее начало! Частицы требуют практики — и ты на верном пути.' },
  { min: 0, emoji: '🌙📚', text: 'ganbatte! давай повторим частицы~', textJp: 'がんばって！', encouragement: 'は, が, を, に — повтори их значения. Каждый раз будет легче.' },
]

const correctPhrases = [
  '✨ correct! sugoi~',
  '🌸 hai, sou desu! верно!',
  '⚡ kanpeki! идеально!',
  '🎉 yoku dekita! отлично!',
  '✔ exactly right!',
  '🌟 素晴らしい! subarashii!',
]

const wrongPhrases = [
  '✗ не совсем...',
  '✗ попробуй ещё раз~',
  '✗ ошибочка!',
  '✗ почти! смотри правильный ответ:',
]

let correctIdx = 0
let wrongIdx = 0
function nextCorrect() { const p = correctPhrases[correctIdx % correctPhrases.length]; correctIdx++; return p }
function nextWrong() { const p = wrongPhrases[wrongIdx % wrongPhrases.length]; wrongIdx++; return p }

// All particles used in this quiz
const allParticles = ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も', 'の', 'から', 'まで', 'より', 'ように', 'ながら', 'ても']

// Particle color map for display in setup
const particleColors = {
  'は': '#ec4899', 'が': '#8b5cf6', 'を': '#db2777',
  'に': '#8b5cf6', 'で': '#0891b2', 'へ': '#059669',
  'と': '#f59e0b', 'も': '#ea580c', 'の': '#9333ea',
  'から': '#8b5cf6', 'まで': '#0284c7', 'より': '#c026d3',
  'ように': '#0891b2', 'ながら': '#f59e0b', 'ても': '#f43f5e',
}

// 84 sentence questions covering particles from Minna no Nihongo lessons 1-25
const questionBank = [
  // は (wa) - topic marker
  { sentence: 'わたし＿＿マイク・ミラーです。', particle: 'は', romaji: 'Watashi wa Maiku Miraa desu.', russian: 'Я -- Майк Миллер.', hint: 'topic marker' , lesson: 1 },
  { sentence: 'あの人＿＿だれですか。', particle: 'は', romaji: 'Ano hito wa dare desu ka.', russian: 'Кто тот человек?', hint: 'topic marker' , lesson: 1 },
  { sentence: 'きょう＿＿いい天気ですね。', particle: 'は', romaji: 'Kyou wa ii tenki desu ne.', russian: 'Сегодня хорошая погода, правда?', hint: 'topic marker' , lesson: 1 },
  { sentence: '日本語＿＿おもしろいです。', particle: 'は', romaji: 'Nihongo wa omoshiroi desu.', russian: 'Японский язык интересный.', hint: 'topic marker' , lesson: 1 },

  // が (ga) - subject marker
  { sentence: 'だれ＿＿きましたか。', particle: 'が', romaji: 'Dare ga kimashita ka.', russian: 'Кто пришёл?', hint: 'subject after question word' , lesson: 1 },
  { sentence: 'わたしはさかな＿＿すきです。', particle: 'が', romaji: 'Watashi wa sakana ga suki desu.', russian: 'Я люблю рыбу.', hint: 'object of liking/ability' , lesson: 9 },
  { sentence: 'あたま＿＿いたいです。', particle: 'が', romaji: 'Atama ga itai desu.', russian: 'У меня болит голова.', hint: 'subject of adjective' , lesson: 12 },
  { sentence: 'にほんご＿＿わかりますか。', particle: 'が', romaji: 'Nihongo ga wakarimasu ka.', russian: 'Вы понимаете японский?', hint: 'object of understanding' , lesson: 9 },

  // を (o) - object marker
  { sentence: 'まいにちコーヒー＿＿のみます。', particle: 'を', romaji: 'Mainichi koohii o nomimasu.', russian: 'Каждый день пью кофе.', hint: 'direct object' , lesson: 6 },
  { sentence: 'てがみ＿＿かきます。', particle: 'を', romaji: 'Tegami o kakimasu.', russian: 'Пишу письмо.', hint: 'direct object' , lesson: 6 },
  { sentence: 'テレビ＿＿みます。', particle: 'を', romaji: 'Terebi o mimasu.', russian: 'Смотрю телевизор.', hint: 'direct object' , lesson: 6 },
  { sentence: 'にほんご＿＿べんきょうします。', particle: 'を', romaji: 'Nihongo o benkyou shimasu.', russian: 'Изучаю японский язык.', hint: 'direct object' , lesson: 6 },

  // に (ni) - direction/time/location
  { sentence: '7じ＿＿おきます。', particle: 'に', romaji: 'Shichi-ji ni okimasu.', russian: 'Встаю в 7 часов.', hint: 'specific time' , lesson: 4 },
  { sentence: 'がっこう＿＿いきます。', particle: 'に', romaji: 'Gakkou ni ikimasu.', russian: 'Иду в школу.', hint: 'direction/destination' , lesson: 3 },
  { sentence: 'つくえのうえ＿＿ほんがあります。', particle: 'に', romaji: 'Tsukue no ue ni hon ga arimasu.', russian: 'На столе есть книга.', hint: 'location of existence' , lesson: 10 },
  { sentence: 'こうえん＿＿こどもがいます。', particle: 'に', romaji: 'Kouen ni kodomo ga imasu.', russian: 'В парке есть дети.', hint: 'location of existence (animate)' , lesson: 10 },
  { sentence: 'えきのちかく＿＿スーパーがあります。', particle: 'に', romaji: 'Eki no chikaku ni suupaa ga arimasu.', russian: 'Рядом со станцией есть супермаркет.', hint: 'location of existence' , lesson: 10 },
  { sentence: 'ともだち＿＿でんわをかけます。', particle: 'に', romaji: 'Tomodachi ni denwa o kakemasu.', russian: 'Звоню другу.', hint: 'indirect object / recipient' , lesson: 7 },
  { sentence: 'にちようび＿＿こうえんへいきました。', particle: 'に', romaji: 'Nichiyoubi ni kouen e ikimashita.', russian: 'В воскресенье ходил в парк.', hint: 'specific time (day of week)' , lesson: 4 },

  // で (de) - place of action / means
  { sentence: 'としょかん＿＿べんきょうします。', particle: 'で', romaji: 'Toshokan de benkyou shimasu.', russian: 'Учусь в библиотеке.', hint: 'place of action' , lesson: 6 },
  { sentence: 'はし＿＿たべます。', particle: 'で', romaji: 'Hashi de tabemasu.', russian: 'Ем палочками.', hint: 'means/tool' , lesson: 6 },
  { sentence: 'バス＿＿かいしゃへいきます。', particle: 'で', romaji: 'Basu de kaisha e ikimasu.', russian: 'Еду на работу на автобусе.', hint: 'means of transport' , lesson: 5 },
  { sentence: 'にほんご＿＿レポートをかきます。', particle: 'で', romaji: 'Nihongo de repooto o kakimasu.', russian: 'Пишу доклад на японском языке.', hint: 'language as means' , lesson: 6 },

  // へ (e) - direction
  { sentence: 'にほん＿＿いきたいです。', particle: 'へ', romaji: 'Nihon e ikitai desu.', russian: 'Хочу поехать в Японию.', hint: 'direction of movement' , lesson: 3 },
  { sentence: 'きのうどこ＿＿いきましたか。', particle: 'へ', romaji: 'Kinou doko e ikimashita ka.', russian: 'Куда вы ходили вчера?', hint: 'direction of movement' , lesson: 3 },
  { sentence: 'うち＿＿かえります。', particle: 'へ', romaji: 'Uchi e kaerimasu.', russian: 'Возвращаюсь домой.', hint: 'direction of movement' , lesson: 3 },

  // と (to) - with / and
  { sentence: 'ともだち＿＿えいがをみました。', particle: 'と', romaji: 'Tomodachi to eiga o mimashita.', russian: 'Смотрел фильм с другом.', hint: 'together with someone' , lesson: 4 },
  { sentence: 'パン＿＿たまごをたべます。', particle: 'と', romaji: 'Pan to tamago o tabemasu.', russian: 'Ем хлеб и яйцо.', hint: 'listing (and)' , lesson: 5 },
  { sentence: 'かぞく＿＿にほんへきました。', particle: 'と', romaji: 'Kazoku to Nihon e kimashita.', russian: 'Приехал в Японию с семьёй.', hint: 'together with someone' , lesson: 4 },

  // も (mo) - also/too
  { sentence: 'わたし＿＿にほんじんです。', particle: 'も', romaji: 'Watashi mo nihonjin desu.', russian: 'Я тоже японец.', hint: 'also/too' , lesson: 1 },
  { sentence: 'やまださん＿＿きました。', particle: 'も', romaji: 'Yamada-san mo kimashita.', russian: 'Ямада тоже пришёл.', hint: 'also/too' , lesson: 1 },
  { sentence: 'ここ＿＿しずかですね。', particle: 'も', romaji: 'Koko mo shizuka desu ne.', russian: 'Здесь тоже тихо, правда?', hint: 'also/too' , lesson: 1 },

  // の (no) - possession / connection
  { sentence: 'これはわたし＿＿かばんです。', particle: 'の', romaji: 'Kore wa watashi no kaban desu.', russian: 'Это моя сумка.', hint: 'possession' , lesson: 2 },
  { sentence: 'にほんご＿＿せんせいはだれですか。', particle: 'の', romaji: 'Nihongo no sensei wa dare desu ka.', russian: 'Кто преподаватель японского?', hint: 'noun connection' , lesson: 2 },
  { sentence: 'とうきょう＿＿ちずをください。', particle: 'の', romaji: 'Toukyou no chizu o kudasai.', russian: 'Дайте, пожалуйста, карту Токио.', hint: 'noun connection' , lesson: 4 },
  { sentence: 'あれはだれ＿＿くるまですか。', particle: 'の', romaji: 'Are wa dare no kuruma desu ka.', russian: 'Чья это машина?', hint: 'possession' , lesson: 2 },

  // から (kara) - from / because
  { sentence: '9じ＿＿じゅぎょうがはじまります。', particle: 'から', romaji: 'Ku-ji kara jugyou ga hajimarimasu.', russian: 'Уроки начинаются с 9 часов.', hint: 'starting point (time)' , lesson: 5 },
  { sentence: 'にほん＿＿きました。', particle: 'から', romaji: 'Nihon kara kimashita.', russian: 'Приехал из Японии.', hint: 'starting point (place)' , lesson: 5 },
  { sentence: 'おおさか＿＿とうきょうまでしんかんせんでいきます。', particle: 'から', romaji: 'Oosaka kara Toukyou made shinkansen de ikimasu.', russian: 'Из Осаки в Токио еду на синкансэне.', hint: 'starting point (place)' , lesson: 5 },

  // まで (made) - until / to
  { sentence: '5じ＿＿はたらきます。', particle: 'まで', romaji: 'Go-ji made hatarakimasu.', russian: 'Работаю до 5 часов.', hint: 'endpoint (time)' , lesson: 5 },
  { sentence: 'えき＿＿あるいていきます。', particle: 'まで', romaji: 'Eki made aruite ikimasu.', russian: 'Иду до станции пешком.', hint: 'endpoint (place)' , lesson: 5 },
  { sentence: 'げつようびからきんようび＿＿しごとです。', particle: 'まで', romaji: 'Getsuyoubi kara kinyoubi made shigoto desu.', russian: 'С понедельника до пятницы -- работа.', hint: 'endpoint (time range)' , lesson: 5 },

  // より (yori) - comparison
  { sentence: 'にほんごはちゅうごくご＿＿やさしいです。', particle: 'より', romaji: 'Nihongo wa chuugokugo yori yasashii desu.', russian: 'Японский проще, чем китайский.', hint: 'comparison (than)' , lesson: 12 },
  { sentence: 'なつはふゆ＿＿あついです。', particle: 'より', romaji: 'Natsu wa fuyu yori atsui desu.', russian: 'Лето жарче, чем зима.', hint: 'comparison (than)' , lesson: 12 },
  { sentence: 'でんしゃはバス＿＿はやいです。', particle: 'より', romaji: 'Densha wa basu yori hayai desu.', russian: 'Поезд быстрее, чем автобус.', hint: 'comparison (than)' , lesson: 12 },

  // Mixed / tricky
  { sentence: 'わたしはまいあさパン＿＿たべます。', particle: 'を', romaji: 'Watashi wa maiasa pan o tabemasu.', russian: 'Я каждое утро ем хлеб.', hint: 'direct object' , lesson: 6 },
  { sentence: 'きのうびょういん＿＿いきました。', particle: 'へ', romaji: 'Kinou byouin e ikimashita.', russian: 'Вчера ходил в больницу.', hint: 'direction of movement' , lesson: 3 },

  // の (nominalizer, L18) — turns verb phrase into noun
  { sentence: 'ゴルフをする＿＿がすきです。', particle: 'の', romaji: 'Gorufu o suru no ga suki desu.', russian: 'Я люблю играть в гольф.', hint: 'nominalizer (verb → noun)' , lesson: 18 },
  { sentence: 'にほんごをはなす＿＿はむずかしいです。', particle: 'の', romaji: 'Nihongo o hanasu no wa muzukashii desu.', russian: 'Говорить по-японски — сложно.', hint: 'nominalizer (verb → noun)' , lesson: 18 },

  // から (reason, L20)
  { sentence: 'あめがふっている＿＿、でかけません。', particle: 'から', romaji: 'Ame ga futte iru kara, dekakemasen.', russian: 'Потому что идёт дождь, не выхожу.', hint: 'reason/because' , lesson: 20 },
  { sentence: 'しけんがある＿＿、べんきょうします。', particle: 'から', romaji: 'Shiken ga aru kara, benkyou shimasu.', russian: 'Потому что есть экзамен, учусь.', hint: 'reason/because' , lesson: 20 },

  // に (passive agent, L21)
  { sentence: 'せんせい＿＿ほめられました。', particle: 'に', romaji: 'Sensei ni homeraremashita.', russian: 'Меня похвалил учитель.', hint: 'passive agent (by ~)' , lesson: 21 },
  { sentence: 'あめ＿＿ふられてぬれました。', particle: 'に', romaji: 'Ame ni furarete nuremashita.', russian: 'Попал под дождь и промок.', hint: 'passive agent (natural event)' , lesson: 21 },

  // ように (purpose/change, L21)
  { sentence: 'にほんごがはなせる＿＿、まいにちれんしゅうします。', particle: 'ように', romaji: 'Nihongo ga hanaseru you ni, mainichi renshuu shimasu.', russian: 'Чтобы говорить по-японски, практикуюсь каждый день.', hint: 'purpose: so that (~ように)' , lesson: 21 },
  { sentence: 'びょうきにならない＿＿、やさいをたべます。', particle: 'ように', romaji: 'Byouki ni naranai you ni, yasai o tabemasu.', russian: 'Чтобы не заболеть, ем овощи.', hint: 'purpose: so that (~ように)' , lesson: 21 },
  { sentence: 'わすれない＿＿、メモします。', particle: 'ように', romaji: 'Wasurenai you ni, memo shimasu.', russian: 'Чтобы не забыть, делаю заметку.', hint: 'purpose: so that (~ように)' , lesson: 21 },

  // ながら (while doing, L16)
  { sentence: 'おんがくをきき＿＿べんきょうします。', particle: 'ながら', romaji: 'Ongaku o kiki nagara benkyou shimasu.', russian: 'Учусь, слушая музыку.', hint: 'while doing (~ながら)' , lesson: 16 },
  { sentence: 'テレビをみ＿＿ごはんをたべます。', particle: 'ながら', romaji: 'Terebi o mi nagara gohan o tabemasu.', russian: 'Ем, глядя телевизор.', hint: 'while doing (~ながら)' , lesson: 16 },
  { sentence: 'はなし＿＿あるかないでください。', particle: 'ながら', romaji: 'Hanashi nagara arukanaide kudasai.', russian: 'Не разговаривайте во время ходьбы.', hint: 'while doing (~ながら)' , lesson: 16 },

  // に (give/receive beneficiary, L24)
  { sentence: 'ともだち＿＿プレゼントをあげました。', particle: 'に', romaji: 'Tomodachi ni purezento o agemashita.', russian: 'Подарил другу подарок.', hint: 'recipient (give to)' , lesson: 7 },
  { sentence: 'せんせい＿＿にほんごをおしえてもらいました。', particle: 'に', romaji: 'Sensei ni nihongo o oshiete moraimashita.', russian: 'Учитель научил меня японскому.', hint: 'giver (receive from)' , lesson: 24 },
  { sentence: 'やまださん＿＿かさをかしてあげました。', particle: 'に', romaji: 'Yamada-san ni kasa o kashite agemashita.', russian: 'Я одолжил Ямаде зонт.', hint: 'recipient of a favor' , lesson: 24 },

  // と (conditional, L23)
  { sentence: 'このボタンをおす＿＿、ドアがあきます。', particle: 'と', romaji: 'Kono botan o osu to, doa ga akimasu.', russian: 'Если нажать эту кнопку, дверь откроется.', hint: 'conditional: when/if (natural result)' , lesson: 23 },
  { sentence: 'みぎにまがる＿＿、えきがあります。', particle: 'と', romaji: 'Migi ni magaru to, eki ga arimasu.', russian: 'Если повернуть направо, будет станция.', hint: 'conditional: when/if (directions)' , lesson: 23 },
  { sentence: 'はるになる＿＿、さくらがさきます。', particle: 'と', romaji: 'Haru ni naru to, sakura ga sakimasu.', russian: 'Когда наступает весна, цветёт сакура.', hint: 'conditional: when/if (seasonal change)' , lesson: 23 },

  // ても (even if, L25)
  { sentence: 'あめがふっ＿＿、いきます。', particle: 'ても', romaji: 'Ame ga futte mo, ikimasu.', russian: 'Пойду, даже если будет дождь.', hint: 'even if (~ても)' , lesson: 25 },
  { sentence: 'たかく＿＿、かいたいです。', particle: 'ても', romaji: 'Takakute mo, kaitai desu.', russian: 'Даже если дорого, хочу купить.', hint: 'even if (i-adj ~くても)' , lesson: 25 },
  { sentence: 'いそがしく＿＿、きてください。', particle: 'ても', romaji: 'Isogashikute mo, kite kudasai.', russian: 'Даже если заняты, приходите.', hint: 'even if (adj ~くても)' , lesson: 25 },

  // を (movement through/along, L13)
  { sentence: 'こうえん＿＿さんぽします。', particle: 'を', romaji: 'Kouen o sanpo shimasu.', russian: 'Гуляю по парку.', hint: 'movement through space' , lesson: 13 },
  { sentence: 'かど＿＿まがってください。', particle: 'を', romaji: 'Kado o magatte kudasai.', russian: 'Поверните на углу.', hint: 'movement through/at point' , lesson: 13 },

  // Additional questions for underrepresented lessons
  // は with adjectives (L8)
  { sentence: 'このへや＿＿きれいですね。', particle: 'は', romaji: 'Kono heya wa kirei desu ne.', russian: 'Эта комната красивая, правда?', hint: 'topic marker with adjective' , lesson: 8 },
  { sentence: 'やまださん＿＿しんせつです。', particle: 'は', romaji: 'Yamada-san wa shinsetsu desu.', russian: 'Ямада-сан добрый.', hint: 'topic marker' , lesson: 8 },

  // を with counters (L11)
  { sentence: 'りんご＿＿みっつ ください。', particle: 'を', romaji: 'Ringo o mittsu kudasai.', russian: 'Пожалуйста, три яблока.', hint: 'direct object with counter' , lesson: 11 },
  { sentence: 'きって＿＿いちまい かいました。', particle: 'を', romaji: 'Kitte o ichimai kaimashita.', russian: 'Купил одну марку.', hint: 'direct object with counter' , lesson: 11 },

  // を with te-form requests (L14)
  { sentence: 'まど＿＿しめてください。', particle: 'を', romaji: 'Mado o shimete kudasai.', russian: 'Пожалуйста, закройте окно.', hint: 'direct object in request' , lesson: 14 },
  { sentence: 'でんき＿＿つけてください。', particle: 'を', romaji: 'Denki o tsukete kudasai.', russian: 'Пожалуйста, включите свет.', hint: 'direct object in request' , lesson: 14 },

  // で place of activity (L15)
  { sentence: 'ここ＿＿しゃしんを とっても いいですか。', particle: 'で', romaji: 'Koko de shashin o totte mo ii desu ka.', russian: 'Можно здесь фотографировать?', hint: 'place of activity' , lesson: 15 },
  { sentence: 'このへや＿＿タバコをすってはいけません。', particle: 'で', romaji: 'Kono heya de tabako o sutte wa ikemasen.', russian: 'В этой комнате нельзя курить.', hint: 'place of activity' , lesson: 15 },

  // が with ability expressions (L18)
  { sentence: 'ピアノ＿＿ひけますか。', particle: 'が', romaji: 'Piano ga hikemasu ka.', russian: 'Умеете играть на пианино?', hint: 'object of ability (potential)' , lesson: 18 },
  { sentence: 'にほんご＿＿はなせます。', particle: 'が', romaji: 'Nihongo ga hanasemasu.', russian: 'Умею говорить по-японски.', hint: 'object of ability (potential)' , lesson: 18 },

  // に with experience (L19)
  { sentence: 'がいこく＿＿すんだことが ありますか。', particle: 'に', romaji: 'Gaikoku ni sunda koto ga arimasu ka.', russian: 'Вы жили за границей?', hint: 'place of residence (experience)' , lesson: 19 },
  { sentence: 'にほん＿＿いったことが あります。', particle: 'に', romaji: 'Nihon ni itta koto ga arimasu.', russian: 'Я бывал в Японии.', hint: 'destination (experience)' , lesson: 19 },

  // を inside relative clause (L22)
  { sentence: 'しんぶん＿＿よんでいるひとは やまださんです。', particle: 'を', romaji: 'Shinbun o yondeiru hito wa Yamada-san desu.', russian: 'Человек, читающий газету — Ямада-сан.', hint: 'object in relative clause' , lesson: 22 },
  { sentence: 'かみ＿＿みじかいひとはだれですか。', particle: 'が', romaji: 'Kami ga mijikai hito wa dare desu ka.', russian: 'Кто тот человек с короткими волосами?', hint: 'subject in relative clause (description)' , lesson: 22 },
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

function generateParticleOptions(correctParticle) {
  const wrong = shuffle(allParticles.filter(p => p !== correctParticle)).slice(0, 3)
  return shuffle([correctParticle, ...wrong])
}

export default function ParticleQuiz() {
  const isTablet = useIsTablet()
  const { awardXP, calculateQuizXP } = useXP()
  const { saveQuizResult } = useProgress()
  const { unlockedLessons } = useUnlockedLessons()
  const unlockedIds = unlockedLessons.map(l => l.id)
  const [phase, setPhase] = useState(PHASE_SETUP)
  const [showCountdown, setShowCountdown] = useState(false)

  // setup state
  const [questionCount, setQuestionCount] = useState(getStoredQuizSize)
  const [selectedParticles, setSelectedParticles] = useState(allParticles)
  const [isTimed, setIsTimed] = useState(false)
  const [timeLimit, setTimeLimit] = useState(10)
  const [customTimerVal, setCustomTimerVal] = useState('')

  const toggleParticle = (p) => {
    setSelectedParticles(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  // quiz state
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [feedbackPhrase, setFeedbackPhrase] = useState('')
  const [mistakes, setMistakes] = useState([])
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [questionKey, setQuestionKey] = useState(0)
  const [timeLeft, setTimeLeft] = useState(10)
  const timerRef = useRef(null)
  const countdownRef = useRef(null)
  const answerLockedRef = useRef(false)
  const advanceLockedRef = useRef(false)
  const xpAwardedRef = useRef(false)

  const startQuiz = () => {
    xpAwardedRef.current = false
    correctIdx = 0
    wrongIdx = 0
    const unlockedBank = questionBank.filter(q => unlockedIds.includes(q.lesson))
    const filteredBank = selectedParticles.length === allParticles.length
      ? unlockedBank
      : unlockedBank.filter(q => selectedParticles.includes(q.particle))
    const count = Math.min(questionCount, filteredBank.length)
    const selected = shuffle(filteredBank).slice(0, count)
    const qs = selected.map(q => ({
      ...q,
      options: generateParticleOptions(q.particle),
    }))

    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setMistakes([])
    setStreak(0)
    setBestStreak(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setFeedbackPhrase('')
    setQuestionKey(0)
    answerLockedRef.current = false
    setShowCountdown(true)
    setPhase(PHASE_QUIZ)
  }

  const startMistakesQuiz = (repeatCount) => {
    if (mistakes.length === 0) return
    let repeated = []
    for (let i = 0; i < repeatCount; i++) {
      repeated = repeated.concat(mistakes.map(m => m.question))
    }
    const qs = shuffle(repeated).map(q => ({
      ...q,
      options: generateParticleOptions(q.particle),
    }))
    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setMistakes([])
    setStreak(0)
    setBestStreak(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setFeedbackPhrase('')
    setQuestionKey(0)
    answerLockedRef.current = false
    setShowCountdown(true)
    setPhase(PHASE_QUIZ)
  }

  const handleAnswer = useCallback((option) => {
    if (selectedAnswer !== null || answerLockedRef.current) return
    answerLockedRef.current = true
    advanceLockedRef.current = false

    const correct = option === questions[currentIndex].particle
    setSelectedAnswer(option)
    setIsCorrect(correct)
    setFeedbackPhrase(correct ? nextCorrect() : nextWrong())

    if (correct) {
      setScore(prev => prev + 1)
      setStreak(prev => { const n = prev + 1; setBestStreak(b => Math.max(b, n)); return n })
    } else {
      setMistakes(prev => [...prev, { question: questions[currentIndex], yourAnswer: option }])
      setStreak(0)
    }

    const delay = correct ? 1200 : 4000

    timerRef.current = setTimeout(() => {
      if (advanceLockedRef.current) return
      advanceLockedRef.current = true

      if (currentIndex + 1 >= questions.length) {
        setPhase(PHASE_RESULTS)
      } else {
        setCurrentIndex(prev => prev + 1)
        setSelectedAnswer(null)
        setIsCorrect(null)
        setFeedbackPhrase('')
        setQuestionKey(prev => prev + 1)
        answerLockedRef.current = false
      }
    }, delay)
  }, [selectedAnswer, questions, currentIndex])

  const skipDelay = useCallback(() => {
    if (advanceLockedRef.current) return
    advanceLockedRef.current = true
    clearTimeout(timerRef.current)
    if (currentIndex + 1 >= questions.length) {
      setPhase(PHASE_RESULTS)
    } else {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
      setFeedbackPhrase('')
      setQuestionKey(prev => prev + 1)
      answerLockedRef.current = false
    }
  }, [currentIndex, questions.length])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      clearInterval(countdownRef.current)
    }
  }, [])

  useEffect(() => { if (isTimed && phase === PHASE_QUIZ && !showCountdown) setTimeLeft(timeLimit) }, [currentIndex, isTimed, timeLimit, phase, showCountdown])
  useEffect(() => {
    if (!isTimed || phase !== PHASE_QUIZ || showCountdown || selectedAnswer !== null) { clearInterval(countdownRef.current); return }
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) { clearInterval(countdownRef.current); handleAnswer('__TIMEOUT__'); return 0 }
        return Math.max(0, prev - 0.1)
      })
    }, 100)
    return () => clearInterval(countdownRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimed, phase, showCountdown, selectedAnswer, currentIndex])

  useEffect(() => {
    if (phase === PHASE_RESULTS && questions.length > 0 && !xpAwardedRef.current) {
      xpAwardedRef.current = true
      saveQuizResult('grammar', {
        lessons: getTrackedLessons(questions, q => q.lesson),
        score,
        total: questions.length,
      })
      const xp = calculateQuizXP(score, questions.length)
      if (xp > 0) awardXP(xp, 'particle quiz', score === questions.length && questions.length > 0)
    }
  }, [phase, score, questions, saveQuizResult, awardXP, calculateQuizXP])

  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
  const reaction = scoreReactions.find(r => percentage >= r.min) || scoreReactions[scoreReactions.length - 1]


  // scroll to top when results phase begins
  useEffect(() => {
    if (phase === PHASE_RESULTS) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [phase])

  return (
    <div className="page">
      {phase === PHASE_SETUP && (
        <SetupScreen
          questionCount={questionCount}
          setQuestionCount={setQuestionCount}
          selectedParticles={selectedParticles}
          onToggleParticle={toggleParticle}
          onStart={startQuiz}
          isTimed={isTimed} setIsTimed={setIsTimed}
          timeLimit={timeLimit} setTimeLimit={setTimeLimit}
          customTimerVal={customTimerVal} setCustomTimerVal={setCustomTimerVal}
        />
      )}

      {showCountdown && <QuizCountdown onComplete={() => setShowCountdown(false)} />}

      {phase === PHASE_QUIZ && questions.length > 0 && (
        <QuizScreen
          question={questions[currentIndex]}
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          selectedAnswer={selectedAnswer}
          isCorrect={isCorrect}
          feedbackPhrase={feedbackPhrase}
          score={score}
          streak={streak}
          onAnswer={handleAnswer}
          inputPaused={showCountdown}
          questionKey={questionKey}
          isTimed={isTimed}
          timeLeft={timeLeft}
          timeLimit={timeLimit}
          onSkip={skipDelay}
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
          onRetry={() => setPhase(PHASE_SETUP)}
          onRetryMistakes={startMistakesQuiz}
          calculateQuizXP={calculateQuizXP}
          isTablet={isTablet}
        />
      )}
    </div>
  )
}

function SetupScreen({ questionCount, setQuestionCount, selectedParticles, onToggleParticle, onStart, isTimed, setIsTimed, timeLimit, setTimeLimit, customTimerVal, setCustomTimerVal }) {
  const filteredCount = selectedParticles.length === allParticles.length
    ? questionBank.length
    : questionBank.filter(q => selectedParticles.includes(q.particle)).length

  return (
    <div className="animate-fadeInUp">
      <div style={styles.header}>
        <h1 style={styles.title}>
          <span>助</span> particle quiz <span style={styles.titleJp}>じょしテスト</span>
        </h1>
        <p style={styles.subtitle}>master the invisible glue of Japanese sentences 🐱</p>
      </div>

      {/* particle filter */}
      <div className="glass" style={styles.setupCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={styles.setupLabel}><span>📝</span> particles to practice</div>
          <button
            onClick={() => {
              if (selectedParticles.length === allParticles.length) {
                allParticles.forEach(p => onToggleParticle(p)) // deselect all
              } else {
                allParticles.forEach(p => !selectedParticles.includes(p) && onToggleParticle(p)) // select all
              }
            }}
            style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}
          >
            {selectedParticles.length === allParticles.length ? 'deselect all' : 'select all'}
          </button>
        </div>
        <div style={styles.particleGrid}>
          {allParticles.map(p => {
            const active = selectedParticles.includes(p)
            return (
              <button
                key={p}
                onClick={() => onToggleParticle(p)}
                style={{
                  ...styles.particleChip,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  borderColor: (particleColors[p] || '#c084fc') + '55',
                  background: active
                    ? (particleColors[p] || '#c084fc') + '22'
                    : 'rgba(192,132,252,0.04)',
                  color: active ? (particleColors[p] || 'var(--text-main)') : 'var(--text-light)',
                  opacity: active ? 1 : 0.45,
                  transform: active ? 'scale(1)' : 'scale(0.95)',
                  transition: 'all 0.15s',
                }}
              >
                {p}
              </button>
            )
          })}
        </div>
        <div style={styles.poolInfo}>
          {filteredCount} questions available 🌸
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10, justifyContent: 'center' }}>
          {[
            { p: 'ように', label: 'чтобы (L21)', color: '#0891b2' },
            { p: 'ながら', label: 'одновременно (L16)', color: 'var(--amber-text)' },
            { p: 'ても', label: 'даже если (L18)', color: 'var(--incorrect-text)' },
          ].map(({ p, label, color }) => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-light)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ color, fontWeight: 700 }}>{p}</span>
              <span>— {label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* question count */}
      <div className="glass" style={styles.setupCard}>
        <div style={styles.setupLabel}>
          <span>🔢</span> how many questions?
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          {[5, 10, 20].map(n => (
            <button key={n} onClick={() => setQuestionCount(Math.min(n, filteredCount))} style={{
              padding: '4px 14px', borderRadius: 50, border: 'none', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit',
              background: questionCount === n ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
              color: questionCount === n ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s', minHeight: 44,
            }}>{n}</button>
          ))}
        </div>
        <div style={styles.sliderWrap}>
          <div style={styles.sliderValueRow}>
            <input
              type="number"
              aria-label="number of questions"
              min={5}
              max={30}
              value={questionCount}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === '') { setQuestionCount(5); return }
                const v = parseInt(raw, 10)
                if (isNaN(v)) return
                setQuestionCount(Math.min(30, Math.max(1, v)))
              }}
              onBlur={() => {
                if (questionCount < 5) setQuestionCount(5)
              }}
              style={styles.numberInput}
            />
          </div>
          <input
            type="range"
            className="kawaii-slider"
            min={5}
            max={30}
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
            aria-label="number of questions"
          />
          <div style={styles.sliderLabels}>
            <span>5</span>
            <span>30</span>
          </div>
        </div>
      </div>

      {/* timer */}
      <div className="glass" style={styles.setupCard}>
        <div style={styles.setupLabel}>⏱ timer per question</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[{ label: 'выкл', val: 0 }, { label: '5с', val: 5 }, { label: '10с', val: 10 }, { label: '15с', val: 15 }, { label: '20с', val: 20 }].map(({ label, val }) => (
            <button key={label} onClick={() => { setIsTimed(val > 0); if (val > 0) setTimeLimit(val); setCustomTimerVal('') }}
              style={{ padding: '4px 14px', borderRadius: 50, border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, fontFamily: 'inherit', minHeight: 44,
                background: (!isTimed && val === 0) || (isTimed && timeLimit === val && !customTimerVal) ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
                color: (!isTimed && val === 0) || (isTimed && timeLimit === val && !customTimerVal) ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s' }}>
              {label}
            </button>
          ))}
          <input type="number" min={3} max={60} placeholder="своё" aria-label="custom time limit in seconds" value={customTimerVal}
            onChange={e => { setCustomTimerVal(e.target.value); const v = parseInt(e.target.value, 10); if (v >= 3) { setIsTimed(true); setTimeLimit(v) } }}
            style={{ width: 55, padding: '4px 8px', borderRadius: 50, border: 'none', cursor: 'text', fontSize: '0.82rem', fontWeight: 700, fontFamily: 'inherit', textAlign: 'center', minHeight: 44,
              background: customTimerVal ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)', color: customTimerVal ? '#fff' : 'var(--text-secondary)', outline: 'none' }} />
        </div>
      </div>

      {/* start button */}
      <div style={styles.startWrap}>
        {selectedParticles.length === 0 && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 700, marginBottom: 8 }}>
            select at least one particle
          </div>
        )}
        <button
          className="btn btn-cute"
          onClick={onStart}
          disabled={selectedParticles.length === 0 || filteredCount === 0}
          style={{ maxWidth: 260, opacity: selectedParticles.length === 0 ? 0.45 : 1, pointerEvents: selectedParticles.length === 0 ? 'none' : 'auto' }}
        >
          start quiz ✨
        </button>
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <Link to="/quiz/grammar" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>grammar quiz 文</Link>
          <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
        </div>
      </div>
    </div>
  )
}

function QuizScreen({ question, currentIndex, totalQuestions, selectedAnswer, isCorrect, feedbackPhrase, score, streak, onAnswer, inputPaused = false, questionKey, isTimed, timeLeft, timeLimit, onSkip }) {
  const isMobile = useIsMobile()
  const progress = ((currentIndex + 1) / totalQuestions) * 100

  // Keyboard shortcuts: 1-4 to select answer
  useEffect(() => {
    if (inputPaused || selectedAnswer !== null) return
    const handler = (e) => {
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= 4 && question.options[num - 1]) {
        onAnswer(question.options[num - 1])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [inputPaused, selectedAnswer, question.options, onAnswer])

  // Split sentence on the blank marker
  const sentenceParts = question.sentence.split('＿＿')

  return (
    <div className="animate-fadeInUp">
      {/* progress */}
      <div style={styles.progressWrap}>
        <div style={styles.progressInfo}>
          <Link to="/" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', opacity: 0.5, textDecoration: 'none', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', flexShrink: 0 }} aria-label="exit quiz">✕</Link>
          <span style={styles.progressText}>{currentIndex + 1} / {totalQuestions}</span>
          <span style={styles.scoreText} aria-live="polite" aria-atomic="true">
            score: {score} 🐱
            {streak >= 3 && (
              <span style={styles.streakBadge} className="animate-pop" key={streak}>
                {streak >= 7 ? '🔥🔥' : streak >= 5 ? '🔥' : '⚡'} {streak}x
              </span>
            )}
          </span>
        </div>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
        {isTimed && (
          <div style={{ height: 4, background: 'rgba(192,132,252,0.15)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / timeLimit) * 100}%`, background: timeLeft <= 3 ? '#ef4444' : '#c084fc', borderRadius: 2, transition: 'width 0.1s linear, background 0.3s ease' }} />
          </div>
        )}
      </div>

      {/* question card */}
      <div
        className="glass animate-pop"
        key={`question-${questionKey}`}
        style={{
          ...styles.questionCard,
          ...(!prefersReducedMotion && isCorrect === false ? { animation: 'shake 0.4s ease' } : {}),
        }}
      >
        <div style={styles.questionLabel}>choose the correct particle</div>
        <div style={styles.sentenceWrap}>
          {sentenceParts[0] && (
            <span style={styles.sentenceText}>{sentenceParts[0]}</span>
          )}
          <span style={{
            ...styles.blankSlot,
            ...(selectedAnswer !== null
              ? (isCorrect
                ? { background: 'rgba(16, 185, 129, 0.18)', borderColor: 'var(--correct-text)', color: 'var(--correct-text)', borderStyle: 'solid' }
                : { background: 'rgba(244, 63, 94, 0.12)', borderColor: 'var(--incorrect-text)', color: 'var(--incorrect-text)', borderStyle: 'solid' })
              : {}),
          }}>
            {selectedAnswer !== null ? question.particle : (
              <span style={styles.blankQuestion}>？</span>
            )}
          </span>
          {sentenceParts[1] && (
            <span style={styles.sentenceText}>{sentenceParts[1]}</span>
          )}
        </div>

        {question.hint && (
          <div style={styles.hintText}>hint: {question.hint}</div>
        )}
      </div>

      {/* keyboard hint */}
      {!selectedAnswer && (
        <div style={styles.keyHintChip}>
          ⌨ 1–4 to answer
        </div>
      )}

      {/* options */}
      <div key={`options-${currentIndex}`} style={{ ...styles.optionsGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
        {question.options.map((opt, i) => {
          let optStyle = { ...styles.option }

          if (selectedAnswer !== null) {
            if (opt === question.particle) {
              optStyle = { ...optStyle, ...styles.optionCorrect }
            } else if (selectedAnswer === opt && !isCorrect) {
              optStyle = { ...optStyle, ...styles.optionIncorrect }
            } else {
              optStyle = { ...optStyle, opacity: 0.5 }
            }
          }

          return (
            <button
              key={`${currentIndex}-${i}`}
              onClick={() => onAnswer(opt)}
              className="glass-sm quiz-option"
              style={optStyle}
              disabled={inputPaused || selectedAnswer !== null}
            >
              <span style={styles.optionNumBadge}>{i + 1}</span>
              {opt}
            </button>
          )
        })}
      </div>

      {/* translation hint - shown before answering */}
      {!selectedAnswer && (
        <div className="glass-sm" style={styles.translationHint}>
          <div style={styles.translationRussian}>{question.russian}</div>
        </div>
      )}

      {/* feedback with romaji and russian */}
      {selectedAnswer && (
        <div className="animate-pop" style={styles.feedbackWrap}>
          <div style={{
            ...styles.feedbackStatus,
            color: isCorrect ? 'var(--correct-text)' : 'var(--incorrect-text)',
          }}>
            {isCorrect ? feedbackPhrase : feedbackPhrase}
          </div>
          {!isCorrect && (
            <div style={styles.feedbackCorrectLine}>
              correct: <span style={styles.feedbackCorrectParticle}>{question.particle}</span>
            </div>
          )}
          <div style={styles.feedbackDetails}>
            <div style={styles.feedbackRomaji}>{question.romaji}</div>
            <div style={styles.feedbackRussian}>{question.russian}</div>
          </div>
        </div>
      )}
      {selectedAnswer && (
        <div onClick={onSkip} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSkip() } }} aria-label="continue to next question" style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 4, cursor: 'pointer' }}>
          нажми чтобы продолжить →
        </div>
      )}
    </div>
  )
}

function ResultsScreen({ score, total, percentage, reaction, mistakes, bestStreak, onRetry, onRetryMistakes, calculateQuizXP, isTablet }) {
  const [repeatCount, setRepeatCount] = useState(1)

  return (
    <div className="animate-fadeInUp" style={styles.resultsWrap}>
      <div className="glass" style={{ ...styles.resultsCard, ...(isTablet ? styles.resultsCardTablet : {}) }}>
        {percentage >= 90 && <Confetti trigger={true} />}
        <div style={styles.resultsEmoji}>{reaction.emoji}</div>
        <h2 style={styles.resultsTitle}>{reaction.textJp}</h2>
        <p style={styles.resultsText}>{reaction.text}</p>

        <div style={styles.scoreCircle} className={percentage >= 90 ? 'score-perfect' : 'score-circle'}>
          <div style={styles.scoreCircleInner}>
            <span style={styles.scoreBig}>{percentage}%</span>
            <span style={styles.scoreDetail}>{score}/{total}</span>
          </div>
        </div>

        {calculateQuizXP(score, total) > 0 && (
          <div style={styles.xpBadge} className="animate-pop">
            <span style={styles.xpIcon}>⚡</span>
            <span style={styles.xpAmount}>+{calculateQuizXP(score, total)} XP</span>
          </div>
        )}

        {bestStreak >= 3 && (
          <div style={styles.bestStreak} className="animate-pop">
            {bestStreak >= 7 ? '🔥🔥' : bestStreak >= 5 ? '🔥' : '⚡'} best streak: {bestStreak}x
          </div>
        )}

        {/* encouraging message */}
        <div style={styles.encouragement}>
          {reaction.encouragement}
        </div>

        {/* particle miss breakdown */}
        {mistakes.length > 0 && (() => {
          const counts = {}
          mistakes.forEach(m => {
            const p = m.question.particle
            counts[p] = (counts[p] || 0) + 1
          })
          const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
          if (sorted.length < 2) return null
          return (
            <div style={{ marginBottom: 14, width: '100%' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                missed particles
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {sorted.map(([particle, count]) => (
                  <div key={particle} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', borderRadius: 50,
                    background: count >= 3 ? 'rgba(244,63,94,0.12)' : 'rgba(192,132,252,0.1)',
                    border: `1.5px solid ${count >= 3 ? 'rgba(244,63,94,0.25)' : 'rgba(192,132,252,0.2)'}`,
                  }}>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: count >= 3 ? 'var(--incorrect-text)' : 'var(--text-main)' }}>{particle}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)' }}>×{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* mistakes list */}
        {mistakes.length > 0 && (
          <div style={styles.mistakesSection}>
            <div style={styles.mistakesLabel}>mistakes ({mistakes.length}) ✏️</div>
            <div style={styles.mistakesList}>
              {mistakes.map((m, i) => (
                <div key={(m.question.sentence || '') + i} style={styles.mistakeItem}>
                  <div style={styles.mistakeSentenceFull}>
                    {m.question.sentence.replace('＿＿', '')}
                    <span style={styles.mistakeCorrectParticle}>{m.question.particle}</span>
                  </div>
                  <div style={{ ...styles.mistakeRow, justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={styles.mistakeCorrect}>correct: {m.question.particle}</span>
                      <span style={styles.mistakeYours}>you: {m.yourAnswer === '__TIMEOUT__' ? '⏱ время вышло' : m.yourAnswer}</span>
                    </div>
                    {m.question.lesson && (
                      <Link to={`/lessons/${m.question.lesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none', flexShrink: 0 }}>
                        L{m.question.lesson} →
                      </Link>
                    )}
                  </div>
                  <div style={styles.mistakeRussian}>{m.question.russian}</div>
                </div>
              ))}
            </div>

            {/* retry mistakes */}
            <div style={styles.retryMistakesWrap}>
              <div style={styles.repeatRow}>
                <span style={styles.repeatLabel}>repeat:</span>
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    onClick={() => setRepeatCount(n)}
                    style={{
                      ...styles.repeatBtn,
                      ...(repeatCount === n ? styles.repeatBtnActive : {}),
                    }}
                  >
                    x{n}
                  </button>
                ))}
              </div>
              <button
                className="btn btn-primary"
                onClick={() => onRetryMistakes(repeatCount)}
                style={{ fontSize: '0.85rem' }}
              >
                work on mistakes ({mistakes.length * repeatCount} qs)
              </button>
            </div>
          </div>
        )}

        <div style={styles.resultsActions}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-cute" onClick={onRetry} style={{ flex: 1 }}>try again 🌸</button>
            <ShareResult quizName="particle quiz" score={score} total={total} percentage={percentage} bestStreak={bestStreak} xpEarned={calculateQuizXP(score, total)} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/quiz/grammar" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>grammar quiz 文</Link>
            <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
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
  setupCard: {
    padding: 20,
    marginBottom: 14,
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
  particleGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 8,
  },
  particleChip: {
    padding: '8px 16px',
    minHeight: 44,
    borderRadius: 50,
    background: 'linear-gradient(135deg, rgba(244,114,182,0.08), rgba(192,132,252,0.08))',
    border: '1.5px solid rgba(244,114,182,0.3)',
    fontSize: '1.15rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    transition: 'transform 0.15s',
  },
  poolInfo: {
    marginTop: 10,
    fontSize: '0.82rem',
    color: 'var(--text-light)',
    fontWeight: 700,
    textAlign: 'center',
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
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--text-light)',
  },
  startWrap: {
    textAlign: 'center',
    marginTop: 20,
  },
  progressWrap: {
    marginTop: 28,
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
  questionCard: {
    textAlign: 'center',
    padding: '28px 20px',
    marginBottom: 14,
  },
  questionLabel: {
    fontSize: '1rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    marginBottom: 18,
    textTransform: 'lowercase',
  },
  sentenceWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 14,
  },
  sentenceText: {
    fontSize: '1.55rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    lineHeight: 1.6,
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  blankSlot: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 52,
    padding: '4px 14px',
    borderRadius: 10,
    background: 'linear-gradient(135deg, rgba(244,114,182,0.12), rgba(192,132,252,0.12))',
    border: '2px dashed #f472b6',
    fontSize: '1.5rem',
    fontWeight: 900,
    color: '#f472b6',
    transition: 'all 0.3s ease',
    boxShadow: '0 0 0 0 rgba(244,114,182,0)',
  },
  blankQuestion: {
    color: '#f472b6',
    fontWeight: 900,
  },
  hintText: {
    fontSize: '0.8rem',
    color: 'var(--text-light)',
    fontWeight: 500,
    fontStyle: 'italic',
  },
  keyHintChip: {
    textAlign: 'center',
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    marginBottom: 10,
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 16,
  },
  option: {
    padding: '18px 14px',
    fontSize: '1.3rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    background: 'var(--tint)',
    minHeight: 64,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionNumBadge: {
    position: 'absolute',
    top: 5,
    left: 8,
    fontSize: '0.72rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    opacity: 0.7,
    background: 'rgba(192,132,252,0.12)',
    borderRadius: 4,
    padding: '1px 4px',
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
  translationHint: {
    textAlign: 'center',
    padding: '12px 16px',
    marginBottom: 8,
    borderRadius: 14,
  },
  translationRussian: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
  },
  feedbackWrap: {
    textAlign: 'center',
    padding: '8px 0',
  },
  feedbackStatus: {
    fontSize: '1rem',
    fontWeight: 800,
    marginBottom: 6,
  },
  feedbackCorrectLine: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    marginBottom: 8,
  },
  feedbackCorrectParticle: {
    fontSize: '1.1rem',
    fontWeight: 900,
    color: 'var(--correct-text)',
    marginLeft: 6,
    background: 'rgba(16,185,129,0.1)',
    padding: '2px 10px',
    borderRadius: 8,
  },
  feedbackDetails: {
    background: 'var(--tint)',
    borderRadius: 12,
    padding: '10px 16px',
    display: 'inline-block',
    maxWidth: '90%',
  },
  feedbackRomaji: {
    fontSize: '0.9rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  feedbackRussian: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
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
    position: 'relative',
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
    marginBottom: 16,
    textTransform: 'lowercase',
  },
  encouragement: {
    fontSize: '0.85rem',
    color: 'var(--text-light)',
    fontWeight: 500,
    fontStyle: 'italic',
    marginBottom: 20,
    lineHeight: 1.5,
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
  mistakesSection: {
    marginBottom: 20,
    textAlign: 'left',
  },
  mistakesLabel: {
    fontSize: '0.82rem',
    fontWeight: 800,
    color: 'var(--incorrect-text)',
    textTransform: 'lowercase',
    marginBottom: 10,
    textAlign: 'center',
  },
  mistakesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  mistakeItem: {
    background: 'rgba(244, 63, 94, 0.05)',
    border: '1px solid rgba(244, 63, 94, 0.12)',
    borderLeft: '3px solid var(--incorrect-text)',
    borderRadius: 10,
    padding: '10px 14px',
  },
  mistakeSentenceFull: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-main)',
    marginBottom: 4,
    fontFamily: "'Noto Sans JP', sans-serif",
    lineHeight: 1.5,
  },
  mistakeCorrectParticle: {
    color: 'var(--correct-text)',
    fontWeight: 900,
    marginLeft: 2,
    background: 'rgba(16,185,129,0.1)',
    padding: '0 4px',
    borderRadius: 4,
  },
  mistakeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  mistakeCorrect: {
    fontSize: '0.82rem',
    fontWeight: 700,
    color: 'var(--correct-text)',
  },
  mistakeYours: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--incorrect-text)',
    fontStyle: 'italic',
  },
  mistakeRussian: {
    fontSize: '0.78rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  retryMistakesWrap: {
    marginTop: 12,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  repeatRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  repeatLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
  },
  repeatBtn: {
    padding: '4px 12px',
    borderRadius: 50,
    background: 'var(--tint-medium)',
    border: '1.5px solid rgba(192,132,252,0.25)',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: 44,
  },
  repeatBtnActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    color: 'white',
    border: '1.5px solid transparent',
  },
  resultsActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  xpBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '6px 18px',
    borderRadius: 50,
    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))',
    border: '1.5px solid rgba(251, 191, 36, 0.4)',
    margin: '-10px auto 20px',
    width: 'fit-content',
  },
  xpIcon: {
    fontSize: '1rem',
  },
  xpAmount: {
    fontSize: '0.9rem',
    fontWeight: 800,
    color: 'var(--gold-text)',
  },
  streakBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 12px', borderRadius: 50,
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    color: 'white', fontSize: '0.75rem', fontWeight: 800,
    boxShadow: '0 2px 8px rgba(251, 191, 36, 0.4)',
    marginLeft: 8,
  },
  bestStreak: {
    fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-text)',
    margin: '-10px 0 16px', textAlign: 'center',
  },
}
