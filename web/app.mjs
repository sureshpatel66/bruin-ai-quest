import {CampusMap} from './campus-map.mjs';
import {OnlineWorld} from './online-world.mjs';

const $ = id => document.getElementById(id);
let resources=[],uclaResources=[],onlineResources=[],campusMap,onlineWorld,geography,selectedId,activeWorld='ucla';
let activeJourney=null,journeyIndex=0,completedJourneySteps=new Set();
const JOURNEY_STORAGE='bruin-ai-quest-v03-journey';

const copy={
  ucla:{eyebrow:'UCLA CAMPUS WORLD',title:'Find your place to start.',description:'Visit a verified workshop venue or select a UCLA-supported AI resource.',countLabel:'UCLA resources',catalogTitle:'UCLA resources',catalogHint:'Workshop locations, events, and campus-provided services. Independent online resources live in the other world.'},
  online:{eyebrow:'INDEPENDENT ONLINE AI DISTRICT',title:'Navigate the cloud, models, and learning paths.',description:'The Bruin moves between external resources using task relevance and catalog properties.',countLabel:'online resources',catalogTitle:'Online AI resources',catalogHint:'Independent providers for learning credits, cloud work, model APIs, and open-model discovery. They are not UCLA services.'}
};

function element(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function link(text,url){const a=element('a',text,'source-link');try{const parsed=new URL(url);if(parsed.protocol==='https:'){a.href=url;a.target='_blank';a.rel='noopener noreferrer';}}catch{}return a;}
function detail(label,value){const p=element('p',undefined,'detail-line');p.append(element('strong',label),document.createTextNode(value??'Not specified'));return p;}
function resourceById(id){return resources.find(r=>r.id===id);}
function saveJourney(){
  if(!activeJourney){localStorage.removeItem(JOURNEY_STORAGE);return;}
  try{localStorage.setItem(JOURNEY_STORAGE,JSON.stringify({journey:activeJourney,index:journeyIndex,completed:[...completedJourneySteps],goal:$('goal').value}));}catch{}
}
function clearJourney(){
  activeJourney=null;journeyIndex=0;completedJourneySteps=new Set();saveJourney();renderJourney();$('next-stop-label').textContent='CURRENT STOP';
}
function restoreJourney(){
  try{
    const raw=localStorage.getItem(JOURNEY_STORAGE);if(!raw)return false;const saved=JSON.parse(raw);
    if(!saved?.journey?.steps?.length)return false;
    if(!saved.journey.steps.every(step=>resourceById(step.resource_id)))return false;
    activeJourney=saved.journey;journeyIndex=Math.max(0,Math.min(Number(saved.index)||0,activeJourney.steps.length-1));completedJourneySteps=new Set((saved.completed||[]).filter(i=>Number.isInteger(i)&&i>=0&&i<activeJourney.steps.length));
    if(saved.goal)$('goal').value=saved.goal;showJourneyStep(journeyIndex,false);return true;
  }catch{return false;}
}
function resourceButton(r,suffix=''){const b=element('button',undefined,'resource-button');b.append(element('strong',r.name),element('small',suffix||(r.world==='online'?r.location.label+' · '+r.status.replaceAll('_',' '):r.location.label)));b.dataset.resource=r.id;b.onclick=()=>selectResource(r);return b;}
function updateSelection(){document.querySelectorAll('[data-resource]').forEach(el=>el.classList.toggle('active',el.dataset.resource===selectedId));}

function switchWorld(world){
  activeWorld=world;const isCampus=world==='ucla',text=copy[world];
  $('campus-world').hidden=!isCampus;$('online-world').hidden=isCampus;
  $('campus-tab').classList.toggle('active',isCampus);$('campus-tab').setAttribute('aria-pressed',String(isCampus));
  $('online-tab').classList.toggle('active',!isCampus);$('online-tab').setAttribute('aria-pressed',String(!isCampus));
  $('world-eyebrow').textContent=text.eyebrow;$('world-title').textContent=text.title;$('world-description').textContent=text.description;
  const list=isCampus?uclaResources:onlineResources;$('world-count').textContent=list.length;$('world-count-label').textContent=text.countLabel;
  $('catalog-title').textContent=text.catalogTitle;$('catalog-hint').textContent=text.catalogHint;$('catalog-count').textContent=list.length+' resources';
  $('world-resource-list').replaceChildren(...list.map(r=>resourceButton(r)));$('official-map-link').hidden=!isCampus;
  const selected=resourceById(selectedId);
  if(!selected||(selected.world||'ucla')!==world){
    $('selection-title').textContent=isCampus?'Choose a campus pin':'Choose an AI shop';
    $('resource').replaceChildren(element('p',isCampus?'Select a verified venue or UCLA-supported resource to see access, schedule, and source details.':'Select a shop to inspect access, billing/offer, data boundary, and the official provider source.'));
    $('related').replaceChildren();
  }
  updateSelection();
}

function visitVenue(id){
  switchWorld('ucla');selectedId=null;updateSelection();campusMap.focus(id);
  const venue=geography.venues.find(v=>v.id===id);$('selection-title').textContent=venue.name;
  $('resource').replaceChildren(element('span','VERIFIED EVENT VENUE','tag'),element('p','Select an event below for its room, schedule, eligibility, and source. Building position is approximate.'));
  $('related').replaceChildren(...uclaResources.filter(r=>r.location.kind==='physical'&&r.location.venue_ids.includes(id)).map(r=>resourceButton(r)));
  document.querySelectorAll('[data-venue]').forEach(b=>b.classList.toggle('active',b.dataset.venue===id));
}

function selectResource(r,suggestions=[]){
  selectedId=r.id;switchWorld(r.world||'ucla');updateSelection();$('related').replaceChildren();$('selection-title').textContent=r.name;
  const loc=r.location,isOnline=r.world==='online';
  const items=[element('span',r.status.replaceAll('_',' '),'tag'),element('span',isOnline?'ONLINE WORLD':loc.kind==='multiple'?'MULTIPLE VENUES':'UCLA CAMPUS','tag'),element('p',r.best_for),detail(isOnline?'World stop':'Where',loc.label)];
  if(loc.schedule)items.push(detail('When · Los Angeles time',loc.schedule));if(loc.note)items.push(element('p',loc.note));
  if(isOnline){const p=r.properties;items.push(detail('Access',p.access),detail('Billing / offer',p.billing),detail('Data boundary',p.data_boundary));}
  items.push(detail('Eligibility',r.eligibility),detail('Cost',r.cost),link(!isOnline&&loc.kind!=='online'&&loc.source_url===r.official_url?'Official resource & venue page ↗':'Official resource page ↗',r.official_url));
  if(!isOnline&&loc.kind!=='online'&&loc.source_url!==r.official_url)items.push(link('Verify venue & schedule ↗',loc.source_url));
  items.push(element('p','Resource checked '+r.last_verified+' · location checked '+loc.last_verified,'hint'));$('resource').replaceChildren(...items);
  if(isOnline){
    const nextIds=[...(r.properties.next_steps||[]),...suggestions].filter(id=>id!==r.id);const next=[...new Set(nextIds)].map(resourceById).filter(Boolean);onlineWorld.focus(r.id,next.map(x=>x.id));
    $('related').replaceChildren(element('h3','Relevant next stops'),...next.map(x=>resourceButton(x)));
  }else if(loc.kind==='physical')campusMap.focus(loc.venue_ids[0]);
  else{
    campusMap.clearSelection();$('journey').textContent=loc.kind==='online'?'This UCLA-provided service is online; no physical trip needed.':'AI Exchange spans multiple venues. Choose a catalog event or view the full program.';
    if(loc.kind==='multiple')for(const id of loc.venue_ids){const venue=geography.venues.find(v=>v.id===id);const b=element('button','Explore '+venue.name,'venue-action');b.onclick=()=>visitVenue(id);$('related').append(b);}
  }
}

function renderJourney(){
  const panel=$('journey-panel');
  if(!activeJourney){panel.hidden=true;return;}
  panel.hidden=false;$('journey-title').textContent=activeJourney.title;$('journey-summary').textContent=activeJourney.summary;
  const total=activeJourney.steps.length,done=completedJourneySteps.size;
  $('journey-progress-label').textContent=done+' / '+total+' complete';$('journey-progress').max=Math.max(1,total);$('journey-progress').value=done;
  const stepEls=activeJourney.steps.map((step,index)=>{
    const b=element('button',undefined,'journey-step');if(index===journeyIndex)b.classList.add('current');if(completedJourneySteps.has(index))b.classList.add('completed');if(step.optional)b.classList.add('optional');
    const n=element('span',completedJourneySteps.has(index)?'✓':String(index+1),'step-number');
    const body=element('span');body.append(element('strong',step.name),element('small',step.purpose));
    if(step.alternatives?.length)body.append(element('span','Alternative: '+step.alternatives.map(a=>a.name).join(' · '),'step-alternative'));
    const world=element('span',step.world==='online'?'ONLINE':'UCLA','step-world');b.append(n,body,world);b.onclick=()=>showJourneyStep(index);return b;
  });
  $('journey-steps').replaceChildren(...stepEls);
  const previous=activeJourney.steps[journeyIndex-1],current=activeJourney.steps[journeyIndex];
  const transition=$('journey-transition');
  if(previous&&current&&previous.world!==current.world){transition.hidden=false;transition.textContent='Portal transition: '+(previous.world==='ucla'?'UCLA Campus':'Online AI District')+' → '+(current.world==='ucla'?'UCLA Campus':'Online AI District');}else transition.hidden=true;
  $('journey-prev').disabled=journeyIndex===0;$('journey-prev').textContent='← Previous';
  const next=$('journey-next');const complete=done===total;
  next.disabled=complete;next.textContent=complete?'Journey complete ✓':journeyIndex===total-1?'Complete journey ✓':'Mark done & continue →';
  next.classList.toggle('journey-complete',complete);
}

function showJourneyStep(index,persist=true){
  if(!activeJourney||!activeJourney.steps.length)return;
  journeyIndex=Math.max(0,Math.min(index,activeJourney.steps.length-1));const step=activeJourney.steps[journeyIndex],resource=resourceById(step.resource_id);if(!resource)return;
  selectResource(resource,(step.alternatives||[]).map(a=>a.resource_id));
  $('next-stop-label').textContent='CURRENT STOP · '+(journeyIndex+1)+' / '+activeJourney.steps.length;
  const purpose=element('p',step.purpose,'status-message'),action=detail('Milestone action',step.action);$('resource').prepend(purpose);$('resource').append(action);
  renderJourney();if(persist)saveJourney();
}

function advanceJourney(){
  if(!activeJourney)return;completedJourneySteps.add(journeyIndex);
  if(journeyIndex<activeJourney.steps.length-1){journeyIndex++;showJourneyStep(journeyIndex);}else{
    renderJourney();saveJourney();$('next-stop-label').textContent='JOURNEY COMPLETE';
    const done=element('p','Journey complete. Revisit any stop, inspect alternatives, or enter a new goal to build another journey.','journey-complete');$('resource').prepend(done);
  }
}
function previousJourneyStep(){if(activeJourney&&journeyIndex>0)showJourneyStep(journeyIndex-1);}

async function json(url,options){const res=await fetch(url,options);if(!res.ok)throw new Error('Request failed ('+res.status+'). Please try again.');return res.json();}

async function route(event){
  event?.preventDefault();const goal=$('goal').value.trim();if(!goal||!campusMap||!onlineWorld)return;
  const buttons=[$('route'),...document.querySelectorAll('[data-goal]')];buttons.forEach(b=>b.disabled=true);$('route').textContent='Building journey…';
  try{
    const out=await json('/api/journey',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({goal})});
    activeJourney=out.journey;journeyIndex=0;completedJourneySteps=new Set();if(!activeJourney?.steps?.length)throw new Error('The journey planner returned no usable steps.');
    showJourneyStep(0);saveJourney();
    $('decision-panel').hidden=false;const d=out.state.decision;$('backend').textContent=d.backend+' · '+d.model+' · '+d.journey_type;
    $('decision').replaceChildren(element('p','Journey type: '+d.journey_type.replaceAll('_',' ')+' · fit '+Number(d.fit_score).toFixed(2)+' · human-help signal '+Number(d.needs_human_help).toFixed(2),'hint'));
    const immediate=[];
    for(const [id,value] of Object.entries(d.probabilities).sort((a,b)=>b[1]-a[1]).slice(0,3)){const item=resourceById(id);if(!item)continue;immediate.push(item);const row=element('div',undefined,'meter'),progress=element('progress');progress.max=1;progress.value=Math.max(0,Math.min(1,value));progress.setAttribute('aria-label',item.name+' routing weight');row.append(element('span',item.name),element('span',Number(value).toFixed(2)),progress);$('decision').append(row);}
    $('alternatives').replaceChildren(...immediate.map(r=>resourceButton(r,'Immediate-match signal')));updateSelection();
  }catch(error){
    const message=error.message;activeJourney=null;renderJourney();$('selection-title').textContent='Could not build journey';$('resource').replaceChildren(element('p','You can still explore both worlds and choose a resource from the catalog.','error'));$('journey').textContent=message;$('online-journey').textContent=message;
  }finally{buttons.forEach(b=>b.disabled=false);$('route').textContent='Build my journey →';}
}

