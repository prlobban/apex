/* ============================================================
   APEX — timer module
   Interval timer (work/rest repeats) + simple rest/countdown.
   Web Audio beeps, runs off a wall-clock so it stays accurate
   even when the tab is backgrounded.
   ============================================================ */
const Timer = (() => {
  let ac = null;
  function beep(freq=880, dur=0.12, vol=0.25){
    try{
      ac = ac || new (window.AudioContext||window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.value = freq; o.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(vol, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
      o.start(); o.stop(ac.currentTime + dur);
    }catch(e){/* audio not available */}
  }
  const cueWork = () => { beep(880,0.08,0.25); setTimeout(()=>beep(1320,0.18,0.3),90); };
  const cueRest = () => beep(440,0.16,0.2);
  const cueEnd  = () => { beep(660,0.08); setTimeout(()=>beep(880,0.08),120); setTimeout(()=>beep(1320,0.3),240); };

  // state
  let raf = null, onTick = null, onDone = null;
  let state = null; // { mode, work, rest, rounds, ... runtime }

  function clear(){ if(raf) cancelAnimationFrame(raf); raf=null; }

  // mode:'interval' -> work/rest x rounds ; mode:'count' -> single countdown
  function start(cfg, tick, done){
    clear();
    onTick = tick; onDone = done;
    const now = performance.now();
    state = {
      mode: cfg.mode || 'count',
      work: cfg.work||0, rest: cfg.rest||0, rounds: cfg.rounds||1,
      phase: cfg.mode==='interval' ? 'work' : 'count',
      round: 1,
      phaseEnd: now + (cfg.mode==='interval' ? cfg.work : (cfg.seconds||0))*1000,
      running: true,
    };
    if(cfg.mode==='interval') cueWork();
    loop();
  }

  function loop(){
    if(!state || !state.running) return;
    const now = performance.now();
    let remaining = Math.max(0, (state.phaseEnd - now)/1000);

    if(remaining <= 0){
      advance();
      if(!state) return; // finished
      remaining = Math.max(0,(state.phaseEnd - performance.now())/1000);
    }
    if(onTick) onTick({
      remaining: Math.ceil(remaining),
      phase: state.phase, round: state.round, rounds: state.rounds,
    });
    raf = requestAnimationFrame(loop);
  }

  function advance(){
    if(state.mode === 'count'){ finish(); return; }
    // interval
    if(state.phase === 'work'){
      if(state.rest > 0){
        state.phase = 'rest';
        state.phaseEnd = performance.now() + state.rest*1000;
        cueRest();
      } else { nextRound(); }
    } else {
      nextRound();
    }
  }

  function nextRound(){
    if(state.round >= state.rounds){ finish(); return; }
    state.round++;
    state.phase = 'work';
    state.phaseEnd = performance.now() + state.work*1000;
    cueWork();
  }

  function finish(){
    cueEnd();
    const cb = onDone; state = null; clear();
    if(cb) cb();
  }

  function stop(){ if(state) state.running = false; clear(); }
  function reset(){ stop(); state = null; }
  const isRunning = () => !!(state && state.running);

  return { start, stop, reset, isRunning, beep, cueWork, cueRest, cueEnd };
})();

if (typeof window !== 'undefined') window.Timer = Timer;
