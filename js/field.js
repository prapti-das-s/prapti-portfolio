/* calm drifting shapes behind every inner page; they scatter away from the pointer */
(function(){
  var cv=document.getElementById('field');if(!cv)return;var c=cv.getContext('2d'),W,H,D,m={x:-999,y:-999},R=Math.random;
  var RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
  var COL=['72,140,255','140,230,255','51,191,242','235,247,255','255,184,41'];
  var P=[];for(var i=0;i<90;i++)P.push({x:R(),y:R(),vx:(R()-.5)*.00004,vy:(R()-.5)*.00004,z:6+R()*16,c:COL[R()*5|0],t:R()<.5,r:R()*6.28,ox:0,oy:0});
  function fit(){D=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*D;cv.height=H*D;c.setTransform(D,0,0,D,0,0)}
  addEventListener('resize',fit);fit();
  addEventListener('pointermove',function(e){m.x=e.clientX;m.y=e.clientY},{passive:true});
  (function f(){requestAnimationFrame(f);c.clearRect(0,0,W,H);
    P.forEach(function(p){p.x=(p.x+p.vx*16+1)%1;p.y=(p.y+p.vy*16+1)%1;
      var X=p.x*W+p.ox,Y=p.y*H+p.oy,dx=X-m.x,dy=Y-m.y,d=Math.hypot(dx,dy)||1;
      if(d<170){var k=(170-d)/170*6;p.ox+=dx/d*k;p.oy+=dy/d*k}p.ox*=.94;p.oy*=.94;
      c.strokeStyle='rgba('+p.c+',.55)';c.beginPath();
      if(p.t){var z=p.z;c.moveTo(X,Y-z);c.lineTo(X+z,Y+z);c.lineTo(X-z,Y+z);c.closePath()}else c.arc(X,Y,p.z*.6,0,6.283);
      c.stroke();if(RM)return});
  })();
})();
