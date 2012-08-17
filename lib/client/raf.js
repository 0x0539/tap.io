// taken from http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.rAF = (function(){
  return window.requestAnimationFrame       || 
         window.webkitRequestAnimationFrame || 
         window.mozRequestAnimationFrame    || 
         window.oRequestAnimationFrame      || 
         window.msRequestAnimationFrame     || 
         function(callback){ 
           window.setTimeout(callback, 1000 / 30); 
         };
})();