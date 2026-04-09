const WORLD = {
  subtitle: '五个性格迥异的小家伙陪你玩六款小游戏。',
  mascots: [
    { id: 'bobi',  name: 'Bobi',  face: '♡', color: '#ff8a5b', accent: '#ffd166', personality: '可爱',  desc: '永远眨着大眼睛，走哪都撒一地爱心。' },
    { id: 'boba',  name: 'Boba',  face: '⚡', color: '#68d5ff', accent: '#8ef6d3', personality: '活泼',  desc: '一秒都坐不住，弹来弹去精力无限。' },
    { id: 'bobo',  name: 'Bobo',  face: '▬', color: '#7c8cff', accent: '#c0b8ff', personality: '高冷',  desc: '墨镜不摘，表情不变，内心其实很骄傲。' },
    { id: 'babi',  name: 'Babi',  face: '😜', color: '#ff6b9c', accent: '#ffc6d9', personality: '搞笑',  desc: '走路会摔，鞠躬会撞头，但总在笑。' },
    { id: 'babo',  name: 'Babo',  face: '…',  color: '#8ae26f', accent: '#d9ff9b', personality: '社恐',  desc: '永远躲在东西后面偷偷看你，轻轻挥手。' }
  ],
  secret: { id: 'bobiboba', name: 'Bobiboba', face: '✿', color: '#ff8a5b',
    colors: ['#ff8a5b','#68d5ff','#7c8cff','#ff6b9c','#8ae26f','#ffd166'],
    desc: '集齐五种庆祝方式后出现的彩虹隐藏款。' }
};

const GAME_META = {
  connect: { label: 'Connect', desc: '拖动节点，解开交叉的线网。' },
  jump: { label: 'Jump', desc: '按住蓄力，松开起跳。' },
  match3: { label: 'Match 3', desc: '交换相邻图块，形成三连。' },
  memory: { label: 'Memory', desc: '短暂预览后，把卡片两两配对。' },
  merge: { label: 'Merge', desc: '放置棋子并自动合成升级。' },
  runner: { label: 'Runner', desc: '点击或空格起跳，躲避障碍。' }
};

document.addEventListener('DOMContentLoaded', () => {
  initAmbientBackground();
  initForms();
  initHomePage();
  initGamePage();
});

function initAmbientBackground() {
  if (document.getElementById('ambient-canvas')) return;
  const canvas = document.createElement('canvas');
  canvas.id = 'ambient-canvas';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  const dots = Array.from({ length: 36 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 1 + Math.random() * 3,
    s: 0.00015 + Math.random() * 0.00035,
    glow: Math.random() > 0.45 ? '104,213,255' : '255,138,91'
  }));
  let w = 0;
  let h = 0;

  function resize() {
    w = innerWidth;
    h = innerHeight;
    canvas.width = w;
    canvas.height = h;
  }

  function frame() {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    ctx.clearRect(0, 0, w, h);
    bg.addColorStop(0, '#0a1220');
    bg.addColorStop(0.55, '#101a2d');
    bg.addColorStop(1, '#12182a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    drawGrid(ctx, w, h, 42, 'rgba(255,255,255,0.05)');
    dots.forEach(dot => {
      dot.y += dot.s;
      if (dot.y > 1.05) {
        dot.y = -0.05;
        dot.x = Math.random();
      }
      ctx.fillStyle = `rgba(${dot.glow},0.65)`;
      ctx.beginPath();
      ctx.arc(dot.x * w, dot.y * h, dot.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(frame);
  }

  resize();
  addEventListener('resize', resize);
  frame();
}

function initForms() {
  document.querySelectorAll('.auth-forms').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const name = form.querySelector('input[name="username"], input[name="user"]')?.value || '玩家';
      alert(`${name}，这个账号页目前还是本地演示版。`);
    });
  });
}

