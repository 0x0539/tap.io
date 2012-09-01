/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

(window || exports).Index = (function(){

  var Utilities = (window || require('../utilities.js')).Utilities;

  var Index = function(capacity){
    return {
      type: 'Index',
      id: 0,
      x: [], // sorted starts and finishes on x axis
      y: [], // sorted starts and finishes on y axis
      z: [], // sorted starts and finishes on z axis
      tree: {},
      dirty: false,
      capacity: capacity || 1,
    };
  };

  Index.remove = function(self, id){
    self.x = Utilities.select(self.x, function(i){ return i.id != id; });
    self.y = Utilities.select(self.y, function(i){ return i.id != id; });
    self.z = Utilities.select(self.z, function(i){ return i.id != id; });
    self.dirty = true;
  };

  Index.isShape = function(self, shape){
    return typeof shape.left == 'number' &&
      typeof shape.right == 'number' &&
      typeof shape.top == 'number' &&
      typeof shape.bottom == 'number' &&
      typeof shape.near == 'number' &&
      typeof shape.far == 'number';
  };

  Index.add = function(self, shape){
    if(!Index.isShape(self, shape))
      throw new Error('shape must implement bounding box interface');

    var id = self.id++;
    self.x.push({id: id, shape: shape, start:  1, type: 'left'});
    self.x.push({id: id, shape: shape, finish: 1, type: 'right'});
    self.y.push({id: id, shape: shape, start:  1, type: 'bottom'});
    self.y.push({id: id, shape: shape, finish: 1, type: 'top'});
    self.z.push({id: id, shape: shape, start:  1, type: 'near'});
    self.z.push({id: id, shape: shape, finish: 1, type: 'far'});
    self.dirty = true;
    return id;
  };

  Index.query = function(self, shape, callback){
    if(!Index.isShape(self, shape))
      throw new Error('shape must implement bounding box interface');
    Index.subquery(self, this.tree, shape, callback);
  };

  Index.subquery = function(self, tree, shape, callback){
    if(tree.leaf){
      tree.forEachShape(callback);
    }
    else{
      // i is the point immediately after the split, so the physical split occurs between points i and i-1
      var p0 = self[tree.dim][tree.split.i], 
          p1 = self[tree.dim][tree.split.i-1],
          avg = (p0.shape[p0.type] + p1.shape[p1.type]) / 2;
      switch(tree.dim){
        case 'x':
          if(shape.left   < avg) Index.subquery(self, tree.r1, shape, callback);
          if(shape.right  > avg) Index.subquery(self, tree.r2, shape, callback);
          break;
        case 'y':
          if(shape.bottom < avg) Index.subquery(self, tree.r1, shape, callback);
          if(shape.top    > avg) Index.subquery(self, tree.r2, shape, callback);
          break;
        case 'z':
          if(shape.near   < avg) Index.subquery(self, tree.r1, shape, callback);
          if(shape.far    > avg) Index.subquery(self, tree.r2, shape, callback);
          break;
      }
    }
  };

  Index.update = function(self){
    if(self.x.length != self.y.length || self.y.length != self.z.length)
      throw new Error('invariant violation! dimensions have different number of points... :(');

    var numPoints = self.x.length,
        numShapes = numPoints / 2;

    if(numPoints % 2 != 0)
      throw new Error('invariant violation! uneven number of points');

    // only update if we have items
    if(numPoints){

      // sort along all dimensions (linear time if already in order)
      if(Index.sort(self, self.x)) self.dirty = true;
      if(Index.sort(self, self.y)) self.dirty = true;
      if(Index.sort(self, self.z)) self.dirty = true;

      if(self.dirty){

        // linear time to generate all the splits
        var xSplits = Index.splits(self, self.x);
        var ySplits = Index.splits(self, self.y);
        var zSplits = Index.splits(self, self.z);

        // nlogn time to perform subdivision
        self.tree = Index.subdivide(
          self, 
          xSplits, 0, xSplits.length,
          ySplits, 0, ySplits.length,
          zSplits, 0, zSplits.length,
          numShapes
        );

        // we are clean for now
        self.dirty = false;
      }
    }
  };

  Index.splits = function(self, points){
    var splits = [],
        l = 0,                 // num shapes to the left.... if we were to split between point i and i-1
        w = 0,                 // num shapes spanning....... if we were to split between point i and i-1
        r = points.length / 2, // num shapes to the right... if we were to split between point i and i-1
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
  Index.aggregate = function(self, ids, splits, points, s1, s2){
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
  Index.leafNode = function(self, xSplits, x1, x2, ySplits, y1, y2, zSplits, z1, z2){
    return { 
      leaf: 1, 
      forEachShape: function(callback){
        if(!this.ids){
          this.ids = {};
          Index.aggregate(self, this.ids, xSplits, dis.x, x1, x2);
          Index.aggregate(self, this.ids, ySplits, dis.y, y1, y2);
          Index.aggregate(self, this.ids, zSplits, dis.z, z1, z2);
        }
        for(var id in this.ids){
          callback(this.ids[id], id);
        }
      }
    };
  };

  Index.branchNode = function(self, split, dim, xSplits, x1, x2, ySplits, y1, y2, zSplits, z1, z2){
    var r1, r2;
    switch(dim){
      case 'x':
        r1 = Index.subdivide(self, xSplits, x1,          split.k, ySplits, y1, y2, zSplits, z1, z2, split.Cl);
        r2 = Index.subdivide(self, xSplits, split.k + 1, x2,      ySplits, y1, y2, zSplits, z1, z2, split.Cr);
        break;
      case 'y':
        r1 = Index.subdivide(self, xSplits, x1, x2, ySplits, y1,          split.k, zSplits, z1, z2, split.Cl);
        r2 = Index.subdivide(self, xSplits, x1, x2, ySplits, split.k + 1, y2,      zSplits, z1, z2, split.Cr);
        break;
      case 'z':
        r1 = Index.subdivide(self, xSplits, x1, x2, ySplits, y1, y2, zSplits, z1,          split.k, split.Cl);
        r2 = Index.subdivide(self, xSplits, x1, x2, ySplits, y1, y2, zSplits, split.k + 1, z2,      split.Cr);
        break;
    }
    return { split: split, dim: dim, r1: r1, r2: r2 };
  };

  // recursive subdivision
  Index.subdivide = function(self, xSplits, x1, x2, ySplits, y1, y2, zSplits, z1, z2, numShapes){
    // return leaf node
    if(numShapes <= self.capacity)
      return Index.leafNode(self, xSplits, x1, x2, ySplits, y1, y2, zSplits, z1, z2);

    var x = Index.trySplit(self, self.x, xSplits, x1, x2);
    var y = Index.trySplit(self, self.y, ySplits, y1, y2);
    var z = Index.trySplit(self, self.z, zSplits, z1, z2);

    // we require that splits reduce the number of shapes on both sides
    x = x.Cl < numShapes && x.Cr < numShapes && x;
    y = y.Cl < numShapes && y.Cr < numShapes && y;
    z = z.Cl < numShapes && z.Cr < numShapes && z;

    if(x && (!y || x.cost < y.cost) && (!z || x.cost < z.cost))
      return Index.branchNode(self, x, 'x', xSplits, x1, x2, ySplits, y1, y2, zSplits, z1, z2);
    else if(y && (!z || y.cost < z.cost))
      return Index.branchNode(self, y, 'y', xSplits, x1, x2, ySplits, y1, y2, zSplits, z1, z2);
    else if(z)
      return Index.branchNode(self, z, 'z', xSplits, x1, x2, ySplits, y1, y2, zSplits, z1, z2);
    else
      return Index.leafNode(self, xSplits, x1, x2, ySplits, y1, y2, zSplits, z1, z2);
  };

  Index.trySplit = function(self, points, splits, a, b){
    var lShapes = 0, 
        rShapes = 0, 
        lBorder = points[0].pos, 
        rBorder = points[points.length-1].pos, 
        size, 
        best;

    if(a > 0){
      var leftFence = splits[a-1];

      lShapes = leftFence.l; 
      lBorder = leftFence.pos;
    }

    if(b < splits.length){
      var rightFence = splits[b];

      rShapes = rightFence.r;
      rBorder = rightFence.pos;
    }

    size = rBorder - lBorder;

    for(var i = a; i < b; i++){
      var split = splits[i],
          Sl = split.pos - lBorder,         // region sizes
          Sr = rBorder - split.pos, 
          Pl = Sl / size,                   // region probabilities (sizes after normalization)
          Pr = Sr / size,                    
          Cl = split.l - lShapes + split.w, // shape counts
          Cr = split.r - rShapes + split.w, 
          cost = Pl*Cl + Pr*Cr;             // total 'cost' of split

      // is this the best split so far?
      if(best == null || cost < best.cost){
        best = split;
        best.Cl = Cl;
        best.Cr = Cr;
        best.k = i; // split index -- not the same as point index i -- used to perform further subdivisions
        best.cost = cost;
      }
    }

    return best;
  };

  // insertion sort is stable and adaptive -- O(n) if already sorted
  Index.sort = function(self, array){
    var a, b, c, dirty = false;
    for(var i = 0; i < array.length; i++){
      c = array[i];
      c.pos = c.shape[c.type]; // cache position
      for(var j = i; j > 0 && (a=array[j]).pos < (b=array[j-1]).pos; j--){
        array[j] = b;
        array[j-1] = a;
        dirty = true;
      }
    }
    return dirty;
  };

  return Index;
})();
