window.SnakeRenderer = (function(){

  var Segment = function(){
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(10, 10, 10), 
      new THREE.MeshLambertMaterial({color: 0x00ff00})
    );
  };

  var SnakeRenderer = function(){
    this.scene = new THREE.Scene();

    this.light = new THREE.DirectionalLight(0xffffff);
    this.light.position.set(100, 100, 100);

    this.scene.add(this.light);

    this.width = 1024;
    this.height = 768;

    this.camera = new THREE.OrthographicCamera(-this.width/2, this.width/2, this.height/2, -this.height/2, 1, 500);
    this.camera.position.set(0, 0, 100);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setSize(this.width, this.height);

    this.segmentPool = [];
    this.segmentPoolIndex = 0;

    this.container = document.createElement('div');
    this.container.appendChild(this.renderer.domElement);
    document.body.appendChild(this.container);
  };

  SnakeRenderer.prototype.getSegment = function(){
    if(this.segmentPoolIndex >= this.segmentPool.length){
      var newSegment = new Segment();
      this.segmentPool.push(newSegment);
      this.scene.add(newSegment.mesh);
    }
    return this.segmentPool[this.segmentPoolIndex++];
  };

  SnakeRenderer.prototype.render = function(sessionId, state){

    this.segmentPoolIndex = 0;

    for(var sessionId in state.players){
      var player = state.players[sessionId];
      for(var i = 0; i < player.segments.length; i++){
        var segmentLocation = player.segments[i],
            segment = this.getSegment();
        segment.mesh.position.set(segmentLocation.x, segmentLocation.y, 0);
        segment.mesh.visible = true;
      }
    }

    for(var i = this.segmentPoolIndex; i < this.segmentPool.length; i++)
      this.segmentPool[i].mesh.visible = false;
    
    this.renderer.render(this.scene, this.camera);
  };

  return SnakeRenderer;
  
})();
