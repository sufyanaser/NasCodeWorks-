/* ============================================================
   NAS CodeWorks — Admin panel logic (complete)
   ============================================================ */
const STORE_KEY='nascw_content_v2_fallback';
const PASS_KEY='nascw_admin_pass';
const SESSION_KEY='nascw_admin_ok';
const DEFAULT_PASS='nascw2026';
const CONTENT_API='/api/v2-content';
const AUTH_API='/api/admin-auth';
let C=null, DEFAULTS=null;

const $=s=>document.querySelector(s);
const ce=(t,p={})=>Object.assign(document.createElement(t),p);
const ICONKEYS=['box','grid','dollar','clock','file','bell','desktop','archive','automation'];
const ICONS={box:'<path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>',grid:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h6"/>',dollar:'<path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>',clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',file:'<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>',bell:'<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/>',desktop:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',archive:'<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>',automation:'<path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/>'};
const svg=(p,sw=2)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}">${p}</svg>`;
const TRASH=svg('<path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>');
const UP=svg('<path d="M18 15l-6-6-6 6"/>'), DN=svg('<path d="M6 9l6 6 6-6"/>');

const SECTIONS=[
  {id:'hero',label:'الواجهة الرئيسية',icon:'<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>'},
  {id:'pain',label:'المشاكل',icon:'<path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L14.4 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01"/>'},
  {id:'ba',label:'قبل / بعد',icon:'<path d="M8 7h8M8 12h8M8 17h5M3 3v18"/>'},
  {id:'services',label:'الخدمات والأسعار',icon:'<path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>'},
  {id:'offers',label:'العروض الخاصة',icon:'<path d="M20.6 13.4L13.4 20.6a2 2 0 01-2.8 0l-7.2-7.2a2 2 0 010-2.8L10.6 3.4a2 2 0 011.4-.6h7a2 2 0 012 2v7a2 2 0 01-.6 1.4z"/><circle cx="7.5" cy="7.5" r="1.5"/>'},
  {id:'proof',label:'البرامج والصور',icon:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>'},
  {id:'process',label:'خطوات العمل',icon:'<path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>'},
  {id:'why',label:'جدول المقارنة',icon:'<path d="M3 3v18h18M9 17V9M15 17V5"/>'},
  {id:'start',label:'الدعوة + الوعود',icon:'<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>'},
  {id:'faq',label:'الأسئلة الشائعة',icon:'<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01"/>'},
  {id:'contact',label:'معلومات الاتصال',icon:'<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L8 10a16 16 0 006 6l1.6-1.2a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z"/>'},
  {id:'footer',label:'التذييل',icon:'<path d="M3 3h18v18H3zM3 15h18"/>'},
  {id:'settings',label:'الإعدادات',icon:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>'}
];

/* ---------- GATE ---------- */
async function initGate(){
  try{
    const r=await fetch(AUTH_API,{cache:'no-store'});
    const j=await r.json();
    if(r.ok && j.authenticated){
      sessionStorage.setItem(SESSION_KEY,'1');
      openAdmin();
      return;
    }
    if(j && j.configured===false) $('#gate-err').textContent='ADMIN_ACCESS_CODE غير مضاف في Vercel.';
  }catch{}
  const go=async()=>{
    const v=$('#gate-pass').value;
    $('#gate-err').textContent='جاري التحقق...';
    try{
      const r=await fetch(AUTH_API,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({code:v})
      });
      const j=await r.json();
      if(r.ok && j.ok && j.authenticated){
        sessionStorage.setItem(SESSION_KEY,'1');
        openAdmin();
      }else{
        $('#gate-err').textContent=(j&&j.message)||'الرمز غير صحيح';
        $('#gate-pass').value='';
      }
    }catch{
      $('#gate-err').textContent='تعذر الاتصال بخدمة تسجيل الدخول';
    }
  };
  $('#gate-go').onclick=()=>void go();
  $('#gate-pass').addEventListener('keydown',e=>{if(e.key==='Enter')void go();});
  $('#gate-pass').focus();
}
function openAdmin(){ $('#gate').style.display='none'; $('#adminroot').style.display='block'; boot(); }

/* ---------- LOAD ---------- */
async function loadAll(){
  try{
    const r=await fetch('content.json',{cache:'no-store'});
    if(r.ok) DEFAULTS=await r.json();
  }catch{}
  if(!DEFAULTS && window.__DEFAULT_CONTENT__) DEFAULTS=JSON.parse(JSON.stringify(window.__DEFAULT_CONTENT__));
  try{
    const r=await fetch(CONTENT_API,{cache:'no-store'});
    const j=await r.json();
    if(r.ok && j.ok && j.content){
      C=JSON.parse(JSON.stringify(j.content));
      return;
    }
  }catch{}
  try{
    const s=localStorage.getItem(STORE_KEY);
    if(s){
      C=JSON.parse(s);
      return;
    }
  }catch{}
  C=JSON.parse(JSON.stringify(DEFAULTS||{}));
  if(!DEFAULTS) DEFAULTS=JSON.parse(JSON.stringify(C));
}

/* ---------- SAVE ---------- */
async function save(silent){
  C.meta=C.meta||{};
  C.meta.updatedAt=new Date().toISOString();
  try{ localStorage.setItem(STORE_KEY,JSON.stringify(C)); }catch{}
  try{
    const r=await fetch(CONTENT_API,{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(C)
    });
    const j=await r.json();
    if(!r.ok || !j.ok) throw new Error((j&&j.message)||'فشل الحفظ السحابي');
    if(!silent) toast('تم الحفظ سحابياً ✓');
    return true;
  }catch{
    toast((e&&e.message)||'فشل الحفظ السحابي',true);
    return false;
  }
}
function toast(msg,err){
  const t=$('#toast'); $('#toast-msg').textContent=msg;
  t.style.borderColor=err?'var(--red)':'var(--green)';
  t.querySelector('svg').style.color=err?'var(--red)':'var(--green)';
  t.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('show'),2800);
}

