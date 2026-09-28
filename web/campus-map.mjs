import {buildGraph, nearestNode, astar, distance} from './navigation.mjs';

export class CampusMap {
  constructor(data, onVenue) {
    this.data = data; this.onVenue = onVenue;
    this.canvas = document.getElementById('game'); this.ctx = this.canvas.getContext('2d');
    this.frame = document.getElementById('map-frame'); this.graph = buildGraph(data.graph);
    this.currentNode = nearestNode(data.start, this.graph);
    this.avatar = [...this.graph.nodes[this.currentNode]]; this.path = []; this.step = 0;
    this.sprite = new Image(); this.sprite.src = '/static/assets/bruin_walk.png';
    this.base = document.createElement('canvas'); this.base.width = data.width; this.base.height = data.height;
    this.paintBase(); this.pins = [];
    for (const [i, venue] of data.venues.entries()) {
      const pin = document.createElement('button'); pin.className = 'pin';
      pin.textContent = String(i + 1).padStart(2, '0') + ' ' + venue.name;
      pin.setAttribute('aria-label', 'Explore workshops at ' + venue.name);
      pin.onclick = () => this.onVenue(venue.id);
      document.getElementById('pins').append(pin); this.pins.push({venue, pin});
    }
    this.resizeObserver = new ResizeObserver(() => {this.canvas.width = this.frame.clientWidth; this.canvas.height = this.frame.clientHeight; this.fit();});
    this.resizeObserver.observe(this.frame);
    let drag = null;
    this.canvas.onpointerdown = e => {drag = {x:e.clientX, y:e.clientY}; this.canvas.setPointerCapture(e.pointerId);};
    this.canvas.onpointermove = e => {if (!drag) return; this.ox += e.clientX - drag.x; this.oy += e.clientY - drag.y; drag = {x:e.clientX, y:e.clientY};};
    this.canvas.onpointerup = this.canvas.onpointercancel = () => {drag = null;};
    document.getElementById('zoom-in').onclick = () => this.zoom(1.4);
    document.getElementById('zoom-out').onclick = () => this.zoom(1 / 1.4);
    document.getElementById('fit').onclick = () => this.fit();
    document.getElementById('home').onclick = () => {this.clearSelection(); this.walkTo(data.start, 'Bruin Plaza'); this.fit();};
    this.lastTime = 0; requestAnimationFrame(t => this.draw(t));
  }
  fit() {this.scale = Math.min(this.canvas.width / this.data.width, this.canvas.height / this.data.height) * .97; this.ox = (this.canvas.width - this.data.width * this.scale) / 2; this.oy = (this.canvas.height - this.data.height * this.scale) / 2;}
  zoom(factor) {
    const scale = Math.max(.2, Math.min(4, this.scale * factor));
    this.ox = this.canvas.width / 2 - (this.canvas.width / 2 - this.ox) * scale / this.scale;
    this.oy = this.canvas.height / 2 - (this.canvas.height / 2 - this.oy) * scale / this.scale; this.scale = scale;
  }
  focus(venueId) {
    const venue = this.data.venues.find(v => v.id === venueId); if (!venue) return;
    this.selected = venueId; this.scale = Math.min(2, Math.max(.9, this.canvas.width / 520));
    this.ox = this.canvas.width / 2 - venue.point[0] * this.scale;
    this.oy = this.canvas.height / 2 - venue.point[1] * this.scale;
    this.walkTo(venue.point, venue.name);
  }
  clearSelection() {this.selected = null; this.path = []; this.step = 0;}
  walkTo(point, title) {
    this.currentNode = nearestNode(this.avatar, this.graph);
    const end = nearestNode(point, this.graph), ids = astar(this.graph, this.currentNode, end);
    this.path = ids.map(id => this.graph.nodes[id]); this.step = 0; this.destination = title; this.endNode = end;
    document.getElementById('journey').textContent = ids.length ? 'Bruin is walking toward ' + title + ' · illustrative route' : 'No connected walking route found. Check the official map.';
  }
  paintBase() {
    const ctx = this.base.getContext('2d'); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#7b9d78'; ctx.fillRect(0, 0, this.data.width, this.data.height);
    for (let y = 0; y < this.data.height; y += 12) for (let x = 0; x < this.data.width; x += 12) if ((x / 12 + y / 12) % 2) {ctx.fillStyle = '#789a75'; ctx.fillRect(x, y, 12, 12);}
    const shape = (points, dx = 0, dy = 0) => {ctx.beginPath(); points.forEach((p, i) => {const x = Math.round(p[0] / 2) * 2 + dx, y = Math.round(p[1] / 2) * 2 + dy; i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);});};
    for (const f of this.data.features.filter(f => f.kind === 'green')) {shape(f.points); ctx.fillStyle = '#588568'; ctx.fill(); ctx.strokeStyle = '#91b489'; ctx.lineWidth = 2; ctx.stroke();}
    for (const f of this.data.features.filter(f => f.kind === 'road')) {
      const foot = ['footway','path','pedestrian','steps'].includes(f.type); shape(f.points);
      ctx.lineWidth = foot ? 3 : 9; ctx.strokeStyle = foot ? '#c4bb96' : '#657c77'; ctx.stroke();
      if (!foot) {ctx.lineWidth = 5;ctx.strokeStyle = '#b4baaa';ctx.stroke();}
    }
    for (const f of this.data.features.filter(f => f.kind === 'building')) {
      shape(f.points, 3, 5);ctx.fillStyle = '#35544b99';ctx.fill();
      shape(f.points); ctx.fillStyle = '#cab48e';ctx.fill();ctx.strokeStyle = '#7d755e';ctx.lineWidth = 2;ctx.stroke();
      const venue = this.data.venues.find(v => v.osm_way === f.id);
      if (venue) {ctx.fillStyle = '#dba551';ctx.fill();ctx.strokeStyle = '#ffe099';ctx.lineWidth = 3;ctx.stroke();}
    }
  }
  draw(time) {
    const dt = Math.min(.05, (time - this.lastTime) / 1000 || 0); this.lastTime = time;
    if (this.step < this.path.length) {
      const target = this.path[this.step], d = distance(target, this.avatar), travel = dt * 75;
      if (d <= travel) {this.avatar = [...target]; this.step++; if (this.step === this.path.length) {this.currentNode = this.endNode; document.getElementById('journey').textContent = 'Near ' + this.destination + ' · check the listed room and official directions.';}}
      else {this.avatar[0] += (target[0] - this.avatar[0]) / d * travel;this.avatar[1] += (target[1] - this.avatar[1]) / d * travel;}
    }
    const ctx = this.ctx, s = this.scale || .5, project = p => [Math.round(p[0] * s + this.ox), Math.round(p[1] * s + this.oy)];
    ctx.imageSmoothingEnabled = false;ctx.fillStyle = '#6e9274';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.drawImage(this.base, Math.round(this.ox),Math.round(this.oy),Math.round(this.data.width*s),Math.round(this.data.height*s));
    ctx.font = 'bold 10px monospace';ctx.textAlign = 'center';
    for (const mark of this.data.landmarks) {
      if (s < .6 && !['Royce Hall','Powell Library','Hedrick Hall','Edwin W. Pauley Pavilion'].includes(mark.name)) continue;
      const [x,y] = project(mark.point), name = mark.name.replace('Edwin W. ','').replace('Charles E. Young Research Library','Young Research Library');
      ctx.fillStyle = '#12332dd9';ctx.fillRect(x-ctx.measureText(name).width/2-4,y-6,ctx.measureText(name).width+8,15);ctx.fillStyle = '#f6f2d1';ctx.fillText(name,x,y+5);
    }
    if (this.path.length) {ctx.beginPath();this.path.forEach((p,i) => {const [x,y]=project(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.lineWidth=3;ctx.strokeStyle='#ffe074';ctx.setLineDash([5,4]);ctx.stroke();ctx.setLineDash([]);}
    for (const {venue,pin} of this.pins) {
      const [x,y] = project(venue.point);pin.style.left=x+'px';pin.style.top=y+'px';pin.classList.toggle('active',venue.id===this.selected);
      // Stagger labels while keeping a leader anchored to the actual building.
      const offset = s < .8 ? (venue.id==='james_west' ? [-65,-35] : venue.id==='engineering_v' ? [55,8] : [30,16]) : [0,-12];
      pin.style.marginLeft=offset[0]+'px';pin.style.marginTop=offset[1]+'px';
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+offset[0],y+offset[1]-3);ctx.strokeStyle='#17362c';ctx.lineWidth=2;ctx.stroke();
      ctx.fillStyle='#ffdb74';ctx.fillRect(x-4,y-4,8,8);
    }
    const [x,y]=project(this.avatar);ctx.fillStyle='#12362a88';ctx.fillRect(x-8,y-1,16,6);
    if(this.sprite.complete && this.sprite.naturalWidth) {let dir=0;const p=this.path[this.step];if(p){const dx=p[0]-this.avatar[0],dy=p[1]-this.avatar[1];dir=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy<0?3:0);}ctx.drawImage(this.sprite,(this.step<this.path.length?Math.floor(time/130)%4:0)*20,dir*28,20,28,x-12,y-29,24,34);}
    else {ctx.fillStyle='#ffd36b';ctx.fillRect(x-5,y-12,10,12);}
    requestAnimationFrame(t=>this.draw(t));
  }
}
