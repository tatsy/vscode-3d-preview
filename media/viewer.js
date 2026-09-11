import * as THREE from 'three';
import { GUI } from './three/libs/lil-gui.module.min.js';
import { OrbitControls } from './three/controls/OrbitControls.js';
import { TrackballControls } from './three/controls/TrackballControls.js';
import { LineMaterial } from './three/lines/LineMaterial.js';
import { Line2 } from './three/lines/Line2.js';
import { WireframeGeometry2 } from './three/lines/WireframeGeometry2.js';
import Stats from './three/libs/stats.module.js';
import * as BufferGeometryUtils from './three/utils/BufferGeometryUtils.js';
import * as utils from './utils.js';

// Largest on-screen point size (in pixels) when size attenuation is disabled.
// The point size slider is mapped onto [0, MAX_POINT_PIXEL_SIZE] in that mode.
const MAX_POINT_PIXEL_SIZE = 30;

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

    // Stats
    this.stats = new Stats();
    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);

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

    // Key light attached to the camera, so that it follows the view direction and
    // vertical surfaces stay shaded no matter how the model is rotated.
    // Position is camera-local: slightly above and to the right of the viewpoint.
    this.cameraLight = new THREE.DirectionalLight(0xffffff, this.params.lightIntensity);
    this.cameraLight.position.set(0.5, 1.0, 1.0);
    this.camera.add(this.cameraLight);
    this.camera.add(this.cameraLight.target); // target at the camera origin
    this.scene.add(this.camera);

    // check extension
    this.setMesh(this.params.fileToLoad);
  }

  mainloop() {
    this.stats.begin();
    requestAnimationFrame(this.mainloop.bind(this));
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
    this.stats.end();
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
  }

  updateRender() {
    // Fog
    this.scene.fog = new THREE.FogExp2(this.params.backgroundColor, this.params.fogDensity);
    this.scene.background = new THREE.Color(this.params.backgroundColor);

    // Light
    this.cameraLight.intensity = this.params.lightIntensity;

    // Points
    if (this.points.material.sizeAttenuation !== this.params.pointSizeAttenuation) {
      // sizeAttenuation is a shader define, so the material must be recompiled.
      this.points.material.sizeAttenuation = this.params.pointSizeAttenuation;
      this.points.material.needsUpdate = true;
    }

    if (!this.params.showPoints) {
      this.points.material.size = 0;
    } else if (this.params.pointSizeAttenuation) {
      // World-space size: points shrink with distance.
      this.points.material.size = this.params.pointSize;
    } else {
      // Screen-space size: points stay visible at any distance.
      this.points.material.size =
        (this.params.pointSize / this.params.pointMaxSize) * MAX_POINT_PIXEL_SIZE;
    }

    if (this.monochrome) {
      this.points.material.color = new THREE.Color(this.params.pointColor);
    }

    // Mesh
    if (this.mesh) {
      if (this.mesh.material.flatShading != this.params.flatShading) {
        this.mesh.material.flatShading = this.params.flatShading;
        this.mesh.needsUpdate = true;
      }

      this.scene.remove(this.mesh);
      if (this.params.showMesh) {
        this.scene.add(this.mesh);
      }
    }

    // Wireframe
    if (this.wireframe) {
      this.wireframe.material.color = new THREE.Color(this.params.wireframeColor);
      this.wireframe.material.linewidth = this.params.wireframeWidth;

      this.scene.remove(this.wireframe);
      if (this.params.showWireframe) {
        this.scene.add(this.wireframe);
      }
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.controls && typeof this.controls.handleResize === 'function') {
      this.controls.handleResize();
    }
  }

  setupControls() {
    const target =
      this.controls !== undefined
        ? this.controls.target.clone()
        : utils.getBBoxCenter(this.points.geometry);

    if (this.controls !== undefined) {
      this.controls.dispose();
    }

    if (this.params.cameraControls === 'orbit') {
      // OrbitControls keeps the camera upright and clamps the polar angle,
      // so the model cannot be rotated over the poles.
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    } else {
      // TrackballControls allows free rotation in any direction.
      this.controls = new TrackballControls(this.camera, this.renderer.domElement);
      this.controls.rotateSpeed = 2.0;
      this.controls.zoomSpeed = 1.2;
      this.controls.panSpeed = 0.8;
    }
    this.controls.target.copy(target);
    this.controls.update();
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
          object.children.map((child) => {
            const g = child.geometry.clone().applyMatrix4(child.matrix);
            g.deleteAttribute('normal');
            g.deleteAttribute('uv');
            return g;
          })
        );

        if (!object.children[0].isPoints) {
          const tolerance = utils.getBBoxMaxExtent(geometry) * 1e-6;
          geometry = BufferGeometryUtils.mergeVertices(geometry, tolerance);
        }
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
        self.mainloop();
      });

      // add mesh
      try {
        geometry.computeVertexNormals();

        // Mesh
        var material = new THREE.MeshStandardMaterial({
          color: 0xefefef,
          roughness: 0.25,
          flatShading: self.params.flatShading,
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
    });
  }

  onMeshLoaded() {
    // Camera setup
    this.points.geometry.computeBoundingBox();
    const camTarget = utils.getBBoxCenter(this.points.geometry);
    const camPos = utils.autoCameraPos(this.points.geometry);

    this.camera.position.copy(camPos);
    this.camera.lookAt(camTarget);
    this.setupControls();
    window.addEventListener('resize', () => this.onWindowResize());

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
      .add(this.params, 'pointSizeAttenuation')
      .name('Point size attenuation')
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
      .add(this.params, 'flatShading')
      .name('Flat shading')
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
    this.gui
      .add(this.params, 'lightIntensity')
      .min(0)
      .max(5)
      .name('Light intensity')
      .onChange(() => this.updateRender());
    this.gui
      .add(this.params, 'cameraControls', { Trackball: 'trackball', Orbit: 'orbit' })
      .name('Camera controls')
      .onChange(() => this.setupControls());

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
