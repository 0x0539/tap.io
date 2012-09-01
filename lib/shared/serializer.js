/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

(window || exports).Serializer = (function(){

  var Serializer = {};

  Serializer.isFlat = function(object){
    if(typeof object == 'undefined')
      return true;
    else if(object == null)
      return true;
    else if(typeof object == 'object')
      return false;
    else
      return true;
  };

  // get a normalized array with references
  Serializer.normalizeArray = function(array, visited, normalized){
    var r = [];
    for(var i = 0; i < array.length; i++)
      r.push(this.normalize(array[i], visited, normalized));
    return r;
  };

  // gets a normalized object with references
  Serializer.normalizeObject = function(object, visited, normalized){
    var r = {};
    for(var k in object)
      r[k] = this.normalize(object[k], visited, normalized);
    return r;
  };

  // normalizing something, dont know what it is yet
  Serializer.normalizeArrayOrObject = function(node, visited, normalized){
    return node instanceof Array ?
      this.normalizeArray(node, visited, normalized) :
      this.normalizeObject(node, visited, normalized);
  };

  // add object to list of visited objects, and store the normalized version of the object
  Serializer.visit = function(node, visited, normalized){
    var index = visited.length;

    visited.push(node);
    normalized.push(null); // save the spot for the next operation

    normalized[index] = this.normalizeArrayOrObject(node, visited, normalized);

    return index;
  };

  // get pointer to already visited object, -1 if unvisited
  Serializer.find = function(object, array){
    for(var i = 0; i < array.length; i++)
      if(object == array[i])
        return i;
    return -1;
  };

  Serializer.getNormalizedObjectIndex = function(node, visited, normalized){
    // see if we have already visited this node
    var index = this.find(node, visited);

    // haven't visited it yet, so visit it!
    if(index == -1) index = this.visit(node, visited, normalized);

    return index;
  }

  Serializer.normalize = function(object, visited, normalized){
    // flat objects are by definition normalized
    if(this.isFlat(object)) 
      return object;

    // normalize this object (or find a cross reference that is already normalized)
    var objectIndex = this.getNormalizedObjectIndex(object, visited, normalized);

    // return an object reference
    return {$ref: objectIndex};
  };

  Serializer.dereference = function(value, denormalized){
    return this.isFlat(value) ? value : denormalized[value.$ref];
  };

  Serializer.denormalizeArray = function(normalizedArray, denormalizedArray, denormalized){
    for(var i = 0; i < normalizedArray.length; i++)
      denormalizedArray.push(this.dereference(normalizedArray[i], denormalized));
  };

  Serializer.denormalizeObject = function(normalizedObject, denormalizedObject, denormalized){
    for(var k in normalizedObject)
      denormalizedObject[k] = this.dereference(normalizedObject[k], denormalized);
  };

  Serializer.denormalizeDeepObject = function(normalized, denormalizedObject, denormalized){
    if(normalized instanceof Array)
      this.denormalizeArray(normalized, denormalizedObject, denormalized);
    else
      this.denormalizeObject(normalized, denormalizedObject, denormalized);
  };

  Serializer.layoutDenormalizedArray = function(normalized){
    var denormalized = [];

    for(var i = 0; i < normalized.length; i++){
      var object = normalized[i];

      if(this.isFlat(object))
        throw new Error('invariant violation! normalized array should not contain flat objects');

      // create initial value
      denormalized.push(object instanceof Array ? [] : {});
    }

    if(denormalized.length != normalized.length)
      throw new Error('invariant violation! normalized array and denormalized array should have the same length');

    return denormalized;
  };

  Serializer.denormalize = function(normalized){
    var denormalized = this.layoutDenormalizedArray(normalized);

    for(var i = 0; i < denormalized.length; i++)
      this.denormalizeDeepObject(normalized[i], denormalized[i], denormalized);

    return denormalized[0];
  };

  Serializer.serialize = function(object){
    // flat objects are by definition normalized 
    if(this.isFlat(object)) 
      return object;

    var normalized = [];

    // normalize the object into the normalized array
    this.normalize(object, [], normalized);

    return normalized;
  };

  Serializer.deserialize = function(object){
    // flat objects cannot be denormalized further
    if(this.isFlat(object))
      return object;

    // should always be an array
    if(!(object instanceof Array))
      throw new Error('invariant violation! serialized objects should be an array');

    // delegate like a boss
    return this.denormalize(object);
  };

  return Serializer;
})();
