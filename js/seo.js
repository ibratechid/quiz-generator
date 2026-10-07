const STOP = new Set('yang dan di ke dari apa siapa adalah ini itu dengan untuk pada dalam atau paling bisa akan juga negara hewan'.split(' '));
module.exports = function seo(c) {
  const q = c.question.replace(/[?.!,]/g, ''), tp = (c.topic || '').trim();
  const kw = [...new Set(q.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !STOP.has(w)))].slice(0, 5);
  let title = `${c.question.trim()} 🤔 Kuis ${tp} #Shorts`;
  if (title.length > 100) title = `Kuis ${tp}: ${c.question.trim()}`.slice(0, 91) + ' #Shorts';
  const tags = ['kuis', 'quiz', 'kuis ' + tp.toLowerCase(), 'trivia', 'tebak tebakan', 'shorts', 'pengetahuan umum', ...kw];
  const hs = ['#Shorts', '#Kuis', '#Quiz', '#' + tp.replace(/\s+/g, ''), '#Trivia', ...kw.slice(0, 2).map(w => '#' + w)];
  const description = `${c.question}\n\nA. ${c.options.A}\nB. ${c.options.B}\nC. ${c.options.C}\n\nJawaban ada di akhir video! Tulis jawabanmu di kolom komentar 👇\n\n${c.cta}\n\n${hs.join(' ')}`;
  return { title: title.slice(0, 100), description, tags, hashtags: hs };
};
