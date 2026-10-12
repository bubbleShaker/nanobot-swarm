// 粒子（ナノボット）の群れと描画
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const rng = { f: mulberry32((Date.now() ^ 0x5eed) >>> 0) };
export const R = () => rng.f();

// 色相 → RGB の早見表
const HUE = new Uint8Array(360 * 3);
for (let h = 0; h < 360; h++) {
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return 0.6 - 0.4 * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  HUE[h * 3] = f(0) * 255; HUE[h * 3 + 1] = f(8) * 255; HUE[h * 3 + 2] = f(4) * 255;
}

const tmp = { x: 0, y: 0 };

export class Swarm {
  constructor(max) {
    this.max = max;
    this.n = 0;
    const F = () => new Float32Array(max);
    this.x = F(); this.y = F(); this.vx = F(); this.vy = F();
    this.cr = F(); this.cg = F(); this.cb = F(); this.a = F();
    this.k = F(); this.life = F(); this.lifeMax = F();
    this.h1 = F(); this.h2 = F();
    this.free = new Uint8Array(max);
    for (let i = 0; i < max; i++) {
      this.k[i] = 0.65 + R() * 0.7;
      this.h1[i] = R(); this.h2[i] = R();
      this.cr[i] = 0; this.cg[i] = 200; this.cb[i] = 255;
    }
    this.main = { shape: null, x: 0, y: 0, scale: 1, rot: 0, baseRot: 0, flip: 1, spin: false, spinA: 0, deform: null };
    this.comp = null; // 連れ出した人物のレイヤー
    this.compFrac = 0.35;
    this.colorMode = 'source';
    this.c1 = [0, 229, 255];
    this.c2 = [255, 64, 210];
    this.stiff = 1;
    this.hum = 0.7;
    this.cx = 0; this.cy = 0; // 形がないときの雲の中心
  }

  setCount(n, spawnX, spawnY) {
    n = Math.max(0, Math.min(this.max, n | 0));
    for (let i = this.n; i < n; i++) {
      const ang = R() * Math.PI * 2, sp = 150 + R() * 650;
      this.x[i] = spawnX + (R() - 0.5) * 20;
      this.y[i] = spawnY + (R() - 0.5) * 20;
      this.vx[i] = Math.cos(ang) * sp; this.vy[i] = Math.sin(ang) * sp;
      this.a[i] = 0; this.free[i] = 0;
    }
    for (let i = n; i < this.n; i++) {
      const ang = R() * Math.PI * 2, sp = 100 + R() * 300;
      this.vx[i] += Math.cos(ang) * sp; this.vy[i] += Math.sin(ang) * sp;
    }
    this.n = n;
  }

  burst(cx, cy, power) {
    for (let i = 0; i < this.n; i++) {
      let dx = this.x[i] - cx, dy = this.y[i] - cy;
      const d = Math.hypot(dx, dy) + 1;
      const p = power * (0.4 + R());
      this.vx[i] += (dx / d) * p + (R() - 0.5) * power * 0.5;
      this.vy[i] += (dy / d) * p + (R() - 0.5) * power * 0.5;
    }
  }

  // 粒子 i を自由粒子（排気・炎）にする
  emit(i, x, y, vx, vy, life) {
    this.free[i] = 1; this.x[i] = x; this.y[i] = y;
    this.vx[i] = vx; this.vy[i] = vy; this.life[i] = life; this.lifeMax[i] = life;
  }

  compCount() { return this.comp && this.comp.shape ? Math.floor(this.n * this.compFrac) : 0; }

  // レイヤーの点 p をワールド座標に変換して tmp に入れる
  target(L, p, t) {
    const s = L.shape;
    let lx = s.x[p], ly = s.y[p];
    if (L.deform) { L.deform(lx, ly, p, t, tmp, s); lx = tmp.x; ly = tmp.y; }
    if (L.baseRot) {
      const c = Math.cos(L.baseRot), n = Math.sin(L.baseRot);
      const ax = lx * c - ly * n; ly = lx * n + ly * c; lx = ax;
    }
    lx *= L.flip;
    if (L.spin) {
      const c = Math.cos(L.spinA), n = Math.sin(L.spinA);
      const z = s.z[p];
      const ax = lx * c + z * n, az = -lx * n + z * c;
      const f = 700 / (700 + az);
      lx = ax * f; ly *= f;
    }
    if (L.rot) {
      const c = Math.cos(L.rot), n = Math.sin(L.rot);
      const ax = lx * c - ly * n; ly = lx * n + ly * c; lx = ax;
    }
    tmp.x = L.x + lx * L.scale;
    tmp.y = L.y + ly * L.scale;
  }

