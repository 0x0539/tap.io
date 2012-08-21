window.SnakeRenderer = (function(){

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
