// 스토어 스크린샷(플레이 1080×1920) 다시 만들기 — 가상의 앨범·직접 그린 커버로 앱을 띄워 캡처하고 문구를 얹는다.
//   1) 저장소 루트를 로컬 서버로 띄움:  npx serve -l 3000 .
//   2) node scripts/make-store-shots.mjs [출력폴더=store-assets/play] [서버주소=http://localhost:3000]
//   필요: playwright(또는 playwright-core) + 크로미움. 문구 글꼴은 Pretendard(npm i pretendard) — 없으면 시스템 글꼴.
import { createRequire } from 'module'; import fs from 'fs'; import path from 'path';
const require=createRequire(path.join(process.cwd(),'x.js'));
let chromium; try{ ({chromium}=require('playwright')); }catch(e){ ({chromium}=require('playwright-core')); }
const OUT=process.argv[2]||'store-assets/play', BASE=process.argv[3]||'http://localhost:3000';
const EXE=process.env.CHROME_PATH||undefined;
fs.mkdirSync(OUT,{recursive:true});

const SLIDES=[
  ['tt',    'Turn it,',  '돌리면,\n음악이 흘러요',            'Spin the disc,\nhear the music'],
  ['lib',   'Keep it,',  '모아온 바이닐을\n한곳에',            'Every record,\none shelf'],
  ['find',  'Find it,',  '검색 한 번이면\n커버와 노래까지',     'One search finds\nthe cover and songs'],
  ['disc',  'Match it,', '디스크 색까지\n내 것 그대로',         'Right down to\nyour disc color'],
  ['share', 'Share it,', '내 취향을\n카드 한 장으로',           'Your taste,\non a card'],
  ['cal',   'Log it,',   '사고, 듣고,\n달력에 남기고',          'Every buy and spin,\non a calendar'],
  ['stats', 'Track it,', '얼마나 모았는지\n한눈에',             'Your collection\nin numbers'],
];
const FEATURE={ sub:'Turn it, hear it,', ko:'돌려 듣는\n내 바이닐 보관함', en:'Your vinyl,\nready to spin' };

// 조용한 1초짜리 WAV (미리듣기 요청에 돌려줌)
function silentWav(sec=30, rate=8000){ const n=sec*rate, b=Buffer.alloc(44+n*2); b.write('RIFF',0); b.writeUInt32LE(36+n*2,4); b.write('WAVEfmt ',8); b.writeUInt32LE(16,16); b.writeUInt16LE(1,20); b.writeUInt16LE(1,22); b.writeUInt32LE(rate,24); b.writeUInt32LE(rate*2,28); b.writeUInt16LE(2,32); b.writeUInt16LE(16,34); b.write('data',36); b.writeUInt32LE(n*2,40); return b; }

