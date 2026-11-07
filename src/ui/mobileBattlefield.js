const mobileQuery='(max-width:900px) and (orientation:portrait), (max-width:960px) and (max-height:580px) and (orientation:landscape)';
export function createMobileBattlefield(ui,onTap){
 const media=matchMedia(mobileQuery),viewport=document.getElementById('battlefield-viewport'),body=document.getElementById('mobile-deck-body'),toggle=document.getElementById('mobile-deck-toggle'),plus=document.getElementById('map-zoom-in'),minus=document.getElementById('map-zoom-out'),fit=document.getElementById('map-fit');
 let collapsed=false,zoom=1,pan={x:0,y:0},lastWeapon=null,lastInspection=null,currentState=null,frame=0,suppressUntil=0,gesture=null;
 const pointers=new Map(),clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
 const portrait=()=>innerHeight>=innerWidth;
 const point=e=>{const r=viewport.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
 function geometry(){
  const w=ui.canvas.clientWidth,h=ui.canvas.clientHeight,vw=viewport.clientWidth,vh=viewport.clientHeight;
  return {w,h,vw,vh};
 }
 function paint(){
  if(!media.matches){ui.canvas.style.transform='';viewport.style.height='';body.inert=false;return;}
  const base=ui.canvas.clientWidth*9/16;
  viewport.style.height=portrait()?`${collapsed&&zoom>1?Math.min(base*zoom,innerHeight*.64):base}px`:'';
  const {w,h,vw,vh}=geometry();
  pan.x=w*zoom<=vw?(vw-w*zoom)/2:clamp(pan.x,vw-w*zoom,0);
  pan.y=h*zoom<=vh?(vh-h*zoom)/2:clamp(pan.y,vh-h*zoom,0);
  ui.canvas.style.transform=`translate(${pan.x}px,${pan.y}px) scale(${zoom})`;
  viewport.classList.toggle('zoomed',zoom>1);fit.title=`Show entire map · current zoom ${Number(zoom.toFixed(1))}×`;
  minus.disabled=zoom<=1;plus.disabled=zoom>=3;
 }
 function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(paint);}
 function setCollapsed(value){
  collapsed=value;ui.gameScreen.classList.toggle('mobile-deck-collapsed',collapsed);
  toggle.setAttribute('aria-expanded',String(!collapsed));toggle.setAttribute('aria-label',collapsed?'Open arsenal and upgrades':'Collapse arsenal');toggle.querySelector('i').textContent=collapsed?'⌄':'⌃';
  body.inert=media.matches&&collapsed;paint();
 }
 function setZoom(value,anchor){
  const old=zoom,{vw,vh}=geometry(),at=anchor||{x:vw/2,y:vh/2};
  zoom=clamp(value,1,3);
  pan.x=at.x-(at.x-pan.x)/old*zoom;pan.y=at.y-(at.y-pan.y)/old*zoom;
  if(zoom>1)setCollapsed(true);else pan={x:0,y:0};
  paint();
 }
 toggle.addEventListener('click',()=>setCollapsed(!collapsed));
 plus.addEventListener('click',()=>setZoom(Math.min(3,zoom+.5)));
 minus.addEventListener('click',()=>setZoom(Math.max(1,zoom-.5)));
 fit.addEventListener('click',()=>setZoom(1));
 toggle.closest('.mobile-battle-tools').addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&e.target.closest('button'))e.stopPropagation();});
 // One-finger taps still place/inspect. A drag only pans after a clear threshold.
 viewport.addEventListener('pointerdown',e=>{
  if(!media.matches||e.button!==0)return;
  if(!pointers.size)suppressUntil=0;
  pointers.set(e.pointerId,point(e));
  if(pointers.size===2){const [a,b]=[...pointers.values()];gesture={kind:'pinch',distance:Math.hypot(a.x-b.x,a.y-b.y),zoom,pan:{...pan},center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};e.preventDefault();}
  else gesture={kind:'drag',start:point(e),pan:{...pan},moved:false};
  if(zoom>1||pointers.size===2)ui.canvas.setPointerCapture(e.pointerId);
 });
 viewport.addEventListener('pointermove',e=>{
  if(!media.matches||!pointers.has(e.pointerId)||!gesture)return;
  pointers.set(e.pointerId,point(e));
  if(pointers.size>=2&&gesture.kind==='pinch'){
   const [a,b]=[...pointers.values()],center={x:(a.x+b.x)/2,y:(a.y+b.y)/2},next=clamp(gesture.zoom*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,gesture.distance),1,3);
   zoom=next;pan={x:center.x-(gesture.center.x-gesture.pan.x)/gesture.zoom*next,y:center.y-(gesture.center.y-gesture.pan.y)/gesture.zoom*next};
   if(next>1)setCollapsed(true);suppressUntil=performance.now()+500;paint();e.preventDefault();
  }else if(gesture.kind==='drag'){
   const p=point(e),dx=p.x-gesture.start.x,dy=p.y-gesture.start.y;
   if(Math.hypot(dx,dy)>7)gesture.moved=true;
   if(gesture.moved){if(zoom>1){pan={x:gesture.pan.x+dx,y:gesture.pan.y+dy};paint();}suppressUntil=performance.now()+500;e.preventDefault();}
  }
 });
 function end(e){
  if(!pointers.has(e.pointerId))return;
  const moved=gesture?.kind==='pinch'||gesture?.moved;pointers.delete(e.pointerId);
  if(moved)suppressUntil=performance.now()+400;
  if(ui.canvas.hasPointerCapture(e.pointerId))ui.canvas.releasePointerCapture(e.pointerId);
  if(pointers.size){const p=[...pointers.values()][0];gesture={kind:'drag',start:p,pan:{...pan},moved:true};}else gesture=null;
  // Chrome can omit the compatibility click immediately after a touch drag.
  // Deliver clean touch taps once at pointerup; swallow any later native click.
  if(e.type==='pointerup'&&e.pointerType==='touch'&&!moved&&!pointers.size){
   suppressUntil=performance.now()+400;onTap(e);
  }
 }
 viewport.addEventListener('pointerup',end);viewport.addEventListener('pointercancel',end);
 ui.canvas.addEventListener('click',e=>{if(media.matches&&performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
 function sync(state){
  currentState=state;
  const inspection=state.selectedTowerId||state.selectedDroneId||state.selectedEnemyId||state.selectedObstacle;
  if(media.matches&&inspection&&inspection!==lastInspection){
   setCollapsed(false);
   if(zoom>1){
    const obstacle=state.selectedObstacle,target=state.towers.find(t=>t.id===state.selectedTowerId)||state.drones.find(d=>d.id===state.selectedDroneId)||state.enemies.find(e=>e.id===state.selectedEnemyId)||(obstacle?{x:state.board.x+(obstacle.col+.5)*state.board.tile,y:state.board.y+(obstacle.row+.5)*state.board.tile}:null);
    if(target){paint();const {w,h,vw,vh}=geometry();pan={x:vw/2-target.x/ui.canvas.width*w*zoom,y:vh/2-target.y/ui.canvas.height*h*zoom};paint();}
   }
  }
  if(media.matches&&state.selectedWeaponKey&&state.selectedWeaponKey!==lastWeapon)setCollapsed(true);
  lastInspection=inspection;lastWeapon=state.selectedWeaponKey;
  const label=inspection?ui.towerSidebarTitle.textContent:state.selectedWeaponKey?ui.weaponBar.querySelector(`[data-weapon-key="${state.selectedWeaponKey}"] .weapon-nickname`)?.textContent:'Arsenal';
  toggle.querySelector('span').textContent=label||'Arsenal';toggle.title=collapsed?'Open arsenal and upgrades':'Collapse arsenal';
  body.inert=media.matches&&collapsed;
 }
 function reset(){zoom=1;pan={x:0,y:0};lastWeapon=lastInspection=null;setCollapsed(false);paint();}
 media.addEventListener('change',()=>{pointers.clear();gesture=null;zoom=1;pan={x:0,y:0};setCollapsed(false);if(currentState)sync(currentState);schedule();});
 let lastPortrait=portrait();
 window.addEventListener('resize',()=>{const next=portrait();if(next!==lastPortrait){lastPortrait=next;pointers.clear();gesture=null;zoom=1;pan={x:0,y:0};setCollapsed(false);}schedule();});
 new ResizeObserver(schedule).observe(viewport);
 return {sync,reset,diagnostics:()=>({mobile:media.matches,collapsed:media.matches&&collapsed,zoom:media.matches?Number(zoom.toFixed(2)):1,pan:{...pan},activePointers:pointers.size})};
}
