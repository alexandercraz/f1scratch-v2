/* ==================== ДАННЫЕ ==================== */
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const W = cv.width, H = cv.height;

let mode = '2d';
let field = 'baku';
let car = { x: 600, y: 680, angle: 0, speed: 5 };
let program = [];
let running = false;
let spin = 0;
let bubble = '';
let currentKmh = 0;

const PX_PER_MM = 0.3;

/* ==================== ТРАССЫ ==================== */
const TRACKS = {
  baku: [
    [600,700],[600,400],[600,100],[560,-100],[480,-250],
    [300,-320],[100,-350],[-100,-340],[-300,-300],[-450,-220],
    [-550,-100],[-600,0],[-620,150],[-600,300],[-550,420],
    [-450,520],[-300,600],[-100,650],[100,680],[300,690],
    [450,680],[600,700]
  ],
  monaco: [
    [400,700],[400,550],[420,450],[400,350],[350,300],
    [300,280],[220,300],[150,280],[100,220],[90,150],
    [130,90],[220,70],[320,80],[420,110],[520,130],
    [580,200],[600,300],[590,400],[560,500],[550,600],
    [580,680],[600,700],[400,700]
  ],
  monza: [
    [200,650],[150,600],[120,500],[100,400],[90,300],
    [100,200],[140,120],[220,80],[320,60],[440,60],
    [540,80],[600,140],[620,220],[600,300],[560,380],
    [520,440],[500,500],[510,560],[540,620],[560,680],
    [400,700],[200,650]
  ]
};

/* ==================== КОМАНДЫ ==================== */
const TEAMS = {
  redbull:  { name: 'Red Bull', main: '#0d1a3a', accent: '#ffd400', second: '#dc1e2e', sponsor: 'ORACLE' },
  ferrari:  { name: 'Ferrari',  main: '#c8102e', accent: '#ffffff', second: '#000000', sponsor: 'SHELL' },
  mercedes: { name: 'Mercedes', main: '#00a19c', accent: '#c0c0c0', second: '#000000', sponsor: 'PETRONAS' },
  mclaren:  { name: 'McLaren',  main: '#ff8000', accent: '#47c7fc', second: '#000000', sponsor: 'OKX' },
  aston:    { name: 'Aston',    main: '#00594f', accent: '#cedc00', second: '#ffffff', sponsor: 'ARAMCO' },
  alpine:   { name: 'Alpine',   main: '#0090ff', accent: '#ff87bc', second: '#000000', sponsor: 'BWT' },
  williams: { name: 'Williams', main: '#1868db', accent: '#ffffff', second: '#00a0de', sponsor: 'ATLASSIAN' },
  rb:       { name: 'RB',       main: '#1434cb', accent: '#ff0000', second: '#ffffff', sponsor: 'VISA' },
  sauber:   { name: 'Sauber',   main: '#52e252', accent: '#000000', second: '#ffffff', sponsor: 'KICK' },
  haas:     { name: 'Haas',     main: '#b6babd', accent: '#e6002b', second: '#000000', sponsor: 'MONEYGRAM' }
};

let currentTeam = 'redbull';

/* ==================== РЕЖИМЫ ==================== */
function setMode(m) {
  mode = m;
  document.getElementById('m2d').classList.toggle('active', m === '2d');
  document.getElementById('m3d').classList.toggle('active', m === '3d');
  draw();
}

function changeField() {
  field = document.getElementById('fieldSel').value;
  resetAll();
}

function changeTeam() {
  currentTeam = document.getElementById('teamSel').value;
  draw();
}

/* ==================== БЛОКИ ==================== */
function addBlock(type, inputId) {
  let value = null;
  if (inputId) {
    const el = document.getElementById(inputId);
    value = parseFloat(el.value);
    if (isNaN(value)) value = 0;
  }
  program.push({ type, value });
  renderList();
}

