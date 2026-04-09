/* =========================
   CYBER GAME WORLD RANK
   six playable mini-games
   ========================= */

const WORLD = {
  title: '赛博游戏世界榜',
  subtitle: '五位数字住民正在穿梭于不同游戏区，挑战排行榜。',
  mascots: [
    { id: 'skully', name: 'Skully', shape: 'skull', color: '#b996ff', accent: '#63f3ff', face: '☠' },
    { id: 'fluff', name: 'Fluff', shape: 'fluff', color: '#ffe37a', accent: '#ff5db8', face: '❀' },
    { id: 'bloby', name: 'Bloby', shape: 'blob', color: '#9b6bff', accent: '#77ffac', face: '◕' },
    { id: 'buddy', name: 'Buddy', shape: 'buddy', color: '#c8b6ff', accent: '#63f3ff', face: '☺' },
    { id: 'crownie', name: 'Crownie', shape: 'crown', color: '#ffe37a', accent: '#9b6bff', face: '♛' }
  ]
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function gameKey() {
  return 'cyberworld:' + location.pathname;
}

function leaderboardKey() {
  return 'leaderboard:' + location.pathname;
}

function bestKey() {
  return 'best:' + location.pathname;
}

function saveBest(score) {
  const best = Number(localStorage.getItem(bestKey()) || 0);
  if (score > best) localStorage.setItem(bestKey(), String(Math.round(score)));
}

function getBest() {
  return Number(localStorage.getItem(bestKey()) || 0);
}

function renderLeaderboard(el) {
  if (!el) return;
  const list = JSON.parse(localStorage.getItem(leaderboardKey()) || '[]');
  const best = getBest();
  el.innerHTML = `
    <h3>世界榜</h3>
    <p class="muted">${WORLD.subtitle}</p>
    <div class="world-best">本页最高分：<strong>${best}</strong></div>
    ${list.length ? `
      <ol>
        ${list.map(i => `<li>${escapeHtml(i.name)} — ${i.score}</li>`).join('')}
      </ol>
    ` : `<div class="muted">暂无记录，成为这个赛博分区的第一位上榜者。</div>`}
  `;
}

function saveScoreToLeaderboard(score, el) {
  const name = prompt('输入你的赛博昵称（留空则为 匿名旅人）') || '匿名旅人';
  const list = JSON.parse(localStorage.getItem(leaderboardKey()) || '[]');
  const item = { name, score: Math.round(score), ts: Date.now() };
  list.push(item);
  list.sort((a, b) => b.score - a.score);
  localStorage.setItem(leaderboardKey(), JSON.stringify(list.slice(0, 20)));
  saveBest(score);
  renderLeaderboard(el);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function choice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

function paintCyberPanel(container, title, desc) {
  const lore = el('div', 'cw-lore', `
    <div class="cw-lore-badge">${WORLD.title}</div>
    <div class="cw-lore-title">${title}</div>
    <div class="cw-lore-text">${desc}</div>
  `);
  container.appendChild(lore);
  return lore;
}

function mascotMarkup(m) {
  return `<span class="cw-mascot-chip" style="--mc:${m.color};--ma:${m.accent}">${m.face} ${m.name}</span>`;
}

document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('.auth-forms');
  forms.forEach(f => {
    f.addEventListener('submit', e => {
      e.preventDefault();
      alert('Demo only: this account system is still local-only.');
    });
  });

  const gameArea = document.getElementById('game-area');
  if (!gameArea) return;

  const gameType = gameArea.dataset.game || 'generic';
  const startBtn = document.getElementById('start-btn');
  const scoreEl = document.getElementById('score');
  const leaderboardEl = document.getElementById('leaderboard');

  let running = false;
  let score = 0;
  let activeController = null;

  function setScore(v) {
    score = Math.max(0, Math.round(v));
    if (scoreEl) scoreEl.textContent = score;
  }

  function addScore(v) {
    setScore(score + v);
  }

  function startGame() {
    if (running) return;
    running = true;
    setScore(0);
    gameArea.innerHTML = '';
    activeController = createControllerFor(gameType, gameArea, {
      setScore,
      addScore,
      getScore: () => score,
      onFinish: finalScore => {
        setScore(finalScore ?? score);
        stopGame(false);
      }
    });
    if (activeController?.start) activeController.start();
    startBtn.textContent = '结束';
    startBtn.classList.add('pulse');
  }

  function stopGame(save = true) {
    if (!running) return;
    running = false;
    if (activeController?.stop) activeController.stop();
    activeController = null;
    startBtn.textContent = '开始';
    startBtn.classList.remove('pulse');
    if (save) saveScoreToLeaderboard(score, leaderboardEl);
    else {
      saveBest(score);
      renderLeaderboard(leaderboardEl);
    }
  }

  startBtn?.addEventListener('click', () => {
    if (running) stopGame(true);
    else startGame();
  });

  renderLeaderboard(leaderboardEl);
});

