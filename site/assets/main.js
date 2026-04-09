// Full playable prototypes (lightweight) for each game + per-page leaderboards
// Score save/load uses localStorage keyed by page path.

/* Utility helpers */
function escapeHtml(s){return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}

function leaderboardKey(){ return 'leaderboard:' + location.pathname; }
function renderLeaderboard(leaderboardEl){
  const list = JSON.parse(localStorage.getItem(leaderboardKey()) || '[]');
  leaderboardEl.innerHTML = '<h3>排行榜</h3>' + (list.length? ('<ol>'+list.map(i=>`<li>${escapeHtml(i.name)} — ${i.score}</li>`).join('')+'</ol>') : '<div class="muted">暂无记录，成为第一个高分玩家吧！</div>');
}

function saveScoreToLeaderboard(score, leaderboardEl){
  const name = prompt('输入显示名称以记录分数（留空为 匿名）') || '匿名';
  const list = JSON.parse(localStorage.getItem(leaderboardKey()) || '[]');
  list.push({name,score:Math.round(score),ts:Date.now()});
  list.sort((a,b)=>b.score - a.score);
  localStorage.setItem(leaderboardKey(), JSON.stringify(list.slice(0,20)));
  renderLeaderboard(leaderboardEl);
}

document.addEventListener('DOMContentLoaded', ()=>{
  // Prevent actual submit for demo auth forms
  const forms = document.querySelectorAll('.auth-forms form');
  forms.forEach(f=> f.addEventListener('submit', e=>{ e.preventDefault(); alert('表单已本地提交（示例）。实现后端以完成注册/登录流程。'); }));

  const gameArea = document.getElementById('game-area');
  if(!gameArea) return;

  const gameType = gameArea.dataset.game || 'generic';
  const startBtn = document.getElementById('start-btn');
  const scoreEl = document.getElementById('score');
  const leaderboardEl = document.getElementById('leaderboard');

  let running=false, score=0, activeController=null;

  function setScore(v){ score = v; if(scoreEl) scoreEl.textContent = score; }

  function startGame(){ if(running) return; running=true; setScore(0); gameArea.innerHTML=''; activeController = createControllerFor(gameType, gameArea, setScore); if(activeController && activeController.start) activeController.start(); startBtn.textContent='结束'; startBtn.classList.add('pulse'); }
  function stopGame(){ if(!running) return; running=false; if(activeController && activeController.stop) activeController.stop(); activeController=null; startBtn.textContent='开始'; startBtn.classList.remove('pulse'); saveScoreToLeaderboard(score, leaderboardEl); }

  startBtn.addEventListener('click', ()=>{ if(running) stopGame(); else startGame(); });
  document.addEventListener('keydown', (e)=>{ if(e.code==='Space'){ e.preventDefault(); if(running) stopGame(); else startGame(); } });

  renderLeaderboard(leaderboardEl);
});

function createControllerFor(type, container, scoreCallback){
  const map = {
    'jump': jumpGame,
    'connect': connectGame,
    'memory': memoryGame,
    'runner': runnerGame,
    'match3': match3Game,
    'merge': mergeGame
  };
  return (map[type] || genericGame)(container, scoreCallback);
}

/* Generic demo */
function genericGame(container, scoreCb){
  container.innerHTML = '<div class="neon-text">示例游戏占位</div>';
  return { start(){}, stop(){} };
}

