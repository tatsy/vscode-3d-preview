import * as THREE from 'three';
import { GUI } from './three/libs/lil-gui.module.min.js';
import { OrbitControls } from './three/controls/OrbitControls.js';
import { LineMaterial } from './three/lines/LineMaterial.js';
import { Line2 } from './three/lines/Line2.js';
import { WireframeGeometry2 } from './three/lines/WireframeGeometry2.js';
import * as BufferGeometryUtils from './three/utils/BufferGeometryUtils.js';
import * as utils from './utils.js';

class Viewer {
  controls;
  points;
  mesh;
  wireframe;
  axis;
  lastTime;

  constructor() {
    this.gui = null;
    this.gridHelper = null;
    this.axesHelper = null;
    this.monochrome = false;

    // Parameters
    this.params = JSON.parse(
      document.getElementById('vscode-3dviewer-data').getAttribute('data-settings')
    );
    this.params.gridHelper = {
      size: 2000,
      unit: 1,
    };

    // Three JS instances
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(this.params.backgroundColor, this.params.fogDensity);
    this.scene.background = new THREE.Color(this.params.backgroundColor);

    const light = new THREE.HemisphereLight(0x888888, 0x333333, 1.0);
    this.scene.add(light);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45.0,
      window.innerWidth / window.innerHeight,
      0.1,
      5000.0
    );

    // check extension
    this.setMesh(this.params.fileToLoad);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  updateHelpers() {
    // Remove current helpers
    if (this.gridHelper !== null) {
      this.scene.remove(this.gridHelper);
    }

    if (this.axesHelper !== null) {
      this.scene.remove(this.axesHelper);
    }

    // BBox center
    const center = utils.getBBoxCenter(this.points.geometry);
    const extent = utils.getBBoxMaxExtent(this.points.geometry);

    // Grid helper
    if (this.params.showGridHelper) {
      const size = this.params.gridHelper.size;
      const unit = this.params.gridHelper.unit;
      const divisions = size / unit;
      if (
        this.gridHelper === null ||
        this.gridHelper.size !== size ||
        this.gridHelper.divisions !== divisions
      ) {
        const colorCenterLine = new THREE.Color('#888888');
        const colorGrid = new THREE.Color('#888888');
        this.gridHelper = new THREE.GridHelper(size, divisions, colorCenterLine, colorGrid);
        this.gridHelper.position.x += center.x - extent * 0.5;
        this.gridHelper.position.y += center.y - extent * 0.5;
        this.gridHelper.position.z += center.z - extent * 0.5;
        this.gridHelper.material.linewidth = 10;
        this.gridHelper.name = 'gridHelper';
      }

      this.scene.add(this.gridHelper);
    }

    // Axis helper
    if (this.params.showAxesHelper) {
      if (this.axesHelper === null) {
        this.axesHelper = new THREE.AxesHelper(extent);
        this.axesHelper.position.x += center.x - extent * 0.5;
        this.axesHelper.position.y += center.y - extent * 0.5;
        this.axesHelper.position.z += center.z - extent * 0.5;
        this.axesHelper.material.linewidth = 10;
        this.axesHelper.name = 'axesHelper';
      }

      this.scene.add(this.axesHelper);
    }

    // Repaint
    this.render();
  }

  updateRender() {
    // Fog
    this.scene.fog = new THREE.FogExp2(this.params.backgroundColor, this.params.fogDensity);
    this.scene.background = new THREE.Color(this.params.backgroundColor);

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
    this.wireframe.material.color = new THREE.Color(this.params.wireframeColor);
    this.wireframe.material.linewidth = this.params.wireframeWidth;

    this.scene.remove(this.wireframe);
    if (this.params.showWireframe) {
      this.scene.add(this.wireframe);
    }

    // Repaint
    this.render();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.render();
  }

