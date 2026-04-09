const { useState, useEffect, useRef } = React;

function App(){
  const [route, setRoute] = useState(() => location.hash.replace('#','') || 'home');
  useEffect(()=>{
    const onHash = ()=> setRoute(location.hash.replace('#','') || 'home');
    window.addEventListener('hashchange', onHash);
    return ()=> window.removeEventListener('hashchange', onHash);
  },[]);

  return (
    <div>
      <header className="site-header"><h1>Webgame</h1>
        <nav>
          <a href="/site/app.html#home">首页</a>
          <a href="/site/app.html#jump">跳一跳</a>
          <a href="/site/app.html#connect">连连看</a>
          <a href="/site/app.html#memory">记忆力</a>
          <a href="/site/app.html#runner">跑酷</a>
          <a href="/site/app.html#match3">消消乐</a>
          <a href="/site/app.html#merge">合成</a>
          <a className="auth" href="/site/login.html">登录</a>
          <a className="auth" href="/site/signup.html">注册</a>
        </nav>
      </header>
      <main className="container">
        {route==='home' && <Home />}
        {route==='jump' && <Jump />}
        {route==='connect' && <Connect />}
        {route==='memory' && <Memory />}
        {route==='runner' && <Runner />}
        {route==='match3' && <Match3 />}
        {route==='merge' && <Merge />}
      </main>
    </div>
  );
}

function Home(){
  return (
    <div>
      <h2>六款小游戏</h2>
      <p>选择一个游戏开始。React 驱动的轻量原型让体验更顺滑。</p>
      <section className="games-grid">
        <a className="game-card" href="#jump">跳一跳</a>
        <a className="game-card" href="#connect">连连看</a>
        <a className="game-card" href="#memory">记忆力游戏</a>
        <a className="game-card" href="#runner">跑酷</a>
        <a className="game-card" href="#match3">消消乐</a>
        <a className="game-card" href="#merge">合成游戏</a>
      </section>
    </div>
  );
}

/* Leaderboard component using localStorage keyed by pathname+hash */
function Leaderboard({id}){
  const [list, setList] = useState([]);
  useEffect(()=>{ const key = 'leaderboard:'+id; setList(JSON.parse(localStorage.getItem(key) || '[]')); },[id]);
  function refresh(){ const key='leaderboard:'+id; setList(JSON.parse(localStorage.getItem(key) || '[]')); }
  return (
    <section className="leaderboard">
      <h3>排行榜</h3>
      {list.length? <ol>{list.map((p,i)=>(<li key={i}>{p.name} — {p.score}</li>))}</ol> : <div className="muted">暂无记录</div>}
      <button onClick={refresh} style={{marginTop:8}}>刷新</button>
    </section>
  );
}

/* Helper to prompt and save score */
function saveScore(id,score){ const key='leaderboard:'+id; const name=prompt('输入显示名称以记录分数（留空为 匿名）')||'匿名'; const list=JSON.parse(localStorage.getItem(key)||'[]'); list.push({name,score,ts:Date.now()}); list.sort((a,b)=>b.score-a.score); localStorage.setItem(key,JSON.stringify(list.slice(0,20))); }

