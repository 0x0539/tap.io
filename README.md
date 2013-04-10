News
====
10-2012: The example game is live, with hosting by nodejitsu. Head on over to http://bumbleskunk.tap.io.jit.su/

Browser-based Multiplayer Games with tap.io
===========================================

Platform for building browser-based, distributed simulations/games. This is all possible thanks to the recent 
explosion of innovation in browser technology, including WebSockets, WebGL, and socket.io.

Tap.io systems use socket.io for communication. They can use anything (WebGL, canvas, jQuery) to render the game.

Running the Example
===================
After cloning the repository, you should run ```node example/snake/server/server.js```.  Now you should be 
able to hit http://localhost:7787/snake.html in a couple different windows and see what happens.

Working with tap.io
===================

To get started with tap.io, there is an example game in ```example/snake```. The project is structured into three
subdirectories:

1. ```shared```: contains engine code shared by the client and server, the meat of the application
2. ```client```: contains client-only code, the render javascript and the html file that hosts the game
3. ```server```: contains server-only code, the socket.io app which also serves client code over http

### Writing an Engine

In the example game, there is only one shared file, ```shared/snake-engine.js```. It implements all the logic 
of the game. It defines an object called ```SnakeEngine``` that meets a specific engine interface required by the framework.

```
(window || exports).SnakeEngine = (function(){
  ...
})();
```

**Note:** You may be confused by the ```(window || exports).``` idiom. It is used to write javascript that can run on 
both server AND client.  When it executes on a browser, ```window``` exists so ```window.SnakeEngine``` 
gets defined. When it executes in node.js, ```window``` does not exist so ```exports.SnakeEngine``` gets 
defined. Node.js developers will recognize that the exports object is the standard way to export functionality from a node module.

The SnakeEngine object exposes three important functions:

1. update(state) function
2. validate(state, event) function
3. handle(state, event) function

Every game must have at least one object that implements these interfaces.

#### Engine.update(state)

The Engine.update(state) function takes an input/output parameter **state** that is the entire state of the game.
It performs an **in-place** update of this state according to the game rules.  Put a different way, 
the Engine.update(state) function takes an input state and applies one timestep of physics to it.

For example, if the game has the notion of gravity, the gravity physics would take place in the Engine.update(state) 
function. It might look like this

```
MyEngine.update = function(state){
  // some stuff...

  // gravity
  for(var i = 0; i < state.players.length; i++)
    if(state.players[i].falling == true)
      state.players[i].y -= 10;

  // more stuff...
};
```

**Determinism!** It is crucial that the results of this function be deterministic. For tap.io purposes, deterministic 
means that two different clients executing the update function with the same input state should arrive at the 
same output state.  This does not mean it is impossible for your game to use pseudo-random numbers. An ARC4 RNG is 
included in tap.io whose state is folded into the overall game state, allowing clients to generate the same sequence 
of pseudo random numbers deterministically.

#### Engine.handle(state, event)

The handle function takes an input/output parameter **state** and an **event** to be applied to that state.
It performs an **in-place** update of the state according to the nature of the **event**.

For example, user input is modeled with events. The Engine.handle(state, event) function might contain
something like this:

```
MyEngine.handle = function(state, event){
  if(event.type == Events.CUSTOM){
    switch(event.data.which){
      case 'keyDown':
        state.players[event.data.sessionId].yVelocity += 1;
        break;
      case 'keyUp':
        state.players[event.data.sessionId].yVelocity -= 1;
        break;
    }
  }
}
```

This function must also be deterministic.

It's important to note the event type when handling it. Standard event types can be found in `lib/shared/constants.js`.
The CUSTOM type is used for all custom events.

#### Engine.validate(state, event)

The validate function should throw an exception if **event** is invalid, given the **state**. This can be used, 
for example, to prevent users from modifying each others positions by checking to see if
**event.senderSessionId** (secure field set by the server) matches *event.data.playerId**.

This function must also be deterministic.

### Writing a Server

tap.io does not provide an executable node.js application, only libraries for networking and graphics. It is up to API
users to determine how to serve their game content (HTML, JS, CSS) to clients.

For an example of such an application, see the server for the snake game in ```server/snake-engine.js```. It is 
essentially a node.js server that hosts client files over http and invokes the tap.io framework. Here are the steps taken (roughly):

```
var server = require('http').createServer(function(){ // serve ordinary http requests here });
server.listen(80);

// please include this line for safety
global.window = false;

// require framework libraries
var Network = require('../../../lib/server/network.js').Network,
    Game = require('../../../lib/server/game.js').Game,
    Engine = require('../../../lib/shared/engine.js').Engine,
    SnakeEngine = require('../shared/snake-engine.js').SnakeEngine; // <-- your engine implementation!

// plug in game engine
Engine.plugins.push(SnakeEngine);

// start the networking
var socket = new Network(server);
socket.start();

// start the game manager
var game = new Game(socket);

// ...
// initialize game.state here
// ...

// start the game itself
game.start();
```

### Writing a Client

Clients are browsers, and browsers need to see some HTML to get started. That means serving an HTML
page with some javascript on it to bootstrap the game. The first thing the client needs is the socket.io javascript:

```
<script type="text/javascript" src="http://your.socket.server/socket.io/socket.io.js"></script>
```

The next thing is to include every script under lib/shared *plus* any custom client JS (this includes 
the shared game engine object discussed earlier).  A few more lines will tie everything together:

```
window.Engine.plugins.push(window.SnakeEngine); // <-- engine implementation

var socket = window.io.connect(window.location.hostname),
    game = new window.Game(socket),
    renderer = new window.SnakeRenderer(), // <-- renderer implementation
    renderLoop = new window.RenderLoop(game, renderer);
```

To send an event such as user input, make the following call:

```
game.send(Constants.Events.CUSTOM, { ...data... });
```

The second argument to that call, the event data, will be available in the Engine.handle call
under event.data.

#### Renderer

To get the game to actually show up in the browser, a renderer is required.  The interface is an 
object with a render function.  Here is an example from the snake project:

```
window.SnakeRenderer = (function(){

  var SnakeRenderer = function(){ };

  SnakeRenderer.prototype.render = function(playerSessionId, state){
    // draw some canvas/webgl
  };

  return SnakeRenderer;
  
})();
```

The render() function takes the playerSessionId of the user you are rendering for and the game state.
