function escapeHtml(s){return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function byId(id){return document.getElementById(id);}
function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
function rand(min,max){return Math.random()*(max-min)+min;}
function randint(min,max){return Math.floor(rand(min,max+1));}
function choice(arr){return arr[Math.floor(Math.random()*arr.length)];}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}

const TIP_TEXT = {
  jump:[
    '按住空格、鼠标或手指蓄力，松开后起跳。',
    '距离越远需要蓄力越久，但太大也会直接跳过头。',
    '完美落在平台中间附近会得到额外分数。'
  ],
  connect:[
    '拖动圆点节点，目标是让所有线段都不再交叉。',
    '紫色线表示还在交叉，青色线表示已经安全。',
    '每过一关节点会变多一点。'
  ],
  memory:[
    '开始后先有 10 秒展示时间，20 张卡牌全部正面。',
    '展示结束后翻面，逐一找出相同的可爱图案。',
    '剩余时间越多，最终奖励越高。'
  ],
  runner:[
    '空格、点击或轻触都可以跳跃。',
    '撞到障碍就结束，吃到星星会额外加分。',
    '速度会逐渐提升，后面会更刺激。'
  ],
  match3:[
    '点击两个相邻方块即可交换。',
    '只有能形成三消的交换才会生效。',
    '连续掉落产生连锁时会快速涨分。'
  ],
  merge:[
    '点击两个相同且相邻的物件即可合成。',
    '每回合会随机长出新的低级物件。',
    '最高是 6 级，做出 6 级会有大奖励。'
  ]
};

const LEADERBOARD_LIMIT = 12;
function leaderboardKey(){ return 'leaderboard:' + location.pathname; }
function loadLeaderboard(){ return JSON.parse(localStorage.getItem(leaderboardKey()) || '[]'); }
function saveLeaderboard(list){ localStorage.setItem(leaderboardKey(), JSON.stringify(list.slice(0, LEADERBOARD_LIMIT))); }
function renderLeaderboard(el){
  if(!el) return;
  const list = loadLeaderboard();
  el.innerHTML = '<h3>本地排行榜</h3>' + (list.length
    ? '<ol>' + list.map(x => `<li>${escapeHtml(x.name)} — ${x.score}</li>`).join('') + '</ol>'
    : '<div class="muted">还没有记录，来当第一个霓虹高手吧。</div>');
}
function saveScore(score, el){
  const name = prompt('输入一个显示名称：') || '匿名';
  const list = loadLeaderboard();
  list.push({name, score: Math.round(score), ts: Date.now()});
  list.sort((a,b) => b.score - a.score || a.ts - b.ts);
  saveLeaderboard(list);
  renderLeaderboard(el);
}

function attachFormDemo(){
  document.querySelectorAll('.auth-forms form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      alert('已本地提交成功。这是纯前端演示页，还没有接入真实后端。');
    });
  });
}

function setTips(game){
  const tips = byId('tips');
  if(!tips) return;
  tips.innerHTML = (TIP_TEXT[game] || []).map(t => `<li>${escapeHtml(t)}</li>`).join('');
}

function updateStatus(text){ const el = byId('status'); if(el) el.textContent = text; }

function initGamePage(){
  const area = byId('game-area');
  if(!area) return;
  const game = area.dataset.game;
  const scoreEl = byId('score');
  const startBtn = byId('start-btn');
  const saveBtn = byId('save-btn');
  const leaderboardEl = byId('leaderboard');
  let score = 0;
  let controller = null;
  let running = false;

  function setScore(v){ score = Math.max(0, Math.round(v)); if(scoreEl) scoreEl.textContent = score; }

  function cleanup(){ if(controller && controller.destroy) controller.destroy(); controller = null; }

  function start(){
    cleanup();
    setScore(0);
    area.innerHTML = '';
    controller = createGame(game, area, setScore, updateStatus);
    if(controller && controller.start) controller.start();
    running = true;
    startBtn.textContent = '重新开始';
  }

  startBtn?.addEventListener('click', start);
  saveBtn?.addEventListener('click', () => saveScore(score, leaderboardEl));
  renderLeaderboard(leaderboardEl);
  setTips(game);
  updateStatus('待机');
}