function initHomePage() {
  // Hero preview
  const hero = document.querySelector('.hero-side .glow-frame');
  if (hero) {
    hero.innerHTML = `
      <div class="hero-preview">
        <div class="hero-preview-top">
          <span class="hero-chip">6 款小游戏</span>
          <span class="hero-chip hero-chip-alt">前端即开即玩</span>
        </div>
        <div class="hero-preview-board">
          ${Object.entries(GAME_META).map(([key, meta]) => `
            <a class="hero-preview-card" href="./games/${key}.html">
              <strong>${meta.label}</strong>
              <span>${meta.desc}</span>
            </a>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Character cards with canvas animation + bobiboba blind box
  const row = document.getElementById('mascot-row');
  if (!row) return;
  row.innerHTML = '';

  const collected = getCollection();
  const canvases = [];

  // 5 main characters
  WORLD.mascots.forEach(m => {
    const card = el('div', 'mascot-card');
    const cvs = document.createElement('canvas');
    cvs.width = 80; cvs.height = 80;
    cvs.className = 'mascot-canvas';
    const tag = el('span', 'mascot-personality', m.personality);
    tag.style.color = m.color;
    const name = el('span', 'mascot-name', m.name);
    const desc = el('span', 'mascot-desc', m.desc);
    const check = collected[m.id] ? el('span', 'mascot-collected', '✓ 已收集') : null;
    card.append(cvs, name, tag, desc);
    if (check) card.appendChild(check);
    row.appendChild(card);
    canvases.push({ cvs, id: m.id });
  });

  // Bobiboba blind box card
  const bbCard = el('div', 'mascot-card mascot-secret');
  const unlocked = allCollected();
  if (unlocked) {
    const cvs = document.createElement('canvas');
    cvs.width = 80; cvs.height = 80;
    cvs.className = 'mascot-canvas';
    const name = el('span', 'mascot-name', 'Bobiboba');
    const tag = el('span', 'mascot-personality', '彩虹隐藏款');
    tag.style.background = 'linear-gradient(90deg,#ff8a5b,#68d5ff,#7c8cff,#ff6b9c,#8ae26f)';
    tag.style.webkitBackgroundClip = 'text';
    tag.style.webkitTextFillColor = 'transparent';
    const desc = el('span', 'mascot-desc', WORLD.secret.desc);
    bbCard.append(cvs, name, tag, desc);
    bbCard.classList.add('mascot-unlocked');
    canvases.push({ cvs, id: 'bobiboba' });
  } else {
    bbCard.innerHTML = `
      <div class="blind-box">?</div>
      <span class="mascot-name">???</span>
      <span class="mascot-personality" style="color:#666">盲盒隐藏款</span>
      <span class="mascot-desc">集齐 5 种不同角色的庆祝动画后解锁</span>
      <span class="mascot-progress">${WORLD.mascots.filter(m => collected[m.id]).length}/5</span>
    `;
  }
  row.appendChild(bbCard);

  // Animate all canvases
  let t = 0;
  function animateCards() {
    t++;
    canvases.forEach(({ cvs, id }) => {
      const ctx = cvs.getContext('2d');
      ctx.clearRect(0, 0, 80, 80);
      drawMascot(ctx, id, 40, 40, 60, t);
    });
    requestAnimationFrame(animateCards);
  }
  animateCards();
}

function initGamePage() {
  // Populate side mascots with canvas-animated characters
  const sideRow = document.getElementById('side-mascots');
  if (sideRow) {
    sideRow.innerHTML = '';
    const sideCvs = [];
    WORLD.mascots.forEach(m => {
      const card = el('div', 'mascot-card');
      card.style.width = '56px'; card.style.minHeight = '70px'; card.style.padding = '8px 4px 6px'; card.style.gap = '4px';
      const cvs = document.createElement('canvas');
      cvs.width = 48; cvs.height = 48; cvs.className = 'mascot-canvas';
      const nm = el('span', 'mascot-name', m.name);
      nm.style.fontSize = '.65rem';
      card.append(cvs, nm);
      sideRow.appendChild(card);
      sideCvs.push({ cvs, id: m.id });
    });
    let st = 0;
    (function animSide() {
      st++;
      sideCvs.forEach(({ cvs, id }) => {
        const ctx = cvs.getContext('2d');
        ctx.clearRect(0, 0, 48, 48);
        drawMascot(ctx, id, 24, 24, 38, st);
      });
      requestAnimationFrame(animSide);
    })();
  }

  const gameArea = document.getElementById('game-area');
  if (!gameArea) return;
  const type = gameArea.dataset.game || 'connect';
  const startBtn = document.getElementById('start-btn');
  const scoreNode = document.getElementById('score');
  const boardNode = document.getElementById('leaderboard');
  const statusNode = ensureStatusNode();
  let controller = null;
  let running = false;
  let score = 0;

  const api = {
    setScore(value) {
      score = Math.max(0, Math.round(value));
      if (scoreNode) scoreNode.textContent = String(score);
    },
    addScore(delta) {
      api.setScore(score + delta);
    },
    getScore() {
      return score;
    },
    setStatus(text) {
      statusNode.textContent = text;
    },
    finish(finalScore, text) {
      if (!running) return;
      if (typeof finalScore === 'number') api.setScore(finalScore);
      running = false;
      controller?.stop?.();
      controller = null;
      saveBest(score);
      updateButton();
      if (score > 0) {
        showCelebration(gameArea, score, (name) => {
          if (name) {
            const list = JSON.parse(localStorage.getItem(leaderboardKey()) || '[]');
            list.push({ name, score: Math.round(score), time: Date.now() });
            list.sort((a, b) => b.score - a.score || a.time - b.time);
            localStorage.setItem(leaderboardKey(), JSON.stringify(list.slice(0, 10)));
            statusNode.textContent = `${escapeHtml(name)} 的分数已保存！`;
          } else {
            statusNode.textContent = text || '本局已结束。';
          }
          renderLeaderboard(boardNode);
        });
      } else {
        renderLeaderboard(boardNode);
        statusNode.textContent = text || '本局未产生分数。';
      }
    }
  };

  function updateButton() {
    startBtn.textContent = running ? '结束本局' : '开始挑战';
    startBtn.classList.toggle('pulse', running);
  }

  function start() {
    if (running) return;
    gameArea.innerHTML = '';
    api.setScore(0);
    controller = createControllerFor(type, gameArea, api);
    controller.start?.();
    running = true;
    updateButton();
    statusNode.textContent = '游戏运行中。结束本局后会询问是否保存分数。';
  }

  function stop(save = true) {
    if (!running) return;
    running = false;
    controller?.stop?.();
    controller = null;
    updateButton();
    saveBest(score);
    if (save && score > 0) {
      // 弹出庆祝动画 + 名字输入面板
      showCelebration(gameArea, score, (name) => {
        if (name) {
          const list = JSON.parse(localStorage.getItem(leaderboardKey()) || '[]');
          list.push({ name, score: Math.round(score), time: Date.now() });
          list.sort((a, b) => b.score - a.score || a.time - b.time);
          localStorage.setItem(leaderboardKey(), JSON.stringify(list.slice(0, 10)));
          statusNode.textContent = `${escapeHtml(name)} 的分数已保存！`;
        } else {
          statusNode.textContent = '本局已结束。';
        }
        renderLeaderboard(boardNode);
      });
    } else {
      renderLeaderboard(boardNode);
      statusNode.textContent = score > 0 ? '本局已结束。' : '本局未产生分数。';
    }
  }

  startBtn?.addEventListener('click', () => running ? stop(true) : start());
  renderLeaderboard(boardNode);
  statusNode.textContent = '点击开始挑战。';
  updateButton();
}

function ensureStatusNode() {
  let node = document.querySelector('.game-status');
  if (node) return node;
  node = document.createElement('div');
  node.className = 'panel game-status';
  document.querySelector('.game-main')?.appendChild(node);
  return node;
}

function createControllerFor(type, container, api) {
  const map = { connect: connectGame, jump: jumpGame, match3: match3Game, memory: memoryGame, merge: mergeGame, runner: runnerGame };
  return (map[type] || genericGame)(container, api);
}

function genericGame(container) {
  container.innerHTML = '<div class="cw-empty">这个游戏还没有接入控制器。</div>';
  return { start() {}, stop() {} };
}

function renderLeaderboard(node) {
  if (!node) return;
  const list = JSON.parse(localStorage.getItem(leaderboardKey()) || '[]');
  const best = Number(localStorage.getItem(bestKey()) || 0);
  node.innerHTML = `
    <h3>本地排行榜</h3>
    <p class="muted">${WORLD.subtitle}</p>
    <div class="world-best">当前页面最佳分数：<strong>${best}</strong></div>
    ${list.length ? `<ol>${list.map(item => `<li>${escapeHtml(item.name)}<span>${item.score}</span></li>`).join('')}</ol>` : '<div class="muted">还没有分数记录，来当第一名。</div>'}
  `;
}

function saveScoreToLeaderboard(score, node) {
  const name = prompt('输入要保存到本地排行榜的昵称', '匿名玩家') || '匿名玩家';
  const list = JSON.parse(localStorage.getItem(leaderboardKey()) || '[]');
  list.push({ name, score: Math.round(score), time: Date.now() });
  list.sort((a, b) => b.score - a.score || a.time - b.time);
  localStorage.setItem(leaderboardKey(), JSON.stringify(list.slice(0, 10)));
  saveBest(score);
  renderLeaderboard(node);
}

function leaderboardKey() {
  return `leaderboard:${location.pathname}`;
}

function bestKey() {
  return `best:${location.pathname}`;
}

function saveBest(score) {
  const best = Number(localStorage.getItem(bestKey()) || 0);
  if (score > best) localStorage.setItem(bestKey(), String(Math.round(score)));
}

function createGameShell(title, text) {
  const wrap = el('div', 'cw-wrap');
  wrap.appendChild(el('div', 'cw-lore', `
    <div class="cw-lore-badge">Webgame Arcade</div>
    <div class="cw-lore-title">${title}</div>
    <div class="cw-lore-text">${text}</div>
  `));
  return wrap;
}

/* ==========================================================
   CANVAS MASCOT DRAWING — 五个角色可爱赛博朋克版
   ========================================================== */
/* ==========================================================
   COLLECTION SYSTEM — 集齐解锁 bobiboba
   ========================================================== */
function getCollection() {
  try { return JSON.parse(localStorage.getItem('celeb-collection') || '{}'); } catch { return {}; }
}
function markCollected(mascotId) {
  const c = getCollection();
  c[mascotId] = true;
  localStorage.setItem('celeb-collection', JSON.stringify(c));
}
function allCollected() {
  const c = getCollection();
  return WORLD.mascots.every(m => c[m.id]);
}

function drawMascot(ctx, id, x, y, sz, t) {
  const m = WORLD.mascots.find(m => m.id === id) || WORLD.mascots[0];
  const r = sz / 2;
  const bob = Math.sin(t * 0.055) * r * 0.1;
  ctx.save();
  ctx.translate(x, y + bob);

  // ====== bobiboba 隐藏款 — 五颜六色彩虹体 ======
  if (id === 'bobiboba') {
    const cols = WORLD.secret.colors;
    const slices = cols.length;
    for (let i = 0; i < slices; i++) {
      const a1 = (i / slices) * Math.PI * 2 + t * 0.03;
      const a2 = ((i + 1) / slices) * Math.PI * 2 + t * 0.03;
      ctx.fillStyle = cols[i];
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.arc(0, 0, r * 0.6, a1, a2); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.25;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    // 眼
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-r*0.12, -r*0.06, r*0.1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.12, -r*0.06, r*0.1, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(-r*0.1, -r*0.04, r*0.05, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.1, -r*0.04, r*0.05, 0, Math.PI*2); ctx.fill();
    // 笑
    ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, r*0.06, r*0.1, 0.2, Math.PI - 0.2); ctx.stroke();
    // 彩虹光圈
    ctx.strokeStyle = cols[Math.floor(t / 8) % cols.length]; ctx.lineWidth = 2; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore(); return;
  }

  if (id === 'bobi') {
    // — 骷髅：会掉下巴，眼睛发光 —
    const jaw = Math.sin(t * 0.08) * r * 0.09;
    const walk = Math.sin(t * 0.14);
    // 腿（踢来踢去）
    ctx.strokeStyle = m.color; ctx.lineWidth = r * 0.1; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-r*0.18, r*0.45); ctx.lineTo(-r*0.28 + walk*4, r*0.85); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r*0.18, r*0.45); ctx.lineTo(r*0.28 - walk*4, r*0.85); ctx.stroke();
    // 身体
    ctx.fillStyle = m.color;
    roundRect(ctx, -r*0.28, r*0.2, r*0.56, r*0.3, r*0.12, true);
    // 头（骷髅）
    ctx.beginPath(); ctx.ellipse(0, -r*0.12, r*0.5, r*0.44, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = m.accent; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, -r*0.12, r*0.5, r*0.44, 0, 0, Math.PI*2); ctx.stroke();
    // 眼眶（大大的发光）
    ctx.fillStyle = '#8ef6d3'; ctx.shadowColor = '#8ef6d3'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.ellipse(-r*0.18, -r*0.18, r*0.12, r*0.16, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(r*0.18, -r*0.18, r*0.12, r*0.16, 0, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    // 瞳孔
    ctx.fillStyle = '#0f1724';
    ctx.beginPath(); ctx.arc(-r*0.18, -r*0.16, r*0.05, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.18, -r*0.16, r*0.05, 0, Math.PI*2); ctx.fill();
    // 下巴（掉落）
    ctx.fillStyle = m.color;
    ctx.beginPath(); ctx.ellipse(0, r*0.15 + jaw, r*0.28, r*0.1, 0, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = m.accent; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, r*0.15 + jaw, r*0.28, r*0.1, 0, 0, Math.PI); ctx.stroke();
    // 牙
    ctx.fillStyle = '#fff';
    for (let i = -3; i <= 3; i++) ctx.fillRect(i*r*0.06 - 1, r*0.08 + jaw, 3, r*0.06);
  }

  else if (id === 'boba') {
    // — 毛球：毛刺会动，大眼睛闪闪 —
    const spikes = 14;
    ctx.fillStyle = m.color;
    ctx.beginPath();
    for (let i = 0; i <= spikes; i++) {
      const a = (i / spikes) * Math.PI * 2;
      const wobble = Math.sin(t * 0.09 + i * 1.1) * r * 0.1;
      const R = (i % 2 === 0) ? r * 0.62 + wobble : r * 0.44;
      ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R);
    }
    ctx.closePath(); ctx.fill();
    // 发光圈
    ctx.strokeStyle = m.accent; ctx.lineWidth = 2; ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.arc(0, 0, r*0.52, 0, Math.PI*2); ctx.stroke();
    ctx.globalAlpha = 1;
    // 大眼睛
    const blink = Math.sin(t * 0.035) > 0.96;
    if (blink) {
      ctx.strokeStyle = '#68d5ff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-r*0.25, -r*0.05); ctx.lineTo(-r*0.05, -r*0.05); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r*0.05, -r*0.05); ctx.lineTo(r*0.25, -r*0.05); ctx.stroke();
    } else {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-r*0.16, -r*0.06, r*0.14, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(r*0.16, -r*0.06, r*0.14, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#68d5ff';
      ctx.beginPath(); ctx.arc(-r*0.14, -r*0.04, r*0.08, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(r*0.14, -r*0.04, r*0.08, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; // 星星高光
      ctx.beginPath(); ctx.arc(-r*0.1, -r*0.1, r*0.03, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(r*0.2, -r*0.1, r*0.03, 0, Math.PI*2); ctx.fill();
    }
    // 嘴（微笑w形）
    ctx.strokeStyle = '#ff6b9c'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r*0.12, r*0.14);
    ctx.quadraticCurveTo(-r*0.04, r*0.22, 0, r*0.15);
    ctx.quadraticCurveTo(r*0.04, r*0.22, r*0.12, r*0.14);
    ctx.stroke();
    // 腮红
    ctx.fillStyle = 'rgba(255,107,156,0.3)';
    ctx.beginPath(); ctx.arc(-r*0.32, r*0.06, r*0.08, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.32, r*0.06, r*0.08, 0, Math.PI*2); ctx.fill();
  }

  else if (id === 'bobo') {
    // — 果冻怪：身体像波浪一样抖动 —
    const pts = 20;
    ctx.fillStyle = m.color;
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const wobble = Math.sin(t * 0.07 + a * 3) * r * 0.08;
      const R = r * 0.52 + wobble;
      ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = m.accent; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const wobble = Math.sin(t * 0.07 + a * 3) * r * 0.08;
      const R = r * 0.52 + wobble;
      ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R);
    }
    ctx.closePath(); ctx.stroke();
    // 触角
    const ta = Math.sin(t * 0.1) * 0.3;
    ctx.strokeStyle = m.accent; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -r*0.45);
    ctx.quadraticCurveTo(r*0.2*Math.sin(ta), -r*0.75, r*0.1, -r*0.82); ctx.stroke();
    ctx.fillStyle = m.accent;
    ctx.beginPath(); ctx.arc(r*0.1, -r*0.82, r*0.06, 0, Math.PI*2); ctx.fill();
    // 大小眼（一大一小）
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-r*0.14, -r*0.08, r*0.14, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.16, -r*0.04, r*0.1, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(-r*0.12, -r*0.06, r*0.08, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.17, -r*0.03, r*0.06, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#0f1724';
    ctx.beginPath(); ctx.arc(-r*0.11, -r*0.05, r*0.04, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.17, -r*0.02, r*0.03, 0, Math.PI*2); ctx.fill();
    // 小手臂挥舞
    const armA = Math.sin(t * 0.12) * 0.4;
    ctx.strokeStyle = m.color; ctx.lineWidth = r*0.08;
    ctx.beginPath(); ctx.moveTo(-r*0.45, r*0.05); ctx.lineTo(-r*0.7, r*0.05 + Math.sin(armA)*r*0.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r*0.45, r*0.05); ctx.lineTo(r*0.7, r*0.05 - Math.sin(armA)*r*0.2); ctx.stroke();
    // 嘴 O 形
    ctx.strokeStyle = '#ff6b9c'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, r*0.18, r*0.08, 0, Math.PI*2); ctx.stroke();
  }

  else if (id === 'babi') {
    // — 机器人：方形身体，天线，LED眼 —
    const tilt = Math.sin(t * 0.06) * 3;
    // 天线
    ctx.strokeStyle = m.accent; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -r*0.42); ctx.lineTo(0, -r*0.72); ctx.stroke();
    ctx.fillStyle = '#ff6b9c';
    const antGlow = 0.5 + Math.sin(t * 0.15) * 0.5;
    ctx.globalAlpha = antGlow;
    ctx.beginPath(); ctx.arc(0, -r*0.75, r*0.06, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
    // 身体（方形）
    ctx.fillStyle = m.color;
    roundRect(ctx, -r*0.35, r*0.05, r*0.7, r*0.4, r*0.1, true);
    // 头
    ctx.save(); ctx.rotate(tilt * Math.PI / 180);
    roundRect(ctx, -r*0.42, -r*0.42, r*0.84, r*0.5, r*0.14, true);
    ctx.strokeStyle = m.accent; ctx.lineWidth = 2;
    roundRect(ctx, -r*0.42, -r*0.42, r*0.84, r*0.5, r*0.14, false);
    ctx.stroke();
    // LED 眼（闪烁）
    const eyeFlash = (Math.floor(t / 15) % 3);
    ctx.fillStyle = eyeFlash === 0 ? '#ffd166' : eyeFlash === 1 ? '#ff6b9c' : '#8ef6d3';
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10;
    roundRect(ctx, -r*0.28, -r*0.28, r*0.2, r*0.12, 3, true);
    roundRect(ctx, r*0.08, -r*0.28, r*0.2, r*0.12, 3, true);
    ctx.shadowBlur = 0;
    // 嘴（LED 条）
    ctx.fillStyle = '#ffd166';
    for (let i = 0; i < 4; i++) {
      const on = ((t + i * 7) % 12) < 7;
      ctx.globalAlpha = on ? 0.9 : 0.15;
      ctx.fillRect(-r*0.2 + i*r*0.12, -r*0.06, r*0.08, r*0.04);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    // 手臂（伸缩）
    const arm = Math.sin(t * 0.1) * r * 0.12;
    ctx.strokeStyle = m.accent; ctx.lineWidth = r*0.08; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-r*0.38, r*0.18); ctx.lineTo(-r*0.65, r*0.18 + arm); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r*0.38, r*0.18); ctx.lineTo(r*0.65, r*0.18 - arm); ctx.stroke();
    // 腿
    const lk = Math.sin(t * 0.12) * 4;
    ctx.beginPath(); ctx.moveTo(-r*0.18, r*0.45); ctx.lineTo(-r*0.22, r*0.78 + lk); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r*0.18, r*0.45); ctx.lineTo(r*0.22, r*0.78 - lk); ctx.stroke();
  }

  else if (id === 'babo') {
    // — 皇冠小人：飘浮皇冠，披风身体 —
    const crownFloat = Math.sin(t * 0.07) * r * 0.06;
    const walk = Math.sin(t * 0.13) * 5;
    // 披风（身体）
    ctx.fillStyle = m.color; ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(-r*0.32, r*0.0); ctx.lineTo(-r*0.45, r*0.6 + walk*0.5);
    ctx.lineTo(r*0.45, r*0.6 - walk*0.5); ctx.lineTo(r*0.32, r*0.0);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    // 小腿
    ctx.strokeStyle = m.accent; ctx.lineWidth = r*0.08; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-r*0.15, r*0.55); ctx.lineTo(-r*0.2, r*0.85 + walk); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r*0.15, r*0.55); ctx.lineTo(r*0.2, r*0.85 - walk); ctx.stroke();
    // 头
    ctx.fillStyle = m.color;
    ctx.beginPath(); ctx.arc(0, -r*0.12, r*0.38, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = m.accent; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -r*0.12, r*0.38, 0, Math.PI*2); ctx.stroke();
    // 眼
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-r*0.14, -r*0.16, r*0.1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.14, -r*0.16, r*0.1, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#68d5ff';
    ctx.beginPath(); ctx.arc(-r*0.12, -r*0.14, r*0.06, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.12, -r*0.14, r*0.06, 0, Math.PI*2); ctx.fill();
    // 得意的笑
    ctx.strokeStyle = '#ff8a5b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, r*0.0, r*0.12, 0.1, Math.PI - 0.1); ctx.stroke();
    // 飘浮皇冠✨
    ctx.fillStyle = '#ffd166';
    ctx.save(); ctx.translate(0, -r*0.52 + crownFloat);
    ctx.beginPath();
    ctx.moveTo(-r*0.24, r*0.08);
    ctx.lineTo(-r*0.2, -r*0.08); ctx.lineTo(-r*0.06, r*0.04);
    ctx.lineTo(0, -r*0.14);
    ctx.lineTo(r*0.06, r*0.04); ctx.lineTo(r*0.2, -r*0.08);
    ctx.lineTo(r*0.24, r*0.08);
    ctx.closePath(); ctx.fill();
    // 宝石
    ctx.fillStyle = '#ff6b9c';
    ctx.beginPath(); ctx.arc(0, -r*0.02, r*0.04, 0, Math.PI*2); ctx.fill();
    ctx.restore();
    // 皇冠光芒
    ctx.fillStyle = 'rgba(255,209,102,0.35)';
    const sparkle = Math.sin(t * 0.2) * 0.3 + 0.7;
    ctx.globalAlpha = sparkle * 0.4;
    ctx.beginPath(); ctx.arc(0, -r*0.55 + crownFloat, r*0.3, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

/* ==========================================================
   CELEBRATION SYSTEM — 根据性格的5+1种庆祝
   每个角色有自己专属的庆祝动画
   ========================================================== */
const CELEBRATIONS = [
  // 0: Bobi (可爱) — 撒爱心，转圈圈脸红
  { mascotId: 'bobi', title: 'Bobi 的爱心暴风雪 ♡', fn(ctx, w, h, t) {
    const cx = w/2, cy = h/2;
    // Bobi 在中间转圈
    ctx.save(); ctx.translate(cx, cy - 10);
    ctx.rotate(Math.sin(t * 0.04) * 0.3);
    drawMascot(ctx, 'bobi', 0, 0, 70, t);
    ctx.restore();
    // 满屏爱心
    ctx.font = '18px serif';
    for (let i = 0; i < 18; i++) {
      const hx = (i * 47 + t * 1.2) % (w + 40) - 20;
      const hy = (i * 31 + t * 0.8) % (h + 40) - 20;
      ctx.globalAlpha = 0.3 + Math.sin(t * 0.05 + i) * 0.2;
      ctx.fillStyle = ['#ff6b9c','#ffc6d9','#ff8a5b'][i % 3];
      ctx.fillText('♡', hx, hy);
    }
    ctx.globalAlpha = 1;
    // 其他角色被萌到，挤在角落
    ['boba','bobo','babi','babo'].forEach((id, i) => {
      const px = 50 + i * 40, py = h - 60;
      const squish = 1 + Math.sin(t * 0.1 + i) * 0.15;
      ctx.save(); ctx.translate(px, py); ctx.scale(1, squish);
      drawMascot(ctx, id, 0, 0, 32, t + i * 20);
      ctx.restore();
    });
  }},

  // 1: Boba (活泼) — 像弹球一样满屏弹，留彩色尾迹
  { mascotId: 'boba', title: 'Boba 弹球模式 ⚡', fn(ctx, w, h, t) {
    const speed = 3;
    const bx = Math.abs(((t * speed) % (2 * w)) - w);
    const by = Math.abs(((t * speed * 0.7 + 80) % (2 * h)) - h);
    // 尾迹
    for (let i = 1; i <= 8; i++) {
      const age = i * 4;
      const tx = Math.abs((((t - age) * speed) % (2 * w)) - w);
      const ty = Math.abs((((t - age) * speed * 0.7 + 80) % (2 * h)) - h);
      ctx.globalAlpha = 0.35 - i * 0.04;
      ctx.fillStyle = ['#68d5ff','#8ef6d3','#ffd166','#ff6b9c'][i % 4];
      ctx.beginPath(); ctx.arc(tx, ty, 14 - i, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    drawMascot(ctx, 'boba', bx, by, 55, t);
    // 其他角色在躲闪
    ['bobi','bobo','babi','babo'].forEach((id, i) => {
      const duck = Math.sin(t * 0.08 + i * 2) > 0.3 ? -12 : 0;
      drawMascot(ctx, id, 80 + i * 100, h - 55 + duck, 35, t + i * 15);
    });
  }},

  // 2: Bobo (高冷) — 缓缓戴墨镜，慢拍手，其他角色疯狂鼓掌他无动于衷
  { mascotId: 'bobo', title: 'Bobo 的高冷鼓掌 ▬', fn(ctx, w, h, t) {
    const cx = w / 2, cy = h / 2;
    drawMascot(ctx, 'bobo', cx, cy - 10, 80, t);
    // 墨镜（从上滑下来）
    const glassY = Math.min(0, -40 + t * 0.6);
    ctx.fillStyle = '#222'; ctx.globalAlpha = 0.9;
    roundRect(ctx, cx - 22, cy - 26 + glassY, 16, 8, 3, true);
    roundRect(ctx, cx + 6, cy - 26 + glassY, 16, 8, 3, true);
    ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 6, cy - 22 + glassY); ctx.lineTo(cx + 6, cy - 22 + glassY); ctx.stroke();
    ctx.globalAlpha = 1;
    // 其他角色疯狂鼓掌 + 冒感叹号
    ['bobi','boba','babi','babo'].forEach((id, i) => {
      const px = 50 + i * 120, py = h - 55;
      const clap = Math.sin(t * 0.3 + i) * 5;
      ctx.save(); ctx.translate(px, py + clap);
      drawMascot(ctx, id, 0, 0, 36, t * 3 + i * 20); // 加速动画=兴奋
      ctx.restore();
      if ((t + i * 20) % 40 < 20) {
        ctx.fillStyle = '#ffd166'; ctx.font = 'bold 16px sans-serif';
        ctx.fillText('!', px + 10, py - 30);
      }
    });
    // Bobo 偶尔微微点头（非常微小）
    if (t % 120 > 100) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('…不错', cx, cy + 50);
      ctx.textAlign = 'left';
    }
  }},

  // 3: Babi (搞笑) — 鞠躬摔倒，爬起来又摔，踩到香蕉皮
  { mascotId: 'babi', title: 'Babi 的连环摔 😜', fn(ctx, w, h, t, score) {
    const cx = w / 2, cy = h / 2 + 20;
    const cycle = t % 120;
    // 香蕉皮
    ctx.fillStyle = '#ffd166'; ctx.font = '22px serif';
    ctx.fillText('🍌', cx + 30, cy + 30);
    if (cycle < 40) {
      // 鞠躬阶段
      const bow = Math.min(1, cycle / 20);
      ctx.save(); ctx.translate(cx, cy);
      ctx.rotate(bow * 0.8);
      drawMascot(ctx, 'babi', 0, 0, 60, t);
      ctx.restore();
    } else if (cycle < 70) {
      // 摔倒
      ctx.save(); ctx.translate(cx + 20, cy + 15);
      ctx.rotate(Math.PI / 2);
      drawMascot(ctx, 'babi', 0, 0, 60, t);
      ctx.restore();
      // 星星
      ctx.fillStyle = '#ffd166'; ctx.font = '14px serif';
      for (let i = 0; i < 4; i++) {
        const sx = cx + Math.cos(t * 0.1 + i * 1.5) * 40;
        const sy = cy - 20 + Math.sin(t * 0.1 + i * 1.5) * 20;
        ctx.fillText('★', sx, sy);
      }
    } else {
      // 爬起来，晃晃悠悠
      const wobble = Math.sin((cycle - 70) * 0.2) * 0.3;
      ctx.save(); ctx.translate(cx, cy);
      ctx.rotate(wobble);
      drawMascot(ctx, 'babi', 0, 0, 60, t);
      ctx.restore();
    }
    // 分数条
    ctx.fillStyle = '#f7fafc'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
    ctx.fillText(`得分: ${score}  (但 Babi 摔了)`, cx, 30);
    ctx.textAlign = 'left';
    // 观众笑
    ['bobi','boba','bobo','babo'].forEach((id, i) => {
      drawMascot(ctx, id, 40 + i * 50, h - 50, 30, t + i * 10);
    });
  }},

  // 4: Babo (社恐) — 躲在箱子后面，慢慢探头，其他角色温柔鼓励
  { mascotId: 'babo', title: 'Babo 的勇气时刻 …', fn(ctx, w, h, t) {
    const cx = w / 2, cy = h / 2 + 10;
    // 箱子
    ctx.fillStyle = '#2a3040';
    roundRect(ctx, cx - 40, cy - 20, 80, 70, 10, true);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
    roundRect(ctx, cx - 40, cy - 20, 80, 70, 10, false); ctx.stroke();
    ctx.fillStyle = '#9eb0c5'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('📦', cx, cy + 25);
    ctx.textAlign = 'left';
    // Babo 从箱子后面慢慢探出来
    const peek = Math.min(1, t / 100);
    const peekY = cy - 30 - peek * 30;
    const shake = Math.sin(t * 0.2) * (1 - peek) * 3; // 越勇敢越不抖
    ctx.save();
    ctx.translate(cx + shake, peekY);
    const sc = 0.4 + peek * 0.5;
    ctx.scale(sc, sc);
    drawMascot(ctx, 'babo', 0, 0, 60, t);
    ctx.restore();
    // 汗滴（紧张）
    if (peek < 0.7) {
      ctx.fillStyle = '#68d5ff'; ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.arc(cx + 28 + shake, peekY - 5, 3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // 其他角色温柔地在旁边加油
    ['bobi','boba','bobo','babi'].forEach((id, i) => {
      const px = i < 2 ? 60 + i * 50 : w - 110 + (i - 2) * 50;
      drawMascot(ctx, id, px, cy + 20, 34, t + i * 15);
      // 小对话泡泡
      if ((t + i * 40) % 100 < 50 && peek > 0.3) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '10px sans-serif';
        ctx.fillText(['加油!','你可以!','别怕~','慢慢来'][i], px - 12, cy - 10);
      }
    });
    // 如果完全探出来了，小小地挥手
    if (peek > 0.95) {
      ctx.fillStyle = '#d9ff9b'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('(小小地挥了挥手)', cx, cy - 65);
      ctx.textAlign = 'left';
    }
  }}
];

// 第6个：bobiboba 隐藏款庆祝（集齐后触发）
const CELEB_BOBIBOBA = {
  mascotId: 'bobiboba', title: '✿ BOBIBOBA 大合体 ✿',
  fn(ctx, w, h, t) {
    const cx = w / 2, cy = h / 2;
    const ids = WORLD.mascots.map(m => m.id);
    // 阶段1: 五个角色从四周飞向中心
    const merge = Math.min(1, t / 80);
    ids.forEach((id, i) => {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const dist = 160 * (1 - merge);
      const mx = cx + Math.cos(a) * dist;
      const my = cy + Math.sin(a) * dist;
      const sz = 42 * (1 - merge * 0.5);
      if (merge < 0.95) drawMascot(ctx, id, mx, my, sz, t + i * 20);
    });
    // 阶段2: 合体后显示巨大 bobiboba
    if (merge > 0.8) {
      const reveal = Math.min(1, (merge - 0.8) / 0.2);
      const size = 90 + reveal * 30 + Math.sin(t * 0.06) * 8;
      ctx.globalAlpha = reveal;
      drawMascot(ctx, 'bobiboba', cx, cy, size, t);
      ctx.globalAlpha = 1;
      // 彩虹烟花
      const cols = WORLD.secret.colors;
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2 + t * 0.02;
        const d = 60 + Math.sin(t * 0.04 + i) * 25 + (t - 80) * 0.5;
        ctx.fillStyle = cols[i % cols.length];
        ctx.globalAlpha = Math.max(0.1, 0.7 - d / 300);
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 3 + Math.sin(i)*2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // 文字
    if (t > 100) {
      ctx.fillStyle = '#ffd166'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('🎉 全员集结完毕！隐藏款解锁！', cx, h - 30);
      ctx.textAlign = 'left';
    }
  }
};

/* ==========================================================
   CELEBRATION OVERLAY — 弹窗 + 名字输入
   ========================================================== */
function showCelebration(gameArea, score, onDone) {
  // 创建蒙版
  const overlay = el('div', 'celeb-overlay');
  const box = el('div', 'celeb-box');
  const cvs = document.createElement('canvas');
  cvs.className = 'celeb-canvas';
  cvs.width = 540; cvs.height = 320;
  const ctx = cvs.getContext('2d');

  // 判断是否集齐→播放 bobiboba 庆祝，否则随机
  const wasAllCollected = allCollected();
  let celeb;
  if (!wasAllCollected) {
    const idx = Math.floor(Math.random() * CELEBRATIONS.length);
    celeb = CELEBRATIONS[idx];
    markCollected(celeb.mascotId);
  } else {
    // 如果刚好是全集齐后的第一次，播放 bobiboba
    const seenBobiboba = getCollection()['bobiboba'];
    if (!seenBobiboba) {
      celeb = CELEB_BOBIBOBA;
      markCollected('bobiboba');
    } else {
      // 已经看过 bobiboba 了，正常随机（包含 bobiboba）
      const all = [...CELEBRATIONS, CELEB_BOBIBOBA];
      celeb = all[Math.floor(Math.random() * all.length)];
    }
  }
  const celebFn = celeb.fn;

  // 集齐提示
  const justCompleted = !wasAllCollected && allCollected();

  // 标题
  const title = el('div', 'celeb-title', celeb.title + (justCompleted ? ' 🎁 集齐全部！' : ''));
  const scoreDiv = el('div', 'celeb-score', `得分 <strong>${Math.round(score)}</strong>`);
  // 收集进度
  const collected = getCollection();
  const progress = WORLD.mascots.filter(m => collected[m.id]).length;
  const progressDiv = el('div', 'celeb-progress',
    `收集进度: ${progress}/5` + (collected.bobiboba ? ' ✿ bobiboba已解锁' : '') +
    (justCompleted ? '<br><strong>恭喜！解锁隐藏款 bobiboba！下次结算会看到彩虹合体！</strong>' : '')
  );

  // 名字输入
  const form = el('div', 'celeb-form');
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'celeb-input';
  input.placeholder = '输入赛博昵称（留空为匿名玩家）';
  input.maxLength = 20;
  const saveBtn = el('button', 'celeb-save', '保存到排行榜');
  const skipBtn = el('button', 'celeb-skip', '跳过');
  form.append(input, saveBtn, skipBtn);

  box.append(cvs, title, scoreDiv, progressDiv, form);
  overlay.appendChild(box);
  gameArea.closest('.game-main')?.appendChild(overlay) || document.body.appendChild(overlay);

  // 动画
  let t = 0;
  let raf = null;
  function animate() {
    t++;
    ctx.clearRect(0, 0, 540, 320);
    // 背景
    ctx.fillStyle = '#0f1724';
    roundRect(ctx, 0, 0, 540, 320, 16, true);
    drawGrid(ctx, 540, 320, 28, 'rgba(255,255,255,0.04)');
    // 庆祝动画
    celebFn(ctx, 540, 320, t, score);
    raf = requestAnimationFrame(animate);
  }
  animate();
  input.focus();

  function finish(name) {
    cancelAnimationFrame(raf);
    overlay.remove();
    onDone(name || '匿名玩家');
  }

  saveBtn.addEventListener('click', () => finish(input.value.trim()));
  skipBtn.addEventListener('click', () => finish(''));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') finish(input.value.trim()); });
}

function jumpGame(container, api) {
  const wrap = createGameShell('Jump', '按住鼠标、手指或空格蓄力。松开后飞跃平台，落空则结束。');
  const charge = el('div', 'jump-charge-wrap', '<div class="jump-charge-bar"></div>');
  const canvas = document.createElement('canvas');
  canvas.className = 'cw-canvas';
  wrap.append(charge, canvas);
  container.appendChild(wrap);
  const ctx = canvas.getContext('2d');
  const bar = charge.querySelector('.jump-charge-bar');
  const mascot = WORLD.mascots[3];
  const player = { x: 0, y: 0, r: 16, vx: 0, vy: 0, air: false };
  let raf = 0;
  let w = 0;
  let h = 0;
  let press = false;
  let chargeValue = 0;
  let landed = 0;
  let platforms = [];

  function resize() {
    w = Math.max(320, container.clientWidth - 24);
    h = Math.max(380, Math.floor(innerHeight * 0.55));
    canvas.width = w;
    canvas.height = h;
  }

  function platform(x, y, width) {
    return { x, y, width, height: 18 };
  }

  function addPlatform() {
    const last = platforms[platforms.length - 1];
    const gap = 140 + Math.random() * 110;
    const nextY = clamp(last.y + (Math.random() * 120 - 60), 110, h - 90);
    platforms.push(platform(last.x + gap, nextY, 92 + Math.random() * 52));
  }

  function reset() {
    resize();
    platforms = [platform(50, h - 88, 120), platform(250, h - 148, 118), platform(470, h - 210, 130)];
    while (platforms.length < 10) addPlatform();
    landed = 0;
    player.x = platforms[0].x + platforms[0].width / 2;
    player.y = platforms[0].y - player.r;
    player.vx = 0;
    player.vy = 0;
    player.air = false;
    chargeValue = 0;
    bar.style.width = '0%';
    api.setScore(0);
    api.setStatus('按住蓄力，松开起跳。');
  }

  function draw() {
    paintCanvas(ctx, w, h, '#1b2638', '#0e1623');
    platforms.forEach((p, index) => {
      ctx.fillStyle = index === landed ? 'rgba(255,138,91,0.85)' : 'rgba(104,213,255,0.72)';
      roundRect(ctx, p.x, p.y, p.width, p.height, 10, true);
    });

    ctx.fillStyle = mascot.accent;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = mascot.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0e1520';
    ctx.font = '700 15px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mascot.face, player.x, player.y + 1);
  }

  function tick() {
    if (press && !player.air) {
      chargeValue = Math.min(1, chargeValue + 0.018);
      bar.style.width = `${Math.round(chargeValue * 100)}%`;
    }
    if (player.air) {
      player.vy += 0.44;
      player.x += player.vx;
      player.y += player.vy;
    }
    if (player.x > w * 0.46) {
      const shift = player.x - w * 0.46;
      player.x -= shift;
      platforms.forEach(p => p.x -= shift);
    }
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      const hitTop = player.vy >= 0 && player.y + player.r >= p.y && player.y + player.r <= p.y + p.height + 12;
      const insideX = player.x >= p.x && player.x <= p.x + p.width;
      if (player.air && hitTop && insideX) {
        player.air = false;
        player.vx = 0;
        player.vy = 0;
        player.y = p.y - player.r;
        if (i > landed) {
          landed = i;
          api.addScore(10);
        }
      }
    }
    while (platforms.length && platforms[0].x + platforms[0].width < -100) {
      platforms.shift();
      landed = Math.max(0, landed - 1);
      addPlatform();
    }
    draw();
    if (player.y > h + 80) return api.finish(api.getScore(), '掉下平台了，本局结束。');
    raf = requestAnimationFrame(tick);
  }

  function down(event) {
    event?.preventDefault?.();
    if (!player.air) press = true;
  }

  function up(event) {
    event?.preventDefault?.();
    if (!press || player.air) return;
    press = false;
    player.air = true;
    player.vx = 3.6 + chargeValue * 8.2;
    player.vy = -(6.8 + chargeValue * 10.2);
    chargeValue = 0;
    bar.style.width = '0%';
  }

  function keydown(event) {
    if (event.code === 'Space') down(event);
  }

  function keyup(event) {
    if (event.code === 'Space') up(event);
  }

  return {
    start() {
      reset();
      tick();
      canvas.addEventListener('mousedown', down);
      canvas.addEventListener('touchstart', down, { passive: false });
      addEventListener('mouseup', up);
      addEventListener('touchend', up);
      addEventListener('keydown', keydown);
      addEventListener('keyup', keyup);
      addEventListener('resize', resize);
    },
    stop() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('mousedown', down);
      canvas.removeEventListener('touchstart', down);
      removeEventListener('mouseup', up);
      removeEventListener('touchend', up);
      removeEventListener('keydown', keydown);
      removeEventListener('keyup', keyup);
      removeEventListener('resize', resize);
    }
  };
}

function connectGame(container, api) {
  const wrap = createGameShell('Connect', '拖动圆点，让所有连线都不再相交。');
  const info = el('div', 'cw-subinfo', '把交叉边数量降到 0。');
  const canvas = document.createElement('canvas');
  canvas.className = 'cw-canvas';
  wrap.append(info, canvas);
  container.appendChild(wrap);
  const ctx = canvas.getContext('2d');
  const edges = [[0, 2], [0, 4], [1, 3], [1, 5], [2, 5], [2, 4], [3, 4], [0, 3]];
  let raf = 0;
  let w = 0;
  let h = 0;
  let dragIndex = -1;
  let nodes = [];

  function resize() {
    w = Math.max(320, container.clientWidth - 24);
    h = Math.max(380, Math.floor(innerHeight * 0.55));
    canvas.width = w;
    canvas.height = h;
  }

  function orient(p1, p2, p3) {
    return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
  }

  function hits(a, b, c, d) {
    if (a === c || a === d || b === c || b === d) return false;
    return orient(a, b, c) * orient(a, b, d) < 0 && orient(c, d, a) * orient(c, d, b) < 0;
  }

  function reset() {
    resize();
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.29;
    nodes = Array.from({ length: 6 }, (_, i) => {
      const angle = Math.PI * 2 * i / 6 + Math.random() * 0.8;
      return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius, r: 18, mascot: WORLD.mascots[i % WORLD.mascots.length] };
    });
    api.setScore(300);
  }

  function crossingEdges() {
    const found = new Set();
    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        const [a1, a2] = edges[i];
        const [b1, b2] = edges[j];
        if (hits(nodes[a1], nodes[a2], nodes[b1], nodes[b2])) {
          found.add(i);
          found.add(j);
        }
      }
    }
    return found;
  }

  function draw() {
    paintCanvas(ctx, w, h, '#172433', '#111827');
    const found = crossingEdges();
    const count = found.size;
    api.setScore(Math.max(0, 300 - count * 24));
    info.textContent = count === 0 ? '交叉数 0，已解开。' : `当前交叉边数量：${count}`;
    edges.forEach(([from, to], index) => {
      ctx.lineWidth = 4;
      ctx.strokeStyle = found.has(index) ? 'rgba(255,107,156,0.9)' : 'rgba(104,213,255,0.85)';
      ctx.beginPath();
      ctx.moveTo(nodes[from].x, nodes[from].y);
      ctx.lineTo(nodes[to].x, nodes[to].y);
      ctx.stroke();
    });
    nodes.forEach(node => {
      ctx.fillStyle = node.mascot.color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0e1520';
      ctx.font = '700 14px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.mascot.face, node.x, node.y + 1);
    });
    if (count === 0) return api.finish(api.getScore() + 120, '线网已经全部解开。');
    raf = requestAnimationFrame(draw);
  }

  function point(event) {
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches?.[0] || event.changedTouches?.[0];
    return { x: (touch ? touch.clientX : event.clientX) - rect.left, y: (touch ? touch.clientY : event.clientY) - rect.top };
  }

  function down(event) {
    const p = point(event);
    dragIndex = nodes.findIndex(node => Math.hypot(node.x - p.x, node.y - p.y) <= node.r + 6);
  }

  function move(event) {
    if (dragIndex < 0) return;
    event.preventDefault?.();
    const p = point(event);
    nodes[dragIndex].x = clamp(p.x, 28, w - 28);
    nodes[dragIndex].y = clamp(p.y, 28, h - 28);
  }

  function up() {
    dragIndex = -1;
  }

  return {
    start() {
      reset();
      draw();
      canvas.addEventListener('mousedown', down);
      canvas.addEventListener('mousemove', move);
      canvas.addEventListener('touchstart', down, { passive: true });
      canvas.addEventListener('touchmove', move, { passive: false });
      addEventListener('mouseup', up);
      addEventListener('touchend', up);
      addEventListener('resize', reset);
    },
    stop() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('mousedown', down);
      canvas.removeEventListener('mousemove', move);
      canvas.removeEventListener('touchstart', down);
      canvas.removeEventListener('touchmove', move);
      removeEventListener('mouseup', up);
      removeEventListener('touchend', up);
      removeEventListener('resize', reset);
    }
  };
}

