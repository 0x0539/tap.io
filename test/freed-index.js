var assert = require('assert'),
    reload = require('./reload');

describe('FREED Index', function(){
  beforeEach(function(done){
    this.Index = reload.reload('../lib/shared/freed/index.js').Index;
    done();
  });

  describe('constructor', function(){
    it('should assign the id counter to 0', function(){
      assert.equal(new this.Index().id, 0);
    });

    it('should assign the x, y, and z arrays to the empty array', function(){
      assert.deepEqual(new this.Index().x, []);
      assert.deepEqual(new this.Index().y, []);
      assert.deepEqual(new this.Index().z, []);
    });

    it('should assign the shapes object to the empty object', function(){
      assert.deepEqual(new this.Index().shapes, {});
    });

    it('should assign the tree object to the empty object', function(){
      assert.deepEqual(new this.Index().tree, {});
    });

    it('should assign the dirty field to false', function(){
      assert.equal(new this.Index().dirty, false);
    });

    it('should assign a default capacity of 1', function(){
      assert.equal(new this.Index().capacity, 1);
    });

    it('should allow passing capacity', function(){
      assert.equal(new this.Index(3).capacity, 3);
    });
  });

  describe('.delete', function(){
    it('should set the dirty flag to true', function(){

    });
    it('should remove the shape from the points arrays', function(){

    });
  });

  describe('.add', function(){
    beforeEach(function(done){
      this.shape = {
        left: function(),
        right: function(),
        top: function(),
        bottom: function(),
        near: function(),
        far: function()
      };
      done();
    });
    it('should have a valid base shape', function(){
      this.index.add(this.shape);
    });
    it('should set the dirty flag to true', function(){
      assert.equal(this.index.dirty, false);
      this.index.add(this.shape);
      assert.equal(this.index.dirty, true);
    });
    it('should check the bounding box left interface', function(){
      this.shape.left = 'banana';
      assert.throws(function(){ this.index.add(this.shape); });
    });
    it('should check the bounding box right interface', function(){
      this.shape.right = 'banana';
      assert.throws(function(){ this.index.add(this.shape); });
    });
    it('should check the bounding box top interface', function(){
      this.shape.top = 'banana';
      assert.throws(function(){ this.index.add(this.shape); });
    });
    it('should check the bounding box bottom interface', function(){
      this.shape.bottom = 'banana';
      assert.throws(function(){ this.index.add(this.shape); });
    });
    it('should check the bounding box near interface', function(){
      this.shape.near = 'banana';
      assert.throws(function(){ this.index.add(this.shape); });
    });
    it('should check the bounding box far interface', function(){
      this.shape.far = 'banana';
      assert.throws(function(){ this.index.add(this.shape); });
    });
    it('should return increasing ids starting at 0', function(){
      assert.equal(this.index.add(this.shape), 0);
      assert.equal(this.index.add(this.shape), 1);
      assert.equal(this.index.add(this.shape), 2);
    });
    it('should increase the id field by 1 each call', function(){
      assert.equal(this.shape.id, 0);
      this.index.add(this.shape)
      assert.equal(this.shape.id, 1);
      this.index.add(this.shape)
      assert.equal(this.shape.id, 2);
      this.index.add(this.shape)
      assert.equal(this.shape.id, 3);
    });
    it('should add a left and right to the x array', function(){

    });
    it('should add a top and bottom to the y array', function(){

    });
    it('should add a near and far to the z array', function(){

    });
  });

  describe('.update', function(){

  });

  describe('.splits', function(){

  });

  describe('.aggregate', function(){

  });

  describe('.leafNode', function(){

  });

  describe('.branchNode', function(){

  });

  describe('.subdivide', function(){

  });

  describe('.trySplit', function(){

  });

  describe('.sort', function(){
    beforeEach(function(done){
      this.index = new this.Index(3);
      done();
    });

    it('should sort the array and assign the pos field correctly', function(){
      var a = [
        {shape: {left: function(){ return 5; }}, type: 'left'},
        {shape: {right: function(){ return -2; }}, type: 'right'},
        {shape: {bottom: function(){ return 0; }}, type: 'bottom'},
        {shape: {top: function(){ return 1.5; }}, type: 'top'},
        {shape: {near: function(){ return 3; }}, type: 'near'},
        {shape: {far: function(){ return 4; }}, type: 'far'},
      ];
      this.index.sort(a);
      assert.deepEqual([-2, 0, 1.5, 3, 4, 5], [a[0].pos, a[1].pos, a[2].pos, a[3].pos, a[4].pos, a[5].pos]);
    });

    it('should accept empty arrays', function(){
      this.index.sort([]);
    });

    it('should mark the dirty flag if elements were swapped', function(){
      var array = [
        {shape: {left: function(){ return 5; }}, type: 'left'},
        {shape: {right: function(){ return -2; }}, type: 'right'}
      ];
      assert.equal(this.index.dirty, false);
      this.index.sort(array);
      assert.equal(this.index.dirty, true);
    });

    it('should not mark the dirty flag if elements are in order', function(){
      var array = [
        {shape: {right: function(){ return -2; }}, type: 'right'},
        {shape: {left: function(){ return 5; }}, type: 'left'},
      ];
      assert.equal(this.index.dirty, false);
      this.index.sort(array);
      assert.equal(this.index.dirty, false);
    });
  });
});
