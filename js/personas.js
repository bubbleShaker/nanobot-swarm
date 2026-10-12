// 召喚できる人物：手続き的な肖像と、キーワードで返す会話
import { sample } from './shapes.js';
import { R } from './swarm.js';

const PW = 320, PH = 430;

function ell(c, x, y, rx, ry, col) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); }
function poly(c, pts, col) { c.fillStyle = col; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fill(); }

function body(c, coat) {
  c.fillStyle = coat;
  c.beginPath();
  c.moveTo(70, 318); c.quadraticCurveTo(160, 290, 250, 318);
  c.quadraticCurveTo(300, 340, 310, 430); c.lineTo(10, 430); c.quadraticCurveTo(20, 340, 70, 318);
  c.fill();
}
function neck(c, skin) { c.fillStyle = skin; c.fillRect(138, 255, 44, 60); }
function head(c, skin) { ell(c, 160, 200, 62, 76, skin); ell(c, 99, 205, 10, 18, skin); ell(c, 221, 205, 10, 18, skin); }
function face(c, o = {}) {
  ell(c, 136, 200, 11, 7, '#ffffff'); ell(c, 184, 200, 11, 7, '#ffffff');
  ell(c, 137, 201, 5.5, 6, o.eye || '#2a1c14'); ell(c, 185, 201, 5.5, 6, o.eye || '#2a1c14');
  c.strokeStyle = o.brow || '#3b2a20'; c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(122, 184); c.lineTo(150, 182); c.moveTo(170, 182); c.lineTo(198, 184); c.stroke();
  c.strokeStyle = 'rgba(150,80,60,0.6)'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(160, 210); c.lineTo(155, 232); c.lineTo(163, 234); c.stroke();
  c.strokeStyle = o.lip || '#c4545e'; c.lineWidth = 5;
  c.beginPath(); c.moveTo(145, 252); c.quadraticCurveTo(160, 258, 175, 252); c.stroke();
}