/* --- Jump component (canvas) --- */
function Jump(){
  const ref = useRef(); const [running,setRunning]=useState(false); const [score,setScore]=useState(0);
  useEffect(()=>{
    const canvas = ref.current; const ctx = canvas.getContext('2d'); let w=0,h=0; let raf; let player={x:80,y:0,r:12,vy:0,ground:false}; let platforms=[];
    function resize(){ w=canvas.clientWidth; h=Math.max(260,Math.floor(canvas.clientHeight*0.7)); canvas.width=w; canvas.height=h; }
    function spawnPlatform(){ const last = platforms[platforms.length-1]; const nx = last.x + 140 + Math.random()*120; const ny = h-60 - (Math.random()*120); platforms.push({x:nx,y:Math.min(h-40, Math.max(80, ny)),w:100+Math.random()*80}); }
    function reset(){ platforms=[{x:40,y:h-60,w:120},{x:220,y:h-120,w:120}]; player.x=80; player.y=platforms[0].y-player.r; player.vy=0; player.ground=true; setScore(0); }
    function draw(){ ctx.clearRect(0,0,w,h); platforms.forEach(p=>{ ctx.fillStyle='rgba(180,120,255,0.14)'; ctx.fillRect(p.x,p.y,p.w,12); ctx.strokeStyle='rgba(161,76,255,0.28)'; ctx.strokeRect(p.x,p.y,p.w,12); }); ctx.beginPath(); ctx.fillStyle='white'; ctx.arc(player.x,player.y,player.r,0,Math.PI*2); ctx.fill(); ctx.closePath(); }
    function update(){ player.vy+=0.6; player.y+=player.vy; for(let p of platforms){ if(player.vy>0 && player.y+player.r>p.y && player.y+player.r<p.y+12 && player.x>p.x-4 && player.x<p.x+p.w+4){ player.y=p.y-player.r; player.vy=0; player.ground=true; if(p===platforms[platforms.length-1]){ setScore(s=>s+1); spawnPlatform(); } } } for(let p of platforms) p.x-=1.6; player.x-=1.6; if(platforms.length && platforms[0].x+platforms[0].w<-50) platforms.shift(); if(player.x<80) player.x=80; }
    function loop(){ update(); draw(); raf=requestAnimationFrame(loop); }
    function onClick(){ if(player.ground){ player.vy=-12; player.ground=false; } }
    function start(){ resize(); reset(); loop(); canvas.addEventListener('click', onClick); window.addEventListener('resize', resize); }
    function stop(){ cancelAnimationFrame(raf); canvas.removeEventListener('click', onClick); window.removeEventListener('resize', resize); }
    if(running) start(); else stop(); return ()=> stop();
  },[running]);

  return (
    <div>
      <h2>跳一跳</h2>
      <div style={{minHeight:260}}>
        <canvas ref={ref} className="game-area" />
      </div>
      <div className="game-controls">
        <button onClick={()=>setRunning(r=>!r)} className={running? 'pulse':''}>{running? '结束':'开始'}</button>
        <div className="score">分数: {score}</div>
      </div>
      <button onClick={()=>{ saveScore(location.pathname+'#jump',score); }}>保存分数</button>
      <Leaderboard id={location.pathname+'#jump'} />
    </div>
  );
}

/* --- Connect component (grid match) --- */
function Connect(){ const [board,setBoard]=useState([]); const [score,setScore]=useState(0); useEffect(()=>{ const cols=6,rows=3; let pairs=[]; const colors=['#ff4d6d','#ffb86b','#ffd86b','#7afcff','#a14cff','#8ae67a']; for(let i=0;i<cols*rows/2;i++){ pairs.push(colors[i%colors.length]); pairs.push(colors[i%colors.length]); } shuffle(pairs); setBoard(pairs); },[]);
  const selectRef = useRef(null);
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }
  function onClick(i){ if(selectRef.current==null){ selectRef.current=i; } else { if(selectRef.current===i){ selectRef.current=null; return; } if(board[i] && board[selectRef.current] && board[i]===board[selectRef.current]){ const nb=[...board]; nb[i]=null; nb[selectRef.current]=null; setBoard(nb); setScore(s=>s+20); } selectRef.current=null; } }
  return (<div>
    <h2>连连看</h2>
    <div style={{display:'grid',gridTemplateColumns:'repeat(6,48px)',gap:8}}>
      {board.map((c,i)=> c? (<div key={i} onClick={()=>onClick(i)} style={{width:48,height:48,background:c,borderRadius:6}} />) : <div key={i} style={{width:48,height:48,background:'transparent'}} />)}
    </div>
    <div className="game-controls"><div className="score">分数: {score}</div></div>
    <button onClick={()=>saveScore(location.pathname+'#connect',score)}>保存分数</button>
    <Leaderboard id={location.pathname+'#connect'} />
  </div>);
}