function createControllerFor(type, container, api) {
  const map = {
    jump: jumpGame,
    connect: connectGame,
    match3: match3Game,
    memory: memoryGame,
    merge: mergeGame,
    runner: runnerGame
  };
  return (map[type] || genericGame)(container, api);
}

function genericGame(container) {
  container.innerHTML = `<div class="cw-empty">未找到游戏控制器</div>`;
  return { start() {}, stop() {} };
}

/* =========================
   JUMP
   hold to charge, release to jump
   ========================= */
function jumpGame(container, api) {
  const wrap = el('div', 'cw-wrap');
  const top = paintCyberPanel(
    wrap,
    '跃迁平台区',
    `在赛博高楼之间进行短距跃迁。由 ${mascotMarkup(WORLD.mascots[1])} 负责校准蓄力。按住空格、鼠标或手指蓄力，松开后起跳。`
  );
  const bar = el('div', 'jump-charge-wrap', `<div class="jump-charge-bar"></div>`);
  const canvas = document.createElement('canvas');
  canvas.className = 'cw-canvas';
  wrap.append(bar, canvas);
  container.appendChild(wrap);

  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, raf = null;
  let charging = false, charge = 0, gameOver = false;
  let worldSpeed = 0;
  let currentPlatform = 0;
  let lastLandedIndex = 0;
  let score = 0;
  const mascot = WORLD.mascots[3];

  const player = {
    x: 0, y: 0, r: 18,
    vx: 0, vy: 0,
    airborne: false
  };

  let platforms = [];

  function resize() {
    w = container.clientWidth - 32;
    h = Math.max(420, Math.floor(window.innerHeight * 0.58));
    canvas.width = w;
    canvas.height = h;
  }

  function makePlatform(x, y, width) {
    return { x, y, width, height: 18 };
  }

  function reset() {
    resize();
    score = 0;
    api.setScore(0);
    charge = 0;
    charging = false;
    gameOver = false;
    worldSpeed = 0;
    currentPlatform = 0;
    lastLandedIndex = 0;
    platforms = [
      makePlatform(90, h - 95, 120),
      makePlatform(310, h - 150, 110),
      makePlatform(560, h - 210, 130)
    ];
    for (let i = 0; i < 8; i++) spawnPlatform();
    player.x = platforms[0].x + platforms[0].width / 2;
    player.y = platforms[0].y - player.r;
    player.vx = 0;
    player.vy = 0;
    player.airborne = false;
    updateChargeBar();
  }

  function spawnPlatform() {
    const last = platforms[platforms.length - 1];
    const gap = 140 + Math.random() * 130;
    const ny = Math.max(120, Math.min(h - 90, last.y + (Math.random() * 150 - 75)));
    const width = 92 + Math.random() * 56;
    platforms.push(makePlatform(last.x + gap, ny, width));
  }

  function updateChargeBar() {
    const barInner = bar.querySelector('.jump-charge-bar');
    if (barInner) barInner.style.width = `${Math.min(100, charge * 100)}%`;
  }

  function drawBackground() {
    const grd = ctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#0a0f22');
    grd.addColorStop(1, '#160d32');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 30; i++) {
      ctx.strokeStyle = 'rgba(99,243,255,0.06)';
      ctx.beginPath();
      ctx.moveTo(i * 40, 0);
      ctx.lineTo(i * 40, h);
      ctx.stroke();
    }
    for (let j = 0; j < 20; j++) {
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.beginPath();
      ctx.moveTo(0, j * 32);
      ctx.lineTo(w, j * 32);
      ctx.stroke();
    }
  }

  function drawCity() {
    for (let i = 0; i < 18; i++) {
      const bx = (i * 110 - (platforms[0].x % 110));
      const bw = 70 + (i % 4) * 16;
      const bh = 120 + (i % 5) * 28;
      ctx.fillStyle = 'rgba(255,255,255,0.035)';
      ctx.fillRect(bx, h - bh, bw, bh);
    }
  }

  function drawPlatforms() {
    platforms.forEach((p, i) => {
      ctx.fillStyle = i === currentPlatform ? 'rgba(255,93,184,0.24)' : 'rgba(99,243,255,0.18)';
      ctx.strokeStyle = i === currentPlatform ? 'rgba(255,93,184,0.8)' : 'rgba(99,243,255,0.8)';
      roundRect(ctx, p.x, p.y, p.width, p.height, 12, true, true);

      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.moveTo(p.x + 10, p.y + p.height / 2);
      ctx.lineTo(p.x + p.width - 10, p.y + p.height / 2);
      ctx.stroke();
    });
  }

  function drawPlayer() {
    const glow = charge > 0.4 && !player.airborne;
    if (glow) {
      ctx.fillStyle = 'rgba(255,93,184,0.18)';
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r + 10, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = mascot.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#071018';
    ctx.beginPath();
    ctx.arc(player.x - 5, player.y - 2, 2.7, 0, Math.PI * 2);
    ctx.arc(player.x + 5, player.y - 2, 2.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = mascot.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y + 3, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  function physics() {
    if (charging && !player.airborne) {
      charge = Math.min(1, charge + 0.018);
      updateChargeBar();
    }

    if (player.airborne) {
      player.vy += 0.48;
      player.x += player.vx;
      player.y += player.vy;
    }

    if (!player.airborne) {
      const targetX = 140;
      const dx = targetX - player.x;
      player.x += dx * 0.12;
    }

    const scrollThreshold = w * 0.45;
    if (player.x > scrollThreshold) {
      const shift = player.x - scrollThreshold;
      player.x = scrollThreshold;
      platforms.forEach(p => p.x -= shift);
    }

    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      const withinX = player.x >= p.x && player.x <= p.x + p.width;
      const crossingTop = player.vy >= 0 && player.y + player.r >= p.y && player.y + player.r <= p.y + p.height + 12;
      if (player.airborne && withinX && crossingTop) {
        player.airborne = false;
        player.vx = 0;
        player.vy = 0;
        player.y = p.y - player.r;
        currentPlatform = i;

        if (i > lastLandedIndex) {
          lastLandedIndex = i;
          score += 10;
          api.setScore(score);
          while (platforms.length - i < 8) spawnPlatform();
        }
      }
    }

    if (player.y > h + 80) {
      gameOver = true;
      api.onFinish(score);
    }

    while (platforms.length && platforms[0].x + platforms[0].width < -120) {
      platforms.shift();
      currentPlatform = Math.max(0, currentPlatform - 1);
      lastLandedIndex = Math.max(0, lastLandedIndex - 1);
    }
  }

  function drawHud() {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '600 14px Inter';
    ctx.fillText(`角色: ${mascot.name}`, 14, 24);
    ctx.fillText(`蓄力: ${Math.round(charge * 100)}%`, 14, 44);
    ctx.fillText('按住蓄力，松开跳跃', 14, 64);
  }

  function loop() {
    drawBackground();
    drawCity();
    physics();
    drawPlatforms();
    drawPlayer();
    drawHud();
    if (!gameOver) raf = requestAnimationFrame(loop);
  }

  function chargeStart(e) {
    e?.preventDefault?.();
    if (player.airborne || gameOver) return;
    charging = true;
  }

  function chargeEnd(e) {
    e?.preventDefault?.();
    if (!charging || player.airborne || gameOver) return;
    charging = false;
    const power = 7 + charge * 11;
    player.vx = 3.8 + charge * 8.8;
    player.vy = -power;
    player.airborne = true;
    charge = 0;
    updateChargeBar();
  }

  function keydown(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      chargeStart(e);
    }
  }

  function keyup(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      chargeEnd(e);
    }
  }

  return {
    start() {
      reset();
      loop();
      canvas.addEventListener('mousedown', chargeStart);
      window.addEventListener('mouseup', chargeEnd);
      canvas.addEventListener('touchstart', chargeStart, { passive: false });
      window.addEventListener('touchend', chargeEnd, { passive: false });
      window.addEventListener('keydown', keydown);
      window.addEventListener('keyup', keyup);
      window.addEventListener('resize', resize);
    },
    stop() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('mousedown', chargeStart);
      window.removeEventListener('mouseup', chargeEnd);
      canvas.removeEventListener('touchstart', chargeStart);
      window.removeEventListener('touchend', chargeEnd);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('resize', resize);
    }
  };
}