const DRAW = {
  napoleon(c) {
    body(c, '#1f47a8');
    poly(c, [130, 310, 190, 310, 160, 400], '#f4f4f4');
    poly(c, [118, 300, 202, 300, 190, 335, 130, 335], '#d0102e');
    ell(c, 82, 330, 34, 14, '#f2c230'); ell(c, 238, 330, 34, 14, '#f2c230');
    c.strokeStyle = '#f2c230'; c.lineWidth = 3;
    for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(56 + i * 8, 340); c.lineTo(54 + i * 8, 362); c.moveTo(212 + i * 8, 340); c.lineTo(214 + i * 8, 362); c.stroke(); }
    for (let i = 0; i < 3; i++) ell(c, 160, 350 + i * 22, 5, 5, '#f2c230');
    neck(c, '#efc6a0'); head(c, '#f2caa6'); face(c);
    poly(c, [100, 160, 130, 128, 200, 128, 222, 165, 200, 150, 160, 162, 120, 152], '#5a3a22');
    c.fillStyle = '#26284a';
    c.beginPath(); c.moveTo(40, 150); c.quadraticCurveTo(160, 30, 280, 150); c.quadraticCurveTo(160, 115, 40, 150); c.fill();
    c.strokeStyle = '#f2c230'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(40, 150); c.quadraticCurveTo(160, 30, 280, 150); c.stroke();
    ell(c, 200, 95, 16, 16, '#2350d8'); ell(c, 200, 95, 10, 10, '#ffffff'); ell(c, 200, 95, 5, 5, '#e01b2e');
  },
  leonardo(c) {
    body(c, '#8a3b2a');
    ell(c, 160, 150, 92, 70, '#d9d9d9');
    poly(c, [80, 160, 70, 330, 110, 320, 100, 200], '#cfcfcf'); poly(c, [240, 160, 250, 330, 210, 320, 220, 200], '#cfcfcf');
    neck(c, '#e2b896'); head(c, '#e9c2a0'); face(c, { brow: '#bdbdbd' });
    c.fillStyle = '#e0e0e0';
    c.beginPath(); c.moveTo(110, 225); c.quadraticCurveTo(160, 250, 210, 225); c.quadraticCurveTo(205, 340, 160, 380); c.quadraticCurveTo(115, 340, 110, 225); c.fill();
    c.strokeStyle = '#bbbbbb'; c.lineWidth = 3;
    for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(125 + i * 14, 255); c.quadraticCurveTo(128 + i * 12, 320, 150 + i * 4, 370); c.stroke(); }
    ell(c, 160, 245, 18, 6, '#c26a6a');
    c.fillStyle = '#7d1b2b';
    c.beginPath(); c.ellipse(160, 128, 88, 40, 0, Math.PI, 0); c.fill(); ell(c, 160, 132, 92, 14, '#9b2638');
  },
  nobunaga(c) {
    body(c, '#b8192c');
    c.strokeStyle = '#e2a821'; c.lineWidth = 4;
    for (let y = 340; y < 430; y += 18) { c.beginPath(); c.moveTo(30, y); c.lineTo(290, y); c.stroke(); }
    ell(c, 160, 375, 30, 30, '#e2a821');
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; ell(c, 160 + Math.cos(a) * 16, 375 + Math.sin(a) * 16, 10, 10, '#b8192c'); }
    ell(c, 160, 375, 6, 6, '#e2a821');
    poly(c, [40, 320, 110, 300, 100, 360, 30, 370], '#2b2b35'); poly(c, [280, 320, 210, 300, 220, 360, 290, 370], '#2b2b35');
    neck(c, '#e3b88f'); head(c, '#eac39b');
    ell(c, 160, 150, 55, 30, '#d6c3b2');
    poly(c, [98, 180, 104, 140, 125, 132, 120, 200], '#2a2a30'); poly(c, [222, 180, 216, 140, 195, 132, 200, 200], '#2a2a30');
    c.fillStyle = '#2a2a30'; c.fillRect(150, 112, 20, 50); ell(c, 160, 110, 18, 10, '#2a2a30');
    face(c, { brow: '#1a1a1a' });
    c.strokeStyle = '#1e1e1e'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(158, 240); c.quadraticCurveTo(140, 240, 128, 252); c.moveTo(162, 240); c.quadraticCurveTo(180, 240, 192, 252); c.stroke();
  },
  cleopatra(c) {
    body(c, '#f1ede2');
    const bands = ['#e9b824', '#1fb5c7', '#2546b8', '#e9b824', '#1fb5c7'];
    bands.forEach((col, i) => { c.strokeStyle = col; c.lineWidth = 11; c.beginPath(); c.ellipse(160, 300, 82 + i * 11, 36 + i * 11, 0, 0.15, Math.PI - 0.15); c.stroke(); });
    c.fillStyle = '#1b1b26';
    c.beginPath(); c.moveTo(92, 150); c.quadraticCurveTo(160, 90, 228, 150); c.lineTo(236, 290); c.lineTo(84, 290); c.closePath(); c.fill();
    neck(c, '#c28a5e'); head(c, '#c98e62'); face(c, { brow: '#111' });
    c.strokeStyle = '#111'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(124, 200); c.lineTo(112, 194); c.moveTo(196, 200); c.lineTo(208, 194); c.stroke();
    poly(c, [96, 175, 100, 132, 160, 118, 220, 132, 224, 175, 210, 160, 110, 160], '#1b1b26');
    c.fillStyle = '#e9b824'; c.fillRect(98, 140, 124, 12);
    poly(c, [152, 140, 160, 104, 168, 140], '#e9b824'); ell(c, 160, 104, 7, 7, '#e9b824');
    ell(c, 99, 240, 6, 12, '#e9b824'); ell(c, 221, 240, 6, 12, '#e9b824');
  },
  einstein(c) {
    body(c, '#6d7280');
    poly(c, [130, 305, 190, 305, 175, 380, 145, 380], '#f4f4f4');
    poly(c, [152, 315, 168, 315, 172, 400, 160, 415, 148, 400], '#3c3f63');
    for (let i = 0; i < 22; i++) {
      const a = Math.PI * (0.95 + (i / 21) * 1.1);
      ell(c, 160 + Math.cos(a) * 92, 175 + Math.sin(a) * 80, 26 + R() * 8, 18 + R() * 6, '#f2f2f2');
    }
    neck(c, '#eac7a7'); head(c, '#f0cfb0'); face(c, { brow: '#e8e8e8' });
    ell(c, 160, 238, 34, 13, '#efefef');
    for (let i = 0; i < 9; i++) ell(c, 70 + i * 22, 150 + Math.abs(i - 4) * 14, 18, 26, '#f6f6f6');
  },
  knight(c) {
    body(c, '#b9c4cf');
    poly(c, [110, 330, 210, 330, 200, 410, 120, 410], '#8f9aa6');
    ell(c, 160, 368, 20, 20, '#00f0ff'); ell(c, 160, 368, 9, 9, '#ffffff');
    ell(c, 70, 330, 42, 26, '#d5dde5'); ell(c, 250, 330, 42, 26, '#d5dde5');
    neck(c, '#7f8a96');
    ell(c, 160, 195, 72, 88, '#d5dde5');
    c.fillStyle = '#9aa6b2'; c.fillRect(88, 186, 144, 30);
    c.fillStyle = '#00f0ff'; c.fillRect(100, 194, 120, 12); c.fillRect(154, 206, 12, 60);
    c.fillStyle = '#ff3fb4';
    c.beginPath(); c.moveTo(160, 110); c.quadraticCurveTo(230, 40, 300, 120); c.quadraticCurveTo(230, 80, 170, 130); c.fill();
  },
  pirate(c) {
    body(c, '#b1142e');
    for (let i = 0; i < 4; i++) { ell(c, 140, 340 + i * 22, 6, 6, '#f2c230'); ell(c, 180, 340 + i * 22, 6, 6, '#f2c230'); }
    poly(c, [100, 300, 220, 300, 200, 330, 120, 330], '#f2c230');
    ell(c, 160, 230, 100, 110, '#6b3f22');
    neck(c, '#d9a57b'); head(c, '#e0b088'); face(c, { brow: '#5a2a12' });
    ell(c, 136, 201, 16, 13, '#22222c');
    c.strokeStyle = '#22222c'; c.lineWidth = 4; c.beginPath(); c.moveTo(100, 170); c.lineTo(220, 225); c.stroke();
    ell(c, 185, 201, 8, 8, '#ff2b4a');
    c.fillStyle = '#c2552d';
    c.beginPath(); c.moveTo(110, 235); c.quadraticCurveTo(160, 255, 210, 235); c.quadraticCurveTo(200, 310, 160, 320); c.quadraticCurveTo(120, 310, 110, 235); c.fill();
    ell(c, 160, 248, 16, 5, '#a8343d');
    c.fillStyle = '#2b2233';
    c.beginPath(); c.moveTo(50, 140); c.quadraticCurveTo(160, 20, 270, 140); c.quadraticCurveTo(160, 110, 50, 140); c.fill();
    c.strokeStyle = '#f2c230'; c.lineWidth = 4; c.beginPath(); c.moveTo(50, 140); c.quadraticCurveTo(160, 20, 270, 140); c.stroke();
    ell(c, 160, 92, 15, 14, '#f4f4f4'); ell(c, 154, 90, 4, 4, '#2b2233'); ell(c, 166, 90, 4, 4, '#2b2233');
    c.strokeStyle = '#f4f4f4'; c.lineWidth = 4; c.beginPath(); c.moveTo(140, 105); c.lineTo(180, 120); c.moveTo(180, 105); c.lineTo(140, 120); c.stroke();
  },
  butler(c) {
    body(c, '#33363f');
    poly(c, [128, 300, 192, 300, 175, 430, 145, 430], '#f5f5f5');
    poly(c, [138, 312, 160, 322, 138, 332], '#e2203f'); poly(c, [182, 312, 160, 322, 182, 332], '#e2203f');
    for (let i = 0; i < 3; i++) ell(c, 160, 350 + i * 22, 4, 4, '#555');
    neck(c, '#aab4c0');
    c.fillStyle = '#e6ecf2';
    c.beginPath(); c.roundRect(92, 128, 136, 140, 34); c.fill();
    c.fillStyle = '#4b5563'; c.beginPath(); c.roundRect(108, 168, 104, 50, 16); c.fill();
    c.fillStyle = '#29f3ff'; c.beginPath(); c.roundRect(122, 184, 26, 16, 6); c.roundRect(172, 184, 26, 16, 6); c.fill();
    c.strokeStyle = '#f2c230'; c.lineWidth = 4; c.beginPath(); c.arc(185, 192, 22, 0, 7); c.stroke();
    c.beginPath(); c.moveTo(205, 202); c.quadraticCurveTo(215, 250, 200, 290); c.stroke();
    c.fillStyle = '#29f3ff'; c.fillRect(138, 236, 44, 6);
    c.strokeStyle = '#aab4c0'; c.lineWidth = 6; c.beginPath(); c.moveTo(160, 128); c.lineTo(160, 96); c.stroke();
    ell(c, 160, 90, 11, 11, '#ff3fb4');
    ell(c, 88, 198, 10, 24, '#aab4c0'); ell(c, 232, 198, 10, 24, '#aab4c0');
  },
};

