/* ============================================================
   APEX — app core
   Router + render + persistence + logging. Reads the plan from
   window.PROGRAM (program.js). Knows nothing about plan content.
   ============================================================ */
'use strict';

/* ---------- storage (localStorage w/ in-memory fallback) ---------- */
const Store = (() => {
  let ls, mem = {};
  try { ls = window.localStorage; const t='__apex__'; ls.setItem(t,'1'); ls.removeItem(t); }
  catch(e){ ls = null; }
  const get = (k,d=null) => {
    try { const v = ls ? ls.getItem(k) : mem[k]; return v==null ? d : JSON.parse(v); }
    catch(e){ return d; }
  };
  const set = (k,v) => {
    const s = JSON.stringify(v);
    try { ls ? ls.setItem(k,s) : (mem[k]=s); } catch(e){ mem[k]=s; }
  };
  return { get, set };
})();

/* ---------- app state ---------- */
const State = {
  get profile(){ return Store.get('apex.profile', { name:null, units:'imperial', dark:true, startDate:null }); },
  set profile(v){ Store.set('apex.profile', v); },
  logKey: (w,d) => `apex.log.w${w}d${d}`,
  getLog: (w,d) => Store.get(State.logKey(w,d), {}),
  setLog: (w,d,v) => Store.set(State.logKey(w,d), v),
};

/* ---------- dom helpers ---------- */
const $ = (s,root=document) => root.querySelector(s);
function el(tag, attrs={}, children=[]){
  const n = document.createElement(tag);
  for(const [k,v] of Object.entries(attrs)){
    if(k==='class') n.className = v;
    else if(k==='html') n.innerHTML = v;
    else if(k.startsWith('on') && typeof v==='function') n.addEventListener(k.slice(2),v);
    else if(v!=null) n.setAttribute(k,v);
  }
  (Array.isArray(children)?children:[children]).forEach(c=>{
    if(c==null) return;
    n.appendChild(typeof c==='string' ? document.createTextNode(c) : c);
  });
  return n;
}

/* ---------- date / week math ---------- */
function currentWeek(){
  const p = State.profile;
  if(!p.startDate) return 1;
  const days = Math.floor((Date.now() - new Date(p.startDate)) / 86400000);
  return Math.min(PROGRAM.weeks.length, Math.max(1, Math.floor(days/7)+1));
}
function todayIndex(){ return (new Date().getDay()+6)%7; } // Mon=0

/* ---------- router ---------- */
const Views = {};
let currentRoute = 'today';
function route(r){
  currentRoute = r;
  const main = $('#main');
  main.innerHTML = '';
  (Views[r] || Views.today)(main);
  document.querySelectorAll('.nav-btn').forEach(b=>
    b.classList.toggle('active', b.dataset.route===r));
  window.scrollTo(0,0);
}

/* ---------- render helpers ---------- */
function topbar(sub){
  return el('div',{class:'topbar'},[
    el('div',{class:'brand'},[
      el('span',{class:'brand-mark',html:'APEX<span class="dot">.</span>'}),
    ]),
    el('span',{class:'sub'}, sub||''),
  ]);
}
function rxLine(it){
  if(it.kind==='lift') return `${it.sets}×${it.reps} · ${it.load||''}${it.rest?' · rest '+it.rest:''}`;
  if(it.kind==='run'){
    if(it.format==='interval'||it.format==='sprint')
      return `${it.reps}×${it.distance}${it.pace?' @ '+it.pace:''}${it.rest?' · '+it.rest+' rest':''}`;
    return `${it.distance||''}${it.pace?' @ '+it.pace:''}`;
  }
  if(it.kind==='hold') return `${it.sets}×${it.duration}`;
  if(it.kind==='plyo') return `${it.sets}×${it.reps}`;
  return '';
}
function tagClass(kind){
  return kind==='run'||kind==='plyo' ? 'run' : kind==='lift' ? 'lift'
    : kind==='hold' ? 'skill' : '';
}

/* ============================================================
   VIEW: TODAY
   ============================================================ */
Views.today = (root) => {
  root.appendChild(topbar('TODAY'));
  const w = currentWeek();
  const week = PROGRAM.weeks[w-1];
  const dIdx = Math.min((week?.days.length||1)-1, todayIndex());
  const d = week?.days[dIdx];

  const wrap = el('div',{class:'view'});
  if(!d){ wrap.appendChild(el('div',{class:'placeholder'},'No session scheduled.')); root.appendChild(wrap); return; }

  wrap.appendChild(el('div',{class:'hero'},[
    el('p',{class:'eyebrow'}, `${week.title} · DAY ${dIdx+1}`),
    el('h1',{}, d.name),
    el('div',{class:'meta'},[
      el('div',{},[el('b',{},String(w)),'WEEK']),
      el('div',{},[el('b',{},String(d.sections.length)),'BLOCKS']),
      el('div',{},[el('b',{},streakCount()+''),'DAY STREAK']),
    ]),
  ]));

  wrap.appendChild(el('button',{class:'btn',onclick:()=>openSession(w,dIdx)},
    d.kind==='rest' ? 'Open recovery' : 'Start session'));

  root.appendChild(wrap);
};

