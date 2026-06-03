// =============================================================================
// Stroke Order Data — Lessons 1-22 (all 250 BKB1 kanji)
// Lessons 1-10: full stroke descriptions (108 kanji)
// Lessons 11-22: stroke counts only (142 kanji)
// Direction symbols: ─ │ ╲ ╱ 丶 丿 乛 ㇏ ⌐
// =============================================================================

export const strokeData = {

  // ─── Lesson 1: 日月木山川田人口車門 ───

  "日": {
    strokes: 4,
    order: [
      "│ left vertical (top→bottom)",
      "⌐ top-right corner (top horizontal + right vertical)",
      "─ inner horizontal",
      "─ bottom horizontal (close box)"
    ]
  },
  "月": {
    strokes: 4,
    order: [
      "丿 left sweeping stroke (はらい)",
      "⌐ top-right corner (vertical + hook)",
      "─ first inner horizontal",
      "─ second inner horizontal"
    ]
  },
  "木": {
    strokes: 4,
    order: [
      "─ horizontal (left→right)",
      "│ vertical (top→bottom)",
      "丿 left-falling diagonal (はらい)",
      "㇏ right-falling sweep (right はね)"
    ]
  },
  "山": {
    strokes: 3,
    order: [
      "│ center vertical (top→bottom)",
      "⌐ left vertical + bottom horizontal turning right",
      "│ right vertical (top→bottom)"
    ]
  },
  "川": {
    strokes: 3,
    order: [
      "丿 left stroke (top→bottom, slight curve)",
      "│ center vertical",
      "│ right vertical"
    ]
  },
  "田": {
    strokes: 5,
    order: [
      "│ left vertical (top→bottom)",
      "⌐ top horizontal + right vertical",
      "─ inner horizontal (left→right)",
      "│ inner vertical (top→bottom)",
      "─ bottom horizontal (close box)"
    ]
  },
  "人": {
    strokes: 2,
    order: [
      "丿 left-falling stroke (はらい)",
      "㇏ right-falling sweep (right はらい)"
    ]
  },
  "口": {
    strokes: 3,
    order: [
      "│ left vertical (top→bottom)",
      "⌐ top horizontal + right vertical",
      "─ bottom horizontal (close box)"
    ]
  },
  "車": {
    strokes: 7,
    order: [
      "─ top horizontal",
      "⌐ second horizontal + left side of box",
      "│ center vertical through all",
      "─ inner horizontal (inside box)",
      "─ closing horizontal of box",
      "─ lower horizontal",
      "─ bottom horizontal"
    ]
  },
  "門": {
    strokes: 8,
    order: [
      "│ left gate: left vertical",
      "丶 left gate: short top-right dot",
      "⌐ left gate: inner fold stroke",
      "│ left gate: inner vertical",
      "│ right gate: left vertical",
      "丶 right gate: short top-right dot",
      "⌐ right gate: inner fold stroke",
      "│ right gate: inner vertical"
    ]
  },

  // ─── Lesson 2: 火水金土子女学生先私 ───

  "火": {
    strokes: 4,
    order: [
      "丶 left dot (ひだり)",
      "丿 right short stroke",
      "丿 left-falling diagonal (はらい)",
      "㇏ right-falling sweep"
    ]
  },
  "水": {
    strokes: 4,
    order: [
      "乛 horizontal hook (top of vertical + hook left)",
      "㇏ right sweep from center",
      "丿 left-falling short stroke",
      "丶 right dot"
    ]
  },
  "金": {
    strokes: 8,
    order: [
      "丿 left-falling stroke from top (はらい)",
      "㇏ right-falling stroke",
      "─ horizontal below triangle",
      "│ center vertical",
      "丶 left inner dot",
      "丶 right inner dot",
      "─ lower horizontal",
      "─ bottom horizontal"
    ]
  },
  "土": {
    strokes: 3,
    order: [
      "─ top horizontal (short)",
      "│ vertical (top→bottom)",
      "─ bottom horizontal (long)"
    ]
  },
  "子": {
    strokes: 3,
    order: [
      "乛 horizontal turning stroke + hook",
      "│ vertical (top→bottom)",
      "─ bottom horizontal"
    ]
  },
  "女": {
    strokes: 3,
    order: [
      "╲ left-falling curve (くの字)",
      "丿 sweeping stroke crossing",
      "─ bottom horizontal (left→right, extends right)"
    ]
  },
  "学": {
    strokes: 8,
    order: [
      "丶 top-left dot",
      "丶 top-middle-left dot",
      "丿 top-middle-right falling stroke",
      "│ crown: vertical connecting",
      "⌐ crown: horizontal + bend",
      "乛 child radical: top horizontal hook",
      "│ child radical: vertical",
      "─ child radical: bottom horizontal"
    ]
  },
  "生": {
    strokes: 5,
    order: [
      "丿 left-falling short stroke (top)",
      "─ first horizontal",
      "─ second horizontal",
      "│ vertical (top→bottom, through all)",
      "─ bottom horizontal (longest)"
    ]
  },
  "先": {
    strokes: 6,
    order: [
      "丿 top-left falling stroke",
      "─ top horizontal",
      "│ left vertical of box section",
      "│ right vertical of box section",
      "乛 bottom part: horizontal with bend",
      "丿 final sweeping left leg"
    ]
  },
  "私": {
    strokes: 7,
    order: [
      "─ left: top horizontal of 禾",
      "│ left: vertical of 禾",
      "丿 left: left-falling stroke of 禾",
      "丶 left: right dot of 禾",
      "乛 right: first stroke of ム",
      "丶 right: inner dot of ム",
      "丿 right: closing stroke of ム"
    ]
  },

  // ─── Lesson 3: 一二三四五六七八九十百千万円年 ───

  "一": {
    strokes: 1,
    order: [
      "─ single horizontal (left→right)"
    ]
  },
  "二": {
    strokes: 2,
    order: [
      "─ top horizontal (short)",
      "─ bottom horizontal (long)"
    ]
  },
  "三": {
    strokes: 3,
    order: [
      "─ top horizontal (short)",
      "─ middle horizontal (medium)",
      "─ bottom horizontal (long)"
    ]
  },
  "四": {
    strokes: 5,
    order: [
      "│ left vertical",
      "─ top horizontal + right vertical (⌐)",
      "丿 inner left-falling stroke",
      "乛 inner angled stroke (turning)",
      "─ bottom horizontal (close box)"
    ]
  },
  "五": {
    strokes: 4,
    order: [
      "─ top horizontal",
      "⌐ vertical turning into horizontal",
      "╱ diagonal crossing stroke",
      "─ bottom horizontal"
    ]
  },
  "六": {
    strokes: 4,
    order: [
      "丶 top dot",
      "─ horizontal",
      "丿 left-falling stroke (はらい)",
      "丶 right dot"
    ]
  },
  "七": {
    strokes: 2,
    order: [
      "─ horizontal (cuts through, bends down at end)",
      "╱ rising stroke (left-bottom → right-top)"
    ]
  },
  "八": {
    strokes: 2,
    order: [
      "丿 left-falling stroke (はらい)",
      "㇏ right-falling sweep"
    ]
  },
  "九": {
    strokes: 2,
    order: [
      "丿 left-falling stroke (はらい)",
      "乛 horizontal turning into hook downward"
    ]
  },
  "十": {
    strokes: 2,
    order: [
      "─ horizontal (left→right)",
      "│ vertical (top→bottom)"
    ]
  },
  "百": {
    strokes: 6,
    order: [
      "─ top horizontal",
      "│ left vertical of box",
      "⌐ inner top horizontal + right vertical",
      "─ inner horizontal",
      "│ inner center vertical",
      "─ bottom horizontal (close box)"
    ]
  },
  "千": {
    strokes: 3,
    order: [
      "丿 left-falling short stroke (top)",
      "─ horizontal (left→right)",
      "│ vertical (top→bottom)"
    ]
  },
  "万": {
    strokes: 3,
    order: [
      "─ top horizontal",
      "丿 left-falling diagonal (はらい)",
      "乛 turning stroke (fold)"
    ]
  },
  "円": {
    strokes: 4,
    order: [
      "│ left vertical",
      "⌐ top horizontal + right vertical",
      "│ inner left vertical",
      "─ bottom horizontal (close box)"
    ]
  },
  "年": {
    strokes: 6,
    order: [
      "丿 top left-falling short stroke",
      "─ first horizontal",
      "─ second horizontal",
      "│ vertical (top→bottom, through all)",
      "─ third horizontal (inside structure)",
      "│ final vertical (bottom, slightly longer)"
    ]
  },

  // ─── Lesson 4: 上下中大小本半分力何 ───

  "上": {
    strokes: 3,
    order: [
      "│ vertical (top→bottom)",
      "─ short upper horizontal",
      "─ long bottom horizontal"
    ]
  },
  "下": {
    strokes: 3,
    order: [
      "─ top horizontal (long)",
      "│ vertical (top→bottom)",
      "丶 dot (lower left)"
    ]
  },
  "中": {
    strokes: 4,
    order: [
      "│ left vertical of box",
      "⌐ top horizontal + right vertical",
      "│ center vertical (extends top and bottom)",
      "─ bottom horizontal (close box)"
    ]
  },
  "大": {
    strokes: 3,
    order: [
      "─ horizontal (left→right)",
      "丿 left-falling stroke (はらい)",
      "㇏ right-falling sweep"
    ]
  },
  "小": {
    strokes: 3,
    order: [
      "乛 center vertical with hook (亅)",
      "丿 left dot/falling stroke",
      "丶 right dot"
    ]
  },
  "本": {
    strokes: 5,
    order: [
      "─ horizontal (left→right)",
      "│ vertical (top→bottom)",
      "丿 left-falling stroke (はらい)",
      "㇏ right-falling sweep",
      "─ short horizontal through lower vertical"
    ]
  },
  "半": {
    strokes: 5,
    order: [
      "丶 top-left dot",
      "丶 top-right dot",
      "─ first horizontal",
      "─ second horizontal (longer)",
      "│ vertical (top→bottom, through center)"
    ]
  },
  "分": {
    strokes: 4,
    order: [
      "丿 top left-falling stroke (はらい)",
      "㇏ top right-falling sweep",
      "丿 bottom-left: sweeping stroke of 刀",
      "乛 bottom-right: turning stroke of 刀"
    ]
  },
  "力": {
    strokes: 2,
    order: [
      "丿 left-falling stroke (はらい)",
      "乛 horizontal turning into downward hook"
    ]
  },
  "何": {
    strokes: 7,
    order: [
      "丿 left: single standing person stroke",
      "│ left: vertical of にんべん",
      "─ right: top horizontal of 可",
      "│ right: left vertical",
      "⌐ right: inner top + right vertical",
      "─ right: bottom horizontal of inner box",
      "乛 right: hook at bottom (亅)"
    ]
  },

  // ─── Lesson 5: 明休体好男林森間畑岩 ───

  "明": {
    strokes: 8,
    order: [
      "│ left 日: left vertical",
      "⌐ left 日: top horizontal + right vertical",
      "─ left 日: inner horizontal",
      "─ left 日: bottom horizontal",
      "丿 right 月: left sweeping stroke",
      "⌐ right 月: top-right corner + vertical",
      "─ right 月: first inner horizontal",
      "─ right 月: second inner horizontal"
    ]
  },
  "休": {
    strokes: 6,
    order: [
      "丿 にんべん: left-falling stroke",
      "│ にんべん: vertical",
      "─ right 木: horizontal",
      "│ right 木: vertical",
      "丿 right 木: left-falling stroke",
      "㇏ right 木: right-falling sweep"
    ]
  },
  "体": {
    strokes: 7,
    order: [
      "丿 にんべん: left-falling stroke",
      "│ にんべん: vertical",
      "─ right 本: horizontal",
      "│ right 本: vertical",
      "丿 right 本: left-falling stroke",
      "㇏ right 本: right-falling sweep",
      "─ right 本: short inner horizontal"
    ]
  },
  "好": {
    strokes: 6,
    order: [
      "╲ left 女: curved falling stroke",
      "丿 left 女: sweeping stroke",
      "─ left 女: bottom horizontal",
      "乛 right 子: horizontal hook",
      "│ right 子: vertical",
      "─ right 子: bottom horizontal"
    ]
  },
  "男": {
    strokes: 7,
    order: [
      "│ top 田: left vertical",
      "⌐ top 田: top horizontal + right vertical",
      "─ top 田: inner horizontal",
      "│ top 田: inner vertical",
      "─ top 田: bottom horizontal",
      "丿 bottom 力: left-falling stroke",
      "乛 bottom 力: turning hook stroke"
    ]
  },
  "林": {
    strokes: 8,
    order: [
      "─ left 木: horizontal",
      "│ left 木: vertical",
      "丿 left 木: left-falling stroke",
      "丶 left 木: right dot (compressed)",
      "─ right 木: horizontal",
      "│ right 木: vertical",
      "丿 right 木: left-falling stroke",
      "㇏ right 木: right-falling sweep"
    ]
  },
  "森": {
    strokes: 12,
    order: [
      "─ top 木: horizontal",
      "│ top 木: vertical",
      "丿 top 木: left-falling stroke",
      "㇏ top 木: right-falling sweep",
      "─ bottom-left 木: horizontal",
      "│ bottom-left 木: vertical",
      "丿 bottom-left 木: left-falling stroke",
      "丶 bottom-left 木: right dot",
      "─ bottom-right 木: horizontal",
      "│ bottom-right 木: vertical",
      "丿 bottom-right 木: left-falling stroke",
      "㇏ bottom-right 木: right-falling sweep"
    ]
  },
  "間": {
    strokes: 12,
    order: [
      "│ 門 left side: left vertical",
      "丶 門 left side: top-right dot",
      "⌐ 門 left side: inner fold",
      "│ 門 left side: inner vertical",
      "│ 門 right side: left vertical",
      "丶 門 right side: top-right dot",
      "⌐ 門 right side: inner fold",
      "│ 門 right side: inner vertical",
      "│ inner 日: left vertical",
      "⌐ inner 日: top horizontal + right vertical",
      "─ inner 日: inner horizontal",
      "─ inner 日: bottom horizontal"
    ]
  },
  "畑": {
    strokes: 9,
    order: [
      "│ left 田: left vertical",
      "⌐ left 田: top horizontal + right vertical",
      "─ left 田: inner horizontal",
      "│ left 田: inner vertical",
      "─ left 田: bottom horizontal",
      "─ right 火: (none — actually dot pattern)",
      "丿 right 火: left-falling stroke",
      "㇏ right 火: right-falling sweep",
      "丶 right 火: extra dot on top"
    ]
  },
  "岩": {
    strokes: 8,
    order: [
      "│ top 山: center vertical",
      "⌐ top 山: left vertical + bottom horizontal",
      "│ top 山: right vertical",
      "─ bottom 石: top horizontal",
      "丿 bottom 石: left-falling stroke",
      "│ bottom 石: left vertical of box",
      "⌐ bottom 石: horizontal + right vertical",
      "─ bottom 石: bottom horizontal"
    ]
  },

  // ─── Lesson 6: 目耳手足雨竹米貝石糸 ───

  "目": {
    strokes: 5,
    order: [
      "│ left vertical (top→bottom)",
      "⌐ top horizontal + right vertical",
      "─ first inner horizontal",
      "─ second inner horizontal",
      "─ bottom horizontal (close box)"
    ]
  },
  "耳": {
    strokes: 6,
    order: [
      "─ top horizontal",
      "│ left vertical",
      "─ second horizontal",
      "─ third horizontal",
      "│ right vertical (extends down)",
      "─ bottom horizontal"
    ]
  },
  "手": {
    strokes: 4,
    order: [
      "─ first horizontal (short)",
      "─ second horizontal (medium)",
      "─ third horizontal (long)",
      "│ vertical (top→bottom, with hook at top)"
    ]
  },
  "足": {
    strokes: 7,
    order: [
      "│ top 口: left vertical",
      "⌐ top 口: top horizontal + right vertical",
      "─ top 口: bottom horizontal",
      "│ bottom: vertical",
      "─ bottom: horizontal",
      "丿 bottom: left-falling stroke",
      "㇏ bottom: right-falling sweep (はらい)"
    ]
  },
  "雨": {
    strokes: 8,
    order: [
      "─ top horizontal",
      "│ center vertical (short, from top bar)",
      "⌐ left vertical fold + bottom area",
      "│ right vertical",
      "丶 inner top-left dot",
      "丶 inner top-right dot",
      "丶 inner bottom-left dot",
      "丶 inner bottom-right dot"
    ]
  },
  "竹": {
    strokes: 6,
    order: [
      "丿 left half: left-falling short stroke",
      "─ left half: horizontal",
      "│ left half: vertical (with hook)",
      "丿 right half: left-falling short stroke",
      "─ right half: horizontal",
      "│ right half: vertical"
    ]
  },
  "米": {
    strokes: 6,
    order: [
      "丶 top-left dot",
      "丿 top-right falling stroke",
      "─ horizontal (left→right)",
      "│ vertical (top→bottom)",
      "丿 bottom-left falling stroke",
      "㇏ bottom-right sweep"
    ]
  },
  "貝": {
    strokes: 7,
    order: [
      "│ left vertical of 目",
      "⌐ top horizontal + right vertical",
      "─ first inner horizontal",
      "─ second inner horizontal",
      "─ bottom horizontal of box",
      "丿 left leg (はらい)",
      "丶 right dot leg"
    ]
  },
  "石": {
    strokes: 5,
    order: [
      "─ top horizontal",
      "丿 left-falling stroke from horizontal",
      "│ left vertical of box",
      "⌐ box top horizontal + right vertical",
      "─ bottom horizontal (close box)"
    ]
  },
  "糸": {
    strokes: 7,
    order: [
      "丿 top: tiny left-falling stroke",
      "丶 top: tiny right dot",
      "╲ middle: left-falling stroke",
      "丿 middle: right angle stroke",
      "丶 bottom-left dot",
      "丶 bottom-center dot",
      "丶 bottom-right dot"
    ]
  },

  // ─── Lesson 7: 花茶肉文字物牛馬鳥魚 ───

  "花": {
    strokes: 7,
    order: [
      "─ くさかんむり: left horizontal",
      "│ くさかんむり: left vertical (short)",
      "│ くさかんむり: right vertical (short)",
      "丿 bottom 化: にんべん left-falling",
      "│ bottom 化: にんべん vertical",
      "乛 bottom 化: right turning stroke",
      "丿 bottom 化: right falling leg"
    ]
  },
  "茶": {
    strokes: 9,
    order: [
      "─ くさかんむり: left horizontal",
      "│ くさかんむり: left short vertical",
      "│ くさかんむり: right short vertical",
      "丿 left-falling stroke (はらい)",
      "㇏ right-falling sweep",
      "─ horizontal (long)",
      "丿 bottom 木 variant: left-falling",
      "│ bottom: vertical",
      "㇏ bottom: right sweep"
    ]
  },
  "肉": {
    strokes: 6,
    order: [
      "│ outer: left vertical (slight inward)",
      "⌐ outer: top-right turning stroke",
      "丿 inner: first person-like left stroke",
      "㇏ inner: first person-like right stroke",
      "丿 inner: second person-like left stroke",
      "─ bottom: closing horizontal"
    ]
  },
  "文": {
    strokes: 4,
    order: [
      "丶 top dot",
      "─ horizontal (left→right)",
      "丿 left-falling stroke (はらい)",
      "㇏ right-falling sweep"
    ]
  },
  "字": {
    strokes: 6,
    order: [
      "丶 うかんむり: top dot",
      "乛 うかんむり: left-side turning stroke",
      "─ うかんむり: horizontal (covers top)",
      "乛 bottom 子: horizontal hook",
      "│ bottom 子: vertical",
      "─ bottom 子: bottom horizontal"
    ]
  },
  "物": {
    strokes: 8,
    order: [
      "丿 left 牛: first left-falling short stroke",
      "─ left 牛: horizontal",
      "│ left 牛: vertical",
      "─ left 牛: bottom horizontal",
      "丿 right 勿: first left-falling stroke",
      "丿 right 勿: second left-falling stroke (longer)",
      "丿 right 勿: third left-falling stroke (longest)",
      "丶 right 勿: connecting dot/stroke"
    ]
  },
  "牛": {
    strokes: 4,
    order: [
      "丿 short left-falling stroke (top)",
      "─ first horizontal",
      "│ vertical (top→bottom, through all)",
      "─ bottom horizontal (long)"
    ]
  },
  "馬": {
    strokes: 10,
    order: [
      "│ left vertical",
      "⌐ top horizontal + right vertical turning",
      "─ first inner horizontal",
      "─ second inner horizontal",
      "─ third inner horizontal",
      "│ bottom box: left vertical",
      "乛 bottom horizontal turning up",
      "丶 first bottom dot",
      "丶 second bottom dot",
      "丶 third bottom dot",
    ]
  },
  "鳥": {
    strokes: 11,
    order: [
      "丿 top left-falling short stroke",
      "⌐ top horizontal + right vertical",
      "─ first inner horizontal",
      "│ inner vertical section",
      "丶 eye dot",
      "─ horizontal below eye",
      "│ lower box: left vertical",
      "⌐ lower box: horizontal + right vertical",
      "丶 bottom dot 1",
      "丶 bottom dot 2",
      "丶 bottom dot 3"
    ]
  },
  "魚": {
    strokes: 11,
    order: [
      "丿 top: left-falling short stroke (⺈)",
      "⌐ top box: top horizontal (田 part)",
      "│ top box: left vertical",
      "⌐ top box: right corner",
      "─ top box: inner horizontal",
      "│ top box: inner vertical",
      "─ top box: bottom horizontal",
      "丶 bottom: left dot",
      "丶 bottom: middle dot",
      "丶 bottom: right dot",
      "─ bottom: final horizontal"
    ]
  },

  // ─── Lesson 8: 新古長短高安低暗多少 ───

  "新": {
    strokes: 13,
    order: [
      "丶 left 亲: top dot",
      "─ left 亲: first horizontal",
      "─ left 亲: second horizontal",
      "│ left 亲: vertical",
      "丿 left 亲: left-falling stroke of 木",
      "㇏ left 亲: right-falling sweep of 木",
      "─ left 亲: short horizontal (inside)",
      "丶 left 亲: right dot",
      "丿 left 亲: additional stroke",
      "─ right 斤: top horizontal",
      "丿 right 斤: left-falling diagonal",
      "丿 right 斤: vertical-ish stroke",
      "│ right 斤: final vertical"
    ]
  },
  "古": {
    strokes: 5,
    order: [
      "─ top horizontal",
      "│ vertical (top→bottom)",
      "│ box: left vertical",
      "⌐ box: top horizontal + right vertical",
      "─ box: bottom horizontal (close)"
    ]
  },
  "長": {
    strokes: 8,
    order: [
      "│ long left vertical (top→bottom)",
      "─ top horizontal",
      "⌐ second horizontal + right side",
      "─ inner horizontal 1",
      "─ inner horizontal 2",
      "─ bottom horizontal of box",
      "丿 left leg (はらい)",
      "丶 right dot leg"
    ]
  },
  "短": {
    strokes: 12,
    order: [
      "丿 left 矢: left-falling stroke",
      "─ left 矢: first horizontal",
      "│ left 矢: vertical",
      "丿 left 矢: lower left-falling",
      "㇏ left 矢: right sweep",
      "─ right 豆: top horizontal",
      "│ right 豆: left vertical of box",
      "⌐ right 豆: right corner",
      "─ right 豆: bottom of box",
      "─ right 豆: horizontal below",
      "│ right 豆: vertical",
      "丶 right 豆: final dot"
    ]
  },
  "高": {
    strokes: 10,
    order: [
      "丶 top dot",
      "─ top horizontal (lid: なべぶた)",
      "│ left vertical of outer box",
      "⌐ top horizontal + right vertical of outer box",
      "─ mouth box: top horizontal",
      "│ mouth box: left side",
      "⌐ mouth box: right corner",
      "─ mouth box: bottom horizontal",
      "─ outer box: inner lower horizontal",
      "─ outer box: bottom horizontal (close)"
    ]
  },
  "安": {
    strokes: 6,
    order: [
      "丶 うかんむり: top dot",
      "乛 うかんむり: left turning stroke",
      "─ うかんむり: horizontal",
      "╲ bottom 女: curved falling stroke",
      "丿 bottom 女: sweeping stroke",
      "─ bottom 女: bottom horizontal"
    ]
  },
  "低": {
    strokes: 7,
    order: [
      "丿 にんべん: left-falling stroke",
      "│ にんべん: vertical",
      "─ right: top horizontal (short)",
      "│ right: vertical",
      "丶 right: dot (upper area)",
      "丿 right: lower left-falling stroke",
      "㇏ right: lower right-falling sweep"
    ]
  },
  "暗": {
    strokes: 13,
    order: [
      "│ left 日: left vertical",
      "⌐ left 日: top horizontal + right vertical",
      "─ left 日: inner horizontal",
      "─ left 日: bottom horizontal",
      "丶 right 音: top dot",
      "─ right 音: horizontal of 立",
      "│ right 音: left short vertical of 立",
      "│ right 音: right short vertical of 立",
      "─ right 音: bottom horizontal of 立",
      "│ right 日: left vertical",
      "⌐ right 日: top + right vertical",
      "─ right 日: inner horizontal",
      "─ right 日: bottom horizontal"
    ]
  },
  "多": {
    strokes: 6,
    order: [
      "丿 top 夕: left-falling stroke",
      "⌐ top 夕: horizontal turning down",
      "丶 top 夕: inner dot",
      "丿 bottom 夕: left-falling stroke",
      "⌐ bottom 夕: horizontal turning down",
      "丶 bottom 夕: inner dot"
    ]
  },
  "少": {
    strokes: 4,
    order: [
      "│ vertical (top→bottom, slight curve)",
      "丿 left-falling stroke (はらい)",
      "丶 left dot",
      "丶 right dot"
    ]
  },

  // ─── Lesson 9: 行来帰食飲見聞読書話買教 ───

  "行": {
    strokes: 6,
    order: [
      "丿 left: top left-falling stroke",
      "丿 left: second left-falling stroke",
      "│ left: vertical (short)",
      "─ right: top horizontal (short)",
      "⌐ right: vertical turning stroke",
      "│ right: final vertical"
    ]
  },
  "来": {
    strokes: 7,
    order: [
      "─ top horizontal (short)",
      "丶 left dot",
      "丿 right short falling",
      "─ horizontal (long, main)",
      "│ vertical (top→bottom)",
      "丿 left-falling leg (はらい)",
      "㇏ right-falling sweep"
    ]
  },
  "帰": {
    strokes: 10,
    order: [
      "│ left part: vertical with short strokes",
      "丿 left part: left-falling",
      "│ left part: short vertical",
      "⌐ right: top horizontal + vertical fold",
      "│ right 日: left vertical",
      "⌐ right 日: top horizontal + right vertical",
      "─ right 日: inner horizontal",
      "─ right 日: bottom horizontal",
      "│ right: lower vertical",
      "─ right: bottom horizontal"
    ]
  },
  "食": {
    strokes: 9,
    order: [
      "丿 top: left-falling stroke (はらい)",
      "─ top: horizontal (lid)",
      "│ middle: vertical (center)",
      "丶 left dot (inside structure)",
      "丶 right dot",
      "─ horizontal across",
      "│ bottom box area: vertical",
      "乛 bottom: turning stroke",
      "丶 bottom: final dot (はね)"
    ]
  },
  "飲": {
    strokes: 12,
    order: [
      "丿 left 食: top left-falling stroke",
      "─ left 食: horizontal",
      "│ left 食: vertical",
      "丶 left 食: left inner dot",
      "丶 left 食: right inner dot",
      "─ left 食: horizontal",
      "乛 left 食: turning stroke",
      "丶 left 食: hook/dot",
      "乛 right 欠: top turning stroke",
      "丿 right 欠: left-falling stroke",
      "丿 right 欠: second left-falling",
      "㇏ right 欠: final right sweep"
    ]
  },
  "見": {
    strokes: 7,
    order: [
      "│ top 目: left vertical",
      "⌐ top 目: top horizontal + right vertical",
      "─ top 目: first inner horizontal",
      "─ top 目: second inner horizontal",
      "─ top 目: bottom horizontal",
      "丿 bottom: left leg (はらい)",
      "乛 bottom: right turning leg (はね)"
    ]
  },
  "聞": {
    strokes: 14,
    order: [
      "│ 門 left: left vertical",
      "丶 門 left: top-right dot",
      "⌐ 門 left: inner fold",
      "│ 門 left: inner vertical",
      "│ 門 right: left vertical",
      "丶 門 right: top-right dot",
      "⌐ 門 right: inner fold",
      "│ 門 right: inner vertical",
      "│ inner 耳: left vertical (short)",
      "─ inner 耳: first horizontal",
      "─ inner 耳: second horizontal",
      "─ inner 耳: third horizontal",
      "│ inner 耳: right vertical",
      "─ inner 耳: bottom horizontal"
    ]
  },
  "読": {
    strokes: 14,
    order: [
      "丶 left ごんべん: top dot",
      "─ left ごんべん: second horizontal",
      "─ left ごんべん: third horizontal",
      "│ left ごんべん: left vertical of 口",
      "⌐ left ごんべん: right corner of 口",
      "─ left ごんべん: bottom of 口",
      "─ left ごんべん: bottom horizontal",
      "─ right 売: top horizontal",
      "│ right: left vertical of 目",
      "⌐ right: right corner of 目",
      "─ right: first inner horizontal",
      "─ right: bottom of box",
      "丿 right: left leg",
      "乛 right: right turning leg"
    ]
  },
  "書": {
    strokes: 10,
    order: [
      "─ top: first horizontal (of ヨ part)",
      "─ top: second horizontal",
      "│ top: vertical of ヨ",
      "─ middle: long horizontal",
      "│ center: vertical (main, through structure)",
      "─ lower: horizontal",
      "│ 日: left vertical",
      "⌐ 日: top + right vertical",
      "─ 日: inner horizontal",
      "─ 日: bottom horizontal"
    ]
  },
  "話": {
    strokes: 13,
    order: [
      "丶 left ごんべん: top dot",
      "─ left ごんべん: second horizontal",
      "─ left ごんべん: third horizontal",
      "│ left ごんべん: left vertical of 口",
      "⌐ left ごんべん: right corner of 口",
      "─ left ごんべん: bottom of 口",
      "─ left ごんべん: bottom horizontal",
      "丿 right: left-falling short stroke",
      "─ right: first horizontal (of 千)",
      "─ right: second horizontal",
      "│ right 口: left vertical",
      "⌐ right 口: right corner",
      "─ right 口: bottom horizontal"
    ]
  },
  "買": {
    strokes: 12,
    order: [
      "│ top 目: left vertical",
      "⌐ top 目: top + right vertical",
      "─ top 目: first inner horizontal",
      "─ top 目: second inner horizontal",
      "─ top 目: bottom horizontal",
      "─ 貝 lower: horizontal below 目",
      "│ 貝 lower: left vertical of box",
      "⌐ 貝 lower: right corner",
      "─ 貝 lower: inner horizontal",
      "─ 貝 lower: bottom of box",
      "丿 bottom: left leg (はらい)",
      "丶 bottom: right dot leg"
    ]
  },
  "教": {
    strokes: 11,
    order: [
      "─ left 孝: top horizontal",
      "│ left 孝: vertical (short)",
      "丿 left: left-falling stroke of 子",
      "乛 left: horizontal hook of 子",
      "│ left: vertical of 子 lower",
      "─ left: bottom horizontal of 子",
      "丿 left: extra stroke",
      "─ right 攵: horizontal (short)",
      "丿 right 攵: left-falling stroke",
      "丿 right 攵: vertical stroke",
      "㇏ right 攵: right sweep (はらい)"
    ]
  },

  // ─── Lesson 10: 昼夜晩夕方午前後毎週曜 ───

  "昼": {
    strokes: 9,
    order: [
      "│ top ヨ: vertical (short left)",
      "─ top ヨ: first horizontal",
      "─ top ヨ: second horizontal",
      "─ top: long horizontal (divider)",
      "│ bottom 日: left vertical",
      "⌐ bottom 日: top + right vertical",
      "─ bottom 日: inner horizontal",
      "─ bottom 日: bottom horizontal",
      "─ very bottom: final long horizontal"
    ]
  },
  "夜": {
    strokes: 8,
    order: [
      "丶 top dot",
      "─ horizontal (なべぶた)",
      "│ vertical (main center)",
      "丿 left-falling short stroke",
      "─ lower horizontal (short)",
      "丿 lower left-falling sweep",
      "乛 lower turning stroke",
      "丶 final dot/sweep"
    ]
  },
  "晩": {
    strokes: 12,
    order: [
      "│ left 日: left vertical",
      "⌐ left 日: top + right vertical",
      "─ left 日: inner horizontal",
      "─ left 日: bottom horizontal",
      "丿 right 免: top left-falling",
      "⌐ right 免: horizontal turning stroke",
      "│ right 免: left vertical of 口",
      "⌐ right 免: top + right of 口",
      "─ right 免: bottom of 口",
      "│ right 免: vertical below",
      "乛 right 免: turning stroke at bottom",
      "丶 right 免: final dot"
    ]
  },
  "夕": {
    strokes: 3,
    order: [
      "丿 left-falling stroke (top→bottom-left)",
      "⌐ horizontal turning into downward stroke",
      "丶 inner dot"
    ]
  },
  "方": {
    strokes: 4,
    order: [
      "丶 top dot",
      "─ horizontal (left→right)",
      "丿 left-falling diagonal (はらい)",
      "乛 turning stroke (horizontal + downward hook)"
    ]
  },
  "午": {
    strokes: 4,
    order: [
      "丿 left-falling short stroke (top)",
      "─ first horizontal",
      "│ vertical (top→bottom, extends below)",
      "─ second horizontal"
    ]
  },
  "前": {
    strokes: 9,
    order: [
      "丶 top-left dot",
      "─ top horizontal",
      "│ center vertical (short, of top part)",
      "│ left 月: left vertical (sweeping)",
      "⌐ left 月: top + right vertical",
      "─ left 月: first inner horizontal",
      "─ left 月: second inner horizontal",
      "│ right 刂: left vertical",
      "│ right 刂: right vertical (with hook)"
    ]
  },
  "後": {
    strokes: 9,
    order: [
      "丿 ぎょうにんべん: top left-falling",
      "丿 ぎょうにんべん: middle left-falling",
      "│ ぎょうにんべん: vertical",
      "─ right: top horizontal (short)",
      "丿 right: left-falling stroke",
      "│ right: vertical (center)",
      "乛 right: turning stroke below",
      "丿 right: lower left-falling (はらい)",
      "㇏ right: lower right sweep"
    ]
  },
  "毎": {
    strokes: 6,
    order: [
      "丿 top left-falling short stroke",
      "─ horizontal (long, main)",
      "│ vertical (center, short)",
      "╲ mother part: left-falling inner stroke",
      "─ horizontal through",
      "乛 bottom turning stroke with hook"
    ]
  },
  "週": {
    strokes: 11,
    order: [
      "│ inner 周: left vertical",
      "⌐ inner 周: top horizontal + right vertical",
      "─ inner 周: horizontal below top",
      "│ inner 口: left vertical",
      "⌐ inner 口: right corner",
      "─ inner 口: bottom of 口",
      "─ inner 周: horizontal below 口",
      "│ inner 周: lower vertical",
      "─ inner 周: bottom horizontal",
      "⌐ しんにょう: dot + curved wave",
      "㇏ しんにょう: final sweep (right はらい)"
    ]
  },
  "曜": {
    strokes: 18,
    order: [
      "│ left 日: left vertical",
      "⌐ left 日: top + right vertical",
      "─ left 日: inner horizontal",
      "─ left 日: bottom horizontal",
      "丿 right ヨ top: left-falling short",
      "乛 right: horizontal fold",
      "│ right 隹: vertical (main)",
      "丿 right 隹: first left-falling",
      "─ right 隹: first horizontal",
      "丿 right 隹: second left-falling",
      "─ right 隹: second horizontal",
      "丿 right 隹: third left-falling",
      "─ right 隹: third horizontal",
      "丿 right 隹: fourth left-falling",
      "丶 right: dot",
      "─ bottom: horizontal",
      "丿 bottom: left-falling leg",
      "㇏ bottom: right sweep"
    ]
  },

  // ─── Lessons 11-22: stroke counts only ───

  // Lesson 11: 作泳油海酒待校時言計語飯
  "作": { strokes: 7, order: [] }, "泳": { strokes: 8, order: [] }, "油": { strokes: 8, order: [] },
  "海": { strokes: 9, order: [] }, "酒": { strokes: 10, order: [] }, "待": { strokes: 9, order: [] },
  "校": { strokes: 10, order: [] }, "時": { strokes: 10, order: [] }, "言": { strokes: 7, order: [] },
  "計": { strokes: 9, order: [] }, "語": { strokes: 14, order: [] }, "飯": { strokes: 12, order: [] },

  // Lesson 12: 宅客室家英薬会今雪雲電売
  "宅": { strokes: 6, order: [] }, "客": { strokes: 9, order: [] }, "室": { strokes: 9, order: [] },
  "家": { strokes: 10, order: [] }, "英": { strokes: 8, order: [] }, "薬": { strokes: 16, order: [] },
  "会": { strokes: 6, order: [] }, "今": { strokes: 4, order: [] }, "雪": { strokes: 11, order: [] },
  "雲": { strokes: 12, order: [] }, "電": { strokes: 13, order: [] }, "売": { strokes: 7, order: [] },

  // Lesson 13: 広店度病疲痛屋国回困開閉
  "広": { strokes: 5, order: [] }, "店": { strokes: 8, order: [] }, "度": { strokes: 9, order: [] },
  "病": { strokes: 10, order: [] }, "疲": { strokes: 10, order: [] }, "痛": { strokes: 12, order: [] },
  "屋": { strokes: 9, order: [] }, "国": { strokes: 8, order: [] }, "回": { strokes: 6, order: [] },
  "困": { strokes: 7, order: [] }, "開": { strokes: 12, order: [] }, "閉": { strokes: 11, order: [] },

  // Lesson 14: 近遠速遅道青晴静寺持荷歌
  "近": { strokes: 7, order: [] }, "遠": { strokes: 13, order: [] }, "速": { strokes: 10, order: [] },
  "遅": { strokes: 12, order: [] }, "道": { strokes: 12, order: [] }, "青": { strokes: 8, order: [] },
  "晴": { strokes: 12, order: [] }, "静": { strokes: 14, order: [] }, "寺": { strokes: 6, order: [] },
  "持": { strokes: 9, order: [] }, "荷": { strokes: 10, order: [] }, "歌": { strokes: 14, order: [] },

  // Lesson 15: 友父母兄姉弟妹夫妻彼主奥
  "友": { strokes: 4, order: [] }, "父": { strokes: 4, order: [] }, "母": { strokes: 5, order: [] },
  "兄": { strokes: 5, order: [] }, "姉": { strokes: 8, order: [] }, "弟": { strokes: 7, order: [] },
  "妹": { strokes: 8, order: [] }, "夫": { strokes: 4, order: [] }, "妻": { strokes: 8, order: [] },
  "彼": { strokes: 8, order: [] }, "主": { strokes: 5, order: [] }, "奥": { strokes: 12, order: [] },

  // Lesson 16: 元気有名親切便利不若早忙
  "元": { strokes: 4, order: [] }, "気": { strokes: 6, order: [] }, "有": { strokes: 6, order: [] },
  "名": { strokes: 6, order: [] }, "親": { strokes: 16, order: [] }, "切": { strokes: 4, order: [] },
  "便": { strokes: 9, order: [] }, "利": { strokes: 7, order: [] }, "不": { strokes: 4, order: [] },
  "若": { strokes: 8, order: [] }, "早": { strokes: 6, order: [] }, "忙": { strokes: 6, order: [] },

  // Lesson 17: 出入乗降着渡通走歩止動働
  "出": { strokes: 5, order: [] }, "入": { strokes: 2, order: [] }, "乗": { strokes: 9, order: [] },
  "降": { strokes: 10, order: [] }, "着": { strokes: 12, order: [] }, "渡": { strokes: 12, order: [] },
  "通": { strokes: 10, order: [] }, "走": { strokes: 7, order: [] }, "歩": { strokes: 8, order: [] },
  "止": { strokes: 4, order: [] }, "動": { strokes: 11, order: [] }, "働": { strokes: 13, order: [] },

  // Lesson 18: 右左東西北南外内部駅社院
  "右": { strokes: 5, order: [] }, "左": { strokes: 5, order: [] }, "東": { strokes: 8, order: [] },
  "西": { strokes: 6, order: [] }, "北": { strokes: 5, order: [] }, "南": { strokes: 9, order: [] },
  "外": { strokes: 5, order: [] }, "内": { strokes: 4, order: [] }, "部": { strokes: 11, order: [] },
  "駅": { strokes: 14, order: [] }, "社": { strokes: 7, order: [] }, "院": { strokes: 10, order: [] },

  // Lesson 19: 地鉄工場図館公園住所番号
  "地": { strokes: 6, order: [] }, "鉄": { strokes: 13, order: [] }, "工": { strokes: 3, order: [] },
  "場": { strokes: 12, order: [] }, "図": { strokes: 7, order: [] }, "館": { strokes: 16, order: [] },
  "公": { strokes: 4, order: [] }, "園": { strokes: 13, order: [] }, "住": { strokes: 7, order: [] },
  "所": { strokes: 8, order: [] }, "番": { strokes: 12, order: [] }, "号": { strokes: 5, order: [] },

  // Lesson 20: 市町村区都府県島京様
  "市": { strokes: 5, order: [] }, "町": { strokes: 7, order: [] }, "村": { strokes: 7, order: [] },
  "区": { strokes: 4, order: [] }, "都": { strokes: 11, order: [] }, "府": { strokes: 8, order: [] },
  "県": { strokes: 9, order: [] }, "島": { strokes: 10, order: [] }, "京": { strokes: 8, order: [] },
  "様": { strokes: 14, order: [] },

  // Lesson 21: 練習勉強研究留質問題答宿
  "練": { strokes: 14, order: [] }, "習": { strokes: 11, order: [] }, "勉": { strokes: 10, order: [] },
  "強": { strokes: 11, order: [] }, "研": { strokes: 9, order: [] }, "究": { strokes: 7, order: [] },
  "留": { strokes: 10, order: [] }, "質": { strokes: 15, order: [] }, "問": { strokes: 11, order: [] },
  "題": { strokes: 18, order: [] }, "答": { strokes: 12, order: [] }, "宿": { strokes: 11, order: [] },

  // Lesson 22: 政治経済歴史育化理科数医
  "政": { strokes: 9, order: [] }, "治": { strokes: 8, order: [] }, "経": { strokes: 11, order: [] },
  "済": { strokes: 11, order: [] }, "歴": { strokes: 14, order: [] }, "史": { strokes: 5, order: [] },
  "育": { strokes: 8, order: [] }, "化": { strokes: 4, order: [] }, "理": { strokes: 11, order: [] },
  "科": { strokes: 9, order: [] }, "数": { strokes: 13, order: [] }, "医": { strokes: 7, order: [] }

};

// Helper: get stroke data for a specific kanji
export const getStrokeData = (char) => strokeData[char] || null;

// Helper: get total stroke count
export const getStrokeCount = (char) => strokeData[char]?.strokes || 0;