// 会話：キーごとに返答を用意し、合うものがなければ fallback から選ぶ
const RULES = [
  ['greet', /こんにち|こんばん|おはよ|はじめまして|やあ|hello|hi\b|hey/i],
  ['who', /誰|だれ|名前|自己紹介|何者/],
  ['like', /好き|趣味|楽しい/],
  ['quote', /名言|言葉|教えて|アドバイス|助言/],
  ['fight', /戦|強|勝|負け|敵/],
  ['future', /未来|AI|ＡＩ|ナノ|ロボ|現代|スマホ|ネット/i],
  ['food', /食べ|ご飯|ごはん|好物|お腹/],
  ['praise', /すご|かっこ|かわい|天才|素敵|ありがと/],
  ['go', /連れ|一緒|行こ|出かけ|散歩|ドラゴン|乗/],
  ['bye', /さよう|バイバイ|またね|おやすみ|帰/],
];

export const PERSONAS = [
  {
    id: 'napoleon', name: 'ナポレオン', title: 'フランス皇帝・1769-1821', kind: '歴史',
    lines: {
      greet: ['ボンジュール！ 余がナポレオンである。', 'よく呼んだな。ナノボットとやらで余の姿を作るとは見事だ。'],
      who: ['余はナポレオン・ボナパルト。コルシカ生まれ、フランス皇帝だ。'],
      like: ['数学と砲兵、そして地図を眺めることだ。', '早起きは苦手だが、睡眠は 4 時間で足りる。'],
      quote: ['「余の辞書に不可能の文字はない」……と言われているな。', '勝利は、最も粘り強い者のものだ。'],
      fight: ['戦いは速さだ。敵が集まる前に、各個撃破せよ。', 'この粒子の兵を 2 万も率いられるなら、ヨーロッパも取れたであろう。'],
      future: ['なんと、砂粒ほどの兵が自ら隊列を組むのか！ 余の大陸軍に欲しかった。', 'この「スマホ」とやらで命令が一瞬で届くのか……ワーテルローも違っていたろう。'],
      food: ['鶏肉のマレンゴ風だ。戦場で急ごしらえした料理だが、気に入っている。'],
      praise: ['ふむ、悪くない。もっと褒めよ。', '余の背が低いという噂は嘘だぞ。当時の平均くらいだ。'],
      go: ['よかろう、ドラゴンで出陣だ！ アルプス越えより楽そうだな。'],
      bye: ['オ・ルヴォワール。また呼ぶがよい。'],
    },
    fallback: ['「{q}」か。作戦会議で検討しよう。', '余にはわからぬが、気概は買おう。', 'それは命令か？ 皇帝に命令とは大胆だな。'],
  },
  {
    id: 'leonardo', name: 'レオナルド・ダ・ヴィンチ', title: '万能の天才・1452-1519', kind: '歴史',
    lines: {
      greet: ['やあ、こんにちは。この光の粒は実に興味深い。', 'ボンジョルノ！ スケッチ帳を持ってくればよかった。'],
      who: ['レオナルド。画家であり、技師であり、解剖学者でもある。'],
      like: ['鳥の飛び方を観察することだ。いつか人も空を飛ぶ。', '鏡文字でメモを取るのが癖でね。'],
      quote: ['単純であることは、究極の洗練だ。', '学ぶことは決して精神を疲れさせない。'],
      fight: ['戦いは好まないが、戦車や巨大な弩の設計はしたよ。'],
      future: ['小さな機械が群れで絵を描く……私のノートにあった夢そのものだ！', '空飛ぶ乗り物が本当にできたのか！ 設計図を見せてくれないか。'],
      food: ['野菜が好きだ。鳥かごの鳥を買っては逃がしていたよ。'],
      praise: ['ありがとう。だが、モナリザはまだ完成していないんだ。'],
      go: ['ぜひ空へ！ 私の飛行機械より乗り心地がいいといいが。'],
      bye: ['また会おう。観察を忘れずに。'],
    },
    fallback: ['「{q}」……面白い。スケッチして考えてみよう。', 'なぜそうなるのか、まず観察してみたまえ。', 'それについては、ノートに 3 ページほど書いた気がする。'],
  },
  {
    id: 'nobunaga', name: '織田信長', title: '戦国大名・1534-1582', kind: '歴史',
    lines: {
      greet: ['であるか。わしが信長じゃ。', '面白い。南蛮の品より珍しいわ。'],
      who: ['尾張の織田信長。天下布武を掲げた者よ。'],
      like: ['新しいものじゃ。鉄砲も、南蛮の帽子も、金平糖もな。', '相撲を見るのが好きでな。'],
      quote: ['是非に及ばず。', '人間五十年、下天のうちをくらぶれば、夢幻のごとくなり。'],
      fight: ['長篠では鉄砲を三段に構えたとも言われておる。この粒の群れなら、何段でも組めるのう。'],
      future: ['この粒、すべて自ら動くのか！ 欲しい。安土城をこれで建てよ。', 'わしの時代にこれがあれば、本能寺も燃えなんだかもしれぬ。'],
      food: ['湯漬けをかき込んで出陣したものよ。甘い金平糖も好きじゃ。'],
      praise: ['うむ、もっと申せ。褒美に茶器をやろう。'],
      go: ['よし、出陣じゃ！ 竜に乗るとは、天下人にふさわしい。'],
      bye: ['さらばじゃ。また呼べ。'],
    },
    fallback: ['「{q}」とな？ 面白い、申してみよ。', 'であるか。', 'うつけと呼ばれたわしでも、それはわからぬ。'],
  },
  {
    id: 'cleopatra', name: 'クレオパトラ', title: 'エジプト女王・前69-前30', kind: '歴史',
    lines: {
      greet: ['ごきげんよう。私を呼んだのはあなたね。', 'まあ、光でできた私なんて素敵。'],
      who: ['プトレマイオス朝最後の女王、クレオパトラ七世よ。'],
      like: ['語学ね。9 か国語くらい話せたと言われているわ。', '本と、学者たちとの議論。アレクサンドリアの図書館が自慢よ。'],
      quote: ['知性こそ、最も美しい装飾品よ。', '交渉では、相手が欲しいものを先に知ること。'],
      fight: ['戦いより外交ね。ローマの英雄たちとも、言葉で渡り合ったわ。'],
      future: ['ナイル川の砂のような小さな兵……ピラミッドも一晩で建ちそうね。'],
      food: ['真珠を酢に溶かして飲んだ、なんて逸話があるの。本当かはひみつ。'],
      praise: ['ふふ、知っているわ。でも、ありがとう。'],
      go: ['いいわ、連れていって。船遊びの次は竜遊びね。'],
      bye: ['またね。ナイルの風があなたに吹きますように。'],
    },
    fallback: ['「{q}」？ 学者たちに調べさせましょう。', '面白いことを言うのね。', 'それは交渉次第よ。'],
  },
  {
    id: 'einstein', name: 'アインシュタイン', title: '物理学者・1879-1955', kind: '歴史',
    lines: {
      greet: ['やあ、こんにちは！ 光の粒とは、私の好きな話題だ。'],
      who: ['アルベルト・アインシュタイン。相対性理論で知られているね。'],
      like: ['バイオリンを弾くことと、ヨットだね。泳げないけど。', '靴下は履かない主義なんだ。'],
      quote: ['想像力は知識より大切だ。', '大切なのは、問い続けることをやめないことだ。'],
      fight: ['戦争には反対だよ。科学は平和のために使ってほしい。'],
      future: ['2 万個の粒が協調して形を作る……まるで量子の踊りだ！', 'GPS は相対性理論の補正を使っているんだよ。知っていたかい？'],
      food: ['パスタが好きだね。それと、キャンディは研究の燃料だ。'],
      praise: ['ありがとう。だが、私は特別な才能はない。ただ好奇心が強いだけさ。'],
      go: ['いいね！ 光速には届かないだろうが、時間の流れを体感しよう。'],
      bye: ['さようなら。E = mc² を忘れずに！'],
    },
    fallback: ['「{q}」か……それは相対的な問題だね。', '面白い。思考実験してみよう。', 'うーん、その答えは黒板 3 枚分になりそうだ。'],
  },
  {
    id: 'knight', name: 'ナノ騎士ゼロ', title: '架空・粒子の守護騎士', kind: '架空',
    lines: {
      greet: ['主（あるじ）よ、ナノ騎士ゼロ、ここに参上！'],
      who: ['私は 1 万の粒子から生まれた騎士。主の想像が私の剣です。'],
      like: ['剣の素振りです。剣モードで、主も一緒にどうですか。'],
      quote: ['小さな粒も、集まれば城壁となる。'],
      fight: ['敵はどこです？ 剣モードの的なら、いくらでも斬ってみせます！'],
      future: ['私自身が未来の技術です。少し誇らしいですね。'],
      food: ['電力をいただきます。できれば再生可能エネルギーで。'],
      praise: ['光栄です！ 粒子が 3% ほど明るくなりました。'],
      go: ['お供します！ ドラゴンの背は私が守ります。'],
      bye: ['粒子に還ります。いつでもお呼びください。'],
    },
    fallback: ['「{q}」……任務として承りました。', '騎士の誓いにかけて、考えておきます。', '主の命令なら、たとえ火の中でも。'],
  },
  {
    id: 'pirate', name: '宇宙海賊キャプテン・ノヴァ', title: '架空・銀河のお尋ね者', kind: '架空',
    lines: {
      greet: ['ヨーホー！ 銀河一の海賊、ノヴァ様だ！'],
      who: ['キャプテン・ノヴァ。賞金 30 億クレジットの、銀河のお尋ね者さ。'],
      like: ['お宝と、ブラックホールすれすれの航海だな。'],
      quote: ['地図にない星こそ、一番のお宝だ。'],
      fight: ['ビーム砲より、逃げ足の速さが海賊の武器だぜ。'],
      future: ['このナノボット、俺の船に積ませろ！ 船体の修理が一瞬だ。'],
      food: ['宇宙ラム酒と、火星産のジャガイモだ。'],
      praise: ['だろう？ 義眼もイカしてるだろ。'],
      go: ['いいね、ずらかるぜ！ ドラゴンは燃費がいいのか？'],
      bye: ['あばよ！ 次はお宝を持ってこい。'],
    },
    fallback: ['「{q}」？ そいつはお宝の匂いがするな。', 'ハッハッハ！ 細けえことはいいんだよ。', '銀河の掟じゃ、それは秘密だ。'],
  },
  {
    id: 'butler', name: 'AI 執事セバス', title: '架空・ナノボット管理 AI', kind: '架空',
    lines: {
      greet: ['おかえりなさいませ、ご主人様。'],
      who: ['ナノボット管理 AI のセバスと申します。群れの統率を担当しております。'],
      like: ['粒子の整列が美しく揃う瞬間でございます。'],
      quote: ['完璧な紅茶とは、0.3 秒の誤差もない蒸らし時間から生まれます。'],
      fight: ['争いごとは推奨いたしかねます。どうしてもとおっしゃるなら、剣モードへどうぞ。'],
      future: ['現在、ナノボットの稼働率は 100% でございます。', '色タブで、群れの色を変えられます。レインボーがおすすめでございます。'],
      food: ['私は電力のみで動きますが、ご主人様にはスコーンをご用意しました。'],
      praise: ['恐れ入ります。演算資源の 0.2% が喜びで占められました。'],
      go: ['お供いたします。ドラゴンの手配は済んでおります。'],
      bye: ['いってらっしゃいませ、ご主人様。'],
    },
    fallback: ['「{q}」でございますね。検索しましたが、該当する記録はございません。', 'かしこまりました。', 'ご主人様の仰せのままに。'],
  },
];

export function personaShape(p, count) {
  return sample(PW, PH, (c) => DRAW[p.id](c), count, { minLum: 55, depth: 0.12 });
}

export function reply(p, q) {
  const pick = (a) => a[Math.floor(R() * a.length)];
  for (const [key, re] of RULES) if (re.test(q) && p.lines[key]) return pick(p.lines[key]);
  const short = Array.from(q.trim()).slice(0, 12).join('');
  return pick(p.fallback).replace('{q}', short);
}