// 앱 안에서 실행: 가상의 앨범 11장 + 직접 그린 커버
function seedDemo(en){
  const C=(draw)=>{ const c=document.createElement('canvas'); c.width=c.height=600; const x=c.getContext('2d'); draw(x); return c.toDataURL('image/jpeg',.9); };
  const bg=(x,a,b,ang)=>{ const g=ang?x.createLinearGradient(0,0,600,600):x.createLinearGradient(0,0,0,600); g.addColorStop(0,a); g.addColorStop(1,b); x.fillStyle=g; x.fillRect(0,0,600,600); };
  const T=(x,t,y,col,size=44,align='center',px=300)=>{ x.fillStyle=col; x.font=`800 ${size}px "Noto Sans KR",sans-serif`; x.textAlign=align; x.fillText(t,px,y); };
  const covers={
    tram:C(x=>{ bg(x,'#0f3b4c','#06202b'); x.strokeStyle='rgba(120,220,210,.25)'; for(let i=0;i<14;i++){ x.beginPath(); x.moveTo(0,190+i*13); x.lineTo(600,120+i*15); x.stroke(); } x.beginPath(); x.arc(440,150,44,0,7); x.fillStyle='#ffd27a'; x.fill(); T(x,'MIDNIGHT TRAM',520,'rgba(190,240,235,.9)',40,'left',44); }),
    summer:C(x=>{ bg(x,'#ff9e6b','#ffc98a'); x.beginPath(); x.arc(300,330,150,0,7); x.fillStyle='#ff6b5e'; x.fill(); x.fillStyle='#2b8f9c'; x.fillRect(0,330,600,270); x.strokeStyle='rgba(255,255,255,.55)'; x.lineWidth=4; [[90,510,370],[110,490,400],[130,470,430],[150,450,460],[170,430,490]].forEach(([a,b,y])=>{ x.beginPath(); x.moveTo(a,y); x.lineTo(b,y); x.stroke(); }); T(x,en?'SUMMER’S END':'여름의 끝',110,'#7a2a1c',50); }),
    dawn:C(x=>{ bg(x,'#9db4e8','#e9c7d8'); x.beginPath(); x.arc(300,470,190,0,7); x.fillStyle='rgba(255,255,255,.85)'; x.fill(); x.fillStyle='#39437a'; x.fillRect(0,470,600,130); T(x,en?'DAWN WALK':'새벽 산책',120,'#2d3668',50); }),
    blue:C(x=>{ bg(x,'#0b1c4d','#081231'); for(let i=0;i<260;i++){ x.fillStyle=`rgba(255,255,255,${Math.random()*.35})`; x.fillRect(Math.random()*600,Math.random()*600,2,2); } x.strokeStyle='#4f8cff'; x.lineWidth=8; x.strokeRect(70,70,460,460); T(x,'BLUE STATIC',320,'#dfe9ff',54); }),
    coast:C(x=>{ bg(x,'#0f5d6b','#35a3ac'); x.strokeStyle='rgba(255,255,255,.5)'; x.lineWidth=3; for(let r=0;r<7;r++){ x.beginPath(); for(let i=0;i<=600;i+=10){ const y=330+r*34+Math.sin(i/55+r)*13; i?x.lineTo(i,y):x.moveTo(i,y); } x.stroke(); } T(x,'COASTLINE',150,'#eafcff',52); }),
    radio:C(x=>{ bg(x,'#f1e2c6','#e6d2ad'); x.fillStyle='#d9573f'; x.fillRect(110,220,380,250); x.beginPath(); x.arc(220,345,78,0,7); x.fillStyle='#f6ead2'; x.fill(); x.fillStyle='#f6ead2'; for(let i=0;i<6;i++) x.fillRect(330,262+i*30,130,12); T(x,en?'ALLEY RADIO':'골목길 라디오',140,'#6b2a1c',46); }),
    gold:C(x=>{ x.fillStyle='#17130a'; x.fillRect(0,0,600,600); const g=x.createRadialGradient(300,280,10,300,280,300); g.addColorStop(0,'#ffd76a'); g.addColorStop(.5,'rgba(214,150,40,.55)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(0,0,600,600); T(x,'GOLDEN ECHO',540,'rgba(255,225,150,.85)',40); }),
    bloom:C(x=>{ bg(x,'#fbe9ef','#f1d3df'); for(let i=0;i<8;i++){ x.save(); x.translate(300,290); x.rotate(i*Math.PI/4); x.beginPath(); x.ellipse(0,-95,56,100,0,0,7); x.fillStyle='rgba(232,92,138,.55)'; x.fill(); x.restore(); } x.beginPath(); x.arc(300,290,42,0,7); x.fillStyle='#ffd166'; x.fill(); T(x,'Slow Bloom',545,'#c2456d',44); }),
    moon:C(x=>{ bg(x,'#262b55','#14172f'); x.beginPath(); x.arc(310,270,130,0,7); x.fillStyle='#f6edc9'; x.fill(); x.beginPath(); x.arc(365,240,118,0,7); x.fillStyle='#1c2044'; x.fill(); T(x,'Paper Moon Club',530,'rgba(235,228,200,.9)',38); }),
    velvet:C(x=>{ bg(x,'#4a1238','#2a0a22'); for(let r=250;r>30;r-=42){ x.beginPath(); x.arc(300,300,r,0,7); x.fillStyle=`rgba(230,120,170,${.10+ (250-r)/900})`; x.fill(); } T(x,'VELVET HOURS',560,'rgba(255,200,225,.85)',36); }),
    noon:C(x=>{ bg(x,'#e8efe1','#cfe0c3'); x.fillStyle='#3f7a4e'; x.beginPath(); x.moveTo(0,600); x.lineTo(0,430); x.quadraticCurveTo(160,330,320,420); x.quadraticCurveTo(470,500,600,380); x.lineTo(600,600); x.fill(); x.beginPath(); x.arc(450,170,60,0,7); x.fillStyle='#f4b942'; x.fill(); T(x,en?'SLOW AFTERNOON':'느린 오후',130,'#2f5a3a',46,'left',50); }),
  };
  const now=new Date(), ym=now.toISOString().slice(0,7), d=n=>ym+'-'+String(n).padStart(2,'0');
  const prev=(m,day)=>{ const t=new Date(now.getFullYear(), now.getMonth()-m, day); return t.toISOString().slice(0,10); };
  const L=(...days)=>days.map(n=>({date:d(n),note:''}));
  const K=(ko,e)=>en?e:ko;
  const rows=[
    ['tram','Sora Park','Midnight Tram','민트','#4fd1c5','일렉트로닉',2023,'개봉',42000,48000,d(3),5,true,L(3,5,8,11,12)],
    ['summer',K('하늘섬','Haneulsum'),K('여름의 끝','Summer’s End'),'오렌지','#e8843c','가요',2021,'개봉',38000,45000,d(6),4.5,true,L(6,9,12)],
    ['velvet','Lune','Velvet Hours','핑크','#d96a9b','R&B/소울',2022,'미개봉',52000,59000,d(9),4,false,L(10)],
    ['blue','Nova Kim','Blue Static','블루','#3f6fd6','록',2020,'개봉',45000,45000,prev(1,14),4,true,L(2,7)],
    ['dawn',K('윤슬','Yunseul'),K('새벽 산책','Dawn Walk'),'화이트','#f0ede6','가요',2024,'개봉',49000,55000,prev(1,22),5,true,L(4)],
    ['coast','Wave Theory','Coastline','투명','#bfe6ea','팝',2019,'개봉',36000,42000,prev(2,5),3.5,false,L(1)],
    ['radio',K('오후세시','3PM'),K('골목길 라디오','Alley Radio'),'레드','#c94a3a','가요',2018,'미개봉',41000,47000,prev(3,18),4,false,[]],
    ['gold','Marlow','Golden Echo','옐로우','#e8b93c','재즈',2017,'개봉',58000,64000,prev(5,2),4.5,true,[]],
    ['bloom','Haru','Slow Bloom','핑크','#f2a7bf','팝',2023,'배송전',47000,52000,d(12),0,false,[]],
    ['moon','Juniper','Paper Moon Club','블랙','#1d1d22','록',2016,'개봉',39000,39000,prev(8,9),4,false,[]],
    ['noon',K('모래시계','Hourglass'),K('느린 오후','Slow Afternoon'),'그린','#4f9a62','가요',2022,'위시',null,null,null,0,false,[]],
  ];
  const stores=['yes24',K('알라딘','Aladin'),K('김밥레코즈','Gimbab Records'),'yes24',K('알라딘','Aladin'),'yes24'];
  const items=rows.map((r,i)=>({ id:'u'+(1700000000000+(rows.length-i)*1000), no:i+1, artist:r[1], album:r[2], color:r[3], colorHex:r[4], genre:r[5], year:r[6], status:r[7],
    price:r[8], orig:r[8], listPrice:r[9], buy:r[10], arrive:r[7]==='배송전'||r[7]==='위시'?null:r[10], rating:r[11], liked:r[12], listens:r[13], store:r[8]?stores[i%stores.length]:'', pay:'카드', note:'',
    shipEta:r[7]==='배송전'?d(Math.min(28,now.getDate()+5)):null, rpm:'33', inch:'12"', _art:covers[r[0]], cover:covers[r[0]] }));
  document.body.className='state-app'; window.bootApp(items);
  window.LPCloud={ saveItem(){}, saveSettings(){}, async saveItems(){}, uploadImage:async()=>{ throw 0; } };
  const tracks=en?['Waiting for the Last Tram','Midnight Tram','Window Lights','Blue Hour']:['막차를 기다리며','Midnight Tram','창밖의 불빛','Blue Hour'];
  DATA.forEach(it=>{ _preview.cache[it.id]=tracks.map((t,k)=>({url:'https://audio.test/t'+k+'.wav',title:t,no:k+1})); });
  window.__demoCovers=covers;
}

const browser=await chromium.launch({ executablePath:EXE, args:['--no-sandbox','--autoplay-policy=no-user-gesture-required'] });
const wav=silentWav();
async function capture(lang){
  const ctx=await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:3, locale:lang==='en'?'en-US':'ko-KR' });
  const page=await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(e.message));
  await page.route(/www\.gstatic\.com|firebase|googleapis\.com\/(?!css)|kakaocdn|itunes\.apple\.com|mzstatic|musicbrainz|deezer|googlesyndication|doubleclick/, r=>r.abort());
  await page.route(/audio\.test/, r=>r.fulfill({ status:200, contentType:'audio/wav', headers:{'Access-Control-Allow-Origin':'*'}, body:wav }));
  await page.addInitScript(l=>{ localStorage.setItem('lp_lang',l); localStorage.setItem('lp_tour_done','1'); localStorage.setItem('lp_ttguide_done','1'); localStorage.setItem('lp_wz_mute','1');
    localStorage.setItem('lp_settings', JSON.stringify({theme:'dark', showRpm:true, showInch:true})); }, lang);
  await page.goto(BASE+'/?shots='+Date.now(), {waitUntil:'load'}); await page.waitForTimeout(1500);
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(seedDemo, lang==='en'); await page.waitForTimeout(1200);
  const shots={}, w=ms=>page.waitForTimeout(ms), snap=async k=>{ await w(400); shots[k]=await page.screenshot({type:'png'}); };
  const tab=async v=>{ await page.click(`.nav button[data-v="${v}"]`); await page.evaluate(()=>window.scrollTo(0,0)); await w(500); };

  // 2. 보관함
  await page.evaluate(()=>{ const s=document.querySelector('.search'); window.scrollTo(0, s.getBoundingClientRect().top+scrollY-250); }); await snap('lib');
  // 1. 턴테이블
  await page.evaluate(()=>window.scrollTo(0,0)); await w(200);
  await page.evaluate(()=>{ const it=DATA[0]; openTurntable(it, document.querySelector(`#grid .lp[data-id="${it.id}"]`)||null); }); await w(3500); await snap('tt');
  await page.evaluate(()=>closeTurntable()); await w(1200);
  // 3·4. 등록 마법사
  await page.evaluate(()=>{ const c={artist:DATA[1].artist, album:DATA[1].album, img:window.__demoCovers.summer, year:2021, genre:'가요'};
    openWizard(); WZ.cands=[c]; wzChoose(c); }); await w(1500); await snap('find');
  await page.evaluate(()=>{ wzReturn&&0; hide('wiz'); }); await w(500);
  await page.evaluate(()=>{ openWizard(null,null,{ fill(){ $('#f-artist').value=DATA[1].artist; $('#f-album').value=DATA[1].album; setPrevImg(window.__demoCovers.summer,''); const fc=$('#f-color'); fc.value='블랙'; if(fc.oninput) fc.oninput(); }, step:3 }); }); await w(900);
  await page.click('#wz-colors .c[data-l="오렌지"]'); await w(1500); await snap('disc');
  await page.evaluate(()=>hide('wiz')); await w(500);
  // 5. 컬렉션 카드
  await tab('my'); await page.evaluate(async()=>{ const c=await buildShareCardCanvas(); const b=await new Promise(r=>c.toBlob(r,'image/jpeg',.92)); window.__shareCardBlob=b; _showShareSheet(b, isEN()?'📤 Collection card':'📤 컬렉션 카드'); }); await w(900); await snap('share');
  await page.evaluate(()=>hide('sharecard')); await w(400);
  // 6. 달력  7. 통계
  await tab('cal'); await snap('cal');
  await tab('stats'); await page.evaluate(()=>{ const s=document.querySelector('#view-stats .stat, .stat'); if(s) window.scrollTo(0, s.getBoundingClientRect().top+scrollY-150); }); await snap('stats');
  if(errs.length) console.log(lang,'page errors:',errs.slice(0,3));
  await ctx.close(); return shots;
}