/* ---------- IMAGE COMPRESS ---------- */
function fileToCompressedDataURL(file,maxW=1600,quality=.82){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=()=>{ const img=new Image();
      img.onload=()=>{ let w=img.width,h=img.height;
        if(w>maxW){ h=Math.round(h*maxW/w); w=maxW; }
        const cv=ce('canvas'); cv.width=w; cv.height=h;
        cv.getContext('2d').drawImage(img,0,0,w,h);
        res(cv.toDataURL('image/jpeg',quality));
      }; img.onerror=rej; img.src=r.result;
    }; r.onerror=rej; r.readAsDataURL(file);
  });
}

/* ---------- FIELD HELPERS ---------- */
function fText(label,val,onInput,hint){
  const w=ce('div',{className:'fld'});
  w.innerHTML=`<label>${label}</label><input type="text">${hint?`<div class="sm">${hint}</div>`:''}`;
  const inp=w.querySelector('input'); inp.value=val||'';
  inp.addEventListener('input',e=>onInput(e.target.value));
  return w;
}
function fArea(label,val,onInput,hint){
  const w=ce('div',{className:'fld'});
  w.innerHTML=`<label>${label}</label><textarea></textarea>${hint?`<div class="sm">${hint}</div>`:''}`;
  const ta=w.querySelector('textarea'); ta.value=val||'';
  ta.addEventListener('input',e=>onInput(e.target.value));
  return w;
}
function cardWrap(secId,title,hint,body){
  const c=ce('div',{className:'card'});
  const meta=SECTIONS.find(s=>s.id===secId)||{icon:''};
  c.innerHTML=`<div class="card-h"><div class="ci">${svg(meta.icon)}</div><div><h2>${title}</h2>${hint?`<div class="hint">${hint}</div>`:''}</div></div>`;
  c.appendChild(body); return c;
}
function listEditor(arr,onChange,placeholder){
  const box=ce('div');
  const render=()=>{
    box.innerHTML='';
    arr.forEach((v,i)=>{
      const row=ce('div',{className:'list-item'});
      row.innerHTML=`<input type="text" placeholder="${placeholder||''}">
        <div class="ord"><button class="mini" data-up>${UP}</button><button class="mini" data-dn>${DN}</button></div>
        <button class="mini del" data-del>${TRASH}</button>`;
      const inp=row.querySelector('input'); inp.value=v||'';
      inp.addEventListener('input',e=>{arr[i]=e.target.value;if(onChange)onChange();});
      row.querySelector('[data-up]').onclick=()=>{if(i>0){[arr[i-1],arr[i]]=[arr[i],arr[i-1]];if(onChange)onChange();render();}};
      row.querySelector('[data-dn]').onclick=()=>{if(i<arr.length-1){[arr[i+1],arr[i]]=[arr[i],arr[i+1]];if(onChange)onChange();render();}};
      row.querySelector('[data-del]').onclick=()=>{arr.splice(i,1);if(onChange)onChange();render();};
      box.appendChild(row);
    });
    const add=ce('button',{className:'add-btn',innerHTML:svg('<path d="M12 5v14M5 12h14"/>')+' إضافة عنصر'});
    add.onclick=()=>{arr.push('');if(onChange)onChange();render();};
    box.appendChild(add);
  };
  render(); return box;
}
function scHead(num,label){
  return `<div class="sc-head"><div class="t"><span class="num">${num}</span>${label}</div>
    <div style="display:flex;gap:6px"><button class="mini" data-up>${UP}</button><button class="mini" data-dn>${DN}</button><button class="mini del" data-del>${TRASH}</button></div></div>`;
}
function moveBinds(sc,arr,i,render){
  sc.querySelector('[data-up]').onclick=()=>{if(i>0){[arr[i-1],arr[i]]=[arr[i],arr[i-1]];render();}};
  sc.querySelector('[data-dn]').onclick=()=>{if(i<arr.length-1){[arr[i+1],arr[i]]=[arr[i],arr[i+1]];render();}};
  sc.querySelector('[data-del]').onclick=()=>{arr.splice(i,1);render();};
}

