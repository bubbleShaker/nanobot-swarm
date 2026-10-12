// PV 撮影用の台本（?pv=1 のときだけ読み込む）。実際の UI をクリック・入力して進める
import { sfx } from './audio.js';

const NS = window.NS;
const { sw, st, ptr, modes } = NS;
const $ = (s) => document.querySelector(s);
const events = [];
const ev = (name, extra) => events.push([+st.t.toFixed(3), name, extra ?? null]);

// 効果音は鳴らさず、時刻を記録して後で合成する
let lastWhoosh = -1;
sfx.whoosh = () => { if (st.t - lastWhoosh > 0.12) { lastWhoosh = st.t; ev('whoosh'); } };
for (const k of ['tick', 'blip', 'slash', 'crunch', 'fire', 'summon']) sfx[k] = () => ev(k);

// 字幕とタップの波紋
const style = document.createElement('style');
style.textContent = `
  body.pv *, body.pv *::after { transition: none !important; }
  body.pv #label, body.pv #hint, body.pv #toast { display: none; }
  body.pv #tabs button { min-width: 0; }
  #pvcap { position: fixed; left: 0; right: 0; top: 92px; text-align: center; z-index: 9; pointer-events: none;
    font: 900 34px/1.25 "Noto Sans CJK JP", sans-serif; color: #fff; letter-spacing: .02em;
    text-shadow: 0 0 18px rgba(0,240,255,.9), 0 3px 0 rgba(0,0,0,.6); padding: 0 18px; }
  #pvcap small { display: block; font-size: 17px; font-weight: 700; color: #9feaff; margin-top: 4px; }
  #pvcap em { font-style: normal; color: #ff5fe0; text-shadow: 0 0 18px rgba(255,79,216,.9), 0 3px 0 rgba(0,0,0,.6); }
  #pvtap { position: fixed; z-index: 10; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%;
    border: 3px solid rgba(255,255,255,.9); background: rgba(255,255,255,.25); pointer-events: none; opacity: 0; }
  #pvend { position: fixed; inset: 0; z-index: 11; display: none; flex-direction: column; align-items: center; justify-content: center;
    background: rgba(3,4,10,.0); text-align: center; color: #fff; font: 900 30px/1.35 "Noto Sans CJK JP", sans-serif; }
  #pvend .url { margin-top: 18px; font: 700 19px Orbitron, sans-serif; color: #00f0ff; background: rgba(0,240,255,.12);
    border: 2px solid rgba(0,240,255,.6); border-radius: 14px; padding: 10px 16px; text-shadow: 0 0 12px rgba(0,240,255,.8); }
  #pvend .sub { font-size: 18px; color: #c9d6e6; margin-top: 10px; font-weight: 700; }
`;
document.head.appendChild(style);
const cap = Object.assign(document.createElement('div'), { id: 'pvcap' });
const tap = Object.assign(document.createElement('div'), { id: 'pvtap' });
const end = Object.assign(document.createElement('div'), { id: 'pvend' });
document.body.append(cap, tap, end);
let capT = -9, tapT = -9;
function caption(html) { cap.innerHTML = html; capT = st.t; ev('cap'); }
function tapAt(x, y) { tap.style.left = `${x}px`; tap.style.top = `${y}px`; tapT = st.t; }
function click(sel) {
  const el = typeof sel === 'string' ? $(sel) : sel;
  el.scrollIntoView?.({ block: 'nearest', inline: 'center' });
  const r = el.getBoundingClientRect();
  tapAt(r.left + r.width / 2, r.top + r.height / 2);
  el.click();
}
function typeInto(sel, text, t0, dur, cues) {
  const chars = Array.from(text);
  chars.forEach((_, i) => cues.push([t0 + (dur * i) / chars.length, () => {
    const el = $(sel); el.value = chars.slice(0, i + 1).join('');
    el.dispatchEvent(new Event('input', { bubbles: true })); ev('type');
  }]));
}
const tab = (name) => () => click(`[data-tab=${name}]`);
const A = () => NS.area;

// ---------- 台本 ----------
const cues = [];
const tracks = []; // [t0, t1, fn(u, t)]
const C = (t, fn) => cues.push([t, fn]);