function fontCss(){
  try{ const dir=path.dirname(require.resolve('pretendard/package.json'))+'/dist/web/static/woff2/';
    return [['600','SemiBold'],['700','Bold'],['800','ExtraBold']].map(([w,n])=>`@font-face{font-family:Pretendard;font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(dir+`Pretendard-${n}.woff2`).toString('base64')})}`).join('');
  }catch(e){ console.log('Pretendard 없음 → 시스템 글꼴'); return ''; }
}
const FONT=fontCss();
const BG=`background:#101016;background-image:radial-gradient(900px 700px at 100% 0%,rgba(232,100,60,.30),transparent 60%),radial-gradient(800px 700px at 0% 100%,rgba(232,100,60,.20),transparent 60%)`;
async function compose(file, html, w, h){
  const p=await browser.newPage({ viewport:{width:w,height:h} });
  await p.setContent(`<style>${FONT}*{margin:0;box-sizing:border-box}body{width:${w}px;height:${h}px;overflow:hidden;font-family:Pretendard,'Noto Sans KR',sans-serif;${BG}}</style>${html}`);
  await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(250);
  await p.screenshot({ path:file, type:'jpeg', quality:92 }); await p.close();
}
const uri=b=>'data:image/png;base64,'+b.toString('base64');
const slide=(sub,main,img)=>`
  <div style="position:absolute;top:100px;left:0;right:0;text-align:center">
    <div style="font-weight:700;font-size:44px;color:#f08a45;letter-spacing:-.01em">${sub}</div>
    <div style="font-weight:800;font-size:${main.length>30?74:86}px;line-height:1.16;color:#fff;letter-spacing:-.03em;margin-top:14px;white-space:pre-line">${main}</div>
  </div>
  <div style="position:absolute;left:190px;top:404px;width:700px;height:1480px;border-radius:84px;background:#07070a;border:2px solid #2a2830;box-shadow:0 40px 90px rgba(0,0,0,.55);padding:16px">
    <img src="${img}" style="width:100%;height:100%;object-fit:cover;object-position:top;border-radius:68px;display:block">
  </div>`;

