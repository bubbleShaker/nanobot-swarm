import { Swarm, Renderer, R, rng, mulberry32 } from './swarm.js';
import { textShape, emojiShape, swordShape, imageShape, strokesShape } from './shapes.js';
import { PERSONAS, personaShape, reply } from './personas.js';
import { sfx } from './audio.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const PV = new URLSearchParams(location.search).has('pv');
if (PV) { rng.f = mulberry32(20261012); document.body.classList.add('pv'); }
const coarse = matchMedia('(pointer: coarse)').matches;
const MAX = coarse ? 12000 : 20000;

const sw = new Swarm(MAX);
const rd = new Renderer($('#stage'));
const cv = $('#stage');
let W = 0, H = 0, S = 1;
const area = { x: 0, y: 0, w: 1, h: 1 };
const ptr = { x: 0, y: 0, sx: 0, sy: 0, down: false, active: false };
const st = { mode: 'text', t: 0, keys: {}, spin3d: false, scroll: 0, breath: 0, compP: null, compTalk: 6 };
const M = sw.main;

// ---------- 共通 ----------
function measure() {
  const top = $('#top').getBoundingClientRect().bottom;
  const dockTop = $('#dock').getBoundingClientRect().top;
  document.documentElement.style.setProperty('--dock-h', `${H - dockTop}px`);
  area.x = 12; area.w = W - 24;
  area.y = top + 26; area.h = Math.max(80, dockTop - area.y - 34);
}
function mainArea() {
  if (sw.comp && st.mode !== 'vehicle') return { x: area.x, y: area.y, w: area.w * 0.7, h: area.h };
  return area;
}
function resetLayer(L) { L.rot = 0; L.baseRot = 0; L.flip = 1; L.deform = null; L.spin = st.spin3d; L.spinA = 0; }
function fit(L, frac = 0.88, a = mainArea()) {
  const s = L.shape;
  if (!s) { sw.cx = a.x + a.w / 2; sw.cy = a.y + a.h / 2; return; }
  L.scale = Math.min((a.w * frac) / s.w, (a.h * frac) / s.h);
  L.x = a.x + a.w / 2 + s.ox * L.scale;
  L.y = a.y + a.h / 2 + s.oy * L.scale;
}
function setMain(shape) {
  resetLayer(M);
  M.shape = shape;
  sfx.whoosh();
}
let toastT = 0;
function toast(msg, sec = 2.2) { const el = $('#toast'); el.textContent = msg; el.classList.add('show'); toastT = sec; }
function label(html) { $('#label').innerHTML = html || ''; }
function hint(s) { $('#hint').textContent = s || ''; }
const bub = { text: '', t: 0, anchor: 'main' };
function say(text, anchor = 'main', sec = 5) { bub.text = text; bub.t = sec; bub.anchor = anchor; $('#bubble').textContent = text; }
function setColorMode(m) {
  sw.colorMode = m;
  $$('#color-modes .chip').forEach((b) => b.classList.toggle('on', b.dataset.m === m));
}
function chipList(el, items, onClick) {
  el.innerHTML = '';
  for (const it of items) {
    const b = document.createElement('button');
    b.className = 'chip'; b.innerHTML = it.html; b.dataset.id = it.id;
    b.onclick = () => { sfx.init(); el.querySelectorAll('.chip').forEach((x) => x.classList.remove('on')); b.classList.add('on'); onClick(it); };
    el.appendChild(b);
  }
}
let setN = () => {};
// 名画や人物は粒子が少ないと判別しにくいので、少なければ増やす
function ensureDense() {
  const want = Math.min(MAX, 9000);
  if (sw.n < want * 0.8) { setN(want); toast(`ナノボットを ${want.toLocaleString()} 体に増員！`, 1.6); }
}
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// ---------- モード ----------
const modes = {};

modes.text = {
  enter() { this.build(); hint(''); label(''); },
  build() {
    const v = $('#txt').value;
    if (!v.trim()) { M.shape = null; fit(M); return; }
    const a = mainArea();
    const perLine = Math.max(4.6, Math.min(8, (a.w / a.h) * 6));
    setMain(textShape(v, MAX, { maxW: 150 * perLine }));
    fit(M, 0.9);
  },
  layout() { fit(M, 0.9); },
};

