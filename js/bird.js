/* Shared page-transition: a particle bird flies across the screen and carries you to the next page.
   Used by every page (index.html + site.html). Depart -> navigate -> arrive. */
(function(){
  var RM=matchMedia('(prefers-reduced-motion:reduce)').matches, KEY='birdFlight';
  var de=document.documentElement, cv=document.createElement('canvas'), cx=cv.getContext('2d');
  cv.setAttribute('aria-hidden','true');
  cv.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:99999;pointer-events:none;display:none';
  de.appendChild(cv);
  var W,H,DPR,busy=false;
  function size(){DPR=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;cx.setTransform(DPR,0,0,DPR,0,0)}
  var PAL=['rgba(140,110,255,','rgba(190,150,255,','rgba(160,110,245,','rgba(245,238,255,','rgba(226,184,87,'];
  var R=Math.random,P=[];
  for(var i=0;i<1700;i++){
    var kind=i<1300?0:i<1550?1:2; /* wing, body, head/tail */
    P.push({k:kind,s:Math.pow(R(),.8),v:R(),side:R()<.5?0:1,seed:R(),c:R()<.12?4:R()<.45?3:(R()*3|0),sz:1.4+R()*2.6,tri:R()<.35});
  }
  function pos(p,t,L){ /* side-view bird flying right; L = wing length */
    var x,y,flap=Math.sin(t*8.5), ph=-.55+(flap*.5+.5)*1.75;      /* wing angle */
    if(p.k===0){
      var r=p.s*L,sw=p.side?.12:-.04;
      var dx=-Math.sin(ph)*.45-.18+sw, dy=-Math.sin(ph);
      x=dx*r-(p.v*L*.2)*(1-p.s*.5)*Math.cos(ph*.4);
      y=-Math.sin(ph)*r*1.0+p.v*L*.07*p.s+(p.side?L*.03:0);
      x+=Math.sin(t*3+p.seed*20)*1.2;
    }else if(p.k===1){
      var a=p.seed*6.283,rr=Math.sqrt(p.v);x=Math.cos(a)*rr*L*.42;y=Math.sin(a)*rr*L*.1+Math.sin(t*8.5)*L*.02;
    }else{
      if(p.s<.5){var a2=p.seed*6.283;x=L*.46+Math.cos(a2)*L*.08*p.v;y=-L*.02+Math.sin(a2)*L*.08*p.v}   /* head */
      else{x=-L*.42-p.v*L*.3;y=(p.seed-.5)*L*.08*(1+p.v)+Math.sin(t*8.5)*L*.03*p.v}                        /* tail */
    }
    return [x,y];
  }
  function bird(c,t,span,rot){
    c.save();c.translate(0,0);c.rotate(rot);
    var L=span*.42;
    for(var i=0;i<P.length;i++){
      var p=P[i],q=pos(p,t,L),x=q[0],y=q[1],a=.55+.45*Math.sin(t*5+p.seed*60);
      c.fillStyle=c.strokeStyle=PAL[p.c]+a.toFixed(2)+')';
      if(p.tri){c.beginPath();var z=p.sz*1.7;c.moveTo(x,y-z);c.lineTo(x+z,y+z);c.lineTo(x-z,y+z);c.closePath();c.stroke()}
      else c.fillRect(x,y,p.sz,p.sz);
    }
    c.restore();
  }
  /* veil colour = the page's own background, so the sweep never reads as a black screen */
  function col(a){var m=(getComputedStyle(de).backgroundColor||'').match(/\d+/g)||[7,3,26];return 'rgba('+m[0]+','+m[1]+','+m[2]+','+a+')'}
  var ease=function(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
  function fly(mode,done){ /* mode 'out': black wipes in behind the bird; 'in': black wipes away ahead of it */
    size();cv.style.display='block';
    var span=Math.min(W*.5,880),D=1250,t0=performance.now();
    (function f(now){
      var u=Math.min((now-t0)/D,1),e=ease(u),bx=-span*.7+e*(W+span*1.4),by=H*.5+Math.sin(u*6.283)*H*.1-Math.sin(u*3.14)*H*.06;
      cx.clearRect(0,0,W,H);
      var edge=Math.max(bx-span*.15,0),g;
      if(mode==='out'){
        g=cx.createLinearGradient(edge-260,0,edge,0);g.addColorStop(0,col(0));g.addColorStop(1,col(1));
        cx.fillStyle=col(1);cx.fillRect(0,0,Math.max(edge-260,0),H);cx.fillStyle=g;cx.fillRect(Math.max(edge-260,0),0,Math.min(260,edge),H);
      }else{
        var s=Math.min(bx+span*.15,W);
        g=cx.createLinearGradient(s,0,s+260,0);g.addColorStop(0,''+col(1)+'');g.addColorStop(1,''+col(0)+'');
        cx.fillStyle=g;cx.fillRect(s,0,260,H);cx.fillStyle=col(1);cx.fillRect(s+260,0,W,H);
      }
      cx.save();cx.translate(bx,by);bird(cx,(now-t0)/1000,span,Math.cos(u*6.283)*.1);cx.restore();
      if(u<1)requestAnimationFrame(f);else{if(mode==='in')cv.style.display='none';else{cx.fillStyle=col(1);cx.fillRect(0,0,W,H)}done&&done()}
    })(t0);
  }
  window.Bird={
    /* leave this page for another document */
    leave:function(url){
      if(busy)return;if(RM){location.href=url;return}
      busy=true;try{sessionStorage.setItem(KEY,'1')}catch(e){}
      fly('out',function(){location.href=url});
    },
    /* change what is shown on this page while the bird flies past */
    swap:function(fn){
      if(busy)return;if(RM){fn();return}
      busy=true;fly('out',function(){fn();requestAnimationFrame(function(){cv.style.transition='opacity .6s ease';cv.style.opacity='0';setTimeout(function(){cv.style.display='none';cv.style.opacity='1';cv.style.transition='';busy=false},650)})});
    }
  };
  /* arriving from another page: no second bird, the new page simply eases in */
  var arrive=false;try{arrive=sessionStorage.getItem(KEY)==='1';sessionStorage.removeItem(KEY)}catch(e){}
  if(arrive&&!RM){
    var st=document.createElement('style');st.textContent='@keyframes pageIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}body{animation:pageIn .7s cubic-bezier(.2,.7,.2,1) both}';
    document.head.appendChild(st);
  }
  addEventListener('pageshow',function(e){if(e.persisted){cv.style.display='none';busy=false}});
  addEventListener('resize',function(){if(cv.style.display==='block'&&!busy)size()});
  /* any link marked data-go flies */
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[data-go]');if(!a||e.metaKey||e.ctrlKey||e.shiftKey)return;
    e.preventDefault();Bird.leave(a.getAttribute('href'));
  });
})();