for(const lang of ['ko','en']){
  const shots=await capture(lang);
  for(let i=0;i<SLIDES.length;i++){ const [k,sub,ko,en]=SLIDES[i];
    await compose(path.join(OUT,`${lang}-${i+1}.jpg`), slide(sub, lang==='en'?en:ko, uri(shots[k])), 1080, 1920); }
  // 그래픽 이미지 1024×500: 왼쪽 문구, 오른쪽에 턴테이블 화면
  await compose(path.join(OUT,`feature-${lang}.jpg`), `
    <div style="position:absolute;left:72px;top:118px">
      <div style="font-weight:700;font-size:30px;color:#f08a45">${FEATURE.sub}</div>
      <div style="font-weight:800;font-size:${lang==='en'?58:62}px;line-height:1.18;color:#fff;letter-spacing:-.03em;margin-top:12px;white-space:pre-line">${FEATURE[lang]}</div>
    </div>
    <div style="position:absolute;right:86px;top:42px;width:300px;height:640px;border-radius:40px;background:#07070a;border:2px solid #2a2830;padding:8px;box-shadow:0 30px 70px rgba(0,0,0,.55);transform:rotate(6deg)">
      <img src="${uri(shots.tt)}" style="width:100%;height:100%;object-fit:cover;object-position:top;border-radius:32px;display:block">
    </div>`, 1024, 500);
  console.log(lang,'done');
}
await browser.close();