/* --- Jump: simple platform jumper --- */
function jumpGame(container, scoreCb){
  const cvs = document.createElement('canvas'); container.appendChild(cvs);
  const ctx = cvs.getContext('2d');
  let w=0,h=0; function resize(){ w = container.clientWidth; h = Math.max(260, Math.floor(container.clientHeight*0.7)); cvs.width = w; cvs.height = h; }
  resize(); window.addEventListener('resize', resize);

  const player = {x:80,y:0,r:12,vy:0,ground:false};
  let platforms = [];
  let raf=null;

  function reset(){ platforms = [{x:40,y:h-60,w:120},{x:220,y:h-120,w:120}]; player.x = 80; player.y = platforms[0].y - player.r; player.vy = 0; player.ground = true; scoreCb(0); }

  function spawnPlatform(){ const last = platforms[platforms.length-1]; const nx = last.x + 140 + Math.random()*120; const ny = h-60 - (Math.random()*120); platforms.push({x:nx,y:Math.min(h-40, Math.max(80, ny)),w:100+Math.random()*80}); }

  function draw(){ ctx.clearRect(0,0,w,h); // bg grid
    ctx.fillStyle='rgba(161,76,255,0.04)'; for(let i=0;i<Math.ceil(w/40);i++){ ctx.fillRect(i*40, h-6 - (i%3), 20, 2); }
    // platforms
    ctx.fillStyle='linear-gradient(0,transparent,rgba(255,255,255,0.03))';
    platforms.forEach(p=>{ ctx.fillStyle = 'rgba(180,120,255,0.14)'; ctx.fillRect(p.x, p.y, p.w, 12); ctx.strokeStyle='rgba(161,76,255,0.28)'; ctx.strokeRect(p.x, p.y, p.w, 12); });
    // player
    ctx.beginPath(); ctx.fillStyle='white'; ctx.arc(player.x, player.y, player.r, 0, Math.PI*2); ctx.fill(); ctx.closePath();
    // score
    ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.font='12px Inter'; ctx.fillText('跳跃游戏', 12, 20);
  }

  function update(){ // physics
    player.vy += 0.6; player.y += player.vy;
    // collision with platforms
    for(let p of platforms){ if(player.vy>0 && player.y + player.r > p.y && player.y + player.r < p.y + 12 && player.x > p.x-4 && player.x < p.x + p.w + 4){ player.y = p.y - player.r; player.vy = 0; player.ground = true; // landed
          // if landed on last platform, score and spawn next
          if(p === platforms[platforms.length-1]){ scoreCb((+document.getElementById('score').textContent||0)+1); spawnPlatform(); }
        }}
    // move world left slowly to simulate progress
    for(let p of platforms){ p.x -= 1.6; }
    player.x -= 1.6; // keep player relative
    // remove offscreen platforms
    if(platforms.length && platforms[0].x + platforms[0].w < -50) platforms.shift();
    if(player.x < 80) player.x = 80;
  }

  function loop(){ update(); draw(); raf = requestAnimationFrame(loop); }

  function onClick(){ if(player.ground){ player.vy = -12; player.ground = false; } }

  return {
    start(){ reset(); loop(); container.addEventListener('click', onClick); container.classList.add('pulse'); },
    stop(){ cancelAnimationFrame(raf); raf=null; container.removeEventListener('click', onClick); container.classList.remove('pulse'); }
  };
}