// 0〜2s つかみ：文字がその場で群れになる
C(0.0, () => { $('#txt').value = ''; NS.setMode('text'); sw.setCount(16000, NS.W / 2, A().y + A().h / 2); ev('boom'); });
typeInto('#txt', 'これ全部 ナノボット', 0.15, 0.9, cues);
C(0.6, () => caption('この光、<em>全部ロボット</em>'));
// 2〜4s 数
C(2.1, () => { click('[data-tab=count]'); });
C(2.4, () => { click('#count-chips .chip:nth-child(1)'); caption('500体から…'); });
C(3.2, () => { click('#count-chips .chip:nth-child(5)'); caption('<em>20,000体</em>に'); ev('boom'); });
// 4〜6s 色
C(4.3, () => click('[data-tab=color]'));
C(4.5, () => { click('#color-modes .chip:nth-child(4)'); caption('色も一瞬で'); });
C(5.1, () => click('#swatches .swatch:nth-child(2)'));
C(5.5, () => click('#swatches .swatch:nth-child(3)'));
C(5.9, () => click('#color-modes .chip:nth-child(1)'));
// 6〜10.5s 剣
C(6.1, () => click('[data-tab=text]'));
typeInto('#txt', '剣になれ', 6.3, 0.5, cues);
C(7.0, () => { click('[data-tab=sword]'); caption('<em>剣</em>にもなる'); });
C(7.6, () => {
  const a = A(), sm = modes.sword, len = 590 * sw.main.scale;
  const y = a.y + a.h * 0.8 - len * 0.62;
  sm.blocks = [0.2, 0.5, 0.8].map((fx, i) => ({ x: a.x + a.w * fx, y: y + (i - 1) * 12, s: 46, vx: 0, vy: 0, rot: i, vr: 0.8, hue: [190, 320, 50][i], fade: 1 }));
  ptr.active = true;
});
tracks.push([7.0, 10.6, (u, t) => {
  const a = A();
  const k = t < 8.0 ? 0 : (t - 8.0) / 0.7;
  const ph = Math.floor(k), f = k - ph;
  const e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
  const from = ph % 2 === 0 ? 0.12 : 0.88, to = ph % 2 === 0 ? 0.88 : 0.12;
  ptr.x = t < 8.0 ? a.x + a.w * (0.5 - (t - 7.0) * 0.38) : a.x + a.w * (from + (to - from) * e);
  ptr.y = a.y + a.h * 0.8 + Math.sin(f * Math.PI) * 10;
}]);
C(9.3, () => { modes.sword.spawn(); modes.sword.spawn(); });
// 10.6〜15s ドラゴン
C(10.6, () => { click('[data-tab=vehicle]'); caption('<em>ドラゴン</em>に乗って'); modes.vehicle.v.x = A().x + A().w * 0.3; });
const keys = (o) => () => { for (const k of ['arrowleft', 'arrowright', 'arrowup', 'arrowdown']) st.keys[k] = false; Object.assign(st.keys, o); };
C(10.9, keys({ arrowright: true }));
C(11.9, keys({ arrowright: true, arrowup: true }));
C(12.4, () => { click('#breath'); caption('火も吹ける🔥'); });
C(12.6, keys({ arrowleft: true }));
C(13.6, keys({ arrowleft: true, arrowdown: true }));
C(14.1, keys({ arrowright: true }));
C(14.4, () => click('#breath'));
C(14.9, keys({}));
// 15〜19.5s 動物
C(15.1, () => { click('[data-tab=animal]'); click('#animals .chip:nth-child(3)'); caption('動物を走らせたり'); const a = modes.animal.a; a.x = A().x + A().w * 0.2; a.y = A().y + A().h * 0.62; a.tx = A().x + A().w * 0.8; a.ty = a.y; a.wait = 9; });
C(16.4, () => { const a = modes.animal.a; a.tx = A().x + A().w * 0.25; a.ty = A().y + A().h * 0.55; });
C(17.5, () => { click('#animals .chip:nth-child(6)'); caption('空を<em>飛ばせたり</em>'); const a = modes.animal.a; a.tx = A().x + A().w * 0.7; a.ty = A().y + A().h * 0.35; a.wait = 9; });
// 19.5〜24s お絵描き
C(19.5, () => { click('[data-tab=draw]'); caption('描いた絵が…'); });
C(19.7, () => click('#brushes .swatch:nth-child(2)'));
C(19.8, () => click('#thick'));
const heart = (u) => {
  const a = A(), th = u * Math.PI * 2, s = Math.min(a.w, a.h) * 0.024;
  return [a.x + a.w / 2 + 16 * Math.pow(Math.sin(th), 3) * s, a.y + a.h * 0.47 - (13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th)) * s];
};
C(20.0, () => { [ptr.x, ptr.y] = heart(0); ptr.sx = ptr.x; ptr.sy = ptr.y; ptr.down = true; modes.draw.down(); });
tracks.push([20.0, 21.6, (u) => { [ptr.x, ptr.y] = heart(u); modes.draw.move(); }]);
C(21.62, () => { ptr.down = false; modes.draw.up(); });
C(21.7, () => click('#brushes .swatch:nth-child(3)'));
const star = (u) => {
  const a = A(), k = Math.floor(u * 5), f = u * 5 - k;
  const P = (j) => { const ang = -Math.PI / 2 + (j * 4 * Math.PI) / 5; return [a.x + a.w / 2 + Math.cos(ang) * 34, a.y + a.h * 0.47 - 6 + Math.sin(ang) * 34]; };
  const p0 = P(k), p1 = P(k + 1);
  return [p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f];
};
C(21.8, () => { [ptr.x, ptr.y] = star(0); ptr.down = true; modes.draw.down(); });
tracks.push([21.8, 22.6, (u) => { [ptr.x, ptr.y] = star(u); modes.draw.move(); }]);
C(22.62, () => { ptr.down = false; modes.draw.up(); });
C(22.9, () => { click('#freeze'); caption('<em>立体</em>になって浮かぶ'); });
// 24.3〜29s 名画
C(24.3, () => { click('[data-tab=art]'); click('#arts .chip:nth-child(1)'); caption('名画も再現<small>ゴッホ《星月夜》</small>'); });
C(26.7, () => { click('#arts .chip:nth-child(2)'); caption('名画も再現<small>ダ・ヴィンチ《モナ・リザ》</small>'); });
// 29.2〜36.6s 召喚
C(29.2, () => { click('[data-tab=summon]'); click('#personas .chip:nth-child(1)'); caption('<em>ナポレオン</em>を召喚'); });
typeInto('#ask', '名言を教えて', 30.6, 0.8, cues);
C(31.6, () => { const f = $('#chat'); tapAt(f.querySelector('.send').getBoundingClientRect().left + 25, f.getBoundingClientRect().top + 20); f.requestSubmit(); cap.innerHTML = ''; });
C(33.6, () => { click('#takeout'); caption('<em>連れ出せる</em>'); });
C(34.0, keys({ arrowright: true }));
C(35.0, keys({ arrowright: true, arrowup: true }));
C(35.5, () => click('#breath'));
C(35.6, keys({ arrowleft: true }));
C(36.5, keys({}));
// 36.8〜41s 締め
C(36.8, () => { click('#comp-chip'); click('[data-tab=color]'); click('#color-modes .chip:nth-child(4)'); });
C(37.0, () => { click('[data-tab=text]'); $('#txt').value = ''; });
typeInto('#txt', 'あなたなら 何を作る？', 37.1, 1.1, cues);
C(37.3, () => caption('あなたなら<em>何を作る？</em>'));
C(38.6, () => {
  end.style.display = 'flex';
  end.innerHTML = '<div style="margin-top:46vh">ブラウザで<em style="font-style:normal;color:#ff5fe0">無料</em>で遊べる</div><div class="url">bubbleshaker.github.io/nanobot-swarm</div><div class="sub">PC・スマホ対応／リンクは説明欄</div>';
  cap.innerHTML = ''; ev('end');
});

cues.sort((a, b) => a[0] - b[0]);
let ci = 0;
window.__director = (t) => {
  while (ci < cues.length && cues[ci][0] <= t) cues[ci++][1]();
  for (const [t0, t1, fn] of tracks) if (t >= t0 && t <= t1) fn((t - t0) / (t1 - t0), t);
  const ca = t - capT;
  const sc = ca < 0.12 ? 0.7 + (ca / 0.12) * 0.42 : ca < 0.2 ? 1.12 - ((ca - 0.12) / 0.08) * 0.12 : 1;
  cap.style.transform = `scale(${sc})`;
  const ta = t - tapT;
  tap.style.opacity = ta < 0.35 ? String(1 - ta / 0.35) : '0';
  tap.style.transform = `scale(${0.6 + ta * 2.2})`;
  if (end.style.display === 'flex') end.style.background = `rgba(3,4,10,${Math.min(0.55, (t - 38.6) * 1.2)})`;
};
window.__pv.total = 41.5;
window.__pv.events = events;