function label(b) {
  if (b.type === 'forward')  return `⬆ Вперёд ${b.value} мм`;
  if (b.type === 'backward') return `⬇ Назад ${b.value} мм`;
  if (b.type === 'left')     return `⬅ Влево ${b.value}°`;
  if (b.type === 'right')    return `➡ Вправо ${b.value}°`;
  if (b.type === 'speed')    return `🚀 Скорость ${b.value} / 10`;
  if (b.type === 'repeat')   return `🔁 Повторить ${b.value} раз`;
  if (b.type === 'wait')     return `⏸ Ждать ${b.value} сек`;
  if (b.type === 'say')      return `💬 Сказать "Финиш!"`;
  if (b.type === 'stop')     return `⛔ Стоп`;
  return b.type;
}

function renderList() {
  const ul = document.getElementById('list');
  ul.innerHTML = '';
  program.forEach((b, i) => {
    const li = document.createElement('li');
    li.draggable = true;
    li.dataset.index = i;

    const span = document.createElement('span');
    span.textContent = label(b).replace(/[\d.]+/g, '').trim() + ' ';
    li.appendChild(span);

    if (b.value !== null && b.value !== undefined) {
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.value = b.value;
      inp.style.width = '60px';
      inp.style.padding = '3px 6px';
      inp.style.borderRadius = '4px';
      inp.style.border = '1px solid #888';
      inp.style.fontWeight = 'bold';
      inp.style.textAlign = 'center';
      inp.style.marginLeft = '5px';
      inp.onchange = () => {
        b.value = parseFloat(inp.value) || 0;
      };
      li.appendChild(inp);
    }

    const btn = document.createElement('button');
    btn.textContent = '×';
    btn.onclick = (e) => {
      e.stopPropagation();
      program.splice(i, 1);
      renderList();
    };
    li.appendChild(btn);
li.addEventListener('dragstart', handleDragStart);
li.addEventListener('dragover', handleDragOver);
li.addEventListener('drop', handleDrop);
li.addEventListener('dragend', handleDragEnd);

    ul.appendChild(li);
  });
}

/* ==================== DRAG & DROP ==================== */
let draggedIndex = null;

function handleDragStart(e) {
  draggedIndex = parseInt(this.dataset.index);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  this.classList.add('dragover');
}

function handleDrop(e) {
  e.preventDefault();
  this.classList.remove('dragover');
  const targetIndex = parseInt(this.dataset.index);
  if (draggedIndex === null || draggedIndex === targetIndex) return;
  const moved = program.splice(draggedIndex, 1)[0];
  program.splice(targetIndex, 0, moved);
  draggedIndex = null;
  renderList();
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  document.querySelectorAll('#list li').forEach(li => li.classList.remove('dragover'));
}
/* ==================== ВСПОМОГАТЕЛЬНАЯ ==================== */
function shade(hex, percent) {
  const num = parseInt(hex.replace('#',''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1);
}
/* ==================== ОТРИСОВКА МИРА 2D ==================== */
function drawWorld2D() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  const cx = W/2 - car.x;
  const cy = H/2 - car.y;

  if (field === 'baku' || field === 'monaco' || field === 'monza') {
    const track = TRACKS[field];
    ctx.fillStyle = '#e8e2d0';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 90;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + track[0][0], cy + track[0][1]);
    for (let i = 1; i < track.length; i++) {
      ctx.lineTo(cx + track[i][0], cy + track[i][1]);
    }
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.setLineDash([15, 20]);
    ctx.stroke();
    ctx.setLineDash([]);

    const fx = cx + track[0][0];
    const fy = cy + track[0][1];
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 3; j++) {
        ctx.fillStyle = (i+j) % 2 === 0 ? '#fff' : '#000';
        ctx.fillRect(fx - 50 + i*10, fy - 15 + j*10, 10, 10);
      }
    }
  } else if (field === 'grid') {
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 1;
    const sx = Math.floor(-cx / 40) * 40 - 40;
    const sy = Math.floor(-cy / 40) * 40 - 40;
    for (let i = sx; i < sx + W + 80; i += 40) {
      ctx.beginPath(); ctx.moveTo(cx+i, 0); ctx.lineTo(cx+i, H); ctx.stroke();
    }
    for (let i = sy; i < sy + H + 80; i += 40) {
      ctx.beginPath(); ctx.moveTo(0, cy+i); ctx.lineTo(W, cy+i); ctx.stroke();
    }
  } else if (field === 'maze') {
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2c3e50';
    [[-400,-400,200,40],[-400,-400,40,200],[200,-400,200,40],
     [-400,200,40,200],[100,-200,40,200],[-200,-100,200,40]]
      .forEach(w => ctx.fillRect(cx+w[0], cy+w[1], w[2], w[3]));
  } else if (field === 'room') {
    ctx.fillStyle = '#f4f1ea';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(cx-600, cy-600, 250, 120);
    ctx.fillRect(cx+350, cy-600, 250, 120);
    ctx.fillRect(cx-600, cy+480, 250, 120);
    ctx.fillRect(cx+350, cy+480, 250, 120);
  }
}