const VEHICLES = [
  { id: 'dragon', ch: '🐉', name: 'ドラゴン', left: true, rot: 0, size: 0.5 },
  { id: 'car', ch: '🏎️', name: 'レースカー', left: true, rot: 0, size: 0.42 },
  { id: 'rocket', ch: '🚀', name: 'ロケット', left: false, rot: Math.PI / 4, size: 0.42 },
  { id: 'ufo', ch: '🛸', name: 'UFO', left: false, rot: 0, size: 0.4 },
  { id: 'heli', ch: '🚁', name: 'ヘリ', left: true, rot: 0, size: 0.42 },
];
const STARS = Array.from({ length: 140 }, () => ({ x: R(), y: R(), d: 0.15 + R() * 0.85 }));
modes.vehicle = {
  kind: VEHICLES[0], v: { x: 0, y: 0, vx: 0, vy: 0, face: 1, init: false },
  enter() {
    const v = this.v;
    if (!v.init) { v.x = area.x + area.w / 2; v.y = area.y + area.h / 2; v.init = true; }
    setMain(emojiShape(this.kind.ch, MAX));
    if (sw.colorMode !== 'source') setColorMode('source');
    this.layout();
    label(`<b>${this.kind.name}</b>`);
    hint(coarse ? 'ドラッグで操縦／🔥で噴射' : 'WASD・矢印キー・ドラッグで操縦／Space で噴射');
  },
  layout() {
    const s = M.shape; if (!s) return;
    M.scale = (Math.min(area.w, area.h * 1.3) * this.kind.size) / s.w;
    M.baseRot = this.kind.rot;
  },
  input() {
    let ix = 0, iy = 0;
    const k = st.keys;
    if (k.arrowleft || k.a) ix -= 1; if (k.arrowright || k.d) ix += 1;
    if (k.arrowup || k.w) iy -= 1; if (k.arrowdown || k.s) iy += 1;
    if (ptr.down) {
      ix += Math.max(-1, Math.min(1, (ptr.x - ptr.sx) / 60));
      iy += Math.max(-1, Math.min(1, (ptr.y - ptr.sy) / 60));
    }
    return [Math.max(-1, Math.min(1, ix)), Math.max(-1, Math.min(1, iy))];
  },
  update(dt, t) {
    const v = this.v, s = M.shape; if (!s) return;
    const [ix, iy] = this.input();
    v.vx += ix * 1500 * dt; v.vy += iy * 1500 * dt;
    const dmp = Math.exp(-1.6 * dt); v.vx *= dmp; v.vy *= dmp;
    const sp = Math.hypot(v.vx, v.vy);
    if (sp > 620) { v.vx *= 620 / sp; v.vy *= 620 / sp; }
    v.x += v.vx * dt; v.y += v.vy * dt;
    const hw = s.w * M.scale * 0.35, hh = s.h * M.scale * 0.35;
    if (v.x < area.x + hw) { v.x = area.x + hw; v.vx = Math.abs(v.vx) * 0.3; }
    if (v.x > area.x + area.w - hw) { v.x = area.x + area.w - hw; v.vx = -Math.abs(v.vx) * 0.3; }
    if (v.y < area.y + hh) { v.y = area.y + hh; v.vy = Math.abs(v.vy) * 0.3; }
    if (v.y > area.y + area.h - hh) { v.y = area.y + area.h - hh; v.vy = -Math.abs(v.vy) * 0.3; }
    if (v.vx > 40) v.face = 1; else if (v.vx < -40) v.face = -1;
    M.flip = (this.kind.left ? -1 : 1) * v.face;
    const tilt = Math.max(-0.45, Math.min(0.45, v.vy * 0.0011)) * v.face;
    M.rot += (tilt - M.rot) * Math.min(1, dt * 6);
    M.x = v.x; M.y = v.y + Math.sin(t * 3) * 5;
    st.scroll += (v.vx + v.face * 60) * dt;
    // 排気
    const n = sw.n, nc = sw.compCount();
    const rate = (0.03 + (sp / 620) * 0.14) * n * dt;
    const tx = M.x - v.face * s.w * 0.4 * M.scale, ty = M.y + s.h * 0.05 * M.scale;
    for (let e = 0; e < rate; e++) {
      const i = nc + ((R() * (n - nc)) | 0);
      if (sw.free[i]) continue;
      sw.emit(i, tx + (R() - 0.5) * 16, ty + (R() - 0.5) * 16, -v.face * (120 + R() * 260) + v.vx * 0.2, (R() - 0.5) * 120, 0.25 + R() * 0.45);
    }
    if (st.breath > 0) {
      st.breath -= dt;
      const hx = M.x + v.face * s.w * 0.42 * M.scale, hy = M.y - s.h * 0.12 * M.scale;
      const br = n * 0.5 * dt;
      for (let e = 0; e < br; e++) {
        const i = nc + ((R() * (n - nc)) | 0);
        if (sw.free[i]) continue;
        sw.emit(i, hx, hy, v.face * (450 + R() * 500) + v.vx, (R() - 0.5) * 220 + v.vy * 0.5, 0.5 + R() * 0.5);
      }
    }
  },
  bg(c) {
    for (const s of STARS) {
      const x = (((s.x * W * 1.2 - st.scroll * s.d * 0.6) % (W * 1.2)) + W * 1.2) % (W * 1.2) - W * 0.1;
      c.fillStyle = `rgba(180,220,255,${0.25 + s.d * 0.5})`;
      c.fillRect(x, s.y * H, 1 + s.d * 1.5, 1 + s.d * 1.5);
    }
    const hills = [[0.35, 'rgba(30,40,90,0.55)', 0.0035, 60], [0.7, 'rgba(20,28,60,0.8)', 0.006, 40]];
    const base = area.y + area.h;
    for (const [d, col, f, amp] of hills) {
      c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W + 20; x += 20) {
        const wx = x + st.scroll * d;
        c.lineTo(x, base - amp - Math.sin(wx * f) * amp - Math.sin(wx * f * 2.7) * amp * 0.4);
      }
      c.lineTo(W, H); c.fill();
    }
  },
  overlay(c) {
    if (!ptr.down) return;
    c.strokeStyle = 'rgba(0,240,255,0.35)'; c.lineWidth = 2;
    c.beginPath(); c.arc(ptr.sx, ptr.sy, 60, 0, 7); c.stroke();
    const dx = Math.max(-60, Math.min(60, ptr.x - ptr.sx)), dy = Math.max(-60, Math.min(60, ptr.y - ptr.sy));
    c.fillStyle = 'rgba(0,240,255,0.35)'; c.beginPath(); c.arc(ptr.sx + dx, ptr.sy + dy, 22, 0, 7); c.fill();
  },
};