async function load(){
  try{
    const [catalog,data]=await Promise.all([json('/api/resources'),json('/static/assets/campus-map.json')]);
    resources=catalog.resources;uclaResources=catalog.ucla_resources;onlineResources=catalog.online_resources;geography=data;
    campusMap=new CampusMap(data,visitVenue);onlineWorld=new OnlineWorld(onlineResources,selectResource);
    geography.venues.forEach((venue,i)=>{const b=element('button',String(i+1).padStart(2,'0')+' · '+venue.name);b.dataset.venue=venue.id;b.onclick=()=>visitVenue(venue.id);$('venue-list').append(b);});
    onlineResources.forEach((resource,i)=>{const b=element('button',String(i+1).padStart(2,'0')+' · '+resource.name);b.dataset.resource=resource.id;b.onclick=()=>selectResource(resource);$('online-node-list').append(b);});
    $('online-home').onclick=()=>onlineWorld.reset();$('journey-prev').onclick=previousJourneyStep;$('journey-next').onclick=advanceJourney;$('journey-reset').onclick=clearJourney;
    const initialWorld=new URLSearchParams(location.search).get('world')==='online'?'online':'ucla';switchWorld(initialWorld);if(!restoreJourney())renderJourney();$('verified').textContent='Venue assignments checked '+catalog.last_verified.ucla+' · independent online records checked '+catalog.last_verified.online+'. Confirm current access, prices, credits, terms, and rooms before use.';$('map-loading').hidden=true;
  }catch(error){$('map-loading').textContent='Campus map could not load. Reload to retry; the official UCLA map link remains available.';console.error(error);}
}

$('mission').onsubmit=route;$('campus-tab').onclick=()=>switchWorld('ucla');$('online-tab').onclick=()=>switchWorld('online');
document.querySelectorAll('[data-goal]').forEach(b=>b.onclick=()=>{$('goal').value=b.dataset.goal;route();});load();
