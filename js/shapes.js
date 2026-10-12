// オフスクリーン canvas に描いたものから、色付きの目標点を抜き出す
import { R } from './swarm.js';

export const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
export const JP_FONT = '"Hiragino Sans","Noto Sans JP","Noto Sans CJK JP","Yu Gothic","Meiryo",sans-serif,' + EMOJI_FONT;

const oc = document.createElement('canvas');
const ox = oc.getContext('2d', { willReadFrequently: true });
let idxBuf = new Int32Array(1);

export function sample(w, h, draw, count, opt = {}) {
  w = Math.max(1, Math.ceil(w)); h = Math.max(1, Math.ceil(h));
  oc.width = w; oc.height = h;
  ox.clearRect(0, 0, w, h);
  ox.save(); draw(ox, w, h); ox.restore();
  const d = ox.getImageData(0, 0, w, h).data;
  if (idxBuf.length < w * h) idxBuf = new Int32Array(w * h);
  const amin = opt.alphaMin ?? 110;
  let m = 0;
  for (let i = 0, q = 3; i < w * h; i++, q += 4) if (d[q] > amin) idxBuf[m++] = i;
  if (!m) return null;
  const pvx = opt.ox ?? w / 2, pvy = opt.oy ?? h / 2;
  const depth = (opt.depth ?? 0.14) * Math.max(w, h);
  const minLum = opt.minLum ?? 0;
  const x = new Float32Array(count), y = new Float32Array(count), z = new Float32Array(count);
  const r = new Uint8Array(count), g = new Uint8Array(count), b = new Uint8Array(count);
  for (let k = 0; k < count; k++) {
    const i = idxBuf[(R() * m) | 0];
    const px = i % w, py = (i / w) | 0;
    x[k] = px + R() - pvx; y[k] = py + R() - pvy;
    z[k] = (R() - 0.5) * depth;
    const q = i * 4;
    let rr = d[q], gg = d[q + 1], bb = d[q + 2];
    if (opt.gamma) {
      rr = 255 * Math.pow(rr / 255, opt.gamma); gg = 255 * Math.pow(gg / 255, opt.gamma); bb = 255 * Math.pow(bb / 255, opt.gamma);
    }
    if (minLum) {
      const l = rr * 0.3 + gg * 0.59 + bb * 0.11;
      if (l < minLum) { const add = minLum - l; rr += add * 0.8; gg += add * 0.85; bb += add * 1.2; }
    }
    r[k] = Math.min(255, rr); g[k] = Math.min(255, gg); b[k] = Math.min(255, bb);
  }
  return { n: count, x, y, z, r, g, b, w, h, ox: pvx - w / 2, oy: pvy - h / 2 };
}

function wrapLines(ctx, text, maxW) {
  const out = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const ch of Array.from(para)) {
      const t = line + ch;
      if (ctx.measureText(t).width > maxW && line) {
        // 行に空白があれば、その位置で折る
        const sp = line.lastIndexOf(' ');
        if (sp > 0) { out.push(line.slice(0, sp)); line = line.slice(sp + 1) + ch; }
        else { out.push(line); line = ch === ' ' ? '' : ch; }
      } else line = t;
    }
    out.push(line);
  }
  return out;
}

export function textShape(text, count, opt = {}) {
  const fs = 150, lh = fs * 1.18;
  ox.font = `900 ${fs}px ${JP_FONT}`;
  const lines = wrapLines(ox, text || ' ', opt.maxW ?? fs * 6.5);
  let tw = 1;
  for (const l of lines) tw = Math.max(tw, ox.measureText(l).width);
  const w = tw + 40, h = lines.length * lh + 30;
  return sample(w, h, (c) => {
    c.font = `900 ${fs}px ${JP_FONT}`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#00f0ff'); g.addColorStop(0.5, '#8f7bff'); g.addColorStop(1, '#ff4fd8');
    c.fillStyle = g;
    lines.forEach((l, i) => c.fillText(l, w / 2, 15 + lh * (i + 0.5) + fs * 0.04));
  }, count);
}