modes.sword = {
  hx: 0, hy: 0, svx: 0, tip: [0, 0], trail: [], blocks: [], debris: [], score: 0, hueIdx: 0,
  enter() {
    setMain(swordShape(MAX));
    this.layout();
    this.hx = area.x + area.w / 2; this.hy = area.y + area.h * 0.78;
    this.trail = [];
    while (this.blocks.length < 5) this.spawn();
    label(''); hint(coarse ? 'スワイプで剣を振って、ブロックを斬ろう' : 'マウスを動かして剣を振り、ブロックを斬ろう');
  },
  layout() { M.scale = Math.min(area.h * 0.62, area.w * 0.9) / 720; },
  spawn() {
    const s = Math.max(30, Math.min(area.w, area.h) * 0.09);
    this.blocks.push({ x: area.x + s + R() * (area.w - 2 * s), y: area.y + s + R() * (area.h * 0.6), s, vx: (R() - 0.5) * 40, vy: (R() - 0.5) * 40, rot: R() * 3, vr: (R() - 0.5) * 1.5, hue: (R() * 360) | 0, fade: 0 });
  },
  update(dt, t) {
    let px = ptr.x, py = ptr.y;
    if (!ptr.active) { px = area.x + area.w / 2 + Math.sin(t * 1.4) * area.w * 0.15; py = area.y + area.h * 0.72; }
    const ox = this.hx;
    this.hx += (px - this.hx) * Math.min(1, dt * 22);
    this.hy += (py - this.hy) * Math.min(1, dt * 22);
    const vx = (this.hx - ox) / dt;
    this.svx += (vx - this.svx) * Math.min(1, dt * 15);
    const target = Math.max(-2.1, Math.min(2.1, this.svx * 0.0026));
    M.rot += (target - M.rot) * Math.min(1, dt * 14);
    M.x = this.hx; M.y = this.hy;
    const len = 590 * M.scale;
    const tip = [this.hx + Math.sin(M.rot) * len, this.hy - Math.cos(M.rot) * len];
    const mid = [this.hx + Math.sin(M.rot) * len * 0.25, this.hy - Math.cos(M.rot) * len * 0.25];
    const speed = Math.hypot(tip[0] - this.tip[0], tip[1] - this.tip[1]) / dt;
    this.tip = tip;
    this.trail.push({ a: mid, b: tip, t });
    while (this.trail.length && t - this.trail[0].t > 0.16) this.trail.shift();
    if (speed > 900 && (this._sl ?? 0) < t) { sfx.slash(); this._sl = t + 0.25; }
    for (const b of this.blocks) {
      b.fade = Math.min(1, b.fade + dt * 2);
      b.x += b.vx * dt; b.y += b.vy * dt + Math.sin(t * 1.5 + b.hue) * 8 * dt; b.rot += b.vr * dt;
      if (b.x < area.x + b.s || b.x > area.x + area.w - b.s) b.vx *= -1;
      if (b.y < area.y + b.s || b.y > area.y + area.h - b.s) b.vy *= -1;
      if (speed > 500 && b.fade > 0.6 && segDist(b.x, b.y, mid, tip) < b.s * 0.8) this.slice(b, tip);
    }
    this.blocks = this.blocks.filter((b) => !b.dead);
    if (this.blocks.length < 4 && (this._sp ?? 0) < t) { this.spawn(); this._sp = t + 0.6; }
    for (const d of this.debris) { d.life -= dt; d.vy += 700 * dt; d.x += d.vx * dt; d.y += d.vy * dt; }
    this.debris = this.debris.filter((d) => d.life > 0);
  },
  slice(b, tip) {
    b.dead = true; this.score++;
    $('#score').textContent = `斬ったブロック ${this.score}`;
    sfx.crunch();
    const ang = M.rot;
    for (let k = 0; k < 90; k++) {
      const side = k % 2 ? 1 : -1;
      this.debris.push({
        x: b.x + (R() - 0.5) * b.s, y: b.y + (R() - 0.5) * b.s,
        vx: Math.cos(ang) * side * (150 + R() * 350) + (R() - 0.5) * 200, vy: Math.sin(ang) * side * 250 - R() * 350,
        life: 0.6 + R() * 0.7, hue: b.hue + (R() - 0.5) * 40, s: 2 + R() * 3,
      });
    }
  },
  overlay(c) {
    c.globalCompositeOperation = 'lighter';
    for (const b of this.blocks) {
      c.save(); c.translate(b.x, b.y); c.rotate(b.rot); c.globalAlpha = b.fade;
      c.fillStyle = `hsla(${b.hue},100%,60%,0.16)`; c.strokeStyle = `hsl(${b.hue},100%,65%)`; c.lineWidth = 2.5;
      c.shadowColor = `hsl(${b.hue},100%,60%)`; c.shadowBlur = 16;
      c.fillRect(-b.s / 2, -b.s / 2, b.s, b.s); c.strokeRect(-b.s / 2, -b.s / 2, b.s, b.s);
      c.restore();
    }
    const tr = this.trail;
    if (tr.length > 1) {
      const now = tr[tr.length - 1].t;
      for (let i = 1; i < tr.length; i++) {
        const p = tr[i - 1], q = tr[i];
        c.fillStyle = `rgba(120,240,255,${0.32 * (1 - (now - q.t) / 0.16)})`;
        c.beginPath(); c.moveTo(p.a[0], p.a[1]); c.lineTo(p.b[0], p.b[1]); c.lineTo(q.b[0], q.b[1]); c.lineTo(q.a[0], q.a[1]); c.fill();
      }
    }
    for (const d of this.debris) { c.fillStyle = `hsla(${d.hue},100%,65%,${Math.min(1, d.life * 1.5)})`; c.fillRect(d.x, d.y, d.s, d.s); }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  },
};
function segDist(x, y, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const u = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - a[0] - u * dx, y - a[1] - u * dy);
}