/* --- Memory component --- */
function Memory(){ const cols=4,rows=3; const total=cols*rows; const colors=['#ff4d6d','#ffb86b','#ffd86b','#7afcff','#a14cff','#8ae67a']; const [deck,setDeck]=useState([]); const [revealed,setRevealed]=useState({}); const [matched,setMatched]=useState({}); const [score,setScore]=useState(0);
  useEffect(()=>{ const pairs=colors.slice(0,total/2); const items = shuffleArr(pairs.concat(pairs)); setDeck(items); },[]);
  function shuffleArr(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  function flip(i){ if(matched[i] || revealed[i]) return; const newRev={...revealed,[i]:true}; setRevealed(newRev); const ids=Object.keys(newRev).filter(k=>newRev[k]); if(ids.length===2){ const a=ids[0], b=ids[1]; if(deck[a]===deck[b]){ setMatched(m=>({...m,[a]:true,[b]:true})); setScore(s=>s+10); setRevealed({}); } else { setTimeout(()=> setRevealed({}),800); } }
  }
  return (<div>
    <h2>记忆力游戏</h2>
    <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:10}}>
      {deck.map((c,i)=> (
        <button key={i} onClick={()=>flip(i)} className="game-card" style={{height:80,background: matched[i]||revealed[i] ? c : 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(0,0,0,0.2))'}}>{matched[i] || revealed[i] ? '' : ''}</button>
      ))}
    </div>
    <div className="game-controls"><div className="score">分数: {score}</div></div>
    <button onClick={()=>saveScore(location.pathname+'#memory',score)}>保存分数</button>
    <Leaderboard id={location.pathname+'#memory'} />
  </div>);
}

/* --- Runner component --- */
function Runner(){ const ref=useRef(); const [running,setRunning]=useState(false); const [score,setScore]=useState(0);
  useEffect(()=>{ const canvas=ref.current; const ctx=canvas.getContext('2d'); let w=0,h=0; let raf; let player={x:60,y:0,w:28,h:36,vy:0,ground:true}; let obs=[]; let tick=0; function resize(){ w=canvas.clientWidth; h=Math.max(260,Math.floor(canvas.clientHeight*0.7)); canvas.width=w; canvas.height=h; }
    function reset(){ player.y=h-80; player.vy=0; player.ground=true; obs=[]; tick=0; setScore(0); }
    function spawn(){ const size=24+Math.random()*36; obs.push({x:w+50,y:h-60-size/2,w:size,h:size}); }
    function update(){ tick++; if(tick%90===0) spawn(); player.vy+=0.9; player.y+=player.vy; if(player.y>=h-80){ player.y=h-80; player.vy=0; player.ground=true; } obs.forEach(o=>o.x-=4+Math.min(6,Math.floor(tick/600))); obs=obs.filter(o=>o.x+o.w>-50); for(let o of obs){ if(rectOverlap(player,o)){ stop(); return; } } if(tick%20===0) setScore(s=>s+1); }
    function draw(){ ctx.clearRect(0,0,w,h); ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(0,h-48,w,48); ctx.fillStyle='white'; ctx.fillRect(player.x, player.y-player.h/2, player.w, player.h); ctx.fillStyle='rgba(161,76,255,0.9)'; obs.forEach(o=>ctx.fillRect(o.x,o.y,o.w,o.h)); }
    function loop(){ update(); draw(); raf=requestAnimationFrame(loop); }
    function jump(){ if(player.ground){ player.vy=-14; player.ground=false; } }
    function keyHandler(e){ if(e.code==='Space'){ e.preventDefault(); jump(); } }
    function rectOverlap(a,b){ return !(a.x+a.w < b.x || a.x > b.x+b.w || a.y - a.h/2 > b.y + b.h || a.y + a.h/2 < b.y); }
    function start(){ resize(); reset(); loop(); canvas.addEventListener('click', jump); document.addEventListener('keydown', keyHandler); window.addEventListener('resize', resize); }
    function stop(){ cancelAnimationFrame(raf); canvas.removeEventListener('click', jump); document.removeEventListener('keydown', keyHandler); window.removeEventListener('resize', resize); }
    if(running) start(); else stop(); return ()=> stop();
  },[running]);
  return (<div>
    <h2>跑酷</h2>
    <div style={{minHeight:260}}><canvas ref={ref} className="game-area"/></div>
    <div className="game-controls"><button onClick={()=>setRunning(r=>!r)} className={running?'pulse':''}>{running?'结束':'开始'}</button><div className="score">分数: {score}</div></div>
    <button onClick={()=>saveScore(location.pathname+'#runner',score)}>保存分数</button>
    <Leaderboard id={location.pathname+'#runner'} />
  </div>);
}

