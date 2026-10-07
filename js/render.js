#!/usr/bin/env node
// Pipeline: config JSON -> TTS (edge-tts) -> ukur durasi asli -> timeline presisi -> audio mix -> frame (headless Chrome) -> MP4 H.264 + AAC.
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const T = require('./timeline'), seo = require('./seo'), mix = require('./mix'), { synth, speedUp } = require('./tts');

const ROOT = path.join(__dirname, '..');
const argv = process.argv.slice(2);
const flag = n => argv.includes(n), opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const files = argv.filter((a, i) => !a.startsWith('--') && !['--only', '--out'].includes(argv[i - 1]));
const OUT = path.resolve(opt('--out', path.join(ROOT, 'out'))), ONLY = opt('--only', '') ? opt('--only').split(',') : null;
const log = (...a) => console.log(...a);

const DEFAULTS = { topic: 'Umum', channel: 'Kuis Pintar', cta: 'Suka kuisnya? Like, subscribe, dan ikuti untuk kuis seru berikutnya!',
  duration: 30, voice: 'id-ID-ArdiNeural', pitch: '-3Hz', fps: 30, width: 1080, height: 1920, music: '', musicVolume: 0.12 };

// File boleh berisi: satu objek, array objek, atau { defaults:{...}, quizzes:[...] }
function loadConfigs(file) {
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  const list = Array.isArray(j) ? j : j.quizzes ? j.quizzes.map(q => ({ ...(j.defaults || {}), ...q })) : [j];
  const base = path.basename(file, '.json');
  return list.map((q, i) => {
    const c = { ...DEFAULTS, ...q }; c.id = (c.id || `${base}-${i + 1}`).replace(/[^\w.-]+/g, '_');
    c.duration = Math.min(60, Math.max(15, Math.round(c.duration)));
    for (const k of ['question', 'options', 'answer', 'reason']) if (!c[k]) throw new Error(`[${c.id}] field "${k}" wajib`);
    for (const k of ['A', 'B', 'C']) if (!c.options[k]) throw new Error(`[${c.id}] options.${k} wajib`);
    if (!['A', 'B', 'C'].includes(c.answer)) throw new Error(`[${c.id}] answer harus A/B/C`);
    return c;
  });
}

async function renderFrames(c, tl, audio, outMp4) {
  const total = tl.total, fps = c.fps, n = Math.round(total * fps);
  const venc = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fps)];
  const tail = [...venc, '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', total.toFixed(3), outMp4];
  if (flag('--no-frames')) { // uji tanpa Chrome: layar hijau polos
    const r = require('child_process').spawnSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', `color=c=0x2e7d32:s=${c.width}x${c.height}:r=${fps}`, '-i', audio, '-map', '0:v', '-map', '1:a', ...tail], { encoding: 'utf8' });
    if (r.status) throw new Error(r.stderr); return;
  }
  const puppeteer = require('puppeteer-core');
  const exe = process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(fs.existsSync);
  if (!exe) throw new Error('Chrome tidak ditemukan. Set env CHROME_PATH.');
  const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--font-render-hinting=none'] });
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-i', audio, '-map', '0:v', '-map', '1:a', ...tail], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => { ff.on('close', code => code ? rej(new Error('ffmpeg exit ' + code)) : res()); ff.stdin.on('error', () => {}); });
  try {
    const page = await browser.newPage();
    await page.goto('file://' + path.join(__dirname, 'scene.html'));
    await page.evaluate((w, h, cfg) => { const cv = document.getElementById('c'); cv.width = w; cv.height = h; Scene.init(cv, cfg); }, c.width, c.height, c);
    await page.evaluate(() => document.fonts.ready);
    for (let i = 0; i < n; i++) {
      const t = i / fps, { state, speaking } = T.stateAt(tl, t, c.duration);
      const b64 = await page.evaluate((t, st, sp) => { Scene.draw(t, st, sp); return document.getElementById('c').toDataURL('image/jpeg', 0.93).slice(23); }, t, state, speaking);
      if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      if (i % (fps * 5) === 0) log(`   frame ${i}/${n}`);
    }
  } finally { ff.stdin.end(); await done.catch(e => { throw e; }); await browser.close(); }
}