/* =========================
   CONNECT
   untangle line puzzle
   ========================= */
function connectGame(container, api) {
  const wrap = el('div', 'cw-wrap');
  paintCyberPanel(
    wrap,
    '线网解缠区',
    `由 ${mascotMarkup(WORLD.mascots[0])} 与 ${mascotMarkup(WORLD.mascots[4])} 共同看守。拖动节点，让所有发光线段都不再交叉。`
  );
  const info = el('div', 'cw-subinfo', '拖动圆点，直到交叉数变为 0。');
  const canvas = document.createElement('canvas');
  canvas.className = 'cw-canvas';
  wrap.append(info, canvas);
  container.appendChild(wrap);

  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, raf = null;
  let nodes = [], edges = [], dragIndex = -1;
  let solved = false;
  let score = 0;

  function resize() {
    w = container.clientWidth - 32;
    h = Math.max(420, Math.floor(window.innerHeight * 0.58));
    canvas.width = w;
    canvas.height = h;
  }

  function buildLevel() {
    resize();
    score = 300;
    api.setScore(score);
    solved = false;
    const cx = w / 2, cy = h / 2;
    const radius = Math.min(w, h) * 0.28;
    const count = 7;
    nodes = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.7;
      nodes.push({
        x: cx + Math.cos(angle) * radius * (0.7 + Math.random() * 0.5),
        y: cy + Math.sin(angle) * radius * (0.7 + Math.random() * 0.5),
        r: 16,
        mascot: WORLD.mascots[i % WORLD.mascots.length]
      });
    }
    edges = [
      [0, 3], [0, 4], [1, 4], [1, 5], [2, 6], [2, 4],
      [3, 6], [3, 5], [0, 2], [1, 3]
    ];
  }

  function intersects(a, b, c, d) {
    function ccw(p1, p2, p3) {
      return (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
    }
    if (a === c || a === d || b === c || b === d) return false;
    return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
  }

  function countCrossings() {
    let count = 0;
    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        const [a1, a2] = edges[i];
        const [b1, b2] = edges[j];
        if (intersects(nodes[a1], nodes[a2], nodes[b1], nodes[b2])) count++;
      }
    }
    return count;
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const grd = ctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#0b1023');
    grd.addColorStop(1, '#180d34');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    const crossings = countCrossings();
    api.setScore(Math.max(0, score - (300 - score) + Math.max(0, 180 - crossings * 20)));
    info.textContent = crossings === 0 ? '交叉数 0，线网已解开。' : `当前交叉数：${crossings}`;

    edges.forEach(([i, j]) => {
      const a = nodes[i], b = nodes[j];
      let cross = false;
      for (let k = 0; k < edges.length; k++) {
        for (let m = k + 1; m < edges.length; m++) {
          if (k === edges.indexOf([i, j]) || m === edges.indexOf([i, j])) continue;
        }
      }
      ctx.lineWidth = 3;
      ctx.strokeStyle = crossings === 0 ? 'rgba(119,255,172,0.85)' : 'rgba(99,243,255,0.65)';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });

    nodes.forEach((n, idx) => {
      ctx.fillStyle = n.mascot.color;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = n.mascot.accent;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#071018';
      ctx.font = '700 14px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.mascot.face, n.x, n.y + 1);
    });

    if (crossings === 0 && !solved) {
      solved = true;
      api.onFinish(500);
    }

    raf = requestAnimationFrame(draw);
  }

  function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function down(e) {
    const p = pointerPos(e);
    dragIndex = nodes.findIndex(n => Math.hypot(p.x - n.x, p.y - n.y) <= n.r + 8);
  }

  function move(e) {
    if (dragIndex < 0) return;
    e.preventDefault?.();
    const p = pointerPos(e);
    nodes[dragIndex].x = Math.max(26, Math.min(w - 26, p.x));
    nodes[dragIndex].y = Math.max(26, Math.min(h - 26, p.y));
    score = Math.max(0, score - 0.4);
  }

  function up() {
    dragIndex = -1;
  }

  return {
    start() {
      buildLevel();
      draw();
      canvas.addEventListener('mousedown', down);
      canvas.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
      canvas.addEventListener('touchstart', down, { passive: true });
      canvas.addEventListener('touchmove', move, { passive: false });
      window.addEventListener('touchend', up);
      window.addEventListener('resize', buildLevel);
    },
    stop() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('mousedown', down);
      canvas.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      canvas.removeEventListener('touchstart', down);
      canvas.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
      window.removeEventListener('resize', buildLevel);
    }
  };
}