function match3Game(container, api) {
  const wrap = createGameShell('Match 3', '先选一个图块，再点相邻图块交换。只有能消除的交换才会生效。');
  const boardNode = el('div', 'm3-board');
  wrap.appendChild(boardNode);
  container.appendChild(wrap);
  const size = 7;
  const types = WORLD.mascots.map(item => item.id);
  let board = [];
  let selected = null;
  let busy = false;
  let timers = [];

  function mascotFor(id) {
    return WORLD.mascots.find(item => item.id === id);
  }

  function randomType() {
    return choice(types);
  }

  function matches() {
    const set = new Set();
    for (let row = 0; row < size; row++) {
      let streak = 1;
      for (let col = 1; col <= size; col++) {
        if (col < size && board[row][col] === board[row][col - 1]) streak++;
        else {
          if (streak >= 3) for (let i = 0; i < streak; i++) set.add(`${row}-${col - 1 - i}`);
          streak = 1;
        }
      }
    }
    for (let col = 0; col < size; col++) {
      let streak = 1;
      for (let row = 1; row <= size; row++) {
        if (row < size && board[row][col] === board[row - 1][col]) streak++;
        else {
          if (streak >= 3) for (let i = 0; i < streak; i++) set.add(`${row - 1 - i}-${col}`);
          streak = 1;
        }
      }
    }
    return set;
  }

  function collapse() {
    for (let col = 0; col < size; col++) {
      const values = [];
      for (let row = size - 1; row >= 0; row--) if (board[row][col] != null) values.push(board[row][col]);
      for (let row = size - 1, i = 0; row >= 0; row--, i++) board[row][col] = values[i] ?? randomType();
    }
  }

  function render() {
    boardNode.innerHTML = '';
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const mascot = mascotFor(board[row][col]);
        const cell = el('button', `m3-cell${selected?.row === row && selected?.col === col ? ' selected' : ''}`);
        cell.type = 'button';
        cell.style.setProperty('--mc', mascot.color);
        cell.style.setProperty('--ma', mascot.accent);
        cell.innerHTML = `<span>${mascot.face}</span>`;
        cell.addEventListener('click', () => clickCell(row, col));
        boardNode.appendChild(cell);
      }
    }
  }

  function swap(a, b) {
    [board[a.row][a.col], board[b.row][b.col]] = [board[b.row][b.col], board[a.row][a.col]];
  }

  function cascade() {
    const set = matches();
    if (!set.size) {
      busy = false;
      api.setStatus('可以继续交换图块。');
      return render();
    }
    set.forEach(key => {
      const [row, col] = key.split('-').map(Number);
      board[row][col] = null;
    });
    api.addScore(set.size * 10);
    render();
    timers.push(setTimeout(() => {
      collapse();
      render();
      cascade();
    }, 170));
  }

  function clickCell(row, col) {
    if (busy) return;
    if (!selected) {
      selected = { row, col };
      return render();
    }
    const next = { row, col };
    if (selected.row === row && selected.col === col) {
      selected = null;
      return render();
    }
    if (Math.abs(selected.row - row) + Math.abs(selected.col - col) !== 1) {
      selected = next;
      return render();
    }
    swap(selected, next);
    if (!matches().size) {
      swap(selected, next);
      selected = null;
      api.setStatus('这次交换没有形成消除。');
      return render();
    }
    selected = null;
    busy = true;
    api.setStatus('连锁消除中。');
    cascade();
  }

  return {
    start() {
      board = Array.from({ length: size }, () => Array.from({ length: size }, () => randomType()));
      while (matches().size) matches().forEach(key => {
        const [row, col] = key.split('-').map(Number);
        board[row][col] = randomType();
      });
      selected = null;
      busy = false;
      api.setScore(0);
      api.setStatus('交换图块，做出连续消除。');
      render();
    },
    stop() {
      timers.forEach(clearTimeout);
      timers = [];
    }
  };
}

