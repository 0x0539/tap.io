window.SnakeRenderer = (function(){

  var FaceBucket = function(cols, rows){
    this.cols = cols || 50;
    this.rows = rows || 50;
    this.faceData = [];
    this.l = null;
    this.t = null;
    this.r = null;
    this.b = null;
  };

  FaceBucket.prototype.add = function(face, geometry){
    var v0 = geometry.vertices[face.a],
        v1 = geometry.vertices[face.b],
        v2 = geometry.vertices[face.c],
        f = {
          face: face,
          l: Math.min.apply(Math.min, [v0.x, v1.x, v2.x]),
          b: Math.min.apply(Math.min, [v0.y, v1.y, v2.y]),
          r: Math.max.apply(Math.max, [v0.x, v1.x, v2.x]),
          t: Math.max.apply(Math.max, [v0.y, v1.y, v2.y])
        };
    this.l = Math.min(this.l || f.l, f.l);
    this.b = Math.min(this.b || f.b, f.b);
    this.r = Math.max(this.r || f.r, f.r);
    this.t = Math.max(this.t || f.t, f.t);
    this.faceData.push(f);
  };

  FaceBucket.prototype.getX = function(x){
    return Math.floor((x - this.l) / this.w);
  };

  FaceBucket.prototype.getY = function(y){
    return Math.floor((y - this.b) / this.h);
  };

  FaceBucket.prototype.rectOverlaps = function(r1, r2){
    var lInside = r1[0] > r2[0] && r1[0] < r2[2],
        rInside = r1[2] > r2[0] && r1[2] < r2[2],
        tInside = r1[1] > r2[1] && r1[1] < r2[3],
        bInside = r1[3] > r2[1] && r1[3] < r2[3];
    return (lInside || rInside) && (tInside || bInside);
  };

  FaceBucket.prototype.rectsOverlap = function(r1, r2){
    return this.rectOverlaps(r1, r2) || this.rectOverlaps(r2, r1);
  };

  FaceBucket.prototype.update = function(){
    this.buckets = [];
    for(var i = 0; i < this.cols; i++){
      this.buckets.push([]);
      for(var j = 0; j < this.rows; j++){
        this.buckets[i].push([]);
      }
    }

    this.w = (this.r - this.l) / this.cols;
    this.h = (this.t - this.b) / this.rows;

    for(var i = 0; i < this.faceData.length; i++){
      var f = this.faceData[i];

      for(var x = 0; x < this.cols; x++){
        for(var y = 0; y < this.rows; y++){
          var l = this.l + x * this.w,
              b = this.b + y * this.h,
              r = l + this.w,
              t = b + this.h,
              r1 = [  l,   b,   r,   t],
              r2 = [f.l, f.b, f.r, f.t];

          if(this.rectsOverlap(r1, r2))
            this.buckets[x][y].push(f.face);
        }
      }
    }

    var count = 0;

    for(var i = 0; i < this.buckets.length; i++)
      for(var j = 0; j < this.buckets[i].length; j++)
        count += this.buckets[i][j].length;

    console.log('average bucket count: ' + (count / (this.rows * this.cols)));

  };

  FaceBucket.prototype.inBounds = function(x, y){
    return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
  };

  FaceBucket.prototype.get = function(x, y){
    var bx = this.getX(x),
        by = this.getY(y);
    return this.inBounds(bx, by) ? this.buckets[bx][by] : [];
  };

  var SnakeRenderer = function(){
    this.scene = new THREE.Scene();

    this.light = new THREE.DirectionalLight(0xffffff);
    this.light.position.set(100, 100, 100);

    this.scene.add(this.light);

    this.width = 1024;
    this.height = 768;
    this.cameraDistance = 400;
    this.sphereRadius = 10;

    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 2000);
    this.camera.position.set(0, 0, this.cameraDistance);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setSize(this.width, this.height);

    this.segmentPool = [];
    this.segmentPoolIndex = 0;

    this.container = document.createElement('div');
    this.container.appendChild(this.renderer.domElement);
    document.body.appendChild(this.container);
  };

  SnakeRenderer.prototype.constructTerrain = function(state){
    if(this.terrain != null)
      return;

    geometry = new THREE.Geometry();
    geometry.materials = [new THREE.MeshLambertMaterial({color: 0xCC0000})];

    var d = this.sphereRadius * 2,
        l = -state.terrain.length / 2,
        t = -state.terrain[0].length / 2;

    for(var i = 0; i < state.terrain.length; i++){
      for(var j = 0; j < state.terrain.length; j++){
        var x = (l + i) * d,
            y = (t + j) * d,
            z = state.terrain[i][j],
            v = new THREE.Vector3(x, y, z);
        geometry.vertices.push(v);
      }
    }

    var vIndex = function(i, j){
      var maxJ = state.terrain[i].length;
      return j + i*maxJ;
    };

    var buildPlaneForFace = function(face){
      var normal = face.normal,
          point = geometry.vertices[face.a];
      return {
        A: normal.x,
        B: normal.y,
        C: normal.z,
        D: -(normal.x*point.x + normal.y*point.y + normal.z*point.z)
      };
    }

    for(var i = 0; i < state.terrain.length - 1; i++){
      for(var j = 0; j < state.terrain[i].length - 1; j++){
        var face1 = new THREE.Face3(vIndex(i, j), vIndex(i+1, j), vIndex(i+1, j+1)),
            face2 = new THREE.Face3(vIndex(i, j), vIndex(i+1, j+1), vIndex(i, j+1));

        face1.materialIndex = 0;
        face2.materialIndex = 0;

        geometry.faces.push(face1);
        geometry.faces.push(face2);
      }
    }

    geometry.computeFaceNormals();
    geometry.computeVertexNormals();

    this.faceBucket = new FaceBucket();

    for(var p = 0; p < geometry.faces.length; p++){
      var face = geometry.faces[p];
      face.plane = buildPlaneForFace(face);
      this.faceBucket.add(face, geometry);
    }

    this.faceBucket.update();

    this.terrain = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial())
    this.scene.add(this.terrain);
  };

  SnakeRenderer.prototype.getSegment = function(){
    if(this.segmentPoolIndex >= this.segmentPool.length){
      var newSegment = new THREE.Mesh(
        new THREE.SphereGeometry(this.sphereRadius, this.sphereRadius, this.sphereRadius), 
        new THREE.MeshLambertMaterial({color: 0x00ff00})
      );
      this.segmentPool.push(newSegment);
      this.scene.add(newSegment);
    }
    return this.segmentPool[this.segmentPoolIndex++];
  };

  SnakeRenderer.prototype.getFacesContainingPoint = function(x, y, geometry){
    var faces = [],
        sample = this.faceBucket.get(x, y);
    for(var f = 0; f < sample.length; f++){
      var face = sample[f],
          v1 = geometry.vertices[face.a],
          v2 = geometry.vertices[face.b],
          v3 = geometry.vertices[face.c],
          minx = Math.min.apply(Math.min, [v1.x, v2.x, v3.x]),
          miny = Math.min.apply(Math.min, [v1.y, v2.y, v3.y]),
          maxx = Math.max.apply(Math.max, [v1.x, v2.x, v3.x]),
          maxy = Math.max.apply(Math.max, [v1.y, v2.y, v3.y]);
      if(x > minx && y > miny && x < maxx && y < maxy)
        faces.push(face);
    }
    return faces;
  };

  SnakeRenderer.prototype.getCollisionPoints = function(){
    if(this.sphereCollisionPoints == null){
      this.sphereCollisionPoints = [];
      var angles = 8,
          radii = 6;
      for(var i = 0; i < radii; i++){
        var radius = i * this.sphereRadius / (radii - 1);
        for(var angle = 0; angle < angles; angle++){
          var radians = angle * 2 * Math.PI / (angles - 1),
              x = radius * Math.sin(radians),
              y = radius * Math.cos(radians),
              g = Math.max(0, Math.sqrt(x*x + y*y)),
              d = Math.sqrt(this.sphereRadius*this.sphereRadius - g*g);
          this.sphereCollisionPoints.push({x: x, y: y, d: d});
        }
      }
    }
    return this.sphereCollisionPoints;
  };

  SnakeRenderer.prototype.render = function(playerSessionId, state){

    this.constructTerrain(state);

    this.segmentPoolIndex = 0;

    for(var sessionId in state.players){
      var player = state.players[sessionId];
      for(var i = 0; i < player.segments.length; i++){
        var segmentLocation = player.segments[i],
            segment = this.getSegment(),
            z = -100000,
            points = this.getCollisionPoints();

        for(var p = 0; p < points.length; p++){
          var point = points[p],
              x = point.x + segmentLocation.x, 
              y = point.y + segmentLocation.y, 
              d = point.d,
              faces = this.getFacesContainingPoint(x, y, this.terrain.geometry);

          for(var f = 0; f < faces.length; f++){
            var face = faces[f],
                plane = face.plane,
                newZ = (plane.A*x + plane.B*y + plane.D)/-plane.C + d;

            z = newZ > z ? newZ : z;
          }
        }

        segment.position.set(segmentLocation.x, segmentLocation.y, z);
        segment.visible = true;
        if(i == 0 && sessionId == playerSessionId){
          this.camera.position.set(segmentLocation.x, segmentLocation.y - 100, this.cameraDistance);
          this.camera.lookAt(segment.position);
        }
      }
    }

    for(var i = this.segmentPoolIndex; i < this.segmentPool.length; i++)
      this.segmentPool[i].visible = false;
    
    this.renderer.render(this.scene, this.camera);
  };

  return SnakeRenderer;
  
})();