/* ---------- SECTION BUILDERS ---------- */
const B={};

B.hero=()=>{
  const h=C.hero, b=ce('div');
  b.appendChild(fText('شريط علوي (Pill)',h.pill,v=>h.pill=v));
  b.appendChild(fText('العنوان — السطر الأول',h.titleLine1,v=>h.titleLine1=v));
  b.appendChild(fText('العنوان — الجزء المميّز (ملوّن)',h.titleHl,v=>h.titleHl=v));
  b.appendChild(fText('العنوان — السطر الثالث',h.titleLine3,v=>h.titleLine3=v));
  b.appendChild(fArea('النص التعريفي',h.sub,v=>h.sub=v));
  b.appendChild(fArea('السطر الصغير',h.micro,v=>h.micro=v));
  const t=ce('div',{className:'fld'}); t.innerHTML='<label>شارات الثقة</label>';
  t.appendChild(listEditor(h.trust,null,'شارة ثقة')); b.appendChild(t);
  return cardWrap('hero','الواجهة الرئيسية','أول ما يشوفه الزائر',b);
};

B.pain=()=>{
  const p=C.pain, b=ce('div');
  b.appendChild(fText('العنوان الفرعي',p.kicker,v=>p.kicker=v));
  b.appendChild(fText('العنوان',p.title,v=>p.title=v));
  b.appendChild(fArea('الوصف',p.sub,v=>p.sub=v));
  const list=ce('div');
  const render=()=>{
    list.innerHTML='';
    p.items.forEach((it,i)=>{
      const sc=ce('div',{className:'sub-card'});
      sc.innerHTML=scHead(i+1,'بطاقة مشكلة');
      const isel=ce('div',{className:'fld'}); isel.innerHTML='<label>الأيقونة</label>';
      const ib=ce('div',{className:'row-icon-sel'});
      ICONKEYS.forEach(k=>{const btn=ce('button',{innerHTML:svg(ICONS[k]),className:it.icon===k?'sel':''});btn.onclick=()=>{it.icon=k;render();};ib.appendChild(btn);});
      isel.appendChild(ib); sc.appendChild(isel);
      sc.appendChild(fText('العنوان',it.title,v=>it.title=v));
      sc.appendChild(fArea('الوصف',it.body,v=>it.body=v));
      sc.appendChild(fText('اقتباس بلهجة العميل',it.quote,v=>it.quote=v,'يظهر بين «»'));
      moveBinds(sc,p.items,i,render);
      list.appendChild(sc);
    });
    const add=ce('button',{className:'add-btn',innerHTML:svg('<path d="M12 5v14M5 12h14"/>')+' إضافة بطاقة مشكلة'});
    add.onclick=()=>{p.items.push({icon:'box',title:'',body:'',quote:''});render();};
    list.appendChild(add);
  };
  render(); b.appendChild(list);
  return cardWrap('pain','المشاكل','بطاقات الألم الملموسة',b);
};

B.ba=()=>{
  const x=C.ba, b=ce('div');
  b.appendChild(fText('العنوان الفرعي',x.kicker,v=>x.kicker=v));
  b.appendChild(fText('العنوان',x.title,v=>x.title=v));
  b.appendChild(fArea('الوصف',x.sub,v=>x.sub=v));
  const bf=ce('div',{className:'fld'}); bf.innerHTML='<label>قبل — الوضع الحالي</label>'; bf.appendChild(listEditor(x.before,null,'بند')); b.appendChild(bf);
  const af=ce('div',{className:'fld'}); af.innerHTML='<label>بعد — مع البرنامج</label>'; af.appendChild(listEditor(x.after,null,'بند')); b.appendChild(af);
  return cardWrap('ba','قبل / بعد','المقارنة الملموسة',b);
};