function memoryGame(container, api) {
  const wrap = createGameShell('Memory', '开始后会有 8 秒预览时间，随后要把 16 张卡片两两配对。');
  const info = el('div', 'cw-subinfo', '预览结束后才能翻牌。');
  const grid = el('div', 'memory-grid');
  wrap.append(info, grid);
  container.appendChild(wrap);
  let deck = [];
  let open = [];
  let matched = new Set();
  let locked = true;
  let timer = 0;
  let left = 8;

  function render() {
    grid.innerHTML = '';
    deck.forEach((card, index) => {
      const faceUp = open.includes(index) || matched.has(index);
      const node = el('button', `memory-card${faceUp ? ' face-up' : ''}`);
      node.type = 'button';
      node.style.setProperty('--mc', card.mascot.color);
      node.style.setProperty('--ma', card.mascot.accent);
      node.innerHTML = `<span class="memory-front">${card.mascot.face}</span><span class="memory-back">?</span>`;
      node.addEventListener('click', () => flip(index));
      grid.appendChild(node);
    });
  }

  function preview() {
    clearInterval(timer);
    info.textContent = `预览中：${left} 秒`;
    timer = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearInterval(timer);
        open = [];
        locked = false;
        info.textContent = '开始正式配对。';
        return render();
      }
      info.textContent = `预览中：${left} 秒`;
    }, 1000);
  }

  function flip(index) {
    if (locked || matched.has(index) || open.includes(index)) return;
    open.push(index);
    render();
    if (open.length < 2) return;
    locked = true;
    const [a, b] = open;
    if (deck[a].pair === deck[b].pair) {
      matched.add(a);
      matched.add(b);
      open = [];
      locked = false;
      api.addScore(25);
      info.textContent = `已配对 ${matched.size / 2}/8`;
      render();
      if (matched.size === deck.length) api.finish(api.getScore() + 80, '记忆挑战完成。');
      return;
    }
    setTimeout(() => {
      open = [];
      locked = false;
      render();
    }, 700);
  }

  return {
    start() {
      deck = shuffle(Array.from({ length: 8 }, (_, index) => {
        const mascot = WORLD.mascots[index % WORLD.mascots.length];
        return [{ pair: `${mascot.id}-${index}`, mascot }, { pair: `${mascot.id}-${index}`, mascot }];
      }).flat());
      open = deck.map((_, index) => index);
      matched = new Set();
      locked = true;
      left = 8;
      api.setScore(0);
      render();
      preview();
    },
    stop() {
      clearInterval(timer);
    }
  };
}

