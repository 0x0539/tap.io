Browser-based Multiplayer Games with tap.io
===========================================

Platform for building browser-based multiplayer games. This is all possible thanks to the recent 
explosion of innovation in browser technology, e.g. WebSockets, WebGL, and socket.io.

Tap.io game servers are built on socket.io and node.js. Clients also live on the socket.io platform, and
can use anything (WebGL, canvas, jQuery) to render the game.

Features
========
Here are some of the features I am striving for:

Clean API
---------
When developing on tap.io, you will implement two things:

1. Game Engine Extension - physics, event handling implementation (client and server)
2. Rendering Engine Extension - state rendering (client only)

For more information, see the Game Engine Extension and Rendering Engine Extension sections below.


Shared Code Between Server and Client
-------------------------------------
The 

Efficient Bandwidth Use
-----------------------

Large Test Suite
----------------

Game Engine Extension
=====================
The game engine extension is javascript code that is shared between client and server. It contains the logic
of your game (*deterministic* physics and event handling). Here is a skeleton example:

```
// define exports namespace for clients if it does not exist
if(typeof exports == 'undefined') window.exports = {};

exports.SnakeEngine = (function(){

  var SnakeEngine = {};

  // handle game physics deterministally
  SnakeEngine.update = function(state){ };

  // handle a single event
  SnakeEngine.handle = function(state, event){ };

  // validate the event, throw exception if invalid (used to enforce security policies, etc)
  SnakeEngine.validate = function(state, event){ };

  return SnakeEngine;

})();
```

The extension api is broken down into three functions:

The update(state) function
--------------------------
This function should perform an *in place* update of the state object, according to the rules of your game. That
means, for example, it could contain code like the following:

```
for(var i = 0; i < state.players.length; i++)
  if(state.players[i].falling == true)
    state.players[i].y -= 10;
```

Note, it is crucial that the results of this function are deterministic! That means there should not be randomness
used to determine the progression of the state. If you want random events or anything like that, you should use
events.

The handle(state, event) function
---------------------------------
This function should process the given event and alter the state according to the mechanics of your game. For example,
if your game has a *spawnMonster* event, your code might look like this:

```
if(event.data.type == 'spawnMonster')
  state.monsters.push({type: event.data.monsterType, x: event.data.monsterX, y: event.data.monsterY});
```

This code should also be deterministic.

Rendering Engine Extension
==========================
The rendering engine is how your game actually shows up in the browser. You will need to 'subclass' the Renderer 
class on the client. Here is an example that renders some internals of the game to a page with every render loop:

```
window.SnakeRenderer = (function(){

  var SnakeRenderer = function(game){
    window.Renderer.call(this, game); // call super constructor
  };

  // set up inheritance from Renderer
  var Surrogate = function(){};
  Surrogate.prototype = window.Renderer.prototype;
  SnakeRenderer.prototype = new Surrogate();
  SnakeRenderer.prototype.constructor = SnakeRenderer;

  // magic!
  SnakeRenderer.prototype.render = function(){
    if(this.game.projectedState == null)
      return; // nothing to do

    if(this.game.sessionId == null)
      throw new Error('no session id set. who am i?');

    var state = this.game.projectedState,
        sessionId = this.game.sessionId;

    $('body').html([
      '<h2>Safe State</h2>',
      '<b>clock<b> is ' + this.game.state.clock,
      '<b>vt</b> is ' + this.game.state.vt,
      '<b>event count</b> is ' + this.game.state.events.length,
      '<b>player count</b> is ' + this.game.state.sessionIds.length,
      '<h2>Projected State</h2>',
      '<b>clock</b> is ' + state.clock,
      '<b>vt</b> is ' + state.vt,
      '<b>event count</b> is ' + state.events.length,
      '<b>player count</b> is ' + state.sessionIds.length
    ].join('<br/>'))


    // handle teh rendar!
  };

  return SnakeRenderer;
  
})();
```
