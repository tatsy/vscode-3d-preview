import * as THREE from 'three';
import { GUI } from './three/libs/lil-gui.module.min.js';
import { OrbitControls } from './three/controls/OrbitControls.js';
import { LineMaterial } from './three/lines/LineMaterial.js';
import { Line2 } from './three/lines/Line2.js';
import { WireframeGeometry2 } from './three/lines/WireframeGeometry2.js';
import Stats from './three/libs/stats.module.js';
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

    // Initialize customCoordinateSystem if not provided
    if (!this.params.customCoordinateSystem) {
      this.params.customCoordinateSystem = {
        rightAxis: '+x',
        upAxis: '+y',
        forwardAxis: '+z',
      };
    }

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
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  getCoordinateSystemPresets() {
    return {
      opengl: { rightAxis: '+x', upAxis: '+y', forwardAxis: '+z' },
      blender: { rightAxis: '+x', upAxis: '+z', forwardAxis: '-y' },
      unity: { rightAxis: '+x', upAxis: '+y', forwardAxis: '+z' }, // Left-handed in Unity
      unreal: { rightAxis: '+y', upAxis: '+z', forwardAxis: '+x' },
      maya: { rightAxis: '+x', upAxis: '+y', forwardAxis: '+z' },
      '3dsmax': { rightAxis: '+x', upAxis: '+z', forwardAxis: '-y' },
      opencv: { rightAxis: '+x', upAxis: '-y', forwardAxis: '+z' },
      colmap: { rightAxis: '+x', upAxis: '-y', forwardAxis: '+z' },
      nerfstudio: { rightAxis: '+x', upAxis: '+y', forwardAxis: '+z' },
      custom: this.params.customCoordinateSystem,
    };
  }

  getTransformationMatrix(coordinateSystem) {
    const presets = this.getCoordinateSystemPresets();
    const system = presets[coordinateSystem] || presets.opengl;

    // Create transformation matrix to convert from input coordinate system to OpenGL
    const matrix = new THREE.Matrix4();

    // Parse axis definitions
    const parseAxis = (axis) => {
      const sign = axis[0] === '+' ? 1 : -1;
      const component = axis[1];
      return { sign, component };
    };

    const right = parseAxis(system.rightAxis);
    const up = parseAxis(system.upAxis);
    const forward = parseAxis(system.forwardAxis);

    // Build transformation matrix
    // Target: OpenGL coordinate system (+X right, +Y up, +Z forward)
    const elements = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];

    // Map input axes to OpenGL axes
    const axisMap = { x: 0, y: 1, z: 2 };

    // Right axis -> X (column 0)
    elements[axisMap[right.component] * 4 + 0] = right.sign;

    // Up axis -> Y (column 1)
    elements[axisMap[up.component] * 4 + 1] = up.sign;

    // Forward axis -> Z (column 2)
    elements[axisMap[forward.component] * 4 + 2] = forward.sign;

    matrix.set(
      elements[0],
      elements[1],
      elements[2],
      elements[3],
      elements[4],
      elements[5],
      elements[6],
      elements[7],
      elements[8],
      elements[9],
      elements[10],
      elements[11],
      elements[12],
      elements[13],
      elements[14],
      elements[15]
    );

    return matrix;
  }

  applyCoordinateConvention(geometry) {
    const coordinateSystem = this.params.coordinateSystem || 'opengl';

    if (coordinateSystem === 'opengl') {
      return; // No transformation needed for OpenGL (Three.js default)
    }

    const transformMatrix = this.getTransformationMatrix(coordinateSystem);

    // Apply transformation to positions
    const positions = geometry.getAttribute('position');
    if (positions) {
      const positionArray = positions.array;
      const vertex = new THREE.Vector3();

      for (let i = 0; i < positionArray.length; i += 3) {
        vertex.set(positionArray[i], positionArray[i + 1], positionArray[i + 2]);
        vertex.applyMatrix4(transformMatrix);
        positionArray[i] = vertex.x;
        positionArray[i + 1] = vertex.y;
        positionArray[i + 2] = vertex.z;
      }
      positions.needsUpdate = true;
    }

    // Apply transformation to normals
    const normals = geometry.getAttribute('normal');
    if (normals) {
      const normalArray = normals.array;
      const normal = new THREE.Vector3();
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(transformMatrix);

      for (let i = 0; i < normalArray.length; i += 3) {
        normal.set(normalArray[i], normalArray[i + 1], normalArray[i + 2]);
        normal.applyMatrix3(normalMatrix);
        normalArray[i] = normal.x;
        normalArray[i + 1] = normal.y;
        normalArray[i + 2] = normal.z;
      }
      normals.needsUpdate = true;
    }
  }

  showCustomCoordinateControls() {
    if (!this.customCoordControls.folder) {
      this.customCoordControls.folder = this.gui.addFolder('Custom Axes');
      this.customCoordControls.folder.open();

      const axisOptions = ['+x', '-x', '+y', '-y', '+z', '-z'];

      this.customCoordControls.rightAxis = this.customCoordControls.folder
        .add(this.params.customCoordinateSystem, 'rightAxis', axisOptions)
        .name('Right Axis')
        .onChange(() => this.reloadMesh());

      this.customCoordControls.upAxis = this.customCoordControls.folder
        .add(this.params.customCoordinateSystem, 'upAxis', axisOptions)
        .name('Up Axis')
        .onChange(() => this.reloadMesh());

      this.customCoordControls.forwardAxis = this.customCoordControls.folder
        .add(this.params.customCoordinateSystem, 'forwardAxis', axisOptions)
        .name('Forward Axis')
        .onChange(() => this.reloadMesh());
    }
  }

  hideCustomCoordinateControls() {
    if (this.customCoordControls.folder) {
      this.customCoordControls.folder.destroy();
      this.customCoordControls = {};
    }
  }

  reloadMesh() {
    // Clear existing mesh objects
    if (this.points) {
      this.scene.remove(this.points);
    }
    if (this.mesh) {
      this.scene.remove(this.mesh);
    }
    if (this.wireframe) {
      this.scene.remove(this.wireframe);
    }

    // Reload with new coordinate convention
    this.setMesh(this.params.fileToLoad);
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

      // Apply coordinate convention transform
      self.applyCoordinateConvention(geometry);

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
    // Coordinate System controls
    let coordFolder = this.gui.addFolder('Coordinate System');
    coordFolder.open();

    const coordinateSystemOptions = [
      'opengl',
      'blender',
      'unity',
      'unreal',
      'maya',
      '3dsmax',
      'opencv',
      'colmap',
      'nerfstudio',
      'custom',
    ];

    coordFolder
      .add(this.params, 'coordinateSystem', coordinateSystemOptions)
      .name('Preset')
      .onChange(() => {
        if (this.params.coordinateSystem === 'custom') {
          this.showCustomCoordinateControls();
        } else {
          this.hideCustomCoordinateControls();
        }
        this.reloadMesh();
      });

    // Custom coordinate system controls (initially hidden)
    this.customCoordControls = {};
    if (this.params.coordinateSystem === 'custom') {
      this.showCustomCoordinateControls();
    }

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

// Handle messages from VS Code
window.addEventListener('message', (event) => {
  const message = event.data;
  switch (message.type) {
    case 'modelRefresh':
      viewer.reloadMesh();
      break;
  }
});