/* --- Match3 component --- */
function Match3(){ const rows=6,cols=6; const colors=['#ff4d6d','#ffb86b','#ffd86b','#7afcff','#a14cff','#8ae67a']; const [grid,setGrid]=useState([]); const [score,setScore]=useState(0); useEffect(()=>{ const g=[]; for(let r=0;r<rows;r++){ g[r]=[]; for(let c=0;c<cols;c++) g[r][c]=colors[Math.floor(Math.random()*colors.length)]; } setGrid(g); },[]);
  const firstRef=useRef(null);
  function swap(r1,c1,r2,c2){ const ng=grid.map(r=>r.slice()); const tmp=ng[r1][c1]; ng[r1][c1]=ng[r2][c2]; ng[r2][c2]=tmp; setGrid(ng); return ng; }
  function clickCell(r,c){ if(!firstRef.current) { firstRef.current={r,c}; } else { const f=firstRef.current; const dr=Math.abs(f.r-r), dc=Math.abs(f.c-c); if((dr===1&&dc===0)||(dr===0&&dc===1)){ const after=swap(f.r,f.c,r,c); if(!resolveMatches(after)){ swap(f.r,f.c,r,c); } else { processGravity(); } } firstRef.current=null; } }
  function resolveMatches(g){ const rem=[]; for(let r=0;r<rows;r++){ let streak=1; for(let c=1;c<cols;c++){ if(g[r][c]===g[r][c-1]) streak++; else { if(streak>=3) for(let k=0;k<streak;k++) rem.push([r,c-1-k]); streak=1; } } if(streak>=3) for(let k=0;k<streak;k++) rem.push([r,cols-1-k]); }
    for(let c=0;c<cols;c++){ let streak=1; for(let r=1;r<rows;r++){ if(g[r][c]===g[r-1][c]) streak++; else { if(streak>=3) for(let k=0;k<streak;k++) rem.push([r-1-k,c]); streak=1; } } if(streak>=3) for(let k=0;k<streak;k++) rem.push([rows-1-k,c]); }
    if(rem.length===0) return false; const ng=g.map(r=>r.slice()); rem.forEach(([r,c])=>{ ng[r][c]=null; setScore(s=>s+5); }); setGrid(ng); return true; }
  function processGravity(){ const ng=grid.map(r=>r.slice()); for(let c=0;c<cols;c++){ let write=rows-1; for(let r=rows-1;r>=0;r--){ if(ng[r][c]!==null){ ng[write][c]=ng[r][c]; write--; } } for(let r=write;r>=0;r--) ng[r][c]=colors[Math.floor(Math.random()*colors.length)]; } setGrid(ng); if(resolveMatches(ng)) processGravity(); }
  return (<div>
    <h2>消消乐</h2>
    <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},48px)`,gap:6}}>
      {grid.map((row,r)=> row.map((c,cidx)=> (<div key={`${r}-${cidx}`} onClick={()=>clickCell(r,cidx)} style={{width:48,height:48,background:c,borderRadius:6}} />)) )}
    </div>
    <div className="game-controls"><div className="score">分数: {score}</div></div>
    <button onClick={()=>saveScore(location.pathname+'#match3',score)}>保存分数</button>
    <Leaderboard id={location.pathname+'#match3'} />
  </div>);
}

/* --- Merge (2048 like) --- */
function Merge(){ const size=4; const [board,setBoard]=useState([]); const [score,setScore]=useState(0);
  useEffect(()=>{ newGame(); function key(e){ if(e.code==='ArrowLeft') move('left'); if(e.code==='ArrowRight') move('right'); if(e.code==='ArrowUp') move('up'); if(e.code==='ArrowDown') move('down'); } window.addEventListener('keydown',key); return ()=> window.removeEventListener('keydown',key); },[]);
  function newGame(){ const b=Array.from({length:size},()=>Array.from({length:size},()=>null)); spawn(b); spawn(b); setBoard(b); setScore(0); }
  function spawn(b){ const empties=[]; for(let r=0;r<size;r++) for(let c=0;c<size;c++) if(!b[r][c]) empties.push([r,c]); if(empties.length===0) return; const [r,c]=empties[Math.floor(Math.random()*empties.length)]; b[r][c]=Math.random()<0.9?2:4; }
  function move(dir){ let moved=false; const b=board.map(r=>r.slice()); function compress(row){ const arr=row.filter(x=>x); for(let i=0;i<arr.length-1;i++){ if(arr[i]===arr[i+1]){ arr[i]=arr[i]*2; setScore(s=>s+arr[i]); arr.splice(i+1,1); } } while(arr.length<row.length) arr.push(null); return arr; }
    if(dir==='left'){ for(let r=0;r<size;r++){ const nr=compress(b[r].slice()); for(let c=0;c<size;c++){ if(b[r][c]!==nr[c]) moved=true; b[r][c]=nr[c]; } } }
    if(dir==='right'){ for(let r=0;r<size;r++){ const nr=compress(b[r].slice().reverse()).reverse(); for(let c=0;c<size;c++){ if(b[r][c]!==nr[c]) moved=true; b[r][c]=nr[c]; } } }
    if(dir==='up'){ for(let c=0;c<size;c++){ const col=[]; for(let r=0;r<size;r++) col.push(b[r][c]); const nc=compress(col); for(let r=0;r<size;r++){ if(b[r][c]!==nc[r]) moved=true; b[r][c]=nc[r]; } } }
    if(dir==='down'){ for(let c=0;c<size;c++){ const col=[]; for(let r=0;r<size;r++) col.push(b[r][c]); const nc=compress(col.reverse()).reverse(); for(let r=0;r<size;r++){ if(b[r][c]!==nc[r]) moved=true; b[r][c]=nc[r]; } } }
    if(moved){ spawn(b); setBoard(b); }
  }
  return (<div>
    <h2>合成游戏</h2>
    <div style={{display:'grid',gridTemplateColumns:`repeat(${size},72px)`,gap:8}}>
      {board.map((r,ri)=> r.map((c,ci)=> (<div key={`${ri}-${ci}`} style={{width:72,height:72,background:c? 'linear-gradient(90deg,#a14cff,#00ffd1)':'rgba(255,255,255,0.02)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>{c||''}</div>)))}
    </div>
    <div className="game-controls"><div className="score">分数: {score}</div></div>
    <div style={{marginTop:8}}>
      <button onClick={()=>move('left')}>左</button>
      <button onClick={()=>move('up')}>上</button>
      <button onClick={()=>move('down')}>下</button>
      <button onClick={()=>move('right')}>右</button>
      <button onClick={newGame} style={{marginLeft:8}}>新游戏</button>
    </div>
    <button style={{marginTop:8}} onClick={()=>saveScore(location.pathname+'#merge',score)}>保存分数</button>
    <Leaderboard id={location.pathname+'#merge'} />
  </div>);
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
