/*
  Treinador de Ritmo — Versão precisa
  - Calcula diferença entre o tempo do toque e o tick mais próximo
  - Usa WebAudio para click
*/

let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function clickBeep(time = 0) {
  ensureAudio();
  const ctx = audioCtx;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = 1000;
  g.gain.value = 0.0001;
  o.connect(g);
  g.connect(ctx.destination);
  o.start(ctx.currentTime + time);
  // envelope
  g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + time + 0.001);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.08);
  o.stop(ctx.currentTime + time + 0.12);
}

/* App state */
let training = false;
let startTime = 0;        // referência do início dos ticks
let intervalMs = 500;
let beats = 16;
let scheduledId = null;   // setInterval id
let beatsPlanned = 0;
let hitRecords = [];      // {when, tickIndex, diff, judgment}
const pulseEl = document.getElementById('pulse');
const liveJudgment = document.getElementById('liveJudgment');
const liveDiff = document.getElementById('liveDiff');
const hitsList = document.getElementById('hitsList');
const countEl = document.getElementById('count');
const accuracyEl = document.getElementById('accuracy');
const avgErrEl = document.getElementById('avgErr');
const minErrEl = document.getElementById('minErr');
const maxErrEl = document.getElementById('maxErr');

document.getElementById('startBtn').addEventListener('click', () => startTraining());
document.getElementById('stopBtn').addEventListener('click', () => stopTraining());

function startTraining() {
  if (training) return;
  // read controls
  const bpm = parseInt(document.getElementById('bpm').value, 10) || 80;
  intervalMs = 60000 / bpm;
  beats = parseInt(document.getElementById('beats').value, 10) || 16;
  const tol = parseInt(document.getElementById('tol').value, 10) || 150;

  // reset UI & state
  hitsList.innerHTML = ''; hitRecords = [];
  countEl.textContent = '0';
  accuracyEl.textContent = '-'; avgErrEl.textContent='-'; minErrEl.textContent='-'; maxErrEl.textContent='-';
  liveJudgment.textContent = 'Preparando...';
  liveDiff.textContent = '– ms';

  // countdown 3..2..1
  let cd = 3;
  pulseEl.textContent = cd;
  pulseEl.classList.remove('pulse-on');
  const countdown = setInterval(() => {
    cd--;
    if (cd > 0) {
      pulseEl.textContent = cd;
    } else {
      clearInterval(countdown);
      pulseEl.textContent = 'Go';
      // start after 250ms to let UI catch up
      setTimeout(() => {
        beginMetronome(intervalMs, beats, tol);
      }, 250);
    }
  }, 600);

  // UI toggles
  document.getElementById('startBtn').style.display='none';
  document.getElementById('stopBtn').style.display='inline-block';
}

function beginMetronome(intervalMsLocal, totalBeats, tolerance) {
  ensureAudio();
  training = true;
  beatsPlanned = totalBeats;

  // startTime offseted so ticks are precise relative to performance.now()
  startTime = performance.now();
  // Play first tick immediately
  scheduleTick(0);

  // schedule subsequent ticks using setInterval for visual/sound; but computation of closests tick uses startTime+index*intervalMsLocal
  let beatIndex = 1;
  scheduledId = setInterval(() => {
    if (!training) return;
    if (beatIndex >= beatsPlanned) {
      // play final tick and stop after tiny delay
      scheduleTick(beatIndex);
      clearInterval(scheduledId);
      setTimeout(() => stopTraining(), 200 + intervalMsLocal);
      return;
    }
    scheduleTick(beatIndex);
    beatIndex++;
  }, intervalMsLocal);
}

function scheduleTick(idx) {
  // visual pulse & sound at exact moment
  pulseEl.classList.add('pulse-on');
  setTimeout(()=> pulseEl.classList.remove('pulse-on'), 120);
  // play click
  clickBeep(0);
  // we do not update lastTickTime used by measurement - we use startTime + idx*intervalMs for math
}