B.services=()=>{
  const s=C.services, b=ce('div');
  b.appendChild(fText('العنوان الفرعي',s.kicker,v=>s.kicker=v));
  b.appendChild(fText('العنوان',s.title,v=>s.title=v));
  b.appendChild(fArea('الوصف',s.sub,v=>s.sub=v));
  const list=ce('div');
  const SICONS=['desktop','archive','automation','box','grid','dollar','clock','file','bell'];
  const render=()=>{
    list.innerHTML='';
    s.items.forEach((it,i)=>{
      const sc=ce('div',{className:'sub-card'});
      sc.innerHTML=scHead(i+1,'خدمة');
      const tg=ce('div',{className:'toggle'+(it.featured?' on':'')});
      tg.innerHTML=`<div class="sw"></div><div><div class="tl">خدمة مميّزة (إطار بنفسجي)</div><div class="ts">تظهر بإطار بارز</div></div>`;
      tg.onclick=()=>{it.featured=!it.featured;render();}; sc.appendChild(tg);
      sc.appendChild(fText('شارة (Badge) — فارغة = مخفية',it.badge,v=>it.badge=v));
      const isel=ce('div',{className:'fld'}); isel.innerHTML='<label>الأيقونة</label>';
      const ib=ce('div',{className:'row-icon-sel'});
      SICONS.forEach(k=>{const btn=ce('button',{innerHTML:svg(ICONS[k]),className:it.icon===k?'sel':''});btn.onclick=()=>{it.icon=k;render();};ib.appendChild(btn);});
      isel.appendChild(ib); sc.appendChild(isel);
      sc.appendChild(fText('عنوان الخدمة',it.title,v=>it.title=v));
      sc.appendChild(fArea('الوصف',it.desc,v=>it.desc=v));
      const ff=ce('div',{className:'fld'}); ff.innerHTML='<label>المميزات</label>'; ff.appendChild(listEditor(it.feats,null,'ميزة')); sc.appendChild(ff);
      const g=ce('div',{className:'grid3'});
      g.appendChild(fText('تسمية السعر',it.priceLabel,v=>it.priceLabel=v));
      g.appendChild(fText('المبلغ',it.priceAmount,v=>it.priceAmount=v));
      g.appendChild(fText('الوحدة',it.priceUnit,v=>it.priceUnit=v));
      sc.appendChild(g);
      sc.appendChild(fText('ملاحظة السعر',it.priceNote,v=>it.priceNote=v));
      sc.appendChild(fText('نص رسالة الواتساب',it.waText,v=>it.waText=v));
      moveBinds(sc,s.items,i,render);
      list.appendChild(sc);
    });
    const add=ce('button',{className:'add-btn',innerHTML:svg('<path d="M12 5v14M5 12h14"/>')+' إضافة خدمة'});
    add.onclick=()=>{s.items.push({icon:'desktop',featured:false,badge:'',title:'',desc:'',feats:[''],priceLabel:'يبدأ من',priceAmount:'$',priceUnit:'وفوق',priceNote:'',waText:''});render();};
    list.appendChild(add);
  };
  render(); b.appendChild(list);
  const nf=ce('div',{className:'fld'}); nf.innerHTML='<label>ملاحظات أسفل الأسعار</label>'; nf.appendChild(listEditor(s.notes,null,'ملاحظة')); b.appendChild(nf);
  return cardWrap('services','الخدمات والأسعار','عدّل الخدمات والتسعير',b);
};

B.offers=()=>{
  const o=C.offers||(C.offers={enabled:false,title:'',body:'',badge:'',waText:''});
  const b=ce('div');
  const tg=ce('div',{className:'toggle'+(o.enabled?' on':'')});
  tg.innerHTML=`<div class="sw"></div><div><div class="tl">تفعيل شريط العرض</div><div class="ts">يظهر بين الخدمات والإثبات</div></div>`;
  tg.onclick=()=>{o.enabled=!o.enabled;tg.classList.toggle('on');}; b.appendChild(tg);
  b.appendChild(fText('شارة العرض (Badge)',o.badge,v=>o.badge=v,'مثال: عرض محدود'));
  b.appendChild(fText('عنوان العرض',o.title,v=>o.title=v));
  b.appendChild(fArea('تفاصيل العرض',o.body,v=>o.body=v));
  b.appendChild(fText('نص رسالة الواتساب',o.waText,v=>o.waText=v));
  return cardWrap('offers','العروض الخاصة','شريط ترويجي اختياري',b);
};

