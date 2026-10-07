// Mixer audio: suara narator (posisi tepat sesuai jadwal) + SFX timer/ding + musik (opsional, auto-ducking).
const { spawnSync } = require('child_process');
const T = require('./timeline');

module.exports = function mix({ tl, wavs, music, musicVolume, out }) {
  const ins = [], f = [], total = tl.total;
  const add = (pre, src) => { ins.push(...pre, '-i', src); return ins.filter(x => x === '-i').length - 1; };
  // 1) suara
  const vl = tl.pieces.map((p, i) => {
    const k = add([], wavs[i]);
    f.push(`[${k}:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=${Math.round(p.s * 1000)}:all=1[v${i}]`);
    return `[v${i}]`;
  });
  f.push(`${vl.join('')}amix=inputs=${vl.length}:normalize=0:duration=longest[vm]`);
  // 2) SFX: tick 5..1 (lalu 880Hz di detik terakhir) + ding saat jawaban
  const sf = [], tone = (hz, d, at, vol) => {
    const k = add(['-f', 'lavfi'], `sine=f=${hz}:d=${d}`), n = `s${sf.length}`;
    f.push(`[${k}:a]aformat=sample_rates=48000:channel_layouts=stereo,afade=t=out:st=${(d * 0.6).toFixed(3)}:d=${(d * 0.4).toFixed(3)},volume=${vol},adelay=${Math.round(at * 1000)}:all=1[${n}]`);
    sf.push(`[${n}]`);
  };
  for (let i = 0; i < 5; i++) tone(i === 4 ? 880 : 520, 0.15, tl.cdStart + i, 0.30);
  tone(660, 0.25, tl.ansStart, 0.30); tone(880, 0.35, tl.ansStart + 0.15, 0.30); tone(1175, 0.5, tl.ansStart + 0.32, 0.30);
  f.push(`${sf.join('')}amix=inputs=${sf.length}:normalize=0:duration=longest[sfx]`);
  // 3) musik (opsional) + ducking
  let last;
  if (music) {
    const k = add(['-stream_loop', '-1'], music);
    f.push(`[${k}:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:${total.toFixed(3)},asetpts=PTS-STARTPTS,volume=${musicVolume},afade=t=in:d=1,afade=t=out:st=${Math.max(0, total - 1.5).toFixed(3)}:d=1.5[mus]`);
    f.push('[vm]asplit=2[v1][v2]', '[mus][v2]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=350[duck]');
    f.push('[v1][sfx][duck]amix=inputs=3:normalize=0[mx]');
  } else f.push('[vm][sfx]amix=inputs=2:normalize=0[mx]');
  f.push(`[mx]alimiter=limit=0.95,apad=whole_dur=${total.toFixed(3)},atrim=0:${total.toFixed(3)}[aout]`);
  const args = ['-y', '-v', 'error', ...ins, '-filter_complex', f.join(';'), '-map', '[aout]', '-ar', '48000', '-ac', '2', out];
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error('mix audio gagal: ' + (r.stderr || '').slice(-600));
};