export function emojiShape(ch, count, size = 300) {
  const w = size * 1.3, h = size * 1.3;
  return sample(w, h, (c) => {
    c.font = `${size}px ${EMOJI_FONT}`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(ch, w / 2, h / 2 + size * 0.05);
  }, count, { minLum: 40 });
}

// 剣。握りの位置を回転の中心にする
export function swordShape(count) {
  const w = 180, h = 720, gx = w / 2, gy = 600;
  return sample(w, h, (c) => {
    const bl = c.createLinearGradient(gx - 26, 0, gx + 26, 0);
    bl.addColorStop(0, '#6fe8ff'); bl.addColorStop(0.45, '#ffffff'); bl.addColorStop(0.55, '#b8f6ff'); bl.addColorStop(1, '#3fa8ff');
    c.fillStyle = bl;
    c.beginPath();
    c.moveTo(gx, 10); c.lineTo(gx + 26, 90); c.lineTo(gx + 22, 540); c.lineTo(gx - 22, 540); c.lineTo(gx - 26, 90); c.closePath();
    c.fill();
    c.fillStyle = '#d6fbff'; c.fillRect(gx - 3, 70, 6, 460);
    const gd = c.createLinearGradient(0, 540, 0, 570);
    gd.addColorStop(0, '#ffe27a'); gd.addColorStop(1, '#d99a1b');
    c.fillStyle = gd;
    c.beginPath(); c.ellipse(gx, 555, 85, 16, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ff2d6f'; c.beginPath(); c.arc(gx, 555, 14, 0, 7); c.fill();
    c.fillStyle = '#7c4dff'; c.fillRect(gx - 13, 570, 26, 100);
    c.fillStyle = '#b39dff';
    for (let yy = 578; yy < 665; yy += 16) c.fillRect(gx - 13, yy, 26, 5);
    c.fillStyle = '#ffd54a'; c.beginPath(); c.arc(gx, 684, 20, 0, 7); c.fill();
  }, count, { ox: gx, oy: gy, depth: 0.04 });
}

export function imageShape(img, count, maxSide = 520) {
  const sc = maxSide / Math.max(img.naturalWidth, img.naturalHeight);
  const w = img.naturalWidth * sc, h = img.naturalHeight * sc;
  return sample(w, h, (c) => { c.imageSmoothingEnabled = true; c.drawImage(img, 0, 0, w, h); }, count, { minLum: 30, gamma: 0.8, depth: 0.05 });
}

// お絵描きの線。scale 倍に縮めて抜き出し、線の外接矩形の中心を回転の中心にする
export function strokesShape(strokes, count, scale = 0.5) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const s of strokes) for (const [x, y] of s.pts) {
    x0 = Math.min(x0, x - s.width); y0 = Math.min(y0, y - s.width);
    x1 = Math.max(x1, x + s.width); y1 = Math.max(y1, y + s.width);
  }
  if (x1 < x0) return null;
  const w = (x1 - x0) * scale + 4, h = (y1 - y0) * scale + 4;
  const shp = sample(w, h, (c) => {
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.translate(2, 2); c.scale(scale, scale); c.translate(-x0, -y0);
    for (const s of strokes) {
      c.strokeStyle = s.color; c.fillStyle = s.color; c.lineWidth = s.width;
      if (s.pts.length === 1) { c.beginPath(); c.arc(s.pts[0][0], s.pts[0][1], s.width / 2, 0, 7); c.fill(); continue; }
      c.beginPath(); c.moveTo(s.pts[0][0], s.pts[0][1]);
      for (const [x, y] of s.pts) c.lineTo(x, y);
      c.stroke();
    }
  }, count, { depth: 0.25 });
  if (shp) { shp.cx = (x0 + x1) / 2; shp.cy = (y0 + y1) / 2; shp.scaleBack = 1 / scale; }
  return shp;
}