const ANIMALS = [
  { id: 'cat', ch: '🐈', name: 'ネコ', mo: 'walk' }, { id: 'dog', ch: '🐕', name: 'イヌ', mo: 'walk' },
  { id: 'horse', ch: '🐎', name: 'ウマ', mo: 'walk' }, { id: 'trex', ch: '🦖', name: 'ティラノ', mo: 'walk' },
  { id: 'elephant', ch: '🐘', name: 'ゾウ', mo: 'walk' }, { id: 'eagle', ch: '🦅', name: 'ワシ', mo: 'fly' },
  { id: 'butterfly', ch: '🦋', name: 'チョウ', mo: 'fly' }, { id: 'dolphin', ch: '🐬', name: 'イルカ', mo: 'swim' },
  { id: 'whale', ch: '🐋', name: 'クジラ', mo: 'swim' },
];
modes.animal = {
  kind: ANIMALS[0], a: { x: 0, y: 0, tx: 0, ty: 0, face: -1, wait: 0, mv: 0, init: false },
  enter() {
    const a = this.a;
    if (!a.init) { a.x = a.tx = area.x + area.w / 2; a.y = a.ty = area.y + area.h * 0.6; a.init = true; }
    setMain(emojiShape(this.kind.ch, MAX));
    if (sw.colorMode !== 'source') setColorMode('source');
    this.layout();
    const mo = this.kind.mo, self = this;
    M.deform = (lx, ly, p, t, out, s) => {
      const m = self.a.mv;
      if (mo === 'walk') {
        const legs = ly > s.h * 0.12;
        out.x = lx + (legs ? Math.sin(t * 13 + (lx > 0 ? 0 : Math.PI)) * s.h * 0.05 * m : 0);
        out.y = ly - Math.abs(Math.sin(t * 13)) * s.h * 0.03 * m;
      } else if (mo === 'fly') {
        const w = Math.abs(lx) / (s.w * 0.5);
        out.x = lx * (1 - 0.15 * Math.abs(Math.sin(t * 11))); out.y = ly + Math.sin(t * 11) * w * w * s.h * 0.3;
      } else { out.x = lx; out.y = ly + Math.sin(t * 6 - lx * 0.03) * s.h * 0.06 * (0.4 + m); }
    };
    label(`<b>${this.kind.name}</b>`);
    hint('タップした場所へ移動します');
  },
  layout() { const s = M.shape; if (s) M.scale = (Math.min(area.w * 0.5, area.h * 0.55)) / s.w; },
  down() { this.a.tx = ptr.x; this.a.ty = ptr.y; this.a.wait = 2.5; },
  update(dt, t) {
    const a = this.a, s = M.shape; if (!s) return;
    const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
    const sp = this.kind.mo === 'walk' ? 190 : 240;
    if (d > 6) {
      const step = Math.min(d, sp * dt);
      a.x += (dx / d) * step; a.y += (dy / d) * step;
      if (Math.abs(dx) > 8) a.face = dx > 0 ? 1 : -1;
      a.mv += (1 - a.mv) * Math.min(1, dt * 6);
    } else {
      a.mv += (0 - a.mv) * Math.min(1, dt * 4);
      a.wait -= dt;
      if (a.wait <= 0) {
        const hw = s.w * M.scale * 0.5, hh = s.h * M.scale * 0.5;
        a.tx = area.x + hw + R() * Math.max(1, area.w - 2 * hw);
        a.ty = area.y + hh + R() * Math.max(1, area.h - 2 * hh);
        a.wait = 0.6 + R() * 1.4;
      }
    }
    M.flip = -a.face;
    M.x = a.x; M.y = a.y;
  },
};

