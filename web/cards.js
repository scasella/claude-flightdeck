"use strict";
// The panels: main, gate, agent lanes, agent detail, loops and log.
function mainCard(){
  var b=box("c-main");
  add(b,row(span("c-main b t",S.model+" \u00b7 main"),span("r "+(S.status==="idle"?"dim":"c-main"),S.status==="idle"?"\u25cb idle":"\u25cf working")));
  b.classList.add("mainband");
  var c=S.ctx,meters=el("div","meters");
  function meter(label,pct,big,note){
    var m=el("div","meter");
    add(m,row(span("dim",label),note?span("faint t",note):null,span("r b"+(big?" bignum":""),pct+"%")));
    add(m,el("div","gwrap",null));m.lastChild.appendChild(gauge(pct,30,pct>=80?"c-warn":pct>=60?"c-amber":"c-main"));
    return m;
  }
  add(meters,meter("context",c.pct,true,k(c.tokens)+"/"+k(c.window)+(c.est?" est":"")),
    meter("5h",S.fiveH,false,""),
    meter("7d",S.sevenD,false,""));
  var facts=el("div","facts");
  [["cost","$"+S.cost.toFixed(2)],["effort",S.effort],["mode",S.mode],["requests",S.req],["last ttft",S.ttft+"s"]].forEach(function(f){
    add(facts,add(span("fact"),span("dim",f[0]+" "),span("b c-main",f[1])))});
  add(b,meters,facts);
  return b;
}
function gateCard(){
  var g=S.gate,b=box("c-gate");
  add(b,row(span("c-gate b","GATE \u00b7 permissions"),span("r dim",g.checks+" checks")));
  var strip=span("bar t");
  for(var i=0;i<g.strip.length;i++){var ch=g.strip[i];strip.appendChild(span(ch==="a"?"c-gate":ch==="d"?"c-warn":"c-cleared","\u25a0"))}
  add(b,row(strip));
  var counts=row(add(span(),span("c-gate","\u25a0 "),g.allowed+" allowed"),add(span(),span("c-cleared","\u25a0 "),g.classifier+" classifier"),add(span(),span("c-warn","\u2717 "),g.denied+" denied"));counts.classList.add("wraprow");add(b,counts);
  var keys=row();keys.classList.add("wraprow");
  [["f","file",g.file],["s","shell",g.shell],["o","other",g.other]].forEach(function(x){
    var s=add(span("key"+(view.gate===x[0]?" b c-gate":"")),span("dim","["),span("b c-gate",x[0]),span("dim","] "),x[1]+" "+x[2]+"  ");s.tabIndex=0;s.onclick=function(){toggleGate(x[0])};keys.appendChild(s)});
  add(b,keys);
  b.classList.add("fill");
  var keysShown=view.gate?[view.gate]:["f","s","o"];
  if(!view.gate)add(b,el("div","faint sec","recent checks"));
  keysShown.forEach(function(gk){(g.rows[gk]||[]).forEach(function(r){add(b,row(span(vColor[r.v]||"dim",r.v==="denied"?"\u2717":"\u25a0"),span("dim",r.v),span("t",r.d)))})});
  return b;
}
function lanes(){
  var a=S.agents,run=a.filter(function(x){return x.state==="running"}).length,frag=document.createDocumentFragment();
  add(frag,add(el("div","row sec"),span("b","agents"),span("dim","\u00b7 "+run+" running \u00b7 "+a.length+" total"),span("r faint","1-"+Math.min(6,a.length)+" expand")));
  if(!a.length){add(frag,el("div","faint","no subagents yet"));return frag}
  if(S.earlier)add(frag,el("div","faint","+"+S.earlier+" earlier"));
  a.forEach(function(c,i){
    var r=add(el("div","row lane"),span(stColor[c.state]+(c.state==="running"?" spin":""),stMark[c.state]),add(span("t lbl "+(view.card===i?"b":"")),span(view.card===i?"sel b":"faint",view.card===i?"> ":"  "),(i+1)+": "+c.label),
      agentBar(c,"r bar"),span("dim clk",c.t));
    r.dataset.key=i+":"+c.label;r.dataset.state=c.state;
    r.title=c.type+" · "+c.model+" · "+c.steps+" steps";r.tabIndex=0;r.onclick=function(){toggleCard(i)};frag.appendChild(r)});
  return frag;
}
function focusCard(i){
  // Layout 10: the open agent is the hero - meta, timeline, full tool trail, tool tally, answer.
  var c=S.agents[i];if(!c)return null;
  var b=box(c.state==="error"?"c-warn":c.state==="running"?"c-agent":"c-gate");b.classList.add("focus");
  add(b,row(span(stColor[c.state]+(c.state==="running"?" spin":""),stMark[c.state]),span("b t ftitle",(i+1)+": "+c.label),span("r dim","[ ] prev/next")));
  var meta=el("div","fmeta");
  [["type",c.type],["model",c.model],["state",c.state],["steps",c.steps],["elapsed",c.t]].forEach(function(m){
    add(meta,add(span(),span("dim",m[0]+" "),span("b "+(m[0]==="state"?stColor[c.state]:""),m[1])))});
  add(b,meta);
  add(b,agentBar(c,"ftrack bar"));
  var cols=el("div","fcols"),trail=el("div","ftrail"),tally=el("div","ftally");
  add(trail,el("div","faint sec","tool trail"));
  c.tools.forEach(function(t,j){var parts=t.split(" -> ");add(trail,row(span("faint",String(j+1).padStart(2," ")),span("c-agent b",parts[0]),span("t",parts.slice(1).join(" -> "))))});
  var counts={};c.tools.forEach(function(t){var n=t.split(" ")[0];counts[n]=(counts[n]||0)+1});
  add(tally,el("div","faint sec","tools used"));
  Object.keys(counts).forEach(function(n){add(tally,row(span("c-agent",n),span("r b",counts[n])))});
  add(cols,trail,tally);add(b,cols);
  add(b,el("div","faint sec","answer"));
  add(b,el("div","wrap fanswer",c.answer?c.answer:(c.state==="running"?"still working...":"no answer")));
  return b;
}
function expanded(){
  if(LAYOUT===10){if(view.card==null){var r=S.agents.findIndex(function(a){return a.state==="running"});view.card=r>=0?r:0}return focusCard(view.card)}
  var c=S.agents[view.card];if(!c)return null;
  var b=box(c.state==="error"?"c-warn":"c-agent");b.style.color="var(--dim)";
  add(b,el("div","t b",c.label));
  add(b,el("div","t dim",c.type+" \u00b7 "+c.model+" \u00b7 "+c.state+" \u00b7 "+c.steps+" steps"));
  c.tools.forEach(function(t){add(b,el("div","t","\u00b7 "+t))});
  if(c.answer)add(b,el("div","wrap dim","\u00bb "+c.answer));
  return b;
}
// With nothing picked, the detail panel shows the newest running agent (else the newest one).
function preview(){
  var a=S.agents;if(!a.length||LAYOUT===10)return null;
  var i=a.map(function(x){return x.state}).lastIndexOf("running");if(i<0)i=a.length-1;
  view.card=i;var b=expanded();view.card=null;
  if(b)b.insertBefore(el("div","faint","preview · press "+(i+1)+" to pin"),b.firstChild);
  return b;
}
function tail(){
  var f=document.createDocumentFragment(),l=S.loops;
  add(f,add(el("div","row sec"),span("b","other loops"),span("dim",l.seen+" seen \u00b7 "+l.active+" active"),span("faint","\u25cb".repeat(l.seen))));f.firstChild.lastChild.title=l.seen+" loops seen, "+l.active+" active";
  var t=S.lastTurn,b=box("c-main");
  add(b,row(span("c-gate","\u2713"),span("t","last turn "+t.secs+"s \u00b7 "+t.agents+" agents \u00b7 "+t.edits+" edit"),span("r c-main","+$"+t.cost.toFixed(2))));
  f.appendChild(b);
  var lg=box("c-agent log fill");add(lg,el("div","","session log"));
  S.log.slice(-40).forEach(function(e){var r=row(span("faint",e.at),span("c-agent b",e.src),span("r t",e.msg));r.dataset.key=e.at+e.src+e.msg;add(lg,r)});
  f.appendChild(lg);return f;
}
var lastOk=0;
function liveTag(){var t=span("live t");t.id="liveTag";paintLive(t);return t}
function paintLive(t){t=t||document.getElementById("liveTag");if(!t)return;
  if(location.protocol==="file:"){t.className="live faint";t.textContent="sample";return}
  var a=lastOk?Math.round((Date.now()-lastOk)/1000):-1;
  t.className="live "+(a<0||a>10?"c-warn":"c-gate");t.textContent=a<0?"no feed":a>10?"stale "+a+"s":"live"}