/* =========================
   MATCH 3
   ========================= */
function match3Game(container, api) {
  const wrap = el('div', 'cw-wrap');
  paintCyberPanel(
    wrap,
    '糖块配线区',
    `由 ${mascotMarkup(WORLD.mascots[2])} 负责分发图块。交换相邻方块，三个或以上同类连线即可消除。`
  );
  const boardEl = el('div', 'm3-board');
  wrap.appendChild(boardEl);
  container.appendChild(wrap);

  const size = 7;
  const types = WORLD.mascots.map(m => m.id);
  let board = [];
  let selected = null;
  let busy = false;

  function randomType() {
    return choice(types);
  }

  function createCleanBoard() {
    board = Array.from({ length: size }, () => Array.from({ length: size }, () => randomType()));
    let changed = true;
    while (changed) {
      changed = false;
      const matches = findMatches();
      if (matches.size) {
        changed = true;
        matches.forEach(key => {
          const [r, c] = key.split('-').map(Number);
          board[r][c] = randomType();
        });
      }
    }
  }

  function mascotById(id) {
    return WORLD.mascots.find(m => m.id === id);
  }

  function render() {
    boardEl.innerHTML = '';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const id = board[r][c];
        const m = mascotById(id);
        const cell = el('button', 'm3-cell');
        cell.type = 'button';
        cell.style.setProperty('--mc', m.color);
        cell.style.setProperty('--ma', m.accent);
        cell.innerHTML = `<span>${m.face}</span>`;
        if (selected && selected.r === r && selected.c === c) cell.classList.add('selected');
        cell.addEventListener('click', () => clickCell(r, c));
        boardEl.appendChild(cell);
      }
    }
  }

  function adjacent(a, b) {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
  }

  function swap(a, b) {
    [board[a.r][a.c], board[b.r][b.c]] = [board[b.r][b.c], board[a.r][a.c]];
  }

  function clickCell(r, c) {
    if (busy) return;
    if (!selected) {
      selected = { r, c };
      render();
      return;
    }
    const next = { r, c };
    if (selected.r === r && selected.c === c) {
      selected = null;
      render();
      return;
    }
    if (!adjacent(selected, next)) {
      selected = next;
      render();
      return;
    }
    busy = true;
    swap(selected, next);
    const matches = findMatches();
    if (!matches.size) {
      swap(selected, next);
      selected = null;
      busy = false;
      render();
      return;
    }
    selected = null;
    cascade();
  }

  function findMatches() {
    const matches = new Set();

    for (let r = 0; r < size; r++) {
      let run = 1;
      for (let c = 1; c <= size; c++) {
        if (c < size && board[r][c] === board[r][c - 1]) run++;
        else {
          if (run >= 3) {
            for (let k = 0; k < run; k++) matches.add(`${r}-${c - 1 - k}`);
          }
          run = 1;
        }
      }
    }

    for (let c = 0; c < size; c++) {
      let run = 1;
      for (let r = 1; r <= size; r++) {
        if (r < size && board[r][c] === board[r - 1][c]) run++;
        else {
          if (run >= 3) {
            for (let k = 0; k < run; k++) matches.add(`${r - 1 - k}-${c}`);
          }
          run = 1;
        }
      }
    }
    return matches;
  }

  function collapse() {
    for (let c = 0; c < size; c++) {
      const col = [];
      for (let r = size - 1; r >= 0; r--) {
        if (board[r][c] != null) col.push(board[r][c]);
      }
      for (let r = size - 1, i = 0; r >= 0; r--, i++) {
        board[r][c] = col[i] ?? randomType();
      }
    }
  }

  function cascade() {
    const matches = findMatches();
    if (!matches.size) {
      busy = false;
      render();
      return;
    }
    matches.forEach(key => {
      const [r, c] = key.split('-').map(Number);
      board[r][c] = null;
    });
    api.addScore(matches.size * 10);
    render();

    setTimeout(() => {
      collapse();
      render();
      setTimeout(cascade, 180);
    }, 180);
  }

  return {
    start() {
      createCleanBoard();
      api.setScore(0);
      render();
    },
    stop() {}
  };
}