  update(dt, t) {
    const { x, y, vx, vy, a, k, free, cr, cg, cb } = this;
    const n = this.n, nc = this.compCount();
    const K0 = 70 * this.stiff;
    const cl = Math.min(1, dt * 5);
    const mode = this.colorMode, c1 = this.c1, c2 = this.c2;
    const fdamp = Math.exp(-1.8 * dt);
    if (this.main.spin) this.main.spinA += dt * 1.1;
    if (this.comp && this.comp.spin) this.comp.spinA += dt * 1.1;
    for (let i = 0; i < this.max; i++) {
      if (i >= n) {
        if (a[i] > 0) {
          a[i] -= dt * 1.5;
          vx[i] *= fdamp; vy[i] *= fdamp;
          x[i] += vx[i] * dt; y[i] += vy[i] * dt;
        }
        continue;
      }
      if (a[i] < 1) a[i] = Math.min(1, a[i] + dt * 1.8);
      if (free[i]) {
        this.life[i] -= dt;
        vx[i] *= fdamp; vy[i] *= fdamp;
        vy[i] -= 30 * dt;
        x[i] += vx[i] * dt; y[i] += vy[i] * dt;
        const f = Math.max(0, this.life[i] / this.lifeMax[i]);
        cr[i] += (255 - cr[i]) * 0.3;
        cg[i] += (60 + 180 * f - cg[i]) * 0.3;
        cb[i] += (30 + 40 * f * f - cb[i]) * 0.3;
        if (this.life[i] <= 0) free[i] = 0;
        continue;
      }
      const L = i < nc ? this.comp : this.main;
      const s = L.shape;
      let tx, ty, p = 0, tr, tg, tb, u = 0.5, v = 0.5;
      if (s) {
        p = (i < nc ? i : i - nc) % s.n;
        this.target(L, p, t);
        tx = tmp.x; ty = tmp.y;
        u = s.x[p] / s.w + 0.5; v = s.y[p] / s.h + 0.5;
      } else {
        const ang = t * (0.25 + this.h1[i] * 0.6) + this.h2[i] * 6.283;
        const rad = 30 + this.h1[i] * 150 + Math.sin(t * 1.3 + i) * 10;
        tx = this.cx + Math.cos(ang) * rad; ty = this.cy + Math.sin(ang) * rad * 0.7;
      }
      tx += Math.sin(t * 2.3 + i * 1.7) * this.hum;
      ty += Math.cos(t * 1.9 + i * 2.3) * this.hum;
      const K = K0 * k[i], D = 2 * Math.sqrt(K) * 0.62;
      vx[i] += ((tx - x[i]) * K - vx[i] * D) * dt;
      vy[i] += ((ty - y[i]) * K - vy[i] * D) * dt;
      x[i] += vx[i] * dt; y[i] += vy[i] * dt;

      if (mode === 'source' && s) { tr = s.r[p]; tg = s.g[p]; tb = s.b[p]; }
      else if (mode === 'solid') { tr = c1[0]; tg = c1[1]; tb = c1[2]; }
      else if (mode === 'gradient') {
        const m = Math.min(1, Math.max(0, (u + v) * 0.5));
        tr = c1[0] + (c2[0] - c1[0]) * m; tg = c1[1] + (c2[1] - c1[1]) * m; tb = c1[2] + (c2[2] - c1[2]) * m;
      } else if (mode === 'rainbow') {
        const h = (((u * 300 + t * 120) % 360) + 360) % 360 | 0;
        tr = HUE[h * 3]; tg = HUE[h * 3 + 1]; tb = HUE[h * 3 + 2];
      } else { tr = 120; tg = 220; tb = 255; }
      cr[i] += (tr - cr[i]) * cl; cg[i] += (tg - cg[i]) * cl; cb[i] += (tb - cb[i]) * cl;
    }
  }
}

export class Renderer {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.buf = document.createElement('canvas');
    this.bctx = this.buf.getContext('2d');
    this.g1 = document.createElement('canvas'); this.g1c = this.g1.getContext('2d');
    this.g2 = document.createElement('canvas'); this.g2c = this.g2.getContext('2d');
  }
  resize(w, h, S) {
    const W = Math.max(2, Math.round(w * S)), H = Math.max(2, Math.round(h * S));
    this.W = W; this.H = H; this.S = S;
    this.cv.width = W; this.cv.height = H;
    this.buf.width = W; this.buf.height = H;
    this.img = this.bctx.createImageData(W, H);
    this.u32 = new Uint32Array(this.img.data.buffer);
    this.g1.width = W >> 1; this.g1.height = H >> 1;
    this.g2.width = W >> 2; this.g2.height = H >> 2;
  }
  draw(sw, bg, overlay) {
    const { W, H, S, u32, ctx } = this;
    u32.fill(0);
    const base = Math.max(2, Math.round(S * 1.2));
    const ps = this.ps || base;
    const gain = ps <= base ? 0.78 : 0.78 * Math.pow(base / ps, 1.1);
    const glow = this.glow ?? 1;
    const { x, y, a, cr, cg, cb } = sw;
    for (let i = 0; i < sw.max; i++) {
      const al = a[i];
      if (al <= 0.02) continue;
      const px = (x[i] * S) | 0, py = (y[i] * S) | 0;
      if (px < 0 || py < 0 || px >= W - ps || py >= H - ps) continue;
      const m = al * gain;
      const r = cr[i] * m, g = cg[i] * m, b = cb[i] * m;
      for (let oy = 0; oy < ps; oy++) {
        let idx = (py + oy) * W + px;
        for (let ox = 0; ox < ps; ox++, idx++) {
          const q = u32[idx];
          let rr = (q & 255) + r, gg = ((q >> 8) & 255) + g, bb = ((q >> 16) & 255) + b;
          if (rr > 255) rr = 255; if (gg > 255) gg = 255; if (bb > 255) bb = 255;
          u32[idx] = 0xff000000 | (bb << 16) | (gg << 8) | rr;
        }
      }
    }
    this.bctx.putImageData(this.img, 0, 0);
    this.g1c.clearRect(0, 0, this.g1.width, this.g1.height);
    this.g1c.drawImage(this.buf, 0, 0, this.g1.width, this.g1.height);
    this.g2c.clearRect(0, 0, this.g2.width, this.g2.height);
    this.g2c.drawImage(this.g1, 0, 0, this.g2.width, this.g2.height);

    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    bg(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = glow;
    ctx.drawImage(this.g2, 0, 0, W, H);
    ctx.globalAlpha = 0.6 * glow;
    ctx.drawImage(this.g1, 0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.drawImage(this.buf, 0, 0);
    ctx.setTransform(S, 0, 0, S, 0, 0);
    overlay(ctx);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
}