function mergeGame(container, api) {
  const wrap = createGameShell('Merge', '点击空位放置棋子。相邻且相同的棋子会自动合并升级。');
  const nextBox = el('div', 'cw-subinfo', '');
  const grid = el('div', 'merge-grid');
  wrap.append(nextBox, grid);
  container.appendChild(wrap);
  const size = 5;
  let board = [];
  let nextPiece = null;

  function neighbors(row, col) {
    return [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]].filter(([r, c]) => r >= 0 && r < size && c >= 0 && c < size);
  }

  function render() {
    nextBox.innerHTML = `下一枚：<span class="merge-next" style="--mc:${nextPiece.mascot.color};--ma:${nextPiece.mascot.accent}">${nextPiece.mascot.face} Lv.${nextPiece.level}</span>`;
    grid.innerHTML = '';
    board.flat().forEach((cell, index) => {
      const btn = el('button', `merge-cell${cell ? ' filled' : ''}`);
      btn.type = 'button';
      if (cell) {
        btn.style.setProperty('--mc', cell.mascot.color);
        btn.style.setProperty('--ma', cell.mascot.accent);
        btn.innerHTML = `<span>${cell.mascot.face}</span><small>Lv.${cell.level}</small>`;
      } else btn.innerHTML = '<span class="merge-empty">+</span>';
      btn.addEventListener('click', () => place(Math.floor(index / size), index % size));
      grid.appendChild(btn);
    });
  }

  function applyGravity() {
    for (let col = 0; col < size; col++) {
      const values = [];
      for (let row = size - 1; row >= 0; row--) if (board[row][col]) values.push(board[row][col]);
      for (let row = size - 1, i = 0; row >= 0; row--, i++) board[row][col] = values[i] || null;
    }
  }

  function group(row, col, cell) {
    const queue = [[row, col]];
    const seen = new Set([`${row}-${col}`]);
    const found = [];
    while (queue.length) {
      const [r, c] = queue.shift();
      found.push([r, c]);
      neighbors(r, c).forEach(([nr, nc]) => {
        const key = `${nr}-${nc}`;
        const next = board[nr][nc];
        if (!next || seen.has(key)) return;
        if (next.level === cell.level && next.mascot.id === cell.mascot.id) {
          seen.add(key);
          queue.push([nr, nc]);
        }
      });
    }
    return found;
  }

  function settle() {
    let changed = true;
    while (changed) {
      changed = false;
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          const cell = board[row][col];
          if (!cell) continue;
          const found = group(row, col, cell);
          if (found.length >= 2) {
            found.slice(1).forEach(([r, c]) => board[r][c] = null);
            board[row][col] = { mascot: cell.mascot, level: Math.min(6, cell.level + 1) };
            api.addScore(cell.level * found.length * 15);
            changed = true;
          }
        }
      }
      applyGravity();
    }
  }

  function possible() {
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const cell = board[row][col];
        if (!cell) return true;
        if (neighbors(row, col).some(([nr, nc]) => board[nr][nc] && board[nr][nc].level === cell.level && board[nr][nc].mascot.id === cell.mascot.id)) return true;
      }
    }
    return false;
  }

  function place(row, col) {
    if (board[row][col]) return;
    board[row][col] = nextPiece;
    settle();
    nextPiece = { level: Math.random() < 0.75 ? 1 : 2, mascot: choice(WORLD.mascots) };
    render();
    if (board.flat().every(Boolean) && !possible()) api.finish(api.getScore(), '棋盘已满，没有可继续合成的位置。');
  }

  return {
    start() {
      board = Array.from({ length: size }, () => Array.from({ length: size }, () => null));
      nextPiece = { level: 1, mascot: choice(WORLD.mascots) };
      api.setScore(0);
      api.setStatus('点击空位放置下一枚碎片。');
      render();
    },
    stop() {}
  };
}