  setMesh(fileToLoad) {
    const self = this;
    const base = utils.basename(fileToLoad);
    const loader = utils.createModelLoader(fileToLoad);

    loader.load(fileToLoad, function (object) {
      let geometry = null;
      let computeIndices = false;
      if (object.isGeometry || object.isBufferGeometry) {
        // Geometry or BufferGeometry
        console.log('The object is with type of "Geometry" or "BufferGeometry"');
        geometry = object;
        if (utils.extname(fileToLoad) === '.stl') {
          computeIndices = true;
        }
      } else if (object.isGroup) {
        // merge geometries
        console.log('The object is with type of "THREE.Group"');
        geometry = BufferGeometryUtils.mergeGeometries(
          object.children.map((child) => child.geometry.clone().applyMatrix4(child.matrix))
        );
        computeIndices = !object.children[0].isPoints;
      } else {
        // expect object is THREE.Mesh
        console.log('The object is with type of "THREE.Mesh" or "THREE.Points"');
        geometry = object.geometry;
      }

      // add indices to mesh object if not exist
      if (computeIndices) {
        const nVerts = geometry.getAttribute('position').count;
        const indices = Array.from({ length: nVerts }, (_, k) => k);
        geometry.setIndex(indices);
      }

      // mesh support
      const meshSupport = geometry.index !== null;
      self.params.showMesh = meshSupport;
      self.params.showPoints = !meshSupport;

      // add points
      const sprite = new THREE.TextureLoader().load('three/textures/sprites/disc.png', () => {
        const pointsMaterial = new THREE.PointsMaterial({
          size: 35,
          sizeAttenuation: true,
          map: sprite,
          alphaTest: 0.5,
          transparent: true,
        });
        self.points = new THREE.Points(geometry, pointsMaterial);
        self.points.name = base + '_points';

        try {
          if (geometry.getAttribute('color').count > 0) {
            pointsMaterial.vertexColors = true;
          }
        } catch (e) {
          console.warn(e);
          self.monochrome = true;
        }
        self.scene.add(self.points);

        self.onMeshLoaded();
        self.updateHelpers();
        self.updateRender();
        self.render();
      });

      // add mesh
      try {
        geometry.computeVertexNormals();

        // Mesh
        var material = new THREE.MeshStandardMaterial({
          color: 0xefefef,
          roughness: 0.1,
          flatShading: true,
          side: THREE.DoubleSide,
        });
        self.mesh = new THREE.Mesh(geometry, material);
        self.mesh.castShadow = true;
        self.mesh.receiveShadow = true;
        self.mesh.name = base + '_mesh';
        self.scene.add(self.mesh);

        // Wireframe
        const wireMaterial = new LineMaterial({
          color: self.params.wireframeColor,
          linewidth: 1.0,
        });

        const edges = new WireframeGeometry2(geometry);
        self.wireframe = new Line2(edges, wireMaterial);
        self.wireframe.name = base + '_wireframe';
        self.scene.add(self.wireframe);
      } catch (e) {
        console.error(e);
      }

      self.render();
    });
  }

  onMeshLoaded() {
    // Camera setup
    this.points.geometry.computeBoundingBox();
    const camTarget = utils.getBBoxCenter(this.points.geometry);
    const camPos = utils.autoCameraPos(this.points.geometry);

    this.camera.position.copy(camPos);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target = camTarget;
    this.controls.addEventListener('change', () => this.render());
    this.controls.update();

    // GUI setup
    const extent = utils.getBBoxMaxExtent(this.points.geometry);
    this.params.pointSize = extent / 100.0;
    this.params.pointMaxSize = extent / 10.0;

    this.params.gridHelper.unit = Math.pow(10, Math.floor(Math.log10(extent)));
    this.params.gridHelper.size = this.params.gridHelper.unit * 1000;

    this.gui = new GUI();
    this.gui
      .add(this.params, 'showPoints')
      .name('Points')
      .onChange(() => this.updateRender());
    this.gui
      .add(this.params, 'pointSize')
      .min(0)
      .max(this.params.pointMaxSize)
      .name('Point size')
      .onChange(() => this.updateRender());
    this.gui
      .addColor(this.params, 'pointColor')
      .name('Point color')
      .onChange(() => this.updateRender());
    this.gui
      .add(this.params, 'showWireframe')
      .name('Wireframe')
      .onChange(() => this.updateRender());
    this.gui
      .add(this.params, 'wireframeWidth')
      .min(0)
      .max(1.0)
      .name('Wireframe width')
      .onChange(() => this.updateRender());
    this.gui
      .addColor(this.params, 'wireframeColor')
      .name('Wireframe color')
      .onChange(() => this.updateRender());
    this.gui
      .add(this.params, 'showMesh')
      .name('Mesh')
      .onChange(() => this.updateRender());
    this.gui
      .addColor(this.params, 'backgroundColor')
      .name('Background color')
      .onChange(() => this.updateRender());
    this.gui
      .add(this.params, 'fogDensity')
      .min(0)
      .max(1)
      .name('Fog')
      .onChange(() => this.updateRender());

    let folder = this.gui.addFolder('Grid Helper');
    folder.open();
    folder
      .add(this.params, 'showAxesHelper')
      .name('show axes helper')
      .onChange(() => this.updateHelpers());
    folder
      .add(this.params, 'showGridHelper')
      .name('show grid helper')
      .onChange(() => this.updateHelpers());
    folder
      .add(this.params.gridHelper, 'size')
      .name('size')
      .onChange(() => this.updateHelpers());
    folder
      .add(this.params.gridHelper, 'unit')
      .name('unit')
      .onChange(() => this.updateHelpers());

    if (this.params.hideControlsOnStart) {
      this.gui.close();
    }
  }
}

const viewer = new Viewer();
