var Cloner = function(){};
Cloner.prototype.clone = function(object){
  return Serializer.deserialize(Serializer.serialize(object));
};

var Events = function(){
  // All custom events should use this type.
  this.CUSTOM = 'CustomEvent';

  // Generated internally but clients may find them useful enough to pay attention to.
  this.NEW_SESSION = 'NewSessionEvent';
  this.END_SESSION = 'EndSessionEvent';

  // For internal use.
  this.EMPTY = 'EmptyEvent';
  this.PING = 'PingEvent';
  this.PONG = 'PongEvent';
  this.BOOTSTRAP = 'Bootstrap';
};

var Engine = function(){
  this.plugins = [];
};
Engine.prototype.calculateSafeZone = function(state){
  var safeZone = {};

  // initialize for all sessions that connected before this vt but have not yet disconnected
  for(var i = 0; i < state.sessionIds.length; i++)
    safeZone[state.sessionIds[i]] = state.vt;

  for(var i = 0; i < state.events.length; i++){
    var event = state.events[i];
    switch(event.type){
      case Events.NEW_SESSION:
        safeZone[event.data.sessionId] = event.vt;
        break;
      case Events.END_SESSION:
        delete safeZone[event.data.sessionId];
        break;
      default:
        safeZone[event.senderSessionId] = event.vt;
        break;
    }
  }

  return safeZone;
};
Engine.prototype.calculateSafeAdvancePoint = function(safeZone){
  var safeAdvancePoint = null;

  // calculate min across all safe zones
  for(var sessionId in safeZone){
    var vt = safeZone[sessionId];

    if(safeAdvancePoint == null || vt < safeAdvancePoint)
      safeAdvancePoint = vt;
  }

  return safeAdvancePoint;
};
Engine.prototype.safelyAdvance = function(state){
  var safeZone = this.calculateSafeZone(state),
      safeAdvancePoint = this.calculateSafeAdvancePoint(safeZone);

  if(safeAdvancePoint != null && safeAdvancePoint > state.vt)
    this.advanceTo(state, safeAdvancePoint);
};
Engine.prototype.advanceTo = function(state, endVt){
  // applies events from game.events up to the specified time
  for(; state.vt < endVt; state.vt++){

    // handle physics at current vt
    for(var i = 0; i < this.plugins.length; i++)
      this.plugins[i].update(state);

    // handle events at current vt
    while(state.events.length > 0 && state.events[0].vt == state.vt)
      this.handle(state, state.events.shift());
  }
};
Engine.prototype.handle = function(state, event){
  try{
    this.validate(state, event);
  }catch(error){
    return;
  }

  switch(event.type){
    case Events.NEW_SESSION:
      state.sessionIds.push(event.data.sessionId);
      state.sessionIds.sort();
      break;
    case Events.END_SESSION:
      state.sessionIds = Utilities.spliceOut(state.sessionIds, event.data.sessionId);
      break;
  }

  for(var i = 0; i < this.plugins.length; i++)
    this.plugins[i].handle(state, event);
};
Engine.prototype.validate = function(state, event){
  if(event.vt == null)
    throw new Error('event vt missing or wrong type');

  if(event.senderSessionId == null)
    throw new Error('sender session id missing or wrong type');

  switch(event.type){
    case Events.END_SESSION:
    case Events.NEW_SESSION:
      if(event.senderSessionId != 0)
        throw new Error('secure message sent from insecure session ' + event.senderSessionId);

      if(event.data.sessionId == null)
        throw new Error('missing data.sessionId or wrong type');

      if(event.data.sessionId == 0)
        throw new Error('data.sessionId refers to server');

      break;
    case Events.CUSTOM:
      break;
    case Events.EMPTY:
      break;
    default:
      throw new Error('invalid event type');
  }
  for(var i = 0; i < this.plugins.length; i++)
    this.plugins[i].validate(state, event);
};

var Parameters = function(){
  // game loop period
  this.vtPeriodInMillis = 1000/30;
  this.eventDelayMillis = 250;
};

