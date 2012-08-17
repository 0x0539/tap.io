Browser-based Multiplayer Games with tap.io
===========================================

Platform for building browser-based multiplayer games. This is all possible thanks to the recent 
explosion of innovation in browser technology, e.g. WebSockets, WebGL, and socket.io.

Tap.io game servers are built on socket.io and node.js. Clients also live on the socket.io platform, and
can use anything (WebGL, canvas, jQuery) to render the game.

Features
========

Here are some of the features tap.io is striving for:

### Shared Code Between Server and Client

A great deal of the codebase is shared between server and client (see /lib/shared). This 
includes the core game engine and just about everything except rendering (client-only) 
and networking (client and server function differently).

This means reliable results and keeps the labor costs of writing tests down.

### Efficient Use of Bandwidth

Once a client has been initialized, communication is kept to a minimum. Only essential information
is exchanged -- tiny event messages from clients (such as keyboard input events) and server-side events 
such as spawning monsters. Additionally, all communication is done over WebSockets (if supported 
by the browser), which reduces the overhead of repeatedly establishing TCP connections when compared
to protocols such as HTTP. 

### State as Pure Data

The state of the game is represented as pure data, and the game engine as stateless functions that
operate on that data. This clean separation allows us to do tricky things like update a client by
sending them a single JSON object without worrying about serialization, etc. It also means we can
persist the game state on disk in human readable form.

It is possible that users will be able to exploit the human-readability of game data. For example, you could
find out which chest to open merely by running a ```console.log(game.state.whereDatGold)``` in the javascript 
console. That problem may need to be solved by exposing other API's for the game, though I certainly hope
another solution presents itself.

### Clean API

When developing on tap.io, you will implement two things:

1. Game Engine Extension - physics, event handling implementation (client and server)
2. Rendering Engine Extension - state rendering (client only)

There are well-defined interfaces for both. For details, see the Game Engine Extension 
and Rendering Engine Extension sections below.

### Large Test Suite

I aim to provide a large amount of test coverage for this platform (though it seems like a given in these
days of TDD).

Game Engine Extension
=====================

The game engine extension is javascript code that is shared between client and server. It contains the logic
of your game (*deterministic* physics and event handling). Here is a skeleton example:

```
// define exports namespace for clients if it does not exist
if(typeof exports == 'undefined') window.exports = {};

exports.SnakeEngine = (function(){

  var SnakeEngine = {};

  SnakeEngine.update = function(state){ 
    // handle game physics deterministally
  };

  
  SnakeEngine.handle = function(state, event){ 
    // handle a single event deterministically
  };

  
  SnakeEngine.validate = function(state, event){ 
    // validate an event, throw exception if invalid (used to enforce security policies, etc)
  };

  return SnakeEngine;

})();
```

The game engine extension api is broken down into three functions.

### update(state)

This function should perform an *in place* update of the state object, according to the rules of your game. That
means, for example, it could contain code like the following:

```
for(var i = 0; i < state.players.length; i++)
  if(state.players[i].falling == true)
    state.players[i].y -= 10;
```

Note, it is crucial that the results of this function are deterministic! I may have mentioned that once or twice already...
For our purposes, deterministic means that, when given input state A, the function should **always** return B. Never C. 
Whether it is running on node.js or Chrome or (should it ever get WebGL) IE, it should always return B. You get the picture.

That means no Math.random(). To have randomness, you should use server-generated events backed by Math.random() until 
I can provide a suitable replacement for the Math.random() function.

### handle(state, event)

This function should process the given event and alter the state according to the mechanics of your game. For example,
if your game has a *spawnMonster* event, your code might look like this:

```
if(event.data.type == 'spawnMonster')
  state.monsters.push({type: event.data.monsterType, x: event.data.monsterX, y: event.data.monsterY});
```

This code should also be deterministic. As much fun as I have explaining what that means, I'll refrain from insulting your
intellect by doing so again.

### validate(state, event)

This function should throw an exception if **event** is invalid, given the **state**. This can be used, for example, to prevent users
from modifying each others positions by checking **event.senderSessionId** against **event.data.playerId**.

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

The interface basically amounts to two things:

1. invoking the superclass (Renderer) constructor with the Game object
2. implementing render

The render function should render ```this.game.projectedState```, which is an
optimistic, real-time view of the current state. It is optimistic because the projected state
may be inconsistent with other clients. Inconsistencies in projected states occur when events are received that
have virtual timestamps less than the current virtual clock (which moves forward at ~30 ticks per second). 
It is real-time because the projected state is our best guess at what the true state is at the current virtual clock. Remember,
we might not have received all events that were timestamped with times less than the current virtual clock.

Internally, this works by maintaining a separate copy of the game state: a past state that is known 
to be consistent and all events received since. That other copy only gets 'bumped forward' when
we can guarantee that we have received all events that occurred before it, on the virtual timeline.