/* =========================
   MEMORY
   20 cards, 10s preview
   ========================= */
function memoryGame(container, api) {
  const wrap = el('div', 'cw-wrap');
  paintCyberPanel(
    wrap,
    '记忆映像库',
    `五位数字住民留下了 20 张映像卡。你只有 10 秒预览时间，然后要把它们两两配对。`
  );
  const status = el('div', 'cw-subinfo', '点击开始后，将先展示 10 秒。');
  const grid = el('div', 'memory-grid');
  wrap.append(status, grid);
  container.appendChild(wrap);

  let deck = [];
  let revealed = [];
  let matched = new Set();
  let locked = true;
  let timer = null;
  let previewLeft = 10;

  function buildDeck() {
    const items = [];
    WORLD.mascots.forEach(m => {
      items.push({ key: m.id + '-1', pair: m.id, m });
      items.push({ key: m.id + '-2', pair: m.id, m });
      items.push({ key: m.id + '-3', pair: m.id + '-b', m });
      items.push({ key: m.id + '-4', pair: m.id + '-b', m });
    });
    deck = shuffle(items).slice(0, 20);
    revealed = deck.map((_, i) => i);
    matched = new Set();
    locked = true;
  }

  function render() {
    grid.innerHTML = '';
    deck.forEach((card, i) => {
      const faceUp = revealed.includes(i) || matched.has(i);
      const btn = el('button', 'memory-card' + (faceUp ? ' face-up' : ''));
      btn.type = 'button';
      btn.style.setProperty('--mc', card.m.color);
      btn.style.setProperty('--ma', card.m.accent);
      btn.innerHTML = `
        <span class="memory-front">${card.m.face}</span>
        <span class="memory-back">?</span>
      `;
      btn.addEventListener('click', () => flip(i));
      grid.appendChild(btn);
    });
  }

  function startPreview() {
    previewLeft = 10;
    status.textContent = `预览时间：${previewLeft} 秒`;
    timer = setInterval(() => {
      previewLeft--;
      if (previewLeft <= 0) {
        clearInterval(timer);
        revealed = [];
        locked = false;
        status.textContent = '开始配对。每次翻两张。';
        render();
      } else {
        status.textContent = `预览时间：${previewLeft} 秒`;
      }
    }, 1000);
  }

  function flip(i) {
    if (locked || matched.has(i) || revealed.includes(i)) return;
    revealed.push(i);
    render();

    if (revealed.length === 2) {
      locked = true;
      const [a, b] = revealed;
      if (deck[a].pair === deck[b].pair) {
        matched.add(a);
        matched.add(b);
        api.addScore(20);
        revealed = [];
        locked = false;
        status.textContent = `成功配对 ${matched.size / 2}/10`;
        render();
        if (matched.size === deck.length) {
          api.onFinish(api.getScore() + 100);
        }
      } else {
        setTimeout(() => {
          revealed = [];
          locked = false;
          render();
        }, 700);
      }
    }
  }

  return {
    start() {
      api.setScore(0);
      buildDeck();
      render();
      startPreview();
    },
    stop() {
      clearInterval(timer);
    }
  };
}

