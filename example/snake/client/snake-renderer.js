window.SnakeRenderer = (function(){

  var SnakeRenderer = function(){
    this.scene = new THREE.Scene();

    this.light = new THREE.DirectionalLight(0xffffff);
    this.light.position.set(100, 100, 100);

    this.scene.add(this.light);

    this.width = 1024;
    this.height = 768;
    this.cameraDistance = 400;

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

    for(var v = 0; v < state.terrain.vertices.length; v++){
      var vertex = state.terrain.vertices[v],
          vertex3 = new THREE.Vector3(vertex.x, vertex.y, vertex.z);
      geometry.vertices.push(vertex3);
    }

    for(var f = 0; f < state.terrain.faces.length; f++){
      var face = state.terrain.faces[f],
          face3 = new THREE.Face3(face.a, face.b, face.c);
      face3.materialIndex = 0;
      geometry.faces.push(face3);
    }

    geometry.computeFaceNormals();
    geometry.computeVertexNormals();

    this.terrain = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial())
    this.scene.add(this.terrain);
  };

  SnakeRenderer.prototype.getSegment = function(){
    if(this.segmentPoolIndex >= this.segmentPool.length){
      var newSegment = new THREE.Mesh(
        new THREE.SphereGeometry(exports.SnakeEngine.radius),
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
        var coords = player.segments[i].sphere.center,
            segment = this.getSegment();

        segment.position.set(coords.x, coords.y, coords.z);
        segment.visible = true;

        if(i == 0 && sessionId == playerSessionId){
          this.camera.position.set(coords.x, coords.y - 100, this.cameraDistance);
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