/* --- Runner: endless runner --- */
function runnerGame(container, scoreCb){
  const cvs = document.createElement('canvas'); container.appendChild(cvs);
  const ctx = cvs.getContext('2d'); let w=0,h=0; function resize(){ w = container.clientWidth; h = Math.max(260, Math.floor(container.clientHeight*0.7)); cvs.width = w; cvs.height = h; } resize(); window.addEventListener('resize', resize);
  const player = {x:60,y:0,w:28,h:36,vy:0,ground:false}; let obstacles=[]; let raf=null; let tick=0;

  function reset(){ player.y = h-80; player.vy = 0; player.ground = true; obstacles=[]; tick=0; scoreCb(0); }

  function spawnObs(){ const size = 24 + Math.random()*36; obstacles.push({x:w+50,y:h-60-size/2,w:size,h:size}); }

  function update(){ tick++; if(tick%90===0) spawnObs(); // spawn rate
    // gravity
    player.vy += 0.9; player.y += player.vy; if(player.y >= h-80){ player.y = h-80; player.vy = 0; player.ground = true; }
    // obstacles
    for(let o of obstacles){ o.x -= 4 + Math.min(6, Math.floor(tick/600)); }
    obstacles = obstacles.filter(o=>o.x+o.w> -50);
    // collision
    for(let o of obstacles){ if(rectsOverlap(player, o)){ stop(); return; } }
    // score by time
    if(tick%20===0) scoreCb((+document.getElementById('score').textContent||0)+1);
  }

  function draw(){ ctx.clearRect(0,0,w,h); // ground
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(0,h-48,w,48);
    // player
    ctx.fillStyle='white'; ctx.fillRect(player.x, player.y-player.h/2, player.w, player.h);
    // obstacles
    ctx.fillStyle='rgba(161,76,255,0.9)'; obstacles.forEach(o=> ctx.fillRect(o.x, o.y, o.w, o.h));
  }

  function loop(){ update(); draw(); raf = requestAnimationFrame(loop); }

  function jump(){ if(player.ground){ player.vy = -14; player.ground=false; } }

  function stop(){ cancelAnimationFrame(raf); raf=null; container.removeEventListener('click', jump); document.removeEventListener('keydown', keyHandler); }

  function keyHandler(e){ if(e.code==='Space') { e.preventDefault(); jump(); } }

  function rectsOverlap(a,b){ return !(a.x+a.w < b.x || a.x > b.x+b.w || a.y - a.h/2 > b.y + b.h || a.y + a.h/2 < b.y); }

  return { start(){ reset(); loop(); container.addEventListener('click', jump); document.addEventListener('keydown', keyHandler); }, stop(){ stop(); } };
}

