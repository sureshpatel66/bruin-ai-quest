// Pixel-art Online AI District.
// Catalog metadata drives selection and resource-to-resource relevance.
// Deterministic code owns layout and movement; no provider is contacted here.
const WORLD = {w: 1000, h: 620};
const PORTAL = [500, 307];

export const DISTRICTS = {
  student_arcade: {title:'STUDENT BENEFITS ARCADE', rect:[35,45,280,180], gate:[175,260], cols:2, wall:'#a97745', floor:'#3b2d38', accent:'#ffd36b'},
  learning_lane: {title:'LEARNING + CREDITS SCHOOL', rect:[360,45,280,180], gate:[500,260], cols:2, wall:'#3f7393', floor:'#28394d', accent:'#8fd3ff'},
  open_model_library: {title:'OPEN MODEL LIBRARY', rect:[685,45,280,180], gate:[825,260], cols:2, wall:'#487a47', floor:'#2c4135', accent:'#94e47a'},
  notebook_row: {title:'NOTEBOOK STUDIO ROW', rect:[35,390,280,185], gate:[175,355], cols:2, wall:'#70518c', floor:'#392f4d', accent:'#d1a7ff'},
  compute_dock: {title:'GPU + DEV CLOUD DOCK', rect:[360,390,280,185], gate:[500,355], cols:2, wall:'#4f5f99', floor:'#30364f', accent:'#9bb5ff'},
  model_market: {title:'MODEL API MARKET', rect:[685,390,280,185], gate:[825,355], cols:3, wall:'#746044', floor:'#41372d', accent:'#ffcb77'}
};

const FALLBACK_DISTRICT = 'model_market';

export function onlineShortestPath(edges, start, end) {
  const queue = [start], previous = new Map(), seen = new Set([start]);
  while (queue.length) {
    const current = queue.shift();
    if (current === end) break;
    for (const next of edges.get(current) || []) {
      if (!seen.has(next)) {seen.add(next); previous.set(next, current); queue.push(next);}
    }
  }
  if (!seen.has(end)) return [end];
  const path = [end];
  while (previous.has(path[0])) path.unshift(previous.get(path[0]));
  return path;
}

function resourceDistrict(resource) {
  return DISTRICTS[resource.district] ? resource.district : FALLBACK_DISTRICT;
}

export function buildShopLayout(resources) {
  const layout = new Map();
  for (const [districtId, district] of Object.entries(DISTRICTS)) {
    const items = resources.filter(r => resourceDistrict(r) === districtId);
    const [x,y,w,h] = district.rect;
    const cols = Math.min(district.cols || 2, Math.max(1, items.length));
    const rows = Math.max(1, Math.ceil(items.length / cols));
    const gap = 7, top = 33, pad = 10;
    const cellW = (w - pad*2 - gap*(cols-1)) / cols;
    const cellH = (h - top - pad - gap*(rows-1)) / rows;
    items.forEach((r,i) => {
      const col=i%cols, row=Math.floor(i/cols);
      const rx=x+pad+col*(cellW+gap), ry=y+top+row*(cellH+gap);
      const bottomDistrict = y > WORLD.h/2;
      const door = bottomDistrict ? [rx+cellW/2, ry+3] : [rx+cellW/2, ry+cellH-3];
      layout.set(r.id,{district:districtId, rect:[rx,ry,cellW,cellH], point:door});
    });
  }
  return layout;
}

function corridorBetween(from, to, layout, byId) {
  const points=[];
  const fromResource = byId.get(from), toResource = byId.get(to);
  const fromLayout = layout.get(from), toLayout = layout.get(to);
  if (from === 'portal') {
    points.push(PORTAL);
  } else if (fromLayout) {
    points.push(fromLayout.point);
    points.push(DISTRICTS[fromLayout.district].gate);
  }
  if (to === 'portal') {
    points.push(PORTAL);
    return points;
  }
  if (!toLayout) return points;
  const targetGate = DISTRICTS[toLayout.district].gate;
  const sourceDistrict = fromLayout?.district;
  if (sourceDistrict !== toLayout.district) {
    const sourceGate = fromLayout ? DISTRICTS[fromLayout.district].gate : PORTAL;
    points.push([sourceGate[0], PORTAL[1]]);
    points.push(PORTAL);
    points.push([targetGate[0], PORTAL[1]]);
  }
  points.push(targetGate);
  points.push(toLayout.point);
  return points.filter((p,i,a)=>i===0 || p[0]!==a[i-1][0] || p[1]!==a[i-1][1]);
}

export function buildVisualRoute(logicalPath, layout, resources) {
  const byId=new Map(resources.map(r=>[r.id,r]));
  if (!logicalPath.length) return [];
  const visual=[];
  for (let i=1;i<logicalPath.length;i++) {
    const segment=corridorBetween(logicalPath[i-1],logicalPath[i],layout,byId);
    for (const point of segment) {
      if (!visual.length || point[0]!==visual.at(-1)[0] || point[1]!==visual.at(-1)[1]) visual.push(point);
    }
  }
  if (logicalPath.length===1 && logicalPath[0] !== 'portal') {
    return corridorBetween('portal',logicalPath[0],layout,byId);
  }
  return visual;
}

