/* Scene: gambar 1 frame kuis (papan tulis + karakter). Dipakai oleh renderer headless Chrome (js/scene.html). */
(function(g){
const CD=5,REV=1.1,W0=540;
const FONT='"Comic Neue","Chalkboard SE","Comic Sans MS","Segoe Print",cursive';
let ctx,C,K;
function rr(x,y,w,h,r,f,s){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(f){ctx.fillStyle=f;ctx.fill()}if(s){ctx.strokeStyle=s;ctx.stroke()}}
function wrap(t,w,font){ctx.font=font;const ws=t.split(' ');let l='',o=[];for(const x of ws){const n=l?l+' '+x:x;if(ctx.measureText(n).width>w&&l){o.push(l);l=x}else l=n}if(l)o.push(l);return o}
function arm(sx,sy,ex,ey,hx,hy){ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#2e7d32';ctx.lineWidth=34;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.lineTo(hx,hy);ctx.stroke();ctx.fillStyle='#f1c9a0';ctx.beginPath();ctx.arc(hx,hy,16,0,7);ctx.fill()}
function man(t,mode,talk){const cx=270,hy=765;ctx.save();ctx.translate(0,Math.sin(t*3)*2);
const s=Math.sin(t*5);
if(mode==='think'){arm(cx-90,860,cx-120,920,cx-112,955);arm(cx+90,860,cx+120,880,cx+30,822)}
else if(mode==='cheer'){const w=Math.sin(t*14)*10;arm(cx-90,860,cx-140,800,cx-130,700+w);arm(cx+90,860,cx+140,800,cx+130,700-w)}
else{arm(cx-90,860,cx-120,920,cx-112,955);arm(cx+90,860,cx+130,900,cx+125,860+(talk?s*14:0))}
ctx.fillStyle='#2e7d32';rr(cx-105,830,210,140,40,'#2e7d32');
ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(cx-30,830);ctx.lineTo(cx+30,830);ctx.lineTo(cx,905);ctx.fill();
ctx.fillStyle='#1b5e20';ctx.beginPath();ctx.moveTo(cx-9,845);ctx.lineTo(cx+9,845);ctx.lineTo(cx+13,900);ctx.lineTo(cx,915);ctx.lineTo(cx-13,900);ctx.fill();
ctx.fillStyle='#f1c9a0';ctx.fillRect(cx-15,805,30,30);
ctx.beginPath();ctx.arc(cx-58,hy,11,0,7);ctx.arc(cx+58,hy,11,0,7);ctx.fill();
ctx.beginPath();ctx.ellipse(cx,hy,58,64,0,0,7);ctx.fill();
ctx.fillStyle='#3e2723';ctx.beginPath();ctx.ellipse(cx,hy-34,60,34,0,Math.PI,0);ctx.lineTo(cx+50,hy-30);ctx.quadraticCurveTo(cx,hy-48,cx-50,hy-30);ctx.fill();
// stubble
ctx.fillStyle='rgba(62,39,35,.18)';ctx.beginPath();ctx.ellipse(cx,hy+30,44,30,0,0,Math.PI);ctx.fill();
const up=mode==='think',blink=(t%4)<.12,ex=up?5:0,ey=up?-4:0;
ctx.strokeStyle='#222';ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx-26,hy-4,18,0,7);ctx.arc(cx+26,hy-4,18,0,7);ctx.moveTo(cx-8,hy-6);ctx.lineTo(cx+8,hy-6);ctx.stroke();
ctx.fillStyle='rgba(200,230,255,.25)';ctx.beginPath();ctx.arc(cx-26,hy-4,17,0,7);ctx.arc(cx+26,hy-4,17,0,7);ctx.fill();
ctx.fillStyle='#222';if(blink){ctx.fillRect(cx-32,hy-5,12,3);ctx.fillRect(cx+20,hy-5,12,3)}else{ctx.beginPath();ctx.arc(cx-26+ex,hy-4+ey,5,0,7);ctx.arc(cx+26+ex,hy-4+ey,5,0,7);ctx.fill()}
ctx.strokeStyle='#3e2723';ctx.lineWidth=5;ctx.beginPath();
if(up){ctx.moveTo(cx-42,hy-34);ctx.lineTo(cx-12,hy-28);ctx.moveTo(cx+12,hy-38);ctx.lineTo(cx+42,hy-44)}
else if(mode==='cheer'){ctx.moveTo(cx-42,hy-38);ctx.lineTo(cx-12,hy-40);ctx.moveTo(cx+12,hy-40);ctx.lineTo(cx+42,hy-38)}
else{ctx.moveTo(cx-42,hy-32);ctx.lineTo(cx-12,hy-32);ctx.moveTo(cx+12,hy-32);ctx.lineTo(cx+42,hy-32)}ctx.stroke();
ctx.fillStyle='#7a2e2e';ctx.strokeStyle='#7a2e2e';ctx.lineWidth=4;
if(mode==='cheer'){ctx.beginPath();ctx.arc(cx,hy+22,22,0,Math.PI);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(cx-16,hy+22,32,6)}
else if(mode==='think'){ctx.beginPath();ctx.moveTo(cx-12,hy+36);ctx.quadraticCurveTo(cx,hy+30,cx+12,hy+38);ctx.stroke()}
else{const o=talk?3+Math.abs(Math.sin(t*13))*9:3;ctx.beginPath();ctx.ellipse(cx,hy+34,14,o,0,0,7);ctx.fill()}
ctx.restore();
if(mode==='think'){const p=1+Math.sin(t*6)*.08;ctx.fillStyle='#fff';ctx.strokeStyle='#2e7d32';ctx.lineWidth=3;
[[cx+90,720,7],[cx+105,696,10]].forEach(([x,y,r])=>{ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.stroke()});
ctx.beginPath();ctx.ellipse(cx+150,640,42*p,32*p,0,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#2e7d32';ctx.font='bold 40px sans-serif';ctx.textAlign='center';ctx.fillText('?',cx+150,654)}}
function confetti(t){const cols=['#ffd54f','#ef5350','#42a5f5','#66bb6a','#ab47bc'];for(let i=0;i<46;i++){const sd=(i*9301+49297)%233280/233280,sd2=(i*7919+13)%1000/1000;
const x=sd*W0,y=(t*220*(.6+sd2)+sd2*400)%960-40;ctx.fillStyle=cols[i%5];ctx.save();ctx.translate(x,y);ctx.rotate(t*5+i);ctx.fillRect(-4,-2,8,5);ctx.restore()}}

function draw(t,Z,speaking){const ans=C.answer,ph=Z.ph;
const mode=ph==='cd'?'think':(ph==='ans'&&t<Z.phT+REV)?'cheer':'talk';
ctx.setTransform(K,0,0,K,0,0);ctx.clearRect(0,0,540,960);
const g=ctx.createLinearGradient(0,0,0,960);g.addColorStop(0,'#e8f5e9');g.addColorStop(1,'#c8e6c9');ctx.fillStyle=g;ctx.fillRect(0,0,540,960);
ctx.fillStyle='rgba(46,125,50,.07)';for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(60+i*95,570+(i%2)*30,50,0,7);ctx.fill()}
ctx.textAlign='center';rr(150,22,240,36,18,'#2e7d32');ctx.fillStyle='#fff';ctx.font='bold 17px sans-serif';ctx.fillText('🎓 '+(C.channel||'Kuis').slice(0,22),270,46);
ctx.fillStyle='#1b5e20';ctx.font='bold 14px sans-serif';ctx.fillText('KUIS '+C.topic.toUpperCase().slice(0,24),270,84);
ctx.lineWidth=10;rr(25,100,490,470,14,'#2f6b43','#8d6e63');
const ql=wrap(C.question,430,`bold 28px ${FONT}`);ctx.font=`bold 28px ${FONT}`;ctx.fillStyle='#fffde7';ctx.textAlign='center';
ql.slice(0,4).forEach((l,i)=>ctx.fillText(l,270,148+i*36));
let y=148+Math.min(ql.length,4)*36+14;const rev=ph==='ans'||ph==='cta';
['A','B','C'].forEach(k=>{const right=k===ans;
if(!Z.idle&&!rev&&!Z.started[k]){y+=50;return}
ctx.globalAlpha=rev&&!right?.35:1;
if(rev&&right)rr(55,y-26,430,42,10,'rgba(255,235,59,.25)');
else if(!rev&&Z.active===k)rr(55,y-26,430,42,10,'rgba(255,255,255,.16)');
ctx.font=`bold 24px ${FONT}`;ctx.textAlign='left';ctx.fillStyle=rev&&right?'#ffee58':'#fff';
ctx.fillText(`${k}.  ${C.options[k]}`.slice(0,34)+(rev&&right?'  ✓':''),72,y);ctx.globalAlpha=1;y+=50});
if(rev&&Z.rT!=null){const rl=wrap('💡 '+C.reason,420,`20px ${FONT}`);ctx.font=`20px ${FONT}`;ctx.fillStyle='#c8f7d0';ctx.textAlign='center';
ctx.globalAlpha=Math.max(0,Math.min(1,(t-Z.rT+.1)*3));rl.slice(0,4).forEach((l,i)=>ctx.fillText(l,270,y+8+i*26));ctx.globalAlpha=1}
ctx.fillStyle='#6d4c41';ctx.fillRect(60,566,420,10);
if(ph==='cd'){const rem=Math.max(0,Math.min(CD,Z.phT+CD-t)),n=Math.max(1,Math.ceil(rem)),fr=rem-Math.floor(rem),sc=1+fr*.15;
ctx.save();ctx.translate(270,622);ctx.scale(sc,sc);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,40,0,7);ctx.fill();
ctx.strokeStyle='#e0e0e0';ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#ff7043';ctx.beginPath();ctx.arc(0,0,40,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-fr));ctx.stroke();
ctx.fillStyle='#e64a19';ctx.font='bold 44px sans-serif';ctx.textAlign='center';ctx.fillText(n,0,15);ctx.restore()}
if(ph==='ans'&&t<Z.phT+1.8){ctx.textAlign='center';ctx.fillStyle='#1b5e20';ctx.font='bold 34px sans-serif';ctx.fillText('🎉 Jawaban: '+ans,270,630)}
if(ph==='cta'){const p=1+Math.sin(t*7)*.04;ctx.save();ctx.translate(270,622);ctx.scale(p,p);rr(-210,-32,420,64,32,'#c62828');ctx.fillStyle='#fff';ctx.font='bold 24px sans-serif';ctx.textAlign='center';ctx.fillText('👍 LIKE · SUBSCRIBE · FOLLOW',0,9);ctx.restore()}
if(mode==='cheer')confetti(t-Z.phT);
man(t,mode,speaking&&mode!=='think');
ctx.fillStyle='rgba(46,125,50,.2)';ctx.fillRect(0,954,540,6);ctx.fillStyle='#2e7d32';ctx.fillRect(0,954,540*Math.min(1,t/Z.D),6)}

g.Scene={
  init(canvas,cfg){C=cfg;ctx=canvas.getContext('2d');K=canvas.width/540},
  draw(t,state,speaking){draw(t,state,speaking)}
};
})(typeof window!=='undefined'?window:globalThis);
