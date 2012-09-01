var assert = require('assert'),
    reload = require('./reload');

describe('FREED Index', function(){
  beforeEach(function(done){
    this.Index = reload.reload('../lib/shared/freed/index.js').Index;
    done();
  });

  describe('constructor', function(){
    it('should assign the id counter to 0', function(){
      assert.equal(this.Index().id, 0);
    });

    it('should assign the x, y, and z arrays to the empty array', function(){
      assert.deepEqual(this.Index().x, []);
      assert.deepEqual(this.Index().y, []);
      assert.deepEqual(this.Index().z, []);
    });

    it('should assign the tree object to the empty object', function(){
      assert.deepEqual(this.Index().tree, {});
    });

    it('should assign the dirty field to false', function(){
      assert.equal(this.Index().dirty, false);
    });

    it('should assign a default capacity of 1', function(){
      assert.equal(this.Index().capacity, 1);
    });

    it('should allow passing capacity', function(){
      assert.equal(this.Index(3).capacity, 3);
    });

    it('should assign a type of Index', function(){
      assert.equal(this.Index().type, 'Index');
    });
  });

  describe('.delete', function(){
    it('should set the dirty flag to true', function(){
      var a = this.Index();

      assert.equal(false, a.dirty);
      this.Index.remove(a);
      assert.equal(true, a.dirty);
    });

    it('should remove the shape from the points arrays if present', function(){
      var a = this.Index();

      a.x.push({id: 0});
      a.x.push({id: 1});
      a.y.push({id: 1});
      a.y.push({id: 0});
      a.z.push({id: 0});
      a.z.push({id: 1});

      this.Index.remove(a, 0);

      assert.deepEqual([{id: 1}], a.x);
      assert.deepEqual([{id: 1}], a.y);
      assert.deepEqual([{id: 1}], a.z);
    });

  });

  describe('.add', function(){
    beforeEach(function(done){
      this.shape = { left: 1, right: 1, top: 1, bottom: 1, near: 1, far: 1 };
      this.index = this.Index();
      done();
    });

    it('should have a valid base shape', function(){
      this.Index.add(this.index, this.shape);
    });

    it('should set the dirty flag to true', function(){
      assert.equal(this.index.dirty, false);
      this.Index.add(this.index, this.shape);
      assert.equal(this.index.dirty, true);
    });

    it('should return increasing ids starting at 0', function(){
      assert.equal(this.Index.add(this.index, this.shape), 0);
      assert.equal(this.Index.add(this.index, this.shape), 1);
      assert.equal(this.Index.add(this.index, this.shape), 2);
    });

    it('should set the dirty flag', function(){
      assert.equal(this.index.dirty, false);
      this.Index.add(this.index, this.shape);
      assert.equal(this.index.dirty, true);
    });

    it('should throw an exception if isShape returns false', function(){
      this.Index.isShape = function(){ return false; };
      assert.throws(function(){
        this.Index.add(this.index, {});
      });
    });

    it('should add a left and right to the x array', function(){
      this.Index.add(this.index, this.shape);
      assert.deepEqual(this.index.x, [
        {
          id: 0,
          shape: this.shape,
          start: 1,
          type: 'left'
        },
        {
          id: 0,
          shape: this.shape,
          finish: 1,
          type: 'right'
        }
      ]);
    });

    it('should add a top and bottom to the y array', function(){
      this.Index.add(this.index, this.shape);
      assert.deepEqual(this.index.y, [
        {
          id: 0,
          shape: this.shape,
          start: 1,
          type: 'bottom'
        },
        {
          id: 0,
          shape: this.shape,
          finish: 1,
          type: 'top'
        }
      ]);
    });

    it('should add a near and far to the z array', function(){
      this.Index.add(this.index, this.shape);
      assert.deepEqual(this.index.z, [
        {
          id: 0,
          shape: this.shape,
          start: 1,
          type: 'near'
        },
        {
          id: 0,
          shape: this.shape,
          finish: 1,
          type: 'far'
        }
      ]);
    });
  });

  describe('.isShape', function(){

    beforeEach(function(done){
      this.shape = { left: 1, right: 1, top: 1, bottom: 1, near: 1, far: 1 };
      this.index = this.Index();
      done();
    });

    it('should have a valid base shape', function(){
      assert.equal(this.Index.isShape(this.index, this.shape), true);
    });

    it('should check the bounding box left interface', function(){
      var c;
      this.shape.left = c;
      assert.equal(this.Index.isShape(this.index, this.shape), false);
    });

    it('should check the bounding box right interface', function(){
      this.shape.right = true;
      assert.equal(this.Index.isShape(this.index, this.shape), false);
    });

    it('should check the bounding box bottom interface', function(){
      this.shape.bottom = 'banana';
      assert.equal(this.Index.isShape(this.index, this.shape), false);
    });

    it('should check the bounding box top interface', function(){
      this.shape.top = function(){};
      assert.equal(this.Index.isShape(this.index, this.shape), false);
    });

    it('should check the bounding box near interface', function(){
      this.shape.near = 'banana';
      assert.equal(this.Index.isShape(this.index, this.shape), false);
    });

    it('should check the bounding box far interface', function(){
      this.shape.far = null;
      assert.equal(this.Index.isShape(this.index, this.shape), false);
    });

  });

  describe('.query', function(){

  });

  describe('.subquery', function(){

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
    it('should sort the array and assign the pos field correctly', function(){
      var a = [
        {shape: {left: 5}, type: 'left'},
        {shape: {right: -2}, type: 'right'},
        {shape: {bottom: 0}, type: 'bottom'},
        {shape: {top: 1.5}, type: 'top'},
        {shape: {near: 3}, type: 'near'},
        {shape: {far: 4}, type: 'far'},
      ];
      assert.equal(true, this.Index.sort({}, a));
      assert.deepEqual([-2, 0, 1.5, 3, 4, 5], [a[0].pos, a[1].pos, a[2].pos, a[3].pos, a[4].pos, a[5].pos]);
    });

    it('should accept empty arrays and not set the dirty flag', function(){
      assert.equal(false, this.Index.sort({}, []));
    });

    it('should return true if elements were swapped', function(){
      var array = [
        {shape: {left: function(){ return 5; }}, type: 'left'},
        {shape: {right: function(){ return -2; }}, type: 'right'}
      ];
      assert.equal(true, this.Index.sort({}, array));
    });

    it('should return false if elements were not swapped', function(){
      var array = [
        {shape: {right: function(){ return -2; }}, type: 'right'},
        {shape: {left: function(){ return 5; }}, type: 'left'},
      ];
      assert.equal(false, this.Index.sort({}, array));
    });
  });
});