function shortName(name, max=18) {
  const cleaned=name.replace('GitHub Student Developer Pack','GitHub Student Pack').replace('Google AI Studio and Gemini API','Gemini API').replace('Anthropic Claude API','Claude API').replace('Microsoft Azure for Students','Azure for Students');
  return cleaned.length>max ? cleaned.slice(0,max-1)+'…' : cleaned;
}

function drawPixelComputer(ctx,x,y,s,screen='#65d5ff') {
  ctx.fillStyle='#815b40';ctx.fillRect(x-13*s,y+3*s,26*s,7*s);
  ctx.fillStyle='#25384c';ctx.fillRect(x-7*s,y-8*s,14*s,11*s);
  ctx.fillStyle=screen;ctx.fillRect(x-5*s,y-6*s,10*s,7*s);
  ctx.fillStyle='#1a2531';ctx.fillRect(x-2*s,y+3*s,4*s,5*s);
}

export class OnlineWorld {
  constructor(resources,onResource) {
    this.resources=resources;this.onResource=onResource;this.byId=new Map(resources.map(r=>[r.id,r]));
    this.canvas=document.getElementById('online-game');this.ctx=this.canvas.getContext('2d');this.frame=document.getElementById('online-map-frame');
    this.sprite=new Image();this.sprite.src='/static/assets/bruin_walk.png';
    this.layout=buildShopLayout(resources);
    this.edges=new Map([['portal',new Set(resources.map(r=>r.id))]]);
    for(const r of resources)this.edges.set(r.id,new Set((r.properties?.next_steps||[]).filter(id=>this.byId.has(id))));
    for(const [from,tos] of [...this.edges])for(const to of tos){if(!this.edges.has(to))this.edges.set(to,new Set());this.edges.get(to).add(from);}
    this.avatar=[...PORTAL];this.current='portal';this.route=[];this.step=0;this.selected=null;this.relevant=new Set();this.logicalPath=[];
    this.resize=new ResizeObserver(()=>{this.canvas.width=this.frame.clientWidth;this.canvas.height=this.frame.clientHeight;});this.resize.observe(this.frame);
    this.canvas.addEventListener('click',event=>this.pick(event));this.last=0;requestAnimationFrame(t=>this.draw(t));
  }
  pick(event) {
    const box=this.canvas.getBoundingClientRect(),x=(event.clientX-box.left)/box.width*WORLD.w,y=(event.clientY-box.top)/box.height*WORLD.h;
    for(const [id,shop] of this.layout){const [rx,ry,rw,rh]=shop.rect;if(x>=rx&&x<=rx+rw&&y>=ry&&y<=ry+rh){this.onResource(this.byId.get(id));return;}}
  }
  focus(id,relevant=[]) {
    if(!this.byId.has(id))return;
    this.selected=id;this.relevant=new Set(relevant.filter(x=>this.byId.has(x)));this.relevant.add(id);
    this.logicalPath=onlineShortestPath(this.edges,this.current,id);
    if(this.current==='portal' && this.logicalPath[0]!== 'portal')this.logicalPath.unshift('portal');
    this.route=buildVisualRoute(this.logicalPath,this.layout,this.resources);this.step=0;this.destination=this.byId.get(id).name;
    document.getElementById('online-journey').textContent='Bruin is walking through the AI district to '+this.destination+'.';
  }
  reset() {
    this.selected=null;this.relevant.clear();this.logicalPath=this.current==='portal'?['portal']:[this.current,'portal'];
    this.route=this.current==='portal'?[]:corridorBetween(this.current,'portal',this.layout,this.byId);this.step=0;this.destination='the Start Portal';
    document.getElementById('online-journey').textContent='Returning to the Start Portal.';
  }
  draw(time) {
    const dt=Math.min(.05,(time-this.last)/1000||0);this.last=time;
    if(this.step<this.route.length){const target=this.route[this.step],dx=target[0]-this.avatar[0],dy=target[1]-this.avatar[1],d=Math.hypot(dx,dy),speed=dt*225;if(d<=speed){this.avatar=[...target];this.step++;if(this.step===this.route.length){this.current=this.selected||'portal';document.getElementById('online-journey').textContent='At '+this.destination+'. Choose a nearby shop or a relevant next stop.';}}else{this.avatar[0]+=dx/d*speed;this.avatar[1]+=dy/d*speed;}}
    const ctx=this.ctx,w=this.canvas.width,h=this.canvas.height,s=Math.min(w/WORLD.w,h/WORLD.h),ox=(w-WORLD.w*s)/2,oy=(h-WORLD.h*s)/2,p=point=>[point[0]*s+ox,point[1]*s+oy];
    ctx.imageSmoothingEnabled=false;ctx.fillStyle='#183257';ctx.fillRect(0,0,w,h);
    // Pixel grass / plaza base.
    for(let yy=0;yy<WORLD.h;yy+=18)for(let xx=0;xx<WORLD.w;xx+=18){const [x,y]=p([xx,yy]);ctx.fillStyle=((xx+yy)/18)%2?'#376244':'#315b3f';ctx.fillRect(x,y,18*s,18*s);}
    // Central street and sidewalks.
    const road=(x,y,rw,rh)=>{const [px,py]=p([x,y]);ctx.fillStyle='#b8a27e';ctx.fillRect(px,py,rw*s,rh*s);};
    road(0,274,1000,72);road(470,225,60,165);road(145,225,60,165);road(795,225,60,165);
    ctx.fillStyle='#967f60';for(let x=18;x<990;x+=48){const[a,b]=p([x,309]);ctx.fillRect(a,b,24*s,3*s);}
    // District buildings and shop rooms.
    for(const [districtId,d] of Object.entries(DISTRICTS)){
      const [x,y,rw,rh]=d.rect,[px,py]=p([x,y]);ctx.fillStyle='rgba(0,0,0,.23)';ctx.fillRect(px+7*s,py+8*s,rw*s,rh*s);ctx.fillStyle=d.wall;ctx.fillRect(px,py,rw*s,rh*s);ctx.fillStyle='#121d2a';ctx.fillRect(px+7*s,py+26*s,(rw-14)*s,(rh-34)*s);ctx.fillStyle=d.wall;ctx.fillRect(px,py,rw*s,28*s);ctx.fillStyle='#f5f7fb';ctx.font='bold '+Math.max(8,10*s)+'px monospace';ctx.textAlign='left';ctx.fillText(d.title,px+10*s,py+18*s);
      const [gx,gy]=p(d.gate);ctx.fillStyle=d.accent;ctx.fillRect(gx-10*s,gy-4*s,20*s,8*s);
    }
    // Shops.
    for(const r of this.resources){const shop=this.layout.get(r.id);if(!shop)continue;const d=DISTRICTS[shop.district],[rx,ry,rw,rh]=shop.rect,[x,y]=p([rx,ry]);const active=r.id===this.selected,related=this.relevant.has(r.id);ctx.fillStyle=active?d.accent:related?'#274d55':'#253544';ctx.fillRect(x,y,rw*s,rh*s);ctx.strokeStyle=active?'#fff7d4':related?d.accent:'#53677a';ctx.lineWidth=(active?3:1)*s;ctx.strokeRect(x,y,rw*s,rh*s);ctx.fillStyle=active?'#15202b':'#f0f5f8';ctx.font='bold '+Math.max(7,8*s)+'px monospace';ctx.textAlign='center';ctx.fillText(shortName(r.name),x+rw*s/2,y+13*s);drawPixelComputer(ctx,x+rw*s/2,y+rh*s*.62,s*.8,active?'#13243a':d.accent);ctx.font='bold '+Math.max(6,7*s)+'px monospace';ctx.fillStyle=active?'#15202b':d.accent;ctx.fillText((r.properties?.kind||'resource').replaceAll('_',' ').slice(0,20),x+rw*s/2,y+rh*s-7*s);}
    // Relevant network beams only, preserving the graph idea without cluttering the district.
    if(this.selected){const from=this.layout.get(this.selected)?.point;if(from){for(const id of this.relevant){if(id===this.selected)continue;const to=this.layout.get(id)?.point;if(!to)continue;const[a,b]=p(from),[c,d]=p(to);ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.strokeStyle='#ffe07588';ctx.lineWidth=2*s;ctx.setLineDash([5*s,6*s]);ctx.stroke();ctx.setLineDash([]);}}}
    // Active walking route.
    if(this.route.length){ctx.beginPath();this.route.forEach((point,i)=>{const[x,y]=p(point);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle='#ffe075';ctx.lineWidth=3*s;ctx.setLineDash([8*s,5*s]);ctx.stroke();ctx.setLineDash([]);}
    // Start portal.
    const [px,py]=p(PORTAL);ctx.fillStyle='#253f70';ctx.fillRect(px-42*s,py-24*s,84*s,48*s);ctx.strokeStyle='#b9c9ff';ctx.lineWidth=2*s;ctx.strokeRect(px-42*s,py-24*s,84*s,48*s);ctx.fillStyle='#fff';ctx.font='bold '+Math.max(8,9*s)+'px monospace';ctx.textAlign='center';ctx.fillText('START PORTAL',px,py+4*s);
    // Avatar.
    const [ax,ay]=p(this.avatar);let dir=0;if(this.step<this.route.length){const t=this.route[this.step],dx=t[0]-this.avatar[0],dy=t[1]-this.avatar[1];if(Math.abs(dx)>Math.abs(dy))dir=dx<0?1:2;else dir=dy<0?3:0;}const fr=this.step<this.route.length?Math.floor(time/130)%4:0;ctx.fillStyle='#0a1025aa';ctx.fillRect(ax-9*s,ay+8*s,18*s,6*s);if(this.sprite.complete&&this.sprite.naturalWidth)ctx.drawImage(this.sprite,fr*20,dir*28,20,28,ax-14*s,ay-29*s,28*s,39*s);else{ctx.fillStyle='#ffd36b';ctx.fillRect(ax-5*s,ay-14*s,10*s,15*s);}
    requestAnimationFrame(t=>this.draw(t));
  }
}