function streakCount(){
  // counts back-to-back days with any logged session
  let n=0;
  for(let w=1; w<=PROGRAM.weeks.length; w++){
    const days = PROGRAM.weeks[w-1].days.length;
    for(let d=0; d<days; d++){
      const log = State.getLog(w,d);
      if(Object.keys(log).length) n++;
    }
  }
  return n;
}

/* ============================================================
   VIEW: PROGRAM
   ============================================================ */
Views.program = (root) => {
  root.appendChild(topbar('PROGRAM'));
  const wrap = el('div',{class:'view'});
  wrap.appendChild(el('p',{class:'eyebrow'}, PROGRAM.meta.goal));
  PROGRAM.weeks.forEach((week,wi)=>{
    const card = el('div',{class:'card'});
    card.appendChild(el('h2',{}, week.title));
    if(week.focus) card.appendChild(el('p',{class:'notes muted',html:week.focus}));
    week.days.forEach((d,di)=>{
      card.appendChild(el('div',{class:'item card-row',
        onclick:()=>openSession(wi+1,di), style:'cursor:pointer'},[
        el('div',{},[
          el('div',{class:'name'}, d.name),
          el('div',{class:'rx'}, `${d.sections.length} blocks`),
        ]),
        el('span',{class:'tag '+tagClass(d.kind==='run'?'run':'lift')}, d.kind),
      ]));
    });
    wrap.appendChild(card);
  });
  root.appendChild(wrap);
};

/* ---------- SESSION (drill into a day) ----------
   Each logged item stores a structured entry so the data is
   useful on export:
     lift -> { kind:'lift', sets:[ {weight,reps,note}, ... ] }
     run  -> { kind:'run',  run:{ distance,time,pace,avgHr,maxHr,note } }
     hold/plyo -> { kind, done:bool, note }
   ------------------------------------------------------------ */