const BRUSH = ['#00f0ff', '#ff4fd8', '#ffd23f', '#7dff5a', '#ffffff', '#ff5a36', '#8f7bff'];
modes.draw = {
  strokes: [], color: BRUSH[0], width: 16, dirty: false, last: 0, frozen: false, cur: null,
  enter() { this.rebuild(); label(''); hint('指やマウスで描くと、ナノボットがなぞります'); },
  layout() { this.rebuild(); },
  rebuild() {
    this.dirty = false;
    const shp = this.strokes.length ? strokesShape(this.strokes, MAX, 0.5) : null;
    resetLayer(M);
    M.shape = shp;
    if (!shp) { fit(M); return; }
    M.x = shp.cx; M.y = shp.cy; M.scale = shp.scaleBack;
    M.spin = this.frozen || st.spin3d;
  },
  down() { this.cur = { color: this.color, width: this.width, pts: [[ptr.x, ptr.y]] }; this.strokes.push(this.cur); this.dirty = true; },
  move() {
    if (!this.cur) return;
    const l = this.cur.pts[this.cur.pts.length - 1];
    if (Math.hypot(ptr.x - l[0], ptr.y - l[1]) > 3) { this.cur.pts.push([ptr.x, ptr.y]); this.dirty = true; if (R() < 0.15) sfx.tick(); }
  },
  up() { this.cur = null; this.dirty = true; },
  update(dt, t) {
    if (this.dirty && t - this.last > 0.06) { this.last = t; const a = M.spinA; this.rebuild(); M.spinA = a; }
    if (M.shape && this.frozen) M.y = M.shape.cy + Math.sin(t * 1.6) * 14 - 20;
  },
  overlay(c) {
    if (!this.cur) return;
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = this.cur.width; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); this.cur.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
  },
};

const ARTS = [
  { id: 'starry', name: '星月夜', by: 'フィンセント・ファン・ゴッホ', year: 1889 },
  { id: 'mona', name: 'モナ・リザ', by: 'レオナルド・ダ・ヴィンチ', year: '1503-1519' },
  { id: 'wave', name: '神奈川沖浪裏', by: '葛飾北斎', year: '1831頃' },
  { id: 'pearl', name: '真珠の耳飾りの少女', by: 'ヨハネス・フェルメール', year: '1665頃' },
  { id: 'scream', name: '叫び', by: 'エドヴァルド・ムンク', year: 1893 },
];
const imgCache = {};
function loadImg(id) {
  if (!imgCache[id]) imgCache[id] = new Promise((ok, ng) => { const im = new Image(); im.onload = () => ok(im); im.onerror = ng; im.src = `assets/${id}.jpg`; });
  return imgCache[id];
}
modes.art = {
  cur: null,
  enter() { hint('名画を選ぶと、ナノボットが色ごと再現します'); if (this.cur) this.show(this.cur); else { label(''); M.shape = null; fit(M); } },
  layout() { fit(M, 0.94); },
  async show(a) {
    this.cur = a;
    const im = await loadImg(a.id);
    if (st.mode !== 'art' || this.cur !== a) return;
    setColorMode('source');
    if (!PV) ensureDense();
    sw.burst(M.x || W / 2, M.y || H / 2, 260);
    setMain(imageShape(im, MAX));
    fit(M, 0.94);
    label(`<b>${a.name}</b>${a.by}（${a.year}）`);
  },
};