/* ==================== ПРОЕКЦИЯ 3D ==================== */
function proj(wx, wy) {
  const dx = wx - car.x;
  const dy = wy - car.y;
  const a = car.angle * Math.PI / 180;
  const c = Math.cos(-a), s = Math.sin(-a);
  const rx = dx * c - dy * s;
  const ry = dx * s + dy * c;
  const cd = ry + 220;
  if (cd < 1) return null;
  const sc = 420 / cd;
  return {
    x: W/2 + rx * sc,
    y: H*0.4 + (H - H*0.4) * (1 - sc),
    s: sc
  };
}

/* ==================== ОТРИСОВКА МИРА 3D ==================== */
function drawWorld3D() {
  const g = ctx.createLinearGradient(0, 0, 0, H*0.4);
  g.addColorStop(0, '#4a90e2');
  g.addColorStop(1, '#b3d9f2');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H*0.4);

  ctx.fillStyle = '#7fb069';
  ctx.fillRect(0, H*0.4, W, H*0.6);

  if (field === 'baku' || field === 'monaco' || field === 'monza') {
    const track = TRACKS[field];

    const p0 = proj(-1200,-1200), p1 = proj(1200,-1200);
    const p2 = proj(1200,1200), p3 = proj(-1200,1200);
    if (p0 && p1 && p2 && p3) {
      ctx.fillStyle = '#e8e2d0';
      ctx.beginPath();
      ctx.moveTo(p0.x,p0.y); ctx.lineTo(p1.x,p1.y);
      ctx.lineTo(p2.x,p2.y); ctx.lineTo(p3.x,p3.y);
      ctx.closePath(); ctx.fill();
    }

    for (let i = 0; i < track.length - 1; i++) {
      const a = proj(track[i][0], track[i][1]);
      const b = proj(track[i+1][0], track[i+1][1]);
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = '#3a3a3a';
      ctx.lineWidth = 90 * ((a.s + b.s) / 2);
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    ctx.setLineDash([20, 25]);
    for (let i = 0; i < track.length - 1; i++) {
      const a = proj(track[i][0], track[i][1]);
      const b = proj(track[i+1][0], track[i+1][1]);
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 3 * ((a.s + b.s) / 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    const fx = proj(track[0][0], track[0][1]);
    if (fx) {
      const sz = 10 * fx.s;
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 2; j++) {
          ctx.fillStyle = (i+j) % 2 === 0 ? '#fff' : '#000';
          ctx.fillRect(fx.x - sz*3 + i*sz, fx.y - sz/2 + j*sz, sz, sz);
        }
      }
    }
  } else if (field === 'grid') {
    for (let i = -1200; i <= 1200; i += 100) {
      const a = proj(i, -1200), b = proj(i, 1200);
      if (a && b) {
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
        ctx.strokeStyle = 'rgba(200,200,200,0.5)'; ctx.lineWidth = 1; ctx.stroke();
      }
      const c = proj(-1200, i), d = proj(1200, i);
      if (c && d) {
        ctx.beginPath(); ctx.moveTo(c.x,c.y); ctx.lineTo(d.x,d.y);
        ctx.strokeStyle = 'rgba(200,200,200,0.5)'; ctx.lineWidth = 1; ctx.stroke();
      }
    }
  }
}
/* ==================== БОЛИД 2D ==================== */
function drawCar2D() {
  const t = TEAMS[currentTeam];
  ctx.save();
  ctx.translate(W/2, H/2);
  ctx.rotate(car.angle * Math.PI / 180);
  

  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 55, 22, 0, 0, Math.PI*2);
  ctx.fill();

  ctx.fillStyle = '#0a1020';
  ctx.fillRect(-56, -30, 8, 60);
  ctx.fillStyle = t.second;
  ctx.fillRect(-58, -30, 2, 60);

  wheelTop(-34, -28, 14, t);
  wheelTop(-34,  28, 14, t);

  ctx.fillStyle = t.main;
  ctx.beginPath();
  ctx.moveTo(65, 0);
  ctx.quadraticCurveTo(55, -9, 32, -16);
  ctx.quadraticCurveTo(10, -20, -12, -20);
  ctx.quadraticCurveTo(-34, -20, -46, -16);
  ctx.lineTo(-50, -10);
  ctx.lineTo(-50, 10);
  ctx.lineTo(-46, 16);
  ctx.quadraticCurveTo(-34, 20, -12, 20);
  ctx.quadraticCurveTo(10, 20, 32, 16);
  ctx.quadraticCurveTo(55, 9, 65, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = shade(t.main, -20);
  ctx.beginPath();
  ctx.moveTo(22, -16);
  ctx.quadraticCurveTo(0, -24, -28, -22);
  ctx.lineTo(-38, -18);
  ctx.lineTo(-38, -9);
  ctx.lineTo(22, -9);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(22, 16);
  ctx.quadraticCurveTo(0, 24, -28, 22);
  ctx.lineTo(-38, 18);
  ctx.lineTo(-38, 9);
  ctx.lineTo(22, 9);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = t.accent;
  ctx.beginPath();
  ctx.moveTo(65, 0);
  ctx.quadraticCurveTo(55, -5, 32, -7);
  ctx.lineTo(32, 7);
  ctx.quadraticCurveTo(55, 5, 65, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = t.second;
  ctx.fillRect(-44, -15, 76, 3);
  ctx.fillRect(-44, 12, 76, 3);

  ctx.fillStyle = t.accent;
  ctx.font = 'bold 8px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(t.sponsor, -14, -2);

  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(14, 0, 11, 8, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#3498db';
  ctx.beginPath(); ctx.ellipse(14, 0, 8, 5.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.ellipse(14, 0, 13, 10, 0, 0, Math.PI*2); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(13, 0, 4, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = t.second;
  ctx.fillRect(11, -3.8, 4, 1.6);

  wheelTop(42, -26, 13, t);
  wheelTop(42,  26, 13, t);

  ctx.fillStyle = '#0a1020';
  ctx.fillRect(62, -32, 6, 64);
  ctx.fillStyle = t.second;
  ctx.fillRect(68, -32, 2, 64);

  ctx.save();
  ctx.rotate(Math.PI);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 6px Arial';
  ctx.fillText('PIRELLI', -64, 0);
  ctx.restore();

  ctx.restore();
}

function wheelTop(x, y, r, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.arc(0, 0, r-1.5, 0, Math.PI*2); ctx.fill();
  ctx.save();
  ctx.rotate(spin);
  ctx.fillStyle = '#c8c8c8';
  ctx.beginPath(); ctx.arc(0, 0, r-3, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5;
  for (let a = 0; a < Math.PI*2; a += Math.PI/3) {
    ctx.beginPath(); ctx.moveTo(0,0);
    ctx.lineTo(Math.cos(a)*(r-3), Math.sin(a)*(r-3)); ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = t.accent;
  ctx.beginPath(); ctx.arc(0, 0, r*0.22, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

/* ==================== БОЛИД 3D ==================== */
function drawCar3D() {
  const t = TEAMS[currentTeam];
  const cx = W/2, cy = H - 100;
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = 'rgba(0,0,0,.4)';
  ctx.beginPath();
  ctx.ellipse(0, 55, 95, 22, 0, 0, Math.PI*2);
  ctx.fill();

  ctx.scale(1.6, 1.6);

  wheelRear(-44, 22, 18, t);
  wheelRear( 44, 22, 18, t);

  ctx.fillStyle = '#0a1020';
  ctx.beginPath();
  ctx.moveTo(-34,26); ctx.lineTo(34,26);
  ctx.lineTo(30,38); ctx.lineTo(-30,38);
  ctx.closePath(); ctx.fill();

  ctx.strokeStyle = '#1a2540';
  ctx.lineWidth = 1;
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(i*7, 26);
    ctx.lineTo(i*6, 38);
    ctx.stroke();
  }

  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(0, 18, 5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#444';
  ctx.beginPath(); ctx.arc(0, 18, 3, 0, Math.PI*2); ctx.fill();

  ctx.fillStyle = '#ff0000';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.ellipse(0, 8, 4, 3, 0, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = t.main;
  ctx.beginPath();
  ctx.moveTo(-32,24); ctx.lineTo(32,24);
  ctx.lineTo(28,4); ctx.lineTo(18,-12);
  ctx.lineTo(-18,-12); ctx.lineTo(-28,4);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = t.accent;
  ctx.fillRect(-26, 0, 52, 3);
  ctx.fillStyle = t.second;
  ctx.fillRect(-28, -3, 56, 2);

  ctx.fillStyle = t.accent;
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(t.sponsor, 0, 15);

  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0,-14,11,6,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#3498db';
  ctx.beginPath(); ctx.ellipse(0,-15,8,4,0,0,Math.PI*2); ctx.fill();

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-9,-19);
  ctx.quadraticCurveTo(0,-24,9,-19);
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(0,-20,4,0,Math.PI*2); ctx.fill();

  ctx.fillStyle = '#0a1020';
  ctx.fillRect(-3,-32,2,12);
  ctx.fillRect(1,-32,2,12);
  ctx.beginPath();
  ctx.moveTo(-32,-32); ctx.lineTo(32,-32);
  ctx.lineTo(34,-36); ctx.lineTo(-34,-36);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = t.second;
  ctx.fillRect(-34,-36,68,2);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 6px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PIRELLI', 0, -32);

  ctx.restore();
}

function wheelRear(x, y, r, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath(); ctx.ellipse(0, 0, r*0.7, r, 0, 0, Math.PI*2); ctx.fill();
  ctx.save();
  ctx.rotate(spin);
  ctx.fillStyle = '#c8c8c8';
  ctx.beginPath(); ctx.ellipse(0, 0, r*0.5, r*0.75, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = t.accent;
  ctx.beginPath(); ctx.arc(0, 0, r*0.18, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

/* ==================== ТЕКСТ ==================== */
function drawBubble() {
  if (!bubble) return;
  ctx.save();
  ctx.font = 'bold 13px Arial';
  const tw = ctx.measureText(bubble).width + 24;
  const bx = W/2 - tw/2;
  const by = (mode === '2d') ? H/2 - 110 : H - 200;
  ctx.fillStyle = 'rgba(255, 212, 0, 0.95)';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(bx, by, tw, 28);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.fillText(bubble, W/2, by + 19);
  ctx.restore();
}

/* ==================== ОТРИСОВКА ==================== */
function draw() {
  if (mode === '2d') {
    drawWorld2D();
    drawCar2D();
  } else {
    drawWorld3D();
    drawCar3D();
  }
  drawBubble();
  updateSpeedo();
}

/* ==================== СПИДОМЕТР ==================== */
function updateSpeedo() {
  const el = document.getElementById('speedVal');
  if (el) el.textContent = currentKmh;
}
/* ==================== АНИМАЦИЯ ==================== */
function animate(dx, dy, dAng, dur) {
  return new Promise(res => {
    const t0 = performance.now();
    const sx = car.x, sy = car.y, sa = car.angle;
    function step(now) {
      const t = Math.min((now - t0) / dur, 1);
      const e = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;
      car.x = sx + dx * e;
      car.y = sy + dy * e;
      car.angle = sa + dAng * e;
      if (dx || dy) {
        spin += 0.3 * e;
        currentKmh = Math.round(car.speed * 50 * Math.abs(Math.sin(performance.now()/100)));
      } else {
        currentKmh = 0;
      }
      draw();
      if (t < 1) requestAnimationFrame(step);
      else res();
    }
    requestAnimationFrame(step);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function exec(b) {
  const a = car.angle * Math.PI / 180;
  const fx = Math.cos(a), fy = Math.sin(a);

  if (b.type === 'speed') {
    car.speed = b.value || 5;
    await sleep(100);
  } else if (b.type === 'forward') {
    const px = (b.value || 500) * PX_PER_MM * (car.speed / 5);
    await animate(fx * px, fy * px, 0, 200 + (b.value || 500) / 5);
  } else if (b.type === 'backward') {
    const px = (b.value || 500) * PX_PER_MM * (car.speed / 5);
    await animate(-fx * px, -fy * px, 0, 200 + (b.value || 500) / 5);
  } else if (b.type === 'left') {
    await animate(0, 0, -(b.value || 15), 300);
  } else if (b.type === 'right') {
    await animate(0, 0, (b.value || 15), 300);
  } else if (b.type === 'wait') {
    await sleep((b.value || 1) * 1000);
  } else if (b.type === 'say') {
    bubble = 'Финиш! 🏁';
    draw();
    await sleep(1200);
    bubble = '';
    draw();
  }
  car.x = Math.max(-1500, Math.min(1500, car.x));
  car.y = Math.max(-1500, Math.min(1500, car.y));
}

/* ==================== ТАЙМЕР ==================== */
let timerStart = 0, timerInt = null;

function startTimer() {
  timerStart = performance.now();
  document.getElementById('timer').textContent = '⏱ 0.00';
  if (timerInt) clearInterval(timerInt);
  timerInt = setInterval(() => {
    const t = (performance.now() - timerStart) / 1000;
    document.getElementById('timer').textContent = '⏱ ' + t.toFixed(2);
  }, 50);
}

function stopTimer() {
  if (timerInt) clearInterval(timerInt);
  timerInt = null;
}

function elapsed() {
  return ((performance.now() - timerStart) / 1000).toFixed(2);
}

/* ==================== ЗАПУСК ==================== */
async function runProgram() {
  if (running) return;
  running = true;

  const track = TRACKS[field] || TRACKS.baku;
  car.x = track[0][0];
  car.y = track[0][1];
  car.angle = 0;
  spin = 0;
  currentKmh = 0;
  draw();
  startTimer();

  const items = document.querySelectorAll('#list li');

  for (let i = 0; i < program.length; i++) {
    if (!running) break;
    items.forEach(el => el.classList.remove('active'));
    if (items[i]) items[i].classList.add('active');

    const b = program[i];
    if (b.type === 'stop') {
      document.getElementById('info').textContent = '⛔ Остановлено';
      break;
    }
    if (b.type === 'repeat') {
      const body = program.slice(i + 1, i + 3);
      if (body.length) {
        for (let r = 0; r < (b.value || 4); r++) {
          for (const act of body) {
            if (!running) break;
            await exec(act);
          }
        }
      }
      i += body.length;
      continue;
    }
    await exec(b);
  }

  stopTimer();
  currentKmh = 0;
  updateSpeedo();
  items.forEach(el => el.classList.remove('active'));
  document.getElementById('info').textContent = '✅ Готово за ' + elapsed() + ' сек';
  running = false;
}

/* ==================== СБРОС ==================== */
function resetAll() {
  running = false;
  stopTimer();

  const track = TRACKS[field] || TRACKS.baku;
  car = { x: track[0][0], y: track[0][1], angle: 0, speed: 5 };
  spin = 0;
  bubble = '';
  currentKmh = 0;

  renderList();
  draw();
  document.getElementById('timer').textContent = '⏱ 0.00';
  document.getElementById('info').textContent = 'Нажимай блоки слева, потом ▶ Запустить';
}

/* ==================== СОХРАНЕНИЕ ==================== */
function saveProgram() {
  const data = JSON.stringify(program);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'f1-program.json';
  a.click();
  URL.revokeObjectURL(url);
  document.getElementById('info').textContent = '💾 Программа сохранена в файл';
}

function loadProgram() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        program = JSON.parse(ev.target.result);
        renderList();
        document.getElementById('info').textContent = '📂 Программа загружена';
      } catch (err) {
        document.getElementById('info').textContent = '❌ Ошибка загрузки файла';
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

/* ==================== БОТ ==================== */
function toggleBot() {
  document.getElementById('botWindow').classList.toggle('open');
}

function sendToBot() {
  const input = document.getElementById('botInput');
  const text = input.value.trim().toLowerCase();
  if (!text) return;

  const msgs = document.getElementById('botMessages');

  const userDiv = document.createElement('div');
  userDiv.className = 'bot-msg user';
  userDiv.textContent = input.value;
  msgs.appendChild(userDiv);

  const botDiv = document.createElement('div');
  botDiv.className = 'bot-msg bot';
  botDiv.textContent = botReply(text);
  msgs.appendChild(botDiv);

  input.value = '';
  msgs.scrollTop = msgs.scrollHeight;
}

function botReply(text) {
  if (text.includes('вперёд') || text.includes('вперед')) {
    return 'Нажми блок "⬆ Вперёд" слева. Введи расстояние в мм. Потом ▶ Запустить.';
  }
  if (text.includes('назад')) {
    return 'Блок "⬇ Назад" — едет назад. Расстояние в мм.';
  }
  if (text.includes('влево')) {
    return 'Блок "⬅ Влево" — поворот против часовой. Угол в градусах.';
  }
  if (text.includes('вправо')) {
    return 'Блок "➡ Вправо" — поворот по часовой. Угол в градусах.';
  }
  if (text.includes('скорость')) {
    return 'Блок "🚀 Скорость" — меняет скорость мотора от 1 до 10. Влияет на дальность и время.';
  }
  if (text.includes('повтор')) {
    return 'Блок "🔁 Повторить N раз" — повторяет 2 блока ниже N раз. Удобно для кругов.';
  }
  if (text.includes('ждать') || text.includes('пауза')) {
    return 'Блок "⏸ Ждать" — пауза в секундах. Полезно между командами.';
  }
  if (text.includes('сохран')) {
    return 'Кнопка "💾 Сохранить" — скачивает программу в файл. Потом можно загрузить.';
  }
  if (text.includes('загруз')) {
    return 'Кнопка "📂 Загрузить" — открывает сохранённый файл программы.';
  }
  if (text.includes('карт') || text.includes('трасс')) {
    return 'Выбери трассу в списке: Баку, Монако, Монца. Или Сетка, Лабиринт, Комната.';
  }
  if (text.includes('команд')) {
    return '10 команд Ф1: Red Bull, Ferrari, Mercedes, McLaren, Aston, Alpine, Williams, RB, Sauber, Haas.';
  }
  if (text.includes('2d') || text.includes('3d')) {
    return 'Кнопки 2D и 3D вверху — переключают вид. 2D сверху, 3D сзади.';
  }
  if (text.includes('финиш')) {
    return 'Блок "💬 Сказать Финиш!" — показывает облачко над болидом.';
  }
  if (text.includes('стоп')) {
    return 'Блок "⛔ Стоп" — останавливает программу.';
  }
  if (text.includes('создат') || text.includes('автор')) {
    return 'Александр Эйвазов создал F1 Scratch. Почта: sanya.eyvazov@bk.ru';
  }
  if (text.includes('привет') || text.includes('здравств')) {
    return 'Привет! Спрашивай про блоки, трассы, команды, сохранение.';
  }
  return 'Не понял вопрос. Спроси про: вперёд, назад, скорость, повтор, сохранение, трассы, команды.';
}

/* ==================== О СОЗДАТЕЛЕ ==================== */
function openAbout() {
  document.getElementById('aboutPage').classList.add('open');
}

function closeAbout() {
  document.getElementById('aboutPage').classList.remove('open');
}

/* ==================== СТАРТ ==================== */
draw();