/* --- Memory: flip cards matching pairs --- */
function memoryGame(container, scoreCb){
  const cols = 4, rows = 3; const total = cols*rows; const colors = ['#ff4d6d','#ffb86b','#ffd86b','#7afcff','#a14cff','#8ae67a'];
  let board=[]; let first=null, lock=false;

  function build(){ const pairs = colors.slice(0,total/2); const items = pairs.concat(pairs); shuffle(items); board = items; render(); }

  function render(){ container.innerHTML=''; const grid = document.createElement('div'); grid.style.display='grid'; grid.style.gridTemplateColumns=`repeat(${cols},1fr)`; grid.style.gap='10px';
    board.forEach((c,i)=>{ const card = document.createElement('button'); card.className='game-card'; card.style.height='80px'; card.dataset.i=i; card.style.background='linear-gradient(135deg, rgba(255,255,255,0.02), rgba(0,0,0,0.2))'; card.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:transparent">?</div>'; card.addEventListener('click',()=>flip(i,card)); grid.appendChild(card); }); container.appendChild(grid); }

  function reveal(cardEl, color){ cardEl.style.background = color; cardEl.firstChild.style.color='#06060a'; }

  function hide(cardEl){ cardEl.style.background='linear-gradient(135deg, rgba(255,255,255,0.02), rgba(0,0,0,0.2))'; cardEl.firstChild.style.color='transparent'; }

  function flip(i,el){ if(lock) return; if(el.classList.contains('matched')) return; if(!first){ first = {i,el}; reveal(el, board[i]); } else if(first.i===i) return; else { reveal(el, board[i]); if(board[first.i] === board[i]){ // match
        first.el.classList.add('matched'); el.classList.add('matched'); scoreCb((+document.getElementById('score').textContent||0)+10);
        first=null; } else { lock=true; setTimeout(()=>{ hide(first.el); hide(el); first=null; lock=false; },800); } }
  }

  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }

  return { start(){ build(); }, stop(){ } };
}

/* --- Connect: simple match-and-remove (simplified 连连看) --- */
function connectGame(container, scoreCb){
  const cols = 6, rows = 3; const total = cols*rows; const colors = ['#ff4d6d','#ffb86b','#ffd86b','#7afcff','#a14cff','#8ae67a'];
  let board = [];

  function build(){ const pairs = []; for(let i=0;i<total/2;i++){ pairs.push(colors[i%colors.length]); pairs.push(colors[i%colors.length]); } shuffle(pairs); board = pairs; render(); }

  function render(){ container.innerHTML=''; const grid = document.createElement('div'); grid.style.display='grid'; grid.style.gridTemplateColumns=`repeat(${cols},48px)`; grid.style.gap='8px';
    board.forEach((c,i)=>{ const t = document.createElement('div'); t.style.width='48px'; t.style.height='48px'; t.style.background = c; t.style.borderRadius='6px'; t.dataset.i=i; t.addEventListener('click', ()=>select(i,t)); grid.appendChild(t); }); container.appendChild(grid); }

  let sel = null;
  function select(i,el){ if(sel==null){ sel = {i,el}; el.style.outline='2px solid #fff'; } else { if(sel.i===i){ sel.el.style.outline=''; sel=null; return; } if(board[i] && board[sel.i] && board[i]===board[sel.i]){ // remove both
        board[i]=null; board[sel.i]=null; sel.el.remove(); el.remove(); scoreCb((+document.getElementById('score').textContent||0)+20); sel=null; } else { sel.el.style.outline=''; sel=null; } } }

  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }

  return { start(){ build(); }, stop(){} };
}

/* --- Match3: basic swap and clear --- */
function match3Game(container, scoreCb){
  const cols = 6, rows = 6; const colors = ['#ff4d6d','#ffb86b','#ffd86b','#7afcff','#a14cff','#8ae67a'];
  let grid = [];
  function rand(){ return colors[Math.floor(Math.random()*colors.length)]; }
  function build(){ grid = Array.from({length:rows}, ()=> Array.from({length:cols}, rand)); render(); }

  function render(){ container.innerHTML=''; const g = document.createElement('div'); g.style.display='grid'; g.style.gridTemplateColumns=`repeat(${cols},48px)`; g.style.gap='6px';
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){ const el = document.createElement('div'); el.style.width='48px'; el.style.height='48px'; el.style.background=grid[r][c]; el.dataset.r=r; el.dataset.c=c; el.style.borderRadius='6px'; el.addEventListener('click', ()=>onCellClick(r,c,el)); g.appendChild(el); }
    container.appendChild(g); }

  let first=null; function onCellClick(r,c,el){ if(first==null){ first = {r,c,el}; el.style.transform='scale(1.05)'; } else { // swap?
      const dr = Math.abs(first.r - r), dc = Math.abs(first.c - c); if((dr===1 && dc===0) || (dr===0 && dc===1)){ swap(first.r, first.c, r, c); if(!resolveMatches()){ // revert
            swap(first.r, first.c, r, c); } else { // do gravity and refill until stable
            processGravity();
          }
        }
      first.el.style.transform=''; first=null; render(); }
  }

  function swap(r1,c1,r2,c2){ const tmp=grid[r1][c1]; grid[r1][c1]=grid[r2][c2]; grid[r2][c2]=tmp; }

  function resolveMatches(){ const rem = []; for(let r=0;r<rows;r++){ let streak=1; for(let c=1;c<cols;c++){ if(grid[r][c]===grid[r][c-1]) streak++; else { if(streak>=3) for(let k=0;k<streak;k++) rem.push([r,c-1-k]); streak=1; } } if(streak>=3) for(let k=0;k<streak;k++) rem.push([r,cols-1-k]); }
    for(let c=0;c<cols;c++){ let streak=1; for(let r=1;r<rows;r++){ if(grid[r][c]===grid[r-1][c]) streak++; else { if(streak>=3) for(let k=0;k<streak;k++) rem.push([r-1-k,c]); streak=1; } } if(streak>=3) for(let k=0;k<streak;k++) rem.push([rows-1-k,c]); }
    if(rem.length===0) return false; rem.forEach(([r,c])=>{ grid[r][c]=null; scoreCb((+document.getElementById('score').textContent||0)+5); }); return true;
  }

  function processGravity(){ for(let c=0;c<cols;c++){ let write = rows-1; for(let r=rows-1;r>=0;r--){ if(grid[r][c]!==null){ grid[write][c]=grid[r][c]; write--; } } for(let r=write;r>=0;r--) grid[r][c]=rand(); }
    // after refill, check matches again recursively
    if(resolveMatches()){ processGravity(); }
  }

  return { start(){ build(); }, stop(){} };
}

