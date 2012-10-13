window.SnakeRenderer = (function(){

  var SnakeRenderer = function(){
    this.scene = new THREE.Scene();

    this.light = new THREE.DirectionalLight(0xffffff);
    this.light.position.set(100, 100, 100);

    this.scene.add(this.light);

    this.cameraDistance = 400;

    this.renderer = new THREE.WebGLRenderer({antialias: true});

    this.updateCameraParameters();

    var dis = this;
    $(window).on('resize', function(e){
      dis.updateCameraParameters();
    });

    this.segmentPool = [];
    this.segmentPoolIndex = 0;

    this.foodPool = [];
    this.foodPoolIndex = 0;

    $('div.game').append(this.renderer.domElement);
  };

  SnakeRenderer.prototype.updateCameraParameters = function(){
    var w = window.innerWidth - 20,
        h = window.innerHeight - 20;
    this.renderer.setSize(w, h);
    this.camera = new THREE.PerspectiveCamera(45, w / h, 1, 2000);
  };

  SnakeRenderer.prototype.constructTerrain = function(state){
    if(this.terrain != null)
      return;

    geometry = new THREE.Geometry();
    geometry.materials = [new THREE.MeshLambertMaterial({color: 0x246300})];

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
        new THREE.SphereGeometry(window.SnakeEngine.radius),
        new THREE.MeshLambertMaterial({color: 0xCC0000})
      );
      this.segmentPool.push(newSegment);
      this.scene.add(newSegment);
    }
    return this.segmentPool[this.segmentPoolIndex++];
  };

  SnakeRenderer.prototype.getFood = function(){
    if(this.foodPoolIndex >= this.foodPool.length){
      var newFood = new THREE.Mesh(
        new THREE.SphereGeometry(window.SnakeEngine.foodRadius),
        new THREE.MeshLambertMaterial({color: 0x0000ff})
      );
      this.foodPool.push(newFood);
      this.scene.add(newFood);
    }
    return this.foodPool[this.foodPoolIndex++];
  };

  SnakeRenderer.prototype.render = function(playerSessionId, state){

    $('tr.player').remove();

    this.constructTerrain(state);

    this.segmentPoolIndex = 0;
    for(var sessionId in state.players){
      var player = state.players[sessionId];

      $('<tr class="player"></tr>')
        .append('<td>' + player.name + '</td>')
        .append('<td>' + player.kills + '</td>')
        .append('<td>' + player.deaths + '</td>')
        .append('<td>' + player.maxLength + '</td>')
        .appendTo('table');

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

    this.foodPoolIndex = 0;
    for(var i = 0; state.food && i < state.food.length; i++){
      var foodState = state.food[i],
          coords = foodState.center,
          food = this.getFood();
      food.position.set(coords.x, coords.y, coords.z);
      food.visible = true;
    }
    for(var i = this.foodPoolIndex; i < this.foodPool.length; i++)
      this.foodPool[i].visible = false;
    
    this.renderer.render(this.scene, this.camera);
  };

  return SnakeRenderer;
  
})();