var Random = function(seed){
  this.digits = 52;
  this.width = 256;
  this.chunks = 6;
  this.startdenom = Math.pow(this.width, this.chunks);
  this.significance = Math.pow(2, this.digits);
  this.overflow = this.significance * 2;

  this.key = [];

  this.mixkey(this.flatten(seed, 3), this.key);

  this.keylen = this.key.length;
  this.i = 0;
  this.j = 0;
  this.S = [];

  if(!this.keylen)
    this.key = [this.keylen++];

  for(var i = 0; i < this.width; i++)
    this.S[i] = i;

  var t, u, j = 0;

  for(var i = 0; i < this.width; i++){
    t = this.S[i];
    j = this.lowbits(j + t + this.key[i % this.keylen]);
    u = this.S[j];
    this.S[i] = u;
    this.S[j] = t;
  }

  this.arc4g(this.width);

  exports.Serializer.registerInstance(this, Random);
};
Random.prototype.arc4random = function(){
  var n = this.arc4g(this.chunks);
  var d = this.startdenom;
  var x = 0;
  while (n < this.significance) {
    n = (n + x) * this.width;
    d *= this.width;
    x = this.arc4g(1);
  }
  while (n >= this.overflow) {
    n /= 2;
    d /= 2;
    x >>>= 1;
  }
  return (n + x) / d;
};
Random.prototype.arc4g = function(count){
  var s = this.S,
      i = this.lowbits(this.i + 1),
      t = s[i],
      j = this.lowbits(this.j + t),
      u = s[j];

  s[i] = u;
  s[j] = t;

  var r = s[this.lowbits(t + u)];

  while (--count) {
    i = this.lowbits(i + 1); 
    t = s[i];
    j = this.lowbits(j + t); 
    u = s[j];

    s[i] = u;
    s[j] = t;

    r = r * this.width + s[this.lowbits(t + u)];
  }

  this.i = i;
  this.j = j;

  return r;
};
Random.prototype.flatten = function(obj, depth){
  var result = [],
      typ = typeof(obj);
  if (depth && typ == 'object') {
    for (var prop in obj) {
      if (prop.indexOf('S') < 5) {    // Avoid FF3 bug (local/sessionStorage)
        try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
      }
    }
  }
  return (result.length ? result : obj + (typ != 'string' ? '\0' : ''));
};
Random.prototype.mixkey = function(seed, key){
  seed += '';                         // Ensure the seed is a string
  var smear = 0;
  for (var j = 0; j < seed.length; j++) {
    key[this.lowbits(j)] =
      this.lowbits((smear ^= key[this.lowbits(j)] * 19) + seed.charCodeAt(j));
  }
  seed = '';
  for (j in key) { seed += String.fromCharCode(key[j]); }
  return seed;
};
Random.prototype.lowbits = function(n){
  return n & (this.width - 1);
};

