// Main interactive script: simple playable placeholders + per-page leaderboards (localStorage)
document.addEventListener('DOMContentLoaded',()=>{
  // auth forms - prevent actual submit
  const forms = document.querySelectorAll('.auth-forms form');
  forms.forEach(f=>{
    f.addEventListener('submit',e=>{
      e.preventDefault();
      alert('表单已本地提交（示例）。实现后端以完成注册/登录流程。');
    });
  });

  // game initializer
  const gameArea = document.getElementById('game-area');
  if(!gameArea) return; // not on a game page

  const gameType = gameArea.dataset.game || 'generic';
  const startBtn = document.getElementById('start-btn');
  const scoreEl = document.getElementById('score');
  const leaderboardEl = document.getElementById('leaderboard');

  let running=false, score=0, timer=null;

  function renderLeaderboard(){
    const key = 'leaderboard:' + location.pathname;
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    leaderboardEl.innerHTML = '<h3>排行榜</h3>' + (list.length? ('<ol>'+list.map(i=>`<li>${escapeHtml(i.name)} — ${i.score}</li>`).join('')+'</ol>') : '<div class="muted">暂无记录，成为第一个高分玩家吧！</div>');
  }

  function saveScore(score){
    const key = 'leaderboard:' + location.pathname;
    const name = prompt('输入显示名称以记录分数（留空为 匿名）') || '匿名';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push({name,score:Math.round(score),ts:Date.now()});
    list.sort((a,b)=>b.score - a.score);
    localStorage.setItem(key, JSON.stringify(list.slice(0,20)));
    renderLeaderboard();
  }

  function escapeHtml(s){return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}

  function startGame(){
    if(running) return;
    running=true; score=0; scoreEl.textContent = score;
    gameArea.innerHTML = '';
    setupGameForType(gameType, gameArea);
    // generic score increment over time for demo
    timer = setInterval(()=>{
      score += Math.floor(Math.random()*3)+1;
      scoreEl.textContent = score;
    }, 800);
    startBtn.textContent = '结束';
    startBtn.classList.add('pulse');
  }

  function stopGame(){
    if(!running) return;
    running=false;
    clearInterval(timer); timer=null;
    startBtn.textContent = '开始';
    startBtn.classList.remove('pulse');
    saveScore(score);
  }

  startBtn.addEventListener('click', ()=>{ if(running) stopGame(); else startGame(); });
  document.addEventListener('keydown', (e)=>{ if(e.code==='Space') { e.preventDefault(); if(running) stopGame(); else startGame(); } });

  renderLeaderboard();
});

function setupGameForType(type, container){
  // Lightweight demo visuals and small interactions per page
  if(type==='jump'){
    const hero = document.createElement('div');
    hero.className='neon-text floating';
    hero.textContent='点击或按空格跳跃！';
    container.appendChild(hero);
    container.addEventListener('click', ()=>{ pulseOnce(hero); });
  } else if(type==='connect'){
    const grid = document.createElement('div'); grid.style.display='grid'; grid.style.gridTemplateColumns='repeat(6,48px)'; grid.style.gap='8px';
    for(let i=0;i<18;i++){ const t = document.createElement('div'); t.style.width='48px'; t.style.height='48px'; t.style.background='linear-gradient(135deg,var(--neon),rgba(255,255,255,0.02))'; t.style.borderRadius='6px'; t.className='floating'; grid.appendChild(t); }
    container.appendChild(grid);
  } else if(type==='memory'){
    const t = document.createElement('div'); t.className='neon-text'; t.textContent='记忆配对占位 — 点击卡片以翻转（示例）'; container.appendChild(t);
  } else if(type==='runner'){
    const t = document.createElement('div'); t.className='neon-text'; t.textContent='跑酷：按空格跳跃，避开障碍（示例）'; container.appendChild(t);
  } else if(type==='match3'){
    const t = document.createElement('div'); t.className='neon-text'; t.textContent='消消乐：匹配三个相同方块（示例）'; container.appendChild(t);
  } else if(type==='merge'){
    const t = document.createElement('div'); t.className='neon-text'; t.textContent='合成游戏：合并相同物品以升级（示例）'; container.appendChild(t);
  } else {
    const t = document.createElement('div'); t.className='neon-text'; t.textContent='小游戏占位'; container.appendChild(t);
  }
}

function pulseOnce(el){ el.classList.add('pulse'); setTimeout(()=>el.classList.remove('pulse'),1200); }

