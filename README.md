News
====
04-2013: The game is still up, but it is using an older version of the engine which is not backwards compatible. The game will be ported to the new API soon.

10-2012: The example game is live. Head on over to http://bumbleskunk.tap.io.jit.su/ 

Browser-based Multiplayer Games with tap.io
===========================================
Platform for building browser-based, distributed simulations/games. This is all possible thanks to the recent 
explosion of innovation in browser technology, including WebSockets, WebGL, and socket.io.

Tap.io systems use socket.io for communication. They can use anything (WebGL, canvas, jQuery) to render the game.

Installing
==========
```
npm install tap.io
```

Docs Coming
===========
There used to be a fair amount of documentation in this README, but it was deleted due to a restructuring of the code. New things have been implemented
such as preservation of prototypes when serializing objects and parts of the code did not really fit, such as the FREED 3d stuff.

Additionally, the philosophy of tap.io has changed positioning from being a library you build a server around to being a reusable platform that you plug into. The
bare elements are still exposed if you want to write your own server, but there is now a sensible default application for you to build your game around
if you don't mind.

Fresh documentation will come once the tests and example game have been migrated to the new API, as the migration may have an impact on the API that's ultimately chosen.
