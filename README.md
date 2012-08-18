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

This means more reliable results and 1/2 the tests.

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

### Large Test Suite

I aim to provide a large amount of test coverage for this platform (though it seems like a given in these
days of TDD).

Working with tap.io
===================

When developing on tap.io, you will implement a couple things:

1. Game-specific physics and event handling (code shared between client and server)
2. Game state rendering (client only)
3. Server code that instantiates your socket.io server
4. Client html to load the game

There are well-defined interfaces for 1 and 2. Details on all tasks, as well as information on how to 
run the example, are all provided below.

### Task 1. Game Engine
The game engine extension is javascript code that is shared between client and server. It contains the logic
of your game (*deterministic* physics and event handling). Here is a skeleton example (there is a full implementation
of the snake game in example/snake you can look at):

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

The game engine extension api is broken down into three functions: update, handle, and validate.

#### update(state)

This function should perform an *in place* update of the state object, according to the rules of your game. That
means, for example, it could contain code like the following:

```
for(var i = 0; i < state.players.length; i++)
  if(state.players[i].falling == true)
    state.players[i].y -= 10;
```

Note, it is crucial that the results of this function are deterministic! I may have mentioned that once or 
twice already...  For our purposes, deterministic means that, when given input state A, the function should 
**always** return B. Never C.  Whether it is running on node.js or Chrome or (should it ever get WebGL) IE, 
it should always return B.

That means no Math.random(). To have randomness, you should use server-generated events backed by Math.random() until 
I can provide a suitable replacement for the Math.random() function.  

#### handle(state, event)

This function should process the given event and alter the state according to the mechanics of your game. For example,
if your game has a *spawnMonster* event, your code might look like this:

```
if(event.data.type == 'spawnMonster')
  state.monsters.push({type: event.data.monsterType, x: event.data.monsterX, y: event.data.monsterY});
```

This code should also be deterministic. As much fun as I have explaining what that means, I'll refrain 
from insulting your intellect by doing so again.

#### validate(state, event)

This function should throw an exception if **event** is invalid, given the **state**. This can be used, 
for example, to prevent users from modifying each others positions by checking to see if
**event.senderSessionId** (secure field set by the server) matches *event.data.playerId**.

### Renderer

The second component you have to implement is the rendering engine, how your game actually shows up 
in the browser. Essentially, you will need to have some kind of object with a render function.
Here is an example skeleton from the snake project (see example/snake for a complete implementation):

```
window.SnakeRenderer = (function(){

  var SnakeRenderer = function(){ };

  SnakeRenderer.prototype.render = function(sessionId, state){
    // rendar!
  };

  return SnakeRenderer;
  
})();
```

The render() function takes the sessionId of the user you are rendering for, and the entire game state.

#### Quick Aside

The render function is actually rendering ```game.projectedState```, which is an
*optimistic*, *real-time* view of the game state. It is *optimistic* because the projected state
may be inconsistent with other clients. Inconsistencies in projected states occur when events are received that
have virtual timestamps less than virtual clock time (which moves forward at ~30 ticks per second). 
It is *real-time* because the projected state is our best guess at what the true state is at virtual clock time. 
Remember, we might not yet have received all events with virtual timestamps less than virtual clock time.

Internally, this works by maintaining a separate copy of the game state: a past state that is known 
to be consistent and all events received since. That other copy only gets 'bumped forward' when
we can guarantee that we have received all events that occurred before it, on the virtual timeline.

### Server Wrapper

Here is what a server wrapper might look like (taken from example/snake/server/snake.js):

```
// server-only dependencies
var network = require('../../../lib/server/network.js');
var game = require('../../../lib/server/game.js');

// shared dependencies
var engine = require('../../../lib/shared/engine.js');
var snake = require('../shared/snake-engine.js');

// plug in game engine
engine.Engine.plugins.push(snake.SnakeEngine);

// start the networking
var server = new network.Network(9585);
server.start();

// start the game manager
var game = new game.Game(server);
game.start();
```

This is the entry point to your socket.io server. It requires all the server modules and shared engine
code, and starts the server.

### Client Wrapper

Here is what your client wrapper might look like (taken from example/snake/client/home.html.ejs):

```
<html>
  <head>
    <style>
      div {
        width: 1024;
        height: 768;
        margin: auto;
        border: 2px solid;
        border-radius: 25px;
      }
    </style>
    <script type="text/javascript" src="http://code.jquery.com/jquery-1.8.0.min.js" ></script>
    <script type="text/javascript" src="<%= socketio %>/socket.io/socket.io.js" ></script>
    <% for(var i = 0; i < scripts.length; i++){ %>
      <script type="text/javascript" src="<%= baseurl %><%= scripts[i] %>" ></script>
    <% } %>
    <script type="text/javascript" defer="defer">
      $(function(){
        exports.Engine.plugins.push(exports.SnakeEngine);

        var socket = window.io.connect('<%= socketio %>'),
            game = new window.Game(socket),
            renderer = new window.SnakeRenderer(),
            renderLoop = new window.RenderLoop(game, renderer);
    </script>
  </head>
  <body>
  </body>
</html>
```

Basically, it sets up all the script tags your client will need, and constructs step-by-step the 
different components necessary for the game to run:

- a socket.io socket
- a window.Game (see lib/client/game.js)
- a window.SnakeRenderer (your renderer implementation)
- a window.RenderLoop (invokes your animation stuffs)

Running the Example
===================
After cloning the repository, you should run ```node webserver.js``` and ```node example/snake/server/snake.js```.
The ```webserver.js``` is the HTTP interface to the game files, and ```snake.js``` is the server wrapper.

Now you should be able to hit http://localhost:7787/snake.html in a couple different windows and see what happens.
I plan on hosting a live demo of this soon.

