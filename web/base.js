"use strict";
// DOM helpers, agent bars and their live ticker.
var LAYOUT=Math.max(1,Math.min(10,+(new URLSearchParams(location.search).get("layout")||1)));document.documentElement.dataset.layout=LAYOUT;
var S=null, view={card:null,gate:null}, TRACK=40;
function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=String(text);return e}
function add(p){for(var i=1;i<arguments.length;i++){var c=arguments[i];if(c!=null)p.appendChild(typeof c==="string"?document.createTextNode(c):c)}return p}
function span(cls,text){return el("span",cls,text)}
function row(){var r=el("div","row");for(var i=0;i<arguments.length;i++)if(arguments[i])r.appendChild(arguments[i]);return r}
// Agent bar: fill against the typical run time; past it the bar pulses instead of claiming more.
// Widths are percentages so the bar scales with its column instead of being cut off.
// The feed is written only on events, so a running bar keeps moving here between feeds:
// elapsed grows from the feed's clock, measured against the typical time the fill implies.
var GUESS_S=300,feedAt=Date.now();
function secs(t){var p=String(t||"0").split(":").map(Number);return p.reduce(function(a,n){return a*60+(n||0)},0)}
function clockOf(s){s=Math.round(s);var m=Math.floor(s/60);return m>=60?Math.floor(m/60)+":"+("0"+m%60).slice(-2)+":"+("0"+s%60).slice(-2):m+":"+("0"+s%60).slice(-2)}
function typicalS(c){return c.over?Math.max(1,secs(c.t)):c.fill>0.01?secs(c.t)/c.fill:GUESS_S}
function tickBars(){
  var gone=(Date.now()-feedAt)/1000;
  document.querySelectorAll(".fillbar").forEach(function(f){
    if(f.dataset.typ){
      var el=+f.dataset.base+gone,r=el/+f.dataset.typ;
      f.dataset.fill=Math.min(0.95,r);f.classList.toggle("pulse",r>1);
      var clk=f.parentNode.nextSibling;if(clk&&clk.classList.contains("clk"))clk.textContent=clockOf(el);
    }
    fillSegs(f);
  });
}
// The segment count follows the bar's width, so a narrow window shows fewer, whole segments
// instead of cutting off the filled end.
var MAX_SEGS=20,segW=0;
function segsFit(bar){
  if(!segW){var probe=add(span("segs"),"▰▰▰▰▰▰▰▰▰▰");probe.style.cssText="position:absolute;visibility:hidden";document.body.appendChild(probe);segW=probe.getBoundingClientRect().width/10;probe.remove()}
  var w=bar.clientWidth;return w&&segW?Math.max(4,Math.min(MAX_SEGS,Math.floor(w/segW))):MAX_SEGS;
}
function fillSegs(f){
  var total=segsFit(f.parentNode),fill=+f.dataset.fill,n=Math.max(1,Math.min(total,Math.round(fill*total))),key=n+"/"+total;
  f.dataset.pct=Math.round(fill*100);if(f.dataset.segs===key)return;
  f.dataset.segs=key;f.textContent="▰".repeat(n);f.nextSibling.textContent="▱".repeat(total-n);
}
if(window.ResizeObserver)new ResizeObserver(function(){tickBars()}).observe(document.documentElement);
function agentBar(c,cls){
  // A feed from an older plugin carries only the timeline width, so its running bars use the guess.
  var run=c.state==="running",fill=c.fill!=null?c.fill:run?Math.min(0.95,secs(c.t)/GUESS_S):1;
  var done=span(stColor[c.state]+(c.over?" pulse":"")+" fillbar"),rest=span("track"),b=add(span(cls+" segs"),done,rest);
  b.style.display="flex";done.dataset.fill=fill;fillSegs(done);
  if(run){done.dataset.base=secs(c.t);done.dataset.typ=c.fill!=null?typicalS(c):GUESS_S}
  return b;
}
function gauge(pct,n,cls){var f=Math.max(0,Math.min(n,Math.round(pct/100*n)));return add(span("bar"),span(cls,"\u2501".repeat(f)),span("faint","\u2501".repeat(n-f)))}
function k(n){return n>=1000?Math.round(n/1000)+"k":String(n)}
function box(color){return el("section","box "+color)}
var stColor={running:"c-agent",done:"c-gate",error:"c-warn"};
var SPIN="\u280b\u2819\u2839\u2838\u283c\u2834\u2826\u2827\u2807\u280f",spinI=0;
var stMark={running:"\u280b",done:"\u2713",error:"\u2717"};
var vColor={allowed:"c-gate",classifier:"c-cleared",denied:"c-warn",pending:"c-amber"};
