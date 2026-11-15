"use strict";
// Themes: "Claude" (the pane's own colours) plus Tabby community schemes (MIT, schemes.js).
// Scheme array: [bg, fg, color0..color15]; roles map onto ANSI slots the way terminals tint them.
var ROOT=document.documentElement, ROLE_DEFAULTS={};
["bg","text","dim","faint","track","main","agent","gate","cleared","arch","amber","warn"].forEach(function(v){ROLE_DEFAULTS[v]=getComputedStyle(ROOT).getPropertyValue("--"+v).trim()});
function applyTheme(name){
  var s=(window.TABBY_SCHEMES||{})[name];
  var m=s?balance({bg:s[0],text:s[1],dim:s[9]===s[1]?s[8]:mix(s[1],s[0]),faint:s[10],track:s[10],main:s[5],agent:s[6],gate:s[4],cleared:s[14],arch:s[7],amber:s[13],warn:s[3]},s.slice(2)):ROLE_DEFAULTS;
  Object.keys(m).forEach(function(k){ROOT.style.setProperty("--"+k,m[k])});
  try{localStorage.setItem("fd-theme",name)}catch(e){}
}
function lum(h){var c=[1,3,5].map(function(i){var v=parseInt(h.substr(i,2),16)/255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]}
function ratio(a,b){var x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
// Community schemes were made for terminals, not for this page: every role gets a contrast band
// on the background so text stays readable, dim stays above faint, and lanes stay apart.
var LANES=["main","agent","gate","arch","warn"];
function balance(m,ansi){
  var bg=m.bg;
  m.text=fit(m.text,bg,7,16);
  m.dim=fit(m.dim,bg,6,Math.max(6,ratio(m.text,bg)/1.15));
  m.faint=fit(m.faint,bg,4.5,ratio(m.dim,bg)/1.2);
  m.track=fit(m.track,bg,1.8,2.5);
  ["main","agent","gate","cleared","arch","amber","warn"].forEach(function(k){m[k]=fit(m[k],bg,4.5,21)});
  separate(m,ansi);
  return m;
}
// Moves c toward the far end (white or black) to reach lo, or toward bg to come down to hi.
function fit(c,bg,lo,hi){
  var r=ratio(c,bg);if(r>=lo&&r<=hi)return c;
  var end=r<lo?(ratio("#ffffff",bg)>ratio("#000000",bg)?"#ffffff":"#000000"):bg,goal=r<lo?lo:hi,a=0,b=1;
  for(var i=0;i<14;i++){var w=(a+b)/2;if((ratio(mixw(end,c,w),bg)<goal)===(r<lo))a=w;else b=w}
  return mixw(end,c,b);
}
function dist(a,b){return Math.hypot.apply(null,[1,3,5].map(function(i){return parseInt(a.substr(i,2),16)-parseInt(b.substr(i,2),16)}))}
// A lane too close to an earlier one takes the first ANSI colour that is far from all of them.
function separate(m,ansi){
  LANES.forEach(function(k,i){
    var prev=LANES.slice(0,i).map(function(p){return m[p]}),far=function(c){return prev.every(function(p){return dist(p,c)>=60})};
    if(far(m[k]))return;
    var pick=ansi.concat(["#e05050","#40c060","#5080ff","#e0c040","#d050d0","#40c0d0"]).map(function(c){return fit(c,m.bg,4.5,21)}).filter(far)[0];
    if(pick)m[k]=pick;
  });
}
function mixw(a,b,w){var p=function(h,i){return parseInt(h.substr(1+i*2,2),16)};var o="#";for(var i=0;i<3;i++){o+=("0"+Math.round(p(a,i)*w+p(b,i)*(1-w)).toString(16)).slice(-2)}return o}
function mix(a,b){var p=function(h,i){return parseInt(h.substr(1+i*2,2),16)};var o="#";for(var i=0;i<3;i++){o+=("0"+Math.round(p(a,i)*.62+p(b,i)*.38).toString(16)).slice(-2)}return o}
(function(){
  // Terminal-style picker: [<] name [>] , t / T cycle, click the name to search.
  var names=["Claude"].concat(Object.keys(window.TABBY_SCHEMES||{})),cur=0;
  var nameEl=document.getElementById("themeName"),inp=document.getElementById("themeFind"),dl=document.getElementById("themeList");

  function set(i){cur=(i+names.length)%names.length;nameEl.textContent=names[cur];applyTheme(names[cur])}
  var saved="Claude";try{saved=localStorage.getItem("fd-theme")||"Claude"}catch(e){}
  var q=new URLSearchParams(location.search).get("theme");if(q)saved=q;
  set(Math.max(0,names.indexOf(saved)));
  document.getElementById("themePrev").onclick=function(){set(cur-1)};
  document.getElementById("themeNext").onclick=function(){set(cur+1)};
  // Own list instead of <datalist>: themed, keyboard driven, previews on hover.
  var hits=[],hi=0,before=0;
  function fill(){var q=inp.value.toLowerCase();hits=names.map(function(n,i){return i}).filter(function(i){return names[i].toLowerCase().indexOf(q)>=0});
    hi=Math.max(0,Math.min(hi,hits.length-1));dl.textContent="";
    if(!hits.length){dl.appendChild(el("div","none faint","no match"));return}
    hits.forEach(function(ix,j){var d=el("div",(j===hi?"on ":"")+(ix===before?"cur":""),names[ix]);d.setAttribute("role","option");
      d.onmousedown=function(e){e.preventDefault();close(ix)};d.onmouseenter=function(){hi=j;mark();applyTheme(names[ix])};dl.appendChild(d)})}
  function mark(){Array.prototype.forEach.call(dl.children,function(d,j){d.classList.toggle("on",j===hi)});var c=dl.children[hi];if(c)c.scrollIntoView({block:"nearest"})}
  function open(){before=cur;nameEl.hidden=true;inp.hidden=false;dl.hidden=false;inp.value="";hi=Math.max(0,before);fill();mark();inp.focus()}
  function close(pick){inp.hidden=true;dl.hidden=true;nameEl.hidden=false;set(pick==null?before:pick)}
  nameEl.onclick=open;
  inp.oninput=function(){hi=0;fill();if(hits.length)applyTheme(names[hits[0]])};
  inp.onblur=function(){if(!inp.hidden)close(null)};
  inp.onkeydown=function(e){e.stopPropagation();
    if(e.key==="Escape"){e.preventDefault();close(null)}
    else if(e.key==="Enter"){e.preventDefault();close(hits.length?hits[hi]:null)}
    else if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();if(!hits.length)return;hi=(hi+(e.key==="ArrowDown"?1:-1)+hits.length)%hits.length;mark();applyTheme(names[hits[hi]])}};
  document.addEventListener("keydown",function(e){if(e.ctrlKey||e.metaKey||e.altKey)return;if(e.key==="t")set(cur+1);else if(e.key==="T")set(cur-1)});
})();
S=JSON.parse(document.getElementById("sample").textContent);
