// Timeline presisi: dihitung dari durasi audio ASLI (sample-accurate), bukan estimasi.
const GAP = 0.2, CD = 5, REV = 1.1, END = 0.25, LEAD = 0.3, PAD = 0.25;

const clean = t => String(t).replace(/[*_#~`<>]/g, ' ').replace(/\s+/g, ' ').trim();

function split(id, seg, text) {
  text = clean(text);
  const parts = text.match(/[^.!?;]+[.!?;]*/g) || [text];
  const out = []; let cur = '';
  for (const x of parts) { if ((cur + x).length > 150 && cur) { out.push(cur.trim()); cur = x; } else cur += x; }
  if (cur.trim()) out.push(cur.trim());
  return out.map((x, i) => ({ id: i ? id + i : id, seg, text: x }));
}

function buildPieces(c) {
  const o = c.options, a = c.answer;
  return [
    ...split('q', 'q', c.question),
    ...['A', 'B', 'C'].map(k => ({ id: k, seg: 'q', text: `${k}, ${clean(o[k])}` })),
    ...split('j', 'ans', `Jawabannya ${a}, ${clean(o[a])}`),
    ...split('r', 'ans', c.reason),
    ...split('c', 'cta', c.cta),
  ];
}

// d1[i] = durasi asli potongan i pada kecepatan normal (detik). Mengembalikan kecepatan (rate) global.
function planRate(d1, D) {
  const n = d1.length, S = d1.reduce((x, y) => x + y, 0);
  const avail = D - (LEAD + PAD + CD + REV + END) - GAP * (n - 1);
  const raw = S / avail, rate = Math.min(1.8, Math.max(1, raw));
  return { raw, rate, overflow: raw > 1.8 };
}

// d[i] = durasi akhir (setelah atempo). Menyusun jadwal akhir.
function schedule(pieces, d, D, rate) {
  const n = pieces.length, S = d.reduce((x, y) => x + y, 0);
  const avail = D - (LEAD + PAD + CD + REV + END) - GAP * (n - 1);
  const extra = Math.min(1.2, Math.max(0, (avail - S) / Math.max(1, n - 1)));
  const gap = GAP + extra, P = pieces.map(p => ({ ...p })); let t = LEAD, i = 0;
  const run = seg => { for (; i < n && P[i].seg === seg; i++) { P[i].s = t; P[i].e = t + d[i]; t = P[i].e + gap; } };
  run('q'); t = P[i - 1].e + PAD;
  const cdStart = t, ansStart = cdStart + CD; t = ansStart + REV;
  run('ans');
  const cs = t; // potongan CTA pertama
  run('cta');
  const speechEnd = P[n - 1].e, total = Math.max(D, speechEnd + END);
  return { pieces: P, cdStart, ansStart, ctaStart: cs, speechEnd, total, rate, gap };
}

// Status visual pada waktu t (sinkron dengan jadwal audio).
function stateAt(tl, t, D) {
  const ph = t < tl.cdStart ? 'q' : t < tl.ansStart ? 'cd' : t < tl.ctaStart ? 'ans' : 'cta';
  const phT = { q: 0, cd: tl.cdStart, ans: tl.ansStart, cta: tl.ctaStart }[ph];
  const started = {}; let active = null, rT = null, speaking = false;
  for (const p of tl.pieces) {
    if (t >= p.s) { started[p.id] = 1; if (p.id === 'r') rT = p.s; }
    if (t >= p.s && t < p.e) { active = p.id; speaking = true; }
  }
  return { state: { idle: false, ph, phT, started, active, rT, D }, speaking };
}

module.exports = { GAP, CD, REV, END, LEAD, PAD, buildPieces, planRate, schedule, stateAt, clean };