function runnerGame(container, api) {
  const wrap = createGameShell('Runner', '点击画布、触摸屏幕或按空格起跳。撞到障碍物就结束。');
  const canvas = document.createElement('canvas');
  canvas.className = 'cw-canvas';
  wrap.appendChild(canvas);
  container.appendChild(wrap);
  const ctx = canvas.getContext('2d');
  const player = { x: 84, y: 0, w: 34, h: 42, vy: 0, ground: 0 };
  let raf = 0;
  let w = 0;
  let h = 0;
  let tick = 0;
  let speed = 5.4;
  let obstacles = [];
  let coins = [];
  let mascot = WORLD.mascots[0];

  function resize() {
    w = Math.max(320, container.clientWidth - 24);
    h = Math.max(380, Math.floor(innerHeight * 0.55));
    canvas.width = w;
    canvas.height = h;
    player.ground = h - 72;
    player.y = player.ground;
  }

  function jump(event) {
    event?.preventDefault?.();
    if (player.y >= player.ground) player.vy = -12.4;
  }

  function keydown(event) {
    if (event.code === 'Space') jump(event);
  }

  function hit(circle, rect) {
    const nx = clamp(circle.x, rect.x, rect.x + rect.w);
    const ny = clamp(circle.y, rect.y, rect.y + rect.h);
    return Math.hypot(circle.x - nx, circle.y - ny) <= circle.r;
  }

  function update() {
    tick += 1;
    if (tick % 88 === 0) obstacles.push({ x: w + 40, w: Math.random() > 0.55 ? 26 : 36, h: Math.random() > 0.55 ? 64 : 36 });
    if (tick % 124 === 0) coins.push({ x: w + 40, y: player.ground - 70 - Math.random() * 90, r: 15, mascot: choice(WORLD.mascots) });
    if (tick % 220 === 0) speed += 0.25;
    player.vy += 0.72;
    player.y += player.vy;
    if (player.y > player.ground) {
      player.y = player.ground;
      player.vy = 0;
    }
    obstacles.forEach(item => item.x -= speed);
    coins.forEach(item => item.x -= speed * 0.92);
    obstacles = obstacles.filter(item => item.x + item.w > -40);
    coins = coins.filter(item => item.x + item.r > -40);
    const rect = { x: player.x, y: player.y - player.h, w: player.w, h: player.h };
    for (const item of obstacles) {
      if (rectOverlap(rect, { x: item.x, y: player.ground - item.h, w: item.w, h: item.h })) {
        api.finish(api.getScore(), '撞上障碍物了。');
        return false;
      }
    }
    coins = coins.filter(item => {
      if (hit(item, rect)) {
        mascot = item.mascot;
        api.addScore(20);
        return false;
      }
      return true;
    });
    if (tick % 12 === 0) api.addScore(1);
    return true;
  }

  function draw() {
    paintCanvas(ctx, w, h, '#1d2737', '#0d1520');
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, player.ground + 8, w, 4);
    ctx.fillStyle = 'rgba(255,138,91,0.18)';
    ctx.fillRect(0, player.ground + 12, w, 12);
    obstacles.forEach(item => {
      ctx.fillStyle = '#ff6b9c';
      roundRect(ctx, item.x, player.ground - item.h, item.w, item.h, 8, true);
    });
    coins.forEach(item => {
      ctx.fillStyle = item.mascot.color;
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0e1520';
      ctx.font = '700 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.mascot.face, item.x, item.y + 1);
    });
    ctx.fillStyle = mascot.color;
    roundRect(ctx, player.x, player.y - player.h, player.w, player.h, 12, true);
    ctx.fillStyle = '#0e1520';
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mascot.face, player.x + player.w / 2, player.y - player.h / 2 + 1);
  }

  function loop() {
    if (!update()) return;
    draw();
    raf = requestAnimationFrame(loop);
  }

  return {
    start() {
      resize();
      tick = 0;
      speed = 5.4;
      obstacles = [];
      coins = [];
      mascot = WORLD.mascots[0];
      player.vy = 0;
      api.setScore(0);
      api.setStatus('起跳躲避障碍，顺手收集角色徽章。');
      loop();
      canvas.addEventListener('mousedown', jump);
      canvas.addEventListener('touchstart', jump, { passive: false });
      addEventListener('keydown', keydown);
      addEventListener('resize', resize);
    },
    stop() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('mousedown', jump);
      canvas.removeEventListener('touchstart', jump);
      removeEventListener('keydown', keydown);
      removeEventListener('resize', resize);
    }
  };
}

function paintCanvas(ctx, w, h, top, bottom) {
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  drawGrid(ctx, w, h, 36, 'rgba(255,255,255,0.05)');
}

function drawGrid(ctx, w, h, step, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function roundRect(ctx, x, y, w, h, r, fill) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  if (fill) ctx.fill();
}

function rectOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function choice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