modes.summon = {
  p: null,
  enter() {
    hint(''); if (this.p) this.show(this.p, true); else { label('呼び出したい人物を選んでください'); M.shape = null; fit(M); }
  },
  layout() { fit(M, 0.9); },
  show(p, quiet) {
    this.p = p;
    setColorMode('source');
    if (!PV && !quiet) ensureDense();
    setMain(personaShape(p, MAX));
    fit(M, 0.9);
    label(`<b>${p.name}</b>${p.title}`);
    if (!quiet) { sfx.summon(); sw.burst(M.x, M.y, 300); setTimeout(() => say(p.lines.greet[0]), PV ? 0 : 700); }
    $('#takeout').textContent = `🐉 ${p.name.split(/[・ ]/)[0]}を連れ出す`;
  },
  ask(q) {
    if (!this.p || !q.trim()) return;
    $('#you').textContent = `あなた：${q}`;
    say(reply(this.p, q));
    sfx.blip();
  },
};

function takeOut(p) {
  st.compP = p;
  const shp = personaShape(p, MAX);
  sw.comp = { shape: shp, x: M.x, y: M.y, scale: M.scale, rot: 0, baseRot: 0, flip: 1, spin: false, spinA: 0, deform: null };
  $('#comp-chip').hidden = false;
  $('#comp-chip').textContent = `同行: ${p.name.split(/[・ ]/)[0]} ✕`;
  modes.vehicle.kind = VEHICLES[0];
  setMode('vehicle');
  toast(`${p.name.split(/[・ ]/)[0]}をドラゴンに乗せた！`);
  say(reply(p, '一緒に行こう'), 'comp', 4);
}
function dismissComp() {
  sw.comp = null; st.compP = null; $('#comp-chip').hidden = true;
  modes[st.mode].layout?.();
}
function updateComp(dt, t) {
  const L = sw.comp; if (!L) return;
  const s = L.shape;
  let tx, ty, sc;
  if (st.mode === 'vehicle' && M.shape) {
    const v = modes.vehicle.v, vh = M.shape.h * M.scale;
    sc = (vh * 0.62) / s.h;
    tx = M.x - v.face * M.shape.w * M.scale * 0.06;
    ty = M.y - vh * 0.36;
  } else {
    sc = (area.h * 0.42) / s.h;
    tx = area.x + area.w - s.w * sc * 0.55;
    ty = area.y + area.h - s.h * sc * 0.55;
  }
  const k = Math.min(1, dt * 10);
  L.x += (tx - L.x) * k; L.y += (ty - L.y) * k; L.scale += (sc - L.scale) * k;
  st.compTalk -= dt;
  if (st.compTalk <= 0 && bub.t <= 0) {
    st.compTalk = 9 + R() * 6;
    say(reply(st.compP, R() < 0.5 ? '未来' : '一緒に行こう'), 'comp', 4);
  }
}

// ---------- 描画 ----------
function drawBg(c) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#05060d'); g.addColorStop(1, '#0b1226');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (st.mode === 'vehicle') { modes.vehicle.bg(c); return; }
  c.strokeStyle = 'rgba(80,140,255,0.06)'; c.lineWidth = 1;
  const gs = 40;
  c.beginPath();
  for (let x = (W / 2) % gs; x < W; x += gs) { c.moveTo(x, 0); c.lineTo(x, H); }
  for (let y = (H / 2) % gs; y < H; y += gs) { c.moveTo(0, y); c.lineTo(W, y); }
  c.stroke();
}
function drawOverlay(c) { modes[st.mode].overlay?.(c); }

function placeBubble() {
  const el = $('#bubble');
  if (bub.t <= 0) { el.classList.remove('show'); return; }
  const L = bub.anchor === 'comp' && sw.comp ? sw.comp : M;
  if (!L.shape) { el.classList.remove('show'); return; }
  const x = Math.max(150, Math.min(W - 150, L.x));
  const y = Math.max(90, L.y - L.shape.h * L.scale * 0.5 + (L.shape.oy || 0) * L.scale + 10);
  el.style.left = `${x}px`; el.style.top = `${y}px`;
  el.classList.add('show');
}

// ---------- ループ ----------
function step(dt) {
  st.t += dt;
  if (PV && window.__director) window.__director(st.t, dt);
  const m = modes[st.mode];
  m.update?.(dt, st.t);
  updateComp(dt, st.t);
  sw.update(dt, st.t);
  if (bub.t > 0) bub.t -= dt;
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('#toast').classList.remove('show'); }
}
let statT = 0;
// 粒子の間隔に合わせて点の大きさを変える（名画や人物が少ない粒子でも見えるように）
function dotSize() {
  const L = M, s = L.shape, base = Math.max(2, Math.round(S * 1.2));
  if (!s || !sw.n) return base;
  const k = st.mode === 'art' || st.mode === 'summon' ? 0.75 : 0.45;
  const spacing = Math.sqrt((s.w * s.h * L.scale * L.scale) / Math.max(1, sw.n - sw.compCount()));
  return Math.max(base, Math.min(Math.round(5 * S), Math.round(spacing * S * k)));
}
function render() {
  rd.ps = dotSize();
  rd.glow = st.mode === 'art' ? 0.35 : st.mode === 'summon' ? 0.6 : 1;
  rd.draw(sw, drawBg, drawOverlay);
  placeBubble();
  if (st.t - statT > 0.2) { statT = st.t; $('#cnt').textContent = sw.n.toLocaleString(); }
}