B.proof=()=>{
  const p=C.proof, b=ce('div');
  b.appendChild(fText('العنوان الفرعي',p.kicker,v=>p.kicker=v));
  b.appendChild(fText('العنوان',p.title,v=>p.title=v));
  b.appendChild(fArea('الوصف',p.sub,v=>p.sub=v));
  b.appendChild(ce('div',{innerHTML:'<div class="warn">'+svg('<path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L14.4 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01"/>')+' الصور تُضغط تلقائياً وتُخزّن داخل المتصفح. مع كثرة الصور قد يمتلئ التخزين — استعمل «تصدير JSON» للنسخ الاحتياطي بشكل دوري.</div>'}));
  const list=ce('div');
  const render=()=>{
    list.innerHTML='';
    p.items.forEach((it,i)=>{
      if(!it.images) it.images=[];
      const sc=ce('div',{className:'sub-card'});
      sc.innerHTML=scHead(i+1,'برنامج');
      sc.appendChild(fText('الوسم (Tag)',it.tag,v=>it.tag=v));
      sc.appendChild(fText('اسم البرنامج',it.title,v=>it.title=v));
      sc.appendChild(fArea('الوصف',it.desc,v=>it.desc=v));
      const imw=ce('div',{className:'fld'});
      imw.innerHTML='<label>صور المعرض — أول صورة هي الغلاف (الضغط عليها بالموقع يفتح السلايد شو)</label>';
      const grid=ce('div',{className:'img-grid'});
      const drawImgs=()=>{
        grid.innerHTML='';
        it.images.forEach((src,k)=>{
          const cell=ce('div',{className:'img-cell'});
          cell.innerHTML=`<img src="${src}" alt="">${k===0?'<span class="badge">غلاف</span>':''}
            <div class="ig-ov">
              <button data-l>${svg('<path d="M15 18l-6-6 6-6"/>')}</button>
              <button data-r>${svg('<path d="M9 18l6-6-6-6"/>')}</button>
              <button class="del" data-d>${TRASH}</button></div>`;
          cell.querySelector('[data-l]').onclick=()=>{if(k>0){[it.images[k-1],it.images[k]]=[it.images[k],it.images[k-1]];drawImgs();}};
          cell.querySelector('[data-r]').onclick=()=>{if(k<it.images.length-1){[it.images[k+1],it.images[k]]=[it.images[k],it.images[k+1]];drawImgs();}};
          cell.querySelector('[data-d]').onclick=()=>{it.images.splice(k,1);drawImgs();};
          grid.appendChild(cell);
        });
      };
      drawImgs(); imw.appendChild(grid);
      const drop=ce('div',{className:'drop'});
      drop.innerHTML=svg('<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>')+'<div class="dt">ارفع صور من جهازك</div><div class="ds">اضغط أو اسحب الصور هنا · تُضغط تلقائياً</div>';
      const inp=ce('input',{type:'file',accept:'image/*',multiple:true,style:'display:none'});
      drop.onclick=()=>inp.click();
      const handle=async files=>{ for(const f of files){ if(!f.type.startsWith('image/'))continue; try{it.images.push(await fileToCompressedDataURL(f));}catch{} } drawImgs(); toast('تمت إضافة الصور — لا تنسَ الحفظ'); };
      inp.onchange=e=>handle(e.target.files);
      drop.addEventListener('dragover',e=>{e.preventDefault();drop.style.borderColor='var(--cyan)';});
      drop.addEventListener('dragleave',()=>drop.style.borderColor='');
      drop.addEventListener('drop',e=>{e.preventDefault();drop.style.borderColor='';handle(e.dataTransfer.files);});
      imw.appendChild(inp); imw.appendChild(drop);
      const urow=ce('div',{className:'url-row'});
      urow.innerHTML=`<input type="text" placeholder="أو الصق رابط صورة https://..."><button class="mini" style="padding:0 14px">${svg('<path d="M12 5v14M5 12h14"/>')} أضف</button>`;
      urow.querySelector('button').onclick=()=>{const v=urow.querySelector('input').value.trim();if(v){it.images.push(v);urow.querySelector('input').value='';drawImgs();}};
      imw.appendChild(urow); sc.appendChild(imw);
      sc.querySelector('[data-up]').onclick=()=>{if(i>0){[p.items[i-1],p.items[i]]=[p.items[i],p.items[i-1]];render();}};
      sc.querySelector('[data-dn]').onclick=()=>{if(i<p.items.length-1){[p.items[i+1],p.items[i]]=[p.items[i],p.items[i+1]];render();}};
      sc.querySelector('[data-del]').onclick=()=>{if(confirm('حذف هذا البرنامج؟')){p.items.splice(i,1);render();}};
      list.appendChild(sc);
    });
    const add=ce('button',{className:'add-btn',innerHTML:svg('<path d="M12 5v14M5 12h14"/>')+' إضافة برنامج جديد'});
    add.onclick=()=>{p.items.push({tag:'',title:'',desc:'',images:[]});render();};
    list.appendChild(add);
  };
  render(); b.appendChild(list);

  // founder
  const f=p.founder||(p.founder={initial:'س',name:'',role:'',bio:'',stats:[]});
  const fc=ce('div',{className:'sub-card'});
  fc.innerHTML=`<div class="sc-head"><div class="t">${svg('<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>')} بطاقة المؤسس</div></div>`;
  const avw=ce('div',{className:'fld'}); avw.innerHTML='<label>صورة المؤسس (اختياري — تحل محل الحرف)</label>';
  const avPrev=ce('div',{style:'display:flex;gap:12px;align-items:center;flex-wrap:wrap'});
  const drawAv=()=>{
    avPrev.innerHTML='';
    if(f.avatar){
      const img=ce('img',{src:f.avatar}); img.style.cssText='width:54px;height:54px;border-radius:12px;object-fit:cover;border:1px solid var(--line)';
      const del=ce('button',{className:'mini del',innerHTML:TRASH+' حذف الصورة'}); del.onclick=()=>{delete f.avatar;drawAv();};
      avPrev.appendChild(img); avPrev.appendChild(del);
    } else {
      const av=ce('div'); av.style.cssText='width:54px;height:54px;border-radius:12px;background:linear-gradient(135deg,var(--cyan),var(--violet));display:grid;place-items:center;font-size:22px;font-weight:700;color:#081019'; av.textContent=f.initial||'س';
      const up=ce('button',{className:'mini',innerHTML:svg('<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>')+' رفع صورة'});
      const inp=ce('input',{type:'file',accept:'image/*',style:'display:none'});
      up.onclick=()=>inp.click();
      inp.onchange=async e=>{const file=e.target.files[0];if(file){f.avatar=await fileToCompressedDataURL(file,500,.85);drawAv();}};
      avPrev.appendChild(av); avPrev.appendChild(up); avPrev.appendChild(inp);
    }
  };
  drawAv(); avw.appendChild(avPrev); fc.appendChild(avw);
  fc.appendChild(fText('حرف افتراضي (لو ما في صورة)',f.initial,v=>f.initial=v));
  fc.appendChild(fText('الاسم',f.name,v=>f.name=v));
  fc.appendChild(fText('المسمّى',f.role,v=>f.role=v));
  fc.appendChild(fArea('النبذة',f.bio,v=>f.bio=v));
  // stats
  const sw=ce('div',{className:'fld'}); sw.innerHTML='<label>الأرقام (3 خانات: رقم + تسمية)</label>';
  const sList=ce('div');
  if(!f.stats) f.stats=[];
  const drawStats=()=>{
    sList.innerHTML='';
    f.stats.forEach((st,k)=>{
      const row=ce('div',{className:'list-item'});
      row.innerHTML=`<input type="text" placeholder="رقم" style="max-width:120px"><input type="text" placeholder="تسمية"><button class="mini del" data-del>${TRASH}</button>`;
      const [a,c]=row.querySelectorAll('input'); a.value=st.n||''; c.value=st.l||'';
      a.addEventListener('input',e=>st.n=e.target.value); c.addEventListener('input',e=>st.l=e.target.value);
      row.querySelector('[data-del]').onclick=()=>{f.stats.splice(k,1);drawStats();};
      sList.appendChild(row);
    });
    const add=ce('button',{className:'add-btn',innerHTML:svg('<path d="M12 5v14M5 12h14"/>')+' إضافة رقم'});
    add.onclick=()=>{f.stats.push({n:'',l:''});drawStats();};
    sList.appendChild(add);
  };
  drawStats(); sw.appendChild(sList); fc.appendChild(sw);
  if(list.parentNode)b.appendChild(fc);
  return cardWrap('proof','البرامج والصور','أضف برامجك وصورها — سلايد شو احترافي',b);
};