/* --- Merge: 2048-like --- */
function mergeGame(container, scoreCb){
  const size = 4; let board = []; function randTile(){ return Math.random()<0.9?2:4; }
  function build(){ board = Array.from({length:size}, ()=> Array.from({length:size}, ()=> null)); spawn(); spawn(); render(); }

  function spawn(){ const empties=[]; for(let r=0;r<size;r++) for(let c=0;c<size;c++) if(!board[r][c]) empties.push([r,c]); if(empties.length===0) return; const [r,c] = empties[Math.floor(Math.random()*empties.length)]; board[r][c]=randTile(); }

  function render(){ container.innerHTML=''; const g=document.createElement('div'); g.style.display='grid'; g.style.gridTemplateColumns=`repeat(${size},72px)`; g.style.gap='8px';
    for(let r=0;r<size;r++) for(let c=0;c<size;c++){ const el=document.createElement('div'); el.style.width='72px'; el.style.height='72px'; el.style.borderRadius='8px'; el.style.display='flex'; el.style.alignItems='center'; el.style.justifyContent='center'; el.style.fontWeight='700'; el.style.background = board[r][c]? 'linear-gradient(90deg,#a14cff,#00ffd1)' : 'rgba(255,255,255,0.02)'; el.textContent = board[r][c] || ''; g.appendChild(el); } container.appendChild(g); }

  function move(dir){ // dir: 'left','right','up','down'
    let moved=false;
    function compress(row){ const arr=row.filter(x=>x); for(let i=0;i<arr.length-1;i++){ if(arr[i]===arr[i+1]){ arr[i]=arr[i]*2; scoreCb((+document.getElementById('score').textContent||0)+arr[i]); arr.splice(i+1,1); } } while(arr.length<row.length) arr.push(null); return arr; }
    if(dir==='left'){ for(let r=0;r<size;r++){ const newRow = compress(board[r].slice()); for(let c=0;c<size;c++){ if(board[r][c]!==newRow[c]) moved=true; board[r][c]=newRow[c]; } } }
    if(dir==='right'){ for(let r=0;r<size;r++){ const newRow = compress(board[r].slice().reverse()).reverse(); for(let c=0;c<size;c++){ if(board[r][c]!==newRow[c]) moved=true; board[r][c]=newRow[c]; } } }
    if(dir==='up'){ for(let c=0;c<size;c++){ const col=[]; for(let r=0;r<size;r++) col.push(board[r][c]); const nc = compress(col); for(let r=0;r<size;r++){ if(board[r][c]!==nc[r]) moved=true; board[r][c]=nc[r]; } } }
    if(dir==='down'){ for(let c=0;c<size;c++){ const col=[]; for(let r=0;r<size;r++) col.push(board[r][c]); const nc = compress(col.reverse()).reverse(); for(let r=0;r<size;r++){ if(board[r][c]!==nc[r]) moved=true; board[r][c]=nc[r]; } } }
    if(moved){ spawn(); render(); }
  }

  function keyHandler(e){ if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)){ e.preventDefault(); if(e.code==='ArrowLeft') move('left'); if(e.code==='ArrowRight') move('right'); if(e.code==='ArrowUp') move('up'); if(e.code==='ArrowDown') move('down'); } }

  return { start(){ build(); document.addEventListener('keydown', keyHandler); }, stop(){ document.removeEventListener('keydown', keyHandler); } };
}

