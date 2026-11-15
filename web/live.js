"use strict";
// Render, patch, motion between feeds, keys and feed polling.
// Motion explains what changed between two feeds: bars glide from their last fill, a finished
// agent's mark flashes once, new log lines arrive tinted. The first render stays still.
var CALM=matchMedia("(prefers-reduced-motion: reduce)");
function snapshot(p){
  var s={bars:{},states:{},log:{}};
  p.querySelectorAll(".lane").forEach(function(r){var f=r.querySelector(".fillbar");s.bars[r.dataset.key]=f?f.dataset.pct:null;s.states[r.dataset.key]=r.dataset.state});
  p.querySelectorAll(".log .row").forEach(function(r){s.log[r.dataset.key]=1});
  return s;
}
function animateChanges(p,prev){
  var EASE="cubic-bezier(0.16, 1, 0.3, 1)";
  p.querySelectorAll(".lane").forEach(function(r){
    var k=r.dataset.key,f=r.querySelector(".fillbar"),was=prev.bars[k];
    if(f&&was!=null&&+f.dataset.pct>+was&&!CALM.matches)f.animate([{filter:"brightness(1.7)"},{filter:"none"}],{duration:600,easing:EASE});
    if(prev.states[k]==="running"&&r.dataset.state!=="running"){var m=r.firstChild;
      m.animate(CALM.matches?[{opacity:.3},{opacity:1}]:[{transform:"scale(1.8)",filter:"brightness(1.8)"},{transform:"none",filter:"none"}],{duration:500,easing:EASE})}
  });
  p.querySelectorAll(".log .row").forEach(function(r){
    if(!prev.log[r.dataset.key])r.animate([{backgroundColor:"color-mix(in srgb, var(--agent) 28%, transparent)",opacity:.2},{backgroundColor:"transparent",opacity:1}],{duration:700,easing:EASE})});
}
function render(){
  var p=document.getElementById("pane"),prev=p.firstChild?snapshot(p):null,fresh=el("div");
  renderPane(fresh);
  if(p.firstChild)patch(p,fresh);else{while(fresh.firstChild)p.appendChild(fresh.firstChild)}
  tickBars();
  if(prev)animateChanges(p,prev);
}
// Patch the live tree toward the fresh one: nodes that match keep their place, scroll and
// hover, and only changed text, attributes and handlers are written.
function patch(live,fresh){
  var a=live.childNodes,b=fresh.childNodes,i;
  for(i=0;i<b.length;i++){
    var n=b[i],o=a[i];
    if(!o){live.appendChild(n.cloneNode(true));copyHandlers(live.lastChild,n);continue}
    if(o.nodeType!==n.nodeType||o.nodeName!==n.nodeName){live.replaceChild(n.cloneNode(true),o);copyHandlers(a[i],n);continue}
    if(n.nodeType===3){if(o.nodeValue!==n.nodeValue)o.nodeValue=n.nodeValue;continue}
    syncAttrs(o,n);o.onclick=n.onclick;
    patch(o,n);
  }
  while(a.length>b.length)live.removeChild(live.lastChild);
}
function syncAttrs(o,n){
  for(var i=o.attributes.length-1;i>=0;i--){var k=o.attributes[i].name;if(!n.hasAttribute(k))o.removeAttribute(k)}
  for(i=0;i<n.attributes.length;i++){var at=n.attributes[i];if(o.getAttribute(at.name)!==at.value)o.setAttribute(at.name,at.value)}
}
// cloneNode drops handler properties, so carry them across by walking both trees together.
function copyHandlers(c,n){if(n.nodeType!==1)return;c.onclick=n.onclick;for(var i=0;i<n.childNodes.length;i++)copyHandlers(c.childNodes[i],n.childNodes[i])}
function renderPane(p){
  p.textContent="";
  add(p,add(el("div","hd"),add(el("div"),span("b","FLIGHTDECK \u00b7 "),span("c-main b",S.model.toUpperCase()),span("b"," "+S.status.toUpperCase()),liveTag()),
    add(el("div"),span("c-main","\u25a0"),span("dim"," main  "),span("c-agent","\u25a0"),span("dim"," agents  "),span("c-gate","\u25a0"),span("dim"," gate"))));
  var foot=el("div","foot faint","1-6 expand \u00b7 f/s/o gate rows \u00b7 t theme \u00b7 esc back");
  var ex=expanded()||preview()||add(el("div","box faint"),"press 1-6 to open an agent");
  var ag=add(el("section","box c-agent agents fill"),lanes());
  if(LAYOUT>1){
    // Flat grid: each block is a named area; body[data-layout] picks the arrangement.
    var fg=el("div","grid flat");
    var tl=tail(),loops=el("div","a-loops");loops.appendChild(tl.firstChild);loops.appendChild(tl.firstChild);
    var log=el("div","a-log col");log.appendChild(tl.firstChild);log.firstChild.classList.add("fill");
    function area(n,node){var w=el("div","a-"+n+" col");w.appendChild(node);return w}
    ex.classList.add("fill");
    add(fg,area("main",mainCard()),area("gate",gateCard()),area("agents",ag),area("card",ex),loops,log);
    add(p,fg,foot);return;
  }
  var g=el("div","grid"),c1=el("div","col"),c2=el("div","col"),c3=el("div","col col3");
  add(c1,mainCard());
  add(c1,gateCard());
  // The list sizes to its rows; the detail below takes the rest of the column.
  ag.classList.remove("fill");ag.classList.add("lanes");ex.classList.add("fill");
  add(c2,ag,ex);
  add(c3,tail());
  add(p,add(g,c1,c2,c3),foot);
}
function toggleCard(i){view.card=view.card===i?null:i;render()}
function toggleGate(g){view.gate=view.gate===g?null:g;render()}
document.addEventListener("keydown",function(e){
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(/^[1-6]$/.test(e.key)&&S.agents[+e.key-1])toggleCard(+e.key-1);
  else if("fso".indexOf(e.key)>=0&&e.key.length===1)toggleGate(e.key);
  else if(LAYOUT===10&&(e.key==="["||e.key==="]")&&S.agents.length){view.card=((view.card||0)+(e.key==="]"?1:-1)+S.agents.length)%S.agents.length;render()}
  else if(e.key==="Escape"){view.card=null;view.gate=null;render()}
});
// The page polls the same file every 2s; only a changed feed restarts the running clocks.
var lastFeed="";
function takeFeed(d){lastOk=Date.now();var j=JSON.stringify(d);if(j===lastFeed)return;lastFeed=j;feedAt=Date.now();S=d;render()}
function load(){
  // From disk the plugin's feed is state.js (fetch is blocked on file://): reload it as a script each poll.
  if(location.protocol==="file:"){
    var old=document.getElementById("feed");if(old)old.remove();
    var s=document.createElement("script");s.id="feed";s.src="state.js?"+Date.now();
    s.onload=function(){if(window.FD_STATE){takeFeed(window.FD_STATE);window.FD_STATE=null}};
    s.onerror=function(){};document.head.appendChild(s);return;
  }
  fetch("state.json",{cache:"no-store"}).then(function(r){return r.ok?r.json():null}).then(function(d){if(d)takeFeed(d)}).catch(function(){});
}