var Serializer = function(){
  this.constructors = [];

  // Put all internal type registrations here.
  this.registerType(Random);
};
Serializer.prototype.isFlat = function(object){
  return object == null 
    || typeof object == 'boolean' 
    || typeof object == 'number' 
    || typeof object == 'string' 
    || typeof object == 'xml';
};
Serializer.prototype.registerType = function(constructor){
  constructor.typeId = this.constructors.length;
  this.constructors.push(constructor);
};
Serializer.prototype.registerInstance = function(instance, constructor){
  instance.typeId = constructor.typeId;
};
Serializer.prototype.reapplyInstanceType = function(instance){
  instance.__proto__ = this.constructors[instance.typeId].prototype;
};
Serializer.prototype.hasInstanceType = function(instance){
  return typeof instance.typeId == 'number';
};
Serializer.prototype.isNormalizable = function(thing){
  return this.isFlat(thing) || typeof thing == 'object';
};
Serializer.prototype.normalizeArray = function(array, visited, normalized){
  // get a normalized array with references
  var r = [];
  for(var i = 0; i < array.length; i++)
    if(this.isNormalizable(array[i]))
      r.push(this.normalize(array[i], visited, normalized));
  return r;
};
Serializer.prototype.normalizeObject = function(object, visited, normalized){
  // gets a normalized object with references
  var r = {};
  for(var k in object)
    if(this.isNormalizable(object[k]))
      r[k] = this.normalize(object[k], visited, normalized);
  return r;
};
Serializer.prototype.normalizeArrayOrObject = function(node, visited, normalized){
  // normalizing something, dont know what it is yet
  return node instanceof Array ?
    this.normalizeArray(node, visited, normalized) :
    this.normalizeObject(node, visited, normalized);
};
Serializer.prototype.visit = function(node, visited, normalized){
  // add object to list of visited objects, and store the normalized version of the object
  var index = visited.length;

  visited.push(node);
  normalized.push(null); // save the spot for the next operation

  normalized[index] = this.normalizeArrayOrObject(node, visited, normalized);

  return index;
};
Serializer.prototype.find = function(object, array){
  // get pointer to already visited object, -1 if unvisited
  for(var i = 0; i < array.length; i++)
    if(object == array[i])
      return i;
  return -1;
};
Serializer.prototype.getNormalizedObjectIndex = function(node, visited, normalized){
  // see if we have already visited this node
  var index = this.find(node, visited);

  // haven't visited it yet, so visit it!
  if(index == -1) index = this.visit(node, visited, normalized);

  return index;
}
Serializer.prototype.normalize = function(object, visited, normalized){
  // flat objects are by definition normalized
  if(this.isFlat(object)) 
    return object;

  // normalize this object (or find a cross reference that is already normalized)
  var objectIndex = this.getNormalizedObjectIndex(object, visited, normalized);

  // return an object reference
  return {$ref: objectIndex};
};
Serializer.prototype.dereference = function(value, denormalized){
  return this.isFlat(value) ? value : denormalized[value.$ref];
};
Serializer.prototype.denormalizeArray = function(normalizedArray, denormalizedArray, denormalized){
  for(var i = 0; i < normalizedArray.length; i++)
    denormalizedArray.push(this.dereference(normalizedArray[i], denormalized));
};
Serializer.prototype.denormalizeObject = function(normalizedObject, denormalizedObject, denormalized){
  for(var k in normalizedObject)
    denormalizedObject[k] = this.dereference(normalizedObject[k], denormalized);
  if(this.hasInstanceType(denormalizedObject))
    this.reapplyInstanceType(denormalizedObject);
};
Serializer.prototype.denormalizeDeepObject = function(normalized, denormalizedObject, denormalized){
  if(normalized instanceof Array)
    this.denormalizeArray(normalized, denormalizedObject, denormalized);
  else
    this.denormalizeObject(normalized, denormalizedObject, denormalized);
};
Serializer.prototype.layoutDenormalizedArray = function(normalized){
  var denormalized = [];

  for(var i = 0; i < normalized.length; i++){
    var object = normalized[i];
    if(this.isFlat(object))
      throw new Error('normalized array should not contain flat objects');
    // create initial value
    denormalized.push(object instanceof Array ? [] : {});
  }

  if(denormalized.length != normalized.length)
    throw new Error('normalized and denormalized arrays should have same length');

  return denormalized;
};
Serializer.prototype.denormalize = function(normalized){
  var denormalized = this.layoutDenormalizedArray(normalized);

  for(var i = 0; i < denormalized.length; i++)
    this.denormalizeDeepObject(normalized[i], denormalized[i], denormalized);

  return denormalized[0];
};
Serializer.prototype.serialize = function(object){
  // flat objects are by definition normalized 
  if(this.isFlat(object)) 
    return object;

  // normalize the object into the normalized array
  var normalized = [];
  this.normalize(object, [], normalized);
  return normalized;
};
Serializer.prototype.deserialize = function(object){
  // flat objects cannot be denormalized further
  if(this.isFlat(object))
    return object;

  // should always be an array
  if(!(object instanceof Array))
    throw new Error('invariant violation! serialized objects should be an array');

  // delegate like a boss
  return this.denormalize(object);
};

var Utilities = function(){};
Utilities.prototype.spliceOut = function(array, element){
  var newArray = [];
  for(var i = 0; i < array.length; i++)
    if(array[i] != element)
      newArray.push(array[i]);
  return newArray;
};
Utilities.prototype.spliceIndex = function(array, index){
  var newArray = [];
  for(var i = 0; i < array.length; i++)
    if(i != index)
      newArray.push(array[i]);
  return newArray;
};
Utilities.prototype.select = function(array, lambda){
  var newArray = [];
  for(var i = 0; i < array.length; i++)
    if(lambda(array[i], i))
      newArray.push(array[i]);
  return newArray;
};
Utilities.prototype.ms2ticks = function(ms, ratio){
  // milliseconds to vt clock ticks (roughly, for when heuristics will do)
  ratio = ratio || Parameters.vtPeriodInMillis;
  return Math.ceil(ms / ratio);
};
// vt clock ticks to milliseconds (roughly, for when heuristics will do)
Utilities.prototype.ticks2ms = function(ticks, ratio){
  ratio = ratio || Parameters.vtPeriodInMillis;
  return Math.ceil(ticks * ratio);
};

exports.Cloner = new Cloner();
exports.Events = new Events();
exports.Engine = new Engine();
exports.Parameters = new Parameters();
exports.Random = Random;
exports.Serializer = new Serializer();
exports.Utilities = new Utilities();