/* =========================
   MERGE
   5x5 grid, adjacent same auto-merge
   6 levels max
   ========================= */
function mergeGame(container, api) {
  const wrap = el('div', 'cw-wrap');
  paintCyberPanel(
    wrap,
    '合成孵化仓',
    `点击空格投放角色碎片。两个相同等级且相邻的碎片会自动融合。最高等级为 6 级。`
  );
  const nextBox = el('div', 'cw-subinfo', '');
  const grid = el('div', 'merge-grid');
  wrap.append(nextBox, grid);
  container.appendChild(wrap);

  const size = 5;
  let board = [];
  let nextPiece = null;

  function piece(level, mascot) {
    return { level, mascot };
  }

  function newPiece() {
    const level = Math.random() < 0.75 ? 1 : 2;
    const mascot = choice(WORLD.mascots);
    return piece(level, mascot);
  }

  function buildBoard() {
    board = Array.from({ length: size }, () => Array.from({ length: size }, () => null));
    nextPiece = newPiece();
    api.setScore(0);
    render();
  }

  function render() {
    nextBox.innerHTML = `下一枚：<span class="merge-next" style="--mc:${nextPiece.mascot.color};--ma:${nextPiece.mascot.accent}">${nextPiece.mascot.face} Lv.${nextPiece.level}</span>`;
    grid.innerHTML = '';
    board.flat().forEach((cell, idx) => {
      const btn = el('button', 'merge-cell');
      btn.type = 'button';
      if (cell) {
        btn.style.setProperty('--mc', cell.mascot.color);
        btn.style.setProperty('--ma', cell.mascot.accent);
        btn.innerHTML = `<span>${cell.mascot.face}</span><small>Lv.${cell.level}</small>`;
        btn.classList.add('filled');
      } else {
        btn.innerHTML = '<span class="merge-empty">+</span>';
      }
      btn.addEventListener('click', () => placeAt(Math.floor(idx / size), idx % size));
      grid.appendChild(btn);
    });
  }

  function neighbors(r, c) {
    return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
      .filter(([rr, cc]) => rr >= 0 && rr < size && cc >= 0 && cc < size);
  }

  function placeAt(r, c) {
    if (board[r][c]) return;
    board[r][c] = nextPiece;
    nextPiece = newPiece();
    resolveMerges();
    render();
    if (isFull()) api.onFinish(api.getScore());
  }

  function isFull() {
    return board.flat().every(Boolean);
  }

  function resolveMerges() {
    let changed = true;
    while (changed) {
      changed = false;
      outer:
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const cell = board[r][c];
          if (!cell) continue;
          for (const [rr, cc] of neighbors(r, c)) {
            const other = board[rr][cc];
            if (other && other.level === cell.level && other.mascot.id === cell.mascot.id) {
              board[r][c] = piece(Math.min(6, cell.level + 1), cell.mascot);
              board[rr][cc] = null;
              api.addScore(cell.level * 20);
              changed = true;
              break outer;
            }
          }
        }
      }
      applyGravity();
    }
  }

  function applyGravity() {
    for (let c = 0; c < size; c++) {
      const col = [];
      for (let r = size - 1; r >= 0; r--) {
        if (board[r][c]) col.push(board[r][c]);
      }
      for (let r = size - 1, i = 0; r >= 0; r--, i++) {
        board[r][c] = col[i] || null;
      }
    }
  }

  return {
    start() {
      buildBoard();
    },
    stop() {}
  };
}

