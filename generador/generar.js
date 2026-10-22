// Uso: node generar.js <catalogo.html> <AAAA-MM-DD lunes de inicio> <carpeta salida>
// Genera 14 historias (2 por día) y 3 reels con los precios del catálogo publicado,
// y escribe plan.json con fechas, archivos y textos para programar en Metricool.
const {createCanvas}=require('@napi-rs/canvas');const fs=require('fs');const path=require('path');const {spawn}=require('child_process');
const [,,CAT,START,OUTDIR]=process.argv;
if(!CAT||!START||!OUTDIR){console.error("uso: node generar.js catalogo.html AAAA-MM-DD salida/");process.exit(1)}
const html=fs.readFileSync(CAT,'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
let js=scripts[scripts.length-1];js=js.slice(0,js.indexOf('// ---------- interfaz ----------'));js=js.replace(/function drawHero\(\)\{[\s\S]*$/,'');
// Fotos reales: carpeta ../fotos (nombre = modelo, ej. iphone-13-pro.jpg) y fotos subidas desde el panel del catálogo
js=js.replace('"Imagen ilustrativa";fitFont(ctx,sm','(loadPhoto(p.model)?"Foto real del equipo":"Imagen ilustrativa");fitFont(ctx,sm');
js=js.replace(/photo\.complete && photo\.naturalWidth/g,'(photo.width>0)').replace(/photo\.naturalWidth/g,'photo.width').replace(/photo\.naturalHeight/g,'photo.height');
const {loadImage}=require('@napi-rs/canvas');
const FOTOS_DIR=path.join(__dirname,'..','fotos');
const slugM=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
global.__fotos={};
global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
global.document={createElement:()=>createCanvas(10,10),fonts:{load:async()=>{}}};global.Image=class{};global.window={};
fs.mkdirSync(path.join(OUTDIR,'historias'),{recursive:true});fs.mkdirSync(path.join(OUTDIR,'reels'),{recursive:true});
(async()=>{
const stM=html.match(/const STATE=(\{[\s\S]*?\});\nconst GRADES/);
let photosPanel={};try{if(stM)photosPanel=(JSON.parse(stM[1]).photos)||{}}catch(e){}
for(const [model,url] of Object.entries(photosPanel)){try{global.__fotos[model]=await loadImage(Buffer.from(url.split(",")[1],"base64"))}catch(e){}}
if(fs.existsSync(FOTOS_DIR))for(const f of fs.readdirSync(FOTOS_DIR)){if(!/\.(jpe?g|png|webp)$/i.test(f))continue;try{global.__fotos["slug:"+f.replace(/\.[^.]+$/,"").toLowerCase()]=await loadImage(fs.readFileSync(path.join(FOTOS_DIR,f)))}catch(e){console.error("foto no válida:",f)}}
console.log("Fotos reales cargadas:",Object.keys(global.__fotos).length);
eval(js+`
for(const p of PRODUCTS){const k1=p.model,k2="slug:"+slugM(p.model);const im=global.__fotos[k1]||global.__fotos[k2];if(im)PHOTOS[p.model]=im;}
const W=1080,H=1920,FPS=30;
const payList=()=>[...(S.pay||[]),...((S.payOther||"").trim()?[S.payOther.trim()]:[])];
const day0=new Date(START+"T12:00:00Z");
const ymd=d=>{const x=new Date(day0.getTime()+d*86400000);return x.toISOString().slice(0,10)};
const week=Math.floor(day0.getTime()/(7*86400000));
const avail=PRODUCTS.filter(p=>!p.hidden&&priceOf(p)!=null);
const famOf=p=>{const m=p.model.match(/^iPhone (\\d+|SE)/);return m?m[1]:"x"};
function rot(arr,k){if(!arr.length)return arr;k=((k%arr.length)+arr.length)%arr.length;return arr.slice(k).concat(arr.slice(0,k))}
// historias: equipos variados, rotando cada semana; prioridad a más stock
const byStock=avail.slice().sort((a,b)=>(b.stock||0)-(a.stock||0));
const seen=new Set(),pool=[];
for(const p of rot(byStock,week*5)){const key=p.model;if(seen.has(key))continue;seen.add(key);pool.push(p);if(pool.length>=12)break}
while(pool.length<12&&avail.length)pool.push(avail[pool.length%avail.length]);
function promo(kind,style){
  T=IMG[style];const c=canvas(W,H),ctx=c.getContext("2d"),cx=W/2;const acc=kind==="retoma"?"#C7A6FF":"#5CD3C2";
  bgStage(ctx,W,H,acc,700,W*.62);
  ctx.textAlign="center";ctx.fillStyle=T.muted;ctx.font="600 26px "+FB;spacing(ctx,"5px");ctx.fillText((S.name||"").toUpperCase(),cx,250);spacing(ctx,"0px");
  if(kind==="retoma"){drawPhone(ctx,cx-150,640,560,"iPhone 13","#7DB3FF","back");drawPhone(ctx,cx+150,620,600,"iPhone 16 Pro","#C7A6FF","back");
    ctx.fillStyle=T.text;ctx.font="700 120px "+FD;spacing(ctx,"-4px");ctx.fillText("Tu iPhone",cx,1110);ctx.fillText("vale.",cx,1240);spacing(ctx,"0px");
    ctx.fillStyle=T.muted;ctx.font="500 38px "+FB;ctx.fillText("Recibimos tu celular como parte de pago",cx,1320);ctx.fillText("y te decimos al instante cuánto vale.",cx,1372);
    pill(ctx,cx-pillW(ctx,"Calcúlalo en el catálogo",30)/2,1430,"Calcúlalo en el catálogo",T.light?"#1D1D1F":"#EDF1F6",30,true);}
  else{drawPhone(ctx,cx,660,680,"iPhone 15 Pro","#5CD3C2","back");
    ctx.fillStyle=T.text;ctx.font="700 104px "+FD;spacing(ctx,"-4px");ctx.fillText("Envíos a toda",cx,1120);ctx.fillText("Colombia.",cx,1236);spacing(ctx,"0px");
    ctx.fillStyle=T.price;ctx.font="600 64px "+FD;ctx.fillText(((+S.ship||0)>0?cop(+S.ship):"Gratis")+" el envío",cx,1330);
    ctx.fillStyle=T.muted;ctx.font="500 34px "+FB;ctx.fillText(payList().length?("Paga por "+payList().join(" o ")+(S.payNum?" · "+S.payNum:"")):"Te lo enviamos con garantía",cx,1400);
    if(S.warranty)ctx.fillText("Garantía: "+S.warranty.toLowerCase(),cx,1450);}
  ctx.strokeStyle=T.lineSoft;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(140,1528);ctx.lineTo(W-140,1528);ctx.stroke();
  ctx.fillStyle=T.text;ctx.font="600 30px "+FB;ctx.fillText("WhatsApp "+S.phone+(S.hours?" · "+(/24/.test(S.hours)?"Atención 24/7":S.hours):""),cx,1576);
  ctx.fillStyle=T.muted;ctx.font="500 22px "+FB;ctx.fillText([S.address,S.city].filter(Boolean).join(", "),cx,1616);
  ctx.textAlign="left";T=IMG[S.style];return c;
}
const plan=[];let pi=0;
for(let d=0;d<7;d++){for(const t of ["am","pm"]){
  const style=t==="am"?"light":"dark",date=ymd(d),time=t==="am"?"10:30:00":"19:00:00";
  let c,name,desc;
  if(d===2&&t==="pm"&&S.trade){c=promo("retoma",style);name="retoma";desc="Plan retoma"}
  else if(d===5&&t==="pm"){c=promo("envios",style);name="envios";desc="Envíos y pagos"}
  else{const p=pool[pi++%pool.length];c=drawSocial(p,"story",style);name=slug(p.model+" "+p.storage);desc=p.model+" "+p.storage+" · "+p.grade.name+" · "+cop(priceOf(p))}
  const file="historias/"+date+"-"+(t==="am"?"1":"2")+"-"+name+".jpg";
  fs.writeFileSync(path.join(OUTDIR,file),c.toBuffer("image/jpeg",92));
  plan.push({tipo:"STORY",fecha:date+"T"+time,archivo:file,descripcion:desc});
}}
// reels
const ease=t=>t<0?0:t>1?1:1-Math.pow(1-t,3);
function bg(ctx,acc){T=IMG.dark;ctx.fillStyle="#000";ctx.fillRect(0,0,W,H);const g=ctx.createRadialGradient(W/2,760,0,W/2,760,W*.75);g.addColorStop(0,hexA(acc,.38));g.addColorStop(1,hexA(acc,0));ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
function brand(ctx,a){ctx.globalAlpha=a;ctx.textAlign="center";ctx.fillStyle="#A1A1A6";ctx.font="600 28px "+FB;spacing(ctx,"6px");ctx.fillText((S.name||"").toUpperCase(),W/2,230);spacing(ctx,"0px");ctx.globalAlpha=1}
function portada(title,sub){const cc=createCanvas(W,H),x=cc.getContext("2d");bg(x,"#D6B58F");brand(x,1);x.textAlign="center";x.fillStyle="#F5F5F7";x.font="700 128px "+FD;title.forEach((l,j)=>x.fillText(l,W/2,860+j*140));x.fillStyle="#D6B58F";x.font="600 44px "+FB;x.fillText(sub,W/2,860+title.length*140+30);return cc.toBuffer("image/jpeg",90)}
async function reel(file,title,sub,items){
  const segs=[{k:"intro",d:1.8},...items.map(p=>({k:"p",p,d:2.4})),{k:"outro",d:2.4}];
  const c=createCanvas(W,H),ctx=c.getContext("2d");
  const proc=spawn("ffmpeg",["-y","-f","rawvideo","-pix_fmt","rgba","-s",W+"x"+H,"-r",""+FPS,"-i","-","-c:v","libx264","-pix_fmt","yuv420p","-preset","medium","-crf","20","-movflags","+faststart",path.join(OUTDIR,file)],{stdio:["pipe","ignore","ignore"]});
  for(const s of segs){const n=Math.round(s.d*FPS);for(let i=0;i<n;i++){const t=i/FPS;
    if(s.k==="intro"){bg(ctx,"#D6B58F");brand(ctx,ease(t/.5));const a=ease((t-.2)/.6);ctx.globalAlpha=a;ctx.textAlign="center";ctx.fillStyle="#F5F5F7";ctx.font="700 128px "+FD;spacing(ctx,"-5px");
      const yy=860+(1-a)*60;title.forEach((l,j)=>ctx.fillText(l,W/2,yy+j*140));spacing(ctx,"0px");ctx.fillStyle="#D6B58F";ctx.font="600 44px "+FB;ctx.globalAlpha=ease((t-.6)/.6);ctx.fillText(sub,W/2,yy+title.length*140+30);ctx.globalAlpha=1}
    else if(s.k==="p"){const p=s.p,g=p.grade;bg(ctx,g.color);brand(ctx,1);const a=ease(t/.55);drawPhone(ctx,W/2+(1-a)*700,720,760,p.model,g.color);
      const b=ease((t-.35)/.5);ctx.globalAlpha=b;const pt="Grado "+g.tag+(g.battery?" · "+batteryLabel(g):"");pill(ctx,W/2-pillW(ctx,pt,28)/2,1150,pt,g.color,28,false);
      ctx.textAlign="center";ctx.fillStyle="#F5F5F7";fitFont(ctx,p.model,700,FD,104,W-120);spacing(ctx,"-3px");ctx.fillText(p.model,W/2,1300);spacing(ctx,"0px");
      ctx.fillStyle="#A1A1A6";ctx.font="500 40px "+FB;ctx.fillText(p.storage,W/2,1362);const pr=priceOf(p),cnt=ease((t-.5)/.9);
      ctx.fillStyle="#E8A274";ctx.font="700 120px "+FD;spacing(ctx,"-4px");ctx.fillText(cop(cnt>=1?pr:Math.round(pr*(0.75+0.25*cnt)/1000)*1000),W/2,1500);spacing(ctx,"0px");ctx.globalAlpha=1}
    else{bg(ctx,"#25D366");brand(ctx,1);ctx.globalAlpha=ease(t/.5);ctx.textAlign="center";ctx.fillStyle="#F5F5F7";ctx.font="700 104px "+FD;spacing(ctx,"-4px");ctx.fillText("Sepáralo hoy",W/2,820);spacing(ctx,"0px");
      ctx.fillStyle="#25D366";ctx.font="700 76px "+FD;ctx.fillText(S.phone,W/2,940);ctx.fillStyle="#A1A1A6";ctx.font="500 40px "+FB;ctx.fillText("WhatsApp"+(/24/.test(S.hours||"")?" · Atención 24/7":""),W/2,1010);
      ctx.globalAlpha=ease((t-.4)/.5);ctx.fillStyle="#F5F5F7";ctx.font="600 44px "+FB;ctx.fillText("Envíos a toda Colombia "+((+S.ship||0)>0?cop(+S.ship):"gratis"),W/2,1150);
      if(S.warranty)ctx.fillText("Garantía: "+S.warranty.toLowerCase(),W/2,1215);if(S.trade)ctx.fillText("Recibimos tu iPhone en parte de pago",W/2,1280);
      ctx.fillStyle="#A1A1A6";ctx.font="500 30px "+FB;ctx.fillText([S.address,S.city].filter(Boolean).join(", "),W/2,1400);ctx.globalAlpha=1}
    const buf=c.data();if(!proc.stdin.write(buf))await new Promise(r=>proc.stdin.once("drain",r));}}
  proc.stdin.end();await new Promise(r=>proc.on("close",r));
}
function distinct(list,n){const s=new Set(),o=[];for(const p of list){if(s.has(p.model))continue;s.add(p.model);o.push(p);if(o.length>=n)break}return o}
const cheap=distinct(rot(avail.slice().sort((a,b)=>priceOf(a)-priceOf(b)).slice(0,12),week),3).sort((a,b)=>priceOf(a)-priceOf(b));
const pros=distinct(rot(avail.filter(p=>/Pro/.test(p.model)).sort((a,b)=>(b.stock||0)-(a.stock||0)),week*2),3);
const news=distinct(rot(avail.filter(p=>/1[67]/.test(p.model)).sort((a,b)=>(b.stock||0)-(a.stock||0)),week),3);
const footer="\\n\\n🚚 Envíos a toda Colombia "+((+S.ship||0)>0?"por "+cop(+S.ship):"gratis")+(S.trade?"\\n💸 Recibimos tu iPhone en parte de pago":"")+"\\n📲 Sepáralo por WhatsApp: "+S.phone+"\\n📍 "+[S.address,S.city].filter(Boolean).join(", ")+"\\n\\nCatálogo completo con precios en el link de la bio.";
const tags="\\n\\n#iPhone #iPhoneColombia #Palmira #Cali #ValleDelCauca #CelularesPalmira #DistribuidoresArpra";
const reels=[];
if(cheap.length)reels.push({d:0,key:"desde",title:["iPhone","desde "+cop(priceOf(cheap[0]))],sub:"Revisados y con garantía",items:cheap,
  text:"iPhone desde "+cop(priceOf(cheap[0]))+" 📱🔥\\n\\n"+cheap.map(p=>p.model+" "+p.storage+": "+cop(priceOf(p))).join("\\n")+footer+tags});
if(pros.length)reels.push({d:2,key:"pro",title:["La línea","Pro"],sub:"Para los que quieren más",items:pros,
  text:"La línea Pro 💎\\n\\n"+pros.map(p=>p.model+" "+p.storage+" ("+p.grade.name+"): "+cop(priceOf(p))).join("\\n")+footer+tags+" #iPhonePro"});
if(news.length)reels.push({d:4,key:"nuevos",title:["Lo más","nuevo"],sub:"iPhone 16 y 17",items:news,
  text:"Lo más nuevo ✨\\n\\n"+news.map(p=>p.model+" "+p.storage+": "+cop(priceOf(p))).join("\\n")+"\\n\\nUnidades limitadas."+footer+tags+" #iPhone16 #iPhone17"});
(async()=>{
  for(const r of reels){const date=ymd(r.d),base="reels/"+date+"-"+r.key;
    await reel(base+".mp4",r.title,r.sub,r.items);fs.writeFileSync(path.join(OUTDIR,base+"-portada.jpg"),portada(r.title,r.sub));
    plan.push({tipo:"REEL",fecha:date+"T12:30:00",archivo:base+".mp4",portada:base+"-portada.jpg",texto:r.text});}
  plan.sort((a,b)=>a.fecha.localeCompare(b.fecha));
  fs.writeFileSync(path.join(OUTDIR,"plan.json"),JSON.stringify(plan,null,1));
  console.log("Listo: "+plan.length+" publicaciones en "+OUTDIR+"/plan.json");
})();
`);
})();
