
class Viewer {
  monochrome = false;
  controls;
  points;
  mesh;
  wireframe;
  axis;
  lastTime;

  constructor() {
    // Three JS instances
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45.0, window.innerWidth / window.innerHeight, 0.1, 5000.0
    );
    this.stats = new Stats();
    this.stats.showPanel(0);
    this.gridHelper = null;
    this.axisHelper = null;
    this.gui = new dat.GUI();

    // Parameters
    this.params = JSON.parse(
      document.getElementById('vscode-3dviewer-data').getAttribute('data-settings')
    );
    this.params.gridHelper = {
      size: 2000,
      unit: 1
    };

    // GUI
    this.initGui();
    this.initRenderer();
    this.initScene();
    this.initLight();
    this.initHelpers();

    // check extension
    this.addMesh(this.params.fileToLoad);

    // add DOM
    document.body.appendChild(this.renderer.domElement);
    document.body.appendChild(this.stats.domElement);
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
  }

  initGui() {
    console.log(this.params);
    this.gui.add(this.params, 'showPoints')
      .name('Points');
    this.gui.add(this.params, 'pointSize')
      .min(0).max(20).max(this.params.pointMaxSize)
      .name('Point size');
    this.gui.addColor(this.params, 'pointColor')
      .name('Point color');
    this.gui.add(this.params, 'showWireframe')
      .name('Wireframe');
    this.gui.add(this.params, 'wireframeWidth')
      .min(0).max(20).max(this.params.wireframeMaxWidth)
      .name('Wireframe width');
    this.gui.addColor(this.params, 'wireframeColor')
      .name('Wireframe color');
    this.gui.add(this.params, 'showMesh')
      .name('Mesh');
    this.gui.addColor(this.params, 'backgroundColor')
      .name('Background color');
    this.gui.add(this.params, 'fogDensity')
      .min(0).max(1)
      .name('Fog');

    let folder = this.gui.addFolder('Grid Helper');
    folder.add(this.params, 'showGridHelper')
      .name('show');
    folder.add(this.params.gridHelper, 'size')
      .name('size');
    folder.add(this.params.gridHelper, 'unit')
      .name('unit');
  }

  initRenderer() {
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  initScene() {
    this.scene.fog = new THREE.FogExp2(this.params.backgroundColor, this.params.fogDensity);
    this.scene.background = new THREE.Color(this.params.backgroundColor);
  }

  animate() {
    this.stats.begin();
    requestAnimationFrame(this.animate.bind(this));
    var time = Date.now();
    if (this.lastTime !== time) {
      this.lastTime = time;
      this.updateGui();
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.stats.end();
  }

  initCamera() {
    this.points.geometry.computeBoundingBox();

    const camTarget = getBBoxCenter(this.points.geometry);
    const camPos = autoCameraPos(this.points.geometry);

    this.camera.position.copy(camPos);
    this.controls = new THREE.TrackballControls(this.camera, this.renderer.domElement);
    this.controls.target = camTarget;
  }

  initLight() {
    const light = new THREE.HemisphereLight(0x888888, 0x333333, 1.0);
    this.scene.add(light);
  }

  initHelpers() {
    // Remove current helpers
    if (this.gridHelper !== null) {
      this.scene.remove(this.gridHelper);
    }

    if (this.axisHelper !== null) {
      this.scene.remove(this.axisHelper);
    }

    // Grid helper
    const size = this.params.gridHelper.size;
    const unit = this.params.gridHelper.unit;
    const divisions = size / unit;
    if (this.gridHelper === null ||
      this.gridHelper.size !== size ||
      this.gridHelper.divisions !== divisions) {
      this.gridHelper = new THREE.GridHelper(size, divisions);
      this.gridHelper.name = 'gridHelper';
    }

    // Axis helper
    if (this.axisHelper === null) {
      this.axisHelper = new THREE.AxisHelper(1.0);
      this.axisHelper.material.linewidth = 10;
      this.axisHelper.name = 'axisHelper';
    }

    // Display
    if (this.params.showGridHelper) {
      this.scene.add(this.gridHelper);
      this.scene.add(this.axisHelper);
    }
  }

  updateGui() {
    // Points
    if (this.params.showPoints) {
      this.points.material.size = this.params.pointSize;
    } else {
      this.points.material.size = 0;
    }

    if (this.monochrome) {
      this.points.material.color = new THREE.Color(this.params.pointColor);
    }

    // Mesh
    this.scene.remove(this.mesh);
    if (this.params.showMesh) {
      this.scene.add(this.mesh);
    }

    // Wireframe
    this.scene.remove(this.wireframe);
    if (this.params.showWireframe) {
      this.scene.add(this.wireframe);
    }
    this.wireframe.material.color = new THREE.Color(this.params.wireframeColor);
    this.wireframe.material.wireframeLinewidth = this.params.wireframeWidth;

    this.initScene();
    this.initHelpers();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  addMesh(fileToLoad) {
    const self = this;
    const base = basename(fileToLoad);
    const loader = createModelLoader(fileToLoad);

    loader.load(fileToLoad, function (object) {
      var geometry;
      if (object.isGeometry || object.isBufferGeometry) {
        geometry = object;
      } else if (object.isGroup) {
        // merge geometries
        console.log(object);
        geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(
          object.children.map(child =>
            child.geometry.clone().applyMatrix4(child.matrix))
        );

        // Add indices if not exist
        console.log(object.children[0].isPoints);
        if (geometry.index === null && !object.children[0].isPoints) {
          var nVerts = geometry.getAttribute('position').length / 3;
          var indices = Array.from(Array(nVerts), (v, k) => k);
          geometry.setIndex(indices);
        }
      } else {
        // expect object is THREE.Mesh
        geometry = object.geometry;
      }

      console.log(geometry);

      // mesh support
      const meshSupport = geometry.index !== null;
      this.params.showMesh = meshSupport;
      this.params.showPoints = !meshSupport;
  
      // add points
      const sprite = new THREE.TextureLoader().load('three/textures/sprites/disc.png');
      var pointsMaterial = new THREE.PointsMaterial({
        size: 35,
        sizeAttenuation: true,
        map: sprite,
        alphaTest: 0.5,
        transparent: true
      });
      self.points = new THREE.Points(geometry, pointsMaterial);
      self.points.name = base + '_points';

      try {
        if (geometry.getAttribute('color').length > 0) {
          pointsMaterial.vertexColors = true;
        }
      } catch (e) {
        console.error(e);
        self.monochrome = true;
      }

      self.scene.add(self.points);

      // add mesh
      try {
        geometry.computeVertexNormals();

        var material = new THREE.MeshStandardMaterial({
          color: 0xefefef,
          roughness: 0.1,
          flatShading: true,
          side: THREE.DoubleSide
        });
        self.mesh = new THREE.Mesh(geometry, material);
        self.mesh.castShadow = true;
        self.mesh.receiveShadow = true;
        self.mesh.name = base + '_mesh';
        self.scene.add(self.mesh);

        var wiremat = new THREE.MeshStandardMaterial({
          color: self.params.wireframeColor,
          roughness: 0.1,
          flatShading: true,
          side: THREE.DoubleSide,
          wireframe: true,
          wireframeLinewidth: self.params.wireframeWidth
        });
        self.wireframe = new THREE.Mesh(geometry, wiremat);
        self.wireframe.name = base + '_wireframe';
        self.scene.add(self.wireframe);
      } catch (e) { console.error(e); }

      self.initCamera();
      self.animate();
    }.bind(self));
  }
}

viewer = new Viewer();
