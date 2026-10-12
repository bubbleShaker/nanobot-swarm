// 効果音は WebAudio で合成する
let ac = null, master = null, noiseBuf = null;
export const sfx = {
  muted: false,
  init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  },
  setMuted(m) { this.muted = m; if (master) master.gain.value = m ? 0 : 0.5; },
  _noise(dur, f0, f1, q, vol, type = 'bandpass') {
    if (!ac || this.muted) return;
    const t = ac.currentTime;
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  },
  _tone(freq, dur, vol, type = 'sine', f1) {
    if (!ac || this.muted) return;
    const t = ac.currentTime;
    const o = ac.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  },
  _last: 0,
  whoosh() {
    const now = performance.now();
    if (now - this._last < 90) return;
    this._last = now;
    this._noise(0.55, 600, 5000, 1.2, 0.35);
    this._tone(220, 0.35, 0.05, 'sine', 660);
  },
  tick() { this._tone(1800 + Math.random() * 400, 0.04, 0.04, 'square'); },
  blip() { this._tone(880, 0.08, 0.08, 'triangle', 1320); },
  slash() { this._noise(0.18, 6000, 1500, 0.8, 0.5, 'highpass'); },
  crunch() { this._noise(0.35, 2500, 200, 0.7, 0.6); this._tone(110, 0.25, 0.25, 'sine', 50); },
  fire() { this._noise(0.6, 300, 1200, 0.6, 0.4, 'lowpass'); },
  summon() { this._tone(330, 0.9, 0.12, 'sine', 990); this._noise(0.9, 400, 8000, 1, 0.25); },
};
