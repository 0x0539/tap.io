/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

(window || exports).Index = (function(){

  var Utilities = (window || require('../utilities.js')).Utilities;

  var Index = function(capacity){
    this.id = 0;
    this.x = []; // sorted starts and finishes on x axis
    this.y = []; // sorted starts and finishes on y axis
    this.z = []; // sorted starts and finishes on z axis
    this.tree = {};
    this.dirty = false;
    this.capacity = capacity || 1;
  };

  Index.prototype.remove = function(id){
    this.x = Utilities.select(this.x, function(i){ return i.id != id; });
    this.y = Utilities.select(this.y, function(i){ return i.id != id; });
    this.z = Utilities.select(this.z, function(i){ return i.id != id; });
    this.dirty = true;
  };

  Index.prototype.add = function(shape){
    if(typeof shape.left != 'function')
      throw new Error('shape must implement bounding box interface');
    if(typeof shape.right != 'function')
      throw new Error('shape must implement bounding box interface');
    if(typeof shape.top != 'function')
      throw new Error('shape must implement bounding box interface');
    if(typeof shape.bottom != 'function')
      throw new Error('shape must implement bounding box interface');
    if(typeof shape.near != 'function')
      throw new Error('shape must implement bounding box interface');
    if(typeof shape.far != 'function')
      throw new Error('shape must implement bounding box interface');
    var id = this.id++;
    this.x.push({id: id, shape: shape, start:  1, type: 'left'});
    this.x.push({id: id, shape: shape, finish: 1, type: 'right'});
    this.y.push({id: id, shape: shape, start:  1, type: 'bottom'});
    this.y.push({id: id, shape: shape, finish: 1, type: 'top'});
    this.z.push({id: id, shape: shape, start:  1, type: 'near'});
    this.z.push({id: id, shape: shape, finish: 1, type: 'far'});
    this.dirty = true;
    return id;
  };

  Index.prototype.update = function(){
    if(this.x.length != this.y.length || this.y.length != this.z.length)
      throw new Error('invariant violation! dimensions have different number of points... :(');

    var numPoints = this.x.length,
        numShapes = numPoints / 2;

    if(numPoints % 2 != 0)
      throw new Error('invariant violation! uneven number of points');

    // only update if we have items
    if(numPoints){

      // sort along all dimensions (linear time if already in order)
      this.sort(this.x);
      this.sort(this.y);
      this.sort(this.z);

      if(this.dirty){

        var xSplits = this.splits(this.x);
        var ySplits = this.splits(this.y);
        var zSplits = this.splits(this.z);

        this.tree = this.subdivide(
          xSplits, 0, xSplits.length,
          ySplits, 0, ySplits.length,
          zSplits, 0, zSplits.length,
          numShapes
        );

        // we are clean for now
        this.dirty = false;
      }
    }
  };

  Index.prototype.splits = function(points){
    var splits = [],
        l = 0,                 // num regions to the left if we split before current point i and i-1
        w = 0,                 // num regions spanning if we split before point i and i-1
        r = points.length / 2, // num regions to the right if we split before point i and i-1
        last = null;

    for(var i = 0; i < points.length; i++){
      var p = points[i];

      // we can split between points i and i-1 if there was a position change
      if(last && last != p.pos){
        splits.push({
          l: l, 
          w: w, 
          r: r,
          pos: (p.pos - last)/2,
          i: i
        });
      }

      // calculate l, w, and r for next split
      if(p.start){
        w++;
        r--;
      }
      else{
        w--;
        l++;
      }

      last = p.pos;
    }

    return splits;
  };

  // get shape ids in this leaf node, all points adjacent to and between the splits s1 and s2 
  // pi - s1 - pi+1 - ... - s2 - pj
  Index.prototype.aggregate = function(ids, splits, points, s1, s2){
    var p0 = 0,
        pN = points.length;

    if(s1 > 0) 
      p0 = splits[s1-1].i;

    if(s2 < splits.length) 
      pN = splits[s2].i;

    for(var p = p0; p < pN; p++){
      var point = points[p];
      ids[point.id] = point.shape;
    }
  };

  // collect all shape ids in this leaf node
  Index.prototype.leafNode = function(xSplits, x1, x2, ySplits, y1, y2, zSplits, z1, z2){
    var dis = this;
    return { 
      leaf: 1, 
      forEachShape: function(callback){
        if(!this.ids){
          this.ids = {};
          dis.aggregate(this.ids, xSplits, dis.x, x1, x2);
          dis.aggregate(this.ids, ySplits, dis.y, y1, y2);
          dis.aggregate(this.ids, zSplits, dis.z, z1, z2);
        }
        for(var id in this.ids){
          callback(this.ids[id], id);
        }
      }
    };
  };

  Index.prototype.branchNode = function(split, dim, xSplits, x1, x2, ySplits, y1, y2, zSplits, z1, z2){
    var r1, r2;
    switch(dim){
      case 'x':
        r1 = this.subdivide(xSplits, x1,          split.k, ySplits, y1, y2, zSplits, z1, z2, split.Cl);
        r2 = this.subdivide(xSplits, split.k + 1, x2,      ySplits, y1, y2, zSplits, z1, z2, split.Cr);
        break;
      case 'y':
        r1 = this.subdivide(xSplits, x1, x2, ySplits, y1,          split.k, zSplits, z1, z2, split.Cl);
        r2 = this.subdivide(xSplits, x1, x2, ySplits, split.k + 1, y2,      zSplits, z1, z2, split.Cr);
        break;
      case 'z':
        r1 = this.subdivide(xSplits, x1, x2, ySplits, y1, y2, zSplits, z1,          split.k, split.Cl);
        r2 = this.subdivide(xSplits, x1, x2, ySplits, y1, y2, zSplits, split.k + 1, z2,      split.Cr);
        break;
    }
    return { split: split, dim: dim, r1: r1, r2: r2 };
  };

  // recursive subdivision
  Index.prototype.subdivide = function(xSplits, x1, x2, ySplits, y1, y2, zSplits, z1, z2, numShapes){
    // return leaf node
    if(numShapes <= this.capacity)
      return this.leafNode(xSplits, x1, x2, ySplits, y1, y2, zSplits, z1, z2);

    var x = this.trySplit(xSplits, x1, x2);
    var y = this.trySplit(ySplits, y1, y2);
    var z = this.trySplit(zSplits, z1, z2);

    // we require that splits reduce the number of shapes on both sides
    x = x && x.Cl < numShapes && x.Cr < numShapes ? x : null;
    y = y && y.Cl < numShapes && y.Cr < numShapes ? y : null;
    z = z && z.Cl < numShapes && z.Cr < numShapes ? z : null;

    if(x && (!y || x.cost < y.cost) && (!z || x.cost < z.cost))
      return this.branchNode(x, 'x', xSplits, x1, x2, ySplits, y1, y2, zSplits, z1, z2);
    else if(y && (!z || y.cost < z.cost))
      return this.branchNode(y, 'y', xSplits, x1, x2, ySplits, y1, y2, zSplits, z1, z2);
    else if(z)
      return this.branchNode(z, 'z', xSplits, x1, x2, ySplits, y1, y2, zSplits, z1, z2);
    else
      return this.leafNode(xSplits, x1, x2, ySplits, y1, y2, zSplits, z1, z2);
  };

  Index.prototype.trySplit = function(splits, a, b){
    var l = splits[a].l,
        r = splits[b-1].r,
        size = splits[b-1].pos - splits[a].pos, // normalizing term for region size
        best = null;

    for(var i = a; i < b; i++){
      var Sl = splits[i].pos   - splits[a].pos, // region sizes (unnormalized)
          Sr = splits[b-1].pos - splits[i].pos, 
          Pl = Sl / size,                       // region sizes (normalized)
          Pr = Sr / size,                    
          Cl = splits[i].l - l + splits[i].w,   // shape counts
          Cr = splits[i].r - r + splits[i].w, 
          cost = Pl*Cl + Pr*Cr;                 // total 'cost' of split

      // is this the best split so far?
      if(best == null || cost < best.cost){
        best = splits[i];
        best.Cl = Cl;
        best.Cr = Cr;
        best.k = i;
        best.cost = cost;
      }
    }

    return best;
  };

  // insertion sort is stable and adaptive -- O(n) if already sorted
  Index.prototype.sort = function(array){
    var a, b, c;
    for(var i = 0; i < array.length; i++){
      c = array[i];
      c.pos = c.shape[c.type](); // recalculate position
      for(var j = i; j > 0 && (a=array[j]).pos < (b=array[j-1]).pos; j--){
        array[j] = b;
        array[j-1] = a;
        this.dirty = true;
      }
    }
  };

  return Index;
})();