function resize() {
  W = innerWidth; H = innerHeight;
  S = Math.min(window.devicePixelRatio || 1, 2);
  const lim = coarse ? 2.2e6 : 4.2e6;
  if (W * H * S * S > lim) S = Math.sqrt(lim / (W * H));
  rd.resize(W, H, S);
  measure();
  modes[st.mode].layout?.();
}

function setMode(name) {
  st.mode = name;
  $$('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
  $$('#panels section').forEach((p) => p.classList.toggle('on', p.dataset.panel === name));
  measure();
  modes[name].enter();
}
function showTab(name) {
  if (modes[name]) { setMode(name); return; }
  $$('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
  $$('#panels section').forEach((p) => p.classList.toggle('on', p.dataset.panel === name));
  measure();
}

// ---------- UI ----------
function setupUI() {
  $$('#tabs button').forEach((b) => (b.onclick = () => { sfx.init(); sfx.blip(); showTab(b.dataset.tab); }));
  $('#mute').onclick = () => { sfx.init(); sfx.setMuted(!sfx.muted); $('#mute').textContent = sfx.muted ? '🔇' : '🔊'; };
  $('#comp-chip').onclick = dismissComp;

  const txt = $('#txt');
  txt.addEventListener('input', () => { if (st.mode !== 'text') setMode('text'); else modes.text.build(); });
  chipList($('#text-chips'), ['こんにちは', 'I ♥ NANO', '未来', '🔥', 'すごい！', '2026'].map((s) => ({ id: s, html: s })), (it) => { txt.value = it.id; modes.text.build(); });

  chipList($('#color-modes'), [
    { id: 'source', html: '元の色' }, { id: 'solid', html: '単色' }, { id: 'gradient', html: 'グラデーション' }, { id: 'rainbow', html: '🌈 レインボー' },
  ], (it) => setColorMode(it.id));
  setColorMode('source');
  const sws = $('#swatches');
  for (const c of ['#00e5ff', '#ff3fd8', '#ffc531', '#9dff3a', '#ffffff', '#ff5a1f', '#8f7bff']) {
    const b = document.createElement('button'); b.className = 'swatch'; b.style.background = c; b.style.color = c; b.dataset.c = c;
    b.onclick = () => { sfx.init(); sw.c1 = hex(c); $('#c1').value = c; setColorMode('solid'); sws.querySelectorAll('.swatch').forEach((x) => x.classList.toggle('on', x === b)); };
    sws.appendChild(b);
  }
  $('#c1').oninput = (e) => { sw.c1 = hex(e.target.value); if (sw.colorMode === 'source' || sw.colorMode === 'rainbow') setColorMode('solid'); };
  $('#c2').oninput = (e) => { sw.c2 = hex(e.target.value); setColorMode('gradient'); };

  const num = $('#num');
  num.max = MAX; num.value = sw.n;
  setN = (v) => {
    const c = M.shape ? [M.x, M.y] : [sw.cx, sw.cy];
    sw.setCount(v, c[0], c[1]); num.value = v; $('#num-out').textContent = (+v).toLocaleString();
    sfx.whoosh();
  };
  num.oninput = () => setN(+num.value);
  $('#num-out').textContent = sw.n.toLocaleString();
  chipList($('#count-chips'), [500, 2000, 5000, 10000, 20000].filter((v) => v <= MAX).map((v) => ({ id: v, html: v.toLocaleString() })), (it) => setN(it.id));
  $('#spin3d').onclick = () => {
    st.spin3d = !st.spin3d; M.spin = st.spin3d || (st.mode === 'draw' && modes.draw.frozen); M.spinA = 0;
    $('#spin3d').classList.toggle('on', st.spin3d);
  };
  $('#boom').onclick = () => { sfx.init(); sfx.crunch(); sw.burst(M.shape ? M.x : sw.cx, M.shape ? M.y : sw.cy, 1100); };

  chipList($('#vehicles'), VEHICLES.map((v) => ({ ...v, html: `${v.ch} ${v.name}` })), (it) => { modes.vehicle.kind = it; modes.vehicle.enter(); });
  $('#vehicles .chip').classList.add('on');
  $('#breath').onclick = () => { sfx.init(); sfx.fire(); st.breath = 0.8; };

  const SWC = [['#00f0ff', 'source'], ['#ff3fd8', 'solid'], ['#ffc531', 'solid'], ['#7dff5a', 'solid'], [null, 'rainbow']];
  $('#sword-color').onclick = () => {
    const sm = modes.sword; sm.hueIdx = (sm.hueIdx + 1) % SWC.length;
    const [c, m] = SWC[sm.hueIdx]; if (c) sw.c1 = hex(c); setColorMode(m); sfx.blip();
  };
  $('#more-blocks').onclick = () => { for (let i = 0; i < 3; i++) modes.sword.spawn(); sfx.blip(); };

  chipList($('#animals'), ANIMALS.map((a) => ({ ...a, html: `${a.ch} ${a.name}` })), (it) => { modes.animal.kind = it; modes.animal.enter(); });
  $('#animals .chip').classList.add('on');

  const br = $('#brushes');
  for (const c of BRUSH) {
    const b = document.createElement('button'); b.className = 'swatch'; b.style.background = c; b.style.color = c;
    b.onclick = () => { modes.draw.color = c; br.querySelectorAll('.swatch').forEach((x) => x.classList.toggle('on', x === b)); };
    br.appendChild(b);
  }
  br.firstChild.classList.add('on');
  const TH = [[8, '細'], [16, '中'], [30, '太']];
  let thi = 1;
  $('#thick').onclick = () => { thi = (thi + 1) % 3; modes.draw.width = TH[thi][0]; $('#thick').textContent = `🖌️ 太さ: ${TH[thi][1]}`; };
  $('#freeze').onclick = () => {
    const d = modes.draw; d.frozen = !d.frozen; $('#freeze').classList.toggle('on', d.frozen);
    if (st.mode === 'draw') { M.spin = d.frozen || st.spin3d; M.spinA = 0; if (!d.frozen && M.shape) M.y = M.shape.cy; sfx.whoosh(); }
  };
  $('#undo').onclick = () => { modes.draw.strokes.pop(); modes.draw.dirty = true; };
  $('#clear').onclick = () => { modes.draw.strokes = []; modes.draw.dirty = true; if (st.mode === 'draw') sw.burst(M.x, M.y, 400); };

  chipList($('#arts'), ARTS.map((a) => ({ ...a, html: a.name })), (it) => modes.art.show(it));
  ARTS.forEach((a) => loadImg(a.id).catch(() => {}));

  chipList($('#personas'), PERSONAS.map((p) => ({ ...p, html: `${p.kind === '架空' ? '✨' : '📜'} ${p.name}` })), (it) => modes.summon.show(it));
  $('#chat').onsubmit = (e) => { e.preventDefault(); const q = $('#ask').value; $('#ask').value = ''; modes.summon.ask(q); };
  $('#takeout').onclick = () => { if (modes.summon.p) takeOut(modes.summon.p); else toast('先に人物を召喚してください'); };

  cv.addEventListener('pointerdown', (e) => {
    sfx.init();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    cv.setPointerCapture?.(e.pointerId);
    ptr.down = true; ptr.active = true;
    ptr.x = ptr.sx = e.clientX; ptr.y = ptr.sy = e.clientY;
    modes[st.mode].down?.();
  });
  cv.addEventListener('pointermove', (e) => { ptr.x = e.clientX; ptr.y = e.clientY; if (e.pointerType === 'mouse') ptr.active = true; modes[st.mode].move?.(); });
  const up = () => { if (!ptr.down) return; ptr.down = false; modes[st.mode].up?.(); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    const k = e.key.toLowerCase();
    st.keys[k] = true;
    if (st.mode === 'vehicle' && (k === ' ' || k.startsWith('arrow'))) e.preventDefault();
    if (k === ' ' && st.mode === 'vehicle') { sfx.init(); if (st.breath <= 0) sfx.fire(); st.breath = 0.6; }
  });
  addEventListener('keyup', (e) => { st.keys[e.key.toLowerCase()] = false; });
  addEventListener('resize', resize);
}

// ---------- 起動 ----------
setupUI();
resize();
sw.setCount(PV ? 0 : coarse ? 5000 : 10000, W / 2, (area.y + area.h / 2));
$('#num').value = sw.n; $('#num-out').textContent = sw.n.toLocaleString();
setMode('text');

window.NS = { sw, st, ptr, modes, setMode, showTab, takeOut, say, toast, area, PERSONAS, VEHICLES, ANIMALS, ARTS, MAX, loadImg, setColorMode, get W() { return W; }, get H() { return H; } };

if (PV) {
  window.__pv = {
    seek(t) { while (st.t + 1e-6 < t) step(1 / 60); render(); },
    render,
  };
  import('./pv.js');
} else {
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    step(dt); render();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