function createGame(type, area, setScore, setStatus){
  const map = { jump: jumpGame, connect: connectGame, memory: memoryGame, runner: runnerGame, match3: match3Game, merge: mergeGame };
  return (map[type] || emptyGame)(area, setScore, setStatus);
}
function emptyGame(area){ area.textContent = 'No game'; return {start(){},destroy(){}}; }

function createCanvasArea(container){
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0;
  function resize(){
    width = container.clientWidth;
    height = container.clientHeight;
    const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(ratio,0,0,ratio,0,0);
  }
  resize();
  window.addEventListener('resize', resize);
  return {canvas, ctx, get width(){return width;}, get height(){return height;}, destroy(){window.removeEventListener('resize', resize);}};
}

function drawNeonBg(ctx,w,h){
  const g = ctx.createLinearGradient(0,0,0,h);
  g.addColorStop(0,'#0b1430');
  g.addColorStop(.55,'#170c32');
  g.addColorStop(1,'#120924');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,w,h);
  ctx.save();
  ctx.globalAlpha = .2;
  for(let i=0;i<8;i++){
    const x = (i+1)*w/9;
    const rg = ctx.createRadialGradient(x,h*.15,0,x,h*.15,140);
    rg.addColorStop(0, i%2 ? 'rgba(57,247,255,.5)' : 'rgba(255,89,199,.45)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(x,h*.15,140,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(57,247,255,.08)';
  for(let y=h*.66; y<h; y+=26){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
  for(let x=0; x<w; x+=36){ ctx.beginPath(); ctx.moveTo(x,h*.66); ctx.lineTo(x,h); ctx.stroke(); }
}

function drawMascot(ctx,x,y,r,face='cat'){
  ctx.save();
  ctx.translate(x,y);
  ctx.fillStyle = '#fff7ff';
  ctx.strokeStyle = 'rgba(0,0,0,.12)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill(); ctx.stroke();
  if(face==='cat'){
    ctx.beginPath(); ctx.moveTo(-r*.55,-r*.4); ctx.lineTo(-r*.15,-r*1.05); ctx.lineTo(-r*.02,-r*.3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r*.55,-r*.4); ctx.lineTo(r*.15,-r*1.05); ctx.lineTo(r*.02,-r*.3); ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle='#1f1b2d';
  ctx.beginPath(); ctx.arc(-r*.28,-r*.05,r*.1,0,Math.PI*2); ctx.arc(r*.28,-r*.05,r*.1,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#ff7bbf'; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.arc(0,r*.1,r*.18,0,Math.PI); ctx.stroke();
  ctx.restore();
}

function drawPlatform(ctx,p){
  const g = ctx.createLinearGradient(p.x,p.y,p.x,p.y+p.h);
  g.addColorStop(0,'#3ef6ff'); g.addColorStop(1,'#904fff');
  ctx.fillStyle = g;
  roundRect(ctx,p.x,p.y,p.w,p.h,12,true,false);
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  roundRect(ctx,p.x+10,p.y+6,p.w-20,6,6,true,false);
}
function roundRect(ctx,x,y,w,h,r,fill=true,stroke=false){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r);
  if(fill) ctx.fill(); if(stroke) ctx.stroke();
}

function jumpGame(container, setScore, setStatus){
  const stage = createCanvasArea(container);
  const {canvas, ctx, destroy:destroyCanvas} = stage;
  let raf = 0;
  let player, current, target, charge=0, charging=false, transitioning=false, score=0, hint='按住蓄力';

  function makeTarget(){
    const distance = rand(130, 260);
    const width = rand(78, 124);
    const top = clamp(current.y - rand(-45, 45), 150, stage.height-110);
    return {x: current.x + distance, y: top, w: width, h: 18};
  }
  function reset(){
    current = {x: 120, y: stage.height - 110, w: 116, h: 18};
    target = makeTarget();
    player = {x: current.x + current.w/2, y: current.y - 18, vx:0, vy:0, r:18, state:'idle'};
    charge=0; charging=false; transitioning=false; score=0; hint='按住蓄力'; setScore(score); setStatus('等待起跳');
  }
  function beginCharge(){ if(player.state!=='idle' || transitioning) return; charging=true; setStatus('蓄力中'); }
  function release(){
    if(!charging || player.state!=='idle') return;
    charging=false;
    const power = 6 + charge * 17;
    player.state='jump';
    player.vx = power * 1.12;
    player.vy = -power * 0.88;
    setStatus('飞行中');
  }
  function pointerDown(e){ e.preventDefault(); beginCharge(); }
  function pointerUp(e){ e.preventDefault(); release(); }
  function keyDown(e){ if(e.code==='Space'){ e.preventDefault(); beginCharge(); } }
  function keyUp(e){ if(e.code==='Space'){ e.preventDefault(); release(); } }

  function onLandSuccess(perfect){
    player.state='idle'; player.vx=player.vy=0; player.x = target.x + target.w/2; player.y = target.y - player.r;
    const add = perfect ? 3 : 1;
    score += add; setScore(score);
    hint = perfect ? 'Perfect +3!' : '+1';
    setStatus(perfect ? '完美落点' : '成功落地');
    transitioning = true;
    setTimeout(()=>{
      const shift = target.x - current.x;
      current = {x:120, y:target.y, w:target.w, h:target.h};
      target = makeTarget();
      player.x = current.x + current.w/2;
      player.y = current.y - player.r;
      transitioning = false;
      hint = '继续';
    }, 260);
  }
  function onFail(){ player.state='fall'; setStatus('掉下去了'); hint='失误，点击重新开始'; }

  function update(){
    if(charging) charge = clamp(charge + 0.015, 0, 1);
    if(player.state==='jump' || player.state==='fall'){
      player.x += player.vx;
      player.y += player.vy;
      player.vy += 0.48;
      const plat = [current,target].find(p => player.x > p.x && player.x < p.x+p.w && player.y + player.r >= p.y && player.y + player.r <= p.y+12 && player.vy >= 0);
      if(plat){
        if(plat===target){
          const centerOffset = Math.abs(player.x - (target.x + target.w/2));
          onLandSuccess(centerOffset < 12);
        } else {
          player.state='idle'; player.vx=player.vy=0; player.y = current.y - player.r; charge = 0; setStatus('回到起点');
        }
      } else if(player.y > stage.height + 70){ onFail(); }
    }
  }

  function render(){
    const w=stage.width, h=stage.height;
    drawNeonBg(ctx,w,h);
    drawPlatform(ctx,current); drawPlatform(ctx,target);
    ctx.fillStyle='rgba(255,255,255,.9)';
    ctx.font='700 16px Inter';
    ctx.fillText('Charge', 20, 28);
    ctx.strokeStyle='rgba(57,247,255,.35)'; roundRect(ctx,92,14,180,18,10,false,true);
    const bar = ctx.createLinearGradient(92,0,272,0); bar.addColorStop(0,'#39f7ff'); bar.addColorStop(1,'#ff59c7');
    ctx.fillStyle=bar; roundRect(ctx,92,14,180*charge,18,10,true,false);
    ctx.fillStyle='rgba(255,255,255,.88)'; ctx.fillText(hint, 290, 28);

    drawMascot(ctx, player.x, player.y, player.r,'cat');
    ctx.fillStyle='rgba(57,247,255,.25)'; ctx.beginPath(); ctx.ellipse(player.x, player.y+player.r+7, player.r*.85, 6, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle='rgba(255,255,255,.75)';
    ctx.font='14px Inter';
    ctx.fillText('按住鼠标 / 触屏 / 空格蓄力', 20, h-28);
  }
  function loop(){ update(); render(); raf=requestAnimationFrame(loop); }

  return {
    start(){ reset(); loop(); canvas.addEventListener('pointerdown', pointerDown); window.addEventListener('pointerup', pointerUp); document.addEventListener('keydown', keyDown); document.addEventListener('keyup', keyUp); },
    destroy(){ cancelAnimationFrame(raf); canvas.removeEventListener('pointerdown', pointerDown); window.removeEventListener('pointerup', pointerUp); document.removeEventListener('keydown', keyDown); document.removeEventListener('keyup', keyUp); destroyCanvas(); }
  };
}

function segmentsIntersect(a,b,c,d){
  function ccw(p1,p2,p3){ return (p3.y-p1.y)*(p2.x-p1.x) > (p2.y-p1.y)*(p3.x-p1.x); }
  if(a===c||a===d||b===c||b===d) return false;
  return ccw(a,c,d) !== ccw(b,c,d) && ccw(a,b,c) !== ccw(a,b,d);
}

function connectGame(container, setScore, setStatus){
  const stage = createCanvasArea(container);
  const {canvas, ctx, destroy:destroyCanvas} = stage;
  let raf=0, level=1, score=0, nodes=[], edges=[], dragging=-1, offset={x:0,y:0};
  function build(lv){
    const count = Math.min(4 + lv, 8);
    nodes = Array.from({length:count}, (_,i)=>({
      x: rand(80, stage.width-80),
      y: rand(90, stage.height-70),
      r: 17,
      label: String.fromCharCode(65+i)
    }));
    const base = [];
    for(let i=0;i<count;i++) base.push([i,(i+2)%count]);
    if(count>5) base.push([0, count-2], [1, count-1]);
    edges = base;
    setStatus('拖动节点，解开交叉');
  }
  function countCrossings(){
    let hits=0;
    for(let i=0;i<edges.length;i++) for(let j=i+1;j<edges.length;j++){
      const [a,b]=edges[i], [c,d]=edges[j];
      if(segmentsIntersect(nodes[a],nodes[b],nodes[c],nodes[d])) hits++;
    }
    return hits;
  }
  function pointerPos(e){ const r = canvas.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top}; }
  function down(e){
    const p = pointerPos(e);
    dragging = nodes.findIndex(n => dist(n,p) <= n.r + 8);
    if(dragging>=0){ offset.x = nodes[dragging].x - p.x; offset.y = nodes[dragging].y - p.y; }
  }
  function move(e){
    if(dragging<0) return;
    const p = pointerPos(e);
    nodes[dragging].x = clamp(p.x + offset.x, 28, stage.width - 28);
    nodes[dragging].y = clamp(p.y + offset.y, 32, stage.height - 28);
    const left = countCrossings();
    if(left===0){
      score += 100 + level*20; setScore(score); setStatus(`第 ${level} 关完成`);
      level++;
      setTimeout(()=>build(level), 500);
    } else {
      setStatus(`还剩 ${left} 处交叉`);
    }
  }
  function up(){ dragging=-1; }
  function render(){
    const w=getW,h=getH;
    drawNeonBg(ctx,w,h);
    const crossings = [];
    for(let i=0;i<edges.length;i++) for(let j=i+1;j<edges.length;j++){
      const [a,b]=edges[i], [c,d]=edges[j];
      if(segmentsIntersect(nodes[a],nodes[b],nodes[c],nodes[d])) crossings.push(i,j);
    }
    edges.forEach(([a,b], idx)=>{
      ctx.lineWidth = 4;
      ctx.strokeStyle = crossings.includes(idx) ? 'rgba(255,89,199,.95)' : 'rgba(57,247,255,.95)';
      ctx.beginPath(); ctx.moveTo(nodes[a].x,nodes[a].y); ctx.lineTo(nodes[b].x,nodes[b].y); ctx.stroke();
    });
    nodes.forEach((n,i)=>{
      const rg = ctx.createRadialGradient(n.x,n.y,2,n.x,n.y,28);
      rg.addColorStop(0,'rgba(255,255,255,.95)');
      rg.addColorStop(.55,i%2?'rgba(255,89,199,.88)':'rgba(57,247,255,.88)');
      rg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(n.x,n.y,26,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = i===dragging ? '#ffe46a' : '#ffffff';
      ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#16162a'; ctx.font='700 14px Inter'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(n.label,n.x,n.y+1);
    });
    ctx.textAlign='left'; ctx.textBaseline='alphabetic'; ctx.fillStyle='rgba(255,255,255,.85)'; ctx.fillText('Level ' + level, 18, 28);
  }
  function loop(){ render(); raf=requestAnimationFrame(loop); }
  return {
    start(){ level=1; score=0; setScore(score); build(level); loop(); canvas.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); },
    destroy(){ cancelAnimationFrame(raf); canvas.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); destroyCanvas(); }
  };
}

function memoryGame(container, setScore, setStatus){
  const icons = ['🐱','🐰','🐻','🦊','🐼','🐸','🐤','🦄','🍓','🍰'];
  let deck=[], revealed=new Set(), matched=new Set(), busy=false, previewTimer=10, playTimer=70, score=0, interval=0;
  const info = document.createElement('div'); info.className='center-message';
  const banner = document.createElement('div'); banner.className='toast'; info.appendChild(banner); container.appendChild(info);
  const grid = document.createElement('div'); grid.className='card-grid'; container.appendChild(grid);

  function buildDeck(){
    const arr = icons.concat(icons).map((icon, id) => ({id, icon, key: icon + '-' + id}));
    deck = arr.sort(() => Math.random() - .5);
  }
  function cardState(i){ return matched.has(i) || revealed.has(i); }
  function render(){
    banner.textContent = previewTimer > 0 ? `记忆时间：${previewTimer}s` : `剩余时间：${playTimer}s`;
    grid.innerHTML = '';
    deck.forEach((card, i) => {
      const btn = document.createElement('button');
      btn.className = 'memory-card' + (cardState(i) ? ' revealed' : '') + (matched.has(i) ? ' matched' : '');
      btn.textContent = previewTimer > 0 || cardState(i) ? card.icon : '✦';
      btn.addEventListener('click', () => flip(i));
      grid.appendChild(btn);
    });
  }
  function maybeFinish(){
    if(matched.size === deck.length){
      clearInterval(interval);
      score += playTimer * 2;
      setScore(score);
      setStatus('全部配对完成');
      banner.textContent = '全部找到了，做得好';
    }
  }
  function flip(i){
    if(previewTimer > 0 || busy || matched.has(i) || revealed.has(i)) return;
    revealed.add(i); render();
    if(revealed.size % 2 === 0){
      busy = true;
      const last = [...revealed].slice(-2);
      const [a,b] = last;
      if(deck[a].icon === deck[b].icon){
        matched.add(a); matched.add(b); score += 20; setScore(score); busy = false; render(); maybeFinish();
      } else {
        setTimeout(() => { revealed.delete(a); revealed.delete(b); busy = false; render(); }, 700);
      }
    }
  }
  return {
    start(){
      buildDeck(); revealed = new Set(deck.map((_,i)=>i)); matched = new Set(); busy=false; previewTimer=10; playTimer=70; score=0; setScore(score); setStatus('记忆阶段'); render();
      clearInterval(interval);
      interval = setInterval(() => {
        if(previewTimer > 0){
          previewTimer--;
          if(previewTimer === 0){ revealed = new Set(); setStatus('开始翻牌'); }
        } else if(matched.size !== deck.length) {
          playTimer--; if(playTimer <= 0){ playTimer = 0; clearInterval(interval); setStatus('时间到了'); banner.textContent = '时间到了，点击重新开始'; }
        }
        render();
      }, 1000);
    },
    destroy(){ clearInterval(interval); }
  };
}

function runnerGame(container, setScore, setStatus){
  const stage = createCanvasArea(container);
  const {canvas, ctx, destroy:destroyCanvas} = stage;
  let raf=0, running=true;
  const player = {x:82, y:0, vy:0, w:34, h:42, ground:false};
  let obstacles=[], stars=[], tick=0, score=0, speed=6;
  function reset(){ obstacles=[]; stars=[]; tick=0; score=0; speed=6; player.y=stage.height-86; player.vy=0; player.ground=true; running=true; setScore(score); setStatus('冲刺中'); }
  function jump(){ if(player.ground && running){ player.vy = -13.5; player.ground=false; } }
  function keyDown(e){ if(e.code==='Space'){ e.preventDefault(); jump(); } }
  function pointerDown(e){ e.preventDefault(); jump(); }
  function spawn(){
    if(tick % 82 === 0) obstacles.push({x:stage.width+40, y:stage.height-78, w:rand(24,38), h:rand(34,56)});
    if(tick % 110 === 0) stars.push({x:stage.width+40, y:rand(stage.height-180, stage.height-110), r:10});
  }
  function update(){
    if(!running) return;
    tick++; speed = 6 + tick/320;
    spawn();
    player.vy += .72; player.y += player.vy; if(player.y >= stage.height-86){ player.y = stage.height-86; player.vy=0; player.ground=true; }
    obstacles.forEach(o => o.x -= speed);
    stars.forEach(s => s.x -= speed*.9);
    obstacles = obstacles.filter(o => o.x + o.w > -40);
    stars = stars.filter(s => s.x + s.r > -40);
    obstacles.forEach(o => {
      if(player.x < o.x + o.w && player.x + player.w > o.x && player.y < o.y + o.h && player.y + player.h > o.y){ running=false; setStatus('撞上障碍'); }
    });
    stars = stars.filter(s => {
      if(player.x < s.x + s.r && player.x + player.w > s.x - s.r && player.y < s.y + s.r && player.y + player.h > s.y - s.r){ score += 15; setScore(score); return false; }
      return true;
    });
    if(tick % 8 === 0){ score += 1; setScore(score); }
  }
  function drawStar(x,y,r){
    ctx.save(); ctx.translate(x,y); ctx.beginPath();
    for(let i=0;i<5;i++){ ctx.lineTo(Math.cos((18+i*72)/180*Math.PI)*r, -Math.sin((18+i*72)/180*Math.PI)*r); ctx.lineTo(Math.cos((54+i*72)/180*Math.PI)*r*.45, -Math.sin((54+i*72)/180*Math.PI)*r*.45); }
    ctx.closePath(); ctx.fillStyle='#ffe46a'; ctx.fill(); ctx.restore();
  }
  function render(){
    const w=stage.width,h=stage.height; drawNeonBg(ctx,w,h);
    ctx.fillStyle='rgba(10,255,220,.18)'; ctx.fillRect(0,h-42,w,42);
    ctx.strokeStyle='rgba(57,247,255,.25)'; ctx.beginPath(); ctx.moveTo(0,h-42); ctx.lineTo(w,h-42); ctx.stroke();
    stars.forEach(s => drawStar(s.x,s.y,s.r));
    obstacles.forEach(o => { ctx.fillStyle='rgba(255,89,199,.9)'; roundRect(ctx,o.x,o.y,o.w,o.h,8,true,false); });
    drawMascot(ctx, player.x + player.w/2, player.y + player.h/2 - 3, 16, 'cat');
    ctx.fillStyle='rgba(57,247,255,.2)'; ctx.fillRect(18,16,140,10);
    ctx.fillStyle='rgba(255,228,106,.85)'; ctx.fillRect(18,16,Math.min(140, speed*14),10);
    ctx.fillStyle='rgba(255,255,255,.86)'; ctx.font='14px Inter'; ctx.fillText('速度', 166, 25);
    if(!running){ ctx.fillStyle='rgba(0,0,0,.38)'; ctx.fillRect(0,0,w,h); ctx.fillStyle='#fff'; ctx.font='700 28px Inter'; ctx.fillText('游戏结束', w/2-55, h/2); }
  }
  function loop(){ update(); render(); raf=requestAnimationFrame(loop); }
  return {
    start(){ reset(); loop(); document.addEventListener('keydown', keyDown); canvas.addEventListener('pointerdown', pointerDown); },
    destroy(){ cancelAnimationFrame(raf); document.removeEventListener('keydown', keyDown); canvas.removeEventListener('pointerdown', pointerDown); destroyCanvas(); }
  };
}

function match3Game(container, setScore, setStatus){
  const types = ['🍓','🧁','🐥','🍋','🪻','🫐'];
  const cols=7, rows=7;
  let board=[], selected=null, score=0, lock=false;
  const grid = document.createElement('div'); grid.className='match-grid'; container.appendChild(grid);
  function randomType(){ return choice(types); }
  function createBoard(){
    board = Array.from({length:rows}, () => Array.from({length:cols}, () => randomType()));
    while(findMatches().length) collapseMatches(findMatches(), false);
    selected = null; score = 0; setScore(score); setStatus('选择相邻方块交换'); render();
  }
  function render(){
    grid.innerHTML='';
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      const btn=document.createElement('button');
      btn.className='match-tile' + (selected && selected.r===r && selected.c===c ? ' selected' : '');
      btn.textContent=board[r][c];
      btn.addEventListener('click',()=>onClick(r,c));
      grid.appendChild(btn);
    }
  }
  function swap(a,b){ const t=board[a.r][a.c]; board[a.r][a.c]=board[b.r][b.c]; board[b.r][b.c]=t; }
  function neighbours(a,b){ return Math.abs(a.r-b.r)+Math.abs(a.c-b.c)===1; }
  function findMatches(){
    const mark = new Set();
    for(let r=0;r<rows;r++){
      let streak=1;
      for(let c=1;c<=cols;c++){
        if(c<cols && board[r][c]===board[r][c-1]) streak++; else { if(streak>=3) for(let k=0;k<streak;k++) mark.add(`${r},${c-1-k}`); streak=1; }
      }
    }
    for(let c=0;c<cols;c++){
      let streak=1;
      for(let r=1;r<=rows;r++){
        if(r<rows && board[r][c]===board[r-1][c]) streak++; else { if(streak>=3) for(let k=0;k<streak;k++) mark.add(`${r-1-k},${c}`); streak=1; }
      }
    }
    return [...mark].map(x => x.split(',').map(Number));
  }
  function collapseMatches(matches, award=true){
    if(!matches.length) return false;
    matches.forEach(([r,c]) => board[r][c]=null);
    if(award){ score += matches.length * 10; setScore(score); }
    for(let c=0;c<cols;c++){
      let write=rows-1;
      for(let r=rows-1;r>=0;r--) if(board[r][c]!==null){ board[write][c]=board[r][c]; write--; }
      while(write>=0){ board[write][c]=randomType(); write--; }
    }
    return true;
  }
  function settle(){
    let chain=0, m;
    while((m=findMatches()).length){ chain++; collapseMatches(m, true); score += chain>1 ? chain*8 : 0; setScore(score); }
    setStatus(chain>1 ? `连锁 x${chain}` : '交换成功');
  }
  function onClick(r,c){
    if(lock) return;
    const cur={r,c};
    if(!selected){ selected=cur; render(); return; }
    if(selected.r===r && selected.c===c){ selected=null; render(); return; }
    if(!neighbours(selected, cur)){ selected=cur; render(); return; }
    swap(selected, cur);
    const m=findMatches();
    if(!m.length){ swap(selected,cur); setStatus('这一步不能形成三消'); }
    else { settle(); }
    selected=null; render();
  }
  return { start(){ createBoard(); }, destroy(){} };
}

function mergeGame(container, setScore, setStatus){
  const levels = [
    {icon:'🌱', name:'芽芽'},
    {icon:'🌷', name:'花花'},
    {icon:'🐣', name:'啾啾'},
    {icon:'🐱', name:'猫团'},
    {icon:'🦄', name:'霓虹兽'},
    {icon:'👑', name:'星冠王'}
  ];
  const size=5;
  let board=[], selected=null, score=0;
  const grid=document.createElement('div'); grid.className='merge-grid'; container.appendChild(grid);
  function emptyBoard(){ board = Array.from({length:size},()=>Array(size).fill(0)); }
  function randomSpawnLevel(){ return Math.random()<0.8 ? 1 : 2; }
  function empties(){ const out=[]; for(let r=0;r<size;r++) for(let c=0;c<size;c++) if(board[r][c]===0) out.push({r,c}); return out; }
  function spawn(n=1){ for(let i=0;i<n;i++){ const e=choice(empties()); if(!e) break; board[e.r][e.c]=randomSpawnLevel(); } }
  function render(){
    grid.innerHTML='';
    for(let r=0;r<size;r++) for(let c=0;c<size;c++){
      const lv=board[r][c];
      const btn=document.createElement('button');
      btn.className='merge-tile' + (!lv ? ' empty-cell' : '') + (selected && selected.r===r && selected.c===c ? ' selected' : '');
      btn.innerHTML = lv ? `<div>${levels[lv-1].icon}</div><div class="merge-label">Lv.${lv} ${levels[lv-1].name}</div>` : '<div class="merge-label">空</div>';
      btn.addEventListener('click',()=>pick(r,c));
      grid.appendChild(btn);
    }
  }
  function adjacent(a,b){ return Math.abs(a.r-b.r)+Math.abs(a.c-b.c)===1; }
  function pick(r,c){
    if(board[r][c]===0){ selected=null; render(); return; }
    const cur={r,c};
    if(!selected){ selected=cur; render(); return; }
    if(selected.r===r && selected.c===c){ selected=null; render(); return; }
    if(!adjacent(selected,cur)){ selected=cur; render(); return; }
    const a=board[selected.r][selected.c], b=board[r][c];
    if(a!==b){ setStatus('只有相同等级才能合成'); selected=cur; render(); return; }
    if(a>=6){ setStatus('已经是最高级'); selected=null; render(); return; }
    board[r][c]=a+1; board[selected.r][selected.c]=0; score += a*25; if(a+1===6) score += 180; setScore(score);
    spawn(1); setStatus(`合成成功：${levels[a].name}`); selected=null; render();
    if(!empties().length){ setStatus('棋盘已满，尽量继续合成'); }
  }
  return {
    start(){ emptyBoard(); spawn(8); score=0; setScore(score); setStatus('点击相邻相同物件进行合成'); render(); },
    destroy(){}
  };
}

document.addEventListener('DOMContentLoaded', () => {
  attachFormDemo();
  initGamePage();
});
