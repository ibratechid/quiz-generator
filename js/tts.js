// TTS server-side (edge-tts: suara neural Microsoft, termasuk pria Indonesia id-ID-ArdiNeural).
// Hasil di-cache per (voice+pitch+teks) agar re-run cepat. MOCK_TTS=1 untuk uji tanpa internet.
const { spawnSync } = require('child_process');
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const CACHE = path.join(process.cwd(), '.cache', 'tts');

function sh(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`${cmd} gagal: ${(r.stderr || '').slice(-400)}`);
  return r.stdout;
}
const probe = f => parseFloat(sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]));

// Buat WAV mono 48k, hening awal/akhir dipangkas -> durasi = durasi ucapan sebenarnya.
function synth(text, voice, pitch, outWav) {
  fs.mkdirSync(CACHE, { recursive: true });
  const key = crypto.createHash('sha1').update([voice, pitch, text].join('|')).digest('hex');
  const mp3 = path.join(CACHE, key + '.mp3');
  if (!fs.existsSync(mp3)) {
    if (process.env.MOCK_TTS) {
      sh('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', `sine=f=220:d=${(text.length * 0.075 + 0.4).toFixed(2)}`, mp3]);
    } else {
      let ok = false, err = '';
      for (let i = 0; i < 4 && !ok; i++) {
        try { sh('edge-tts', ['--voice', voice, `--pitch=${pitch}`, `--text=${text}`, `--write-media=${mp3}`]); ok = fs.existsSync(mp3) && fs.statSync(mp3).size > 500; }
        catch (e) { err = e.message; }
        if (!ok) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1500 * (i + 1));
      }
      if (!ok) throw new Error('edge-tts gagal untuk: "' + text.slice(0, 40) + '" ' + err);
    }
  }
  const trim = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02';
  sh('ffmpeg', ['-y', '-v', 'error', '-i', mp3, '-ar', '48000', '-ac', '1', '-af', `${trim},areverse,${trim},areverse`, outWav]);
  return probe(outWav);
}
// Percepat dengan atempo (pitch tetap). rate 1 = salin.
function speedUp(inWav, rate, outWav) {
  const af = rate > 1.0001 ? `atempo=${rate.toFixed(5)}` : 'anull';
  sh('ffmpeg', ['-y', '-v', 'error', '-i', inWav, '-af', af, '-ar', '48000', '-ac', '1', outWav]);
  return probe(outWav);
}
module.exports = { synth, speedUp, probe, sh };