B.process=()=>{
  const p=C.process, b=ce('div');
  b.appendChild(fText('العنوان الفرعي',p.kicker,v=>p.kicker=v));
  b.appendChild(fText('العنوان',p.title,v=>p.title=v));
  b.appendChild(fArea('الوصف',p.sub,v=>p.sub=v));
  const list=ce('div');
  const render=()=>{
    list.innerHTML='';
    p.steps.forEach((st,i)=>{
      const sc=ce('div',{className:'sub-card'}); sc.innerHTML=scHead(i+1,'خطوة');
      sc.appendChild(fText('العنوان',st.title,v=>st.title=v));
      sc.appendChild(fArea('الوصف',st.body,v=>st.body=v));
      sc.appendChild(fText('التوقيت',st.when,v=>st.when=v));
      moveBinds(sc,p.steps,i,render); list.appendChild(sc);
    });
    const add=ce('button',{className:'add-btn',innerHTML:svg('<path d="M12 5v14M5 12h14"/>')+' إضافة خطوة'});
    add.onclick=()=>{p.steps.push({title:'',body:'',when:''});render();};
    list.appendChild(add);
  };
  render(); b.appendChild(list);
  return cardWrap('process','خطوات العمل','مراحل التعامل مع العميل',b);
};

B.why=()=>{
  const w=C.why, b=ce('div');
  b.appendChild(fText('العنوان الفرعي',w.kicker,v=>w.kicker=v));
  b.appendChild(fText('العنوان',w.title,v=>w.title=v));
  b.appendChild(fArea('الوصف',w.sub,v=>w.sub=v));
  const cf=ce('div',{className:'grid3'});
  if(!w.cols) w.cols=['','',''];
  cf.appendChild(fText('عمودنا',w.cols[0],v=>w.cols[0]=v));
  cf.appendChild(fText('العمود 2',w.cols[1],v=>w.cols[1]=v));
  cf.appendChild(fText('العمود 3',w.cols[2],v=>w.cols[2]=v));
  b.appendChild(cf);
  const list=ce('div');
  const ySel=(o,onCh)=>{
    const wrap=ce('div',{className:'row-icon-sel'});
    const opts=[['نعم',true],['لا',false],['محايد',null]];
    opts.forEach(([lbl,val])=>{
      const btn=ce('button',{textContent:lbl,style:'width:auto;padding:0 12px;font-size:12px;font-weight:600',className:o.yes===val?'sel':''});
      btn.onclick=()=>{o.yes=val;onCh();};
      wrap.appendChild(btn);
    });
    return wrap;
  };
  const render=()=>{
    list.innerHTML='';
    w.rows.forEach((r,i)=>{
      const sc=ce('div',{className:'sub-card'}); sc.innerHTML=scHead(i+1,'صف مقارنة');
      sc.appendChild(fText('المعيار',r.criteria,v=>r.criteria=v));
      [['us','عمودنا'],['c2','العمود 2'],['c3','العمود 3']].forEach(([key,lbl])=>{
        const o=r[key]||(r[key]={yes:null,text:''});
        const wrap=ce('div',{className:'fld'}); wrap.innerHTML=`<label>${lbl}</label>`;
        wrap.appendChild(ySel(o,()=>render()));
        const inp=ce('input',{type:'text',placeholder:'النص'}); inp.style.cssText='margin-top:7px;width:100%;background:#0a1322;border:1px solid var(--line);border-radius:10px;padding:9px 12px;color:var(--fg);font-family:inherit;font-size:13px';
        inp.value=o.text||''; inp.addEventListener('input',e=>o.text=e.target.value);
        wrap.appendChild(inp); sc.appendChild(wrap);
      });
      moveBinds(sc,w.rows,i,render); list.appendChild(sc);
    });
    const add=ce('button',{className:'add-btn',innerHTML:svg('<path d="M12 5v14M5 12h14"/>')+' إضافة صف'});
    add.onclick=()=>{w.rows.push({criteria:'',us:{yes:true,text:''},c2:{yes:null,text:''},c3:{yes:false,text:''}});render();};
    list.appendChild(add);
  };
  render(); b.appendChild(list);
  return cardWrap('why','جدول المقارنة','ليش إحنا مقابل البدائل',b);
};

