News
====
10-2012: The example game is live, with hosting by nodejitsu. Head on over to http://bumbleskunk.tap.io.jit.su/

Browser-based Multiplayer Games with tap.io
===========================================

Platform for building browser-based simulations/games. This is all possible thanks to the recent 
explosion of innovation in browser technology, including WebSockets, WebGL, and socket.io.

Tap.io systems use socket.io for communication. They can use anything (WebGL, canvas, jQuery) to render the game.

Working with tap.io
===================

To get you started with tap.io, there is an example game in ```example/snake```. The project is structured into three
subdirectories:

1. ```example/snake/shared/```: contains engine code shared by the client and server, the meat of the application
2. ```example/snake/client/```: contains client-only code, the render javascript and the html file that hosts the game
3. ```example/snake/server/```: contains server-only code, the socket.io app which also serves client code over http

I'll walk through the example, which will hopefully get you started on your way to building your own tap.io game.

### Writing an Engine

There is only one source file for the snake engine, ```example/snake/shared/snake-engine.js```. It defines an
object called ```SnakeEngine``` that contains all the logic of the game. The declaration looks like this:

```
(window || exports).SnakeEngine = (function(){
  ...
})();
```

**Note:** You may be confused by the ```(window || exports).``` idiom. I use it to write javascript that can run on 
both server AND client.  When this javascript executes on a browser, ```window``` exists so ```window.SnakeEngine``` 
gets defined. When we are running in node.js, ```window``` does not exist so ```exports.SnakeEngine``` gets 
defined. Node.js developers will recognize that the exports object is how you export functionality from a node module.

The SnakeEngine object exposes three important functions:

1. update(state) function
2. validate(state, event) function
3. handle(state, event) function

Every game must have an object that implements these interfaces; it is a core part of the tap.io API.

#### Engine.update(state)

The Engine.update(state) function takes an input/output parameter **state** that is the entire state of the game.
It performs an **in-place** update of this state according to the rules of your game.  Put a different way, 
the Engine.update(state) function takes an input state and applies one timestep of physics to it.

For example, if your game has the notion of gravity, it would go in the Engine.update(state) function. You might
have some code like this:

```
for(var i = 0; i < state.players.length; i++)
  if(state.players[i].falling == true)
    state.players[i].y -= 10;
```

**Determinism!** It is crucial that the results of this function be deterministic. For our purposes, deterministic 
means that two different clients executing the update function with the same input state should arrive at the 
same output state.  You may be wondering how to implement randomness under this constraint. Not to worry, there is 
an API for that. I'll get into it later.

#### Engine.handle(state, event)

The handle function takes an input/output parameter **state** and an **event** to be applied to that state.
It performs an **in-place** update of the state according to the nature of the **event**.

For example, user input is modeled with events. I'll explain how to emit these events later. For now, 
just worry about handling them in your engine. The Engine.handle(state, event) function might contain
something like this:

```
if(event.type == 'gameevent'){
  switch(event.data.type){
    case 'keyDown':
      state.players[event.data.sessionId].yVelocity += 1;
      break;
    case 'keyUp':
      state.players[event.data.sessionId].yVelocity -= 1;
      break;
  }
}
```

This function must be deterministic.

#### Engine.validate(state, event)

The validate function should throw an exception if **event** is invalid, given the **state**. This can be used, 
for example, to prevent users from modifying each others positions by checking to see if
**event.senderSessionId** (secure field set by the server) matches *event.data.playerId**.

This function must be deterministic (careful that errors are thrown deterministically).

### Task 2. Renderer

The second component you have to implement is the rendering engine, how your game actually shows up 
in the browser. Essentially, you will need to have some kind of object with a render function.
Here is an example skeleton from the snake project (see example/snake for a complete implementation):

```
window.SnakeRenderer = (function(){

  var SnakeRenderer = function(){ };

  SnakeRenderer.prototype.render = function(playerSessionId, state){
    // rendar!
  };

  return SnakeRenderer;
  
})();
```

The render() function takes the playerSessionId of the user you are rendering for (so that you can
adjust the camera), and the entire game state.

#### Quick Rant

The render function is actually rendering ```game.projectedState```, which is an
*optimistic*, *real-time* view of the game state. It is *optimistic* because the projected state
may be inconsistent with other clients. Inconsistencies in projected states occur when events are received that
have virtual timestamps less than virtual clock time (which moves forward at ~30 ticks per second). 
It is *real-time* because the projected state is our best guess at what the true state is at virtual clock time. 
Remember, we might not yet have received all events with virtual timestamps less than virtual clock time.

Internally, this works by maintaining a separate copy of the game state: a past state that is known 
to be consistent and all events received since. That other copy only gets 'bumped forward' when
we can guarantee that we have received all events that occurred before it, on the virtual timeline.

### Task 3. Server Wrapper

Here is what a server wrapper might look like (taken from example/snake/server/snake.js):

```
// required at the top of every file, allows us to use the (window || exports) idiom in node.js files (otherwise
// you will get "window is undefined" errors
global.window = false;

// server-only dependencies
var Network = require('../../../lib/server/network.js').Network,
    Game = require('../../../lib/server/game.js').Game,
    Engine = require('../../../lib/shared/engine.js').Engine,
    FREED = require('../../../lib/shared/freed/freed.js').FREED,
    SnakeEngine = require('../shared/snake-engine.js').SnakeEngine;

// plug in game engine
Engine.plugins.push(SnakeEngine);

// start the networking
var server = new Network(9585);
server.start();

// start the game manager
var game = new Game(server);
game.start();
```

This is the entry point to your socket.io server. It requires all the server modules and shared engine
code, and starts the server.

### Task 4. Client Wrapper

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
      }
    </style>
    <script type="text/javascript" src="http://code.jquery.com/jquery-1.8.0.min.js" ></script>
    <script type="text/javascript" src="<%= socketio %>/socket.io/socket.io.js" ></script>
    <% for(var i = 0; i < scripts.length; i++){ %>
      <script type="text/javascript" src="<%= baseurl %><%= scripts[i] %>" ></script>
    <% } %>
    <script type="text/javascript" defer="defer">
      $(function(){
        window.Engine.plugins.push(window.SnakeEngine);

        var socket = window.io.connect('<%= socketio %>'),
            game = new window.Game(socket),
            renderer = new window.SnakeRenderer(),
            renderLoop = new window.RenderLoop(game, renderer);

        $('html,body').on('keyup', function(e){
          switch(e.which){
            case 38:
              game.emit('gameevent', {type: 'keyNorth'});
              break;
            case 40:
              game.emit('gameevent', {type: 'keySouth'});
              break;
            case 37:
              game.emit('gameevent', {type: 'keyWest'});
              break;
            case 39:
              game.emit('gameevent', {type: 'keyEast'});
              break;
          }
        });
      });
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