function parseSetCount(it){
  const n = parseInt(it.sets, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
function ensureEntry(log, key, it){
  if(log[key] && log[key].kind) return log[key];
  let e;
  if(it.kind==='lift'){
    e = { kind:'lift', sets: Array.from({length:parseSetCount(it)}, ()=>({weight:'',reps:'',note:''})) };
  } else if(it.kind==='run'){
    e = { kind:'run', run:{ distance:'', time:'', pace:'', avgHr:'', maxHr:'', note:'' } };
  } else {
    e = { kind:it.kind, done:false, note:'' };
  }
  log[key] = e;
  return e;
}

function field(label, value, oninput, attrs={}){
  return el('label',{class:'field'},[
    el('span',{class:'field-lab'}, label),
    el('input', Object.assign({ value:value||'', oninput }, attrs)),
  ]);
}

function liftEntry(it, entry, save){
  const box = el('div',{class:'log'});
  entry.sets.forEach((set,si)=>{
    box.appendChild(el('div',{class:'set-row'},[
      el('span',{class:'set-no'}, `#${si+1}`),
      field('weight', set.weight, e=>{ set.weight=e.target.value; save(); },
        { type:'text', inputmode:'decimal', placeholder:String(it.load||'') }),
      field('reps', set.reps, e=>{ set.reps=e.target.value; save(); },
        { type:'text', inputmode:'numeric', placeholder:String(it.reps||'') }),
      field('note', set.note, e=>{ set.note=e.target.value; save(); },
        { type:'text', placeholder:'felt…' }),
    ]));
  });
  return box;
}

function runEntry(entry, save){
  const r = entry.run;
  const box = el('div',{class:'log'});
  box.appendChild(el('p',{class:'notes muted'},'Log from your watch:'));
  box.appendChild(el('div',{class:'set-row'},[
    field('distance', r.distance, e=>{ r.distance=e.target.value; save(); }, { type:'text', placeholder:'3.0 mi' }),
    field('time', r.time, e=>{ r.time=e.target.value; save(); }, { type:'text', placeholder:'mm:ss' }),
    field('avg pace', r.pace, e=>{ r.pace=e.target.value; save(); }, { type:'text', placeholder:'/mi' }),
  ]));
  box.appendChild(el('div',{class:'set-row'},[
    field('avg HR', r.avgHr, e=>{ r.avgHr=e.target.value; save(); }, { type:'text', inputmode:'numeric', placeholder:'bpm' }),
    field('max HR', r.maxHr, e=>{ r.maxHr=e.target.value; save(); }, { type:'text', inputmode:'numeric', placeholder:'bpm' }),
    field('note', r.note, e=>{ r.note=e.target.value; save(); }, { type:'text', placeholder:'felt…' }),
  ]));
  return box;
}

function doneEntry(entry, save){
  const box = el('div',{class:'log'});
  const btn = el('button',{
    class:'btn '+(entry.done?'cyan':'ghost'), style:'margin-top:6px',
    onclick:()=>{ entry.done=!entry.done; save();
      btn.className='btn '+(entry.done?'cyan':'ghost');
      btn.textContent = entry.done?'✓ Done':'Mark done'; }
  }, entry.done?'✓ Done':'Mark done');
  box.appendChild(btn);
  box.appendChild(field('note', entry.note, e=>{ entry.note=e.target.value; save(); },
    { type:'text', placeholder:'note…' }));
  return box;
}

function openSession(w,di){
  const main = $('#main'); main.innerHTML='';
  main.appendChild(topbar(`W${w} · D${di+1}`));
  const week = PROGRAM.weeks[w-1], d = week.days[di];
  const log = State.getLog(w,di);
  const save = () => State.setLog(w,di,log);
  const wrap = el('div',{class:'view'});
  wrap.appendChild(el('button',{class:'btn ghost',onclick:()=>route('program')},'← Back'));
  wrap.appendChild(el('h1',{class:'mt'}, d.name));

  d.sections.forEach((s,si)=>{
    const card = el('div',{class:'card'});
    card.appendChild(el('p',{class:'eyebrow'},
      (PROGRAM.blocks?.[s.tag]||s.tag).toUpperCase()));
    if(s.note) card.appendChild(el('p',{class:'notes muted'}, s.note));
    s.items.forEach((it,ii)=>{
      if(it.kind==='note'){ card.appendChild(el('p',{class:'notes'}, it.text)); return; }
      const key = `${si}.${ii}`;
      const item = el('div',{class:'item'});
      item.appendChild(el('div',{class:'card-row'},[
        el('div',{class:'grow'},[
          el('div',{class:'name'}, it.name),
          el('div',{class:'rx'}, rxLine(it)),
        ]),
        el('span',{class:'tag '+tagClass(it.kind)}, it.kind),
      ]));
      if(it.notes) item.appendChild(el('p',{class:'notes'}, it.notes));

      const entry = ensureEntry(log, key, it);
      if(it.kind==='lift')      item.appendChild(liftEntry(it, entry, save));
      else if(it.kind==='run')  item.appendChild(runEntry(entry, save));
      else                      item.appendChild(doneEntry(entry, save));

      card.appendChild(item);
    });
    wrap.appendChild(card);
  });
  main.appendChild(wrap);
  window.scrollTo(0,0);
}

/* ============================================================
   VIEW: TIMER (interval + rest)
   ============================================================ */
let timerCfg = Store.get('apex.timer',{ work:30, rest:60, rounds:6 });
Views.timer = (root) => {
  root.appendChild(topbar('TIMER'));
  const wrap = el('div',{class:'view'});
  const phase = el('div',{class:'timer-phase'},'READY');
  const disp  = el('div',{class:'timer-display'},'00:00');

  const cfgRow = (label,key) => el('div',{class:'grow'},[
    el('p',{class:'eyebrow'},label),
    el('input',{type:'number',value:timerCfg[key],min:0,
      oninput:e=>{ timerCfg[key]=+e.target.value; Store.set('apex.timer',timerCfg); }}),
  ]);

  const config = el('div',{class:'row mt'},[
    cfgRow('WORK (s)','work'), cfgRow('REST (s)','rest'), cfgRow('ROUNDS','rounds'),
  ]);

  const render = (t) => {
    const s = t.remaining;
    disp.textContent = `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
    phase.textContent = `${t.phase.toUpperCase()} · ${t.round}/${t.rounds}`;
    phase.className = 'timer-phase '+t.phase;
  };

  const startBtn = el('button',{class:'btn',onclick:()=>{
    if(Timer.isRunning()){ Timer.stop(); startBtn.textContent='Start'; updateNav(); return; }
    Timer.start({mode:'interval', work:timerCfg.work, rest:timerCfg.rest, rounds:timerCfg.rounds},
      render, ()=>{ phase.textContent='COMPLETE'; phase.className='timer-phase'; disp.textContent='00:00'; startBtn.textContent='Start'; updateNav(); });
    startBtn.textContent='Stop'; updateNav();
  }}, Timer.isRunning()?'Stop':'Start');

  wrap.append(phase, disp, config, el('div',{class:'mt'},startBtn),
    el('button',{class:'btn ghost mt',onclick:()=>{ Timer.reset(); phase.textContent='READY'; disp.textContent='00:00'; startBtn.textContent='Start'; updateNav(); }},'Reset'));
  root.appendChild(wrap);
};
function updateNav(){
  document.querySelector('.nav-btn[data-route="timer"]')
    ?.classList.toggle('timer-running', Timer.isRunning());
}

/* ============================================================
   VIEW: PROGRESS  (stub — fills in once we have real data)
   ============================================================ */
Views.progress = (root) => {
  root.appendChild(topbar('PROGRESS'));
  const wrap = el('div',{class:'view'});
  wrap.appendChild(el('h1',{},'Progress'));
  wrap.appendChild(el('div',{class:'placeholder mt'},
    'PRs, streaks, and history land here once the real plan + logging fields are wired. '+
    `Current streak: ${streakCount()} logged sessions.`));
  root.appendChild(wrap);
};

/* ============================================================
   VIEW: PROFILE
   ============================================================ */
Views.profile = (root) => {
  root.appendChild(topbar('PROFILE'));
  const p = State.profile;
  const wrap = el('div',{class:'view'});
  wrap.appendChild(el('h1',{},'Profile'));

  const card = el('div',{class:'card mt'});
  card.appendChild(el('div',{class:'card-row'},[
    el('span',{},'Dark mode'),
    el('button',{class:'btn ghost',style:'width:auto;padding:8px 14px',onclick:e=>{
      p.dark=!p.dark; State.profile=p; document.documentElement.classList.toggle('dark',p.dark);
      e.target.textContent = p.dark?'ON':'OFF';
    }}, p.dark?'ON':'OFF'),
  ]));
  card.appendChild(el('div',{class:'card-row mt'},[
    el('span',{},'Start date'),
    el('input',{type:'date',style:'width:auto',value:p.startDate||'',
      onchange:e=>{ p.startDate=e.target.value; State.profile=p; }}),
  ]));
  wrap.appendChild(card);

  wrap.appendChild(el('button',{class:'btn ghost mt',onclick:exportData},'Export data'));
  root.appendChild(wrap);
};

/* Self-describing export: resolves every logged key back to its
   week / day / exercise name so the JSON is readable on its own
   (no need to cross-reference program.js). Empty entries skipped. */
function isFilled(entry){
  if(!entry || !entry.kind) return false;
  if(entry.kind==='lift') return entry.sets?.some(s=>s.weight||s.reps||s.note);
  if(entry.kind==='run')  return entry.run && Object.values(entry.run).some(v=>v);
  return entry.done || entry.note;
}
function exportData(){
  const out = { app:'APEX', exported:new Date().toISOString(),
    goal:PROGRAM.meta.goal, profile:State.profile, sessions:[] };

  PROGRAM.weeks.forEach((week,wi)=>{
    week.days.forEach((d,di)=>{
      const log = State.getLog(wi+1,di);
      if(!Object.keys(log).length) return;
      const session = { week:wi+1, weekTitle:week.title, day:di+1, dayName:d.name, entries:[] };
      d.sections.forEach((s,si)=>{
        s.items.forEach((it,ii)=>{
          const entry = log[`${si}.${ii}`];
          if(!isFilled(entry)) return;
          const rec = { block:s.tag, exercise:it.name, prescribed:rxLine(it) };
          if(entry.kind==='lift') rec.sets = entry.sets.filter(s=>s.weight||s.reps||s.note);
          else if(entry.kind==='run') rec.run = entry.run;
          else { rec.done = !!entry.done; if(entry.note) rec.note = entry.note; }
          session.entries.push(rec);
        });
      });
      if(session.entries.length) out.sessions.push(session);
    });
  });

  const blob = new Blob([JSON.stringify(out,null,2)],{type:'application/json'});
  const a = el('a',{href:URL.createObjectURL(blob),download:`apex-export-${new Date().toISOString().slice(0,10)}.json`});
  document.body.appendChild(a); a.click(); a.remove();
}

/* ============================================================
   BOOT
   ============================================================ */
function boot(){
  const p = State.profile;
  document.documentElement.classList.toggle('dark', p.dark!==false);
  document.querySelectorAll('.nav-btn').forEach(b=>
    b.addEventListener('click',()=>route(b.dataset.route)));
  route('today');

  if('serviceWorker' in navigator)
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
document.addEventListener('DOMContentLoaded', boot);
