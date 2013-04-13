/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

(window || exports).Vector3 = (function(){

  var Serializer = (window || require('../serializer.js')).Serializer;

  var Vector3 = function(x, y, z){ 
    this.protokey = protokey;
    this.type = 'Vector3';
    this.x = x;
    this.y = y;
    this.z = z;
  };

  var protokey = Serializer.register(Vector3.prototype);

  Vector3.prototype.copy = function(){
    return new Vector3(this.x, this.y, this.z);
  };

  Vector3.prototype.distanceTo = function(that){
    if(that.type != 'Vector3') 
      throw new Error('must pass a Vector3');
    return Math.sqrt(
      Math.pow(that.x - this.x, 2) +
      Math.pow(that.y - this.y, 2) +
      Math.pow(that.z - this.z, 2)
    );
  };

  Vector3.prototype.addInto = function(that){
    if(that.type != 'Vector3') 
      throw new Error('must pass a Vector3');
    that.x += this.x;
    that.y += this.y;
    that.z += this.z;
    return this;
  };

  Vector3.prototype.subFrom = function(that){
    if(that.type != 'Vector3') 
      throw new Error('must pass a Vector3');
    that.x -= this.x;
    that.y -= this.y;
    that.z -= this.z;
    return this;
  };

  Vector3.prototype.scaleBy = function(by){
    this.x *= by;
    this.y *= by; 
    this.z *= by;
    return this;
  };

  Vector3.prototype.plus = function(that){
    if(that.type != 'Vector3') 
      throw new Error('must pass a Vector3');
    return new Vector3(this.x+that.x, this.y+that.y, this.z+that.z);
  };

  Vector3.prototype.minus = function(that){
    if(that.type != 'Vector3') 
      throw new Error('must pass a Vector3');
    return new Vector3(this.x-that.x, this.y-that.y, this.z-that.z);
  };

  Vector3.prototype.times = function(by){
    if(that.type != 'Vector3') 
      throw new Error('must pass a Vector3');
    return new Vector3(this.x*by, this.y*by, this.z*by);
  };

  Vector3.prototype.cross = function(that){
    if(that.type != 'Vector3') 
      throw new Error('must pass a Vector3');
    return new Vector3(
      this.y*that.z - this.z*that.y,
      this.z*that.x - this.x*that.z,
      this.x*that.y - this.y*that.x
    );
  };

  Vector3.prototype.equals = function(that){
    if(that.type != 'Vector3') 
      throw new Error('must pass a Vector3');
    return this.x == that.x 
      && this.y == that.y 
      && this.z == that.z;
  };

  Vector3.prototype.dot = function(that){
    if(that.type != 'Vector3') 
      throw new Error('must pass a Vector3');
    return this.x*that.x 
      + this.y*that.y 
      + this.z*that.z;
  };

  return Vector3;

})();