/* Key handling */
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault(); // prevent page scroll
    if (!training) return;
    handleTap();
  }
});

function handleTap() {
  const now = performance.now();
  // compute nearest tick index
  const idxFloat = (now - startTime) / intervalMs;
  const tickIndex = Math.round(idxFloat);
  const tickTime = startTime + tickIndex * intervalMs;
  const diff = Math.round(Math.abs(now - tickTime)); // ms

  // thresholds
  const tol = parseInt(document.getElementById('tol').value, 10) || 150;
  const perfectThresh = Math.min(80, tol * 0.6); // dynamic
  let judgment = 'Miss';
  if (diff <= perfectThresh) judgment = 'Perfeito';
  else if (diff <= tol) judgment = 'Bom';
  else judgment = 'Fora';

  // early or late info
  const earlyLate = (now - tickTime) < 0 ? 'Adiantado' : 'Atrasado';

  // register
  hitRecords.push({
    when: now,
    tickIndex,
    diff,
    judgment,
    earlyLate
  });

  // update UI
  const li = document.createElement('li');
  li.innerHTML = `<span>${judgment} — ${diff} ms <small style="color:var(--muted)">(${earlyLate}, tick ${tickIndex})</small></span>`;
  if (judgment === 'Perfeito') li.classList.add('perfect');
  else if (judgment === 'Bom') li.classList.add('good');
  else li.classList.add('miss');
  hitsList.insertBefore(li, hitsList.firstChild);

  countEl.textContent = hitRecords.length;
  liveJudgment.textContent = `${judgment} • ${earlyLate}`;
  liveDiff.textContent = `${diff} ms`;

  // optional immediate feedback color flash
  flashPulse(judgment);
}

function flashPulse(j) {
  if (j === 'Perfeito') {
    pulseEl.style.boxShadow = '0 8px 28px rgba(16,185,129,0.18)';
  } else if (j === 'Bom') {
    pulseEl.style.boxShadow = '0 8px 28px rgba(250,204,21,0.12)';
  } else {
    pulseEl.style.boxShadow = '0 8px 28px rgba(239,68,68,0.12)';
  }
  setTimeout(()=> pulseEl.style.boxShadow='', 220);
}

function stopTraining() {
  if (!training) return;
  training = false;
  clearInterval(scheduledId);
  document.getElementById('startBtn').style.display='inline-block';
  document.getElementById('stopBtn').style.display='none';
  // show final stats
  computeStats();
}

function computeStats() {
  if (!hitRecords.length) {
    liveJudgment.textContent = 'Nenhuma batida registrada';
    return;
  }
  const diffs = hitRecords.map(h => h.diff);
  const hits = hitRecords.filter(h => h.diff <= parseInt(document.getElementById('tol').value,10)).length;
  const accuracy = Math.round((hits / hitRecords.length) * 100);
  const avg = Math.round(diffs.reduce((a,b)=>a+b,0)/diffs.length);
  const min = Math.min(...diffs);
  const max = Math.max(...diffs);

  accuracyEl.textContent = accuracy + '%';
  avgErrEl.textContent = avg;
  minErrEl.textContent = min;
  maxErrEl.textContent = max;
  liveJudgment.textContent = `Finalizado — ${accuracy}% de acerto`;
  liveDiff.textContent = `${avg} ms (média)`;
  // enviar para backend
fetch('/save-training', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    bpm: parseInt(document.getElementById('bpm').value),
    beats: hitRecords.length,
    tolerance: parseInt(document.getElementById('tol').value),
    accuracy: accuracy,
    avg_error: avg,
    min_error: min,
    max_error: max
  })
})
.then(res => res.json())
.then(data => console.log("Treino salvo:", data))
.catch(err => console.error(err));

}

/* Accessibility: ensure focus */
window.addEventListener('load', () => {
  // enable audio context on first user gesture
  document.body.addEventListener('click', () => { ensureAudio(); }, {once:true});
});