B.start=()=>{
  const s=C.start, b=ce('div');
  b.appendChild(fText('العنوان',s.title,v=>s.title=v));
  b.appendChild(fArea('النص',s.body,v=>s.body=v));
  b.appendChild(fText('نص رسالة الواتساب',s.waText,v=>s.waText=v));
  const list=ce('div'); const lbl=ce('div',{className:'fld'}); lbl.innerHTML='<label>الوعود الثلاثة</label>'; b.appendChild(lbl);
  const render=()=>{
    list.innerHTML='';
    s.promises.forEach((pr,i)=>{
      const sc=ce('div',{className:'sub-card'}); sc.innerHTML=scHead(i+1,'وعد');
      sc.appendChild(fText('العنوان',pr.title,v=>pr.title=v));
      sc.appendChild(fText('الوصف',pr.sub,v=>pr.sub=v));
      moveBinds(sc,s.promises,i,render); list.appendChild(sc);
    });
    const add=ce('button',{className:'add-btn',innerHTML:svg('<path d="M12 5v14M5 12h14"/>')+' إضافة وعد'});
    add.onclick=()=>{s.promises.push({title:'',sub:''});render();};
    list.appendChild(add);
  };
  render(); b.appendChild(list);
  return cardWrap('start','الدعوة + الوعود','قسم بدء الاستشارة',b);
};

B.faq=()=>{
  const fq=C.faq, b=ce('div');
  b.appendChild(fText('العنوان الفرعي',fq.kicker,v=>fq.kicker=v));
  b.appendChild(fText('العنوان',fq.title,v=>fq.title=v));
  const list=ce('div');
  const render=()=>{
    list.innerHTML='';
    fq.items.forEach((it,i)=>{
      const sc=ce('div',{className:'sub-card'}); sc.innerHTML=scHead(i+1,'سؤال');
      sc.appendChild(fText('السؤال',it.q,v=>it.q=v));
      sc.appendChild(fArea('الجواب',it.a,v=>it.a=v));
      moveBinds(sc,fq.items,i,render); list.appendChild(sc);
    });
    const add=ce('button',{className:'add-btn',innerHTML:svg('<path d="M12 5v14M5 12h14"/>')+' إضافة سؤال'});
    add.onclick=()=>{fq.items.push({q:'',a:''});render();};
    list.appendChild(add);
  };
  render(); b.appendChild(list);
  return cardWrap('faq','الأسئلة الشائعة','أسئلة وأجوبة',b);
};