/* =========================
   RUNNER
   endless runner
   ========================= */
function runnerGame(container, api) {
  const wrap = el('div', 'cw-wrap');
  paintCyberPanel(
    wrap,
    '奔行霓虹区',
    `五位住民轮流冲榜。点击、触摸或空格起跳，跨越障碍并收集角色星章。`
  );
  const canvas = document.createElement('canvas');
  canvas.className = 'cw-canvas';
  wrap.appendChild(canvas);
  container.appendChild(wrap);

  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, raf = null;
  let t = 0;
  let obstacles = [];
  let tokens = [];
  let speed = 5.5;
  let over = false;
  let currentMascot = WORLD.mascots[0];

  const player = {
    x: 90, y: 0, w: 34, h: 46,
    vy: 0,
    ground: 0
  };

  function resize() {
    w = container.clientWidth - 32;
    h = Math.max(420, Math.floor(window.innerHeight * 0.58));
    canvas.width = w;
    canvas.height = h;
    player.ground = h - 78;
    player.y = player.ground;
  }

  function reset() {
    resize();
    t = 0;
    speed = 5.5;
    obstacles = [];
    tokens = [];
    over = false;
    currentMascot = WORLD.mascots[0];
    api.setScore(0);
  }

  function jump() {
    if (player.y >= player.ground) player.vy = -12.4;
  }

  function spawnObstacle() {
    const tall = Math.random() < 0.4;
    obstacles.push({
      x: w + 60,
      y: player.ground + (tall ? -58 : -34),
      w: tall ? 26 : 34,
      h: tall ? 58 : 34
    });
  }

  function spawnToken() {
    const m = choice(WORLD.mascots);
    tokens.push({
      x: w + 60,
      y: player.ground - 60 - Math.random() * 90,
      r: 16,
      mascot: m
    });
  }

  function rectHit(a, b) {
    return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y < b.y - b.h || a.y - a.h > b.y);
  }

  function circleRectHit(circle, rect) {
    const cx = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    const cy = Math.max(rect.y - rect.h, Math.min(circle.y, rect.y));
    return Math.hypot(circle.x - cx, circle.y - cy) < circle.r;
  }

  function update() {
    t++;
    if (t % 90 === 0) spawnObstacle();
    if (t % 110 === 0) spawnToken();
    if (t % 240 === 0) speed += 0.35;

    player.vy += 0.72;
    player.y += player.vy;
    if (player.y > player.ground) {
      player.y = player.ground;
      player.vy = 0;
    }

    obstacles.forEach(o => o.x -= speed);
    tokens.forEach(k => k.x -= speed * 0.96);
    obstacles = obstacles.filter(o => o.x + o.w > -50);
    tokens = tokens.filter(k => k.x + k.r > -50);

    const rect = { x: player.x, y: player.y, w: player.w, h: player.h };

    for (const o of obstacles) {
      if (rectHit(rect, { x: o.x, y: o.y, w: o.w, h: o.h })) {
        over = true;
        api.onFinish(api.getScore());
        return;
      }
    }

    tokens = tokens.filter(k => {
      if (circleRectHit(k, rect)) {
        currentMascot = k.mascot;
        api.addScore(20);
        return false;
      }
      return true;
    });

    if (t % 12 === 0) api.addScore(1);
  }

  function draw() {
    const grd = ctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#0b1023');
    grd.addColorStop(1, '#180d35');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(99,243,255,0.08)';
    for (let i = 0; i < 24; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 28);
      ctx.lineTo(w, i * 28);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, player.ground + 10, w, 6);

    obstacles.forEach(o => {
      ctx.fillStyle = 'rgba(255,93,184,0.8)';
      roundRect(ctx, o.x, o.y - o.h, o.w, o.h, 8, true, false);
    });

    tokens.forEach(k => {
      ctx.fillStyle = k.mascot.color;
      ctx.beginPath();
      ctx.arc(k.x, k.y, k.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#071018';
      ctx.font = '700 14px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(k.mascot.face, k.x, k.y + 1);
    });

    ctx.fillStyle = currentMascot.color;
    roundRect(ctx, player.x, player.y - player.h, player.w, player.h, 12, true, false);
    ctx.fillStyle = '#071018';
    ctx.font = '700 18px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(currentMascot.face, player.x + player.w / 2, player.y - player.h / 2 + 3);

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.textAlign = 'left';
    ctx.font = '600 14px Inter';
    ctx.fillText(`当前角色: ${currentMascot.name}`, 14, 24);
  }

  function loop() {
    update();
    draw();
    if (!over) raf = requestAnimationFrame(loop);
  }

  function press(e) {
    e?.preventDefault?.();
    jump();
  }

  function keydown(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      jump();
    }
  }

  return {
    start() {
      reset();
      loop();
      canvas.addEventListener('mousedown', press);
      canvas.addEventListener('touchstart', press, { passive: false });
      window.addEventListener('keydown', keydown);
      window.addEventListener('resize', resize);
    },
    stop() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('mousedown', press);
      canvas.removeEventListener('touchstart', press);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('resize', resize);
    }
  };
}

/* =========================
   helpers
   ========================= */
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}