async function renderOne(c) {
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'quiz-')), D = c.duration;
  log(`\n▶ ${c.id}  (${D}s, ${c.width}x${c.height}@${c.fps}, suara ${c.voice})`);
  const pieces = T.buildPieces(c);
  // 1) TTS + durasi asli (sample-accurate)
  const raw = pieces.map((p, i) => path.join(tmp, `p${i}.wav`));
  const d1 = pieces.map((p, i) => synth(p.text, c.voice, c.pitch, raw[i]));
  // 2) satu kecepatan tetap untuk seluruh video
  const pr = T.planRate(d1, D);
  if (pr.overflow) log(`   ⚠ Teks terlalu panjang untuk ${D}s (butuh ×${pr.raw.toFixed(2)}). Video diperpanjang otomatis.`);
  const fin = pieces.map((p, i) => path.join(tmp, `f${i}.wav`));
  const d = pieces.map((p, i) => speedUp(raw[i], pr.rate, fin[i]));
  // 3) jadwal final dari durasi akhir yang SUDAH diukur
  const tl = T.schedule(pieces, d, D, pr.rate);
  if (tl.total > 60.05) throw new Error(`[${c.id}] durasi akhir ${tl.total.toFixed(1)}s > 60s (batas Shorts). Persingkat teks.`);
  log(`   kecepatan TTS ×${pr.rate.toFixed(2)} · durasi akhir ${tl.total.toFixed(2)}s (target ${D}s)`);
  // 4) audio
  let music = c.music ? path.resolve(ROOT, c.music) : '';
  if (music && !fs.existsSync(music)) { log(`   ⚠ musik tidak ada: ${c.music} (dilewati)`); music = ''; }
  const audio = path.join(tmp, 'audio.wav');
  mix({ tl, wavs: fin, music, musicVolume: c.musicVolume, out: audio });
  // 5) video
  fs.mkdirSync(OUT, { recursive: true });
  const mp4 = path.join(OUT, c.id + '.mp4');
  await renderFrames(c, tl, audio, mp4);
  // 6) SEO + log timeline
  const s = seo(c);
  fs.writeFileSync(path.join(OUT, c.id + '.seo.json'), JSON.stringify(s, null, 2));
  fs.writeFileSync(path.join(OUT, c.id + '.seo.txt'), `JUDUL:\n${s.title}\n\nDESKRIPSI:\n${s.description}\n\nTAGS:\n${s.tags.join(', ')}\n`);
  fs.writeFileSync(path.join(OUT, c.id + '.timeline.json'), JSON.stringify({ rate: tl.rate, total: tl.total, cdStart: tl.cdStart, ansStart: tl.ansStart, ctaStart: tl.ctaStart, pieces: tl.pieces }, null, 2));
  fs.rmSync(tmp, { recursive: true, force: true });
  log(`✓ ${mp4}`);
}

(async () => {
  if (!files.length) { console.error('Pemakaian: node js/render.js configs/*.json [--only id1,id2] [--out dir] [--no-frames]'); process.exit(2); }
  const errors = [];
  for (const f of files) {
    let list; try { list = loadConfigs(f); } catch (e) { errors.push(`${f}: ${e.message}`); continue; }
    for (const c of list) {
      if (ONLY && !ONLY.includes(c.id)) continue;
      try { await renderOne(c); } catch (e) { errors.push(`${c.id}: ${e.message}`); console.error('✗', e.message); }
    }
  }
  if (errors.length) { console.error('\nGAGAL:\n - ' + errors.join('\n - ')); process.exit(1); }
})();