B.contact=()=>{
  const ct=C.contact, b=ce('div');
  b.appendChild(fText('رقم الهاتف (للعرض)',ct.phone,v=>ct.phone=v,'مثال: +9647708111744'));
  b.appendChild(fText('رقم الواتساب (أرقام فقط بدون + أو مسافات)',ct.waNumber,v=>ct.waNumber=v,'مثال: 9647708111744 — يُستعمل بكل أزرار الواتساب'));
  b.appendChild(fText('البريد الإلكتروني',ct.email,v=>ct.email=v));
  b.appendChild(fText('الموقع الجغرافي',ct.location,v=>ct.location=v));
  return cardWrap('contact','معلومات الاتصال','تتغيّر في كل الموقع تلقائياً',b);
};

B.footer=()=>{
  const f=C.footer, b=ce('div');
  b.appendChild(fArea('النبذة',f.tagline,v=>f.tagline=v));
  b.appendChild(fText('السطر السفلي (يمين)',f.bottomLeft,v=>f.bottomLeft=v));
  b.appendChild(fText('السطر السفلي (يسار)',f.bottomRight,v=>f.bottomRight=v));
  return cardWrap('footer','التذييل','أسفل الموقع',b);
};

B.settings=()=>{
  const b=ce('div');
  b.appendChild(ce('div',{innerHTML:'<div class="warn">'+svg('<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>')+' رمز الدخول هنا يحمي الواجهة فقط (يُخزّن بالمتصفح). للحماية الفعلية بعد النشر على /admin يلزم Backend — المرحلة الثانية.</div>'}));
  const pf=ce('div',{className:'fld'}); pf.innerHTML='<label>تغيير رمز الدخول</label><input type="text" id="set-pass" placeholder="رمز جديد"><div class="sm">الحالي محفوظ بالمتصفح. اتركه فارغاً لعدم التغيير.</div>';
  b.appendChild(pf);
  const sp=ce('button',{className:'tbtn save',style:'margin-bottom:18px',innerHTML:'حفظ الرمز الجديد'});
  sp.onclick=()=>{const v=pf.querySelector('#set-pass').value.trim();if(v){localStorage.setItem(PASS_KEY,v);toast('تم تغيير رمز الدخول');pf.querySelector('#set-pass').value='';}};
  b.appendChild(sp);
  b.appendChild(ce('hr',{style:'border:none;border-top:1px solid var(--line-soft);margin:6px 0 18px'}));
  // reset
  const rf=ce('div',{className:'fld'}); rf.innerHTML='<label>استعادة المحتوى الافتراضي</label><div class="sm">يحذف كل تعديلاتك ويرجّع النص الأصلي. لا يمكن التراجع.</div>';
  b.appendChild(rf);
  const rb=ce('button',{className:'tbtn danger',innerHTML:TRASH+' إعادة ضبط المحتوى'});
  rb.onclick=()=>{ if(confirm('متأكد؟ سيُحذف كل التعديلات والصور.')){ localStorage.removeItem(STORE_KEY); C=JSON.parse(JSON.stringify(DEFAULTS)); toast('تمت الإعادة'); switchTo('hero'); } };
  b.appendChild(rb);
  return cardWrap('settings','الإعدادات','الأمان والصيانة',b);
};

/* ---------- NAV / SWITCH ---------- */
let CUR='hero';
function buildSide(){
  const side=$('#side'); side.innerHTML='';
  SECTIONS.forEach(s=>{
    const a=ce('a',{className:s.id===CUR?'active':'',innerHTML:svg(s.icon)+'<span>'+s.label+'</span>'});
    a.onclick=()=>switchTo(s.id); side.appendChild(a);
  });
}
function switchTo(id){
  CUR=id; buildSide();
  const main=$('#main'); main.innerHTML='';
  main.appendChild(B[id]());
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ---------- TOPBAR ACTIONS ---------- */
function bindTopbar(){
  $('#btn-save').onclick=()=>save();
  $('#btn-preview').onclick=()=>{ void save(true); window.open('index.html','_blank'); };
  $('#btn-export').onclick=()=>{
    void save(true);
    const blob=new Blob([JSON.stringify(C,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob); const a=ce('a',{href:url,download:'content.json'}); a.click();
    URL.revokeObjectURL(url); toast('تم تصدير content.json — ارفعه مع الموقع');
  };
  $('#btn-import').onclick=()=>$('#file-import').click();
  $('#file-import').onchange=e=>{
    const file=e.target.files[0]; if(!file)return;
    const r=new FileReader();
    r.onload=()=>{ try{ C=JSON.parse(r.result); void save(true); toast('تم الاستيراد'); switchTo(CUR); }catch{ toast('ملف غير صالح',true); } };
    r.readAsText(file); e.target.value='';
  };
}

/* ---------- BOOT ---------- */
async function boot(){
  await loadAll();
  bindTopbar(); buildSide(); switchTo('hero');
}
initGate();


