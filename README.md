News
====
10-2012: The example game is live, with hosting by nodejitsu. Head on over to http://bumbleskunk.tap.io.jit.su/

Browser-based Multiplayer Games with tap.io
===========================================

Platform for building browser-based simulations/games. This is all possible thanks to the recent 
explosion of innovation in browser technology, including WebSockets, WebGL, and socket.io.

Tap.io systems use socket.io for communication. They can use anything (WebGL, canvas, jQuery) to render the game.

Running the Example
===================
After cloning the repository, you should run ```node webserver.js``` and ```node example/snake/server/snake.js```.
The ```webserver.js``` is the HTTP interface to the game files, and ```snake.js``` is the server wrapper.

Now you should be able to hit http://localhost:7787/snake.html in a couple different windows and see what happens.

Working with tap.io
===================

To get you started with tap.io, there is an example game in ```example/snake```. The project is structured into three
subdirectories:

1. ```shared```: contains engine code shared by the client and server, the meat of the application
2. ```client```: contains client-only code, the render javascript and the html file that hosts the game
3. ```server```: contains server-only code, the socket.io app which also serves client code over http

I'll walk through the example, which will hopefully get you started on your way to building your own tap.io game.

### Writing an Engine

There is only one shared file, ```shared/snake-engine.js```. It implements all the logic of the game. It defines an
object called ```SnakeEngine``` that meets a specific engine interface required by the framework.

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

### Server

You also need to implement a node.js application! Remember, tap.io is just a framework;
it does not attempt to provide a node.js server application for you. This gives you more flexibility.
I might at some point provide users with a default server implementation.

You can find the server for the snake game in ```server/snake-engine.js```. It is essentially a node.js server 
that hosts client files over http and invokes the tap.io framework. Here are the steps you will have to take:

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

I will try to package this boilerplate stuff more nicely at some later date.

### Client

Being browser based, clients require some JS in order to get the game to load. It's up to you to figure
out how to serve these files to them. For the snake game I made the node.js application aware of
the client files so that it could serve them over HTTP. I recommend this approach.

The first thing you have to do is get the socket.io javascript. Usually, it is a script tag like this:

```
<script type="text/javascript" src="http://your.socket.server/socket.io/socket.io.js"></script>
```

The next thing you have to do is include every script under lib/shared. I know that's a lot of script tags.
One day, I plan to provide a single JS file containing all of the tap.io scripts. For now, just include 
everything separately.

After you've included the necessary scripts, you'll need to execute some JS to get the game running:

```
window.Engine.plugins.push(window.SnakeEngine); // <-- your engine implementation

var socket = window.io.connect(window.location.hostname),
    game = new window.Game(socket),
    renderer = new window.SnakeRenderer(), // <-- your renderer implementation
    renderLoop = new window.RenderLoop(game, renderer);
```

I'll explain the renderer in the next section.

Now you will actually need to know how to emit events, e.g. in response to user input. It's really simple, 
actually. Just use code like this:

```
var eventData = {...};
game.emit('gameevent', eventData);
```

When you process the event in your engine, eventData can be accessed under event.data.

#### Renderer

To get the game to actually show up in the browser, you have to implement a renderer.  The interface is simple,
it is an object with a render function.  Here is an example from the snake project:

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
adjust the camera), and the game state.
