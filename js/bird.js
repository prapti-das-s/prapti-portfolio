/* Shared page-transition: ONE particle bird flies across the screen. As it passes, the old page is wiped away and the
   next page is revealed behind it. No black screens, no second bird. Used by every page. */
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

  var ease=function(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
  var D=1250, VT=!!(window.CSS&&CSS.supports&&CSS.supports('selector(::view-transition)'))&&typeof document.startViewTransition==='function';

  /* cross-page wipe is handled by the View Transitions API where it exists; the old page stays on screen until the bird reveals the new one */
  var st=document.createElement('style');
  st.textContent='@view-transition{navigation:auto}'+
    '::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}'+
    '::view-transition-old(root){z-index:1}::view-transition-new(root){z-index:2;clip-path:inset(0 100% 0 0)}'+
    '::view-transition-group(bird),::view-transition-old(bird),::view-transition-new(bird){animation:none}::view-transition-group(bird){z-index:3}';
  document.head.appendChild(st);

  /* the one bird: its position is read from the wipe animation's own clock, so the edge always rides on its body */
  function sweep(clock,done){
    size();cv.style.display='block';
    var span=Math.min(W*.5,880),t0=performance.now();
    (function f(now){
      var el=clock?clock():null,u=Math.min((el==null?(clock?0:now-t0):el)/D,1),e=ease(u),bx=-span*.7+e*(W+span*1.4),by=H*.5+Math.sin(u*6.283)*H*.1-Math.sin(u*3.14)*H*.06;
      cx.clearRect(0,0,W,H);
      cx.save();cx.translate(bx,by);bird(cx,(now-t0)/1000,span,Math.cos(u*6.283)*.1);cx.restore();
      if(u<1)requestAnimationFrame(f);else{cv.style.display='none';cv.style.viewTransitionName='';done&&done()}
    })(t0);
  }
  /* keyframes that follow the bird's exact easing, so the edge of the wipe rides on the bird's body */
  function frames(span){
    var k=[],N=48;
    for(var i=0;i<=N;i++){var u=i/N,e=ease(u),bx=-span*.7+e*(W+span*1.4),fr=Math.min(Math.max(bx/W,0),1);k.push({offset:u,clipPath:'inset(0 '+((1-fr)*100).toFixed(2)+'% 0 0)'})}
    k[N].clipPath='inset(0 0% 0 0)';return k;
  }
  /* wipe with the View Transition pseudo-element when it exists, else clip the live content directly */
  function run(target,done){
    size();var span=Math.min(W*.5,880),anim=null;
    var kf=frames(span);
    try{
      if(target==='vt')anim=de.animate(kf,{duration:D,easing:'linear',fill:'both',pseudoElement:'::view-transition-new(root)'});
      else anim=target.animate(kf,{duration:D,easing:'linear',fill:'both'});
    }catch(err){anim=null}
    sweep(anim?function(){return anim.currentTime}:null,function(){if(anim){try{anim.cancel()}catch(err){}}done&&done()});
  }

  var KEY='birdFlight';
  window.Bird={
    /* leave this page for another document: navigate at once; the next page's bird does the wiping */
    leave:function(url){
      if(busy)return;if(RM){location.href=url;return}
      try{sessionStorage.setItem(KEY,'1')}catch(e){}
      location.href=url;
    },
    /* change what is shown on this page: the bird wipes the old view away and reveals the new one */
    swap:function(fn){
      if(busy)return;if(RM){fn();return}
      busy=true;
      var fin=function(){busy=false};
      if(VT){
        var t=document.startViewTransition(function(){cv.style.viewTransitionName='bird';cv.style.display='block';fn()});
        t.ready.then(function(){run('vt',fin)}).catch(function(){fn();fin()});
      }else{
        var el=document.querySelector('.page.active')||document.body;
        fn();var nxt=document.querySelector('.page.active')||document.body;run(nxt,fin);
      }
    }
  };

  /* arriving from another page */
  var arrive=false;try{arrive=sessionStorage.getItem(KEY)==='1';sessionStorage.removeItem(KEY)}catch(e){}
  if(!RM){
    if('onpagereveal' in window){
      addEventListener('pagereveal',function(e){
        if(!e.viewTransition)return;
        cv.style.viewTransitionName='bird';cv.style.display='block';busy=true;
        e.viewTransition.ready.then(function(){run('vt',function(){busy=false})}).catch(function(){cv.style.display='none';busy=false});
      });
    }else if(arrive){
      /* browsers without cross-page view transitions: the new page is wiped in by the bird over its own background */
      busy=true;de.style.background=getComputedStyle(de).backgroundColor||'';
      var go=function(){run(document.body,function(){busy=false})};
      document.body?go():document.addEventListener('DOMContentLoaded',go);
      if(document.body)document.body.style.clipPath='inset(0 100% 0 0)';
    }
  }
  addEventListener('pageshow',function(e){if(e.persisted){cv.style.display='none';busy=false}});
  addEventListener('resize',function(){if(cv.style.display==='block'&&!busy)size()});
  /* any link marked data-go flies */
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[data-go]');if(!a||e.metaKey||e.ctrlKey||e.shiftKey)return;
    e.preventDefault();Bird.leave(a.getAttribute('href'));
  });
})();
